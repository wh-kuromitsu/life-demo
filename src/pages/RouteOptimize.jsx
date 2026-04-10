import { useState } from 'react'
import { Map, Zap, RotateCcw, Download, Info, Clock, TrendingDown, Car } from 'lucide-react'
import { customers, vehicles } from '../data/mockData'

const transportCustomers = customers.filter(c => c.transport)

// Simulated optimized routes
const optimizedRoutes = [
  {
    vehicleId: 'v1',
    vehicle: '車両A（ハイエース）',
    color: '#2e7df7',
    driver: '松田 一郎',
    type: '迎え',
    totalTime: 98,
    distance: 12.4,
    stops: [
      { name: '出発：にじいろPLUS', time: '13:50', address: '春日井市篠木町', type: 'base' },
      { name: '佐藤 陽菜', time: '14:05', address: '鳥居松町3-2-8', type: 'pickup', optimized: true },
      { name: '田中 蓮', time: '14:22', address: '柏原町2-5-12', type: 'pickup', optimized: true },
      { name: '小林 朝陽', time: '14:40', address: '神領町7-1-15', type: 'pickup', optimized: false },
      { name: '到着：にじいろPLUS', time: '14:58', address: '春日井市篠木町', type: 'base' },
    ]
  },
  {
    vehicleId: 'v2',
    vehicle: '車両B（ノア）',
    color: '#22c55e',
    driver: '鈴木 二郎',
    type: '迎え',
    totalTime: 65,
    distance: 8.7,
    stops: [
      { name: '出発：NIJIIRONOBA', time: '14:40', address: '春日井市東野町', type: 'base' },
      { name: '渡辺 颯太', time: '14:55', address: '勝川町6-3-9', type: 'pickup', optimized: true },
      { name: '山本 悠斗', time: '15:12', address: '東野町5-8-3', type: 'pickup', optimized: false },
      { name: '到着：にじいろLABO', time: '15:25', address: '春日井市中央通', type: 'base' },
    ]
  },
]

const beforeRoutes = [
  { totalTime: 112, distance: 15.2 },
  { totalTime: 78, distance: 11.3 },
]

