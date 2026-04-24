// 春日井市地図 - Leaflet + OpenStreetMap 実装
// - CartoDB Voyager タイル（Google Maps に近い見た目）
// - 施設・学校・学童を色分けマーカー
// - ルートをポリラインで描画（車両色）
// - 停車順を番号付きサークルで表示
// - ハイライト児童の自宅を波紋アニメーション

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, CircleMarker, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { SCHOOLS, LEARN_CENTERS } from '../data/schoolsData'
import { BASE } from '../data/routesData'
import { CHILD_BY_ID } from '../data/childrenData'

// カスタムアイコン生成
function makeDivIcon(html, size = [28, 28]) {
  return L.divIcon({
    html, className: 'nijiiro-marker',
    iconSize: size, iconAnchor: [size[0] / 2, size[1] / 2],
  })
}

const BASE_ICON = makeDivIcon(`
  <div style="
    width: 36px; height: 36px;
    background: #e88442;
    border: 3px solid #fff;
    border-radius: 50%;
    box-shadow: 0 3px 8px rgba(0,0,0,0.3);
    display: flex; align-items: center; justify-content: center;
  ">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
      <path d="M12 2L14.39 8.89L22 9.27L16.45 14.14L18.18 21.5L12 17.77L5.82 21.5L7.55 14.14L2 9.27L9.61 8.89L12 2Z" />
    </svg>
  </div>
`, [36, 36])

function schoolIcon(kind) {
  const colors = { '小': '#4b6fa5', '中': '#6b4a8b', '高': '#b84060', '特支': '#8a6340' }
  const color = colors[kind] || '#7e828f'
  return makeDivIcon(`
    <div style="
      width: 22px; height: 22px;
      background: ${color};
      border: 2px solid #fff;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.25);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-family: 'Bricolage Grotesque', sans-serif;
      font-size: 11px; font-weight: 700;
    ">${kind}</div>
  `, [22, 22])
}

const LEARN_ICON = makeDivIcon(`
  <div style="
    width: 0; height: 0;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-bottom: 17px solid #3a6b4e;
    filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));
  "></div>
`, [20, 17])

// 停車順サークル
function stopIcon(n, color) {
  return makeDivIcon(`
    <div style="
      width: 26px; height: 26px;
      background: #fff;
      border: 2.5px solid ${color};
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px; font-weight: 700;
      color: ${color};
      box-shadow: 0 2px 5px rgba(0,0,0,0.25);
    ">${n}</div>
  `, [26, 26])
}

function HighlightPulse({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) {
      map.setView(position, Math.max(map.getZoom(), 14), { animate: true })
    }
  }, [position, map])
  if (!position) return null
  return (
    <>
      <CircleMarker center={position} radius={8} pathOptions={{ fillColor: '#e88442', fillOpacity: 1, color: '#fff', weight: 2 }} />
      <CircleMarker center={position} radius={18} pathOptions={{ fillColor: '#e88442', fillOpacity: 0.15, color: '#e88442', weight: 1.5, className: 'pulse-ring' }} />
    </>
  )
}

