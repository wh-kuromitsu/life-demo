// 10台の車両（実運用では40台だがデモ用に主要10台）
// 色は facility とは独立の車両色

export const VEHICLES = [
  { id: 'v01', name: '銀シエンタ',     plate: '春日井 580 あ 12-34', capacity: 6, driver: '松田 一郎', tel: '090-1111-1001', org: 'EDU_NET',  color: '#6b7fa8', safety: true,  note: '6人乗り／置き去り防止装置' },
  { id: 'v02', name: '白タント',       plate: '春日井 580 あ 23-45', capacity: 4, driver: '鈴木 二郎', tel: '090-1111-1002', org: 'EDU_NET',  color: '#8ea892', safety: false, note: '小型・近距離向き' },
  { id: 'v03', name: '赤ルーミー',     plate: '春日井 580 あ 34-56', capacity: 4, driver: '木村 三郎', tel: '090-1111-1003', org: 'EDU_NET',  color: '#b86a5a', safety: false, note: '' },
  { id: 'v04', name: 'ハイエースA',    plate: '春日井 500 え 45-67', capacity: 8, driver: '佐藤 健一', tel: '090-1111-1004', org: 'EDU_NET',  color: '#c78825', safety: true,  note: '最大／遠距離・大人数対応' },
  { id: 'v05', name: 'ハイエースB',    plate: '春日井 500 え 56-78', capacity: 8, driver: '加藤 誠',   tel: '090-1111-1005', org: 'LIFE_TER', color: '#a36a3d', safety: true,  note: '最大／遠距離・大人数対応' },
  { id: 'v06', name: '青ノア',         plate: '春日井 530 お 67-89', capacity: 7, driver: '田代 秀樹', tel: '090-1111-1006', org: 'LIFE_TER', color: '#4b6fa5', safety: true,  note: '' },
  { id: 'v07', name: '白ステップ',     plate: '春日井 530 お 78-90', capacity: 7, driver: '山本 亮',   tel: '090-1111-1007', org: 'LIFE_TER', color: '#7d8a96', safety: true,  note: '' },
  { id: 'v08', name: '紺パッソ',       plate: '春日井 580 い 89-01', capacity: 4, driver: '中村 誠司', tel: '090-1111-1008', org: 'EDU_NET',  color: '#3e5878', safety: false, note: '' },
  { id: 'v09', name: '黄N-BOX',        plate: '春日井 580 う 90-12', capacity: 4, driver: '藤田 弘',   tel: '090-1111-1009', org: 'LIFE_TER', color: '#b0841a', safety: false, note: '' },
  { id: 'v10', name: '自家用A（松浦）', plate: '春日井 580 え 11-11', capacity: 4, driver: '松浦 孝志', tel: '090-1111-1010', org: 'EDU_NET', color: '#6b4a8b', safety: false, note: '自家用車／手当支給' },
]

export const VEHICLE_BY_ID = Object.fromEntries(VEHICLES.map(v => [v.id, v]))
