// 通知 - カテゴリ別・既読/未読切替
import { useState } from 'react'
import { Bell, BellOff, CheckCircle2, AlertTriangle, Info, Users, Car, RefreshCw, Trash2, Check } from 'lucide-react'

const NOTIFICATIONS = [
  { id: 1, type: 'warning', category: '欠席',   title: '加藤 結菜 — 本日欠席連絡',           body: '保護者（加藤 陽子様）より09:12に欠席連絡。送迎ルートから自動除外済みです。', time: '09:12', date: '今日', read: false },
  { id: 2, type: 'sage',    category: '送迎',   title: 'ハイエースA — 午前便 送迎完了',       body: '田中 蓮、山本 悠斗、中村 ひまりの送迎が完了しました（到着 15:40）。', time: '15:40', date: '今日', read: false },
  { id: 3, type: 'info',    category: '児童',   title: '渡辺 颯太 — 住所変更',                body: '渡辺 颯太の送迎先住所が更新されました。次回のルート最適化に反映されます。', time: '08:30', date: '今日', read: false },
  { id: 4, type: 'info',    category: 'HUG',    title: 'HUG連携 — 定期同期完了',              body: '20:00の定期同期が完了しました。差分6件を反映済。', time: '08:30', date: '今日', read: true },
  { id: 5, type: 'info',    category: 'システム', title: '送迎表（4/20）確定・PDFエクスポート', body: '昨日の送迎表が確定され、PDFが出力されました。', time: '17:45', date: '昨日', read: true },
  { id: 6, type: 'sage',    category: '児童',   title: '新規登録：浅野 結衣',                  body: '浅野 結衣（翔陽連携）の利用者登録が完了。施設：にじいろLOHASPO', time: '15:00', date: '昨日', read: true },
  { id: 7, type: 'warning', category: '車両',   title: 'ハイエースA — 点検期限',                 body: '車両の次回点検期限は2026/05/15です。早めに手配をお願いします。', time: '09:00', date: '3日前', read: true },
  { id: 8, type: 'info',    category: 'システム', title: '月次レポート作成完了',                  body: '2026年3月の月次利用者レポートが作成されました。', time: '08:00', date: '5日前', read: true },
]

const CATEGORIES = ['すべて', '欠席', '送迎', '児童', '車両', 'HUG', 'システム']

export default function Notifications() {
  const [list, setList] = useState(NOTIFICATIONS)
  const [cat, setCat] = useState('すべて')
  const [unreadOnly, setUnreadOnly] = useState(false)

  const filtered = list.filter(n => (cat === 'すべて' || n.category === cat) && (!unreadOnly || !n.read))
  const unreadCount = list.filter(n => !n.read).length

  const groups = filtered.reduce((acc, n) => {
    if (!acc[n.date]) acc[n.date] = []
    acc[n.date].push(n)
    return acc
  }, {})

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Notifications</div>
          <h1 className="page-title">通知</h1>
          <p className="page-sub">
            {unreadCount > 0
              ? <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{unreadCount}件の未読通知</span>
              : '未読通知はありません'}
          </p>
        </div>
        {unreadCount > 0 && <button className="btn btn-ghost btn-sm" onClick={() => setList(list.map(n => ({ ...n, read: true })))}><Check size={12} /> 全既読</button>}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        {CATEGORIES.map(c => (
          <button key={c}
            onClick={() => setCat(c)}
            className={`pill ${cat === c ? 'pill-accent' : 'pill-gray'}`}
            style={{ cursor: 'pointer', fontSize: 11, padding: '4px 12px' }}>
            {c}
          </button>
        ))}
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--ink-soft)', cursor: 'pointer', marginLeft: 'auto' }}>
          <input type="checkbox" checked={unreadOnly} onChange={e => setUnreadOnly(e.target.checked)} />
          未読のみ
        </label>
      </div>

      {Object.keys(groups).length === 0 ? (
        <div className="panel" style={{ padding: 60, textAlign: 'center', color: 'var(--ink-muted)' }}>
          <BellOff size={36} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 14 }}>通知はありません</div>
        </div>
      ) : (
        Object.entries(groups).map(([date, items]) => (
          <div key={date} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{date}</span>
              <span style={{ height: 1, flex: 1, background: 'var(--line)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {items.map(n => <NotificationRow key={n.id} n={n} onRead={() => setList(l => l.map(x => x.id === n.id ? { ...x, read: true } : x))} onDelete={() => setList(l => l.filter(x => x.id !== n.id))} />)}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function NotificationRow({ n, onRead, onDelete }) {
  const iconColor = {
    warning: 'var(--amber)', sage: 'var(--sage)', info: 'var(--info)',
  }[n.type]
  const iconBg = {
    warning: 'var(--amber-soft)', sage: 'var(--sage-soft)', info: 'var(--info-soft)',
  }[n.type]
  const Icon = { warning: AlertTriangle, sage: CheckCircle2, info: Info }[n.type]

  const CatIcon = n.category === '送迎' || n.category === '車両' ? Car :
                  n.category === '児童' || n.category === '欠席' ? Users :
                  n.category === 'HUG' ? RefreshCw : Bell

  return (
    <div onClick={onRead} style={{
      padding: '14px 18px',
      background: n.read ? 'var(--surface)' : 'var(--accent-faint)',
      border: `1px solid ${n.read ? 'var(--line)' : 'var(--accent-soft)'}`,
      borderRadius: 10, display: 'flex', gap: 12, alignItems: 'flex-start',
      cursor: 'pointer',
    }}>
      <div style={{ width: 34, height: 34, borderRadius: 8, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={16} color={iconColor} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          {!n.read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />}
          <span style={{ fontWeight: n.read ? 500 : 700, fontSize: 13 }}>{n.title}</span>
          <span className="pill pill-gray" style={{ fontSize: 10, padding: '1px 7px', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <CatIcon size={10} /> {n.category}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-muted)', lineHeight: 1.6 }}>{n.body}</div>
        <div style={{ fontSize: 10, color: 'var(--ink-faint)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>{n.time}</div>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onDelete() }} style={{ padding: 4, color: 'var(--ink-faint)', borderRadius: 5 }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'var(--danger-soft)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-faint)'; e.currentTarget.style.background = 'transparent' }}>
        <Trash2 size={13} />
      </button>
    </div>
  )
}
