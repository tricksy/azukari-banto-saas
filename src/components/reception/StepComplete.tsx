'use client';

// ============================================
// Types
// ============================================

interface StepCompleteProps {
  receptionNumber: string;
  itemNumbers: string[];
  itemProductNames: string[];
  onNewReception: () => void;
  onGoToDashboard: () => void;
}

// ============================================
// Component
// ============================================

export function StepComplete({
  receptionNumber,
  itemNumbers,
  itemProductNames,
  onNewReception,
  onGoToDashboard,
}: StepCompleteProps) {
  return (
    <div className="card">
      <div className="card-body text-center py-8">
        {/* Success icon */}
        <div className="text-4xl mb-4">✓</div>

        {/* Title */}
        <h2 className="text-xl font-mincho mb-4">登録完了</h2>

        {/* Reception number */}
        <p className="text-ginnezumi mb-6">
          受付番号: <span className="font-mono font-bold">{receptionNumber}</span>
        </p>

        {/* Item numbers */}
        <div className="bg-shironeri p-4 mb-6 text-left">
          <h3 className="text-sm text-ginnezumi mb-2">預かり番号</h3>
          <ul className="space-y-1">
            {itemNumbers.map((num, index) => (
              <li key={num} className="font-mono text-sm">
                {num} - {itemProductNames[index] || ''}
              </li>
            ))}
          </ul>
        </div>

        {/* Processing order print button */}
        <button
          onClick={() => window.open(`/print/processing-order/${receptionNumber}`, '_blank')}
          className="btn-outline w-full"
        >
          加工指示書を出力
        </button>
      </div>

      {/* Action buttons (bottom fixed) */}
      <div className="fixed bottom-0 left-0 right-0 bg-gofun border-t border-usuzumi/20 p-4">
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={onGoToDashboard}>
            ダッシュボードへ
          </button>
          <button className="btn-primary flex-1" onClick={onNewReception}>
            続けて登録
          </button>
        </div>
      </div>
    </div>
  );
}
