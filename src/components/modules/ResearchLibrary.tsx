'use client'
import { useState } from 'react'
import { Search, BookOpen, FileText, Scale, Upload, Loader2, Trash2, AlertTriangle, Plus } from 'lucide-react'
import { extractFileText, ACCEPT_ATTR } from '@/lib/fileExtract'
import { briefJudgment } from '@/lib/gemini'
import { usePersistentState } from '@/lib/usePersistentState'

type ItemType = 'judgment' | 'statute' | 'article'
interface LibraryItem {
  id: string; type: ItemType; title: string; citation: string; court: string
  year: number | null; summary: string; tags: string[]; source: string; addedAt: string
}

const TYPE_ICONS = { judgment: BookOpen, statute: Scale, article: FileText }
const TYPE_COLORS = { judgment: 'badge-blue', statute: 'badge-gold', article: 'badge-gray' }

export default function ResearchLibrary() {
  const [items, setItems] = usePersistentState<LibraryItem[]>('research-library', [])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<ItemType | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showManual, setShowManual] = useState(false)
  const [manual, setManual] = useState({ title: '', citation: '', type: 'judgment' as ItemType, tags: '' })

  const filtered = items.filter(item => {
    const q = search.toLowerCase()
    const matchSearch = !q || item.title.toLowerCase().includes(q) || item.citation.toLowerCase().includes(q)
      || item.summary.toLowerCase().includes(q) || item.tags.some(t => t.toLowerCase().includes(q))
    return matchSearch && (!filterType || item.type === filterType)
  })

  const handleUpload = async (files: File[]) => {
    setError(null); setBusy(true)
    for (const f of files) {
      try {
        const { text } = await extractFileText(f)
        if (!text.trim()) throw new Error(`No readable text found in ${f.name}`)
        const b = await briefJudgment(text)
        setItems(prev => [{
          id: crypto.randomUUID(), type: 'judgment', title: b.name, citation: b.cite, court: b.court,
          year: b.year, summary: b.holding, tags: b.issues?.slice(0, 4) || [], source: f.name, addedAt: new Date().toISOString(),
        }, ...prev])
      } catch (e) {
        setError(e instanceof Error ? e.message : `Could not process ${f.name}`)
      }
    }
    setBusy(false)
  }

  const addManual = () => {
    if (!manual.title.trim()) return
    setItems(prev => [{
      id: crypto.randomUUID(), type: manual.type, title: manual.title.trim(), citation: manual.citation.trim(), court: '',
      year: null, summary: '', tags: manual.tags.split(',').map(t => t.trim()).filter(Boolean), source: 'Added manually', addedAt: new Date().toISOString(),
    }, ...prev])
    setManual({ title: '', citation: '', type: 'judgment', tags: '' })
    setShowManual(false)
  }

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div><h1 className="text-xl font-bold text-ivory-100">Research Library</h1>
          <p className="text-sm text-charcoal-400 mt-0.5">Your case authorities, statutes, and articles in one place</p></div>
        <div className="flex gap-2">
          <button onClick={() => setShowManual(s => !s)} className="btn-secondary text-xs px-3"><Plus className="w-4 h-4" /> Add manually</button>
          <label className={`btn-secondary text-xs px-3 cursor-pointer ${busy ? 'opacity-60 pointer-events-none' : ''}`}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload document
            <input type="file" multiple className="hidden" accept={ACCEPT_ATTR}
              onChange={e => { handleUpload(Array.from(e.target.files || [])); e.target.value = '' }} />
          </label>
        </div>
      </div>

      {showManual && (
        <div className="card space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input className="input" placeholder="Title" value={manual.title} onChange={e => setManual(m => ({ ...m, title: e.target.value }))} />
            <input className="input" placeholder="Citation (optional)" value={manual.citation} onChange={e => setManual(m => ({ ...m, citation: e.target.value }))} />
            <select className="input" value={manual.type} onChange={e => setManual(m => ({ ...m, type: e.target.value as ItemType }))}>
              <option value="judgment">Judgment</option><option value="statute">Statute</option><option value="article">Article</option>
            </select>
            <input className="input" placeholder="Tags, comma separated" value={manual.tags} onChange={e => setManual(m => ({ ...m, tags: e.target.value }))} />
          </div>
          <button onClick={addManual} disabled={!manual.title.trim()} className="btn-primary text-xs">Save to library</button>
        </div>
      )}

      {error && <div className="alert-critical"><AlertTriangle className="w-4 h-4" />{error}</div>}

      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title, citation, or tag…" className="input pl-10 w-full" />
        </div>
        {(['judgment', 'statute', 'article'] as ItemType[]).map(type => (
          <button key={type} onClick={() => setFilterType(filterType === type ? null : type)}
            className={`btn-secondary text-xs px-3 capitalize ${filterType === type ? 'border-gold-500/50 text-gold-200' : ''}`}>{type}s</button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filtered.map(item => {
          const Icon = TYPE_ICONS[item.type]
          return (
            <div key={item.id} className="card-hover">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0 bg-navy-700/50 border border-navy-600/30">
                  <Icon className="w-4 h-4 text-navy-200" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h3 className="text-sm font-semibold text-ivory-100 leading-snug">{item.title}</h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`badge ${TYPE_COLORS[item.type]} text-2xs capitalize`}>{item.type}</span>
                      <button onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))} aria-label="Remove from library" className="btn-ghost p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-2 text-xs text-charcoal-400 flex-wrap">
                    {item.citation && <span className="font-mono">{item.citation}</span>}
                    {item.year && <span>· {item.year}</span>}
                    {item.court && <span>· {item.court}</span>}
                    <span>· {item.source}</span>
                  </div>
                  {item.summary && <p className="text-xs text-charcoal-300 mb-2">{item.summary}</p>}
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
        <div className="text-sm text-charcoal-500">
          {items.length === 0 ? 'Your library is empty — upload a judgment (PDF, DOCX, TXT or image) or add an item manually.' : `${filtered.length} of ${items.length} items`}
        </div>
      </div>
    </div>
  )
}
