'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { Footer } from '@/components/layout/footer'
import { useProjectData } from '@/hooks/use-project'
import { useProjectStore } from '@/stores/project-store'
import { importProjectData } from '@/lib/import'
import { exportProjectDataAsJson, exportSummaryAsPng } from '@/lib/export'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const projectData = useProjectData()
  const setProjectData = useProjectStore((s) => s.setProjectData)
  const [error, setError] = useState<string | null>(null)

  const handleImport = async (file: File) => {
    try {
      const data = await importProjectData(file)
      setProjectData(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ファイルの読み込みに失敗しました。')
    }
  }

  const handleExport = () => {
    if (projectData) {
      exportProjectDataAsJson(projectData)
    }
  }

  const handleExportPng = async () => {
    if (!projectData) return
    try {
      await exportSummaryAsPng('summary-view', projectData.projectName)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PNGエクスポートに失敗しました。')
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <Header projectData={projectData} onImport={handleImport} onExport={handleExport} onExportPng={handleExportPng} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex flex-1 flex-col overflow-auto bg-zinc-50 p-6">
          {error && (
            <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
          )}
          {children}
        </main>
      </div>
      {projectData && <Footer projectData={projectData} />}
    </div>
  )
}
