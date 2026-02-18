/**
 * デイリーアラート Cron API
 *
 * 毎日 JST 0:00（UTC 15:00）に実行
 * 各テナントの要注意商品を検出しアラートメールを送信する
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendAlertEmail, type AlertItem } from '@/lib/email';
import { getJSTDateString } from '@/lib/date';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // CRON_SECRET による認証
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[cron/alerts] 開始');
  const supabase = createServiceClient();
  const today = getJSTDateString();

  try {
    // アクティブなテナントを取得
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('id, slug, name')
      .eq('status', 'active');

    if (tenantError) {
      console.error('[cron/alerts] テナント取得エラー:', tenantError.message);
      return NextResponse.json({ error: tenantError.message }, { status: 500 });
    }

    console.log(`[cron/alerts] 対象テナント数: ${tenants.length}`);

    const results: { tenant: string; alertCount: number; emailSent: boolean; error?: string }[] = [];

    for (const tenant of tenants) {
      try {
        // テナント設定を取得
        const { data: settings } = await supabase
          .from('tenant_settings')
          .select('key, value')
          .eq('tenant_id', tenant.id)
          .in('key', ['alertEmailEnabled', 'alertEmail', 'resendApiKey', 'emailFrom']);

        const settingsMap: Record<string, string> = {};
        for (const s of settings || []) {
          settingsMap[s.key] = s.value;
        }

        // アラートメールが無効ならスキップ
        if (settingsMap.alertEmailEnabled === 'false') {
          console.log(`[cron/alerts] ${tenant.name}: アラートメール無効、スキップ`);
          results.push({ tenant: tenant.slug, alertCount: 0, emailSent: false });
          continue;
        }

        // 送信先メールアドレスがなければスキップ
        const alertEmail = settingsMap.alertEmail;
        if (!alertEmail) {
          console.log(`[cron/alerts] ${tenant.name}: alertEmail未設定、スキップ`);
          results.push({ tenant: tenant.slug, alertCount: 0, emailSent: false });
          continue;
        }

        // アラート対象の商品を検出
        const alertItems = await detectAlertItems(supabase, tenant.id, today);

        if (alertItems.length === 0) {
          console.log(`[cron/alerts] ${tenant.name}: アラート対象なし`);
          results.push({ tenant: tenant.slug, alertCount: 0, emailSent: false });
          continue;
        }

        console.log(`[cron/alerts] ${tenant.name}: ${alertItems.length}件のアラート検出`);

        // テナント固有 or グローバルの Resend APIキーを使用
        const emailOptions: { apiKey?: string; from?: string; tenantId?: string; emailType?: string } = {
          tenantId: tenant.id,
          emailType: 'daily_alert',
        };
        if (settingsMap.resendApiKey) {
          emailOptions.apiKey = settingsMap.resendApiKey;
        }
        if (settingsMap.emailFrom) {
          emailOptions.from = settingsMap.emailFrom;
        }

        // アラートメール送信
        const subject = `【預かり番頭】${tenant.name} — ${alertItems.length}件の確認が必要です`;
        const result = await sendAlertEmail(alertEmail, subject, alertItems, tenant.name, emailOptions);

        results.push({
          tenant: tenant.slug,
          alertCount: alertItems.length,
          emailSent: result.success,
          error: result.error,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[cron/alerts] ${tenant.name}: エラー:`, message);
        results.push({ tenant: tenant.slug, alertCount: 0, emailSent: false, error: message });
      }
    }

    console.log('[cron/alerts] 完了');
    return NextResponse.json({
      success: true,
      date: today,
      tenantCount: tenants.length,
      results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[cron/alerts] 致命的エラー:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * テナントのアラート対象商品を検出する
 */
async function detectAlertItems(
  supabase: ReturnType<typeof createServiceClient>,
  tenantId: string,
  today: string
): Promise<AlertItem[]> {
  const alertItems: AlertItem[] = [];

  // 日付差分計算用ヘルパー
  const daysDiff = (dateStr: string): number => {
    const target = new Date(dateStr);
    const now = new Date(today);
    return Math.floor((now.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
  };

  // pending_ship: 3日以上経過（発送待ちの滞留）
  const { data: pendingShip } = await supabase
    .from('items')
    .select('item_number, customer_name, status, updated_at')
    .eq('tenant_id', tenantId)
    .eq('status', 'pending_ship')
    .eq('is_archived', false);

  for (const item of pendingShip || []) {
    const days = daysDiff(item.updated_at);
    if (days >= 3) {
      alertItems.push({
        item_number: item.item_number,
        customer_name: item.customer_name,
        status: item.status,
        alert_type: 'ship_overdue',
        days,
      });
    }
  }

  // processing: 14日以上経過（加工の長期化）
  const { data: processing } = await supabase
    .from('items')
    .select('item_number, customer_name, status, updated_at')
    .eq('tenant_id', tenantId)
    .eq('status', 'processing')
    .eq('is_archived', false);

  for (const item of processing || []) {
    const days = daysDiff(item.updated_at);
    if (days >= 14) {
      alertItems.push({
        item_number: item.item_number,
        customer_name: item.customer_name,
        status: item.status,
        alert_type: 'processing_overdue',
        days,
      });
    }
  }

  // returned: 7日以上経過（返却後の未対応）
  const { data: returned } = await supabase
    .from('items')
    .select('item_number, customer_name, status, updated_at')
    .eq('tenant_id', tenantId)
    .eq('status', 'returned')
    .eq('is_archived', false);

  for (const item of returned || []) {
    const days = daysDiff(item.updated_at);
    if (days >= 7) {
      alertItems.push({
        item_number: item.item_number,
        customer_name: item.customer_name,
        status: item.status,
        alert_type: 'return_overdue',
        days,
      });
    }
  }

  // paid_storage: 全件（経過日数付き）
  const { data: paidStorage } = await supabase
    .from('items')
    .select('item_number, customer_name, status, paid_storage_start_date, updated_at')
    .eq('tenant_id', tenantId)
    .eq('status', 'paid_storage')
    .eq('is_archived', false);

  for (const item of paidStorage || []) {
    const refDate = item.paid_storage_start_date || item.updated_at;
    const days = daysDiff(refDate);
    alertItems.push({
      item_number: item.item_number,
      customer_name: item.customer_name,
      status: item.status,
      alert_type: 'paid_storage',
      days,
    });
  }

  // on_hold: 3日以上経過
  const { data: onHold } = await supabase
    .from('items')
    .select('item_number, customer_name, status, updated_at')
    .eq('tenant_id', tenantId)
    .eq('status', 'on_hold')
    .eq('is_archived', false);

  for (const item of onHold || []) {
    const days = daysDiff(item.updated_at);
    if (days >= 3) {
      alertItems.push({
        item_number: item.item_number,
        customer_name: item.customer_name,
        status: item.status,
        alert_type: 'on_hold_overdue',
        days,
      });
    }
  }

  // awaiting_customer: 7日以上経過
  const { data: awaitingCustomer } = await supabase
    .from('items')
    .select('item_number, customer_name, status, updated_at')
    .eq('tenant_id', tenantId)
    .eq('status', 'awaiting_customer')
    .eq('is_archived', false);

  for (const item of awaitingCustomer || []) {
    const days = daysDiff(item.updated_at);
    if (days >= 7) {
      alertItems.push({
        item_number: item.item_number,
        customer_name: item.customer_name,
        status: item.status,
        alert_type: 'awaiting_customer_overdue',
        days,
      });
    }
  }

  return alertItems;
}
