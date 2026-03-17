# Project Dashboard Tool

Systems of Systems の各システム開発状況を一元管理・可視化するWebダッシュボード。

**デモ:** https://project-dashboard-gamma-ten.vercel.app

## 機能

- **ダッシュボード** — ステータスサマリー、React Flowネットワーク図、システム一覧テーブル
- **システム管理** — システム/Issue/キーアイテム/依存関係のCRUD
- **履歴管理** — Weeklyスナップショット保存、ステータス推移グラフ、Issue推移グラフ
- **設定** — ステータスラベル/色、フェーズ、キーアイテムタイプのカスタマイズ
- **エクスポート** — JSONデータダウンロード、サマリービューPNGダウンロード
- **インポート** — JSONファイル読み込み（Zodバリデーション付き）

## 技術スタック

| カテゴリ | 技術 |
|----------|------|
| フレームワーク | Next.js 15 (App Router, Static Export) |
| UI | React 19, TypeScript 5, Tailwind CSS v4, shadcn/ui |
| 状態管理 | Zustand |
| グラフ | React Flow (ネットワーク図), Recharts (推移グラフ) |
| フォーム | React Hook Form + Zod v4 |
| エクスポート | html-to-image (PNG) |
| テスト | Vitest |
| デプロイ | Vercel |

## セットアップ

### 必要環境

- Node.js 18+
- npm

### インストール

```bash
git clone https://github.com/kailaw-nmk/project-dashboard-tool.git
cd project-dashboard-tool
npm install
```

### 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアクセス。

### ビルド

```bash
npm run build
```

`out/` ディレクトリに静的ファイルが生成される。

### テスト

```bash
npm test
```

39件のユニットテスト（ストアCRUD、フォームバリデーション、スナップショット生成）。

## 使い方

1. アプリを開くとウェルカム画面が表示される
2. 「サンプルデータを読み込む」でデモデータを表示、または「JSONファイルをインポート」で既存データを読み込む
3. サイドナビから各画面に遷移:
   - **ダッシュボード** — サマリー/ネットワーク図/一覧を切り替え
   - **システム** — システムの追加・編集・削除
   - **履歴** — スナップショット保存・推移グラフ閲覧
   - **設定** — ステータスやフェーズのカスタマイズ
4. ヘッダー右上のボタンからJSON/PNGエクスポート

## データ管理

サーバーサイドAPIは使用しない。データはJSONファイルで管理する:

- **エクスポート**: ヘッダーのダウンロードボタンでJSONファイルをダウンロード
- **インポート**: ヘッダーのアップロードボタン、またはウェルカム画面からJSONファイルを読み込み
- **サンプルデータ**: 8システム、4週分のスナップショットを含むデモデータ

## ディレクトリ構成

```
src/
├── app/                    # Next.js App Router
├── components/
│   ├── ui/                 # shadcn/ui コンポーネント
│   ├── layout/             # ヘッダー、サイドナビ、フッター
│   ├── dashboard/          # サマリー、ネットワーク図、テーブル
│   ├── system/             # システム詳細、CRUD フォーム
│   ├── history/            # 履歴、推移グラフ
│   └── settings/           # 設定画面
├── stores/                 # Zustand ストア
├── types/                  # TypeScript型定義 + Zodスキーマ
├── lib/                    # ユーティリティ
├── hooks/                  # カスタムフック
└── __tests__/              # ユニットテスト
```

## ライセンス

MIT
