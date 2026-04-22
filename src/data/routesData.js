// 送迎データ - 拡張版
// ① 本日の確定便（既存互換）
// ② 方面クラスタリング（SVG座標ベース、緯度経度の代理）
// ③ 配車組表：拠点×便×車両×児童 のマトリクス構造（送迎組.xlsx準拠）
// ④ AI推奨と手動調整の分離

export const BASE = {
  id: 'base', name: 'にじいろCOMMON', address: '愛知県春日井市中央通2-119-1',
  x: 370, y: 270,
  lat: 35.2432, lng: 136.9770,  // 中央通119-1ビル
}

// ─── 方面クラスタリング（x,y 座標 = 緯度経度の代理） ───
// 春日井市を3方面 × 3時間帯 = 9セルに分割
// 実運用では Google Maps Distance Matrix API + K-means で自動決定
export const REGIONS = [
  { id: 'east',    name: '東部',   color: '#c04a2a', bounds: { xMin: 500, xMax: 800, yMin: 0, yMax: 500 },
    desc: '神領・坂下・東野・高蔵寺エリア' },
  { id: 'central', name: '中央部', color: '#3a6b4e', bounds: { xMin: 300, xMax: 500, yMin: 0, yMax: 500 },
    desc: '鳥居松・篠木・八幡・北城エリア' },
  { id: 'west',    name: '西部',   color: '#c78825', bounds: { xMin: 0,   xMax: 300, yMin: 0, yMax: 500 },
    desc: '大手・小野・上条・丸田・柏原・松山エリア' },
]

export const TIME_BANDS = [
  { id: 'early',  name: '早便',   range: '14:25-14:45', desc: '小学校 低中学年', color: '#e8a9b8' },
  { id: 'middle', name: '中便',   range: '14:50-15:10', desc: '学童・特支・中学校', color: '#b5a28c' },
  { id: 'late',   name: '遅便',   range: '15:15-15:40', desc: '中学校後半・高校', color: '#6b4a8b' },
]

// 児童を方面×時間帯に分類
export function classifyRegion(x) {
  if (x == null) return 'unknown'
  if (x >= 500) return 'east'
  if (x >= 300) return 'central'
  return 'west'
}

export function classifyTimeBand(time) {
  if (!time) return 'unknown'
  const [h, m] = time.split(':').map(Number)
  const mins = h * 60 + m
  if (mins <= 14 * 60 + 45) return 'early'
  if (mins <= 15 * 60 + 10) return 'middle'
  return 'late'
}

// ─── 本日の確定便（既存互換） ───
export const TODAY_TRIPS = [
  {
    id: 't1', leg: 1, direction: 'pickup', vehicle: 'v04',
    departAt: '13:50',
    stops: [
      { kind: 'depart', name: 'にじいろCOMMON', time: '13:50', x: 370, y: 270 },
      { kind: 'school', childId: 'c01', name: '田中 蓮', schoolId: 'higashino', time: '14:32' },
      { kind: 'school', childId: 'c06', name: '山本 悠斗', schoolId: 'toubu', time: '15:12' },
      { kind: 'school', childId: 'c11', name: '中村 ひまり', schoolId: 'sakashita', time: '14:35' },
      { kind: 'arrive', name: 'にじいろCOMMON', time: '15:40', x: 370, y: 270 },
    ],
    status: 'done',
  },
  {
    id: 't2', leg: 1, direction: 'pickup', vehicle: 'v01',
    departAt: '14:10',
    stops: [
      { kind: 'depart', name: 'にじいろCOMMON', time: '14:10' },
      { kind: 'school', childId: 'c02', name: '佐藤 陽菜', schoolId: 'toriimatsu', time: '14:38' },
      { kind: 'school', childId: 'c03', name: '小林 朝陽', schoolId: 'jinryo', time: '14:32' },
      { kind: 'school', childId: 'c29', name: '坂本 響', schoolId: 'oote', time: '14:35' },
      { kind: 'arrive', name: 'にじいろCOMMON', time: '15:15' },
    ],
    status: 'in_progress',
  },
  {
    id: 't3', leg: 2, direction: 'pickup', vehicle: 'v06',
    departAt: '14:30',
    stops: [
      { kind: 'depart', name: 'にじいろCOMMON', time: '14:30' },
      { kind: 'school', childId: 'c09', name: '野村 優子', schoolId: 'shoyo', time: '15:32' },
      { kind: 'school', childId: 'c10', name: '清水 晴人', schoolId: 'shoyo', time: '15:33' },
      { kind: 'school', childId: 'c24', name: '谷川 隼人', schoolId: 'shoyo', time: '15:35' },
      { kind: 'arrive', name: 'にじいろCOMMON', time: '16:00' },
    ],
    status: 'pending',
  },
]

// ─── 配車組表: 拠点→便→車両→同乗児童 ───
// 送迎組.xlsx準拠。AI推奨の初期値となる

