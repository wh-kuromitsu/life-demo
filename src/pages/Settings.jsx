import { useState } from 'react'
import { Building2, Car, Bell, Users, Shield, Download, ChevronRight, Check, Plus, Edit3, Trash2, X } from 'lucide-react'
import { vehicles as initialVehicles } from '../data/mockData'

const VEHICLE_COLORS = ['#2e7df7','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316']
const EMPTY_VEHICLE = { name: '', capacity: '', driver: '', tel: '', color: '#2e7df7' }

const TABS = [
  { id: 'facility',      label: '施設・基本情報', icon: Building2 },
  { id: 'vehicles',      label: '車両管理',       icon: Car },
  { id: 'notification',  label: '通知設定',       icon: Bell },
  { id: 'account',       label: 'アカウント',     icon: Users },
  { id: 'security',      label: 'セキュリティ',   icon: Shield },
]

export default function Settings() {
  const [tab, setTab] = useState('facility')

  return (
    <div>
      <div className="page-header">
        <div className="page-title">設定</div>
        <div className="page-subtitle">システム・施設・アカウントの設定を管理します</div>
      </div>

      {/* Layout: tab list left + content right */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

        {/* Tab list */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <div className="card" style={{ padding: 8 }}>
            {TABS.map(t => {
              const active = tab === t.id
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    width: '100%', padding: '9px 11px', borderRadius: 7,
                    background: active ? 'var(--accent-light)' : 'transparent',
                    color: active ? 'var(--accent)' : 'var(--text-muted)',
                    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: 13, fontWeight: active ? 600 : 400,
                    textAlign: 'left', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg)' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  <Icon size={15} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{t.label}</span>
                  {active && <ChevronRight size={13} style={{ flexShrink: 0 }} />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {tab === 'facility'     && <FacilitySettings />}
          {tab === 'vehicles'     && <VehicleSettings />}
          {tab === 'notification' && <NotificationSettings />}
          {tab === 'account'      && <AccountSettings />}
          {tab === 'security'     && <SecuritySettings />}
        </div>
      </div>
    </div>
  )
}

/* ─── 施設・基本情報 ─── */
function FacilitySettings() {
  const [saved, setSaved] = useState(false)
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }
  return (
    <Stack>
      <SCard title="法人・施設情報">
        <SGrid><SField label="法人名"><Inp defaultValue="株式会社 Education NET" /></SField><SField label="代表者名"><Inp defaultValue="岸 由巨子" /></SField></SGrid>
        <SGrid><SField label="電話番号"><Inp defaultValue="0568-41-8025" /></SField><SField label="FAX番号"><Inp defaultValue="0568-41-8718" /></SField></SGrid>
        <SField label="所在地"><Inp defaultValue="愛知県春日井市篠木町2丁目1281番地1" /></SField>
        <SField label="メールアドレス"><Inp defaultValue="info@education-net.co.jp" /></SField>
      </SCard>

      <SCard title="営業時間">
        <SGrid>
          <SField label="平日 開始"><Inp type="time" defaultValue="10:00" /></SField>
          <SField label="平日 終了"><Inp type="time" defaultValue="18:00" /></SField>
        </SGrid>
        <SGrid>
          <SField label="土曜日 開始"><Inp type="time" defaultValue="10:00" /></SField>
          <SField label="土曜日 終了"><Inp type="time" defaultValue="16:00" /></SField>
        </SGrid>
        <SField label="休業日"><Inp defaultValue="日曜日・祝日" /></SField>
      </SCard>

      <SCard title="データエクスポート">
        {[
          { label: '顧客データCSV', desc: '全利用者情報をCSV形式でダウンロード' },
          { label: '送迎履歴CSV', desc: '過去の送迎ルート・実績データをダウンロード' },
        ].map(r => (
          <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg)', borderRadius: 8, padding: '11px 14px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{r.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.desc}</div>
            </div>
            <button className="btn btn-ghost" style={{ fontSize: 12, whiteSpace: 'nowrap' }}><Download size={13} /> ダウンロード</button>
          </div>
        ))}
      </SCard>

      <SaveRow saved={saved} onSave={save} />
    </Stack>
  )
}

/* ─── 車両管理 ─── */
function VehicleSettings() {
  const [vehicles, setVehicles] = useState(initialVehicles)
  const [mode, setMode] = useState(null)   // null | 'add' | vehicleId(edit)
  const [form, setForm] = useState(EMPTY_VEHICLE)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const openAdd = () => { setForm(EMPTY_VEHICLE); setMode('add'); setDeleteTarget(null) }
  const openEdit = (v) => { setForm({ ...v }); setMode(v.id); setDeleteTarget(null) }
  const closeForm = () => { setMode(null); setDeleteTarget(null) }

  const handleSave = () => {
    if (mode === 'add') {
      setVehicles(p => [...p, { ...form, id: 'v' + Date.now(), capacity: Number(form.capacity) }])
    } else {
      setVehicles(p => p.map(v => v.id === mode ? { ...form, capacity: Number(form.capacity) } : v))
    }
    closeForm()
  }

  const handleDelete = (id) => {
    setVehicles(p => p.filter(v => v.id !== id))
    closeForm()
    setDeleteTarget(null)
  }

  const isValid = form.name.trim() && form.driver.trim() && Number(form.capacity) > 0

  return (
    <Stack>
      {/* サマリー */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {[
          { label: '登録車両', value: `${vehicles.length}台` },
          { label: '総定員', value: `${vehicles.reduce((a, v) => a + Number(v.capacity), 0)}名` },
          { label: '稼働中', value: `${vehicles.length}台` },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <SCard title="登録車両一覧">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {vehicles.map(v => (
            <div key={v.id}>
              {/* 通常行 */}
              {mode !== v.id && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'var(--bg)', borderRadius: 10, padding: '11px 14px',
                  border: deleteTarget === v.id ? '1px solid #fecaca' : '1px solid transparent',
                  transition: 'border 0.15s',
                }}>
                  <div style={{ width: 38, height: 38, borderRadius: 8, background: v.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Car size={18} color={v.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{v.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      担当: {v.driver}　定員: {v.capacity}名　{v.tel}
                    </div>
                  </div>
                  {deleteTarget === v.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--red)' }}>削除しますか？</span>
                      <button className="btn" style={{ background: 'var(--red)', color: 'white', padding: '5px 12px', fontSize: 12 }} onClick={() => handleDelete(v.id)}>削除</button>
                      <button className="btn btn-ghost" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => setDeleteTarget(null)}>戻る</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => openEdit(v)}><Edit3 size={13} /> 編集</button>
                      <button
                        style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', transition: 'all 0.15s' }}
                        onClick={() => setDeleteTarget(v.id)}
                        onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = '#fca5a5' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 編集フォーム（インライン） */}
              {mode === v.id && (
                <VehicleForm
                  form={form} setForm={setForm}
                  onSave={handleSave} onCancel={closeForm}
                  isValid={isValid} title="車両を編集"
                  borderColor={form.color}
                />
              )}
            </div>
          ))}
        </div>

        {/* 追加ボタン or 追加フォーム */}
        {mode === 'add' ? (
          <div style={{ marginTop: 8 }}>
            <VehicleForm
              form={form} setForm={setForm}
              onSave={handleSave} onCancel={closeForm}
              isValid={isValid} title="新しい車両を追加"
              borderColor={form.color}
            />
          </div>
        ) : (
          <button
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            onClick={openAdd}
          >
            <Plus size={14} /> 車両を追加
          </button>
        )}
      </SCard>
    </Stack>
  )
}

function VehicleForm({ form, setForm, onSave, onCancel, isValid, title, borderColor }) {
  const f = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }))
  return (
    <div style={{ border: `2px solid ${borderColor}`, borderRadius: 10, padding: 16, background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{title}</span>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>
      </div>

      <SGrid>
        <SField label="車両名 *"><Inp placeholder="ハイエース（Aチーム）" value={form.name} onChange={f('name')} /></SField>
        <SField label="定員（名）*"><Inp type="number" min="1" max="20" placeholder="8" value={form.capacity} onChange={f('capacity')} /></SField>
      </SGrid>
      <SGrid>
        <SField label="担当ドライバー *"><Inp placeholder="山田 太郎" value={form.driver} onChange={f('driver')} /></SField>
        <SField label="連絡先"><Inp placeholder="090-0000-0000" value={form.tel} onChange={f('tel')} /></SField>
      </SGrid>

      {/* カラー選択 */}
      <SField label="車両カラー">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {VEHICLE_COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setForm(p => ({ ...p, color: c }))}
              style={{
                width: 28, height: 28, borderRadius: '50%', background: c,
                border: form.color === c ? '3px solid var(--text)' : '3px solid transparent',
                cursor: 'pointer', outline: form.color === c ? `2px solid ${c}` : 'none',
                outlineOffset: 2, transition: 'all 0.15s',
              }}
            />
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: form.color + '33', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Car size={14} color={form.color} />
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>プレビュー</span>
          </div>
        </div>
      </SField>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid var(--border)' }}>
        <button className="btn btn-ghost" onClick={onCancel}>キャンセル</button>
        <button className="btn btn-primary" onClick={onSave} disabled={!isValid} style={{ opacity: isValid ? 1 : 0.5 }}>
          <Check size={13} /> 保存する
        </button>
      </div>
    </div>
  )
}

/* ─── 通知設定 ─── */
function NotificationSettings() {
  const [s, setS] = useState({ absence: true, transportDone: true, newCustomer: true, vehicleAlert: true, monthlyReport: false, systemUpdate: true })
  const toggle = k => setS(prev => ({ ...prev, [k]: !prev[k] }))
  const [saved, setSaved] = useState(false)

  const groups = [
    { title: '送迎', items: [
      { key: 'absence', label: '欠席・キャンセル連絡', desc: '保護者から欠席連絡があった際に通知' },
      { key: 'transportDone', label: '送迎完了通知', desc: '各便の送迎が完了した際に通知' },
    ]},
    { title: '車両・顧客', items: [
      { key: 'vehicleAlert', label: '車両アラート', desc: '点検期限・異常検知の通知' },
      { key: 'newCustomer', label: '新規顧客登録', desc: '新しい利用者が登録された際に通知' },
    ]},
    { title: 'システム', items: [
      { key: 'monthlyReport', label: '月次レポート', desc: '月末に自動作成されたレポートの通知' },
      { key: 'systemUpdate', label: 'システムお知らせ', desc: 'メンテナンス・アップデートの通知' },
    ]},
  ]

  return (
    <Stack>
      {groups.map(g => (
        <SCard key={g.title} title={`${g.title}の通知`}>
          {g.items.map((item, i) => (
            <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i < g.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.desc}</div>
              </div>
              <Toggle on={s[item.key]} onToggle={() => toggle(item.key)} />
            </div>
          ))}
        </SCard>
      ))}
      <SaveRow saved={saved} onSave={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }} />
    </Stack>
  )
}

/* ─── アカウント ─── */
function AccountSettings() {
  const [saved, setSaved] = useState(false)
  return (
    <Stack>
      <SCard title="プロフィール">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 16, borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg,#2e7df7,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: 'white', fontWeight: 700, flexShrink: 0 }}>松</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>松岡 担当</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>システム管理者</div>
            <button className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }}>写真を変更</button>
          </div>
        </div>
        <SGrid><SField label="氏名"><Inp defaultValue="松岡 担当" /></SField><SField label="メールアドレス"><Inp defaultValue="matsuoka@education-net.co.jp" /></SField></SGrid>
        <SGrid>
          <SField label="電話番号"><Inp defaultValue="090-0000-0000" /></SField>
          <SField label="役職">
            <select style={{ width: '100%' }}><option>システム管理者</option><option>施設管理者</option><option>一般スタッフ</option></select>
          </SField>
        </SGrid>
      </SCard>

      <SCard title="パスワード変更">
        <SField label="現在のパスワード"><Inp type="password" placeholder="••••••••" /></SField>
        <SGrid>
          <SField label="新しいパスワード"><Inp type="password" placeholder="••••••••" /></SField>
          <SField label="確認"><Inp type="password" placeholder="••••••••" /></SField>
        </SGrid>
      </SCard>

      <SaveRow saved={saved} onSave={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }} />
    </Stack>
  )
}

