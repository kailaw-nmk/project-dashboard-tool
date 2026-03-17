# Phase 2: レイアウト・ダッシュボードUI 実装計画

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** ヘッダー、サイドナビ、フッターの共通レイアウトと、ダッシュボードのサマリー・ネットワーク図・テーブル一覧の3タブビューを構築する。

**Architecture:** App Routerの`page.tsx`をレイアウトシェル（ヘッダー+サイドナビ+メインエリア+フッター）で包み、メインエリアにactiveViewに応じたコンテンツを切り替え表示する。ダッシュボードビューは3タブ（サマリー/ネットワーク図/テーブル）構成。データ未読込時はPhase 1のウェルカム画面を表示。

**Tech Stack:** Next.js 15 App Router, shadcn/ui (Tabs, Badge, Table, Sheet, Tooltip, ScrollArea), Lucide React, Zustand, React Flow (@xyflow/react)

---

## 現状の前提

- Phase 1完了: 型定義、ストア、データI/O、ウェルカム画面が動作
- `src/components/layout/`, `src/components/dashboard/`, `src/components/system/` は空ディレクトリ
- shadcn/ui 14コンポーネント導入済み
- ストアに `activeView`, `selectedSystemId`, `setActiveView`, `setSelectedSystemId` あり

## 実装順序と依存関係

```
1. src/components/layout/header.tsx         ← 依存なし
2. src/components/layout/sidebar.tsx        ← store に依存
3. src/components/layout/footer.tsx         ← 依存なし
4. src/components/layout/app-shell.tsx      ← header, sidebar, footer に依存
5. src/components/dashboard/status-summary.tsx  ← store に依存
6. src/components/dashboard/system-card.tsx     ← schema に依存
7. src/components/dashboard/summary-view.tsx    ← status-summary, system-card に依存
8. src/components/dashboard/network-view.tsx    ← React Flow, store に依存
9. src/components/dashboard/table-view.tsx      ← shadcn Table, store に依存
10. src/components/dashboard/dashboard-tabs.tsx ← summary, network, table に依存
11. src/components/system/system-detail-sheet.tsx ← Sheet, store に依存
12. src/app/page.tsx 更新                       ← app-shell, dashboard-tabs, system-detail に依存
```

---

## Step 1: `src/components/layout/header.tsx` (~50行)

`'use client'` 必須。

ヘッダーバー。仕様書3.1に準拠。

**内容:**
- 左: アイコン + 「Project Dashboard」テキスト（プロジェクト名はデータ読込後に表示）
- 右: JSONインポート、JSONエクスポート、PNGエクスポートボタン（アイコンボタン + Tooltip）
- Props: `projectData: ProjectData | null`, `onImport: (file: File) => void`, `onExport: () => void`
- インポートは hidden input[type=file] + ボタンクリック
- PNGエクスポートボタンはdisabled（Phase 4で有効化）

**UIパーツ:**
- `Button` (variant="ghost", size="icon")
- `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider`
- Lucide: `LayoutDashboard`, `Upload`, `Download`, `Image`

**スタイル:**
- `h-14 border-b bg-white` で固定ヘッダー
- flexbox で左右配置

## Step 2: `src/components/layout/sidebar.tsx` (~60行)

`'use client'` 必須。

サイドナビゲーション。仕様書3.4に準拠。

**内容:**
- ナビ項目: 概要(dashboard), システム(system), 履歴(history), 設定(settings)
- 各項目にLucideアイコン + テキスト
- activeViewと一致する項目をハイライト（`bg-zinc-100` + `text-zinc-900` + `font-medium`）
- クリックで `setActiveView()` 呼び出し
- separator で「設定」を分離

**UIパーツ:**
- `Button` (variant="ghost")
- `Separator`
- Lucide: `LayoutGrid`, `Monitor`, `History`, `Settings`

**スタイル:**
- `w-56 border-r bg-white` 固定幅サイドバー
- `flex flex-col` で縦並び

