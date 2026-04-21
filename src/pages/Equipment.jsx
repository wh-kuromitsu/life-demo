// 備品・教具管理 - 5領域 × 年齢帯 × 28種サンプル
import { useState } from 'react'
import { Package, Search, Plus, ArrowRightLeft, Clock, MapPin } from 'lucide-react'
import { FACILITIES, FACILITY_BY_ID } from '../data/facilitiesData'

const DOMAINS = ['健康・生活', '運動・感覚', '認知・行動', '言語・コミュニケーション', '人間関係・社会性']

// 28種の教具サンプル
const EQUIPMENT = [
  { id: 'e01', name: 'バランスボード',        category: '運動・感覚', ages: '3-8',   fac: 'palette',  count: 3, inUse: 1, note: '前庭感覚・体幹' },
  { id: 'e02', name: 'トランポリン',           category: '運動・感覚', ages: '3-10',  fac: 'plus',     count: 2, inUse: 0, note: '固有受容感覚' },
  { id: 'e03', name: 'バランスディスク',       category: '運動・感覚', ages: '4-12',  fac: 'lohaspo',  count: 6, inUse: 2, note: '姿勢保持' },
  { id: 'e04', name: 'ハンモック',             category: '運動・感覚', ages: '3-8',   fac: 'palette',  count: 1, inUse: 0, note: '前庭・圧覚' },
  { id: 'e05', name: 'スクーターボード',       category: '運動・感覚', ages: '4-10',  fac: 'progress', count: 4, inUse: 2, note: '協調運動' },
  { id: 'e06', name: 'タングラム',             category: '認知・行動', ages: '5-12',  fac: 'labo',     count: 8, inUse: 3, note: '空間認知' },
  { id: 'e07', name: 'ビーズひも通し',         category: '認知・行動', ages: '3-7',   fac: 'palette',  count: 5, inUse: 1, note: '微細運動・順序' },
  { id: 'e08', name: 'パターンブロック',       category: '認知・行動', ages: '4-10',  fac: 'progress', count: 3, inUse: 0, note: '分類・構成' },
  { id: 'e09', name: 'アナログ時計パズル',     category: '認知・行動', ages: '5-10',  fac: 'nobasup',  count: 2, inUse: 1, note: '時間概念' },
  { id: 'e10', name: '数カード',               category: '認知・行動', ages: '4-8',   fac: 'nobasup',  count: 10, inUse: 4, note: '数量理解' },
  { id: 'e11', name: 'PECSカード（500種）',     category: '言語・コミュニケーション', ages: '3-15', fac: 'palette', count: 2, inUse: 2, note: '絵カード交換' },
  { id: 'e12', name: 'コミュニケーションボード', category: '言語・コミュニケーション', ages: '3-15', fac: 'futaba', count: 4, inUse: 1, note: '意思伝達' },
  { id: 'e13', name: '感情カード',             category: '言語・コミュニケーション', ages: '4-12', fac: 'plus',    count: 6, inUse: 2, note: '感情語彙' },
  { id: 'e14', name: '絵本ライブラリ（200冊）', category: '言語・コミュニケーション', ages: '3-12', fac: 'common',  count: 1, inUse: 0, note: '読み聞かせ' },
  { id: 'e15', name: 'カプラ（造形木片）',     category: '認知・行動', ages: '4-12',  fac: 'labo',     count: 2, inUse: 1, note: '構成・集中' },
  { id: 'e16', name: '知育ボードゲーム（10種）', category: '人間関係・社会性', ages: '6-15', fac: 'nobasup', count: 10, inUse: 3, note: '協調・ルール' },
  { id: 'e17', name: 'ソーシャルスキルカード', category: '人間関係・社会性', ages: '5-15', fac: 'noba',    count: 3, inUse: 1, note: 'SST教材' },
  { id: 'e18', name: 'ロールプレイ用小道具',   category: '人間関係・社会性', ages: '4-12', fac: 'marche',  count: 5, inUse: 0, note: '役割遊び' },
  { id: 'e19', name: '料理道具セット',         category: '健康・生活', ages: '6-18',  fac: 'marche',    count: 2, inUse: 1, note: '生活スキル' },
  { id: 'e20', name: '身だしなみミラー',       category: '健康・生活', ages: '4-18',  fac: 'common',    count: 6, inUse: 0, note: 'ADL' },
  { id: 'e21', name: 'タブレット学習（10台）',  category: '認知・行動', ages: '6-18',  fac: 'labo',      count: 10, inUse: 6, note: 'AAC・学習' },
  { id: 'e22', name: 'ドローン（練習機）',      category: '認知・行動', ages: '8-18',  fac: 'miraiku',   count: 5, inUse: 2, note: 'STEAM' },
  { id: 'e23', name: '電子工作キット',          category: '認知・行動', ages: '10-18', fac: 'labo',      count: 4, inUse: 1, note: 'プログラミング' },
  { id: 'e24', name: '音楽療法楽器セット',      category: '運動・感覚', ages: '3-15',  fac: 'labo',      count: 1, inUse: 1, note: 'リズム・表現' },
  { id: 'e25', name: 'モンテッソーリ教具',      category: '認知・行動', ages: '3-6',   fac: 'nijinowa',  count: 12, inUse: 4, note: '感覚教育' },
  { id: 'e26', name: '絵カードケース（大）',    category: '言語・コミュニケーション', ages: '3-10', fac: 'palette', count: 2, inUse: 2, note: '視覚支援' },
  { id: 'e27', name: 'タイムタイマー',          category: '認知・行動', ages: '4-15',  fac: 'plus',      count: 8, inUse: 5, note: '時間管理視覚化' },
  { id: 'e28', name: '就労準備キット',          category: '人間関係・社会性', ages: '15-22', fac: 'neo',  count: 3, inUse: 2, note: '事務作業' },
]

