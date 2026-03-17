# Claude Code 環境設定ガイド

## 1. CLAUDE.md（プロジェクトルートに配置）

Claude Codeがプロジェクトのコンテキストを理解するためのファイル。

```markdown
# Project Dashboard Tool

## プロジェクト概要
Systems of Systems の各システム開発状況を一元管理・可視化するWebダッシュボード。
プロジェクトマネージャーがWeekly単位で各システムの状況を更新・管理する。

## 技術スタック
- Next.js 15 (App Router, Static Export)
- React 19
- TypeScript 5
- Tailwind CSS v4
- shadcn/ui (UIコンポーネント)
- Zustand (状態管理)
- React Flow (ネットワーク図)
- Recharts (チャート)
- html-to-image (PNGエクスポート)
- React Hook Form + Zod (フォームバリデーション)
- date-fns (日付操作)
- Lucide React (アイコン)

## アーキテクチャ
- 完全クライアントサイドSPA（サーバーサイド処理なし）
- データはローカルJSONファイルのインポート/エクスポートで管理
- Zustandストアでアプリ全体の状態を管理
- Static Export (`output: 'export'`) でVercelにデプロイ

## ディレクトリ構成
```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # ルートレイアウト
│   ├── page.tsx            # メインページ
│   └── globals.css         # グローバルスタイル
├── components/
│   ├── ui/                 # shadcn/ui コンポーネント
│   ├── layout/             # ヘッダー、サイドナビ、フッター
│   ├── dashboard/          # サマリー、ネットワーク図、テーブル
│   ├── system/             # システム詳細、Issue、キーアイテム
│   ├── history/            # Weekly履歴、推移グラフ
│   └── settings/           # 設定画面
├── stores/
│   └── project-store.ts    # Zustandストア（全データ管理）
├── types/
│   └── schema.ts           # TypeScript型定義 + Zodスキーマ
├── lib/
│   ├── utils.ts            # ユーティリティ関数
│   ├── export.ts           # JSON/PNGエクスポート
│   ├── import.ts           # JSONインポート + バリデーション
│   └── sample-data.ts      # サンプルデータ
└── hooks/
    └── use-project.ts      # カスタムフック
```

## コーディング規約
- UIの言語はすべて日本語
- コンポーネントは関数コンポーネント + hooks
- 型定義は `types/schema.ts` に集約
- shadcn/uiのコンポーネントを最大限活用
- Tailwind CSSでスタイリング（インラインスタイル不使用）
- エラーハンドリングは日本語メッセージ
- `'use client'` ディレクティブを適切に使用

## 重要な設計判断
- サーバーサイドAPIは一切不要（Static Export）
- localStorageは使わない（データはJSONファイルで管理）
- 認証機能は不要
- React FlowのノードはカスタムノードとしてStyledコンポーネントを作成
- PNGエクスポートはサマリービュー限定

## テスト
- Vitest + React Testing Library
- 主要なストアロジックとバリデーションのユニットテスト
- E2Eテストは不要（v1スコープ外）

## デプロイ
- Vercel（無料枠）
- `next.config.ts` で `output: 'export'` 設定
- GitHub連携で自動デプロイ
```

---

## 2. プロジェクト初期セットアップ手順

### 2.1 リポジトリ作成

```bash
# リポジトリ作成
gh repo create project-dashboard-tool --public --clone
cd project-dashboard-tool

# Next.jsプロジェクト作成
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

### 2.2 依存パッケージインストール

```bash
# UI
npx shadcn@latest init
npx shadcn@latest add button card dialog sheet input select badge tabs table tooltip dropdown-menu alert-dialog separator scroll-area

# 状態管理
npm install zustand

# ネットワーク図
npm install @xyflow/react

# チャート
npm install recharts

# PNGエクスポート
npm install html-to-image

# フォーム
npm install react-hook-form @hookform/resolvers zod

# ユーティリティ
npm install date-fns lucide-react

# 開発
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

### 2.3 設定ファイル

#### next.config.ts
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

#### tsconfig.json（パス設定確認）
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 3. Vercelデプロイ設定

### 3.1 vercel.json（不要だが念のため）

Static Exportの場合、Vercelは自動検知するため基本的に不要。
必要になった場合のみ以下を配置:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "out"
}
```

### 3.2 GitHub連携

1. GitHubリポジトリをVercelに接続
2. Framework Preset: Next.js（自動検知）
3. Build Command: `npm run build`
4. Output Directory: `out`（Static Export時）

---

## 4. Claude Code ワークフロー

### 4.1 推奨開発順序

```
Phase 1: 基盤構築
  1. TypeScript型定義 + Zodスキーマ作成
  2. Zustandストア実装
  3. サンプルデータ作成
  4. JSON インポート/エクスポート機能

Phase 2: UI構築
  5. レイアウト（ヘッダー、サイドナビ、メインエリア）
  6. ウェルカム画面
  7. サマリービュー
  8. テーブル一覧ビュー
  9. システム詳細パネル（シート）

Phase 3: 高度な機能
  10. React Flow ネットワーク図
  11. Issue管理 CRUD
  12. キーアイテム管理 CRUD
  13. 依存関係管理

Phase 4: 履歴・エクスポート
  14. Weekly スナップショット機能
  15. 推移グラフ（Recharts）
  16. PNGエクスポート
  17. 設定画面

Phase 5: 仕上げ
  18. レスポンシブ対応
  19. エラーハンドリング強化
  20. パフォーマンス最適化
  21. テスト作成
```

### 4.2 Claude Codeへの指示テンプレート

各フェーズでClaude Codeに渡す指示の例:

```
# Phase 1 の指示例
SPECIFICATION.md を読んで、以下を実装してください:

1. `src/types/schema.ts` に仕様書のデータモデル（セクション4）に基づくTypeScript型定義とZodスキーマを作成
2. `src/stores/project-store.ts` にZustandストアを作成。以下のアクションを含む:
   - setProjectData(data) - JSONインポート時のデータセット
   - addSystem / updateSystem / deleteSystem
   - addIssue / updateIssue / deleteIssue
   - addKeyItem / updateKeyItem / deleteKeyItem
   - addDependency / updateDependency / deleteDependency
   - saveSnapshot() - Weekly スナップショット保存
   - getProjectData() - JSONエクスポート用のデータ取得
3. `src/lib/sample-data.ts` にサンプルデータを作成（仕様書セクション9参照）
4. `src/lib/import.ts` と `src/lib/export.ts` にインポート/エクスポートロジックを実装
```

---

## 5. .gitignore

```
# dependencies
/node_modules
/.pnp
.pnp.js

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*

# env
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
```

---

## 6. package.json scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}
```
