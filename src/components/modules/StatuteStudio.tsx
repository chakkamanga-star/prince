'use client'
import { useState } from 'react'
import { Scale, ChevronRight, Loader2, BookOpen } from 'lucide-react'
import { interpretStatute } from '@/lib/gemini'

const STATUTES = [
  { id: 'at1985', title: 'Administrative Tribunals Act, 1985', sections: [{ num: '14', text: 'Jurisdiction, powers and authority of Central Administrative Tribunal.', relevance: 'High' }, { num: '19', text: 'Applications to Tribunal.', relevance: 'High' }, { num: '28', text: 'Exclusion of jurisdiction of courts except the Supreme Court under article 136 of the Constitution.', relevance: 'Critical' }] },
  { id: 'const', title: 'Constitution of India', sections: [{ num: 'Art. 14', text: 'The State shall not deny to any person equality before the law or the equal protection of the laws within the territory of India.', relevance: 'High' }, { num: 'Art. 21', text: 'No person shall be deprived of his life or personal liberty except according to procedure established by law.', relevance: 'Critical' }, { num: 'Art. 32', text: 'The right to move the Supreme Court by appropriate proceedings for the enforcement of the rights conferred by this Part is guaranteed.', relevance: 'Critical' }, { num: 'Art. 311', text: 'No person who is a member of a civil service of the Union…shall be dismissed or removed by an authority subordinate to that by which he was appointed.', relevance: 'High' }] },
]

export default function StatuteStudio() {
  const [selectedStatute, setSelectedStatute] = useState(STATUTES[0])
  const [selectedSection, setSelectedSection] = useState<typeof STATUTES[0]['sections'][0] | null>(null)
  const [interpretation, setInterpretation] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSectionClick = async (section: typeof STATUTES[0]['sections'][0]) => {
    setSelectedSection(section)
    setLoading(true)
    setInterpretation(null)
    try {
      const result = await interpretStatute({
        sectionText: section.text,
        sectionNumber: section.num,
        actTitle: selectedStatute.title,
        issue: 'Maintainability and exclusion of jurisdiction',
        userPosition: 'Petitioner — arguing that the petition is maintainable before the Supreme Court'
      })
      setInterpretation(result)
    } catch {}
    setLoading(false)
  }

  return (
    <div className="max-w-5xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-ivory-100">Statute Studio</h1>
        <p className="text-sm text-charcoal-400 mt-0.5">Click any section for AI interpretation with multiple doctrines</p>
      </div>
      <div className="flex gap-2 mb-4">
        {STATUTES.map(s => (
          <button key={s.id} onClick={() => { setSelectedStatute(s); setSelectedSection(null); setInterpretation(null) }}
            className={`text-sm px-4 py-2 rounded-md border transition-all ${selectedStatute.id === s.id ? 'bg-gold-500/20 border-gold-500/50 text-gold-200' : 'border-[#2a2e40] text-charcoal-400'}`}>
            {s.title.split(',')[0]}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-5 h-[600px]">
        {/* Left — statute text */}
        <div className="card overflow-y-auto">
          <h3 className="section-title text-sm mb-3">{selectedStatute.title}</h3>
          <div className="space-y-2">
            {selectedStatute.sections.map(section => (
              <button key={section.num} onClick={() => handleSectionClick(section)}
                className={`w-full text-left p-3 rounded-md border transition-all ${
                  selectedSection?.num === section.num ? 'border-gold-500/50 bg-gold-500/8' : 'border-[#2a2e40] bg-[#1a1c22] hover:border-charcoal-500'
                }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gold-400">{section.num}</span>
                  <span className={`badge text-2xs ${section.relevance === 'Critical' ? 'badge-red' : 'badge-amber'}`}>{section.relevance}</span>
                </div>
                <p className="text-sm text-ivory-300 leading-relaxed">{section.text}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right — AI interpretation */}
        <div className="card overflow-y-auto">
          {!selectedSection && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Scale className="w-10 h-10 text-charcoal-700 mb-3" />
              <div className="text-sm text-charcoal-500">Click any provision to view AI interpretation</div>
            </div>
          )}
          {loading && (
            <div className="flex items-center gap-3 text-charcoal-400 mt-8 justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-gold-400" />
              <span className="text-sm">Interpreting {selectedSection?.num}…</span>
            </div>
          )}
          {interpretation && !loading && (
            <div className="space-y-4">
              <div>
                <div className="text-2xs text-charcoal-500 uppercase tracking-wider mb-1">Plain Meaning</div>
                <p className="text-sm text-ivory-300 leading-relaxed">{(interpretation as any).plain_meaning}</p>
              </div>
              <div>
                <div className="text-2xs text-charcoal-500 uppercase tracking-wider mb-2">Key Terms</div>
                <div className="flex flex-wrap gap-2">
                  {((interpretation as any).key_terms || []).map((kt: any, i: number) => (
                    <div key={i} className="badge badge-gray">
                      <span className="font-semibold">{kt.term}:</span> {kt.definition?.substring(0, 40)}…
                    </div>
                  ))}
                </div>
              </div>
              {((interpretation as any).interpretive_approaches || []).map((approach: any, i: number) => (
                <div key={i} className="p-3 rounded-md bg-[#1a1c22] border border-[#2a2e40]">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="text-xs font-bold text-ivory-200 capitalize">{approach.approach?.replace(/_/g, ' ')}</div>
                    <span className={`badge text-2xs ${approach.supports_position === 'petitioner' ? 'badge-blue' : approach.supports_position === 'respondent' ? 'badge-amber' : 'badge-gray'}`}>
                      {approach.supports_position}
                    </span>
                  </div>
                  <p className="text-xs text-charcoal-300 leading-relaxed">{approach.analysis}</p>
                </div>
              ))}
              {((interpretation as any).bench_observations || []).map((obs: string, i: number) => (
                <div key={i} className="p-3 rounded-md bg-gold-500/5 border border-gold-500/20">
                  <div className="text-2xs font-semibold text-gold-400 mb-1">SIMULATED BENCH OBSERVATION</div>
                  <p className="text-xs text-gold-100 italic">{obs.replace('SIMULATED BENCH OBSERVATION: ', '')}</p>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-2 border-t border-[#1e2130]">
                <div className="text-2xs text-charcoal-500">Strength for your position:</div>
                <div className={`text-sm font-bold ${(interpretation as any).strength_for_user >= 70 ? 'text-legal-green' : 'text-gold-400'}`}>
                  {(interpretation as any).strength_for_user}/100
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
