'use client'

import { toPng } from 'html-to-image'
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

export async function exportSummaryAsPng(
  elementId: string,
  projectName: string,
): Promise<void> {
  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error('エクスポート対象の要素が見つかりません。サマリータブを表示してください。')
  }

  const dataUrl = await toPng(element, {
    backgroundColor: '#ffffff',
    pixelRatio: 2,
  })

  const date = new Date().toISOString().slice(0, 10)
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = `${projectName}_summary_${date}.png`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
