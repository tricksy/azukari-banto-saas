-- ============================================
-- メール送信履歴テーブル
-- ============================================

CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  to_address TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_logs_tenant ON email_logs(tenant_id);
CREATE INDEX idx_email_logs_sent_at ON email_logs(tenant_id, sent_at DESC);

-- RLSポリシー
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON email_logs
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY "tenant_insert" ON email_logs
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
