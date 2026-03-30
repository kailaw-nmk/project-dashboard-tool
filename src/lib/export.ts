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

async function savePng(blob: Blob, filename: string): Promise<void> {
  const saved = await saveWithPicker(blob, filename, { 'image/png': ['.png'] })
  if (!saved) {
    legacyDownload(blob, filename)
  }
}

async function captureElement(elementId: string): Promise<Blob> {
  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error(`エクスポート対象の要素(${elementId})が見つかりません。`)
  }
  const dataUrl = await toPng(element, {
    backgroundColor: '#ffffff',
    pixelRatio: 2,
  })
  const res = await fetch(dataUrl)
  return res.blob()
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
  const blob = await captureElement(elementId)
  const date = new Date().toISOString().slice(0, 10)
  await savePng(blob, `${projectName}_summary_${date}.png`)
}

/**
 * 3枚のPNGを連続エクスポート
 * 1. サマリービュー
 * 2. Issueリスト（オフスクリーン生成）
 * 3. 推移グラフ
 */
export async function exportAllPngs(
  projectData: ProjectData,
  onStatus?: (msg: string) => void,
): Promise<void> {
  const date = new Date().toISOString().slice(0, 10)
  const prefix = `Dashboard_${projectData.projectName}_${date}`

  // 1. サマリー
  onStatus?.('サマリーをエクスポート中...')
  try {
    const summaryBlob = await captureElement('summary-view')
    await savePng(summaryBlob, `${prefix}_1_summary.png`)
  } catch {
    throw new Error('サマリービューのキャプチャに失敗しました。概要 > サマリータブを表示してください。')
  }

  // 2. Issueリスト（オフスクリーンDOM生成）
  onStatus?.('Issueリストをエクス��ート中...')
  const issueListBlob = await renderIssueListOffscreen(projectData)
  await savePng(issueListBlob, `${prefix}_2_issues.png`)

  // 3. 推移グラフ
  onStatus?.('推移グラフをエクスポート中...')
  try {
    const chartBlob = await captureElement('export-chart-view')
    await savePng(chartBlob, `${prefix}_3_charts.png`)
  } catch {
    throw new Error('推移グラフのキャプチャに失敗しました。')
  }
}

async function renderIssueListOffscreen(data: ProjectData): Promise<Blob> {
  const container = document.createElement('div')
  container.id = 'export-issue-list'
  container.style.cssText = 'position:absolute;left:-9999px;top:0;width:1200px;background:#fff;padding:32px;font-family:sans-serif;'

  const title = document.createElement('h2')
  title.textContent = `${data.projectName} — Issue一覧`
  title.style.cssText = 'font-size:18px;font-weight:bold;margin-bottom:16px;color:#111;'
  container.appendChild(title)

  const statusLabels: Record<string, string> = { open: '未対応', 'in-progress': '対応中', closed: '完了' }
  const priorityLabels: Record<string, string> = { high: '高', medium: '中', low: '低' }
  const priorityColors: Record<string, string> = { high: '#dc2626', medium: '#d97706', low: '#6b7280' }

  for (const system of data.systems) {
    const openIssues = system.issues.filter((i) => i.status !== 'closed')
    if (openIssues.length === 0) continue

    const sysHeader = document.createElement('div')
    sysHeader.style.cssText = 'font-size:14px;font-weight:600;margin:12px 0 6px;padding:4px 8px;background:#f4f4f5;border-radius:4px;color:#333;'
    sysHeader.textContent = `${system.name} (${openIssues.length}件)`
    container.appendChild(sysHeader)

    for (const issue of openIssues) {
      const row = document.createElement('div')
      row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:4px 8px;font-size:13px;border-bottom:1px solid #e4e4e7;color:#333;'

      const priorityBadge = document.createElement('span')
      priorityBadge.textContent = priorityLabels[issue.priority] ?? issue.priority
      priorityBadge.style.cssText = `font-size:11px;padding:1px 6px;border-radius:3px;color:#fff;background:${priorityColors[issue.priority] ?? '#888'};`
      row.appendChild(priorityBadge)

      const statusSpan = document.createElement('span')
      statusSpan.textContent = statusLabels[issue.status] ?? issue.status
      statusSpan.style.cssText = 'font-size:11px;color:#666;min-width:40px;'
      row.appendChild(statusSpan)

      const titleSpan = document.createElement('span')
      titleSpan.textContent = issue.title
      titleSpan.style.cssText = 'flex:1;'
      row.appendChild(titleSpan)

      if (issue.assignee) {
        const assignee = document.createElement('span')
        assignee.textContent = issue.assignee
        assignee.style.cssText = 'font-size:11px;color:#888;'
        row.appendChild(assignee)
      }

      if (issue.dueDate) {
        const due = document.createElement('span')
        due.textContent = issue.dueDate
        const isOverdue = new Date(issue.dueDate) < new Date()
        due.style.cssText = `font-size:11px;color:${isOverdue ? '#dc2626' : '#888'};`
        row.appendChild(due)
      }

      container.appendChild(row)
    }
  }

  document.body.appendChild(container)
  try {
    const dataUrl = await toPng(container, { backgroundColor: '#ffffff', pixelRatio: 2 })
    const res = await fetch(dataUrl)
    return res.blob()
  } finally {
    document.body.removeChild(container)
  }
}
