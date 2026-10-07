'use client'

import { useMootStore } from '@/store/mootStore'
import {
  TrendingUp, AlertTriangle, Calendar, Mic, BookOpen,
  Target, Clock, ChevronRight, X, Zap, FileText,
  CheckCircle, ArrowRight, BarChart2, Scale, Shield
} from 'lucide-react'

function RadialScore({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 20) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference
  const color = score >= 75 ? '#1a6b47' : score >= 50 ? '#d4a843' : '#c0392b'

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#1e2130" strokeWidth="8" />
        <circle
          cx={size/2} cy={size/2} r={radius} fill="none"
          stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-ivory-100">{score}</span>
        <span className="text-2xs text-charcoal-500">/ 100</span>
      </div>
    </div>
  )
}

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-charcoal-400 w-32 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-[#1e2130] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-medium text-ivory-200 w-8 text-right">{score}</span>
    </div>
  )
}

export default function Dashboard() {
  const { activeCase, readinessBreakdown, alerts, dismissAlert, setActiveModule } = useMootStore()

  if (!activeCase) return null

  const scoreItems = [
    { label: 'Memorial', score: readinessBreakdown.memorial, color: '#d4a843' },
    { label: 'Legal Research', score: readinessBreakdown.legalResearch, color: '#5c64f4' },
    { label: 'Authorities', score: readinessBreakdown.authorities, color: '#1a6b47' },
    { label: 'Jurisdiction', score: readinessBreakdown.jurisdiction, color: '#5c64f4' },
    { label: 'Maintainability', score: readinessBreakdown.maintainability, color: '#d4a843' },
    { label: 'Facts', score: readinessBreakdown.facts, color: '#1a6b47' },
    { label: 'Oral Advocacy', score: readinessBreakdown.oralAdvocacy, color: '#c0392b' },
    { label: 'Courtroom Lang.', score: readinessBreakdown.courtoomLanguage, color: '#b45309' },
    { label: 'Time Management', score: readinessBreakdown.timeManagement, color: '#5c64f4' },
    { label: 'Citation Integrity', score: readinessBreakdown.citationIntegrity, color: '#c0392b' },
  ]

  const todayItems = [
    { icon: Scale, label: 'Issue Focus', value: 'Issue I — Maintainability under Article 32', action: 'case-intelligence' },
    { icon: BookOpen, label: 'Case to Read', value: 'L. Chandra Kumar v. Union of India (1997) 3 SCC 261', action: 'caselaw' },
    { icon: FileText, label: 'Memorial Section', value: 'Strengthen Statement of Jurisdiction', action: 'memorial' },
    { icon: Mic, label: 'Oral Drill', value: '5-min Maintainability Drill — face skeptical bench', action: 'bench-simulator' },
    { icon: Shield, label: 'Research Task', value: 'Alternative remedy — find current SC authority', action: 'legal-research' },
    { icon: Target, label: 'Bench Question', value: '"Why should this Court entertain when CAT jurisdiction exists?"', action: 'bench-simulator' },
  ]

  const deadlines = [
    { label: 'Draft Memorial v1', date: '18 Oct', daysLeft: 12, status: 'upcoming' },
    { label: 'Internal Review', date: '25 Oct', daysLeft: 19, status: 'upcoming' },
    { label: 'Memorial Submission', date: '1 Feb', daysLeft: 118, status: 'future' },
    { label: 'Oral Prep Begins', date: '15 Feb', daysLeft: 132, status: 'future' },
    { label: 'Full Moot Simulation', date: '5 Mar', daysLeft: 150, status: 'future' },
    { label: 'Final Revision', date: '10 Mar', daysLeft: 155, status: 'future' },
    { label: 'Oral Rounds', date: '15 Mar', daysLeft: 160, status: 'future' },
  ]

  const alertColors = {
    critical: 'border-legal-red/40 bg-legal-red/8',
    high: 'border-orange-500/40 bg-orange-500/8',
    medium: 'border-legal-blue/40 bg-legal-blue/8',
    info: 'border-charcoal-600/40 bg-charcoal-700/20',
  }

  const alertIconColors = {
    critical: 'text-legal-red',
    high: 'text-orange-400',
    medium: 'text-legal-blue',
    info: 'text-charcoal-400',
  }

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ivory-100">Moot Command Centre</h1>
          <p className="text-sm text-charcoal-400 mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveModule('bench-simulator')} className="btn-primary">
            <Mic className="w-4 h-4" />
            Start Oral Simulation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Left column */}
        <div className="col-span-12 lg:col-span-8 space-y-5">
          {/* Active moot card */}
          <div className="card-gold">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="badge badge-gold mb-2">ACTIVE CASE</div>
                <h2 className="text-base font-bold text-ivory-100">{activeCase.name}</h2>
                <p className="text-sm text-charcoal-400 mt-1">{activeCase.competitionName}</p>
              </div>
              <div className="text-right">
                <div className="text-2xs text-charcoal-500 uppercase tracking-wider">Days Remaining</div>
                <div className="text-3xl font-bold text-gold-400 leading-none mt-1">{activeCase.daysRemaining}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Side', value: activeCase.activeSide.charAt(0).toUpperCase() + activeCase.activeSide.slice(1), highlight: true },
                { label: 'Jurisdiction', value: 'Supreme Court of India' },
                { label: 'Memorial Due', value: '1 Feb 2025' },
                { label: 'Oral Rounds', value: '15 Mar 2025' },
              ].map(item => (
                <div key={item.label} className="bg-[#0f1117]/50 rounded-md p-2.5">
                  <div className="text-2xs text-charcoal-500 uppercase tracking-wider">{item.label}</div>
                  <div className={`text-sm font-semibold mt-0.5 ${item.highlight ? 'text-gold-400' : 'text-ivory-200'}`}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Research Alerts */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-gold-400" />
                <h3 className="section-title text-base">Research Alerts</h3>
              </div>
              <span className="badge badge-gold">{alerts.length}</span>
            </div>
            <div className="space-y-2">
              {alerts.map(alert => (
                <div key={alert.id} className={`flex items-start gap-3 rounded-md p-3 border ${alertColors[alert.type]}`}>
                  <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${alertIconColors[alert.type]}`} />
                  <span className="text-sm text-ivory-200 flex-1">{alert.message}</span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {alert.module && (
                      <button
                        onClick={() => setActiveModule(alert.module!)}
                        className="text-2xs text-charcoal-400 hover:text-gold-400 transition-colors"
                      >
                        View →
                      </button>
                    )}
                    <button onClick={() => dismissAlert(alert.id)} className="text-charcoal-600 hover:text-charcoal-300 ml-1">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Preparation */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-gold-400" />
              <h3 className="section-title text-base">Today's Preparation</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {todayItems.map(item => {
                const Icon = item.icon
                return (
                  <button
                    key={item.label}
                    onClick={() => setActiveModule(item.action)}
                    className="card-hover text-left flex items-start gap-3"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gold-500/10 border border-gold-500/20 flex-shrink-0">
                      <Icon className="w-4 h-4 text-gold-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-2xs text-charcoal-500 uppercase tracking-wider">{item.label}</div>
                      <div className="text-sm text-ivory-200 mt-0.5 line-clamp-2">{item.value}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Issues quick view */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title text-base">Issues — {activeCase.name}</h3>
              <button onClick={() => setActiveModule('case-intelligence')} className="text-xs text-gold-400 hover:text-gold-300">
                Full Analysis →
              </button>
            </div>
            <div className="space-y-3">
              {activeCase.issues.map(issue => (
                <div key={issue.id} className="flex items-start gap-3 p-3 rounded-md bg-[#1a1c22] border border-[#2a2e40] hover:border-gold-600/30 cursor-pointer transition-colors"
                  onClick={() => setActiveModule('case-intelligence')}>
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-navy-800 border border-navy-600 flex-shrink-0 mt-0.5">
                    <span className="text-2xs font-bold text-navy-200">I{issue.number}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-ivory-100">{issue.title}</div>
                    <div className="text-xs text-charcoal-400 mt-0.5 line-clamp-1">{issue.statement}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-charcoal-600 flex-shrink-0 mt-1" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="col-span-12 lg:col-span-4 space-y-5">
          {/* Readiness Score */}
          <div className="card text-center">
            <div className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider mb-3">Overall Readiness</div>
            <div className="flex justify-center mb-4">
              <RadialScore score={activeCase.readinessScore} size={120} />
            </div>
            <div className="space-y-2">
              {scoreItems.map(item => (
                <ScoreBar key={item.label} {...item} />
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-[#1e2130]">
              <div className="flex items-center justify-center gap-2 text-xs text-charcoal-400">
                <TrendingUp className="w-3.5 h-3.5 text-legal-green" />
                <span>+6 pts this week</span>
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-gold-400" />
              <h3 className="section-title text-base">Upcoming Deadlines</h3>
            </div>
            <div className="space-y-0">
              {deadlines.map((d, i) => (
                <div key={d.label} className="flex items-center gap-3 py-2.5 border-b border-[#1e2130] last:border-0">
                  <div className="flex flex-col items-center w-10 flex-shrink-0">
                    <div className={`w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-gold-400' : 'bg-charcoal-600'} z-10`} />
                    {i < deadlines.length - 1 && <div className="w-px h-4 bg-[#1e2130] mt-0.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-ivory-200">{d.label}</div>
                    <div className="text-2xs text-charcoal-500">{d.date}</div>
                  </div>
                  <div className={`text-2xs font-semibold flex-shrink-0 ${d.daysLeft < 14 ? 'text-legal-red' : d.daysLeft < 30 ? 'text-gold-400' : 'text-charcoal-500'}`}>
                    {d.daysLeft}d
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="card">
            <h3 className="section-title text-base mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: 'Start Bench Simulation', icon: Mic, module: 'bench-simulator', highlight: true },
                { label: 'Upload Case Authority', icon: BookOpen, module: 'caselaw' },
                { label: 'Check Memorial Compliance', icon: CheckCircle, module: 'memorial' },
                { label: 'Run Citation Audit', icon: Scale, module: 'citation-auditor' },
                { label: 'View Preparation Plan', icon: Calendar, module: 'planner' },
              ].map(action => {
                const Icon = action.icon
                return (
                  <button
                    key={action.label}
                    onClick={() => setActiveModule(action.module)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-150 ${
                      action.highlight
                        ? 'bg-gold-500/15 border border-gold-500/30 text-gold-300 hover:bg-gold-500/25'
                        : 'bg-[#1a1c22] border border-[#2a2e40] text-ivory-300 hover:border-gold-600/30'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-left">{action.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-charcoal-600" />
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
