'use client'

import { type ProjectData, ProjectDataSchema } from '@/types/schema'

export async function importProjectData(file: File): Promise<ProjectData> {
  const text = await file.text()

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('JSONファイルの形式が不正です。有効なJSONファイルを選択してください。')
  }

  const result = ProjectDataSchema.safeParse(parsed)
  if (!result.success) {
    const details = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join(', ')
    throw new Error(`データの検証に失敗しました: ${details}`)
  }

  return result.data
}
