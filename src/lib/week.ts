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
