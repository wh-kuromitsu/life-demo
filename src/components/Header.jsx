import { Search, Command, Bell, HelpCircle } from 'lucide-react'
import { FACILITY_OPTIONS } from '../data/facilitiesData'

export default function Header({ facilityId }) {
  const facility = FACILITY_OPTIONS.find(f => f.id === facilityId)
  const today = new Date()
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日（${'日月火水木金土'[today.getDay()]}）`

  return (
    <header style={{
      height: 60,
      display: 'flex', alignItems: 'center', gap: 20,
      padding: '0 32px',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--line)',
      flexShrink: 0,
      position: 'relative',
    }}>
      {/* 下端 hair-line にレインボーアクセント */}
      <div style={{
        position: 'absolute', bottom: -1, left: 32, width: 72, height: 2,
        display: 'flex', borderRadius: 2, overflow: 'hidden',
      }}>
        {['--rb-red','--rb-orange','--rb-yellow','--rb-green','--rb-teal','--rb-blue','--rb-purple','--rb-pink'].map(c => (
          <div key={c} style={{ flex: 1, background: `var(${c})` }} />
        ))}
      </div>

      {/* Breadcrumb / date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 11.5, color: 'var(--ink-muted)',
          fontWeight: 600,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--sage)',
            animation: 'pulse 2s infinite',
          }} />
          <span className="num" style={{ letterSpacing: 0 }}>{dateStr}</span>
        </div>
        {facility && facility.id !== 'all' && (
          <>
            <div style={{ width: 1, height: 14, background: 'var(--line-strong)' }} />
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              fontSize: 12, color: 'var(--ink-soft)', fontWeight: 700,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: 3,
                background: facility.color,
              }} />
              {facility.name}
              {facility.service && (
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: 'var(--ink-muted)',
                  background: 'var(--bg)',
                  padding: '2px 7px', borderRadius: 4,
                  marginLeft: 2,
                }}>
                  {facility.service}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Center search */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--bg)',
          border: '1.5px solid transparent',
          borderRadius: 999,
          padding: '7px 16px',
          minWidth: 340, maxWidth: 440, width: '100%',
          transition: 'all 0.15s',
        }}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--surface)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'var(--bg)' }}
        >
          <Search size={13} color="var(--ink-muted)" />
          <input
            placeholder="児童・学校・送迎・HUGを検索"
            style={{
              flex: 1, border: 'none', padding: 0,
              background: 'transparent', fontSize: 12.5,
              fontWeight: 500,
            }}
          />
          <span style={{
            display: 'flex', alignItems: 'center', gap: 2,
            fontSize: 10, color: 'var(--ink-muted)',
            fontFamily: 'var(--font-mono)', fontWeight: 600,
          }}>
            <Command size={10} /> K
          </span>
        </div>
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <IconBtn icon={<HelpCircle size={16} />} />
        <IconBtn icon={<Bell size={16} />} badge={3} />
      </div>
    </header>
  )
}

function IconBtn({ icon, badge }) {
  return (
    <button style={{
      position: 'relative',
      width: 36, height: 36, borderRadius: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--ink-soft)',
      transition: 'all 0.15s',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'var(--accent-faint)'
        e.currentTarget.style.color = 'var(--accent)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = 'var(--ink-soft)'
      }}
    >
      {icon}
      {badge > 0 && (
        <span style={{
          position: 'absolute', top: 5, right: 5,
          width: 15, height: 15,
          background: 'var(--accent)',
          color: '#fff', borderRadius: 999,
          fontSize: 9, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-mono)',
          border: '2px solid var(--surface)',
        }}>
          {badge}
        </span>
      )}
    </button>
  )
}
