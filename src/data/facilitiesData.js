// にじいろグループ 13事業所・7建物・4エリア マスタ
// 出典: 13事業所_拠点間距離表_v2（ユーザ提供）

// ───────── エリア（生活圏） ─────────
export const AREAS = [
  { id: 'shinogi2', name: 'エリア1 · 篠木町2丁目',  desc: 'レガーロ・シノギ（同建屋）',                        color: '#7ba055' },
  { id: 'shinogi1', name: 'エリア2 · 篠木町1丁目',  desc: '河口ビル + ランドマークパレス（徒歩圏）',           color: '#4b6fa5' },
  { id: 'toriimatsu', name: 'エリア3 · 鳥居松町',   desc: 'プリミエール鳥居松Ⅱ（同建屋）',                     color: '#c74d74' },
  { id: 'chuo',     name: 'エリア4 · 中央通',        desc: 'MARCHE + 119-1ビル + オレオール中央通（徒歩圏）',  color: '#b0841a' },
]
export const AREA_BY_ID = Object.fromEntries(AREAS.map(a => [a.id, a]))

// ───────── 建物（所在地単位のグルーピング） ─────────
export const BUILDINGS = [
  {
    id: 'legaro_shinogi',  name: 'レガーロ・シノギ',    area: 'shinogi2',
    postal: '486-0851',    address: '春日井市篠木町2丁目1281-1',
    lat: 35.2345, lng: 136.9748, station: '車9分',
    color: '#7ba055',
  },
  {
    id: 'kawaguchi',       name: '河口ビル',             area: 'shinogi1',
    postal: '486-0851',    address: '春日井市篠木町1丁目40-1',
    lat: 35.24,   lng: 136.978,  station: '車5分',
    color: '#4b6fa5',
  },
  {
    id: 'landmark',        name: 'ランドマークパレス',   area: 'shinogi1',
    postal: '486-0851',    address: '春日井市篠木町1丁目111-1',
    lat: 35.24,   lng: 136.9835, station: '徒歩18分',
    color: '#3f6090',
  },
  {
    id: 'primiere',        name: 'プリミエール鳥居松Ⅱ', area: 'toriimatsu',
    postal: '486-0844',    address: '春日井市鳥居松町5丁目100',
    lat: 35.2485, lng: 136.976,  station: '車6分',
    color: '#c74d74',
  },
  {
    id: 'marche_bldg',     name: 'MARCHE独立建屋',       area: 'chuo',
    postal: '486-0825',    address: '春日井市中央通2-89',
    lat: 35.2495, lng: 136.971,  station: '車5分',
    color: '#b84060',
  },
  {
    id: 'chuo119',         name: '中央通119-1ビル',      area: 'chuo',
    postal: '486-0825',    address: '春日井市中央通2丁目119-1',
    lat: 35.25,   lng: 136.9725, station: '徒歩5分',
    color: '#c78825',
  },
  {
    id: 'oreole',          name: 'オレオール中央通',     area: 'chuo',
    postal: '486-0839',    address: '愛知県春日井市中央通1-70',
    lat: 35.243,  lng: 136.987,  station: '要確認',
    color: '#52606d',
  },
]
export const BUILDING_BY_ID = Object.fromEntries(BUILDINGS.map(b => [b.id, b]))

// ───────── 運営法人 ─────────
export const ORGS = {
  EDU_NET:  { id: 'edunet',  name: '株式会社エデュケーションNET', short: 'EDU-NET' },
  LIFE_TER: { id: 'lifeter', name: 'LIFEterrasse',                 short: 'LIFEterrasse' },
}

