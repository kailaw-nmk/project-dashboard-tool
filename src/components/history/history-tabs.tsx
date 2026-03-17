'use client'

import { Camera, TrendingUp } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SnapshotTab } from '@/components/history/snapshot-tab'
import { ChartTab } from '@/components/history/chart-tab'

export function HistoryTabs() {
  return (
    <Tabs defaultValue="snapshot">
      <TabsList>
        <TabsTrigger value="snapshot">
          <Camera className="h-4 w-4" />
          スナップショット
        </TabsTrigger>
        <TabsTrigger value="chart">
          <TrendingUp className="h-4 w-4" />
          推移グラフ
        </TabsTrigger>
      </TabsList>
      <TabsContent value="snapshot">
        <SnapshotTab />
      </TabsContent>
      <TabsContent value="chart">
        <ChartTab />
      </TabsContent>
    </Tabs>
  )
}
