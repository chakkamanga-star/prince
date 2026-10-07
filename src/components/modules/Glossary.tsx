'use client'
import { useState } from 'react'
import { BookMarked, Lock, Unlock, AlertTriangle, Plus, Trash2 } from 'lucide-react'
import { usePersistentState } from '@/lib/usePersistentState'

interface Term {
  id: string
  preferred: string
  alternatives: string[]
  definition: string
  sections: string[]
  locked: boolean
  consistency: 'consistent' | 'inconsistent'
}

const DEFAULT_TERMS: Term[] = [
  { id: 't1', preferred: 'Petition', alternatives: ['Application', 'Writ Petition'], definition: 'A formal written request addressed to a court invoking its extraordinary jurisdiction', sections: ['Statement of Jurisdiction', 'Issues Raised'], locked: true, consistency: 'consistent' },
  { id: 't2', preferred: 'Petitioner', alternatives: ['Appellant', 'Applicant'], definition: 'The party who files the petition before the court', sections: ['All sections'], locked: true, consistency: 'consistent' },
  { id: 't3', preferred: 'Audi Alteram Partem', alternatives: ['Right to hearing', 'Hear the other side'], definition: 'Principle of natural justice: no person shall be condemned unheard', sections: ['Issue II', 'Arguments Advanced'], locked: false, consistency: 'inconsistent' },
  { id: 't4', preferred: 'Article 32 Jurisdiction', alternatives: ['Writ jurisdiction', 'Constitutional jurisdiction'], definition: 'Original jurisdiction of the Supreme Court to enforce fundamental rights', sections: ['Issue I', 'Statement of Jurisdiction'], locked: false, consistency: 'consistent' },
  { id: 't5', preferred: 'Ratio Decidendi', alternatives: ['Ratio', 'Holding'], definition: 'The legal principle forming the basis of a judicial decision; binding part of a precedent', sections: ['Authorities'], locked: false, consistency: 'inconsistent' },
]

