'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useProjectStore } from '@/stores/project-store'
import { useShallow } from 'zustand/react/shallow'

export function TableView() {
  const { systems, settings } = useProjectStore(
    useShallow((s) => ({
      systems: s.projectData?.systems ?? [],
      settings: s.projectData?.settings,
    })),
  )
  const setSelectedSystemId = useProjectStore((s) => s.setSelectedSystemId)

  if (!settings) return null

  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名前</TableHead>
            <TableHead>ステータス</TableHead>
            <TableHead>フェーズ</TableHead>
            <TableHead className="text-right">Issue</TableHead>
            <TableHead className="text-right">リスク</TableHead>
            <TableHead>担当者</TableHead>
            <TableHead>コメント</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {systems.map((system) => {
            const statusOpt = settings.statusOptions.find((o) => o.id === system.status)
            const phaseOpt = settings.phaseOptions.find((o) => o.id === system.phase)
            const openIssues = system.issues.filter((i) => i.status !== 'closed').length
            const openRisks = system.keyItems.filter(
              (k) => k.type === 'risk' && k.status !== 'closed',
            ).length

            return (
              <TableRow
                key={system.id}
                className="cursor-pointer"
                onClick={() => setSelectedSystemId(system.id)}
              >
                <TableCell className="font-medium">{system.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {statusOpt && (
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: statusOpt.color }}
                      />
                    )}
                    <span>{statusOpt?.label ?? system.status}</span>
                  </div>
                </TableCell>
                <TableCell>{phaseOpt?.label ?? system.phase}</TableCell>
                <TableCell className="text-right">{openIssues}</TableCell>
                <TableCell className="text-right">{openRisks}</TableCell>
                <TableCell>{system.owner}</TableCell>
                <TableCell className="max-w-[200px] truncate">{system.comment}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
