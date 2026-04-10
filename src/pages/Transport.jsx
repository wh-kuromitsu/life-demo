import { useState } from 'react'
import { Car, Clock, ChevronDown, ChevronLeft, ChevronRight, Navigation } from 'lucide-react'
import { todayRoutes, vehicles, customers } from '../data/mockData'

const DAYS_JP = ['日', '月', '火', '水', '木', '金', '土']
const MONTHS_JP = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

const FACILITY_COLOR = {
  'すべて':           '#2e7df7',
  'にじいろPLUS':     '#2e7df7',
  'にじいろPALETTE':  '#22c55e',
  'にじいろLABO':     '#f59e0b',
  'NIJIIRONOBA':      '#8b5cf6',
  'にじいろPROGRESS': '#ef4444',
}

// 日付から曜日を日本語で返す（月〜金のみ有効）
const getDayLabel = (date) => DAYS_JP[date.getDay()]

// 平日かどうか
const isWeekday = (date) => date.getDay() !== 0 && date.getDay() !== 6

// その日の送迎対象者（daySchedule に曜日キーがあるか）
const getTransportCustomers = (date, facility) => {
  const dayLabel = getDayLabel(date)
  return customers.filter(c => {
    const hasDay = c.transport && c.daySchedule?.[dayLabel]
    const facilityMatch = facility === 'すべて' || c.facility === facility
    return hasDay && facilityMatch
  })
}

