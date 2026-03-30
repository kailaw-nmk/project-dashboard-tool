'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { useProjectStore } from '@/stores/project-store'
import { useShallow } from 'zustand/react/shallow'
import { getCurrentWeek, formatWeekLabel, upsertWeeklyUpdate } from '@/lib/week'
import type { WeeklyUpdate } from '@/types/schema'

interface WeeklyUpdateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  systemId: string
  itemId: string
  itemTitle: string
  itemKind: 'issue' | 'keyItem'
  weeklyUpdates: WeeklyUpdate[]
}

export function WeeklyUpdateDialog({
  open,
  onOpenChange,
  systemId,
  itemId,
  itemTitle,
  itemKind,
  weeklyUpdates,
}: WeeklyUpdateDialogProps) {
  const { updateIssue, updateKeyItem } = useProjectStore(
    useShallow((s) => ({ updateIssue: s.updateIssue, updateKeyItem: s.updateKeyItem })),
  )

  const currentWeek = getCurrentWeek()
  const currentUpdate = weeklyUpdates.find((u) => u.week === currentWeek)
  const pastUpdates = weeklyUpdates.filter((u) => u.week !== currentWeek)

  const [content, setContent] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)

  useEffect(() => {
    if (open) {
      setContent(currentUpdate?.content ?? '')
      setHistoryOpen(false)
    }
  }, [open, currentUpdate])

  const handleSave = () => {
    const newUpdates = upsertWeeklyUpdate(weeklyUpdates, currentWeek, content)
    if (itemKind === 'issue') {
      updateIssue(systemId, itemId, { weeklyUpdates: newUpdates })
    } else {
      updateKeyItem(systemId, itemId, { weeklyUpdates: newUpdates })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">週次アップデート</DialogTitle>
          <DialogDescription className="truncate">{itemTitle}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="outline">{formatWeekLabel(currentWeek)}</Badge>
              {currentUpdate && (
                <span className="text-xs text-muted-foreground">更新済み</span>
              )}
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="今週の進捗・状況を入力..."
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              rows={3}
            />
          </div>

          {/* Past updates */}
          {pastUpdates.length > 0 && (
            <div>
              <button
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setHistoryOpen(!historyOpen)}
              >
                {historyOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                過去の記録 ({pastUpdates.length})
              </button>
              {historyOpen && (
                <div className="mt-2 space-y-2">
                  {pastUpdates.map((u) => (
                    <div key={u.week} className="rounded border p-2 text-sm">
                      <div className="text-xs text-muted-foreground mb-1">{formatWeekLabel(u.week)}</div>
                      <p className="whitespace-pre-wrap text-sm">{u.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>キャンセル</DialogClose>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
