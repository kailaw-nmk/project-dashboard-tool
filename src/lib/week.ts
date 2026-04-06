/**
 * 週の基準日を金曜日とするユーティリティ
 * currentWeek のフォーマット: "YYYY/MM/DD"（その週の金曜日の日付）
 */

/**
 * 指定日が属する週の金曜日の日付を返す
 * 月〜金 → その週の金曜日
 * 土〜日 → 次の金曜日
 */
export function getFridayOfWeek(date: Date = new Date()): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay() // 0=日, 1=月, ..., 5=金, 6=土
  let diff: number
  if (day === 0) {
    // 日曜日 → 次の金曜日 (+5)
    diff = 5
  } else if (day === 6) {
    // 土曜日 → 次の金曜日 (+6)
    diff = 6
  } else {
    // 月(1)〜金(5) → その週の金曜日
    diff = 5 - day
  }
  d.setDate(d.getDate() + diff)
  return d
}

/**
 * 日付を "YYYY/MM/DD" 形式にフォーマット
 */
export function formatWeekDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}/${m}/${d}`
}

/**
 * 現在の週（金曜日の日付）を "YYYY/MM/DD" 形式で返す
 */
export function getCurrentWeek(): string {
  return formatWeekDate(getFridayOfWeek())
}

/**
 * 前週の金曜日の日付を "YYYY/MM/DD" 形式で返す
 */
export function getPreviousWeek(): string {
  const friday = getFridayOfWeek()
  friday.setDate(friday.getDate() - 7)
  return formatWeekDate(friday)
}

import type { WeeklyUpdate } from '@/types/schema'

/**
 * 週次アップデートのupsert + 3週間ローテーション
 * - 同じ週があれば上書き、なければ追加
 * - 空contentの場合はそのエントリを削除
 * - weekで降順ソートし、先頭3件のみ保持
 */
export function upsertWeeklyUpdate(
  updates: WeeklyUpdate[],
  week: string,
  content: string,
): WeeklyUpdate[] {
  let result = updates.filter((u) => u.week !== week)
  if (content.trim()) {
    result.push({ week, content: content.trim(), updatedAt: new Date().toISOString() })
  }
  return result.sort((a, b) => b.week.localeCompare(a.week)).slice(0, 3)
}

/**
 * 週の表示ラベルを返す（例: "2026/03/27 (金)"）
 */
export function formatWeekLabel(week: string): string {
  // 既に "YYYY/MM/DD" 形式ならそのまま "(金)" を付ける
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(week)) {
    return `${week} (金)`
  }
  // レガシーの "YYYY-Wxx" 形式はそのまま返す
  return week
}
