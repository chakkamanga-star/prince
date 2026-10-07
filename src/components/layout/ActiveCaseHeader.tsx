'use client'

import { useMootStore } from '@/store/mootStore'
import { Search, Calendar, Target, Gavel, ChevronDown, AlertTriangle, Clock } from 'lucide-react'
import { formatDistanceToNow, differenceInDays } from 'date-fns'

export default function ActiveCaseHeader() {
  const { activeCase, globalSearchQuery, setGlobalSearchQuery, setActiveModule } = useMootStore()

  if (!activeCase) return null

  const daysToMemorial = activeCase.memorialDeadline
    ? differenceInDays(new Date(activeCase.memorialDeadline), new Date())
    : null

  const daysToOral = activeCase.oralRoundDate
    ? differenceInDays(new Date(activeCase.oralRoundDate), new Date())
    : null

  const scoreColor =
    activeCase.readinessScore >= 75 ? 'text-legal-green' :
    activeCase.readinessScore >= 50 ? 'text-gold-400' :
    'text-legal-red'

  return (
    <header className="active-case-bar">
      {/* Active case info */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center justify-center w-6 h-6 rounded bg-gold-500/20">
            <Gavel className="w-3.5 h-3.5 text-gold-400" />
          </div>
          <div>
            <div className="text-2xs text-charcoal-500 uppercase tracking-wider font-semibold">Active Case</div>
            <div className="text-sm font-semibold text-ivory-100 leading-none mt-0.5 truncate max-w-[240px]">
              {activeCase.name}
            </div>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-1">
          <div className="h-3 w-px bg-[#2a2e40]" />
          <span className="text-xs text-charcoal-400 px-2 truncate max-w-[160px]">
            {activeCase.competitionName}
          </span>
        </div>

        {/* Side badge */}
        <div className={`hidden md:flex badge ${activeCase.activeSide === 'petitioner' ? 'badge-blue' : 'badge-amber'}`}>
          {activeCase.activeSide.charAt(0).toUpperCase() + activeCase.activeSide.slice(1)}
        </div>

        {/* Stage */}
        <div className="hidden xl:flex items-center gap-1.5">
          <div className="h-3 w-px bg-[#2a2e40]" />
          <Target className="w-3 h-3 text-charcoal-500" />
          <span className="text-xs text-charcoal-400 capitalize">{activeCase.preparationStage}</span>
        </div>
      </div>

      {/* Center search */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal-500" />
          <input
            type="text"
            placeholder="Ask your case anything… (Press Enter to Research)"
            value={globalSearchQuery}
            onChange={e => setGlobalSearchQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && globalSearchQuery.trim()) {
                setActiveModule('legal-research')
              }
            }}
            className="w-full bg-[#1a1c22] border border-[#2a2e40] rounded-md pl-9 pr-3 py-1.5 text-xs text-ivory-200 placeholder-charcoal-500 focus:outline-none focus:border-gold-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Right stats */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {/* Memorial deadline */}
        {daysToMemorial !== null && (
          <div className="hidden md:flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-charcoal-500" />
            <div>
              <div className="text-2xs text-charcoal-500">Memorial</div>
              <div className={`text-xs font-semibold ${daysToMemorial < 7 ? 'text-legal-red' : daysToMemorial < 14 ? 'text-gold-400' : 'text-ivory-200'}`}>
                {daysToMemorial < 0 ? 'Overdue' : `${daysToMemorial}d`}
              </div>
            </div>
          </div>
        )}

        {/* Oral rounds */}
        {daysToOral !== null && (
          <div className="hidden lg:flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-charcoal-500" />
            <div>
              <div className="text-2xs text-charcoal-500">Oral</div>
              <div className="text-xs font-semibold text-ivory-200">{daysToOral}d</div>
            </div>
          </div>
        )}

        {/* Readiness score */}
        <div className="flex items-center gap-2 bg-[#1a1c22] border border-[#2a2e40] rounded-md px-3 py-1.5">
          <div>
            <div className="text-2xs text-charcoal-500">Readiness</div>
            <div className={`text-sm font-bold leading-none ${scoreColor}`}>
              {activeCase.readinessScore}<span className="text-charcoal-500 text-2xs">/100</span>
            </div>
          </div>
        </div>

        {/* Generate schedule button */}
        <button
          onClick={() => setActiveModule('planner')}
          className="btn-primary text-xs px-3 py-1.5 hidden lg:flex"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Plan Today</span>
        </button>
      </div>
    </header>
  )
}
