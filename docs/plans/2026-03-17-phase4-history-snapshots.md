# Phase 4: 履歴・スナップショット機能 実装計画

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Weekly スナップショットの保存・管理と、ステータス/Issue推移グラフを提供する履歴ビューを実装する。

**Architecture:** サイドナビ「履歴」をタブ分割型で実装。タブ1「スナップショット管理」はスナップショット保存ボタン + サマリー入力 + 履歴一覧テーブル。タブ2「推移グラフ」はRecharts で積み上げエリアチャート（ステータス分布）と折れ線グラフ（Issue推移）。既存の `saveSnapshot` ストアアクションと `weeklySnapshots` データを活用。

**Tech Stack:** React 19, Recharts 3, Zustand, shadcn/ui (Tabs, Table, Button, Input, Card, Select), date-fns

---

## Context

### 既存の再利用コード

- `src/stores/project-store.ts` — `saveSnapshot(snapshot)` アクション（同一week上書き対応済み）
- `src/types/schema.ts` — `WeeklySnapshot`, `WeeklySystemSnapshot` 型
- `src/components/ui/` — Tabs, Table, Button, Input, Card, Select, Badge
- `sample-data.json` — 4件のスナップショット (W09〜W12) あり
- `src/components/dashboard/dashboard-tabs.tsx` — タブ実装パターンの参照

### データ構造（WeeklySnapshot）

```json
{
  "week": "2026-W12",
  "date": "2026-03-17T10:00:00Z",
  "systems": [
    { "systemId": "sys-001", "status": "on-track", "phase": "testing",
      "comment": "...", "openIssues": 2, "openRisks": 0, "openKeyItems": 3 }
  ],
  "summary": "全体コメント"
}
```

---

## 実装ステップ（5ファイル新規 + 1ファイル変更）

masterブランチに直接コミット。2バッチに分割。

---

### Batch A: スナップショット管理タブ（Step 1〜3）

| # | ファイル | 概要 | ~行数 |
|---|---|---|---|
| 1 | `src/lib/snapshot.ts` | スナップショット生成ヘルパー | ~30 |
| 2 | `src/components/history/snapshot-tab.tsx` | スナップショット管理タブ（保存 + 一覧） | ~180 |
| 3 | `src/components/history/history-tabs.tsx` | 履歴ビューのタブコンテナ | ~40 |

**Step 1: snapshot.ts — スナップショット生成ヘルパー**

ファイル: `src/lib/snapshot.ts`

現在のシステム状態からWeeklySnapshotを生成する関数。

```typescript
import type { System, WeeklySnapshot, WeeklySystemSnapshot } from '@/types/schema'

export function createSnapshot(
  systems: System[],
  currentWeek: string,
  summary: string,
): WeeklySnapshot {
  const systemSnapshots: WeeklySystemSnapshot[] = systems.map((s) => ({
    systemId: s.id,
    status: s.status,
    phase: s.phase,
    comment: s.comment,
    openIssues: s.issues.filter((i) => i.status !== 'closed').length,
    openRisks: s.keyItems.filter((k) => k.type === 'risk' && k.status !== 'closed').length,
    openKeyItems: s.keyItems.filter((k) => k.status !== 'closed').length,
  }))

  return {
    week: currentWeek,
    date: new Date().toISOString(),
    systems: systemSnapshots,
    summary,
  }
}
```

**Step 2: snapshot-tab.tsx — スナップショット管理タブ**

ファイル: `src/components/history/snapshot-tab.tsx`

構成:
- ヘッダー: 現在の週表示 + 「今週の状況を記録」ボタン
- サマリー入力: textarea（保存前に入力）
- 履歴一覧テーブル: 週番号 / 日時 / サマリー / システム数 列
- 既に同じ週のスナップショットがある場合は「上書き」表示

State管理:
```
summary: string — サマリーテキスト入力
```

ストアから取得:
```
projectData.currentWeek
projectData.systems
projectData.weeklySnapshots
projectData.settings.statusOptions
saveSnapshot
```

テーブル行: weeklySnapshots を week の降順（最新が上）で表示。各行にステータスバッジ内訳（on-track: N, at-risk: N 等）を表示。

「今週の状況を記録」ボタン:
1. `createSnapshot(systems, currentWeek, summary)` でスナップショット生成
2. `saveSnapshot(snapshot)` で保存
3. summary をクリア

**Step 3: history-tabs.tsx — 履歴ビューのタブコンテナ**

