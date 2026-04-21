// 未配置者パネル - 松浦先生の認知モデル継承
// 学校ごとグルーピング → 時間順 → 11分以上の時間差で自動的に便分け
// VBA `UpdateUnassignedPanel` の動作を継承

import { useMemo } from 'react'
import { AlertTriangle, UserPlus, Clock } from 'lucide-react'
import { CHILD_BY_ID } from '../data/childrenData'
import { LOC_BY_ID } from '../data/schoolsData'

export default function UnassignedPanel({ unassignedIds = [], onAssign, selectedChildId, onSelectChild }) {
  const groups = useMemo(() => groupByLocationAndTime(unassignedIds), [unassignedIds])

  if (unassignedIds.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-muted)' }}>
        <div style={{ fontSize: 36, marginBottom: 6 }}>✓</div>
        <div className="display" style={{ fontSize: 14 }}>全員配置済</div>
        <div style={{ fontSize: 11, marginTop: 4 }}>すべての児童が何らかの便に割り当てられています</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px 16px', background: 'var(--amber-soft)', borderLeft: '3px solid var(--amber)', fontSize: 11, color: '#8b5a0c' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, marginBottom: 3 }}>
          <AlertTriangle size={12} /> {unassignedIds.length}名が未配置
        </div>
        <div style={{ lineHeight: 1.55 }}>
          場所ごとに時間順でソート。<span className="num">11分以上</span>の間隔は別便の目安（松浦先生の運用モデル）
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {groups.map((group, gi) => (
          <div key={gi} style={{ marginBottom: 4 }}>
            {/* Location header */}
            <div style={{
              padding: '6px 16px 4px',
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 10, fontWeight: 700,
              fontFamily: 'var(--font-display)', letterSpacing: '0.08em',
              color: 'var(--ink-soft)',
              textTransform: 'uppercase',
              background: 'var(--surface-soft)',
              borderTop: '1px solid var(--line-soft)',
            }}>
              <span style={{ width: 6, height: 6, background: group.locColor, borderRadius: 1 }} />
              <span>{group.locName}</span>
              <span style={{ marginLeft: 'auto', color: 'var(--ink-muted)', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>
                {group.children.length}名
              </span>
            </div>

            {/* Children in sub-groups (by 11-min gaps) */}
            {group.subgroups.map((subgroup, si) => (
              <div key={si}>
                {si > 0 && (
                  <div style={{
                    padding: '4px 16px', fontSize: 9,
                    color: 'var(--amber)', fontFamily: 'var(--font-mono)',
                    display: 'flex', alignItems: 'center', gap: 5,
                    borderLeft: '2px dashed var(--amber)', marginLeft: 12,
                  }}>
                    <span style={{ fontWeight: 700 }}>┈┈ {subgroup.gap}分差 / 別便推奨 ┈┈</span>
                  </div>
                )}
                {subgroup.children.map(c => (
                  <UnassignedRow
                    key={c.id}
                    child={c}
                    locName={group.locName}
                    selected={selectedChildId === c.id}
                    onSelect={() => onSelectChild?.(c.id)}
                    onAssign={() => onAssign?.(c.id)}
                  />
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function UnassignedRow({ child, locName, selected, onSelect, onAssign }) {
  const loc = LOC_BY_ID[child.pickupLoc] || LOC_BY_ID[child.school]
  const time = loc?.time || '—'

  return (
    <div
      onClick={onSelect}
      style={{
        padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10,
        cursor: 'pointer', transition: 'background 0.12s',
        background: selected ? 'var(--accent-faint)' : 'transparent',
        borderLeft: selected ? '3px solid var(--accent)' : '3px solid transparent',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'var(--bg)' }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent' }}
    >
      <div className="num" style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', width: 42, flexShrink: 0 }}>
        {time}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
          {child.name}
          {child.tag && (
            <span className="pill pill-accent" style={{ fontSize: 9, padding: '0 5px' }}>{child.tag}</span>
          )}
        </div>
        <div style={{ fontSize: 10, color: 'var(--ink-muted)', marginTop: 1 }}>
          {child.grade} · {child.facility.toUpperCase()}
          {child.pickupNote && ` · ${child.pickupNote}`}
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onAssign?.() }}
        className="btn btn-sm btn-ghost"
        style={{ flexShrink: 0 }}
        title="車両に割り当てる"
      >
        <UserPlus size={11} />
      </button>
    </div>
  )
}

// ─── グルーピングロジック ───
function groupByLocationAndTime(childIds) {
  const children = childIds.map(id => CHILD_BY_ID[id]).filter(Boolean)

  // Group by pickup location
  const byLoc = {}
  for (const c of children) {
    const locId = c.pickupLoc || c.school || 'unknown'
    if (!byLoc[locId]) byLoc[locId] = []
    byLoc[locId].push(c)
  }

  // Location ordering from 送迎データ sheet (简化: 学校のHUG_No順に近い形)
  const locOrder = ['higashino','hachiman','sakashita','shinoki','toubu','oote','ono','chubu','toriimatsu','maruta','hokujo','kamijo','jinryo','kodomo','degawa','afk','kashihara','doronko','matsuyama','nakayoshi','shoyo','home','grandparent']

  const sortedLocs = Object.keys(byLoc).sort((a, b) => {
    const ai = locOrder.indexOf(a); const bi = locOrder.indexOf(b)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

  return sortedLocs.map(locId => {
    const loc = LOC_BY_ID[locId]
    const childrenInLoc = byLoc[locId].sort((a, b) => {
      const at = LOC_BY_ID[a.pickupLoc]?.time || LOC_BY_ID[a.school]?.time || '99:99'
      const bt = LOC_BY_ID[b.pickupLoc]?.time || LOC_BY_ID[b.school]?.time || '99:99'
      return at.localeCompare(bt)
    })

    // Split into subgroups by 11-min gap
    const subgroups = []
    let current = [childrenInLoc[0]]
    let lastTime = LOC_BY_ID[childrenInLoc[0]?.pickupLoc]?.time || LOC_BY_ID[childrenInLoc[0]?.school]?.time
    for (let i = 1; i < childrenInLoc.length; i++) {
      const c = childrenInLoc[i]
      const t = LOC_BY_ID[c.pickupLoc]?.time || LOC_BY_ID[c.school]?.time
      const gap = timeDiff(lastTime, t)
      if (gap >= 11) {
        subgroups.push({ children: current, gap: 0 })
        current = [c]
      } else {
        current.push(c)
      }
      lastTime = t
    }
    subgroups.push({ children: current, gap: subgroups.length > 0 ? 11 : 0 })
    if (subgroups.length > 1) {
      subgroups[1].gap = 11
    }

    return {
      locId, locName: loc?.name || locId,
      locColor: loc?.kind === '高' ? '#b84060' : loc?.kind === '中' ? '#6b4a8b' : '#4b6fa5',
      children: childrenInLoc,
      subgroups,
    }
  })
}

function timeDiff(a, b) {
  if (!a || !b) return 0
  const [ah, am] = a.split(':').map(Number)
  const [bh, bm] = b.split(':').map(Number)
  return Math.abs((bh * 60 + bm) - (ah * 60 + am))
}
