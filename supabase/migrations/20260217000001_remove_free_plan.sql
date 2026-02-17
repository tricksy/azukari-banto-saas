-- ============================================
-- freeプラン廃止: Standard/Premium 2プラン制へ移行
-- ============================================

-- 既存のfreeプランテナントをstandardに移行
UPDATE tenants SET plan = 'standard' WHERE plan = 'free';

-- ENUM型を再作成（freeを除外）
ALTER TABLE tenants ALTER COLUMN plan DROP DEFAULT;
ALTER TYPE tenant_plan RENAME TO tenant_plan_old;
CREATE TYPE tenant_plan AS ENUM ('standard', 'premium');
ALTER TABLE tenants ALTER COLUMN plan TYPE tenant_plan USING plan::text::tenant_plan;
ALTER TABLE tenants ALTER COLUMN plan SET DEFAULT 'standard';
DROP TYPE tenant_plan_old;
