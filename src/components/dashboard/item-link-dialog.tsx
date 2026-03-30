'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { useProjectStore } from '@/stores/project-store'
import type { ItemDependency } from '@/types/schema'

interface LinkSourceTarget {
  systemId: string
  itemId: string
  itemKind: 'issue' | 'keyItem'
  title: string
}

interface ItemLinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  source: LinkSourceTarget
  target: LinkSourceTarget
}

export type { LinkSourceTarget }

export function ItemLinkDialog({ open, onOpenChange, source, target }: ItemLinkDialogProps) {
  const addItemDependency = useProjectStore((s) => s.addItemDependency)
  const [label, setLabel] = useState('')

  const handleSave = () => {
    const dep: ItemDependency = {
      id: crypto.randomUUID(),
      sourceSystemId: source.systemId,
      sourceItemId: source.itemId,
      sourceItemKind: source.itemKind,
      targetSystemId: target.systemId,
      targetItemId: target.itemId,
      targetItemKind: target.itemKind,
      label: label.trim() || '依存',
      createdAt: new Date().toISOString(),
    }
    addItemDependency(dep)
    setLabel('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">アイテム依存関係の作成</DialogTitle>
          <DialogDescription>2つのアイテム間の依存関係を作成します。</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium truncate flex-1">{source.title}</span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="font-medium truncate flex-1">{target.title}</span>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">ラベル</label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="例: ブロック、前提条件、関連"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>キャンセル</DialogClose>
          <Button onClick={handleSave}>作成</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
