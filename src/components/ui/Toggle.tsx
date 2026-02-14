'use client';

import { useId } from 'react';

interface ToggleProps {
  /** トグルの状態 */
  checked: boolean;
  /** 状態変更コールバック */
  onChange: (checked: boolean) => void;
  /** ラベルテキスト */
  label: string;
  /** 説明テキスト（オプション） */
  description?: string;
  /** 無効化 */
  disabled?: boolean;
}

/**
 * アクセシブルなトグルスイッチコンポーネント
 *
 * - 適切なlabel/input関連付け
 * - aria属性による状態通知
 * - キーボード操作対応
 */
export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: ToggleProps) {
  const id = useId();
  const descriptionId = description ? `${id}-description` : undefined;

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 min-w-0 mr-4">
        <label
          htmlFor={id}
          className={`font-medium cursor-pointer ${disabled ? 'text-ginnezumi' : ''}`}
        >
          {label}
        </label>
        {description && (
          <p
            id={descriptionId}
            className="text-sm text-aitetsu mt-0.5"
          >
            {description}
          </p>
        )}
      </div>
      <div className="flex-shrink-0">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          aria-describedby={descriptionId}
          className="sr-only peer"
        />
        <label
          htmlFor={id}
          className={`
            relative inline-block w-11 h-6 cursor-pointer
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          aria-hidden="true"
        >
          {/* トラック（背景） */}
          <span
            className={`
              absolute inset-0 rounded-full transition-colors duration-200
              ${checked ? 'bg-shu' : 'bg-ginnezumi'}
            `}
          />
          {/* サム（丸いつまみ） */}
          <span
            className={`
              absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow
              transition-transform duration-200 ease-in-out
              ${checked ? 'translate-x-5' : 'translate-x-0'}
            `}
          />
        </label>
      </div>
    </div>
  );
}

/**
 * 設定セクション用のカード
 * セクションタイトルとコンテンツを含む
 */
interface SettingSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function SettingSection({ title, description, children }: SettingSectionProps) {
  return (
    <div className="bg-shironeri border border-kinari mb-4">
      <div className="px-4 py-3 border-b border-kinari bg-kinari/30">
        <h3 className="font-medium text-sumi">{title}</h3>
        {description && (
          <p className="text-sm text-aitetsu mt-1">{description}</p>
        )}
      </div>
      <div className="divide-y divide-kinari">
        {children}
      </div>
    </div>
  );
}

/**
 * 設定項目のラッパー
 * 統一されたパディングと区切り線
 */
interface SettingItemProps {
  children: React.ReactNode;
  className?: string;
}

export function SettingItem({ children, className = '' }: SettingItemProps) {
  return (
    <div className={`px-4 ${className}`}>
      {children}
    </div>
  );
}

/**
 * 数値入力付き設定項目
 */
interface NumberSettingProps {
  label: string;
  description?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  unit?: string;
  disabled?: boolean;
}

export function NumberSetting({
  label,
  description,
  value,
  onChange,
  min = 0,
  max = 100,
  unit = '',
  disabled = false,
}: NumberSettingProps) {
  const id = useId();
  const descriptionId = description ? `${id}-description` : undefined;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue)) {
      // 範囲内に制限
      const clampedValue = Math.min(Math.max(newValue, min), max);
      onChange(clampedValue);
    }
  };

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 min-w-0 mr-4">
        <label
          htmlFor={id}
          className={`font-medium ${disabled ? 'text-ginnezumi' : ''}`}
        >
          {label}
        </label>
        {description && (
          <p id={descriptionId} className="text-sm text-aitetsu mt-0.5">
            {description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <input
          type="number"
          id={id}
          value={value}
          onChange={handleChange}
          min={min}
          max={max}
          disabled={disabled}
          aria-describedby={descriptionId}
          className="form-input w-20 text-center"
        />
        {unit && <span className="text-sm text-aitetsu">{unit}</span>}
      </div>
    </div>
  );
}

/**
 * セレクト入力付き設定項目
 */
interface SelectSettingProps {
  label: string;
  description?: string;
  value: string | number;
  onChange: (value: string | number) => void;
  options: { value: string | number; label: string }[];
  disabled?: boolean;
}

export function SelectSetting({
  label,
  description,
  value,
  onChange,
  options,
  disabled = false,
}: SelectSettingProps) {
  const id = useId();
  const descriptionId = description ? `${id}-description` : undefined;

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 min-w-0 mr-4">
        <label
          htmlFor={id}
          className={`font-medium ${disabled ? 'text-ginnezumi' : ''}`}
        >
          {label}
        </label>
        {description && (
          <p id={descriptionId} className="text-sm text-aitetsu mt-0.5">
            {description}
          </p>
        )}
      </div>
      <div className="flex-shrink-0">
        <select
          id={id}
          value={value}
          onChange={(e) => {
            const val = e.target.value;
            // コロンを含む場合は文字列のまま返す（時間形式）
            if (val.includes(':')) {
              onChange(val);
            } else {
              // 数値として変換できる場合は数値で返す
              const numVal = parseInt(val, 10);
              onChange(isNaN(numVal) ? val : numVal);
            }
          }}
          disabled={disabled}
          aria-describedby={descriptionId}
          className="form-input w-28 text-center"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
