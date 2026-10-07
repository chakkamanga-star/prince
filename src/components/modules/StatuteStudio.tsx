'use client'
import { useState } from 'react'
import { Scale, ChevronRight, Loader2, BookOpen, Plus, Trash2 } from 'lucide-react'
import { interpretStatute } from '@/lib/gemini'
import { usePersistentState } from '@/lib/usePersistentState'

interface SectionItem {
  num: string
  text: string
  relevance: 'Critical' | 'High' | 'Medium' | 'Low'
}

interface StatuteItem {
  id: string
  title: string
  sections: SectionItem[]
}

const DEFAULT_STATUTES: StatuteItem[] = [
  {
    id: 'at1985',
    title: 'Administrative Tribunals Act, 1985',
    sections: [
      { num: 'Section 14', text: 'Jurisdiction, powers and authority of the Central Administrative Tribunal exercisable in relation to service matters of members of all-India services.', relevance: 'High' },
      { num: 'Section 19', text: 'Applications to Tribunals. A person aggrieved by an order may make an application to the Tribunal for the redressal of his grievance after exhausting alternative remedies.', relevance: 'High' },
      { num: 'Section 28', text: 'Exclusion of jurisdiction of courts except the Supreme Court under article 136 of the Constitution.', relevance: 'Critical' }
    ]
  },
  {
    id: 'const',
    title: 'Constitution of India, 1950',
    sections: [
      { num: 'Article 14', text: 'The State shall not deny to any person equality before the law or the equal protection of the laws within the territory of India.', relevance: 'High' },
      { num: 'Article 19(1)(g)', text: 'All citizens shall have the right to practise any profession, or to carry on any occupation, trade or business.', relevance: 'High' },
      { num: 'Article 21', text: 'No person shall be deprived of his life or personal liberty except according to procedure established by law.', relevance: 'Critical' },
      { num: 'Article 32', text: 'The right to move the Supreme Court by appropriate proceedings for the enforcement of the rights conferred by this Part is guaranteed.', relevance: 'Critical' },
      { num: 'Article 311', text: 'Dismissal, removal or reduction in rank of persons employed in civil capacities under the Union or a State without inquiry exception.', relevance: 'Critical' }
    ]
  },
]

