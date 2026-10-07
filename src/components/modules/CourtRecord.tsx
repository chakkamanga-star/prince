'use client'
import { useState } from 'react'
import { useMootStore } from '@/store/mootStore'
import { Scroll, Download, Printer, CheckCircle } from 'lucide-react'

export default function CourtRecord() {
  const { activeCase } = useMootStore()
  const [generated, setGenerated] = useState(true)

  const sessions = [
    { date: '5 Oct 2024', issue: 'Issue I — Maintainability', side: 'Petitioner', duration: '14:32', score: 64, bench: 'Balanced (3J)', questions: 8 },
    { date: '1 Oct 2024', issue: 'Issue I — Maintainability', side: 'Petitioner', duration: '09:15', score: 52, bench: 'Skeptical (1J)', questions: 6 },
  ]

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-ivory-100">Court Record</h1>
          <p className="text-sm text-charcoal-400 mt-0.5">Complete simulation transcript and performance history</p></div>
        <div className="flex gap-2">
          <button className="btn-secondary"><Download className="w-4 h-4" /> Export PDF</button>
          <button className="btn-secondary"><Printer className="w-4 h-4" /> Print</button>
        </div>
      </div>

      {/* Court record header */}
      <div className="card border-gold-600/30 bg-gradient-to-br from-[#13151c] to-[#1a1508]">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Scroll className="w-5 h-5 text-gold-400" />
            <span className="text-base font-bold text-gold-300">MOOT COURT SIMULATION RECORD</span>
          </div>
          <div className="text-lg font-bold text-ivory-100 uppercase tracking-wide">{activeCase?.name}</div>
          <div className="text-sm text-charcoal-400 mt-1">{activeCase?.competitionName}</div>
          <div className="divider-gold mt-4 mb-4" />
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div><div className="text-charcoal-500 text-xs uppercase">Side Argued</div><div className="font-semibold text-ivory-200 mt-0.5 capitalize">{activeCase?.activeSide}</div></div>
            <div><div className="text-charcoal-500 text-xs uppercase">Total Sessions</div><div className="font-semibold text-ivory-200 mt-0.5">{sessions.length}</div></div>
            <div><div className="text-charcoal-500 text-xs uppercase">Avg. Score</div><div className="font-semibold text-gold-400 mt-0.5">{Math.round(sessions.reduce((acc,s) => acc + s.score, 0) / sessions.length)}/100</div></div>
          </div>
        </div>
      </div>

      {/* Session records */}
      <div className="space-y-3">
        {sessions.map((s, i) => (
          <div key={i} className="card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-semibold text-ivory-100">{s.date}</div>
                <div className="text-xs text-charcoal-400 mt-0.5">{s.issue} · {s.side}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-2xs text-charcoal-500">Score</div>
                  <div className={`text-lg font-bold ${s.score >= 70 ? 'text-legal-green' : s.score >= 55 ? 'text-gold-400' : 'text-legal-red'}`}>{s.score}/100</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              {[['Duration', s.duration], ['Bench', s.bench], ['Q&A Pairs', s.questions]].map(([label, val]) => (
                <div key={label}><div className="text-charcoal-500">{label}</div><div className="text-ivory-300 mt-0.5">{val}</div></div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Progress chart summary */}
      <div className="card">
        <h3 className="section-title text-sm mb-4">Progress Over Sessions</h3>
        <div className="flex items-end gap-2 h-24">
          {sessions.reverse().map((s, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="text-2xs text-charcoal-500">{s.score}</div>
              <div className={`w-full rounded-t-sm ${s.score >= 70 ? 'bg-legal-green' : s.score >= 55 ? 'bg-gold-400' : 'bg-legal-red'}`}
                style={{ height: `${(s.score / 100) * 80}px` }} />
              <div className="text-2xs text-charcoal-500 text-center">{s.date.split(' ')[0]}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-charcoal-400">
          <CheckCircle className="w-3.5 h-3.5 text-legal-green" />
          <span>+12 points improvement over 2 sessions</span>
        </div>
      </div>
    </div>
  )
}
