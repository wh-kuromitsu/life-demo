import { useState, useRef } from 'react'
import {
  Map, Zap, Navigation, Car, Clock, Users, AlertTriangle,
  ChevronRight, ChevronDown, ChevronUp, RotateCcw, ExternalLink,
  CheckCircle2, Circle, XCircle, GripVertical, Plus, Minus,
  Star, AlertCircle, ArrowRight, Play, RefreshCw, Home
} from 'lucide-react'
import { customers, vehicles } from '../data/mockData'

// ── 定数 ──────────────────────────────────────
const PRIORITY_OPTS = [
  { value: 1, label: '最優先', color: '#ef4444', icon: '🔴' },
  { value: 2, label: '高',     color: '#f59e0b', icon: '🟠' },
  { value: 3, label: '標準',   color: '#2e7df7', icon: '🔵' },
  { value: 4, label: '低',     color: '#94a3b8', icon: '⚪' },
]

const BASE = { name: 'にじいろPLUS（出発地）', address: '愛知県春日井市篠木町2丁目1281番地1', lat: 35.255, lng: 136.970 }

const STOP_STATUS = { waiting: 'waiting', inProgress: 'inProgress', done: 'done', skipped: 'skipped' }

// Google Maps ナビURL生成
const buildMapsUrl = (stops) => {
  const addrs = stops.map(s => encodeURIComponent(s.address))
  const origin = addrs[0]
  const dest = addrs[addrs.length - 1]
  const waypoints = addrs.slice(1, -1).join('|')
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}${waypoints ? `&waypoints=${waypoints}` : ''}&travelmode=driving`
}

// 最適化シミュレーション（優先度 + 時間窓ベースのソート）
const optimizeRoute = (conditions) => {
  const sorted = [...conditions]
    .filter(c => !c.excluded)
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority
      const aTime = a.arriveBy || '99:99'
      const bTime = b.arriveBy || '99:99'
      return aTime.localeCompare(bTime)
    })
  return sorted
}

// 時刻計算（分）
const addMinutes = (timeStr, mins) => {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':').map(Number)
  const total = h * 60 + m + mins
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

// ── メインコンポーネント ────────────────────────
export default function RouteOptimize({ facility }) {
  // Step: 'setup' | 'result' | 'driving'
  const [step, setStep] = useState('setup')
  const [selectedVehicle, setSelectedVehicle] = useState(vehicles[0])
  const [selectedDate, setSelectedDate] = useState('2026-04-10')
  const [routeType, setRouteType] = useState('pickup') // pickup | dropoff

  // 対象児童リスト（条件付き）
  const transportList = customers.filter(c => c.transport)
  const [conditions, setConditions] = useState(
    transportList.map(c => ({
      id: c.id, name: c.name, address: c.address, facility: c.facility,
      arriveAfter: '',    // 何時以降
      arriveBy: '',       // 何時まで
      priority: 3,        // 1=最優先〜4=低
      note: '',           // メモ
      excluded: false,    // 除外
    }))
  )

  // 最適化済みルート
  const [optimizedStops, setOptimizedStops] = useState([])
  const [isOptimizing, setIsOptimizing] = useState(false)

  // 運行中状態
  const [stopStatuses, setStopStatuses] = useState({})
  const [currentStopIdx, setCurrentStopIdx] = useState(0)
  const [reoptimizing, setReoptimizing] = useState(false)
  const [showReoptConfirm, setShowReoptConfirm] = useState(false)

  const updateCondition = (id, field, value) => {
    setConditions(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  const handleOptimize = () => {
    setIsOptimizing(true)
    setTimeout(() => {
      const sorted = optimizeRoute(conditions)
      let time = '13:30'
      const stops = sorted.map((c, i) => {
        const est = addMinutes(time, 10 + i * 12)
        time = est
        return { ...c, estimatedTime: est, status: STOP_STATUS.waiting }
      })
      setOptimizedStops(stops)
      setStopStatuses(Object.fromEntries(stops.map(s => [s.id, STOP_STATUS.waiting])))
      setCurrentStopIdx(0)
      setIsOptimizing(false)
      setStep('result')
    }, 1600)
  }

  const startDriving = () => {
    setStep('driving')
  }

  const markDone = (id) => {
    setStopStatuses(p => ({ ...p, [id]: STOP_STATUS.done }))
    const nextIdx = optimizedStops.findIndex((s, i) => i > currentStopIdx && stopStatuses[s.id] === STOP_STATUS.waiting)
    if (nextIdx !== -1) setCurrentStopIdx(nextIdx)
    else setCurrentStopIdx(p => p + 1)
  }

  const markSkipped = (id) => {
    setStopStatuses(p => ({ ...p, [id]: STOP_STATUS.skipped }))
  }

  const handleReoptimize = () => {
    setReoptimizing(true)
    setShowReoptConfirm(false)
    setTimeout(() => {
      // 完了済み・スキップ済みを除いた残りを再最適化
      const remaining = optimizedStops.filter(s =>
        stopStatuses[s.id] === STOP_STATUS.waiting || stopStatuses[s.id] === STOP_STATUS.inProgress
      )
      const done = optimizedStops.filter(s =>
        stopStatuses[s.id] === STOP_STATUS.done || stopStatuses[s.id] === STOP_STATUS.skipped
      )
      const reoptimized = [...done, ...remaining]
      setOptimizedStops(reoptimized)
      setCurrentStopIdx(done.length)
      setReoptimizing(false)
    }, 1200)
  }

  const mapsUrl = optimizedStops.length > 0
    ? buildMapsUrl([BASE, ...optimizedStops, BASE])
    : '#'

  const doneCount = optimizedStops.filter(s => stopStatuses[s.id] === STOP_STATUS.done).length
  const totalCount = optimizedStops.length
  const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0

  return (
    <div>
      {/* ── ページヘッダー ── */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="page-title">ルート最適化</div>
            <div className="page-subtitle">条件を設定して最適な送迎順序を自動計算・ナビ連携</div>
          </div>
          {step !== 'setup' && (
            <button className="btn btn-ghost" onClick={() => { setStep('setup'); setOptimizedStops([]) }}>
              <RotateCcw size={14} /> 最初から
            </button>
          )}
        </div>
      </div>

      {/* ── ステップインジケーター ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24, background: 'var(--surface)', borderRadius: 12, padding: '14px 20px', boxShadow: 'var(--shadow)' }}>
        {[
          { key: 'setup',   label: '① 条件設定', desc: '児童・時間・優先度' },
          { key: 'result',  label: '② ルート確認', desc: '最適化結果・Google Maps' },
          { key: 'driving', label: '③ 運行中',    desc: 'リアルタイム進捗・再調整' },
        ].map((s, i, arr) => {
          const isActive = step === s.key
          const isDone = (step === 'result' && i === 0) || (step === 'driving' && i < 2)
          return (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isDone ? 'var(--green)' : isActive ? 'var(--accent)' : 'var(--border)',
                    color: isDone || isActive ? 'white' : 'var(--text-muted)', fontWeight: 700, fontSize: 12, flexShrink: 0,
                  }}>
                    {isDone ? <CheckCircle2 size={14} /> : i + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--accent)' : isDone ? 'var(--text)' : 'var(--text-muted)' }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.desc}</div>
                  </div>
                </div>
              </div>
              {i < arr.length - 1 && (
                <ChevronRight size={16} color={isDone ? 'var(--green)' : 'var(--border)'} style={{ flexShrink: 0, margin: '0 8px' }} />
              )}
            </div>
          )
        })}
      </div>

      {/* ── STEP 1: 条件設定 ── */}
      {step === 'setup' && (
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          {/* 左：基本設定 */}
          <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card">
              <div className="card-title" style={{ marginBottom: 14 }}>基本設定</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={labelStyle}>日付</div>
                  <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div>
                  <div style={labelStyle}>車両</div>
                  <select style={{ width: '100%' }} value={selectedVehicle.id} onChange={e => setSelectedVehicle(vehicles.find(v => v.id === e.target.value))}>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.name}（定員{v.capacity}名）</option>)}
                  </select>
                </div>
                <div>
                  <div style={labelStyle}>種別</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[{ v: 'pickup', l: 'お迎え' }, { v: 'dropoff', l: 'お送り' }].map(opt => (
                      <button key={opt.v} onClick={() => setRouteType(opt.v)} style={{
                        flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                        border: `2px solid ${routeType === opt.v ? 'var(--accent)' : 'var(--border)'}`,
                        background: routeType === opt.v ? 'var(--accent-light)' : 'white',
                        color: routeType === opt.v ? 'var(--accent)' : 'var(--text-muted)',
                      }}>{opt.l}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="card" style={{ background: 'var(--accent-light)', border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginBottom: 8 }}>📌 設定のヒント</div>
              <div style={{ fontSize: 12, color: '#1d4ed8', lineHeight: 1.7 }}>
                • 優先度「最優先」は必ず先に送迎<br />
                • 時間窓を設定すると制約を考慮して順序を決定<br />
                • 除外した児童は今日の送迎から外れます
              </div>
            </div>

            <div style={{ background: 'var(--surface)', borderRadius: 12, boxShadow: 'var(--shadow)', padding: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>対象：{conditions.filter(c => !c.excluded).length}名 / 全{conditions.length}名</div>
              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', fontSize: 14, padding: '12px' }}
                onClick={handleOptimize}
                disabled={isOptimizing || conditions.filter(c => !c.excluded).length === 0}
              >
                {isOptimizing
                  ? <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span> 最適化中...</>
                  : <><Zap size={15} /> ルートを最適化</>}
              </button>
            </div>
          </div>

          {/* 右：児童ごとの条件 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="card-title">児童別 条件設定</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>優先度</span>
                  {PRIORITY_OPTS.map(p => (
                    <span key={p.value} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span>{p.icon}</span>{p.label}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* ヘッダー行 */}
                <div style={{ display: 'grid', gridTemplateColumns: '200px 100px 100px 120px 1fr 60px', gap: 8, padding: '8px 18px', background: '#fafbfc', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <div>児童名</div><div>何時以降</div><div>何時まで</div><div>優先度</div><div>メモ</div><div>除外</div>
                </div>

                {conditions.map((c, i) => (
                  <div key={c.id} style={{
                    display: 'grid', gridTemplateColumns: '200px 100px 100px 120px 1fr 60px',
                    gap: 8, padding: '10px 18px', alignItems: 'center',
                    borderBottom: i < conditions.length - 1 ? '1px solid var(--border)' : 'none',
                    background: c.excluded ? '#fafbfc' : 'white',
                    opacity: c.excluded ? 0.5 : 1, transition: 'opacity 0.2s',
                  }}>
                    {/* 名前 */}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.facility}</div>
                    </div>

                    {/* 何時以降 */}
                    <input
                      type="time" disabled={c.excluded}
                      value={c.arriveAfter}
                      onChange={e => updateCondition(c.id, 'arriveAfter', e.target.value)}
                      style={{ width: '100%', fontSize: 12 }}
                    />

                    {/* 何時まで */}
                    <input
                      type="time" disabled={c.excluded}
                      value={c.arriveBy}
                      onChange={e => updateCondition(c.id, 'arriveBy', e.target.value)}
                      style={{ width: '100%', fontSize: 12, borderColor: c.arriveBy ? 'var(--accent)' : undefined }}
                    />

                    {/* 優先度 */}
                    <select
                      disabled={c.excluded}
                      value={c.priority}
                      onChange={e => updateCondition(c.id, 'priority', Number(e.target.value))}
                      style={{ width: '100%', fontSize: 12, borderColor: c.priority <= 2 ? PRIORITY_OPTS.find(p => p.value === c.priority)?.color : undefined }}
                    >
                      {PRIORITY_OPTS.map(p => (
                        <option key={p.value} value={p.value}>{p.icon} {p.label}</option>
                      ))}
                    </select>

                    {/* メモ */}
                    <input
                      type="text" disabled={c.excluded}
                      placeholder="体調・備考など"
                      value={c.note}
                      onChange={e => updateCondition(c.id, 'note', e.target.value)}
                      style={{ width: '100%', fontSize: 12 }}
                    />

                    {/* 除外トグル */}
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <button
                        onClick={() => updateCondition(c.id, 'excluded', !c.excluded)}
                        style={{
                          width: 32, height: 32, borderRadius: 8, cursor: 'pointer',
                          border: `1px solid ${c.excluded ? 'var(--border)' : '#fecaca'}`,
                          background: c.excluded ? '#f1f5f9' : '#fee2e2',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: c.excluded ? 'var(--text-muted)' : 'var(--red)', transition: 'all 0.15s',
                        }}
                        title={c.excluded ? '送迎に含める' : '今日は除外'}
                      >
                        {c.excluded ? <Plus size={14} /> : <Minus size={14} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: ルート確認 ── */}
      {step === 'result' && (
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          {/* 左：ルート順序リスト */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* サマリー */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
              {[
                { label: '送迎人数', value: `${optimizedStops.length}名`, icon: <Users size={16} color="#2e7df7" />, bg: '#e8f1ff' },
                { label: '推定所要時間', value: '約65分', icon: <Clock size={16} color="#22c55e" />, bg: '#dcfce7' },
                { label: '走行距離', value: '約14.2km', icon: <Navigation size={16} color="#f59e0b" />, bg: '#fef3c7' },
                { label: '担当車両', value: selectedVehicle.name.split('（')[0], icon: <Car size={16} color="#8b5cf6" />, bg: '#ede9fe' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--surface)', borderRadius: 10, boxShadow: 'var(--shadow)', padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{s.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* ルート順序 */}
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="card-title">最適化ルート順序</span>
                <span className="badge badge-green">最適化済み</span>
              </div>

              {/* 出発 */}
              <RouteStopRow
                icon={<Home size={14} />}
                label="出発地"
                name={BASE.name}
                address={BASE.address}
                time="13:30"
                isBase dotColor="#64748b"
              />

              {optimizedStops.map((stop, i) => {
                const pOpt = PRIORITY_OPTS.find(p => p.value === stop.priority)
                const cust = customers.find(c => c.id === stop.id)
                return (
                  <div key={stop.id}>
                    <RouteStopRow
                      num={i + 1}
                      name={stop.name}
                      address={stop.address}
                      time={stop.estimatedTime}
                      priority={pOpt}
                      note={stop.note}
                      arriveAfter={stop.arriveAfter}
                      arriveBy={stop.arriveBy}
                      dotColor="#2e7df7"
                      isLast={i === optimizedStops.length - 1}
                    />
                  </div>
                )
              })}

              {/* 帰着 */}
              <RouteStopRow
                icon={<Home size={14} />}
                label="帰着"
                name={BASE.name}
                address={BASE.address}
                time={addMinutes(optimizedStops[optimizedStops.length - 1]?.estimatedTime || '14:00', 15)}
                isBase dotColor="#64748b"
                isLast
              />
            </div>
          </div>

          {/* 右：地図 + アクション */}
          <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Google Maps プレビュー */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justify: 'space-between', alignItems: 'center' }}>
                <span className="card-title">Google Maps ナビ</span>
              </div>
              {/* 地図プレビュー（iframe embed） */}
              <div style={{ position: 'relative', height: 220, background: '#e8f4f8', overflow: 'hidden' }}>
                <iframe
                  title="map"
                  width="100%" height="100%"
                  style={{ border: 'none', opacity: 0.85 }}
                  loading="lazy"
                  src={`https://www.google.com/maps/embed/v1/directions?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU3Kuo&origin=${encodeURIComponent(BASE.address)}&destination=${encodeURIComponent(BASE.address)}&waypoints=${optimizedStops.map(s => encodeURIComponent(s.address)).join('|')}&mode=driving&language=ja`}
                />
                {/* オーバーレイ（APIキーがないので案内表示） */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
                }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'white', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Map size={24} color="#2e7df7" />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b', marginBottom: 4 }}>ルートが準備できました</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{optimizedStops.length}箇所 経由</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', padding: '0 16px' }}>
                    {[BASE.name, ...optimizedStops.slice(0,3).map(s => s.name)].map((name, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.7)', borderRadius: 6, padding: '4px 8px' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: i === 0 ? '#22c55e' : '#2e7df7', flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                      </div>
                    ))}
                    {optimizedStops.length > 3 && (
                      <div style={{ fontSize: 11, color: '#64748b', textAlign: 'center' }}>他 {optimizedStops.length - 3}箇所...</div>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ padding: '12px 16px' }}>
                <a
                  href={mapsUrl} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    width: '100%', padding: '11px', borderRadius: 8,
                    background: '#4285f4', color: 'white', textDecoration: 'none',
                    fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
                    boxShadow: '0 2px 8px rgba(66,133,244,0.35)',
                  }}
                >
                  <Map size={15} /> Google Maps でナビ開始
                  <ExternalLink size={12} />
                </a>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 6 }}>
                  ブラウザ or スマホのGoogle Mapsアプリで開きます
                </div>
              </div>
            </div>

            {/* 運行開始ボタン */}
            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 15, borderRadius: 10 }}
              onClick={startDriving}
            >
              <Play size={16} /> 運行を開始する
            </button>

            <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setStep('setup')}>
              <RotateCcw size={14} /> 条件を変更する
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: 運行中 ── */}
      {step === 'driving' && (
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          {/* 左：進捗リスト */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* プログレスバー */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>運行進捗</span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{doneCount} / {totalCount} 名完了</span>
              </div>
              <div style={{ height: 8, background: 'var(--border)', borderRadius: 999, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ width: `${progress}%`, height: '100%', background: 'var(--green)', borderRadius: 999, transition: 'width 0.5s' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                {[
                  { label: '完了', count: doneCount, color: 'var(--green)' },
                  { label: 'スキップ', count: optimizedStops.filter(s => stopStatuses[s.id] === STOP_STATUS.skipped).length, color: 'var(--amber)' },
                  { label: '残り', count: totalCount - doneCount - optimizedStops.filter(s => stopStatuses[s.id] === STOP_STATUS.skipped).length, color: 'var(--text-muted)' },
                ].map(s => (
                  <span key={s.label} style={{ color: s.color, fontWeight: 600 }}>{s.label}: {s.count}名</span>
                ))}
              </div>
            </div>

            {/* 停車リスト */}
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="card-title">停車リスト</span>
                {!showReoptConfirm ? (
                  <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setShowReoptConfirm(true)}>
                    <RefreshCw size={13} /> 残りを再最適化
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--amber)' }}>再最適化しますか？</span>
                    <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={handleReoptimize}>実行</button>
                    <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setShowReoptConfirm(false)}>キャンセル</button>
                  </div>
                )}
              </div>

              {/* 出発地 */}
              <DrivingStopRow name={BASE.name} time="13:30" status="done" isBase />

              {optimizedStops.map((stop, i) => {
                const status = stopStatuses[stop.id] || STOP_STATUS.waiting
                const isCurrent = i === currentStopIdx && status === STOP_STATUS.waiting
                return (
                  <DrivingStopRow
                    key={stop.id}
                    num={i + 1}
                    name={stop.name}
                    address={stop.address}
                    time={stop.estimatedTime}
                    status={status}
                    isCurrent={isCurrent}
                    note={stop.note}
                    priority={PRIORITY_OPTS.find(p => p.value === stop.priority)}
                    onDone={() => markDone(stop.id)}
                    onSkip={() => markSkipped(stop.id)}
                  />
                )
              })}

              <DrivingStopRow
                name={BASE.name} time="帰着予定"
                status={doneCount === totalCount ? 'done' : 'waiting'}
                isBase isLast
              />
            </div>
          </div>

          {/* 右：マップ + アクション */}
          <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div className="card-title">ナビゲーション</div>
              </div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px', borderRadius: 8, background: '#4285f4', color: 'white',
                  textDecoration: 'none', fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
                }}>
                  <Navigation size={15} /> Google Maps を開く <ExternalLink size={12} />
                </a>
                <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>次の目的地</div>
                  {optimizedStops[currentStopIdx] ? (
                    <>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{optimizedStops[currentStopIdx]?.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{optimizedStops[currentStopIdx]?.address}</div>
                      <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, marginTop: 4 }}>
                        到着予定: {optimizedStops[currentStopIdx]?.estimatedTime}
                      </div>
                    </>
                  ) : (
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--green)' }}>✓ 全停車地完了</div>
                  )}
                </div>
              </div>
            </div>

            {/* 緊急再ルーティング */}
            <div className="card" style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: 16 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <AlertTriangle size={15} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>途中変更の操作</div>
              </div>
              <div style={{ fontSize: 12, color: '#92400e', lineHeight: 1.7, marginBottom: 12 }}>
                「スキップ」すると残りの児童を除いた順序で再最適化できます。
                緊急の欠席は「残りを再最適化」で対応できます。
              </div>
              <button
                className="btn"
                style={{ width: '100%', justifyContent: 'center', background: '#f59e0b', color: 'white', fontSize: 12 }}
                onClick={() => setShowReoptConfirm(true)}
              >
                <RefreshCw size={13} /> 残りを今すぐ再最適化
              </button>
            </div>

            {doneCount === totalCount && (
              <div className="card" style={{ background: 'var(--green-light)', border: '1px solid #86efac', textAlign: 'center', padding: 20 }}>
                <CheckCircle2 size={32} color="var(--green)" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontWeight: 700, fontSize: 16, color: '#15803d' }}>送迎完了！</div>
                <div style={{ fontSize: 12, color: '#166534', marginTop: 4 }}>お疲れ様でした。全員の送迎が完了しました。</div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  )
}

