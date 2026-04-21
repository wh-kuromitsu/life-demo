// ダッシュボード - 本日の全体俯瞰
// 岸代表が朝イチで確認する想定のサマリー画面

import { Users, Car, AlertTriangle, CheckCircle2, TrendingUp, Clock, ArrowRight, ArrowUpRight } from 'lucide-react'
import { CHILDREN } from '../data/childrenData'
import { FACILITIES, FACILITY_BY_ID } from '../data/facilitiesData'
import { VEHICLES } from '../data/vehiclesData'
import { SIMULATION_A, TODAY_TRIPS, RECENT_ACTIVITY } from '../data/routesData'

export default function Dashboard({ facilityId, setPage }) {
  const isAll = facilityId === 'all'
  const scoped = isAll ? CHILDREN : CHILDREN.filter(c => c.facility === facilityId)
  const transportToday = scoped.filter(c => c.transport && c.status === 'active')
  const kisho = FACILITIES.filter(f => f.service === '児発')
  const houday = FACILITIES.filter(f => f.service === '放デイ')

  // 施設別利用者数の集計
  const byFacility = FACILITIES.map(f => ({
    ...f,
    count: CHILDREN.filter(c => c.facility === f.id).length,
    transport: CHILDREN.filter(c => c.facility === f.id && c.transport).length,
  }))

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Today · {new Date().toLocaleDateString('ja-JP', { weekday: 'long' })}</div>
          <h1 className="page-title">ダッシュボード</h1>
          <p className="page-sub">
            本日の送迎・利用者・HUG連携状況を俯瞰。詳細は各画面へ移動してください。
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm">週次レポート</button>
          <button className="btn btn-solid-ink btn-sm">月次エクスポート</button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <KPI icon={<Users size={18} />} label="利用児童" value={scoped.length} sub={isAll ? '2法人13事業所' : FACILITY_BY_ID[facilityId]?.name} accent="var(--accent)" />
        <KPI icon={<Car size={18} />} label="本日送迎" value={transportToday.length} sub={`${VEHICLES.length}台稼働`} accent="var(--sage)" />
        <KPI icon={<Clock size={18} />} label="便数" value={SIMULATION_A.routes.length} sub={`総 ${SIMULATION_A.totalTime}分`} accent="#6b4a8b" />
        <KPI icon={<AlertTriangle size={18} />} label="インシデント" value={0} sub="本日 異常なし" accent="var(--ink-muted)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Today's trips */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">本日の送迎便</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage('transport')}>送迎管理へ <ArrowRight size={11} /></button>
            </div>
            <div>
              {TODAY_TRIPS.map(t => <TripRow key={t.id} trip={t} />)}
            </div>
          </div>

          {/* Facility breakdown (only for "すべて") */}
          {isAll && (
            <div className="panel">
              <div className="panel-header">
                <div>
                  <div className="panel-title">施設別 利用児童数</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 2 }}>2法人13事業所の内訳</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setPage('facility')}>施設管理へ <ArrowRight size={11} /></button>
              </div>
              <div style={{ padding: '14px 20px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', color: 'var(--ink-muted)', marginBottom: 8, textTransform: 'uppercase' }}>
                  放課後等デイサービス · {houday.length}事業所
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 18 }}>
                  {byFacility.filter(f => f.service === '放デイ').map(f => (
                    <FacilityMini key={f.id} f={f} />
                  ))}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', color: 'var(--ink-muted)', marginBottom: 8, textTransform: 'uppercase' }}>
                  児童発達支援 · {kisho.length}事業所 / その他
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {byFacility.filter(f => f.service !== '放デイ').map(f => (
                    <FacilityMini key={f.id} f={f} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Quick actions */}
          <div className="panel" style={{ background: 'var(--ink)', color: '#fff', borderColor: 'var(--ink)' }}>
            <div style={{ padding: 20 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>
                Quick Action
              </div>
              <button onClick={() => setPage('route')} style={{
                width: '100%', padding: '14px 16px', background: 'var(--accent)', color: '#fff',
                borderRadius: 8, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12,
                fontWeight: 600, fontSize: 14, transition: 'filter 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.08)'}
                onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
              >
                <span style={{ fontSize: 22 }}>⚡</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14 }}>今日のルート最適化</div>
                  <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 400, marginTop: 2 }}>Pattern A/B を実行して確定する</div>
                </div>
                <ArrowUpRight size={16} />
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 12 }}>
                <QuickAction label="入退室を記録" onClick={() => setPage('attendance')} />
                <QuickAction label="個別支援計画" onClick={() => setPage('support')} />
                <QuickAction label="HUG連携ステータス" onClick={() => setPage('hug')} />
              </div>
            </div>
          </div>

          {/* Recent activity */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">最近のアクティビティ</div>
              <button className="btn btn-ghost btn-sm">すべて <ArrowRight size={11} /></button>
            </div>
            <div style={{ padding: '6px 0' }}>
              {RECENT_ACTIVITY.map((a, i) => <ActivityRow key={i} activity={a} />)}
            </div>
          </div>

          {/* HUG sync status */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">HUG連携</div>
              <span className="pill pill-sage">正常</span>
            </div>
            <div style={{ padding: '14px 20px', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 10, fontSize: 12 }}>
              <span style={{ color: 'var(--ink-muted)' }}>最終同期</span>
              <span className="num">08:30 today</span>
              <span style={{ color: 'var(--ink-muted)' }}>次回同期</span>
              <span className="num">20:00 today</span>
              <span style={{ color: 'var(--ink-muted)' }}>児童データ</span>
              <span className="num">819件</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function KPI({ icon, label, value, sub, accent }) {
  return (
    <div className="stat">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="stat-label">{label}</div>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: accent + '18', color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
      </div>
      <div>
        <div className="stat-value num">{value}</div>
        <div className="stat-sub">{sub}</div>
      </div>
    </div>
  )
}

function TripRow({ trip }) {
  const statusStyle = {
    done: { bg: 'var(--sage-soft)', color: 'var(--sage)', label: '完了' },
    in_progress: { bg: 'var(--amber-soft)', color: 'var(--amber)', label: '運行中' },
    pending: { bg: 'var(--bg-deep)', color: 'var(--ink-muted)', label: '待機' },
  }[trip.status]

  return (
    <div style={{ padding: '13px 20px', borderBottom: '1px solid var(--line-soft)', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 36, fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>
        {trip.leg}<span style={{ fontSize: 10, color: 'var(--ink-muted)', marginLeft: 1 }}>便</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>
          {trip.direction === 'pickup' ? '迎え便' : '送り便'} · {trip.departAt}発
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 2 }}>
          {trip.stops.filter(s => s.childId).length}名乗車 · {trip.stops.length}停車
        </div>
      </div>
      <span className="pill" style={{ background: statusStyle.bg, color: statusStyle.color }}>
        {statusStyle.label}
      </span>
    </div>
  )
}

function FacilityMini({ f }) {
  return (
    <div style={{ padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 8, background: 'var(--surface)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ width: 6, height: 6, borderRadius: 1.5, background: f.color }} />
        <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{f.short}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
        <span className="num" style={{ fontSize: 18, fontWeight: 700 }}>{f.count}</span>
        <span style={{ fontSize: 9, color: 'var(--ink-muted)' }}>名 / 送迎 {f.transport}</span>
      </div>
    </div>
  )
}

function QuickAction({ label, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)',
      color: 'rgba(255,255,255,0.85)', borderRadius: 6, textAlign: 'left',
      fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8,
      transition: 'background 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
    >
      <span style={{ flex: 1 }}>{label}</span>
      <ArrowRight size={12} color="rgba(255,255,255,0.5)" />
    </button>
  )
}

function ActivityRow({ activity }) {
  const colors = {
    sage: 'var(--sage)', warning: 'var(--amber)', info: 'var(--info)',
  }[activity.type] || 'var(--ink-muted)'
  return (
    <div style={{ padding: '9px 20px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: colors, marginTop: 6, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12 }}>{activity.text}</div>
        <div style={{ fontSize: 10, color: 'var(--ink-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{activity.time}</div>
      </div>
    </div>
  )
}
