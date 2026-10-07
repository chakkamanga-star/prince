'use client'

import { useState } from 'react'
import { useMootStore } from '@/store/mootStore'
import { Shield, AlertTriangle, CheckCircle, XCircle, Loader2, Gavel } from 'lucide-react'

const MAINTAINABILITY_FACTORS = [
  'Jurisdiction', 'Locus Standi', 'Standing', 'Cause of Action',
  'Territorial Jurisdiction', 'Subject-Matter Jurisdiction', 'Constitutional Jurisdiction',
  'Alternative Remedy', 'Exhaustion of Remedies', 'Limitation & Laches',
  'Res Judicata', 'Ripeness', 'Mootness', 'Statutory Bars', 'Procedural Prerequisites',
]

export default function MaintainabilityStudio() {
  const { activeCase } = useMootStore()
  const [loading, setLoading] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)

  const score = 68
  const factors = [
    { name: 'Jurisdiction under Article 32', strength: 82, status: 'strong', note: 'Direct fundamental rights violation — Article 32 jurisdiction established' },
    { name: 'Locus Standi', strength: 90, status: 'strong', note: 'Petitioner is directly aggrieved — clear standing' },
    { name: 'Alternative Remedy (CAT)', strength: 45, status: 'weak', note: 'CAT has jurisdiction — respondent will raise this objection' },
    { name: 'Limitation', strength: 78, status: 'strong', note: 'Petition filed within reasonable time of dismissal' },
    { name: 'Cause of Action', strength: 85, status: 'strong', note: 'Dismissal without hearing — clear cause of action' },
    { name: 'Res Judicata', strength: 95, status: 'strong', note: 'No prior proceedings — no res judicata concern' },
  ]

  const benchAttacks = [
    { q: 'Counsel, why should this Court entertain the petition when an alternative statutory remedy exists under the Administrative Tribunals Act?', difficulty: 'HIGH' },
    { q: 'Is the petitioner not bound to first exhaust the remedy before the Central Administrative Tribunal?', difficulty: 'HIGH' },
    { q: 'Where is your authority that Article 32 can be invoked when an efficacious alternative remedy exists?', difficulty: 'MEDIUM' },
  ]

  const handleAnalyze = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 1800))
    setLoading(false)
    setAnalyzed(true)
  }

  const scoreColor = score >= 75 ? 'text-legal-green' : score >= 50 ? 'text-gold-400' : 'text-legal-red'

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ivory-100">Maintainability Studio</h1>
          <p className="text-sm text-charcoal-400 mt-0.5">Test jurisdiction, standing, and procedural prerequisites</p>
        </div>
        <button onClick={handleAnalyze} disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
          {loading ? 'Analysing…' : 'Run Maintainability Analysis'}
        </button>
      </div>

      {/* Score */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-gold text-center col-span-1">
          <div className="text-2xs text-charcoal-400 uppercase tracking-wider mb-2">Maintainability Score</div>
          <div className={`text-5xl font-extrabold ${scoreColor} mb-1`}>{score}</div>
          <div className="text-sm text-charcoal-400">/ 100 — Moderate</div>
          <div className="mt-3 text-xs text-charcoal-500">Petitioner | Issue I</div>
        </div>
        <div className="col-span-2 grid grid-cols-2 gap-3">
          {[
            { label: 'Strongest Point', value: 'Locus standi clear — direct aggrievement', icon: CheckCircle, color: 'text-legal-green' },
            { label: 'Weakest Point', value: 'Alternative remedy under CAT not addressed', icon: XCircle, color: 'text-legal-red' },
            { label: 'Likely Bench Attack', value: '"Why not approach CAT first?"', icon: Gavel, color: 'text-gold-400' },
            { label: 'Required Authority', value: 'Exception to alternative remedy rule', icon: AlertTriangle, color: 'text-orange-400' },
          ].map(item => {
            const Icon = item.icon
            return (
              <div key={item.label} className="card">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                  <span className="text-2xs text-charcoal-500 uppercase tracking-wider">{item.label}</span>
                </div>
                <p className="text-xs text-ivory-200">{item.value}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Factor analysis */}
      <div className="card">
        <h3 className="section-title text-base mb-4">Jurisdictional Factor Analysis</h3>
        <div className="space-y-3">
          {factors.map(f => (
            <div key={f.name} className="flex items-start gap-4 p-3 rounded-md bg-[#1a1c22] border border-[#2a2e40]">
              <div className="flex-shrink-0 w-8 mt-0.5">
                {f.status === 'strong' ? <CheckCircle className="w-4 h-4 text-legal-green" /> : <XCircle className="w-4 h-4 text-legal-red" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-ivory-200">{f.name}</span>
                  <span className={`text-sm font-bold ${f.strength >= 70 ? 'text-legal-green' : f.strength >= 50 ? 'text-gold-400' : 'text-legal-red'}`}>{f.strength}/100</span>
                </div>
                <div className="h-1.5 bg-[#1e2130] rounded-full overflow-hidden mb-2">
                  <div className={`h-full rounded-full ${f.strength >= 70 ? 'bg-legal-green' : f.strength >= 50 ? 'bg-gold-400' : 'bg-legal-red'}`}
                    style={{ width: `${f.strength}%` }} />
                </div>
                <p className="text-xs text-charcoal-400">{f.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bench attack drills */}
      <div className="card">
        <h3 className="section-title text-base mb-4">Likely Bench Attacks on Maintainability</h3>
        <div className="space-y-3">
          {benchAttacks.map((attack, i) => (
            <div key={i} className="p-4 rounded-lg bg-[#1a1508] border border-gold-600/20">
              <div className="flex items-start gap-3">
                <Gavel className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gold-100 italic">"{attack.q}"</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`badge ${attack.difficulty === 'HIGH' ? 'badge-red' : 'badge-amber'}`}>{attack.difficulty}</span>
                    <span className="text-2xs text-charcoal-500">Prepare a detailed response to this question</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Maintainability factors checklist */}
      <div className="card">
        <h3 className="section-title text-sm mb-3">Research Checklist — Maintainability</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {MAINTAINABILITY_FACTORS.map(f => (
            <label key={f} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-gold-500" />
              <span className="text-xs text-charcoal-300">{f}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
