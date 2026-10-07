import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ActiveCase {
  id: string
  name: string
  competitionName: string
  competitionDate: string
  side: 'petitioner' | 'respondent' | 'both'
  activeSide: 'petitioner' | 'respondent'
  memorialDeadline: string
  oralRoundDate: string
  daysRemaining: number
  preparationStage: string
  readinessScore: number
  issues: Issue[]
  facts: Fact[]
  rules: CompetitionRules | null
  proposition: string
}

export interface Issue {
  id: string
  number: number
  title: string
  statement: string
  petitionerPosition: string
  respondentPosition: string
  subIssues: string[]
  relevantStatutes: string[]
  constitutionalArticles: string[]
}

export interface Fact {
  id: string
  factId: string
  description: string
  status: 'admitted' | 'disputed' | 'established' | 'alleged' | 'inferred' | 'uncertain' | 'irrelevant'
  legalRelevance: string
  sourceParagraph: string
}

export interface CompetitionRules {
  memorialWordLimit?: number
  memorialPageLimit?: number
  font?: string
  fontSize?: number
  lineSpacing?: number
  citationStyle?: string
  anonymityRequired?: boolean
  oralTimePetitioner?: number
  oralTimeRespondent?: number
  oralTimeRebuttal?: number
  extensionAllowed?: boolean
  maxExtensionSeconds?: number
}

export interface ReadinessBreakdown {
  memorial: number
  legalResearch: number
  authorities: number
  jurisdiction: number
  maintainability: number
  facts: number
  oralAdvocacy: number
  courtoomLanguage: number
  timeManagement: number
  citationIntegrity: number
}

interface MootCourtStore {
  // Active Case
  activeCase: ActiveCase | null
  setActiveCase: (c: ActiveCase) => void
  clearActiveCase: () => void
  updateActiveCaseScore: (score: number) => void
  updateReadinessBreakdown: (breakdown: Partial<ReadinessBreakdown>) => void

  // Readiness
  readinessBreakdown: ReadinessBreakdown

  // Navigation
  activeModule: string
  setActiveModule: (mod: string) => void

  // Alerts
  alerts: Alert[]
  addAlert: (alert: Alert) => void
  dismissAlert: (id: string) => void

  // Current simulation
  activeSession: OralSession | null
  setActiveSession: (session: OralSession | null) => void

  // Search
  globalSearchQuery: string
  setGlobalSearchQuery: (q: string) => void
}

export interface Alert {
  id: string
  type: 'critical' | 'high' | 'medium' | 'info'
  message: string
  module?: string
  dismissible: boolean
  createdAt: string
}

export interface OralSession {
  id: string
  issueId: string
  side: 'petitioner' | 'respondent'
  benchConfig: BenchConfig
  status: 'active' | 'paused' | 'completed'
  timeRemaining: number
  totalTime: number
  questions: SessionQuestion[]
  currentScore: number
}

export interface BenchConfig {
  profiles: string[]
  difficulty: number
  interruptionLevel: 'low' | 'medium' | 'high'
  hypotheticalLevel: 'low' | 'medium' | 'high'
  timePressure: 'low' | 'medium' | 'high' | 'extreme'
  recentLaw: boolean
  factChecking: boolean
  citationChecking: boolean
}

export interface SessionQuestion {
  id: string
  benchProfile: string
  question: string
  answer?: string
  score?: number
  timestamp: number
}