export default function Transport({ facility }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [selectedDate, setSelectedDate] = useState(new Date(today))
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())

  const isAll = facility === 'すべて'
  const accentColor = FACILITY_COLOR[facility] || '#2e7df7'

  const transportCustomers = getTransportCustomers(selectedDate, facility)
  const dayLabel = getDayLabel(selectedDate)
  const isSelectedWeekday = isWeekday(selectedDate)

  // カレンダー生成
  const firstDay = new Date(calYear, calMonth, 1)
  const lastDay = new Date(calYear, calMonth + 1, 0)
  const startPad = firstDay.getDay() // 0=日
  const totalCells = Math.ceil((startPad + lastDay.getDate()) / 7) * 7
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const d = new Date(calYear, calMonth, i - startPad + 1)
    return d
  })

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
  }

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  const isToday = (d) => isSameDay(d, today)
  const isSelected = (d) => isSameDay(d, selectedDate)
  const inMonth = (d) => d.getMonth() === calMonth

  // その日の送迎人数（カレンダーの小さいドット用）
  const countForDay = (d) => {
    if (!isWeekday(d) || !inMonth(d)) return 0
    return getTransportCustomers(d, facility).length
  }

  const formatDate = (d) =>
    `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${DAYS_JP[d.getDay()]}）`

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="page-title">送迎管理</div>
            <div className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>日付を選択して送迎状況を確認</span>
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

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

        {/* ── カレンダー ── */}
        <div style={{ width: 300, flexShrink: 0 }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Month nav */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
              <button onClick={prevMonth} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 7, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <ChevronLeft size={15} />
              </button>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{calYear}年 {MONTHS_JP[calMonth]}</span>
              <button onClick={nextMonth} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 7, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', background: '#fafbfc', borderBottom: '1px solid var(--border)' }}>
              {DAYS_JP.map((d, i) => (
                <div key={d} style={{
                  textAlign: 'center', padding: '8px 0', fontSize: 11, fontWeight: 700,
                  color: i === 0 ? '#ef4444' : i === 6 ? '#2e7df7' : 'var(--text-muted)'
                }}>{d}</div>
              ))}
            </div>

            {/* Date cells */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
              {cells.map((d, i) => {
                const inM = inMonth(d)
                const isTod = isToday(d)
                const isSel = isSelected(d)
                const isWd = isWeekday(d)
                const isSun = d.getDay() === 0
                const isSat = d.getDay() === 6
                const count = countForDay(d)
                const isHoliday = !isWd

                return (
                  <button
                    key={i}
                    disabled={!inM}
                    onClick={() => inM && setSelectedDate(new Date(d))}
                    style={{
                      border: 'none',
                      borderBottom: Math.floor(i / 7) < Math.floor((cells.length - 1) / 7) ? '1px solid var(--border)' : 'none',
                      borderRight: (i + 1) % 7 !== 0 ? '1px solid var(--border)' : 'none',
                      background: isSel ? accentColor : isTod ? accentColor + '12' : 'transparent',
                      cursor: inM ? 'pointer' : 'default',
                      padding: '8px 4px 6px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                      transition: 'background 0.1s',
                      minHeight: 52,
                    }}
                    onMouseEnter={e => { if (inM && !isSel) e.currentTarget.style.background = accentColor + '10' }}
                    onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = isTod ? accentColor + '12' : 'transparent' }}
                  >
                    <span style={{
                      fontSize: 13, fontWeight: isSel || isTod ? 700 : 400, lineHeight: 1,
                      color: isSel ? 'white'
                        : !inM ? '#d1d5db'
                        : isSun ? '#ef4444'
                        : isSat ? '#2e7df7'
                        : 'var(--text)',
                      width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '50%',
                    }}>
                      {d.getDate()}
                    </span>
                    {/* 送迎人数ドット */}
                    {inM && isWd && count > 0 && (
                      <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        {Array.from({ length: Math.min(count, 5) }).map((_, j) => (
                          <div key={j} style={{ width: 4, height: 4, borderRadius: '50%', background: isSel ? 'rgba(255,255,255,0.7)' : accentColor }} />
                        ))}
                        {count > 5 && <span style={{ fontSize: 9, color: isSel ? 'rgba(255,255,255,0.7)' : accentColor, lineHeight: 1 }}>+</span>}
                      </div>
                    )}
                    {inM && isHoliday && (
                      <div style={{ width: 4, height: 4 }} /> // spacer
                    )}
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: accentColor, display: 'inline-block' }} />送迎あり
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: accentColor + '12', display: 'inline-block' }} />今日
              </span>
            </div>
          </div>
        </div>

        {/* ── 右側：選択日の送迎状況 ── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* 日付ヘッダー */}
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{formatDate(selectedDate)}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {!isSelectedWeekday
                  ? '土日・祝日は送迎なし'
                  : `送迎対象 ${transportCustomers.length}名`
                }
              </div>
            </div>
            {isSelectedWeekday && transportCustomers.length > 0 && (
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  { label: '送迎対象', value: transportCustomers.length, color: accentColor },
                  { label: '車両', value: vehicles.length, color: '#22c55e' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center', background: 'var(--bg)', borderRadius: 8, padding: '8px 16px' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!isSelectedWeekday ? (
            /* 土日 */
            <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
              <Car size={40} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
              <div style={{ fontWeight: 600, marginBottom: 4 }}>土日・祝日</div>
              <div style={{ fontSize: 13 }}>この日は送迎の予定はありません</div>
            </div>
          ) : transportCustomers.length === 0 ? (
            /* 送迎なし */
            <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
              <Car size={40} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
              <div style={{ fontWeight: 600, marginBottom: 4 }}>送迎対象者なし</div>
              <div style={{ fontSize: 13 }}>この日に送迎予定の利用者がいません</div>
            </div>
          ) : (
            <>
              {/* 送迎対象リスト */}
              <div className="card" style={{ padding: 0 }}>
                <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="card-title">送迎割当一覧</span>
                  <span className="badge badge-blue">{dayLabel}曜日</span>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>利用者名</th>
                        {isAll && <th>施設</th>}
                        <th>お迎え</th>
                        <th>お送り</th>
                        <th>住所</th>
                        <th>割当車両</th>
                        <th>状態</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transportCustomers.map((c, i) => {
                        const sched = c.daySchedule[dayLabel]
                        const v = vehicles[i % vehicles.length]
                        return (
                          <tr key={c.id}>
                            <td style={{ fontWeight: 600 }}>{c.name}</td>
                            {isAll && <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.facility}</td>}
                            <td style={{ fontWeight: 500, color: accentColor }}>{sched?.pickup || '—'}</td>
                            <td style={{ fontWeight: 500, color: '#f59e0b' }}>{sched?.dropoff || '—'}</td>
                            <td style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.address}</td>
                            <td>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: v.color, flexShrink: 0 }} />
                                {v.name.split('（')[0]}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${i === 0 ? 'badge-amber' : 'badge-green'}`}>
                                {i === 0 ? '欠席' : '確定'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ルートカード */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {todayRoutes.map((r, i) => <RouteCard key={i} route={r} />)}
              </div>

              {/* 車両ステータス */}
              <div className="card">
                <div className="card-header"><span className="card-title">車両ステータス</span></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  {vehicles.map(v => (
                    <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg)', borderRadius: 8, padding: '11px 12px' }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: v.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Car size={16} color={v.color} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.name.split('（')[0]}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>定員 {v.capacity}名</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function RouteCard({ route }) {
  const [open, setOpen] = useState(true)
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
      <div
        style={{ background: route.color, color: 'white', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setOpen(o => !o)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Car size={15} />
          <span style={{ fontWeight: 600, fontSize: 13 }}>{route.vehicle}</span>
          <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 999, padding: '1px 8px', fontSize: 11 }}>{route.type}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={13} />
          <span style={{ fontSize: 12 }}>{route.depart}出発</span>
          <ChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
        </div>
      </div>
      {open && (
        <div>
          {route.stops.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderBottom: i < route.stops.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 12 }}>
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
