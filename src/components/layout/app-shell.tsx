'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { Footer } from '@/components/layout/footer'
import { ExportChartView } from '@/components/export/export-chart'
import { useProjectData } from '@/hooks/use-project'
import { useProjectStore } from '@/stores/project-store'
import { importProjectData } from '@/lib/import'
import { exportProjectDataAsJson, exportAllPngs } from '@/lib/export'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const projectData = useProjectData()
  const setProjectData = useProjectStore((s) => s.setProjectData)
  const [error, setError] = useState<string | null>(null)
  const [exportStatus, setExportStatus] = useState<string | null>(null)

  const handleImport = async (file: File) => {
    try {
      const data = await importProjectData(file)
      setProjectData(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ファイルの読み込みに失敗しました。')
    }
  }

  const handleExport = async () => {
    if (projectData) {
      await exportProjectDataAsJson(projectData)
    }
  }

  const handleExportPng = async () => {
    if (!projectData) return
    try {
      setExportStatus('PNGエクスポート中...')
      await exportAllPngs(projectData, setExportStatus)
      setExportStatus(null)
    } catch (err) {
      setExportStatus(null)
      setError(err instanceof Error ? err.message : 'PNGエクスポートに失敗しました。')
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <Header projectData={projectData} onImport={handleImport} onExport={handleExport} onExportPng={handleExportPng} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex flex-1 flex-col overflow-auto bg-muted p-6">
          {error && (
            <p className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
          )}
          {exportStatus && (
            <p className="mb-4 rounded-md bg-blue-50 dark:bg-blue-950/30 p-3 text-sm text-blue-600 dark:text-blue-400">{exportStatus}</p>
          )}
          {children}
        </main>
      </div>
      {projectData && <Footer projectData={projectData} />}
      {/* オフスクリーンのエクスポート用チャート */}
      {projectData && <ExportChartView />}
    </div>
  )
}
