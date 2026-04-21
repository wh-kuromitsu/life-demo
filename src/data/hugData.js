// HUG連携の差分サンプル
export const HUG_STATUS = {
  lastSync: '2026-04-21 08:30',
  nextSync: '2026-04-21 20:00',
  children: 819,
  guardians: 640,
  orgs: 13,
}

export const HUG_DIFF = [
  { type: 'add',    category: '児童', name: '浅野 結衣',    note: '新規登録' },
  { type: 'update', category: '児童', name: '渡辺 颯太',    note: '住所変更' },
  { type: 'update', category: '受給者証', name: '田中 蓮', note: '更新期限: 2026/09/30' },
  { type: 'add',    category: '加算', name: '家族支援加算(Ⅰ)', note: '加算項目' },
  { type: 'update', category: '契約曜日', name: '石川 直樹', note: '火・木 → 火・木・金' },
  { type: 'update', category: '緊急連絡先', name: '森 雄太', note: '緊急連絡先2を更新' },
]

export const HUG_LOGS = [
  { at: '2026-04-21 08:30', kind: 'sync',   msg: '定期同期完了（差分 6件）', status: 'ok' },
  { at: '2026-04-21 00:05', kind: 'sync',   msg: '夜間同期完了', status: 'ok' },
  { at: '2026-04-20 20:00', kind: 'sync',   msg: '定期同期完了（差分 12件）', status: 'ok' },
  { at: '2026-04-20 14:22', kind: 'manual', msg: '手動取込: 受給者証CSV', status: 'ok' },
  { at: '2026-04-20 08:30', kind: 'sync',   msg: '同期エラー: 通信タイムアウト → リトライで成功', status: 'warn' },
]