// ───────── 事業所（サービス単位） ─────────
// buildingId で建物と紐付け。同じ buildingId を持つ事業所は「同じ建物内に併設」
export const FACILITIES = [
  // 放課後等デイサービス 9施設
  { id: 'plus',     name: 'にじいろPLUS',      short: 'PLUS',     service: '放デイ', theme: '教育・療育中心',               org: 'EDU_NET',  color: '#4b6fa5', hugNo: 1,  cap: 10, buildingId: 'legaro_shinogi' },
  { id: 'progress', name: 'にじいろPROGRESS',  short: 'PROGRESS', service: '放デイ', theme: '感性教育・社会体験・学習支援', org: 'EDU_NET',  color: '#c78825', hugNo: 3,  cap: 10, buildingId: 'kawaguchi' },
  { id: 'labo',     name: 'にじいろLABO',      short: 'LABO',     service: '放デイ', theme: 'IT・音楽・木工の技術習得型',   org: 'EDU_NET',  color: '#2d7d79', hugNo: 4,  cap: 10, buildingId: 'kawaguchi' },
  { id: 'noba',     name: 'NIJIIRONOBA',       short: 'NOBA',     service: '放デイ', theme: '進路・就労支援・不登校支援',   org: 'EDU_NET',  color: '#6b4a8b', hugNo: 5,  cap: 10, buildingId: 'primiere' },
  { id: 'nobasup',  name: 'NOBAサポ',          short: 'NOBAサポ', service: '放デイ', theme: 'コグトレ（認知訓練）',          org: 'EDU_NET',  color: '#4a8c5e', hugNo: 6,  cap: 10, buildingId: 'primiere' },
  { id: 'marche',   name: 'にじいろMARCHE',    short: 'MARCHE',   service: '放デイ', theme: '精神的自律・経済的自立',       org: 'LIFE_TER', color: '#b84060', hugNo: 8,  cap: 10, buildingId: 'marche_bldg' },
  { id: 'lohaspo',  name: 'にじいろLOHASPO',   short: 'LOHASPO',  service: '放デイ', theme: '体軸・姿勢づくり',             org: 'LIFE_TER', color: '#2f7aab', hugNo: 9,  cap: 10, buildingId: 'chuo119' },
  { id: 'miraiku',  name: 'MIRAIKU',           short: 'MIRAIKU',  service: '放デイ', theme: 'STEAM・ドローン・自然科学',    org: 'LIFE_TER', color: '#b0841a', hugNo: 11, cap: 10, buildingId: 'chuo119' },
  { id: 'common',   name: 'にじいろCOMMON',    short: 'COMMON',   service: '放デイ', theme: '横断連携拠点',                 org: 'EDU_NET',  color: '#8a6340', hugNo: 13, cap: 10, buildingId: 'chuo119' },

  // 児童発達支援 3施設
  { id: 'palette',  name: 'にじいろPALETTE',   short: 'PALETTE',  service: '児発',   theme: '療育中心',                     org: 'EDU_NET',  color: '#c74d74', hugNo: 2,  cap: 10, buildingId: 'legaro_shinogi' },
  { id: 'futaba',   name: 'にじいろふたば',    short: 'ふたば',   service: '児発',   theme: '個別療育',                     org: 'EDU_NET',  color: '#7ba055', hugNo: 7,  cap: 10, buildingId: 'landmark' },
  { id: 'nijinowa', name: 'にじのわ',          short: 'にじのわ', service: '児発',   theme: 'モンテッソーリ療育',           org: 'LIFE_TER', color: '#8672a8', hugNo: 10, cap: 10, buildingId: 'chuo119' },

  // 就労 1施設
  { id: 'neo',      name: 'NEOキャリア',       short: 'NEO',      service: '就労',   theme: 'はたらく力を育てる',           org: 'LIFE_TER', color: '#52606d', hugNo: 12, cap: 10, buildingId: 'oreole' },
]
export const FACILITY_BY_ID = Object.fromEntries(FACILITIES.map(f => [f.id, f]))

// ───────── 建物 → 紐付く事業所リスト ─────────
export const FACILITIES_BY_BUILDING = BUILDINGS.reduce((acc, b) => {
  acc[b.id] = FACILITIES.filter(f => f.buildingId === b.id)
  return acc
}, {})

// 事業所→建物のクイックルックアップ
export function buildingOf(facilityId) {
  const f = FACILITY_BY_ID[facilityId]
  return f ? BUILDING_BY_ID[f.buildingId] : null
}

// ───────── サイドバーの表示用（「すべて」+ 13事業所） ─────────
export const FACILITY_OPTIONS = [
  { id: 'all', name: 'すべて', short: 'すべて', color: '#7e828f' },
  ...FACILITIES,
]
