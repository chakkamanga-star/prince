'use client'
import { useState } from 'react'
import { Library, Search, BookOpen, FileText, Scale, Filter } from 'lucide-react'

const LIBRARY_ITEMS = [
  { id: 'l1', type: 'judgment', title: 'L. Chandra Kumar v. Union of India', citation: '(1997) 3 SCC 261', tags: ['Art.32', 'Basic Structure', 'Tribunals', 'Judicial Review'], year: 1997, court: 'Supreme Court', bench: 7, category: 'Constitutional', status: 'Verified', saved: true },
  { id: 'l2', type: 'judgment', title: 'Whirlpool Corporation v. Registrar of Trade Marks', citation: '(1998) 8 SCC 1', tags: ['Alternative Remedy', 'Writ Jurisdiction', 'Art.226'], year: 1998, court: 'Supreme Court', bench: 3, category: 'Constitutional', status: 'Verified', saved: true },
  { id: 'l3', type: 'statute', title: 'Administrative Tribunals Act, 1985', citation: 'Act No. 13 of 1985', tags: ['Tribunals', 'Alternative Remedy', 'CAT'], year: 1985, court: null, bench: null, category: 'Statute', status: 'Official', saved: true },
  { id: 'l4', type: 'article', title: 'Natural Justice in Indian Administrative Law', citation: 'JILI Vol. 40', tags: ['Natural Justice', 'Audi Alteram Partem', 'Art.21'], year: 2022, court: null, bench: null, category: 'Academic', status: 'Unverified', saved: false },
  { id: 'l5', type: 'judgment', title: 'Olga Tellis v. Bombay Municipal Corporation', citation: '1985 SCR (3) 1', tags: ['Art.21', 'Right to Livelihood', 'Fundamental Rights'], year: 1985, court: 'Supreme Court', bench: 5, category: 'Constitutional', status: 'Verified', saved: true },
]

const TYPE_ICONS = { judgment: BookOpen, statute: Scale, article: FileText }
const TYPE_COLORS = { judgment: 'badge-blue', statute: 'badge-gold', article: 'badge-gray' }

export default function ResearchLibrary() {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string | null>(null)

  const filtered = LIBRARY_ITEMS.filter(item => {
    const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) || item.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    const matchType = !filterType || item.type === filterType
    return matchSearch && matchType
  })

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-ivory-100">Research Library</h1>
          <p className="text-sm text-charcoal-400 mt-0.5">All case authorities, statutes, and articles in one place</p></div>
        <div className="flex gap-2">
          {['judgment', 'statute', 'article'].map(type => (
            <button key={type} onClick={() => setFilterType(filterType === type ? null : type)}
              className={`btn-secondary text-xs px-3 capitalize ${filterType === type ? 'border-gold-500/50 text-gold-200' : ''}`}>
              {type}s
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title, citation, or tag…" className="input pl-10 w-full" />
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filtered.map(item => {
          const Icon = TYPE_ICONS[item.type as keyof typeof TYPE_ICONS] || BookOpen
          return (
            <div key={item.id} className="card-hover">
              <div className="flex items-start gap-4">
                <div className={`flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0 ${item.type === 'judgment' ? 'bg-navy-700/50 border-navy-600/30' : item.type === 'statute' ? 'bg-gold-500/10 border-gold-500/20' : 'bg-charcoal-700/30 border-charcoal-600/20'} border`}>
                  <Icon className={`w-4 h-4 ${item.type === 'judgment' ? 'text-navy-200' : item.type === 'statute' ? 'text-gold-400' : 'text-charcoal-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h3 className="text-sm font-semibold text-ivory-100 leading-snug">{item.title}</h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`badge ${TYPE_COLORS[item.type as keyof typeof TYPE_COLORS]} text-2xs capitalize`}>{item.type}</span>
                      <span className={`badge text-2xs ${item.status === 'Verified' ? 'badge-green' : item.status === 'Official' ? 'badge-blue' : 'badge-amber'}`}>{item.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-2 text-xs text-charcoal-400">
                    <span className="font-mono">{item.citation}</span>
                    {item.year && <span>· {item.year}</span>}
                    {item.court && <span>· {item.court}</span>}
                    {item.bench && <span>· {item.bench}J</span>}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map(t => <span key={t} className="text-2xs bg-[#1e2130] border border-[#2a2e40] text-charcoal-300 rounded px-2 py-0.5">{t}</span>)}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="text-center py-4">
        <div className="text-sm text-charcoal-500">{filtered.length} items · Upload documents to add more</div>
      </div>
    </div>
  )
}
