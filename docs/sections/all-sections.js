window.SECTIONS = {
  "overview": `
      <section id="overview">
        <h2>プロジェクト概要</h2>
        <p>預かり番頭 SaaS は、着物・帯の預かりから加工業者への発注、顧客への返送までを一元管理するマルチテナント型クラウドシステムです。商品単位での預かり番号管理と写真記録により、依頼漏れ・返送漏れ・品質トラブルを防止します。</p>

        <div class="stats">
          <div class="stat-card"><div class="number">3</div><div class="label">ユーザー種別</div></div>
          <div class="stat-card"><div class="number">12</div><div class="label">ステータス</div></div>
          <div class="stat-card"><div class="number">Multi</div><div class="label">テナント対応</div></div>
          <div class="stat-card"><div class="number">RLS</div><div class="label">データ分離</div></div>
        </div>

        <h3>KURATSUGI（単体版）との主な違い</h3>
        <table>
          <tr><th>項目</th><th>KURATSUGI（単体版）</th><th>SaaS版</th></tr>
          <tr><td>テナント</td><td>単一店舗</td><td>マルチテナント（複数店舗）</td></tr>
          <tr><td>データベース</td><td>Google Spreadsheet</td><td>Supabase（PostgreSQL）</td></tr>
          <tr><td>ストレージ</td><td>Google Drive</td><td>Supabase Storage（予定）</td></tr>
          <tr><td>認証</td><td>Worker PIN + Admin OAuth（2種別）</td><td>Worker PIN + Admin OAuth + Platform Admin（3種別）</td></tr>
          <tr><td>データ分離</td><td>不要（単一テナント）</td><td>RLS + tenant_id による行レベルセキュリティ</td></tr>
          <tr><td>ルーティング</td><td>単一ドメイン</td><td>サブドメイン（{slug}.kuratsugi.app）</td></tr>
          <tr><td>メール</td><td>GAS（Gmail）</td><td>未定（Resend等を検討）</td></tr>
          <tr><td>対象規模</td><td>1店舗</td><td>複数の着物店・呉服店</td></tr>
        </table>

        <h3>なぜ SaaS 化するのか</h3>
        <ul>
          <li><strong>スケーラビリティ</strong>: 新しい店舗を追加する際、テナント登録のみで即座に利用開始可能</li>
          <li><strong>運用効率</strong>: コードベースは単一。バグ修正や機能追加が全テナントに同時反映</li>
          <li><strong>データ信頼性</strong>: PostgreSQL による ACID トランザクション。Google Sheets の行ロック問題を解消</li>
          <li><strong>セキュリティ</strong>: RLS によるデータベースレベルのテナント分離。アプリケーション層のバグでもデータ漏洩を防止</li>
        </ul>

        <h3>システム概要</h3>
        <table>
          <tr><th>機能</th><th>説明</th><th>対象ユーザー</th></tr>
          <tr><td>預かり登録</td><td>顧客・商品情報の登録、写真撮影</td><td>担当者</td></tr>
          <tr><td>発注管理</td><td>加工業者への発送、加工依頼書出力</td><td>担当者</td></tr>
          <tr><td>業者からの返却受入</td><td>業者からの返却処理、品質チェック</td><td>担当者</td></tr>
          <tr><td>顧客への返送管理</td><td>顧客への返送、追跡番号管理</td><td>担当者</td></tr>
          <tr><td>マスタ管理</td><td>取引先・業者・担当者の管理</td><td>管理者</td></tr>
          <tr><td>操作ログ</td><td>全操作の記録・追跡</td><td>管理者</td></tr>
          <tr><td>テナント管理</td><td>店舗の登録・プラン管理・利用停止</td><td>プラットフォーム管理者</td></tr>
        </table>

        <h3>採番ルール</h3>
        <table>
          <tr><th>番号種別</th><th>形式</th><th>例</th><th>用途</th></tr>
          <tr><td>受付番号（親）</td><td>{担当者ID}-{YYYYMMDDHHmm}</td><td>T01-202601181430</td><td>同一受付の商品グルーピング</td></tr>
          <tr><td>預かり番号（子）</td><td>{担当者ID}-{YYYYMMDDHHmmss}-{連番2桁}</td><td>T01-20260118143025-01</td><td>商品1点ごとの管理</td></tr>
        </table>

        <h3>デザインテーマ</h3>
        <p><strong>侘寂（Wabi-Sabi）</strong> - 和の美意識を反映したシンプルで温かみのあるデザイン</p>
        <table>
          <tr><th>要素</th><th>色</th><th>用途</th></tr>
          <tr><td>墨（Sumi）</td><td style="background:#1A1A1A;color:white;padding:4px 12px;">#1A1A1A</td><td>メインテキスト</td></tr>
          <tr><td>胡粉（Gofun）</td><td style="background:#F8F7F3;padding:4px 12px;">#F8F7F3</td><td>背景</td></tr>
          <tr><td>朱（Shu）</td><td style="background:#8B2332;color:white;padding:4px 12px;">#8B2332</td><td>プライマリアクセント</td></tr>
          <tr><td>老竹色（Oitake）</td><td style="background:#5A6650;color:white;padding:4px 12px;">#5A6650</td><td>成功状態</td></tr>
          <tr><td>深緋（Kokiake）</td><td style="background:#7B2D26;color:white;padding:4px 12px;">#7B2D26</td><td>エラー状態</td></tr>
        </table>
      </section>

      <section id="tech-stack">
        <h2>技術スタック</h2>

        <h3>フロントエンド</h3>
        <table>
          <tr><th>技術</th><th>バージョン</th><th>用途</th></tr>
          <tr><td>Next.js</td><td>16.x</td><td>フレームワーク（App Router）</td></tr>
          <tr><td>React</td><td>19.x</td><td>UIライブラリ</td></tr>
          <tr><td>TypeScript</td><td>5.x</td><td>型安全な開発</td></tr>
          <tr><td>Tailwind CSS</td><td>4.x</td><td>スタイリング</td></tr>
        </table>

        <h3>バックエンド / データベース</h3>
        <table>
          <tr><th>技術</th><th>用途</th></tr>
          <tr><td>Next.js API Routes</td><td>サーバーサイド処理</td></tr>
          <tr><td>Supabase（PostgreSQL）</td><td>データベース（RLS によるテナント分離）</td></tr>
          <tr><td>@supabase/ssr</td><td>サーバーサイド Supabase クライアント</td></tr>
          <tr><td>@supabase/supabase-js</td><td>サービスロールクライアント</td></tr>
        </table>

        <h3>認証・セキュリティ</h3>
        <table>
          <tr><th>技術</th><th>用途</th></tr>
          <tr><td>jose</td><td>JWT 署名・検証（HS256）</td></tr>
          <tr><td>bcryptjs</td><td>PIN コードハッシュ化</td></tr>
          <tr><td>独自レート制限</td><td>ログイン試行制限（5回/15分）</td></tr>
        </table>

        <h3>インフラ</h3>
        <table>
          <tr><th>サービス</th><th>用途</th></tr>
          <tr><td>Vercel</td><td>ホスティング・デプロイ</td></tr>
          <tr><td>Supabase Cloud</td><td>マネージド PostgreSQL</td></tr>
          <tr><td>Vercel Cron Jobs</td><td>定期アラートチェック（予定）</td></tr>
        </table>

        <h3>認証方式一覧</h3>
        <table>
          <tr><th>ユーザー種別</th><th>認証方式</th><th>セッション</th><th>管理方法</th></tr>
          <tr><td>担当者（Worker）</td><td>PINコード認証（8桁）</td><td>JWT Cookie（8時間）</td><td>管理者が発行・管理</td></tr>
          <tr><td>管理者（Admin）</td><td>メール/OAuth</td><td>JWT Cookie（8時間）</td><td>プラットフォーム管理者が設定</td></tr>
          <tr><td>プラットフォーム管理者</td><td>メール認証</td><td>JWT Cookie</td><td>platform_admins テーブルで管理</td></tr>
        </table>
      </section>
`,

  "architecture": `
      <section id="system">
        <h2>システムアーキテクチャ</h2>

        <h3>全体構成図</h3>
        <pre><code>
  +--------------------------+
  |       クライアント        |
  |  {slug}.kuratsugi.app    |
  +-----------+--------------+
              |
              | HTTPS
              v
  +-----------+--------------+
  |        Vercel            |
  |  +--------------------+  |
  |  | Next.js 16         |  |
  |  | App Router         |  |
  |  |                    |  |
  |  | +----------------+ |  |
  |  | | Middleware      | |  |
  |  | | - テナント解決  | |  |
  |  | | - JWT検証       | |  |
  |  | +----------------+ |  |
  |  |                    |  |
  |  | +----------------+ |  |
  |  | | API Routes     | |  |
  |  | | /api/auth/*    | |  |
  |  | | /api/items/*   | |  |
  |  | | /api/tenant    | |  |
  |  | +----------------+ |  |
  |  +--------------------+  |
  +-----------+--------------+
              |
              | Service Role / Anon Key
              v
  +-----------+--------------+
  |     Supabase Cloud       |
  |  +--------------------+  |
  |  | PostgreSQL         |  |
  |  | +----------------+ |  |
  |  | | RLS Policies   | |  |
  |  | | tenant_id =    | |  |
  |  | | app.tenant_id  | |  |
  |  | +----------------+ |  |
  |  |                    |  |
  |  | Tables:            |  |
  |  |  tenants           |  |
  |  |  workers           |  |
  |  |  items             |  |
  |  |  receptions        |  |
  |  |  customers         |  |
  |  |  partners          |  |
  |  |  vendors           |  |
  |  |  claims            |  |
  |  |  operation_logs    |  |
  |  +--------------------+  |
  +--------------------------+
        </code></pre>

        <h3>マルチテナント方式</h3>
        <table>
          <tr><th>方式</th><th>説明</th></tr>
          <tr><td>テナント識別</td><td>サブドメイン方式: <code>{slug}.kuratsugi.app</code></td></tr>
          <tr><td>データ分離</td><td>共有スキーマ + RLS（Row Level Security）</td></tr>
          <tr><td>テナントID</td><td>UUID。全業務テーブルに <code>tenant_id</code> カラム</td></tr>
          <tr><td>開発環境</td><td><code>x-tenant-slug</code> ヘッダーでテナント指定</td></tr>
        </table>

        <h3>リクエスト処理フロー</h3>
        <pre><code>
  Browser Request
       |
       v
  [1] DNS: demo-kimono.kuratsugi.app
       |
       v
  [2] Vercel Edge Network
       |
       v
  [3] Next.js Middleware (middleware.ts)
       |
       +-- テナント解決: host から slug を抽出
       |     demo-kimono.kuratsugi.app -> "demo-kimono"
       |
       +-- 認証チェック:
       |     - PUBLIC_PATHS -> 通過
       |     - Cookie: kuratsugi_session -> JWT 検証
       |     - 失敗 -> /login へリダイレクト
       |
       +-- ヘッダー付与:
       |     x-tenant-slug: demo-kimono
       |     x-pathname: /dashboard
       |
       v
  [4] Page / API Route
       |
       v
  [5] Supabase Client (Service Role)
       |
       +-- SET app.tenant_id = '{tenant_uuid}'
       |
       +-- RLS が tenant_id でフィルタ
       |
       v
  [6] Response
        </code></pre>
      </section>

      <section id="directory-structure">
        <h2>ディレクトリ構成</h2>

        <pre><code>
azukari-banto-saas/
+-- src/
|   +-- app/
|   |   +-- layout.tsx                 # ルートレイアウト
|   |   +-- page.tsx                   # ルートページ（リダイレクト）
|   |   +-- globals.css                # 侘寂デザインシステム（Tailwind v4）
|   |   |
|   |   +-- login/
|   |   |   +-- page.tsx               # テナント選択 -> PINログイン
|   |   |
|   |   +-- (worker)/                  # 担当者用画面（PIN認証）
|   |   |   +-- layout.tsx             # ヘッダー付きレイアウト
|   |   |   +-- dashboard/page.tsx     # ダッシュボード
|   |   |   +-- reception/page.tsx     # 預かり登録（ウィザード形式）
|   |   |   +-- items/page.tsx         # 商品一覧
|   |   |   +-- orders/page.tsx        # 発注管理
|   |   |   +-- returns/page.tsx       # 業者からの返却受入
|   |   |   +-- shipping/page.tsx      # 顧客への返送
|   |   |   +-- paid-storage/page.tsx  # 有料預かり管理
|   |   |   +-- manual/page.tsx        # 使い方マニュアル
|   |   |
|   |   +-- admin/                     # 管理者用画面
|   |   |   +-- (auth)/                # 認証グループ（サイドバーなし）
|   |   |   |   +-- login/page.tsx     # 管理者ログイン
|   |   |   +-- (dashboard)/           # ダッシュボードグループ
|   |   |       +-- layout.tsx         # サイドバー付きレイアウト
|   |   |       +-- dashboard/page.tsx # ダッシュボード
|   |   |       +-- items/page.tsx     # 商品一覧・詳細
|   |   |       +-- statuses/page.tsx  # ステータス一覧
|   |   |       +-- partners/page.tsx  # 取引先管理
|   |   |       +-- vendors/page.tsx   # 業者管理
|   |   |       +-- customers/page.tsx # 顧客管理
|   |   |       +-- workers/page.tsx   # 担当者管理
|   |   |       +-- paid-storage/      # 有料預かり管理
|   |   |       +-- claims/page.tsx    # クレーム管理
|   |   |       +-- logs/page.tsx      # 操作ログ
|   |   |       +-- email-logs/        # メール送信ログ
|   |   |       +-- settings/page.tsx  # システム設定
|   |   |       +-- manual/page.tsx    # 使い方マニュアル
|   |   |
|   |   +-- api/                       # API Routes
|   |       +-- auth/
|   |       |   +-- worker/route.ts    # PINコード認証
|   |       |   +-- worker/remember/   # 記憶トークン
|   |       |   +-- logout/route.ts    # ログアウト
|   |       +-- tenant/route.ts        # テナント情報取得
|   |
|   +-- components/
|   |   +-- ui/                        # 共通UIコンポーネント
|   |   +-- admin/
|   |   |   +-- AdminSidebar.tsx       # 管理者サイドバー
|   |   +-- worker/
|   |       +-- Header.tsx             # 担当者ヘッダー
|   |
|   +-- hooks/
|   |   +-- usePersistedState.ts       # localStorage永続化
|   |   +-- useFocusTrap.ts            # フォーカストラップ
|   |
|   +-- lib/
|   |   +-- auth.ts                    # セッション管理（JWT署名）
|   |   +-- tenant.ts                  # テナント解決ユーティリティ
|   |   +-- rate-limit.ts              # ログイン試行制限
|   |   +-- date.ts                    # 日付ユーティリティ（JST対応）
|   |   +-- supabase/
|   |       +-- client.ts              # ブラウザ用クライアント
|   |       +-- server.ts              # サーバー用クライアント + Service Role
|   |
|   +-- types/
|   |   +-- index.ts                   # 全型定義
|   |
|   +-- middleware.ts                  # 認証ガード + テナント解決
|
+-- supabase/
|   +-- config.toml                    # Supabase CLI 設定
|   +-- migrations/
|   |   +-- 20260214000001_initial_schema.sql  # テーブル定義 + インデックス
|   |   +-- 20260214000002_rls_policies.sql    # RLS ポリシー
|   +-- seed.sql                       # 開発用シードデータ
|
+-- docs/                              # 技術ドキュメント（本ファイル群）
+-- public/                            # 静的ファイル
+-- package.json
+-- tsconfig.json
+-- CLAUDE.md                          # AI開発アシスタント向け指示
        </code></pre>

        <h3>ルートグループ構成</h3>
        <table>
          <tr><th>グループ</th><th>パス</th><th>レイアウト</th><th>認証</th></tr>
          <tr><td><code>(worker)</code></td><td><code>/dashboard</code>, <code>/reception</code>, etc.</td><td>ヘッダー付き</td><td>Worker PIN</td></tr>
          <tr><td><code>admin/(auth)</code></td><td><code>/admin/login</code></td><td>なし（認証ページ）</td><td>不要</td></tr>
          <tr><td><code>admin/(dashboard)</code></td><td><code>/admin/dashboard</code>, etc.</td><td>サイドバー付き</td><td>Admin OAuth</td></tr>
        </table>

        <h3>主要ファイル一覧</h3>
        <table>
          <tr><th>ファイル</th><th>役割</th></tr>
          <tr><td><code>src/middleware.ts</code></td><td>テナント解決 + JWT認証ガード。全リクエストを処理</td></tr>
          <tr><td><code>src/lib/auth.ts</code></td><td>JWT セッション管理（作成・取得・削除）+ Remember Token</td></tr>
          <tr><td><code>src/lib/tenant.ts</code></td><td>Server Component 用テナント slug 解決</td></tr>
          <tr><td><code>src/lib/supabase/server.ts</code></td><td>サーバー用 Supabase クライアント + Service Role</td></tr>
          <tr><td><code>src/lib/supabase/client.ts</code></td><td>ブラウザ用 Supabase クライアント</td></tr>
          <tr><td><code>src/lib/rate-limit.ts</code></td><td>IP ベースのログイン試行制限（5回/15分ウィンドウ）</td></tr>
          <tr><td><code>src/types/index.ts</code></td><td>全型定義（ステータス遷移マップ含む）</td></tr>
          <tr><td><code>src/app/globals.css</code></td><td>侘寂デザインシステム（Tailwind CSS v4）</td></tr>
        </table>
      </section>
`,

  "authentication": `
      <section id="auth-overview">
        <h2>認証システム概要</h2>

        <p>預かり番頭 SaaS は3層の認証体系を採用しています。全ての認証はテナントコンテキスト（tenant_id）を含む JWT セッションにより管理されます。</p>

        <h3>認証方式比較</h3>
        <table>
          <tr><th>項目</th><th>担当者（Worker）</th><th>管理者（Admin）</th><th>プラットフォーム管理者</th></tr>
          <tr><td>認証方式</td><td>PINコード（8桁数字）</td><td>メール / OAuth</td><td>メール認証</td></tr>
          <tr><td>PIN保管</td><td>bcrypt ハッシュ化</td><td>-</td><td>-</td></tr>
          <tr><td>セッション</td><td>JWT Cookie（8時間）</td><td>JWT Cookie（8時間）</td><td>JWT Cookie</td></tr>
          <tr><td>記憶機能</td><td>Remember Token（30日）</td><td>-</td><td>-</td></tr>
          <tr><td>テナント範囲</td><td>所属テナントのみ</td><td>所属テナントのみ</td><td>全テナント横断</td></tr>
          <tr><td>管理テーブル</td><td><code>workers</code></td><td><code>workers</code>（role: admin）</td><td><code>platform_admins</code></td></tr>
          <tr><td>ログイン制限</td><td>5回失敗で5分ロック</td><td>同左</td><td>同左</td></tr>
        </table>

        <h3>セキュリティ対策</h3>
        <table>
          <tr><th>脅威</th><th>対策</th><th>実装箇所</th></tr>
          <tr><td>ブルートフォース</td><td>IP ベースのレート制限（5回/15分）</td><td><code>src/lib/rate-limit.ts</code></td></tr>
          <tr><td>PIN 漏洩</td><td>bcryptjs によるハッシュ化保存</td><td><code>src/app/api/auth/worker/route.ts</code></td></tr>
          <tr><td>セッション改ざん</td><td>JWT HS256 署名検証</td><td><code>src/lib/auth.ts</code></td></tr>
          <tr><td>XSS によるCookie窃取</td><td>httpOnly + secure + sameSite=strict</td><td><code>src/lib/auth.ts</code></td></tr>
          <tr><td>テナント間データ漏洩</td><td>PostgreSQL RLS + tenant_id フィルタ</td><td><code>supabase/migrations/</code></td></tr>
          <tr><td>セッション有効期限切れ</td><td>JWT exp クレーム（8時間）</td><td><code>src/lib/auth.ts</code></td></tr>
          <tr><td>記憶トークン改ざん</td><td>HMAC-SHA256 署名検証</td><td><code>src/lib/auth.ts</code></td></tr>
        </table>
      </section>

      <section id="auth-flow">
        <h2>認証フロー</h2>

        <h3>担当者 PIN 認証フロー</h3>
        <pre><code>
  [ブラウザ]                    [API]                         [Supabase]
      |                          |                               |
      |  POST /api/auth/worker   |                               |
      |  {pin, tenantSlug}       |                               |
      |------------------------->|                               |
      |                          |                               |
      |                    [1] レート制限チェック                  |
      |                    (IP ベース, 5回/15分)                  |
      |                          |                               |
      |                    [2] PIN バリデーション                  |
      |                    (8桁数字チェック)                      |
      |                          |                               |
      |                          |  SELECT * FROM tenants        |
      |                          |  WHERE slug = 'demo-kimono'   |
      |                          |------------------------------>|
      |                          |  {id, name, status}           |
      |                          |<------------------------------|
      |                          |                               |
      |                    [3] テナント status = 'active' チェック |
      |                          |                               |
      |                          |  SELECT * FROM workers        |
      |                          |  WHERE tenant_id = ? AND      |
      |                          |        is_active = true       |
      |                          |------------------------------>|
      |                          |  [{worker_id, pin_hash, ...}] |
      |                          |<------------------------------|
      |                          |                               |
      |                    [4] bcrypt.compare(pin, pin_hash)     |
      |                    (全担当者をループで照合)                |
      |                          |                               |
      |                    [5] JWT セッション作成                  |
      |                    payload: {                             |
      |                      workerId, name, role,               |
      |                      tenantId, tenantSlug,               |
      |                      loginAt                             |
      |                    }                                     |
      |                          |                               |
      |                    [6] Remember Token 生成               |
      |                    (HMAC-SHA256 署名付き)                 |
      |                          |                               |
      |  Set-Cookie:             |                               |
      |  kuratsugi_session=JWT   |                               |
      |  200 {success, worker,   |                               |
      |       rememberToken}     |                               |
      |<-------------------------|                               |
        </code></pre>

        <h3>JWT セッションペイロード</h3>
        <pre><code>
{
  "workerId": "T01",
  "name": "田中太郎",
  "role": "worker",          // "worker" | "admin"
  "tenantId": "a0000000-...", // UUID
  "tenantSlug": "demo-kimono",
  "loginAt": "2026-02-14T10:00:00.000Z",
  "iat": 1739523600,         // issued at
  "exp": 1739552400          // 8時間後
}
        </code></pre>

        <h3>記憶トークン（Remember Me）</h3>
        <table>
          <tr><th>項目</th><th>仕様</th></tr>
          <tr><td>有効期間</td><td>30日間</td></tr>
          <tr><td>形式</td><td><code>{base64url_payload}.{hmac_signature}</code></td></tr>
          <tr><td>署名アルゴリズム</td><td>HMAC-SHA256</td></tr>
          <tr><td>ペイロード</td><td>workerId, name, tenantId, tenantSlug, createdAt</td></tr>
          <tr><td>用途</td><td>セッション切れ時の自動再ログイン（PIN 入力不要）</td></tr>
          <tr><td>検証</td><td>署名一致 + 有効期限チェック</td></tr>
        </table>
      </section>

      <section id="auth-middleware">
        <h2>ミドルウェア認証フロー</h2>

        <h3>処理フロー</h3>
        <pre><code>
  全リクエスト
       |
       v
  [1] テナント slug 解決
       |
       +-- 本番: host から抽出
       |   demo-kimono.kuratsugi.app -> "demo-kimono"
       |
       +-- 開発: x-tenant-slug ヘッダー
       |
       v
  [2] パスチェック
       |
       +-- PUBLIC_PATHS (/login, /api/auth/*, /api/tenant)
       |   -> テナント情報のみ付与して通過
       |
       +-- /api/* パス
       |   -> Cookie から JWT 検証
       |   -> 失敗: 401 JSON レスポンス
       |
       +-- ページパス
           -> Cookie から JWT 検証
           -> 失敗: /login へリダイレクト
           -> 成功: ヘッダー付与して通過
        </code></pre>

        <h3>公開パス一覧</h3>
        <table>
          <tr><th>パス</th><th>説明</th></tr>
          <tr><td><code>/login</code></td><td>ログインページ</td></tr>
          <tr><td><code>/api/auth/*</code></td><td>認証 API（ログイン・ログアウト）</td></tr>
          <tr><td><code>/api/tenant</code></td><td>テナント情報取得（ログイン画面で使用）</td></tr>
        </table>

        <h3>Middleware マッチャー設定</h3>
        <pre><code>
export const config = {
  matcher: [
    // 静的ファイルを除外
    '/((?!_next/static|_next/image|favicon.ico|.*\\\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
        </code></pre>

        <h3>RLS との統合</h3>
        <p>API Route では、認証済みセッションから取得した <code>tenantId</code> を Supabase のセッション変数 <code>app.tenant_id</code> に設定します。これにより RLS ポリシーがテナント単位のフィルタリングを自動的に適用します。</p>

        <pre><code>
// サーバーサイドでのテナント設定
const supabase = createServiceClient();

// Service Role はRLSをバイパスするが、
// テナント指定でのクエリを行う場合:
const { data } = await supabase
  .from('items')
  .select('*')
  .eq('tenant_id', session.tenantId);
        </code></pre>

        <h3>レート制限の詳細</h3>
        <table>
          <tr><th>パラメータ</th><th>値</th><th>説明</th></tr>
          <tr><td>MAX_ATTEMPTS</td><td>5</td><td>最大試行回数</td></tr>
          <tr><td>LOCK_DURATION</td><td>5分</td><td>ロック期間</td></tr>
          <tr><td>ATTEMPT_WINDOW</td><td>15分</td><td>試行カウントのウィンドウ</td></tr>
          <tr><td>識別子</td><td>クライアント IP</td><td>x-forwarded-for / x-real-ip</td></tr>
          <tr><td>クリーンアップ</td><td>10% 確率</td><td>リクエストごとに確率的にクリーンアップ</td></tr>
        </table>
      </section>
`,

  "database": `
      <section id="database-overview">
        <h2>データベース概要</h2>

        <p>預かり番頭 SaaS は Supabase（PostgreSQL）を使用します。全業務テーブルは <code>tenant_id</code> カラムを持ち、Row Level Security（RLS）によりテナント間のデータ分離を保証します。</p>

        <h3>スキーマ概要</h3>
        <div class="stats">
          <div class="stat-card"><div class="number">12</div><div class="label">テーブル数</div></div>
          <div class="stat-card"><div class="number">8</div><div class="label">ENUM定義</div></div>
          <div class="stat-card"><div class="number">10</div><div class="label">RLSポリシー</div></div>
          <div class="stat-card"><div class="number">17</div><div class="label">インデックス</div></div>
        </div>

        <h3>ENUM 定義一覧</h3>
        <table>
          <tr><th>ENUM名</th><th>値</th><th>用途</th></tr>
          <tr><td><code>item_status</code></td><td>draft, received, pending_ship, processing, returned, paid_storage, completed, rework, on_hold, awaiting_customer, cancelled, cancelled_completed</td><td>商品ステータス</td></tr>
          <tr><td><code>carrier_type</code></td><td>yamato, sagawa, japanpost, other</td><td>配送業者</td></tr>
          <tr><td><code>claim_status</code></td><td>open, closed</td><td>クレーム状態</td></tr>
          <tr><td><code>claim_category</code></td><td>quality, delivery, response, other</td><td>クレーム種別</td></tr>
          <tr><td><code>claim_log_action</code></td><td>opened, updated, resolved, closed, reopened</td><td>クレーム対応ログ</td></tr>
          <tr><td><code>log_action</code></td><td>create, update, delete, status_change, login, logout</td><td>操作ログ種別</td></tr>
          <tr><td><code>log_target_type</code></td><td>item, reception, customer, partner, vendor, worker, session</td><td>操作対象種別</td></tr>
          <tr><td><code>tenant_plan</code></td><td>free, standard, premium</td><td>テナントプラン</td></tr>
          <tr><td><code>tenant_status</code></td><td>active, suspended, cancelled</td><td>テナント状態</td></tr>
        </table>
      </section>

      <section id="database-tables">
        <h2>テーブル定義</h2>

        <h3>tenants（テナント管理）</h3>
        <p>プラットフォーム横断テーブル。RLS は適用しない。</p>
        <table>
          <tr><th>カラム</th><th>型</th><th>制約</th><th>説明</th></tr>
          <tr><td>id</td><td>UUID</td><td>PK, DEFAULT gen_random_uuid()</td><td>テナントID</td></tr>
          <tr><td>slug</td><td>VARCHAR(63)</td><td>UNIQUE NOT NULL</td><td>サブドメイン識別子</td></tr>
          <tr><td>name</td><td>VARCHAR(255)</td><td>NOT NULL</td><td>店舗名</td></tr>
          <tr><td>plan</td><td>tenant_plan</td><td>NOT NULL DEFAULT 'free'</td><td>契約プラン</td></tr>
          <tr><td>status</td><td>tenant_status</td><td>NOT NULL DEFAULT 'active'</td><td>テナント状態</td></tr>
          <tr><td>settings</td><td>JSONB</td><td>NOT NULL DEFAULT '{}'</td><td>テナント固有設定</td></tr>
          <tr><td>created_at</td><td>TIMESTAMPTZ</td><td>NOT NULL DEFAULT now()</td><td>作成日時</td></tr>
          <tr><td>updated_at</td><td>TIMESTAMPTZ</td><td>NOT NULL DEFAULT now()</td><td>更新日時</td></tr>
        </table>

        <h3>workers（担当者）</h3>
        <table>
          <tr><th>カラム</th><th>型</th><th>制約</th><th>説明</th></tr>
          <tr><td>id</td><td>UUID</td><td>PK</td><td>内部ID</td></tr>
          <tr><td>tenant_id</td><td>UUID</td><td>FK -> tenants(id) ON DELETE CASCADE</td><td>所属テナント</td></tr>
          <tr><td>worker_id</td><td>VARCHAR(20)</td><td>UNIQUE(tenant_id, worker_id)</td><td>担当者ID（T01等）</td></tr>
          <tr><td>name</td><td>VARCHAR(100)</td><td>NOT NULL</td><td>担当者名</td></tr>
          <tr><td>pin_hash</td><td>VARCHAR(255)</td><td>NOT NULL</td><td>PIN bcryptハッシュ</td></tr>
          <tr><td>email</td><td>VARCHAR(255)</td><td></td><td>メールアドレス</td></tr>
          <tr><td>is_active</td><td>BOOLEAN</td><td>NOT NULL DEFAULT true</td><td>有効フラグ</td></tr>
          <tr><td>last_login_at</td><td>TIMESTAMPTZ</td><td></td><td>最終ログイン</td></tr>
          <tr><td>created_at</td><td>TIMESTAMPTZ</td><td>NOT NULL DEFAULT now()</td><td>作成日時</td></tr>
          <tr><td>updated_at</td><td>TIMESTAMPTZ</td><td>NOT NULL DEFAULT now()</td><td>更新日時</td></tr>
        </table>

        <h3>items（商品 / 預かり品）</h3>
        <p>最も多くのカラムを持つ中心テーブル。</p>
        <table>
          <tr><th>カラム</th><th>型</th><th>説明</th></tr>
          <tr><td>id</td><td>UUID</td><td>内部ID（PK）</td></tr>
          <tr><td>tenant_id</td><td>UUID</td><td>FK -> tenants(id)</td></tr>
          <tr><td>item_number</td><td>VARCHAR(50)</td><td>預かり番号（テナント内ユニーク）</td></tr>
          <tr><td>reception_id</td><td>UUID</td><td>FK -> receptions(id)</td></tr>
          <tr><td>customer_name</td><td>VARCHAR(255)</td><td>顧客名（非正規化）</td></tr>
          <tr><td>customer_name_kana</td><td>VARCHAR(255)</td><td>顧客名フリガナ（検索用）</td></tr>
          <tr><td>partner_id</td><td>UUID</td><td>FK -> partners(id)</td></tr>
          <tr><td>partner_name</td><td>VARCHAR(255)</td><td>取引先名（非正規化）</td></tr>
          <tr><td>product_type</td><td>VARCHAR(50)</td><td>商品種別（着物/帯/その他）</td></tr>
          <tr><td>product_name</td><td>VARCHAR(255)</td><td>商品名・品目</td></tr>
          <tr><td>status</td><td>item_status</td><td>ステータス（DEFAULT 'draft'）</td></tr>
          <tr><td>vendor_id</td><td>UUID</td><td>FK -> vendors(id)</td></tr>
          <tr><td>scheduled_ship_date</td><td>DATE</td><td>発送予定日（業者へ）</td></tr>
          <tr><td>scheduled_return_date</td><td>DATE</td><td>返送予定日（顧客へ）</td></tr>
          <tr><td>ship_to_vendor_date</td><td>DATE</td><td>業者発送日（実績）</td></tr>
          <tr><td>return_from_vendor_date</td><td>DATE</td><td>業者返却日（実績）</td></tr>
          <tr><td>return_to_customer_date</td><td>DATE</td><td>顧客返送日（実績）</td></tr>
          <tr><td>vendor_tracking_number</td><td>VARCHAR(100)</td><td>業者発送の送り状番号</td></tr>
          <tr><td>vendor_carrier</td><td>carrier_type</td><td>業者発送の配送業者</td></tr>
          <tr><td>customer_tracking_number</td><td>VARCHAR(100)</td><td>顧客返送の送り状番号</td></tr>
          <tr><td>customer_carrier</td><td>carrier_type</td><td>顧客返送の配送業者</td></tr>
          <tr><td>photo_front_url / photo_back_url</td><td>TEXT</td><td>受入時写真URL</td></tr>
          <tr><td>photo_after_front_url / photo_after_back_url</td><td>TEXT</td><td>加工後写真URL</td></tr>
          <tr><td>additional_photos</td><td>JSONB</td><td>追加写真（DEFAULT '[]'）</td></tr>
          <tr><td>is_paid_storage</td><td>BOOLEAN</td><td>有料預かりフラグ</td></tr>
          <tr><td>is_claim_active</td><td>BOOLEAN</td><td>クレーム対応中フラグ</td></tr>
          <tr><td>is_archived</td><td>BOOLEAN</td><td>アーカイブ済みフラグ</td></tr>
          <tr><td>ship_history / return_history</td><td>JSONB</td><td>発送・返却履歴（DEFAULT '[]'）</td></tr>
          <tr><td>created_at / updated_at</td><td>TIMESTAMPTZ</td><td>日時（トリガー自動更新）</td></tr>
        </table>

        <h3>receptions（受付）</h3>
        <table>
          <tr><th>カラム</th><th>型</th><th>説明</th></tr>
          <tr><td>id</td><td>UUID</td><td>内部ID（PK）</td></tr>
          <tr><td>tenant_id</td><td>UUID</td><td>FK -> tenants(id)</td></tr>
          <tr><td>reception_number</td><td>VARCHAR(50)</td><td>受付番号（テナント内ユニーク）</td></tr>
          <tr><td>customer_id</td><td>UUID</td><td>FK -> customers(id)</td></tr>
          <tr><td>customer_name</td><td>VARCHAR(255)</td><td>顧客名</td></tr>
          <tr><td>partner_id</td><td>UUID</td><td>FK -> partners(id)</td></tr>
          <tr><td>received_date</td><td>DATE</td><td>受付日</td></tr>
          <tr><td>received_by</td><td>UUID</td><td>FK -> workers(id) 受付担当者</td></tr>
          <tr><td>item_count</td><td>INTEGER</td><td>商品数</td></tr>
          <tr><td>notes</td><td>TEXT</td><td>備考</td></tr>
        </table>

        <h3>その他のテーブル</h3>
        <table>
          <tr><th>テーブル</th><th>主要カラム</th><th>用途</th></tr>
          <tr><td><code>partners</code></td><td>partner_code, name, phone, email, address</td><td>取引先マスタ</td></tr>
          <tr><td><code>customers</code></td><td>partner_id, name, name_kana, phone, email</td><td>顧客マスタ</td></tr>
          <tr><td><code>vendors</code></td><td>vendor_id, name, specialty</td><td>加工業者マスタ</td></tr>
          <tr><td><code>claims</code></td><td>item_id, status, category, description</td><td>クレーム管理</td></tr>
          <tr><td><code>claim_logs</code></td><td>claim_id, worker_id, action, note</td><td>クレーム対応ログ</td></tr>
          <tr><td><code>operation_logs</code></td><td>worker_id, action, target_type, target_id</td><td>操作ログ</td></tr>
          <tr><td><code>tenant_settings</code></td><td>key, value</td><td>テナント個別設定</td></tr>
          <tr><td><code>platform_admins</code></td><td>email, name</td><td>プラットフォーム管理者</td></tr>
        </table>
      </section>

      <section id="database-rls">
        <h2>RLS ポリシーとサービスロール</h2>

        <h3>RLS 設計方針</h3>
        <p>全業務テーブルに対して RLS を有効化し、<code>app.tenant_id</code> セッション変数によるテナント分離を実現します。</p>

        <pre><code>
-- RLS有効化
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- テナント分離ポリシー（全操作: SELECT, INSERT, UPDATE, DELETE）
CREATE POLICY tenant_isolation ON items
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- サービスロール用ポリシー（RLSバイパス）
CREATE POLICY service_role_all ON items
  FOR ALL TO service_role USING (true);
        </code></pre>

        <h3>RLS 適用テーブル一覧</h3>
        <table>
          <tr><th>テーブル</th><th>tenant_isolation</th><th>service_role_all</th></tr>
          <tr><td>workers</td><td>適用</td><td>適用</td></tr>
          <tr><td>partners</td><td>適用</td><td>適用</td></tr>
          <tr><td>customers</td><td>適用</td><td>適用</td></tr>
          <tr><td>vendors</td><td>適用</td><td>適用</td></tr>
          <tr><td>receptions</td><td>適用</td><td>適用</td></tr>
          <tr><td>items</td><td>適用</td><td>適用</td></tr>
          <tr><td>claims</td><td>適用</td><td>適用</td></tr>
          <tr><td>claim_logs</td><td>適用</td><td>適用</td></tr>
          <tr><td>operation_logs</td><td>適用</td><td>適用</td></tr>
          <tr><td>tenant_settings</td><td>適用</td><td>適用</td></tr>
          <tr><td>tenants</td><td style="color:#7B2D26;">なし（横断テーブル）</td><td>-</td></tr>
          <tr><td>platform_admins</td><td style="color:#7B2D26;">なし（横断テーブル）</td><td>-</td></tr>
        </table>

        <h3>サービスロールの使用場面</h3>
        <table>
          <tr><th>場面</th><th>理由</th><th>実装箇所</th></tr>
          <tr><td>ログイン認証</td><td>セッション変数設定前にテナント・担当者を検索する必要がある</td><td><code>api/auth/worker/route.ts</code></td></tr>
          <tr><td>テナント情報取得</td><td>ログイン前にテナントの存在確認が必要</td><td><code>api/tenant/route.ts</code></td></tr>
          <tr><td>Cron ジョブ</td><td>全テナントを横断してアラートチェック</td><td><code>api/cron/*</code>（予定）</td></tr>
          <tr><td>プラットフォーム管理</td><td>テナント管理は横断アクセスが必要</td><td>プラットフォーム管理画面（予定）</td></tr>
        </table>

        <h3>インデックス一覧</h3>
        <table>
          <tr><th>インデックス名</th><th>テーブル</th><th>カラム</th><th>条件</th></tr>
          <tr><td>idx_workers_tenant</td><td>workers</td><td>tenant_id</td><td>-</td></tr>
          <tr><td>idx_partners_tenant</td><td>partners</td><td>tenant_id</td><td>-</td></tr>
          <tr><td>idx_customers_tenant</td><td>customers</td><td>tenant_id</td><td>-</td></tr>
          <tr><td>idx_vendors_tenant</td><td>vendors</td><td>tenant_id</td><td>-</td></tr>
          <tr><td>idx_receptions_tenant</td><td>receptions</td><td>tenant_id</td><td>-</td></tr>
          <tr><td>idx_items_tenant</td><td>items</td><td>tenant_id</td><td>-</td></tr>
          <tr><td>idx_claims_tenant</td><td>claims</td><td>tenant_id</td><td>-</td></tr>
          <tr><td>idx_claim_logs_tenant</td><td>claim_logs</td><td>tenant_id</td><td>-</td></tr>
          <tr><td>idx_operation_logs_tenant</td><td>operation_logs</td><td>tenant_id</td><td>-</td></tr>
          <tr><td>idx_tenant_settings_tenant</td><td>tenant_settings</td><td>tenant_id</td><td>-</td></tr>
          <tr><td>idx_items_status</td><td>items</td><td>tenant_id, status</td><td>WHERE NOT is_archived</td></tr>
          <tr><td>idx_items_reception</td><td>items</td><td>reception_id</td><td>-</td></tr>
          <tr><td>idx_items_archived</td><td>items</td><td>tenant_id, is_archived</td><td>WHERE is_archived</td></tr>
          <tr><td>idx_claims_status</td><td>claims</td><td>tenant_id, status</td><td>-</td></tr>
          <tr><td>idx_claim_logs_claim</td><td>claim_logs</td><td>claim_id</td><td>-</td></tr>
          <tr><td>idx_operation_logs_created</td><td>operation_logs</td><td>tenant_id, created_at DESC</td><td>-</td></tr>
          <tr><td>idx_customers_partner</td><td>customers</td><td>partner_id</td><td>-</td></tr>
        </table>

        <h3>自動更新トリガー</h3>
        <p><code>updated_at</code> カラムを持つ全テーブルに <code>update_updated_at()</code> トリガーが設定されています。UPDATE 時に自動で <code>now()</code> が設定されるため、アプリケーション側での更新は不要です。</p>
        <pre><code>
-- 対象テーブル:
-- tenants, workers, partners, customers, vendors,
-- receptions, items, tenant_settings
CREATE TRIGGER trg_{table}_updated_at
  BEFORE UPDATE ON {table}
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
        </code></pre>
      </section>
`,

  "features": `
      <section id="status-management">
        <h2>ステータス管理</h2>

        <h3>ステータス一覧（12種）</h3>
        <table>
          <tr><th>コード</th><th>表示名</th><th>説明</th><th>最終状態</th></tr>
          <tr><td><code>draft</code></td><td>顧客未設定</td><td>受付登録中。顧客紐付け前の下書き状態</td><td>-</td></tr>
          <tr><td><code>received</code></td><td>受付済</td><td>顧客紐付け完了。通常は使用しない</td><td>-</td></tr>
          <tr><td><code>pending_ship</code></td><td>業者への発送待ち</td><td>加工業者への発送を待っている状態</td><td>-</td></tr>
          <tr><td><code>processing</code></td><td>加工中</td><td>業者にて加工処理中</td><td>-</td></tr>
          <tr><td><code>returned</code></td><td>業者からの返却済</td><td>業者からの加工完了品を受け入れ済み</td><td>-</td></tr>
          <tr><td><code>paid_storage</code></td><td>有料預かり</td><td>顧客の希望により有料で保管中</td><td>-</td></tr>
          <tr><td><code>completed</code></td><td>完了</td><td>顧客へ返送済み。最終状態</td><td>完了</td></tr>
          <tr><td><code>rework</code></td><td>再加工</td><td>品質不良等により再度加工が必要</td><td>-</td></tr>
          <tr><td><code>on_hold</code></td><td>顧客への返送保留</td><td>何らかの理由で返送を保留中</td><td>-</td></tr>
          <tr><td><code>awaiting_customer</code></td><td>顧客確認待ち</td><td>顧客の確認・判断を待っている状態</td><td>-</td></tr>
          <tr><td><code>cancelled</code></td><td>キャンセル</td><td>キャンセル処理中（業者発送前のみ可能）</td><td>-</td></tr>
          <tr><td><code>cancelled_completed</code></td><td>キャンセル完了</td><td>キャンセル品の顧客返送完了。最終状態</td><td>完了</td></tr>
        </table>

        <h3>ステータス遷移図</h3>
        <pre><code>
                  +--------+
                  | draft  |
                  +---+----+
                      |
              +-------+-------+
              v               v
        +-----------+    +-----------+
        |pending_ship|    | cancelled |
        +-----+-----+    +-----+-----+
              |                 |
     +--------+--------+       v
     v        v        v  +-----------+
+---------+ +-----+ +--+  |cancelled_ |
|received | |     | |     | completed |
+---------+ |     | |     +-----------+
     |      |     | |
     v      |     | |
+-----------+     | |
| processing|&lt;----|-+
+-----+-----+    |
      |           |
  +---+---+  +---+---+
  v       v  v       |
+------+ +------+   |
|return| |on_hold|   |
| -ed  | +------+   |
+--+---+             |
   |                 |
   +--------+--------+------+
   v        v        v      v
+------+ +------+ +------+ +-------+
|complt| |paid_ | |rework| |await_ |
| -ed  | |strg  | +--+---+ |custmr |
+------+ +--+---+    |     +---+---+
             |        |        |
             v        v        v
          +------+ +------+ +------+
          |return| |procss| |complt|
          | -ed  | | -ing | | -ed  |
          +------+ +------+ +------+
        </code></pre>

        <h3>許可される遷移マップ</h3>
        <table>
          <tr><th>現在のステータス</th><th>遷移可能なステータス</th><th>備考</th></tr>
          <tr><td>draft</td><td>pending_ship, cancelled</td><td>顧客紐付けで pending_ship へ</td></tr>
          <tr><td>received</td><td>pending_ship, cancelled</td><td>業者発送前はキャンセル可能</td></tr>
          <tr><td>pending_ship</td><td>processing, received, cancelled</td><td>業者発送前はキャンセル可能</td></tr>
          <tr><td>processing</td><td>returned, on_hold</td><td>業者発送後はキャンセル不可</td></tr>
          <tr><td>returned</td><td>completed, paid_storage, rework, on_hold, awaiting_customer</td><td>多くの分岐先がある</td></tr>
          <tr><td>paid_storage</td><td>completed, returned</td><td>保管終了 or 返却</td></tr>
          <tr><td>completed</td><td>（なし）</td><td>最終状態</td></tr>
          <tr><td>rework</td><td>processing</td><td>再度加工へ</td></tr>
          <tr><td>on_hold</td><td>returned, processing</td><td>保留解除</td></tr>
          <tr><td>awaiting_customer</td><td>returned, completed</td><td>顧客確認後</td></tr>
          <tr><td>cancelled</td><td>cancelled_completed</td><td>キャンセル品の返送</td></tr>
          <tr><td>cancelled_completed</td><td>（なし）</td><td>最終状態</td></tr>
        </table>

        <div class="warning">
          <strong>キャンセル制約:</strong> キャンセルは業者への発送前（received / pending_ship）のみ可能です。業者発送後（processing 以降）はキャンセルできません。
        </div>
      </section>

      <section id="reception">
        <h2>預かり登録（受付ウィザード）</h2>

        <h3>ウィザードフロー</h3>
        <pre><code>
  Step 1: 顧客選択
     |
     +-- 取引先 -> 取引先一覧から選択 -> 顧客選択/新規登録
     |
     +-- 個人 -> 顧客選択/新規登録
     |
     v
  Step 2: 商品登録（複数可）
     |
     +-- 商品種別（着物/帯/その他）
     +-- 商品名・品目
     +-- 色・柄、素材、サイズ
     +-- 状態メモ
     +-- 依頼種別・依頼詳細
     +-- 写真撮影（表面・裏面・追加写真）
     |
     v
  Step 3: 確認・登録
     |
     +-- 受付番号の自動生成: {担当者ID}-{YYYYMMDDHHmm}
     +-- 預かり番号の自動生成: {担当者ID}-{YYYYMMDDHHmmss}-{連番}
     +-- ステータス: draft -> pending_ship（顧客紐付け時）
     |
     v
  登録完了 -> ダッシュボードへ
        </code></pre>

        <h3>商品種別と加工種別</h3>
        <table>
          <tr><th>商品種別</th><th>コード</th></tr>
          <tr><td>着物</td><td>kimono / 着物</td></tr>
          <tr><td>帯</td><td>obi / 帯</td></tr>
          <tr><td>その他</td><td>other / その他</td></tr>
        </table>

        <table>
          <tr><th>加工種別</th><th>コード</th></tr>
          <tr><td>洗い</td><td>washing / 洗い</td></tr>
          <tr><td>染め直し</td><td>dyeing / 染め直し</td></tr>
          <tr><td>仕立て直し</td><td>tailoring / 仕立て直し</td></tr>
          <tr><td>シミ抜き</td><td>stain_removal / シミ抜き</td></tr>
          <tr><td>寸法直し</td><td>alteration / 寸法直し</td></tr>
          <tr><td>その他</td><td>other / その他</td></tr>
        </table>
      </section>

      <section id="order-management">
        <h2>発注管理</h2>

        <h3>発注フロー</h3>
        <pre><code>
  pending_ship の商品一覧
       |
       v
  [1] 業者選択
       +-- 業者一覧から選択
       +-- 専門分野でフィルタ
       |
       v
  [2] 発送情報入力
       +-- 発送予定日
       +-- 送り状番号（任意）
       +-- 配送業者（ヤマト/佐川/郵便/その他）
       |
       v
  [3] ステータス更新
       pending_ship -> processing
       +-- ship_to_vendor_date に発送日を記録
       +-- ship_history に履歴追加
       |
       v
  [4] 操作ログ記録
        </code></pre>

        <h3>配送業者と追跡URL</h3>
        <table>
          <tr><th>業者</th><th>コード</th><th>追跡URL形式</th></tr>
          <tr><td>ヤマト運輸</td><td>yamato</td><td><code>https://member.kms.kuronekoyamato.co.jp/parcel/detail?pno={番号}</code></td></tr>
          <tr><td>佐川急便</td><td>sagawa</td><td><code>https://k2k.sagawa-exp.co.jp/p/web/okurijosearch.do?okurijoNo={番号}</code></td></tr>
          <tr><td>日本郵便</td><td>japanpost</td><td><code>https://trackings.post.japanpost.jp/...reqCodeNo1={番号}</code></td></tr>
          <tr><td>その他</td><td>other</td><td>リンクなし</td></tr>
        </table>
      </section>

      <section id="return-management">
        <h2>業者からの返却受入・顧客への返送</h2>

        <h3>業者からの返却受入フロー</h3>
        <pre><code>
  processing の商品一覧
       |
       v
  [1] 返却品の確認
       +-- 品質チェック
       +-- 加工後写真の撮影（表面・裏面）
       |
       v
  [2] ステータス更新
       processing -> returned
       +-- return_from_vendor_date に返却日を記録
       +-- return_history に履歴追加
       |
       v
  [3] 分岐判定
       +-- 品質OK -> 顧客返送待ち
       +-- 品質NG -> rework（再加工）
       +-- 顧客確認要 -> awaiting_customer
       +-- 有料預かり -> paid_storage
        </code></pre>

        <h3>顧客への返送フロー</h3>
        <pre><code>
  returned / awaiting_customer の商品一覧
       |
       v
  [1] 返送情報入力
       +-- 送り状番号
       +-- 配送業者
       |
       v
  [2] ステータス更新
       returned -> completed
       +-- return_to_customer_date に返送日を記録
       +-- customer_tracking_number, customer_carrier を記録
        </code></pre>
      </section>

      <section id="paid-storage">
        <h2>有料預かり管理</h2>

        <h3>有料預かりフロー</h3>
        <pre><code>
  returned の商品
       |
       v
  [1] 有料預かり設定
       +-- is_paid_storage = true
       +-- paid_storage_start_date = 設定日
       +-- status: returned -> paid_storage
       |
       v
  [2] 保管期間中
       +-- 有料預かり一覧に表示
       +-- 保管期間の計算・表示
       |
       v
  [3] 保管終了
       +-- paid_storage -> completed（顧客返送）
       +-- paid_storage -> returned（返却処理に戻す）
        </code></pre>
      </section>

      <section id="claims-management">
        <h2>クレーム管理</h2>

        <h3>クレームステータス</h3>
        <table>
          <tr><th>ステータス</th><th>表示名</th><th>説明</th></tr>
          <tr><td><code>open</code></td><td>対応中</td><td>クレーム対応進行中</td></tr>
          <tr><td><code>closed</code></td><td>完了</td><td>クレーム対応完了</td></tr>
        </table>

        <h3>クレームカテゴリ</h3>
        <table>
          <tr><th>カテゴリ</th><th>表示名</th><th>説明</th></tr>
          <tr><td><code>quality</code></td><td>品質</td><td>仕上がり品質、加工ミス、汚損など</td></tr>
          <tr><td><code>delivery</code></td><td>納期</td><td>納期遅延、発送遅延など</td></tr>
          <tr><td><code>response</code></td><td>対応</td><td>接客対応、連絡不備など</td></tr>
          <tr><td><code>other</code></td><td>その他</td><td>上記に該当しないクレーム</td></tr>
        </table>

        <h3>クレームと商品ステータスの関係</h3>
        <div class="info">
          <strong>設計方針:</strong> クレームは商品のステータスとは独立して管理されます。<code>is_claim_active</code> フラグにより、任意のステータスの商品にクレームを紐付けることができます。
        </div>

        <h3>クレーム対応ログアクション</h3>
        <table>
          <tr><th>アクション</th><th>説明</th></tr>
          <tr><td>opened</td><td>クレーム登録</td></tr>
          <tr><td>updated</td><td>対応内容の更新</td></tr>
          <tr><td>resolved</td><td>解決処理</td></tr>
          <tr><td>closed</td><td>クレーム完了</td></tr>
          <tr><td>reopened</td><td>再オープン</td></tr>
        </table>
      </section>

      <section id="alert-system">
        <h2>アラートシステム</h2>

        <h3>アラート種別</h3>
        <table>
          <tr><th>種別</th><th>コード</th><th>トリガー条件</th></tr>
          <tr><td>発送期限</td><td><code>shipment_due</code></td><td>業者への発送予定日が近づいている</td></tr>
          <tr><td>返送期限</td><td><code>return_due</code></td><td>顧客への返送予定日が近づいている</td></tr>
          <tr><td>期限超過</td><td><code>overdue</code></td><td>予定日を過ぎている</td></tr>
          <tr><td>滞留警告</td><td><code>stagnant</code></td><td>長期間ステータスが変更されていない</td></tr>
        </table>

        <h3>アラート設定</h3>
        <p>テナントごとに <code>tenant_settings</code> テーブルで設定可能:</p>
        <table>
          <tr><th>キー</th><th>デフォルト値</th><th>説明</th></tr>
          <tr><td><code>alert_days_before_due</code></td><td>3</td><td>期限の何日前にアラートを出すか</td></tr>
          <tr><td><code>archive_days_after_complete</code></td><td>90</td><td>完了後何日でアーカイブするか</td></tr>
        </table>

        <h3>優先度</h3>
        <table>
          <tr><th>優先度</th><th>コード</th><th>用途</th></tr>
          <tr><td>通常</td><td><code>normal</code></td><td>標準的な処理</td></tr>
          <tr><td>急ぎ</td><td><code>urgent</code></td><td>優先対応が必要</td></tr>
          <tr><td>特急</td><td><code>express</code></td><td>最優先での対応が必要</td></tr>
        </table>
      </section>
`,

  "development": `
      <section id="build-guide">
        <h2>ビルド・開発コマンド</h2>

        <h3>基本コマンド</h3>
        <table>
          <tr><th>コマンド</th><th>説明</th><th>備考</th></tr>
          <tr><td><code>yarn dev</code></td><td>開発サーバー起動</td><td>Turbopack 使用、ポート 3001</td></tr>
          <tr><td><code>yarn build</code></td><td>プロダクションビルド</td><td>next build</td></tr>
          <tr><td><code>yarn start</code></td><td>プロダクションサーバー起動</td><td>ポート 3001</td></tr>
          <tr><td><code>yarn lint</code></td><td>ESLint 実行</td><td>eslint-config-next</td></tr>
          <tr><td><code>yarn typecheck</code></td><td>TypeScript 型チェック</td><td>tsc --noEmit</td></tr>
        </table>

        <h3>Supabase CLI コマンド</h3>
        <table>
          <tr><th>コマンド</th><th>説明</th></tr>
          <tr><td><code>supabase start</code></td><td>ローカル Supabase 起動（Docker）</td></tr>
          <tr><td><code>supabase stop</code></td><td>ローカル Supabase 停止</td></tr>
          <tr><td><code>supabase db reset</code></td><td>DB リセット（マイグレーション + シード再適用）</td></tr>
          <tr><td><code>supabase migration new {name}</code></td><td>新しいマイグレーション作成</td></tr>
          <tr><td><code>supabase db diff</code></td><td>スキーマ差分の確認</td></tr>
        </table>

        <h3>コミット前チェックリスト</h3>
        <pre><code>
# 1. 型チェック
yarn typecheck

# 2. ビルド確認
yarn build

# 3. Lint
yarn lint

# 4. テスト（実装後）
yarn test
        </code></pre>
      </section>

      <section id="dev-environment">
        <h2>環境設定</h2>

        <h3>必要な環境変数</h3>
        <table>
          <tr><th>変数名</th><th>説明</th><th>例</th></tr>
          <tr><td><code>NEXT_PUBLIC_SUPABASE_URL</code></td><td>Supabase プロジェクト URL</td><td>https://xxxxx.supabase.co</td></tr>
          <tr><td><code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code></td><td>Supabase Anon Key（公開鍵）</td><td>eyJhbGci...</td></tr>
          <tr><td><code>SUPABASE_SERVICE_ROLE_KEY</code></td><td>Supabase Service Role Key（秘密鍵）</td><td>eyJhbGci...</td></tr>
          <tr><td><code>AUTH_SECRET</code></td><td>JWT 署名用シークレット</td><td>32文字以上のランダム文字列</td></tr>
          <tr><td><code>BASE_DOMAIN</code></td><td>ベースドメイン</td><td>kuratsugi.app</td></tr>
          <tr><td><code>NODE_ENV</code></td><td>実行環境</td><td>development / production</td></tr>
        </table>

        <h3>ローカル開発セットアップ</h3>
        <pre><code>
# 1. リポジトリクローン
git clone {repo-url}
cd azukari-banto-saas

# 2. 依存関係インストール
yarn install

# 3. 環境変数設定
cp .env.example .env.local
# .env.local を編集して各値を設定

# 4. Supabase ローカル起動（Docker Desktop 必要）
supabase start

# 5. マイグレーション適用 + シードデータ投入
supabase db reset

# 6. 開発サーバー起動
yarn dev

# 7. ブラウザでアクセス
# http://localhost:3001
# x-tenant-slug ヘッダーで テナント指定
        </code></pre>

        <h3>開発環境でのテナント指定</h3>
        <p>ローカル開発ではサブドメインを使用できないため、以下の方法でテナントを指定します:</p>
        <table>
          <tr><th>方法</th><th>説明</th></tr>
          <tr><td>ヘッダー</td><td><code>x-tenant-slug: demo-kimono</code> ヘッダーを付与</td></tr>
          <tr><td>ログインAPI</td><td>リクエストボディの <code>tenantSlug</code> フィールドで指定</td></tr>
        </table>

        <h3>マイグレーションファイル構成</h3>
        <table>
          <tr><th>ファイル</th><th>内容</th></tr>
          <tr><td><code>20260214000001_initial_schema.sql</code></td><td>ENUM定義、全テーブル作成、インデックス、トリガー</td></tr>
          <tr><td><code>20260214000002_rls_policies.sql</code></td><td>RLS有効化、テナント分離ポリシー、サービスロールポリシー</td></tr>
        </table>

        <h3>シードデータ</h3>
        <p><code>supabase/seed.sql</code> に開発用テストデータが含まれています:</p>
        <table>
          <tr><th>データ</th><th>内容</th></tr>
          <tr><td>テナント</td><td>demo-kimono（デモ着物店）、test-gofuku（テスト呉服店）</td></tr>
          <tr><td>プラットフォーム管理者</td><td>admin@kuratsugi.app</td></tr>
          <tr><td>担当者</td><td>T01 田中太郎、T02 鈴木花子</td></tr>
          <tr><td>業者</td><td>V001 着物ブレイン、V002 京都染工房</td></tr>
          <tr><td>設定</td><td>company_name、alert_days_before_due、archive_days_after_complete</td></tr>
        </table>
      </section>

      <section id="coding-standards">
        <h2>コーディング規約</h2>

        <h3>ディレクトリ命名規則</h3>
        <table>
          <tr><th>種別</th><th>規則</th><th>例</th></tr>
          <tr><td>ページ</td><td>kebab-case</td><td><code>paid-storage/page.tsx</code></td></tr>
          <tr><td>コンポーネント</td><td>PascalCase</td><td><code>AdminSidebar.tsx</code></td></tr>
          <tr><td>ユーティリティ</td><td>camelCase</td><td><code>rate-limit.ts</code></td></tr>
          <tr><td>型定義</td><td>PascalCase（型名）</td><td><code>ItemStatus</code>, <code>SessionData</code></td></tr>
          <tr><td>API Routes</td><td>kebab-case ディレクトリ + route.ts</td><td><code>api/auth/worker/route.ts</code></td></tr>
        </table>

        <h3>TypeScript 規約</h3>
        <ul>
          <li>型定義は <code>src/types/index.ts</code> に集約</li>
          <li>インターフェース名は PascalCase、プレフィックス <code>I</code> は不要</li>
          <li>ENUM 的な値はリテラル型のユニオンで定義（TypeScript の enum は使用しない）</li>
          <li>ラベルマッピングは <code>Record&lt;Type, string&gt;</code> で定義</li>
          <li>遷移ルール等のビジネスロジックは型定義ファイル内に配置</li>
        </ul>

        <h3>Supabase クライアント使い分け</h3>
        <table>
          <tr><th>場面</th><th>クライアント</th><th>インポート</th></tr>
          <tr><td>ブラウザ（Client Component）</td><td>Anon Key</td><td><code>import { createClient } from '@/lib/supabase/client'</code></td></tr>
          <tr><td>Server Component</td><td>Anon Key + Cookie</td><td><code>import { createClient } from '@/lib/supabase/server'</code></td></tr>
          <tr><td>API Route（認証前）</td><td>Service Role</td><td><code>import { createServiceClient } from '@/lib/supabase/server'</code></td></tr>
          <tr><td>Cron ジョブ</td><td>Service Role</td><td><code>import { createServiceClient } from '@/lib/supabase/server'</code></td></tr>
        </table>

        <h3>セキュリティ原則</h3>
        <ul>
          <li>API キーや PIN をハードコードしない</li>
          <li>Service Role Key はサーバーサイドでのみ使用（NEXT_PUBLIC_ プレフィックスを付けない）</li>
          <li>Cookie は httpOnly + secure + sameSite=strict</li>
          <li>全テナントアクセスには Service Role を使用し、テナント単位のアクセスは RLS を活用</li>
          <li>ユーザー入力は常にバリデーション（PIN は8桁数字、slug は英数字+ハイフン）</li>
        </ul>

        <h3>Git ブランチ運用</h3>
        <table>
          <tr><th>ブランチ</th><th>用途</th><th>ルール</th></tr>
          <tr><td><code>main</code></td><td>本番リリース</td><td>直接コミット禁止</td></tr>
          <tr><td><code>develop</code></td><td>開発統合</td><td>feature ブランチからマージ</td></tr>
          <tr><td><code>feature/*</code></td><td>機能開発</td><td>develop から分岐・マージ</td></tr>
          <tr><td><code>fix/*</code></td><td>バグ修正</td><td>develop から分岐・マージ</td></tr>
        </table>

        <h3>コミットメッセージ</h3>
        <p>コンベンショナルコミット形式。メッセージ本文は日本語:</p>
        <pre><code>
feat: 預かり登録ウィザードの実装
fix: ステータス遷移のバリデーション修正
docs: API仕様書の更新
refactor: Supabaseクライアントの共通化
test: 認証フローのユニットテスト追加
chore: 依存パッケージの更新
        </code></pre>
      </section>

      <section id="deployment">
        <h2>デプロイ</h2>

        <h3>Vercel デプロイ構成</h3>
        <table>
          <tr><th>項目</th><th>設定</th></tr>
          <tr><td>フレームワーク</td><td>Next.js（自動検出）</td></tr>
          <tr><td>ビルドコマンド</td><td><code>yarn build</code></td></tr>
          <tr><td>出力ディレクトリ</td><td><code>.next</code>（自動）</td></tr>
          <tr><td>Node.js バージョン</td><td>20.x</td></tr>
          <tr><td>ドメイン</td><td><code>*.kuratsugi.app</code>（ワイルドカード）</td></tr>
        </table>

        <h3>環境変数の設定先</h3>
        <table>
          <tr><th>変数</th><th>Vercel 環境</th><th>ローカル</th></tr>
          <tr><td>NEXT_PUBLIC_SUPABASE_URL</td><td>Production / Preview</td><td>.env.local</td></tr>
          <tr><td>NEXT_PUBLIC_SUPABASE_ANON_KEY</td><td>Production / Preview</td><td>.env.local</td></tr>
          <tr><td>SUPABASE_SERVICE_ROLE_KEY</td><td>Production / Preview</td><td>.env.local</td></tr>
          <tr><td>AUTH_SECRET</td><td>Production / Preview</td><td>.env.local</td></tr>
          <tr><td>BASE_DOMAIN</td><td>Production のみ</td><td>.env.local</td></tr>
        </table>

        <h3>テナント追加手順</h3>
        <pre><code>
-- 1. テナント登録
INSERT INTO tenants (slug, name, plan, status) VALUES
  ('new-shop', '新しい呉服店', 'standard', 'active');

-- 2. 担当者登録（PINはbcryptでハッシュ化）
INSERT INTO workers (tenant_id, worker_id, name, pin_hash) VALUES
  ('{tenant_uuid}', 'T01', '担当者名', '{bcrypt_hash}');

-- 3. DNS設定
-- new-shop.kuratsugi.app を Vercel に向ける（ワイルドカード設定済みなら不要）

-- 4. 初期設定
INSERT INTO tenant_settings (tenant_id, key, value) VALUES
  ('{tenant_uuid}', 'company_name', '新しい呉服店'),
  ('{tenant_uuid}', 'alert_days_before_due', '3');
        </code></pre>
      </section>
`
};
