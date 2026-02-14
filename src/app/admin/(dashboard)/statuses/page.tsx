export default function AdminStatusesPage() {
  const statuses = [
    { code: 'received', label: '受付済', desc: '受付直後の初期状態', color: 'bg-aitetsu/10 border-l-aitetsu' },
    { code: 'pending_ship', label: '発送待ち', desc: '業者への発送を待っている状態', color: 'bg-oudo/10 border-l-oudo' },
    { code: 'processing', label: '加工中', desc: '業者で加工処理中', color: 'bg-shu/10 border-l-shu' },
    { code: 'returned', label: '返却済', desc: '業者から返却された状態', color: 'bg-oitake/10 border-l-oitake' },
    { code: 'paid_storage', label: '有料預かり', desc: '有料で長期預かり中', color: 'bg-kin/10 border-l-kin' },
    { code: 'completed', label: '完了', desc: '顧客に返送済み', color: 'bg-oitake/10 border-l-oitake' },
    { code: 'rework', label: '再加工', desc: '加工のやり直し', color: 'bg-kokiake/10 border-l-kokiake' },
    { code: 'on_hold', label: '返送保留', desc: '顧客への返送を保留中', color: 'bg-oudo/10 border-l-oudo' },
    { code: 'awaiting_customer', label: '顧客確認待ち', desc: '顧客の確認を待っている状態', color: 'bg-oudo/10 border-l-oudo' },
    { code: 'cancelled', label: 'キャンセル', desc: 'キャンセルされた商品', color: 'bg-ginnezumi/10 border-l-ginnezumi' },
    { code: 'cancelled_completed', label: 'キャンセル完了', desc: 'キャンセル品の顧客返送済み', color: 'bg-ginnezumi/10 border-l-ginnezumi' },
  ];

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-mincho text-sumi">ステータス一覧</h2>

      {/* 基本フロー */}
      <section>
        <h3 className="text-sm font-bold text-aitetsu mb-3 border-l-4 border-shu pl-3">
          基本フロー
        </h3>
        <div className="flex flex-wrap items-center gap-2 mb-4 text-sm">
          <span className="px-3 py-1 bg-aitetsu/10 border border-aitetsu/30">受付済</span>
          <span className="text-ginnezumi">&rarr;</span>
          <span className="px-3 py-1 bg-oudo/10 border border-oudo/30">発送待ち</span>
          <span className="text-ginnezumi">&rarr;</span>
          <span className="px-3 py-1 bg-shu/10 border border-shu/30">加工中</span>
          <span className="text-ginnezumi">&rarr;</span>
          <span className="px-3 py-1 bg-oitake/10 border border-oitake/30">返却済</span>
          <span className="text-ginnezumi">&rarr;</span>
          <span className="px-3 py-1 bg-oitake/10 border border-oitake/30">完了</span>
        </div>
      </section>

      {/* ステータス一覧 */}
      <section>
        <h3 className="text-sm font-bold text-aitetsu mb-3 border-l-4 border-aitetsu pl-3">
          全ステータス
        </h3>
        <div className="space-y-2">
          {statuses.map((status) => (
            <div
              key={status.code}
              className={`card border-l-4 ${status.color}`}
            >
              <div className="card-body py-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sumi">{status.label}</p>
                  <p className="text-xs text-aitetsu">{status.desc}</p>
                </div>
                <code className="text-xs text-ginnezumi bg-shironeri px-2 py-1">
                  {status.code}
                </code>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
