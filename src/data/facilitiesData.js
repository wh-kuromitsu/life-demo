// 13事業所 × 2法人
// 色は「にじいろ」の名に因んで13色の顕著な区別色（ただしUI全体は静謐に保つ）

export const ORGS = {
  EDU_NET: { id: 'edunet', name: '株式会社エデュケーションNET', short: 'EDU-NET' },
  LIFE_TER: { id: 'lifeter', name: 'LIFEterrasse', short: 'LIFEterrasse' },
}

export const FACILITIES = [
  // 放課後等デイサービス 9施設
  { id: 'plus',     name: 'にじいろPLUS',      short: 'PLUS',     service: '放デイ', theme: '教育・療育中心',                       org: 'EDU_NET',  color: '#4b6fa5', hugNo: 1,  cap: 10 },
  { id: 'progress', name: 'にじいろPROGRESS',  short: 'PROGRESS', service: '放デイ', theme: '感性教育・社会体験・学習支援',         org: 'EDU_NET',  color: '#c78825', hugNo: 3,  cap: 10 },
  { id: 'labo',     name: 'にじいろLABO',      short: 'LABO',     service: '放デイ', theme: 'IT・音楽・木工の技術習得型',           org: 'EDU_NET',  color: '#2d7d79', hugNo: 4,  cap: 10 },
  { id: 'noba',     name: 'NIJIIRONOBA',       short: 'NOBA',     service: '放デイ', theme: '進路・就労支援・不登校支援',           org: 'EDU_NET',  color: '#6b4a8b', hugNo: 5,  cap: 10 },
  { id: 'nobasup',  name: 'NOBAサポ',          short: 'NOBAサポ', service: '放デイ', theme: 'コグトレ（認知訓練）',                  org: 'EDU_NET',  color: '#4a8c5e', hugNo: 6,  cap: 10 },
  { id: 'marche',   name: 'にじいろMARCHE',    short: 'MARCHE',   service: '放デイ', theme: '精神的自律・経済的自立',               org: 'LIFE_TER', color: '#b84060', hugNo: 8,  cap: 10 },
  { id: 'lohaspo',  name: 'にじいろLOHASPO',   short: 'LOHASPO',  service: '放デイ', theme: '体軸・姿勢づくり',                     org: 'LIFE_TER', color: '#2f7aab', hugNo: 9,  cap: 10 },
  { id: 'miraiku',  name: 'MIRAIKU',           short: 'MIRAIKU',  service: '放デイ', theme: 'STEAM・ドローン・自然科学',            org: 'LIFE_TER', color: '#b0841a', hugNo: 11, cap: 10 },
  { id: 'common',   name: 'にじいろCOMMON',    short: 'COMMON',   service: '放デイ', theme: '横断連携拠点',                         org: 'EDU_NET',  color: '#8a6340', hugNo: 13, cap: 10 },

  // 児童発達支援 3施設
  { id: 'palette',  name: 'にじいろPALETTE',   short: 'PALETTE',  service: '児発',   theme: '療育中心',                             org: 'EDU_NET',  color: '#c74d74', hugNo: 2,  cap: 10 },
  { id: 'futaba',   name: 'にじいろふたば',    short: 'ふたば',   service: '児発',   theme: '個別療育',                             org: 'EDU_NET',  color: '#7ba055', hugNo: 7,  cap: 10 },
  { id: 'nijinowa', name: 'にじのわ',          short: 'にじのわ', service: '児発',   theme: 'モンテッソーリ療育',                   org: 'LIFE_TER', color: '#8672a8', hugNo: 10, cap: 10 },

  // 就労寄り 1施設
  { id: 'neo',      name: 'NEOキャリア',       short: 'NEO',      service: '就労',   theme: 'はたらく力を育てる',                   org: 'LIFE_TER', color: '#52606d', hugNo: 12, cap: 10 },
]

export const FACILITY_BY_ID = Object.fromEntries(FACILITIES.map(f => [f.id, f]))

// サイドバーの表示用（「すべて」+ 13施設）
export const FACILITY_OPTIONS = [
  { id: 'all', name: 'すべて', short: 'すべて', color: '#7e828f' },
  ...FACILITIES,
]
