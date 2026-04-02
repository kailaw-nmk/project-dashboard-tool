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
      const writable = await handle.createWritable({ keepExistingData: false })
      await writable.write(blob)
      await writable.close()
      return true
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return true // user cancelled
      // ファイルピッカーは開けたが書き込みに失敗 → フォールバック
      console.error('File write failed, falling back to download:', e)
      return false
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

export function exportProjectDataAsJson(data: ProjectData): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const filename = `Dashboard_${data.projectName}_${date}.json`
  legacyDownload(blob, filename)
}

/**
 * ユーザーが選択したフォルダ内に dashboard_yyyymmdd サブフォルダを作成し、PNGを保存
 */
export async function exportAllPngs(
  projectData: ProjectData,
  onStatus?: (msg: string) => void,
): Promise<void> {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const folderName = `dashboard_${date}`
  const filename = `Dashboard_${projectData.projectName}_${date}_items.png`

  onStatus?.('アイテムリストをエクスポート中...')
  const blob = await renderItemListOffscreen(projectData)

  // File System Access API でフォルダ選択 → サブフォルダ作成 → 保存
  if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
    try {
      const parentDir = await (window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker()
      const subDir = await parentDir.getDirectoryHandle(folderName, { create: true })
      const fileHandle = await subDir.getFileHandle(filename, { create: true })
      const writable = await fileHandle.createWritable()
      await writable.write(blob)
      await writable.close()
      return
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return // user cancelled
      // fall through to legacy download
    }
  }

  // フォールバック: 通常ダウンロード
  legacyDownload(blob, filename)
}

const typeLabelsExport: Record<string, string> = {
  issue: 'Issue',
  milestone: 'マイルストーン',
  risk: 'リスク',
  decision: '決定事項',
  dependency: '依存関係',
}
const typeColorsExport: Record<string, string> = {
  issue: '#2563eb',
  milestone: '#9333ea',
  risk: '#dc2626',
  decision: '#059669',
  dependency: '#ea580c',
}
const statusLabelsExport: Record<string, string> = { open: '未対応', 'in-progress': '対応中', closed: '完了' }
const priorityLabelsExport: Record<string, string> = { high: '高', medium: '中', low: '低' }
const priorityColorsExport: Record<string, string> = { high: '#dc2626', medium: '#d97706', low: '#6b7280' }

async function renderItemListOffscreen(data: ProjectData): Promise<Blob> {
  const container = document.createElement('div')
  container.style.cssText = 'position:fixed;left:0;top:0;z-index:-9999;pointer-events:none;width:1400px;background:#fff;padding:32px;font-family:sans-serif;'

  const title = document.createElement('h2')
  title.textContent = `${data.projectName} — アイテム一覧`
  title.style.cssText = 'font-size:18px;font-weight:bold;margin-bottom:16px;color:#111;'
  container.appendChild(title)

  // Table header
  const thead = document.createElement('div')
  thead.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 8px;font-size:11px;font-weight:500;color:#888;border-bottom:2px solid #e4e4e7;'
  for (const [label, width] of [['タイプ','90px'],['タイトル','1fr'],['ステータス','60px'],['優先度','40px'],['主担当','80px'],['関係者','100px'],['期限','80px']] as const) {
    const th = document.createElement('span')
    th.textContent = label
    th.style.cssText = `${width === '1fr' ? 'flex:1;' : `min-width:${width};`}`
    thead.appendChild(th)
  }
  container.appendChild(thead)

  for (const system of data.systems) {
    type Item = { type: string; title: string; status: string; priority?: string; assignee: string; stakeholders: string; dueDate: string }
    const items: Item[] = []

    for (const issue of system.issues.filter((i) => i.status !== 'closed')) {
      items.push({ type: 'issue', title: issue.title, status: issue.status, priority: issue.priority, assignee: issue.assignee, stakeholders: (issue as Record<string, unknown>).stakeholders as string ?? '', dueDate: issue.dueDate })
    }
    for (const ki of system.keyItems.filter((k) => k.status !== 'closed')) {
      items.push({ type: ki.type, title: ki.title, status: ki.status, assignee: (ki as Record<string, unknown>).assignee as string ?? '', stakeholders: (ki as Record<string, unknown>).stakeholders as string ?? '', dueDate: ki.dueDate ?? '' })
    }
    if (items.length === 0) continue

    const sysHeader = document.createElement('div')
    sysHeader.style.cssText = 'font-size:13px;font-weight:600;margin:12px 0 4px;padding:4px 8px;background:#f4f4f5;border-radius:4px;color:#333;'
    sysHeader.textContent = `${system.name} (${items.length}件)`
    container.appendChild(sysHeader)

    for (const item of items) {
      const row = document.createElement('div')
      row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:4px 8px;font-size:12px;border-bottom:1px solid #e4e4e7;color:#333;'

      const typeBadge = document.createElement('span')
      typeBadge.textContent = typeLabelsExport[item.type] ?? item.type
      const tc = typeColorsExport[item.type] ?? '#888'
      typeBadge.style.cssText = `font-size:10px;padding:1px 5px;border:1px solid ${tc};border-radius:3px;color:${tc};min-width:90px;text-align:center;`
      row.appendChild(typeBadge)

      const titleSpan = document.createElement('span')
      titleSpan.textContent = item.title
      titleSpan.style.cssText = 'flex:1;font-weight:500;'
      row.appendChild(titleSpan)

      const statusSpan = document.createElement('span')
      statusSpan.textContent = statusLabelsExport[item.status] ?? item.status
      statusSpan.style.cssText = 'font-size:11px;color:#666;min-width:60px;'
      row.appendChild(statusSpan)

      const prioSpan = document.createElement('span')
      prioSpan.style.cssText = 'min-width:40px;'
      if (item.priority) {
        prioSpan.textContent = priorityLabelsExport[item.priority] ?? ''
        prioSpan.style.cssText += `font-size:10px;padding:1px 5px;border-radius:3px;color:#fff;background:${priorityColorsExport[item.priority] ?? '#888'};text-align:center;`
      }
      row.appendChild(prioSpan)

      const assigneeSpan = document.createElement('span')
      assigneeSpan.textContent = item.assignee
      assigneeSpan.style.cssText = 'font-size:11px;font-weight:700;min-width:80px;'
      row.appendChild(assigneeSpan)

      const stakeSpan = document.createElement('span')
      stakeSpan.textContent = item.stakeholders
      stakeSpan.style.cssText = 'font-size:11px;color:#888;min-width:100px;'
      row.appendChild(stakeSpan)

      const dueSpan = document.createElement('span')
      dueSpan.style.cssText = 'font-size:11px;min-width:80px;'
      if (item.dueDate) {
        const overdue = new Date(item.dueDate) < new Date()
        dueSpan.textContent = item.dueDate
        dueSpan.style.cssText += `color:${overdue ? '#dc2626;font-weight:700' : '#888'};`
      }
      row.appendChild(dueSpan)

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
