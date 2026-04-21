// 施設管理 - 13施設×2法人
import { Building, Users, Star, ArrowRight, MapPin } from 'lucide-react'
import { FACILITIES, ORGS } from '../data/facilitiesData'
import { CHILDREN } from '../data/childrenData'

export default function Facility({ setPage }) {
  const enrichment = id => ({
    children: CHILDREN.filter(c => c.facility === id).length,
    transport: CHILDREN.filter(c => c.facility === id && c.transport).length,
  })

  const byOrg = {
    EDU_NET: FACILITIES.filter(f => f.org === 'EDU_NET'),
    LIFE_TER: FACILITIES.filter(f => f.org === 'LIFE_TER'),
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Facility Management</div>
          <h1 className="page-title">施設管理</h1>
          <p className="page-sub">
            2法人13事業所の基本情報・定員・サービス種別・特化テーマを一元管理。
            補助金対象事業所（新事業進出補助金）は★マーク。
          </p>
        </div>
        <button className="btn btn-primary">新規施設を追加</button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <div className="stat"><div className="stat-label">事業所総数</div><div className="stat-value num">13</div><div className="stat-sub">2法人運用</div></div>
        <div className="stat"><div className="stat-label">放課後等デイ</div><div className="stat-value num">9</div><div className="stat-sub">{FACILITIES.filter(f=>f.service==='放デイ').length}事業所</div></div>
        <div className="stat"><div className="stat-label">児童発達支援</div><div className="stat-value num">3</div><div className="stat-sub">児発3事業所</div></div>
        <div className="stat"><div className="stat-label">総定員</div><div className="stat-value num">{FACILITIES.reduce((s,f)=>s+f.cap,0)}</div><div className="stat-sub">事業所平均10名</div></div>
      </div>

      {/* By org */}
      {Object.entries(byOrg).map(([orgKey, facs]) => (
        <div key={orgKey} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>{ORGS[orgKey].name}</div>
            <span className="pill pill-gray">{facs.length}事業所</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {facs.map(f => {
              const e = enrichment(f.id)
              return (
                <div key={f.id} className="panel" style={{ padding: 18, borderLeft: `4px solid ${f.color}` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700 }}>{f.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>HUG No. {f.hugNo}</div>
                    </div>
                    <span className="pill pill-gray">{f.service}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-soft)', lineHeight: 1.5, minHeight: 30 }}>
                    {f.theme}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12, padding: '10px 0', borderTop: '1px solid var(--line-soft)' }}>
                    <Metric label="利用児童" v={e.children} suf="名" />
                    <Metric label="送迎対象" v={e.transport} suf="名" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function Metric({ label, v, suf }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--ink-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
        <span className="num" style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>{v}</span>
        <span style={{ fontSize: 10, color: 'var(--ink-muted)' }}>{suf}</span>
      </div>
    </div>
  )
}
