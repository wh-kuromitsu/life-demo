// フラグシップ画面：ルート最適化
// 3ステップ構成:
//   STEP 1: 条件設定（日付・方向・制約）
//   STEP 2: シミュレーション実行（Pattern A/B 並列）
//   STEP 3: 結果採用 & Googleマップ連携
//
// 目玉:
// - 大きなSVG地図（春日井エリア）
// - Pattern A/B 並列比較（OR-Tools VRP vs ヒューリスティック）
// - 未配置者パネル（松浦先生認知モデル）
// - 制約チップ（支援時間1h35m / 18:30退勤 / 国道NG / 同乗NG / 性別配慮）
// - Google Maps ナビ連携

import { useState, useMemo } from 'react'
import {
  Zap, Play, MapPin, Clock, AlertTriangle, Shield, Users, Car,
  RefreshCw, ChevronRight, CheckCircle2, X, Download, Map, Navigation,
  Sliders, FlaskConical, Hash, Route, Eye
} from 'lucide-react'
import KasugaiMap from '../components/KasugaiMap'
import UnassignedPanel from '../components/UnassignedPanel'
import { CHILDREN, CHILD_BY_ID } from '../data/childrenData'
import { VEHICLES, VEHICLE_BY_ID } from '../data/vehiclesData'
import { SIMULATION_A, SIMULATION_B, BASE } from '../data/routesData'
import { FACILITY_BY_ID } from '../data/facilitiesData'
import { LOC_BY_ID } from '../data/schoolsData'

const TODAY = new Date()
const isoDate = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

const CONSTRAINTS = [
  { id: 'supportTime', label: '支援時間1h35m以上', req: true, desc: '補助金要件のMUST制約' },
  { id: 'endTime',     label: '18:30までに職員退勤', req: true, desc: '職員退勤時刻' },
  { id: 'returnTime',  label: '19:30までに帰着',     req: true, desc: '代表推奨条件' },
  { id: 'noHighway',   label: '国道をまたがない',     req: false, desc: '渋滞回避' },
  { id: 'noMixedSex',  label: '性別配慮',             req: false, desc: '異性ペアを避ける' },
  { id: 'ngPair',      label: '同乗NGペア分離',        req: true, desc: '児童間の相性制約' },
  { id: 'crossFac',    label: '施設横断送迎',          req: false, desc: '法人内の合同送迎' },
]

