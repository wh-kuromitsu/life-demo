// サンプル児童30名（仮名）
// 実運用パターンを織り込む:
// - 春日井翔陽高等学院連携（自社通信制高校）
// - 祖父母宅送迎
// - 時間指定児童（古い契約の残存）
// - 同乗NGペア
// - アレルギー/医療情報
// - 学童経由（なかよし等）
// - イレギュラー（契約なし/特例）

export const CHILDREN = [
  // ─── 放デイ PLUS (小学校中心) ───
  {
    id: 'c01', name: '田中 蓮', kana: 'タナカ レン', gender: '男', age: 9, grade: '小3',
    facility: 'plus', school: 'higashino', pickupLoc: 'home',
    address: '春日井市柏原町2-5-12', homeX: 300, homeY: 360,
    transport: true, safetyReq: false,
    schedule: { 月: 'both', 火: 'both', 水: 'both', 木: 'both' },
    pickupNote: '', dropoffNote: '',
    disability: '自閉症スペクトラム障害', allergies: [], medical: '',
    certExpiry: '2026-09-30',
    guardian: { name: '田中 美咲', rel: '母', tel: '090-1234-5678' },
    ngWith: [], priority: 3, status: 'active',
  },
  {
    id: 'c02', name: '佐藤 陽菜', kana: 'サトウ ハナ', gender: '女', age: 7, grade: '小2',
    facility: 'plus', school: 'toriimatsu', pickupLoc: 'school',
    address: '春日井市鳥居松町3-2-8', homeX: 340, homeY: 250,
    transport: true, safetyReq: true,
    schedule: { 月: 'both', 水: 'both', 金: 'both' },
    pickupNote: '', dropoffNote: '17:45以降希望（古い契約）',
    disability: 'ADHD', allergies: ['卵'], medical: '',
    certExpiry: '2027-03-31',
    guardian: { name: '佐藤 隆', rel: '父', tel: '090-2345-6789' },
    ngWith: [], priority: 2, status: 'active',
  },
  {
    id: 'c03', name: '小林 朝陽', kana: 'コバヤシ アサヒ', gender: '男', age: 8, grade: '小3',
    facility: 'plus', school: 'jinryo', pickupLoc: 'school',
    address: '春日井市神領町7-1-15', homeX: 600, homeY: 350,
    transport: true, safetyReq: false,
    schedule: { 火: 'both', 水: 'both', 木: 'both', 金: 'both' },
    pickupNote: '北昇降口', dropoffNote: '',
    disability: '学習障害（ディスレクシア）', allergies: [], medical: '',
    certExpiry: '2026-11-15',
    guardian: { name: '小林 奈緒', rel: '母', tel: '090-7890-1234' },
    ngWith: [], priority: 3, status: 'active',
  },

  // ─── 児発 PALETTE (未就学) ───
  {
    id: 'c04', name: '伊藤 さくら', kana: 'イトウ サクラ', gender: '女', age: 5, grade: '年長',
    facility: 'palette', school: null, pickupLoc: 'home',
    address: '春日井市高蔵寺町1-12-4', homeX: 670, homeY: 120,
    transport: false, safetyReq: false,
    schedule: { 月: 'none', 火: 'none', 水: 'none', 木: 'none', 金: 'none' },
    pickupNote: '保護者送迎', dropoffNote: '',
    disability: '発達性協調運動障害', allergies: ['乳'], medical: '',
    certExpiry: '2026-12-20',
    guardian: { name: '伊藤 由美', rel: '母', tel: '090-4567-8901' },
    ngWith: [], priority: 3, status: 'active',
  },
  {
    id: 'c05', name: '加藤 結菜', kana: 'カトウ ユナ', gender: '女', age: 5, grade: '年長',
    facility: 'palette', school: null, pickupLoc: 'home',
    address: '春日井市大手町2-9-6', homeX: 290, homeY: 290,
    transport: true, safetyReq: true,
    schedule: { 月: 'both', 火: 'both', 水: 'both' },
    pickupNote: '', dropoffNote: '',
    disability: '知的障がい（B2）', allergies: [], medical: 'てんかん（部分）',
    certExpiry: '2027-01-10',
    guardian: { name: '加藤 陽子', rel: '母', tel: '090-8901-2345' },
    ngWith: [], priority: 2, status: 'active',
  },

  // ─── 放デイ LABO ───
  {
    id: 'c06', name: '山本 悠斗', kana: 'ヤマモト ユウト', gender: '男', age: 12, grade: '小6',
    facility: 'labo', school: 'toubu', pickupLoc: 'school',
    address: '春日井市東野町5-8-3', homeX: 540, homeY: 220,
    transport: true, safetyReq: false,
    schedule: { 火: 'both', 木: 'both', 金: 'both' },
    pickupNote: '', dropoffNote: '',
    disability: '自閉症スペクトラム障害', allergies: ['そば'], medical: '',
    certExpiry: '2026-08-31',
    guardian: { name: '山本 健二', rel: '父', tel: '090-3456-7890' },
    ngWith: ['c07'], priority: 3, status: 'active',
  },
  {
    id: 'c07', name: '石川 直樹', kana: 'イシカワ ナオキ', gender: '男', age: 11, grade: '小6',
    facility: 'labo', school: 'toubu', pickupLoc: 'school',
    address: '春日井市東野町6-2-1', homeX: 555, homeY: 195,
    transport: true, safetyReq: false,
    schedule: { 火: 'both', 木: 'both' },
    pickupNote: '', dropoffNote: '',
    disability: 'ADHD', allergies: [], medical: '',
    certExpiry: '2026-07-20',
    guardian: { name: '石川 愛子', rel: '母', tel: '090-1002-3004' },
    ngWith: ['c06'], priority: 3, status: 'active',
    tag: '同乗NG',
  },

  // ─── 放デイ NOBA (中学生・高校生) ───
  {
    id: 'c08', name: '渡辺 颯太', kana: 'ワタナベ ソウタ', gender: '男', age: 14, grade: '中2',
    facility: 'noba', school: 'chubu', pickupLoc: 'school',
    address: '春日井市勝川町6-3-9', homeX: 280, homeY: 420,
    transport: true, safetyReq: false,
    schedule: { 月: 'both', 水: 'both', 金: 'both' },
    pickupNote: '', dropoffNote: '18:00まで希望',
    disability: '適応障害', allergies: [], medical: '',
    certExpiry: '2027-02-28',
    guardian: { name: '渡辺 明', rel: '父', tel: '090-5678-9012' },
    ngWith: [], priority: 2, status: 'active',
  },
  {
    id: 'c09', name: '野村 優子', kana: 'ノムラ ユウコ', gender: '女', age: 16, grade: '高1',
    facility: 'noba', school: 'shoyo', pickupLoc: 'school',
    address: '春日井市松原町4-6-11', homeX: 330, homeY: 190,
    transport: true, safetyReq: false,
    schedule: { 月: 'both', 火: 'both', 木: 'both' },
    pickupNote: '春日井翔陽からの下校時間に合わせる', dropoffNote: '',
    disability: '場面緘黙症', allergies: [], medical: '',
    certExpiry: '2026-10-10',
    guardian: { name: '野村 智子', rel: '母', tel: '090-2211-3344' },
    ngWith: [], priority: 3, status: 'active',
    tag: '翔陽連携',
  },
  {
    id: 'c10', name: '清水 晴人', kana: 'シミズ ハルト', gender: '男', age: 17, grade: '高2',
    facility: 'noba', school: 'shoyo', pickupLoc: 'school',
    address: '春日井市田楽町2678', homeX: 490, homeY: 410,
    transport: true, safetyReq: false,
    schedule: { 火: 'both', 木: 'both', 金: 'both' },
    pickupNote: '', dropoffNote: '集会場で降ろす（徒歩5分）',
    disability: '強迫性神経症', allergies: [], medical: '',
    certExpiry: '2026-09-05',
    guardian: { name: '清水 幸子', rel: '母', tel: '090-3322-4455' },
    ngWith: [], priority: 3, status: 'active',
    tag: '翔陽連携',
  },

  // ─── 放デイ PROGRESS ───
  {
    id: 'c11', name: '中村 ひまり', kana: 'ナカムラ ヒマリ', gender: '女', age: 10, grade: '小4',
    facility: 'progress', school: 'sakashita', pickupLoc: 'school',
    address: '春日井市松河戸町4-7-2', homeX: 600, homeY: 200,
    transport: true, safetyReq: false,
    schedule: { 月: 'both', 火: 'both', 木: 'both' },
    pickupNote: '', dropoffNote: '',
    disability: '知的障がい（B1）', allergies: [], medical: '',
    certExpiry: '2026-12-31',
    guardian: { name: '中村 千代', rel: '母', tel: '090-6789-0123' },
    ngWith: [], priority: 3, status: 'active',
  },
  {
    id: 'c12', name: '高橋 遥', kana: 'タカハシ ハルカ', gender: '女', age: 9, grade: '小4',
    facility: 'progress', school: 'hachiman', pickupLoc: 'school',
    address: '春日井市八幡町3-4-8', homeX: 460, homeY: 160,
    transport: true, safetyReq: false,
    schedule: { 水: 'both', 金: 'both' },
    pickupNote: '', dropoffNote: '',
    disability: 'ADHD', allergies: ['小麦'], medical: '喘息',
    certExpiry: '2026-11-30',
    guardian: { name: '高橋 正一', rel: '父', tel: '090-8877-6655' },
    ngWith: [], priority: 3, status: 'active',
  },

  // ─── 放デイ MARCHE ───
  {
    id: 'c13', name: '斉藤 航', kana: 'サイトウ ワタル', gender: '男', age: 13, grade: '中1',
    facility: 'marche', school: 'chubu', pickupLoc: 'school',
    address: '春日井市篠木町5-3-22', homeX: 430, homeY: 280,
    transport: true, safetyReq: false,
    schedule: { 火: 'both', 木: 'both' },
    pickupNote: '', dropoffNote: '',
    disability: '自閉症スペクトラム障害', allergies: [], medical: '',
    certExpiry: '2027-03-20',
    guardian: { name: '斉藤 美穂', rel: '母', tel: '090-4411-5522' },
    ngWith: [], priority: 3, status: 'active',
  },
  {
    id: 'c14', name: '森 雄太', kana: 'モリ ユウタ', gender: '男', age: 11, grade: '小5',
    facility: 'marche', school: 'oote', pickupLoc: 'nakayoshi',
    address: '春日井市大手町4-2-9', homeX: 305, homeY: 295,
    transport: true, safetyReq: false,
    schedule: { 月: 'both', 水: 'both', 金: 'both' },
    pickupNote: 'なかよし経由（15時頃）', dropoffNote: '',
    disability: '発達性協調運動障害', allergies: [], medical: '',
    certExpiry: '2026-08-10',
    guardian: { name: '森 理恵', rel: '母', tel: '090-5533-7744' },
    ngWith: [], priority: 3, status: 'active',
    tag: '学童経由',
  },

  // ─── 放デイ LOHASPO ───
  {
    id: 'c15', name: '井上 芽依', kana: 'イノウエ メイ', gender: '女', age: 8, grade: '小3',
    facility: 'lohaspo', school: 'shinoki', pickupLoc: 'school',
    address: '春日井市篠木町1-8-4', homeX: 420, homeY: 275,
    transport: true, safetyReq: false,
    schedule: { 月: 'both', 水: 'both' },
    pickupNote: '', dropoffNote: '',
    disability: '発達性協調運動障害', allergies: [], medical: '',
    certExpiry: '2026-10-25',
    guardian: { name: '井上 美和', rel: '母', tel: '090-9988-7766' },
    ngWith: [], priority: 3, status: 'active',
  },
  {
    id: 'c16', name: '林 瑞希', kana: 'ハヤシ ミズキ', gender: '女', age: 12, grade: '小6',
    facility: 'lohaspo', school: 'kashihara', pickupLoc: 'grandparent',
    address: '小牧市味岡1-3-5', homeX: 100, homeY: 100,
    transport: true, safetyReq: false,
    schedule: { 火: 'both', 木: 'both' },
    pickupNote: '祖父母宅からの送迎', dropoffNote: '祖父母宅へ送り',
    disability: 'ADHD', allergies: [], medical: '',
    certExpiry: '2026-09-15',
    guardian: { name: '林 裕子', rel: '祖母', tel: '090-1122-3344' },
    ngWith: [], priority: 3, status: 'active',
    tag: '祖父母宅送迎',
  },

  // ─── 放デイ MIRAIKU ───
  {
    id: 'c17', name: '岡本 大翔', kana: 'オカモト ヒロト', gender: '男', age: 10, grade: '小4',
    facility: 'miraiku', school: 'maruta', pickupLoc: 'school',
    address: '春日井市丸田町2-6-11', homeX: 285, homeY: 215,
    transport: true, safetyReq: false,
    schedule: { 月: 'both', 木: 'both' },
    pickupNote: '', dropoffNote: '',
    disability: '自閉症スペクトラム障害', allergies: ['落花生'], medical: '',
    certExpiry: '2026-07-31',
    guardian: { name: '岡本 孝', rel: '父', tel: '090-6699-8877' },
    ngWith: [], priority: 3, status: 'active',
  },
  {
    id: 'c18', name: '川島 大地', kana: 'カワシマ ダイチ', gender: '男', age: 13, grade: '中1',
    facility: 'miraiku', school: 'toubu', pickupLoc: 'school',
    address: '春日井市鷹来町5-1-8', homeX: 540, homeY: 270,
    transport: true, safetyReq: false,
    schedule: { 火: 'both', 金: 'both' },
    pickupNote: '', dropoffNote: '',
    disability: 'ADHD', allergies: [], medical: '',
    certExpiry: '2027-01-28',
    guardian: { name: '川島 幸子', rel: '母', tel: '090-7755-8844' },
    ngWith: [], priority: 3, status: 'active',
  },

  // ─── 放デイ NOBAサポ ───
  {
    id: 'c19', name: '藤本 美月', kana: 'フジモト ミツキ', gender: '女', age: 11, grade: '小5',
    facility: 'nobasup', school: 'ono', pickupLoc: 'school',
    address: '春日井市小野町3-2-7', homeX: 240, homeY: 340,
    transport: true, safetyReq: false,
    schedule: { 月: 'both', 水: 'both' },
    pickupNote: '', dropoffNote: '',
    disability: '学習障害', allergies: [], medical: '',
    certExpiry: '2026-10-05',
    guardian: { name: '藤本 秀子', rel: '母', tel: '090-5544-3322' },
    ngWith: [], priority: 3, status: 'active',
  },

  // ─── 児発 ふたば ───
  {
    id: 'c20', name: '前田 愛莉', kana: 'マエダ アイリ', gender: '女', age: 4, grade: '年中',
    facility: 'futaba', school: null, pickupLoc: 'home',
    address: '春日井市勝川町8-1-3', homeX: 270, homeY: 400,
    transport: false, safetyReq: false,
    schedule: { 月: 'none', 火: 'none', 水: 'none' },
    pickupNote: '保護者送迎', dropoffNote: '',
    disability: '知的障がい（A）', allergies: [], medical: '',
    certExpiry: '2027-02-15',
    guardian: { name: '前田 泰子', rel: '母', tel: '090-8822-9911' },
    ngWith: [], priority: 3, status: 'active',
  },

  // ─── 児発 にじのわ ───
  {
    id: 'c21', name: '木村 蒼', kana: 'キムラ アオ', gender: '男', age: 5, grade: '年長',
    facility: 'nijinowa', school: null, pickupLoc: 'home',
    address: '名古屋市守山区瀬古1-5-8', homeX: 150, homeY: 460,
    transport: false, safetyReq: false,
    schedule: { 火: 'none', 木: 'none' },
    pickupNote: '保護者送迎', dropoffNote: '',
    disability: '自閉症スペクトラム障害', allergies: [], medical: '',
    certExpiry: '2026-12-28',
    guardian: { name: '木村 希', rel: '母', tel: '090-4433-2211' },
    ngWith: [], priority: 3, status: 'active',
  },

  // ─── 放デイ COMMON ───
  {
    id: 'c22', name: '村上 碧', kana: 'ムラカミ アオイ', gender: '女', age: 9, grade: '小3',
    facility: 'common', school: 'kamijo', pickupLoc: 'school',
    address: '春日井市上条町6-4-2', homeX: 200, homeY: 260,
    transport: true, safetyReq: false,
    schedule: { 月: 'both', 火: 'both', 水: 'both', 金: 'both' },
    pickupNote: '', dropoffNote: '',
    disability: 'ADHD', allergies: [], medical: '',
    certExpiry: '2026-11-20',
    guardian: { name: '村上 久美子', rel: '母', tel: '090-3311-4455' },
    ngWith: [], priority: 3, status: 'active',
  },
  {
    id: 'c23', name: '松井 光輝', kana: 'マツイ コウキ', gender: '男', age: 15, grade: '中3',
    facility: 'common', school: 'chubu', pickupLoc: 'school',
    address: '春日井市出川町2-8-5', homeX: 445, homeY: 380,
    transport: true, safetyReq: false,
    schedule: { 月: 'both', 木: 'both' },
    pickupNote: '', dropoffNote: '時間指定あり: 18:15以降',
    disability: '全般性不安障害', allergies: [], medical: '',
    certExpiry: '2027-03-15',
    guardian: { name: '松井 真理子', rel: '母', tel: '090-2244-3355' },
    ngWith: [], priority: 2, status: 'active',
    tag: '時間指定',
  },

  // ─── 就労 NEO ───
  {
    id: 'c24', name: '谷川 隼人', kana: 'タニカワ ハヤト', gender: '男', age: 18, grade: '高3',
    facility: 'neo', school: 'shoyo', pickupLoc: 'school',
    address: '春日井市高蔵寺町北5-2-4', homeX: 660, homeY: 150,
    transport: true, safetyReq: false,
    schedule: { 火: 'both', 木: 'both' },
    pickupNote: '翔陽3年・就労準備', dropoffNote: '',
    disability: '自閉症スペクトラム障害', allergies: [], medical: '',
    certExpiry: '2026-06-30',
    guardian: { name: '谷川 圭介', rel: '父', tel: '090-1155-2266' },
    ngWith: [], priority: 3, status: 'active',
    tag: '翔陽連携',
  },

  // ─── イレギュラー（特例時間変動） ───
  {
    id: 'c25', name: '富田 健斗', kana: 'トミタ ケント', gender: '男', age: 12, grade: '小6',
    facility: 'plus', school: 'hokujo', pickupLoc: 'school',
    address: '春日井市北城町3-1-6', homeX: 380, homeY: 130,
    transport: true, safetyReq: true,
    schedule: { 月: 'both', 水: 'both', 金: 'both' },
    pickupNote: '※できるだけ早く（特例）', dropoffNote: '',
    disability: '重度知的障がい・医療的ケア', allergies: [], medical: '車椅子・医療的ケア児',
    certExpiry: '2026-09-30',
    guardian: { name: '富田 里美', rel: '母', tel: '090-9911-8822' },
    ngWith: [], priority: 1, status: 'active',
    tag: 'イレギュラー',
  },

  // ─── 追加(多拠点・通院パターン等) ───
  {
    id: 'c26', name: '田辺 茉奈', kana: 'タナベ マナ', gender: '女', age: 10, grade: '小5',
    facility: 'progress', school: 'degawa', pickupLoc: 'school',
    address: '春日井市出川町6-4-1', homeX: 440, homeY: 395,
    transport: true, safetyReq: false,
    schedule: { 火: 'both', 木: 'both' },
    pickupNote: '', dropoffNote: '',
    disability: '吃音症', allergies: [], medical: '',
    certExpiry: '2026-12-10',
    guardian: { name: '田辺 慎一', rel: '父', tel: '090-8844-1133' },
    ngWith: [], priority: 3, status: 'active',
  },
  {
    id: 'c27', name: '内田 瞬', kana: 'ウチダ シュン', gender: '男', age: 11, grade: '小5',
    facility: 'labo', school: 'matsuyama', pickupLoc: 'school',
    address: '春日井市松山町1-6-3', homeX: 190, homeY: 410,
    transport: true, safetyReq: false,
    schedule: { 水: 'both', 金: 'both' },
    pickupNote: '', dropoffNote: '',
    disability: 'ADHD', allergies: ['えび', 'かに'], medical: '',
    certExpiry: '2026-08-25',
    guardian: { name: '内田 恵', rel: '母', tel: '090-7733-2244' },
    ngWith: [], priority: 3, status: 'active',
  },
  {
    id: 'c28', name: '吉田 千尋', kana: 'ヨシダ チヒロ', gender: '女', age: 13, grade: '中1',
    facility: 'noba', school: 'toubu', pickupLoc: 'afk',
    address: '春日井市勝川本町3-5-2', homeX: 270, homeY: 410,
    transport: true, safetyReq: false,
    schedule: { 月: 'both', 金: 'both' },
    pickupNote: 'ALLフォーキッズ勝川 経由', dropoffNote: '',
    disability: '学習障害', allergies: [], medical: '',
    certExpiry: '2027-02-05',
    guardian: { name: '吉田 典子', rel: '母', tel: '090-6622-1155' },
    ngWith: [], priority: 3, status: 'active',
    tag: '学童経由',
  },
  {
    id: 'c29', name: '坂本 響', kana: 'サカモト ヒビキ', gender: '男', age: 7, grade: '小1',
    facility: 'plus', school: 'oote', pickupLoc: 'school',
    address: '春日井市大手町5-2-1', homeX: 300, homeY: 285,
    transport: true, safetyReq: true,
    schedule: { 月: 'both', 火: 'both', 水: 'both', 木: 'both', 金: 'both' },
    pickupNote: '低学年早出し', dropoffNote: '',
    disability: '自閉症スペクトラム障害', allergies: [], medical: 'アトピー性皮膚炎',
    certExpiry: '2026-07-15',
    guardian: { name: '坂本 麻衣', rel: '母', tel: '090-5566-4433' },
    ngWith: [], priority: 2, status: 'active',
  },
  {
    id: 'c30', name: '浅野 結衣', kana: 'アサノ ユイ', gender: '女', age: 16, grade: '高1',
    facility: 'lohaspo', school: 'shoyo', pickupLoc: 'school',
    address: '春日井市鳥居松町6-3-8', homeX: 360, homeY: 235,
    transport: true, safetyReq: false,
    schedule: { 月: 'both', 水: 'both', 金: 'both' },
    pickupNote: '', dropoffNote: '',
    disability: '摂食障害', allergies: [], medical: '',
    certExpiry: '2026-10-18',
    guardian: { name: '浅野 由紀', rel: '母', tel: '090-3366-7788' },
    ngWith: [], priority: 3, status: 'active',
    tag: '翔陽連携',
  },
]

import { xyToLatLng } from './schoolsData'

// homeX/homeY から自動で lat/lng を付与（実運用では児童の自宅住所からジオコーディング）
CHILDREN.forEach(c => {
  const ll = xyToLatLng(c.homeX, c.homeY)
  if (ll) {
    c.homeLat = ll.lat
    c.homeLng = ll.lng
  }
})

export const CHILD_BY_ID = Object.fromEntries(CHILDREN.map(c => [c.id, c]))

// タグ一覧（フィルタリング用）
export const TAGS = ['翔陽連携', '祖父母宅送迎', '学童経由', '時間指定', '同乗NG', 'イレギュラー']
