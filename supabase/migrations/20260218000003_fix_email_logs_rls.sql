-- email_logs: service_roleポリシー追加（他テーブルとの一貫性）
-- current_settingのmissing_okパラメータも統一

-- 既存ポリシーを修正（missing_ok = true に統一）
DROP POLICY IF EXISTS "tenant_isolation" ON email_logs;
DROP POLICY IF EXISTS "tenant_insert" ON email_logs;

CREATE POLICY "tenant_isolation" ON email_logs
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- service_roleは全操作可能（サーバーサイドからのログ記録用）
CREATE POLICY "service_role_all" ON email_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);
