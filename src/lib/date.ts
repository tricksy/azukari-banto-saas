/**
 * 日付・時刻ユーティリティ
 *
 * 日本標準時（JST = UTC+9）での日時処理を提供
 */

/**
 * 日本標準時のタイムゾーン
 */
export const JST_TIMEZONE = 'Asia/Tokyo';

/**
 * 日本時間でフォーマットされたタイムスタンプを取得
 *
 * @param date - 日付オブジェクト（省略時は現在時刻）
 * @returns YYYYMMDDHHmmss 形式の文字列（14桁）
 *
 * @example
 * getJSTTimestamp(new Date('2026-01-19T08:30:00Z'))
 * // => '20260119173000' (UTC 08:30 → JST 17:30)
 */
export function getJSTTimestamp(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('ja-JP', {
    timeZone: JST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || '';

  return `${get('year')}${get('month')}${get('day')}${get('hour')}${get('minute')}${get('second')}`;
}

/**
 * 日本時間でフォーマットされたタイムスタンプを取得（分まで）
 *
 * @param date - 日付オブジェクト（省略時は現在時刻）
 * @returns YYYYMMDDHHmm 形式の文字列（12桁）
 *
 * @example
 * getJSTTimestampMinutes(new Date('2026-01-19T08:30:00Z'))
 * // => '202601191730' (UTC 08:30 → JST 17:30)
 */
export function getJSTTimestampMinutes(date: Date = new Date()): string {
  return getJSTTimestamp(date).slice(0, 12);
}

/**
 * 日本時間の日付文字列を取得
 *
 * @param date - 日付オブジェクト（省略時は現在時刻）
 * @returns YYYY-MM-DD 形式の文字列
 *
 * @example
 * getJSTDateString(new Date('2026-01-19T20:00:00Z'))
 * // => '2026-01-20' (UTC 20:00 → JST 翌日 05:00)
 */
export function getJSTDateString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('ja-JP', {
    timeZone: JST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || '';

  return `${get('year')}-${get('month')}-${get('day')}`;
}

/**
 * 日本時間のISO形式文字列を取得
 *
 * @param date - 日付オブジェクト（省略時は現在時刻）
 * @returns ISO 8601形式の文字列（JST表記）
 *
 * @example
 * getJSTISOString(new Date('2026-01-19T08:30:00Z'))
 * // => '2026-01-19T17:30:00+09:00'
 */
export function getJSTISOString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('ja-JP', {
    timeZone: JST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || '';

  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}+09:00`;
}
