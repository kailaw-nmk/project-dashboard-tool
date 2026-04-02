'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export type ExportCategory = 'issue' | 'milestone' | 'risk' | 'decision' | 'dependency'

const categoryOptions: { id: ExportCategory; label: string }[] = [
  { id: 'issue', label: 'Issue' },
  { id: 'milestone', label: 'マイルストーン' },
  { id: 'risk', label: 'リスク' },
  { id: 'decision', label: '決定事項' },
  { id: 'dependency', label: '依存関係' },
]

interface PngExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExport: (categories: Set<ExportCategory>) => void
}

export function PngExportDialog({ open, onOpenChange, onExport }: PngExportDialogProps) {
  const [selected, setSelected] = useState<Set<ExportCategory>>(new Set(['issue', 'milestone', 'risk', 'decision', 'dependency']))

  const toggle = (id: ExportCategory) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const selectAll = () => setSelected(new Set(categoryOptions.map((c) => c.id)))
  const selectNone = () => setSelected(new Set())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">PNGエクスポート</DialogTitle>
          <DialogDescription>エクスポートするアイテムの種類を選択してください。</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 py-3">
          <div className="flex gap-2 mb-1">
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={selectAll}>すべて選択</Button>
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={selectNone}>すべて解除</Button>
          </div>
          {categoryOptions.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={selected.has(cat.id)}
                onChange={() => toggle(cat.id)}
                className="h-4 w-4 rounded border-border"
              />
              {cat.label}
            </label>
          ))}
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>キャンセル</DialogClose>
          <Button
            disabled={selected.size === 0}
            onClick={() => { onExport(selected); onOpenChange(false) }}
          >
            エクスポート
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
