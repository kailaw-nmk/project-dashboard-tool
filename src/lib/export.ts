'use client'

import { toPng } from 'html-to-image'
import type { ProjectData } from '@/types/schema'
import { getCurrentWeek, getPreviousWeek } from '@/lib/week'

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
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0')
  const filename = `Dashboard_${data.projectName}_${date}_${time}.json`
  legacyDownload(blob, filename)
}

export type ExportCategory = string

/**
 * ユーザーが選択したフォルダ内に dashboard_yyyymmdd サブフォルダを作成し、PNGを保存
 */
export async function exportAllPngs(
  projectData: ProjectData,
  onStatus?: (msg: string) => void,
  categories?: Set<ExportCategory>,
): Promise<void> {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const folderName = `dashboard_${date}`
  const itemsFilename = `Dashboard_${projectData.projectName}_${date}_items.png`
  const actionsFilename = `Dashboard_${projectData.projectName}_${date}_actions.png`

  onStatus?.('アイテムリストをエクスポート中...')
  const itemsBlob = await renderItemListOffscreen(projectData, categories)

  onStatus?.('アクションリストをエクスポート中...')
  const actionsBlob = await renderActionListOffscreen(projectData, categories)

  // File System Access API でフォルダ選択 → サブフォルダ作成 → 保存
  if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
    try {
      const parentDir = await (window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker()
      const subDir = await parentDir.getDirectoryHandle(folderName, { create: true })

      const itemsHandle = await subDir.getFileHandle(itemsFilename, { create: true })
      const itemsWritable = await itemsHandle.createWritable()
      await itemsWritable.write(itemsBlob)
      await itemsWritable.close()

      const actionsHandle = await subDir.getFileHandle(actionsFilename, { create: true })
      const actionsWritable = await actionsHandle.createWritable()
      await actionsWritable.write(actionsBlob)
      await actionsWritable.close()
      return
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return // user cancelled
      // fall through to legacy download
    }
  }

  // フォールバック: 通常ダウンロード(2件続けて)
  legacyDownload(itemsBlob, itemsFilename)
  legacyDownload(actionsBlob, actionsFilename)
}

// フォールバック用ハードコードラベル（settingsにない場合のみ使用）
const typeLabelsExportFallback: Record<string, string> = {
  issue: 'Issue',
  milestone: 'マイルストーン',
  risk: 'リスク',
  decision: '決定事項',
  dependency: '依存関係',
}

