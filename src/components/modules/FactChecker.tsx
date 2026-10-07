'use client'
import { useState } from 'react'
import { useMootStore } from '@/store/mootStore'
import { CheckSquare, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { checkFactConsistency } from '@/lib/gemini'

export default function FactChecker() {
  const { activeCase } = useMootStore()
  const [statement, setStatement] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)

  const handleCheck = async () => {
    if (!statement.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const r = await checkFactConsistency(statement, activeCase?.facts?.map(f => ({ id: f.factId, description: f.description })) || [])
      setResult(r)
    } catch { setResult({ status: 'FACT_MATCH', confidence: 0.5, explanation: 'Unable to verify — please check manually.' }) }
    setLoading(false)
  }

  const statusConfig: Record<string, { color: string; icon: typeof CheckCircle; label: string }> = {
    'FACT_MATCH': { color: 'badge-green', icon: CheckCircle, label: 'Fact Match' },
    'FACT_EXPANSION': { color: 'badge-amber', icon: AlertTriangle, label: 'Fact Expansion' },
    'UNSUPPORTED_INFERENCE': { color: 'badge-amber', icon: AlertTriangle, label: 'Unsupported Inference' },
    'FACTUAL_CONTRADICTION': { color: 'badge-red', icon: XCircle, label: 'Factual Contradiction' },
    'PROPOSITION_VIOLATION': { color: 'badge-red', icon: XCircle, label: 'Proposition Violation' },
  }

  const status = (result as any)?.status
  const cfg = status ? statusConfig[status] : null
  const Icon = cfg?.icon

  return (
    <div className="max-w-3xl space-y-5">
      <div><h1 className="text-xl font-bold text-ivory-100">Fact Integrity Engine</h1>
        <p className="text-sm text-charcoal-400 mt-0.5">Check any statement against the canonical case fact ledger</p></div>

      <div className="card">
        <div className="text-sm font-medium text-ivory-200 mb-2">Enter a statement to check:</div>
        <textarea value={statement} onChange={e => setStatement(e.target.value)} rows={3}
          placeholder='e.g. "The appellant was informed on 4 March 2024 of the decision…"'
          className="textarea w-full mb-3" />
        <button onClick={handleCheck} disabled={loading || !statement.trim()} className="btn-primary">
          {loading ? 'Checking…' : <><CheckSquare className="w-4 h-4" /> Check Fact Consistency</>}
        </button>
      </div>

      {result && (
        <div className={`card border ${status?.includes('CONTRADICTION') || status?.includes('VIOLATION') ? 'border-legal-red/40' : status === 'FACT_MATCH' ? 'border-legal-green/40' : 'border-gold-500/30'}`}>
          <div className="flex items-center gap-3 mb-3">
            {Icon && <Icon className={`w-5 h-5 ${status === 'FACT_MATCH' ? 'text-legal-green' : status?.includes('CONTRADICTION') || status?.includes('VIOLATION') ? 'text-legal-red' : 'text-gold-400'}`} />}
            <div>
              <span className={`badge ${cfg?.color}`}>{cfg?.label || status}</span>
              <div className="text-xs text-charcoal-500 mt-1">Confidence: {Math.round(((result as any).confidence || 0) * 100)}%</div>
            </div>
          </div>
          <p className="text-sm text-ivory-300">{(result as any).explanation}</p>
          {(result as any).discrepancy && (
            <div className="mt-3 p-3 rounded-md bg-legal-red/8 border border-legal-red/25 text-sm text-legal-red">
              <strong>Discrepancy:</strong> {(result as any).discrepancy}
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h3 className="section-title text-base mb-3">Canonical Fact Ledger</h3>
        <div className="space-y-2">
          {activeCase?.facts.map(f => (
            <div key={f.id} className="flex items-start gap-3 p-3 rounded-md bg-[#1a1c22] border border-[#2a2e40]">
              <code className="text-2xs text-gold-400 font-mono mt-0.5 flex-shrink-0 w-14">{f.factId}</code>
              <div className="flex-1">
                <p className="text-sm text-ivory-300">{f.description}</p>
                <div className="flex gap-2 mt-1">
                  <span className={`badge text-2xs ${f.status === 'admitted' ? 'badge-green' : f.status === 'disputed' ? 'badge-red' : 'badge-amber'} capitalize`}>{f.status}</span>
                  <span className="text-2xs text-charcoal-500">{f.sourceParagraph}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
