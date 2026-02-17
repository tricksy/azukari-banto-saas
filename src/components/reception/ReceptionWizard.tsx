'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StepPhoto } from './StepPhoto';
import { StepItemDetails } from './StepItemDetails';
import { StepCustomer } from './StepCustomer';
import { StepAddMore } from './StepAddMore';
import { StepConfirm } from './StepConfirm';
import { StepComplete } from './StepComplete';
import { getJSTTimestamp } from '@/lib/date';
import { uploadItemPhotos } from '@/lib/upload-photo';

// ============================================
// Types
// ============================================

export interface WizardItem {
  // Photo data
  photoFrontUrl?: string;
  photoBackUrl?: string;
  photoFrontMemo?: string;
  photoBackMemo?: string;
  photoFrontBlob?: Blob;
  photoFrontMimeType?: string;
  photoBackBlob?: Blob;
  photoBackMimeType?: string;
  additionalPhotos: Array<{ url: string; memo?: string; blob?: Blob; mimeType?: string }>;
  // Item details
  productType: string;
  productName: string;
  color?: string;
  material?: string;
  size?: string;
  conditionNote?: string;
  requestType?: string;
  requestDetail?: string;
  scheduledShipDate?: string;
  isPaidStorage?: boolean;
}

export interface WizardState {
  step: 'photo' | 'itemDetails' | 'customer' | 'addMore' | 'confirm' | 'complete';
  items: WizardItem[];
  currentItemIndex: number;
  // Customer data (shared across all items)
  customerId?: string;
  customerName?: string;
  customerNameKana?: string;
  partnerId?: string;
  partnerName?: string;
  // Result
  receptionNumber?: string;
  itemNumbers?: string[];
}

// ============================================
// Helpers
// ============================================

function createEmptyItem(): WizardItem {
  return {
    additionalPhotos: [],
    productType: '',
    productName: '',
  };
}

const STEP_LABELS = [
  { key: 'photo', label: '写真撮影' },
  { key: 'itemDetails', label: '商品情報' },
  { key: 'customer', label: '顧客選択' },
  { key: 'addMore', label: '追加確認' },
  { key: 'confirm', label: '確認' },
  { key: 'complete', label: '完了' },
] as const;

function getStepNumber(step: WizardState['step']): number {
  const index = STEP_LABELS.findIndex((s) => s.key === step);
  return index + 1;
}

// ============================================
// Step Indicator
// ============================================

