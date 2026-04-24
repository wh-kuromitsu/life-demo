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
  { id: 'east',    name: '東部',   color: '#e88442', bounds: { xMin: 500, xMax: 800, yMin: 0, yMax: 500 },
    desc: '神領・坂下・東野・高蔵寺エリア' },
  { id: 'central', name: '中央部', color: '#6fa373', bounds: { xMin: 300, xMax: 500, yMin: 0, yMax: 500 },
    desc: '鳥居松・篠木・八幡・北城エリア' },
  { id: 'west',    name: '西部',   color: '#d9992b', bounds: { xMin: 0,   xMax: 300, yMin: 0, yMax: 500 },
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
      { kind: 'school', childId: 'c01', name: 'ミナト レン', schoolId: 'higashino', time: '14:32' },
      { kind: 'school', childId: 'c06', name: 'リンド ユウ', schoolId: 'toubu', time: '15:12' },
      { kind: 'school', childId: 'c11', name: 'トワ ヒマリ', schoolId: 'sakashita', time: '14:35' },
      { kind: 'arrive', name: 'にじいろCOMMON', time: '15:40', x: 370, y: 270 },
    ],
    status: 'done',
  },
  {
    id: 't2', leg: 1, direction: 'pickup', vehicle: 'v01',
    departAt: '14:10',
    stops: [
      { kind: 'depart', name: 'にじいろCOMMON', time: '14:10' },
      { kind: 'school', childId: 'c02', name: 'アオリ ハナ', schoolId: 'toriimatsu', time: '14:38' },
      { kind: 'school', childId: 'c03', name: 'ホシノ アサ', schoolId: 'jinryo', time: '14:32' },
      { kind: 'school', childId: 'c29', name: 'サカリ ヒビキ', schoolId: 'oote', time: '14:35' },
      { kind: 'arrive', name: 'にじいろCOMMON', time: '15:15' },
    ],
    status: 'in_progress',
  },
  {
    id: 't3', leg: 2, direction: 'pickup', vehicle: 'v06',
    departAt: '14:30',
    stops: [
      { kind: 'depart', name: 'にじいろCOMMON', time: '14:30' },
      { kind: 'school', childId: 'c09', name: 'ヤヒロ ユコ', schoolId: 'shoyo', time: '15:32' },
      { kind: 'school', childId: 'c10', name: 'シズノ ハル', schoolId: 'shoyo', time: '15:33' },
      { kind: 'school', childId: 'c24', name: 'タニオ ハヤ', schoolId: 'shoyo', time: '15:35' },
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
      facility: 'plus', leadTeacher: 'ハヤセ先生',
      trips: [
        { tripNo: 1, vehicle: 'v04', teacher: 'ハヤセ先生',
          childIds: ['c01', 'c06', 'c26'], region: 'east',
          estDepart: '13:50', estArrive: '15:40' },
        { tripNo: 2, vehicle: 'v04', teacher: 'ハヤセ先生',
          childIds: ['c11'], region: 'east',
          estDepart: '14:20', estArrive: '15:00' },
      ],
    },
    {
      facility: 'progress', leadTeacher: 'ヨドミ先生',
      trips: [
        { tripNo: 1, vehicle: 'v01', teacher: 'ヨドミ先生',
          childIds: ['c02', 'c03', 'c29'], region: 'central',
          estDepart: '14:10', estArrive: '15:20' },
        { tripNo: 2, vehicle: 'v01', teacher: 'ヨドミ先生',
          childIds: ['c15'], region: 'central',
          estDepart: '14:35', estArrive: '15:15' },
      ],
    },
    {
      facility: 'labo', leadTeacher: 'キリノ先生',
      trips: [
        { tripNo: 1, vehicle: 'v08', teacher: 'キリノ先生',
          childIds: ['c22', 'c19'], region: 'west',
          estDepart: '14:15', estArrive: '15:00' },
      ],
    },
    {
      facility: 'marche', leadTeacher: 'アオリ先生',
      trips: [
        { tripNo: 1, vehicle: 'v06', teacher: 'アオリ先生',
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
      facility: 'plus', leadTeacher: 'ハヤセ先生',
      trips: [
        { tripNo: 1, vehicle: 'v04', teacher: 'ハヤセ先生',
          childIds: ['c01', 'c26'], region: 'east',
          estDepart: '13:50', estArrive: '15:10' },
      ],
    },
    {
      facility: 'progress', leadTeacher: 'ヨドミ先生',
      trips: [
        { tripNo: 1, vehicle: 'v01', teacher: 'ヨドミ先生',
          childIds: ['c02', 'c03', 'c29'], region: 'central',
          estDepart: '14:10', estArrive: '15:15' },
      ],
    },
    {
      facility: 'labo', leadTeacher: 'キリノ先生',
      trips: [
        { tripNo: 1, vehicle: 'v08', teacher: 'キリノ先生',
          childIds: ['c22'], region: 'west',
          estDepart: '14:15', estArrive: '14:55' },
      ],
    },
    {
      facility: 'marche', leadTeacher: 'アオリ先生',
      trips: [
        { tripNo: 1, vehicle: 'v06', teacher: 'アオリ先生',
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
  { time: '09:12', type: 'warning', text: 'カナン ユナ — 本日欠席連絡（保護者より）' },
  { time: '08:55', type: 'sage',    text: '銀シエンタ — 午前便 送迎完了' },
  { time: '08:30', type: 'info',    text: 'フウカ ソラ — 送迎先住所が更新されました' },
  { time: '昨日 17:45', type: 'info', text: '送迎表（4/20）確定・PDFエクスポート' },
  { time: '昨日 15:00', type: 'sage', text: '新規登録：アサギ ユイ' },
  { time: '昨日 10:30', type: 'info', text: 'HUGからの取込 — 受給者証30件の差分反映' },
]

// ═══════════════════════════════════════════════════════════════
// 過去の送迎組履歴（曜日別に参照可能）
// ─────────────────────────────────────────────────────────────
// 実運用では過去に確定した送迎組を日付付きでDBに保存し、
// 「同一曜日」で絞り込んで起点として再利用できるようにする。
// ─ 曜日: 0=日, 1=月, 2=火, 3=水, 4=木, 5=金, 6=土
// ═══════════════════════════════════════════════════════════════
export const PAST_ASSIGNMENTS = [
  {
    id: 'past_20260417',
    date: '2026-04-17',       // 金曜日
    dayOfWeek: 5,
    direction: 'pickup',
    label: '4/17(金) 迎え便',
    note: '前週の金曜。安定運用・制約違反ゼロで確定',
    confirmedBy: 'マキノ先生',
    facilityBlocks: [
      {
        facility: 'plus', leadTeacher: 'ハヤセ先生',
        trips: [
          { tripNo: 1, vehicle: 'v04', teacher: 'ハヤセ先生',
            childIds: ['c01', 'c06', 'c26'], region: 'east',
            estDepart: '13:50', estArrive: '15:40' },
          { tripNo: 2, vehicle: 'v04', teacher: 'ハヤセ先生',
            childIds: ['c11'], region: 'east',
            estDepart: '14:20', estArrive: '15:00' },
        ],
      },
      {
        facility: 'progress', leadTeacher: 'ヨドミ先生',
        trips: [
          { tripNo: 1, vehicle: 'v01', teacher: 'ヨドミ先生',
            childIds: ['c02', 'c03', 'c29'], region: 'central',
            estDepart: '14:10', estArrive: '15:20' },
          { tripNo: 2, vehicle: 'v01', teacher: 'ヨドミ先生',
            childIds: ['c15'], region: 'central',
            estDepart: '14:35', estArrive: '15:15' },
        ],
      },
      {
        facility: 'labo', leadTeacher: 'キリノ先生',
        trips: [
          { tripNo: 1, vehicle: 'v08', teacher: 'キリノ先生',
            childIds: ['c22', 'c19'], region: 'west',
            estDepart: '14:15', estArrive: '15:00' },
        ],
      },
      {
        facility: 'marche', leadTeacher: 'アオリ先生',
        trips: [
          { tripNo: 1, vehicle: 'v06', teacher: 'アオリ先生',
            childIds: ['c09', 'c10', 'c24', 'c30'], region: 'central',
            estDepart: '14:30', estArrive: '16:00',
            note: '翔陽連携4名 同便' },
        ],
      },
    ],
    unassignedChildIds: [],
    stats: { totalTime: 68, totalDistance: 14.2, tripCount: 6, childCount: 14 },
  },
  {
    id: 'past_20260410',
    date: '2026-04-10',       // 金曜日
    dayOfWeek: 5,
    direction: 'pickup',
    label: '4/10(金) 迎え便',
    note: '新年度初週。中村ひまりを2便目に分離した構成',
    confirmedBy: 'マキノ先生',
    facilityBlocks: [
      {
        facility: 'plus', leadTeacher: 'ハヤセ先生',
        trips: [
          { tripNo: 1, vehicle: 'v04', teacher: 'ハヤセ先生',
            childIds: ['c01', 'c06'], region: 'east',
            estDepart: '13:50', estArrive: '15:20' },
          { tripNo: 2, vehicle: 'v04', teacher: 'ハヤセ先生',
            childIds: ['c11', 'c26'], region: 'east',
            estDepart: '14:25', estArrive: '15:40' },
        ],
      },
      {
        facility: 'progress', leadTeacher: 'ヨドミ先生',
        trips: [
          { tripNo: 1, vehicle: 'v01', teacher: 'ヨドミ先生',
            childIds: ['c02', 'c03', 'c15', 'c29'], region: 'central',
            estDepart: '14:10', estArrive: '15:25' },
        ],
      },
      {
        facility: 'labo', leadTeacher: 'キリノ先生',
        trips: [
          { tripNo: 1, vehicle: 'v08', teacher: 'キリノ先生',
            childIds: ['c22', 'c19'], region: 'west',
            estDepart: '14:15', estArrive: '15:00' },
        ],
      },
      {
        facility: 'marche', leadTeacher: 'アオリ先生',
        trips: [
          { tripNo: 1, vehicle: 'v06', teacher: 'アオリ先生',
            childIds: ['c09', 'c10', 'c24', 'c30'], region: 'central',
            estDepart: '14:30', estArrive: '16:00' },
        ],
      },
    ],
    unassignedChildIds: [],
    stats: { totalTime: 72, totalDistance: 15.1, tripCount: 5, childCount: 14 },
  },
  {
    id: 'past_20260403',
    date: '2026-04-03',       // 金曜日
    dayOfWeek: 5,
    direction: 'pickup',
    label: '4/3(金) 迎え便',
    note: 'キリノ先生 研修のため労務調整あり',
    confirmedBy: 'マキノ先生',
    facilityBlocks: [
      {
        facility: 'plus', leadTeacher: 'ハヤセ先生',
        trips: [
          { tripNo: 1, vehicle: 'v04', teacher: 'ハヤセ先生',
            childIds: ['c01', 'c11', 'c26'], region: 'east',
            estDepart: '13:50', estArrive: '15:30' },
          { tripNo: 2, vehicle: 'v04', teacher: 'ハヤセ先生',
            childIds: ['c06'], region: 'east',
            estDepart: '14:40', estArrive: '15:20' },
        ],
      },
      {
        facility: 'progress', leadTeacher: 'ヨドミ先生',
        trips: [
          { tripNo: 1, vehicle: 'v01', teacher: 'ヨドミ先生',
            childIds: ['c02', 'c03', 'c29'], region: 'central',
            estDepart: '14:10', estArrive: '15:20' },
          { tripNo: 2, vehicle: 'v01', teacher: 'ヨドミ先生',
            childIds: ['c15', 'c19'], region: 'central',
            estDepart: '14:40', estArrive: '15:30' },
        ],
      },
      {
        facility: 'labo', leadTeacher: 'ハヤセ先生',
        trips: [
          { tripNo: 1, vehicle: 'v08', teacher: 'ハヤセ先生',
            childIds: ['c22'], region: 'west',
            estDepart: '14:15', estArrive: '14:55' },
        ],
      },
      {
        facility: 'marche', leadTeacher: 'アオリ先生',
        trips: [
          { tripNo: 1, vehicle: 'v06', teacher: 'アオリ先生',
            childIds: ['c09', 'c10', 'c24', 'c30'], region: 'central',
            estDepart: '14:30', estArrive: '16:00' },
        ],
      },
    ],
    unassignedChildIds: [],
    stats: { totalTime: 74, totalDistance: 15.6, tripCount: 6, childCount: 14 },
  },
  {
    id: 'past_20260416',
    date: '2026-04-16',       // 木曜日
    dayOfWeek: 4,
    direction: 'pickup',
    label: '4/16(木) 迎え便',
    note: '翔陽中の部活終了時刻変更に対応',
    confirmedBy: 'マキノ先生',
    facilityBlocks: [
      {
        facility: 'plus', leadTeacher: 'ハヤセ先生',
        trips: [
          { tripNo: 1, vehicle: 'v04', teacher: 'ハヤセ先生',
            childIds: ['c01', 'c06', 'c11', 'c26'], region: 'east',
            estDepart: '13:50', estArrive: '15:40' },
        ],
      },
      {
        facility: 'progress', leadTeacher: 'ヨドミ先生',
        trips: [
          { tripNo: 1, vehicle: 'v01', teacher: 'ヨドミ先生',
            childIds: ['c02', 'c03', 'c29'], region: 'central',
            estDepart: '14:10', estArrive: '15:20' },
          { tripNo: 2, vehicle: 'v01', teacher: 'ヨドミ先生',
            childIds: ['c15'], region: 'central',
            estDepart: '14:35', estArrive: '15:15' },
        ],
      },
      {
        facility: 'labo', leadTeacher: 'キリノ先生',
        trips: [
          { tripNo: 1, vehicle: 'v08', teacher: 'キリノ先生',
            childIds: ['c22', 'c19'], region: 'west',
            estDepart: '14:15', estArrive: '15:00' },
        ],
      },
      {
        facility: 'marche', leadTeacher: 'アオリ先生',
        trips: [
          { tripNo: 1, vehicle: 'v06', teacher: 'アオリ先生',
            childIds: ['c09', 'c10', 'c24', 'c30'], region: 'central',
            estDepart: '14:35', estArrive: '16:05' },
        ],
      },
    ],
    unassignedChildIds: [],
    stats: { totalTime: 70, totalDistance: 14.8, tripCount: 5, childCount: 14 },
  },
  {
    id: 'past_20260409',
    date: '2026-04-09',       // 木曜日
    dayOfWeek: 4,
    direction: 'pickup',
    label: '4/9(木) 迎え便',
    note: '標準的な木曜日の編成',
    confirmedBy: 'マキノ先生',
    facilityBlocks: [
      {
        facility: 'plus', leadTeacher: 'ハヤセ先生',
        trips: [
          { tripNo: 1, vehicle: 'v04', teacher: 'ハヤセ先生',
            childIds: ['c01', 'c06', 'c26'], region: 'east',
            estDepart: '13:50', estArrive: '15:30' },
          { tripNo: 2, vehicle: 'v04', teacher: 'ハヤセ先生',
            childIds: ['c11'], region: 'east',
            estDepart: '14:25', estArrive: '15:05' },
        ],
      },
      {
        facility: 'progress', leadTeacher: 'ヨドミ先生',
        trips: [
          { tripNo: 1, vehicle: 'v01', teacher: 'ヨドミ先生',
            childIds: ['c02', 'c03', 'c15', 'c29'], region: 'central',
            estDepart: '14:10', estArrive: '15:25' },
        ],
      },
      {
        facility: 'labo', leadTeacher: 'キリノ先生',
        trips: [
          { tripNo: 1, vehicle: 'v08', teacher: 'キリノ先生',
            childIds: ['c22', 'c19'], region: 'west',
            estDepart: '14:15', estArrive: '15:00' },
        ],
      },
      {
        facility: 'marche', leadTeacher: 'アオリ先生',
        trips: [
          { tripNo: 1, vehicle: 'v06', teacher: 'アオリ先生',
            childIds: ['c09', 'c10', 'c24', 'c30'], region: 'central',
            estDepart: '14:30', estArrive: '16:00' },
        ],
      },
    ],
    unassignedChildIds: [],
    stats: { totalTime: 69, totalDistance: 14.5, tripCount: 5, childCount: 14 },
  },
  {
    id: 'past_20260415',
    date: '2026-04-15',       // 水曜日
    dayOfWeek: 3,
    direction: 'pickup',
    label: '4/15(水) 迎え便',
    note: '水曜定例。4便で回せる編成',
    confirmedBy: 'マキノ先生',
    facilityBlocks: [
      {
        facility: 'plus', leadTeacher: 'ハヤセ先生',
        trips: [
          { tripNo: 1, vehicle: 'v04', teacher: 'ハヤセ先生',
            childIds: ['c01', 'c06', 'c11', 'c26'], region: 'east',
            estDepart: '13:50', estArrive: '15:35' },
        ],
      },
      {
        facility: 'progress', leadTeacher: 'ヨドミ先生',
        trips: [
          { tripNo: 1, vehicle: 'v01', teacher: 'ヨドミ先生',
            childIds: ['c02', 'c03', 'c15', 'c29'], region: 'central',
            estDepart: '14:10', estArrive: '15:25' },
        ],
      },
      {
        facility: 'labo', leadTeacher: 'キリノ先生',
        trips: [
          { tripNo: 1, vehicle: 'v08', teacher: 'キリノ先生',
            childIds: ['c22', 'c19'], region: 'west',
            estDepart: '14:15', estArrive: '15:00' },
        ],
      },
      {
        facility: 'marche', leadTeacher: 'アオリ先生',
        trips: [
          { tripNo: 1, vehicle: 'v06', teacher: 'アオリ先生',
            childIds: ['c09', 'c10', 'c24', 'c30'], region: 'central',
            estDepart: '14:30', estArrive: '16:00' },
        ],
      },
    ],
    unassignedChildIds: [],
    stats: { totalTime: 67, totalDistance: 13.9, tripCount: 4, childCount: 14 },
  },
  {
    id: 'past_20260414',
    date: '2026-04-14',       // 火曜日
    dayOfWeek: 2,
    direction: 'pickup',
    label: '4/14(火) 迎え便',
    confirmedBy: 'マキノ先生',
    facilityBlocks: [
      {
        facility: 'plus', leadTeacher: 'ハヤセ先生',
        trips: [
          { tripNo: 1, vehicle: 'v04', teacher: 'ハヤセ先生',
            childIds: ['c01', 'c06', 'c26'], region: 'east',
            estDepart: '13:50', estArrive: '15:30' },
          { tripNo: 2, vehicle: 'v04', teacher: 'ハヤセ先生',
            childIds: ['c11'], region: 'east',
            estDepart: '14:25', estArrive: '15:05' },
        ],
      },
      {
        facility: 'progress', leadTeacher: 'ヨドミ先生',
        trips: [
          { tripNo: 1, vehicle: 'v01', teacher: 'ヨドミ先生',
            childIds: ['c02', 'c03', 'c29'], region: 'central',
            estDepart: '14:10', estArrive: '15:20' },
          { tripNo: 2, vehicle: 'v01', teacher: 'ヨドミ先生',
            childIds: ['c15'], region: 'central',
            estDepart: '14:35', estArrive: '15:15' },
        ],
      },
      {
        facility: 'labo', leadTeacher: 'キリノ先生',
        trips: [
          { tripNo: 1, vehicle: 'v08', teacher: 'キリノ先生',
            childIds: ['c22', 'c19'], region: 'west',
            estDepart: '14:15', estArrive: '15:00' },
        ],
      },
      {
        facility: 'marche', leadTeacher: 'アオリ先生',
        trips: [
          { tripNo: 1, vehicle: 'v06', teacher: 'アオリ先生',
            childIds: ['c09', 'c10', 'c24', 'c30'], region: 'central',
            estDepart: '14:30', estArrive: '16:00' },
        ],
      },
    ],
    unassignedChildIds: [],
    stats: { totalTime: 68, totalDistance: 14.2, tripCount: 6, childCount: 14 },
  },
  {
    id: 'past_20260413',
    date: '2026-04-13',       // 月曜日
    dayOfWeek: 1,
    direction: 'pickup',
    label: '4/13(月) 迎え便',
    note: '月曜は学童3名追加（c24, c30含む）',
    confirmedBy: 'マキノ先生',
    facilityBlocks: [
      {
        facility: 'plus', leadTeacher: 'ハヤセ先生',
        trips: [
          { tripNo: 1, vehicle: 'v04', teacher: 'ハヤセ先生',
            childIds: ['c01', 'c06', 'c26'], region: 'east',
            estDepart: '13:50', estArrive: '15:30' },
          { tripNo: 2, vehicle: 'v04', teacher: 'ハヤセ先生',
            childIds: ['c11'], region: 'east',
            estDepart: '14:25', estArrive: '15:05' },
        ],
      },
      {
        facility: 'progress', leadTeacher: 'ヨドミ先生',
        trips: [
          { tripNo: 1, vehicle: 'v01', teacher: 'ヨドミ先生',
            childIds: ['c02', 'c03', 'c29'], region: 'central',
            estDepart: '14:10', estArrive: '15:20' },
          { tripNo: 2, vehicle: 'v01', teacher: 'ヨドミ先生',
            childIds: ['c15'], region: 'central',
            estDepart: '14:35', estArrive: '15:15' },
        ],
      },
      {
        facility: 'labo', leadTeacher: 'キリノ先生',
        trips: [
          { tripNo: 1, vehicle: 'v08', teacher: 'キリノ先生',
            childIds: ['c22', 'c19'], region: 'west',
            estDepart: '14:15', estArrive: '15:00' },
        ],
      },
      {
        facility: 'marche', leadTeacher: 'アオリ先生',
        trips: [
          { tripNo: 1, vehicle: 'v06', teacher: 'アオリ先生',
            childIds: ['c09', 'c10', 'c24', 'c30'], region: 'central',
            estDepart: '14:30', estArrive: '16:00' },
        ],
      },
    ],
    unassignedChildIds: [],
    stats: { totalTime: 68, totalDistance: 14.2, tripCount: 6, childCount: 14 },
  },

  // ─── 土曜日の過去組 × 2回分 ───
  // 放デイは土曜終日開所。平日と異なり
  //   ・家→事業所の朝迎え便（9:00-10:00）
  //   ・学校送迎がないため便数が少なく、1施設1便で収まることが多い
  //   ・利用児童は共働き家庭中心で平日より2〜3割少ない
  {
    id: 'past_20260418',
    date: '2026-04-18',       // 土曜日
    dayOfWeek: 6,
    direction: 'pickup',
    label: '4/18(土) 朝迎え便',
    note: '土曜は家→事業所の朝迎え。利用児童9名で2便構成',
    confirmedBy: 'マキノ先生',
    facilityBlocks: [
      {
        facility: 'plus', leadTeacher: 'ハヤセ先生',
        trips: [
          { tripNo: 1, vehicle: 'v04', teacher: 'ハヤセ先生',
            childIds: ['c01', 'c26', 'c11'], region: 'east',
            estDepart: '09:00', estArrive: '09:55',
            note: '土曜は自宅迎え（学校送迎なし）' },
        ],
      },
      {
        facility: 'progress', leadTeacher: 'ヨドミ先生',
        trips: [
          { tripNo: 1, vehicle: 'v01', teacher: 'ヨドミ先生',
            childIds: ['c02', 'c03', 'c29'], region: 'central',
            estDepart: '09:15', estArrive: '10:05' },
        ],
      },
      {
        facility: 'marche', leadTeacher: 'アオリ先生',
        trips: [
          { tripNo: 1, vehicle: 'v06', teacher: 'アオリ先生',
            childIds: ['c09', 'c10', 'c30'], region: 'central',
            estDepart: '09:30', estArrive: '10:20' },
        ],
      },
    ],
    unassignedChildIds: [],
    stats: { totalTime: 42, totalDistance: 9.8, tripCount: 3, childCount: 9 },
  },
  {
    id: 'past_20260418_drop',
    date: '2026-04-18',
    dayOfWeek: 6,
    direction: 'dropoff',
    label: '4/18(土) 夕送り便',
    note: '同日の夕送り。16:30〜18:00に自宅へ',
    confirmedBy: 'マキノ先生',
    facilityBlocks: [
      {
        facility: 'plus', leadTeacher: 'ハヤセ先生',
        trips: [
          { tripNo: 1, vehicle: 'v04', teacher: 'ハヤセ先生',
            childIds: ['c01', 'c26', 'c11'], region: 'east',
            estDepart: '16:30', estArrive: '17:25' },
        ],
      },
      {
        facility: 'progress', leadTeacher: 'ヨドミ先生',
        trips: [
          { tripNo: 1, vehicle: 'v01', teacher: 'ヨドミ先生',
            childIds: ['c02', 'c03', 'c29'], region: 'central',
            estDepart: '16:45', estArrive: '17:35' },
        ],
      },
      {
        facility: 'marche', leadTeacher: 'アオリ先生',
        trips: [
          { tripNo: 1, vehicle: 'v06', teacher: 'アオリ先生',
            childIds: ['c09', 'c10', 'c30'], region: 'central',
            estDepart: '17:00', estArrive: '17:55' },
        ],
      },
    ],
    unassignedChildIds: [],
    stats: { totalTime: 42, totalDistance: 9.8, tripCount: 3, childCount: 9 },
  },
  {
    id: 'past_20260411',
    date: '2026-04-11',       // 土曜日
    dayOfWeek: 6,
    direction: 'pickup',
    label: '4/11(土) 朝迎え便',
    note: '新年度初の土曜。利用12名でPLUS便を2便に分けた',
    confirmedBy: 'マキノ先生',
    facilityBlocks: [
      {
        facility: 'plus', leadTeacher: 'ハヤセ先生',
        trips: [
          { tripNo: 1, vehicle: 'v04', teacher: 'ハヤセ先生',
            childIds: ['c01', 'c06', 'c26'], region: 'east',
            estDepart: '09:00', estArrive: '09:55' },
          { tripNo: 2, vehicle: 'v01', teacher: 'ハヤセ先生',
            childIds: ['c11'], region: 'east',
            estDepart: '09:20', estArrive: '09:50',
            note: '同乗NG回避のため別便' },
        ],
      },
      {
        facility: 'progress', leadTeacher: 'ヨドミ先生',
        trips: [
          { tripNo: 1, vehicle: 'v06', teacher: 'ヨドミ先生',
            childIds: ['c02', 'c03', 'c15', 'c29'], region: 'central',
            estDepart: '09:15', estArrive: '10:15' },
        ],
      },
      {
        facility: 'labo', leadTeacher: 'キリノ先生',
        trips: [
          { tripNo: 1, vehicle: 'v08', teacher: 'キリノ先生',
            childIds: ['c22', 'c19'], region: 'west',
            estDepart: '09:30', estArrive: '10:10' },
        ],
      },
      {
        facility: 'marche', leadTeacher: 'アオリ先生',
        trips: [
          { tripNo: 1, vehicle: 'v05', teacher: 'アオリ先生',
            childIds: ['c09', 'c10', 'c24', 'c30'], region: 'central',
            estDepart: '09:45', estArrive: '10:45' },
        ],
      },
    ],
    unassignedChildIds: [],
    stats: { totalTime: 54, totalDistance: 12.1, tripCount: 5, childCount: 12 },
  },

  // ─── 日曜日 ───
  // 日曜は一部の事業所のみ開所（needs対応）。便数はさらに少ない。
  {
    id: 'past_20260419',
    date: '2026-04-19',       // 日曜日
    dayOfWeek: 0,
    direction: 'pickup',
    label: '4/19(日) 朝迎え便',
    note: '日曜は PLUS/MARCHE のみ開所。利用5名',
    confirmedBy: 'マキノ先生',
    facilityBlocks: [
      {
        facility: 'plus', leadTeacher: 'ハヤセ先生',
        trips: [
          { tripNo: 1, vehicle: 'v01', teacher: 'ハヤセ先生',
            childIds: ['c01', 'c26'], region: 'east',
            estDepart: '09:00', estArrive: '09:45',
            note: '日曜は少人数なので小型車で対応' },
        ],
      },
      {
        facility: 'marche', leadTeacher: 'アオリ先生',
        trips: [
          { tripNo: 1, vehicle: 'v06', teacher: 'アオリ先生',
            childIds: ['c09', 'c10', 'c30'], region: 'central',
            estDepart: '09:30', estArrive: '10:20' },
        ],
      },
    ],
    unassignedChildIds: [],
    stats: { totalTime: 30, totalDistance: 6.5, tripCount: 2, childCount: 5 },
  },
  {
    id: 'past_20260412',
    date: '2026-04-12',       // 日曜日
    dayOfWeek: 0,
    direction: 'pickup',
    label: '4/12(日) 朝迎え便',
    note: '日曜定例。MARCHE単発の少人数運用',
    confirmedBy: 'マキノ先生',
    facilityBlocks: [
      {
        facility: 'marche', leadTeacher: 'アオリ先生',
        trips: [
          { tripNo: 1, vehicle: 'v06', teacher: 'アオリ先生',
            childIds: ['c09', 'c10', 'c24', 'c30'], region: 'central',
            estDepart: '09:30', estArrive: '10:25' },
        ],
      },
    ],
    unassignedChildIds: [],
    stats: { totalTime: 25, totalDistance: 4.2, tripCount: 1, childCount: 4 },
  },
]

// 日付文字列(YYYY-MM-DD)から曜日(0=日 ... 6=土)を取得
export function getDayOfWeek(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return null
  return d.getDay()
}

// 曜日インデックスを日本語表記に変換
export const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土']

// 指定日付と同一曜日かつ指定方向の過去送迎組を、新しい順に返す
export function findPastAssignmentsBy({ date, direction }) {
  const dow = getDayOfWeek(date)
  if (dow == null) return []
  return PAST_ASSIGNMENTS
    .filter(p =>
      p.dayOfWeek === dow &&
      (direction ? p.direction === direction : true) &&
      p.date < date                 // 選択日より過去のみ
    )
    .sort((a, b) => b.date.localeCompare(a.date))
}
