'use client'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSelectedSystem } from '@/hooks/use-project'
import { useProjectStore } from '@/stores/project-store'
import { useShallow } from 'zustand/react/shallow'

export function SystemDetailSheet() {
  const selectedSystem = useSelectedSystem()
  const setSelectedSystemId = useProjectStore((s) => s.setSelectedSystemId)
  const { dependencies, settings } = useProjectStore(
    useShallow((s) => ({
      dependencies: s.projectData?.dependencies ?? [],
      settings: s.projectData?.settings,
    })),
  )

  const open = selectedSystem !== null

  const statusOption = settings?.statusOptions.find(
    (o) => o.id === selectedSystem?.status,
  )
  const phaseOption = settings?.phaseOptions.find(
    (o) => o.id === selectedSystem?.phase,
  )

  const relatedDeps = dependencies.filter(
    (d) =>
      d.sourceSystemId === selectedSystem?.id ||
      d.targetSystemId === selectedSystem?.id,
  )

  const systems = useProjectStore((s) => s.projectData?.systems ?? [])

  const getSystemName = (id: string) =>
    systems.find((s) => s.id === id)?.name ?? id

  const sortedIssues = [...(selectedSystem?.issues ?? [])].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  const keyItemsByType = (selectedSystem?.keyItems ?? []).reduce(
    (acc, item) => {
      const group = acc[item.type] ?? []
      group.push(item)
      acc[item.type] = group
      return acc
    },
    {} as Record<string, NonNullable<typeof selectedSystem>['keyItems']>,
  )

  const keyItemTypeLabel: Record<string, string> = {
    milestone: 'マイルストーン',
    risk: 'リスク',
    decision: '決定事項',
    dependency: '依存関係',
  }

  const issueStatusLabel: Record<string, string> = {
    open: '未対応',
    'in-progress': '対応中',
    closed: '完了',
  }

  const priorityLabel: Record<string, string> = {
    high: '高',
    medium: '中',
    low: '低',
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) setSelectedSystemId(null)
      }}
    >
      <SheetContent side="right" className="w-[400px] sm:max-w-[400px]">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <SheetTitle>{selectedSystem?.name}</SheetTitle>
            {statusOption && (
              <Badge
                variant="outline"
                className="border-transparent"
                style={{
                  backgroundColor: statusOption.color + '20',
                  color: statusOption.color,
                }}
              >
                {statusOption.label}
              </Badge>
            )}
          </div>
          <SheetDescription>{selectedSystem?.description}</SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 px-4">
          <div className="flex flex-col gap-4 pb-4">
            {/* 基本情報 */}
            <section>
              <h3 className="mb-2 text-sm font-medium">基本情報</h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-zinc-500">フェーズ</dt>
                <dd>{phaseOption?.label ?? selectedSystem?.phase}</dd>
                <dt className="text-zinc-500">担当者</dt>
                <dd>{selectedSystem?.owner}</dd>
              </dl>
              {selectedSystem?.comment && (
                <p className="mt-2 text-sm text-zinc-600">{selectedSystem.comment}</p>
              )}
            </section>

            <Separator />

            {/* 依存関係 */}
            {relatedDeps.length > 0 && (
              <>
                <section>
                  <h3 className="mb-2 text-sm font-medium">
                    依存関係 ({relatedDeps.length})
                  </h3>
                  <ul className="flex flex-col gap-1 text-sm">
                    {relatedDeps.map((dep) => (
                      <li key={dep.id} className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {dep.type}
                        </Badge>
                        <span>
                          {getSystemName(dep.sourceSystemId)} →{' '}
                          {getSystemName(dep.targetSystemId)}
                        </span>
                        {dep.label && (
                          <span className="text-zinc-400">({dep.label})</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
                <Separator />
              </>
            )}

            {/* Issue一覧 */}
            {sortedIssues.length > 0 && (
              <>
                <section>
                  <h3 className="mb-2 text-sm font-medium">
                    Issue ({sortedIssues.length})
                  </h3>
                  <ul className="flex flex-col gap-2 text-sm">
                    {sortedIssues.map((issue) => (
                      <li
                        key={issue.id}
                        className="flex items-start justify-between rounded border p-2"
                      >
                        <div>
                          <p className="font-medium">{issue.title}</p>
                          <p className="text-xs text-zinc-500">
                            {priorityLabel[issue.priority] ?? issue.priority} /{' '}
                            {issueStatusLabel[issue.status] ?? issue.status}
                          </p>
                        </div>
                        <Badge
                          variant={
                            issue.status === 'closed'
                              ? 'secondary'
                              : issue.priority === 'high'
                                ? 'destructive'
                                : 'outline'
                          }
                          className="text-xs"
                        >
                          {issueStatusLabel[issue.status] ?? issue.status}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </section>
                <Separator />
              </>
            )}

            {/* キーアイテム一覧 */}
            {Object.keys(keyItemsByType).length > 0 && (
              <section>
                <h3 className="mb-2 text-sm font-medium">キーアイテム</h3>
                {Object.entries(keyItemsByType).map(([type, items]) => (
                  <div key={type} className="mb-3">
                    <h4 className="mb-1 text-xs font-medium text-zinc-500">
                      {keyItemTypeLabel[type] ?? type}
                    </h4>
                    <ul className="flex flex-col gap-1 text-sm">
                      {items.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between rounded border p-2"
                        >
                          <span>{item.title}</span>
                          <Badge variant="secondary" className="text-xs">
                            {issueStatusLabel[item.status] ?? item.status}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