function StepIndicator({ currentStep }: { currentStep: WizardState['step'] }) {
  const currentNumber = getStepNumber(currentStep);

  return (
    <nav aria-label="受付ステップ" className="mb-8">
      <ol className="flex items-center justify-between">
        {STEP_LABELS.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentNumber;
          const isCompleted = stepNumber < currentNumber;

          return (
            <li key={step.key} className="flex items-center flex-1 last:flex-0">
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-8 h-8 flex items-center justify-center text-sm font-mono
                    border
                    ${isActive
                      ? 'bg-shu text-white border-shu'
                      : isCompleted
                        ? 'bg-shu/10 text-shu border-shu/30'
                        : 'bg-shironeri text-ginnezumi border-usuzumi/20'
                    }
                  `}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="square" strokeLinejoin="miter" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </div>
                <span
                  className={`
                    text-xs mt-1 whitespace-nowrap
                    ${isActive ? 'text-shu font-medium' : isCompleted ? 'text-aitetsu' : 'text-ginnezumi'}
                  `}
                >
                  {step.label}
                </span>
              </div>
              {index < STEP_LABELS.length - 1 && (
                <div
                  className={`
                    flex-1 h-px mx-2 mt-[-1rem]
                    ${stepNumber < currentNumber ? 'bg-shu/30' : 'bg-usuzumi/20'}
                  `}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ============================================
// Wizard Component
// ============================================

interface ReceptionWizardProps {
  workerId: string;
}

export function ReceptionWizard({ workerId }: ReceptionWizardProps) {
  const router = useRouter();

  const [state, setState] = useState<WizardState>({
    step: 'photo',
    items: [createEmptyItem()],
    currentItemIndex: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // --- Item update ---

  const updateCurrentItem = useCallback((updatedItem: WizardItem) => {
    setState((prev) => {
      const newItems = [...prev.items];
      newItems[prev.currentItemIndex] = updatedItem;
      return { ...prev, items: newItems };
    });
  }, []);

  // --- Photo update ---

  const handlePhotoUpdate = useCallback((photos: {
    photoFrontUrl?: string;
    photoBackUrl?: string;
    photoFrontMemo?: string;
    photoBackMemo?: string;
    photoFrontBlob?: Blob;
    photoFrontMimeType?: string;
    photoBackBlob?: Blob;
    photoBackMimeType?: string;
    additionalPhotos: Array<{ url: string; memo?: string; blob?: Blob; mimeType?: string }>;
  }) => {
    setState((prev) => {
      const newItems = [...prev.items];
      const currentItem = { ...newItems[prev.currentItemIndex] };
      currentItem.photoFrontUrl = photos.photoFrontUrl;
      currentItem.photoBackUrl = photos.photoBackUrl;
      currentItem.photoFrontMemo = photos.photoFrontMemo;
      currentItem.photoBackMemo = photos.photoBackMemo;
      currentItem.photoFrontBlob = photos.photoFrontBlob;
      currentItem.photoFrontMimeType = photos.photoFrontMimeType;
      currentItem.photoBackBlob = photos.photoBackBlob;
      currentItem.photoBackMimeType = photos.photoBackMimeType;
      currentItem.additionalPhotos = photos.additionalPhotos;
      newItems[prev.currentItemIndex] = currentItem;
      return { ...prev, items: newItems };
    });
  }, []);

  // --- Customer update ---

  const handleCustomerUpdate = useCallback((data: {
    customerId: string;
    customerName: string;
    customerNameKana?: string;
    partnerId?: string;
    partnerName?: string;
  }) => {
    setState((prev) => ({
      ...prev,
      customerId: data.customerId,
      customerName: data.customerName,
      customerNameKana: data.customerNameKana,
      partnerId: data.partnerId,
      partnerName: data.partnerName,
    }));
  }, []);

  // --- Step navigation ---

  const goToStep = useCallback((step: WizardState['step']) => {
    setState((prev) => ({ ...prev, step }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handlePhotoNext = useCallback(() => {
    goToStep('itemDetails');
  }, [goToStep]);

  const handlePhotoBack = useCallback(() => {
    // If this is first item, no back
    // If subsequent item, go back to addMore
    if (state.currentItemIndex > 0) {
      goToStep('addMore');
    }
  }, [state.currentItemIndex, goToStep]);

  const handleItemDetailsNext = useCallback(() => {
    // If first item and no customer selected yet, go to customer step
    if (state.currentItemIndex === 0 && !state.customerId) {
      goToStep('customer');
    } else {
      goToStep('addMore');
    }
  }, [state.currentItemIndex, state.customerId, goToStep]);

  const handleItemDetailsBack = useCallback(() => {
    goToStep('photo');
  }, [goToStep]);

  const handleCustomerNext = useCallback(() => {
    goToStep('addMore');
  }, [goToStep]);

  const handleCustomerBack = useCallback(() => {
    goToStep('itemDetails');
  }, [goToStep]);

  const handleSkipCustomer = useCallback(() => {
    // Skip customer selection - will save as draft
    goToStep('addMore');
  }, [goToStep]);

  const handleAddMore = useCallback(() => {
    setState((prev) => {
      const newIndex = prev.items.length;
      return {
        ...prev,
        step: 'photo',
        items: [...prev.items, createEmptyItem()],
        currentItemIndex: newIndex,
      };
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleFinishAdding = useCallback(() => {
    goToStep('confirm');
  }, [goToStep]);

  const handleAddMoreBack = useCallback(() => {
    goToStep('itemDetails');
  }, [goToStep]);

  const handleConfirmBack = useCallback(() => {
    goToStep('addMore');
  }, [goToStep]);

  const handleConfirmSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      // Generate item numbers client-side
      const timestamp = getJSTTimestamp();
      const itemNumbers = state.items.map((_, index) =>
        `${workerId}-${timestamp}-${String(index + 1).padStart(2, '0')}`
      );

      // Upload all photos to R2 in parallel
      const uploadResults = await Promise.all(
        state.items.map((item, index) =>
          uploadItemPhotos(itemNumbers[index], {
            frontBlob: item.photoFrontBlob,
            frontMimeType: item.photoFrontMimeType,
            backBlob: item.photoBackBlob,
            backMimeType: item.photoBackMimeType,
            additionalBlobs: item.additionalPhotos
              .filter((p) => p.blob)
              .map((p) => ({ blob: p.blob!, mimeType: p.mimeType })),
          })
        )
      );

      const apiItems = state.items.map((item, index) => ({
        item_number: itemNumbers[index],
        product_type: item.productType,
        product_name: item.productName,
        color: item.color || undefined,
        material: item.material || undefined,
        size: item.size || undefined,
        condition_note: item.conditionNote || undefined,
        request_type: item.requestType || undefined,
        request_detail: item.requestDetail || undefined,
        scheduled_ship_date: item.scheduledShipDate || undefined,
        is_paid_storage: item.isPaidStorage || false,
        photo_front_url: uploadResults[index].frontUrl || item.photoFrontUrl || undefined,
        photo_back_url: uploadResults[index].backUrl || item.photoBackUrl || undefined,
        photo_front_memo: item.photoFrontMemo || undefined,
        photo_back_memo: item.photoBackMemo || undefined,
        additional_photos: uploadResults[index].additionalUrls
          ? uploadResults[index].additionalUrls!.map((url, i) => ({
              url,
              memo: item.additionalPhotos[i]?.memo,
            }))
          : item.additionalPhotos.length > 0
            ? item.additionalPhotos.map((p) => ({ url: p.url, memo: p.memo }))
            : undefined,
      }));

      let receptionNumber: string;

      if (state.customerId) {
        // Customer selected: full registration
        const res = await fetch('/api/receptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: apiItems,
            customer_id: state.customerId,
            customer_name: state.customerName,
            partner_id: state.partnerId || undefined,
            partner_name: state.partnerName || undefined,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || '受付の登録に失敗しました');
        }

        const data = await res.json();
        receptionNumber = data.reception.reception_number;
      } else {
        // No customer: save as draft
        const res = await fetch('/api/receptions/draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: apiItems }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || '下書きの保存に失敗しました');
        }

        const data = await res.json();
        receptionNumber = data.reception.reception_number;
      }

      setState((prev) => ({
        ...prev,
        step: 'complete',
        receptionNumber,
        itemNumbers,
      }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : '登録に失敗しました'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [state.items, state.customerId, state.customerName, state.partnerId, state.partnerName, workerId]);

  const handleNewReception = useCallback(() => {
    setState({
      step: 'photo',
      items: [createEmptyItem()],
      currentItemIndex: 0,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleGoToDashboard = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  // --- Cleanup blob URLs ---

  useEffect(() => {
    return () => {
      // Clean up blob: URLs on unmount
      state.items.forEach((item) => {
        if (item.photoFrontUrl?.startsWith('blob:')) URL.revokeObjectURL(item.photoFrontUrl);
        if (item.photoBackUrl?.startsWith('blob:')) URL.revokeObjectURL(item.photoBackUrl);
        item.additionalPhotos.forEach((p) => {
          if (p.url?.startsWith('blob:')) URL.revokeObjectURL(p.url);
        });
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Render ---

  return (
    <div>
      <StepIndicator currentStep={state.step} />

      {state.step === 'photo' && (() => {
        const currentItem = state.items[state.currentItemIndex];
        return (
          <StepPhoto
            photoFrontUrl={currentItem.photoFrontUrl}
            photoBackUrl={currentItem.photoBackUrl}
            photoFrontMemo={currentItem.photoFrontMemo}
            photoBackMemo={currentItem.photoBackMemo}
            photoFrontBlob={currentItem.photoFrontBlob}
            photoFrontMimeType={currentItem.photoFrontMimeType}
            photoBackBlob={currentItem.photoBackBlob}
            photoBackMimeType={currentItem.photoBackMimeType}
            additionalPhotos={currentItem.additionalPhotos}
            onUpdate={handlePhotoUpdate}
            onNext={handlePhotoNext}
            onBack={state.currentItemIndex > 0 ? handlePhotoBack : undefined}
            itemIndex={state.currentItemIndex}
            customerName={state.customerName}
          />
        );
      })()}

      {state.step === 'itemDetails' && (
        <StepItemDetails
          item={state.items[state.currentItemIndex]}
          onUpdate={updateCurrentItem}
          onNext={handleItemDetailsNext}
          onBack={handleItemDetailsBack}
          itemIndex={state.currentItemIndex}
        />
      )}

      {state.step === 'customer' && (
        <StepCustomer
          customerId={state.customerId}
          customerName={state.customerName}
          customerNameKana={state.customerNameKana}
          partnerId={state.partnerId}
          partnerName={state.partnerName}
          onUpdate={handleCustomerUpdate}
          onNext={handleCustomerNext}
          onBack={handleCustomerBack}
          onSkip={handleSkipCustomer}
        />
      )}

      {state.step === 'addMore' && (
        <StepAddMore
          items={state.items}
          customerName={state.customerName}
          onAddMore={handleAddMore}
          onFinish={handleFinishAdding}
          onBack={handleAddMoreBack}
        />
      )}

      {state.step === 'confirm' && (
        <>
          {submitError && (
            <div className="card mb-4 border-kokiake/30">
              <div className="card-body">
                <p className="text-sm text-kokiake">{submitError}</p>
              </div>
            </div>
          )}
          <StepConfirm
            items={state.items}
            customerName={state.customerName}
            partnerName={state.partnerName}
            onConfirm={handleConfirmSubmit}
            onBack={handleConfirmBack}
            isSubmitting={isSubmitting}
          />
        </>
      )}

      {state.step === 'complete' && state.receptionNumber && state.itemNumbers && (
        <StepComplete
          receptionNumber={state.receptionNumber}
          itemNumbers={state.itemNumbers}
          customerName={state.customerName}
          onNewReception={handleNewReception}
          onGoToDashboard={handleGoToDashboard}
        />
      )}
    </div>
  );
}
