'use client';

import Link from 'next/link';

export function PrintActions() {
  return (
    <div className="flex items-center gap-4 p-4 print:hidden">
      <button
        onClick={() => window.print()}
        className="btn-primary btn-sm"
      >
        印刷
      </button>
      <Link
        href="/orders"
        className="text-sm text-aitetsu hover:text-shu transition-colors"
      >
        戻る
      </Link>
    </div>
  );
}
