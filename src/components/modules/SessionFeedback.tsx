'use client'
import { useState } from 'react'
import { BarChart2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Mic } from 'lucide-react'

const SAMPLE_SESSIONS = [
  { id: 's1', date: '5 Oct 2024', issue: 'Issue I — Maintainability', side: 'petitioner', duration: '14:32', overallScore: 64, benchConfig: 'Balanced (3J) · Difficulty 3', questions: 8, scores: { legalAccuracy: 70, structure: 60, authorityUsage: 55, facturalAccuracy: 80, languageQuality: 65 }, strengths: ['Good opening statement structure', 'Correctly cited L. Chandra Kumar', 'Maintained poise under interruptions'], weaknesses: ['Failed to address alternative remedy objection directly', 'Over-reliance on one authority', 'Did not distinguish S.P. Sampath Kumar'], researchNeeded: ['Exception to alternative remedy rule — find post-2010 authority', 'National security exception — strengthen counter-argument'], nextFocus: 'Practice addressing alternative remedy objection with 3 distinct grounds' },
  { id: 's2', date: '1 Oct 2024', issue: 'Issue I — Maintainability', side: 'petitioner', duration: '09:15', overallScore: 52, benchConfig: 'Skeptical (1J) · Difficulty 4', questions: 6, scores: { legalAccuracy: 58, structure: 48, authorityUsage: 42, facturalAccuracy: 65, languageQuality: 55 }, strengths: ['Logical sequencing'], weaknesses: ['Cited wrong paragraph from Whirlpool', 'Could not answer direct questions on jurisdiction', 'Time management poor'], researchNeeded: ['Whirlpool — correct paragraph numbers', 'Constitutional jurisdiction — foundational authorities'], nextFocus: 'Memorise exact citation details and paragraph references' },
]

export default function SessionFeedback() {
  const [selected, setSelected] = useState(SAMPLE_SESSIONS[0])

  const scoreItems = [
    { key: 'legalAccuracy', label: 'Legal Accuracy' },
    { key: 'structure', label: 'Structure' },
    { key: 'authorityUsage', label: 'Authority Usage' },
    { key: 'facturalAccuracy', label: 'Factual Accuracy' },
    { key: 'languageQuality', label: 'Language Quality' },
  ]

  const trend = selected.overallScore > SAMPLE_SESSIONS[SAMPLE_SESSIONS.length - 1].overallScore ? 'up' : 'down'

  return (
    <div className="max-w-5xl space-y-5">
      <div><h1 className="text-xl font-bold text-ivory-100">Session Feedback & Analytics</h1>
        <p className="text-sm text-charcoal-400 mt-0.5">Post-simulation performance analysis and coaching</p></div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {SAMPLE_SESSIONS.map(s => (
          <button key={s.id} onClick={() => setSelected(s)}
            className={`flex-shrink-0 text-left p-3 rounded-lg border transition-all min-w-[200px] ${
              selected.id === s.id ? 'border-gold-500/50 bg-gold-500/8' : 'border-[#2a2e40] bg-[#13151c]'
            }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-charcoal-500">{s.date}</span>
              <div className={`text-sm font-bold ${s.overallScore >= 70 ? 'text-legal-green' : s.overallScore >= 55 ? 'text-gold-400' : 'text-legal-red'}`}>{s.overallScore}/100</div>
            </div>
            <div className="text-xs font-medium text-ivory-200 truncate">{s.issue}</div>
            <div className="text-2xs text-charcoal-500 mt-1">{s.benchConfig}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-8 space-y-4">
          {/* Score breakdown */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">Score Breakdown</h3>
              <div className="flex items-center gap-2">
                {trend === 'up' ? <TrendingUp className="w-4 h-4 text-legal-green" /> : <TrendingDown className="w-4 h-4 text-legal-red" />}
                <div className={`text-2xl font-bold ${selected.overallScore >= 70 ? 'text-legal-green' : 'text-gold-400'}`}>{selected.overallScore}/100</div>
              </div>
            </div>
            <div className="space-y-3">
              {scoreItems.map(item => {
                const val = (selected.scores as any)[item.key]
                return (
                  <div key={item.key} className="flex items-center gap-3">
                    <span className="text-xs text-charcoal-400 w-32 flex-shrink-0">{item.label}</span>
                    <div className="flex-1 h-2 bg-[#1e2130] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${val >= 70 ? 'bg-legal-green' : val >= 55 ? 'bg-gold-400' : 'bg-legal-red'}`}
                        style={{ width: `${val}%` }} />
                    </div>
                    <span className="text-xs font-bold text-ivory-200 w-8 text-right">{val}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Strengths / Weaknesses */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-legal-green" />
                <h3 className="text-sm font-semibold text-ivory-100">What Went Well</h3>
              </div>
              <div className="space-y-2">
                {selected.strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-ivory-300">
                    <CheckCircle className="w-3.5 h-3.5 text-legal-green mt-0.5 flex-shrink-0" />{s}
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-legal-red" />
                <h3 className="text-sm font-semibold text-ivory-100">What to Fix</h3>
              </div>
              <div className="space-y-2">
                {selected.weaknesses.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-ivory-300">
                    <AlertTriangle className="w-3.5 h-3.5 text-legal-red mt-0.5 flex-shrink-0" />{w}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Research required */}
          <div className="card">
            <h3 className="section-title text-sm mb-3">Research Required Before Next Session</h3>
            <div className="space-y-2">
              {selected.researchNeeded.map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-md bg-[#1a1c22] border border-[#2a2e40]">
                  <span className="w-5 h-5 rounded-full bg-navy-800 border border-navy-600 flex items-center justify-center text-2xs text-navy-200 flex-shrink-0">{i+1}</span>
                  <span className="text-sm text-ivory-300">{r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-4 space-y-4">
          <div className="card">
            <div className="text-xs text-charcoal-500 uppercase tracking-wider mb-3">Session Details</div>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Date', value: selected.date },
                { label: 'Issue', value: selected.issue },
                { label: 'Side', value: selected.side.charAt(0).toUpperCase() + selected.side.slice(1) },
                { label: 'Duration', value: selected.duration },
                { label: 'Questions', value: `${selected.questions} Q&A pairs` },
                { label: 'Bench', value: selected.benchConfig },
              ].map(item => (
                <div key={item.label} className="flex justify-between gap-3">
                  <span className="text-charcoal-500 text-xs">{item.label}</span>
                  <span className="text-ivory-300 text-xs text-right">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card border-gold-600/20 bg-gradient-to-br from-[#13151c] to-[#1a1508]">
            <div className="flex items-center gap-2 mb-2">
              <Mic className="w-4 h-4 text-gold-400" />
              <span className="text-xs font-semibold text-gold-300">Next Session Focus</span>
            </div>
            <p className="text-sm text-ivory-300">{selected.nextFocus}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
