// 設定 - 基本情報・車両・通知・アカウント・セキュリティ
import { useState } from 'react'
import { Building, Car, Bell, User, Shield, Download, Check, Plus, Edit3, Trash2 } from 'lucide-react'
import { VEHICLES } from '../data/vehiclesData'

const TABS = [
  { id: 'org',     label: '法人・施設情報', icon: Building },
  { id: 'vehicle', label: '車両管理',        icon: Car },
  { id: 'notify',  label: '通知設定',        icon: Bell },
  { id: 'account', label: 'アカウント',      icon: User },
  { id: 'sec',     label: 'セキュリティ',    icon: Shield },
]

export default function Settings() {
  const [tab, setTab] = useState('org')

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Settings</div>
          <h1 className="page-title">設定</h1>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>
        <div className="panel" style={{ padding: 8 }}>
          {TABS.map(t => {
            const active = tab === t.id; const Icon = t.icon
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                width: '100%', padding: '9px 11px', borderRadius: 6,
                background: active ? 'var(--accent-faint)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--ink-soft)',
                display: 'flex', alignItems: 'center', gap: 9,
                fontSize: 12, fontWeight: active ? 600 : 500, textAlign: 'left', marginBottom: 2,
              }}>
                <Icon size={13} /> {t.label}
              </button>
            )
          })}
        </div>

        <div>
          {tab === 'org' && <OrgSettings />}
          {tab === 'vehicle' && <VehicleSettings />}
          {tab === 'notify' && <NotifySettings />}
          {tab === 'account' && <AccountSettings />}
          {tab === 'sec' && <SecuritySettings />}
        </div>
      </div>
    </div>
  )
}

function OrgSettings() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SCard title="法人情報 — エデュケーションNET">
        <SGrid>
          <Field label="法人名"><input defaultValue="株式会社エデュケーションNET" style={{ width: '100%' }} /></Field>
          <Field label="代表者名"><input defaultValue="岸 由巨子" style={{ width: '100%' }} /></Field>
        </SGrid>
        <SGrid>
          <Field label="電話番号"><input defaultValue="0568-41-8025" style={{ width: '100%' }} /></Field>
          <Field label="FAX"><input defaultValue="0568-41-8718" style={{ width: '100%' }} /></Field>
        </SGrid>
        <Field label="所在地"><input defaultValue="愛知県春日井市篠木町2丁目1281番地1" style={{ width: '100%' }} /></Field>
      </SCard>

      <SCard title="法人情報 — LIFEterrasse">
        <SGrid>
          <Field label="法人名"><input defaultValue="LIFEterrasse" style={{ width: '100%' }} /></Field>
          <Field label="代表者名"><input defaultValue="(別法人)" style={{ width: '100%' }} /></Field>
        </SGrid>
      </SCard>

      <SCard title="データエクスポート">
        {[
          { l: '児童データCSV', d: '全利用児童情報をCSV形式でダウンロード' },
          { l: '送迎履歴CSV', d: '過去の送迎ルート・実績データをダウンロード' },
          { l: 'HUG連携ログCSV', d: '同期ログ・差分履歴' },
        ].map(r => (
          <div key={r.l} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg)', borderRadius: 6 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{r.l}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{r.d}</div>
            </div>
            <button className="btn btn-ghost btn-sm"><Download size={12} /> DL</button>
          </div>
        ))}
      </SCard>

      <SaveButton />
    </div>
  )
}

