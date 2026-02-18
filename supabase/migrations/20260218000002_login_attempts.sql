-- ログイン試行制限テーブル（レート制限用）
-- Vercelサーバーレス環境でも永続化されるようDBに保存

CREATE TABLE IF NOT EXISTS login_attempts (
  identifier TEXT PRIMARY KEY,       -- IPアドレス等の識別子
  attempt_count INTEGER NOT NULL DEFAULT 0,
  first_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLSは不要（service_roleのみアクセス）
-- anon/authenticatedからのアクセスを拒否
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- service_roleのみ全操作可能
CREATE POLICY "service_role_all" ON login_attempts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 古いエントリを自動削除するためのインデックス
CREATE INDEX idx_login_attempts_updated_at ON login_attempts (updated_at);