## Step 3: `src/components/layout/footer.tsx` (~20行)

シンプルなフッター。

**内容:**
- 左: 最終更新日時（`projectData.lastUpdated`をフォーマット）
- 右: バージョン情報（`projectData.version`）
- データ未読込時は非表示（親で制御）

**スタイル:**
- `h-10 border-t bg-white text-xs text-zinc-500`

## Step 4: `src/components/layout/app-shell.tsx` (~40行)

`'use client'` 必須。

全体レイアウトのシェル。Header, Sidebar, Footer, メインコンテンツエリアを組み合わせる。

**構造:**
```
<div className="flex h-screen flex-col">
  <Header ... />
  <div className="flex flex-1 overflow-hidden">
    <Sidebar />
    <main className="flex-1 overflow-auto bg-zinc-50 p-6">
      {children}
    </main>
  </div>
  <Footer ... />
</div>
```

**Props:** `children: React.ReactNode`
- ストアから `projectData`, `setProjectData`, `clearProjectData` を取得
- Header にインポート/エクスポートのコールバックを渡す

## Step 5: `src/components/dashboard/status-summary.tsx` (~50行)

ステータス別のサマリーカード行。仕様書タブ1上部。

**内容:**
- 設定の`statusOptions`をループし、各ステータスのシステム数をカウント
- 各ステータスをカード表示: 色付きドット + ラベル + 件数
- ステータスの `color` を動的にスタイル適用（`style={{ backgroundColor }}` でドットの色）

**Props:** `systems: System[]`, `statusOptions: StatusOption[]`

**スタイル:**
- グリッド4列 (`grid grid-cols-4 gap-4`)
- 各カード: `rounded-lg border p-4 text-center`

## Step 6: `src/components/dashboard/system-card.tsx` (~60行)

個別システムのカード。仕様書タブ1のグリッドカード。

**内容:**
- システム名、ステータスバッジ（色付き）、フェーズ、担当者
- Open Issue数、リスク数（keyItemsのtype="risk"かつstatus!="closed"）
- コメント（1行省略 `line-clamp-2`）
- クリックで `setSelectedSystemId(system.id)` を呼び出し

**Props:** `system: System`, `statusOption: StatusOption | undefined`, `phaseOption: PhaseOption | undefined`, `onClick: () => void`

**UIパーツ:**
- `Card`, `CardHeader`, `CardContent`
- `Badge`

## Step 7: `src/components/dashboard/summary-view.tsx` (~50行)

サマリータブの全体コンテンツ。StatusSummary + SystemCardグリッド。

**内容:**
- StatusSummary コンポーネント
- システムカードのグリッド表示（`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`）
- 各カードクリックで `setSelectedSystemId` を呼び出し

**Props なし** — ストアから直接データ取得

## Step 8: `src/components/dashboard/network-view.tsx` (~120行)

React Flowによるネットワーク図。仕様書タブ2。

**内容:**
- ストアの`systems`をReact Flowノードに変換
  - ノードID = system.id
  - position = system.position
  - data = { label: system.name, status, statusOption }
  - type = 'systemNode'（カスタムノード）
- ストアの`dependencies`をReact Flowエッジに変換
  - id = dependency.id
  - source = sourceSystemId, target = targetSystemId
  - label = dependency.label
  - animated = true（依存タイプ別の色分け: api=blue, data=green, event=orange, other=gray）
- カスタムノード `SystemNode`: ステータス色付きのボーダー + システム名 + フェーズ表示
- ノードドラッグ終了時に `updateSystem(id, { position })` でストアに位置保存
- ノードクリックで `setSelectedSystemId`
- フィットビュー初期表示

**UIパーツ:**
- `@xyflow/react`: `ReactFlow`, `Background`, `Controls`, `MiniMap`, `Handle`, `Position`
- `useNodesState`, `useEdgesState`, `useReactFlow`

