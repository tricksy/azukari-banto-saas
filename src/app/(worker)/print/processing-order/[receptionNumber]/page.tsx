/* eslint-disable @next/next/no-img-element */
import { getSession } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProcessingTypeLabel, ProductTypeLabel } from '@/types';
import { PrintActions } from './PrintActions';

interface PageProps {
  params: Promise<{ receptionNumber: string }>;
  searchParams: Promise<{ vendorId?: string; itemNumbers?: string }>;
}

interface ReceptionRow {
  id: string;
  reception_number: string;
  customer_name: string | null;
  partner_name: string | null;
  received_date: string | null;
}

interface ItemRow {
  item_number: string;
  product_type: string;
  product_name: string;
  color: string | null;
  material: string | null;
  size: string | null;
  condition_note: string | null;
  request_type: string | null;
  request_detail: string | null;
  status: string;
  photo_front_url: string | null;
  photo_back_url: string | null;
  customer_name: string | null;
  partner_name: string | null;
  reception_id: string;
}

interface VendorRow {
  name: string;
  postal_code: string | null;
  address: string | null;
  phone: string | null;
}

export default async function ProcessingOrderPage({ params, searchParams }: PageProps) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { receptionNumber } = await params;
  const { vendorId, itemNumbers } = await searchParams;

  const supabase = createServiceClient();

  let items: ItemRow[] = [];
  let reception: ReceptionRow | null = null;

  if (receptionNumber === 'selected' && itemNumbers) {
    // "selected" mode: fetch specific items by item_number
    const numbers = itemNumbers.split(',').map((n) => n.trim()).filter(Boolean);
    if (numbers.length === 0) {
      return (
        <div className="p-8 font-mincho text-sumi">
          <p>印刷対象の商品が指定されていません。</p>
          <PrintActions />
        </div>
      );
    }

    const { data: fetchedItems } = await supabase
      .from('items')
      .select('item_number, product_type, product_name, color, material, size, condition_note, request_type, request_detail, status, photo_front_url, photo_back_url, customer_name, partner_name, reception_id')
      .eq('tenant_id', session.tenantId)
      .in('item_number', numbers);

    items = (fetchedItems as ItemRow[]) || [];

    // Fetch reception from the first item's reception_id
    if (items.length > 0) {
      const { data: fetchedReception } = await supabase
        .from('receptions')
        .select('id, reception_number, customer_name, partner_name, received_date')
        .eq('id', items[0].reception_id)
        .single();

      reception = fetchedReception as ReceptionRow | null;
    }
  } else {
    // Normal mode: fetch reception by reception_number, then its items
    const { data: fetchedReception } = await supabase
      .from('receptions')
      .select('id, reception_number, customer_name, partner_name, received_date')
      .eq('tenant_id', session.tenantId)
      .eq('reception_number', receptionNumber)
      .single();

    reception = fetchedReception as ReceptionRow | null;

    if (!reception) {
      return (
        <div className="p-8 font-mincho text-sumi">
          <p>受付番号「{receptionNumber}」が見つかりません。</p>
          <PrintActions />
        </div>
      );
    }

    const { data: fetchedItems } = await supabase
      .from('items')
      .select('item_number, product_type, product_name, color, material, size, condition_note, request_type, request_detail, status, photo_front_url, photo_back_url, customer_name, partner_name, reception_id')
      .eq('tenant_id', session.tenantId)
      .eq('reception_id', reception.id);

    items = (fetchedItems as ItemRow[]) || [];
  }

  // Fetch vendor info if vendorId is provided
  let vendor: VendorRow | null = null;
  if (vendorId) {
    const { data: fetchedVendor } = await supabase
      .from('vendors')
      .select('name, postal_code, address, phone')
      .eq('id', vendorId)
      .single();

    vendor = fetchedVendor as VendorRow | null;
  }

  if (items.length === 0) {
    return (
      <div className="p-8 font-mincho text-sumi">
        <p>印刷対象の商品がありません。</p>
        <PrintActions />
      </div>
    );
  }

  const totalPages = items.length;

  return (
    <div className="font-mincho text-sumi bg-white">
      {/* Print-specific styles */}
      <style>{`
        @media print {
          @page { margin: 8mm; size: A4; }
          body { background: white !important; }
          .print-layout { background: white !important; }
          /* Hide worker layout header and reset background for print */
          header { display: none !important; }
          .min-h-screen { min-height: auto !important; background: white !important; }
        }
      `}</style>

      <PrintActions />

      {items.map((item, index) => {
        const isRework = item.status === 'rework';
        const title = isRework ? '再加工指示書' : '加工指示書';
        const productTypeLabel = ProductTypeLabel[item.product_type] || item.product_type;
        const requestTypeLabel = item.request_type
          ? (ProcessingTypeLabel[item.request_type] || item.request_type)
          : null;

        return (
          <div
            key={item.item_number}
            className={`max-w-[210mm] mx-auto bg-white p-6 ${
              index < totalPages - 1 ? 'mb-4' : ''
            }`}
            style={{
              pageBreakAfter: index < totalPages - 1 ? 'always' : 'auto',
            }}
          >
            {/* Header row */}
            <div className="flex items-center justify-between border-b border-usuzumi/30 pb-3 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 border border-usuzumi/30 flex items-center justify-center text-ginnezumi text-xs">
                  印
                </div>
                <h1 className="text-2xl font-bold tracking-wider">{title}</h1>
              </div>
              <div className="text-sm text-ginnezumi">
                {index + 1}/{totalPages} ページ
              </div>
            </div>

            {/* Item number */}
            <div className="border border-usuzumi/30 p-3 mb-4">
              <div className="text-xs text-aitetsu mb-1">預かり番号</div>
              <div className="font-mono text-lg tracking-wide">{item.item_number}</div>
            </div>

            {/* Customer info */}
            <div className="border border-usuzumi/30 p-3 mb-4">
              <div className="text-xs text-aitetsu font-bold mb-2">顧客情報</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {(item.partner_name || reception?.partner_name) && (
                  <div>
                    <span className="text-ginnezumi">取引先: </span>
                    <span>{item.partner_name || reception?.partner_name}</span>
                  </div>
                )}
                <div>
                  <span className="text-ginnezumi">顧客: </span>
                  <span>{item.customer_name || reception?.customer_name || '未設定'}</span>
                </div>
                {reception?.received_date && (
                  <div>
                    <span className="text-ginnezumi">受付日: </span>
                    <span>{reception.received_date}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Vendor info (only when vendorId specified) */}
            {vendor && (
              <div className="border border-usuzumi/30 p-3 mb-4">
                <div className="text-xs text-aitetsu font-bold mb-2">依頼先（業者情報）</div>
                <div className="text-sm space-y-1">
                  <div className="font-bold">{vendor.name}</div>
                  {(vendor.postal_code || vendor.address) && (
                    <div className="text-ginnezumi">
                      {vendor.postal_code && <span>〒{vendor.postal_code} </span>}
                      {vendor.address}
                    </div>
                  )}
                  {vendor.phone && (
                    <div className="text-ginnezumi">TEL: {vendor.phone}</div>
                  )}
                </div>
              </div>
            )}

            {/* Product info */}
            <div className="border border-usuzumi/30 p-3 mb-4">
              <div className="text-xs text-aitetsu font-bold mb-2">商品情報</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <div>
                  <span className="text-ginnezumi">種別: </span>
                  <span>{productTypeLabel}</span>
                </div>
                <div>
                  <span className="text-ginnezumi">商品名: </span>
                  <span>{item.product_name}</span>
                </div>
                {item.color && (
                  <div>
                    <span className="text-ginnezumi">色柄: </span>
                    <span>{item.color}</span>
                  </div>
                )}
                {item.material && (
                  <div>
                    <span className="text-ginnezumi">素材: </span>
                    <span>{item.material}</span>
                  </div>
                )}
                {item.size && (
                  <div>
                    <span className="text-ginnezumi">サイズ: </span>
                    <span>{item.size}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Processing request */}
            {(requestTypeLabel || item.request_detail) && (
              <div className="border border-usuzumi/30 p-3 mb-4">
                <div className="text-xs text-aitetsu font-bold mb-2">加工依頼</div>
                <div className="text-sm space-y-1">
                  {requestTypeLabel && (
                    <div>
                      <span className="text-ginnezumi">依頼種別: </span>
                      <span>{requestTypeLabel}</span>
                    </div>
                  )}
                  {item.request_detail && (
                    <div>
                      <span className="text-ginnezumi">依頼詳細: </span>
                      <span>{item.request_detail}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Condition note (yellow background) */}
            {item.condition_note && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 mb-4">
                <div className="text-xs text-aitetsu font-bold mb-1">状態メモ</div>
                <div className="text-sm whitespace-pre-wrap">{item.condition_note}</div>
              </div>
            )}

            {/* Photos */}
            {(item.photo_front_url || item.photo_back_url) && (
              <div className="border border-usuzumi/30 p-3">
                <div className="text-xs text-aitetsu font-bold mb-2">写真</div>
                <div className="flex gap-4">
                  {item.photo_front_url && (
                    <div className="flex-1">
                      <div className="text-xs text-ginnezumi mb-1">表面</div>
                      <img
                        src={item.photo_front_url}
                        alt="表面写真"
                        className="w-full object-contain border border-usuzumi/20"
                        style={{ maxHeight: '75mm' }}
                      />
                    </div>
                  )}
                  {item.photo_back_url && (
                    <div className="flex-1">
                      <div className="text-xs text-ginnezumi mb-1">裏面</div>
                      <img
                        src={item.photo_back_url}
                        alt="裏面写真"
                        className="w-full object-contain border border-usuzumi/20"
                        style={{ maxHeight: '75mm' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
