// 本日の送迎便（既存）・シミュレーション結果(Pattern A/B)
// 児童IDベースでリンク
// BASE = にじいろCOMMON（横断連携拠点）を出発地と仮定
// SVG座標: (370, 270)

export const BASE = {
  id: 'base', name: 'にじいろCOMMON', address: '春日井市篠木町2丁目1281番地1',
  x: 370, y: 270,
}

// ─── 本日の確定便（午後便）───
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

// ─── 送迎シミュレーション (Pattern A: OR-Tools VRP) ───
export const SIMULATION_A = {
  id: 'sim_a', label: 'Pattern A - OR-Tools VRP', algo: 'vrp',
  totalTime: 68, totalDistance: 14.2, unassigned: 0,
  constraints: { timeWindow: true, capacity: true, ng: true, gender: true, crossFacility: true },
  routes: [
    {
      vehicle: 'v04', color: '#c78825',
      childIds: ['c01', 'c06', 'c11', 'c26'],
      stops: [
        { kind: 'depart', time: '13:50', x: 370, y: 270 },
        { schoolId: 'higashino', childId: 'c01', time: '14:32' },
        { schoolId: 'sakashita', childId: 'c11', time: '14:38' },
        { schoolId: 'degawa',    childId: 'c26', time: '14:42' },
        { schoolId: 'toubu',     childId: 'c06', time: '15:12' },
        { kind: 'arrive', time: '15:40', x: 370, y: 270 },
      ],
    },
    {
      vehicle: 'v01', color: '#6b7fa8',
      childIds: ['c02', 'c03', 'c29', 'c15'],
      stops: [
        { kind: 'depart', time: '14:10', x: 370, y: 270 },
        { schoolId: 'toriimatsu', childId: 'c02', time: '14:38' },
        { schoolId: 'oote',       childId: 'c29', time: '14:42' },
        { schoolId: 'shinoki',    childId: 'c15', time: '14:36' },
        { schoolId: 'jinryo',     childId: 'c03', time: '14:32' },
        { kind: 'arrive', time: '15:20', x: 370, y: 270 },
      ],
    },
    {
      vehicle: 'v06', color: '#4b6fa5',
      childIds: ['c09', 'c10', 'c24', 'c30'],
      stops: [
        { kind: 'depart', time: '14:30', x: 370, y: 270 },
        { schoolId: 'shoyo', childId: 'c09', time: '15:30' },
        { schoolId: 'shoyo', childId: 'c10', time: '15:32' },
        { schoolId: 'shoyo', childId: 'c24', time: '15:34' },
        { schoolId: 'shoyo', childId: 'c30', time: '15:35' },
        { kind: 'arrive', time: '16:00', x: 370, y: 270 },
      ],
    },
    {
      vehicle: 'v02', color: '#8ea892',
      childIds: ['c22', 'c19'],
      stops: [
        { kind: 'depart', time: '14:15', x: 370, y: 270 },
        { schoolId: 'kamijo', childId: 'c22', time: '14:35' },
        { schoolId: 'ono',    childId: 'c19', time: '14:38' },
        { kind: 'arrive', time: '15:00', x: 370, y: 270 },
      ],
    },
  ],
}

// ─── Pattern B: K-Means + 最近傍（手動調整向き） ───
export const SIMULATION_B = {
  id: 'sim_b', label: 'Pattern B - K-Means + 近傍法', algo: 'heuristic',
  totalTime: 76, totalDistance: 16.8, unassigned: 2,
  constraints: { timeWindow: true, capacity: true, ng: true, gender: false, crossFacility: false },
  routes: [
    {
      vehicle: 'v04', color: '#c78825',
      childIds: ['c01', 'c11', 'c26'],
      stops: [
        { kind: 'depart', time: '13:50', x: 370, y: 270 },
        { schoolId: 'higashino', childId: 'c01', time: '14:32' },
        { schoolId: 'sakashita', childId: 'c11', time: '14:38' },
        { schoolId: 'degawa',    childId: 'c26', time: '14:42' },
        { kind: 'arrive', time: '15:10', x: 370, y: 270 },
      ],
    },
    {
      vehicle: 'v01', color: '#6b7fa8',
      childIds: ['c02', 'c03', 'c29'],
      stops: [
        { kind: 'depart', time: '14:10', x: 370, y: 270 },
        { schoolId: 'toriimatsu', childId: 'c02', time: '14:38' },
        { schoolId: 'oote',       childId: 'c29', time: '14:42' },
        { schoolId: 'jinryo',     childId: 'c03', time: '14:32' },
        { kind: 'arrive', time: '15:15', x: 370, y: 270 },
      ],
    },
    {
      vehicle: 'v06', color: '#4b6fa5',
      childIds: ['c09', 'c10', 'c30'],
      stops: [
        { kind: 'depart', time: '14:30', x: 370, y: 270 },
        { schoolId: 'shoyo', childId: 'c09', time: '15:30' },
        { schoolId: 'shoyo', childId: 'c10', time: '15:32' },
        { schoolId: 'shoyo', childId: 'c30', time: '15:35' },
        { kind: 'arrive', time: '15:55', x: 370, y: 270 },
      ],
    },
    {
      vehicle: 'v02', color: '#8ea892',
      childIds: ['c22'],
      stops: [
        { kind: 'depart', time: '14:15', x: 370, y: 270 },
        { schoolId: 'kamijo', childId: 'c22', time: '14:35' },
        { kind: 'arrive', time: '14:55', x: 370, y: 270 },
      ],
    },
  ],
  unassignedChildIds: ['c06', 'c24'],
}

export const RECENT_ACTIVITY = [
  { time: '09:12', type: 'warning', text: '加藤 結菜 — 本日欠席連絡（保護者より）' },
  { time: '08:55', type: 'sage',    text: '銀シエンタ — 午前便 送迎完了' },
  { time: '08:30', type: 'info',    text: '渡辺 颯太 — 送迎先住所が更新されました' },
  { time: '昨日 17:45', type: 'info',    text: '送迎表（4/20）確定・PDFエクスポート' },
  { time: '昨日 15:00', type: 'sage',    text: '新規登録：浅野 結衣' },
  { time: '昨日 10:30', type: 'info',    text: 'HUGからの取込 — 受給者証30件の差分反映' },
]
