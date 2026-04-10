import { useState } from 'react'
import { AlertCircle, CheckCircle2, Info, Car, Users, Bell, BellOff, Trash2, Check } from 'lucide-react'

const ALL_NOTIFS = [
  { id: 1, type: 'warning', category: '欠席', title: '加藤 結菜 — 本日欠席連絡', body: '保護者（加藤 陽子様）より09:12に欠席の連絡がありました。送迎ルートから自動除外済みです。', time: '09:12', date: '今日', read: false },
  { id: 2, type: 'success', category: '送迎', title: '車両B — 午前便 送迎完了', body: '渡辺 颯太、山本 悠斗の送迎が完了しました。到着時刻：08:52。', time: '08:55', date: '今日', read: false },
  { id: 3, type: 'info', category: '顧客', title: '渡辺 颯太 — 住所変更', body: '渡辺 颯太の送迎先住所が更新されました。次回のルート最適化に反映されます。', time: '08:30', date: '今日', read: false },
  { id: 4, type: 'info', category: 'システム', title: '送迎表（04/09）確定・PDF出力', body: '昨日の送迎表が確定され、PDFが出力されました。', time: '17:45', date: '昨日', read: true },
  { id: 5, type: 'success', category: '顧客', title: '新規登録：加藤 結菜', body: '加藤 結菜の利用者登録が完了しました。施設：にじいろPALETTE', time: '15:00', date: '昨日', read: true },
  { id: 6, type: 'warning', category: '車両', title: '車両A — 点検期限のお知らせ', body: '車両A（ハイエース）の次回点検期限は2026/04/30です。早めにご手配ください。', time: '09:00', date: '3日前', read: true },
  { id: 7, type: 'info', category: 'システム', title: '月次レポートの作成が完了', body: '2026年3月の月次利用者レポートが作成されました。設定 > レポートからダウンロードできます。', time: '08:00', date: '5日前', read: true },
]

const CATEGORIES = ['すべて', '欠席', '送迎', '顧客', '車両', 'システム']

const typeIcon = (type) => {
  if (type === 'warning') return <AlertCircle size={16} color="#f59e0b" />
  if (type === 'success') return <CheckCircle2 size={16} color="#22c55e" />
  return <Info size={16} color="#2e7df7" />
}
const typeBg = (type) => {
  if (type === 'warning') return '#fef3c7'
  if (type === 'success') return '#dcfce7'
  return '#e8f1ff'
}
const catIcon = (cat) => {
  if (cat === '送迎' || cat === '車両') return <Car size={12} />
  if (cat === '顧客' || cat === '欠席') return <Users size={12} />
  return <Bell size={12} />
}

export default function Notifications() {
  const [notifs, setNotifs] = useState(ALL_NOTIFS)
  const [cat, setCat] = useState('すべて')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  const filtered = notifs.filter(n => {
    const matchCat = cat === 'すべて' || n.category === cat
    const matchRead = !showUnreadOnly || !n.read
    return matchCat && matchRead
  })

  const unreadCount = notifs.filter(n => !n.read).length

  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  const markRead = (id) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  const deleteNotif = (id) => setNotifs(prev => prev.filter(n => n.id !== id))
  const clearAll = () => setNotifs([])

  // Group by date
  const groups = filtered.reduce((acc, n) => {
    if (!acc[n.date]) acc[n.date] = []
    acc[n.date].push(n)
    return acc
  }, {})

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="page-title">通知</div>
            <div className="page-subtitle">
              {unreadCount > 0 ? <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{unreadCount}件の未読通知</span> : '未読通知はありません'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {unreadCount > 0 && (
              <button className="btn btn-ghost" onClick={markAllRead}><Check size={14} /> すべて既読</button>
            )}
            <button className="btn btn-ghost" onClick={clearAll} style={{ color: 'var(--red)' }}><Trash2 size={14} /> 全削除</button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, flex: 1 }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{
              padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: cat === c ? 'var(--accent)' : 'var(--surface)',
              color: cat === c ? 'white' : 'var(--text-muted)',
              boxShadow: cat === c ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
            }}>{c}</button>
          ))}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: 'var(--text-muted)' }}>
          <input type="checkbox" checked={showUnreadOnly} onChange={e => setShowUnreadOnly(e.target.checked)} />
          未読のみ
        </label>
      </div>

      {/* Notification list */}
      {Object.keys(groups).length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <BellOff size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <div style={{ fontWeight: 600 }}>通知はありません</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {Object.entries(groups).map(([date, items]) => (
            <div key={date}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{date}</span>
                <span style={{ height: 1, flex: 1, background: 'var(--border)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map(n => (
                  <div key={n.id} style={{
                    background: n.read ? 'var(--surface)' : '#fafbff',
                    border: `1px solid ${n.read ? 'var(--border)' : '#c7d9fd'}`,
                    borderRadius: 12, padding: '14px 16px',
                    display: 'flex', gap: 14, alignItems: 'flex-start',
                    cursor: 'pointer', transition: 'box-shadow 0.15s',
                  }}
                    onClick={() => markRead(n.id)}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                  >
                    {/* Icon */}
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: typeBg(n.type), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {typeIcon(n.type)}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        {!n.read && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />}
                        <span style={{ fontWeight: n.read ? 500 : 700, fontSize: 13 }}>{n.title}</span>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          background: '#f1f5f9', borderRadius: 999, padding: '1px 7px',
                          fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
                        }}>{catIcon(n.category)}{n.category}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{n.body}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{n.time}</div>
                    </div>

                    {/* Actions */}
                    <button onClick={e => { e.stopPropagation(); deleteNotif(n.id) }} style={{
                      background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: 4, borderRadius: 6, flexShrink: 0,
                    }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.background = '#fee2e2' }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#cbd5e1'; e.currentTarget.style.background = 'none' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
