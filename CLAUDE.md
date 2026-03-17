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
- React Flow (@xyflow/react) (ネットワーク図)
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
│   ├── snapshot.ts          # スナップショット生成
│   └── sample-data.ts      # サンプルデータ
├── hooks/
│   └── use-project.ts      # カスタムフック
└── __tests__/              # ユニットテスト
    ├── project-store.test.ts
    ├── form-schemas.test.ts
    └── snapshot.test.ts
```

## コーディング規約
- UIの言語はすべて日本語
- コンポーネントは関数コンポーネント + hooks
- 型定義は `types/schema.ts` に集約
- shadcn/uiのコンポーネントを最大限活用
- Tailwind CSSでスタイリング（インラインスタイル不使用）
- エラーハンドリングは日本語メッセージ
- `'use client'` ディレクティブを適切に使用（Next.js App Router）

## 重要な設計判断
- サーバーサイドAPIは一切不要（Static Export）
- localStorageは使わない（データはJSONファイルで管理）
- 認証機能は不要
- React FlowのノードはカスタムノードとしてStyledコンポーネントを作成
- PNGエクスポートはサマリービュー限定
- システム間の依存関係はReact Flowで矢印付きネットワーク図として表示

## データモデル概要
- JSONファイルでプロジェクト全体のデータを管理
- システム → Issues（1:N）、キーアイテム（1:N）
- システム間の依存関係（N:N）
- Weeklyスナップショットで履歴管理
- 詳細は SPECIFICATION.md セクション4 を参照

## 実装状況
全機能実装完了:
- Phase 1: 基盤構築（型定義、Zustandストア、データI/O、ウェルカム画面）
- Phase 2: レイアウト・ダッシュボードUI（ヘッダー/サイドナビ/フッター、サマリー/ネットワーク図/一覧の3タブ）
- Phase 3: システム管理・編集機能（システム/Issue/キーアイテム/依存関係のCRUD）
- Phase 4: 履歴・スナップショット機能（Weekly保存、Rechartsグラフ2種）
- Phase 5: 設定画面（ステータス/フェーズ/キーアイテムタイプ編集）
- Phase 6: エクスポート（JSON + PNGダウンロード）

## テスト
- Vitest + jsdom 環境
- `npm test` で実行（39テスト）
- テスト対象: Zustandストア全CRUDアクション、Zodフォームバリデーション、スナップショット生成ロジック
- テストファイル: `src/__tests__/` 配下

## デプロイ
- Vercel（無料枠）: https://project-dashboard-gamma-ten.vercel.app
- `next.config.ts` で `output: 'export'` 設定
- GitHub連携で自動デプロイ（masterプッシュで自動反映）
- リポジトリ: https://github.com/kailaw-nmk/project-dashboard-tool
