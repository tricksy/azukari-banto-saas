/**
 * 預かり番頭 型定義
 * 着物・帯 預かり管理システム
 */

// ============================================
// ステータス
// ============================================

/** 商品ステータス */
export type ItemStatus =
  | 'draft'           // 下書き（顧客未設定）
  | 'received'        // 受付済
  | 'pending_ship'    // 業者への発送待ち
  | 'processing'      // 加工中
  | 'returned'        // 業者からの返却済
  | 'paid_storage'    // 有料預かり
  | 'completed'       // 完了
  | 'rework'          // 再加工
  | 'on_hold'         // 顧客への返送保留
  | 'awaiting_customer' // 顧客確認待ち
  | 'cancelled'       // キャンセル
  | 'cancelled_completed'; // キャンセル完了（キャンセル商品の顧客返送済）

/** ステータス表示名 */
export const ItemStatusLabel: Record<ItemStatus, string> = {
  draft: '顧客未設定',
  received: '受付済',
  pending_ship: '業者への発送待ち',
  processing: '加工中',
  returned: '業者からの返却済',
  paid_storage: '有料預かり',
  completed: '完了',
  rework: '再加工',
  on_hold: '顧客への返送保留',
  awaiting_customer: '顧客確認待ち',
  cancelled: 'キャンセル',
  cancelled_completed: 'キャンセル完了',
};

/**
 * 許可されるステータス遷移マップ
 *
 * キー: 現在のステータス
 * 値: 遷移可能なステータスの配列
 *
 * 遷移ルール:
 * - キャンセルは業者への発送前（received/pending_ship）のみ可能
 * - 業者発送後（processing以降）はキャンセル不可
 * - rework は returned からのみ遷移可能
 * - クレーム対応は isClaimActive フラグで管理（ステータスではない）
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<ItemStatus, ItemStatus[]> = {
  // 下書き（顧客紐付けでpending_shipへ、削除でcancelledへ）
  draft: ['pending_ship', 'cancelled'],

  // 通常フロー（業者発送前はキャンセル可能）
  received: ['pending_ship', 'cancelled'],
  pending_ship: ['processing', 'received', 'cancelled'],

  // 業者発送後（キャンセル不可）
  processing: ['returned', 'on_hold'],
  returned: ['completed', 'paid_storage', 'rework', 'on_hold', 'awaiting_customer'],
  paid_storage: ['completed', 'returned'],
  completed: [],                                 // 完了は最終状態

  // 特殊ステータス（業者発送後のため全てキャンセル不可）
  rework: ['processing'],
  on_hold: ['returned', 'processing'],
  awaiting_customer: ['returned', 'completed'],
  cancelled: ['cancelled_completed'],            // キャンセル品の顧客への返送
  cancelled_completed: [],                       // キャンセル完了は最終状態
};

/**
 * ステータス遷移が許可されているかをチェック
 *
 * @param currentStatus - 現在のステータス
 * @param newStatus - 遷移先のステータス
 * @returns 遷移が許可されている場合はtrue
 */
export function isStatusTransitionAllowed(
  currentStatus: ItemStatus,
  newStatus: ItemStatus
): boolean {
  // 同じステータスへの「遷移」は許可（変更なし）
  if (currentStatus === newStatus) {
    return true;
  }

  const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[currentStatus];
  return allowedTransitions.includes(newStatus);
}

/**
 * ステータス遷移エラーメッセージを生成
 *
 * @param currentStatus - 現在のステータス
 * @param newStatus - 遷移先のステータス
 * @returns エラーメッセージ
 */
export function getStatusTransitionErrorMessage(
  currentStatus: ItemStatus,
  newStatus: ItemStatus
): string {
  const currentLabel = ItemStatusLabel[currentStatus];
  const newLabel = ItemStatusLabel[newStatus];
  const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[currentStatus];

  if (allowedTransitions.length === 0) {
    return `「${currentLabel}」は最終状態のため、ステータスを変更できません`;
  }

  const allowedLabels = allowedTransitions.map(s => ItemStatusLabel[s]).join('、');
  return `「${currentLabel}」から「${newLabel}」への遷移は許可されていません。遷移可能なステータス: ${allowedLabels}`;
}

// ============================================
// 商品種別・加工種別
// ============================================

