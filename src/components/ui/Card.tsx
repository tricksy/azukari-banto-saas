import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

/**
 * カードコンポーネント
 */
export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`card ${className}`}>
      {children}
    </div>
  );
}

/**
 * カードヘッダー
 */
export function CardHeader({ children, className = '' }: CardProps) {
  return (
    <div className={`card-header ${className}`}>
      {children}
    </div>
  );
}

/**
 * カードボディ
 */
export function CardBody({ children, className = '' }: CardProps) {
  return (
    <div className={`card-body ${className}`}>
      {children}
    </div>
  );
}
