'use client'
import { useState } from 'react'
import { Edit3, Save, CheckCircle, AlertTriangle, FileText, BarChart2 } from 'lucide-react'
import { analyzeMemorial } from '@/lib/gemini'

const MEMORIAL_SECTIONS = [
  { id: 'cover', title: 'Cover Page', words: 0, status: 'complete' },
  { id: 'toc', title: 'Table of Contents', words: 0, status: 'complete' },
  { id: 'abbrev', title: 'List of Abbreviations', words: 0, status: 'complete' },
  { id: 'authorities', title: 'Index of Authorities', words: 0, status: 'needs_work' },
  { id: 'jurisdiction', title: 'Statement of Jurisdiction', words: 187, status: 'complete' },
  { id: 'facts', title: 'Statement of Facts', words: 412, status: 'complete' },
  { id: 'issues', title: 'Issues Raised', words: 89, status: 'complete' },
  { id: 'summary', title: 'Summary of Arguments', words: 298, status: 'needs_work' },
  { id: 'arguments', title: 'Arguments Advanced', words: 2841, status: 'needs_work' },
  { id: 'prayer', title: 'Prayer / Relief', words: 76, status: 'complete' },
]

const SAMPLE_TEXT = `ARGUMENTS ADVANCED

ISSUE I: WHETHER THE PETITION IS MAINTAINABLE

1.1 The Supreme Court of India has jurisdiction to entertain the present petition under Article 32 of the Constitution of India as the Petitioner's fundamental rights under Articles 14, 19(1)(g) and 21 have been directly infringed by the act of the Respondent-State.

1.2 It is respectfully submitted that the jurisdiction of this Hon'ble Court under Article 32 cannot be ousted merely on the ground that an alternative remedy exists. The consistent position of this Hon'ble Court is that where a fundamental right is directly infringed by State action, the petition under Article 32 is maintainable notwithstanding the existence of an alternative remedy. [Whirlpool Corporation v. Registrar of Trade Marks, (1998) 8 SCC 1]

1.3 Moreover, the Petitioner respectfully submits that the Administrative Tribunals Act, 1985 cannot validly exclude the jurisdiction of this Hon'ble Court under Article 32, which forms a part of the basic structure of the Constitution. [L. Chandra Kumar v. Union of India, (1997) 3 SCC 261]`

