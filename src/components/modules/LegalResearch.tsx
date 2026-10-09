'use client'

import { useState, useEffect } from 'react'
import { useMootStore } from '@/store/mootStore'
import { legalResearch } from '@/lib/gemini'
import { Search, Loader2, BookOpen, AlertTriangle, ExternalLink, BookmarkPlus, CheckCircle } from 'lucide-react'
import { usePersistentState } from '@/lib/usePersistentState'

const SUGGESTED_QUERIES = [
  'Find recent Supreme Court cases on exclusion of Article 32 jurisdiction when alternative remedy exists',
  'Cases on natural justice and dismissal without enquiry under Article 311',
  'Constitutional validity of national security exception to audi alteram partem',
  'Is right to livelihood a fundamental right under Article 21? Recent authorities',
  'Basic structure doctrine and judicial review — binding Supreme Court authority',
]

export default function LegalResearch() {
  const { activeCase, globalSearchQuery, setGlobalSearchQuery } = useMootStore()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [sources, setSources] = useState<{ uri: string; title: string }[]>([])
  const [error, setError] = useState<string | null>(null)
  const [searchHistory, setSearchHistory] = usePersistentState<string[]>('moot-research-history', [])
  const [savedToLib, setSavedToLib] = useState(false)

  // If global search query was submitted in header, run it automatically
  useEffect(() => {
    if (!globalSearchQuery?.trim()) return
    const q = globalSearchQuery
    setQuery(q)
    setGlobalSearchQuery('')
    runSearch(q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalSearchQuery])


  const runSearch = async (q: string) => {
    if (!q.trim()) return
    setLoading(true)
    setResult(null)
    setError(null)
    setSources([])
    setSavedToLib(false)
    try {
      const caseCtx = `Case: ${activeCase?.name || ''}. Issues: ${activeCase?.issues.map(i => i.title).join(', ') || ''}.`
      const response = await legalResearch(q, caseCtx)
      const text = response.text || 'No results returned.'
      setResult(text)
      const gs = (response as any).candidates?.[0]?.groundingMetadata?.groundingChunks || []
      setSources(gs.map((c: any) => ({ uri: c.web?.uri || '', title: c.web?.title || c.web?.uri || '' })).filter((s: any) => s.uri))
      setSearchHistory(prev => [q, ...prev.filter(h => h !== q).slice(0, 9)])
    } catch (e: any) {
      setError(e.message || 'Legal research failed. Please check Gemini API key.')
    }
    setLoading(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    runSearch(query)
  }

  const handleSaveToLibrary = () => {
    if (!result) return
    try {
      const existing = JSON.parse(localStorage.getItem('research-library') || '[]')
      const newItem = {
        id: crypto.randomUUID(),
        type: 'article',
        title: query.length > 60 ? query.substring(0, 60) + '…' : query,
        citation: 'Research Counsel AI Note',
        court: 'Supreme Court of India',
        year: new Date().getFullYear(),
        summary: result.substring(0, 250) + '…',
        tags: ['Research', 'Constitutional'],
        source: 'Research Counsel (Gemini Grounded)',
        addedAt: new Date().toISOString()
      }
      localStorage.setItem('research-library', JSON.stringify([newItem, ...existing]))
      setSavedToLib(true)
      setTimeout(() => setSavedToLib(false), 2500)
    } catch {}
  }

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-ivory-100">Research Counsel</h1>
        <p className="text-sm text-charcoal-400 mt-0.5">Authoritative Indian legal research powered by Google Gemini with live web grounding</p>
      </div>

      {/* Search */}
      <div className="card">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-500" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder='Ask a legal research question… e.g. "Find cases on Article 21 and right to livelihood"'
              className="w-full pl-10 input py-3"
            />
          </div>
          <button type="submit" disabled={loading || !query.trim()} className="btn-primary px-6">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Research
          </button>
        </form>

        {/* Suggested queries */}
        <div className="mt-4 pt-3 border-t border-[#1e2130]">
          <div className="text-2xs text-charcoal-500 uppercase tracking-wider mb-2">Suggested Research Queries</div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUERIES.map(sq => (
              <button
                key={sq}
                onClick={() => { setQuery(sq); runSearch(sq) }}
                className="text-xs text-charcoal-400 hover:text-gold-300 bg-[#1a1c22] border border-[#2a2e40] rounded px-2.5 py-1 text-left transition-colors"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="alert-critical">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          <div className="card space-y-3 border-gold-600/20">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2130]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gold-400" />
                <h3 className="font-semibold text-ivory-100 text-sm">Research Analysis</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveToLibrary}
                  className="btn-secondary text-2xs px-2.5 py-1 flex items-center gap-1.5"
                >
                  {savedToLib ? <CheckCircle className="w-3.5 h-3.5 text-legal-green" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                  {savedToLib ? 'Saved to Library!' : 'Save to Library'}
                </button>
                <div className="badge badge-green text-2xs">Live Grounded</div>
              </div>
            </div>
            <div className="prose prose-sm max-w-none">
              <div className="text-sm text-ivory-200 leading-relaxed whitespace-pre-wrap">{result}</div>
            </div>
          </div>

          {/* Legal safety note */}
          <div className="flex items-start gap-3 p-3 rounded-md bg-[#1a1508] border border-gold-600/20 text-xs text-charcoal-400">
            <AlertTriangle className="w-3.5 h-3.5 text-gold-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-gold-300">Citation Integrity Rule:</strong> Confirm cited paragraph numbers and bench strength against the official Supreme Court Reports (SCR) or SCC Online index before relying on them in oral rounds.
            </div>
          </div>

          {/* Sources */}
          {sources.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-ivory-200 mb-3">Grounding Sources Retrieved</h3>
              <div className="space-y-2">
                {sources.map((s, i) => (
                  <a
                    key={i}
                    href={s.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2.5 rounded-md bg-[#1a1c22] border border-[#2a2e40] hover:border-gold-600/30 transition-colors group"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-charcoal-500 group-hover:text-gold-400 flex-shrink-0" />
                    <span className="text-xs text-charcoal-300 group-hover:text-ivory-200 truncate">{s.title || s.uri}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search history */}
      {searchHistory.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-ivory-200 mb-3">Recent Searches</h3>
          <div className="space-y-1">
            {searchHistory.map((h, i) => (
              <button
                key={i}
                onClick={() => { setQuery(h); runSearch(h) }}
                className="w-full text-left text-xs text-charcoal-400 hover:text-ivory-200 py-1.5 px-2 rounded hover:bg-[#1e2130] transition-colors"
              >
                {h}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
