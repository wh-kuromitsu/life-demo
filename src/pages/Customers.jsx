import { useState, useEffect } from 'react'
import { Search, Plus, ChevronRight, Phone, MapPin, X, Save, Trash2 } from 'lucide-react'
import { customers as initialCustomers } from '../data/mockData'

const ALL_FACILITIES = ['にじいろPLUS', 'にじいろPALETTE', 'にじいろLABO', 'NIJIIRONOBA', 'にじいろPROGRESS']
const FACILITY_OPTS = ['すべて', ...ALL_FACILITIES]
const DAYS = ['月', '火', '水', '木', '金']

const EMPTY_FORM = {
  name: '', kana: '', age: '', facility: 'にじいろPLUS',
  address: '', transport: true, daySchedule: {}, status: 'active',
  guardian: '', guardianTel: '',
}

const selectedDays = (daySchedule) => DAYS.filter(d => daySchedule?.[d])

export default function Customers({ facility: facilityProp = 'すべて' }) {
  const [customers, setCustomers] = useState(initialCustomers)
  const [search, setSearch] = useState('')
  const [facilityFilter, setFacilityFilter] = useState(facilityProp)
  const [selected, setSelected] = useState(null)
  const [dialog, setDialog] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  // facilityProp が変わったらフィルターを同期
  useEffect(() => { setFacilityFilter(facilityProp) }, [facilityProp])

  const filtered = customers.filter(c => {
    const matchSearch = c.name.includes(search) || c.kana.includes(search)
    const matchFacility = facilityFilter === 'すべて' || c.facility === facilityFilter
    return matchSearch && matchFacility
  })

  const detail = selected ? customers.find(c => c.id === selected) : null

  const openNew = () => { setForm({ ...EMPTY_FORM, facility: facilityProp !== 'すべて' ? facilityProp : 'にじいろPLUS' }); setDialog('new'); setDeleteConfirm(false) }
  const openEdit = (c) => { setForm({ ...c, daySchedule: { ...c.daySchedule } }); setDialog('edit'); setDeleteConfirm(false) }
  const closeDialog = () => { setDialog(null); setDeleteConfirm(false) }

  const handleSave = () => {
    if (dialog === 'new') {
      setCustomers(prev => [...prev, { ...form, id: Date.now(), age: Number(form.age) }])
    } else {
      setCustomers(prev => prev.map(c => c.id === form.id ? { ...form, age: Number(form.age) } : c))
      setSelected(form.id)
    }
    closeDialog()
  }

  const handleDelete = () => {
    setCustomers(prev => prev.filter(c => c.id !== form.id))
    setSelected(null)
    closeDialog()
  }

  const toggleDay = (d) => {
    setForm(f => {
      const next = { ...f.daySchedule }
      if (next[d]) { delete next[d] } else { next[d] = { pickup: '', dropoff: '' } }
      return { ...f, daySchedule: next }
    })
  }

  const updateDayTime = (d, field, val) => {
    setForm(f => ({ ...f, daySchedule: { ...f.daySchedule, [d]: { ...f.daySchedule[d], [field]: val } } }))
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="page-title">顧客管理</div>
            <div className="page-subtitle">登録利用者一覧・詳細管理</div>
          </div>
          <button className="btn btn-primary" onClick={openNew}><Plus size={15} /> 新規登録</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* List */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="search-wrap" style={{ flex: 1, minWidth: 180 }}>
                <Search size={14} color="var(--text-muted)" />
                <input placeholder="名前・ふりがなで検索" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select value={facilityFilter} onChange={e => setFacilityFilter(e.target.value)}>
                {FACILITY_OPTS.map(f => <option key={f}>{f}</option>)}
              </select>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{filtered.length}件</span>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>利用者名</th>
                    <th>年齢</th>
                    <th>施設</th>
                    <th>送迎</th>
                    <th>利用曜日</th>
                    <th>状態</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => {
                    const days = selectedDays(c.daySchedule)
                    return (
                      <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(c.id === selected ? null : c.id)}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.kana}</div>
                        </td>
                        <td>{c.age}歳</td>
                        <td style={{ fontSize: 12 }}>{c.facility}</td>
                        <td>
                          {c.transport
                            ? <span className="badge badge-green">あり</span>
                            : <span className="badge badge-gray">なし</span>}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 3 }}>
                            {DAYS.map(d => (
                              <span key={d} style={{
                                width: 22, height: 22, borderRadius: 4,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 11, fontWeight: 600,
                                background: days.includes(d) ? 'var(--accent-light)' : '#f1f5f9',
                                color: days.includes(d) ? 'var(--accent)' : '#cbd5e1',
                              }}>{d}</span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${c.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                            {c.status === 'active' ? '利用中' : '休止中'}
                          </span>
                        </td>
                        <td><ChevronRight size={14} color="var(--text-muted)" /></td>
                      </tr>
                    )
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                        該当する利用者が見つかりません
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Detail panel */}
        {detail && (
          <div style={{ width: 320, flexShrink: 0 }}>
            <div className="card">
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'var(--accent-light)', margin: '0 auto 12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, fontWeight: 700, color: 'var(--accent)'
                }}>{detail.name[0]}</div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{detail.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{detail.kana}</div>
                <div style={{ marginTop: 8 }}>
                  <span className={`badge ${detail.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                    {detail.status === 'active' ? '利用中' : '休止中'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: '年齢', value: `${detail.age}歳` },
                  { label: '施設', value: detail.facility },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                    <span style={{ fontWeight: 500 }}>{row.value}</span>
                  </div>
                ))}

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>送迎情報</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, marginBottom: 10 }}>
                    <MapPin size={13} color="var(--text-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span>{detail.address || '未登録'}</span>
                  </div>
                  {detail.transport ? (
                    <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr 3fr', background: '#fafbfc', borderBottom: '1px solid var(--border)' }}>
                        {['曜日', 'お迎え', 'お送り'].map(h => (
                          <div key={h} style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{h}</div>
                        ))}
                      </div>
                      {selectedDays(detail.daySchedule).map((d, i, arr) => (
                        <div key={d} style={{ display: 'grid', gridTemplateColumns: '2fr 3fr 3fr', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          <div style={{ padding: '8px 10px', fontWeight: 700, fontSize: 13, color: 'var(--accent)' }}>{d}</div>
                          <div style={{ padding: '8px 10px', fontSize: 13 }}>{detail.daySchedule[d]?.pickup || '—'}</div>
                          <div style={{ padding: '8px 10px', fontSize: 13 }}>{detail.daySchedule[d]?.dropoff || '—'}</div>
                        </div>
                      ))}
                      {selectedDays(detail.daySchedule).length === 0 && (
                        <div style={{ padding: '10px', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>曜日未設定</div>
                      )}
                    </div>
                  ) : <span className="badge badge-gray">送迎なし</span>}
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>保護者情報</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                    <div>{detail.guardian || '未登録'}</div>
                    {detail.guardianTel && (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Phone size={13} color="var(--text-muted)" />
                        <span style={{ color: 'var(--accent)' }}>{detail.guardianTel}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => openEdit(detail)}>編集</button>
                  <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>送迎確認</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dialog */}
      {dialog && (
        <DialogOverlay onClose={closeDialog}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700 }}>{dialog === 'new' ? '新規利用者登録' : '利用者情報編集'}</h2>
            <button onClick={closeDialog} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Section title="基本情報">
              <Row2>
                <Field label="利用者氏名 *"><input style={{ width: '100%' }} placeholder="田中 蓮" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
                <Field label="ふりがな *"><input style={{ width: '100%' }} placeholder="タナカ レン" value={form.kana} onChange={e => setForm(f => ({ ...f, kana: e.target.value }))} /></Field>
              </Row2>
              <Row2>
                <Field label="年齢"><input style={{ width: '100%' }} type="number" placeholder="9" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} /></Field>
                <Field label="ステータス">
                  <select style={{ width: '100%' }} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="active">利用中</option>
                    <option value="inactive">休止中</option>
                  </select>
                </Field>
              </Row2>
              <Field label="利用施設 *">
                <select style={{ width: '100%' }} value={form.facility} onChange={e => setForm(f => ({ ...f, facility: e.target.value }))}>
                  {ALL_FACILITIES.map(f => <option key={f}>{f}</option>)}
                </select>
              </Field>
            </Section>

            <Section title="送迎情報">
              <Field label="自宅住所">
                <input style={{ width: '100%' }} placeholder="愛知県春日井市〇〇町1-2-3" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </Field>
              <Field label="送迎">
                <div style={{ display: 'flex', gap: 16 }}>
                  {[{ v: true, l: 'あり' }, { v: false, l: 'なし' }].map(opt => (
                    <label key={opt.l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                      <input type="radio" name="transport" checked={form.transport === opt.v} onChange={() => setForm(f => ({ ...f, transport: opt.v }))} />
                      {opt.l}
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="利用曜日と送迎時間">
                <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                  {DAYS.map(d => {
                    const active = !!form.daySchedule[d]
                    return (
                      <button key={d} type="button" onClick={() => toggleDay(d)} style={{
                        width: 36, height: 36, borderRadius: 8,
                        border: active ? '2px solid var(--accent)' : '2px solid var(--border)',
                        background: active ? 'var(--accent-light)' : 'white',
                        color: active ? 'var(--accent)' : 'var(--text-muted)',
                        fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit'
                      }}>{d}</button>
                    )
                  })}
                </div>
                {form.transport && selectedDays(form.daySchedule).length > 0 && (
                  <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 1fr', background: '#fafbfc', borderBottom: '1px solid var(--border)' }}>
                      {['曜日', 'お迎え時刻', 'お送り時刻'].map(h => (
                        <div key={h} style={{ padding: '7px 12px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{h}</div>
                      ))}
                    </div>
                    {selectedDays(form.daySchedule).map((d, i, arr) => (
                      <div key={d} style={{ display: 'grid', gridTemplateColumns: '48px 1fr 1fr', alignItems: 'center', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', padding: '6px 8px', gap: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--accent)', paddingLeft: 4 }}>{d}</div>
                        <input type="time" style={{ width: '100%', fontSize: 13 }} value={form.daySchedule[d].pickup} onChange={e => updateDayTime(d, 'pickup', e.target.value)} />
                        <input type="time" style={{ width: '100%', fontSize: 13 }} value={form.daySchedule[d].dropoff} onChange={e => updateDayTime(d, 'dropoff', e.target.value)} />
                      </div>
                    ))}
                  </div>
                )}
                {selectedDays(form.daySchedule).length === 0 && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>曜日を選択すると時間入力欄が表示されます</p>
                )}
              </Field>
            </Section>

            <Section title="保護者情報">
              <Row2>
                <Field label="保護者氏名"><input style={{ width: '100%' }} placeholder="田中 美咲" value={form.guardian} onChange={e => setForm(f => ({ ...f, guardian: e.target.value }))} /></Field>
                <Field label="電話番号"><input style={{ width: '100%' }} placeholder="090-1234-5678" value={form.guardianTel} onChange={e => setForm(f => ({ ...f, guardianTel: e.target.value }))} /></Field>
              </Row2>
            </Section>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <div>
              {dialog === 'edit' && !deleteConfirm && (
                <button className="btn" style={{ color: 'var(--red)', border: '1px solid var(--red)', background: 'transparent' }} onClick={() => setDeleteConfirm(true)}>
                  <Trash2 size={14} /> 削除
                </button>
              )}
              {deleteConfirm && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, color: 'var(--red)' }}>本当に削除しますか？</span>
                  <button className="btn" style={{ background: 'var(--red)', color: 'white', padding: '6px 14px' }} onClick={handleDelete}>削除する</button>
                  <button className="btn btn-ghost" style={{ padding: '6px 14px' }} onClick={() => setDeleteConfirm(false)}>キャンセル</button>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" onClick={closeDialog}>キャンセル</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={!form.name || !form.kana}>
                <Save size={14} /> {dialog === 'new' ? '登録する' : '保存する'}
              </button>
            </div>
          </div>
        </DialogOverlay>
      )}
    </div>
  )
}

function DialogOverlay({ onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'auto', padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        {children}
      </div>
    </div>
  )
}
function Section({ title, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
    </div>
  )
}
function Row2({ children }) { return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div> }
function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  )
}
