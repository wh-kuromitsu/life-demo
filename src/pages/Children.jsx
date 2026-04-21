// 児童管理 - 50項目リッチ表示
// フィルタ: 施設 / 学校 / 送迎有無 / タグ（翔陽連携/祖父母宅/学童/時間指定/同乗NG/イレギュラー）
// 詳細パネル: 基本情報 / 送迎情報 / 曜日スケジュール / 保護者 / 障害・医療 / 受給者証 / タグ

import { useState, useMemo } from 'react'
import { Search, Filter, Plus, Phone, MapPin, AlertCircle, Heart, Calendar, FileText, Users2 } from 'lucide-react'
import { CHILDREN, CHILD_BY_ID, TAGS } from '../data/childrenData'
import { FACILITY_BY_ID, FACILITY_OPTIONS } from '../data/facilitiesData'
import { LOC_BY_ID } from '../data/schoolsData'

const DAYS = ['月','火','水','木','金']

export default function Children({ facilityId }) {
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState(null)
  const [selectedId, setSelectedId] = useState('c01')
  const [showTransportOnly, setShowTransportOnly] = useState(false)

  const filtered = useMemo(() => CHILDREN.filter(c => {
    if (facilityId !== 'all' && c.facility !== facilityId) return false
    if (search && !c.name.includes(search) && !c.kana.includes(search)) return false
    if (activeTag && c.tag !== activeTag) return false
    if (showTransportOnly && !c.transport) return false
    return true
  }), [facilityId, search, activeTag, showTransportOnly])

  const selected = CHILD_BY_ID[selectedId]

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Children Management</div>
          <h1 className="page-title">児童管理</h1>
          <p className="page-sub">
            利用児童の基本情報・障害種別・送迎配慮・保護者・受給者証を一元管理。
            実運用の特殊ケース（翔陽連携／祖父母宅送迎／時間指定／同乗NG／医療的ケア）をタグで識別。
          </p>
        </div>
        <button className="btn btn-primary"><Plus size={13} /> 新規登録</button>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface)', border: '1px solid var(--line-strong)', borderRadius: 8, padding: '6px 12px', flex: '0 0 280px' }}>
          <Search size={13} color="var(--ink-muted)" />
          <input placeholder="名前・ふりがなで検索" value={search} onChange={e => setSearch(e.target.value)} style={{ border: 'none', padding: 0, flex: 1, background: 'transparent' }} />
        </div>

        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, color: 'var(--ink-muted)', fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginRight: 4 }}>タグ</span>
          {TAGS.map(t => (
            <button key={t}
              onClick={() => setActiveTag(activeTag === t ? null : t)}
              className={`pill ${activeTag === t ? 'pill-accent' : 'pill-gray'}`}
              style={{ cursor: 'pointer', fontSize: 11 }}>
              {t}
            </button>
          ))}
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--ink-soft)', cursor: 'pointer', marginLeft: 'auto' }}>
          <input type="checkbox" checked={showTransportOnly} onChange={e => setShowTransportOnly(e.target.checked)} />
          送迎対象のみ
        </label>

        <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>
          {filtered.length} / {CHILDREN.length}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'flex-start' }}>
        {/* Table */}
        <div className="panel">
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>児童名</th>
                  <th>年齢/学年</th>
                  <th>所属施設</th>
                  <th>学校</th>
                  <th>送迎</th>
                  <th>曜日</th>
                  <th>タグ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const fac = FACILITY_BY_ID[c.facility]
                  const school = LOC_BY_ID[c.school]
                  const days = DAYS.filter(d => c.schedule[d] && c.schedule[d] !== 'none')
                  return (
                    <tr key={c.id} className="clickable" onClick={() => setSelectedId(c.id)} style={selectedId === c.id ? { background: 'var(--accent-faint)' } : {}}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>{c.kana}</div>
                      </td>
                      <td className="num">{c.age}歳 / {c.grade}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ width: 6, height: 6, borderRadius: 1.5, background: fac?.color }} />
                          <span style={{ fontSize: 11 }}>{fac?.short}</span>
                        </span>
                      </td>
                      <td style={{ fontSize: 11 }}>{school?.name || '—'}</td>
                      <td>
                        {c.transport
                          ? <span className="pill pill-sage">あり</span>
                          : <span className="pill pill-gray">なし</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {DAYS.map(d => (
                            <span key={d} style={{
                              width: 18, height: 18, fontSize: 10, fontWeight: 600,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              borderRadius: 3,
                              background: days.includes(d) ? 'var(--accent-soft)' : 'var(--bg-deep)',
                              color: days.includes(d) ? 'var(--accent)' : 'var(--ink-faint)',
                            }}>{d}</span>
                          ))}
                        </div>
                      </td>
                      <td>
                        {c.tag && <span className="pill pill-accent" style={{ fontSize: 10 }}>{c.tag}</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail panel */}
        {selected && <ChildDetail child={selected} />}
      </div>
    </div>
  )
}

