'use client'
import { useState } from 'react'
import { useMootStore } from '@/store/mootStore'
import { Calendar, Loader2, Clock, Zap, AlertTriangle, CheckCircle } from 'lucide-react'
import { generatePreparationSchedule } from '@/lib/gemini'
import { usePersistentState } from '@/lib/usePersistentState'

interface ScheduleDay {
  day: string
  tasks: Array<{ time: string; dur: number; type: string; title: string }>
}

interface ScheduleWeek {
  week: number
  theme: string
  days: ScheduleDay[]
}

const DEFAULT_SCHEDULE: ScheduleWeek[] = [
  { week: 1, theme: 'Foundation & Research', days: [
    { day: 'Mon', tasks: [{ time: '09:00', dur: 60, type: 'research', title: 'Read proposition thoroughly — annotate all facts' }, { time: '10:00', dur: 90, type: 'research', title: 'Research Issue I: Article 32 & alternative remedy cases' }, { time: '14:00', dur: 60, type: 'memorial', title: 'Draft Statement of Facts' }] },
    { day: 'Tue', tasks: [{ time: '09:00', dur: 90, type: 'research', title: 'Research Issue II: Article 21 and natural justice' }, { time: '11:00', dur: 45, type: 'oral', title: '5-min Bench Drill — Maintainability' }, { time: '14:00', dur: 60, type: 'memorial', title: 'Draft Statement of Jurisdiction' }] },
    { day: 'Wed', tasks: [{ time: '09:00', dur: 120, type: 'research', title: 'Research Issue III: Basic structure and Art. 19(6)' }, { time: '14:00', dur: 60, type: 'memorial', title: 'Draft Issues Raised and Summary' }] },
    { day: 'Thu', tasks: [{ time: '09:00', dur: 90, type: 'memorial', title: 'Begin Arguments Advanced — Issue I' }, { time: '14:00', dur: 45, type: 'oral', title: 'BenchSimulator — Issue I (Difficulty 2)' }] },
    { day: 'Fri', tasks: [{ time: '09:00', dur: 90, type: 'memorial', title: 'Continue Arguments — Issue II' }, { time: '14:00', dur: 60, type: 'citation', title: 'Citation audit — all Issue I authorities' }] },
  ]},
  { week: 2, theme: 'Memorial & Authorities', days: [
    { day: 'Mon', tasks: [{ time: '09:00', dur: 120, type: 'memorial', title: 'Arguments Advanced — Issue III' }, { time: '14:00', dur: 60, type: 'research', title: 'Find missing authorities for Issue II' }] },
    { day: 'Tue', tasks: [{ time: '09:00', dur: 90, type: 'memorial', title: 'Refine all arguments — bench attack review' }, { time: '14:00', dur: 60, type: 'oral', title: 'BenchSimulator — Issue II (Difficulty 3)' }] },
    { day: 'Wed', tasks: [{ time: '09:00', dur: 90, type: 'oral', title: 'Face Devil Advocate Bench' }, { time: '14:00', dur: 60, type: 'citation', title: 'Verify citations in SCC' }] },
  ]},
]

export default function MootPlanner() {
  const { activeCase, readinessBreakdown } = useMootStore()
  const [schedule, setSchedule] = usePersistentState<ScheduleWeek[]>('moot-prep-schedule', DEFAULT_SCHEDULE)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    setSuccess(false)
    try {
      const resp = await generatePreparationSchedule({
        daysRemaining: activeCase?.daysRemaining || 47,
        memorialDeadline: activeCase?.memorialDeadline || '2025-02-01',
        oralDate: activeCase?.oralRoundDate || '2025-03-15',
        currentScores: {
          memorial: readinessBreakdown.memorial,
          research: readinessBreakdown.legalResearch,
          oral: readinessBreakdown.oralAdvocacy
        },
        issues: activeCase?.issues.map(i => i.title) || []
      })

      if (resp && resp.weekly_schedule && resp.weekly_schedule.length > 0) {
        const mapped: ScheduleWeek[] = resp.weekly_schedule.map((w: any) => ({
          week: w.week,
          theme: w.theme || 'Intensive Preparation',
          days: (w.days || []).map((d: any, idx: number) => {
            const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            return {
              day: dayNames[idx % 7] || `Day ${d.day || idx + 1}`,
              tasks: (d.tasks || []).map((t: any) => ({
                time: t.time || '10:00',
                dur: t.duration_min || 60,
                type: t.type || 'research',
                title: t.title || t.description || 'Preparation task'
              }))
            }
          })
        }))
        setSchedule(mapped)
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        throw new Error('Schedule format was incomplete from AI.')
      }
    } catch (e: any) {
      setError(e.message || 'Failed to generate schedule. Please try again.')
    }
    setGenerating(false)
  }

  const typeColors: Record<string, string> = {
    research: 'bg-navy-700/50 border-navy-600/40 text-navy-200',
    memorial: 'bg-gold-500/10 border-gold-500/30 text-gold-200',
    oral: 'bg-legal-green/10 border-legal-green/30 text-green-200',
    citation: 'bg-legal-red/10 border-legal-red/30 text-red-200',
    drill: 'bg-purple-500/10 border-purple-500/30 text-purple-200',
  }

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ivory-100">Moot Date Planner</h1>
          <p className="text-sm text-charcoal-400 mt-0.5">Adaptive preparation schedule based on competition dates and performance</p>
        </div>
        <button onClick={handleGenerate} disabled={generating} className="btn-primary">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {generating ? 'Generating Schedule…' : 'Generate AI Schedule'}
        </button>
      </div>

      {error && (
        <div className="alert-critical">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert-success">
          <CheckCircle className="w-4 h-4" />
          <span>New AI schedule generated and saved for your competition dates!</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Days Remaining', value: activeCase?.daysRemaining || 47, color: 'text-gold-400' },
          { label: 'Memorial Deadline', value: activeCase?.memorialDeadline || '1 Feb 2025', color: 'text-ivory-200' },
          { label: 'Oral Rounds', value: activeCase?.oralRoundDate || '15 Mar 2025', color: 'text-ivory-200' },
          { label: 'Current Phase', value: activeCase?.preparationStage ? activeCase.preparationStage.toUpperCase() : 'RESEARCH', color: 'text-legal-green' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="text-2xs text-charcoal-500 uppercase tracking-wider">{s.label}</div>
            <div className={`text-base font-bold mt-1 ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Weekly schedule */}
      <div className="space-y-5">
        {schedule.map(week => (
          <div key={week.week} className="card">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-4 h-4 text-gold-400" />
              <h3 className="section-title">Week {week.week} — {week.theme}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {week.days.map((day, dIdx) => (
                <div key={dIdx} className="bg-[#1a1c22] border border-[#2a2e40] rounded-lg p-3">
                  <div className="text-xs font-bold text-charcoal-400 uppercase tracking-wider mb-2">{day.day}</div>
                  <div className="space-y-2">
                    {day.tasks.map((task, i) => (
                      <div key={i} className={`p-2 rounded-md border text-xs leading-snug ${typeColors[task.type] || typeColors.research}`}>
                        <div className="flex items-center gap-1 mb-0.5 opacity-60">
                          <Clock className="w-3 h-3" />{task.time} · {task.dur}m
                        </div>
                        {task.title}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
