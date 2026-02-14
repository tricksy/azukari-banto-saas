'use client';

import Link from 'next/link';

const icons = {
  warning: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  book: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  arrowUpTray: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  ),
  arrowDownTray: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  ),
  gift: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H4.5a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  ),
  tag: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6h.008v.008H6V6z" />
    </svg>
  ),
  bookmark: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
    </svg>
  ),
  search: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  ),
  lightBulb: (className: string) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
    </svg>
  ),
};

/**
 * 取扱説明書ページ（現場担当者向け）
 */
export default function ManualPage() {
  return (
    <div className="p-6 pb-8">
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-shu hover:underline mb-2 inline-block">
          &larr; ダッシュボードに戻る
        </Link>
        <h1 className="text-2xl font-mincho text-sumi">取扱説明書</h1>
        <p className="text-sm text-ginnezumi mt-1">困ったときはここを見てください</p>
      </div>

      <div className="space-y-8">

        {/* 気をつけること */}
        <section className="card p-4 bg-kokiake/5 border-2 border-kokiake">
          <h2 className="font-medium text-lg text-sumi mb-3 flex items-center gap-2">
            {icons.warning('w-5 h-5 text-kokiake')}
            気をつけること
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="bg-kokiake text-white text-xs px-2 py-1 rounded flex-shrink-0">必須</span>
              <div className="text-sumi text-sm">
                <span className="font-medium text-kokiake">業者からの返却時は必ず写真を撮る</span>
                <div className="text-sm text-ginnezumi mt-0.5">後からクレームがあったときの証拠になります</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-kokiake text-white text-xs px-2 py-1 rounded flex-shrink-0">重要</span>
              <div className="text-sumi text-sm">
                <span className="font-medium text-kokiake">赤い表示の商品は優先対応</span>
                <div className="text-sm text-ginnezumi mt-0.5">期限超過の商品です。お客様をお待たせしています</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-oudo text-white text-xs px-2 py-1 rounded flex-shrink-0">注意</span>
              <div className="text-sumi text-sm">
                <span className="font-medium">クレームは必ず記録する</span>
                <div className="text-sm text-ginnezumi mt-0.5">口頭で済ませると後から確認できません。システムに入力してください</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-ginnezumi text-white text-xs px-2 py-1 rounded flex-shrink-0">確認</span>
              <div className="text-sumi text-sm">
                <span className="font-medium">困ったら管理者に聞く</span>
                <div className="text-sm text-ginnezumi mt-0.5">無理に操作せず、確認してから対応してください</div>
              </div>
            </div>
          </div>
        </section>

        {/* 用語説明 */}
        <section className="card p-4 bg-kinari border-2 border-aitetsu">
          <h2 className="font-medium text-lg text-sumi mb-4 flex items-center gap-2">
            <span className="w-8 h-8 flex items-center justify-center bg-aitetsu text-white rounded-full">
              {icons.book('w-5 h-5')}
            </span>
            用語について
          </h2>
          <p className="text-sm text-ginnezumi mb-4">
            混同しやすい3つの用語を覚えてください。
          </p>

          <div className="bg-white rounded-lg p-4 mb-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center bg-shu/20 rounded-full flex-shrink-0">
                  {icons.arrowUpTray('w-6 h-6 text-shu')}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-shu text-base">業者への発注</span>
                    <span className="bg-shu/10 text-shu text-xs px-2 py-0.5 rounded">メニュー：発注管理</span>
                  </div>
                  <div className="text-sm text-ginnezumi mt-0.5">当店 &rarr; 加工業者へ商品を送る</div>
                </div>
              </div>
              <div className="flex justify-center"><span className="text-ginnezumi text-lg">&darr;</span></div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center bg-oudo/20 rounded-full flex-shrink-0">
                  {icons.arrowDownTray('w-6 h-6 text-oudo')}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-oudo text-base">業者からの返却</span>
                    <span className="bg-oudo/10 text-oudo text-xs px-2 py-0.5 rounded">メニュー：業者からの返却</span>
                  </div>
                  <div className="text-sm text-ginnezumi mt-0.5">加工業者 &rarr; 当店へ商品が届く</div>
                </div>
              </div>
              <div className="flex justify-center"><span className="text-ginnezumi text-lg">&darr;</span></div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center bg-oitake/20 rounded-full flex-shrink-0">
                  {icons.gift('w-6 h-6 text-oitake')}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-oitake text-base">顧客への返送</span>
                    <span className="bg-oitake/10 text-oitake text-xs px-2 py-0.5 rounded">メニュー：返送管理</span>
                  </div>
                  <div className="text-sm text-ginnezumi mt-0.5">当店 &rarr; 顧客へ商品を渡す</div>
                </div>
              </div>
            </div>
          </div>

          {/* 番号の種類 */}
          <div className="bg-white rounded-lg p-4 mb-4">
            <div className="text-sm font-medium text-aitetsu mb-3 flex items-center gap-2">
              {icons.tag('w-4 h-4')}
              番号の種類
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="border border-aitetsu/30 rounded p-3">
                <span className="font-bold text-aitetsu">受付番号</span>
                <div className="text-xs text-ginnezumi font-mono bg-shironeri px-2 py-1 rounded my-1">T01-202601181430</div>
                <span className="text-ginnezumi">1回の受付をまとめる「親番号」</span>
              </div>
              <div className="border border-aitetsu/30 rounded p-3">
                <span className="font-bold text-aitetsu">預かり番号</span>
                <div className="text-xs text-ginnezumi font-mono bg-shironeri px-2 py-1 rounded my-1">T01-20260118143025-01</div>
                <span className="text-ginnezumi">商品1点ごとの「子番号」</span>
              </div>
            </div>
          </div>

          {/* ステータス名 */}
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm font-medium text-aitetsu mb-3 flex items-center gap-2">
              {icons.bookmark('w-4 h-4')}
              ステータス名
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="bg-shu/10 text-shu px-3 py-1 rounded-full text-xs font-medium">業者への発送待ち</span>
              <span className="bg-oitake/10 text-oitake px-3 py-1 rounded-full text-xs font-medium">加工中</span>
              <span className="bg-oudo/10 text-oudo px-3 py-1 rounded-full text-xs font-medium">業者からの返却済</span>
              <span className="bg-oudo/20 text-oudo px-3 py-1 rounded-full text-xs font-medium">有料預かり</span>
              <span className="bg-kokiake/10 text-kokiake px-3 py-1 rounded-full text-xs font-medium">返送保留</span>
              <span className="bg-ginnezumi/20 text-ginnezumi px-3 py-1 rounded-full text-xs font-medium">完了</span>
              <span className="bg-usuzumi/20 text-usuzumi px-3 py-1 rounded-full text-xs font-medium">キャンセル</span>
            </div>
          </div>
        </section>

        {/* メニュー対応表 */}
        <section>
          <h2 className="font-medium text-lg text-sumi mb-4 flex items-center gap-2">
            <span className="bg-shu text-white text-xs px-2 py-1 rounded">基本</span>
            メニューと操作の対応表
          </h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-shironeri">
                <tr>
                  <th className="px-3 py-2 text-left text-ginnezumi font-normal">メニュー</th>
                  <th className="px-3 py-2 text-left text-ginnezumi font-normal">操作内容</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-usuzumi/10">
                <tr><td className="px-3 py-2 font-medium text-sumi">ダッシュボード</td><td className="px-3 py-2 text-ginnezumi">全体の状況確認、新規預かり登録の開始</td></tr>
                <tr><td className="px-3 py-2 font-medium text-sumi">商品検索</td><td className="px-3 py-2 text-ginnezumi">特定の商品を探す、詳細を見る・編集する</td></tr>
                <tr><td className="px-3 py-2 font-medium text-sumi">発注管理</td><td className="px-3 py-2 text-ginnezumi"><span className="font-medium text-shu">業者への発注</span>登録、加工指示書の印刷</td></tr>
                <tr><td className="px-3 py-2 font-medium text-sumi">業者からの返却</td><td className="px-3 py-2 text-ginnezumi"><span className="font-medium text-oudo">業者からの返却</span>受入登録（写真必須）</td></tr>
                <tr><td className="px-3 py-2 font-medium text-sumi">返送管理</td><td className="px-3 py-2 text-ginnezumi"><span className="font-medium text-oitake">顧客への返送</span>完了登録、再加工・例外処理</td></tr>
                <tr><td className="px-3 py-2 font-medium text-sumi">有料預かり管理</td><td className="px-3 py-2 text-ginnezumi">長期保管商品の管理、有料預かり登録</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 商品検索 */}
        <section className="card p-4 bg-kinari border-2 border-oitake">
          <h2 className="font-medium text-lg text-sumi mb-4 flex items-center gap-2">
            <span className="w-8 h-8 flex items-center justify-center bg-oitake text-white rounded-full">
              {icons.search('w-5 h-5')}
            </span>
            商品検索の使い方
          </h2>
          <div className="bg-white rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <span className="bg-oitake text-white text-xs px-2 py-1 rounded shrink-0">1</span>
              <div><div className="font-medium text-sumi">預かり番号で検索</div><div className="text-sm text-ginnezumi">番号の一部でもOK</div></div>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-oitake text-white text-xs px-2 py-1 rounded shrink-0">2</span>
              <div><div className="font-medium text-sumi">顧客名で検索</div><div className="text-sm text-ginnezumi">名前の一部でもOK</div></div>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-oitake text-white text-xs px-2 py-1 rounded shrink-0">3</span>
              <div><div className="font-medium text-sumi">ステータスで絞り込み</div><div className="text-sm text-ginnezumi">完了・キャンセルも見るなら「すべて」を選択</div></div>
            </div>
          </div>
        </section>

        {/* 基本の流れ */}
        <section>
          <h2 className="font-medium text-lg text-sumi mb-4 flex items-center gap-2">
            <span className="bg-shu text-white text-xs px-2 py-1 rounded">通常</span>
            基本の流れ（4ステップ）
          </h2>

          <div className="card p-4">
            <div className="flex flex-col items-center space-y-1">
              {/* STEP 1 */}
              <div className="w-full max-w-md bg-shu/10 border-2 border-shu rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 flex items-center justify-center bg-shu text-white rounded-full font-bold text-lg flex-shrink-0">1</span>
                  <div className="flex-1">
                    <div className="font-medium text-sumi text-base">顧客から預かる</div>
                    <div className="text-sm text-ginnezumi">ダッシュボード &rarr;「新規預かり登録」</div>
                  </div>
                </div>
                <div className="mt-3 ml-13 bg-white rounded p-2 text-sm">
                  <ol className="text-ginnezumi space-y-1 list-decimal list-inside">
                    <li><span className="font-medium text-sumi">写真を撮る（表面・裏面の2枚は必須）</span></li>
                    <li><span className="font-medium text-sumi">顧客・商品の情報を入力</span></li>
                    <li><span className="font-medium text-sumi">加工内容・業者を選択</span></li>
                    <li><span className="font-medium text-sumi">「登録」ボタンをタップ</span></li>
                  </ol>
                </div>
                <div className="mt-2 ml-13 text-sm text-kokiake">登録後：「業者への発送待ち」</div>
              </div>

              <div className="text-2xl text-shu font-bold">&darr;</div>

              {/* STEP 2 */}
              <div className="w-full max-w-md bg-oitake/10 border-2 border-oitake rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 flex items-center justify-center bg-oitake text-white rounded-full font-bold text-lg flex-shrink-0">2</span>
                  <div className="flex-1">
                    <div className="font-medium text-sumi text-base">業者への発注</div>
                    <div className="text-sm text-ginnezumi">メニュー &rarr;「発注管理」</div>
                  </div>
                </div>
                <div className="mt-3 ml-13 bg-white rounded p-2 text-sm">
                  <ol className="text-ginnezumi space-y-1 list-decimal list-inside">
                    <li><span className="font-medium text-sumi">送る商品にチェック</span></li>
                    <li><span className="font-medium text-sumi">「発送登録」ボタン</span></li>
                    <li><span className="font-medium text-sumi">指示書を印刷</span></li>
                    <li><span className="font-medium text-sumi">商品と指示書を梱包して発送</span></li>
                  </ol>
                </div>
                <div className="mt-2 ml-13 text-sm text-kokiake">登録後：「加工中」</div>
              </div>

              <div className="text-2xl text-oitake font-bold">&darr;</div>

              {/* STEP 3 */}
              <div className="w-full max-w-md bg-oudo/10 border-2 border-oudo rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 flex items-center justify-center bg-oudo text-white rounded-full font-bold text-lg flex-shrink-0">3</span>
                  <div className="flex-1">
                    <div className="font-medium text-sumi text-base">業者からの返却を受ける</div>
                    <div className="text-sm text-ginnezumi">メニュー &rarr;「業者からの返却」</div>
                  </div>
                </div>
                <div className="mt-3 ml-13 bg-white rounded p-2 text-sm">
                  <ol className="text-ginnezumi space-y-1 list-decimal list-inside">
                    <li><span className="font-medium text-sumi">商品の状態を確認</span></li>
                    <li className="text-kokiake"><span className="font-medium">写真を撮る（必須）</span></li>
                    <li><span className="font-medium text-sumi">返送予定日を入力</span></li>
                    <li><span className="font-medium text-sumi">「登録」ボタン</span></li>
                  </ol>
                </div>
                <div className="mt-2 ml-13 text-sm text-kokiake">登録後：「業者からの返却済」</div>
              </div>

              <div className="text-2xl text-oudo font-bold">&darr;</div>

              {/* STEP 4 */}
              <div className="w-full max-w-md bg-ginnezumi/10 border-2 border-ginnezumi rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 flex items-center justify-center bg-ginnezumi text-white rounded-full font-bold text-lg flex-shrink-0">4</span>
                  <div className="flex-1">
                    <div className="font-medium text-sumi text-base">顧客への返送</div>
                    <div className="text-sm text-ginnezumi">メニュー &rarr;「返送管理」</div>
                  </div>
                </div>
                <div className="mt-3 ml-13 bg-white rounded p-2 text-sm">
                  <ol className="text-ginnezumi space-y-1 list-decimal list-inside">
                    <li><span className="font-medium text-sumi">渡す商品にチェック</span></li>
                    <li><span className="font-medium text-sumi">顧客へ発送</span></li>
                    <li><span className="font-medium text-sumi">「返送登録」ボタン</span></li>
                  </ol>
                </div>
                <div className="mt-2 ml-13 text-sm text-kokiake">登録後：「完了」</div>
              </div>
            </div>
          </div>
        </section>

        {/* 例外フロー */}
        <section>
          <h2 className="font-medium text-lg text-sumi mb-4 flex items-center gap-2">
            <span className="bg-oudo text-white text-xs px-2 py-1 rounded">例外</span>
            特別なケース
          </h2>

          <div className="space-y-4">
            <div className="card p-4">
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 flex items-center justify-center bg-oudo text-white rounded-full font-bold text-sm flex-shrink-0">A</span>
                <div><h3 className="font-medium text-sumi">再加工が必要なとき</h3><p className="text-sm text-ginnezumi mt-1">返送管理 &rarr; 商品選択 &rarr;「再加工」ボタン &rarr; STEP2から再開</p></div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 flex items-center justify-center bg-oudo text-white rounded-full font-bold text-sm flex-shrink-0">B</span>
                <div><h3 className="font-medium text-sumi">返送予定日が決まらないとき</h3><p className="text-sm text-ginnezumi mt-1">有料預かり管理 &rarr; 商品選択 &rarr;「有料預かり登録」&rarr; 日程決まり次第STEP4で完了</p></div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 flex items-center justify-center bg-kokiake text-white rounded-full font-bold text-sm flex-shrink-0">C</span>
                <div><h3 className="font-medium text-sumi">返送を保留にしたいとき</h3><p className="text-sm text-ginnezumi mt-1">返送管理 &rarr; 商品選択 &rarr;「例外処理」&rarr;「保留」or「顧客確認待ち」を選択</p></div>
              </div>
            </div>

            <div className="card p-4 border-l-4 border-l-kokiake">
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 flex items-center justify-center bg-kokiake text-white rounded-full font-bold text-sm flex-shrink-0">D</span>
                <div>
                  <h3 className="font-medium text-sumi">クレームが発生したとき</h3>
                  <p className="text-sm text-ginnezumi mt-1">商品検索 &rarr; 商品詳細 &rarr;「クレーム対応中」ONにして内容を入力</p>
                  <p className="text-sm text-kokiake mt-1 font-medium">※クレームは必ず記録してください</p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 flex items-center justify-center bg-ginnezumi text-white rounded-full font-bold text-sm flex-shrink-0">E</span>
                <div>
                  <h3 className="font-medium text-sumi">預かりをキャンセルするとき</h3>
                  <p className="text-sm text-ginnezumi mt-1">発注管理 &rarr;「注文取消」&rarr; 返送管理のキャンセルタブで返送登録</p>
                  <p className="text-sm text-kokiake mt-1">※業者発注後（加工中）はキャンセルできません。管理者に連絡してください</p>
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
                  <th className="px-3 py-2 text-left text-ginnezumi font-normal">意味</th>
                  <th className="px-3 py-2 text-left text-ginnezumi font-normal">次にやること</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-usuzumi/10">
                <tr><td className="px-3 py-2"><span className="bg-shu/10 text-shu px-2 py-0.5 rounded text-xs whitespace-nowrap">発送待ち</span></td><td className="px-3 py-2 text-ginnezumi">業者への発注前</td><td className="px-3 py-2 text-sumi">発注管理で発送登録</td></tr>
                <tr><td className="px-3 py-2"><span className="bg-oitake/10 text-oitake px-2 py-0.5 rounded text-xs whitespace-nowrap">加工中</span></td><td className="px-3 py-2 text-ginnezumi">業者が作業中</td><td className="px-3 py-2 text-sumi">業者からの返却を待つ</td></tr>
                <tr><td className="px-3 py-2"><span className="bg-oudo/10 text-oudo px-2 py-0.5 rounded text-xs whitespace-nowrap">返却済</span></td><td className="px-3 py-2 text-ginnezumi">顧客への返送待ち</td><td className="px-3 py-2 text-sumi">返送管理で完了登録</td></tr>
                <tr><td className="px-3 py-2"><span className="bg-oudo/20 text-oudo px-2 py-0.5 rounded text-xs whitespace-nowrap">有料預かり</span></td><td className="px-3 py-2 text-ginnezumi">長期保管中</td><td className="px-3 py-2 text-sumi">顧客連絡待ち or 返送</td></tr>
                <tr><td className="px-3 py-2"><span className="bg-shu/10 text-shu px-2 py-0.5 rounded text-xs whitespace-nowrap">再加工</span></td><td className="px-3 py-2 text-ginnezumi">再度業者へ発注必要</td><td className="px-3 py-2 text-sumi">発注管理で発送登録</td></tr>
                <tr><td className="px-3 py-2"><span className="bg-kokiake/10 text-kokiake px-2 py-0.5 rounded text-xs whitespace-nowrap">保留</span></td><td className="px-3 py-2 text-ginnezumi">再加工検討中</td><td className="px-3 py-2 text-sumi">再加工 or 返送</td></tr>
                <tr><td className="px-3 py-2"><span className="bg-kokiake/10 text-kokiake px-2 py-0.5 rounded text-xs whitespace-nowrap">顧客確認待ち</span></td><td className="px-3 py-2 text-ginnezumi">返送時期確認中</td><td className="px-3 py-2 text-sumi">返送 or 有料預かり</td></tr>
                <tr className="bg-shironeri/50"><td className="px-3 py-2"><span className="bg-ginnezumi/20 text-ginnezumi px-2 py-0.5 rounded text-xs whitespace-nowrap">完了</span></td><td className="px-3 py-2 text-ginnezumi">顧客へ返送済み</td><td className="px-3 py-2 text-sumi">対応不要</td></tr>
                <tr><td className="px-3 py-2"><span className="bg-ginnezumi/20 text-ginnezumi px-2 py-0.5 rounded text-xs whitespace-nowrap">キャンセル</span></td><td className="px-3 py-2 text-ginnezumi">取りやめ</td><td className="px-3 py-2 text-sumi">返送管理で返送登録</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* よくある質問 */}
        <section>
          <h2 className="font-medium text-lg text-sumi mb-4">よくある質問</h2>
          <div className="space-y-3">
            {[
              { q: '商品が見つからない', a: '「商品検索」でステータスを「すべて」にして検索してください。初期状態ではキャンセル・完了の商品は表示されません。' },
              { q: '写真を大きく見たい', a: 'サムネイル画像をタップすると全画面で表示されます。' },
              { q: '間違えて登録してしまった', a: '商品詳細画面で情報を変更できます。大きな間違いは管理者に連絡してください。' },
              { q: '指示書を再印刷したい', a: '「商品検索」→ 商品詳細画面 →「加工指示書印刷」ボタンで何度でも印刷できます。' },
              { q: '赤い表示が出ている', a: '期限が近いか超過している商品です。早めに対応してください。' },
              { q: '業者への発注後にキャンセルしたい', a: '加工中の商品はシステム上でキャンセルできません。管理者に連絡してください。' },
              { q: 'ログアウトしたい', a: '画面右上の名前をタップ →「ログアウト」をタップしてください。' },
              { q: '別の店舗にログインしたい', a: 'ログアウト後、別のURLからアクセスしてください。各店舗ごとにURLが異なります。' },
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
