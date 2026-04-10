import { Users, Car, AlertCircle, CheckCircle2, Clock, Info } from 'lucide-react'
import { customers, todayRoutes, recentActivity } from '../data/mockData'

const actIcon = (type) => {
  if (type === 'success') return <CheckCircle2 size={14} color="#22c55e" />
  if (type === 'warning') return <AlertCircle size={14} color="#f59e0b" />
  return <Info size={14} color="#2e7df7" />
}

const FACILITY_COLOR = {
  'すべて':          '#64748b',
  'にじいろPLUS':    '#2e7df7',
  'にじいろPALETTE': '#22c55e',
  'にじいろLABO':    '#f59e0b',
  'NIJIIRONOBA':     '#8b5cf6',
  'にじいろPROGRESS':'#ef4444',
}

export default function Dashboard({ facility }) {
  const isAll = facility === 'すべて'
  const filtered = isAll ? customers : customers.filter(c => c.facility === facility)
  const activeToday = filtered.filter(c => c.status === 'active')
  const transportToday = filtered.filter(c => c.transport && c.status === 'active')
  const color = FACILITY_COLOR[facility] || 'var(--accent)'

  const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })

  const STATS = [
    { label: '登録利用者数', value: filtered.length, sub: `全${customers.length}名中`, icon: <Users size={20} color={color} />, bg: color + '22' },
    { label: '本日利用予定', value: activeToday.length, sub: '利用中ステータス', icon: <CheckCircle2 size={20} color="#22c55e" />, bg: '#dcfce7' },
    { label: '本日送迎対象', value: transportToday.length, sub: '送迎あり・利用中', icon: <Car size={20} color="#f59e0b" />, bg: '#fef3c7' },
    { label: 'インシデント', value: 0, sub: '問題なし', icon: <AlertCircle size={20} color="#ef4444" />, bg: '#fee2e2' },
  ]

  // 施設別の利用者数
  const facilityBreakdown = customers.reduce((acc, c) => {
    acc[c.facility] = (acc[c.facility] || 0) + 1
    return acc
  }, {})

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="page-title">ダッシュボード</div>
            <div className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{today}</span>
              {!isAll && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: color + '18', color, border: `1px solid ${color}44`, borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
                  {facility}
                </span>
              )}
            </div>
          </div>
          <span className="badge badge-green" style={{ fontSize: 12, padding: '5px 14px' }}>● 運営中</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        {STATS.map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-2">
        {/* 施設別利用者数（すべて表示時） or 送迎スケジュール */}
        <div className="card">
          {isAll ? (
            <>
              <div className="card-header"><span className="card-title">施設別利用者数</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.entries(facilityBreakdown).map(([name, count]) => {
                  const fc = FACILITY_COLOR[name] || '#64748b'
                  const pct = Math.round((count / customers.length) * 100)
                  return (
                    <div key={name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: fc }} />
                          <span style={{ fontWeight: 500 }}>{name}</span>
                        </div>
                        <span style={{ fontWeight: 700, color: fc }}>{count}名 <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({pct}%)</span></span>
                      </div>
                      <div style={{ height: 6, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: fc, borderRadius: 999, transition: 'width 0.6s' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <>
              <div className="card-header">
                <span className="card-title">本日の送迎スケジュール</span>
                <span className="badge badge-blue">{facility}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {todayRoutes.slice(0, 2).map((r, i) => (
                  <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ background: r.color, color: 'white', padding: '9px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{r.vehicle}</span>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
                        <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 999, padding: '1px 8px' }}>{r.type}</span>
                        <Clock size={12} />{r.depart}
                      </div>
                    </div>
                    {r.stops.map((s, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px', borderBottom: j < r.stops.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 12, color: s.type === 'base' ? 'var(--text-muted)' : 'var(--text)' }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: s.type === 'base' ? '#cbd5e1' : r.color }} />
                        <span style={{ flex: 1 }}>{s.name}</span>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{s.time}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Activity */}
        <div className="card">
          <div className="card-header"><span className="card-title">最近のアクティビティ</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {recentActivity.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '11px 0', borderBottom: i < recentActivity.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ marginTop: 2 }}>{actIcon(a.type)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13 }}>{a.text}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, background: 'var(--bg)', borderRadius: 10, padding: 14 }}>
            {[
              { label: '午前送迎', value: '完了', color: 'var(--green)' },
              { label: '午後送迎', value: '進行中', color: 'var(--amber)' },
              { label: '夕方送迎', value: '待機中', color: 'var(--text-muted)' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
