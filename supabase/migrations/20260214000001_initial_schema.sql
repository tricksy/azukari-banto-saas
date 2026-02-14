-- ============================================
-- 預かり番頭 SaaS 初期スキーマ
-- ============================================

-- UUID生成拡張
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMs
-- ============================================

CREATE TYPE item_status AS ENUM (
  'draft',
  'received',
  'pending_ship',
  'processing',
  'returned',
  'paid_storage',
  'completed',
  'rework',
  'on_hold',
  'awaiting_customer',
  'cancelled',
  'cancelled_completed'
);

CREATE TYPE carrier_type AS ENUM (
  'yamato',
  'sagawa',
  'japanpost',
  'other'
);

CREATE TYPE claim_status AS ENUM (
  'open',
  'closed'
);

CREATE TYPE claim_category AS ENUM (
  'quality',
  'delivery',
  'response',
  'other'
);

CREATE TYPE claim_log_action AS ENUM (
  'opened',
  'updated',
  'resolved',
  'closed',
  'reopened'
);

CREATE TYPE log_action AS ENUM (
  'create',
  'update',
  'delete',
  'status_change',
  'login',
  'logout'
);

CREATE TYPE log_target_type AS ENUM (
  'item',
  'reception',
  'customer',
  'partner',
  'vendor',
  'worker',
  'session'
);

CREATE TYPE tenant_plan AS ENUM (
  'free',
  'standard',
  'premium'
);

CREATE TYPE tenant_status AS ENUM (
  'active',
  'suspended',
  'cancelled'
);

-- ============================================
-- テナント管理（RLSなし = プラットフォーム横断）
-- ============================================

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(63) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  plan tenant_plan NOT NULL DEFAULT 'free',
  status tenant_status NOT NULL DEFAULT 'active',
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 業務テーブル（全て tenant_id を持つ）
-- ============================================

-- 担当者
CREATE TABLE workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  worker_id VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  pin_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, worker_id)
);

-- 取引先
CREATE TABLE partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  partner_code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  name_kana VARCHAR(255),
  contact_person VARCHAR(100),
  phone VARCHAR(50),
  fax VARCHAR(50),
  email VARCHAR(255),
  postal_code VARCHAR(10),
  address TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, partner_code)
);

-- 顧客
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES partners(id),
  name VARCHAR(255) NOT NULL,
  name_kana VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  postal_code VARCHAR(10),
  address TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 業者（加工業者）
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vendor_id VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  name_kana VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  postal_code VARCHAR(10),
  address TEXT,
  specialty VARCHAR(255),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, vendor_id)
);

-- 受付
CREATE TABLE receptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  reception_number VARCHAR(50) NOT NULL,
  customer_id UUID REFERENCES customers(id),
  customer_name VARCHAR(255),
  partner_id UUID REFERENCES partners(id),
  partner_name VARCHAR(255),
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  received_by UUID NOT NULL REFERENCES workers(id),
  item_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, reception_number)
);

-- 商品（預かり品）
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  item_number VARCHAR(50) NOT NULL,
  reception_id UUID NOT NULL REFERENCES receptions(id),
  customer_name VARCHAR(255),
  customer_name_kana VARCHAR(255),
  partner_id UUID REFERENCES partners(id),
  partner_name VARCHAR(255),
  product_type VARCHAR(50) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  color VARCHAR(100),
  material VARCHAR(100),
  size VARCHAR(100),
  condition_note TEXT,
  request_type VARCHAR(100),
  request_detail TEXT,
  status item_status NOT NULL DEFAULT 'draft',
  vendor_id UUID REFERENCES vendors(id),
  vendor_name VARCHAR(255),
  scheduled_ship_date DATE,
  scheduled_return_date DATE,
  ship_to_vendor_date DATE,
  return_from_vendor_date DATE,
  return_to_customer_date DATE,
  vendor_tracking_number VARCHAR(100),
  vendor_carrier carrier_type,
  customer_tracking_number VARCHAR(100),
  customer_carrier carrier_type,
  photo_front_url TEXT,
  photo_back_url TEXT,
  photo_after_front_url TEXT,
  photo_after_back_url TEXT,
  photo_front_memo TEXT,
  photo_back_memo TEXT,
  photo_after_front_memo TEXT,
  photo_after_back_memo TEXT,
  additional_photos JSONB DEFAULT '[]',
  is_paid_storage BOOLEAN NOT NULL DEFAULT false,
  paid_storage_start_date DATE,
  is_claim_active BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  ship_history JSONB DEFAULT '[]',
  return_history JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, item_number)
);

-- クレーム
CREATE TABLE claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  claim_id VARCHAR(50) NOT NULL,
  item_id UUID NOT NULL REFERENCES items(id),
  item_number VARCHAR(50) NOT NULL,
  customer_name VARCHAR(255),
  status claim_status NOT NULL DEFAULT 'open',
  category claim_category,
  description TEXT NOT NULL,
  assignee_id UUID REFERENCES workers(id),
  assignee_name VARCHAR(100),
  due_date DATE,
  resolution TEXT,
  created_by UUID NOT NULL REFERENCES workers(id),
  created_by_name VARCHAR(100) NOT NULL,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES workers(id),
  resolved_by_name VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, claim_id)
);

-- クレーム対応ログ
CREATE TABLE claim_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  item_number VARCHAR(50) NOT NULL,
  worker_id UUID NOT NULL REFERENCES workers(id),
  worker_name VARCHAR(100) NOT NULL,
  action claim_log_action NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 操作ログ
CREATE TABLE operation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES workers(id),
  action log_action NOT NULL,
  target_type log_target_type NOT NULL,
  target_id VARCHAR(100) NOT NULL,
  changes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- テナント設定
CREATE TABLE tenant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key VARCHAR(100) NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, key)
);

-- ============================================
-- プラットフォーム管理テーブル
-- ============================================

CREATE TABLE platform_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- インデックス
-- ============================================

-- テナントIDでの検索を高速化
CREATE INDEX idx_workers_tenant ON workers(tenant_id);
CREATE INDEX idx_partners_tenant ON partners(tenant_id);
CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_vendors_tenant ON vendors(tenant_id);
CREATE INDEX idx_receptions_tenant ON receptions(tenant_id);
CREATE INDEX idx_items_tenant ON items(tenant_id);
CREATE INDEX idx_claims_tenant ON claims(tenant_id);
CREATE INDEX idx_claim_logs_tenant ON claim_logs(tenant_id);
CREATE INDEX idx_operation_logs_tenant ON operation_logs(tenant_id);
CREATE INDEX idx_tenant_settings_tenant ON tenant_settings(tenant_id);

-- 業務検索用
CREATE INDEX idx_items_status ON items(tenant_id, status) WHERE NOT is_archived;
CREATE INDEX idx_items_reception ON items(reception_id);
CREATE INDEX idx_items_archived ON items(tenant_id, is_archived) WHERE is_archived;
CREATE INDEX idx_claims_status ON claims(tenant_id, status);
CREATE INDEX idx_claim_logs_claim ON claim_logs(claim_id);
CREATE INDEX idx_operation_logs_created ON operation_logs(tenant_id, created_at DESC);
CREATE INDEX idx_customers_partner ON customers(partner_id);

-- ============================================
-- updated_at 自動更新トリガー
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_workers_updated_at BEFORE UPDATE ON workers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_partners_updated_at BEFORE UPDATE ON partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_vendors_updated_at BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_receptions_updated_at BEFORE UPDATE ON receptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_items_updated_at BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tenant_settings_updated_at BEFORE UPDATE ON tenant_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
