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

/**
 * 3枚のPNGを連続エクスポート（全てオフスクリーン生成、どのタブからでも実行可能）
 * 1. サマリービュー
 * 2. アイテムリスト
 * 3. 推移グラフ（スナップショットがない場合はスキップ）
 */
export async function exportAllPngs(
  projectData: ProjectData,
  onStatus?: (msg: string) => void,
): Promise<void> {
  const date = new Date().toISOString().slice(0, 10)
  const prefix = `Dashboard_${projectData.projectName}_${date}`

  // 1. サマリー（オフスクリーンDOM生成）
  onStatus?.('サマリーをエクスポート中...')
  const summaryBlob = await renderSummaryOffscreen(projectData)
  await savePng(summaryBlob, `${prefix}_1_summary.png`)

  // 2. アイテムリスト（オフスクリーンDOM生成）
  onStatus?.('アイテムリストをエクスポート中...')
  const itemListBlob = await renderItemListOffscreen(projectData)
  await savePng(itemListBlob, `${prefix}_2_items.png`)

  // 3. 推移グラフ（スナップショットがある場合のみ）
  if (projectData.weeklySnapshots.length > 0) {
    onStatus?.('推移グラフをエクスポート中...')
    // オフスクリーンチャートが描画されるまで少し待つ
    await new Promise((r) => setTimeout(r, 500))
    const chartEl = document.getElementById('export-chart-view')
    if (chartEl) {
      const chartBlob = await captureElement('export-chart-view')
      await savePng(chartBlob, `${prefix}_3_charts.png`)
    }
  }
}

async function renderSummaryOffscreen(data: ProjectData): Promise<Blob> {
  const container = document.createElement('div')
  container.style.cssText = 'position:fixed;left:0;top:0;z-index:-9999;pointer-events:none;width:1200px;background:#fff;padding:32px;font-family:sans-serif;'

  const title = document.createElement('h2')
  title.textContent = `${data.projectName} — サマリー`
  title.style.cssText = 'font-size:18px;font-weight:bold;margin-bottom:16px;color:#111;'
  container.appendChild(title)

  // Status summary cards
  const statusRow = document.createElement('div')
  statusRow.style.cssText = 'display:flex;gap:16px;margin-bottom:24px;'
  for (const opt of data.settings.statusOptions) {
    const count = data.systems.filter((s) => s.status === opt.id).length
    const card = document.createElement('div')
    card.style.cssText = 'flex:1;border:1px solid #e4e4e7;border-radius:8px;padding:16px;text-align:center;'
    card.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:4px;">
        <span style="width:12px;height:12px;border-radius:50%;background:${opt.color};display:inline-block;"></span>
        <span style="font-size:13px;color:#666;">${opt.label}</span>
      </div>
      <p style="font-size:28px;font-weight:bold;color:#111;">${count}</p>
    `
    statusRow.appendChild(card)
  }
  container.appendChild(statusRow)

  // System cards grid
  const grid = document.createElement('div')
  grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:12px;'

  for (const system of data.systems) {
    const statusOpt = data.settings.statusOptions.find((o) => o.id === system.status)
    const phaseOpt = data.settings.phaseOptions.find((o) => o.id === system.phase)
    const openIssues = system.issues.filter((i) => i.status !== 'closed').length
    const openRisks = system.keyItems.filter((k) => k.type === 'risk' && k.status !== 'closed').length

    const card = document.createElement('div')
    card.style.cssText = 'border:1px solid #e4e4e7;border-radius:8px;padding:12px;'

    let badgeHtml = ''
    if (statusOpt) {
      badgeHtml = `<span style="font-size:11px;padding:2px 8px;border-radius:12px;background:${statusOpt.color}20;color:${statusOpt.color};">${statusOpt.label}</span>`
    }

    let metaHtml = ''
    if (phaseOpt) metaHtml += `<span>フェーズ: ${phaseOpt.label}</span>`
    metaHtml += `<span>担当: ${system.owner}</span>`

    let countsHtml = ''
    if (openIssues > 0) countsHtml += `<span style="color:#d97706;">Issue: ${openIssues}件</span>`
    if (openRisks > 0) countsHtml += `<span style="color:#dc2626;margin-left:8px;">リスク: ${openRisks}件</span>`

    card.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
        <span style="font-weight:500;font-size:14px;">${system.name}</span>
        ${badgeHtml}
      </div>
      <div style="display:flex;gap:12px;font-size:11px;color:#888;margin-bottom:4px;">${metaHtml}</div>
      <div style="font-size:11px;">${countsHtml}</div>
      ${system.comment ? `<p style="font-size:11px;color:#888;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${system.comment}</p>` : ''}
    `
    grid.appendChild(card)
  }
  container.appendChild(grid)

  document.body.appendChild(container)
  try {
    const dataUrl = await toPng(container, { backgroundColor: '#ffffff', pixelRatio: 2 })
    const res = await fetch(dataUrl)
    return res.blob()
  } finally {
    document.body.removeChild(container)
  }
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