// Demo active case for first-run experience
const DEMO_CASE: ActiveCase = {
  id: 'demo-case-001',
  name: 'Arjun Singh v. Union of India',
  competitionName: 'National Moot Court Competition 2025',
  competitionDate: '2025-03-15',
  side: 'petitioner',
  activeSide: 'petitioner',
  memorialDeadline: '2025-02-01',
  oralRoundDate: '2025-03-15',
  daysRemaining: 47,
  preparationStage: 'research',
  readinessScore: 42,
  proposition: `In the year 2024, Arjun Singh, a senior civil servant, was dismissed from service by the Union of India without a formal departmental enquiry, citing "national security" under an executive order. Singh challenges his dismissal before the Supreme Court of India under Article 32, contending that his Fundamental Rights under Articles 14, 19(1)(g), and 21 have been violated. The Union contends that the dismissal was pursuant to lawful executive power and that judicial review is excluded under Article 19(6). The Supreme Court is to determine: (I) Whether the petition is maintainable, (II) Whether the dismissal without enquiry violates the principles of natural justice and Article 21, and (III) Whether Article 19(6) permits exclusion of judicial review.`,
  issues: [
    {
      id: 'issue-001',
      number: 1,
      title: 'Maintainability',
      statement: 'Whether the petition under Article 32 is maintainable before the Supreme Court of India',
      petitionerPosition: 'The petition is maintainable as fundamental rights under Articles 14, 19 and 21 are directly infringed by State action',
      respondentPosition: 'The petition is not maintainable as an alternative statutory remedy exists under the Administrative Tribunals Act, 1985',
      subIssues: ['Locus standi', 'Alternative remedy', 'Exhaustion of remedies', 'Jurisdiction under Article 32'],
      relevantStatutes: ['Administrative Tribunals Act, 1985', 'Service rules'],
      constitutionalArticles: ['Article 32', 'Article 226', 'Article 136'],
    },
    {
      id: 'issue-002',
      number: 2,
      title: 'Natural Justice & Article 21',
      statement: 'Whether dismissal without a formal departmental enquiry violates principles of natural justice and Article 21',
      petitionerPosition: 'Dismissal without notice or hearing violates audi alteram partem and Article 21 which encompasses right to livelihood',
      respondentPosition: 'National security exception under Rule 19(ii) of All India Services Rules permits dismissal without enquiry',
      subIssues: ['Right to livelihood', 'Audi alteram partem', 'National security exception', 'Procedural fairness'],
      relevantStatutes: ['All India Services (Discipline and Appeal) Rules, 1969', 'Central Civil Services Rules'],
      constitutionalArticles: ['Article 21', 'Article 14', 'Article 311'],
    },
    {
      id: 'issue-003',
      number: 3,
      title: 'Exclusion of Judicial Review',
      statement: 'Whether Article 19(6) permits the exclusion of judicial review of executive action',
      petitionerPosition: 'Judicial review is a basic structure feature and cannot be excluded even by executive order',
      respondentPosition: 'Article 19(6) permits reasonable restrictions and national security falls within permissible restrictions',
      subIssues: ['Basic structure doctrine', 'Scope of Article 19(6)', 'Separation of powers', 'Judicial review as basic structure'],
      relevantStatutes: ['Constitution of India'],
      constitutionalArticles: ['Article 19', 'Article 19(6)', 'Article 32', 'Article 13'],
    }
  ],
  facts: [
    { id: 'fact-001', factId: 'F-001', description: 'Arjun Singh served as a senior IAS officer for 22 years with an unblemished record', status: 'admitted', legalRelevance: 'High — establishes legitimate expectation', sourceParagraph: 'Para 3' },
    { id: 'fact-002', factId: 'F-002', description: 'On 14 January 2024, Singh received a dismissal order citing national security without any prior notice', status: 'admitted', legalRelevance: 'High — triggers natural justice analysis', sourceParagraph: 'Para 5' },
    { id: 'fact-003', factId: 'F-003', description: 'No departmental enquiry was conducted before dismissal', status: 'admitted', legalRelevance: 'Critical — core of Article 311 argument', sourceParagraph: 'Para 6' },
    { id: 'fact-004', factId: 'F-004', description: 'Singh was allegedly involved in unauthorized disclosure of sensitive documents — disputed by Singh', status: 'disputed', legalRelevance: 'Medium — factual basis for security claim', sourceParagraph: 'Para 8' },
    { id: 'fact-005', factId: 'F-005', description: 'Singh did not approach the Central Administrative Tribunal before filing the writ petition', status: 'admitted', legalRelevance: 'High — alternative remedy objection', sourceParagraph: 'Para 10' },
  ],
  rules: {
    memorialWordLimit: 6000,
    memorialPageLimit: 25,
    font: 'Times New Roman',
    fontSize: 12,
    lineSpacing: 1.5,
    citationStyle: 'SCC',
    anonymityRequired: true,
    oralTimePetitioner: 900,
    oralTimeRespondent: 900,
    oralTimeRebuttal: 180,
    extensionAllowed: true,
    maxExtensionSeconds: 120,
  }
}

const DEFAULT_READINESS: ReadinessBreakdown = {
  memorial: 38,
  legalResearch: 55,
  authorities: 48,
  jurisdiction: 62,
  maintainability: 44,
  facts: 71,
  oralAdvocacy: 29,
  courtoomLanguage: 35,
  timeManagement: 40,
  citationIntegrity: 31,
}

export const useMootStore = create<MootCourtStore>()(
  persist(
    (set) => ({
      activeCase: DEMO_CASE,
      setActiveCase: (c) => set({ activeCase: c }),
      clearActiveCase: () => set({ activeCase: null }),
      updateActiveCaseScore: (score) =>
        set((s) => ({
          activeCase: s.activeCase ? { ...s.activeCase, readinessScore: score } : null,
        })),
      updateReadinessBreakdown: (breakdown) =>
        set((s) => ({
          readinessBreakdown: { ...s.readinessBreakdown, ...breakdown },
        })),

      readinessBreakdown: DEFAULT_READINESS,

      activeModule: 'dashboard',
      setActiveModule: (mod) => set({ activeModule: mod }),

      alerts: [
        { id: 'a1', type: 'high', message: 'One authority in your memorial may have been overruled.', module: 'citation-auditor', dismissible: true, createdAt: new Date().toISOString() },
        { id: 'a2', type: 'critical', message: 'Citation verification required for Issue II authorities.', module: 'citation-auditor', dismissible: true, createdAt: new Date().toISOString() },
        { id: 'a3', type: 'medium', message: 'You have not addressed the alternative remedy objection fully.', module: 'maintainability', dismissible: true, createdAt: new Date().toISOString() },
        { id: 'a4', type: 'info', message: '3 new judgments may affect Issue II arguments.', module: 'legal-research', dismissible: true, createdAt: new Date().toISOString() },
      ],
      addAlert: (alert) => set((s) => ({ alerts: [alert, ...s.alerts] })),
      dismissAlert: (id) => set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),

      activeSession: null,
      setActiveSession: (session) => set({ activeSession: session }),

      globalSearchQuery: '',
      setGlobalSearchQuery: (q) => set({ globalSearchQuery: q }),
    }),
    {
      name: 'mootcourt-ai-store',
      partialize: (s) => ({
        activeCase: s.activeCase,
        readinessBreakdown: s.readinessBreakdown,
        activeModule: s.activeModule,
      }),
    }
  )
)
