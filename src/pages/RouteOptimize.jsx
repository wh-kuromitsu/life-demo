// ルート最適化 - フラグシップ機能 v2
// 4ステップ:
//   STEP 1: 条件設定（日付・方向・制約・対象児童）
//   STEP 2: AI推奨（方面クラスタ + Pattern A/B 並列比較）
//   STEP 3: 配車組表で手動調整 ← NEW フラグシップ
//           - 送迎組.xlsx準拠のマトリクスUI
//           - ドラッグ&ドロップで車両間移動
//           - 制約違反リアルタイム警告
//           - 変更履歴（undo/redo）
//           - 方面区分フィルタ
//   STEP 4: 確定・ナビ連携
//
// 設計思想:
//   「AIが完璧な案を出すのではなく、AIが叩き台を作り、
//    現場が臨機応変に手組みで調整する」
//   現場担当者のVBA操作の『身体知』を活かせるUI。

import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Zap, Play, MapPin, Clock, AlertTriangle, Shield, Users, Car,
  RefreshCw, ChevronRight, CheckCircle2, X, Download, Map as MapIcon, Navigation,
  Sliders, FlaskConical, Route, Eye, Grid3x3, MousePointerClick,
  Undo2, Redo2, Save, Plus, Minus, Wand2, UserCheck, Compass,
  ArrowLeftRight, Trash2, AlertCircle, Info, BarChart3, GripVertical,
  History, Calendar, CalendarClock, Copy,
  Building2, Home, Wrench, Settings,
} from 'lucide-react'
import KasugaiMap from '../components/KasugaiMap'
import UnassignedPanel from '../components/UnassignedPanel'
import { CHILDREN, CHILD_BY_ID } from '../data/childrenData'
import {
  VEHICLES, VEHICLE_BY_ID,
  DAY_STATUSES, DAY_STATUS_BY_ID, INITIAL_VEHICLE_DAY_STATUS, canUseVehicle,
} from '../data/vehiclesData'
import {
  SIMULATION_A, SIMULATION_B, AI_ASSIGNMENT_A, AI_ASSIGNMENT_B,
  REGIONS, TIME_BANDS, classifyRegion, classifyTimeBand, BASE,
  PAST_ASSIGNMENTS, findPastAssignmentsBy, getDayOfWeek, DOW_LABELS,
} from '../data/routesData'
import {
  FACILITY_BY_ID, BUILDINGS, BUILDING_BY_ID,
  FACILITIES_BY_BUILDING, buildingOf,
} from '../data/facilitiesData'
import { LOC_BY_ID } from '../data/schoolsData'

const TODAY = new Date()
const isoDate = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

const CONSTRAINTS = [
  { id: 'supportTime', label: '支援時間1h35m以上', req: true, desc: '補助金要件のMUST制約' },
  { id: 'endTime',     label: '18:30までに職員退勤', req: true, desc: '職員退勤時刻' },
  { id: 'returnTime',  label: '19:30までに帰着',     req: true, desc: '代表推奨条件' },
  { id: 'noHighway',   label: '国道をまたがない',     req: false, desc: '渋滞回避' },
  { id: 'ngPair',      label: '同乗NGペア分離',        req: true, desc: '児童間の相性制約' },
  { id: 'crossFac',    label: '施設横断送迎',          req: false, desc: '法人内の合同送迎' },
]

