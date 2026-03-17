'use client'

import type { ProjectData } from '@/types/schema'

export function exportProjectDataAsJson(data: ProjectData): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `${data.projectName}_${data.currentWeek}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportSummaryAsPng(_elementId: string): void {
  console.warn('exportSummaryAsPng: Phase 4で実装予定')
}