ファイル: `src/components/history/history-tabs.tsx`

DashboardTabs と同じパターン:
```tsx
<Tabs defaultValue="snapshot">
  <TabsList>
    <TabsTrigger value="snapshot"><Camera /> スナップショット</TabsTrigger>
    <TabsTrigger value="chart"><TrendingUp /> 推移グラフ</TabsTrigger>
  </TabsList>
  <TabsContent value="snapshot"><SnapshotTab /></TabsContent>
  <TabsContent value="chart"><ChartTab /></TabsContent>
</Tabs>
```

**検証:** `npm run build` 通ること（ChartTab は仮のプレースホルダー）

---

### Batch B: 推移グラフタブ + page.tsx統合（Step 4〜5）

| # | ファイル | 概要 | ~行数 |
|---|---|---|---|
| 4 | `src/components/history/chart-tab.tsx` | 推移グラフタブ（Recharts） | ~200 |
| 5 | `src/app/page.tsx` 変更 | HistoryTabs統合 | +2 |

**Step 4: chart-tab.tsx — 推移グラフタブ**

ファイル: `src/components/history/chart-tab.tsx`

構成:
- **ステータス推移グラフ**（積み上げエリアチャート）
  - X軸: 週番号（W09, W10, ...）
  - Y軸: システム数
  - エリア: 各ステータス（settings.statusOptions の色を使用）
  - データ変換: snapshots → 各週のステータス別カウント

- **Issue推移グラフ**（折れ線グラフ）
  - X軸: 週番号
  - Y軸: 件数
  - 線1: Open Issue 合計
  - 線2: Open リスク 合計

データ変換ロジック:
```typescript
// ステータス推移データ
const statusChartData = snapshots.map((snap) => {
  const counts: Record<string, number> = {}
  snap.systems.forEach((s) => {
    counts[s.status] = (counts[s.status] ?? 0) + 1
  })
  return { week: snap.week, ...counts }
})

// Issue推移データ
const issueChartData = snapshots.map((snap) => ({
  week: snap.week,
  openIssues: snap.systems.reduce((sum, s) => sum + s.openIssues, 0),
  openRisks: snap.systems.reduce((sum, s) => sum + s.openRisks, 0),
}))
```

Recharts コンポーネント:
```tsx
// ステータス推移
<ResponsiveContainer width="100%" height={300}>
  <AreaChart data={statusChartData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="week" />
    <YAxis allowDecimals={false} />
    <Tooltip />
    <Legend />
    {statusOptions.map((opt) => (
      <Area key={opt.id} type="monotone" dataKey={opt.id}
        name={opt.label} fill={opt.color} stroke={opt.color}
        fillOpacity={0.3} stackId="status" />
    ))}
  </AreaChart>
</ResponsiveContainer>

// Issue推移
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={issueChartData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="week" />
    <YAxis allowDecimals={false} />
    <Tooltip />
    <Legend />
    <Line type="monotone" dataKey="openIssues" name="Open Issue"
      stroke="#ef4444" strokeWidth={2} />
    <Line type="monotone" dataKey="openRisks" name="Open リスク"
      stroke="#f59e0b" strokeWidth={2} />
  </LineChart>
</ResponsiveContainer>
```

スナップショットが2件未満の場合:「推移グラフを表示するには2件以上のスナップショットが必要です。」メッセージ。

**Step 5: page.tsx 変更**

```tsx
import { HistoryTabs } from '@/components/history/history-tabs'

case 'history':
  return <HistoryTabs />
```

**検証:** `npm run build` 通ること

---

## 検証手順（全バッチ完了後）

1. `npm run build` — エラーなし
2. ブラウザテスト:
   - サイドナビ「履歴」→ スナップショットタブ表示
   - サンプルデータの4件のスナップショットが一覧に表示
   - サマリー入力 →「今週の状況を記録」→ スナップショット保存 → 一覧に反映
   - 同じ週で再保存 → 上書きされること
   - 「推移グラフ」タブ → ステータス推移（積み上げエリア）+ Issue推移（折れ線）表示
   - JSONエクスポート → スナップショットデータが含まれること

## 注意事項

- Recharts は `'use client'` 必須（SSR非対応）
- ResponsiveContainer は親要素に明示的な高さが必要
- ステータスの色は `settings.statusOptions` から取得（ハードコード不可）
- 週番号の表示はそのまま "W09" 等で十分（date-fns不要）
