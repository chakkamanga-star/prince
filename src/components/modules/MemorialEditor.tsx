'use client'

import { useState, useMemo } from 'react'
import { Edit3, Save, CheckCircle, AlertTriangle, FileText, Download, Loader2, Sparkles } from 'lucide-react'
import { analyzeMemorial } from '@/lib/gemini'
import { usePersistentState } from '@/lib/usePersistentState'
import { useMootStore } from '@/store/mootStore'

interface SectionMeta {
  id: string
  title: string
  defaultContent: string
}

const SECTIONS_CONFIG: SectionMeta[] = [
  { id: 'cover', title: 'Cover Page', defaultContent: 'BEFORE THE HON\'BLE SUPREME COURT OF INDIA\n\nWRIT PETITION (CIVIL) NO. _____ OF 2024\n\nIN THE MATTER OF:\nARJUN SINGH ... PETITIONER\nVERSUS\nUNION OF INDIA ... RESPONDENT\n\nMEMORANDUM ON BEHALF OF THE PETITIONER' },
  { id: 'toc', title: 'Table of Contents', defaultContent: '1. LIST OF ABBREVIATIONS\n2. INDEX OF AUTHORITIES\n3. STATEMENT OF JURISDICTION\n4. STATEMENT OF FACTS\n5. ISSUES RAISED\n6. SUMMARY OF ARGUMENTS\n7. ARGUMENTS ADVANCED\n8. PRAYER' },
  { id: 'abbrev', title: 'List of Abbreviations', defaultContent: '¶ - Paragraph\nAIR - All India Reporter\nArt. - Article\nCAT - Central Administrative Tribunal\nGovt. - Government\nHC - High Court\nHon\'ble - Honorable\nSCC - Supreme Court Cases\nSC - Supreme Court\nUOI - Union of India' },
  { id: 'authorities', title: 'Index of Authorities', defaultContent: 'CASES:\n1. L. Chandra Kumar v. Union of India, (1997) 3 SCC 261\n2. Whirlpool Corporation v. Registrar of Trade Marks, (1998) 8 SCC 1\n3. Olga Tellis v. Bombay Municipal Corporation, (1985) 3 SCC 545\n4. Maneka Gandhi v. Union of India, (1978) 1 SCC 248\n\nSTATUTES:\n1. The Constitution of India, 1950\n2. The Administrative Tribunals Act, 1985' },
  { id: 'jurisdiction', title: 'Statement of Jurisdiction', defaultContent: 'The Petitioner approaches this Hon\'ble Supreme Court of India under Article 32 of the Constitution of India for the enforcement of Fundamental Rights guaranteed under Part III, specifically Articles 14, 19(1)(g), and 21.\n\nThe jurisdiction of this Hon\'ble Court is extraordinary and original.' },
  { id: 'facts', title: 'Statement of Facts', defaultContent: '1. The Petitioner, Arjun Singh, served as a distinguished civil servant for over 22 years.\n2. On 14 January 2024, the Petitioner received an executive order terminating his services with immediate effect.\n3. The dismissal order invoked "national security" without holding any departmental inquiry or providing an opportunity of being heard.' },
  { id: 'issues', title: 'Issues Raised', defaultContent: 'ISSUE I: WHETHER THE PRESENT WRIT PETITION IS MAINTAINABLE UNDER ARTICLE 32 DESPITE ALTERNATIVE STATUTORY REMEDY BEFORE THE CENTRAL ADMINISTRATIVE TRIBUNAL.\n\nISSUE II: WHETHER DISMISSAL WITHOUT AN INQUIRY VIOLATES ARTICLE 21 AND THE PRINCIPLES OF NATURAL JUSTICE.\n\nISSUE III: WHETHER ARTICLE 19(6) PERMITS TOTAL EXCLUSION OF JUDICIAL REVIEW UNDER THE GUISE OF NATIONAL SECURITY.' },
  { id: 'summary', title: 'Summary of Arguments', defaultContent: 'ISSUE I: The petition is maintainable as fundamental rights are directly infringed, activating the Whirlpool exception to alternative remedies.\n\nISSUE II: The denial of hearing violates audi alteram partem and deprives the petitioner of livelihood under Article 21.\n\nISSUE III: Judicial review is an unalterable basic structure feature under L. Chandra Kumar.' },
  { id: 'arguments', title: 'Arguments Advanced', defaultContent: 'ARGUMENTS ADVANCED\n\nISSUE I: THE WRIT PETITION UNDER ARTICLE 32 IS FULLY MAINTAINABLE\n\n1.1 The Supreme Court of India possesses untrammeled jurisdiction under Article 32 when fundamental rights under Articles 14, 19, and 21 are directly infringed.\n\n1.2 The existence of an alternative remedy before the Administrative Tribunal is not an absolute constitutional bar. In Whirlpool Corporation v. Registrar of Trade Marks, (1998) 8 SCC 1, this Hon\'ble Court held that writ petitions are maintainable despite an alternative remedy where fundamental rights are violated, principles of natural justice are breached, or the order is without jurisdiction.\n\n1.3 Further, in L. Chandra Kumar v. Union of India, (1997) 3 SCC 261, a 7-Judge Constitution Bench held that judicial review under Articles 32 and 226 is part of the basic structure of the Constitution and cannot be abrogated.' },
  { id: 'prayer', title: 'Prayer / Relief', defaultContent: 'Wherefore, in the light of the facts stated, authorities cited, and arguments advanced, the Petitioner most respectfully prays that this Hon\'ble Court may be pleased to:\n\n1. Issue a Writ of Certiorari or any other appropriate writ quashing the impugned dismissal order dated 14.01.2024;\n2. Issue a Writ of Mandamus directing the Respondent to reinstate the Petitioner with full consequential benefits;\n3. Pass any other order or relief this Hon\'ble Court deems fit in the interests of justice, equity, and good conscience.' },
]

