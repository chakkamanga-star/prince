'use client'

import { useState } from 'react'
import { useMootStore } from '@/store/mootStore'
import { legalResearch } from '@/lib/gemini'
import { Search, Loader2, BookOpen, AlertTriangle, ExternalLink, ChevronDown, Zap } from 'lucide-react'

const SUGGESTED_QUERIES = [
  'Find recent Supreme Court cases on exclusion of Article 32 jurisdiction when alternative remedy exists',
  'Cases on natural justice and dismissal without enquiry under Article 311',
  'Constitutional validity of national security exception to audi alteram partem',
  'Is right to livelihood a fundamental right under Article 21? Recent authorities',
  'Basic structure doctrine and judicial review — binding Supreme Court authority',
]

export default function LegalResearch() {
  const { activeCase } = useMootStore()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [sources, setSources] = useState<{uri: string; title: string}[]>([])
  const [error, setError] = useState<string | null>(null)
  const [searchHistory, setSearchHistory] = useState<string[]>([])

  const runSearch = async (q: string) => {
    if (!q.trim()) return
    setLoading(true)
    setResult(null)
    setError(null)
    setSources([])
    try {
      const caseCtx = `Case: ${activeCase?.name}. Issues: ${activeCase?.issues.map(i => i.title).join(', ')}.`
      const response = await legalResearch(q, caseCtx)
      const text = response.text || 'No results returned.'
      setResult(text)
      // Extract grounding sources if available
      const gs = (response as any).candidates?.[0]?.groundingMetadata?.groundingChunks || []
      setSources(gs.map((c: any) => ({ uri: c.web?.uri || '', title: c.web?.title || c.web?.uri || '' })).filter((s: any) => s.uri))
      setSearchHistory(prev => [q, ...prev.filter(h => h !== q).slice(0, 9)])
    } catch (e: any) {
      setError(e.message || 'Research failed. Please try again.')
    }
    setLoading(false)
  }

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); runSearch(query) }

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-ivory-100">Research Counsel</h1>
        <p className="text-sm text-charcoal-400 mt-0.5">AI-powered legal research with Google Search grounding</p>
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
        <div className="mt-4">
          <div className="text-2xs text-charcoal-500 uppercase tracking-wider mb-2">Suggested Queries for Your Case</div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUERIES.map(q => (
              <button key={q} onClick={() => { setQuery(q); runSearch(q) }}
                className="text-xs bg-[#1a1c22] border border-[#2a2e40] hover:border-gold-600/40 text-charcoal-300 hover:text-ivory-200 rounded-md px-3 py-1.5 transition-colors text-left">
                <Zap className="w-3 h-3 inline mr-1 text-gold-500" />{q.substring(0, 70)}…
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="card">
          <div className="flex items-center gap-3 text-charcoal-400">
            <Loader2 className="w-5 h-5 animate-spin text-gold-400" />
            <div>
              <div className="text-sm font-medium text-ivory-200">Searching live legal sources…</div>
              <div className="text-xs text-charcoal-500 mt-0.5">Querying Supreme Court databases · Google Search grounding active</div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && <div className="alert-critical"><AlertTriangle className="w-4 h-4" />{error}</div>}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 text-gold-400" />
              <h3 className="section-title text-base">Research Analysis</h3>
              <div className="ml-auto badge badge-green">Google Search Grounded</div>
            </div>
            <div className="prose prose-sm max-w-none">
              <div className="text-sm text-ivory-200 leading-relaxed whitespace-pre-wrap">{result}</div>
            </div>
          </div>

          {/* Legal safety note */}
          <div className="flex items-start gap-3 p-3 rounded-md bg-[#1a1508] border border-gold-600/20 text-xs text-charcoal-400">
            <AlertTriangle className="w-3.5 h-3.5 text-gold-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-gold-300">Citation Integrity Notice:</strong> All case references must be independently verified before relying on them.
              AI-generated citations must be checked against primary sources. Use the Citation Auditor module.
            </div>
          </div>

          {/* Sources */}
          {sources.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-ivory-200 mb-3">Sources Retrieved</h3>
              <div className="space-y-2">
                {sources.map((s, i) => (
                  <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2.5 rounded-md bg-[#1a1c22] border border-[#2a2e40] hover:border-gold-600/30 transition-colors group">
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
              <button key={i} onClick={() => { setQuery(h); runSearch(h) }}
                className="w-full text-left text-xs text-charcoal-400 hover:text-ivory-200 py-1.5 px-2 rounded hover:bg-[#1e2130] transition-colors">
                {h}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
