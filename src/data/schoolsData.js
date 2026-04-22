// 学校・学童マスタ
// - x, y: SVG/概念地図用の仮想座標（800×500 viewBox）
// - lat, lng: 実地理座標（春日井市内の近似値）
// - address: Google Maps ナビリンク用の住所文字列
//
// 座標系マッピング（便宜）:
//   x:   0 → lng 136.930 (西)        x: 800 → lng 137.025 (東)
//   y:   0 → lat  35.275 (北)        y: 500 → lat  35.225 (南)
// BASE（にじいろCOMMON、中央通2-119-1相当、実位置は 35.243, 136.977 近辺）。

// 便宜上のSVG→緯度経度変換関数
export function xyToLatLng(x, y) {
  if (x == null || y == null) return null
  return {
    lat: 35.275 - (y / 500) * 0.050,
    lng: 136.930 + (x / 800) * 0.095,
  }
}

export const SCHOOLS = [
  // 小学校
  { id: 'higashino',    name: '東野小学校',    kind: '小', time: '14:30', x: 540, y: 210,
    lat: 35.2540, lng: 136.9941, address: '愛知県春日井市東野町3-7-1' },
  { id: 'hachiman',     name: '八幡小学校',    kind: '小', time: '14:30', x: 470, y: 170,
    lat: 35.2580, lng: 136.9858, address: '愛知県春日井市八幡町62' },
  { id: 'sakashita',    name: '坂下小学校',    kind: '小', time: '14:35', x: 610, y: 160,
    lat: 35.2590, lng: 137.0024, address: '愛知県春日井市坂下町3-800-1' },
  { id: 'shinoki',      name: '篠木小学校',    kind: '小', time: '14:30', x: 420, y: 270,
    lat: 35.2480, lng: 136.9799, address: '愛知県春日井市篠木町1-48' },
  { id: 'oote',         name: '大手小学校',    kind: '小', time: '14:35', x: 300, y: 290,
    lat: 35.2460, lng: 136.9656, address: '愛知県春日井市大手町1-4-1' },
  { id: 'ono',          name: '小野小学校',    kind: '小', time: '14:30', x: 240, y: 340,
    lat: 35.2410, lng: 136.9585, address: '愛知県春日井市小野町1-8' },
  { id: 'toriimatsu',   name: '鳥居松小学校',  kind: '小', time: '14:35', x: 350, y: 240,
    lat: 35.2510, lng: 136.9716, address: '愛知県春日井市鳥居松町2-235' },
  { id: 'maruta',       name: '丸田小学校',    kind: '小', time: '14:30', x: 280, y: 210,
    lat: 35.2540, lng: 136.9632, address: '愛知県春日井市角崎町142' },
  { id: 'hokujo',       name: '北城小学校',    kind: '小', time: '14:30', x: 380, y: 130,
    lat: 35.2620, lng: 136.9751, address: '愛知県春日井市下条町124' },
  { id: 'kamijo',       name: '上条小学校',    kind: '小', time: '14:35', x: 200, y: 270,
    lat: 35.2480, lng: 136.9538, address: '愛知県春日井市上条町7-9-2' },
  { id: 'jinryo',       name: '神領小学校',    kind: '小', time: '14:30', x: 580, y: 340,
    lat: 35.2410, lng: 136.9989, address: '愛知県春日井市神領町1-9-1' },
  { id: 'degawa',       name: '出川小学校',    kind: '小', time: '14:35', x: 440, y: 380,
    lat: 35.2370, lng: 136.9822, address: '愛知県春日井市出川町1-16-2' },
  { id: 'kashihara',    name: '柏原小学校',    kind: '小', time: '14:30', x: 320, y: 380,
    lat: 35.2370, lng: 136.9680, address: '愛知県春日井市柏原町3-52-1' },
  { id: 'matsuyama',    name: '松山小学校',    kind: '小', time: '14:35', x: 180, y: 410,
    lat: 35.2340, lng: 136.9514, address: '愛知県春日井市松新町2-19-1' },

  // 中学校
  { id: 'toubu',        name: '東部中学校',    kind: '中', time: '15:10', x: 510, y: 270,
    lat: 35.2480, lng: 136.9906, address: '愛知県春日井市細野町2002-3' },
  { id: 'chubu',        name: '中部中学校',    kind: '中', time: '15:05', x: 380, y: 310,
    lat: 35.2440, lng: 136.9751, address: '愛知県春日井市鳥居松町9-10' },

  // 高校（自社運営）
  { id: 'shoyo',        name: '春日井翔陽高等学院',  kind: '高', time: '15:30', x: 430, y: 220, selfRun: true,
    lat: 35.2530, lng: 136.9810, address: '愛知県春日井市鳥居松町5-100' },

  // その他・特殊
  { id: 'tokushien',    name: '春日台特別支援学校', kind: '特支', time: '14:50', x: 640, y: 440,
    lat: 35.2310, lng: 137.0060, address: '愛知県春日井市神屋町字引沢52-1' },
  { id: 'home',         name: '自宅',               kind: '自宅', time: null, x: null, y: null, lat: null, lng: null, address: null },
  { id: 'grandparent',  name: '祖父母宅',           kind: '祖父母宅', time: null, x: null, y: null, lat: null, lng: null, address: null },
]

// 学童・放課後子ども教室
export const LEARN_CENTERS = [
  { id: 'nakayoshi',      name: 'なかよし',         time: '15:00', x: 460, y: 260,
    lat: 35.2490, lng: 136.9846, address: '愛知県春日井市八事町1-4-4', note: '春日井オリジナル学童' },
  { id: 'nakayoshi_west', name: 'なかよし西',        time: '15:00', x: 300, y: 260,
    lat: 35.2490, lng: 136.9656, address: '愛知県春日井市大手町2-12', note: '春日井オリジナル学童' },
  { id: 'kodomo',         name: 'こどもの家',        time: '15:00', x: 520, y: 390,
    lat: 35.2360, lng: 136.9918, address: '愛知県春日井市出川町1-50', note: '' },
  { id: 'afk',            name: 'ALLフォーキッズ勝川', time: '15:00', x: 280, y: 430,
    lat: 35.2320, lng: 136.9632, address: '愛知県春日井市勝川町2-56', note: 'AFK勝川' },
  { id: 'doronko',        name: 'どろんこ',          time: '15:00', x: 370, y: 410,
    lat: 35.2340, lng: 136.9739, address: '愛知県春日井市鳥居松町6-21', note: '' },
]

export const ALL_LOCATIONS = [...SCHOOLS, ...LEARN_CENTERS]

export const LOC_BY_ID = Object.fromEntries(ALL_LOCATIONS.map(s => [s.id, s]))
