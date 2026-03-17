'use client'

import { useState } from 'react'
import { Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useProjectStore } from '@/stores/project-store'
import { useShallow } from 'zustand/react/shallow'
import { createSnapshot } from '@/lib/snapshot'

export function SnapshotTab() {
  const { currentWeek, systems, snapshots, settings, saveSnapshot } = useProjectStore(
    useShallow((s) => ({
      currentWeek: s.projectData?.currentWeek ?? '',
      systems: s.projectData?.systems ?? [],
      snapshots: s.projectData?.weeklySnapshots ?? [],
      settings: s.projectData?.settings,
      saveSnapshot: s.saveSnapshot,
    })),
  )

  const [summary, setSummary] = useState('')

  const existingSnapshot = snapshots.find((s) => s.week === currentWeek)
  const sortedSnapshots = [...snapshots].sort((a, b) => b.week.localeCompare(a.week))

  const handleSave = () => {
    const snapshot = createSnapshot(systems, currentWeek, summary)
    saveSnapshot(snapshot)
    setSummary('')
  }

  const getStatusLabel = (statusId: string) =>
    settings?.statusOptions.find((o) => o.id === statusId)?.label ?? statusId

  const getStatusColor = (statusId: string) =>
    settings?.statusOptions.find((o) => o.id === statusId)?.color ?? '#888'

  const getStatusCounts = (systemSnapshots: typeof sortedSnapshots[0]['systems']) => {
    const counts: Record<string, number> = {}
    systemSnapshots.forEach((s) => {
      counts[s.status] = (counts[s.status] ?? 0) + 1
    })
    return counts
  }

  return (
    <div className="flex flex-col gap-4">
      {/* スナップショット保存 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Camera className="h-4 w-4" />
            今週の状況を記録
            <Badge variant="outline" className="ml-2">
              {currentWeek}
            </Badge>
            {existingSnapshot && (
              <Badge variant="secondary" className="text-xs">
                記録済み — 上書き可能
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">週次サマリー</label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="今週の全体コメントを入力..."
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                rows={2}
              />
            </div>
            <Button onClick={handleSave} className="w-fit">
              <Camera className="mr-1 h-4 w-4" />
              {existingSnapshot ? '上書き保存' : '保存'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* スナップショット一覧 */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>週</TableHead>
              <TableHead>日時</TableHead>
              <TableHead>ステータス内訳</TableHead>
              <TableHead>サマリー</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSnapshots.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-zinc-400">
                  スナップショットがありません
                </TableCell>
              </TableRow>
            ) : (
              sortedSnapshots.map((snap) => {
                const counts = getStatusCounts(snap.systems)
                return (
                  <TableRow key={snap.week}>
                    <TableCell className="font-medium">{snap.week}</TableCell>
                    <TableCell className="text-zinc-500">
                      {new Date(snap.date).toLocaleDateString('ja-JP')}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(counts).map(([statusId, count]) => (
                          <Badge
                            key={statusId}
                            variant="outline"
                            className="border-transparent text-xs"
                            style={{
                              backgroundColor: getStatusColor(statusId) + '20',
                              color: getStatusColor(statusId),
                            }}
                          >
                            {getStatusLabel(statusId)}: {count}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-zinc-600">
                      {snap.summary || '—'}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
