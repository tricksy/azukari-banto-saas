-- ============================================
-- Row Level Security (RLS) ポリシー
-- テナント間のデータ分離を保証
-- ============================================

-- RLS有効化（全業務テーブル）
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE receptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- テナント分離ポリシー
-- app.tenant_id をセッション変数として使用
-- ============================================

-- workers
CREATE POLICY tenant_isolation ON workers
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- partners
CREATE POLICY tenant_isolation ON partners
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- customers
CREATE POLICY tenant_isolation ON customers
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- vendors
CREATE POLICY tenant_isolation ON vendors
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- receptions
CREATE POLICY tenant_isolation ON receptions
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- items
CREATE POLICY tenant_isolation ON items
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- claims
CREATE POLICY tenant_isolation ON claims
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- claim_logs
CREATE POLICY tenant_isolation ON claim_logs
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- operation_logs
CREATE POLICY tenant_isolation ON operation_logs
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- tenant_settings
CREATE POLICY tenant_isolation ON tenant_settings
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- ============================================
-- サービスロール用ポリシー（バイパス）
-- サーバーサイドからはサービスロールで全データアクセス
-- ============================================

CREATE POLICY service_role_all ON workers
  FOR ALL TO service_role USING (true);

CREATE POLICY service_role_all ON partners
  FOR ALL TO service_role USING (true);

CREATE POLICY service_role_all ON customers
  FOR ALL TO service_role USING (true);

CREATE POLICY service_role_all ON vendors
  FOR ALL TO service_role USING (true);

CREATE POLICY service_role_all ON receptions
  FOR ALL TO service_role USING (true);

CREATE POLICY service_role_all ON items
  FOR ALL TO service_role USING (true);

CREATE POLICY service_role_all ON claims
  FOR ALL TO service_role USING (true);

CREATE POLICY service_role_all ON claim_logs
  FOR ALL TO service_role USING (true);

CREATE POLICY service_role_all ON operation_logs
  FOR ALL TO service_role USING (true);

CREATE POLICY service_role_all ON tenant_settings
  FOR ALL TO service_role USING (true);