function buildExportTypeLabels(data: ProjectData): Record<string, string> {
  const labels: Record<string, string> = { issue: 'Issue' }
  for (const t of data.settings.keyItemTypes) {
    labels[t.id] = t.label
  }
  return { ...typeLabelsExportFallback, ...labels }
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

async function renderItemListOffscreen(data: ProjectData, categories?: Set<ExportCategory>): Promise<Blob> {
  const typeLabelsExport = buildExportTypeLabels(data)
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

    if (!categories || categories.has('issue')) {
      for (const issue of system.issues.filter((i) => i.status !== 'closed')) {
        items.push({ type: 'issue', title: issue.title, status: issue.status, priority: issue.priority, assignee: issue.assignee, stakeholders: (issue as Record<string, unknown>).stakeholders as string ?? '', dueDate: issue.dueDate })
      }
    }
    for (const ki of system.keyItems.filter((k) => k.status !== 'closed')) {
      if (categories && !categories.has(ki.type as ExportCategory)) continue
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

// アクションステータスのラベルと色 (循環import回避のため inline 定義)
const actionStatusLabelsExport: Record<string, { label: string; color: string }> = {
  pending: { label: '未着手', color: '#6b7280' },
  'in-progress': { label: '対応中', color: '#d97706' },
  'on-hold': { label: '保留', color: '#9333ea' },
  completed: { label: '完了', color: '#16a34a' },
}

async function renderActionListOffscreen(
  data: ProjectData,
  categories?: Set<ExportCategory>,
): Promise<Blob> {
  const typeLabelsExport = buildExportTypeLabels(data)
  const container = document.createElement('div')
  container.style.cssText =
    'position:fixed;left:0;top:0;z-index:-9999;pointer-events:none;background:#fff;padding:32px;font-family:sans-serif;'

  const title = document.createElement('h2')
  title.textContent = `${data.projectName} — アクション一覧`
  title.style.cssText = 'font-size:18px;font-weight:bold;margin-bottom:16px;color:#111;'
  container.appendChild(title)

  // Column definitions (fixed widths)
  const actionExportCols = [
    { label: '担当者', width: 110 },
    { label: '内容', width: 360 },
    { label: 'ステータス', width: 80 },
    { label: '期限', width: 90 },
    { label: '親アイテム', width: 250 },
    { label: '今週のコメント', width: 240 },
    { label: '先週のコメント', width: 240 },
  ]
  const tableWidth = actionExportCols.reduce((s, c) => s + c.width, 0)

  const table = document.createElement('table')
  table.style.cssText = `width:${tableWidth}px;table-layout:fixed;border-collapse:collapse;font-size:12px;`

  // colgroup
  const colgroup = document.createElement('colgroup')
  for (const col of actionExportCols) {
    const colEl = document.createElement('col')
    colEl.style.width = `${col.width}px`
    colgroup.appendChild(colEl)
  }
  table.appendChild(colgroup)

  // thead
  const thead = document.createElement('thead')
  const headRow = document.createElement('tr')
  headRow.style.cssText = 'border-bottom:2px solid #e4e4e7;'
  for (const col of actionExportCols) {
    const th = document.createElement('th')
    th.textContent = col.label
    th.style.cssText = 'padding:6px 8px;text-align:left;font-size:11px;font-weight:500;color:#888;'
    headRow.appendChild(th)
  }
  thead.appendChild(headRow)
  table.appendChild(thead)

  const tbody = document.createElement('tbody')

  type ActionRow = {
    owner: string
    description: string
    status: string
    dueDate: string
    parentType: string
    parentTitle: string
    weeklyComment: string
    lastWeekComment: string
  }

  const currentWeek = getCurrentWeek()
  const previousWeek = getPreviousWeek()

  let totalRows = 0

  for (const system of data.systems) {
    type ParentGroup = { parentType: string; parentTitle: string; actions: ActionRow[] }
    const groups: ParentGroup[] = []

    // Issues 配下のアクション
    if (!categories || categories.has('issue')) {
      for (const issue of system.issues.filter((i) => i.status !== 'closed')) {
        const acts = (issue.actions ?? []).filter((a) => a.status !== 'completed')
        if (acts.length === 0) continue
        groups.push({
          parentType: 'issue',
          parentTitle: issue.title,
          actions: acts.map((a) => ({
            owner: a.owner ?? '',
            description: a.description ?? '',
            status: a.status,
            dueDate: a.dueDate ?? '',
            parentType: 'issue',
            parentTitle: issue.title,
            weeklyComment: (a.weeklyUpdates ?? []).find((u) => u.week === currentWeek)?.content ?? '',
            lastWeekComment: (a.weeklyUpdates ?? []).find((u) => u.week === previousWeek)?.content ?? '',
          })),
        })
      }
    }
    // KeyItem 配下のアクション
    for (const ki of system.keyItems.filter((k) => k.status !== 'closed')) {
      if (categories && !categories.has(ki.type as ExportCategory)) continue
      const acts = (ki.actions ?? []).filter((a) => a.status !== 'completed')
      if (acts.length === 0) continue
      groups.push({
        parentType: ki.type,
        parentTitle: ki.title,
        actions: acts.map((a) => ({
          owner: a.owner ?? '',
          description: a.description ?? '',
          status: a.status,
          dueDate: a.dueDate ?? '',
          parentType: ki.type,
          parentTitle: ki.title,
          weeklyComment: (a.weeklyUpdates ?? []).find((u) => u.week === currentWeek)?.content ?? '',
          lastWeekComment: (a.weeklyUpdates ?? []).find((u) => u.week === previousWeek)?.content ?? '',
        })),
      })
    }

    if (groups.length === 0) continue

    // System header row
    const sysRow = document.createElement('tr')
    const sysCell = document.createElement('td')
    const sysCount = groups.reduce((sum, g) => sum + g.actions.length, 0)
    sysCell.colSpan = actionExportCols.length
    sysCell.textContent = `${system.name} (${sysCount}件)`
    sysCell.style.cssText = 'font-size:13px;font-weight:600;padding:10px 8px 4px;background:#f4f4f5;color:#333;'
    sysRow.appendChild(sysCell)
    tbody.appendChild(sysRow)

    for (const group of groups) {
      // Parent item sub-header row
      const subRow = document.createElement('tr')
      const subCell = document.createElement('td')
      subCell.colSpan = actionExportCols.length
      subCell.style.cssText = 'padding:4px 8px 2px 12px;font-size:11px;color:#555;'
      const tc = typeColorsExport[group.parentType] ?? '#888'
      subCell.innerHTML = `<span style="font-size:10px;padding:1px 5px;border:1px solid ${tc};border-radius:3px;color:${tc};margin-right:6px;">${typeLabelsExport[group.parentType] ?? group.parentType}</span><span style="font-weight:500;color:#333;">${group.parentTitle}</span>`
      subRow.appendChild(subCell)
      tbody.appendChild(subRow)

      for (const a of group.actions) {
        totalRows++
        const row = document.createElement('tr')
        row.style.cssText = 'border-bottom:1px solid #e4e4e7;'
        const cellCss = 'padding:4px 8px;font-size:11px;vertical-align:top;color:#333;word-break:break-word;'

        // 担当者
        const ownerTd = document.createElement('td')
        ownerTd.textContent = a.owner || '(未設定)'
        ownerTd.style.cssText = `${cellCss}font-weight:700;padding-left:16px;${a.owner ? '' : 'color:#aaa;font-weight:400;'}`
        row.appendChild(ownerTd)

        // 内容
        const descTd = document.createElement('td')
        descTd.textContent = a.description
        descTd.style.cssText = `${cellCss}white-space:pre-wrap;`
        row.appendChild(descTd)

        // ステータス
        const statusInfo = actionStatusLabelsExport[a.status] ?? { label: a.status, color: '#888' }
        const statusTd = document.createElement('td')
        statusTd.textContent = `● ${statusInfo.label}`
        statusTd.style.cssText = `${cellCss}font-weight:600;color:${statusInfo.color};`
        row.appendChild(statusTd)

        // 期限
        const dueTd = document.createElement('td')
        dueTd.style.cssText = cellCss
        if (a.dueDate) {
          const overdue = new Date(a.dueDate) < new Date()
          dueTd.textContent = a.dueDate
          if (overdue) dueTd.style.cssText += 'color:#dc2626;font-weight:700;'
          else dueTd.style.cssText += 'color:#888;'
        }
        row.appendChild(dueTd)

        // 親アイテム
        const parentTd = document.createElement('td')
        parentTd.style.cssText = `${cellCss}color:#888;overflow:hidden;text-overflow:ellipsis;`
        parentTd.textContent = `${typeLabelsExport[a.parentType] ?? a.parentType} / ${a.parentTitle}`
        row.appendChild(parentTd)

        // 今週のコメント
        const commentTd = document.createElement('td')
        commentTd.textContent = a.weeklyComment
        commentTd.style.cssText = `${cellCss}white-space:pre-wrap;`
        row.appendChild(commentTd)

        // 先週のコメント
        const lastCommentTd = document.createElement('td')
        lastCommentTd.textContent = a.lastWeekComment
        lastCommentTd.style.cssText = `${cellCss}white-space:pre-wrap;color:#888;`
        row.appendChild(lastCommentTd)

        tbody.appendChild(row)
      }
    }
  }

  table.appendChild(tbody)
  container.appendChild(table)

  if (totalRows === 0) {
    const empty = document.createElement('p')
    empty.textContent = 'アクションはありません'
    empty.style.cssText = 'margin-top:24px;font-size:12px;color:#888;text-align:center;'
    container.appendChild(empty)
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