// Pattern A (OR-Tools VRP)
export const AI_ASSIGNMENT_A = {
  id: 'ai_a',
  label: 'Pattern A',
  algo: 'OR-Tools VRP (厳密最適化)',
  totalTime: 68, totalDistance: 14.2, unassigned: 0,
  constraints: { timeWindow: true, capacity: true, ng: true, crossFacility: true },
  facilityBlocks: [
    {
      facility: 'plus', leadTeacher: '松田先生',
      trips: [
        { tripNo: 1, vehicle: 'v04', teacher: '松田先生',
          childIds: ['c01', 'c06', 'c26'], region: 'east',
          estDepart: '13:50', estArrive: '15:40' },
        { tripNo: 2, vehicle: 'v04', teacher: '松田先生',
          childIds: ['c11'], region: 'east',
          estDepart: '14:20', estArrive: '15:00' },
      ],
    },
    {
      facility: 'progress', leadTeacher: '鈴木先生',
      trips: [
        { tripNo: 1, vehicle: 'v01', teacher: '鈴木先生',
          childIds: ['c02', 'c03', 'c29'], region: 'central',
          estDepart: '14:10', estArrive: '15:20' },
        { tripNo: 2, vehicle: 'v01', teacher: '鈴木先生',
          childIds: ['c15'], region: 'central',
          estDepart: '14:35', estArrive: '15:15' },
      ],
    },
    {
      facility: 'labo', leadTeacher: '木村先生',
      trips: [
        { tripNo: 1, vehicle: 'v08', teacher: '木村先生',
          childIds: ['c22', 'c19'], region: 'west',
          estDepart: '14:15', estArrive: '15:00' },
      ],
    },
    {
      facility: 'marche', leadTeacher: '佐藤先生',
      trips: [
        { tripNo: 1, vehicle: 'v06', teacher: '佐藤先生',
          childIds: ['c09', 'c10', 'c24', 'c30'], region: 'central',
          estDepart: '14:30', estArrive: '16:00',
          note: '翔陽連携4名 同便' },
      ],
    },
  ],
  regionStats: {
    east:    { count: 4, vehicles: ['v04'], distance: 5.2 },
    central: { count: 8, vehicles: ['v01', 'v06'], distance: 6.8 },
    west:    { count: 2, vehicles: ['v08'], distance: 2.2 },
  },
}

// Pattern B (K-Means + 最近傍)
export const AI_ASSIGNMENT_B = {
  id: 'ai_b',
  label: 'Pattern B',
  algo: 'K-Means + 最近傍法 (高速近似)',
  totalTime: 76, totalDistance: 16.8, unassigned: 2,
  constraints: { timeWindow: true, capacity: true, ng: true, crossFacility: false },
  facilityBlocks: [
    {
      facility: 'plus', leadTeacher: '松田先生',
      trips: [
        { tripNo: 1, vehicle: 'v04', teacher: '松田先生',
          childIds: ['c01', 'c26'], region: 'east',
          estDepart: '13:50', estArrive: '15:10' },
      ],
    },
    {
      facility: 'progress', leadTeacher: '鈴木先生',
      trips: [
        { tripNo: 1, vehicle: 'v01', teacher: '鈴木先生',
          childIds: ['c02', 'c03', 'c29'], region: 'central',
          estDepart: '14:10', estArrive: '15:15' },
      ],
    },
    {
      facility: 'labo', leadTeacher: '木村先生',
      trips: [
        { tripNo: 1, vehicle: 'v08', teacher: '木村先生',
          childIds: ['c22'], region: 'west',
          estDepart: '14:15', estArrive: '14:55' },
      ],
    },
    {
      facility: 'marche', leadTeacher: '佐藤先生',
      trips: [
        { tripNo: 1, vehicle: 'v06', teacher: '佐藤先生',
          childIds: ['c09', 'c10', 'c30'], region: 'central',
          estDepart: '14:30', estArrive: '15:55' },
      ],
    },
  ],
  unassignedChildIds: ['c06', 'c24', 'c11', 'c15', 'c19'],
  regionStats: {
    east:    { count: 2, vehicles: ['v04'], distance: 4.5 },
    central: { count: 6, vehicles: ['v01', 'v06'], distance: 8.2 },
    west:    { count: 1, vehicles: ['v08'], distance: 1.8 },
  },
}

