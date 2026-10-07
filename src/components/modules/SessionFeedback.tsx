'use client'
import { useState } from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Mic } from 'lucide-react'
import { useMootStore } from '@/store/mootStore'
import { usePersistentState } from '@/lib/usePersistentState'
import { formatDate, formatDuration, type SessionRecord } from '@/lib/sessions'

const SCORE_ITEMS = [
  { key: 'legalAccuracy', label: 'Legal Accuracy' },
  { key: 'structure', label: 'Structure' },
  { key: 'authorityUsage', label: 'Authority Usage' },
  { key: 'facturalAccuracy', label: 'Factual Accuracy' },
  { key: 'languageQuality', label: 'Language Quality' },
] as const

export default function SessionFeedback() {
  const { setActiveModule } = useMootStore()
  const [sessions] = usePersistentState<SessionRecord[]>('moot-sessions', [])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  if (sessions.length === 0) {
    return (
      <div className="max-w-5xl space-y-5">
        <div><h1 className="text-xl font-bold text-ivory-100">Session Feedback &amp; Analytics</h1>
          <p className="text-sm text-charcoal-400 mt-0.5">Post-simulation performance analysis and coaching</p></div>
        <div className="card text-center py-12">
          <Mic className="w-8 h-8 text-charcoal-600 mx-auto mb-3" />
          <div className="text-sm font-semibold text-ivory-200">No feedback yet</div>
          <div className="text-xs text-charcoal-500 mt-1">Finish a Bench Simulator round and your AI coaching report will appear here.</div>
          <button onClick={() => setActiveModule('bench-simulator')} className="btn-primary mt-4 text-xs">Start a simulation</button>
        </div>
      </div>
    )
  }

  const selected = sessions.find(s => s.id === selectedId) || sessions[0]
  const oldest = sessions[sessions.length - 1]
  const trend = selected.overallScore >= oldest.overallScore ? 'up' : 'down'
  const scoreColor = (v: number) => v >= 70 ? 'bg-legal-green' : v >= 55 ? 'bg-gold-400' : 'bg-legal-red'

  return (
    <div className="max-w-5xl space-y-5">
      <div><h1 className="text-xl font-bold text-ivory-100">Session Feedback &amp; Analytics</h1>
        <p className="text-sm text-charcoal-400 mt-0.5">Post-simulation performance analysis and coaching</p></div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {sessions.map(s => (
          <button key={s.id} onClick={() => setSelectedId(s.id)}
            className={`flex-shrink-0 text-left p-3 rounded-lg border transition-all min-w-[200px] ${selected.id === s.id ? 'border-gold-500/50 bg-gold-500/10' : 'border-[#2a2e40] bg-[#13151c]'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-charcoal-500">{formatDate(s.date)}</span>
              <div className={`text-sm font-bold ${s.overallScore >= 70 ? 'text-legal-green' : s.overallScore >= 55 ? 'text-gold-400' : 'text-legal-red'}`}>{s.overallScore}/100</div>
            </div>
            <div className="text-xs font-medium text-ivory-200 truncate">{s.issue}</div>
            <div className="text-2xs text-charcoal-500 mt-1 truncate">{s.benchConfig}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-8 space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">Score Breakdown</h3>
              <div className="flex items-center gap-2">
                {trend === 'up' ? <TrendingUp className="w-4 h-4 text-legal-green" /> : <TrendingDown className="w-4 h-4 text-legal-red" />}
                <div className={`text-2xl font-bold ${selected.overallScore >= 70 ? 'text-legal-green' : 'text-gold-400'}`}>{selected.overallScore}/100</div>
              </div>
            </div>
            {selected.scores ? (
              <div className="space-y-3">
                {SCORE_ITEMS.map(item => {
                  const val = selected.scores![item.key]
                  return (
                    <div key={item.key} className="flex items-center gap-3">
                      <span className="text-xs text-charcoal-400 w-32 flex-shrink-0">{item.label}</span>
                      <div className="flex-1 h-2 bg-[#1e2130] rounded-full overflow-hidden"><div className={`h-full rounded-full ${scoreColor(val)}`} style={{ width: `${val}%` }} /></div>
                      <span className="text-xs font-bold text-ivory-200 w-8 text-right">{val}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-charcoal-500">Detailed AI scoring was unavailable for this session (the AI service did not respond). The overall score is the average of per-answer scores.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <div className="flex items-center gap-2 mb-3"><CheckCircle className="w-4 h-4 text-legal-green" /><h3 className="text-sm font-semibold text-ivory-100">What Went Well</h3></div>
              <div className="space-y-2">
                {selected.strengths.length === 0 && <p className="text-xs text-charcoal-500">No data.</p>}
                {selected.strengths.map((s, i) => <div key={i} className="flex items-start gap-2 text-xs text-ivory-300"><CheckCircle className="w-3.5 h-3.5 text-legal-green mt-0.5 flex-shrink-0" />{s}</div>)}
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-2 mb-3"><AlertTriangle className="w-4 h-4 text-legal-red" /><h3 className="text-sm font-semibold text-ivory-100">What to Fix</h3></div>
              <div className="space-y-2">
                {selected.weaknesses.length === 0 && <p className="text-xs text-charcoal-500">No data.</p>}
                {selected.weaknesses.map((w, i) => <div key={i} className="flex items-start gap-2 text-xs text-ivory-300"><AlertTriangle className="w-3.5 h-3.5 text-legal-red mt-0.5 flex-shrink-0" />{w}</div>)}
              </div>
            </div>
          </div>

          {selected.researchNeeded.length > 0 && (
            <div className="card">
              <h3 className="section-title text-sm mb-3">Research Required Before Next Session</h3>
              <div className="space-y-2">
                {selected.researchNeeded.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-md bg-[#1a1c22] border border-[#2a2e40]">
                    <span className="w-5 h-5 rounded-full bg-navy-800 border border-navy-600 flex items-center justify-center text-2xs text-navy-200 flex-shrink-0">{i + 1}</span>
                    <span className="text-sm text-ivory-300">{r}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="col-span-4 space-y-4">
          <div className="card">
            <div className="text-xs text-charcoal-500 uppercase tracking-wider mb-3">Session Details</div>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Date', value: formatDate(selected.date) },
                { label: 'Issue', value: selected.issue },
                { label: 'Side', value: selected.side.charAt(0).toUpperCase() + selected.side.slice(1) },
                { label: 'Duration', value: formatDuration(selected.durationSeconds) },
                { label: 'Answers', value: `${selected.questions}` },
                { label: 'Bench', value: selected.benchConfig },
              ].map(item => (
                <div key={item.label} className="flex justify-between gap-3">
                  <span className="text-charcoal-500 text-xs">{item.label}</span>
                  <span className="text-ivory-300 text-xs text-right">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {selected.nextFocus && (
            <div className="card border-gold-600/20 bg-gradient-to-br from-[#13151c] to-[#1a1508]">
              <div className="flex items-center gap-2 mb-2"><Mic className="w-4 h-4 text-gold-400" /><span className="text-xs font-semibold text-gold-300">Next Session Focus</span></div>
              <p className="text-sm text-ivory-300">{selected.nextFocus}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