// ── サブコンポーネント ────────────────────────

const labelStyle = { fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }

function RouteStopRow({ num, name, address, time, priority, note, arriveAfter, arriveBy, isBase, isLast, dotColor, icon, label }) {
  return (
    <div style={{ display: 'flex', gap: 0, borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
      {/* タイムライン */}
      <div style={{ width: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', flexShrink: 0 }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: dotColor, border: '2px solid white', boxShadow: `0 0 0 2px ${dotColor}`, flexShrink: 0, zIndex: 1 }} />
        {!isLast && <div style={{ width: 2, flex: 1, background: '#e2e8f0', marginTop: 4 }} />}
      </div>

      {/* コンテンツ */}
      <div style={{ flex: 1, padding: '10px 16px 10px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 3 }}>
          {isBase ? (
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{label || ''} {name}</span>
          ) : (
            <>
              <span style={{ background: '#f1f5f9', color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, flexShrink: 0, marginTop: 1 }}>#{num}</span>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{name}</span>
              {priority && (
                <span title={priority.label} style={{ fontSize: 14, flexShrink: 0 }}>{priority.icon}</span>
              )}
            </>
          )}
          <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: 13, color: 'var(--accent)', whiteSpace: 'nowrap', flexShrink: 0 }}>{time}</span>
        </div>
        {address && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{address}</div>}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {arriveAfter && <span style={{ fontSize: 11, background: '#e8f1ff', color: 'var(--accent)', borderRadius: 4, padding: '1px 6px' }}>{arriveAfter}以降</span>}
          {arriveBy   && <span style={{ fontSize: 11, background: '#fef3c7', color: '#b45309', borderRadius: 4, padding: '1px 6px' }}>{arriveBy}まで</span>}
          {note && <span style={{ fontSize: 11, color: '#64748b', background: '#f8fafc', borderRadius: 4, padding: '1px 6px' }}>📝 {note}</span>}
        </div>
      </div>
    </div>
  )
}

function DrivingStopRow({ num, name, address, time, status, isCurrent, isBase, isLast, note, priority, onDone, onSkip }) {
  const statusConfig = {
    done:       { icon: <CheckCircle2 size={18} color="var(--green)" />,  bg: '#dcfce7', border: '#86efac', label: '完了' },
    skipped:    { icon: <XCircle      size={18} color="var(--amber)" />,  bg: '#fef3c7', border: '#fcd34d', label: 'スキップ' },
    inProgress: { icon: <Circle       size={18} color="var(--accent)" />, bg: '#e8f1ff', border: '#93c5fd', label: '移動中' },
    waiting:    { icon: <Circle       size={18} color="#cbd5e1" />,        bg: 'white',   border: 'transparent', label: '' },
  }
  const sc = statusConfig[status] || statusConfig.waiting

  return (
    <div style={{
      display: 'flex', gap: 12, padding: '12px 18px', alignItems: 'flex-start',
      borderBottom: isLast ? 'none' : '1px solid var(--border)',
      background: isCurrent ? '#eff6ff' : sc.bg,
      borderLeft: isCurrent ? '3px solid var(--accent)' : '3px solid transparent',
      transition: 'background 0.2s',
    }}>
      <div style={{ marginTop: 2 }}>{sc.icon}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          {!isBase && num && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', background: '#f1f5f9', padding: '1px 5px', borderRadius: 3 }}>#{num}</span>}
          <span style={{ fontWeight: 600, fontSize: 13 }}>{name}</span>
          {isCurrent && <span style={{ fontSize: 10, background: 'var(--accent)', color: 'white', borderRadius: 999, padding: '1px 7px', animation: 'pulse 1.5s infinite' }}>現在地</span>}
          {status === 'done' && <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>✓ 完了</span>}
          {status === 'skipped' && <span style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 600 }}>スキップ</span>}
          <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{time}</span>
        </div>
        {address && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{address}</div>}
        {note && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>📝 {note}</div>}
      </div>

      {/* アクションボタン（待機中のみ） */}
      {!isBase && status === STOP_STATUS.waiting && (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            onClick={onDone}
            style={{ padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', background: 'var(--green)', color: 'white', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <CheckCircle2 size={12} /> 完了
          </button>
          <button
            onClick={onSkip}
            style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border)', cursor: 'pointer', background: 'white', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'inherit' }}
          >
            スキップ
          </button>
        </div>
      )}
    </div>
  )
}