export default function Equipment({ facilityId }) {
  const [search, setSearch] = useState('')
  const [domain, setDomain] = useState(null)

  const filtered = EQUIPMENT.filter(e => {
    if (facilityId !== 'all' && e.fac !== facilityId) return false
    if (search && !e.name.includes(search)) return false
    if (domain && e.category !== domain) return false
    return true
  })

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Equipment & Teaching Materials</div>
          <h1 className="page-title">備品・教具</h1>
          <p className="page-sub">
            5領域別の教具・備品を管理。施設間の貸出・返却、使用中の教具が一目でわかる。
            発達段階と年齢帯に応じた選定が可能。
          </p>
        </div>
        <button className="btn btn-primary"><Plus size={12} /> 教具を登録</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface)', border: '1px solid var(--line-strong)', borderRadius: 8, padding: '6px 12px', flex: '0 0 260px' }}>
          <Search size={13} color="var(--ink-muted)" />
          <input placeholder="教具名で検索" value={search} onChange={e => setSearch(e.target.value)} style={{ border: 'none', padding: 0, flex: 1, background: 'transparent' }} />
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {['すべて', ...DOMAINS].map(d => (
            <button key={d}
              onClick={() => setDomain(d === 'すべて' ? null : d)}
              className={`pill ${(d === 'すべて' && !domain) || domain === d ? 'pill-accent' : 'pill-gray'}`}
              style={{ cursor: 'pointer', fontSize: 11 }}>
              {d}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>
          {filtered.length} / {EQUIPMENT.length}
        </span>
      </div>

      {/* Domain summary */}
      <div className="grid grid-5" style={{ gridTemplateColumns: `repeat(${DOMAINS.length}, 1fr)`, marginBottom: 20 }}>
        {DOMAINS.map(d => {
          const items = EQUIPMENT.filter(e => e.category === d)
          const total = items.reduce((s, e) => s + e.count, 0)
          const inUse = items.reduce((s, e) => s + e.inUse, 0)
          return (
            <div key={d} className="surface" style={{ padding: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-muted)', letterSpacing: '0.06em', marginBottom: 4, height: 24 }}>{d}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>
                <span className="num">{items.length}</span>
                <span style={{ fontSize: 10, color: 'var(--ink-muted)', marginLeft: 4 }}>種</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--ink-muted)', marginTop: 3 }}>
                <span className="num">{total}</span>個 / 使用中 <span className="num">{inUse}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Table */}
      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>教具名</th>
              <th>領域</th>
              <th>対象年齢</th>
              <th>保有施設</th>
              <th>数量</th>
              <th>使用中</th>
              <th>備考</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(e => {
              const fac = FACILITY_BY_ID[e.fac]
              return (
                <tr key={e.id} className="clickable">
                  <td>
                    <div style={{ fontWeight: 600 }}>{e.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>{e.id}</div>
                  </td>
                  <td><span className="pill pill-gray" style={{ fontSize: 10 }}>{e.category}</span></td>
                  <td className="num" style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{e.ages}歳</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                      <span style={{ width: 6, height: 6, borderRadius: 1.5, background: fac?.color }} />
                      {fac?.short}
                    </span>
                  </td>
                  <td className="num" style={{ fontWeight: 600 }}>{e.count}</td>
                  <td>
                    <span className="num" style={{ color: e.inUse > 0 ? 'var(--amber)' : 'var(--ink-muted)', fontWeight: 600 }}>
                      {e.inUse}
                    </span>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{e.note}</td>
                  <td><button className="btn btn-ghost btn-sm"><ArrowRightLeft size={10} /> 貸出</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