export default function StatuteStudio() {
  const [statutes, setStatutes] = usePersistentState<StatuteItem[]>('moot-statutes', DEFAULT_STATUTES)
  const [selectedStatuteId, setSelectedStatuteId] = useState(statutes[0]?.id || '')
  const [selectedSection, setSelectedSection] = useState<SectionItem | null>(null)
  const [interpretation, setInterpretation] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddSection, setShowAddSection] = useState(false)
  const [newSection, setNewSection] = useState({ num: '', text: '', relevance: 'High' as SectionItem['relevance'] })

  const selectedStatute = statutes.find(s => s.id === selectedStatuteId) || statutes[0] || null

  const handleSectionClick = async (section: SectionItem) => {
    setSelectedSection(section)
    setLoading(true)
    setInterpretation(null)
    setError(null)
    try {
      const result = await interpretStatute({
        sectionText: section.text,
        sectionNumber: section.num,
        actTitle: selectedStatute?.title || 'Statute',
        issue: 'Maintainability and constitutional validity',
        userPosition: 'Petitioner — arguing violation of fundamental rights and basic structure'
      })
      setInterpretation(result)
    } catch (e: any) {
      setError(e.message || 'Interpretation failed. Please check Gemini API key.')
    }
    setLoading(false)
  }

  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSection.num.trim() || !newSection.text.trim() || !selectedStatute) return
    const updated = {
      ...selectedStatute,
      sections: [...selectedStatute.sections, { ...newSection }]
    }
    setStatutes(prev => prev.map(s => s.id === updated.id ? updated : s))
    setNewSection({ num: '', text: '', relevance: 'High' })
    setShowAddSection(false)
  }

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ivory-100">Statute Studio</h1>
          <p className="text-sm text-charcoal-400 mt-0.5">Deconstruct statutory provisions with AI: plain meaning, key terms, doctrines &amp; bench queries</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {statutes.map(s => (
          <button
            key={s.id}
            onClick={() => { setSelectedStatuteId(s.id); setSelectedSection(null); setInterpretation(null) }}
            className={`text-sm px-4 py-2 rounded-md border transition-all ${
              selectedStatute?.id === s.id
                ? 'bg-gold-500/20 border-gold-500/50 text-gold-200 font-semibold'
                : 'border-[#2a2e40] bg-[#13151c] text-charcoal-400 hover:text-ivory-200'
            }`}
          >
            {s.title.split(',')[0]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5 h-[620px]">
        {/* Left — statute text */}
        <div className="card overflow-y-auto flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title text-sm">{selectedStatute?.title}</h3>
            <button
              onClick={() => setShowAddSection(!showAddSection)}
              className="btn-secondary text-2xs px-2.5 py-1 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add Provision
            </button>
          </div>

          {showAddSection && (
            <form onSubmit={handleAddSection} className="p-3 mb-3 rounded-md bg-[#1a1c22] border border-gold-600/30 space-y-2">
              <div className="flex gap-2">
                <input
                  value={newSection.num}
                  onChange={e => setNewSection({ ...newSection, num: e.target.value })}
                  placeholder="e.g. Section 21 / Article 226"
                  className="input text-xs flex-1"
                  required
                />
                <select
                  value={newSection.relevance}
                  onChange={e => setNewSection({ ...newSection, relevance: e.target.value as any })}
                  className="input text-xs"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                </select>
              </div>
              <textarea
                value={newSection.text}
                onChange={e => setNewSection({ ...newSection, text: e.target.value })}
                placeholder="Statutory provision text..."
                rows={2}
                className="textarea text-xs w-full"
                required
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddSection(false)} className="btn-ghost text-2xs">Cancel</button>
                <button type="submit" className="btn-primary text-2xs">Save</button>
              </div>
            </form>
          )}

          <div className="space-y-2 flex-1 overflow-y-auto pr-1">
            {selectedStatute?.sections.map(section => (
              <button
                key={section.num}
                onClick={() => handleSectionClick(section)}
                className={`w-full text-left p-3 rounded-md border transition-all ${
                  selectedSection?.num === section.num
                    ? 'border-gold-500/50 bg-gold-500/10'
                    : 'border-[#2a2e40] bg-[#1a1c22] hover:border-charcoal-500'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gold-400">{section.num}</span>
                  <span className={`badge text-2xs ${section.relevance === 'Critical' ? 'badge-red' : 'badge-amber'}`}>
                    {section.relevance}
                  </span>
                </div>
                <p className="text-xs text-ivory-300 leading-relaxed line-clamp-3">{section.text}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right — AI interpretation */}
        <div className="card overflow-y-auto">
          {!selectedSection && (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <Scale className="w-12 h-12 text-charcoal-600 mb-3" />
              <div className="text-sm font-semibold text-ivory-200">Select Any Provision</div>
              <p className="text-xs text-charcoal-400 mt-1 max-w-xs">
                Click any section on the left to generate an instant authoritative AI interpretation tailored for your bench appearances.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-charcoal-400">
              <Loader2 className="w-6 h-6 animate-spin text-gold-400" />
              <span className="text-sm">Interpreting {selectedSection?.num} with Gemini…</span>
            </div>
          )}

          {error && (
            <div className="alert-critical mt-4">
              <span>{error}</span>
            </div>
          )}

          {interpretation && !loading && (
            <div className="space-y-4">
              <div className="border-b border-[#2a2e40] pb-3">
                <span className="badge badge-gold text-2xs mb-1">{selectedSection?.num}</span>
                <h3 className="text-sm font-bold text-ivory-100">AI Statutory Analysis</h3>
              </div>

              <div>
                <div className="text-2xs text-charcoal-500 uppercase tracking-wider mb-1 font-semibold">Plain Meaning &amp; Ratio</div>
                <p className="text-xs text-ivory-300 leading-relaxed bg-[#1a1c22] p-3 rounded-md border border-[#2a2e40]">
                  {(interpretation as any).plain_meaning}
                </p>
              </div>

              {((interpretation as any).key_terms || []).length > 0 && (
                <div>
                  <div className="text-2xs text-charcoal-500 uppercase tracking-wider mb-2 font-semibold">Key Legal Terms</div>
                  <div className="space-y-1.5">
                    {((interpretation as any).key_terms || []).map((kt: any, i: number) => (
                      <div key={i} className="text-xs p-2 rounded bg-[#161821] border border-[#2a2e40] text-ivory-300">
                        <strong className="text-gold-300">{kt.term}:</strong> {kt.definition}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {((interpretation as any).interpretive_approaches || []).length > 0 && (
                <div>
                  <div className="text-2xs text-charcoal-500 uppercase tracking-wider mb-2 font-semibold">Interpretive Doctrines</div>
                  <div className="space-y-2">
                    {((interpretation as any).interpretive_approaches || []).map((app: any, i: number) => (
                      <div key={i} className="p-3 rounded-md bg-[#1a1c22] border border-[#2a2e40]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-ivory-200 capitalize">{app.approach?.replace(/_/g, ' ')}</span>
                          <span className="badge badge-blue text-2xs capitalize">{app.supports_position || 'Supports Argument'}</span>
                        </div>
                        <p className="text-xs text-charcoal-300 leading-relaxed">{app.analysis}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {((interpretation as any).bench_observations || []).length > 0 && (
                <div>
                  <div className="text-2xs text-charcoal-500 uppercase tracking-wider mb-2 font-semibold">Anticipated Bench Observations</div>
                  <div className="space-y-1.5">
                    {((interpretation as any).bench_observations || []).map((obs: string, i: number) => (
                      <div key={i} className="p-2.5 rounded bg-gold-500/5 border border-gold-500/20 text-xs text-gold-200">
                        "{obs}"
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