export default function Glossary() {
  const [terms, setTerms] = usePersistentState<Term[]>('moot-glossary-terms', DEFAULT_TERMS)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newTerm, setNewTerm] = useState({ preferred: '', alternatives: '', definition: '', sections: '' })

  const filtered = terms.filter(t =>
    t.preferred.toLowerCase().includes(search.toLowerCase()) ||
    t.alternatives.some(a => a.toLowerCase().includes(search.toLowerCase())) ||
    t.definition.toLowerCase().includes(search.toLowerCase())
  )

  const inconsistent = terms.filter(t => t.consistency === 'inconsistent').length
  const pct = terms.length ? Math.round(((terms.length - inconsistent) / terms.length) * 100) : 100

  const toggleLock = (id: string) => {
    setTerms(prev => prev.map(t => {
      if (t.id === id) {
        const nextLock = !t.locked
        return {
          ...t,
          locked: nextLock,
          consistency: nextLock ? 'consistent' : t.consistency
        }
      }
      return t
    }))
  }

  const deleteTerm = (id: string) => {
    setTerms(prev => prev.filter(t => t.id !== id))
  }

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTerm.preferred.trim()) return
    const created: Term = {
      id: `term-${Date.now()}`,
      preferred: newTerm.preferred.trim(),
      alternatives: newTerm.alternatives.split(',').map(s => s.trim()).filter(Boolean),
      definition: newTerm.definition.trim() || 'No definition provided',
      sections: newTerm.sections.split(',').map(s => s.trim()).filter(Boolean),
      locked: true,
      consistency: 'consistent'
    }
    setTerms(prev => [created, ...prev])
    setNewTerm({ preferred: '', alternatives: '', definition: '', sections: '' })
    setShowAdd(false)
  }

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ivory-100">Case Glossary</h1>
          <p className="text-sm text-charcoal-400 mt-0.5">Enforce consistent legal terminology across your written submissions</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowAdd(!showAdd)} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Term
          </button>
          <div className="card py-2 px-4 text-center">
            <div className={`text-xl font-bold ${pct >= 90 ? 'text-legal-green' : 'text-gold-400'}`}>{pct}%</div>
            <div className="text-2xs text-charcoal-500">Consistency</div>
          </div>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="card border-gold-600/30 space-y-3 bg-[#161821]">
          <h3 className="text-sm font-semibold text-gold-300">Add New Legal Term</h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              value={newTerm.preferred}
              onChange={e => setNewTerm({ ...newTerm, preferred: e.target.value })}
              placeholder="Preferred term (e.g. Petitioner)"
              className="input text-xs"
              required
            />
            <input
              value={newTerm.alternatives}
              onChange={e => setNewTerm({ ...newTerm, alternatives: e.target.value })}
              placeholder="Alternatives to avoid (comma-separated, e.g. Appellant, Applicant)"
              className="input text-xs"
            />
          </div>
          <input
            value={newTerm.definition}
            onChange={e => setNewTerm({ ...newTerm, definition: e.target.value })}
            placeholder="Legal definition or canonical rule..."
            className="input text-xs w-full"
          />
          <input
            value={newTerm.sections}
            onChange={e => setNewTerm({ ...newTerm, sections: e.target.value })}
            placeholder="Sections used in (comma-separated, e.g. Arguments Advanced, Prayer)"
            className="input text-xs w-full"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowAdd(false)} className="btn-ghost text-xs">
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              Save Term
            </button>
          </div>
        </form>
      )}

      {inconsistent > 0 && (
        <div className="alert-high">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{inconsistent} term{inconsistent > 1 ? 's are' : ' is'} flagged as inconsistent. Click "Lock Term" to enforce the preferred wording.</span>
        </div>
      )}

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search glossary terms or definitions…"
        className="input w-full"
      />

      <div className="space-y-3">
        {filtered.map(term => (
          <div key={term.id} className={`card border ${term.consistency === 'inconsistent' ? 'border-gold-500/30' : 'border-[#2a2e40]'}`}>
            <div className="flex items-start gap-3">
              <BookMarked className={`w-4 h-4 flex-shrink-0 mt-0.5 ${term.locked ? 'text-gold-400' : 'text-charcoal-500'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-bold text-ivory-100">{term.preferred}</span>
                  {term.locked && <span className="badge badge-gold text-2xs flex items-center gap-1"><Lock className="w-2.5 h-2.5" /> Locked</span>}
                  {term.consistency === 'inconsistent' && <span className="badge badge-amber text-2xs">Inconsistent Usage</span>}
                </div>
                <p className="text-xs text-charcoal-400 mb-2">{term.definition}</p>
                {term.alternatives.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {term.alternatives.map(a => (
                      <span key={a} className="text-2xs bg-[#1e2130] border border-[#2a2e40] text-charcoal-300 rounded px-2 py-0.5">
                        avoid: {a}
                      </span>
                    ))}
                  </div>
                )}
                {term.sections.length > 0 && (
                  <div className="mt-2 text-2xs text-charcoal-500">
                    Appears in: {term.sections.join(', ')}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => toggleLock(term.id)}
                  className={`btn-ghost text-xs py-1 px-2.5 flex items-center gap-1 ${term.locked ? 'text-gold-400' : 'text-charcoal-400'}`}
                >
                  {term.locked ? <><Lock className="w-3.5 h-3.5" /> Enforced</> : <><Unlock className="w-3.5 h-3.5" /> Lock</>}
                </button>
                <button
                  onClick={() => deleteTerm(term.id)}
                  className="btn-ghost text-xs p-1.5 text-charcoal-500 hover:text-legal-red"
                  title="Delete term"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="card text-center py-8 text-xs text-charcoal-500">
            No terms found matching your search.
          </div>
        )}
      </div>
    </div>
  )
}
