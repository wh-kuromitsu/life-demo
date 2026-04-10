import { useState } from 'react'
import { LayoutDashboard, Users, Car, Map, Settings, Bell, LogOut, Building2, ChevronRight, ChevronDown, AlertTriangle, Check } from 'lucide-react'

const NAV = [
  { id: 'dashboard',     label: 'ダッシュボード', icon: LayoutDashboard },
  { id: 'customers',     label: '顧客管理',       icon: Users },
  { id: 'transport',     label: '送迎管理',       icon: Car },
  { id: 'route',         label: 'ルート最適化',   icon: Map },
]

const NOTIFICATIONS_COUNT = 3

const FACILITY_COLORS = {
  'すべて':          '#64748b',
  'にじいろPLUS':    '#2e7df7',
  'にじいろPALETTE': '#22c55e',
  'にじいろLABO':    '#f59e0b',
  'NIJIIRONOBA':     '#8b5cf6',
  'にじいろPROGRESS':'#ef4444',
}

function NavBtn({ id, label, icon: Icon, current, onNavigate, badge }) {
  const active = current === id
  return (
    <button onClick={() => onNavigate(id)} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px', borderRadius: 8,
      background: active ? 'var(--accent)' : 'transparent',
      color: active ? 'white' : 'rgba(255,255,255,0.55)',
      border: 'none', cursor: 'pointer', width: '100%',
      fontSize: 13, fontWeight: active ? 600 : 400,
      fontFamily: 'inherit', transition: 'background 0.15s', textAlign: 'left',
    }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
    >
      <Icon size={16} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{label}</span>
      {badge > 0 && !active && (
        <span style={{ background: '#ef4444', color: 'white', borderRadius: 999, fontSize: 10, fontWeight: 700, padding: '1px 6px', lineHeight: 1.6 }}>{badge}</span>
      )}
      {active && <ChevronRight size={13} style={{ opacity: 0.7, flexShrink: 0 }} />}
    </button>
  )
}

export default function Sidebar({ current, onNavigate, facility, onFacilityChange, facilities }) {
  const [showLogout, setShowLogout] = useState(false)
  const [facilityOpen, setFacilityOpen] = useState(false)

  const facilityColor = FACILITY_COLORS[facility] || '#64748b'
  const isAll = facility === 'すべて'

  return (
    <aside style={{
      width: 240, background: 'var(--sidebar)',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      position: 'sticky', top: 0, height: '100vh', overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{ padding: '22px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Building2 size={18} color="white" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>にじいろ</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: '0.05em' }}>管理システム</div>
          </div>
        </div>
      </div>

      {/* ── 施設セレクター ── */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, position: 'relative' }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.07em', marginBottom: 6, textTransform: 'uppercase' }}>表示施設</div>

        {/* Trigger */}
        <button
          onClick={() => setFacilityOpen(o => !o)}
          style={{
            width: '100%', background: 'rgba(255,255,255,0.06)',
            border: `1px solid ${facilityOpen ? facilityColor : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 8, padding: '8px 10px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit',
            transition: 'border-color 0.15s',
          }}
        >
          {/* dot */}
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: facilityColor, flexShrink: 0 }} />
          <span style={{ flex: 1, color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {facility}
          </span>
          <ChevronDown size={13} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0, transform: facilityOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        {/* Dropdown */}
        {facilityOpen && (
          <div style={{
            position: 'absolute', top: 'calc(100% - 6px)', left: 14, right: 14,
            background: '#1e293b', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 10, zIndex: 100, overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}>
            {facilities.map(f => {
              const selected = facility === f
              const color = FACILITY_COLORS[f] || '#64748b'
              return (
                <button
                  key={f}
                  onClick={() => { onFacilityChange(f); setFacilityOpen(false) }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 12px', background: selected ? 'rgba(255,255,255,0.08)' : 'transparent',
                    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    color: selected ? 'white' : 'rgba(255,255,255,0.6)',
                    fontSize: 12, fontWeight: selected ? 600 : 400, textAlign: 'left',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                  onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{f}</span>
                  {selected && <Check size={12} color={color} style={{ flexShrink: 0 }} />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', padding: '2px 12px 8px', textTransform: 'uppercase' }}>メニュー</div>
        {NAV.map(n => <NavBtn key={n.id} {...n} current={current} onNavigate={(id) => { onNavigate(id); setFacilityOpen(false) }} />)}

        <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', padding: '14px 12px 8px', textTransform: 'uppercase' }}>その他</div>
        <NavBtn id="notifications" label="通知" icon={Bell} current={current} onNavigate={onNavigate} badge={NOTIFICATIONS_COUNT} />
        <NavBtn id="settings" label="設定" icon={Settings} current={current} onNavigate={onNavigate} />
      </nav>

      {/* User + Logout */}
      <div style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.08)', padding: '10px 12px' }}>
        {showLogout ? (
          <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <AlertTriangle size={13} color="#fca5a5" />
              <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>ログアウトしますか？</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: 'none', cursor: 'pointer', background: '#ef4444', color: 'white', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <LogOut size={12} />ログアウト
              </button>
              <button onClick={() => setShowLogout(false)} style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.55)', fontSize: 12, fontFamily: 'inherit' }}>
                キャンセル
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 4px' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #2e7df7, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'white', fontWeight: 700, flexShrink: 0 }}>松</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>松岡 担当</div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>システム管理者</div>
            </div>
            <button onClick={() => setShowLogout(true)} title="ログアウト" style={{
              flexShrink: 0, width: 30, height: 30,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.4)', transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.25)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; e.currentTarget.style.color = '#fca5a5' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
