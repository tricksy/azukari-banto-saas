/**
 * メール送信ユーティリティ
 *
 * Resend を使用したメール送信機能を提供
 * RESEND_API_KEY 未設定時は開発モードとしてスキップ
 */

interface SendEmailResult {
  success: boolean;
  error?: string;
}

/**
 * メールを送信する
 *
 * @param to - 宛先メールアドレス
 * @param subject - 件名
 * @param html - HTML本文
 * @returns 送信結果
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'noreply@azukaribanto.com';

  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY が未設定のため、メール送信をスキップしました');
    console.warn(`[email] 宛先: ${to}, 件名: ${subject}`);
    return { success: true };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[email] 送信失敗: ${response.status} ${body}`);
      return { success: false, error: `HTTP ${response.status}: ${body}` };
    }

    console.log(`[email] 送信成功: ${to}`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[email] 送信エラー: ${message}`);
    return { success: false, error: message };
  }
}

/** アラートメールに含める商品情報 */
export interface AlertItem {
  item_number: string;
  customer_name: string | null;
  status: string;
  alert_type: string;
  days: number;
}

/** アラート種別の日本語ラベル */
const ALERT_TYPE_LABELS: Record<string, string> = {
  ship_overdue: '発送超過',
  processing_overdue: '加工超過',
  return_overdue: '返却後未対応',
  paid_storage: '有料預かり中',
  on_hold_overdue: '保留超過',
  awaiting_customer_overdue: '顧客確認待ち超過',
};

/** ステータスの日本語ラベル */
const STATUS_LABELS: Record<string, string> = {
  draft: '顧客未設定',
  received: '受付済',
  pending_ship: '業者への発送待ち',
  processing: '加工中',
  returned: '業者からの返却済',
  paid_storage: '有料預かり',
  completed: '完了',
  rework: '再加工',
  on_hold: '顧客への返送保留',
  awaiting_customer: '顧客確認待ち',
  cancelled: 'キャンセル',
  cancelled_completed: 'キャンセル完了',
};

/**
 * アラートメールを送信する
 *
 * @param to - 宛先メールアドレス
 * @param subject - 件名
 * @param items - アラート対象商品一覧
 * @param storeName - 店舗名（メールヘッダー表示用）
 * @returns 送信結果
 */
export async function sendAlertEmail(
  to: string,
  subject: string,
  items: AlertItem[],
  storeName: string
): Promise<SendEmailResult> {
  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;font-size:14px;">${item.item_number}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;font-size:14px;">${item.customer_name || '未設定'}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;font-size:14px;">${STATUS_LABELS[item.status] || item.status}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;font-size:14px;">${ALERT_TYPE_LABELS[item.alert_type] || item.alert_type}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;font-size:14px;text-align:right;">${item.days}日</td>
        </tr>`
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html lang="ja">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f5f5f0;font-family:'Hiragino Kaku Gothic ProN','Hiragino Sans',Meiryo,sans-serif;">
  <div style="max-width:640px;margin:24px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:#4a3728;padding:20px 24px;">
      <h1 style="margin:0;color:#f5f5f0;font-size:18px;font-weight:600;">預かり番頭 — ${storeName}</h1>
      <p style="margin:4px 0 0;color:#d4c8be;font-size:13px;">デイリーアラート通知</p>
    </div>
    <div style="padding:24px;">
      <p style="margin:0 0 16px;font-size:14px;color:#333;">
        確認が必要な預かり品が <strong>${items.length}件</strong> あります。
      </p>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#f5f5f0;">
            <th style="padding:8px 12px;text-align:left;font-size:13px;color:#666;border-bottom:2px solid #d4c8be;">預かり番号</th>
            <th style="padding:8px 12px;text-align:left;font-size:13px;color:#666;border-bottom:2px solid #d4c8be;">顧客名</th>
            <th style="padding:8px 12px;text-align:left;font-size:13px;color:#666;border-bottom:2px solid #d4c8be;">ステータス</th>
            <th style="padding:8px 12px;text-align:left;font-size:13px;color:#666;border-bottom:2px solid #d4c8be;">アラート種別</th>
            <th style="padding:8px 12px;text-align:right;font-size:13px;color:#666;border-bottom:2px solid #d4c8be;">経過日数</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div style="padding:16px 24px;background:#f5f5f0;font-size:12px;color:#999;text-align:center;">
      このメールは預かり番頭システムから自動送信されています
    </div>
  </div>
</body>
</html>`.trim();

  return sendEmail(to, subject, html);
}
