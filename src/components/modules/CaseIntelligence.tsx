'use client'

import { useState } from 'react'
import { useMootStore } from '@/store/mootStore'
import { Brain, GitBranch, Scale, BookOpen, AlertTriangle, ChevronRight, Clock } from 'lucide-react'

export default function CaseIntelligence() {
  const { activeCase } = useMootStore()
  const [activeTab, setActiveTab] = useState<'facts' | 'issues' | 'laws' | 'arguments'>('issues')

  if (!activeCase) return null

  const tabs = [
    { id: 'facts', label: 'Facts', icon: Clock },
    { id: 'issues', label: 'Issue Tree', icon: GitBranch },
    { id: 'laws', label: 'Laws & Articles', icon: Scale },
    { id: 'arguments', label: 'Arguments', icon: BookOpen },
  ]

  const factStatusColors: Record<string, string> = {
    admitted: 'badge-green', disputed: 'badge-red', established: 'badge-green',
    alleged: 'badge-amber', inferred: 'badge-blue', uncertain: 'badge-amber', irrelevant: 'badge-gray'
  }

  // Collect all unique articles and statutes from the active case's issues
  const allArticles = Array.from(new Set(activeCase.issues.flatMap(i => i.constitutionalArticles)))
  const allStatutes = Array.from(new Set(activeCase.issues.flatMap(i => i.relevantStatutes)))

  return (
    <div className="max-w-5xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-ivory-100">Case Intelligence</h1>
        <p className="text-sm text-charcoal-400 mt-0.5">Structured legal map of {activeCase.name}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#13151c] border border-[#1e2130] rounded-lg p-1">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium flex-1 justify-center transition-all ${
                activeTab === tab.id ? 'bg-[#1e2130] text-ivory-100' : 'text-charcoal-400 hover:text-ivory-200'
              }`}>
              <Icon className="w-3.5 h-3.5" />{tab.label}
            </button>
          )
        })}
      </div>

      {/* Facts */}
      {activeTab === 'facts' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="section-title">Case Fact Ledger</h3>
            <div className="flex gap-2">
              {['admitted','disputed','alleged','inferred'].map(s => (
                <span key={s} className={`badge ${factStatusColors[s]} capitalize`}>{s}</span>
              ))}
            </div>
          </div>
          {activeCase.facts.length === 0 && (
            <div className="card text-center py-8 text-xs text-charcoal-500">
              No facts loaded yet. Deconstruct your proposition to populate this ledger.
            </div>
          )}
          {activeCase.facts.map(fact => (
            <div key={fact.id} className="card hover:border-gold-600/30 transition-colors">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-16">
                  <div className="text-2xs font-mono text-charcoal-500">{fact.factId}</div>
                  <span className={`badge ${factStatusColors[fact.status]} mt-1 capitalize text-2xs`}>{fact.status}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-ivory-200">{fact.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-charcoal-500">Source: <span className="text-charcoal-400">{fact.sourceParagraph}</span></span>
                    <span className="text-xs text-charcoal-500">Relevance: <span className="text-charcoal-400">{fact.legalRelevance}</span></span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Issues */}
      {activeTab === 'issues' && (
        <div className="space-y-4">
          {activeCase.issues.map(issue => (
            <div key={issue.id} className="card border-navy-800/60">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-navy-800 border border-navy-600 flex-shrink-0">
                  <span className="text-sm font-bold text-navy-200">I{issue.number}</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-ivory-100">{issue.title}</h3>
                  <p className="text-sm text-charcoal-400 mt-1">{issue.statement}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 rounded-md bg-legal-blue/5 border border-legal-blue/20">
                  <div className="text-2xs font-semibold text-legal-blue uppercase tracking-wider mb-2">Petitioner</div>
                  <p className="text-xs text-ivory-300 leading-relaxed">{issue.petitionerPosition}</p>
                </div>
                <div className="p-3 rounded-md bg-legal-amber/5 border border-legal-amber/20">
                  <div className="text-2xs font-semibold text-legal-amber uppercase tracking-wider mb-2">Respondent</div>
                  <p className="text-xs text-ivory-300 leading-relaxed">{issue.respondentPosition}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-2xs text-charcoal-500 uppercase tracking-wider mb-1.5">Sub-Issues</div>
                  <div className="flex flex-wrap gap-1.5">
                    {issue.subIssues.map(s => (
                      <div key={s} className="flex items-center gap-1.5 text-xs text-charcoal-300 bg-[#1a1c22] border border-[#2a2e40] rounded px-2 py-1">
                        <ChevronRight className="w-3 h-3 text-gold-500" />{s}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-4">
                  <div>
                    <div className="text-2xs text-charcoal-500 uppercase tracking-wider mb-1.5">Statutes</div>
                    <div className="flex flex-wrap gap-1">
                      {issue.relevantStatutes.map(s => <span key={s} className="badge badge-blue text-2xs">{s}</span>)}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xs text-charcoal-500 uppercase tracking-wider mb-1.5">Articles</div>
                    <div className="flex flex-wrap gap-1">
                      {issue.constitutionalArticles.map(s => <span key={s} className="badge badge-gold text-2xs">{s}</span>)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Laws — reads from activeCase.issues */}
      {activeTab === 'laws' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="section-title text-sm mb-3">Constitutional Provisions</h3>
            <div className="space-y-2">
              {allArticles.map(art => (
                <div key={art} className="flex items-center gap-3 p-3 rounded-md bg-[#1a1c22] border border-[#2a2e40] hover:border-gold-600/30 cursor-pointer transition-colors">
                  <Scale className="w-4 h-4 text-gold-400 flex-shrink-0" />
                  <span className="text-sm text-ivory-200">{art}</span>
                </div>
              ))}
              {allArticles.length === 0 && (
                <p className="text-xs text-charcoal-500">No constitutional provisions extracted yet. Deconstruct the proposition first.</p>
              )}
            </div>
          </div>
          <div className="card">
            <h3 className="section-title text-sm mb-3">Statutes &amp; Rules</h3>
            <div className="space-y-2">
              {allStatutes.map(stat => (
                <div key={stat} className="flex items-center gap-3 p-3 rounded-md bg-[#1a1c22] border border-[#2a2e40] hover:border-gold-600/30 cursor-pointer transition-colors">
                  <BookOpen className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span className="text-sm text-ivory-200">{stat}</span>
                </div>
              ))}
              {allStatutes.length === 0 && (
                <p className="text-xs text-charcoal-500">No statutes extracted yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Arguments — reads real positions from store */}
      {activeTab === 'arguments' && (
        <div className="grid grid-cols-2 gap-5">
          {(['petitioner', 'respondent'] as const).map(side => (
            <div key={side} className="space-y-3">
              <div className={`text-sm font-bold uppercase tracking-wider ${side === 'petitioner' ? 'text-legal-blue' : 'text-legal-amber'}`}>
                {side} Arguments
              </div>
              {activeCase.issues.map(issue => (
                <div key={issue.id} className="card">
                  <div className="text-xs font-semibold text-charcoal-400 mb-2">Issue {issue.number} — {issue.title}</div>
                  <div className="space-y-2 text-xs text-ivory-300">
                    <div className="flex items-start gap-2">
                      <div className="w-20 flex-shrink-0 text-charcoal-500">Position</div>
                      <div className="flex-1 leading-relaxed">
                        {side === 'petitioner' ? issue.petitionerPosition : issue.respondentPosition}
                      </div>
                    </div>
                    {(side === 'petitioner' ? issue.relevantStatutes : issue.constitutionalArticles).length > 0 && (
                      <div className="flex items-start gap-2">
                        <div className="w-20 flex-shrink-0 text-charcoal-500">Authority</div>
                        <div className="flex flex-wrap gap-1">
                          {(side === 'petitioner' ? issue.relevantStatutes : issue.constitutionalArticles).slice(0, 3).map(s => (
                            <span key={s} className={`badge text-2xs ${side === 'petitioner' ? 'badge-blue' : 'badge-gold'}`}>{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
