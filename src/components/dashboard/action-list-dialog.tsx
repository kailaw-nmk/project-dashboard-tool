'use client'

import { useRef } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  ActionListSection,
  type ActionListSectionHandle,
} from '@/components/system/action-list-section'
import type { Action } from '@/types/schema'

interface ActionListDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  systemId: string
  itemId: string
  itemTitle: string
  itemKind: 'issue' | 'keyItem'
  actions: Action[]
}

export function ActionListDialog({
  open,
  onOpenChange,
  systemId,
  itemId,
  itemTitle,
  itemKind,
  actions,
}: ActionListDialogProps) {
  const sectionRef = useRef<ActionListSectionHandle>(null)

  const handleSave = () => {
    sectionRef.current?.save()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">アクション管理</DialogTitle>
          <DialogDescription className="truncate">{itemTitle}</DialogDescription>
        </DialogHeader>
        <div className="py-2 max-h-[60vh] overflow-y-auto">
          <ActionListSection
            ref={sectionRef}
            systemId={systemId}
            itemId={itemId}
            itemKind={itemKind}
            actions={actions}
          />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>キャンセル</DialogClose>
          <Button onClick={handleSave}>保存して閉じる</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