function ChildDetail({ child }) {
  const fac = FACILITY_BY_ID[child.facility]
  const school = LOC_BY_ID[child.school]
  const ngChildren = child.ngWith?.map(id => CHILD_BY_ID[id]).filter(Boolean) || []
  const pickup = LOC_BY_ID[child.pickupLoc]
  const scheduledDays = DAYS.filter(d => child.schedule[d] && child.schedule[d] !== 'none')

  return (
    <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div className="panel">
        <div style={{ padding: 20, textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 12, margin: '0 auto 10px',
            background: fac?.color + '20', color: fac?.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22,
          }}>
            {child.name[0]}
          </div>
          <div className="display" style={{ fontSize: 18 }}>{child.name}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
            {child.kana}
          </div>
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span className="pill pill-gray">{child.age}歳 / {child.grade}</span>
            <span className="pill pill-gray">{child.gender}</span>
            {child.tag && <span className="pill pill-accent">{child.tag}</span>}
            {child.safetyReq && <span className="pill pill-amber">要注意</span>}
          </div>
        </div>
      </div>

      {/* Sections */}
      <Section icon={<FileText size={12} />} title="基本情報">
        <Row k="所属施設" v={<span><span style={{ width: 6, height: 6, borderRadius: 1.5, background: fac?.color, display: 'inline-block', marginRight: 5 }} />{fac?.name}</span>} />
        <Row k="学校" v={school?.name || '—'} />
        <Row k="住所" v={child.address} />
        <Row k="受給者証期限" v={<span className="num" style={{ color: 'var(--amber)' }}>{child.certExpiry}</span>} />
      </Section>

      <Section icon={<Calendar size={12} />} title="送迎情報">
        <Row k="送迎" v={child.transport ? 'あり' : '保護者送迎'} />
        {child.transport && (
          <>
            <Row k="お迎え場所" v={pickup?.name || school?.name || '—'} />
            {child.pickupNote && <Row k="迎え備考" v={child.pickupNote} />}
            {child.dropoffNote && <Row k="送り備考" v={child.dropoffNote} />}
            <div style={{ padding: '6px 0' }}>
              <div style={{ fontSize: 10, color: 'var(--ink-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>利用曜日</div>
              <div style={{ display: 'flex', gap: 3 }}>
                {DAYS.map(d => (
                  <div key={d} style={{
                    flex: 1, textAlign: 'center', padding: '5px 0', borderRadius: 4,
                    background: scheduledDays.includes(d) ? 'var(--accent-soft)' : 'var(--bg-deep)',
                    color: scheduledDays.includes(d) ? 'var(--accent)' : 'var(--ink-faint)',
                    fontSize: 11, fontWeight: 700,
                  }}>{d}</div>
                ))}
              </div>
            </div>
          </>
        )}
      </Section>

      <Section icon={<Heart size={12} />} title="障害・医療情報">
        <Row k="障害種別" v={child.disability || '—'} />
        <Row k="医療情報" v={child.medical || '特になし'} />
        <Row k="アレルギー" v={child.allergies?.length > 0
          ? <span style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {child.allergies.map(a => <span key={a} className="pill pill-danger" style={{ fontSize: 10 }}>{a}</span>)}
            </span>
          : '—'} />
      </Section>

      <Section icon={<Users2 size={12} />} title="保護者">
        <Row k="氏名・続柄" v={`${child.guardian?.name} (${child.guardian?.rel})`} />
        <Row k="電話" v={<span className="num" style={{ color: 'var(--accent)' }}>{child.guardian?.tel}</span>} />
      </Section>

      {ngChildren.length > 0 && (
        <Section icon={<AlertCircle size={12} />} title="同乗NG" accent="var(--danger)">
          {ngChildren.map(c => (
            <div key={c.id} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="pill pill-danger">NG</span> {c.name}（{FACILITY_BY_ID[c.facility]?.short}）
            </div>
          ))}
        </Section>
      )}
    </div>
  )
}

function Section({ icon, title, accent, children }) {
  return (
    <div className="panel" style={{ padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: accent || 'var(--ink-muted)' }}>
        {icon}
        <div className="eyebrow" style={{ color: 'inherit' }}>{title}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {children}
      </div>
    </div>
  )
}

function Row({ k, v }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 10, fontSize: 12, padding: '3px 0' }}>
      <span style={{ color: 'var(--ink-muted)', fontSize: 11 }}>{k}</span>
      <span style={{ color: 'var(--ink)' }}>{v}</span>
    </div>
  )
}
