import { type ProjectData, ProjectDataSchema } from '@/types/schema'
import rawData from '../../sample-data.json'

export function loadSampleData(): ProjectData {
  return ProjectDataSchema.parse(rawData)
}
