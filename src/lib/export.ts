'use client'

import { toPng } from 'html-to-image'
import type { ProjectData } from '@/types/schema'

async function saveWithPicker(blob: Blob, suggestedName: string, accept: Record<string, string[]>): Promise<boolean> {
  if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    try {
      const handle = await (window as unknown as { showSaveFilePicker: (opts: unknown) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
        suggestedName,
        types: [{ accept }],
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return true
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return true // user cancelled
      // fall through to legacy download
    }
  }
  return false
}

function legacyDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function exportProjectDataAsJson(data: ProjectData): Promise<void> {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const filename = `Dashboard_${data.projectName}_${date}.json`

  const saved = await saveWithPicker(blob, filename, { 'application/json': ['.json'] })
  if (!saved) {
    legacyDownload(blob, filename)
  }
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

  const res = await fetch(dataUrl)
  const blob = await res.blob()
  const date = new Date().toISOString().slice(0, 10)
  const filename = `${projectName}_summary_${date}.png`

  const saved = await saveWithPicker(blob, filename, { 'image/png': ['.png'] })
  if (!saved) {
    legacyDownload(blob, filename)
  }
}
