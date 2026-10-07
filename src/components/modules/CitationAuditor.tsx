'use client'
import { useState } from 'react'
import { Link2, CheckCircle, AlertTriangle, XCircle, AlertCircle, Loader2 } from 'lucide-react'

type CitationStatus = 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'SOURCE_CONFLICT' | 'MIS_CITATION' | 'POSSIBLE_HALLUCINATION' | 'OVERRULED' | 'PROPOSITION_NOT_SUPPORTED' | 'PENDING'

const RISK_MAP: Record<CitationStatus, { badge: string; icon: typeof CheckCircle; riskDot: string; label: string }> = {
  'VERIFIED': { badge: 'badge-green', icon: CheckCircle, riskDot: 'risk-dot-green', label: 'Verified' },
  'PARTIALLY_VERIFIED': { badge: 'badge-amber', icon: AlertTriangle, riskDot: 'risk-dot-yellow', label: 'Partially Verified' },
  'SOURCE_CONFLICT': { badge: 'badge-amber', icon: AlertTriangle, riskDot: 'risk-dot-orange', label: 'Source Conflict' },
  'MIS_CITATION': { badge: 'badge-red', icon: XCircle, riskDot: 'risk-dot-red', label: 'Mis-Citation' },
  'POSSIBLE_HALLUCINATION': { badge: 'badge-red', icon: XCircle, riskDot: 'risk-dot-red', label: 'Possible Hallucination' },
  'OVERRULED': { badge: 'badge-red', icon: AlertCircle, riskDot: 'risk-dot-orange', label: 'Overruled / Distinguished' },
  'PROPOSITION_NOT_SUPPORTED': { badge: 'badge-amber', icon: AlertTriangle, riskDot: 'risk-dot-orange', label: 'Proposition Not Supported' },
  'PENDING': { badge: 'badge-gray', icon: AlertTriangle, riskDot: 'risk-dot-yellow', label: 'Pending Verification' },
}

const SAMPLE_CITATIONS = [
  { id: 'c1', raw: 'L. Chandra Kumar v. Union of India, (1997) 3 SCC 261', para: '¶ 78', proposition: 'Article 32 jurisdiction is part of basic structure', status: 'VERIFIED' as CitationStatus, notes: 'Citation confirmed. Ratio supports proposition directly. 7-judge bench.' },
  { id: 'c2', raw: 'Whirlpool Corporation v. Registrar of Trade Marks, (1998) 8 SCC 1', para: '¶ 15', proposition: 'Alternative remedy does not bar writ jurisdiction', status: 'VERIFIED' as CitationStatus, notes: 'Confirmed. Ratio decidendi squarely on point.' },
  { id: 'c3', raw: 'S.P. Sampath Kumar v. Union of India, (1987) 1 SCC 124', para: '¶ 42', proposition: 'Tribunals are an effective substitute for High Courts', status: 'OVERRULED' as CitationStatus, notes: 'Distinguished in L. Chandra Kumar. This proposition has been significantly qualified. Use with caution.' },
  { id: 'c4', raw: 'Ramesh Prasad Singh v. State of Bihar, AIR 2006 SC 1..', para: 'Para 9', proposition: 'Natural justice applies to all adverse orders', status: 'PARTIALLY_VERIFIED' as CitationStatus, notes: 'Case exists but cited paragraph could not be independently confirmed. Verify against SCC report.' },
  { id: 'c5', raw: 'Union of India v. Hari Prakash, (2022) 14 SCC 812', para: 'Para 31', proposition: 'National security exception is absolute', status: 'POSSIBLE_HALLUCINATION' as CitationStatus, notes: 'Unable to independently verify this authority. Do not rely on it until checked against SCC Online or official repository.' },
]

export default function CitationAuditor() {
  const [citations, setCitations] = useState(SAMPLE_CITATIONS)
  const [input, setInput] = useState('')
  const [checking, setChecking] = useState<string | null>(null)

  const handleManualCheck = async (id: string) => {
    setChecking(id)
    await new Promise(r => setTimeout(r, 1800))
    setChecking(null)
  }

  const verified = citations.filter(c => c.status === 'VERIFIED').length
  const issues = citations.filter(c => ['MIS_CITATION', 'POSSIBLE_HALLUCINATION', 'OVERRULED'].includes(c.status)).length

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-ivory-100">Citation Auditor</h1>
          <p className="text-sm text-charcoal-400 mt-0.5">Every citation checked — never rely on an unverified authority</p></div>
        <div className="flex gap-3">
          <div className="card py-2 px-4 text-center">
            <div className="text-xl font-bold text-legal-green">{verified}/{citations.length}</div>
            <div className="text-2xs text-charcoal-500">Verified</div>
          </div>
          <div className="card py-2 px-4 text-center">
            <div className="text-xl font-bold text-legal-red">{issues}</div>
            <div className="text-2xs text-charcoal-500">Issues</div>
          </div>
        </div>
      </div>

      {/* Risk legend */}
      <div className="flex gap-4 text-xs text-charcoal-400">
        {[['risk-dot-green','Verified'],['risk-dot-yellow','Partial / Unverified'],['risk-dot-orange','Source Conflict / Overruled'],['risk-dot-red','Mis-Citation / Hallucination']].map(([dot, label]) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={dot} /><span>{label}</span>
          </div>
        ))}
      </div>

      {/* Add citation */}
      <div className="card">
        <div className="text-sm font-medium text-ivory-200 mb-2">Add citation for verification:</div>
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="e.g. Kesavananda Bharati v. State of Kerala, (1973) 4 SCC 225"
            className="input flex-1" />
          <button className="btn-primary px-5" disabled={!input.trim()}>
            <Link2 className="w-4 h-4" /> Verify
          </button>
        </div>
      </div>

      {/* Citation list */}
      <div className="space-y-3">
        {citations.map(c => {
          const cfg = RISK_MAP[c.status]
          const Icon = cfg.icon
          return (
            <div key={c.id} className={`card border ${c.status === 'VERIFIED' ? 'border-legal-green/20' : ['MIS_CITATION','POSSIBLE_HALLUCINATION'].includes(c.status) ? 'border-legal-red/30' : 'border-gold-500/20'}`}>
              <div className="flex items-start gap-3">
                <div className={cfg.riskDot + ' mt-1.5 flex-shrink-0'} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <p className="text-sm font-semibold text-ivory-100">{c.raw}</p>
                      {c.para && <span className="text-xs text-charcoal-500">{c.para}</span>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
                      {c.status !== 'VERIFIED' && (
                        <button onClick={() => handleManualCheck(c.id)} disabled={checking === c.id} className="btn-ghost text-xs py-1 px-2">
                          {checking === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Re-check'}
                        </button>
                      )}
                    </div>
                  </div>
                  {c.proposition && <p className="text-xs text-charcoal-400 italic mb-2">Proposition: "{c.proposition}"</p>}
                  <p className="text-xs text-charcoal-300">{c.notes}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-start gap-3 p-4 rounded-lg bg-[#1a1508] border border-gold-600/20">
        <AlertTriangle className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-charcoal-400">
          <strong className="text-gold-300">Citation Integrity Rule:</strong> A citation is never marked "Verified" solely because an AI generated it.
          Verification requires confirmation from a primary source, uploaded document, or licensed database. Unverified citations are flagged until confirmed.
        </div>
      </div>
    </div>
  )
}