**重要:** `@xyflow/react/dist/style.css` のインポート必須

## Step 9: `src/components/dashboard/table-view.tsx` (~80行)

テーブル一覧ビュー。仕様書タブ3。

**内容:**
- shadcn/ui Table でシステム一覧を表形式表示
- 列: 名前, ステータス, フェーズ, Open Issues, リスク件数, 担当者, コメント
- ステータス列: 色付きドット + ラベルテキスト
- 行クリックで `setSelectedSystemId`
- 行ホバーでカーソル pointer

**UIパーツ:**
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`
- `Badge`

## Step 10: `src/components/dashboard/dashboard-tabs.tsx` (~40行)

3タブの切り替えコンテナ。

**内容:**
- shadcn/ui Tabs で「サマリー」「ネットワーク図」「一覧」の3タブ
- 各タブの value: `summary`, `network`, `table`
- デフォルト: `summary`
- タブごとに SummaryView, NetworkView, TableView を表示

**UIパーツ:**
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- Lucide: `LayoutGrid`, `Network`, `List`

## Step 11: `src/components/system/system-detail-sheet.tsx` (~120行)

システム詳細のサイドシート。仕様書3.3に準拠。

**内容:**
- Sheet (side="right") で開く
- `selectedSystemId` が non-null のとき open
- 閉じる時に `setSelectedSystemId(null)`
- 表示内容:
  - ヘッダー: システム名 + ステータスバッジ
  - 基本情報: フェーズ、担当者、コメント（readonly表示）
  - 依存関係一覧: このシステムがsource/targetの依存を表示
  - Issue一覧: priority別にソート表示（statusアイコン付き）
  - キーアイテム一覧: type別グルーピング表示
- 編集機能はPhase 3で追加（ここではreadonly）

**UIパーツ:**
- `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription`
- `Badge`, `Separator`, `ScrollArea`

## Step 12: `src/app/page.tsx` 更新 (~60行)

`'use client'` 必須。

**変更内容:**
- データ未読込時: 現在のウェルカム画面をそのまま維持
- データ読込後: `AppShell` でラップし、`activeView` に応じたコンテンツを表示
  - `dashboard`: `<DashboardTabs />` + `<SystemDetailSheet />`
  - `system`: Phase 3で実装（仮に「システム管理 - 準備中」テキスト）
  - `history`: Phase 4で実装（仮に「履歴 - 準備中」テキスト）
  - `settings`: Phase 5で実装（仮に「設定 - 準備中」テキスト）

---

## 検証手順

### ローカル検証 (`npm run dev`)
1. ウェルカム画面 → サンプルデータ読込 → レイアウト（ヘッダー+サイドナビ+フッター）が表示される
2. サマリータブ: ステータスサマリー4色カード + システムカード8枚がグリッド表示
3. ネットワーク図タブ: React Flowでノード8個+エッジ12本が表示、ドラッグ可能
4. テーブル一覧タブ: 8システムが表形式で表示
5. システムカード/テーブル行/ノードクリック → サイドシートが右から開き詳細表示
6. サイドナビの項目クリック → ビュー切り替え
7. ヘッダーのエクスポートボタン → JSONダウンロード
8. ヘッダーのインポートボタン → JSONファイル選択でデータ再読込

### ビルド検証
1. `npm run build` がエラーなく完了
2. TypeScript型チェックエラーなし

---

## 注意事項
- React Flow: `@xyflow/react` をインポート。`reactflow` ではない（v12以降のパッケージ名変更）
- React Flow のCSSインポート: `@xyflow/react/dist/style.css` を network-view.tsx 内でインポート
- React Flow は SSR非対応なので `'use client'` 必須
- カスタムノードは `memo()` でラップしてパフォーマンス最適化
- ノード位置変更時の `onNodeDragStop` でストア更新（`onNodesChange` だと頻繁すぎる）
- shadcn/ui の Tabs は `@base-ui/react/tabs` ベース。value に string を使用