/** 商品種別（英語レガシー + 日本語新規） */
export type ProductType = 'kimono' | 'obi' | 'other' | '着物' | '帯' | 'その他';

export const ProductTypeLabel: Record<string, string> = {
  // 英語（レガシー）
  kimono: '着物',
  obi: '帯',
  other: 'その他',
  // 日本語（新規）
  '着物': '着物',
  '帯': '帯',
  'その他': 'その他',
};

/** 加工種別（英語レガシー + 日本語新規） */
export type ProcessingType =
  | 'washing'       // 洗い
  | 'dyeing'        // 染め直し
  | 'tailoring'     // 仕立て直し
  | 'stain_removal' // シミ抜き
  | 'alteration'    // 寸法直し
  | 'other'         // その他
  | '洗い'
  | '染め直し'
  | '仕立て直し'
  | 'シミ抜き'
  | '寸法直し';

export const ProcessingTypeLabel: Record<string, string> = {
  // 英語（レガシー）
  washing: '洗い',
  dyeing: '染め直し',
  tailoring: '仕立て直し',
  stain_removal: 'シミ抜き',
  alteration: '寸法直し',
  other: 'その他',
  // 日本語（新規）
  '洗い': '洗い',
  '染め直し': '染め直し',
  '仕立て直し': '仕立て直し',
  'シミ抜き': 'シミ抜き',
  '寸法直し': '寸法直し',
  'その他': 'その他',
};

/** 優先度 */
export type Priority = 'normal' | 'urgent' | 'express';

export const PriorityLabel: Record<Priority, string> = {
  normal: '通常',
  urgent: '急ぎ',
  express: '特急',
};

// ============================================
// 配送業者
// ============================================

/** 配送業者種別 */
export type CarrierType = 'yamato' | 'sagawa' | 'japanpost' | 'other';

/** 配送業者表示名 */
export const CarrierTypeLabel: Record<CarrierType, string> = {
  yamato: 'ヤマト運輸',
  sagawa: '佐川急便',
  japanpost: '日本郵便',
  other: 'その他',
};

/** 配送業者選択肢 */
export const CARRIER_OPTIONS: { value: CarrierType; label: string }[] = [
  { value: 'yamato', label: 'ヤマト運輸' },
  { value: 'sagawa', label: '佐川急便' },
  { value: 'japanpost', label: '日本郵便' },
  { value: 'other', label: 'その他' },
];

/**
 * 配送業者の追跡URL生成
 * 送り状番号からハイフンを除去して各社の追跡ページURLを生成
 */
export function getTrackingUrl(carrier: CarrierType, trackingNumber: string): string | null {
  // ハイフンを除去した番号
  const cleanNumber = trackingNumber.replace(/-/g, '');

  switch (carrier) {
    case 'yamato':
      // ヤマト運輸（2024年4月以降の新URL）
      return `https://member.kms.kuronekoyamato.co.jp/parcel/detail?pno=${cleanNumber}`;
    case 'sagawa':
      // 佐川急便（パラメータ名はokurijoNo）
      return `https://k2k.sagawa-exp.co.jp/p/web/okurijosearch.do?okurijoNo=${cleanNumber}`;
    case 'japanpost':
      // 日本郵便（directパス + reqCodeNo1パラメータ）
      return `https://trackings.post.japanpost.jp/services/srv/search/direct?locale=ja&reqCodeNo1=${cleanNumber}`;
    case 'other':
    default:
      return null; // その他の場合はリンクなし
  }
}

// ============================================
// 顧客区分
// ============================================

/** 顧客区分 */
export type CustomerType = 'partner' | 'individual';

export const CustomerTypeLabel: Record<CustomerType, string> = {
  partner: '取引先経由',
  individual: '個人',
};

// ============================================
// 受付（Reception）
// ============================================

