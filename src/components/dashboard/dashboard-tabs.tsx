'use client'

import { LayoutGrid, Network, List } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SummaryView } from '@/components/dashboard/summary-view'
import { NetworkView } from '@/components/dashboard/network-view'
import { TableView } from '@/components/dashboard/table-view'

export function DashboardTabs() {
  return (
    <Tabs defaultValue="summary">
      <TabsList>
        <TabsTrigger value="summary">
          <LayoutGrid className="h-4 w-4" />
          サマリー
        </TabsTrigger>
        <TabsTrigger value="network">
          <Network className="h-4 w-4" />
          ネットワーク図
        </TabsTrigger>
        <TabsTrigger value="table">
          <List className="h-4 w-4" />
          一覧
        </TabsTrigger>
      </TabsList>
      <TabsContent value="summary">
        <SummaryView />
      </TabsContent>
      <TabsContent value="network">
        <NetworkView />
      </TabsContent>
      <TabsContent value="table">
        <TableView />
      </TabsContent>
    </Tabs>
  )
}
