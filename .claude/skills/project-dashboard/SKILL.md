---
name: project-dashboard
description: Project Dashboard Toolの開発で使うパターン集。新しいコンポーネント追加、Zustandストア操作、JSONスキーマ拡張、React Flow操作時に参照する。
---

# Project Dashboard Tool - 開発パターン集

## 新しいシステム属性を追加する手順

1. `src/types/schema.ts` に型定義を追加
2. Zodスキーマにバリデーション追加
3. `src/stores/project-store.ts` のアクションを更新
4. 関連するUIコンポーネントを更新
5. サンプルデータ (`src/lib/sample-data.ts`) を更新
6. JSONバージョンを上げる（必要に応じて）

## コンポーネント作成パターン

```typescript
// 基本パターン: shadcn/ui + Tailwind
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProjectStore } from '@/stores/project-store';

export function SystemCard({ systemId }: { systemId: string }) {
  const system = useProjectStore((state) =>
    state.systems.find((s) => s.id === systemId)
  );

  if (!system) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{system.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* 内容 */}
      </CardContent>
    </Card>
  );
}
```

## Zustandストア操作パターン

```typescript
// 選択的購読（再レンダリング最小化）
const systems = useProjectStore((state) => state.systems);
const addSystem = useProjectStore((state) => state.addSystem);

// ❌ 避ける: ストア全体の購読
const store = useProjectStore();
```

## React Flow カスタムノードパターン

```typescript
'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';

export function SystemNode({ data }: NodeProps) {
  return (
    <div className="rounded-lg border bg-card p-3 shadow-sm">
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{data.label}</span>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
```

## PNGエクスポートパターン

```typescript
import { toPng } from 'html-to-image';

async function exportSummaryAsPng(elementRef: HTMLElement, projectName: string) {
  const dataUrl = await toPng(elementRef, {
    backgroundColor: '#ffffff',
    pixelRatio: 2,
  });

  const link = document.createElement('a');
  link.download = `${projectName}_summary_${new Date().toISOString().split('T')[0]}.png`;
  link.href = dataUrl;
  link.click();
}
```

## JSONインポート/エクスポートパターン

```typescript
// インポート
function handleImport(file: File) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string);
      const validated = projectSchema.parse(data); // Zodバリデーション
      useProjectStore.getState().setProjectData(validated);
    } catch (error) {
      // 日本語エラーメッセージ表示
    }
  };
  reader.readAsText(file);
}

// エクスポート
function handleExport() {
  const data = useProjectStore.getState().getProjectData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${data.projectName}_${new Date().toISOString().split('T')[0]}.json`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
```

## ステータス信号機カラーマッピング

```typescript
const statusColors: Record<string, string> = {
  'on-track': 'bg-green-500',  // 🟢 順調
  'at-risk': 'bg-yellow-500',  // 🟡 注意
  'delayed': 'bg-red-500',     // 🔴 遅延
  'stopped': 'bg-gray-500',    // ⚫ 停止
};
```