export default function RouteOptimize({ facilityId, setPage }) {
  const [step, setStep] = useState(1)
  const [date, setDate] = useState(isoDate(TODAY))
  const [direction, setDirection] = useState('pickup')
  const [activeConstraints, setActiveConstraints] = useState(['supportTime','endTime','returnTime','noHighway','ngPair'])
  const [includeCrossOrg, setIncludeCrossOrg] = useState(true)
  const [excludedIds, setExcludedIds] = useState(['c25']) // イレギュラー児童はデフォで除外

  // Step 2 state
  const [calculating, setCalculating] = useState(false)
  const [selectedPattern, setSelectedPattern] = useState(null) // 'A' | 'B'
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [highlightChildId, setHighlightChildId] = useState(null)

  const transportChildren = useMemo(() =>
    CHILDREN.filter(c =>
      c.transport &&
      c.status === 'active' &&
      !excludedIds.includes(c.id) &&
      (facilityId === 'all' || c.facility === facilityId)
    ),
  [facilityId, excludedIds])

  const toggleConstraint = (id) => setActiveConstraints(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  const toggleExclude = (id) => setExcludedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const runSimulation = () => {
    setCalculating(true)
    setTimeout(() => {
      setCalculating(false)
      setStep(2)
    }, 1400)
  }

  const adoptPattern = (pat) => {
    setSelectedPattern(pat)
    setStep(3)
  }

  return (
    <div>
      <PageHead step={step} setStep={setStep} />

      {/* Step 1: Conditions */}
      {step === 1 && (
        <Step1
          date={date} setDate={setDate}
          direction={direction} setDirection={setDirection}
          activeConstraints={activeConstraints} toggleConstraint={toggleConstraint}
          includeCrossOrg={includeCrossOrg} setIncludeCrossOrg={setIncludeCrossOrg}
          excludedIds={excludedIds} toggleExclude={toggleExclude}
          transportChildren={transportChildren}
          calculating={calculating}
          runSimulation={runSimulation}
        />
      )}

      {/* Step 2: Simulation results */}
      {step === 2 && (
        <Step2
          date={date} direction={direction}
          adoptPattern={adoptPattern}
          selectedVehicle={selectedVehicle} setSelectedVehicle={setSelectedVehicle}
          highlightChildId={highlightChildId} setHighlightChildId={setHighlightChildId}
        />
      )}

      {/* Step 3: Adopted */}
      {step === 3 && (
        <Step3
          pattern={selectedPattern}
          date={date} direction={direction}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// PAGE HEAD
// ─────────────────────────────────────────────
function PageHead({ step, setStep }) {
  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Core Operation · Flagship</div>
          <h1 className="page-title">送迎ルート最適化</h1>
          <p className="page-sub">
            支援時間・退勤時刻・国道・同乗配慮・性別分離などの制約下で、OR-Tools VRPと近傍ヒューリスティックを並列実行。
            松浦先生の認知モデル（未配置者パネル）で手動調整も可能。
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button className="btn btn-ghost btn-sm">
            <Download size={12} /> 過去の実行履歴
          </button>
        </div>
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
        {[
          { n: 1, label: '条件設定', desc: '児童・制約・除外' },
          { n: 2, label: 'シミュレーション', desc: 'Pattern A / B 比較' },
          { n: 3, label: '確定・ナビ連携', desc: '採用 & 配布' },
        ].map((s, i, arr) => {
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

// ─────────────────────────────────────────────
// STEP 1: Conditions
// ─────────────────────────────────────────────
function Step1({
  date, setDate, direction, setDirection,
  activeConstraints, toggleConstraint,
  includeCrossOrg, setIncludeCrossOrg,
  excludedIds, toggleExclude,
  transportChildren, calculating, runSimulation,
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
      {/* Left: main configuration */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Basic */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">基本設定</div>
            <span className="eyebrow">STEP 1 / 3</span>
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
            <Field label="学校カレンダー">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0' }}>
                <span className="pill pill-sage">登校日</span>
                <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>→ 学校送迎を自動選択</span>
              </div>
            </Field>
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
                （イレギュラー・保護者送迎・契約外を除外）
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

      {/* Right: summary + action */}
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
              onClick={runSimulation}
              disabled={calculating}
              className="btn btn-primary"
              style={{ width: '100%', padding: '13px', fontSize: 14, background: calculating ? 'var(--ink-muted)' : 'var(--accent)', justifyContent: 'center' }}
            >
              {calculating ? (
                <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> 計算中...</>
              ) : (
                <><Zap size={15} /> 最適化を実行</>
              )}
            </button>
            {calculating && (
              <div style={{ marginTop: 14, fontSize: 11, color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-mono)', lineHeight: 1.7 }}>
                <div>→ Pattern A: OR-Tools VRP ソルバー</div>
                <div>→ Pattern B: K-Means + 最近傍法</div>
                <div>→ 制約充足チェック中...</div>
              </div>
            )}
          </div>
        </div>

        <div className="surface" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <FlaskConical size={13} color="var(--accent)" />
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              比較実行
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-muted)', lineHeight: 1.65 }}>
            Pattern A (完全自動) と Pattern B (ヒューリスティック + 手動調整) を同時に実行。採用前に両案を見比べて判断できます。
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// STEP 2: Simulation Comparison
// ─────────────────────────────────────────────
function Step2({ date, direction, adoptPattern, selectedVehicle, setSelectedVehicle, highlightChildId, setHighlightChildId }) {
  const [activePattern, setActivePattern] = useState('A')
  const [showUnassigned, setShowUnassigned] = useState(false)

  const current = activePattern === 'A' ? SIMULATION_A : SIMULATION_B

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
      {/* Left: Map + route details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Pattern switcher */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <PatternCard
            label="Pattern A"
            algo="OR-Tools VRP"
            sim={SIMULATION_A}
            active={activePattern === 'A'}
            onClick={() => setActivePattern('A')}
            recommended={true}
          />
          <PatternCard
            label="Pattern B"
            algo="K-Means + 近傍法"
            sim={SIMULATION_B}
            active={activePattern === 'B'}
            onClick={() => setActivePattern('B')}
          />
        </div>

        {/* Map */}
        <div className="panel" style={{ padding: 0 }}>
          <div className="panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="panel-title">ルート地図</div>
              <div className="seg" style={{ fontSize: 10 }}>
                <button className="active">全車両</button>
                <button>車両別</button>
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-muted)', display: 'flex', gap: 12 }}>
              <span><span className="num">{current.routes.length}</span> 便</span>
              <span>総距離 <span className="num">{current.totalDistance}km</span></span>
              <span>総所要 <span className="num">{current.totalTime}分</span></span>
            </div>
          </div>
          <div style={{ height: 440 }}>
            <KasugaiMap
              routes={current.routes}
              selectedVehicle={selectedVehicle}
              onSelectVehicle={setSelectedVehicle}
              highlightChildren={highlightChildId ? [highlightChildId] : []}
            />
          </div>
        </div>

        {/* Route details per vehicle */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">車両別ルート詳細</div>
            {selectedVehicle && (
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedVehicle(null)}>
                <X size={11} /> 選択解除
              </button>
            )}
          </div>
          <div>
            {current.routes.map(r => (
              <VehicleRouteRow
                key={r.vehicle}
                route={r}
                selected={selectedVehicle === r.vehicle}
                onSelect={() => setSelectedVehicle(r.vehicle === selectedVehicle ? null : r.vehicle)}
                onHighlightChild={setHighlightChildId}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right: Unassigned + Adopt */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 20, alignSelf: 'flex-start' }}>
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">未配置者パネル</div>
            <span className="eyebrow" style={{ fontSize: 9 }}>松浦モデル</span>
          </div>
          <UnassignedPanel
            unassignedIds={current.unassignedChildIds || []}
            onSelectChild={setHighlightChildId}
            selectedChildId={highlightChildId}
          />
        </div>

        <div className="surface" style={{ padding: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>制約の充足状況</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {Object.entries(current.constraints).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                {v ? <CheckCircle2 size={11} color="var(--sage)" /> : <X size={11} color="var(--amber)" />}
                <span style={{ color: v ? 'var(--ink)' : 'var(--amber)' }}>
                  {constraintLabel(k)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => adoptPattern(activePattern)}
          className="btn btn-primary"
          style={{ width: '100%', padding: '12px', justifyContent: 'center', fontSize: 14 }}
        >
          Pattern {activePattern} を採用する <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}

function constraintLabel(key) {
  const m = {
    timeWindow: '時間枠制約', capacity: '車両定員', ng: '同乗NG', gender: '性別配慮', crossFacility: '施設横断',
  }
  return m[key] || key
}

function PatternCard({ label, algo, sim, active, onClick, recommended }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '16px 18px', textAlign: 'left',
        background: active ? 'var(--surface)' : 'var(--bg-deep)',
        border: active ? '1.5px solid var(--accent)' : '1px solid var(--line)',
        borderRadius: 'var(--radius)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        position: 'relative',
      }}
    >
      {recommended && (
        <span style={{
          position: 'absolute', top: 10, right: 10,
          background: 'var(--sage)', color: '#fff',
          fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
          padding: '2px 7px', borderRadius: 3, textTransform: 'uppercase',
        }}>推奨</span>
      )}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
        <span className="display" style={{ fontSize: 20, color: active ? 'var(--accent)' : 'var(--ink)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-muted)' }}>{algo}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 12 }}>
        <MiniStat label="所要" value={sim.totalTime} suf="分" />
        <MiniStat label="距離" value={sim.totalDistance} suf="km" />
        <MiniStat label="未配置" value={sim.unassigned} suf="名" warn={sim.unassigned > 0} />
      </div>
    </button>
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

function VehicleRouteRow({ route, selected, onSelect, onHighlightChild }) {
  const v = VEHICLE_BY_ID[route.vehicle]
  const childStops = route.stops.filter(s => s.childId)

  return (
    <div style={{ borderBottom: '1px solid var(--line-soft)' }}>
      <div
        onClick={onSelect}
        style={{
          padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
          cursor: 'pointer', background: selected ? 'var(--bg)' : 'transparent',
          borderLeft: selected ? `3px solid ${route.color}` : '3px solid transparent',
        }}
        onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'var(--surface-soft)' }}
        onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent' }}
      >
        <span style={{ width: 4, height: 30, borderRadius: 2, background: route.color, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            {v?.name}
            <span style={{ fontSize: 10, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>{v?.plate}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 2 }}>
            {v?.driver} · 定員{v?.capacity} · {childStops.length}名乗車
          </div>
        </div>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', textAlign: 'right' }}>
          <div>{route.stops[0]?.time} → {route.stops[route.stops.length - 1]?.time}</div>
          <div style={{ color: 'var(--ink-muted)', fontSize: 10 }}>stops {route.stops.length}</div>
        </div>
        <ChevronRight size={14} color="var(--ink-muted)" style={{ transform: selected ? 'rotate(90deg)' : '', transition: 'transform 0.2s' }} />
      </div>

      {selected && (
        <div style={{ padding: '6px 20px 14px 40px', background: 'var(--surface-soft)' }}>
          {route.stops.map((s, i) => {
            const child = s.childId ? CHILD_BY_ID[s.childId] : null
            const isBase = s.kind === 'depart' || s.kind === 'arrive'
            return (
              <div
                key={i}
                onMouseEnter={() => s.childId && onHighlightChild(s.childId)}
                onMouseLeave={() => onHighlightChild(null)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', fontSize: 12 }}
              >
                <div style={{ width: 20, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-muted)' }}>
                  {isBase ? '●' : i}
                </div>
                <span className="num" style={{ fontSize: 11, color: route.color, fontWeight: 600, width: 40 }}>{s.time}</span>
                <span style={{ flex: 1, fontWeight: isBase ? 400 : 600, color: isBase ? 'var(--ink-muted)' : 'var(--ink)' }}>
                  {isBase ? (s.kind === 'depart' ? '出発 ' : '帰着 ') + BASE.name : child?.name}
                </span>
                {child && (
                  <span style={{ fontSize: 10, color: 'var(--ink-muted)' }}>
                    {LOC_BY_ID[s.schoolId]?.name || child.address}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// STEP 3: Adopted / Navigate
// ─────────────────────────────────────────────
function Step3({ pattern, date, direction }) {
  const sim = pattern === 'A' ? SIMULATION_A : SIMULATION_B

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="panel" style={{ background: 'var(--sage-soft)', borderColor: 'var(--sage)' }}>
          <div style={{ padding: 22, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--sage)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={22} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div className="display" style={{ fontSize: 16, color: 'var(--sage)' }}>Pattern {pattern} を採用しました</div>
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

        <div className="panel" style={{ padding: 0 }}>
          <div className="panel-header">
            <div className="panel-title">ドライバー配布用カード</div>
            <button className="btn btn-sage btn-sm"><Map size={11} /> Google Maps で全便開く</button>
          </div>
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {sim.routes.map(r => {
              const v = VEHICLE_BY_ID[r.vehicle]
              const stops = r.stops.filter(s => s.childId)
              return (
                <div key={r.vehicle} style={{ border: `1.5px solid ${r.color}`, borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                  <div style={{ padding: '10px 14px', background: r.color, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{v?.name}</div>
                    <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.85 }}>{v?.plate}</div>
                  </div>
                  <div style={{ padding: '10px 14px' }}>
                    <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginBottom: 6 }}>
                      {v?.driver} · {stops.length}名
                    </div>
                    {stops.map((s, i) => {
                      const child = CHILD_BY_ID[s.childId]
                      return (
                        <div key={i} style={{ display: 'flex', gap: 8, padding: '4px 0', fontSize: 12 }}>
                          <span style={{ color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)', width: 36, fontSize: 11 }}>{s.time}</span>
                          <span style={{ fontWeight: 600 }}>{child?.name}</span>
                          <span style={{ marginLeft: 'auto', color: 'var(--ink-muted)', fontSize: 10 }}>{LOC_BY_ID[s.schoolId]?.name?.replace('小学校', '小').replace('中学校', '中') || ''}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ padding: '8px 14px', background: 'var(--surface-soft)', borderTop: '1px solid var(--line)' }}>
                    <a
                      href={googleMapsUrl(r)}
                      target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Navigation size={11} /> Google Mapsでナビ開始
                    </a>
                  </div>
                </div>
              )
            })}
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

        <div className="surface" style={{ padding: 18 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>実行サマリー</div>
          <dl style={{ display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 8, columnGap: 16, fontSize: 12 }}>
            <dt style={{ color: 'var(--ink-muted)' }}>使用アルゴリズム</dt>
            <dd style={{ fontWeight: 600 }}>{sim.label}</dd>
            <dt style={{ color: 'var(--ink-muted)' }}>便数</dt>
            <dd className="num">{sim.routes.length}</dd>
            <dt style={{ color: 'var(--ink-muted)' }}>総距離</dt>
            <dd className="num">{sim.totalDistance}km</dd>
            <dt style={{ color: 'var(--ink-muted)' }}>総所要</dt>
            <dd className="num">{sim.totalTime}分</dd>
            <dt style={{ color: 'var(--ink-muted)' }}>未配置</dt>
            <dd className="num" style={{ color: sim.unassigned > 0 ? 'var(--amber)' : 'var(--sage)' }}>{sim.unassigned}</dd>
          </dl>
        </div>
      </div>
    </div>
  )
}

function googleMapsUrl(route) {
  const points = route.stops.map(s => {
    if (s.x != null) return `${s.x},${s.y}`
    const loc = LOC_BY_ID[s.schoolId]
    return loc?.name || ''
  }).filter(Boolean)
  if (points.length < 2) return '#'
  const origin = encodeURIComponent(points[0])
  const dest = encodeURIComponent(points[points.length - 1])
  const waypoints = points.slice(1, -1).map(encodeURIComponent).join('|')
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}${waypoints ? `&waypoints=${waypoints}` : ''}&travelmode=driving`
}

// ─── utilities ───
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
