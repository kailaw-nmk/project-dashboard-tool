'use client'

import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useProjectStore } from '@/stores/project-store'
import { useShallow } from 'zustand/react/shallow'
import { getCurrentWeek, formatWeekLabel, upsertWeeklyUpdate } from '@/lib/week'
import type { WeeklyUpdate } from '@/types/schema'

interface WeeklyUpdateSectionProps {
  systemId: string
  itemId: string
  itemKind: 'issue' | 'keyItem'
  weeklyUpdates: WeeklyUpdate[]
}

export interface WeeklyUpdateSectionHandle {
  save: () => void
}

export const WeeklyUpdateSection = forwardRef<WeeklyUpdateSectionHandle, WeeklyUpdateSectionProps>(
  function WeeklyUpdateSection({ systemId, itemId, itemKind, weeklyUpdates }, ref) {
    const { updateIssue, updateKeyItem } = useProjectStore(
      useShallow((s) => ({ updateIssue: s.updateIssue, updateKeyItem: s.updateKeyItem })),
    )

    const currentWeek = getCurrentWeek()
    const currentUpdate = weeklyUpdates.find((u) => u.week === currentWeek)
    const pastUpdates = weeklyUpdates.filter((u) => u.week !== currentWeek)
    const [content, setContent] = useState(currentUpdate?.content ?? '')
    const [historyOpen, setHistoryOpen] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
      setContent(currentUpdate?.content ?? '')
      setSaved(false)
    }, [currentUpdate])

    const handleSave = () => {
      const newUpdates = upsertWeeklyUpdate(weeklyUpdates, currentWeek, content)
      if (itemKind === 'issue') {
        updateIssue(systemId, itemId, { weeklyUpdates: newUpdates })
      } else {
        updateKeyItem(systemId, itemId, { weeklyUpdates: newUpdates })
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    }

    useImperativeHandle(ref, () => ({ save: handleSave }))

    return (
      <div className="border-t pt-3 mt-1">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs font-medium text-muted-foreground">週次コメント</p>
          <Badge variant="outline" className="text-[10px]">{formatWeekLabel(currentWeek)}</Badge>
        </div>
        <textarea
          value={content}
          onChange={(e) => { setContent(e.target.value); setSaved(false) }}
          placeholder="今週の進捗・状況..."
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          rows={2}
        />
        <div className="flex items-center gap-2 mt-1.5">
          <button
            type="button"
            className="text-xs font-medium text-primary hover:underline"
            onClick={handleSave}
          >
            {saved ? '保存しました' : 'コメントを保存'}
          </button>
        </div>

        {pastUpdates.length > 0 && (
          <div className="mt-2">
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setHistoryOpen(!historyOpen)}
            >
              {historyOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              過去の記録 ({pastUpdates.length})
            </button>
            {historyOpen && (
              <div className="mt-1.5 space-y-1.5">
                {pastUpdates.map((u) => (
                  <div key={u.week} className="rounded border p-2 text-xs">
                    <span className="text-muted-foreground">{formatWeekLabel(u.week)}</span>
                    <p className="whitespace-pre-wrap mt-0.5">{u.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  },
)
