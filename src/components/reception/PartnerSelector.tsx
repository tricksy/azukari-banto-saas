'use client';

import { useState, useEffect, useMemo } from 'react';

interface PartnerSelectorProps {
  onSelect: (partner: { id: string; name: string; partner_code: string }) => void;
  onCancel: () => void;
}

interface PartnerData {
  id: string;
  partner_name: string;
  partner_code: string;
  name_kana?: string;
  contact_person?: string;
}

/**
 * 五十音のグループ定義
 * name_kanaの先頭文字（全角カタカナに正規化済み）でフィルタリング
 */
const GOJUON_GROUPS: { label: string; chars: string[] }[] = [
  { label: '全て', chars: [] },
  { label: 'あ', chars: ['ア', 'イ', 'ウ', 'エ', 'オ'] },
  { label: 'か', chars: ['カ', 'キ', 'ク', 'ケ', 'コ', 'ガ', 'ギ', 'グ', 'ゲ', 'ゴ'] },
  { label: 'さ', chars: ['サ', 'シ', 'ス', 'セ', 'ソ', 'ザ', 'ジ', 'ズ', 'ゼ', 'ゾ'] },
  { label: 'た', chars: ['タ', 'チ', 'ツ', 'テ', 'ト', 'ダ', 'ヂ', 'ヅ', 'デ', 'ド'] },
  { label: 'な', chars: ['ナ', 'ニ', 'ヌ', 'ネ', 'ノ'] },
  { label: 'は', chars: ['ハ', 'ヒ', 'フ', 'ヘ', 'ホ', 'バ', 'ビ', 'ブ', 'ベ', 'ボ', 'パ', 'ピ', 'プ', 'ペ', 'ポ'] },
  { label: 'ま', chars: ['マ', 'ミ', 'ム', 'メ', 'モ'] },
  { label: 'や', chars: ['ヤ', 'ユ', 'ヨ'] },
  { label: 'ら', chars: ['ラ', 'リ', 'ル', 'レ', 'ロ'] },
  { label: 'わ', chars: ['ワ', 'ヲ', 'ン'] },
];

/**
 * ひらがなを全角カタカナに変換
 */
function hiraganaToKatakana(str: string): string {
  return str.replace(/[\u3041-\u3096]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) + 0x60)
  );
}

/**
 * 半角カタカナを全角カタカナに変換
 */
function halfToFullKatakana(str: string): string {
  const halfMap: Record<string, string> = {
    'ｦ': 'ヲ', 'ｧ': 'ァ', 'ｨ': 'ィ', 'ｩ': 'ゥ', 'ｪ': 'ェ', 'ｫ': 'ォ',
    'ｬ': 'ャ', 'ｭ': 'ュ', 'ｮ': 'ョ', 'ｯ': 'ッ', 'ｰ': 'ー', 'ｱ': 'ア',
    'ｲ': 'イ', 'ｳ': 'ウ', 'ｴ': 'エ', 'ｵ': 'オ', 'ｶ': 'カ', 'ｷ': 'キ',
    'ｸ': 'ク', 'ｹ': 'ケ', 'ｺ': 'コ', 'ｻ': 'サ', 'ｼ': 'シ', 'ｽ': 'ス',
    'ｾ': 'セ', 'ｿ': 'ソ', 'ﾀ': 'タ', 'ﾁ': 'チ', 'ﾂ': 'ツ', 'ﾃ': 'テ',
    'ﾄ': 'ト', 'ﾅ': 'ナ', 'ﾆ': 'ニ', 'ﾇ': 'ヌ', 'ﾈ': 'ネ', 'ﾉ': 'ノ',
    'ﾊ': 'ハ', 'ﾋ': 'ヒ', 'ﾌ': 'フ', 'ﾍ': 'ヘ', 'ﾎ': 'ホ', 'ﾏ': 'マ',
    'ﾐ': 'ミ', 'ﾑ': 'ム', 'ﾒ': 'メ', 'ﾓ': 'モ', 'ﾔ': 'ヤ', 'ﾕ': 'ユ',
    'ﾖ': 'ヨ', 'ﾗ': 'ラ', 'ﾘ': 'リ', 'ﾙ': 'ル', 'ﾚ': 'レ', 'ﾛ': 'ロ',
    'ﾜ': 'ワ', 'ﾝ': 'ン',
  };
  // 濁点・半濁点の結合
  const dakutenMap: Record<string, string> = {
    'ｶﾞ': 'ガ', 'ｷﾞ': 'ギ', 'ｸﾞ': 'グ', 'ｹﾞ': 'ゲ', 'ｺﾞ': 'ゴ',
    'ｻﾞ': 'ザ', 'ｼﾞ': 'ジ', 'ｽﾞ': 'ズ', 'ｾﾞ': 'ゼ', 'ｿﾞ': 'ゾ',
    'ﾀﾞ': 'ダ', 'ﾁﾞ': 'ヂ', 'ﾂﾞ': 'ヅ', 'ﾃﾞ': 'デ', 'ﾄﾞ': 'ド',
    'ﾊﾞ': 'バ', 'ﾋﾞ': 'ビ', 'ﾌﾞ': 'ブ', 'ﾍﾞ': 'ベ', 'ﾎﾞ': 'ボ',
    'ﾊﾟ': 'パ', 'ﾋﾟ': 'ピ', 'ﾌﾟ': 'プ', 'ﾍﾟ': 'ペ', 'ﾎﾟ': 'ポ',
    'ｳﾞ': 'ヴ',
  };

  let result = str;
  // 濁点・半濁点の結合を先に処理
  for (const [half, full] of Object.entries(dakutenMap)) {
    result = result.replaceAll(half, full);
  }
  // 単独文字の変換
  for (const [half, full] of Object.entries(halfMap)) {
    result = result.replaceAll(half, full);
  }
  return result;
}