export default function KasugaiMap({ routes = [], highlightChildren = [], selectedVehicle }) {
  const center = [BASE.lat, BASE.lng]
  const highlight = highlightChildren[0]
  const hlChild = highlight ? CHILD_BY_ID[highlight] : null
  const hlPos = hlChild?.homeLat ? [hlChild.homeLat, hlChild.homeLng] : null

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', background: '#e8e2d3' }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%', borderRadius: 'inherit' }}
        scrollWheelZoom={true}
        preferCanvas={true}
      >
        {/* CartoDB Voyager — Google Mapsに近い色合いの落ち着いたトーン */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        {/* BASE: にじいろCOMMON */}
        <Marker position={[BASE.lat, BASE.lng]} icon={BASE_ICON}>
          <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#e88442' }}>{BASE.name}</div>
          </Tooltip>
        </Marker>

        {/* 学校 */}
        {SCHOOLS.filter(s => s.lat != null).map(s => (
          <Marker key={s.id} position={[s.lat, s.lng]} icon={schoolIcon(s.kind)}>
            <Tooltip direction="top" offset={[0, -12]}>
              <div style={{ fontSize: 10.5, fontWeight: 600 }}>{s.name}</div>
              <div style={{ fontSize: 9.5, color: '#777', fontFamily: 'monospace' }}>下校 {s.time}</div>
            </Tooltip>
          </Marker>
        ))}

        {/* 学童 */}
        {LEARN_CENTERS.map(c => (
          <Marker key={c.id} position={[c.lat, c.lng]} icon={LEARN_ICON}>
            <Tooltip direction="top" offset={[0, -12]}>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: '#3a6b4e' }}>{c.name}</div>
              <div style={{ fontSize: 9.5, color: '#777' }}>{c.note}</div>
            </Tooltip>
          </Marker>
        ))}

        {/* ルート */}
        {routes.map(route => (
          <RouteLayer
            key={route.vehicle}
            route={route}
            active={!selectedVehicle || selectedVehicle === route.vehicle}
          />
        ))}

        {/* ハイライト児童 */}
        {hlPos && <HighlightPulse position={hlPos} />}
      </MapContainer>

      {/* 凡例 */}
      <div style={{
        position: 'absolute', bottom: 12, left: 12, zIndex: 500,
        background: 'rgba(255,255,255,0.96)',
        border: '1px solid rgba(0,0,0,0.1)',
        borderRadius: 6, padding: '8px 12px',
        fontSize: 10.5, color: '#333',
        backdropFilter: 'blur(6px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex', gap: 14, alignItems: 'center',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, background: '#e88442', borderRadius: '50%', border: '1.5px solid #fff', boxShadow: '0 0 0 1px #e88442' }} />
          <span>拠点</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, background: '#4b6fa5', borderRadius: 2 }} />
          <span>学校</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: '9px solid #3a6b4e' }} />
          <span>学童</span>
        </span>
      </div>
    </div>
  )
}

function RouteLayer({ route, active }) {
  // 停車地点の緯度経度を解決
  const stops = route.stops.map(st => {
    if (st.lat != null && st.lng != null) return { ...st, position: [st.lat, st.lng] }
    if (st.kind === 'depart' || st.kind === 'arrive') {
      return { ...st, position: [BASE.lat, BASE.lng] }
    }
    if (st.schoolId) {
      const school = SCHOOLS.find(s => s.id === st.schoolId) || LEARN_CENTERS.find(l => l.id === st.schoolId)
      if (school?.lat != null) return { ...st, position: [school.lat, school.lng] }
    }
    return null
  }).filter(Boolean)

  if (stops.length < 2) return null
  const positions = stops.map(s => s.position)
  const opacity = active ? 0.8 : 0.2

  return (
    <>
      {/* Halo (白い太線) */}
      <Polyline
        positions={positions}
        pathOptions={{
          color: '#fff', weight: 7, opacity: active ? 0.9 : 0,
          lineCap: 'round', lineJoin: 'round',
        }}
      />
      {/* 本線 */}
      <Polyline
        positions={positions}
        pathOptions={{
          color: route.color, weight: 4, opacity,
          lineCap: 'round', lineJoin: 'round',
        }}
      />

      {/* 中間停車点 */}
      {stops.slice(1, -1).map((s, i) => {
        const child = s.childId ? CHILD_BY_ID[s.childId] : null
        return (
          <Marker key={i} position={s.position} icon={stopIcon(i + 1, route.color)} opacity={opacity}>
            <Tooltip direction="top" offset={[0, -14]}>
              <div style={{ fontSize: 10.5, fontWeight: 600 }}>{child?.name || '停車点'}</div>
              <div style={{ fontSize: 9.5, color: '#777', fontFamily: 'monospace' }}>
                {s.time} {child?.grade ? ` · ${child.grade}` : ''}
              </div>
            </Tooltip>
          </Marker>
        )
      })}
    </>
  )
}