export default function RouteOptimize({ facilityId, setPage }) {
  const [step, setStep] = useState(1)
  const [date, setDate] = useState(isoDate(TODAY))
  const [direction, setDirection] = useState('pickup')
  const [activeConstraints, setActiveConstraints] = useState(['supportTime','endTime','returnTime','noHighway','ngPair'])
  const [excludedIds, setExcludedIds] = useState(['c25'])

  // STEP 2 state
  const [calculating, setCalculating] = useState(false)
  const [selectedPattern, setSelectedPattern] = useState(null)
  const [regionFilter, setRegionFilter] = useState('all')

  // STEP 3 state — 配車組表（手動調整）
  const [assignments, setAssignments] = useState(null)  // AI推奨の初期コピー
  const [history, setHistory] = useState([])            // 変更履歴
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [highlightChildId, setHighlightChildId] = useState(null)
  const [selectedTripKey, setSelectedTripKey] = useState(null)  // "facilityIdx:tripIdx"
  const [draggedChild, setDraggedChild] = useState(null)
  const [view, setView] = useState('matrix')  // 'matrix' | 'map' | 'split'

  // 過去送迎組参照モーダル
  const [pastModalOpen, setPastModalOpen] = useState(false)
  const [appliedSource, setAppliedSource] = useState(null)   // 'ai-A' | 'ai-B' | 'past:<id>'

  // STEP 3 ビュー設定
  const [groupBy, setGroupBy] = useState('building')   // 'facility' | 'building'

  // 車両の当日ステータス（ページ内編集）
  const [vehicleStatus, setVehicleStatus] = useState(() =>
    JSON.parse(JSON.stringify(INITIAL_VEHICLE_DAY_STATUS))
  )
  const [vehicleStatusModalOpen, setVehicleStatusModalOpen] = useState(false)

  // 児童の当日ステータス（欠席・早退・メモなど）
  // { [childId]: { status: 'present'|'absent'|'leave_early'|'late', note: '' } }
  const [childDayStatus, setChildDayStatus] = useState({})
  const [childEditModal, setChildEditModal] = useState(null) // { childId } or null
  // 車両の当日ステータスを1台だけピンポイント編集するモーダル
  const [vehicleQuickEdit, setVehicleQuickEdit] = useState(null) // { vehicleId } or null

  const transportChildren = useMemo(() =>
    CHILDREN.filter(c =>
      c.transport && c.status === 'active' &&
      !excludedIds.includes(c.id) &&
      (facilityId === 'all' || c.facility === facilityId)
    ),
  [facilityId, excludedIds])

  const toggleConstraint = (id) => setActiveConstraints(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  const toggleExclude = (id) => setExcludedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const runAI = () => {
    setCalculating(true)
    setTimeout(() => { setCalculating(false); setStep(2) }, 1400)
  }

  const adoptPattern = (pat) => {
    const src = pat === 'A' ? AI_ASSIGNMENT_A : AI_ASSIGNMENT_B
    // ディープコピーして編集用に
    const initialAssign = JSON.parse(JSON.stringify(src))
    setSelectedPattern(pat)
    setAssignments(initialAssign)
    setAppliedSource(`ai-${pat}`)
    setHistory([initialAssign])
    setHistoryIndex(0)
    setStep(3)
  }

  // ─── 過去送迎組を初期案として採用 ───
  // AIを回さず、過去の同一曜日の確定済み送迎組をそのまま Step 3 の起点にする。
  // 現在の「送迎対象から除外」リストも尊重し、除外児童は自動的に外す。
  const adoptPast = (pastId) => {
    const past = PAST_ASSIGNMENTS.find(p => p.id === pastId)
    if (!past) return
    // 過去データをディープコピーし、内部形式へ整形
    const initial = JSON.parse(JSON.stringify({
      id: `from_past_${past.id}`,
      label: `過去参照 ${past.label}`,
      algo: '過去の同一曜日送迎組を複製',
      totalTime: past.stats?.totalTime ?? 0,
      totalDistance: past.stats?.totalDistance ?? 0,
      unassigned: 0,
      constraints: { timeWindow: true, capacity: true, ng: true, crossFacility: true },
      facilityBlocks: past.facilityBlocks,
      unassignedChildIds: past.unassignedChildIds || [],
    }))

    // 現在の除外対象児童を全便から外して未配置へ送る（安全策）
    if (excludedIds.length > 0) {
      initial.facilityBlocks.forEach(block => {
        block.trips.forEach(trip => {
          trip.childIds = trip.childIds.filter(cid => !excludedIds.includes(cid))
        })
      })
      initial.unassignedChildIds = (initial.unassignedChildIds || [])
        .filter(cid => !excludedIds.includes(cid))
    }

    setSelectedPattern(null)
    setAssignments(initial)
    setAppliedSource(`past:${past.id}`)
    setHistory([initial])
    setHistoryIndex(0)
    setPastModalOpen(false)
    setStep(3)
  }

  // ─── 配車組表の編集操作 ───
  const commit = useCallback((newAssign, action) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push({ ...newAssign, _action: action })
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    setAssignments(newAssign)
  }, [history, historyIndex])

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setAssignments(history[historyIndex - 1])
    }
  }
  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setAssignments(history[historyIndex + 1])
    }
  }

  const moveChild = (childId, fromTripKey, toTripKey) => {
    if (!assignments || fromTripKey === toTripKey) return
    const next = JSON.parse(JSON.stringify(assignments))
    // 元の便から削除
    if (fromTripKey !== 'unassigned') {
      const [fb, ft] = fromTripKey.split(':').map(Number)
      next.facilityBlocks[fb].trips[ft].childIds =
        next.facilityBlocks[fb].trips[ft].childIds.filter(id => id !== childId)
    } else {
      next.unassignedChildIds = (next.unassignedChildIds || []).filter(id => id !== childId)
    }
    // 先の便に追加
    if (toTripKey !== 'unassigned') {
      const [tb, tt] = toTripKey.split(':').map(Number)
      if (!next.facilityBlocks[tb].trips[tt].childIds.includes(childId)) {
        next.facilityBlocks[tb].trips[tt].childIds.push(childId)
      }
    } else {
      next.unassignedChildIds = [...(next.unassignedChildIds || []), childId]
    }
    const child = CHILD_BY_ID[childId]
    commit(next, `${child?.name} を移動`)
  }

  const addTrip = (blockIdx) => {
    const next = JSON.parse(JSON.stringify(assignments))
    const block = next.facilityBlocks[blockIdx]
    const tripNo = Math.max(0, ...block.trips.map(t => t.tripNo)) + 1
    block.trips.push({
      tripNo, vehicle: VEHICLES[0].id, teacher: block.leadTeacher,
      childIds: [], region: 'central', estDepart: '14:00', estArrive: '15:00',
    })
    commit(next, `${FACILITY_BY_ID[block.facility]?.short} に${tripNo}便目を追加`)
  }

  const removeTrip = (blockIdx, tripIdx) => {
    const next = JSON.parse(JSON.stringify(assignments))
    const removed = next.facilityBlocks[blockIdx].trips[tripIdx]
    if (removed.childIds.length > 0) {
      next.unassignedChildIds = [...(next.unassignedChildIds || []), ...removed.childIds]
    }
    next.facilityBlocks[blockIdx].trips.splice(tripIdx, 1)
    commit(next, `便を削除（児童${removed.childIds.length}名を未配置に戻す）`)
  }

  const changeVehicle = (blockIdx, tripIdx, vehicleId) => {
    const next = JSON.parse(JSON.stringify(assignments))
    const trip = next.facilityBlocks[blockIdx].trips[tripIdx]
    const oldV = VEHICLE_BY_ID[trip.vehicle]?.name
    const newV = VEHICLE_BY_ID[vehicleId]?.name
    trip.vehicle = vehicleId
    commit(next, `車両変更: ${oldV} → ${newV}`)
  }

  // 制約違反のチェック
  const violations = useMemo(() => computeViolations(assignments), [assignments])

  return (
    <div>
      <PageHead step={step} setStep={setStep} onOpenPastModal={() => setPastModalOpen(true)} />

      {step === 1 && (
        <Step1
          date={date} setDate={setDate}
          direction={direction} setDirection={setDirection}
          activeConstraints={activeConstraints} toggleConstraint={toggleConstraint}
          excludedIds={excludedIds} toggleExclude={toggleExclude}
          transportChildren={transportChildren}
          calculating={calculating} runAI={runAI}
          onOpenPastModal={() => setPastModalOpen(true)}
        />
      )}

      {step === 2 && (
        <Step2
          regionFilter={regionFilter} setRegionFilter={setRegionFilter}
          transportChildren={transportChildren}
          adoptPattern={adoptPattern}
          setStep={setStep}
          onOpenPastModal={() => setPastModalOpen(true)}
          date={date}
          direction={direction}
        />
      )}

      {step === 3 && assignments && (
        <Step3
          assignments={assignments}
          violations={violations}
          view={view} setView={setView}
          selectedTripKey={selectedTripKey} setSelectedTripKey={setSelectedTripKey}
          highlightChildId={highlightChildId} setHighlightChildId={setHighlightChildId}
          draggedChild={draggedChild} setDraggedChild={setDraggedChild}
          moveChild={moveChild}
          addTrip={addTrip} removeTrip={removeTrip}
          changeVehicle={changeVehicle}
          history={history} historyIndex={historyIndex}
          undo={undo} redo={redo}
          regionFilter={regionFilter} setRegionFilter={setRegionFilter}
          setStep={setStep}
          appliedSource={appliedSource}
          onOpenPastModal={() => setPastModalOpen(true)}
          groupBy={groupBy} setGroupBy={setGroupBy}
          vehicleStatus={vehicleStatus} setVehicleStatus={setVehicleStatus}
          vehicleStatusModalOpen={vehicleStatusModalOpen}
          setVehicleStatusModalOpen={setVehicleStatusModalOpen}
          childDayStatus={childDayStatus} setChildDayStatus={setChildDayStatus}
          childEditModal={childEditModal} setChildEditModal={setChildEditModal}
          vehicleQuickEdit={vehicleQuickEdit} setVehicleQuickEdit={setVehicleQuickEdit}
        />
      )}

      {step === 4 && assignments && (
        <Step4 assignments={assignments} date={date} direction={direction} setStep={setStep} />
      )}

      {/* 過去送迎組 参照モーダル */}
      {pastModalOpen && (
        <PastAssignmentsModal
          date={date}
          direction={direction}
          onClose={() => setPastModalOpen(false)}
          onAdopt={adoptPast}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PAGE HEAD
// ═══════════════════════════════════════════════════════════════
function PageHead({ step, setStep, onOpenPastModal }) {
  const steps = [
    { n: 1, label: '条件設定', desc: '制約・対象児童' },
    { n: 2, label: 'AI推奨',    desc: 'Pattern A / B' },
    { n: 3, label: '配車組表',  desc: '手動調整' },
    { n: 4, label: '確定・配布',  desc: 'ナビ連携' },
  ]
  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Core Operation · Flagship</div>
          <h1 className="page-title">送迎ルート最適化</h1>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button className="btn btn-ghost btn-sm" onClick={onOpenPastModal}>
            <History size={12} /> 過去の送迎組を参照
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
        {steps.map((s, i, arr) => {
          const active = step === s.n
          const done = step > s.n
          const clickable = done || active
          return (
            <button
              key={s.n}
              onClick={() => clickable && setStep(s.n)}
              style={{
                flex: 1, padding: '14px 20px', textAlign: 'left',
                background: active ? 'var(--surface)' : done ? 'var(--sage-soft)' : 'var(--bg-deep)',
                border: active ? '1px solid var(--accent)' : done ? '1px solid transparent' : '1px solid var(--line)',
                borderRadius: 'var(--radius)',
                cursor: clickable ? 'pointer' : 'default',
                opacity: clickable ? 1 : 0.55,
                position: 'relative',
                display: 'flex', alignItems: 'center', gap: 12,
                transition: 'all 0.15s',
              }}
            >
              <div style={{
                width: 30, height: 30, borderRadius: 6,
                background: done ? 'var(--sage)' : active ? 'var(--accent)' : 'var(--line-strong)',
                color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
              }}>
                {done ? <CheckCircle2 size={15} /> : s.n}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: active ? 'var(--accent)' : done ? 'var(--sage)' : 'var(--ink)' }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 1 }}>{s.desc}</div>
              </div>
              {i < arr.length - 1 && (
                <ChevronRight size={14} color="var(--ink-faint)" style={{ position: 'absolute', right: -12, top: '50%', transform: 'translateY(-50%)', background: 'var(--bg)', padding: 3, borderRadius: '50%', zIndex: 1 }} />
              )}
            </button>
          )
        })}
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// STEP 1: Conditions
// ═══════════════════════════════════════════════════════════════
function Step1({
  date, setDate, direction, setDirection,
  activeConstraints, toggleConstraint,
  excludedIds, toggleExclude,
  transportChildren, calculating, runAI,
  onOpenPastModal,
}) {
  // 方面ごとの分布
  const distribution = useMemo(() => {
    const dist = { east: 0, central: 0, west: 0, unknown: 0 }
    transportChildren.forEach(c => {
      const r = classifyRegion(c.homeX)
      dist[r] = (dist[r] || 0) + 1
    })
    return dist
  }, [transportChildren])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Basic */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">基本設定</div>
            <span className="eyebrow">STEP 1 / 4</span>
          </div>
          <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <Field label="対象日">
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%' }} />
            </Field>
            <Field label="送迎方向">
              <div className="seg" style={{ width: '100%' }}>
                <button className={direction === 'pickup' ? 'active' : ''} onClick={() => setDirection('pickup')} style={{ flex: 1 }}>迎え</button>
                <button className={direction === 'dropoff' ? 'active' : ''} onClick={() => setDirection('dropoff')} style={{ flex: 1 }}>送り</button>
              </div>
            </Field>
          </div>
        </div>

        {/* 方面分布プレビュー */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">方面クラスタリング プレビュー</div>
              <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 2 }}>
                児童の自宅・学校の緯度経度から3方面×時間帯に自動分類
              </div>
            </div>
            <Compass size={14} color="var(--ink-muted)" />
          </div>
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {REGIONS.map(r => (
              <div key={r.id} style={{
                padding: 14, borderRadius: 8,
                background: r.color + '15',
                border: `1px solid ${r.color}40`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: r.color }} />
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: r.color }}>
                    {r.name}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--ink-muted)', marginBottom: 8, lineHeight: 1.5 }}>
                  {r.desc}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span className="num" style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: r.color }}>
                    {distribution[r.id] || 0}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--ink-muted)' }}>名</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Constraints */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">送迎制約</div>
              <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 2 }}>必須制約は外せません（補助金要件）</div>
            </div>
            <Shield size={14} color="var(--ink-muted)" />
          </div>
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {CONSTRAINTS.map(c => {
              const on = activeConstraints.includes(c.id)
              const lock = c.req
              return (
                <button
                  key={c.id}
                  onClick={() => !lock && toggleConstraint(c.id)}
                  style={{
                    padding: '12px 14px', borderRadius: 8, textAlign: 'left',
                    border: on ? `1.5px solid ${lock ? 'var(--accent)' : 'var(--sage)'}` : '1px solid var(--line)',
                    background: on ? (lock ? 'var(--accent-faint)' : 'var(--sage-soft)') : 'var(--surface)',
                    cursor: lock ? 'default' : 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <div style={{
                      width: 14, height: 14, borderRadius: 3,
                      background: on ? (lock ? 'var(--accent)' : 'var(--sage)') : 'transparent',
                      border: on ? 'none' : '1.5px solid var(--line-strong)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {on && <CheckCircle2 size={10} color="#fff" strokeWidth={3} />}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{c.label}</span>
                    {lock && (
                      <span className="pill pill-accent" style={{ fontSize: 8, padding: '0 5px', marginLeft: 'auto' }}>MUST</span>
                    )}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--ink-muted)', paddingLeft: 22 }}>{c.desc}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Children list */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">送迎対象児童</div>
              <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 2 }}>
                <span className="num" style={{ color: 'var(--ink)', fontWeight: 700 }}>{transportChildren.length}</span> 名が対象
              </div>
            </div>
            <button className="btn btn-ghost btn-sm"><Eye size={11} /> 除外一覧</button>
          </div>
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 30 }}></th>
                  <th>児童</th>
                  <th>所属</th>
                  <th>方面</th>
                  <th>場所</th>
                  <th>学校時刻</th>
                  <th>特記</th>
                </tr>
              </thead>
              <tbody>
                {transportChildren.map(c => {
                  const fac = FACILITY_BY_ID[c.facility]
                  const loc = LOC_BY_ID[c.pickupLoc] || LOC_BY_ID[c.school]
                  const excluded = excludedIds.includes(c.id)
                  const region = REGIONS.find(r => r.id === classifyRegion(c.homeX))
                  return (
                    <tr key={c.id} className="clickable" style={{ opacity: excluded ? 0.5 : 1 }}>
                      <td>
                        <input type="checkbox" checked={!excluded} onChange={() => toggleExclude(c.id)} />
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>{c.grade} · {c.gender}</div>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ width: 6, height: 6, borderRadius: 1.5, background: fac?.color }} />
                          <span style={{ fontSize: 11 }}>{fac?.short}</span>
                        </span>
                      </td>
                      <td>
                        {region && (
                          <span className="pill" style={{ fontSize: 9, background: region.color + '20', color: region.color, border: 'none' }}>
                            {region.name}
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: 11 }}>{loc?.name || '—'}</td>
                      <td className="num" style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{loc?.time || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                          {c.tag && <span className="pill pill-accent" style={{ fontSize: 9 }}>{c.tag}</span>}
                          {c.safetyReq && <span className="pill pill-amber" style={{ fontSize: 9 }}>要注意</span>}
                          {c.ngWith?.length > 0 && <span className="pill pill-danger" style={{ fontSize: 9 }}>同乗NG</span>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 20, alignSelf: 'flex-start' }}>
        <div className="panel" style={{ background: 'var(--ink)', color: '#fff', borderColor: 'var(--ink)' }}>
          <div style={{ padding: 20 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 14 }}>
              シミュレーションサマリー
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
              <Stat label="送迎対象" value={transportChildren.length} suf="名" />
              <Stat label="利用可能車両" value={VEHICLES.length} suf="台" />
              <Stat label="定員合計" value={VEHICLES.reduce((s, v) => s + v.capacity, 0)} suf="名" />
              <Stat label="適用制約" value={activeConstraints.length} suf={`/${CONSTRAINTS.length}`} />
            </div>
            <button
              onClick={runAI}
              disabled={calculating}
              className="btn btn-primary"
              style={{ width: '100%', padding: '13px', fontSize: 14, background: calculating ? 'var(--ink-muted)' : 'var(--accent)', justifyContent: 'center' }}
            >
              {calculating ? (
                <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> AI実行中...</>
              ) : (
                <><dev size={15} /> AIで初期案を作成</>
              )}
            </button>
            {calculating && (
              <div style={{ marginTop: 14, fontSize: 11, color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-mono)', lineHeight: 1.7 }}>
              </div>
            )}

            {/* or 区切り */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              margin: '16px 0 14px',
              fontSize: 10, fontFamily: 'var(--font-display)', fontWeight: 700,
              letterSpacing: '0.16em', color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase',
            }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.12)' }} />
              または
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.12)' }} />
            </div>

            {/* 過去送迎組を参照 */}
            <button
              onClick={onOpenPastModal}
              disabled={calculating}
              className="btn"
              style={{
                width: '100%', padding: '12px', fontSize: 13, justifyContent: 'center',
                background: 'rgba(255,255,255,0.06)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.18)',
                fontWeight: 600,
              }}
            >
              <History size={14} /> 過去の同一曜日の送迎組を参照
            </button>
            <div style={{
              marginTop: 8, fontSize: 10.5, lineHeight: 1.6,
              color: 'rgba(255,255,255,0.55)',
              textAlign: 'center',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.75)' }}>
                {date ? `${date.slice(5).replace('-','/')}（${DOW_LABELS[getDayOfWeek(date)]}）` : ''}
              </span>
              {' '}と同じ曜日の過去の組み方を起点にできます
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// STEP 2: AI Recommendation (Pattern A/B)
// ═══════════════════════════════════════════════════════════════
function Step2({ regionFilter, setRegionFilter, transportChildren, adoptPattern, setStep, onOpenPastModal, date, direction }) {
  const [mapPattern, setMapPattern] = useState('A')
  const currentAI = mapPattern === 'A' ? AI_ASSIGNMENT_A : AI_ASSIGNMENT_B
  const currentSim = mapPattern === 'A' ? SIMULATION_A : SIMULATION_B

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Pattern 比較 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <PatternCompareCard
            ai={AI_ASSIGNMENT_A} recommended
            active={mapPattern === 'A'}
            onPreview={() => setMapPattern('A')}
            onAdopt={() => adoptPattern('A')}
          />
          <PatternCompareCard
            ai={AI_ASSIGNMENT_B}
            active={mapPattern === 'B'}
            onPreview={() => setMapPattern('B')}
            onAdopt={() => adoptPattern('B')}
          />
        </div>

        {/* 方面別統計 */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">方面別クラスタリング結果</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="eyebrow">表示中:</span>
              <div className="seg" style={{ fontSize: 11 }}>
                <button className={mapPattern === 'A' ? 'active' : ''} onClick={() => setMapPattern('A')}>
                  Pattern A
                </button>
                <button className={mapPattern === 'B' ? 'active' : ''} onClick={() => setMapPattern('B')}>
                  Pattern B
                </button>
              </div>
            </div>
          </div>
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {REGIONS.map(r => {
              const stat = currentAI.regionStats[r.id]
              const otherStat = (mapPattern === 'A' ? AI_ASSIGNMENT_B : AI_ASSIGNMENT_A).regionStats[r.id]
              const diffCount = (stat?.count || 0) - (otherStat?.count || 0)
              const diffDist = ((stat?.distance || 0) - (otherStat?.distance || 0)).toFixed(1)
              return (
                <div key={r.id} style={{
                  padding: 14, borderRadius: 8,
                  background: r.color + '10', border: `1.5px solid ${r.color}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Compass size={12} color={r.color} />
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: r.color }}>{r.name}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 9, color: 'var(--ink-muted)' }}>児童</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                        <span className="num" style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>{stat?.count || 0}</span>
                        {diffCount !== 0 && (
                          <span style={{ fontSize: 9.5, color: diffCount > 0 ? 'var(--sage)' : 'var(--amber)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                            {diffCount > 0 ? '+' : ''}{diffCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: 'var(--ink-muted)' }}>総距離</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                        <span className="num" style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>
                          {stat?.distance || 0}<span style={{ fontSize: 11, fontWeight: 500 }}>km</span>
                        </span>
                        {parseFloat(diffDist) !== 0 && (
                          <span style={{ fontSize: 9.5, color: parseFloat(diffDist) < 0 ? 'var(--sage)' : 'var(--amber)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                            {parseFloat(diffDist) > 0 ? '+' : ''}{diffDist}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--ink-muted)', marginTop: 4 }}>
                    車両: {stat?.vehicles.map(vid => VEHICLE_BY_ID[vid]?.name).join(' / ') || '—'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 地図プレビュー (Pattern切替可能) */}
        <div className="panel" style={{ padding: 0 }}>
          <div className="panel-header">
            <div>
              <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                地図プレビュー
                <span className="pill" style={{
                  fontSize: 10, padding: '2px 8px',
                  background: mapPattern === 'A' ? 'var(--accent)' : 'var(--amber)',
                  color: '#fff', border: 'none', fontWeight: 700,
                }}>
                  Pattern {mapPattern}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 2 }}>
                {mapPattern === 'A'
                  ? 'OR-Tools VRPによる厳密最適化。国道制約・同乗NGすべて充足'
                  : 'K-Means+最近傍法の高速近似。未配置2名あり、手動調整の起点向き'}
              </div>
            </div>
            <div className="seg" style={{ fontSize: 11 }}>
              <button className={mapPattern === 'A' ? 'active' : ''} onClick={() => setMapPattern('A')}>
                Pattern A
              </button>
              <button className={mapPattern === 'B' ? 'active' : ''} onClick={() => setMapPattern('B')}>
                Pattern B
              </button>
            </div>
          </div>
          {/* 比較バー */}
          <div style={{
            padding: '10px 16px',
            background: 'var(--surface-soft)',
            borderBottom: '1px solid var(--line)',
            display: 'flex', gap: 20, fontSize: 11,
          }}>
            <MetricDiff label="総所要" valA={AI_ASSIGNMENT_A.totalTime} valB={AI_ASSIGNMENT_B.totalTime} suf="分" activePattern={mapPattern} lowerBetter />
            <MetricDiff label="総距離" valA={AI_ASSIGNMENT_A.totalDistance} valB={AI_ASSIGNMENT_B.totalDistance} suf="km" activePattern={mapPattern} lowerBetter />
            <MetricDiff label="未配置" valA={AI_ASSIGNMENT_A.unassigned} valB={AI_ASSIGNMENT_B.unassigned} suf="名" activePattern={mapPattern} lowerBetter />
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink-muted)', fontSize: 10 }}>
              <Info size={11} />
              地図でもタイルをドラッグ/ズーム可
            </div>
          </div>
          <div style={{ height: 440 }}>
            <KasugaiMap key={mapPattern} routes={currentSim.routes} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 20, alignSelf: 'flex-start' }}>
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">AIの提案内容</div>
          </div>
          <div style={{ padding: 16, fontSize: 11.5, color: 'var(--ink-soft)', lineHeight: 1.75 }}>
            <p style={{ marginBottom: 10, padding: 10, background: mapPattern === 'A' ? 'var(--accent-faint)' : 'transparent', borderRadius: 6, borderLeft: mapPattern === 'A' ? '3px solid var(--accent)' : '3px solid transparent', margin: mapPattern === 'A' ? '0 -4px 10px' : undefined }}>
              <b style={{ color: 'var(--ink)' }}>Pattern A</b> は OR-Tools VRPで<b>全制約を同時充足</b>する厳密解。
              距離14.2kmで未配置ゼロ。
            </p>
            <p style={{ marginBottom: 10, padding: 10, background: mapPattern === 'B' ? 'var(--amber-soft)' : 'transparent', borderRadius: 6, borderLeft: mapPattern === 'B' ? '3px solid var(--amber)' : '3px solid transparent', margin: mapPattern === 'B' ? '0 -4px 10px' : undefined }}>
              <b style={{ color: 'var(--ink)' }}>Pattern B</b> は K-Means+最近傍法による<b>高速近似解</b>。
              手動調整の起点として使いやすい。
            </p>
            <div style={{ marginTop: 14, padding: 10, background: 'var(--sage-soft)', borderRadius: 6, borderLeft: '3px solid var(--sage)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sage)', marginBottom: 4 }}>
                <MousePointerClick size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                採用後、配車組表で調整可能
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--ink-soft)' }}>
                児童のドラッグ&ドロップ、便の追加・削除、車両変更が直感的に行えます。
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => setStep(1)}
          className="btn btn-ghost"
          style={{ width: '100%', padding: 10, justifyContent: 'center' }}
        >
          条件を修正して再実行
        </button>

        {/* 過去送迎組の参照ショートカット */}
        <div className="surface" style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <History size={13} color="var(--ink-soft)" />
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              過去の組み方から起こす
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-muted)', lineHeight: 1.6, marginBottom: 10 }}>
            {date ? `${date.slice(5).replace('-','/')}（${DOW_LABELS[getDayOfWeek(date)]}曜）` : ''} と同一曜日の過去の確定送迎組を起点にすることもできます。
          </div>
          <button
            onClick={onOpenPastModal}
            className="btn btn-solid-ink"
            style={{ width: '100%', padding: 10, justifyContent: 'center', fontSize: 12 }}
          >
            <History size={13} /> 過去の同一曜日の送迎組を参照
          </button>
        </div>
      </div>
    </div>
  )
}

function MetricDiff({ label, valA, valB, suf, activePattern, lowerBetter }) {
  const active = activePattern === 'A' ? valA : valB
  const other  = activePattern === 'A' ? valB : valA
  const diff = (active - other).toFixed(label === '総距離' ? 1 : 0)
  const better = lowerBetter ? parseFloat(diff) < 0 : parseFloat(diff) > 0
  const worse  = lowerBetter ? parseFloat(diff) > 0 : parseFloat(diff) < 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 9, color: 'var(--ink-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
        <span className="num" style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>
          {active}<span style={{ fontSize: 10, fontWeight: 500, color: 'var(--ink-muted)', marginLeft: 1 }}>{suf}</span>
        </span>
        {parseFloat(diff) !== 0 && (
          <span style={{
            fontSize: 9.5, fontFamily: 'var(--font-mono)', fontWeight: 600,
            color: better ? 'var(--sage)' : worse ? 'var(--amber)' : 'var(--ink-muted)',
          }}>
            {parseFloat(diff) > 0 ? '+' : ''}{diff}
          </span>
        )}
      </div>
    </div>
  )
}

function PatternCompareCard({ ai, recommended, active, onPreview, onAdopt }) {
  return (
    <div
      className="panel"
      style={{
        padding: 0, position: 'relative',
        border: active ? '2px solid var(--accent)' : recommended ? '1.5px solid var(--accent)' : '1px solid var(--line)',
        transition: 'all 0.15s',
      }}
    >
      {recommended && (
        <div style={{
          position: 'absolute', top: 10, right: 10, zIndex: 2,
          background: 'var(--sage)', color: '#fff',
          fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
          padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase',
        }}>推奨</div>
      )}
      {active && (
        <div style={{
          position: 'absolute', top: 10, left: 10, zIndex: 2,
          background: 'var(--accent)', color: '#fff',
          fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
          padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', gap: 3,
        }}>
          <Eye size={9} /> 地図表示中
        </div>
      )}
      <div style={{ padding: 20, paddingTop: active ? 32 : 20 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 3 }}>
          <span className="display" style={{ fontSize: 22, color: active ? 'var(--accent)' : recommended ? 'var(--accent)' : 'var(--ink)' }}>{ai.label}</span>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-muted)', marginBottom: 18 }}>
          {ai.algo}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
          <MiniStat label="総所要" value={ai.totalTime} suf="分" />
          <MiniStat label="総距離" value={ai.totalDistance} suf="km" />
          <MiniStat label="未配置" value={ai.unassigned} suf="名" warn={ai.unassigned > 0} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
          {Object.entries(ai.constraints).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5 }}>
              {v ? <CheckCircle2 size={11} color="var(--sage)" /> : <X size={11} color="var(--amber)" />}
              <span style={{ color: v ? 'var(--ink-soft)' : 'var(--amber)' }}>{constraintLabel(k)}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={onPreview}
            className="btn btn-ghost"
            style={{
              flex: 1, padding: 10, justifyContent: 'center', fontSize: 11.5,
              background: active ? 'var(--accent-faint)' : 'var(--surface)',
              color: active ? 'var(--accent)' : 'var(--ink)',
              borderColor: active ? 'var(--accent)' : 'var(--line)',
              fontWeight: active ? 700 : 500,
            }}
          >
            <MapIcon size={12} /> {active ? '地図表示中' : '地図で見る'}
          </button>
          <button
            onClick={onAdopt}
            className="btn"
            style={{
              flex: 1, padding: 10, justifyContent: 'center', fontSize: 11.5,
              background: recommended ? 'var(--accent)' : 'var(--ink)', color: '#fff',
            }}
          >
            採用 <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

function constraintLabel(key) {
  const m = { timeWindow: '時間枠', capacity: '定員', ng: '同乗NG', crossFacility: '施設横断' }
  return m[key] || key
}

// ═══════════════════════════════════════════════════════════════
// ErrorBoundary — Step3 レンダリング時のクラッシュをトラップ
// ═══════════════════════════════════════════════════════════════
import { Component as ReactComponent } from 'react'
class Step3ErrorBoundary extends ReactComponent {
  constructor(props) {
    super(props)
    this.state = { error: null, info: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[Step3ErrorBoundary]', error, info)
    this.setState({ info })
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: 20,
          border: '2px solid var(--danger)',
          background: 'var(--danger-soft)',
          borderRadius: 12,
          margin: 20,
          fontFamily: 'var(--font-body)',
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--danger)', marginBottom: 8 }}>
            ⚠ 配車組表の描画でエラーが発生しました
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink)', marginBottom: 10 }}>
            <b>{this.state.error?.name}:</b> {this.state.error?.message}
          </div>
          {this.state.info?.componentStack && (
            <pre style={{
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              background: 'var(--surface)',
              padding: 10,
              borderRadius: 6,
              overflowX: 'auto',
              maxHeight: 300,
              whiteSpace: 'pre-wrap',
            }}>
              {this.state.info.componentStack}
            </pre>
          )}
          <button
            onClick={() => this.setState({ error: null, info: null })}
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 10 }}
          >
            再レンダリング
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── ツールバーのラベル付きグループ ───
function ToolbarGroup({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        fontSize: 10, fontWeight: 700,
        color: 'var(--ink-muted)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontFamily: 'var(--font-display)',
      }}>
        {label}
      </span>
      {children}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// STEP 3: 配車組表 (フラグシップ)
// ═══════════════════════════════════════════════════════════════
function Step3(props) {
  return (
    <Step3ErrorBoundary>
      <Step3Inner {...props} />
    </Step3ErrorBoundary>
  )
}

function Step3Inner({
  assignments, violations, view, setView,
  selectedTripKey, setSelectedTripKey,
  highlightChildId, setHighlightChildId,
  draggedChild, setDraggedChild,
  moveChild, addTrip, removeTrip, changeVehicle,
  history, historyIndex, undo, redo,
  regionFilter, setRegionFilter,
  setStep,
  appliedSource, onOpenPastModal,
  groupBy, setGroupBy,
  vehicleStatus, setVehicleStatus,
  vehicleStatusModalOpen, setVehicleStatusModalOpen,
  childDayStatus, setChildDayStatus,
  childEditModal, setChildEditModal,
  vehicleQuickEdit, setVehicleQuickEdit,
}) {
  const changeCount = historyIndex
  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  return (
    <div>
      {/* ツールバー（2段組） */}
      <div className="panel" style={{ marginBottom: 14, padding: 0 }}>
        {/* ─ 1段目: 表示コントロール（ビュー/単位/方面） ─ */}
        <div style={{
          padding: '10px 16px',
          display: 'flex', alignItems: 'center', gap: 14,
          borderBottom: '1px solid var(--line-soft)',
          flexWrap: 'wrap',
        }}>
          <ToolbarGroup label="表示">
            <div className="seg" style={{ fontSize: 11 }}>
              <button className={view === 'matrix' ? 'active' : ''} onClick={() => setView('matrix')}>
                <Grid3x3 size={11} /> 組表
              </button>
              <button className={view === 'split' ? 'active' : ''} onClick={() => setView('split')}>
                <ArrowLeftRight size={11} /> 組表＋地図
              </button>
              <button className={view === 'map' ? 'active' : ''} onClick={() => setView('map')}>
                <MapIcon size={11} /> 地図のみ
              </button>
            </div>
          </ToolbarGroup>

          <ToolbarGroup label="単位">
            <div className="seg" style={{ fontSize: 11 }}>
              <button
                className={groupBy === 'building' ? 'active' : ''}
                onClick={() => setGroupBy('building')}
                title="同じ建物の事業所をまとめて送迎組"
              >
                <Building2 size={11} /> 建物
              </button>
              <button
                className={groupBy === 'facility' ? 'active' : ''}
                onClick={() => setGroupBy('facility')}
                title="事業所ごとに送迎組"
              >
                <Home size={11} /> 事業所
              </button>
            </div>
          </ToolbarGroup>

          <ToolbarGroup label="方面">
            <div className="seg" style={{ fontSize: 11 }}>
              <button className={regionFilter === 'all' ? 'active' : ''} onClick={() => setRegionFilter('all')}>
                全て
              </button>
              {REGIONS.map(r => (
                <button
                  key={r.id}
                  className={regionFilter === r.id ? 'active' : ''}
                  onClick={() => setRegionFilter(r.id)}
                  style={regionFilter === r.id ? { color: r.color, borderColor: r.color } : {}}
                >
                  <span style={{ width: 6, height: 6, borderRadius: 1, background: r.color, display: 'inline-block', marginRight: 4 }} />
                  {r.name}
                </button>
              ))}
            </div>
          </ToolbarGroup>

          <div style={{ flex: 1 }} />

          {/* 出所バッジ（1段目の右端） */}
          {appliedSource && (
            <div
              className="pill"
              style={{
                fontSize: 10,
                background: appliedSource.startsWith('past:') ? 'var(--info-soft)' : 'var(--accent-faint)',
                color: appliedSource.startsWith('past:') ? 'var(--info)' : 'var(--accent)',
                border: 'none', fontWeight: 700,
              }}
              title="初期案の出所"
            >
              {appliedSource.startsWith('past:') ? (
                <><History size={10} /> 過去組ベース</>
              ) : (
                <><Wand2 size={10} /> AI {appliedSource.replace('ai-','')}</>
              )}
            </div>
          )}
        </div>

        {/* ─ 2段目: 編集・履歴・確定 ─ */}
        <div style={{
          padding: '10px 16px',
          display: 'flex', alignItems: 'center', gap: 8,
          flexWrap: 'wrap',
        }}>
          {/* 左: データ操作 */}
          {onOpenPastModal && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={onOpenPastModal}
              title="別の過去送迎組を起点として読み込む（現在の調整内容は上書きされます）"
            >
              <History size={11} /> 過去組を差替え
            </button>
          )}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setVehicleStatusModalOpen(true)}
            title="本日の車両状態を編集（整備中・代車使用・休車）"
          >
            <Wrench size={11} />
            車両状態
            {Object.values(vehicleStatus).some(s => s.status !== 'active') && (
              <span style={{
                marginLeft: 4,
                background: 'var(--amber)',
                color: '#fff',
                borderRadius: 999,
                padding: '1px 6px',
                fontSize: 9,
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
              }}>
                {Object.values(vehicleStatus).filter(s => s.status !== 'active').length}
              </span>
            )}
          </button>

          <div style={{ flex: 1 }} />

          {/* 右: 履歴 & 確定 */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            paddingRight: 8,
            borderRight: '1px solid var(--line)',
          }}>
            <button className="btn btn-ghost btn-sm" onClick={undo} disabled={!canUndo} title={canUndo ? `元に戻す: ${history[historyIndex]?._action || ''}` : ''}>
              <Undo2 size={12} /> 元に戻す
            </button>
            <button className="btn btn-ghost btn-sm" onClick={redo} disabled={!canRedo}>
              <Redo2 size={12} /> やり直す
            </button>
            <div style={{ fontSize: 10, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
              変更 <span className="num" style={{ color: changeCount > 0 ? 'var(--accent)' : 'inherit', fontWeight: 700 }}>{changeCount}</span> 件
            </div>
          </div>

          <button className="btn btn-sage" onClick={() => setStep(4)} style={{ fontSize: 12 }}>
            <CheckCircle2 size={13} /> この組み方で確定
          </button>
        </div>

        {/* 制約違反バー */}
        {violations.length > 0 && (
          <div style={{
            padding: '8px 16px',
            background: 'var(--amber-soft)',
            borderLeft: '3px solid var(--amber)',
            display: 'flex', alignItems: 'center', gap: 10, fontSize: 11,
          }}>
            <AlertTriangle size={13} color="var(--amber)" />
            <span style={{ color: '#8b5a0c', fontWeight: 700 }}>
              {violations.length}件の制約違反
            </span>
            <span style={{ color: 'var(--ink-soft)' }}>
              {violations.slice(0, 3).map(v => v.msg).join('　/　')}
              {violations.length > 3 && ` 他${violations.length - 3}件`}
            </span>
          </div>
        )}
        {violations.length === 0 && (
          <div style={{
            padding: '8px 16px',
            background: 'var(--sage-soft)',
            borderLeft: '3px solid var(--sage)',
            display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--sage)',
          }}>
            <CheckCircle2 size={13} />
            <span style={{ fontWeight: 700 }}>全制約クリア</span>
            <span style={{ color: 'var(--ink-soft)' }}>
              定員・同乗NG・時間枠すべて充足
            </span>
          </div>
        )}
      </div>

      {/* メインコンテンツ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: view === 'split' ? '1fr 1fr 320px' : view === 'map' ? '1fr 320px' : '1fr 320px',
        gap: 16,
      }}>
        {/* 左: 配車組表 or 地図 */}
        {view !== 'map' && (
          <MatrixView
            assignments={assignments}
            violations={violations}
            regionFilter={regionFilter}
            selectedTripKey={selectedTripKey} setSelectedTripKey={setSelectedTripKey}
            highlightChildId={highlightChildId} setHighlightChildId={setHighlightChildId}
            draggedChild={draggedChild} setDraggedChild={setDraggedChild}
            moveChild={moveChild}
            addTrip={addTrip} removeTrip={removeTrip} changeVehicle={changeVehicle}
            groupBy={groupBy}
            vehicleStatus={vehicleStatus}
            childDayStatus={childDayStatus}
            onEditChild={(cid) => setChildEditModal({ childId: cid })}
            onEditVehicle={(vid) => setVehicleQuickEdit({ vehicleId: vid })}
          />
        )}

        {(view === 'split' || view === 'map') && (
          <MapViewPanel assignments={assignments} highlightChildId={highlightChildId} />
        )}

        {/* 右: 未配置者パネル + 統計 */}
        <SideRail
          assignments={assignments}
          violations={violations}
          highlightChildId={highlightChildId} setHighlightChildId={setHighlightChildId}
          history={history} historyIndex={historyIndex}
          onDragStart={setDraggedChild}
          moveChild={moveChild}
        />
      </div>

      {/* 車両状態編集モーダル（全台一覧） */}
      {vehicleStatusModalOpen && (
        <VehicleStatusModal
          vehicleStatus={vehicleStatus}
          setVehicleStatus={setVehicleStatus}
          assignments={assignments}
          onClose={() => setVehicleStatusModalOpen(false)}
        />
      )}

      {/* 車両クイック編集（1台分、カード内の車から開く） */}
      {vehicleQuickEdit && (
        <VehicleQuickEditModal
          vehicleId={vehicleQuickEdit.vehicleId}
          vehicleStatus={vehicleStatus}
          setVehicleStatus={setVehicleStatus}
          assignments={assignments}
          onClose={() => setVehicleQuickEdit(null)}
        />
      )}

      {/* 児童 当日状態 編集モーダル */}
      {childEditModal && (
        <ChildDayStatusModal
          childId={childEditModal.childId}
          childDayStatus={childDayStatus}
          setChildDayStatus={setChildDayStatus}
          onClose={() => setChildEditModal(null)}
        />
      )}
    </div>
  )
}

// ─── 配車組表マトリクス ───
function MatrixView({
  assignments, violations, regionFilter,
  selectedTripKey, setSelectedTripKey,
  highlightChildId, setHighlightChildId,
  draggedChild, setDraggedChild,
  moveChild, addTrip, removeTrip, changeVehicle,
  groupBy = 'building',
  vehicleStatus,
  childDayStatus, onEditChild, onEditVehicle,
}) {
  // 事業所単位の元データを、groupBy に応じて「表示用ブロック」に変換
  // facility: 既存どおり 1 ブロック = 1 事業所
  // building: 同じ建物の事業所ブロックをまとめて 1 ブロック扱い
  //           ただし元の bIdx/tIdx インデックスは壊さず、trip 単位で束ねる
  const displayBlocks = useMemo(() => {
    const blocks = assignments?.facilityBlocks || []
    if (groupBy === 'facility') {
      return blocks.map((block, bIdx) => {
        const fac = FACILITY_BY_ID[block?.facility]
        return {
          kind: 'facility',
          key: `fac-${bIdx}`,
          facility: fac,
          building: buildingOf(block?.facility),
          // facilities 配列は building モードで読むが、保険として facility モードでも入れておく
          facilities: fac ? [fac.id] : [],
          leadTeachers: block?.leadTeacher ? [block.leadTeacher] : [],
          trips: (block?.trips || []).map((trip, tIdx) => ({
            trip, bIdx, tIdx, sourceFacility: block?.facility,
          })),
        }
      })
    }
    // ─── building モード ───
    // 建物ごとに、含まれる事業所のすべての trip を平ら化して束ねる
    // 建物マスタに載っていない事業所は "その他" グループに寄せる（落ちないように）
    const byBuilding = new Map()
    blocks.forEach((block, bIdx) => {
      const bld = buildingOf(block?.facility)
      const bldKey = bld?.id || '__other__'
      if (!byBuilding.has(bldKey)) {
        byBuilding.set(bldKey, {
          kind: 'building',
          key: `bld-${bldKey}`,
          building: bld || {
            id: '__other__',
            name: '（建物未設定）',
            color: '#7e828f',
            address: '',
          },
          facilities: new Set(),
          leadTeachers: new Set(),
          trips: [],
        })
      }
      const entry = byBuilding.get(bldKey)
      if (block?.facility) entry.facilities.add(block.facility)
      if (block?.leadTeacher) entry.leadTeachers.add(block.leadTeacher)
      ;(block?.trips || []).forEach((trip, tIdx) => {
        entry.trips.push({ trip, bIdx, tIdx, sourceFacility: block?.facility })
      })
    })
    // 建物マスタ順で出力。マスタにない "__other__" は末尾
    const ordered = BUILDINGS
      .filter(b => byBuilding.has(b.id))
      .map(b => byBuilding.get(b.id))
    if (byBuilding.has('__other__')) ordered.push(byBuilding.get('__other__'))
    return ordered.map(e => ({
      ...e,
      facilities: [...e.facilities],
      leadTeachers: [...e.leadTeachers],
    }))
  }, [assignments?.facilityBlocks, groupBy])

  // 方面フィルタ適用
  const visibleBlocks = displayBlocks.map(block => ({
    block,
    visibleTrips: block.trips.filter(({ trip }) =>
      regionFilter === 'all' || trip.region === regionFilter,
    ),
  })).filter(({ visibleTrips }) => visibleTrips.length > 0)

  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="panel-header">
        <div>
          <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Grid3x3 size={14} color="var(--accent)" />
            配車組表（{groupBy === 'building' ? '建物' : '事業所'}単位）
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--ink-muted)', marginTop: 2 }}>
            児童カードを<b>ドラッグ</b>して車両間移動 / 便追加・削除・車両変更可能
          </div>
        </div>
      </div>

      <div style={{ padding: 14, background: 'var(--bg-deep)', maxHeight: 720, overflowY: 'auto' }}>
        {visibleBlocks.map(({ block, visibleTrips }) => (
          <FacilityBlock
            key={block.key}
            groupBlock={block}
            visibleTrips={visibleTrips}
            selectedTripKey={selectedTripKey} setSelectedTripKey={setSelectedTripKey}
            highlightChildId={highlightChildId} setHighlightChildId={setHighlightChildId}
            draggedChild={draggedChild} setDraggedChild={setDraggedChild}
            moveChild={moveChild}
            addTrip={addTrip} removeTrip={removeTrip} changeVehicle={changeVehicle}
            violations={violations}
            vehicleStatus={vehicleStatus}
            childDayStatus={childDayStatus}
            onEditChild={onEditChild}
            onEditVehicle={onEditVehicle}
          />
        ))}

        {visibleBlocks.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-muted)' }}>
            <Compass size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
            <div className="display" style={{ fontSize: 13 }}>該当する便がありません</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>方面フィルタを変更してください</div>
          </div>
        )}
      </div>
    </div>
  )
}

function FacilityBlock({
  groupBlock, visibleTrips,
  selectedTripKey, setSelectedTripKey,
  highlightChildId, setHighlightChildId,
  draggedChild, setDraggedChild,
  moveChild, addTrip, removeTrip, changeVehicle,
  violations,
  vehicleStatus,
  childDayStatus, onEditChild, onEditVehicle,
}) {
  const isBuilding = groupBlock?.kind === 'building'
  // ヘッダー用のメタデータ（hex color 前提。nullのときは fallback グレー #7e828f を使う）
  const headerColorHex = (isBuilding
    ? groupBlock?.building?.color
    : groupBlock?.facility?.color) || '#7e828f'
  const headerTitle = (isBuilding
    ? groupBlock?.building?.name
    : groupBlock?.facility?.name) || '（未設定）'
  const headerSub = isBuilding
    ? (groupBlock?.building?.address || '')
    : ''
  const facilitiesList = Array.isArray(groupBlock?.facilities) ? groupBlock.facilities : []
  const leadTeachers = Array.isArray(groupBlock?.leadTeachers) ? groupBlock.leadTeachers : []
  const leadTeachersText = leadTeachers.length ? leadTeachers.join(' / ') : '-'
  const tripsAll = Array.isArray(groupBlock?.trips) ? groupBlock.trips : []
  const addTargetBIdx = tripsAll[0]?.bIdx ?? 0

  // 合計乗車人数
  const totalChildren = tripsAll.reduce(
    (s, item) => s + (item?.trip?.childIds?.length || 0),
    0,
  )

  return (
    <div style={{
      marginBottom: 14,
      background: 'var(--surface)',
      border: '1px solid var(--line)',
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      {/* 拠点ヘッダー */}
      <div style={{
        padding: '12px 14px',
        background: headerColorHex + '10',
        borderBottom: `1px solid ${headerColorHex}30`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        {isBuilding ? (
          <Building2 size={14} color={headerColorHex} style={{ flexShrink: 0 }} />
        ) : (
          <span style={{ width: 10, height: 10, borderRadius: 2, background: headerColorHex, flexShrink: 0 }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 14, fontWeight: 700,
            color: headerColorHex,
            display: 'flex', alignItems: 'center', gap: 8,
            flexWrap: 'wrap',
          }}>
            <span>{headerTitle}</span>
            {isBuilding && facilitiesList.length > 0 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {facilitiesList.map(fid => {
                  const f = FACILITY_BY_ID[fid]
                  if (!f) return null
                  return (
                    <span key={fid} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 10, fontWeight: 700,
                      background: f.color + '18',
                      color: f.color,
                      padding: '2px 8px',
                      borderRadius: 999,
                      fontFamily: 'var(--font-display)',
                      letterSpacing: '0.02em',
                    }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: f.color,
                      }} />
                      {f.short}
                      <span style={{
                        fontSize: 8, color: f.color, opacity: 0.7,
                        fontWeight: 600,
                      }}>
                        {f.service}
                      </span>
                    </span>
                  )
                })}
              </div>
            )}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--ink-muted)', marginTop: 2 }}>
            {isBuilding && headerSub && <>📍 {headerSub} · </>}
            担当: {leadTeachersText} · {tripsAll.length}便 · <span className="num">{totalChildren}</span>名乗車
          </div>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => addTrip(addTargetBIdx)}
          title={isBuilding && facilitiesList.length > 0
            ? `便を追加（${FACILITY_BY_ID[facilitiesList[0]]?.short || ''}配下）`
            : '便を追加'
          }
        >
          <Plus size={11} /> 便追加
        </button>
      </div>

      {/* 便ごとのグリッド（Excel風） */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.max(visibleTrips.length, 1)}, minmax(220px, 1fr))`,
        gap: 1,
        background: 'var(--line)',
      }}>
        {visibleTrips.map(({ trip, bIdx, tIdx, sourceFacility }) => {
          const key = `${bIdx}:${tIdx}`
          const isSelected = selectedTripKey === key
          const v = VEHICLE_BY_ID[trip.vehicle]
          const vStatus = vehicleStatus?.[trip.vehicle]
          const tripViolations = violations.filter(vi => vi.tripKey === key)
          const overCapacity = trip.childIds.length > (v?.capacity || 0)
          const region = REGIONS.find(r => r.id === trip.region)
          // 建物モードだけ、各 trip がどの事業所に属するかをカラム内に表示する
          const tripFacility = isBuilding
            ? FACILITY_BY_ID[sourceFacility]
            : null

          return (
            <TripColumn
              key={key}
              tripKey={key} trip={trip} tIdx={tIdx} bIdx={bIdx}
              vehicle={v} region={region}
              vehicleStatusEntry={vStatus}
              vehicleStatus={vehicleStatus}
              tripFacility={tripFacility}
              isSelected={isSelected}
              onSelect={() => setSelectedTripKey(isSelected ? null : key)}
              violations={tripViolations}
              overCapacity={overCapacity}
              highlightChildId={highlightChildId}
              setHighlightChildId={setHighlightChildId}
              onDragStart={setDraggedChild}
              draggedChild={draggedChild}
              moveChild={moveChild}
              removeTrip={() => removeTrip(bIdx, tIdx)}
              changeVehicle={(vid) => changeVehicle(bIdx, tIdx, vid)}
              childDayStatus={childDayStatus}
              onEditChild={onEditChild}
              onEditVehicle={onEditVehicle}
            />
          )
        })}
      </div>
    </div>
  )
}

function TripColumn({
  tripKey, trip, tIdx, bIdx, vehicle, region,
  vehicleStatusEntry, vehicleStatus, tripFacility,
  isSelected, onSelect, violations, overCapacity,
  highlightChildId, setHighlightChildId,
  onDragStart, draggedChild, moveChild,
  removeTrip, changeVehicle,
  childDayStatus, onEditChild, onEditVehicle,
}) {
  const [dragOver, setDragOver] = useState(false)
  const dayStatus = vehicleStatusEntry ? DAY_STATUS_BY_ID[vehicleStatusEntry.status] : null
  const vehicleUnavailable = vehicleStatusEntry && !canUseVehicle(vehicleStatusEntry)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    if (draggedChild && draggedChild.from !== tripKey) {
      moveChild(draggedChild.childId, draggedChild.from, tripKey)
    }
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      style={{
        background: 'var(--surface)',
        minHeight: 260,
        display: 'flex', flexDirection: 'column',
        outline: dragOver ? '2px dashed var(--accent)' : isSelected ? `2px solid var(--accent)` : 'none',
        outlineOffset: -2,
      }}
    >
      {/* ヘッダー：便No・車両・先生 */}
      <div
        onClick={onSelect}
        style={{
          padding: '10px 12px',
          background: overCapacity ? 'var(--amber-soft)'
                      : vehicleUnavailable ? 'var(--danger-soft)'
                      : isSelected ? 'var(--accent-faint)' : 'var(--bg)',
          borderBottom: '1px solid var(--line)',
          cursor: 'pointer',
        }}
      >
        {/* 建物モード時のみ、どの事業所の便かを示す薄バッジ */}
        {tripFacility && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            marginBottom: 6,
            padding: '3px 8px',
            borderRadius: 999,
            background: tripFacility.color + '12',
            fontSize: 9.5, fontWeight: 700,
            color: tripFacility.color,
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.02em',
            width: 'fit-content',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: tripFacility.color }} />
            {tripFacility.short}
            <span style={{ opacity: 0.7, fontWeight: 600, fontSize: 9 }}>{tripFacility.service}</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 12, fontWeight: 700,
            color: isSelected ? 'var(--accent)' : 'var(--ink)',
            letterSpacing: '0.04em',
          }}>
            {trip.tripNo}便目
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {region && (
              <span className="pill" style={{
                fontSize: 9, padding: '2px 6px',
                background: region.color + '25', color: region.color, border: 'none', fontWeight: 700,
              }}>
                {region.name}
              </span>
            )}
            {overCapacity && (
              <span className="pill pill-amber" style={{ fontSize: 9, padding: '2px 6px' }} title="定員超過">
                <AlertCircle size={9} /> 定員超
              </span>
            )}
          </div>
        </div>

        {/* 車両選択 + 状態編集ボタン */}
        <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 4 }}>
          <select
            value={trip.vehicle}
            onChange={(e) => changeVehicle(e.target.value)}
            style={{
              flex: 1, minWidth: 0,
              fontSize: 11, padding: '4px 6px',
              background: vehicleUnavailable
                ? 'var(--danger-soft)'
                : vehicle?.color + '15',
              border: `1px solid ${vehicleUnavailable ? 'var(--danger)' : vehicle?.color + '60'}`,
              borderRadius: 4,
              color: vehicleUnavailable ? 'var(--danger)' : 'var(--ink)',
              fontWeight: 600,
            }}
          >
            {VEHICLES.map(v => {
              const s = vehicleStatus?.[v.id]
              const st = s ? DAY_STATUS_BY_ID[s.status] : null
              const unavailable = s && !canUseVehicle(s)
              return (
                <option key={v.id} value={v.id} disabled={unavailable && v.id !== trip.vehicle}>
                  {unavailable ? '⚠ ' : ''}{v.name}（定員{v.capacity}）{st && st.id !== 'active' ? ` - ${st.short}` : ''}
                </option>
              )
            })}
          </select>
          <button
            onClick={() => onEditVehicle?.(trip.vehicle)}
            title={`この車両の当日状態を編集（${vehicle?.name || ''}）`}
            style={{
              flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 26,
              padding: 0,
              border: `1px solid ${vehicleUnavailable ? 'var(--danger)' : 'var(--line-strong)'}`,
              borderRadius: 4,
              background: vehicleUnavailable ? 'var(--danger-soft)' : 'var(--surface)',
              color: vehicleUnavailable ? 'var(--danger)' : 'var(--ink-soft)',
              cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-faint)'; e.currentTarget.style.color = 'var(--accent)' }}
            onMouseLeave={e => {
              e.currentTarget.style.background = vehicleUnavailable ? 'var(--danger-soft)' : 'var(--surface)'
              e.currentTarget.style.color = vehicleUnavailable ? 'var(--danger)' : 'var(--ink-soft)'
            }}
          >
            <Wrench size={11} />
          </button>
        </div>

        {/* 当日ステータスバッジ（稼働中以外のみ表示） */}
        {dayStatus && dayStatus.id !== 'active' && (
          <div style={{
            marginTop: 5,
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '3px 8px',
            background: dayStatus.color + '1f',
            border: `1px solid ${dayStatus.color}55`,
            borderRadius: 4,
            fontSize: 10, fontWeight: 700,
            color: dayStatus.color,
          }}>
            <Wrench size={10} />
            <span>{dayStatus.label}</span>
            {vehicleStatusEntry?.note && (
              <span style={{ fontWeight: 500, opacity: 0.85, fontSize: 9.5 }}>
                · {vehicleStatusEntry.note}
              </span>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 10, color: 'var(--ink-muted)' }}>
          <span>{trip.teacher}</span>
          <span className="num" style={{ fontFamily: 'var(--font-mono)' }}>
            {trip.estDepart} → {trip.estArrive}
          </span>
        </div>

        <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 10, color: overCapacity ? 'var(--amber)' : 'var(--ink-muted)', fontWeight: overCapacity ? 700 : 400 }}>
            <span className="num">{trip.childIds.length}</span> / {vehicle?.capacity} 名
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); removeTrip() }}
            style={{
              border: 'none', background: 'transparent', cursor: 'pointer',
              color: 'var(--ink-muted)', padding: 2,
            }}
            title="この便を削除"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* 児童カード（同乗児童リスト） */}
      <div style={{ flex: 1, padding: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {trip.childIds.map(cid => {
          const child = CHILD_BY_ID[cid]
          if (!child) return null
          const loc = LOC_BY_ID[child.pickupLoc] || LOC_BY_ID[child.school]
          const hasNgViolation = violations.some(v => v.type === 'ng' && v.tripKey === tripKey && v.childIds?.includes(cid))
          const dayEntry = childDayStatus?.[cid]

          return (
            <ChildCard
              key={cid}
              child={child}
              loc={loc}
              highlighted={highlightChildId === cid}
              hasViolation={hasNgViolation}
              dayEntry={dayEntry}
              onMouseEnter={() => setHighlightChildId(cid)}
              onMouseLeave={() => setHighlightChildId(null)}
              onDragStart={() => onDragStart({ childId: cid, from: tripKey })}
              onDragEnd={() => onDragStart(null)}
              onClick={() => onEditChild?.(cid)}
            />
          )
        })}

        {trip.childIds.length === 0 && (
          <div style={{
            padding: 20, textAlign: 'center',
            border: '1.5px dashed var(--line-strong)',
            borderRadius: 6, fontSize: 10.5, color: 'var(--ink-muted)',
          }}>
            <MousePointerClick size={18} style={{ opacity: 0.5, marginBottom: 4 }} />
            <div>児童をここにドロップ</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── 児童カードの当日ステータス定義 ───
// transport=送迎する、absent=欠席で拠点にも行かない、leave_early=途中帰宅
// その他(present/late など)は present として扱い、特記事項メモだけ付けられる
const CHILD_DAY_STATUSES = [
  { id: 'present',     label: '通常',     color: '#6fa373', short: '通常' },
  { id: 'absent',      label: '欠席',     color: '#c94a3b', short: '欠席' },
  { id: 'leave_early', label: '早退',     color: '#d9992b', short: '早退' },
  { id: 'late',        label: '遅参',     color: '#3d7eac', short: '遅' },
  { id: 'note_only',   label: '申し送り', color: '#9a7cbb', short: 'メモ' },
]
const CHILD_DAY_STATUS_BY_ID = Object.fromEntries(CHILD_DAY_STATUSES.map(s => [s.id, s]))

function ChildCard({
  child, loc, highlighted, hasViolation,
  dayEntry,
  onMouseEnter, onMouseLeave,
  onDragStart, onDragEnd, onClick,
}) {
  const ds = dayEntry ? CHILD_DAY_STATUS_BY_ID[dayEntry.status] : null
  const isAbsent = dayEntry?.status === 'absent'
  const hasNote  = !!dayEntry?.note
  // 視覚優先度: 違反 > 欠席 > ハイライト > dayステータス > 通常
  const borderColor = hasViolation
    ? 'var(--amber)'
    : isAbsent
      ? 'var(--danger)'
      : highlighted
        ? 'var(--accent)'
        : ds
          ? ds.color
          : 'var(--line)'
  const bgColor = hasViolation
    ? 'var(--amber-soft)'
    : isAbsent
      ? 'var(--danger-soft)'
      : highlighted
        ? 'var(--accent-faint)'
        : ds
          ? `${ds.color}14`
          : '#fff'

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      title="クリックで当日の状態を編集"
      style={{
        padding: '7px 9px',
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 6,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 7,
        transition: 'all 0.1s',
        fontSize: 11.5,
        opacity: isAbsent ? 0.75 : 1,
      }}
    >
      <GripVertical size={11} color="var(--ink-muted)" style={{ flexShrink: 0, opacity: 0.6 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 600,
          color: 'var(--ink)',
          display: 'flex', alignItems: 'center', gap: 4,
          flexWrap: 'wrap',
          textDecoration: isAbsent ? 'line-through' : 'none',
        }}>
          {child.name}
          {child.tag && <span className="pill pill-accent" style={{ fontSize: 8, padding: '0 4px' }}>{child.tag}</span>}
          {hasViolation && <AlertCircle size={10} color="var(--amber)" />}
          {ds && (
            <span style={{
              fontSize: 8.5, fontWeight: 800,
              color: '#fff', background: ds.color,
              padding: '1px 5px', borderRadius: 3,
              letterSpacing: '0.04em',
            }}>
              {ds.short}
            </span>
          )}
        </div>
        <div style={{ fontSize: 9.5, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
          {child.grade} · {loc?.name || '—'} · {loc?.time || '—'}
        </div>
        {hasNote && (
          <div style={{
            marginTop: 3,
            padding: '2px 6px',
            borderLeft: `2px solid ${ds?.color || 'var(--ink-faint)'}`,
            fontSize: 10, color: 'var(--ink-soft)',
            fontWeight: 500, lineHeight: 1.35,
            background: `${ds?.color || 'var(--ink-faint)'}10`,
          }}>
            {dayEntry.note}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── 右サイドバー ───
function SideRail({ assignments, violations, highlightChildId, setHighlightChildId, history, historyIndex, onDragStart, moveChild }) {
  const [tab, setTab] = useState('unassigned')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 20, alignSelf: 'flex-start' }}>
      {/* タブ */}
      <div className="panel" style={{ padding: 0 }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--line)' }}>
          {[
            { id: 'unassigned', label: '未配置', icon: UserCheck, count: (assignments.unassignedChildIds || []).length },
            { id: 'violations', label: '違反',   icon: AlertTriangle, count: violations.length },
            { id: 'history',    label: '履歴',   icon: Clock, count: historyIndex },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: '10px 6px',
                border: 'none', background: 'transparent',
                borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
                color: tab === t.id ? 'var(--accent)' : 'var(--ink-muted)',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}
            >
              <t.icon size={12} />
              {t.label}
              {t.count > 0 && (
                <span style={{
                  fontSize: 9, fontWeight: 700,
                  background: t.id === 'violations' ? 'var(--amber)' : tab === t.id ? 'var(--accent)' : 'var(--line-strong)',
                  color: '#fff', padding: '1px 5px', borderRadius: 8, minWidth: 14, textAlign: 'center',
                }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={{ maxHeight: 520, overflowY: 'auto' }}>
          {tab === 'unassigned' && (
            <UnassignedTab
              unassignedIds={assignments.unassignedChildIds || []}
              highlightChildId={highlightChildId}
              setHighlightChildId={setHighlightChildId}
              onDragStart={onDragStart}
            />
          )}
          {tab === 'violations' && (
            <ViolationsTab violations={violations} onHighlight={setHighlightChildId} />
          )}
          {tab === 'history' && (
            <HistoryTab history={history} historyIndex={historyIndex} />
          )}
        </div>
      </div>

      {/* 統計 */}
      <div className="surface" style={{ padding: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>方面別サマリー</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {REGIONS.map(r => {
            const count = countChildrenByRegion(assignments, r.id)
            return (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 4, height: 16, background: r.color, borderRadius: 1 }} />
                <span style={{ fontSize: 11.5, flex: 1 }}>{r.name}</span>
                <span className="num" style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: r.color }}>
                  {count}
                </span>
                <span style={{ fontSize: 10, color: 'var(--ink-muted)' }}>名</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function UnassignedTab({ unassignedIds, highlightChildId, setHighlightChildId, onDragStart }) {
  if (unassignedIds.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-muted)' }}>
        <CheckCircle2 size={28} color="var(--sage)" style={{ marginBottom: 6 }} />
        <div className="display" style={{ fontSize: 13 }}>全員配置済</div>
        <div style={{ fontSize: 11, marginTop: 4 }}>未配置の児童はいません</div>
      </div>
    )
  }

  // 学校ごとにグルーピング
  const byLoc = {}
  unassignedIds.forEach(id => {
    const c = CHILD_BY_ID[id]
    if (!c) return
    const locId = c.pickupLoc || c.school || 'unknown'
    if (!byLoc[locId]) byLoc[locId] = []
    byLoc[locId].push(c)
  })

  return (
    <div style={{ padding: 10 }}>
      <div style={{ padding: '8px 10px', background: 'var(--amber-soft)', borderRadius: 6, marginBottom: 10, fontSize: 10.5, color: '#8b5a0c' }}>
        <div style={{ fontWeight: 700, marginBottom: 2 }}>
          <AlertTriangle size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /> {unassignedIds.length}名が未配置
        </div>
        <div>学校ごと時間順。児童をドラッグして便に割当</div>
      </div>

      {Object.entries(byLoc).map(([locId, children]) => {
        const loc = LOC_BY_ID[locId]
        return (
          <div key={locId} style={{ marginBottom: 10 }}>
            <div style={{
              fontSize: 9.5, fontWeight: 700,
              color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.08em',
              padding: '4px 0', borderBottom: '1px solid var(--line-soft)', marginBottom: 4,
            }}>
              {loc?.name || locId} · {children.length}名
            </div>
            {children.sort((a,b) => (LOC_BY_ID[a.pickupLoc]?.time||'').localeCompare(LOC_BY_ID[b.pickupLoc]?.time||'')).map(c => {
              const lc = LOC_BY_ID[c.pickupLoc] || LOC_BY_ID[c.school]
              return (
                <div
                  key={c.id}
                  draggable
                  onDragStart={() => onDragStart({ childId: c.id, from: 'unassigned' })}
                  onDragEnd={() => onDragStart(null)}
                  onMouseEnter={() => setHighlightChildId(c.id)}
                  onMouseLeave={() => setHighlightChildId(null)}
                  style={{
                    padding: '6px 8px', borderRadius: 4,
                    background: highlightChildId === c.id ? 'var(--accent-faint)' : 'var(--surface-soft)',
                    border: highlightChildId === c.id ? '1px solid var(--accent)' : '1px solid transparent',
                    marginBottom: 3, cursor: 'grab',
                    display: 'flex', alignItems: 'center', gap: 6, fontSize: 11,
                  }}
                >
                  <GripVertical size={10} color="var(--ink-muted)" style={{ opacity: 0.5 }} />
                  <span className="num" style={{ color: 'var(--accent)', fontWeight: 600, width: 36 }}>
                    {lc?.time || '—'}
                  </span>
                  <span style={{ flex: 1, fontWeight: 600 }}>{c.name}</span>
                  <span style={{ fontSize: 9, color: 'var(--ink-muted)' }}>{c.grade}</span>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

function ViolationsTab({ violations, onHighlight }) {
  if (violations.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--sage)' }}>
        <CheckCircle2 size={28} style={{ marginBottom: 6 }} />
        <div className="display" style={{ fontSize: 13, color: 'var(--sage)' }}>全制約クリア</div>
        <div style={{ fontSize: 11, marginTop: 4, color: 'var(--ink-muted)' }}>定員・同乗NG・すべて充足</div>
      </div>
    )
  }
  return (
    <div style={{ padding: 10 }}>
      {violations.map((v, i) => (
        <div
          key={i}
          style={{
            padding: 10, marginBottom: 6,
            background: v.severity === 'must' ? 'var(--danger-soft, #fde3e1)' : 'var(--amber-soft)',
            border: `1px solid ${v.severity === 'must' ? 'var(--danger, #c94a3b)' : 'var(--amber)'}`,
            borderRadius: 6, fontSize: 11,
          }}
          onMouseEnter={() => v.childIds?.[0] && onHighlight(v.childIds[0])}
          onMouseLeave={() => onHighlight(null)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, marginBottom: 3 }}>
            <AlertTriangle size={11} color={v.severity === 'must' ? 'var(--danger, #c94a3b)' : 'var(--amber)'} />
            <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {v.severity === 'must' ? 'MUST違反' : '警告'}
            </span>
          </div>
          <div style={{ color: 'var(--ink)' }}>{v.msg}</div>
          {v.hint && <div style={{ fontSize: 10, color: 'var(--ink-muted)', marginTop: 3 }}>{v.hint}</div>}
        </div>
      ))}
    </div>
  )
}

function HistoryTab({ history, historyIndex }) {
  return (
    <div style={{ padding: 10 }}>
      <div style={{ fontSize: 10.5, color: 'var(--ink-muted)', marginBottom: 8 }}>
        AI推奨からの変更履歴
      </div>
      {history.slice(1).map((h, i) => {
        const idx = i + 1
        const isCurrent = idx === historyIndex
        return (
          <div
            key={i}
            style={{
              padding: '8px 10px', marginBottom: 3,
              background: isCurrent ? 'var(--accent-faint)' : 'var(--surface-soft)',
              borderLeft: `2px solid ${isCurrent ? 'var(--accent)' : 'transparent'}`,
              borderRadius: 4, fontSize: 11,
              opacity: idx > historyIndex ? 0.5 : 1,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ fontSize: 9, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>
                #{idx}
              </span>
              {isCurrent && (
                <span style={{ fontSize: 8, color: 'var(--accent)', fontWeight: 700 }}>現在</span>
              )}
            </div>
            <div style={{ color: 'var(--ink)' }}>{h._action}</div>
          </div>
        )
      })}
      {historyIndex === 0 && (
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--ink-muted)', fontSize: 11 }}>
          まだ変更はありません
        </div>
      )}
    </div>
  )
}

function MapViewPanel({ assignments, highlightChildId }) {
  // assignments を SIMULATION_A 互換形式にざっくり変換
  const routes = useMemo(() => {
    const allRoutes = []
    assignments.facilityBlocks.forEach(block => {
      block.trips.forEach(trip => {
        const v = VEHICLE_BY_ID[trip.vehicle]
        if (!v || trip.childIds.length === 0) return
        const stops = [
          { kind: 'depart', time: trip.estDepart, x: BASE.x, y: BASE.y },
          ...trip.childIds.map(cid => {
            const child = CHILD_BY_ID[cid]
            return {
              childId: cid,
              schoolId: child?.school || child?.pickupLoc,
              time: LOC_BY_ID[child?.school || child?.pickupLoc]?.time || '14:30',
            }
          }),
          { kind: 'arrive', time: trip.estArrive, x: BASE.x, y: BASE.y },
        ]
        allRoutes.push({ vehicle: trip.vehicle, color: v.color, stops })
      })
    })
    return allRoutes
  }, [assignments])

  return (
    <div className="panel" style={{ padding: 0 }}>
      <div className="panel-header">
        <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <MapIcon size={13} color="var(--accent)" />
          地図プレビュー
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
          配車組表の変更をリアルタイム反映
        </div>
      </div>
      <div style={{ height: 700 }}>
        <KasugaiMap routes={routes} highlightChildren={highlightChildId ? [highlightChildId] : []} />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// STEP 4: Confirm & Navigation
// ═══════════════════════════════════════════════════════════════
function Step4({ assignments, date, direction, setStep }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="panel" style={{ background: 'var(--sage-soft)', borderColor: 'var(--sage)' }}>
          <div style={{ padding: 22, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--sage)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={22} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div className="display" style={{ fontSize: 16, color: 'var(--sage)' }}>配車確定しました</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 3 }}>
                {date} の{direction === 'pickup' ? '迎え' : '送り'}便に反映。各ドライバーのスマホへ通知送信済み。
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm"><Download size={12} /> PDF</button>
              <button className="btn btn-ghost btn-sm"><Download size={12} /> CSV</button>
            </div>
          </div>
        </div>

        {/* ドライバー配布カード */}
        <div className="panel" style={{ padding: 0 }}>
          <div className="panel-header">
            <div className="panel-title">ドライバー配布用カード</div>
          </div>
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {assignments.facilityBlocks.flatMap(block =>
              block.trips.filter(t => t.childIds.length > 0).map(trip => {
                const v = VEHICLE_BY_ID[trip.vehicle]
                const fac = FACILITY_BY_ID[block.facility]
                const navUrl = googleMapsTripUrl(trip, direction)
                return (
                  <div key={`${block.facility}-${trip.tripNo}`} style={{ border: `1.5px solid ${v?.color}`, borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                    <div style={{ padding: '10px 14px', background: v?.color, color: '#fff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{v?.name}</div>
                        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.85 }}>{trip.tripNo}便目</div>
                      </div>
                      <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>
                        {fac?.short} · {trip.teacher}
                      </div>
                    </div>
                    <div style={{ padding: '10px 14px' }}>
                      <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginBottom: 6 }}>
                        {v?.driver} · {trip.childIds.length}名
                      </div>
                      {trip.childIds.map(cid => {
                        const child = CHILD_BY_ID[cid]
                        const loc = LOC_BY_ID[child?.pickupLoc] || LOC_BY_ID[child?.school]
                        return (
                          <div key={cid} style={{ display: 'flex', gap: 8, padding: '4px 0', fontSize: 12 }}>
                            <span style={{ color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)', width: 36, fontSize: 11 }}>{loc?.time || '—'}</span>
                            <span style={{ fontWeight: 600 }}>{child?.name}</span>
                            <span style={{ marginLeft: 'auto', color: 'var(--ink-muted)', fontSize: 10 }}>
                              {loc?.name?.replace('小学校','小').replace('中学校','中') || ''}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                    <div style={{ padding: '8px 14px', background: 'var(--surface-soft)', borderTop: '1px solid var(--line)' }}>
                      <a
                        href={navUrl}
                        target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                      >
                        <Navigation size={11} /> Google Mapsでナビ開始
                      </a>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="surface" style={{ padding: 18 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>次のアクション</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}><Play size={12} /> 運行開始モード</button>
            <button className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}><Users size={12} /> 保護者通知を送信</button>
            <button className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}><Download size={12} /> 配送記録をHUGへ</button>
          </div>
        </div>

        <button onClick={() => setStep(3)} className="btn btn-ghost" style={{ padding: 10, justifyContent: 'center' }}>
          配車組表に戻る
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 制約違反チェック
// ═══════════════════════════════════════════════════════════════
function computeViolations(assignments) {
  if (!assignments) return []
  const violations = []
  assignments.facilityBlocks?.forEach((block, bIdx) => {
    block.trips.forEach((trip, tIdx) => {
      const key = `${bIdx}:${tIdx}`
      const v = VEHICLE_BY_ID[trip.vehicle]

      // 定員超過
      if (v && trip.childIds.length > v.capacity) {
        violations.push({
          type: 'capacity', severity: 'must', tripKey: key,
          msg: `${v.name}定員超過（${trip.childIds.length}/${v.capacity}）`,
          hint: '児童を他の便に移動してください',
          childIds: trip.childIds,
        })
      }

      // 同乗NG
      for (let i = 0; i < trip.childIds.length; i++) {
        for (let j = i + 1; j < trip.childIds.length; j++) {
          const ca = CHILD_BY_ID[trip.childIds[i]]
          const cb = CHILD_BY_ID[trip.childIds[j]]
          if (ca?.ngWith?.includes(cb?.id) || cb?.ngWith?.includes(ca?.id)) {
            violations.push({
              type: 'ng', severity: 'must', tripKey: key,
              msg: `同乗NG: ${ca?.name} × ${cb?.name}`,
              hint: '片方を別の便に移動してください',
              childIds: [ca?.id, cb?.id],
            })
          }
        }
      }
    })
  })
  return violations
}

function countChildrenByRegion(assignments, regionId) {
  let count = 0
  assignments.facilityBlocks?.forEach(block => {
    block.trips.forEach(trip => {
      trip.childIds.forEach(cid => {
        const c = CHILD_BY_ID[cid]
        if (classifyRegion(c?.homeX) === regionId) count++
      })
    })
  })
  return count
}

// ═══════════════════════════════════════════════════════════════
// Google Maps URL ビルダ
// ═══════════════════════════════════════════════════════════════
// 1便分のナビURL（迎え: 拠点→学校1→学校2→...→拠点、送り: 同）
function googleMapsTripUrl(trip, direction = 'pickup') {
  const originAddr = BASE.address
  const destAddr = BASE.address
  const waypoints = trip.childIds.map(cid => {
    const child = CHILD_BY_ID[cid]
    if (!child) return null
    // 迎え: 学校・学童、送り: 自宅住所
    if (direction === 'pickup') {
      const loc = LOC_BY_ID[child.pickupLoc] || LOC_BY_ID[child.school]
      return loc?.address || loc?.name
    } else {
      return child.address
    }
  }).filter(Boolean)

  if (waypoints.length === 0) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(originAddr)}`
  }

  const params = new URLSearchParams({
    api: '1',
    origin: originAddr,
    destination: destAddr,
    waypoints: waypoints.join('|'),
    travelmode: 'driving',
  })
  return `https://www.google.com/maps/dir/?${params.toString()}`
}

// 全便を1つのマップで開く（代表的な地点をsearch）
function googleMapsAllTripsUrl(assignments) {
  // 中央エリアの概観を表示する検索URL
  return `https://www.google.com/maps/search/${encodeURIComponent(BASE.address)}/@${BASE.lat},${BASE.lng},13z`
}

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════
function Field({ label, children }) {
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  )
}

function Stat({ label, value, suf }) {
  return (
    <div>
      <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
        <span className="display num" style={{ fontSize: 24, color: '#fff' }}>{value}</span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{suf}</span>
      </div>
    </div>
  )
}

function MiniStat({ label, value, suf, warn }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: 'var(--ink-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: warn ? 'var(--amber)' : 'var(--ink)' }}>
        <span className="num">{value}</span>
        <span style={{ fontSize: 10, fontWeight: 500, marginLeft: 2, color: 'var(--ink-muted)' }}>{suf}</span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 過去送迎組 参照モーダル
// ─────────────────────────────────────────────────────────────
// 選択中の日付と同一曜日の過去送迎組を一覧表示。
// 左: 日付一覧、右: 選択中の組のプレビュー（施設ブロック×便×児童）。
// 「この組を適用」で assignments にロードして Step 3 に遷移する。
// ═══════════════════════════════════════════════════════════════
function PastAssignmentsModal({ date, direction, onClose, onAdopt }) {
  const currentDow = getDayOfWeek(date)

  // 同一曜日 × 同一方向でマッチ、なければ同一曜日だけで候補
  const sameDowSameDir = useMemo(
    () => findPastAssignmentsBy({ date, direction }),
    [date, direction]
  )
  const sameDowAnyDir = useMemo(
    () => findPastAssignmentsBy({ date }),
    [date]
  )
  const otherDow = useMemo(
    () => PAST_ASSIGNMENTS
      .filter(p => p.date < date && p.dayOfWeek !== currentDow)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [date, currentDow]
  )

  const [filter, setFilter] = useState('sameDow')   // 'sameDow' | 'all'
  const list = filter === 'sameDow' ? sameDowSameDir : [...sameDowAnyDir, ...otherDow]
  const [selectedId, setSelectedId] = useState(list[0]?.id ?? null)

  // リスト切替時に選択を合わせる
  useEffect(() => {
    if (!list.find(p => p.id === selectedId)) {
      setSelectedId(list[0]?.id ?? null)
    }
  }, [filter, list, selectedId])

  const selected = list.find(p => p.id === selectedId)

  // Esc で閉じる
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(28, 30, 38, 0.55)',
        backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, animation: 'fadeIn 0.18s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          width: 'min(1080px, 96vw)',
          maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}
      >
        {/* ヘッダ */}
        <div style={{
          padding: '16px 22px', borderBottom: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', gap: 14,
          background: 'var(--surface-soft)',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'var(--info-soft)', color: 'var(--info)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <History size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>
              過去の送迎組を参照
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 2 }}>
              対象日 <span className="num" style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', fontWeight: 600 }}>
                {date || '—'}
              </span>
              {currentDow != null && <>（<b style={{ color: 'var(--ink)' }}>{DOW_LABELS[currentDow]}曜</b>）</>}
              {' · '}
              方向 <b style={{ color: 'var(--ink)' }}>{direction === 'pickup' ? '迎え' : '送り'}</b>
              {' · '}
              選択した組をそのまま起点（初期案）として読み込みます
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm"><X size={13} /> 閉じる</button>
        </div>

        {/* フィルタ */}
        <div style={{
          padding: '10px 22px', borderBottom: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div className="seg" style={{ fontSize: 11 }}>
            <button className={filter === 'sameDow' ? 'active' : ''} onClick={() => setFilter('sameDow')}>
              <Calendar size={11} /> 同一曜日 ({DOW_LABELS[currentDow]}) のみ
            </button>
            <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
              <CalendarClock size={11} /> 全履歴
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
            該当 <span className="num" style={{ color: 'var(--ink)', fontWeight: 700 }}>{list.length}</span> 件
          </div>
          {filter === 'sameDow' && sameDowSameDir.length === 0 && (
            <div style={{ fontSize: 11, color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <AlertCircle size={12} />
              同一曜日 × 同一方向の履歴がありません。[全履歴] に切り替えるか、別条件をお試しください。
            </div>
          )}
        </div>

        {/* メイン: 左一覧 / 右プレビュー */}
        <div style={{
          flex: 1, minHeight: 0, display: 'grid',
          gridTemplateColumns: '320px 1fr',
        }}>
          {/* 左: 日付リスト */}
          <div style={{
            borderRight: '1px solid var(--line)',
            overflowY: 'auto', background: 'var(--bg)',
          }}>
            {list.length === 0 ? (
              <div style={{ padding: 22, fontSize: 12, color: 'var(--ink-muted)', textAlign: 'center' }}>
                該当する過去送迎組がありません
              </div>
            ) : (
              list.map(p => {
                const active = p.id === selectedId
                const dow = p.dayOfWeek
                const sameDow = dow === currentDow
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '14px 18px',
                      borderBottom: '1px solid var(--line-soft)',
                      background: active ? 'var(--surface)' : 'transparent',
                      borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
                      cursor: 'pointer',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={(e) => !active && (e.currentTarget.style.background = 'var(--surface-soft)')}
                    onMouseLeave={(e) => !active && (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className="num" style={{
                        fontFamily: 'var(--font-mono)', fontSize: 12,
                        fontWeight: 700, color: active ? 'var(--accent)' : 'var(--ink)',
                      }}>
                        {p.date}
                      </span>
                      <span className="pill" style={{
                        fontSize: 9, padding: '1px 6px',
                        background: sameDow ? 'var(--sage-soft)' : 'var(--bg-deep)',
                        color: sameDow ? 'var(--sage)' : 'var(--ink-muted)',
                      }}>
                        {DOW_LABELS[dow]}曜
                      </span>
                      <span className="pill pill-gray" style={{ fontSize: 9, padding: '1px 6px' }}>
                        {p.direction === 'pickup' ? '迎え' : '送り'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', marginBottom: 3 }}>
                      {p.label}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--ink-muted)', display: 'flex', gap: 10 }}>
                      <span>{p.stats?.tripCount ?? 0}便</span>
                      <span>{p.stats?.childCount ?? 0}名</span>
                      <span className="num">{p.stats?.totalDistance ?? 0}km</span>
                    </div>
                    {p.note && (
                      <div style={{ marginTop: 6, fontSize: 10.5, color: 'var(--ink-soft)', fontStyle: 'italic', lineHeight: 1.45 }}>
                        {p.note}
                      </div>
                    )}
                  </button>
                )
              })
            )}
          </div>

          {/* 右: プレビュー */}
          <div style={{ overflowY: 'auto', padding: 22 }}>
            {selected ? (
              <PastAssignmentPreview past={selected} currentDow={currentDow} />
            ) : (
              <div style={{
                height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--ink-muted)', fontSize: 13,
              }}>
                左から過去の送迎組を選択してください
              </div>
            )}
          </div>
        </div>

        {/* フッタ */}
        <div style={{
          padding: '14px 22px', borderTop: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'var(--surface-soft)',
        }}>
          <div style={{ fontSize: 10.5, color: 'var(--ink-muted)', flex: 1, lineHeight: 1.5 }}>
            <Info size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            適用後、Step 3 の配車組表で児童のドラッグ&ドロップ・便の追加/削除・車両変更などの微調整ができます。
            {' '}現在の「送迎対象から除外」リストに含まれる児童は自動的に外されます。
          </div>
          <button className="btn btn-ghost" onClick={onClose}>キャンセル</button>
          <button
            onClick={() => selected && onAdopt(selected.id)}
            disabled={!selected}
            className="btn btn-primary"
            style={{
              fontSize: 13, padding: '10px 18px',
              background: selected ? 'var(--accent)' : 'var(--ink-faint)',
              cursor: selected ? 'pointer' : 'not-allowed',
            }}
          >
            <Copy size={13} /> この組を適用 <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── 過去送迎組プレビュー ───
function PastAssignmentPreview({ past, currentDow }) {
  const sameDow = past.dayOfWeek === currentDow
  return (
    <div>
      {/* ヘッダ */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink-muted)', fontWeight: 600 }}>
            {past.date}
          </span>
          <span className="pill" style={{
            fontSize: 9, padding: '1px 6px',
            background: sameDow ? 'var(--sage-soft)' : 'var(--amber-soft)',
            color: sameDow ? 'var(--sage)' : 'var(--amber)',
          }}>
            {DOW_LABELS[past.dayOfWeek]}曜 {sameDow && '(同一曜日)'}
          </span>
          <span className="pill pill-gray" style={{ fontSize: 9 }}>
            {past.direction === 'pickup' ? '迎え' : '送り'}
          </span>
        </div>
        <div className="display" style={{ fontSize: 20, marginBottom: 4 }}>
          {past.label}
        </div>
        {past.note && (
          <div style={{ fontSize: 11.5, color: 'var(--ink-muted)', fontStyle: 'italic' }}>
            {past.note}
          </div>
        )}
        {past.confirmedBy && (
          <div style={{ fontSize: 10.5, color: 'var(--ink-faint)', marginTop: 4 }}>
            確定者: {past.confirmedBy}
          </div>
        )}
      </div>

      {/* サマリー */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10,
        padding: 14, background: 'var(--bg)',
        borderRadius: 'var(--radius)', marginBottom: 18,
      }}>
        <MiniStat label="総所要" value={past.stats?.totalTime ?? '—'} suf="分" />
        <MiniStat label="総距離" value={past.stats?.totalDistance ?? '—'} suf="km" />
        <MiniStat label="便数"   value={past.stats?.tripCount ?? '—'} suf="便" />
        <MiniStat label="児童数" value={past.stats?.childCount ?? '—'} suf="名" />
      </div>

      {/* 施設ブロック別プレビュー */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {past.facilityBlocks.map((block, bIdx) => {
          const fac = FACILITY_BY_ID[block.facility]
          return (
            <div key={bIdx} style={{
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius)', overflow: 'hidden',
            }}>
              <div style={{
                padding: '8px 14px',
                background: (fac?.color || '#999') + '12',
                borderBottom: '1px solid var(--line)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{
                  width: 10, height: 10, borderRadius: 2,
                  background: fac?.color || '#999',
                }} />
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700 }}>
                  {fac?.short || block.facility}
                </span>
                <span style={{ fontSize: 10.5, color: 'var(--ink-muted)' }}>
                  · {block.leadTeacher} · {block.trips.length}便
                </span>
              </div>
              <div>
                {block.trips.map((trip, tIdx) => {
                  const v = VEHICLE_BY_ID[trip.vehicle]
                  return (
                    <div key={tIdx} style={{
                      padding: '10px 14px',
                      borderTop: tIdx > 0 ? '1px solid var(--line-soft)' : 'none',
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                    }}>
                      <div style={{
                        width: 34, flexShrink: 0,
                        fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700,
                        color: v?.color || 'var(--ink)',
                      }}>
                        {trip.tripNo}<span style={{ fontSize: 9, color: 'var(--ink-muted)', fontWeight: 500 }}>便</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, marginBottom: 4 }}>
                          <span style={{ fontWeight: 600 }}>{v?.name || trip.vehicle}</span>
                          <span style={{ color: 'var(--ink-muted)' }}>·</span>
                          <span style={{ color: 'var(--ink-muted)' }}>{trip.teacher}</span>
                          <span style={{ color: 'var(--ink-muted)' }}>·</span>
                          <span className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-muted)' }}>
                            {trip.estDepart}〜{trip.estArrive}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {trip.childIds.map(cid => {
                            const c = CHILD_BY_ID[cid]
                            return (
                              <span key={cid} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '3px 8px', borderRadius: 4,
                                background: 'var(--bg-deep)', fontSize: 11,
                                fontWeight: 500,
                              }}>
                                {c?.name || cid}
                                <span style={{ fontSize: 9, color: 'var(--ink-muted)' }}>{c?.grade}</span>
                              </span>
                            )
                          })}
                        </div>
                        {trip.note && (
                          <div style={{ marginTop: 6, fontSize: 10.5, color: 'var(--ink-muted)', fontStyle: 'italic' }}>
                            ※ {trip.note}
                          </div>
                        )}
                      </div>
                      <div style={{
                        fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--ink-muted)',
                        whiteSpace: 'nowrap',
                      }}>
                        {trip.childIds.length}名
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {(past.unassignedChildIds?.length > 0) && (
        <div style={{
          marginTop: 14, padding: 12,
          background: 'var(--amber-soft)', borderRadius: 'var(--radius)',
          borderLeft: '3px solid var(--amber)',
          fontSize: 11, color: '#8b5a0c',
        }}>
          <b>未配置 {past.unassignedChildIds.length}名</b>：
          {past.unassignedChildIds.map(cid => CHILD_BY_ID[cid]?.name || cid).join('、')}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 車両 当日ステータス編集モーダル
// ═══════════════════════════════════════════════════════════════
// 当日の各車両のステータス（稼働/整備/代車/休車）とメモを編集する。
// 既に使用中の便に割り当たっている車両を「使用不可」にした場合、
// モーダル下部に警告を出す（実際の切替はユーザー判断に委ねる = 自動で別車両にはしない）。
function VehicleStatusModal({ vehicleStatus, setVehicleStatus, assignments, onClose }) {
  // 各車両が何便に使われているかを集計
  const vehicleUsage = useMemo(() => {
    const usage = {}
    assignments?.facilityBlocks?.forEach(block => {
      block.trips.forEach(trip => {
        if (!usage[trip.vehicle]) usage[trip.vehicle] = []
        usage[trip.vehicle].push({
          facilityShort: FACILITY_BY_ID[block.facility]?.short || block.facility,
          tripNo: trip.tripNo,
          childCount: trip.childIds.length,
        })
      })
    })
    return usage
  }, [assignments])

  const updateStatus = (vehicleId, field, value) => {
    setVehicleStatus(prev => ({
      ...prev,
      [vehicleId]: { ...prev[vehicleId], [field]: value },
    }))
  }

  // Esc で閉じる
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // 使用中なのに停止にされている車両を警告対象に
  const conflicts = VEHICLES.filter(v => {
    const s = vehicleStatus[v.id]
    return s && !canUseVehicle(s) && (vehicleUsage[v.id]?.length > 0)
  })

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(28, 30, 38, 0.55)',
        backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, animation: 'fadeIn 0.18s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          width: 'min(960px, 96vw)',
          maxHeight: '92vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}
      >
        {/* ヘッダ */}
        <div style={{
          padding: '16px 22px', borderBottom: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', gap: 14,
          background: 'var(--surface-soft)',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'var(--amber-soft)', color: 'var(--amber)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Wrench size={16} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, color: 'var(--ink)' }}>
              本日の車両状態
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 2 }}>
              各車両の当日ステータスとメモを編集。整備中・休車の車両は配車組で警告されます。
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            aria-label="閉じる"
          >
            <X size={13} />
          </button>
        </div>

        {/* 凡例 */}
        <div style={{ padding: '10px 22px', borderBottom: '1px solid var(--line)', background: 'var(--bg)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {DAY_STATUSES.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
              <span style={{
                width: 9, height: 9, borderRadius: '50%',
                background: s.color, border: '1.5px solid #fff',
                boxShadow: `0 0 0 1px ${s.color}`,
              }} />
              <span style={{ fontWeight: 700, color: s.color }}>{s.label}</span>
              <span style={{ color: 'var(--ink-muted)' }}>— {s.desc}</span>
            </div>
          ))}
        </div>

        {/* Conflicts warning */}
        {conflicts.length > 0 && (
          <div style={{
            padding: '10px 22px', borderBottom: '1px solid var(--line)',
            background: 'var(--danger-soft)',
            display: 'flex', alignItems: 'center', gap: 10, fontSize: 11.5,
          }}>
            <AlertTriangle size={13} color="var(--danger)" />
            <span style={{ fontWeight: 700, color: 'var(--danger)' }}>
              配車済み車両 {conflicts.length}台 が使用不可
            </span>
            <span style={{ color: 'var(--ink-soft)' }}>
              {conflicts.map(v => v.name).join('、')}
              を使用している便があります。配車組表で別車両に切り替えてください。
            </span>
          </div>
        )}

        {/* 車両リスト */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 14px 20px' }}>
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: 36 }}></th>
                <th>車両</th>
                <th style={{ width: 90 }}>定員</th>
                <th style={{ width: 90 }}>使用便数</th>
                <th style={{ width: 200 }}>当日ステータス</th>
                <th>メモ</th>
              </tr>
            </thead>
            <tbody>
              {VEHICLES.map(v => {
                const entry = vehicleStatus[v.id] || { status: 'active', note: '' }
                const status = DAY_STATUS_BY_ID[entry.status] || DAY_STATUSES[0]
                const usage = vehicleUsage[v.id] || []
                const isUnavailable = !canUseVehicle(entry)
                const isConflict = isUnavailable && usage.length > 0
                return (
                  <tr key={v.id} style={{
                    background: isConflict ? 'var(--danger-soft)' : 'transparent',
                  }}>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        width: 10, height: 10, borderRadius: 3,
                        background: v.color,
                      }} />
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: 12.5 }}>{v.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>
                        {v.plate}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--ink-muted)', marginTop: 2 }}>
                        運転: {v.driver}
                      </div>
                    </td>
                    <td>
                      <span className="num" style={{ fontWeight: 700 }}>{v.capacity}</span>
                      <span style={{ fontSize: 10, color: 'var(--ink-muted)' }}> 名</span>
                    </td>
                    <td>
                      {usage.length === 0 ? (
                        <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>—</span>
                      ) : (
                        <div>
                          <span className="num" style={{
                            fontWeight: 700,
                            color: isConflict ? 'var(--danger)' : 'var(--accent)',
                          }}>
                            {usage.length}
                          </span>
                          <span style={{ fontSize: 10, color: 'var(--ink-muted)' }}> 便</span>
                          <div style={{ fontSize: 9.5, color: 'var(--ink-muted)', marginTop: 2 }}>
                            {usage.map(u => `${u.facilityShort}#${u.tripNo}`).join(' · ')}
                          </div>
                        </div>
                      )}
                    </td>
                    <td>
                      <select
                        value={entry.status}
                        onChange={e => updateStatus(v.id, 'status', e.target.value)}
                        style={{
                          width: '100%', fontSize: 12, padding: '6px 10px',
                          fontWeight: 700,
                          background: status.color + '18',
                          color: status.color,
                          border: `1.5px solid ${status.color}55`,
                          borderRadius: 8,
                        }}
                      >
                        {DAY_STATUSES.map(s => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={entry.note || ''}
                        onChange={e => updateStatus(v.id, 'note', e.target.value)}
                        placeholder={
                          entry.status === 'maintenance' ? '例: 定期点検（15:00再始動予定）'
                          : entry.status === 'substitute' ? '例: 代車レンタルA'
                          : entry.status === 'off'        ? '例: ドライバー休暇'
                          : '（任意）'
                        }
                        style={{ width: '100%', fontSize: 12 }}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* フッタ */}
        <div style={{
          padding: '12px 22px', borderTop: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--surface-soft)',
        }}>
          <div style={{ fontSize: 11, color: 'var(--ink-muted)', flex: 1 }}>
            変更は即時反映されます。送迎確定後も編集可能。
          </div>
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            <CheckCircle2 size={12} /> 完了
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 児童 当日状態 編集モーダル（児童カードをクリックで開く）
// ═══════════════════════════════════════════════════════════════
function ChildDayStatusModal({ childId, childDayStatus, setChildDayStatus, onClose }) {
  const child = CHILD_BY_ID[childId]
  const current = childDayStatus[childId] || { status: 'present', note: '' }
  const [status, setStatus] = useState(current.status)
  const [note, setNote] = useState(current.note || '')

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const save = () => {
    setChildDayStatus(prev => {
      const next = { ...prev }
      // 通常+メモ空なら削除
      if (status === 'present' && !note.trim()) {
        delete next[childId]
      } else {
        next[childId] = { status, note: note.trim() }
      }
      return next
    })
    onClose()
  }
  const clear = () => {
    setChildDayStatus(prev => {
      const next = { ...prev }
      delete next[childId]
      return next
    })
    onClose()
  }

  if (!child) return null

  const loc = LOC_BY_ID[child.pickupLoc] || LOC_BY_ID[child.school]
  const facility = FACILITY_BY_ID[child.facility]

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(28, 30, 38, 0.55)',
        backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, animation: 'fadeIn 0.18s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          width: 'min(520px, 96vw)',
          maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}
      >
        {/* ヘッダ */}
        <div style={{
          padding: '16px 22px', borderBottom: '1px solid var(--line)',
          background: 'var(--surface-soft)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: `linear-gradient(135deg,var(--rb-orange),var(--rb-pink))`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 14,
            fontFamily: 'var(--font-display)',
          }}>
            {child.name?.[0] || '児'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
              {child.name}
              <span style={{ fontSize: 10.5, color: 'var(--ink-muted)', fontWeight: 500, marginLeft: 8 }}>
                {child.grade}
              </span>
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-muted)', marginTop: 2 }}>
              {facility?.short} · {loc?.name || '—'} · 下校 {loc?.time || '—'}
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" aria-label="閉じる">
            <X size={13} />
          </button>
        </div>

        {/* コンテンツ */}
        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* ステータス選択 */}
          <div>
            <div style={{
              fontSize: 10.5, fontWeight: 700, color: 'var(--ink-muted)',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              本日の状態
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {CHILD_DAY_STATUSES.map(s => {
                const active = status === s.id
                return (
                  <button
                    key={s.id}
                    onClick={() => setStatus(s.id)}
                    style={{
                      padding: '10px 4px',
                      borderRadius: 8,
                      border: `1.5px solid ${active ? s.color : 'var(--line)'}`,
                      background: active ? `${s.color}18` : 'var(--surface)',
                      color: active ? s.color : 'var(--ink-soft)',
                      fontWeight: active ? 800 : 600,
                      fontSize: 12,
                      cursor: 'pointer',
                      transition: 'all 0.1s',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: 4,
                    }}
                  >
                    <span style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: s.color,
                      boxShadow: active ? `0 0 0 3px ${s.color}30` : 'none',
                    }} />
                    {s.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* メモ */}
          <div>
            <div style={{
              fontSize: 10.5, fontWeight: 700, color: 'var(--ink-muted)',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              marginBottom: 8,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              申し送り・メモ
              <span style={{ color: 'var(--ink-faint)', fontSize: 9.5, fontWeight: 500, letterSpacing: 0, textTransform: 'none' }}>
                （例: 「親の迎え予定」「薬の確認」「本日は別の事業所へ」など）
              </span>
            </div>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={
                status === 'absent' ? '欠席理由（任意）'
                : status === 'leave_early' ? '例: 16:30 保護者迎え / 早退理由'
                : status === 'late' ? '例: 病院後 15:30 合流'
                : '本日の特記事項があれば記入'
              }
              rows={4}
              style={{
                width: '100%',
                fontSize: 13,
                fontFamily: 'var(--font-body)',
                resize: 'vertical',
              }}
            />
          </div>

          {/* プレビュー */}
          {(status !== 'present' || note.trim()) && (
            <div style={{
              padding: '10px 12px',
              background: 'var(--bg)',
              borderRadius: 8,
              borderLeft: `3px solid ${CHILD_DAY_STATUS_BY_ID[status]?.color || 'var(--ink-faint)'}`,
              fontSize: 11.5,
            }}>
              <div style={{ fontSize: 9.5, color: 'var(--ink-muted)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                プレビュー
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: note.trim() ? 4 : 0 }}>
                <span style={{
                  fontSize: 8.5, fontWeight: 800,
                  color: '#fff',
                  background: CHILD_DAY_STATUS_BY_ID[status]?.color,
                  padding: '1px 5px', borderRadius: 3,
                }}>
                  {CHILD_DAY_STATUS_BY_ID[status]?.short}
                </span>
                <span style={{ fontWeight: 700 }}>{child.name}</span>
              </div>
              {note.trim() && (
                <div style={{ color: 'var(--ink-soft)', fontSize: 11 }}>{note}</div>
              )}
            </div>
          )}
        </div>

        {/* フッタ */}
        <div style={{
          padding: '12px 22px', borderTop: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--surface-soft)',
        }}>
          <button
            onClick={clear}
            className="btn btn-ghost btn-sm"
            disabled={!childDayStatus[childId]}
            style={{ color: 'var(--danger)' }}
          >
            <X size={11} /> クリア
          </button>
          <div style={{ flex: 1 }} />
          <button onClick={onClose} className="btn btn-ghost btn-sm">キャンセル</button>
          <button onClick={save} className="btn btn-primary btn-sm">
            <CheckCircle2 size={12} /> 保存
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 車両クイック編集モーダル（車両ボタン横の🔧から開く）
// ═══════════════════════════════════════════════════════════════
function VehicleQuickEditModal({ vehicleId, vehicleStatus, setVehicleStatus, assignments, onClose }) {
  const vehicle = VEHICLE_BY_ID[vehicleId]
  const current = vehicleStatus[vehicleId] || { status: 'active', note: '' }
  const [status, setStatus] = useState(current.status)
  const [note, setNote] = useState(current.note || '')

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // この車両が何便に使われているか
  const usage = []
  assignments?.facilityBlocks?.forEach(block => {
    block.trips.forEach(trip => {
      if (trip.vehicle === vehicleId) {
        usage.push({
          facilityShort: FACILITY_BY_ID[block.facility]?.short || block.facility,
          tripNo: trip.tripNo,
          childCount: trip.childIds.length,
        })
      }
    })
  })

  const save = () => {
    setVehicleStatus(prev => ({ ...prev, [vehicleId]: { status, note: note.trim() } }))
    onClose()
  }

  if (!vehicle) return null
  const willBeUnavailable = !canUseVehicle({ status })

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(28, 30, 38, 0.55)',
        backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, animation: 'fadeIn 0.18s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          width: 'min(500px, 96vw)',
          display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}
      >
        <div style={{
          padding: '16px 22px', borderBottom: '1px solid var(--line)',
          background: 'var(--surface-soft)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: vehicle.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff',
          }}>
            <Car size={17} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
              {vehicle.name}
              <span style={{ fontSize: 10.5, color: 'var(--ink-muted)', fontWeight: 500, marginLeft: 8 }}>
                定員 {vehicle.capacity}名
              </span>
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
              {vehicle.plate} · 運転 {vehicle.driver}
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" aria-label="閉じる">
            <X size={13} />
          </button>
        </div>

        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 使用中便の表示 */}
          {usage.length > 0 && (
            <div style={{
              padding: '8px 12px',
              background: 'var(--bg)',
              borderRadius: 8,
              fontSize: 11,
              borderLeft: '3px solid var(--accent)',
            }}>
              <span style={{ fontWeight: 700, color: 'var(--ink-soft)' }}>
                本日 <span className="num" style={{ color: 'var(--accent)' }}>{usage.length}</span> 便で使用中:
              </span>{' '}
              <span style={{ color: 'var(--ink-muted)' }}>
                {usage.map(u => `${u.facilityShort}#${u.tripNo}（${u.childCount}名）`).join(' · ')}
              </span>
            </div>
          )}

          <div>
            <div style={{
              fontSize: 10.5, fontWeight: 700, color: 'var(--ink-muted)',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              当日ステータス
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {DAY_STATUSES.map(s => {
                const active = status === s.id
                return (
                  <button
                    key={s.id}
                    onClick={() => setStatus(s.id)}
                    title={s.desc}
                    style={{
                      padding: '10px 4px',
                      borderRadius: 8,
                      border: `1.5px solid ${active ? s.color : 'var(--line)'}`,
                      background: active ? `${s.color}18` : 'var(--surface)',
                      color: active ? s.color : 'var(--ink-soft)',
                      fontWeight: active ? 800 : 600,
                      fontSize: 12,
                      cursor: 'pointer',
                      transition: 'all 0.1s',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: 4,
                    }}
                  >
                    <span style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: s.color,
                      boxShadow: active ? `0 0 0 3px ${s.color}30` : 'none',
                    }} />
                    {s.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <div style={{
              fontSize: 10.5, fontWeight: 700, color: 'var(--ink-muted)',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              メモ
            </div>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={
                status === 'maintenance' ? '例: 定期点検（15:00再始動予定）'
                : status === 'substitute' ? '例: 代車レンタル使用中'
                : status === 'off' ? '例: ドライバー休暇'
                : '（任意）'
              }
              style={{ width: '100%', fontSize: 13 }}
            />
          </div>

          {/* 警告 */}
          {willBeUnavailable && usage.length > 0 && (
            <div style={{
              padding: '8px 12px',
              background: 'var(--danger-soft)',
              borderLeft: '3px solid var(--danger)',
              borderRadius: 6,
              fontSize: 11,
              color: 'var(--danger)',
              fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <AlertTriangle size={13} />
              <span>この車両を使用不可にすると、配車済みの {usage.length} 便が実行できなくなります。</span>
            </div>
          )}
        </div>

        <div style={{
          padding: '12px 22px', borderTop: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--surface-soft)',
        }}>
          <div style={{ flex: 1 }} />
          <button onClick={onClose} className="btn btn-ghost btn-sm">キャンセル</button>
          <button onClick={save} className="btn btn-primary btn-sm">
            <CheckCircle2 size={12} /> 保存
          </button>
        </div>
      </div>
    </div>
  )
}
