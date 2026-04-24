// 車両マスタ + 当日ステータス管理
// 10台の車両（実運用では40台だがデモ用に主要10台）

export const VEHICLES = [
  { id: 'v01', name: '銀シエンタ',     plate: '春日井 580 あ 12-34', capacity: 6, driver: 'ハヤセ イチ', tel: '090-1111-1001', org: 'EDU_NET',  color: '#6b7fa8', safety: true,  note: '6人乗り／置き去り防止装置' },
  { id: 'v02', name: '白タント',       plate: '春日井 580 あ 23-45', capacity: 4, driver: 'ヨドミ ジロウ', tel: '090-1111-1002', org: 'EDU_NET',  color: '#8ea892', safety: false, note: '小型・近距離向き' },
  { id: 'v03', name: '赤ルーミー',     plate: '春日井 580 あ 34-56', capacity: 4, driver: 'キリノ サブロウ', tel: '090-1111-1003', org: 'EDU_NET',  color: '#b86a5a', safety: false, note: '' },
  { id: 'v04', name: 'ハイエースA',    plate: '春日井 500 え 45-67', capacity: 8, driver: 'アオリ ケン', tel: '090-1111-1004', org: 'EDU_NET',  color: '#c78825', safety: true,  note: '最大／遠距離・大人数対応' },
  { id: 'v05', name: 'ハイエースB',    plate: '春日井 500 え 56-78', capacity: 8, driver: 'カナン マコト',   tel: '090-1111-1005', org: 'LIFE_TER', color: '#a36a3d', safety: true,  note: '最大／遠距離・大人数対応' },
  { id: 'v06', name: '青ノア',         plate: '春日井 530 お 67-89', capacity: 7, driver: 'タシロ ヒデキ', tel: '090-1111-1006', org: 'LIFE_TER', color: '#4b6fa5', safety: true,  note: '' },
  { id: 'v07', name: '白ステップ',     plate: '春日井 530 お 78-90', capacity: 7, driver: 'リンド リョウ',   tel: '090-1111-1007', org: 'LIFE_TER', color: '#7d8a96', safety: true,  note: '' },
  { id: 'v08', name: '紺パッソ',       plate: '春日井 580 い 89-01', capacity: 4, driver: 'トワ セイジ', tel: '090-1111-1008', org: 'EDU_NET',  color: '#3e5878', safety: false, note: '' },
  { id: 'v09', name: '黄N-BOX',        plate: '春日井 580 う 90-12', capacity: 4, driver: 'フジノ ヒロシ',   tel: '090-1111-1009', org: 'LIFE_TER', color: '#b0841a', safety: false, note: '' },
  { id: 'v10', name: '自家用A（マキノ）', plate: '春日井 580 え 11-11', capacity: 4, driver: 'マキノ タカシ', tel: '090-1111-1010', org: 'EDU_NET', color: '#6b4a8b', safety: false, note: '自家用車／手当支給' },
]

export const VEHICLE_BY_ID = Object.fromEntries(VEHICLES.map(v => [v.id, v]))

// ───────── 当日ステータス ─────────
// 実運用では日付×車両で DB 管理するが、デモでは1日分のみ保持
export const DAY_STATUSES = [
  { id: 'active',      label: '稼働中',  short: '稼働',  color: '#6fa373', desc: '通常運行可' },
  { id: 'maintenance', label: '整備中',  short: '整備',  color: '#d9992b', desc: '車検/点検でこの日は使用不可' },
  { id: 'substitute',  label: '代車使用', short: '代車',  color: '#3d7eac', desc: '本来の車は使えないが代車で運行中' },
  { id: 'off',         label: '休車',    short: '休車',  color: '#9c9585', desc: 'この日は配車しない' },
]
export const DAY_STATUS_BY_ID = Object.fromEntries(DAY_STATUSES.map(s => [s.id, s]))

// 本日の初期ステータス（すべて稼働中、v02 のみ整備中というデモデータ）
// RouteOptimize 内で useState の初期値として使い、編集はページ内で完結する
export const INITIAL_VEHICLE_DAY_STATUS = {
  v01: { status: 'active',      note: '' },
  v02: { status: 'maintenance', note: '定期点検（再始動15:00予定）' },
  v03: { status: 'active',      note: '' },
  v04: { status: 'active',      note: '' },
  v05: { status: 'active',      note: '' },
  v06: { status: 'active',      note: '' },
  v07: { status: 'active',      note: '' },
  v08: { status: 'active',      note: '' },
  v09: { status: 'active',      note: '' },
  v10: { status: 'active',      note: '' },
}

// 配車可能かどうかの判定
export function canUseVehicle(statusEntry) {
  if (!statusEntry) return true
  return statusEntry.status === 'active' || statusEntry.status === 'substitute'
}