// 互換性のため旧形式もエクスポート
export const SIMULATION_A = {
  id: 'sim_a', label: 'Pattern A - OR-Tools VRP', algo: 'vrp',
  totalTime: 68, totalDistance: 14.2, unassigned: 0,
  constraints: { timeWindow: true, capacity: true, ng: true, gender: true, crossFacility: true },
  routes: [
    { vehicle: 'v04', color: '#c78825', childIds: ['c01', 'c06', 'c11', 'c26'],
      stops: [
        { kind: 'depart', time: '13:50', x: 370, y: 270 },
        { schoolId: 'higashino', childId: 'c01', time: '14:32' },
        { schoolId: 'sakashita', childId: 'c11', time: '14:38' },
        { schoolId: 'degawa',    childId: 'c26', time: '14:42' },
        { schoolId: 'toubu',     childId: 'c06', time: '15:12' },
        { kind: 'arrive', time: '15:40', x: 370, y: 270 },
      ]},
    { vehicle: 'v01', color: '#6b7fa8', childIds: ['c02', 'c03', 'c29', 'c15'],
      stops: [
        { kind: 'depart', time: '14:10', x: 370, y: 270 },
        { schoolId: 'toriimatsu', childId: 'c02', time: '14:38' },
        { schoolId: 'oote',       childId: 'c29', time: '14:42' },
        { schoolId: 'shinoki',    childId: 'c15', time: '14:36' },
        { schoolId: 'jinryo',     childId: 'c03', time: '14:32' },
        { kind: 'arrive', time: '15:20', x: 370, y: 270 },
      ]},
    { vehicle: 'v06', color: '#4b6fa5', childIds: ['c09', 'c10', 'c24', 'c30'],
      stops: [
        { kind: 'depart', time: '14:30', x: 370, y: 270 },
        { schoolId: 'shoyo', childId: 'c09', time: '15:30' },
        { schoolId: 'shoyo', childId: 'c10', time: '15:32' },
        { schoolId: 'shoyo', childId: 'c24', time: '15:34' },
        { schoolId: 'shoyo', childId: 'c30', time: '15:35' },
        { kind: 'arrive', time: '16:00', x: 370, y: 270 },
      ]},
    { vehicle: 'v02', color: '#8ea892', childIds: ['c22', 'c19'],
      stops: [
        { kind: 'depart', time: '14:15', x: 370, y: 270 },
        { schoolId: 'kamijo', childId: 'c22', time: '14:35' },
        { schoolId: 'ono',    childId: 'c19', time: '14:38' },
        { kind: 'arrive', time: '15:00', x: 370, y: 270 },
      ]},
  ],
}

export const SIMULATION_B = {
  id: 'sim_b', label: 'Pattern B - K-Means + 近傍法', algo: 'heuristic',
  totalTime: 76, totalDistance: 16.8, unassigned: 2,
  constraints: { timeWindow: true, capacity: true, ng: true, gender: false, crossFacility: false },
  routes: [
    { vehicle: 'v04', color: '#c78825', childIds: ['c01', 'c11', 'c26'],
      stops: [
        { kind: 'depart', time: '13:50', x: 370, y: 270 },
        { schoolId: 'higashino', childId: 'c01', time: '14:32' },
        { schoolId: 'sakashita', childId: 'c11', time: '14:38' },
        { schoolId: 'degawa',    childId: 'c26', time: '14:42' },
        { kind: 'arrive', time: '15:10', x: 370, y: 270 },
      ]},
    { vehicle: 'v01', color: '#6b7fa8', childIds: ['c02', 'c03', 'c29'],
      stops: [
        { kind: 'depart', time: '14:10', x: 370, y: 270 },
        { schoolId: 'toriimatsu', childId: 'c02', time: '14:38' },
        { schoolId: 'oote',       childId: 'c29', time: '14:42' },
        { schoolId: 'jinryo',     childId: 'c03', time: '14:32' },
        { kind: 'arrive', time: '15:15', x: 370, y: 270 },
      ]},
    { vehicle: 'v06', color: '#4b6fa5', childIds: ['c09', 'c10', 'c30'],
      stops: [
        { kind: 'depart', time: '14:30', x: 370, y: 270 },
        { schoolId: 'shoyo', childId: 'c09', time: '15:30' },
        { schoolId: 'shoyo', childId: 'c10', time: '15:32' },
        { schoolId: 'shoyo', childId: 'c30', time: '15:35' },
        { kind: 'arrive', time: '15:55', x: 370, y: 270 },
      ]},
    { vehicle: 'v02', color: '#8ea892', childIds: ['c22'],
      stops: [
        { kind: 'depart', time: '14:15', x: 370, y: 270 },
        { schoolId: 'kamijo', childId: 'c22', time: '14:35' },
        { kind: 'arrive', time: '14:55', x: 370, y: 270 },
      ]},
  ],
  unassignedChildIds: ['c06', 'c24'],
}

export const RECENT_ACTIVITY = [
  { time: '09:12', type: 'warning', text: '加藤 結菜 — 本日欠席連絡（保護者より）' },
  { time: '08:55', type: 'sage',    text: '銀シエンタ — 午前便 送迎完了' },
  { time: '08:30', type: 'info',    text: '渡辺 颯太 — 送迎先住所が更新されました' },
  { time: '昨日 17:45', type: 'info', text: '送迎表（4/20）確定・PDFエクスポート' },
  { time: '昨日 15:00', type: 'sage', text: '新規登録：浅野 結衣' },
  { time: '昨日 10:30', type: 'info', text: 'HUGからの取込 — 受給者証30件の差分反映' },
]
