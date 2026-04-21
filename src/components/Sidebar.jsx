import { useState } from 'react'
import {
  LayoutDashboard, Route, Car, Users, Calendar, ClipboardList,
  Building, Package, RefreshCw, Bell, Settings as SettingsIcon,
  ChevronDown, ChevronRight, LogOut, Check, Search
} from 'lucide-react'
import { FACILITY_OPTIONS } from '../data/facilitiesData'

const NAV = [
  { group: 'オペレーション', items: [
    { id: 'dashboard',  label: 'ダッシュボード', icon: LayoutDashboard },
    { id: 'route',      label: 'ルート最適化',   icon: Route, accent: true },
    { id: 'transport',  label: '送迎管理',       icon: Car },
    { id: 'attendance', label: '入退室記録',     icon: Calendar },
  ]},
  { group: '児童・支援', items: [
    { id: 'children',   label: '児童管理',       icon: Users },
    { id: 'support',    label: '個別支援計画',   icon: ClipboardList },
  ]},
  { group: '拠点・備品', items: [
    { id: 'facility',   label: '施設管理',       icon: Building },
    { id: 'equipment',  label: '備品・教具',     icon: Package },
  ]},
  { group: 'システム', items: [
    { id: 'hug',           label: 'HUG連携',  icon: RefreshCw },
    { id: 'notifications', label: '通知',     icon: Bell, badge: 3 },
    { id: 'settings',      label: '設定',     icon: SettingsIcon },
  ]},
]

export default function Sidebar({ current, onNavigate, facilityId, onFacilityChange }) {
  const [facilityOpen, setFacilityOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selected = FACILITY_OPTIONS.find(f => f.id === facilityId) || FACILITY_OPTIONS[0]
  const filtered = FACILITY_OPTIONS.filter(f =>
    !search || f.name.includes(search) || f.short.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <aside style={{
      width: 248, flexShrink: 0, background: 'var(--ink-panel)',
      display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0, height: '100vh',
      borderRight: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* ─── Brand ─── */}
      <div style={{ padding: '20px 22px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Mark: 13 colored stripes as logo (rainbow concept) */}
          <div style={{ display: 'flex', gap: 1.5, alignItems: 'flex-end', height: 22 }}>
            {FACILITY_OPTIONS.slice(1, 9).map((f, i) => (
              <div key={f.id} style={{
                width: 2, height: [16, 22, 14, 20, 12, 18, 22, 16][i],
                background: f.color, borderRadius: 1, opacity: 0.85,
              }} />
            ))}
          </div>
          <div>
            <div style={{ color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em', lineHeight: 1 }}>
              Nijiiro
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 2 }}>
              Operations
            </div>
          </div>
        </div>
      </div>

      {/* ─── Facility selector ─── */}
      <div style={{ padding: '12px 14px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 600,
          letterSpacing: '0.18em', color: 'rgba(255,255,255,0.35)',
          marginBottom: 6, textTransform: 'uppercase', paddingLeft: 2,
        }}>
          表示施設
        </div>
        <button
          onClick={() => setFacilityOpen(o => !o)}
          style={{
            width: '100%', background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${facilityOpen ? selected.color : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 8, padding: '9px 11px',
            display: 'flex', alignItems: 'center', gap: 10,
            transition: 'border-color 0.15s',
          }}
        >
          <span style={{ width: 10, height: 10, borderRadius: 2, background: selected.color, flexShrink: 0 }} />
          <span style={{ flex: 1, color: '#fff', fontSize: 12, fontWeight: 600, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selected.name}
          </span>
          <ChevronDown size={13} color="rgba(255,255,255,0.4)" style={{ transform: facilityOpen ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }} />
        </button>

        {facilityOpen && (
          <div style={{
            position: 'absolute', top: 'calc(100% - 2px)', left: 14, right: 14, zIndex: 100,
            background: '#262833', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            maxHeight: 420, display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '5px 9px' }}>
                <Search size={12} color="rgba(255,255,255,0.4)" />
                <input
                  autoFocus
                  placeholder="施設を検索"
                  value={search} onChange={e => setSearch(e.target.value)}
                  style={{ flex: 1, background: 'transparent', border: 'none', padding: 0, color: '#fff', fontSize: 11 }}
                />
              </div>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {filtered.map(f => {
                const active = f.id === facilityId
                return (
                  <button key={f.id}
                    onClick={() => { onFacilityChange(f.id); setFacilityOpen(false); setSearch('') }}
                    style={{
                      width: '100%', padding: '8px 11px',
                      display: 'flex', alignItems: 'center', gap: 9,
                      background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
                      color: active ? '#fff' : 'rgba(255,255,255,0.65)',
                      fontSize: 11, fontWeight: active ? 600 : 400, textAlign: 'left',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: f.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                    {f.service && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>{f.service}</span>}
                    {active && <Check size={11} color={f.color} />}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── Nav ─── */}
      <nav style={{ flex: 1, padding: '10px 12px', overflowY: 'auto' }}>
        {NAV.map((group, gi) => (
          <div key={group.group} style={{ marginBottom: gi < NAV.length - 1 ? 14 : 0 }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 600,
              letterSpacing: '0.18em', color: 'rgba(255,255,255,0.3)',
              padding: '6px 10px 8px', textTransform: 'uppercase',
            }}>
              {group.group}
            </div>
            {group.items.map(item => (
              <NavItem key={item.id} {...item} current={current} onNavigate={onNavigate} />
            ))}
          </div>
        ))}
      </nav>

      {/* ─── User ─── */}
      <div style={{ flexShrink: 0, padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px' }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg,#c04a2a,#3a6b4e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, color: '#fff', fontWeight: 700, flexShrink: 0,
            fontFamily: 'var(--font-display)',
          }}>
            松
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#fff', fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>松岡 祐輝</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, letterSpacing: '0.05em' }}>AI CHAIN / ADMIN</div>
          </div>
          <button style={{ padding: 6, color: 'rgba(255,255,255,0.5)', display: 'flex', borderRadius: 5 }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}

function NavItem({ id, label, icon: Icon, badge, accent, current, onNavigate }) {
  const active = current === id
  return (
    <button
      onClick={() => onNavigate(id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        padding: '8px 10px', borderRadius: 6, marginBottom: 1,
        background: active ? 'rgba(192, 74, 42, 0.18)' : 'transparent',
        color: active ? '#fff' : 'rgba(255,255,255,0.58)',
        fontSize: 13, fontWeight: active ? 600 : 400, textAlign: 'left',
        transition: 'background 0.1s',
        position: 'relative',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
    >
      {active && <div style={{ position: 'absolute', left: -13, top: 8, bottom: 8, width: 3, borderRadius: '0 2px 2px 0', background: 'var(--accent)' }} />}
      <Icon size={15} style={{ flexShrink: 0, opacity: active ? 1 : 0.75 }} />
      <span style={{ flex: 1 }}>{label}</span>
      {accent && !active && (
        <span style={{ fontSize: 9, color: 'var(--accent)', background: 'rgba(192,74,42,0.15)', padding: '1px 6px', borderRadius: 3, fontWeight: 700, letterSpacing: '0.08em' }}>
          CORE
        </span>
      )}
      {badge > 0 && !active && (
        <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: 999, fontSize: 9, fontWeight: 700, padding: '1px 6px', fontFamily: 'var(--font-mono)' }}>{badge}</span>
      )}
      {active && <ChevronRight size={12} style={{ opacity: 0.7, flexShrink: 0 }} />}
    </button>
  )
}
