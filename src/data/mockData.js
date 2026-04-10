export const customers = [
  {
    id: 1, name: '田中 蓮', kana: 'タナカ レン', age: 9,
    facility: 'にじいろPLUS', address: '愛知県春日井市柏原町2-5-12',
    transport: true,
    daySchedule: {
      月: { pickup: '14:30', dropoff: '17:45' },
      火: { pickup: '14:30', dropoff: '17:45' },
      水: { pickup: '14:30', dropoff: '17:45' },
      木: { pickup: '14:30', dropoff: '17:45' },
    },
    status: 'active', guardian: '田中 美咲', guardianTel: '090-1234-5678'
  },
  {
    id: 2, name: '佐藤 陽菜', kana: 'サトウ ハナ', age: 7,
    facility: 'にじいろPLUS', address: '愛知県春日井市鳥居松町3-2-8',
    transport: true,
    daySchedule: {
      月: { pickup: '14:00', dropoff: '17:30' },
      水: { pickup: '14:00', dropoff: '17:30' },
      金: { pickup: '13:30', dropoff: '17:00' },
    },
    status: 'active', guardian: '佐藤 隆', guardianTel: '090-2345-6789'
  },
  {
    id: 3, name: '山本 悠斗', kana: 'ヤマモト ユウト', age: 12,
    facility: 'にじいろLABO', address: '愛知県春日井市東野町5-8-3',
    transport: true,
    daySchedule: {
      火: { pickup: '15:30', dropoff: '18:00' },
      木: { pickup: '15:30', dropoff: '18:00' },
      金: { pickup: '15:00', dropoff: '18:30' },
    },
    status: 'active', guardian: '山本 健二', guardianTel: '090-3456-7890'
  },
  {
    id: 4, name: '伊藤 さくら', kana: 'イトウ サクラ', age: 6,
    facility: 'にじいろPALETTE', address: '愛知県春日井市高蔵寺町1-12-4',
    transport: false,
    daySchedule: {
      月: { pickup: '09:00', dropoff: '12:00' },
      火: { pickup: '09:00', dropoff: '12:00' },
      水: { pickup: '09:00', dropoff: '12:00' },
      木: { pickup: '09:00', dropoff: '12:00' },
      金: { pickup: '09:00', dropoff: '12:00' },
    },
    status: 'active', guardian: '伊藤 由美', guardianTel: '090-4567-8901'
  },
  {
    id: 5, name: '渡辺 颯太', kana: 'ワタナベ ソウタ', age: 14,
    facility: 'NIJIIRONOBA', address: '愛知県春日井市勝川町6-3-9',
    transport: true,
    daySchedule: {
      月: { pickup: '15:00', dropoff: '18:30' },
      水: { pickup: '15:00', dropoff: '18:30' },
      金: { pickup: '14:30', dropoff: '18:00' },
    },
    status: 'active', guardian: '渡辺 明', guardianTel: '090-5678-9012'
  },
  {
    id: 6, name: '中村 ひまり', kana: 'ナカムラ ヒマリ', age: 10,
    facility: 'にじいろPROGRESS', address: '愛知県春日井市松河戸町4-7-2',
    transport: true,
    daySchedule: {
      月: { pickup: '14:30', dropoff: '17:45' },
      火: { pickup: '14:30', dropoff: '17:45' },
      木: { pickup: '14:00', dropoff: '17:30' },
    },
    status: 'inactive', guardian: '中村 千代', guardianTel: '090-6789-0123'
  },
  {
    id: 7, name: '小林 朝陽', kana: 'コバヤシ アサヒ', age: 8,
    facility: 'にじいろPLUS', address: '愛知県春日井市神領町7-1-15',
    transport: true,
    daySchedule: {
      火: { pickup: '14:00', dropoff: '17:30' },
      水: { pickup: '14:00', dropoff: '17:30' },
      木: { pickup: '14:00', dropoff: '17:30' },
      金: { pickup: '13:30', dropoff: '17:00' },
    },
    status: 'active', guardian: '小林 奈緒', guardianTel: '090-7890-1234'
  },
  {
    id: 8, name: '加藤 結菜', kana: 'カトウ ユナ', age: 5,
    facility: 'にじいろPALETTE', address: '愛知県春日井市大手町2-9-6',
    transport: true,
    daySchedule: {
      月: { pickup: '09:30', dropoff: '12:30' },
      火: { pickup: '09:30', dropoff: '12:30' },
      水: { pickup: '10:00', dropoff: '13:00' },
    },
    status: 'active', guardian: '加藤 陽子', guardianTel: '090-8901-2345'
  },
]

export const vehicles = [
  { id: 'v1', name: '車両A（ハイエース）', capacity: 8, driver: '松田 一郎', tel: '090-1111-2222', color: '#2e7df7' },
  { id: 'v2', name: '車両B（ノア）', capacity: 6, driver: '鈴木 二郎', tel: '090-2222-3333', color: '#22c55e' },
  { id: 'v3', name: '車両C（ステップワゴン）', capacity: 6, driver: '木村 三郎', tel: '090-3333-4444', color: '#f59e0b' },
]

export const todayRoutes = [
  {
    vehicle: '車両A（ハイエース）', driver: '松田 一郎', color: '#2e7df7', type: '迎え', depart: '13:50',
    stops: [
      { name: '出発：にじいろPLUS', time: '13:50', type: 'base' },
      { name: '田中 蓮（春日井市柏原町）', time: '14:30', type: 'pickup' },
      { name: '小林 朝陽（春日井市神領町）', time: '14:45', type: 'pickup' },
      { name: '佐藤 陽菜（春日井市鳥居松町）', time: '15:05', type: 'pickup' },
      { name: '到着：にじいろPLUS', time: '15:30', type: 'base' },
    ]
  },
  {
    vehicle: '車両B（ノア）', driver: '鈴木 二郎', color: '#22c55e', type: '迎え', depart: '14:40',
    stops: [
      { name: '出発：にじいろLABO', time: '14:40', type: 'base' },
      { name: '渡辺 颯太（春日井市勝川町）', time: '15:00', type: 'pickup' },
      { name: '山本 悠斗（春日井市東野町）', time: '15:22', type: 'pickup' },
      { name: '到着：にじいろLABO', time: '15:45', type: 'base' },
    ]
  },
  {
    vehicle: '車両A（ハイエース）', driver: '松田 一郎', color: '#2e7df7', type: '送り', depart: '17:30',
    stops: [
      { name: '出発：にじいろPLUS', time: '17:30', type: 'base' },
      { name: '佐藤 陽菜（春日井市鳥居松町）', time: '17:48', type: 'dropoff' },
      { name: '田中 蓮（春日井市柏原町）', time: '18:02', type: 'dropoff' },
      { name: '小林 朝陽（春日井市神領町）', time: '18:20', type: 'dropoff' },
      { name: '帰着：にじいろPLUS', time: '18:35', type: 'base' },
    ]
  },
]

export const stats = {
  totalCustomers: 47, activeToday: 18, transportToday: 14,
  vehicles: 3, incidents: 0, newThisMonth: 3,
}

export const recentActivity = [
  { time: '09:12', text: '加藤 結菜 — 本日欠席連絡（保護者より）', type: 'warning' },
  { time: '08:55', text: '車両B — 送迎完了（午前便）', type: 'success' },
  { time: '08:30', text: '渡辺 颯太 — 送迎ルート更新（住所変更）', type: 'info' },
  { time: '昨日 17:45', text: '送迎表（2026/04/09）確定・PDF出力', type: 'info' },
  { time: '昨日 15:00', text: '新規登録：加藤 結菜', type: 'success' },
]
