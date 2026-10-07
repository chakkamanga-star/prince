'use client'
import { useState } from 'react'
import { Upload, FileText, CheckCircle, AlertTriangle, ChevronDown, ChevronRight, BookOpen, Scale, Gavel, Star, Loader2 } from 'lucide-react'
import { extractFileText, ACCEPT_ATTR } from '@/lib/fileExtract'
import { briefJudgment } from '@/lib/gemini'

const SAMPLE_CASES = [
  { id: 'c1', name: 'L. Chandra Kumar v. Union of India', cite: '(1997) 3 SCC 261', court: 'Supreme Court of India', bench: 7, year: 1997, binding: true, ratioObiter: 'ratio', status: 'good', precedentialStrength: 95, argumentAlignment: 88, supports: 'petitioner', holding: 'Article 226 and 227 jurisdiction of High Courts is a part of basic structure. Administrative Tribunals are subject to judicial oversight.', ratio: 'Tribunals cannot exclude judicial review entirely; High Courts and Supreme Court retain supervisory jurisdiction as a basic structure feature.' },
  { id: 'c2', name: 'S.P. Sampath Kumar v. Union of India', cite: '(1987) 1 SCC 124', court: 'Supreme Court of India', bench: 5, year: 1987, binding: true, ratioObiter: 'ratio', status: 'distinguished', precedentialStrength: 72, argumentAlignment: 45, supports: 'respondent', holding: 'Administrative Tribunals Act is constitutionally valid. Tribunals are an effective alternative to High Courts.', ratio: 'Parliament can validly create alternative fora; exclusion of High Court jurisdiction is permissible within limits.' },
  { id: 'c3', name: 'Whirlpool Corporation v. Registrar of Trade Marks', cite: '(1998) 8 SCC 1', court: 'Supreme Court of India', bench: 3, year: 1998, binding: true, ratioObiter: 'ratio', status: 'good', precedentialStrength: 88, argumentAlignment: 76, supports: 'petitioner', holding: 'Alternative remedy is not an absolute bar to writ jurisdiction — exceptions exist where fundamental rights are infringed or the order is without jurisdiction.', ratio: 'Alternative remedy rule is a rule of convenience; writ jurisdiction survives where fundamental rights are directly infringed.' },
]