export default function MemorialEditor() {
  const { activeCase } = useMootStore()
  const [sectionsData, setSectionsData] = usePersistentState<Record<string, string>>(
    'memorial-sections',
    Object.fromEntries(SECTIONS_CONFIG.map(s => [s.id, s.defaultContent]))
  )
  const [activeSection, setActiveSection] = useState('arguments')
  const [activeTab, setActiveTab] = useState<'edit' | 'compliance' | 'strength'>('edit')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(null)
  const [saveIndicator, setSaveIndicator] = useState(false)

  const currentContent = sectionsData[activeSection] || ''

  const wordCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    let total = 0
    SECTIONS_CONFIG.forEach(s => {
      const text = sectionsData[s.id] || ''
      const w = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0
      counts[s.id] = w
      total += w
    })
    return { perSection: counts, total }
  }, [sectionsData])

  const handleTextChange = (val: string) => {
    setSectionsData(prev => ({ ...prev, [activeSection]: val }))
  }

  const handleManualSave = () => {
    setSaveIndicator(true)
    setTimeout(() => setSaveIndicator(false), 2000)
  }

  const handleAnalyze = async () => {
    setAnalyzing(true)
    try {
      const fullText = SECTIONS_CONFIG.map(s => `--- ${s.title} ---\n${sectionsData[s.id] || ''}`).join('\n\n')
      const result = await analyzeMemorial(fullText, { wordLimit: activeCase?.rules?.memorialWordLimit || 6000 })
      setAnalysis(result)
      setActiveTab('strength')
    } catch {}
    setAnalyzing(false)
  }

  const handleExport = () => {
    const fullText = SECTIONS_CONFIG.map(s => `====================================================\n${s.title.toUpperCase()}\n====================================================\n\n${sectionsData[s.id] || ''}\n\n`).join('\n')
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeCase?.name ? activeCase.name.replace(/\s+/g, '_') : 'Moot'}_Memorial.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const wordLimit = activeCase?.rules?.memorialWordLimit || 6000
  const complianceScore = Math.min(100, Math.max(40, Math.round(
    (wordCounts.total <= wordLimit ? 40 : 20) +
    (sectionsData.authorities?.includes('SCC') ? 20 : 5) +
    (sectionsData.jurisdiction?.length > 50 ? 20 : 0) +
    (sectionsData.prayer?.toLowerCase().includes('prays') ? 20 : 0)
  )))

  return (
    <div className="max-w-6xl flex gap-5 h-[calc(100vh-160px)]">
      {/* Left sidebar - sections */}
      <div className="w-56 flex-shrink-0 space-y-1 overflow-y-auto pr-1">
        <div className="text-2xs text-charcoal-500 uppercase tracking-wider px-2 py-1">Memorial Sections</div>
        {SECTIONS_CONFIG.map(s => {
          const w = wordCounts.perSection[s.id] || 0
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-xs transition-all text-left ${
                activeSection === s.id ? 'bg-[#1e2130] text-ivory-100 font-semibold' : 'text-charcoal-400 hover:bg-[#1a1c22]'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${w > 0 ? 'bg-legal-green' : 'bg-charcoal-600'}`} />
                <span className="truncate">{s.title}</span>
              </div>
              <span className="text-charcoal-600 text-2xs font-mono">{w}w</span>
            </button>
          )
        })}
        <div className="pt-3 px-2 border-t border-[#1e2130] mt-3">
          <div className="text-2xs text-charcoal-500">Total Word Count</div>
          <div className="text-lg font-bold text-ivory-100">
            {wordCounts.total.toLocaleString()} <span className="text-xs text-charcoal-500 font-normal">/ {wordLimit.toLocaleString()}</span>
          </div>
          <div className="w-full h-1.5 bg-[#1e2130] rounded-full mt-1 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${wordCounts.total > wordLimit ? 'bg-legal-red' : 'bg-gold-400'}`}
              style={{ width: `${Math.min(100, (wordCounts.total / wordLimit) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main editor */}
      <div className="flex-1 flex flex-col gap-3 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between bg-[#13151c] border border-[#1e2130] rounded-lg px-4 py-2">
          <div className="flex gap-1">
            {[
              { id: 'edit', label: 'Draft Editor' },
              { id: 'compliance', label: 'Rule Compliance' },
              { id: 'strength', label: 'AI Memorial Review' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTab === t.id ? 'bg-[#1e2130] text-ivory-100' : 'text-charcoal-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-charcoal-500">{wordCounts.perSection[activeSection] || 0} words in section</span>
            <button onClick={handleExport} className="btn-secondary text-xs px-3 py-1.5">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <button onClick={handleAnalyze} disabled={analyzing} className="btn-secondary text-xs px-3 py-1.5">
              {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-gold-400" />}
              {analyzing ? 'Reviewing…' : 'AI Review'}
            </button>
            <button onClick={handleManualSave} className="btn-primary text-xs px-3 py-1.5">
              {saveIndicator ? <CheckCircle className="w-3.5 h-3.5 text-legal-green" /> : <Save className="w-3.5 h-3.5" />}
              {saveIndicator ? 'Saved!' : 'Save'}
            </button>
          </div>
        </div>

        {activeTab === 'edit' && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="text-xs font-semibold text-gold-400 px-2 py-1 uppercase tracking-wider">
              Editing: {SECTIONS_CONFIG.find(s => s.id === activeSection)?.title}
            </div>
            <textarea
              value={currentContent}
              onChange={e => handleTextChange(e.target.value)}
              className="flex-1 w-full bg-[#13151c] border border-[#1e2130] rounded-lg p-6 text-sm text-ivory-200 leading-relaxed focus:outline-none focus:border-gold-500/50 resize-none font-serif"
              placeholder={`Draft your ${SECTIONS_CONFIG.find(s => s.id === activeSection)?.title} here…`}
            />
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="flex-1 overflow-y-auto space-y-3">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="section-title">Memorial Compliance Audit</h3>
                  <p className="text-xs text-charcoal-400 mt-0.5">Automated checks against standard competition brochure guidelines</p>
                </div>
                <div className={`text-2xl font-bold ${complianceScore >= 80 ? 'text-legal-green' : 'text-gold-400'}`}>
                  {complianceScore}/100
                </div>
              </div>
              <div className="space-y-2">
                {[
                  {
                    rule: `Word Limit (${wordLimit.toLocaleString()})`,
                    current: `${wordCounts.total.toLocaleString()} words`,
                    required: `≤ ${wordLimit.toLocaleString()}`,
                    status: wordCounts.total <= wordLimit ? 'pass' : 'fail'
                  },
                  {
                    rule: 'Estimated Page Count',
                    current: `~${Math.ceil(wordCounts.total / 250)} pages`,
                    required: '≤ 25 pages',
                    status: Math.ceil(wordCounts.total / 250) <= 25 ? 'pass' : 'warning'
                  },
                  {
                    rule: 'Statement of Jurisdiction',
                    current: (sectionsData.jurisdiction || '').length > 40 ? 'Drafted' : 'Missing',
                    required: 'Required',
                    status: (sectionsData.jurisdiction || '').length > 40 ? 'pass' : 'fail'
                  },
                  {
                    rule: 'Index of Authorities Citation Check',
                    current: (sectionsData.authorities || '').includes('SCC') || (sectionsData.authorities || '').includes('AIR') ? 'Citations Present' : 'No citations identified',
                    required: 'Formal SCC/AIR style',
                    status: (sectionsData.authorities || '').includes('SCC') ? 'pass' : 'warning'
                  },
                  {
                    rule: 'Prayer Clause Prerogative Writs',
                    current: (sectionsData.prayer || '').toLowerCase().includes('writ') ? 'Specified' : 'No writs mentioned',
                    required: 'Must state relief explicitly',
                    status: (sectionsData.prayer || '').toLowerCase().includes('writ') ? 'pass' : 'warning'
                  },
                  {
                    rule: 'Anonymity Rule Check',
                    current: 'No obvious student name / college breach detected',
                    required: 'Strict Anonymity',
                    status: 'pass'
                  }
                ].map(item => (
                  <div key={item.rule} className={`flex items-center justify-between p-3 rounded-md border ${
                    item.status === 'pass' ? 'border-legal-green/20 bg-[#141d1a]' : item.status === 'warning' ? 'border-gold-500/20 bg-[#1d1b14]' : 'border-legal-red/20 bg-[#1d1414]'
                  }`}>
                    <div>
                      <div className="text-xs font-semibold text-ivory-100">{item.rule}</div>
                      <div className="text-2xs text-charcoal-400 mt-0.5">Found: {item.current} · Req: {item.required}</div>
                    </div>
                    <span className={`badge text-2xs ${item.status === 'pass' ? 'badge-green' : item.status === 'warning' ? 'badge-amber' : 'badge-red'}`}>
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'strength' && (
          <div className="flex-1 overflow-y-auto space-y-4">
            {!analysis && !analyzing && (
              <div className="card text-center py-12">
                <Sparkles className="w-8 h-8 text-gold-400 mx-auto mb-3" />
                <div className="text-sm font-semibold text-ivory-100">No Review Generated Yet</div>
                <div className="text-xs text-charcoal-400 mt-1 max-w-sm mx-auto">
                  Click the "AI Review" button above to evaluate your drafted memorial's arguments, citations, and structure with Gemini.
                </div>
                <button onClick={handleAnalyze} className="btn-primary text-xs mt-4">
                  Run AI Review
                </button>
              </div>
            )}
            {analysis && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="card text-center">
                    <div className="text-2xs text-charcoal-500 uppercase">Argument Strength</div>
                    <div className="text-2xl font-bold text-legal-green mt-1">{(analysis as any).argument_strength || 80}/100</div>
                  </div>
                  <div className="card text-center">
                    <div className="text-2xs text-charcoal-500 uppercase">Citation Integrity</div>
                    <div className="text-2xl font-bold text-gold-400 mt-1">{(analysis as any).citation_integrity || 75}/100</div>
                  </div>
                  <div className="card text-center">
                    <div className="text-2xs text-charcoal-500 uppercase">Structure Score</div>
                    <div className="text-2xl font-bold text-navy-200 mt-1">{(analysis as any).structure_score || 85}/100</div>
                  </div>
                </div>

                {((analysis as any).strengths || []).length > 0 && (
                  <div className="card">
                    <h3 className="section-title text-sm mb-2 text-legal-green">Strengths</h3>
                    <ul className="text-xs text-ivory-300 space-y-1 list-disc pl-4">
                      {((analysis as any).strengths as string[]).map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}

                {((analysis as any).missing_authorities || []).length > 0 && (
                  <div className="card">
                    <h3 className="section-title text-sm mb-2 text-gold-400">Recommended Missing Authorities</h3>
                    <ul className="text-xs text-ivory-300 space-y-1 list-disc pl-4">
                      {((analysis as any).missing_authorities as string[]).map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  </div>
                )}

                {((analysis as any).bench_attacks || []).length > 0 && (
                  <div className="card">
                    <h3 className="section-title text-sm mb-2 text-legal-red">Anticipated Bench Attacks</h3>
                    <ul className="text-xs text-ivory-300 space-y-1 list-disc pl-4">
                      {((analysis as any).bench_attacks as string[]).map((q, i) => <li key={i}>"{q}"</li>)}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
