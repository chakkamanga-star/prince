'use client'

import { useMootStore } from '@/store/mootStore'
import Sidebar from '@/components/layout/Sidebar'
import ActiveCaseHeader from '@/components/layout/ActiveCaseHeader'
import Dashboard from '@/components/modules/Dashboard'
import PropositionModule from '@/components/modules/PropositionModule'
import CaseIntelligence from '@/components/modules/CaseIntelligence'
import MaintainabilityStudio from '@/components/modules/MaintainabilityStudio'
import CaseLawStudio from '@/components/modules/CaseLawStudio'
import StatuteStudio from '@/components/modules/StatuteStudio'
import LegalResearch from '@/components/modules/LegalResearch'
import MemorialEditor from '@/components/modules/MemorialEditor'
import BenchSimulator from '@/components/modules/BenchSimulator'
import LLMNotebook from '@/components/modules/LLMNotebook'
import FactChecker from '@/components/modules/FactChecker'
import CitationAuditor from '@/components/modules/CitationAuditor'
import Glossary from '@/components/modules/Glossary'
import MootPlanner from '@/components/modules/MootPlanner'
import SessionFeedback from '@/components/modules/SessionFeedback'
import CourtRecord from '@/components/modules/CourtRecord'
import ResearchLibrary from '@/components/modules/ResearchLibrary'
import SettingsModule from '@/components/modules/SettingsModule'

const MODULE_MAP: Record<string, React.ComponentType> = {
  'dashboard': Dashboard,
  'proposition': PropositionModule,
  'case-intelligence': CaseIntelligence,
  'maintainability': MaintainabilityStudio,
  'caselaw': CaseLawStudio,
  'statute': StatuteStudio,
  'legal-research': LegalResearch,
  'memorial': MemorialEditor,
  'bench-simulator': BenchSimulator,
  'notebook': LLMNotebook,
  'fact-checker': FactChecker,
  'citation-auditor': CitationAuditor,
  'glossary': Glossary,
  'planner': MootPlanner,
  'session-feedback': SessionFeedback,
  'court-record': CourtRecord,
  'research-library': ResearchLibrary,
  'settings': SettingsModule,
}

export default function AppShell() {
  const { activeModule } = useMootStore()
  const ActiveComponent = MODULE_MAP[activeModule] || Dashboard

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <ActiveCaseHeader />
        <div className="content-area page-enter">
          <ActiveComponent />
        </div>
      </div>
    </div>
  )
}
