'use client'
import { useMootStore } from '@/store/mootStore'
import { Scroll, Download, Printer, CheckCircle, Trash2, Mic } from 'lucide-react'
import { usePersistentState } from '@/lib/usePersistentState'
import { formatDate, formatDuration, type SessionRecord } from '@/lib/sessions'

export default function CourtRecord() {
  const { activeCase, setActiveModule } = useMootStore()
  const [sessions, setSessions] = usePersistentState<SessionRecord[]>('moot-sessions', [])

  const avg = sessions.length ? Math.round(sessions.reduce((a, s) => a + s.overallScore, 0) / sessions.length) : 0
  const chronological = [...sessions].reverse()
  const delta = sessions.length > 1 ? sessions[0].overallScore - sessions[sessions.length - 1].overallScore : null

  const exportRecord = () => {
    const lines: string[] = [
      'MOOT COURT SIMULATION RECORD',
      activeCase?.name || '',
      activeCase?.competitionName || '',
      '',
      `Sessions: ${sessions.length}   Average score: ${avg}/100`,
      '',
    ]
    for (const s of sessions) {
      lines.push(`=== ${formatDate(s.date)} — ${s.issue} (${s.side}) — ${s.overallScore}/100 — ${formatDuration(s.durationSeconds)} ===`)
      s.transcript.forEach(t => lines.push(`${t.speaker === 'bench' ? 'BENCH' : 'COUNSEL'}${t.score != null ? ` [${t.score}]` : ''}: ${t.text}`))
      lines.push('')
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'court-record.txt'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-ivory-100">Court Record</h1>
          <p className="text-sm text-charcoal-400 mt-0.5">Complete simulation transcript and performance history</p></div>
        <div className="flex gap-2">
          <button onClick={exportRecord} disabled={!sessions.length} className="btn-secondary"><Download className="w-4 h-4" /> Export</button>
          <button onClick={() => window.print()} disabled={!sessions.length} className="btn-secondary"><Printer className="w-4 h-4" /> Print</button>
        </div>
      </div>

      <div className="card border-gold-600/30 bg-gradient-to-br from-[#13151c] to-[#1a1508]">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Scroll className="w-5 h-5 text-gold-400" />
            <span className="text-base font-bold text-gold-300">MOOT COURT SIMULATION RECORD</span>
          </div>
          <div className="text-lg font-bold text-ivory-100 uppercase tracking-wide">{activeCase?.name || 'No active case'}</div>
          <div className="text-sm text-charcoal-400 mt-1">{activeCase?.competitionName}</div>
          <div className="divider-gold mt-4 mb-4" />
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div><div className="text-charcoal-500 text-xs uppercase">Side Argued</div><div className="font-semibold text-ivory-200 mt-0.5 capitalize">{activeCase?.activeSide || '—'}</div></div>
            <div><div className="text-charcoal-500 text-xs uppercase">Total Sessions</div><div className="font-semibold text-ivory-200 mt-0.5">{sessions.length}</div></div>
            <div><div className="text-charcoal-500 text-xs uppercase">Avg. Score</div><div className="font-semibold text-gold-400 mt-0.5">{sessions.length ? `${avg}/100` : '—'}</div></div>
          </div>
        </div>
      </div>

      {sessions.length === 0 && (
        <div className="card text-center py-10">
          <Mic className="w-8 h-8 text-charcoal-600 mx-auto mb-3" />
          <div className="text-sm font-semibold text-ivory-200">No sessions recorded yet</div>
          <div className="text-xs text-charcoal-500 mt-1">Complete a round in the Bench Simulator and it will appear here with its full transcript.</div>
          <button onClick={() => setActiveModule('bench-simulator')} className="btn-primary mt-4 text-xs">Start a simulation</button>
        </div>
      )}

      <div className="space-y-3">
        {sessions.map(s => (
          <details key={s.id} className="card">
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <div>
                <div className="text-sm font-semibold text-ivory-100">{formatDate(s.date)}</div>
                <div className="text-xs text-charcoal-400 mt-0.5 capitalize">{s.issue} · {s.side}</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="grid grid-cols-3 gap-4 text-xs text-right">
                  <div><div className="text-charcoal-500">Duration</div><div className="text-ivory-300">{formatDuration(s.durationSeconds)}</div></div>
                  <div><div className="text-charcoal-500">Answers</div><div className="text-ivory-300">{s.questions}</div></div>
                  <div><div className="text-charcoal-500">Score</div>
                    <div className={`font-bold ${s.overallScore >= 70 ? 'text-legal-green' : s.overallScore >= 55 ? 'text-gold-400' : 'text-legal-red'}`}>{s.overallScore}/100</div></div>
                </div>
                <button onClick={e => { e.preventDefault(); setSessions(prev => prev.filter(x => x.id !== s.id)) }} aria-label="Delete session" className="btn-ghost p-1"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </summary>
            <div className="mt-4 pt-4 border-t border-[#2a2e40] space-y-2 text-sm">
              <div className="text-2xs text-charcoal-500">{s.benchConfig}</div>
              {s.transcript.map((t, i) => (
                <div key={i} className={`p-2.5 rounded-md ${t.speaker === 'bench' ? 'bg-[#1a1c22]' : 'bg-[#13151c] border border-[#2a2e40]'}`}>
                  <div className="text-2xs uppercase text-charcoal-500 mb-0.5">{t.speaker === 'bench' ? 'Bench' : 'Counsel'}{t.score != null ? ` · ${t.score}/100` : ''}</div>
                  <div className="text-ivory-300 text-xs whitespace-pre-wrap">{t.text}</div>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>

      {sessions.length > 1 && (
        <div className="card">
          <h3 className="section-title text-sm mb-4">Progress Over Sessions</h3>
          <div className="flex items-end gap-2 h-24">
            {chronological.map(s => (
              <div key={s.id} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-2xs text-charcoal-500">{s.overallScore}</div>
                <div className={`w-full rounded-t-sm ${s.overallScore >= 70 ? 'bg-legal-green' : s.overallScore >= 55 ? 'bg-gold-400' : 'bg-legal-red'}`}
                  style={{ height: `${(s.overallScore / 100) * 80}px` }} />
                <div className="text-2xs text-charcoal-500 text-center">{formatDate(s.date).split(' ').slice(0, 2).join(' ')}</div>
              </div>
            ))}
          </div>
          {delta !== null && (
            <div className="flex items-center gap-2 mt-3 text-xs text-charcoal-400">
              <CheckCircle className="w-3.5 h-3.5 text-legal-green" />
              <span>{delta >= 0 ? '+' : ''}{delta} points since your first session</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
