# Phase 2 引継ぎドキュメント

## 次のセッションでやること

Phase 2「レイアウト・ダッシュボードUI」を実装する。

**実行手順:**
1. この計画ファイルを読む: `docs/plans/2026-03-17-phase2-layout-dashboard.md`
2. `superpowers:executing-plans` スキルを使って、Step 1〜12を順番に実装する

---

## 現在の状態

### 完了済み: Phase 1 基盤構築 (commit `682d486`)

| ファイル | 内容 |
|---|---|
| `src/types/schema.ts` | Zodスキーマ12個 + TypeScript型（ProjectData, System, Issue, KeyItem, Dependency等） |
| `src/stores/project-store.ts` | Zustandストア: CRUD操作 + UI状態（activeView, selectedSystemId） |
| `src/lib/sample-data.ts` | `loadSampleData()` - sample-data.jsonをZod検証して返す |
| `src/lib/import.ts` | `importProjectData(file)` - JSONインポート+日本語エラー |
| `src/lib/export.ts` | `exportProjectDataAsJson(data)` + `exportSummaryAsPng()` スタブ |
| `src/hooks/use-project.ts` | `useProject()`, `useProjectData()`, `useSelectedSystem()`, `useActiveView()` |
| `src/app/page.tsx` | ウェルカム画面（未読込時）/ サマリー画面（読込後） |
| `src/app/layout.tsx` | `lang="ja"`, 日本語メタデータ |

### ディレクトリ構造

```
src/components/
├── ui/           ← shadcn/ui 14コンポーネント（button, card, tabs, table, sheet, badge, tooltip等）
├── layout/       ← 空（Phase 2で作成）
├── dashboard/    ← 空（Phase 2で作成）
├── system/       ← 空（Phase 2で作成）
├── history/      ← 空（Phase 4で使用）
└── settings/     ← 空（Phase 5で使用）
```

### ブランチ

- `master` ブランチ、リモートと同期済み
- Phase 2の作業はmasterで直接コミットしてOK

### 技術スタック確認済み

- Zod 4.3.6（v3互換API: `z.object()`, `safeParse()`, `z.infer<>` 動作確認済み）
- Zustand 5.0.12（`create<T>()((set, get) => ...)` パターン）
- Next.js 16.1.7（Turbopack, Static Export）
- shadcn/ui は `@base-ui/react` ベース（Radixではない）
- `resolveJsonModule: true` 有効

### 仕様書

- `SPECIFICATION.md` にUI仕様・データモデル・画面構成の全詳細あり
- `CLAUDE.md` にコーディング規約・アーキテクチャ方針あり
- `sample-data.json` に8システム・12依存関係・4週スナップショットのテストデータあり

---

## 注意点

- UIの言語はすべて日本語
- `'use client'` ディレクティブを全コンポーネントに付ける
- React Flowは `@xyflow/react` からインポート（`reactflow` ではない）
- React FlowのCSS: `@xyflow/react/dist/style.css` を忘れずにインポート
- shadcn/ui の Tabs は `@base-ui/react/tabs` ベース
- `npm run build` でStatic Exportが通ることを各バッチ後に確認
