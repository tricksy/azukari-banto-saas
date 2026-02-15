-- ============================================
-- 開発用シードデータ
-- ============================================

-- テスト用テナント
INSERT INTO tenants (id, slug, name, plan, status) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'A3F0', 'デモ着物店', 'free', 'active'),
  ('a0000000-0000-0000-0000-000000000002', 'B1C2', 'テスト呉服店', 'standard', 'active');

-- プラットフォーム管理者
INSERT INTO platform_admins (email, name) VALUES
  ('admin@kuratsugi.app', 'プラットフォーム管理者');

-- デモ着物店の担当者（PIN: 12345678 → bcryptハッシュ）
INSERT INTO workers (tenant_id, worker_id, name, pin_hash, email) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'T01', '田中太郎', '$2a$10$placeholder_hash_for_dev', 'tanaka@demo-kimono.example.com'),
  ('a0000000-0000-0000-0000-000000000001', 'T02', '鈴木花子', '$2a$10$placeholder_hash_for_dev', 'suzuki@demo-kimono.example.com');

-- デモ着物店の業者
INSERT INTO vendors (tenant_id, vendor_id, name, specialty) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'V001', '着物ブレイン', '洗い,シミ抜き'),
  ('a0000000-0000-0000-0000-000000000001', 'V002', '京都染工房', '染め直し');

-- デモ着物店の設定
INSERT INTO tenant_settings (tenant_id, key, value) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'company_name', 'デモ着物店'),
  ('a0000000-0000-0000-0000-000000000001', 'alert_days_before_due', '3'),
  ('a0000000-0000-0000-0000-000000000001', 'archive_days_after_complete', '90');