/**
 * name_kanaを正規化（全角カタカナ統一）
 */
function normalizeKana(str: string | undefined): string {
  if (!str) return '';
  return halfToFullKatakana(hiraganaToKatakana(str));
}

/**
 * 取引先選択コンポーネント
 *
 * 検索ボックス + 五十音インデックスで取引先を絞り込む。
 */
export function PartnerSelector({ onSelect, onCancel }: PartnerSelectorProps) {
  const [partners, setPartners] = useState<PartnerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKanaGroup, setSelectedKanaGroup] = useState(0); // 0 = 全て

  useEffect(() => {
    async function fetchPartners() {
      try {
        const res = await fetch('/api/partners');
        if (!res.ok) throw new Error('取引先の取得に失敗しました');
        const data = await res.json();
        setPartners(data.partners || data || []);
      } catch {
        setError('取引先の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    }
    fetchPartners();
  }, []);

  const filteredPartners = useMemo(() => {
    let result = partners;

    // テキスト検索
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => {
        const name = (p.partner_name || '').toLowerCase();
        const kana = (p.name_kana || '').toLowerCase();
        const contact = (p.contact_person || '').toLowerCase();
        return name.includes(q) || kana.includes(q) || contact.includes(q);
      });
    }

    // 五十音フィルタ
    if (selectedKanaGroup > 0) {
      const group = GOJUON_GROUPS[selectedKanaGroup];
      result = result.filter((p) => {
        const normalizedKana = normalizeKana(p.name_kana);
        if (!normalizedKana) return false;
        const firstChar = normalizedKana.charAt(0);
        return group.chars.includes(firstChar);
      });
    }

    return result;
  }, [partners, searchQuery, selectedKanaGroup]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-mincho text-sumi">取引先を選択</h3>
        <button
          type="button"
          onClick={onCancel}
          className="btn-ghost btn-sm"
        >
          キャンセル
        </button>
      </div>

      {/* 検索 */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="取引先名・カナ・担当者名で検索"
        className="form-input"
      />

      {/* 五十音インデックス */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
        {GOJUON_GROUPS.map((group, index) => (
          <button
            key={group.label}
            type="button"
            onClick={() => setSelectedKanaGroup(index)}
            className={`flex-shrink-0 px-3 py-1 text-sm transition-colors ${
              selectedKanaGroup === index
                ? 'bg-shu text-white'
                : 'bg-shironeri text-aitetsu hover:bg-usuzumi/20'
            }`}
          >
            {group.label}
          </button>
        ))}
      </div>

      {/* 件数 */}
      <p className="text-xs text-ginnezumi">
        {filteredPartners.length}件
      </p>

      {/* エラー */}
      {error && (
        <div className="alert alert-danger">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* ローディング */}
      {loading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-usuzumi/10 w-1/2" />
                <div className="h-3 bg-usuzumi/10 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 結果リスト */}
      {!loading && !error && (
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {filteredPartners.length === 0 ? (
            <p className="text-center text-ginnezumi py-8">
              該当する取引先がありません
            </p>
          ) : (
            filteredPartners.map((partner) => (
              <button
                key={partner.id}
                type="button"
                onClick={() =>
                  onSelect({
                    id: partner.id,
                    name: partner.partner_name,
                    partner_code: partner.partner_code,
                  })
                }
                className="card card-interactive w-full text-left p-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-sumi">
                      {partner.partner_name}
                    </p>
                    {partner.contact_person && (
                      <p className="text-xs text-ginnezumi">
                        担当: {partner.contact_person}
                      </p>
                    )}
                  </div>
                  <span className="font-mono text-xs text-ginnezumi">
                    {partner.partner_code}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