function VehicleSettings() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="grid grid-3">
        <MiniStat label="登録車両" value={VEHICLES.length} suf="台" />
        <MiniStat label="総定員" value={VEHICLES.reduce((s, v) => s + v.capacity, 0)} suf="名" />
        <MiniStat label="安全装置付き" value={VEHICLES.filter(v => v.safety).length} suf="台" />
      </div>

      <SCard title="登録車両一覧">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {VEHICLES.map(v => (
            <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg)', borderRadius: 6 }}>
              <div style={{ width: 34, height: 34, borderRadius: 7, background: v.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Car size={15} color={v.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {v.name}
                  {v.safety && <span className="pill pill-sage" style={{ fontSize: 9 }}>置去り装置</span>}
                </div>
                <div style={{ fontSize: 10, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>
                  {v.plate} · 定員{v.capacity}名 · {v.driver}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm"><Edit3 size={11} /></button>
              <button className="btn btn-ghost btn-sm"><Trash2 size={11} /></button>
            </div>
          ))}
          <button className="btn btn-ghost" style={{ marginTop: 4, justifyContent: 'center' }}>
            <Plus size={13} /> 車両を追加
          </button>
        </div>
      </SCard>
    </div>
  )
}

function NotifySettings() {
  const [settings, setSettings] = useState({ absence: true, done: true, newChild: true, vehicle: true, monthly: false, system: true })
  const [saved, setSaved] = useState(false)

  const groups = [
    { title: '送迎', items: [
      { k: 'absence', l: '欠席・キャンセル連絡', d: '保護者から欠席連絡があった際' },
      { k: 'done', l: '送迎完了通知', d: '各便の送迎が完了した際' },
    ]},
    { title: '児童・車両', items: [
      { k: 'vehicle', l: '車両アラート', d: '点検期限・異常検知' },
      { k: 'newChild', l: '新規児童登録', d: '新しい利用者が登録された際' },
    ]},
    { title: 'システム', items: [
      { k: 'monthly', l: '月次レポート', d: '月末自動作成レポート' },
      { k: 'system', l: 'システムお知らせ', d: 'メンテナンス・アップデート' },
    ]},
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {groups.map(g => (
        <SCard key={g.title} title={`${g.title}の通知`}>
          {g.items.map((i, idx) => (
            <div key={i.k} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: idx < g.items.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{i.l}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{i.d}</div>
              </div>
              <Toggle on={settings[i.k]} onToggle={() => setSettings(s => ({ ...s, [i.k]: !s[i.k] }))} />
            </div>
          ))}
        </SCard>
      ))}
      <SaveButton />
    </div>
  )
}

function AccountSettings() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SCard title="プロフィール">
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', paddingBottom: 14, borderBottom: '1px solid var(--line-soft)', marginBottom: 4 }}>
          <div style={{ width: 54, height: 54, borderRadius: 14, background: 'linear-gradient(135deg,var(--rb-orange),var(--rb-pink),var(--rb-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, boxShadow: '0 4px 10px rgba(232,132,66,0.3)' }}>マ</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700 }}>マキノ ユウキ</div>
            <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>システム管理者 / Admin</div>
          </div>
        </div>
        <SGrid>
          <Field label="氏名"><input defaultValue="マキノ ユウキ" style={{ width: '100%' }} /></Field>
          <Field label="メールアドレス"><input defaultValue="matsuoka@education-net.co.jp" style={{ width: '100%' }} /></Field>
        </SGrid>
      </SCard>

      <SCard title="パスワード変更">
        <Field label="現在のパスワード"><input type="password" placeholder="••••••••" style={{ width: '100%' }} /></Field>
        <SGrid>
          <Field label="新しいパスワード"><input type="password" placeholder="••••••••" style={{ width: '100%' }} /></Field>
          <Field label="確認"><input type="password" placeholder="••••••••" style={{ width: '100%' }} /></Field>
        </SGrid>
      </SCard>
      <SaveButton />
    </div>
  )
}

function SecuritySettings() {
  const [twoFactor, setTwoFactor] = useState(false)
  const [autoLogout, setAutoLogout] = useState(true)

  const history = [
    { t: '2026/04/21 08:30', dev: 'Chrome / macOS', ip: '123.45.67.89', ok: true },
    { t: '2026/04/20 17:32', dev: 'Chrome / macOS', ip: '123.45.67.89', ok: true },
    { t: '2026/04/19 09:05', dev: 'Safari / iPhone', ip: '111.22.33.44', ok: true },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SCard title="セキュリティ設定">
        {[
          { l: '二要素認証（2FA）', d: 'ログイン時にSMSコードで本人確認', v: twoFactor, set: setTwoFactor },
          { l: '自動ログアウト', d: '30分操作がない場合は自動でログアウト', v: autoLogout, set: setAutoLogout },
        ].map((i, idx) => (
          <div key={i.l} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: idx === 0 ? '1px solid var(--line-soft)' : 'none' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{i.l}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{i.d}</div>
            </div>
            <Toggle on={i.v} onToggle={() => i.set(v => !v)} />
          </div>
        ))}
      </SCard>

      <SCard title="ログイン履歴">
        <table>
          <thead><tr><th>日時</th><th>デバイス</th><th>IPアドレス</th><th>結果</th></tr></thead>
          <tbody>
            {history.map((h, i) => (
              <tr key={i}>
                <td className="num" style={{ fontSize: 11 }}>{h.t}</td>
                <td style={{ fontSize: 11 }}>{h.dev}</td>
                <td style={{ fontSize: 11, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>{h.ip}</td>
                <td><span className={`pill ${h.ok ? 'pill-sage' : 'pill-danger'}`}>{h.ok ? '成功' : '失敗'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </SCard>
    </div>
  )
}

// --- helpers ---
function SCard({ title, children }) {
  return (
    <div className="panel" style={{ padding: '16px 18px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--line)' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  )
}

function SGrid({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>{children}</div>
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-muted)', marginBottom: 4, letterSpacing: '0.06em' }}>{label}</div>
      {children}
    </div>
  )
}

function Toggle({ on, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      width: 40, height: 22, borderRadius: 11,
      background: on ? 'var(--accent)' : 'var(--line-strong)',
      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <div style={{
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 3, left: on ? 21 : 3,
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  )
}

function SaveButton() {
  const [saved, setSaved] = useState(false)
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <button className="btn btn-primary" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 1500) }}>
        {saved ? <><Check size={13} /> 保存しました</> : '変更を保存'}
      </button>
    </div>
  )
}

function MiniStat({ label, value, suf }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span className="stat-value num">{value}</span>
        <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{suf}</span>
      </div>
    </div>
  )
}
