'use client'
import { useState } from 'react'
import { BookMarked, Lock, AlertTriangle } from 'lucide-react'

const SAMPLE_TERMS = [
  { id: 't1', preferred: 'Petition', alternatives: ['Application', 'Writ Petition'], definition: 'A formal written request addressed to a court invoking its jurisdiction', sections: ['Statement of Jurisdiction', 'Issues Raised'], locked: true, consistency: 'consistent' },
  { id: 't2', preferred: 'Petitioner', alternatives: ['Appellant', 'Applicant'], definition: 'The party who files the petition before the court', sections: ['All sections'], locked: true, consistency: 'consistent' },
  { id: 't3', preferred: 'Audi Alteram Partem', alternatives: ['Right to hearing', 'Hear the other side'], definition: 'Principle of natural justice: no person shall be condemned unheard', sections: ['Issue II', 'Arguments Advanced'], locked: false, consistency: 'inconsistent' },
  { id: 't4', preferred: 'Article 32 Jurisdiction', alternatives: ['Writ jurisdiction', 'Constitutional jurisdiction'], definition: 'Original jurisdiction of the Supreme Court to enforce fundamental rights', sections: ['Issue I', 'Statement of Jurisdiction'], locked: false, consistency: 'consistent' },
  { id: 't5', preferred: 'Ratio Decidendi', alternatives: ['Ratio', 'Holding'], definition: 'The legal principle forming the basis of a judicial decision; binding part of a precedent', sections: ['Authorities'], locked: false, consistency: 'inconsistent' },
]

export default function Glossary() {
  const [terms, setTerms] = useState(SAMPLE_TERMS)
  const [search, setSearch] = useState('')
  const filtered = terms.filter(t => t.preferred.toLowerCase().includes(search.toLowerCase()) || t.alternatives.some(a => a.toLowerCase().includes(search.toLowerCase())))
  const inconsistent = terms.filter(t => t.consistency === 'inconsistent').length
  const pct = Math.round(((terms.length - inconsistent) / terms.length) * 100)

  const toggleLock = (id: string) => setTerms(prev => prev.map(t => t.id === id ? { ...t, locked: !t.locked } : t))

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-ivory-100">Case Glossary</h1>
          <p className="text-sm text-charcoal-400 mt-0.5">Consistent legal terminology across your memorial</p></div>
        <div className="card py-2 px-4 text-center">
          <div className={`text-xl font-bold ${pct >= 90 ? 'text-legal-green' : 'text-gold-400'}`}>{pct}%</div>
          <div className="text-2xs text-charcoal-500">Terminology Consistency</div>
        </div>
      </div>

      {inconsistent > 0 && (
        <div className="alert-high">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{inconsistent} term{inconsistent > 1 ? 's are' : ' is'} used inconsistently across your memorial. Review and lock preferred terms.</span>
        </div>
      )}

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search glossary terms…" className="input w-full" />

      <div className="space-y-3">
        {filtered.map(term => (
          <div key={term.id} className={`card border ${term.consistency === 'inconsistent' ? 'border-gold-500/30' : 'border-[#2a2e40]'}`}>
            <div className="flex items-start gap-3">
              <BookMarked className={`w-4 h-4 flex-shrink-0 mt-0.5 ${term.locked ? 'text-gold-400' : 'text-charcoal-500'}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-ivory-100">{term.preferred}</span>
                  {term.locked && <Lock className="w-3 h-3 text-gold-400" />}
                  {term.consistency === 'inconsistent' && <span className="badge badge-amber text-2xs">Inconsistent Usage</span>}
                </div>
                <p className="text-xs text-charcoal-400 mb-2">{term.definition}</p>
                <div className="flex flex-wrap gap-2">
                  {term.alternatives.map(a => (
                    <span key={a} className="text-2xs bg-[#1e2130] border border-[#2a2e40] text-charcoal-300 rounded px-2 py-0.5">also: {a}</span>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-2xs text-charcoal-500">Used in: {term.sections.join(', ')}</span>
                </div>
              </div>
              <button onClick={() => toggleLock(term.id)} className={`btn-ghost text-xs py-1 px-2 ${term.locked ? 'text-gold-400' : ''}`}>
                {term.locked ? <><Lock className="w-3.5 h-3.5" /> Locked</> : 'Lock Term'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
