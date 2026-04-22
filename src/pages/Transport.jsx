// 送迎管理 - 便制対応
// 曜日×方向（迎え/送り）の便グリッド、本日の便一覧、HUG貼付反映

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Download, Car, Clock, Users, FileCheck, ArrowRight } from 'lucide-react'
import { TODAY_TRIPS, BASE } from '../data/routesData'
import { VEHICLE_BY_ID } from '../data/vehiclesData'
import { CHILD_BY_ID } from '../data/childrenData'
import { LOC_BY_ID } from '../data/schoolsData'

const DAYS = ['月','火','水','木','金']

export default function Transport({ setPage }) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDay, setSelectedDay] = useState('月')
  const [direction, setDirection] = useState('pickup')

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Transport Operations</div>
          <h1 className="page-title">送迎管理</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm"><Download size={12} /> 送迎表PDF</button>
          <button className="btn btn-primary" onClick={() => setPage('route')}>ルート最適化 <ArrowRight size={12} /></button>
        </div>
      </div>

      {/* Week grid */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset(o => o - 1)}><ChevronLeft size={12} /></button>
            <div className="display" style={{ fontSize: 14 }}>2026年4月 第{weekOffset >= 0 ? 3 + weekOffset : 3 + weekOffset}週</div>
            <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset(o => o + 1)}><ChevronRight size={12} /></button>
          </div>
          <div className="seg">
            <button className={direction === 'pickup' ? 'active' : ''} onClick={() => setDirection('pickup')}>迎え便</button>
            <button className={direction === 'dropoff' ? 'active' : ''} onClick={() => setDirection('dropoff')}>送り便</button>
          </div>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(5, 1fr)', gap: 0, border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
            <GridHeader>便</GridHeader>
            {DAYS.map(d => (
              <GridHeader key={d} active={selectedDay === d} onClick={() => setSelectedDay(d)}>
                <div>{d}</div>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--ink-muted)', fontWeight: 400 }}>
                  {20 + DAYS.indexOf(d)}
                </div>
              </GridHeader>
            ))}

            <GridCell label>1便</GridCell>
            {DAYS.map(d => <GridCell key={d} active={selectedDay === d}><TripPreview leg={1} day={d} /></GridCell>)}

            <GridCell label>2便</GridCell>
            {DAYS.map(d => <GridCell key={d} active={selectedDay === d}><TripPreview leg={2} day={d} /></GridCell>)}
          </div>
        </div>
      </div>

      {/* Selected day - trip list */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">{selectedDay}曜日の{direction === 'pickup' ? '迎え' : '送り'}便</div>
              <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 2 }}>確定済み · 最終更新 08:30</div>
            </div>
            <span className="pill pill-sage"><FileCheck size={10} /> HUG貼付済</span>
          </div>
          <div>
            {TODAY_TRIPS.map(t => <TripDetail key={t.id} trip={t} />)}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="surface" style={{ padding: 18 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>本日のサマリー</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <MiniKPI label="便数" value={TODAY_TRIPS.length} />
              <MiniKPI label="乗車児童" value={TODAY_TRIPS.reduce((s, t) => s + t.stops.filter(st => st.childId).length, 0)} />
              <MiniKPI label="使用車両" value={new Set(TODAY_TRIPS.map(t => t.vehicle)).size} />
              <MiniKPI label="ドライバー" value={new Set(TODAY_TRIPS.map(t => t.vehicle)).size} />
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">配布用PDF</div>
            </div>
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {TODAY_TRIPS.map(t => {
                const v = VEHICLE_BY_ID[t.vehicle]
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--bg)', borderRadius: 6 }}>
                    <span style={{ width: 4, height: 22, background: v?.color, borderRadius: 2 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{v?.name} · {t.leg}便</div>
                      <div style={{ fontSize: 10, color: 'var(--ink-muted)' }}>{v?.driver}</div>
                    </div>
                    <button className="btn btn-ghost btn-sm"><Download size={10} /></button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function GridHeader({ children, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      padding: '10px 12px', background: active ? 'var(--accent-faint)' : 'var(--surface-soft)',
      borderBottom: '1px solid var(--line)', borderRight: '1px solid var(--line)',
      cursor: onClick ? 'pointer' : 'default', textAlign: 'center',
      fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
      color: active ? 'var(--accent)' : 'var(--ink)',
    }}>
      {children}
    </div>
  )
}

function GridCell({ children, label, active }) {
  return (
    <div style={{
      padding: label ? '14px 10px' : '10px',
      background: label ? 'var(--surface-soft)' : (active ? 'var(--accent-faint)' : '#fff'),
      borderBottom: '1px solid var(--line-soft)', borderRight: '1px solid var(--line-soft)',
      textAlign: label ? 'center' : 'left', minHeight: 72,
      fontFamily: label ? 'var(--font-display)' : 'inherit',
      fontSize: label ? 11 : 11, fontWeight: label ? 700 : 400,
      color: label ? 'var(--ink-muted)' : 'inherit',
    }}>
      {children}
    </div>
  )
}

function TripPreview({ leg, day }) {
  // Fake data: leg 1 uses c01, c06, c11; leg 2 uses c09, c10, c24, c30
  const childIds = leg === 1 ? ['c01','c06','c11'] : ['c09','c10','c24','c30']
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>
        {leg === 1 ? '13:50' : '14:30'}発
      </div>
      <div style={{ fontSize: 10, color: 'var(--ink-muted)' }}>
        {childIds.length}名 · {leg === 1 ? 'ハイエース' : '青ノア'}
      </div>
    </div>
  )
}

function TripDetail({ trip }) {
  const v = VEHICLE_BY_ID[trip.vehicle]
  const childStops = trip.stops.filter(s => s.childId)
  const [open, setOpen] = useState(true)

  return (
    <div style={{ borderBottom: '1px solid var(--line)' }}>
      <div onClick={() => setOpen(o => !o)} style={{
        padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12,
        cursor: 'pointer', borderLeft: `3px solid ${v?.color}`,
        background: open ? 'var(--bg)' : 'transparent',
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>
            {trip.leg}<span style={{ fontSize: 10, color: 'var(--ink-muted)' }}>便</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{v?.name} · {v?.driver}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 2 }}>
            {trip.departAt}発 · {childStops.length}名乗車 · {v?.plate}
          </div>
        </div>
        <span className={`pill ${trip.status === 'done' ? 'pill-sage' : trip.status === 'in_progress' ? 'pill-amber' : 'pill-gray'}`}>
          {trip.status === 'done' ? '完了' : trip.status === 'in_progress' ? '運行中' : '待機'}
        </span>
      </div>
      {open && (
        <div style={{ padding: '6px 20px 12px 50px', background: 'var(--surface-soft)' }}>
          {trip.stops.map((s, i) => {
            const child = s.childId ? CHILD_BY_ID[s.childId] : null
            const isBase = s.kind === 'depart' || s.kind === 'arrive'
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0', fontSize: 12 }}>
                <span style={{ color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)', fontSize: 11, width: 36 }}>{s.time}</span>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: isBase ? 'var(--ink-muted)' : v?.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontWeight: isBase ? 400 : 600, color: isBase ? 'var(--ink-muted)' : 'var(--ink)' }}>
                  {isBase ? (s.kind === 'depart' ? '出発' : '帰着') + ' · ' + BASE.name : child?.name}
                </span>
                {child && <span style={{ fontSize: 10, color: 'var(--ink-muted)' }}>{LOC_BY_ID[s.schoolId]?.name || child.grade}</span>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function MiniKPI({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--ink-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
      <div className="num" style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>{value}</div>
    </div>
  )
}
