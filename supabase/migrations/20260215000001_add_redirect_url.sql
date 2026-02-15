-- テナント分離移行: redirect_url カラム追加
-- NULL = SaaS内で処理、値あり = 専用サーバーへリダイレクト
ALTER TABLE tenants ADD COLUMN redirect_url TEXT DEFAULT NULL;
