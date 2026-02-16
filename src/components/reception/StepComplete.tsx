'use client';

// ============================================
// Types
// ============================================

interface StepCompleteProps {
  receptionNumber: string;
  itemNumbers: string[];
  customerName?: string;
  onNewReception: () => void;
  onGoToDashboard: () => void;
}

// ============================================
// Component
// ============================================

export function StepComplete({
  receptionNumber,
  itemNumbers,
  customerName,
  onNewReception,
  onGoToDashboard,
}: StepCompleteProps) {
  return (
    <div className="card">
      <div className="card-body text-center py-8">
        {/* Success icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-oitake/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-oitake"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="square"
                strokeLinejoin="miter"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Success message */}
        <h3 className="text-xl font-mincho text-sumi mb-2">
          受付が完了しました
        </h3>

        {customerName && (
          <p className="text-sm text-aitetsu mb-6">
            顧客: {customerName}
          </p>
        )}

        {/* Reception number */}
        <div className="mb-6">
          <p className="text-xs text-ginnezumi mb-1">受付番号</p>
          <p className="text-2xl font-mono text-sumi tracking-wider">
            {receptionNumber}
          </p>
        </div>

        {/* Item numbers */}
        <div className="mb-8">
          <p className="text-xs text-ginnezumi mb-2">預かり番号</p>
          <div className="space-y-1">
            {itemNumbers.map((num) => (
              <p key={num} className="text-sm font-mono text-aitetsu">
                {num}
              </p>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-3">
          <button className="btn-secondary" onClick={onNewReception}>
            続けて登録
          </button>
          <button className="btn-primary" onClick={onGoToDashboard}>
            ダッシュボードへ
          </button>
        </div>
      </div>
    </div>
  );
}
