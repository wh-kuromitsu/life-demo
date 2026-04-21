// 個別支援計画 - 5段階ワークフロー
// アセスメント → ニーズ整理 → 目標設定 → 支援内容 → モニタリング → 承認

import { useState } from 'react'
import { ClipboardList, Download, CheckCircle2, FileText, Calendar, Target, Activity, UserCheck, ChevronRight } from 'lucide-react'
import { CHILDREN } from '../data/childrenData'
import { FACILITY_BY_ID } from '../data/facilitiesData'

const WORKFLOW = [
  { id: 1, label: 'アセスメント',      icon: <FileText size={12} />, desc: 'WISC-V等・生育歴・現状把握' },
  { id: 2, label: 'ニーズ整理',         icon: <Target size={12} />, desc: '本人・保護者のニーズ抽出' },
  { id: 3, label: '目標設定',            icon: <Target size={12} />, desc: '短期・長期目標と5領域' },
  { id: 4, label: '支援内容',            icon: <Activity size={12} />, desc: '具体的な支援プログラム' },
  { id: 5, label: 'モニタリング',        icon: <Activity size={12} />, desc: '実施記録・定期評価' },
  { id: 6, label: '承認・保護者同意',    icon: <UserCheck size={12} />, desc: '事業部長承認・署名' },
]

const DOMAINS = ['健康・生活', '運動・感覚', '認知・行動', '言語・コミュニケーション', '人間関係・社会性']

export default function SupportPlan({ facilityId }) {
  const scoped = facilityId === 'all' ? CHILDREN : CHILDREN.filter(c => c.facility === facilityId)
  const [selectedId, setSelectedId] = useState(scoped[0]?.id || 'c01')
  const [stage, setStage] = useState(3)
  const child = CHILDREN.find(c => c.id === selectedId)

  if (!child) return null

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Individual Support Plan</div>
          <h1 className="page-title">個別支援計画</h1>
          <p className="page-sub">
            アセスメント→ニーズ→目標→支援→モニタリング→承認の6ステップ。5領域別の目標設定と保護者同意フロー。
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm"><Download size={12} /> PDF出力</button>
          <button className="btn btn-ghost btn-sm"><Download size={12} /> Excel出力</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 20 }}>
        {/* Child list */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">対象児童</div>
            <span className="num" style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{scoped.length}</span>
          </div>
          <div style={{ maxHeight: 600, overflowY: 'auto' }}>
            {scoped.map(c => {
              const fac = FACILITY_BY_ID[c.facility]
              const active = c.id === selectedId
              return (
                <button key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  style={{
                    width: '100%', padding: '10px 14px', textAlign: 'left',
                    background: active ? 'var(--accent-faint)' : 'transparent',
                    borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
                    borderBottom: '1px solid var(--line-soft)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 1.5, background: fac?.color }} />
                    <span style={{ fontSize: 13, fontWeight: active ? 700 : 500 }}>{c.name}</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--ink-muted)', marginLeft: 12, marginTop: 2 }}>
                    {c.grade} · {fac?.short}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Child info */}
          <div className="panel">
            <div style={{ padding: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: 10, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 }}>
                {child.name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div className="display" style={{ fontSize: 18 }}>{child.name}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{child.grade} · {child.age}歳 · {child.disability}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="eyebrow">計画期間</div>
                <div className="num" style={{ fontSize: 13, fontWeight: 600 }}>2026/04 — 2026/09</div>
              </div>
              <div style={{ textAlign: 'right', paddingLeft: 20, borderLeft: '1px solid var(--line)' }}>
                <div className="eyebrow">状態</div>
                <span className="pill pill-amber">作成中 · Stage {stage}</span>
              </div>
            </div>
          </div>

          {/* Workflow */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">作成ワークフロー</div>
              <span className="eyebrow">{stage} / {WORKFLOW.length}</span>
            </div>
            <div style={{ padding: '18px 20px', display: 'flex', gap: 0, overflowX: 'auto' }}>
              {WORKFLOW.map((w, i) => {
                const done = w.id < stage; const active = w.id === stage
                return (
                  <div key={w.id} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <button onClick={() => setStage(w.id)} style={{
                      flex: 1, padding: '10px 8px', textAlign: 'left',
                      opacity: done || active ? 1 : 0.5,
                    }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: 6,
                        background: done ? 'var(--sage)' : active ? 'var(--accent)' : 'var(--line-strong)',
                        color: '#fff', fontSize: 12, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-display)', marginBottom: 4,
                      }}>
                        {done ? <CheckCircle2 size={13} /> : w.id}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: active ? 'var(--accent)' : 'var(--ink)' }}>{w.label}</div>
                      <div style={{ fontSize: 10, color: 'var(--ink-muted)', marginTop: 2 }}>{w.desc}</div>
                    </button>
                    {i < WORKFLOW.length - 1 && <div style={{ height: 1, width: 12, background: done ? 'var(--sage)' : 'var(--line)' }} />}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Current stage content */}
          {stage === 3 && (
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">目標設定 — 5領域別</div>
                <button className="btn btn-ghost btn-sm">過去の計画を複製</button>
              </div>
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {DOMAINS.map((d, i) => (
                  <div key={d} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr', gap: 12, padding: '12px 0', borderBottom: i < DOMAINS.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                    <div>
                      <div className="eyebrow" style={{ color: 'var(--accent)' }}>領域 {i + 1}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3 }}>{d}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--ink-muted)', fontWeight: 600, marginBottom: 4 }}>短期目標（3ヶ月）</div>
                      <textarea rows="2" style={{ width: '100%', resize: 'vertical' }} defaultValue={
                        i === 0 ? '手洗い・うがいを声かけなしで自発的にできる' :
                        i === 1 ? '10分間座って姿勢を保持する' :
                        i === 2 ? 'ルール理解ゲームで順番を守れる' :
                        i === 3 ? '自分の気持ちを短い言葉で伝えられる' :
                        '他児の発言を遮らず最後まで聞く'
                      } />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--ink-muted)', fontWeight: 600, marginBottom: 4 }}>長期目標（6ヶ月）</div>
                      <textarea rows="2" style={{ width: '100%', resize: 'vertical' }} defaultValue={
                        i === 0 ? '基本的生活習慣を自立して実行できる' :
                        i === 1 ? '座位・姿勢の維持時間が30分に延びる' :
                        i === 2 ? '集団活動でルールを尊重できる' :
                        i === 3 ? '2文以上で要求・感情を伝えられる' :
                        'グループワークに継続的に参加できる'
                      } />
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8, borderTop: '1px solid var(--line)' }}>
                  <button className="btn btn-ghost btn-sm">下書き保存</button>
                  <button className="btn btn-primary btn-sm" onClick={() => setStage(4)}>次のステップへ <ChevronRight size={12} /></button>
                </div>
              </div>
            </div>
          )}

          {stage !== 3 && (
            <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--ink-muted)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 8 }}>Stage {stage} - {WORKFLOW.find(w => w.id === stage)?.label}</div>
              <div style={{ fontSize: 12 }}>このステージの入力画面はモック簡略化のため省略しています</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
