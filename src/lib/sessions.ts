export interface SessionRecord {
  id: string
  date: string // ISO
  issue: string
  side: 'petitioner' | 'respondent'
  durationSeconds: number
  overallScore: number
  benchConfig: string
  questions: number
  scores: { legalAccuracy: number; structure: number; authorityUsage: number; facturalAccuracy: number; languageQuality: number } | null
  strengths: string[]
  weaknesses: string[]
  researchNeeded: string[]
  nextFocus: string
  transcript: { speaker: 'bench' | 'counsel'; text: string; score?: number; timestamp: number }[]
}

export function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