export default function CaseLawStudio() {
  const [expandedCase, setExpandedCase] = useState<string | null>('c1')
  const [activeTab, setActiveTab] = useState<'brief'|'compare'|'precedent'>('brief')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadedBriefs, setUploadedBriefs] = useState<(Awaited<ReturnType<typeof briefJudgment>> & { file: string })[]>([])

  const handleUpload = async (files: File[]) => {
    setUploadError(null)
    setUploading(true)
    setActiveTab('brief')
    for (const f of files) {
      try {
        const { text } = await extractFileText(f)
        if (!text.trim()) throw new Error(`No readable text found in ${f.name}`)
        const brief = await briefJudgment(text)
        setUploadedBriefs(prev => [{ ...brief, file: f.name }, ...prev])
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : `Could not process ${f.name}`)
      }
    }
    setUploading(false)
  }

  const uploadButton = (cls: string) => (
    <label className={`${cls} cursor-pointer ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload Judgment
      <input type="file" multiple className="hidden" accept={ACCEPT_ATTR}
        onChange={e => { handleUpload(Array.from(e.target.files || [])); e.target.value = '' }} />
    </label>
  )

  const riskColors: Record<string, string> = { good: 'badge-green', distinguished: 'badge-amber', overruled: 'badge-red', doubted: 'badge-amber' }

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ivory-100">Case Law Brief Studio</h1>
          <p className="text-sm text-charcoal-400 mt-0.5">Upload and analyse judgments — extract ratio, holding, and precedential strength</p>
        </div>
        {uploadButton('btn-secondary')}
      </div>

      <div className="flex gap-1 bg-[#13151c] border border-[#1e2130] rounded-lg p-1">
        {[{id:'brief',label:'Case Briefs'},{id:'compare',label:'Compare'},{id:'precedent',label:'Precedent Matrix'}].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${activeTab === t.id ? 'bg-[#1e2130] text-ivory-100' : 'text-charcoal-400'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'brief' && (
        <div className="space-y-3">
          {uploadError && <div className="alert-critical"><AlertTriangle className="w-4 h-4" />{uploadError}</div>}
          {uploadedBriefs.map((b, i) => (
            <div key={i} className="card border border-gold-600/30">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-ivory-100">{b.name}</span>
                <span className="badge badge-gold text-2xs">Uploaded</span>
                <span className="text-xs text-charcoal-500">{b.file}</span>
              </div>
              <div className="text-xs text-charcoal-400 mt-1">{b.cite} · {b.court}{b.year ? ` · ${b.year}` : ''}</div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div><div className="text-2xs text-charcoal-500 uppercase tracking-wider mb-1">Facts</div><p className="text-sm text-ivory-300">{b.facts}</p></div>
                <div><div className="text-2xs text-charcoal-500 uppercase tracking-wider mb-1">Issues</div><ul className="text-sm text-ivory-300 list-disc pl-4">{(b.issues || []).map((s, j) => <li key={j}>{s}</li>)}</ul></div>
                <div><div className="text-2xs text-charcoal-500 uppercase tracking-wider mb-1">Holding</div><p className="text-sm text-ivory-300">{b.holding}</p></div>
                <div><div className="text-2xs text-charcoal-500 uppercase tracking-wider mb-1">Ratio Decidendi</div><p className="text-sm text-ivory-300">{b.ratio}</p></div>
              </div>
            </div>
          ))}
          {SAMPLE_CASES.map(c => (
            <div key={c.id} className="card border border-[#2a2e40]">
              <button onClick={() => setExpandedCase(expandedCase === c.id ? null : c.id)} className="w-full flex items-start gap-4 text-left">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-ivory-100">{c.name}</span>
                    <span className={`badge ${riskColors[c.status]} text-2xs capitalize`}>{c.status}</span>
                    {c.binding && <span className="badge badge-gold text-2xs">Binding</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-charcoal-400">
                    <span>{c.cite}</span><span>·</span><span>{c.court}</span><span>·</span><span>{c.bench}J</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-2xs text-charcoal-500">Precedential</div>
                    <div className={`text-sm font-bold ${c.precedentialStrength >= 80 ? 'text-legal-green' : 'text-gold-400'}`}>{c.precedentialStrength}/100</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xs text-charcoal-500">Supports</div>
                    <div className="text-sm font-bold text-ivory-200 capitalize">{c.supports}</div>
                  </div>
                  {expandedCase === c.id ? <ChevronDown className="w-4 h-4 text-charcoal-500" /> : <ChevronRight className="w-4 h-4 text-charcoal-500" />}
                </div>
              </button>
              {expandedCase === c.id && (
                <div className="mt-4 pt-4 border-t border-[#2a2e40] space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xs text-charcoal-500 uppercase tracking-wider mb-1.5">Holding</div>
                      <p className="text-sm text-ivory-300 leading-relaxed">{c.holding}</p>
                    </div>
                    <div>
                      <div className="text-2xs text-charcoal-500 uppercase tracking-wider mb-1.5">Ratio Decidendi</div>
                      <p className="text-sm text-ivory-300 leading-relaxed">{c.ratio}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <div className="text-2xs text-charcoal-500 uppercase tracking-wider mb-1">Precedential Strength</div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-[#1e2130] rounded-full overflow-hidden">
                          <div className="h-full bg-legal-green rounded-full" style={{ width: `${c.precedentialStrength}%` }} />
                        </div>
                        <span className="text-sm font-bold text-legal-green">{c.precedentialStrength}/100</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-2xs text-charcoal-500 uppercase tracking-wider mb-1">Argument Alignment</div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-[#1e2130] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${c.argumentAlignment >= 70 ? 'bg-legal-green' : 'bg-gold-400'}`} style={{ width: `${c.argumentAlignment}%` }} />
                        </div>
                        <span className={`text-sm font-bold ${c.argumentAlignment >= 70 ? 'text-legal-green' : 'text-gold-400'}`}>{c.argumentAlignment}/100</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-secondary text-xs">Add to Memorial</button>
                    <button className="btn-secondary text-xs">Add to Argument</button>
                    <button className="btn-secondary text-xs">Verify Citation</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'compare' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#2a2e40]">
                {['Case','Court','Bench','Ratio','Supports','Status','Prec. Strength'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-charcoal-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SAMPLE_CASES.map(c => (
                <tr key={c.id} className="border-b border-[#1e2130] hover:bg-[#1a1c22] transition-colors">
                  <td className="py-3 px-3 font-medium text-ivory-200">{c.name.split(' v. ')[0]}…</td>
                  <td className="py-3 px-3 text-charcoal-400">SC India</td>
                  <td className="py-3 px-3 text-charcoal-400">{c.bench}J</td>
                  <td className="py-3 px-3"><span className="badge badge-gold capitalize">{c.ratioObiter}</span></td>
                  <td className="py-3 px-3 capitalize">{c.supports}</td>
                  <td className="py-3 px-3"><span className={`badge ${riskColors[c.status]} capitalize`}>{c.status}</span></td>
                  <td className="py-3 px-3 font-bold text-legal-green">{c.precedentialStrength}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'precedent' && (
        <div className="card text-center py-12">
          <Gavel className="w-10 h-10 text-charcoal-600 mx-auto mb-3" />
          <div className="text-sm font-semibold text-ivory-200">Precedent Matrix</div>
          <div className="text-xs text-charcoal-500 mt-1 max-w-xs mx-auto">Upload more judgments to generate a visual precedent relationship graph showing followed, distinguished, overruled, and approved connections.</div>
          {uploadButton('btn-secondary mt-4')}
        </div>
      )}
    </div>
  )
}
