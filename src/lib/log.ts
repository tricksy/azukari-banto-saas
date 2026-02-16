/**
 * 操作ログユーティリティ
 *
 * operation_logsテーブルへの書き込みヘルパー
 * Fire-and-forget方式（エラー時はconsole.errorに出力、例外は投げない）
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { LogAction } from '@/types';

/** 操作ログの対象種別 */
export type LogTargetType =
  | 'item'
  | 'reception'
  | 'customer'
  | 'partner'
  | 'vendor'
  | 'worker'
  | 'session';

/**
 * 操作ログを記録する
 *
 * @param supabase - Supabaseクライアント（createServiceClient()で生成）
 * @param tenantId - テナントID（UUID）
 * @param workerId - 担当者ID（UUID、nullの場合はシステム操作）
 * @param action - 操作種別
 * @param targetType - 対象種別
 * @param targetId - 対象ID（預かり番号、担当者IDなど）
 * @param changes - 変更内容（任意）
 */
export async function logOperation(
  supabase: SupabaseClient,
  tenantId: string,
  workerId: string | null,
  action: LogAction,
  targetType: LogTargetType,
  targetId: string,
  changes?: Record<string, unknown>,
): Promise<void> {
  try {
    const { error } = await supabase.from('operation_logs').insert({
      tenant_id: tenantId,
      worker_id: workerId,
      action,
      target_type: targetType,
      target_id: targetId,
      changes: changes ?? null,
    });

    if (error) {
      console.error('[OperationLog] 書き込み失敗:', error);
    }
  } catch (err) {
    console.error('[OperationLog] 予期しないエラー:', err);
  }
}