export default function MemorialEditor() {
  const [activeSection, setActiveSection] = useState('arguments')
  const [text, setText] = useState(SAMPLE_TEXT)
  const [wordCount, setWordCount] = useState(2841)
  const [complianceScore] = useState(78)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(null)
  const [activeTab, setActiveTab] = useState<'edit'|'compliance'|'strength'>('edit')

  const handleTextChange = (val: string) => {
    setText(val)
    setWordCount(val.trim().split(/\s+/).filter(Boolean).length)
  }

  const handleAnalyze = async () => {
    setAnalyzing(true)
    try {
      const result = await analyzeMemorial(text, { wordLimit: 6000, pageLimit: 25 })
      setAnalysis(result)
      setActiveTab('strength')
    } catch {}
    setAnalyzing(false)
  }

  const issues = (analysis as any)?.issues || []

  return (
    <div className="max-w-6xl flex gap-5 h-[calc(100vh-160px)]">
      {/* Left sidebar - sections */}
      <div className="w-52 flex-shrink-0 space-y-1 overflow-y-auto">
        <div className="text-2xs text-charcoal-500 uppercase tracking-wider px-2 py-1">Sections</div>
        {MEMORIAL_SECTIONS.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-all text-left ${
              activeSection === s.id ? 'bg-[#1e2130] text-ivory-100' : 'text-charcoal-400 hover:bg-[#1a1c22]'
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.status === 'complete' ? 'bg-legal-green' : 'bg-gold-400'}`} />
            <span className="flex-1 truncate">{s.title}</span>
            {s.words > 0 && <span className="text-charcoal-600 text-2xs">{s.words}w</span>}
          </button>
        ))}
        <div className="pt-3 px-2 border-t border-[#1e2130]">
          <div className="text-2xs text-charcoal-500">Total Words</div>
          <div className="text-lg font-bold text-ivory-100">3,903 <span className="text-xs text-charcoal-500">/ 6,000</span></div>
          <div className="w-full h-1.5 bg-[#1e2130] rounded-full mt-1">
            <div className="h-full bg-gold-400 rounded-full" style={{ width: '65%' }} />
          </div>
        </div>
      </div>

      {/* Main editor */}
      <div className="flex-1 flex flex-col gap-3 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between bg-[#13151c] border border-[#1e2130] rounded-lg px-4 py-2">
          <div className="flex gap-1">
            {[{id:'edit',label:'Edit'},{id:'compliance',label:'Compliance'},{id:'strength',label:'AI Analysis'}].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id as any)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === t.id ? 'bg-[#1e2130] text-ivory-100' : 'text-charcoal-400'}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-charcoal-500">{wordCount} words</span>
            <button onClick={handleAnalyze} disabled={analyzing} className="btn-secondary text-xs px-3 py-1.5">
              {analyzing ? 'Analysing…' : '⚡ AI Analyse'}
            </button>
            <button className="btn-primary text-xs px-3 py-1.5">
              <Save className="w-3.5 h-3.5" /> Save
            </button>
          </div>
        </div>

        {activeTab === 'edit' && (
          <div className="flex-1 overflow-hidden">
            <textarea
              value={text}
              onChange={e => handleTextChange(e.target.value)}
              className="w-full h-full bg-[#13151c] border border-[#1e2130] rounded-lg p-6 text-sm text-ivory-200 leading-relaxed focus:outline-none focus:border-gold-500/50 resize-none font-serif"
              placeholder="Start drafting your memorial section here…"
            />
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="flex-1 overflow-y-auto space-y-3">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="section-title">Memorial Compliance Check</h3>
                <div className={`text-2xl font-bold ${complianceScore >= 80 ? 'text-legal-green' : 'text-gold-400'}`}>{complianceScore}/100</div>
              </div>
              <div className="space-y-2">
                {[
                  { rule: 'Word Limit (6,000)', current: '3,903', required: '≤ 6,000', status: 'pass' },
                  { rule: 'Page Limit (25 pages)', current: '~16', required: '≤ 25', status: 'pass' },
                  { rule: 'Font (Times New Roman)', current: 'Times New Roman', required: 'Times New Roman', status: 'pass' },
                  { rule: 'Font Size (12pt)', current: '12pt', required: '12pt', status: 'pass' },
                  { rule: 'Anonymity (no team name)', current: 'Not checked', required: 'Required', status: 'warning' },
                  { rule: 'Index of Authorities', current: 'Incomplete', required: 'Required', status: 'fail' },
                  { rule: 'Cover Page Format', current: 'Present', required: 'Required', status: 'pass' },
                ].map(item => (
                  <div key={item.rule} className={`flex items-center gap-3 p-3 rounded-md border ${
                    item.status === 'pass' ? 'border-legal-green/20 bg-legal-green/5' :
                    item.status === 'fail' ? 'border-legal-red/20 bg-legal-red/5' :
                    'border-gold-500/20 bg-gold-500/5'
                  }`}>
                    {item.status === 'pass' ? <CheckCircle className="w-4 h-4 text-legal-green flex-shrink-0" /> :
                     item.status === 'fail' ? <AlertTriangle className="w-4 h-4 text-legal-red flex-shrink-0" /> :
                     <AlertTriangle className="w-4 h-4 text-gold-400 flex-shrink-0" />}
                    <span className="text-sm text-ivory-200 flex-1">{item.rule}</span>
                    <span className="text-xs text-charcoal-400">Current: {item.current}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'strength' && (
          <div className="flex-1 overflow-y-auto space-y-3">
            {!analysis ? (
              <div className="card text-center py-8">
                <BarChart2 className="w-10 h-10 text-charcoal-700 mx-auto mb-3" />
                <div className="text-sm text-charcoal-400">Click "AI Analyse" to evaluate argument strength</div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Argument Strength', val: (analysis as any).argument_strength },
                    { label: 'Citation Integrity', val: (analysis as any).citation_integrity },
                    { label: 'Structure', val: (analysis as any).structure_score },
                  ].map(item => (
                    <div key={item.label} className="card text-center">
                      <div className="text-2xl font-bold text-gold-400">{item.val || '—'}</div>
                      <div className="text-xs text-charcoal-500 mt-1">{item.label}</div>
                    </div>
                  ))}
                </div>
                {issues.map((issue: any, i: number) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-md border ${
                    issue.type === 'critical' ? 'border-legal-red/30 bg-legal-red/5' :
                    issue.type === 'high' ? 'border-orange-500/30 bg-orange-500/5' :
                    'border-gold-500/30 bg-gold-500/5'
                  }`}>
                    <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${issue.type === 'critical' ? 'text-legal-red' : issue.type === 'high' ? 'text-orange-400' : 'text-gold-400'}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-ivory-200">{issue.location}</span>
                        <span className={`badge text-2xs ${issue.type === 'critical' ? 'badge-red' : issue.type === 'high' ? 'badge-amber' : 'badge-gold'} capitalize`}>{issue.type}</span>
                      </div>
                      <p className="text-xs text-charcoal-300 mt-1">{issue.description}</p>
                      {issue.suggestion && <p className="text-xs text-legal-green mt-1 italic">→ {issue.suggestion}</p>}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
