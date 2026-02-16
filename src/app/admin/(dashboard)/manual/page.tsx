'use client';

import Link from 'next/link';
import { adminPath } from '@/lib/admin-path';

const icons = {
  shield: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
  chartBar: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  users: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  cog: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  clipboardList: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  ),
  exclamation: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  envelope: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  ),
  lightBulb: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
    </svg>
  ),
  wrench: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.42 15.17l-5.645 5.645a2.356 2.356 0 11-3.332-3.332l5.645-5.645m2.332 2.332A3 3 0 0012 12.75a3 3 0 002.905-2.245L18.75 6.36l-2.652.75L15.376 5l-4.142 4.142M14.58 12.83l5.645-5.645a2.356 2.356 0 013.332 3.332l-5.645 5.645m-2.332-2.332A3 3 0 0012 15.25a3 3 0 00-2.905 2.245L5.25 21.64l2.652-.75L8.624 23l4.142-4.142" />
    </svg>
  ),
};

/**
 * 管理者マニュアルページ
 */
export default function AdminManualPage() {
  return (
    <div className="p-6 pb-8 max-w-4xl">
      <div className="mb-6">
        <Link href={adminPath('/dashboard')} className="text-sm text-shu hover:underline mb-2 inline-block">
          &larr; ダッシュボードに戻る
        </Link>
        <h1 className="text-2xl font-mincho text-sumi">管理者マニュアル</h1>
        <p className="text-sm text-ginnezumi mt-1">管理者向けの操作ガイドです</p>
      </div>

      <div className="space-y-8">

        {/* 管理者の役割 */}
        <section className="card p-4 bg-aitetsu/5 border-2 border-aitetsu">
          <h2 className="font-medium text-lg text-sumi mb-3 flex items-center gap-2">
            {icons.shield('w-5 h-5 text-aitetsu')}
            管理者の役割
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="bg-aitetsu text-white text-xs px-2 py-1 rounded flex-shrink-0">監視</span>
              <div className="text-sumi text-sm">
                <span className="font-medium">アラートと期限の確認</span>
                <div className="text-sm text-ginnezumi mt-0.5">ダッシュボードで発送超過・返送超過・長期滞留を毎日確認してください</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-aitetsu text-white text-xs px-2 py-1 rounded flex-shrink-0">管理</span>
              <div className="text-sumi text-sm">
                <span className="font-medium">マスタデータの維持</span>
                <div className="text-sm text-ginnezumi mt-0.5">取引先・業者・顧客・担当者の情報を最新に保ちます</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-aitetsu text-white text-xs px-2 py-1 rounded flex-shrink-0">対応</span>
              <div className="text-sumi text-sm">
                <span className="font-medium">クレーム管理と例外処理</span>
                <div className="text-sm text-ginnezumi mt-0.5">現場で対応できない問題の解決、ステータスの強制変更など</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-aitetsu text-white text-xs px-2 py-1 rounded flex-shrink-0">設定</span>
              <div className="text-sumi text-sm">
                <span className="font-medium">システム設定の調整</span>
                <div className="text-sm text-ginnezumi mt-0.5">アラート条件、期限日数、メール配信設定などの管理</div>
              </div>
            </div>
          </div>
        </section>

        {/* サイドバーメニュー対応表 */}
        <section>
          <h2 className="font-medium text-lg text-sumi mb-4 flex items-center gap-2">
            <span className="bg-shu text-white text-xs px-2 py-1 rounded">基本</span>
            メニューと機能の対応表
          </h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-shironeri">
                <tr>
                  <th className="px-3 py-2 text-left text-ginnezumi font-normal">メニュー</th>
                  <th className="px-3 py-2 text-left text-ginnezumi font-normal">機能概要</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-usuzumi/10">
                <tr><td className="px-3 py-2 font-medium text-sumi">ダッシュボード</td><td className="px-3 py-2 text-ginnezumi">アラート・ワークフロー進捗・統計情報の一覧</td></tr>
                <tr><td className="px-3 py-2 font-medium text-sumi">ステータス一覧</td><td className="px-3 py-2 text-ginnezumi">ステータスの種類と遷移フローの確認（リファレンス）</td></tr>
                <tr><td className="px-3 py-2 font-medium text-sumi">クレーム管理</td><td className="px-3 py-2 text-ginnezumi">クレーム一覧・対応ログ・解決管理</td></tr>
                <tr><td className="px-3 py-2 font-medium text-sumi">有料預かり管理</td><td className="px-3 py-2 text-ginnezumi">有料預かり商品の確認・管理</td></tr>
                <tr><td className="px-3 py-2 font-medium text-sumi">取引先管理</td><td className="px-3 py-2 text-ginnezumi">取引先（社内・社外）の登録・編集</td></tr>
                <tr><td className="px-3 py-2 font-medium text-sumi">業者管理</td><td className="px-3 py-2 text-ginnezumi">加工業者の登録・住所管理・有効/無効切替</td></tr>
                <tr><td className="px-3 py-2 font-medium text-sumi">顧客管理</td><td className="px-3 py-2 text-ginnezumi">顧客情報の登録・編集</td></tr>
                <tr><td className="px-3 py-2 font-medium text-sumi">担当者管理</td><td className="px-3 py-2 text-ginnezumi">担当者ID・PIN・メール設定</td></tr>
                <tr><td className="px-3 py-2 font-medium text-sumi">テナント管理</td><td className="px-3 py-2 text-ginnezumi">テナント（店舗）の一覧・新規作成・分離URL設定</td></tr>
                <tr><td className="px-3 py-2 font-medium text-sumi">操作ログ</td><td className="px-3 py-2 text-ginnezumi">操作履歴・ログイン履歴の確認</td></tr>
                <tr><td className="px-3 py-2 font-medium text-sumi">メール送信履歴</td><td className="px-3 py-2 text-ginnezumi">アラートメールの送信履歴確認</td></tr>
                <tr><td className="px-3 py-2 font-medium text-sumi">使い方マニュアル</td><td className="px-3 py-2 text-ginnezumi">このページ（管理者向け操作ガイド）</td></tr>
                <tr><td className="px-3 py-2 font-medium text-sumi">システム設定</td><td className="px-3 py-2 text-ginnezumi">アラート・期限・メール・自動アーカイブの設定</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 1. ダッシュボード */}
        <section className="card p-4 bg-kinari border-2 border-shu">
          <h2 className="font-medium text-lg text-sumi mb-4 flex items-center gap-2">
            <span className="w-8 h-8 flex items-center justify-center bg-shu text-white rounded-full">
              {icons.chartBar('w-5 h-5')}
            </span>
            1. ダッシュボード
          </h2>

          <div className="space-y-4">
            {/* アラートカード */}
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm font-medium text-kokiake mb-3 flex items-center gap-2">
                {icons.exclamation('w-4 h-4')}
                アラートカード
              </div>
              <p className="text-sm text-ginnezumi mb-3">
                対応が必要な商品数を表示します。数値が<span className="text-kokiake font-medium">赤色</span>の場合は早急な対応が必要です。
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="bg-kokiake/10 text-kokiake text-xs px-2 py-0.5 rounded whitespace-nowrap">発送予定超過</span>
                  <span className="text-ginnezumi">受付後、設定日数以内に業者へ発送されていない商品</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-kokiake/10 text-kokiake text-xs px-2 py-0.5 rounded whitespace-nowrap">返送予定超過</span>
                  <span className="text-ginnezumi">返却後、返送予定日を過ぎても顧客に返送されていない商品</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-oudo/10 text-oudo text-xs px-2 py-0.5 rounded whitespace-nowrap">長期滞留</span>
                  <span className="text-ginnezumi">設定日数以上、同じステータスに留まっている商品</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-oudo/10 text-oudo text-xs px-2 py-0.5 rounded whitespace-nowrap">返送保留</span>
                  <span className="text-ginnezumi">顧客への返送が保留中の商品</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-kokiake/10 text-kokiake text-xs px-2 py-0.5 rounded whitespace-nowrap">クレーム対応中</span>
                  <span className="text-ginnezumi">未解決のクレームがある商品</span>
                </div>
              </div>
              <div className="mt-3 bg-shironeri rounded p-3 text-sm text-aitetsu">
                <span className="font-medium">ヒント：</span>各カードの数値をクリックすると、該当する商品の一覧に遷移します。
              </div>
            </div>

            {/* ワークフロー進捗 */}
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm font-medium text-aitetsu mb-3">ワークフロー進捗</div>
              <p className="text-sm text-ginnezumi mb-2">
                現在の各ステータスにある商品数を確認できます。
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-aitetsu/10 border border-aitetsu/30">受付済</span>
                <span className="text-ginnezumi">&rarr;</span>
                <span className="px-2 py-1 bg-oudo/10 border border-oudo/30">発送待ち</span>
                <span className="text-ginnezumi">&rarr;</span>
                <span className="px-2 py-1 bg-shu/10 border border-shu/30">加工中</span>
                <span className="text-ginnezumi">&rarr;</span>
                <span className="px-2 py-1 bg-oitake/10 border border-oitake/30">返却済</span>
                <span className="text-ginnezumi">&rarr;</span>
                <span className="px-2 py-1 bg-oitake/10 border border-oitake/30">完了</span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. 商品管理 */}
        <section className="card p-4 bg-kinari border-2 border-oitake">
          <h2 className="font-medium text-lg text-sumi mb-4 flex items-center gap-2">
            <span className="w-8 h-8 flex items-center justify-center bg-oitake text-white rounded-full">
              {icons.clipboardList('w-5 h-5')}
            </span>
            2. 商品一覧・詳細
          </h2>

          <div className="space-y-4">
            {/* タブ */}
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm font-medium text-aitetsu mb-3">3つのタブ</div>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="bg-oitake text-white text-xs px-2 py-0.5 rounded whitespace-nowrap">全商品</span>
                  <span className="text-ginnezumi">すべての商品を検索・フィルタリングできます</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-kokiake text-white text-xs px-2 py-0.5 rounded whitespace-nowrap">アラート</span>
                  <span className="text-ginnezumi">期限超過の商品のみ表示します（アラートカードと連動）</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-oudo text-white text-xs px-2 py-0.5 rounded whitespace-nowrap">予定管理</span>
                  <span className="text-ginnezumi">発送予定・返送予定を日付順に確認できます</span>
                </div>
              </div>
            </div>

            {/* 検索 */}
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm font-medium text-aitetsu mb-3">検索・フィルタリング</div>
              <div className="space-y-2 text-sm text-ginnezumi">
                <p><span className="font-medium text-sumi">検索ボックス：</span>預かり番号、取引先名、顧客名で検索できます（部分一致）。</p>
                <p><span className="font-medium text-sumi">ステータス絞り込み：</span>プルダウンで特定のステータスのみ表示できます。</p>
              </div>
            </div>

            {/* 管理者の特権 */}
            <div className="bg-white rounded-lg p-4 border-l-4 border-l-kokiake">
              <div className="text-sm font-medium text-kokiake mb-2">管理者のみの操作</div>
              <ul className="text-sm text-ginnezumi space-y-1 list-disc list-inside">
                <li>ステータスの強制変更（担当者は決められた遷移のみ可能）</li>
                <li>完了済み・キャンセル済み商品のアーカイブ</li>
                <li>商品情報の全フィールド編集</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3. マスタ管理 */}
        <section className="card p-4 bg-kinari border-2 border-aitetsu">
          <h2 className="font-medium text-lg text-sumi mb-4 flex items-center gap-2">
            <span className="w-8 h-8 flex items-center justify-center bg-aitetsu text-white rounded-full">
              {icons.users('w-5 h-5')}
            </span>
            3. マスタ管理
          </h2>

          <div className="space-y-4">
            {/* 取引先管理 */}
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm font-medium text-aitetsu mb-3 border-l-4 border-aitetsu pl-2">取引先管理</div>
              <div className="text-sm text-ginnezumi space-y-2">
                <p>商品の受け渡し窓口となる取引先を管理します。</p>
                <div className="bg-shironeri rounded p-3">
                  <p className="font-medium text-sumi mb-1">登録項目：</p>
                  <ul className="text-ginnezumi space-y-1 list-disc list-inside">
                    <li><span className="font-medium text-sumi">取引先名</span>（必須）</li>
                    <li><span className="font-medium text-sumi">種別</span>：社内 or 社外（フィルタに利用）</li>
                    <li><span className="font-medium text-sumi">有効/無効</span>：無効にすると受付時の選択肢に表示されません</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 業者管理 */}
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm font-medium text-aitetsu mb-3 border-l-4 border-shu pl-2">業者管理</div>
              <div className="text-sm text-ginnezumi space-y-2">
                <p>加工を依頼する業者を管理します。発注管理の指示書に住所が印刷されます。</p>
                <div className="bg-shironeri rounded p-3">
                  <p className="font-medium text-sumi mb-1">登録項目：</p>
                  <ul className="text-ginnezumi space-y-1 list-disc list-inside">
                    <li><span className="font-medium text-sumi">業者名</span>（必須）</li>
                    <li><span className="font-medium text-sumi">郵便番号・住所</span>：指示書の宛先に使用</li>
                    <li><span className="font-medium text-sumi">電話番号</span></li>
                    <li><span className="font-medium text-sumi">有効/無効</span>：無効にすると受付時に選択できません</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 顧客管理 */}
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm font-medium text-aitetsu mb-3 border-l-4 border-oudo pl-2">顧客管理</div>
              <div className="text-sm text-ginnezumi space-y-2">
                <p>預かり品の持ち主である顧客を管理します。</p>
                <div className="bg-shironeri rounded p-3">
                  <p className="font-medium text-sumi mb-1">登録項目：</p>
                  <ul className="text-ginnezumi space-y-1 list-disc list-inside">
                    <li><span className="font-medium text-sumi">顧客名</span>（必須）</li>
                    <li><span className="font-medium text-sumi">電話番号</span></li>
                    <li><span className="font-medium text-sumi">住所</span></li>
                    <li><span className="font-medium text-sumi">メモ</span>：お客様の特記事項</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 担当者管理 */}
            <div className="bg-white rounded-lg p-4 border-l-4 border-l-kokiake">
              <div className="text-sm font-medium text-kokiake mb-3">担当者管理（重要）</div>
              <div className="text-sm text-ginnezumi space-y-2">
                <p>現場でシステムを操作する担当者を管理します。</p>
                <div className="bg-shironeri rounded p-3">
                  <p className="font-medium text-sumi mb-1">登録項目：</p>
                  <ul className="text-ginnezumi space-y-1 list-disc list-inside">
                    <li><span className="font-medium text-sumi">担当者ID</span>（例：T01）- 預かり番号の先頭に使用</li>
                    <li><span className="font-medium text-sumi">担当者名</span>（必須）</li>
                    <li><span className="font-medium text-sumi">PINコード</span>（8桁）- ログインに使用</li>
                    <li><span className="font-medium text-sumi">有効/無効</span>：無効でログイン不可</li>
                  </ul>
                </div>
                <div className="bg-kokiake/10 rounded p-3 text-kokiake text-sm mt-2">
                  <span className="font-medium">注意：</span>PINコードは一度設定すると画面上で確認できません。忘れた場合は新しいPINを再設定してください。
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. テナント管理 */}
        <section className="card p-4 bg-kinari border-2 border-oitake">
          <h2 className="font-medium text-lg text-sumi mb-4 flex items-center gap-2">
            <span className="bg-oitake text-white text-xs px-3 py-1 rounded">4</span>
            テナント管理
          </h2>
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-ginnezumi space-y-2">
                <p>テナント（店舗）の管理を行います。各テナントには4桁の16進数ID（例: A3F0）が割り当てられます。</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4">
              <div className="text-sm font-medium text-aitetsu mb-3 border-l-4 border-oitake pl-2">テナント一覧</div>
              <div className="text-sm text-ginnezumi space-y-2">
                <p>登録されている全テナントの情報を一覧で確認できます。</p>
                <div className="bg-shironeri rounded p-3">
                  <p className="font-medium text-sumi mb-1">表示項目：</p>
                  <ul className="text-ginnezumi space-y-1 list-disc list-inside">
                    <li><span className="font-medium text-sumi">テナントID</span>：4桁の16進数コード</li>
                    <li><span className="font-medium text-sumi">店舗名</span></li>
                    <li><span className="font-medium text-sumi">プラン</span>：free / standard / premium</li>
                    <li><span className="font-medium text-sumi">ステータス</span>：有効 / 停止中 / 解約済</li>
                    <li><span className="font-medium text-sumi">分離状態</span>：SaaS（共有）または分離済み（専用URL）</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4">
              <div className="text-sm font-medium text-aitetsu mb-3 border-l-4 border-shu pl-2">新規テナント作成</div>
              <div className="text-sm text-ginnezumi space-y-2">
                <p>「+ 新規テナント」ボタンから新しい店舗を登録できます。</p>
                <div className="bg-shironeri rounded p-3">
                  <p className="font-medium text-sumi mb-1">入力項目：</p>
                  <ul className="text-ginnezumi space-y-1 list-disc list-inside">
                    <li><span className="font-medium text-sumi">店舗名</span>（必須）</li>
                    <li><span className="font-medium text-sumi">テナントID</span>（必須）：4桁の16進数（0-9, A-F）</li>
                    <li><span className="font-medium text-sumi">プラン</span>：free / standard / premium（デフォルト: free）</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4">
              <div className="text-sm font-medium text-aitetsu mb-3 border-l-4 border-oudo pl-2">分離URL設定</div>
              <div className="text-sm text-ginnezumi space-y-2">
                <p>各テナントの「編集」ボタンから、分離先URLを設定できます。</p>
                <div className="bg-shironeri rounded p-3">
                  <p className="font-medium text-sumi mb-1">分離URLとは：</p>
                  <p className="text-ginnezumi">テナントを専用ドメインに分離する際のリダイレクト先URLです。設定するとそのテナントへのアクセスは専用URLにリダイレクトされます。URLをクリアするとSaaS（共有）に戻ります。</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. クレーム管理 */}
        <section className="card p-4 bg-kinari border-2 border-kokiake">
          <h2 className="font-medium text-lg text-sumi mb-4 flex items-center gap-2">
            <span className="w-8 h-8 flex items-center justify-center bg-kokiake text-white rounded-full">
              {icons.exclamation('w-5 h-5')}
            </span>
            5. クレーム管理
          </h2>

          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-ginnezumi space-y-2">
                <p>クレームの登録・対応経過の記録・解決管理を行います。</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4">
              <div className="text-sm font-medium text-aitetsu mb-3">2つのタブ</div>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="bg-kokiake text-white text-xs px-2 py-0.5 rounded whitespace-nowrap">対応中</span>
                  <span className="text-ginnezumi">現在対応が必要なクレーム一覧</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-ginnezumi text-white text-xs px-2 py-0.5 rounded whitespace-nowrap">解決済</span>
                  <span className="text-ginnezumi">対応が完了したクレーム一覧</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4">
              <div className="text-sm font-medium text-aitetsu mb-3">クレーム対応の流れ</div>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-3">
                  <span className="bg-kokiake text-white text-xs px-2 py-1 rounded shrink-0">1</span>
                  <div><span className="font-medium text-sumi">クレーム発生</span><span className="text-ginnezumi"> - 商品詳細画面で「クレーム対応中」をONにして内容を記録</span></div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-kokiake text-white text-xs px-2 py-1 rounded shrink-0">2</span>
                  <div><span className="font-medium text-sumi">対応経過を記録</span><span className="text-ginnezumi"> - クレーム管理画面で対応ログを追加</span></div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-kokiake text-white text-xs px-2 py-1 rounded shrink-0">3</span>
                  <div><span className="font-medium text-sumi">解決</span><span className="text-ginnezumi"> - 解決後にステータスを「解決済」に変更</span></div>
                </div>
              </div>
              <div className="mt-3 bg-shironeri rounded p-3 text-sm text-aitetsu">
                <span className="font-medium">ポイント：</span>対応経過はできるだけ詳しく記録してください。後から確認する際に重要です。
              </div>
            </div>
          </div>
        </section>

        {/* 6. 有料預かり管理 */}
        <section className="card p-4">
          <h2 className="font-medium text-lg text-sumi mb-4 flex items-center gap-2">
            <span className="bg-kin text-white text-xs px-3 py-1 rounded">6</span>
            有料預かり管理
          </h2>
          <div className="space-y-3 text-sm text-ginnezumi">
            <p>返送予定日を過ぎても返送されず、猶予日数を超過した商品が「有料預かり」となります。</p>
            <div className="bg-shironeri rounded p-3">
              <div className="text-sm font-medium text-sumi mb-2">3つのタブ：</div>
              <div className="space-y-1">
                <div><span className="font-medium text-sumi">登録：</span>有料預かりとして新規登録する商品</div>
                <div><span className="font-medium text-sumi">預かり中：</span>現在有料預かり中の商品と預かり日数</div>
                <div><span className="font-medium text-sumi">完了：</span>有料預かりから顧客に返送済みの商品</div>
              </div>
            </div>
            <div className="bg-oudo/10 rounded p-3 text-oudo text-sm">
              <span className="font-medium">設定：</span>猶予日数はシステム設定 &rarr; 有料預かり設定で変更できます（初期値：7日）。
            </div>
          </div>
        </section>

        {/* 7. 操作ログ */}
        <section className="card p-4">
          <h2 className="font-medium text-lg text-sumi mb-4 flex items-center gap-2">
            <span className="bg-aitetsu text-white text-xs px-3 py-1 rounded">7</span>
            操作ログ
          </h2>
          <div className="space-y-3 text-sm text-ginnezumi">
            <p>担当者が行ったすべての操作をログとして記録・閲覧できます。</p>

            <div className="bg-shironeri rounded p-3">
              <div className="text-sm font-medium text-sumi mb-2">2つのタブ：</div>
              <div className="space-y-1">
                <div><span className="font-medium text-sumi">操作ログ：</span>受付登録、発送、返却、返送、ステータス変更などの操作</div>
                <div><span className="font-medium text-sumi">ログイン履歴：</span>いつ、誰が、どのデバイスからログインしたか</div>
              </div>
            </div>

            <div className="bg-shironeri rounded p-3">
              <div className="text-sm font-medium text-sumi mb-2">フィルタリング：</div>
              <div className="space-y-1">
                <div><span className="font-medium text-sumi">日付範囲：</span>開始日〜終了日で期間を絞り込み</div>
                <div><span className="font-medium text-sumi">担当者：</span>特定の担当者の操作のみ表示</div>
                <div><span className="font-medium text-sumi">操作種別：</span>特定の種類の操作のみ表示</div>
              </div>
            </div>
          </div>
        </section>

        {/* 8. メール送信履歴 */}
        <section className="card p-4">
          <h2 className="font-medium text-lg text-sumi mb-4 flex items-center gap-2">
            <span className="w-8 h-8 flex items-center justify-center bg-oitake text-white rounded-full">
              {icons.envelope('w-5 h-5')}
            </span>
            8. メール送信履歴
          </h2>
          <div className="space-y-3 text-sm text-ginnezumi">
            <p>システムが自動送信したアラートメールの履歴を確認できます。</p>

            <div className="bg-shironeri rounded p-3">
              <div className="text-sm font-medium text-sumi mb-2">メールの種類：</div>
              <div className="space-y-1">
                <div><span className="font-medium text-sumi">業者発送催促：</span>発送期限を超過した商品の通知</div>
                <div><span className="font-medium text-sumi">返送遅延通知：</span>返送予定日を超過した商品の通知</div>
                <div><span className="font-medium text-sumi">有料預かり通知：</span>有料預かり猶予期間超過の通知</div>
              </div>
            </div>

            <p>メールが届いていない場合は、ここで送信状況を確認し、システム設定のメールアドレスを確認してください。</p>
          </div>
        </section>

        {/* 9. システム設定 */}
        <section className="card p-4 bg-kinari border-2 border-oudo">
          <h2 className="font-medium text-lg text-sumi mb-4 flex items-center gap-2">
            <span className="w-8 h-8 flex items-center justify-center bg-oudo text-white rounded-full">
              {icons.cog('w-5 h-5')}
            </span>
            9. システム設定
          </h2>

          <div className="space-y-4">
            {/* アラート設定 */}
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm font-medium text-aitetsu mb-3 border-l-4 border-kokiake pl-2">アラート設定</div>
              <div className="text-sm text-ginnezumi space-y-2">
                <div className="flex items-start gap-2">
                  <span className="font-medium text-sumi whitespace-nowrap">メール送信：</span>
                  <span>ON/OFFを切り替えできます。OFFにするとアラートメールが停止します。</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium text-sumi whitespace-nowrap">送信先：</span>
                  <span>カンマ区切りで複数のメールアドレスを指定できます。</span>
                </div>
              </div>
            </div>

            {/* 期限設定 */}
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm font-medium text-aitetsu mb-3 border-l-4 border-oudo pl-2">期限設定</div>
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-shironeri">
                    <tr>
                      <th className="px-3 py-2 text-left text-ginnezumi font-normal">項目</th>
                      <th className="px-3 py-2 text-left text-ginnezumi font-normal">初期値</th>
                      <th className="px-3 py-2 text-left text-ginnezumi font-normal">説明</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-usuzumi/10">
                    <tr>
                      <td className="px-3 py-2 font-medium text-sumi">発送期限</td>
                      <td className="px-3 py-2 text-aitetsu">7日</td>
                      <td className="px-3 py-2 text-ginnezumi">受付後、この日数以内に発送しないとアラート</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-medium text-sumi">返送期限</td>
                      <td className="px-3 py-2 text-aitetsu">14日</td>
                      <td className="px-3 py-2 text-ginnezumi">返却後、この日数以内に返送しないとアラート</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-medium text-sumi">長期滞留閾値</td>
                      <td className="px-3 py-2 text-aitetsu">30日</td>
                      <td className="px-3 py-2 text-ginnezumi">同一ステータスでこの日数を超えるとアラート</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-medium text-sumi">自動アーカイブ</td>
                      <td className="px-3 py-2 text-aitetsu">365日</td>
                      <td className="px-3 py-2 text-ginnezumi">完了後この日数を超えた商品を自動アーカイブ</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 有料預かり設定 */}
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm font-medium text-aitetsu mb-3 border-l-4 border-kin pl-2">有料預かり設定</div>
              <div className="text-sm text-ginnezumi space-y-2">
                <div className="flex items-start gap-2">
                  <span className="font-medium text-sumi whitespace-nowrap">猶予日数：</span>
                  <span>返送予定日からこの日数を超過すると有料預かり対象になります（初期値：7日）。</span>
                </div>
              </div>
            </div>

            <div className="bg-oudo/10 rounded p-3 text-sm text-oudo">
              <span className="font-medium">重要：</span>設定を変更したら必ず「設定を保存」ボタンをクリックしてください。保存しないと変更は反映されません。
            </div>
          </div>
        </section>

        {/* 日常の確認フロー */}
        <section>
          <h2 className="font-medium text-lg text-sumi mb-4 flex items-center gap-2">
            <span className="bg-shu text-white text-xs px-2 py-1 rounded">推奨</span>
            日常の確認フロー
          </h2>

          <div className="card p-4">
            <div className="flex flex-col items-center space-y-1">
              <div className="w-full max-w-md bg-shu/10 border-2 border-shu rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 flex items-center justify-center bg-shu text-white rounded-full font-bold text-lg flex-shrink-0">1</span>
                  <div className="flex-1">
                    <div className="font-medium text-sumi">ダッシュボードを確認</div>
                    <div className="text-sm text-ginnezumi">アラートカードに赤い数字がないか確認</div>
                  </div>
                </div>
              </div>

              <div className="text-2xl text-shu font-bold">&darr;</div>

              <div className="w-full max-w-md bg-kokiake/10 border-2 border-kokiake rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 flex items-center justify-center bg-kokiake text-white rounded-full font-bold text-lg flex-shrink-0">2</span>
                  <div className="flex-1">
                    <div className="font-medium text-sumi">アラート対応</div>
                    <div className="text-sm text-ginnezumi">超過商品があれば担当者に声をかける or 対応する</div>
                  </div>
                </div>
              </div>

              <div className="text-2xl text-kokiake font-bold">&darr;</div>

              <div className="w-full max-w-md bg-oudo/10 border-2 border-oudo rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 flex items-center justify-center bg-oudo text-white rounded-full font-bold text-lg flex-shrink-0">3</span>
                  <div className="flex-1">
                    <div className="font-medium text-sumi">クレーム確認</div>
                    <div className="text-sm text-ginnezumi">対応中のクレームがあれば進捗を確認・記録</div>
                  </div>
                </div>
              </div>

              <div className="text-2xl text-oudo font-bold">&darr;</div>

              <div className="w-full max-w-md bg-ginnezumi/10 border-2 border-ginnezumi rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 flex items-center justify-center bg-ginnezumi text-white rounded-full font-bold text-lg flex-shrink-0">4</span>
                  <div className="flex-1">
                    <div className="font-medium text-sumi">メールログ確認（週1回程度）</div>
                    <div className="text-sm text-ginnezumi">アラートメールが正しく送信されているか確認</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ステータス早見表 */}
        <section>
          <h2 className="font-medium text-lg text-sumi mb-4 flex items-center gap-2">
            <span className="bg-ginnezumi text-white text-xs px-2 py-1 rounded">参考</span>
            ステータス早見表
          </h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-shironeri">
                <tr>
                  <th className="px-3 py-2 text-left text-ginnezumi font-normal">ステータス</th>
                  <th className="px-3 py-2 text-left text-ginnezumi font-normal">コード</th>
                  <th className="px-3 py-2 text-left text-ginnezumi font-normal">説明</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-usuzumi/10">
                <tr><td className="px-3 py-2"><span className="bg-aitetsu/10 text-aitetsu px-2 py-0.5 rounded text-xs whitespace-nowrap">受付済</span></td><td className="px-3 py-2 font-mono text-xs text-ginnezumi">received</td><td className="px-3 py-2 text-ginnezumi">受付直後の初期状態</td></tr>
                <tr><td className="px-3 py-2"><span className="bg-oudo/10 text-oudo px-2 py-0.5 rounded text-xs whitespace-nowrap">発送待ち</span></td><td className="px-3 py-2 font-mono text-xs text-ginnezumi">pending_ship</td><td className="px-3 py-2 text-ginnezumi">業者への発送を待っている</td></tr>
                <tr><td className="px-3 py-2"><span className="bg-shu/10 text-shu px-2 py-0.5 rounded text-xs whitespace-nowrap">加工中</span></td><td className="px-3 py-2 font-mono text-xs text-ginnezumi">processing</td><td className="px-3 py-2 text-ginnezumi">業者で加工処理中</td></tr>
                <tr><td className="px-3 py-2"><span className="bg-oitake/10 text-oitake px-2 py-0.5 rounded text-xs whitespace-nowrap">返却済</span></td><td className="px-3 py-2 font-mono text-xs text-ginnezumi">returned</td><td className="px-3 py-2 text-ginnezumi">業者から返却、顧客返送待ち</td></tr>
                <tr><td className="px-3 py-2"><span className="bg-kin/10 text-kin px-2 py-0.5 rounded text-xs whitespace-nowrap">有料預かり</span></td><td className="px-3 py-2 font-mono text-xs text-ginnezumi">paid_storage</td><td className="px-3 py-2 text-ginnezumi">有料で長期預かり中</td></tr>
                <tr><td className="px-3 py-2"><span className="bg-oitake/10 text-oitake px-2 py-0.5 rounded text-xs whitespace-nowrap">完了</span></td><td className="px-3 py-2 font-mono text-xs text-ginnezumi">completed</td><td className="px-3 py-2 text-ginnezumi">顧客に返送済み</td></tr>
                <tr><td className="px-3 py-2"><span className="bg-kokiake/10 text-kokiake px-2 py-0.5 rounded text-xs whitespace-nowrap">再加工</span></td><td className="px-3 py-2 font-mono text-xs text-ginnezumi">rework</td><td className="px-3 py-2 text-ginnezumi">加工のやり直し</td></tr>
                <tr><td className="px-3 py-2"><span className="bg-oudo/10 text-oudo px-2 py-0.5 rounded text-xs whitespace-nowrap">返送保留</span></td><td className="px-3 py-2 font-mono text-xs text-ginnezumi">on_hold</td><td className="px-3 py-2 text-ginnezumi">顧客への返送を保留中</td></tr>
                <tr><td className="px-3 py-2"><span className="bg-oudo/10 text-oudo px-2 py-0.5 rounded text-xs whitespace-nowrap">顧客確認待ち</span></td><td className="px-3 py-2 font-mono text-xs text-ginnezumi">awaiting_customer</td><td className="px-3 py-2 text-ginnezumi">顧客の確認待ち</td></tr>
                <tr><td className="px-3 py-2"><span className="bg-ginnezumi/10 text-ginnezumi px-2 py-0.5 rounded text-xs whitespace-nowrap">キャンセル</span></td><td className="px-3 py-2 font-mono text-xs text-ginnezumi">cancelled</td><td className="px-3 py-2 text-ginnezumi">キャンセル品</td></tr>
                <tr><td className="px-3 py-2"><span className="bg-ginnezumi/10 text-ginnezumi px-2 py-0.5 rounded text-xs whitespace-nowrap">キャンセル完了</span></td><td className="px-3 py-2 font-mono text-xs text-ginnezumi">cancelled_completed</td><td className="px-3 py-2 text-ginnezumi">キャンセル品の顧客返送済み</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* よくある質問 */}
        <section>
          <h2 className="font-medium text-lg text-sumi mb-4 flex items-center gap-2">
            {icons.lightBulb('w-5 h-5 text-oudo')}
            よくある質問
          </h2>
          <div className="space-y-3">
            {[
              { q: '担当者のPINコードを忘れた', a: '担当者管理から該当の担当者を選び、新しいPINコードを設定してください。旧PINは確認できません。' },
              { q: 'アラートメールが届かない', a: 'システム設定でメール送信がONになっているか、送信先メールアドレスが正しいかを確認してください。メール送信ログも確認してください。' },
              { q: '完了した商品が一覧に表示されない', a: '商品一覧のフィルターで「すべてのステータス」を選択してください。初期状態では完了・キャンセルは非表示です。' },
              { q: '担当者を削除したい', a: '担当者は削除ではなく「無効化」してください。過去のログとの関連を保持するために削除はできません。' },
              { q: 'ステータスを強制的に変更したい', a: '商品詳細画面から管理者権限でステータスを直接変更できます。通常の遷移ルールを無視して任意のステータスに変更可能です。' },
              { q: '操作ログはどのくらい保持される？', a: 'すべてのログが永続的に保存されます。古いログを削除する機能はありません。' },
              { q: '複数のタブ・端末で同時にログインできる？', a: 'はい、管理者アカウントは複数のブラウザ・端末から同時にログインできます。' },
              { q: '設定の変更が反映されない', a: '「設定を保存」ボタンを押したか確認してください。ブラウザを再読み込みしても反映されない場合は、一度ログアウトして再ログインしてください。' },
            ].map((item, i) => (
              <div key={i} className="card p-3">
                <p className="font-medium text-sumi flex items-center gap-2">
                  <span className="text-aitetsu">Q.</span>{item.q}
                </p>
                <p className="text-sm text-ginnezumi mt-1 ml-5">
                  <span className="text-aitetsu font-medium">A.</span> {item.a}
                </p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
