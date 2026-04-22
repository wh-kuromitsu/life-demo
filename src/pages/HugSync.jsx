// HUG連携 - 同期ステータス・差分・ログ
import { useState } from 'react'
import { RefreshCw, CheckCircle2, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, FileDown, Clock, Database } from 'lucide-react'
import { HUG_STATUS, HUG_DIFF, HUG_LOGS } from '../data/hugData'

export default function HugSync() {
  const [syncing, setSyncing] = useState(false)

  const doSync = () => {
    setSyncing(true)
    setTimeout(() => setSyncing(false), 1800)
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">HUG Integration</div>
          <h1 className="page-title">HUG連携</h1>
        </div>
        <button className="btn btn-primary" onClick={doSync} disabled={syncing}>
          {syncing ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={13} />}
          {syncing ? '同期中...' : '手動同期'}
        </button>
      </div>

      {/* Status */}
      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <StatusCard icon={<CheckCircle2 size={18} />} label="連携ステータス" value="正常" color="var(--sage)" sub="全サービス稼働中" />
        <StatusCard icon={<Clock size={18} />} label="最終同期" value="08:30" color="var(--accent)" sub={HUG_STATUS.lastSync} />
        <StatusCard icon={<Database size={18} />} label="児童データ" value={HUG_STATUS.children} color="var(--info)" sub="+ 保護者 640件" />
        <StatusCard icon={<Clock size={18} />} label="次回同期" value="20:00" color="var(--ink-muted)" sub="自動実行（日2回）" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20 }}>
        {/* Diff */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">直近の差分</div>
              <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 2 }}>{HUG_DIFF.length}件の変更が検出されました</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-ghost btn-sm"><ArrowDownToLine size={12} /> 取込</button>
              <button className="btn btn-ghost btn-sm"><ArrowUpFromLine size={12} /> 送信</button>
            </div>
          </div>
          <div>
            {HUG_DIFF.map((d, i) => (
              <div key={i} style={{
                padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
                borderBottom: i < HUG_DIFF.length - 1 ? '1px solid var(--line-soft)' : 'none',
              }}>
                <span className={`pill ${
                  d.type === 'add' ? 'pill-sage' :
                  d.type === 'update' ? 'pill-info' : 'pill-danger'
                }`}>
                  {d.type === 'add' ? '新規' : d.type === 'update' ? '更新' : '削除'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--ink-muted)', minWidth: 80 }}>{d.category}</span>
                <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{d.name}</span>
                <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{d.note}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Log */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">同期ログ</div>
            <button className="btn btn-ghost btn-sm"><FileDown size={11} /> 全ログ</button>
          </div>
          <div>
            {HUG_LOGS.map((l, i) => (
              <div key={i} style={{
                padding: '12px 20px', display: 'flex', alignItems: 'flex-start', gap: 10,
                borderBottom: i < HUG_LOGS.length - 1 ? '1px solid var(--line-soft)' : 'none',
              }}>
                <div style={{ flexShrink: 0, marginTop: 2 }}>
                  {l.status === 'ok' ? <CheckCircle2 size={14} color="var(--sage)" /> : <AlertTriangle size={14} color="var(--amber)" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{l.msg}</div>
                  <div style={{ fontSize: 10, color: 'var(--ink-muted)', marginTop: 3, fontFamily: 'var(--font-mono)' }}>
                    {l.at} · {l.kind === 'sync' ? '定期同期' : '手動取込'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusCard({ icon, label, value, sub, color }) {
  return (
    <div className="stat">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="stat-label">{label}</div>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: color + '18', color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
      </div>
      <div>
        <div className="stat-value num" style={{ color }}>{value}</div>
        <div className="stat-sub">{sub}</div>
      </div>
    </div>
  )
}