/** 受付データ */
export interface Reception {
  /** 受付番号（親番号）: {担当者ID}-{YYYYMMDDHHmm} */
  receptionNumber: string;
  /** 顧客ID */
  customerId: string;
  /** 顧客名 */
  customerName: string;
  /** 取引先ID（取引先経由の場合） */
  partnerId?: string;
  /** 取引先名（取引先経由の場合） */
  partnerName?: string;
  /** 受付日 */
  receivedDate: string;
  /** 受付担当者ID */
  receivedBy: string;
  /** 商品数 */
  itemCount: number;
  /** 備考 */
  notes?: string;
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

// ============================================
// 商品（Item）
// ============================================

/** 追加写真エントリ */
export interface AdditionalPhotoEntry {
  /** 写真URL */
  url: string;
  /** 写真メモ（気になる箇所の説明等） */
  memo?: string;
  /** 撮影タイプ（受入時/加工後） */
  type?: 'reception' | 'after';
}

/** 業者発送履歴エントリ */
export interface ShipHistoryEntry {
  /** 発送日 */
  date: string;
  /** 業者ID */
  vendorId: string;
  /** 業者名 */
  vendorName: string;
  /** 送り状番号（任意） */
  trackingNumber?: string;
  /** 配送業者（任意） */
  carrier?: CarrierType;
}

/** 業者返却履歴エントリ */
export interface ReturnHistoryEntry {
  /** 返却日 */
  date: string;
}

/** 商品データ */
export interface Item {
  /** 預かり番号: {担当者ID}-{YYYYMMDDHHmmss} */
  itemNumber: string;
  /** 受付番号（親番号） */
  receptionNumber: string;
  /** 顧客名（検索用・非正規化） */
  customerName?: string;
  /** 顧客名フリガナ（検索用・非正規化） */
  customerNameKana?: string;
  /** 取引先ID */
  partnerId?: string;
  /** 取引先名 */
  partnerName?: string;
  /** 商品種別 */
  productType: ProductType | string;
  /** 商品名・品目 */
  productName: string;
  /** 色・柄 */
  color?: string;
  /** 素材 */
  material?: string;
  /** サイズ */
  size?: string;
  /** 状態メモ */
  conditionNote?: string;
  /** 依頼種別 */
  requestType?: string;
  /** 依頼詳細 */
  requestDetail?: string;
  /** ステータス */
  status: ItemStatus;
  /** 業者ID */
  vendorId?: string;
  /** 業者名 */
  vendorName?: string;
  /** 発送予定日（業者へ） */
  scheduledShipDate?: string;
  /** 返送予定日（顧客へ） */
  scheduledReturnDate?: string;
  /** 業者発送日（実績） */
  shipToVendorDate?: string;
  /** 業者返却日（実績） */
  returnFromVendorDate?: string;
  /** 顧客返送日（実績） */
  returnToCustomerDate?: string;
  /** 業者発送時の送り状番号（任意） */
  vendorTrackingNumber?: string;
  /** 業者発送時の配送業者（任意） */
  vendorCarrier?: CarrierType;
  /** 顧客返送時の送り状番号（任意） */
  customerTrackingNumber?: string;
  /** 顧客返送時の配送業者（任意） */
  customerCarrier?: CarrierType;
  /** 写真URL（受入時） - 表面 */
  photoFrontUrl?: string;
  /** 写真URL（受入時） - 裏面 */
  photoBackUrl?: string;
  /** 写真URL（加工後） - 表面 */
  photoAfterFrontUrl?: string;
  /** 写真URL（加工後） - 裏面 */
  photoAfterBackUrl?: string;
  /** 写真メモ（受入時） - 表面 */
  photoFrontMemo?: string;
  /** 写真メモ（受入時） - 裏面 */
  photoBackMemo?: string;
  /** 写真メモ（加工後） - 表面 */
  photoAfterFrontMemo?: string;
  /** 写真メモ（加工後） - 裏面 */
  photoAfterBackMemo?: string;
  /** 追加写真（JSON配列: [{url, memo}]） - 気になる箇所等 */
  additionalPhotos?: string;
  /** 有料預かり対象フラグ */
  isPaidStorage?: boolean;
  /** 有料預かり開始日（isPaidStorageがtrueになった日） */
  paidStorageStartDate?: string;
  /** クレーム対応中フラグ（任意のステータスで設定可能） */
  isClaimActive?: boolean;
  /** アーカイブ済みフラグ（完了/キャンセル後一定期間経過） */
  isArchived?: boolean;
  /** 業者発送履歴（再加工等で複数回発送した場合の履歴、JSON文字列） */
  shipHistory?: string;
  /** 業者返却履歴（再加工等で複数回返却された場合の履歴、JSON文字列） */
  returnHistory?: string;
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

/** 加工依頼内容 */
export interface ProcessingRequest {
  /** 預かり番号 */
  itemNumber: string;
  /** 依頼種別 */
  processingType: ProcessingType;
  /** 依頼詳細 */
  details?: string;
  /** 希望納期 */
  desiredDeliveryDate?: string;
  /** 優先度 */
  priority: Priority;
  /** 寸法指定 */
  sizeSpecification?: string;
  /** 色指定 */
  colorSpecification?: string;
  /** 特記事項 */
  specialNotes?: string;
  /** 発注先業者コード */
  vendorCode?: string;
  /** 発送予定日（業者へ） */
  shipmentDate?: string;
  /** 発送伝票番号 */
  trackingNumber?: string;
  /** 発送日時 */
  shippedAt?: string;
  /** 返送予定日（顧客へ） */
  returnShipmentDate?: string;
  /** 返送伝票番号 */
  returnTrackingNumber?: string;
  /** 返送日時 */
  returnShippedAt?: string;
}

// ============================================
// 顧客（Customer）
// ============================================

/** 顧客データ */
export interface Customer {
  /** 顧客ID */
  customerId: string;
  /** 紐付け取引先ID（取引先経由の場合） */
  partnerId?: string;
  /** 紐付け取引先名（取引先経由の場合） */
  partnerName?: string;
  /** 氏名 */
  name: string;
  /** フリガナ */
  nameKana?: string;
  /** 電話番号 */
  phone?: string;
  /** メールアドレス */
  email?: string;
  /** 郵便番号 */
  postalCode?: string;
  /** 住所 */
  address?: string;
  /** 備考 */
  notes?: string;
  /** 有効フラグ */
  isActive?: boolean;
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

// ============================================
// 取引先（Partner）
// ============================================

/** 取引先データソース */
export type PartnerSource = 'external' | 'local';

/** 取引先データ */
export interface Partner {
  /** 取引先ID */
  partnerId: string;
  /** 取引先コード */
  partnerCode: string;
  /** 取引先名（HEADER_JA_TO_ENマッピング統一のためpartnerNameを使用） */
  partnerName: string;
  /** フリガナ */
  nameKana?: string;
  /** 担当者名 */
  contactPerson?: string;
  /** 電話番号 */
  phone?: string;
  /** FAX番号 */
  fax?: string;
  /** メールアドレス */
  email?: string;
  /** 郵便番号 */
  postalCode?: string;
  /** 住所 */
  address?: string;
  /** 備考 */
  notes?: string;
  /** 有効フラグ */
  isActive: boolean;
  /** データソース（external: 外部BPMaster, local: 内部partners） */
  source: PartnerSource;
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

// ============================================
// 業者（Vendor）
// ============================================

/** 業者得意分野プリセット */
export const VENDOR_SPECIALTY_PRESETS = [
  { value: '洗い', label: '洗い' },
  { value: '染め', label: '染め' },
  { value: '仕立て', label: '仕立て' },
  { value: 'シミ抜き', label: 'シミ抜き' },
  { value: '寸法直し', label: '寸法直し' },
  { value: '紋入れ', label: '紋入れ' },
  { value: '刺繍', label: '刺繍' },
  { value: '総合', label: '総合（複数対応）' },
] as const;

/** 業者データ */
export interface Vendor {
  /** 業者ID */
  vendorId: string;
  /** 業者名 */
  name: string;
  /** フリガナ */
  nameKana?: string;
  /** 電話番号 */
  phone?: string;
  /** メールアドレス */
  email?: string;
  /** 郵便番号 */
  postalCode?: string;
  /** 住所 */
  address?: string;
  /** 専門分野（カンマ区切りで複数可） */
  specialty?: string;
  /** 備考 */
  notes?: string;
  /** 有効フラグ */
  isActive: boolean | string;
  /** 発注件数（集計用） */
  orderCount?: number;
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

// ============================================
// 担当者（Worker）
// ============================================

/** 担当者データ */
export interface Worker {
  /** 担当者ID */
  workerId: string;
  /** 担当者名 */
  name: string;
  /** PINコード（ハッシュ化） */
  pinHash: string;
  /** メールアドレス */
  email?: string;
  /** 有効フラグ */
  isActive: boolean;
  /** 最終ログイン日時 */
  lastLoginAt?: string;
  /** 現在のセッション数 */
  activeSessionCount?: number;
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

// ============================================
// 操作ログ（Log）
// ============================================

/** 操作種別 */
export type LogAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'status_change'
  | 'login'
  | 'logout';

/** 操作ログ */
export interface OperationLog {
  /** ログID */
  logId: string;
  /** 日時 */
  timestamp: string;
  /** 担当者ID */
  workerId: string;
  /** 操作種別 */
  action: LogAction;
  /** 対象種別 */
  targetType: 'item' | 'reception' | 'customer' | 'partner' | 'vendor' | 'worker' | 'session';
  /** 対象ID */
  targetId: string;
  /** 変更内容 */
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
}

// ============================================
// アラート
// ============================================

/** アラート種別 */
export type AlertType = 'shipment_due' | 'return_due' | 'overdue' | 'stagnant';

/** アラートデータ */
export interface Alert {
  /** アラート種別 */
  type: AlertType;
  /** 預かり番号 */
  itemNumber: string;
  /** 予定日 */
  dueDate: string;
  /** 経過日数 */
  overdueDays: number;
  /** 商品情報 */
  item: Item;
}

// ============================================
// クレーム管理
// ============================================

/** クレームステータス（シンプル2段階: open → closed） */
// 後方互換性のため 'resolved' も許容するが、新規登録では使用しない
export type ClaimStatus = 'open' | 'closed' | 'resolved';

/** クレームステータス表示名 */
export const ClaimStatusLabel: Record<ClaimStatus, string> = {
  open: '対応中',
  closed: '完了',
  resolved: '完了', // 後方互換（レガシーデータ用）
};

/** クレームカテゴリ */
export type ClaimCategory = 'quality' | 'delivery' | 'response' | 'other';

/** クレームカテゴリ表示名 */
export const ClaimCategoryLabel: Record<ClaimCategory, string> = {
  quality: '品質',
  delivery: '納期',
  response: '対応',
  other: 'その他',
};

/** クレームカテゴリ説明 */
export const ClaimCategoryDescription: Record<ClaimCategory, string> = {
  quality: '仕上がり品質、加工ミス、汚損など',
  delivery: '納期遅延、発送遅延など',
  response: '接客対応、連絡不備など',
  other: '上記に該当しないクレーム',
};

/** クレームデータ */
export interface Claim {
  /** クレームID */
  claimId: string;
  /** 紐づく商品番号 */
  itemNumber: string;
  /** クレームステータス */
  status: ClaimStatus;
  /** クレームカテゴリ */
  category?: ClaimCategory;
  /** クレーム内容 */
  description: string;
  /** 担当者ID（アサインされた担当者） */
  assigneeId?: string;
  /** 担当者名（アサインされた担当者） */
  assigneeName?: string;
  /** 対応期限 */
  dueDate?: string;
  /** 登録日時 */
  createdAt: string;
  /** 登録者ID */
  createdBy: string;
  /** 登録者名 */
  createdByName: string;
  /** 解決日時 */
  resolvedAt?: string;
  /** 解決者ID */
  resolvedBy?: string;
  /** 解決者名 */
  resolvedByName?: string;
  /** 解決内容 */
  resolution?: string;
}

/** クレーム一覧表示用の拡張クレーム型（商品情報・ログ情報含む） */
export interface ClaimWithDetails extends Claim {
  /** 顧客名 */
  customerName?: string;
  /** 取引先名 */
  partnerName?: string;
  /** 商品種別 */
  productType?: string;
  /** 対応ログ件数 */
  logCount: number;
  /** 最終対応日時 */
  lastActivityAt?: string;
  /** 最終対応者名 */
  lastActivityBy?: string;
  /** 期限超過フラグ */
  isOverdue?: boolean;
}

/** クレーム対応ログアクション */
export type ClaimLogAction = 'opened' | 'updated' | 'resolved' | 'closed' | 'reopened';

/** クレーム対応ログ */
export interface ClaimLog {
  /** ログID */
  logId: string;
  /** 紐づくクレームID */
  claimId: string;
  /** 商品番号（検索用） */
  itemNumber: string;
  /** 対応日時 */
  timestamp: string;
  /** 対応者ID */
  workerId: string;
  /** 対応者名 */
  workerName: string;
  /** アクション */
  action: ClaimLogAction;
  /** 対応内容メモ */
  note: string;
}
