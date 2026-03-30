'use client'

import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useProjectStore } from '@/stores/project-store'
import { useShallow } from 'zustand/react/shallow'
import { formatWeekLabel } from '@/lib/week'

export function ChartTab() {
  const { snapshots, settings } = useProjectStore(
    useShallow((s) => ({
      snapshots: s.projectData?.weeklySnapshots ?? [],
      settings: s.projectData?.settings,
    })),
  )

  const statusOptions = settings?.statusOptions ?? []
  const sortedSnapshots = [...snapshots].sort((a, b) => a.week.localeCompare(b.week))

  if (sortedSnapshots.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        推移グラフを表示するにはスナップショットが必要です。
      </div>
    )
  }

  // ステータス推移データ
  const statusChartData = sortedSnapshots.map((snap) => {
    const counts: Record<string, number> = {}
    statusOptions.forEach((o) => {
      counts[o.id] = 0
    })
    snap.systems.forEach((s) => {
      counts[s.status] = (counts[s.status] ?? 0) + 1
    })
    return { week: formatWeekLabel(snap.week), ...counts }
  })

  // Issue推移データ
  const issueChartData = sortedSnapshots.map((snap) => ({
    week: formatWeekLabel(snap.week),
    openIssues: snap.systems.reduce((sum, s) => sum + s.openIssues, 0),
    openRisks: snap.systems.reduce((sum, s) => sum + s.openRisks, 0),
  }))

  return (
    <div className="flex flex-col gap-4">
      {/* ステータス推移 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ステータス推移</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={statusChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Legend />
              {statusOptions.map((opt) => (
                <Area
                  key={opt.id}
                  type="monotone"
                  dataKey={opt.id}
                  name={opt.label}
                  fill={opt.color}
                  stroke={opt.color}
                  fillOpacity={0.3}
                  stackId="status"
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Issue推移 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Issue / リスク推移</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={issueChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="openIssues"
                name="Open Issue"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="openRisks"
                name="Open リスク"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
