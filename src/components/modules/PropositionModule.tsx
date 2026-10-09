'use client'

import { useState, useCallback } from 'react'
import { useMootStore } from '@/store/mootStore'
import { Upload, FileText, CheckCircle, AlertTriangle, Loader2, ChevronDown, ChevronRight, Gavel, Scale, BookOpen, X } from 'lucide-react'
import { deconstructProposition } from '@/lib/gemini'
import { extractFileText, ACCEPT_ATTR, MAX_FILE_BYTES } from '@/lib/fileExtract'
import type { ActiveCase, Issue, Fact } from '@/store/mootStore'

type Stage = 'upload' | 'processing' | 'review' | 'applied'

interface UploadedFile {
  name: string
  type: string
  size: string
  text: string
  status: 'reading' | 'ready' | 'error'
}

// Map the AI deconstruction JSON to an ActiveCase object
function mapDeconstructedToCase(d: Record<string, any>, currentCase: ActiveCase | null): ActiveCase {
  const issues: Issue[] = (d.issues || []).map((iss: any, idx: number) => ({
    id: `issue-${Date.now()}-${idx}`,
    number: iss.number || idx + 1,
    title: iss.title || `Issue ${idx + 1}`,
    statement: iss.statement || '',
    petitionerPosition: iss.petitioner_position || 'Not stated',
    respondentPosition: iss.respondent_position || 'Not stated',
    subIssues: Array.isArray(iss.sub_issues) ? iss.sub_issues : [],
    relevantStatutes: Array.isArray(iss.relevant_statutes) ? iss.relevant_statutes : [],
    constitutionalArticles: Array.isArray(iss.constitutional_articles) ? iss.constitutional_articles : [],
  }))

  const admittedFacts: Fact[] = (d.admitted_facts || []).map((desc: string, idx: number) => ({
    id: `fact-admitted-${idx}`,
    factId: `F-${String(idx + 1).padStart(3, '0')}`,
    description: desc,
    status: 'admitted' as const,
    legalRelevance: 'To be assessed',
    sourceParagraph: '',
  }))
  const disputedFacts: Fact[] = (d.disputed_facts || []).map((desc: string, idx: number) => ({
    id: `fact-disputed-${idx}`,
    factId: `F-D${String(idx + 1).padStart(3, '0')}`,
    description: desc,
    status: 'disputed' as const,
    legalRelevance: 'To be assessed',
    sourceParagraph: '',
  }))

  const petitioner = d.parties?.petitioner || 'Petitioner'
  const respondent = d.parties?.respondent || 'Respondent'

  return {
    id: `case-${Date.now()}`,
    name: `${petitioner} v. ${respondent}`,
    competitionName: d.competition_name || 'Moot Court Competition',
    competitionDate: currentCase?.competitionDate || new Date().toISOString().slice(0, 10),
    side: 'petitioner',
    activeSide: 'petitioner',
    memorialDeadline: currentCase?.memorialDeadline || '',
    oralRoundDate: currentCase?.oralRoundDate || '',
    daysRemaining: currentCase?.daysRemaining || 0,
    preparationStage: 'research',
    readinessScore: 10,
    issues,
    facts: [...admittedFacts, ...disputedFacts],
    rules: currentCase?.rules || null,
    proposition: d._rawText || '',
  }
}

