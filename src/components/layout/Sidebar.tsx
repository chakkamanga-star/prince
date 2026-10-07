'use client'

import { useMootStore } from '@/store/mootStore'
import {
  LayoutDashboard, FileText, Brain, Shield, BookOpen, Scale,
  Search, Edit3, Mic, NotebookPen, CheckSquare, Link2,
  BookMarked, Calendar, BarChart2, Scroll, Library,
  Settings, ChevronRight, Gavel, Zap, X, Bell
} from 'lucide-react'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Moot Command Centre', icon: LayoutDashboard, section: 'OVERVIEW' },
  { id: 'proposition', label: 'Proposition & Brochure', icon: FileText, section: 'CASE FOUNDATION' },
  { id: 'case-intelligence', label: 'Case Intelligence', icon: Brain, section: 'CASE FOUNDATION' },
  { id: 'maintainability', label: 'Maintainability Studio', icon: Shield, section: 'CASE FOUNDATION' },
  { id: 'caselaw', label: 'Case Law Brief Studio', icon: BookOpen, section: 'RESEARCH' },
  { id: 'statute', label: 'Statute Studio', icon: Scale, section: 'RESEARCH' },
  { id: 'legal-research', label: 'Legal Research', icon: Search, section: 'RESEARCH' },
  { id: 'memorial', label: 'Memorial Editor', icon: Edit3, section: 'PREPARATION' },
  { id: 'bench-simulator', label: 'BenchSimulator', icon: Mic, section: 'PREPARATION' },
  { id: 'notebook', label: 'LLM Notebook', icon: NotebookPen, section: 'PREPARATION' },
  { id: 'fact-checker', label: 'Fact Checker', icon: CheckSquare, section: 'QUALITY' },
  { id: 'citation-auditor', label: 'Citation Auditor', icon: Link2, section: 'QUALITY' },
  { id: 'glossary', label: 'Glossary', icon: BookMarked, section: 'QUALITY' },
  { id: 'planner', label: 'Moot Date Planner', icon: Calendar, section: 'PLANNING' },
  { id: 'session-feedback', label: 'Session Feedback', icon: BarChart2, section: 'PLANNING' },
  { id: 'court-record', label: 'Court Record', icon: Scroll, section: 'PLANNING' },
  { id: 'research-library', label: 'Research Library', icon: Library, section: 'LIBRARY' },
  { id: 'settings', label: 'Settings', icon: Settings, section: 'SYSTEM' },
]

const SECTIONS = ['OVERVIEW', 'CASE FOUNDATION', 'RESEARCH', 'PREPARATION', 'QUALITY', 'PLANNING', 'LIBRARY', 'SYSTEM']

export default function Sidebar() {
  const { activeModule, setActiveModule, alerts } = useMootStore()
  const criticalAlerts = alerts.filter(a => a.type === 'critical').length

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gold-500/20 border border-gold-500/30">
          <Gavel className="w-4 h-4 text-gold-400" />
        </div>
        <div>
          <div className="text-sm font-bold text-ivory-100 leading-none">MootCourt AI</div>
          <div className="text-2xs text-charcoal-500 mt-0.5">Legal Preparation System</div>
        </div>
      </div>

      {/* Alert badge */}
      {criticalAlerts > 0 && (
        <div className="mx-3 mt-2 mb-1">
          <div className="flex items-center gap-2 rounded-md bg-legal-red/10 border border-legal-red/25 px-3 py-2">
            <Bell className="w-3.5 h-3.5 text-legal-red flex-shrink-0" />
            <span className="text-xs text-legal-red font-medium">{criticalAlerts} critical alert{criticalAlerts > 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 no-scrollbar">
        {SECTIONS.map(section => {
          const items = NAV_ITEMS.filter(i => i.section === section)
          if (!items.length) return null
          return (
            <div key={section} className="mb-1">
              <div className="sidebar-section-label">{section}</div>
              {items.map(item => {
                const Icon = item.icon
                const isActive = activeModule === item.id
                const hasAlert = alerts.some(a => a.module === item.id && !a.dismissible === false)
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveModule(item.id)}
                    className={`sidebar-nav-item w-full text-left ${isActive ? 'active' : ''}`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.id === 'bench-simulator' && (
                      <span className="badge badge-gold text-2xs py-0 px-1.5">LIVE</span>
                    )}
                    {hasAlert && (
                      <span className="w-1.5 h-1.5 rounded-full bg-legal-red flex-shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* Bottom info */}
      <div className="border-t border-[#1e2130] p-3">
        <button
          onClick={() => setActiveModule('settings')}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#1e2130] cursor-pointer transition-colors text-left"
        >
          <div className="w-7 h-7 rounded-full bg-navy-700 border border-navy-600 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-navy-200">MC</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-ivory-200 truncate">Settings &amp; Profile</div>
            <div className="text-2xs text-charcoal-500">Student Counsel</div>
          </div>
          <ChevronRight className="w-3 h-3 text-charcoal-600 flex-shrink-0" />
        </button>
      </div>
    </aside>
  )
}
