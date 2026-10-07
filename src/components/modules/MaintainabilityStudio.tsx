'use client'

import { useState } from 'react'
import { useMootStore } from '@/store/mootStore'
import { Shield, AlertTriangle, CheckCircle, XCircle, Loader2, Gavel } from 'lucide-react'
import { analyzeMaintainability } from '@/lib/gemini'
import { usePersistentState } from '@/lib/usePersistentState'

const MAINTAINABILITY_FACTORS = [
  'Jurisdiction', 'Locus Standi', 'Standing', 'Cause of Action',
  'Territorial Jurisdiction', 'Subject-Matter Jurisdiction', 'Constitutional Jurisdiction',
  'Alternative Remedy', 'Exhaustion of Remedies', 'Limitation & Laches',
  'Res Judicata', 'Ripeness', 'Mootness', 'Statutory Bars', 'Procedural Prerequisites',
]

interface MaintainabilityData {
  score: number
  strongestPoint: string
  weakestPoint: string
  likelyBenchAttack: string
  requiredAuthority: string
  factors: Array<{ name: string; strength: number; status: 'strong' | 'weak'; note: string }>
  benchAttacks: Array<{ q: string; difficulty: 'HIGH' | 'MEDIUM' | 'LOW' }>
}

const DEFAULT_DATA: MaintainabilityData = {
  score: 68,
  strongestPoint: 'Locus standi clear — direct aggrievement',
  weakestPoint: 'Alternative remedy under CAT not addressed',
  likelyBenchAttack: '"Why not approach CAT first?"',
  requiredAuthority: 'Exception to alternative remedy rule (Whirlpool / L. Chandra Kumar)',
  factors: [
    { name: 'Jurisdiction under Article 32', strength: 82, status: 'strong', note: 'Direct fundamental rights violation — Article 32 jurisdiction established' },
    { name: 'Locus Standi', strength: 90, status: 'strong', note: 'Petitioner is directly aggrieved — clear standing' },
    { name: 'Alternative Remedy (CAT)', strength: 45, status: 'weak', note: 'CAT has jurisdiction — respondent will raise this objection' },
    { name: 'Limitation', strength: 78, status: 'strong', note: 'Petition filed within reasonable time of dismissal' },
    { name: 'Cause of Action', strength: 85, status: 'strong', note: 'Dismissal without hearing — clear cause of action' },
    { name: 'Res Judicata', strength: 95, status: 'strong', note: 'No prior proceedings — no res judicata concern' },
  ],
  benchAttacks: [
    { q: 'Counsel, why should this Court entertain the petition when an alternative statutory remedy exists under the Administrative Tribunals Act?', difficulty: 'HIGH' },
    { q: 'Is the petitioner not bound to first exhaust the remedy before the Central Administrative Tribunal?', difficulty: 'HIGH' },
    { q: 'Where is your authority that Article 32 can be invoked when an efficacious alternative remedy exists?', difficulty: 'MEDIUM' },
  ]
}

export default function MaintainabilityStudio() {
  const { activeCase } = useMootStore()
  const [data, setData] = usePersistentState<MaintainabilityData>('maintainability-data', DEFAULT_DATA)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    setLoading(true)
    setError(null)
    try {
      const issue1 = activeCase?.issues[0]
      const result = await analyzeMaintainability({
        caseContext: `${activeCase?.name || ''}. ${activeCase?.proposition || ''}`,
        petitionerPosition: issue1?.petitionerPosition,
        respondentPosition: issue1?.respondentPosition
      })
      if (result && result.factors && result.factors.length > 0) {
        setData(result)
      }
    } catch (e: any) {
      setError(e.message || 'Maintainability analysis failed. Please try again.')
    }
    setLoading(false)
  }

  const score = data.score
  const scoreColor = score >= 75 ? 'text-legal-green' : score >= 50 ? 'text-gold-400' : 'text-legal-red'

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ivory-100">Maintainability Studio</h1>
          <p className="text-sm text-charcoal-400 mt-0.5">Test jurisdiction, standing, and procedural prerequisites with AI</p>
        </div>
        <button onClick={handleAnalyze} disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
          {loading ? 'Analysing with AI…' : 'Run AI Maintainability Analysis'}
        </button>
      </div>

      {error && (
        <div className="alert-critical">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Score */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-gold text-center col-span-1">
          <div className="text-2xs text-charcoal-400 uppercase tracking-wider mb-2">Maintainability Score</div>
          <div className={`text-5xl font-extrabold ${scoreColor} mb-1`}>{score}</div>
          <div className="text-sm text-charcoal-400">/ 100 — {score >= 75 ? 'Strong' : score >= 50 ? 'Moderate' : 'Vulnerable'}</div>
          <div className="mt-3 text-xs text-charcoal-500">{activeCase?.activeSide ? activeCase.activeSide.toUpperCase() : 'PETITIONER'} | Issue I</div>
        </div>
        <div className="col-span-2 grid grid-cols-2 gap-3">
          {[
            { label: 'Strongest Point', value: data.strongestPoint, icon: CheckCircle, color: 'text-legal-green' },
            { label: 'Weakest Point', value: data.weakestPoint, icon: XCircle, color: 'text-legal-red' },
            { label: 'Likely Bench Attack', value: data.likelyBenchAttack, icon: Gavel, color: 'text-gold-400' },
            { label: 'Required Authority', value: data.requiredAuthority, icon: AlertTriangle, color: 'text-orange-400' },
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
          {data.factors.map(f => (
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
          {data.benchAttacks.map((attack, i) => (
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
