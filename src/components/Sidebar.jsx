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
      width: 252, flexShrink: 0,
      background: 'var(--sidebar-bg)',
      display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0, height: '100vh',
      borderRight: '1px solid var(--sidebar-border)',
    }}>
      {/* ─── Brand（にじいろロゴ） ─── */}
      <div style={{
        padding: '20px 22px 16px',
        borderBottom: '1px solid var(--sidebar-border)',
        position: 'relative',
      }}>
        {/* 上部のレインボーライン */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 3, display: 'flex',
        }}>
          {['--rb-red','--rb-orange','--rb-yellow','--rb-green','--rb-teal','--rb-blue','--rb-purple','--rb-pink'].map(c => (
            <div key={c} style={{ flex: 1, background: `var(${c})` }} />
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          {/* レインボーの縦ストライプ（にじいろの象徴） */}
          <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 26 }}>
            {FACILITY_OPTIONS.slice(1, 9).map((f, i) => (
              <div key={f.id} style={{
                width: 3,
                height: [20, 26, 16, 24, 14, 22, 26, 18][i],
                background: f.color,
                borderRadius: 2,
                opacity: 0.92,
              }} />
            ))}
          </div>
          <div>
            <div style={{
              color: 'var(--sidebar-ink)',
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 17,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}>
              Nijiiro
            </div>
            <div style={{
              color: 'var(--sidebar-ink-mute)',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              marginTop: 3,
            }}>
              Operations
            </div>
          </div>
        </div>
      </div>

      {/* ─── Facility selector ─── */}
      <div style={{
        padding: '14px 14px',
        borderBottom: '1px solid var(--sidebar-border)',
        position: 'relative',
      }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 9, fontWeight: 700,
          letterSpacing: '0.18em',
          color: 'var(--sidebar-ink-mute)',
          marginBottom: 7, textTransform: 'uppercase',
          paddingLeft: 2,
        }}>
          表示施設
        </div>
        <button
          onClick={() => setFacilityOpen(o => !o)}
          style={{
            width: '100%',
            background: facilityOpen ? 'var(--sidebar-hover)' : 'var(--sidebar-soft)',
            border: `1.5px solid ${facilityOpen ? selected.color : 'var(--sidebar-border)'}`,
            borderRadius: 10,
            padding: '10px 12px',
            display: 'flex', alignItems: 'center', gap: 10,
            transition: 'all 0.15s',
          }}
        >
          <span style={{
            width: 10, height: 10, borderRadius: 3,
            background: selected.color, flexShrink: 0,
          }} />
          <span style={{
            flex: 1, color: 'var(--sidebar-ink)',
            fontSize: 12.5, fontWeight: 700, textAlign: 'left',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {selected.name}
          </span>
          <ChevronDown
            size={14}
            color="var(--sidebar-ink-mute)"
            style={{
              transform: facilityOpen ? 'rotate(180deg)' : '',
              transition: 'transform 0.2s',
            }}
          />
        </button>

        {facilityOpen && (
          <div style={{
            position: 'absolute', top: 'calc(100% - 2px)', left: 14, right: 14, zIndex: 100,
            background: '#ffffff',
            border: '1px solid var(--line-strong)',
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: 'var(--shadow-lg)',
            maxHeight: 420, display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'var(--bg)',
                borderRadius: 7, padding: '6px 10px',
              }}>
                <Search size={12} color="var(--ink-muted)" />
                <input
                  autoFocus
                  placeholder="施設を検索"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    flex: 1, background: 'transparent', border: 'none',
                    padding: 0, color: 'var(--ink)', fontSize: 12,
                  }}
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
                      width: '100%', padding: '9px 12px',
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: active ? 'var(--accent-faint)' : 'transparent',
                      color: active ? 'var(--ink)' : 'var(--ink-soft)',
                      fontSize: 12, fontWeight: active ? 700 : 500, textAlign: 'left',
                      transition: 'background 0.1s',
                      borderLeft: active ? `3px solid ${f.color}` : '3px solid transparent',
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--surface-soft)' }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                  >
                    <span style={{ width: 9, height: 9, borderRadius: 3, background: f.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                    {f.service && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, color: 'var(--ink-muted)',
                        background: 'var(--bg)',
                        padding: '1px 6px', borderRadius: 4,
                      }}>{f.service}</span>
                    )}
                    {active && <Check size={12} color={f.color} strokeWidth={3} />}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── Nav ─── */}
      <nav style={{ flex: 1, padding: '14px 12px', overflowY: 'auto' }}>
        {NAV.map((group, gi) => (
          <div key={group.group} style={{ marginBottom: gi < NAV.length - 1 ? 16 : 0 }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 9, fontWeight: 700,
              letterSpacing: '0.18em',
              color: 'var(--sidebar-ink-mute)',
              padding: '6px 12px 9px',
              textTransform: 'uppercase',
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
      <div style={{
        flexShrink: 0,
        padding: '12px 12px',
        borderTop: '1px solid var(--sidebar-border)',
        background: 'var(--sidebar-soft)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 6px' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg,var(--rb-orange),var(--rb-pink),var(--rb-purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, color: '#fff', fontWeight: 800, flexShrink: 0,
            fontFamily: 'var(--font-display)',
            boxShadow: '0 2px 6px rgba(232,132,66,0.3)',
          }}>
            松
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              color: 'var(--sidebar-ink)',
              fontSize: 12, fontWeight: 700,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              松岡 祐輝
            </div>
            <div style={{
              color: 'var(--sidebar-ink-mute)',
              fontSize: 9, fontWeight: 700,
              letterSpacing: '0.05em',
              marginTop: 1,
            }}>
              AI CHAIN / ADMIN
            </div>
          </div>
          <button style={{
            padding: 7, color: 'var(--sidebar-ink-soft)',
            display: 'flex', borderRadius: 7,
            transition: 'background 0.12s',
          }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--accent-faint)'
              e.currentTarget.style.color = 'var(--accent)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--sidebar-ink-soft)'
            }}
          >
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
        display: 'flex', alignItems: 'center', gap: 11, width: '100%',
        padding: '9px 12px', borderRadius: 9, marginBottom: 2,
        background: active ? 'var(--accent-faint)' : 'transparent',
        color: active ? 'var(--accent-deep)' : 'var(--sidebar-ink-soft)',
        fontSize: 13, fontWeight: active ? 700 : 500, textAlign: 'left',
        transition: 'all 0.12s',
        position: 'relative',
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.background = 'var(--sidebar-hover)'
          e.currentTarget.style.color = 'var(--sidebar-ink)'
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--sidebar-ink-soft)'
        }
      }}
    >
      {active && (
        <div style={{
          position: 'absolute', left: -12, top: 8, bottom: 8,
          width: 3, borderRadius: '0 2px 2px 0',
          background: 'var(--accent)',
        }} />
      )}
      <Icon size={16} style={{ flexShrink: 0, opacity: active ? 1 : 0.75 }} />
      <span style={{ flex: 1 }}>{label}</span>
      {accent && !active && (
        <span style={{
          fontSize: 9, fontWeight: 800,
          color: 'var(--accent)',
          background: 'var(--accent-soft)',
          padding: '2px 7px', borderRadius: 4,
          letterSpacing: '0.08em',
        }}>
          CORE
        </span>
      )}
      {badge > 0 && !active && (
        <span style={{
          background: 'var(--accent)', color: '#fff',
          borderRadius: 999,
          fontSize: 9, fontWeight: 800,
          padding: '2px 7px',
          fontFamily: 'var(--font-mono)',
        }}>
          {badge}
        </span>
      )}
      {active && <ChevronRight size={12} style={{ opacity: 0.7, flexShrink: 0 }} />}
    </button>
  )
}
