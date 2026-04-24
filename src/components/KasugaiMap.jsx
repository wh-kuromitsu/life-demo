// 春日井市地図 - Leaflet + OpenStreetMap 実装
// - 初回マウント時は全画面オーバーレイで隠し、下記が揃ってから一斉に reveal する：
//     ① 地図タイルのロード完了（"tileload" or 初期状態で既にロード済みを検知）
//     ② 全ルートの OSRM フェッチ完了（成功/失敗どちらでも）
//     ③ 最低表示時間 250ms を経過（瞬間キャッシュヒットでのチラつき防止）
//   ── ③ のいずれかが満たされない場合のセーフティとして 8 秒でタイムアウト reveal
// - 一度 revealed になったら二度と隠さない（ルート再計算等でオーバーレイが戻るのを防止）

import { useCallback, useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, CircleMarker, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { SCHOOLS, LEARN_CENTERS } from '../data/schoolsData'
import { BASE } from '../data/routesData'
import { CHILD_BY_ID } from '../data/childrenData'

// ═══════════════════════════════════════════════════════
//  OSRM 経路フェッチ
// ═══════════════════════════════════════════════════════
const routeGeometryCache = new Map()
const routeInFlight      = new Map()

function geometryKey(coords) {
  return coords.map(([lat, lng]) => `${lat.toFixed(5)},${lng.toFixed(5)}`).join(';')
}

function dedupeConsecutive(coords) {
  return coords.filter((p, i) =>
    i === 0 ||
    Math.abs(p[0] - coords[i - 1][0]) > 1e-6 ||
    Math.abs(p[1] - coords[i - 1][1]) > 1e-6,
  )
}

async function fetchRoadGeometry(coords) {
  const uniq = dedupeConsecutive(coords)
  if (uniq.length < 2) return null

  const key = geometryKey(uniq)
  if (routeGeometryCache.has(key)) return routeGeometryCache.get(key)
  if (routeInFlight.has(key))      return routeInFlight.get(key)

  const coordStr = uniq.map(([lat, lng]) => `${lng},${lat}`).join(';')
  const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`

  const promise = (async () => {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.code !== 'Ok' || !data.routes?.[0]?.geometry?.coordinates) {
        throw new Error(`OSRM code=${data.code}`)
      }
      const geom = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng])
      routeGeometryCache.set(key, geom)
      // eslint-disable-next-line no-console
      console.info(`[nijiiro routing] OK · ${uniq.length}wp → ${geom.length}pts (${(data.routes[0].distance/1000).toFixed(2)}km)`)
      return geom
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[nijiiro routing] OSRM fetch failed, using smooth curve fallback:', err.message)
      routeGeometryCache.set(key, null)
      return null
    } finally {
      routeInFlight.delete(key)
    }
  })()

  routeInFlight.set(key, promise)
  return promise
}

function useRoadGeometry(coords) {
  const [state, setState] = useState({ geom: null, loading: true })
  const depKey = geometryKey(coords)

  useEffect(() => {
    if (coords.length < 2) {
      setState({ geom: null, loading: false })
      return
    }
    const key = geometryKey(coords)
    if (routeGeometryCache.has(key)) {
      setState({ geom: routeGeometryCache.get(key), loading: false })
      return
    }
    let cancelled = false
    setState({ geom: null, loading: true })
    fetchRoadGeometry(coords).then(g => {
      if (!cancelled) setState({ geom: g, loading: false })
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depKey])

  return state
}

// ═══════════════════════════════════════════════════════
//  Catmull-Rom（OSRM 失敗時のフォールバック）
// ═══════════════════════════════════════════════════════
function catmullRomSmoothed(points, { segments = 18, alpha = 0.5 } = {}) {
  if (!points || points.length < 2) return points || []
  if (points.length === 2) {
    const [a, b] = points
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
    const dy = b[0] - a[0], dx = b[1] - a[1]
    const len = Math.hypot(dy, dx) || 1
    const off = 0.0003
    mid[0] += (-dx / len) * off
    mid[1] += ( dy / len) * off
    return [a, mid, b]
  }
  const n = points.length
  const result = [points[0]]
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(n - 1, i + 2)]
    const t0 = 0
    const t1 = t0 + Math.pow(distSq(p0, p1), alpha / 2)
    const t2 = t1 + Math.pow(distSq(p1, p2), alpha / 2)
    const t3 = t2 + Math.pow(distSq(p2, p3), alpha / 2)
    for (let s = 1; s <= segments; s++) {
      const t = t1 + (t2 - t1) * (s / segments)
      result.push(catmullRomPoint(p0, p1, p2, p3, t0, t1, t2, t3, t))
    }
  }
  return result
}
function distSq(a, b) {
  const dy = a[0] - b[0], dx = a[1] - b[1]
  return dy * dy + dx * dx + 1e-12
}
function catmullRomPoint(p0, p1, p2, p3, t0, t1, t2, t3, t) {
  const a1 = lerp(p0, p1, safeDiv(t - t0, t1 - t0))
  const a2 = lerp(p1, p2, safeDiv(t - t1, t2 - t1))
  const a3 = lerp(p2, p3, safeDiv(t - t2, t3 - t2))
  const b1 = lerp(a1, a2, safeDiv(t - t0, t2 - t0))
  const b2 = lerp(a2, a3, safeDiv(t - t1, t3 - t1))
  return   lerp(b1, b2, safeDiv(t - t1, t2 - t1))
}
function lerp(a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k] }
function safeDiv(a, b) { return b === 0 ? 0 : a / b }

// ═══════════════════════════════════════════════════════
//  マーカー生成
// ═══════════════════════════════════════════════════════

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
      <CircleMarker center={position} radius={8}  pathOptions={{ fillColor: '#e88442', fillOpacity: 1,    color: '#fff',    weight: 2 }} />
      <CircleMarker center={position} radius={18} pathOptions={{ fillColor: '#e88442', fillOpacity: 0.15, color: '#e88442', weight: 1.5, className: 'pulse-ring' }} />
    </>
  )
}

// ═══════════════════════════════════════════════════════
//  TileReadyListener - タイル初期ロード完了の検知
// ═══════════════════════════════════════════════════════
// Leaflet の TileLayer は全可視タイル読み込み完了で 'load' イベントを発火するが、
// subdomain 切替や zoom 変更で何度も発火するので、初回のみ拾う。
// 追加のフォールバックとして、attach 時点で既にロード済みのレイヤーをポーリングで検知する。
function TileReadyListener({ onReady }) {
  const map = useMap()
  useEffect(() => {
    let done = false
    const fire = (why) => {
      if (done) return
      done = true
      // eslint-disable-next-line no-console
      console.info(`[nijiiro overlay] tiles ready (${why})`)
      onReady()
    }

    const tileLayers = []
    map.eachLayer(l => { if (l instanceof L.TileLayer) tileLayers.push(l) })

    // 既にロード完了しているかをチェック（キャッシュ済み or 超高速回線）
    // TileLayer._loading は全ロード完了で false になる Leaflet 内部フラグ
    const alreadyLoaded = tileLayers.length > 0 &&
      tileLayers.every(t => t._loading === false)
    if (alreadyLoaded) {
      // 次フレームで発火（state 更新のタイミングを合わせる）
      requestAnimationFrame(() => fire('already-loaded'))
      return
    }

    const onLayerLoad = () => fire('tilelayer-load')
    tileLayers.forEach(t => t.on('load', onLayerLoad))

    return () => {
      tileLayers.forEach(t => t.off('load', onLayerLoad))
    }
  }, [map, onReady])
  return null
}

// ═══════════════════════════════════════════════════════
//  メインマップ
// ═══════════════════════════════════════════════════════

const REVEAL_TIMEOUT_MS = 8000
const MIN_REVEAL_DELAY_MS = 250

export default function KasugaiMap({ routes = [], highlightChildren = [], selectedVehicle }) {
  const center = [BASE.lat, BASE.lng]
  const highlight = highlightChildren[0]
  const hlChild = highlight ? CHILD_BY_ID[highlight] : null
  const hlPos = hlChild?.homeLat ? [hlChild.homeLat, hlChild.homeLng] : null

  // ─── reveal state ───
  const [tilesReady, setTilesReady] = useState(false)
  const [finishedRoutes, setFinishedRoutes] = useState(() => new Set())
  const [minDelayElapsed, setMinDelayElapsed] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const handleTilesReady = useCallback(() => setTilesReady(true), [])

  // ★ 重要 ★ cleanup を持たない。以前は return で (id, false) を呼んでいたが、
  // StrictMode の mount→unmount→remount シミュレーションで全 route が即時に
  // "finished" 扱いされてしまうバグになっていた。ここは purely 通知のみで
  // OK（副作用は親側の state 更新で管理される）。
  const handleRouteFinished = useCallback((id) => {
    setFinishedRoutes(prev => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      // eslint-disable-next-line no-console
      console.info(`[nijiiro overlay] route finished: ${id}`)
      return next
    })
  }, [])

  // セーフティタイムアウト
  useEffect(() => {
    const t = setTimeout(() => {
      // eslint-disable-next-line no-console
      console.warn('[nijiiro overlay] safety timeout reached')
      setTimedOut(true)
    }, REVEAL_TIMEOUT_MS)
    return () => clearTimeout(t)
  }, [])

  // 最低表示時間（キャッシュヒット瞬間完了時のフラッシュ防止）
  useEffect(() => {
    const t = setTimeout(() => setMinDelayElapsed(true), MIN_REVEAL_DELAY_MS)
    return () => clearTimeout(t)
  }, [])

  const routesDone = routes.length === 0 || routes.every(r => finishedRoutes.has(r.vehicle))
  const canReveal = (tilesReady && routesDone && minDelayElapsed) || timedOut

  useEffect(() => {
    if (canReveal && !revealed) {
      // eslint-disable-next-line no-console
      console.info('[nijiiro overlay] revealing', {
        tilesReady, routesDone, minDelayElapsed, timedOut,
        finishedCount: finishedRoutes.size, totalRoutes: routes.length,
      })
      setRevealed(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canReveal, revealed])

  const totalRoutes = routes.length
  const doneCount   = Math.min(finishedRoutes.size, totalRoutes)
  const phaseLabel  = tilesReady ? 'ルートを計算中' : '地図を読み込み中'

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', background: '#e8e2d3' }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%', borderRadius: 'inherit' }}
        scrollWheelZoom={true}
        preferCanvas={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a> | routing: <a href="http://project-osrm.org/">OSRM</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        <TileReadyListener onReady={handleTilesReady} />

        <Marker position={[BASE.lat, BASE.lng]} icon={BASE_ICON}>
          <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#e88442' }}>{BASE.name}</div>
          </Tooltip>
        </Marker>

        {SCHOOLS.filter(s => s.lat != null).map(s => (
          <Marker key={s.id} position={[s.lat, s.lng]} icon={schoolIcon(s.kind)}>
            <Tooltip direction="top" offset={[0, -12]}>
              <div style={{ fontSize: 10.5, fontWeight: 600 }}>{s.name}</div>
              <div style={{ fontSize: 9.5, color: '#777', fontFamily: 'monospace' }}>下校 {s.time}</div>
            </Tooltip>
          </Marker>
        ))}

        {LEARN_CENTERS.map(c => (
          <Marker key={c.id} position={[c.lat, c.lng]} icon={LEARN_ICON}>
            <Tooltip direction="top" offset={[0, -12]}>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: '#3a6b4e' }}>{c.name}</div>
              <div style={{ fontSize: 9.5, color: '#777' }}>{c.note}</div>
            </Tooltip>
          </Marker>
        ))}

        {routes.map(route => (
          <RouteLayer
            key={route.vehicle}
            route={route}
            active={!selectedVehicle || selectedVehicle === route.vehicle}
            onFinished={handleRouteFinished}
          />
        ))}

        {hlPos && <HighlightPulse position={hlPos} />}
      </MapContainer>

      {!revealed && (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 1000,
            background: 'var(--bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 14,
            opacity: canReveal ? 0 : 1,
            pointerEvents: canReveal ? 'none' : 'auto',
            transition: 'opacity 0.45s ease-out',
            borderRadius: 'inherit',
          }}
          aria-live="polite"
        >
          <div style={{ position: 'relative', width: 54, height: 54 }}>
            <div style={{
              position: 'absolute', inset: 0,
              borderRadius: '50%',
              border: '3px solid var(--line)',
              borderTopColor: 'var(--accent)',
              borderRightColor: 'var(--rb-orange)',
              animation: 'spin 0.9s linear infinite',
            }} />
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 18, height: 18, borderRadius: '50%',
              background: 'linear-gradient(135deg,var(--rb-orange),var(--rb-pink),var(--rb-purple))',
              boxShadow: '0 2px 6px rgba(232,132,66,0.3)',
            }} />
          </div>
          <div style={{ textAlign: 'center', fontFamily: 'var(--font-body)' }}>
            <div style={{
              fontSize: 14, fontWeight: 700,
              color: 'var(--ink)',
              letterSpacing: '0.02em',
            }}>
              {phaseLabel}
            </div>
            {tilesReady && totalRoutes > 0 && (
              <div style={{
                marginTop: 4, fontSize: 11, fontWeight: 500,
                color: 'var(--ink-muted)',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.02em',
              }}>
                {doneCount} / {totalRoutes}
              </div>
            )}
          </div>
        </div>
      )}

      {revealed && (
        <div style={{
          position: 'absolute', bottom: 12, left: 12, zIndex: 500,
          background: 'rgba(255,255,255,0.96)',
          border: '1px solid rgba(0,0,0,0.1)',
          borderRadius: 8, padding: '8px 12px',
          fontSize: 10.5, color: '#333',
          backdropFilter: 'blur(6px)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex', gap: 14, alignItems: 'center',
          animation: 'fadeIn 0.35s ease-out',
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
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════
//  各ルート
// ═══════════════════════════════════════════════════════

function RouteLayer({ route, active, onFinished }) {
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

  return (
    <RouteLayerInner
      route={route}
      active={active}
      stops={stops}
      onFinished={onFinished}
    />
  )
}

function RouteLayerInner({ route, active, stops, onFinished }) {
  const positions = stops.map(s => s.position)
  const opacity   = active ? 0.85 : 0.2

  const { geom: roadGeom, loading } = useRoadGeometry(positions)
  const hasRoad = Array.isArray(roadGeom) && roadGeom.length >= 2

  // ★ 重要 ★ "loading === false" に入ったタイミングで一度だけ親に通知する。
  // cleanup はあえて定義しない（StrictMode の擬似 unmount で false 通知が
  // 漏れないようにするため）。onFinished は親側 useCallback で安定。
  useEffect(() => {
    if (!loading) onFinished?.(route.vehicle)
  }, [loading, route.vehicle, onFinished])

  // 描画ポリシー：
  //   loading → ポリライン描画なし
  //   success → 道路沿い
  //   fail    → Catmull-Rom 曲線
  let drawPositions = null
  if (!loading) {
    drawPositions = hasRoad ? roadGeom : catmullRomSmoothed(positions, { segments: 18 })
  }

  return (
    <>
      {drawPositions && (
        <>
          <Polyline
            positions={drawPositions}
            pathOptions={{
              color: '#fff', weight: 8,
              opacity: active ? 0.9 : 0,
              lineCap: 'round', lineJoin: 'round',
            }}
          />
          <Polyline
            positions={drawPositions}
            pathOptions={{
              color: route.color, weight: 4.5, opacity,
              lineCap: 'round', lineJoin: 'round',
            }}
          />
        </>
      )}

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
