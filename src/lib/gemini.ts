// Client-safe Gemini caller routing through /api/gemini with server-side API execution

export const MODELS = {
  fast: 'gemini-flash-latest',
  pro: 'gemini-3.8-flash',
  embedding: 'gemini-embedding-2',
} as const

async function callGeminiApi<T>(action: string, payload: any): Promise<T> {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || `Request failed with status ${res.status}`)
  }

  return res.json()
}

// ── Legal Research ────────────────────────────────────────────────────────
export async function legalResearch(query: string, caseContext?: string) {
  const data = await callGeminiApi<{ text: string; sources?: Array<{ uri: string; title: string }> }>(
    'legalResearch',
    { query, caseContext }
  )
  return {
    text: data.text,
    candidates: [
      {
        groundingMetadata: {
          groundingChunks: (data.sources || []).map(s => ({
            web: { uri: s.uri, title: s.title }
          }))
        }
      }
    ]
  }
}

// ── Bench Question Generator ───────────────────────────────────────────────
export async function generateBenchQuestion(params: {
  issue: string
  currentArgument: string
  archetype: string
  difficulty: number
  previousQuestions: string[]
  propositionContext: string
  caseContext: string
}): Promise<string> {
  const data = await callGeminiApi<{ question: string }>('generateBenchQuestion', params)
  return data.question || "Counsel, where is your authority for that proposition?"
}

// ── Score Counsel Answer ───────────────────────────────────────────────────
export async function scoreCounselAnswer(params: {
  question: string
  answer: string
  issue: string
  propositionContext: string
}): Promise<{
  score: number
  legal_accuracy: number
  structure: number
  authority_cited: boolean
  fact_accurate: boolean
  language_quality: number
  strengths: string[]
  weaknesses: string[]
  suggested_improvement: string
  follow_up_warranted: boolean
  bench_reaction: string
}> {
  return callGeminiApi('scoreCounselAnswer', params)
}

// ── Analyze Memorial ────────────────────────────────────────────────────────
export async function analyzeMemorial(memorialText: string, rules: Record<string, unknown> = {}) {
  return callGeminiApi<{
    argument_strength: number
    citation_integrity: number
    structure_score: number
    issues: Array<{ type: string; location: string; description: string; suggestion: string }>
    strengths: string[]
    missing_authorities: string[]
    bench_attacks: string[]
  }>('analyzeMemorial', { memorialText, rules })
}

// ── Deconstruct Proposition ─────────────────────────────────────────────────
export async function deconstructProposition(text: string) {
  return callGeminiApi<any>('deconstructProposition', { text })
}

// ── Generate Preparation Schedule ───────────────────────────────────────────
export async function generatePreparationSchedule(params: {
  daysRemaining: number
  memorialDeadline: string
  oralDate: string
  currentScores: Record<string, number>
  issues: string[]
}) {
  return callGeminiApi<any>('generatePreparationSchedule', params)
}

// ── Check Fact Consistency ──────────────────────────────────────────────────
export async function checkFactConsistency(statement: string, facts: Array<{ id: string; description: string }>) {
  return callGeminiApi<{
    status: string
    confidence: number
    discrepancy: string | null
    relevant_fact_ids: string[]
    explanation: string
  }>('checkFactConsistency', { statement, facts })
}

// ── Interpret Statute ────────────────────────────────────────────────────────
export async function interpretStatute(params: {
  sectionText: string
  sectionNumber: string
  actTitle: string
  issue: string
  userPosition: string
}) {
  return callGeminiApi<{
    plain_meaning: string
    key_terms: Array<{ term: string; definition: string }>
    statutory_context: string
    interpretive_approaches: Array<{ approach: string; analysis: string; supports_position: string; relevance: string }>
    related_provisions: string[]
    legislative_purpose: string
    bench_observations: string[]
    strength_for_user: number
    caution: string
  }>('interpretStatute', params)
}

// ── Generate Session Feedback ────────────────────────────────────────────────
export async function generateSessionFeedback(params: {
  questions: Array<{ q: string; a: string; score: number }>
  totalScore: number
  issue: string
  side: string
}) {
  return callGeminiApi<any>('generateSessionFeedback', params)
}
