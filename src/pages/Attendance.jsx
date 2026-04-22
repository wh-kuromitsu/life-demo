// 入退室記録 - 月カレンダー + 日別出席打刻
import { useState } from 'react'
import { CheckCircle2, Circle, Clock, ChevronLeft, ChevronRight, Users, Download } from 'lucide-react'
import { CHILDREN } from '../data/childrenData'
import { FACILITY_BY_ID } from '../data/facilitiesData'

const DAYS_JP = ['日','月','火','水','木','金','土']

export default function Attendance({ facilityId }) {
  const [mode, setMode] = useState('today') // today | month
  const [year, setYear] = useState(2026)
  const [month, setMonth] = useState(4)
  const scoped = facilityId === 'all' ? CHILDREN : CHILDREN.filter(c => c.facility === facilityId)
  const today = scoped.filter(c => c.status === 'active').slice(0, 12)

  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDay = new Date(year, month - 1, 1).getDay()

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Attendance</div>
          <h1 className="page-title">入退室記録</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="seg">
            <button className={mode === 'today' ? 'active' : ''} onClick={() => setMode('today')}>本日打刻</button>
            <button className={mode === 'month' ? 'active' : ''} onClick={() => setMode('month')}>月カレンダー</button>
          </div>
          <button className="btn btn-ghost btn-sm"><Download size={12} /> 月報PDF</button>
        </div>
      </div>

      {mode === 'today' ? (
        <>
          <div className="grid grid-4" style={{ marginBottom: 20 }}>
            <div className="stat"><div className="stat-label">本日予定</div><div className="stat-value num">{today.length}</div><div className="stat-sub">名</div></div>
            <div className="stat"><div className="stat-label">入室済</div><div className="stat-value num" style={{ color: 'var(--sage)' }}>8</div><div className="stat-sub">→ 進行中</div></div>
            <div className="stat"><div className="stat-label">欠席連絡</div><div className="stat-value num" style={{ color: 'var(--amber)' }}>2</div><div className="stat-sub">保護者から</div></div>
            <div className="stat"><div className="stat-label">未連絡</div><div className="stat-value num" style={{ color: 'var(--danger)' }}>0</div><div className="stat-sub">問題なし</div></div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">本日の入退室状況</div>
              <button className="btn btn-sage btn-sm"><CheckCircle2 size={12} /> 全員入室済に</button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>児童名</th>
                  <th>施設</th>
                  <th>入室</th>
                  <th>退室</th>
                  <th>支援時間</th>
                  <th>状態</th>
                </tr>
              </thead>
              <tbody>
                {today.map((c, i) => {
                  const fac = FACILITY_BY_ID[c.facility]
                  const checkedIn = i < 8
                  const checkedOut = i < 5
                  const absence = i === 6 || i === 9
                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--ink-muted)' }}>{c.grade}</div>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                          <span style={{ width: 6, height: 6, borderRadius: 1.5, background: fac?.color }} />
                          {fac?.short}
                        </span>
                      </td>
                      <td className="num" style={{ color: absence ? 'var(--ink-muted)' : checkedIn ? 'var(--sage)' : 'var(--ink-muted)', fontWeight: 600 }}>
                        {absence ? '—' : checkedIn ? '14:' + (30 + i).toString().padStart(2,'0') : '—'}
                      </td>
                      <td className="num" style={{ color: checkedOut ? 'var(--sage)' : 'var(--ink-muted)', fontWeight: 600 }}>
                        {checkedOut ? '17:' + (30 + i * 3).toString().padStart(2,'0') : '—'}
                      </td>
                      <td className="num" style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
                        {checkedIn && checkedOut ? '3h ' + (i * 5) + 'm' : '—'}
                      </td>
                      <td>
                        {absence
                          ? <span className="pill pill-amber">欠席連絡</span>
                          : checkedOut ? <span className="pill pill-sage">完了</span>
                          : checkedIn ? <span className="pill pill-info">利用中</span>
                          : <span className="pill pill-gray">未到着</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="panel">
          <div className="panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setMonth(m => m - 1)}><ChevronLeft size={12} /></button>
              <div className="display" style={{ fontSize: 15 }}>{year}年 {month}月</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setMonth(m => m + 1)}><ChevronRight size={12} /></button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>出席率 <span className="num" style={{ color: 'var(--sage)', fontWeight: 700 }}>94.3%</span></div>
          </div>
          <div style={{ padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {DAYS_JP.map(d => (
                <div key={d} className="eyebrow" style={{ textAlign: 'center', padding: 6, color: d === '日' ? 'var(--danger)' : d === '土' ? 'var(--info)' : 'var(--ink-muted)' }}>{d}</div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dayOfWeek = (firstDay + i) % 7
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                const count = isWeekend ? 0 : Math.floor(Math.random() * 8) + 8
                return (
                  <div key={day} style={{
                    padding: 8, border: '1px solid var(--line-soft)', borderRadius: 6,
                    background: isWeekend ? 'var(--bg-deep)' : 'var(--surface)',
                    minHeight: 72,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: isWeekend ? 'var(--ink-muted)' : 'var(--ink)' }}>{day}</div>
                    {!isWeekend && (
                      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <div style={{ fontSize: 10, color: 'var(--sage)', fontFamily: 'var(--font-mono)' }}>
                          <span style={{ fontWeight: 700 }}>{count}</span>名
                        </div>
                        <div style={{ height: 3, background: 'var(--sage-soft)', borderRadius: 99 }}>
                          <div style={{ height: '100%', width: `${(count / 16) * 100}%`, background: 'var(--sage)', borderRadius: 99 }} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