export default function RouteOptimize() {
  const [optimized, setOptimized] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState(null)

  const handleOptimize = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setOptimized(true)
    }, 1800)
  }

  const routes = optimizedRoutes

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="page-title">ルート最適化</div>
            <div className="page-subtitle">Google Maps APIを活用した送迎ルート自動算出</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => setOptimized(false)}><RotateCcw size={14} /> リセット</button>
            <button className="btn btn-primary" onClick={handleOptimize} disabled={loading}>
              {loading ? <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span> 計算中...</> : <><Zap size={14} /> ルート最適化実行</>}
            </button>
          </div>
        </div>
      </div>

      {/* Config panel */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>対象日</div>
            <input type="date" defaultValue="2026-04-10" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>送迎種別</div>
            <select defaultValue="pickup">
              <option value="pickup">迎え</option>
              <option value="dropoff">送り</option>
              <option value="both">両方</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>最適化基準</div>
            <select defaultValue="time">
              <option value="time">所要時間最短</option>
              <option value="distance">走行距離最短</option>
              <option value="balanced">バランス</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>稼働車両</div>
            <select defaultValue="all">
              <option value="all">全車両（3台）</option>
              <option value="2">2台</option>
            </select>
          </div>
          <div style={{ marginLeft: 'auto', background: 'var(--accent-light)', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#1d4ed8' }}>
            <Info size={13} />
            <span>住所→座標変換：Geocoding API / ルート算出：OR-Tools + Routes API</span>
          </div>
        </div>
      </div>

      {/* Result summary */}
      {optimized && (
        <div className="grid grid-3" style={{ marginBottom: 20 }}>
          {[
            {
              label: '総所要時間削減',
              before: `${beforeRoutes.reduce((a, r) => a + r.totalTime, 0)}分`,
              after: `${routes.reduce((a, r) => a + r.totalTime, 0)}分`,
              icon: <Clock size={18} color="#2e7df7" />,
              bg: '#e8f1ff',
              diff: `▼ ${beforeRoutes.reduce((a, r) => a + r.totalTime, 0) - routes.reduce((a, r) => a + r.totalTime, 0)}分短縮`
            },
            {
              label: '走行距離削減',
              before: `${beforeRoutes.reduce((a, r) => a + r.distance, 0).toFixed(1)}km`,
              after: `${routes.reduce((a, r) => a + r.distance, 0).toFixed(1)}km`,
              icon: <TrendingDown size={18} color="#22c55e" />,
              bg: '#dcfce7',
              diff: `▼ ${(beforeRoutes.reduce((a, r) => a + r.distance, 0) - routes.reduce((a, r) => a + r.distance, 0)).toFixed(1)}km削減`
            },
            {
              label: '稼働車両数',
              before: '3台',
              after: '2台',
              icon: <Car size={18} color="#f59e0b" />,
              bg: '#fef3c7',
              diff: '最適配車で1台削減可能'
            },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {s.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{s.label}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'line-through' }}>{s.before}</span>
                    <span style={{ fontSize: 20, fontWeight: 700 }}>{s.after}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600, marginTop: 2 }}>{s.diff}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {routes.map((r, i) => (
          <div key={i}>
            <div style={{ border: `2px solid ${selectedRoute === i ? r.color : 'var(--border)'}`, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.2s' }}
              onClick={() => setSelectedRoute(i === selectedRoute ? null : i)}>
              <div style={{ background: r.color, color: 'white', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{r.vehicle}</div>
                  <div style={{ fontSize: 11, opacity: 0.8 }}>担当: {r.driver} / {r.type}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{r.totalTime}分 / {r.distance}km</div>
                  {optimized && <div style={{ fontSize: 11, background: 'rgba(255,255,255,0.2)', borderRadius: 999, padding: '1px 8px', marginTop: 4 }}>最適化済み ✓</div>}
                </div>
              </div>

              <div style={{ background: 'var(--surface)' }}>
                {r.stops.map((s, j) => (
                  <div key={j} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 16px',
                    borderBottom: j < r.stops.length - 1 ? '1px solid var(--border)' : 'none',
                    background: s.optimized ? '#fafbff' : 'transparent'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 14, gap: 0 }}>
                      <div style={{
                        width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                        background: s.type === 'base' ? '#cbd5e1' : r.color,
                        border: '2px solid white',
                        boxShadow: `0 0 0 1px ${s.type === 'base' ? '#cbd5e1' : r.color}`
                      }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: s.type !== 'base' ? 600 : 400, color: s.type === 'base' ? 'var(--text-muted)' : 'var(--text)' }}>
                        {s.name}
                        {s.optimized && optimized && <span style={{ marginLeft: 6, fontSize: 10, background: '#e8f1ff', color: 'var(--accent)', borderRadius: 4, padding: '1px 5px' }}>並替</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.address}</div>
                    </div>
                    <div style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>{s.time}</div>
                  </div>
                ))}

                {/* Action row */}
                <div style={{ padding: '10px 16px', background: 'var(--bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>停車 {r.stops.filter(s => s.type !== 'base').length}箇所</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: 11 }}>手動調整</button>
                    <button className="btn btn-primary" style={{ padding: '5px 10px', fontSize: 11 }}><Download size={11} /> 送迎表</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Excluded customer notice */}
      <div style={{
        marginTop: 16, background: 'var(--amber-light)', border: '1px solid #fde68a',
        borderRadius: 8, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center'
      }}>
        <Info size={15} color="var(--amber)" />
        <span style={{ fontSize: 13 }}>
          <strong>加藤 結菜</strong>は本日欠席のため送迎ルートから除外されています。
          <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: 12 }}>（保護者からの欠席連絡: 09:12）</span>
        </span>
      </div>
    </div>
  )
}
