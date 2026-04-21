// 春日井市エリアの概念地図（SVG）
// 実地理ではなく相対位置を表現
// - 学校・学童・施設をドット表示
// - 車両ルートを色分けポリラインで描画
// - 国道19号/国道155号を「またがない」制約の可視化として点線表示

import { SCHOOLS, LEARN_CENTERS } from '../data/schoolsData'
import { BASE } from '../data/routesData'
import { CHILD_BY_ID } from '../data/childrenData'

export default function KasugaiMap({ routes = [], selectedVehicle, onSelectVehicle, showLabels = true, highlightChildren = [], compact = false }) {
  const vw = compact ? 620 : 800
  const vh = compact ? 400 : 520

  return (
    <div style={{ position: 'relative', background: 'var(--bg-deep)', borderRadius: 8, overflow: 'hidden', height: '100%' }}>
      <svg viewBox={`0 0 ${vw} ${vh}`} style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          {/* subtle texture pattern */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#dcd4c3" strokeWidth="0.5" opacity="0.5" />
          </pattern>
          {/* arrow marker */}
          <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
          </marker>
        </defs>

        {/* Background with grid */}
        <rect width={vw} height={vh} fill="#f0ebdf" />
        <rect width={vw} height={vh} fill="url(#grid)" />

        {/* Area tints (conceptual districts) */}
        <g opacity="0.35">
          <ellipse cx="180" cy="360" rx="110" ry="75" fill="#c6d6bf" />
          <ellipse cx="450" cy="180" rx="130" ry="85" fill="#d8c7b4" />
          <ellipse cx="610" cy="280" rx="110" ry="100" fill="#cdc4d6" />
          <ellipse cx="380" cy="390" rx="120" ry="80" fill="#d6c4bf" />
        </g>

        {/* District labels */}
        {showLabels && !compact && (
          <g fontFamily="var(--font-display)" fontSize="11" fontWeight="700" fill="#8a8268" letterSpacing="0.1em">
            <text x="130" y="380" opacity="0.6">KACHIGAWA</text>
            <text x="400" y="155" opacity="0.6">KITA-KASUGAI</text>
            <text x="570" y="260" opacity="0.6">TAKAKURAJI</text>
            <text x="330" y="410" opacity="0.6">MATSUBARA</text>
          </g>
        )}

        {/* Rail line (Chuo Line) - subtle horizontal */}
        <path d="M 40 320 Q 200 305 400 315 T 780 330" stroke="#a8a098" strokeWidth="1.2" strokeDasharray="6 3" fill="none" opacity="0.5" />
        {showLabels && (
          <text x="50" y="315" fontSize="9" fill="#8a8268" fontFamily="var(--font-mono)" opacity="0.6">JR中央本線</text>
        )}

        {/* National routes (送迎は「またがない」ので制約線として表示) */}
        <g stroke="#b8553d" strokeWidth="1.5" strokeDasharray="4 3" fill="none" opacity="0.55">
          <path d="M 40 240 Q 300 220 500 230 T 780 225" />
          <path d="M 430 40 Q 440 200 445 380 T 460 500" />
        </g>
        {showLabels && (
          <g fontSize="9" fill="#9a4a2f" fontFamily="var(--font-mono)" opacity="0.7">
            <text x="700" y="220">国道19号</text>
            <text x="440" y="30">国道155号</text>
          </g>
        )}

        {/* Routes (polylines per vehicle) */}
        {routes.map(route => (
          <RoutePath
            key={route.vehicle}
            route={route}
            active={!selectedVehicle || selectedVehicle === route.vehicle}
          />
        ))}

        {/* Schools */}
        {SCHOOLS.filter(s => s.x != null).map(s => {
          const hasChild = routes.some(r => r.stops?.some(st => st.schoolId === s.id))
          return (
            <SchoolMarker key={s.id} school={s} active={hasChild} showLabel={showLabels} compact={compact} />
          )
        })}

        {/* Learning centers */}
        {LEARN_CENTERS.map(c => (
          <LearnCenterMarker key={c.id} center={c} showLabel={showLabels} compact={compact} />
        ))}

        {/* Base (facility) */}
        <BaseMarker base={BASE} showLabel={showLabels} />

        {/* Highlighted children */}
        {highlightChildren.map(cid => {
          const child = CHILD_BY_ID[cid]
          if (!child || !child.homeX) return null
          return (
            <g key={cid}>
              <circle cx={child.homeX} cy={child.homeY} r="14" fill="none" stroke="#c04a2a" strokeWidth="1.5" opacity="0.4">
                <animate attributeName="r" from="8" to="18" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <circle cx={child.homeX} cy={child.homeY} r="5" fill="#c04a2a" stroke="#fff" strokeWidth="1.5" />
            </g>
          )
        })}
      </svg>

      {/* Map legend (bottom-left) */}
      {!compact && (
        <div style={{
          position: 'absolute', bottom: 10, left: 10,
          background: 'rgba(255,255,255,0.92)', border: '1px solid var(--line)',
          borderRadius: 6, padding: '8px 12px', fontSize: 10,
          display: 'flex', gap: 14, color: 'var(--ink-soft)', backdropFilter: 'blur(4px)',
        }}>
          <LegendItem color="var(--accent)" label="施設起点" shape="star" />
          <LegendItem color="#4b6fa5" label="学校" shape="square" />
          <LegendItem color="var(--sage)" label="学童" shape="triangle" />
          <LegendItem color="#b8553d" label="国道（避ける）" shape="dash" />
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───

function BaseMarker({ base, showLabel }) {
  return (
    <g>
      <circle cx={base.x} cy={base.y} r="18" fill="var(--accent-faint)" opacity="0.9" />
      <circle cx={base.x} cy={base.y} r="10" fill="var(--accent)" stroke="#fff" strokeWidth="2" />
      {/* star */}
      <path d={starPath(base.x, base.y, 5)} fill="#fff" />
      {showLabel && (
        <text x={base.x} y={base.y - 24} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink)" fontFamily="var(--font-display)">
          {base.name}
        </text>
      )}
    </g>
  )
}

function SchoolMarker({ school, active, showLabel, compact }) {
  const color = active ? 'var(--ink)' : '#a8a098'
  const size = school.kind === '高' ? 8 : school.kind === '中' ? 7 : 5
  return (
    <g>
      <rect x={school.x - size/2} y={school.y - size/2} width={size} height={size} fill={color} stroke="#fff" strokeWidth="1" rx="1" />
      {showLabel && !compact && (
        <text x={school.x + size/2 + 3} y={school.y + 3} fontSize="9" fill="var(--ink-soft)" fontFamily="var(--font-body)">
          {school.name.replace('小学校', '小').replace('中学校', '中').replace('春日井翔陽高等学院', '翔陽')}
        </text>
      )}
    </g>
  )
}

function LearnCenterMarker({ center, showLabel, compact }) {
  return (
    <g>
      <polygon
        points={`${center.x},${center.y-4} ${center.x+4},${center.y+3} ${center.x-4},${center.y+3}`}
        fill="var(--sage)" stroke="#fff" strokeWidth="0.8"
      />
      {showLabel && !compact && (
        <text x={center.x + 7} y={center.y + 3} fontSize="8" fill="var(--sage)" fontFamily="var(--font-body)" fontWeight="500">
          {center.name}
        </text>
      )}
    </g>
  )
}

function RoutePath({ route, active }) {
  // stops: [{x,y} or {schoolId,childId}] — resolve coordinates
  const points = route.stops.map(st => {
    if (st.x != null) return [st.x, st.y]
    const school = SCHOOLS.find(s => s.id === st.schoolId)
    if (school) return [school.x, school.y]
    return null
  }).filter(Boolean)

  if (points.length < 2) return null
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ')
  const opacity = active ? 0.85 : 0.15

  return (
    <g>
      {/* Shadow/halo */}
      <path d={path} stroke="#fff" strokeWidth="5" fill="none" opacity={active ? 0.7 : 0} strokeLinecap="round" strokeLinejoin="round" />
      {/* Route line */}
      <path
        d={path} stroke={route.color} strokeWidth="2.5" fill="none"
        opacity={opacity} strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="1000" strokeDashoffset="1000"
        style={{ animation: active ? 'dashDraw 1.2s ease-out forwards' : 'none' }}
      />
      {/* Stop dots */}
      {points.slice(1, -1).map((p, i) => (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r="7" fill="#fff" stroke={route.color} strokeWidth="2" opacity={opacity} />
          <text x={p[0]} y={p[1] + 3} textAnchor="middle" fontSize="9" fontWeight="700" fill={route.color} fontFamily="var(--font-mono)" opacity={opacity}>
            {i + 1}
          </text>
        </g>
      ))}
    </g>
  )
}

function LegendItem({ color, label, shape }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      {shape === 'square' && <span style={{ width: 6, height: 6, background: color }} />}
      {shape === 'triangle' && <span style={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: `7px solid ${color}` }} />}
      {shape === 'star' && <span style={{ width: 8, height: 8, background: color, clipPath: 'polygon(50% 0, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />}
      {shape === 'dash' && <span style={{ width: 12, height: 2, background: color, position: 'relative' }}><span style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, ' + color + ', ' + color + ' 3px, transparent 3px, transparent 5px)' }} /></span>}
      {label}
    </span>
  )
}

function starPath(cx, cy, r) {
  const points = []
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2
    const radius = i % 2 === 0 ? r : r * 0.45
    points.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)])
  }
  return 'M ' + points.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L ') + ' Z'
}