/* ─── セキュリティ ─── */
function SecuritySettings() {
  const [twoFactor, setTwoFactor] = useState(false)
  const [autoLogout, setAutoLogout] = useState(true)
  const [saved, setSaved] = useState(false)

  const history = [
    { time: '2026/04/10 09:05', device: 'Chrome / macOS', ip: '123.45.67.89', ok: true },
    { time: '2026/04/09 17:32', device: 'Chrome / macOS', ip: '123.45.67.89', ok: true },
    { time: '2026/04/08 08:58', device: 'Chrome / Windows', ip: '111.22.33.44', ok: true },
    { time: '2026/04/07 14:21', device: 'Safari / iOS', ip: '123.45.67.89', ok: false },
  ]

  return (
    <Stack>
      <SCard title="セキュリティ設定">
        {[
          { label: '二要素認証（2FA）', desc: 'ログイン時にSMSコードで本人確認を行います', val: twoFactor, set: setTwoFactor },
          { label: '自動ログアウト', desc: '30分操作がない場合は自動でログアウトします', val: autoLogout, set: setAutoLogout },
        ].map((item, i, arr) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.desc}</div>
            </div>
            <Toggle on={item.val} onToggle={() => item.set(v => !v)} />
          </div>
        ))}
      </SCard>

      <SCard title="ログイン履歴">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['日時', 'デバイス', 'IPアドレス', '結果'].map(h => (
              <th key={h} style={{ textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', padding: '7px 10px', borderBottom: '1px solid var(--border)', background: '#fafbfc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {history.map((h, i) => (
              <tr key={i}>
                <td style={{ padding: '10px 10px', fontSize: 12, borderBottom: '1px solid var(--border)' }}>{h.time}</td>
                <td style={{ padding: '10px 10px', fontSize: 12, borderBottom: '1px solid var(--border)' }}>{h.device}</td>
                <td style={{ padding: '10px 10px', fontSize: 12, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{h.ip}</td>
                <td style={{ padding: '10px 10px', borderBottom: '1px solid var(--border)' }}>
                  <span className={`badge ${h.ok ? 'badge-green' : 'badge-red'}`}>{h.ok ? '成功' : '失敗'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SCard>

      <SCard title="危険ゾーン">
        <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 8, padding: '14px 16px' }}>
          <div style={{ fontWeight: 600, color: 'var(--red)', fontSize: 13, marginBottom: 4 }}>アカウント削除</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>この操作は取り消せません。全てのデータが削除されます。</div>
          <button className="btn" style={{ background: 'var(--red)', color: 'white', fontSize: 12 }}>アカウントを削除する</button>
        </div>
      </SCard>

      <SaveRow saved={saved} onSave={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }} />
    </Stack>
  )
}

/* ─── 共通パーツ ─── */
function Stack({ children }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
}
function SCard({ title, children }) {
  return (
    <div className="card">
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
    </div>
  )
}
function SGrid({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>
}
function SField({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  )
}
function Inp({ style, ...props }) {
  return <input style={{ width: '100%', ...style }} {...props} />
}
function Toggle({ on, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      flexShrink: 0, width: 44, height: 24, borderRadius: 12,
      border: 'none', cursor: 'pointer',
      background: on ? 'var(--accent)' : '#cbd5e1',
      position: 'relative', transition: 'background 0.2s',
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: '50%', background: 'white',
        position: 'absolute', top: 3, left: on ? 23 : 3,
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  )
}
function SaveRow({ saved, onSave }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <button className="btn btn-primary" onClick={onSave} style={{ minWidth: 120, justifyContent: 'center' }}>
        {saved ? <><Check size={14} /> 保存しました</> : '変更を保存'}
      </button>
    </div>
  )
}