export default function PropositionModule() {
  const { activeCase, setActiveCase, setActiveModule } = useMootStore()
  const [stage, setStage] = useState<Stage>('upload')
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [deconstructed, setDeconstructed] = useState<Record<string, any> | null>(null)
  const [processing, setProcessing] = useState(false)
  const [expandedIssue, setExpandedIssue] = useState<number | null>(0)
  const [error, setError] = useState<string | null>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(Array.from(e.dataTransfer.files))
  }, [])

  const handleFiles = async (files: File[]) => {
    setError(null)
    for (const f of files) {
      if (f.size > MAX_FILE_BYTES) {
        setError(`${f.name} is too large (max 10 MB). Please compress or split the PDF.`)
        continue
      }
      const base: UploadedFile = {
        name: f.name,
        type: f.name.split('.').pop()?.toUpperCase() || 'FILE',
        size: `${(f.size / 1024).toFixed(0)} KB`,
        text: '',
        status: 'reading',
      }
      setUploadedFiles(prev => [...prev, base])
      try {
        const { kind, text } = await extractFileText(f)
        setUploadedFiles(prev =>
          prev.map(x => x.name === f.name && x.status === 'reading' ? { ...x, type: kind, text, status: 'ready' } : x)
        )
      } catch (e) {
        setUploadedFiles(prev =>
          prev.map(x => x.name === f.name && x.status === 'reading' ? { ...x, status: 'error' } : x)
        )
        setError(e instanceof Error ? e.message : `Could not read ${f.name}`)
      }
    }
  }

  const handleDeconstruct = async () => {
    setProcessing(true)
    setError(null)
    try {
      const uploadedText = uploadedFiles
        .filter(f => f.status === 'ready')
        .map(f => `--- ${f.name} ---\n${f.text}`)
        .join('\n\n')
      const text = uploadedText || activeCase?.proposition || 'Please upload a proposition document.'
      const result = await deconstructProposition(text)
      // Attach raw text so mapDeconstructedToCase can store it
      result._rawText = text
      setDeconstructed(result)
      setStage('review')
    } catch (e: any) {
      setError(e?.message || 'Deconstruction failed. Please try again.')
    }
    setProcessing(false)
  }

  const handleApplyActiveCase = () => {
    if (!deconstructed) return
    const newCase = mapDeconstructedToCase(deconstructed, activeCase)
    setActiveCase(newCase)
    setStage('applied')
    setTimeout(() => setActiveModule('planner'), 1500)
  }

  const removeFile = (name: string) =>
    setUploadedFiles(prev => prev.filter(f => f.name !== name))

  const docTypes = [
    { label: 'Moot Proposition', icon: FileText, required: true },
    { label: 'Competition Brochure', icon: BookOpen, required: true },
    { label: 'Rules PDF', icon: Scale, required: false },
    { label: 'Memorial Guidelines', icon: Gavel, required: false },
    { label: 'Evaluation Criteria', icon: CheckCircle, required: false },
    { label: 'Clarifications / Addenda', icon: AlertTriangle, required: false },
  ]

  const d = deconstructed as any

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ivory-100">Proposition &amp; Brochure</h1>
          <p className="text-sm text-charcoal-400 mt-0.5">Upload your moot documents. The AI will deconstruct the proposition and extract all rules.</p>
        </div>
        {stage === 'review' && (
          <div className="flex gap-2">
            <button onClick={handleDeconstruct} disabled={processing} className="btn-secondary">
              <FileText className="w-4 h-4" /> Redeconstruct
            </button>
            <button onClick={handleApplyActiveCase} className="btn-primary">
              <Gavel className="w-4 h-4" /> Apply as Active Case
            </button>
          </div>
        )}
      </div>

      {stage === 'applied' && (
        <div className="alert-success">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <div className="font-semibold">Active Case Updated</div>
            <div className="text-sm opacity-80">All modules now inherit this case's rules. Redirecting to Moot Date Planner…</div>
          </div>
        </div>
      )}

      {/* Upload area */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 cursor-pointer ${
          isDragging ? 'border-gold-400 bg-gold-500/5' : 'border-[#2a2e40] hover:border-[#3a3e50] bg-[#13151c]'
        }`}
        onClick={() => document.getElementById('file-input-prop')?.click()}
      >
        <input id="file-input-prop" type="file" multiple className="hidden" accept={ACCEPT_ATTR}
          onChange={e => { handleFiles(Array.from(e.target.files || [])); e.target.value = '' }} />
        <Upload className={`w-10 h-10 mx-auto mb-4 ${isDragging ? 'text-gold-400' : 'text-charcoal-600'}`} />
        <div className="text-base font-semibold text-ivory-200 mb-1">
          Drag &amp; drop your moot documents here
        </div>
        <div className="text-sm text-charcoal-500">
          Supports PDF, DOCX, TXT, PNG, JPG · PDFs up to 10 MB · Scanned docs are OCR-processed
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {['Proposition', 'Brochure', 'Rules', 'Memorial Guidelines', 'Clarifications'].map(t => (
            <span key={t} className="badge badge-gray">{t}</span>
          ))}
        </div>
      </div>

      {/* Document type checklist */}
      <div className="card">
        <h3 className="section-title text-base mb-4">Document Checklist</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {docTypes.map(doc => {
            const Icon = doc.icon
            const uploaded = uploadedFiles.length > 0
            return (
              <div key={doc.label} className={`flex items-center gap-3 p-3 rounded-md border transition-colors ${
                uploaded ? 'border-legal-green/30 bg-legal-green/5' : 'border-[#2a2e40] bg-[#1a1c22]'
              }`}>
                <Icon className={`w-4 h-4 flex-shrink-0 ${uploaded ? 'text-legal-green' : 'text-charcoal-500'}`} />
                <div>
                  <div className="text-xs font-medium text-ivory-200">{doc.label}</div>
                  {doc.required && <div className="text-2xs text-charcoal-500">Required</div>}
                </div>
                {uploaded && <CheckCircle className="w-3.5 h-3.5 text-legal-green ml-auto" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Uploaded files */}
      {uploadedFiles.length > 0 && (
        <div className="card">
          <h3 className="section-title text-base mb-3">Uploaded Documents</h3>
          <div className="space-y-2">
            {uploadedFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-md bg-[#1a1c22] border border-[#2a2e40]">
                <FileText className="w-4 h-4 text-gold-400 flex-shrink-0" />
                <span className="text-sm text-ivory-200 flex-1 truncate">{f.name}</span>
                <span className="badge badge-gray">{f.type}</span>
                <span className="text-xs text-charcoal-500 flex-shrink-0">{f.size}</span>
                {f.status === 'reading'
                  ? <Loader2 className="w-4 h-4 animate-spin text-gold-400 flex-shrink-0" />
                  : f.status === 'error'
                  ? <AlertTriangle className="w-4 h-4 text-legal-red flex-shrink-0" />
                  : <CheckCircle className="w-4 h-4 text-legal-green flex-shrink-0" />}
                <button
                  onClick={() => removeFile(f.name)}
                  className="btn-ghost p-1 flex-shrink-0"
                  aria-label="Remove file"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={handleDeconstruct}
            disabled={processing || uploadedFiles.some(f => f.status === 'reading') || !uploadedFiles.some(f => f.status === 'ready')}
            className="btn-primary w-full mt-4 justify-center"
          >
            {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analysing documents…</> : 'Deconstruct Proposition'}
          </button>
        </div>
      )}

      {/* Demo mode */}
      {uploadedFiles.length === 0 && (
        <div className="card border-gold-600/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium text-ivory-200">Demo Mode Active</div>
              <div className="text-xs text-charcoal-400 mt-1">
                A demo case (Arjun Singh v. Union of India) is pre-loaded. You can deconstruct it to see the full analysis, or upload your own proposition.
              </div>
            </div>
            <button onClick={handleDeconstruct} disabled={processing} className="btn-secondary text-xs flex-shrink-0">
              {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Deconstruct Demo'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="alert-critical">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {processing && (
        <div className="card flex items-center gap-3 py-5">
          <Loader2 className="w-5 h-5 animate-spin text-gold-400 flex-shrink-0" />
          <div>
            <div className="text-sm font-semibold text-ivory-200">Analysing proposition…</div>
            <div className="text-xs text-charcoal-400 mt-0.5">This may take up to 60 seconds for large PDFs.</div>
          </div>
        </div>
      )}

      {/* Deconstruction results */}
      {d && stage === 'review' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 py-3 border-t border-[#1e2130]">
            <CheckCircle className="w-5 h-5 text-legal-green" />
            <h2 className="text-base font-bold text-ivory-100">Case Successfully Deconstructed</h2>
          </div>

          {/* Case metadata */}
          <div className="card">
            <h3 className="section-title text-sm mb-3">Case Metadata</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: 'Competition', value: d.competition_name || 'Not stated' },
                { label: 'Year', value: d.year || 'Not stated' },
                { label: 'Court', value: d.court || 'Not stated' },
                { label: 'Jurisdiction', value: d.jurisdiction || 'Not stated' },
                { label: 'Petitioner', value: d.parties?.petitioner || 'Not stated' },
                { label: 'Respondent', value: d.parties?.respondent || 'Not stated' },
                { label: 'Procedural Posture', value: d.procedural_posture || 'Not stated' },
                { label: 'Relief Sought', value: d.relief_sought || 'Not stated' },
              ].map(item => (
                <div key={item.label} className="p-2.5 rounded-md bg-[#1a1c22] border border-[#2a2e40]">
                  <div className="text-2xs text-charcoal-500 uppercase tracking-wider">{item.label}</div>
                  <div className="text-sm text-ivory-200 mt-0.5 font-medium">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Statutes & Provisions */}
          {((d.relevant_statutes?.length > 0) || (d.constitutional_provisions?.length > 0)) && (
            <div className="card">
              <h3 className="section-title text-sm mb-3">Applicable Law</h3>
              {d.relevant_statutes?.length > 0 && (
                <div className="mb-3">
                  <div className="text-2xs text-charcoal-500 uppercase tracking-wider mb-1.5">Statutes</div>
                  <div className="flex flex-wrap gap-1.5">
                    {d.relevant_statutes.map((s: string) => (
                      <span key={s} className="badge badge-blue">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {d.constitutional_provisions?.length > 0 && (
                <div>
                  <div className="text-2xs text-charcoal-500 uppercase tracking-wider mb-1.5">Constitutional Provisions</div>
                  <div className="flex flex-wrap gap-1.5">
                    {d.constitutional_provisions.map((p: string) => (
                      <span key={p} className="badge badge-gold">{p}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Admitted & Disputed Facts */}
          {((d.admitted_facts?.length > 0) || (d.disputed_facts?.length > 0)) && (
            <div className="card">
              <h3 className="section-title text-sm mb-3">Facts</h3>
              {d.admitted_facts?.length > 0 && (
                <div className="mb-3">
                  <div className="text-2xs text-charcoal-500 uppercase tracking-wider mb-1.5">Admitted Facts</div>
                  <ul className="space-y-1">
                    {d.admitted_facts.map((f: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-ivory-300">
                        <CheckCircle className="w-3.5 h-3.5 text-legal-green flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {d.disputed_facts?.length > 0 && (
                <div>
                  <div className="text-2xs text-charcoal-500 uppercase tracking-wider mb-1.5">Disputed Facts</div>
                  <ul className="space-y-1">
                    {d.disputed_facts.map((f: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-ivory-300">
                        <AlertTriangle className="w-3.5 h-3.5 text-gold-400 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Issues */}
          {d.issues?.length > 0 && (
            <div className="card">
              <h3 className="section-title text-sm mb-3">Issues Identified — {d.issues.length} Issues</h3>
              <div className="space-y-2">
                {d.issues.map((issue: any, i: number) => (
                  <div key={i} className="border border-[#2a2e40] rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedIssue(expandedIssue === i ? null : i)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-[#1a1c22] transition-colors text-left"
                    >
                      <div className="w-6 h-6 rounded-full bg-navy-800 border border-navy-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xs font-bold text-navy-200">{issue.number || i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-ivory-100">{issue.title}</div>
                        <div className="text-xs text-charcoal-500 mt-0.5 line-clamp-1">{issue.statement}</div>
                      </div>
                      {expandedIssue === i ? <ChevronDown className="w-4 h-4 text-charcoal-500 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-charcoal-500 flex-shrink-0" />}
                    </button>
                    {expandedIssue === i && (
                      <div className="px-4 pb-4 pt-2 bg-[#1a1c22] space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-2xs font-semibold text-legal-blue uppercase tracking-wider mb-1">Petitioner Position</div>
                            <div className="text-xs text-ivory-300 leading-relaxed">{issue.petitioner_position || 'Not stated'}</div>
                          </div>
                          <div>
                            <div className="text-2xs font-semibold text-legal-amber uppercase tracking-wider mb-1">Respondent Position</div>
                            <div className="text-xs text-ivory-300 leading-relaxed">{issue.respondent_position || 'Not stated'}</div>
                          </div>
                        </div>
                        {issue.sub_issues?.length > 0 && (
                          <div>
                            <div className="text-2xs text-charcoal-500 uppercase tracking-wider mb-1">Sub-Issues</div>
                            <div className="flex flex-wrap gap-1">
                              {issue.sub_issues.map((s: string) => <span key={s} className="badge badge-gray">{s}</span>)}
                            </div>
                          </div>
                        )}
                        {issue.relevant_statutes?.length > 0 && (
                          <div>
                            <div className="text-2xs text-charcoal-500 uppercase tracking-wider mb-1">Relevant Statutes</div>
                            <div className="flex flex-wrap gap-1">
                              {issue.relevant_statutes.map((s: string) => <span key={s} className="badge badge-blue">{s}</span>)}
                            </div>
                          </div>
                        )}
                        {issue.constitutional_articles?.length > 0 && (
                          <div>
                            <div className="text-2xs text-charcoal-500 uppercase tracking-wider mb-1">Constitutional Articles</div>
                            <div className="flex flex-wrap gap-1">
                              {issue.constitutional_articles.map((a: string) => <span key={a} className="badge badge-gold">{a}</span>)}
                            </div>
                          </div>
                        )}
                        {issue.legal_questions?.length > 0 && (
                          <div>
                            <div className="text-2xs text-charcoal-500 uppercase tracking-wider mb-1">Legal Questions</div>
                            <ul className="space-y-0.5">
                              {issue.legal_questions.map((q: string, qi: number) => (
                                <li key={qi} className="text-xs text-charcoal-300">• {q}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Maintainability issues */}
          {d.maintainability_issues?.length > 0 && (
            <div className="card border-legal-red/20">
              <h3 className="section-title text-sm mb-2 text-legal-red">Maintainability Concerns</h3>
              <ul className="space-y-1">
                {d.maintainability_issues.map((m: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-ivory-300">
                    <AlertTriangle className="w-3.5 h-3.5 text-legal-red flex-shrink-0 mt-0.5" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Apply button */}
          <div className="flex gap-3">
            <button onClick={handleApplyActiveCase} className="btn-primary flex-1 justify-center py-3 text-base">
              <Gavel className="w-5 h-5" /> Apply as Active Case
            </button>
            <button onClick={() => setActiveModule('planner')} className="btn-secondary px-6">
              Generate Preparation Schedule →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
