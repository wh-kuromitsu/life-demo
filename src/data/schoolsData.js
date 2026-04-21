// 学校マスタ - 送迎組_入力補助.xlsm の「送迎データ」シート順に合わせる
// SVG地図上の仮想座標 (x, y) は春日井市エリアを viewBox 0 0 800 500 で表現

export const SCHOOLS = [
  // 小学校
  { id: 'higashino',    name: '東野小学校',    kind: '小', time: '14:30', x: 540, y: 210 },
  { id: 'hachiman',     name: '八幡小学校',    kind: '小', time: '14:30', x: 470, y: 170 },
  { id: 'sakashita',    name: '坂下小学校',    kind: '小', time: '14:35', x: 610, y: 160 },
  { id: 'shinoki',      name: '篠木小学校',    kind: '小', time: '14:30', x: 420, y: 270 },
  { id: 'oote',         name: '大手小学校',    kind: '小', time: '14:35', x: 300, y: 290 },
  { id: 'ono',          name: '小野小学校',    kind: '小', time: '14:30', x: 240, y: 340 },
  { id: 'toriimatsu',   name: '鳥居松小学校',  kind: '小', time: '14:35', x: 350, y: 240 },
  { id: 'maruta',       name: '丸田小学校',    kind: '小', time: '14:30', x: 280, y: 210 },
  { id: 'hokujo',       name: '北城小学校',    kind: '小', time: '14:30', x: 380, y: 130 },
  { id: 'kamijo',       name: '上条小学校',    kind: '小', time: '14:35', x: 200, y: 270 },
  { id: 'jinryo',       name: '神領小学校',    kind: '小', time: '14:30', x: 580, y: 340 },
  { id: 'degawa',       name: '出川小学校',    kind: '小', time: '14:35', x: 440, y: 380 },
  { id: 'kashihara',    name: '柏原小学校',    kind: '小', time: '14:30', x: 320, y: 380 },
  { id: 'matsuyama',    name: '松山小学校',    kind: '小', time: '14:35', x: 180, y: 410 },

  // 中学校
  { id: 'toubu',        name: '東部中学校',    kind: '中', time: '15:10', x: 510, y: 270 },
  { id: 'chubu',        name: '中部中学校',    kind: '中', time: '15:05', x: 380, y: 310 },

  // 高校（自社運営）
  { id: 'shoyo',        name: '春日井翔陽高等学院',  kind: '高', time: '15:30', x: 430, y: 220, selfRun: true },

  // その他・特殊
  { id: 'tokushien',    name: '春日台特別支援学校', kind: '特支', time: '14:50', x: 640, y: 440 },
  { id: 'home',         name: '自宅',               kind: '自宅', time: null, x: null, y: null },
  { id: 'grandparent',  name: '祖父母宅',           kind: '祖父母宅', time: null, x: null, y: null },
]

// 学童・放課後子ども教室
export const LEARN_CENTERS = [
  { id: 'nakayoshi',      name: 'なかよし',         time: '15:00', x: 460, y: 260, note: '春日井オリジナル学童' },
  { id: 'nakayoshi_west', name: 'なかよし西',        time: '15:00', x: 300, y: 260, note: '春日井オリジナル学童' },
  { id: 'kodomo',         name: 'こどもの家',        time: '15:00', x: 520, y: 390, note: '' },
  { id: 'afk',            name: 'ALLフォーキッズ勝川', time: '15:00', x: 280, y: 430, note: 'AFK勝川' },
  { id: 'doronko',        name: 'どろんこ',          time: '15:00', x: 370, y: 410, note: '' },
]

export const ALL_LOCATIONS = [...SCHOOLS, ...LEARN_CENTERS]

export const LOC_BY_ID = Object.fromEntries(ALL_LOCATIONS.map(s => [s.id, s]))
