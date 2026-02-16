/**
 * 週次アーカイブ Cron API
 *
 * 毎週日曜 JST 0:10（UTC 15:10）に実行
 * 完了・キャンセル済みの古い商品を自動アーカイブし、
 * 古い操作ログを削除する
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getJSTDateString } from '@/lib/date';

export const dynamic = 'force-dynamic';

/** デフォルトのアーカイブ日数 */
const DEFAULT_ARCHIVE_AFTER_DAYS = 90;

/** 操作ログ保持日数（アーカイブ済み商品の古いログを削除） */
const LOG_RETENTION_DAYS = 180;

export async function GET(request: NextRequest) {
  // CRON_SECRET による認証
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[cron/archive-items] 開始');
  const supabase = createServiceClient();
  const today = getJSTDateString();

  try {
    // アクティブなテナントを取得
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('id, slug, name')
      .eq('status', 'active');

    if (tenantError) {
      console.error('[cron/archive-items] テナント取得エラー:', tenantError.message);
      return NextResponse.json({ error: tenantError.message }, { status: 500 });
    }

    console.log(`[cron/archive-items] 対象テナント数: ${tenants.length}`);

    const results: { tenant: string; archivedCount: number; logsDeleted: number; error?: string }[] = [];

    for (const tenant of tenants) {
      try {
        // テナント設定からアーカイブ日数を取得
        const { data: archiveSetting } = await supabase
          .from('tenant_settings')
          .select('value')
          .eq('tenant_id', tenant.id)
          .eq('key', 'archiveAfterDays')
          .single();

        const archiveAfterDays = archiveSetting
          ? parseInt(archiveSetting.value, 10) || DEFAULT_ARCHIVE_AFTER_DAYS
          : DEFAULT_ARCHIVE_AFTER_DAYS;

        // アーカイブ基準日を計算
        const cutoffDate = new Date(today);
        cutoffDate.setDate(cutoffDate.getDate() - archiveAfterDays);
        const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

        // 完了/キャンセル系のステータスで、更新日がcutoff以前の未アーカイブ商品を取得
        const { data: itemsToArchive, error: itemsError } = await supabase
          .from('items')
          .select('id')
          .eq('tenant_id', tenant.id)
          .eq('is_archived', false)
          .in('status', ['completed', 'cancelled', 'cancelled_completed'])
          .lt('updated_at', cutoffDateStr);

        if (itemsError) {
          console.error(`[cron/archive-items] ${tenant.name}: 商品取得エラー:`, itemsError.message);
          results.push({ tenant: tenant.slug, archivedCount: 0, logsDeleted: 0, error: itemsError.message });
          continue;
        }

        let archivedCount = 0;

        if (itemsToArchive && itemsToArchive.length > 0) {
          const itemIds = itemsToArchive.map((i: { id: string }) => i.id);

          // バッチでアーカイブフラグを更新
          const { error: updateError, count } = await supabase
            .from('items')
            .update({ is_archived: true })
            .in('id', itemIds);

          if (updateError) {
            console.error(`[cron/archive-items] ${tenant.name}: アーカイブ更新エラー:`, updateError.message);
            results.push({ tenant: tenant.slug, archivedCount: 0, logsDeleted: 0, error: updateError.message });
            continue;
          }

          archivedCount = count ?? itemIds.length;
          console.log(`[cron/archive-items] ${tenant.name}: ${archivedCount}件をアーカイブ`);
        }

        // 古い操作ログの削除（アーカイブ済み商品に紐づく古いログ）
        const logCutoffDate = new Date(today);
        logCutoffDate.setDate(logCutoffDate.getDate() - LOG_RETENTION_DAYS);
        const logCutoffStr = logCutoffDate.toISOString().split('T')[0];

        // アーカイブ済み商品のitem_numberを取得
        const { data: archivedItems } = await supabase
          .from('items')
          .select('item_number')
          .eq('tenant_id', tenant.id)
          .eq('is_archived', true);

        let logsDeleted = 0;

        if (archivedItems && archivedItems.length > 0) {
          const archivedItemNumbers = archivedItems.map((i: { item_number: string }) => i.item_number);

          const { error: logDeleteError, count: logCount } = await supabase
            .from('operation_logs')
            .delete()
            .eq('tenant_id', tenant.id)
            .eq('target_type', 'item')
            .in('target_id', archivedItemNumbers)
            .lt('created_at', logCutoffStr);

          if (logDeleteError) {
            console.warn(`[cron/archive-items] ${tenant.name}: ログ削除エラー:`, logDeleteError.message);
          } else {
            logsDeleted = logCount ?? 0;
            if (logsDeleted > 0) {
              console.log(`[cron/archive-items] ${tenant.name}: ${logsDeleted}件の古いログを削除`);
            }
          }
        }

        results.push({ tenant: tenant.slug, archivedCount, logsDeleted });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[cron/archive-items] ${tenant.name}: エラー:`, message);
        results.push({ tenant: tenant.slug, archivedCount: 0, logsDeleted: 0, error: message });
      }
    }

    console.log('[cron/archive-items] 完了');
    return NextResponse.json({
      success: true,
      date: today,
      tenantCount: tenants.length,
      results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[cron/archive-items] 致命的エラー:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
