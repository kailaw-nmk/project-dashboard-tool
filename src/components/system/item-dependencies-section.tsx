'use client'

import { ArrowRight, ArrowLeft, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProjectStore } from '@/stores/project-store'
import { useShallow } from 'zustand/react/shallow'
import type { ItemDependency } from '@/types/schema'

interface ItemDependenciesSectionProps {
  itemId: string
}

function getItemTitle(
  systems: { id: string; issues: { id: string; title: string }[]; keyItems: { id: string; title: string }[] }[],
  itemId: string,
): string {
  for (const sys of systems) {
    const issue = sys.issues.find((i) => i.id === itemId)
    if (issue) return issue.title
    const keyItem = sys.keyItems.find((k) => k.id === itemId)
    if (keyItem) return keyItem.title
  }
  return '(不明)'
}

export function ItemDependenciesSection({ itemId }: ItemDependenciesSectionProps) {
  const { itemDependencies, systems, deleteItemDependency } = useProjectStore(
    useShallow((s) => ({
      itemDependencies: s.projectData?.itemDependencies ?? [],
      systems: s.projectData?.systems ?? [],
      deleteItemDependency: s.deleteItemDependency,
    })),
  )

  const related = itemDependencies.filter(
    (d) => d.sourceItemId === itemId || d.targetItemId === itemId,
  )

  if (related.length === 0) return null

  return (
    <div className="border-t pt-3 mt-1">
      <p className="text-xs font-medium text-muted-foreground mb-2">依存関係</p>
      <div className="flex flex-col gap-1.5">
        {related.map((dep) => {
          const isSource = dep.sourceItemId === itemId
          const otherId = isSource ? dep.targetItemId : dep.sourceItemId
          const otherTitle = getItemTitle(systems, otherId)

          return (
            <div key={dep.id} className="flex items-center gap-2 text-xs">
              {isSource ? (
                <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
              ) : (
                <ArrowLeft className="h-3 w-3 text-muted-foreground shrink-0" />
              )}
              <span className="truncate flex-1">{otherTitle}</span>
              {dep.label && (
                <span className="text-muted-foreground shrink-0">({dep.label})</span>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive shrink-0 h-5 w-5"
                onClick={(e) => { e.stopPropagation(); deleteItemDependency(dep.id) }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
