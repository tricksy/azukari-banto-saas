'use client';

import { useState } from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

/**
 * ページネーションコンポーネント
 *
 * WHY: 一覧ページで大量のデータを効率的に表示するため
 * WHAT: ページ切り替えUI（前へ/次へ、ページ番号、表示件数）
 * HOW: 現在のページ周辺と最初/最後のページ番号を表示、省略は「...」
 */
export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // 表示するページ番号を計算
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];

    for (let i = 1; i <= totalPages; i++) {
      // 最初、最後、現在のページ周辺を表示
      if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== 'ellipsis') {
        pages.push('ellipsis');
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-ginnezumi">
        {totalItems}件中 {startItem}-{endItem}件を表示
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 text-sm border border-kinari cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:bg-kinari/50 transition-colors"
        >
          前へ
        </button>
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, idx) => (
            page === 'ellipsis' ? (
              <span key={`ellipsis-${idx}`} className="px-1 text-ginnezumi">...</span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-8 h-8 text-sm cursor-pointer ${
                  page === currentPage
                    ? 'bg-shu text-white'
                    : 'border border-kinari hover:bg-kinari/50'
                } transition-colors`}
              >
                {page}
              </button>
            )
          ))}
        </div>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 text-sm border border-kinari cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:bg-kinari/50 transition-colors"
        >
          次へ
        </button>
      </div>
    </div>
  );
}

/**
 * ページネーションのカスタムフック
 *
 * @param items 全アイテム配列
 * @param itemsPerPage 1ページあたりの表示件数
 */
export function usePagination<T>(items: T[], itemsPerPage: number = 20) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const paginatedItems = items.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const resetPage = () => setCurrentPage(1);

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedItems,
    totalItems: items.length,
    itemsPerPage,
    resetPage,
  };
}
