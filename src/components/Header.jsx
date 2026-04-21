import { Search, Command, Bell, HelpCircle } from 'lucide-react'
import { FACILITY_OPTIONS } from '../data/facilitiesData'

export default function Header({ facilityId }) {
  const facility = FACILITY_OPTIONS.find(f => f.id === facilityId)
  const today = new Date()
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日（${'日月火水木金土'[today.getDay()]}）`

  return (
    <header style={{
      height: 54, display: 'flex', alignItems: 'center', gap: 20,
      padding: '0 32px', background: 'var(--bg)',
      borderBottom: '1px solid var(--line)',
      flexShrink: 0,
    }}>
      {/* Breadcrumb / date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--ink-muted)' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--sage)', animation: 'pulse 2s infinite' }} />
          <span className="num" style={{ letterSpacing: 0 }}>{dateStr}</span>
        </div>
        {facility && facility.id !== 'all' && (
          <>
            <div style={{ width: 1, height: 14, background: 'var(--line-strong)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--ink-soft)', fontWeight: 600 }}>
              <span style={{ width: 7, height: 7, borderRadius: 2, background: facility.color }} />
              {facility.name}
              <span style={{ color: 'var(--ink-muted)', fontWeight: 400 }}>{facility.service && `/ ${facility.service}`}</span>
            </div>
          </>
        )}
      </div>

      {/* Center search */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--surface)', border: '1px solid var(--line-strong)',
          borderRadius: 8, padding: '6px 12px', minWidth: 320, maxWidth: 420, width: '100%',
        }}>
          <Search size={13} color="var(--ink-muted)" />
          <input
            placeholder="児童・学校・送迎・HUGを検索 (Cmd+K)"
            style={{ flex: 1, border: 'none', padding: 0, background: 'transparent', fontSize: 12 }}
          />
          <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 10, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>
            <Command size={10} /> K
          </span>
        </div>
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <IconBtn icon={<HelpCircle size={15} />} />
        <IconBtn icon={<Bell size={15} />} badge={3} />
      </div>
    </header>
  )
}

function IconBtn({ icon, badge }) {
  return (
    <button style={{
      position: 'relative', width: 32, height: 32, borderRadius: 7,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--ink-soft)', transition: 'background 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--line-soft)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {icon}
      {badge > 0 && (
        <span style={{
          position: 'absolute', top: 4, right: 4,
          width: 14, height: 14, background: 'var(--accent)',
          color: '#fff', borderRadius: 999, fontSize: 9, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-mono)',
        }}>
          {badge}
        </span>
      )}
    </button>
  )
}
