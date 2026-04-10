import { useState } from 'react'
import { Car, Clock, ChevronDown, Navigation } from 'lucide-react'
import { todayRoutes, vehicles, customers } from '../data/mockData'

const DAYS_JP = ['日','月','火','水','木','金','土']
const today = new Date()
const weekdays = Array.from({ length: 5 }, (_, i) => {
  const d = new Date(today)
  d.setDate(today.getDate() - today.getDay() + i + 1)
  return { label: DAYS_JP[i + 1], date: d.getDate(), dayNum: i + 1 }
})

const FACILITY_COLOR = {
  'すべて': '#2e7df7',
  'にじいろPLUS': '#2e7df7',
  'にじいろPALETTE': '#22c55e',
  'にじいろLABO': '#f59e0b',
  'NIJIIRONOBA': '#8b5cf6',
  'にじいろPROGRESS': '#ef4444',
}

export default function Transport({ facility }) {
  const [selectedDay, setSelectedDay] = useState(today.getDay() === 0 ? 1 : today.getDay())
  const isAll = facility === 'すべて'
  const accentColor = FACILITY_COLOR[facility] || '#2e7df7'

  // 本日送迎対象
  const transportCustomers = customers.filter(c => {
    const dayMatch = c.daySchedule[DAYS_JP[selectedDay]]
    const facilityMatch = isAll || c.facility === facility
    return c.transport && dayMatch && facilityMatch
  })

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="page-title">送迎管理</div>
            <div className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>送迎スケジュール・配車管理</span>
              {!isAll && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: accentColor + '18', color: accentColor, border: `1px solid ${accentColor}44`, borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: accentColor }} />{facility}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost">PDF出力</button>
            <button className="btn btn-primary">送迎表確定</button>
          </div>
        </div>
      </div>

      {/* Day selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {weekdays.map(d => {
          const active = selectedDay === d.dayNum
          return (
            <button key={d.label} onClick={() => setSelectedDay(d.dayNum)} style={{
              padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
              border: active ? `2px solid ${accentColor}` : '2px solid var(--border)',
              background: active ? accentColor + '14' : 'var(--surface)',
              color: active ? accentColor : 'var(--text)', fontWeight: active ? 700 : 400,
              fontSize: 13, textAlign: 'center', transition: 'all 0.15s',
            }}>
              <div style={{ fontSize: 11, opacity: 0.7 }}>{d.label}曜日</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{d.date}</div>
            </button>
          )
        })}
      </div>

      <div className="grid grid-2">
        {/* 左：送迎対象 + ルートカード */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: '14px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>送迎対象{!isAll && ` — ${facility}`}</div>
              <span className="badge badge-blue">{transportCustomers.length}名</span>
            </div>
            {transportCustomers.length === 0 ? (
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>この曜日の送迎対象者はいません</div>
            ) : (
              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {transportCustomers.map(c => {
                  const sched = c.daySchedule[DAYS_JP[selectedDay]]
                  return (
                    <span key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', fontSize: 12 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: accentColor }} />
                      {c.name}
                      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{sched?.pickup}</span>
                    </span>
                  )
                })}
              </div>
            )}
          </div>
          {todayRoutes.map((r, i) => <RouteCard key={i} route={r} />)}
        </div>

        {/* 右：車両 + テーブル */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">車両ステータス</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {vehicles.map(v => (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg)', borderRadius: 8, padding: '11px 14px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: v.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Car size={18} color={v.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{v.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>担当: {v.driver} / 定員 {v.capacity}名</div>
                  </div>
                  <span className="badge badge-green">稼働中</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)' }}>
              <span className="card-title">送迎割当一覧</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>利用者名</th>{isAll && <th>施設</th>}<th>お迎え</th><th>お送り</th><th>割当車両</th><th>状態</th></tr>
                </thead>
                <tbody>
                  {transportCustomers.map((c, i) => {
                    const sched = c.daySchedule[DAYS_JP[selectedDay]]
                    const v = vehicles[i % 3]
                    return (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 500 }}>{c.name}</td>
                        {isAll && <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.facility}</td>}
                        <td>{sched?.pickup || '—'}</td>
                        <td>{sched?.dropoff || '—'}</td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: v.color }} />
                            {v.name.split('（')[0]}
                          </span>
                        </td>
                        <td><span className={`badge ${i === 0 ? 'badge-amber' : 'badge-green'}`}>{i === 0 ? '欠席' : '確定'}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function RouteCard({ route }) {
  const [open, setOpen] = useState(true)
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ background: route.color, color: 'white', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setOpen(o => !o)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Car size={15} />
          <span style={{ fontWeight: 600, fontSize: 13 }}>{route.vehicle}</span>
          <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 999, padding: '1px 8px', fontSize: 11 }}>{route.type}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={13} /><span style={{ fontSize: 12 }}>{route.depart}出発</span>
          <ChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
        </div>
      </div>
      {open && (
        <div style={{ background: 'var(--surface)' }}>
          {route.stops.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', borderBottom: i < route.stops.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 12 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0, background: s.type === 'base' ? '#cbd5e1' : route.color, border: '2px solid white', boxShadow: `0 0 0 1px ${s.type === 'base' ? '#cbd5e1' : route.color}` }} />
              {s.type !== 'base' && <Navigation size={10} color="var(--text-muted)" style={{ flexShrink: 0 }} />}
              <span style={{ flex: 1, color: s.type === 'base' ? 'var(--text-muted)' : 'var(--text)' }}>{s.name}</span>
              <span style={{ fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{s.time}</span>
            </div>
          ))}
          <div style={{ padding: '7px 14px', background: 'var(--bg)', fontSize: 11, color: 'var(--text-muted)' }}>
            停車 {route.stops.filter(s => s.type !== 'base').length}箇所 / 担当: {route.driver}
          </div>
        </div>
      )}
    </div>
  )
}
