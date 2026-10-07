'use client'

import { useState, useCallback } from 'react'
import { useMootStore } from '@/store/mootStore'
import { Upload, FileText, CheckCircle, AlertTriangle, Loader2, ChevronDown, ChevronRight, Gavel, Scale, BookOpen } from 'lucide-react'
import { deconstructProposition } from '@/lib/gemini'

type Stage = 'upload' | 'processing' | 'review' | 'applied'

export default function PropositionModule() {
  const { activeCase, setActiveModule } = useMootStore()
  const [stage, setStage] = useState<Stage>('upload')
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<{name: string; type: string; size: string}[]>([])
  const [deconstructed, setDeconstructed] = useState<Record<string, unknown> | null>(null)
  const [processing, setProcessing] = useState(false)
  const [expandedIssue, setExpandedIssue] = useState<number | null>(0)
  const [error, setError] = useState<string | null>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }, [])

  const handleFiles = (files: File[]) => {
    const mapped = files.map(f => ({
      name: f.name,
      type: f.name.endsWith('.pdf') ? 'PDF' : f.name.endsWith('.docx') ? 'DOCX' : 'TXT',
      size: `${(f.size / 1024).toFixed(0)} KB`
    }))
    setUploadedFiles(prev => [...prev, ...mapped])
  }

  const handleDeconstruct = async () => {
    setProcessing(true)
    setError(null)
    try {
      // Use active case proposition as demo text
      const text = activeCase?.proposition || 'Please upload a proposition document.'
      const result = await deconstructProposition(text)
      setDeconstructed(result)
      setStage('review')
    } catch (e) {
      setError('Deconstruction failed. Please try again.')
    }
    setProcessing(false)
  }

  const handleApplyActiveCase = () => {
    setStage('applied')
    setTimeout(() => setActiveModule('planner'), 1500)
  }

  const docTypes = [
    { label: 'Moot Proposition', icon: FileText, required: true },
    { label: 'Competition Brochure', icon: BookOpen, required: true },
    { label: 'Rules PDF', icon: Scale, required: false },
    { label: 'Memorial Guidelines', icon: Gavel, required: false },
    { label: 'Evaluation Criteria', icon: CheckCircle, required: false },
    { label: 'Clarifications / Addenda', icon: AlertTriangle, required: false },
  ]

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ivory-100">Proposition & Brochure</h1>
          <p className="text-sm text-charcoal-400 mt-0.5">Upload your moot documents. The AI will deconstruct the proposition and extract all rules.</p>
        </div>
        {stage === 'review' && (
          <div className="flex gap-2">
            <button onClick={handleDeconstruct} className="btn-secondary">
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
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input id="file-input" type="file" multiple className="hidden" accept=".pdf,.docx,.txt"
          onChange={e => handleFiles(Array.from(e.target.files || []))} />
        <Upload className={`w-10 h-10 mx-auto mb-4 ${isDragging ? 'text-gold-400' : 'text-charcoal-600'}`} />
        <div className="text-base font-semibold text-ivory-200 mb-1">
          Drag & drop your moot documents here
        </div>
        <div className="text-sm text-charcoal-500">
          Supports PDF, DOCX, TXT · Scanned documents are OCR-processed
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
                <FileText className="w-4 h-4 text-gold-400" />
                <span className="text-sm text-ivory-200 flex-1">{f.name}</span>
                <span className="badge badge-gray">{f.type}</span>
                <span className="text-xs text-charcoal-500">{f.size}</span>
                <CheckCircle className="w-4 h-4 text-legal-green" />
              </div>
            ))}
          </div>
          <button onClick={handleDeconstruct} disabled={processing}
            className="btn-primary w-full mt-4 justify-center">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analysing documents…</> : 'Deconstruct Brochure'}
          </button>
        </div>
      )}

      {/* Demo: use active case */}
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
            <button onClick={handleDeconstruct} disabled={processing}
              className="btn-secondary text-xs flex-shrink-0">
              {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Deconstruct Demo'}
            </button>
          </div>
        </div>
      )}

      {error && <div className="alert-critical"><AlertTriangle className="w-4 h-4" />{error}</div>}

      {/* Deconstruction results */}
      {deconstructed && stage === 'review' && (
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
                { label: 'Competition', value: (deconstructed as any).competition_name || 'National Moot Court 2025' },
                { label: 'Court', value: (deconstructed as any).court || 'Supreme Court of India' },
                { label: 'Jurisdiction', value: (deconstructed as any).jurisdiction || 'India' },
                { label: 'Petitioner', value: (deconstructed as any).parties?.petitioner || 'Arjun Singh' },
                { label: 'Respondent', value: (deconstructed as any).parties?.respondent || 'Union of India' },
                { label: 'Posture', value: (deconstructed as any).procedural_posture || 'Writ Petition (Civil)' },
              ].map(item => (
                <div key={item.label} className="p-2.5 rounded-md bg-[#1a1c22] border border-[#2a2e40]">
                  <div className="text-2xs text-charcoal-500 uppercase tracking-wider">{item.label}</div>
                  <div className="text-sm text-ivory-200 mt-0.5 font-medium">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Issues */}
          <div className="card">
            <h3 className="section-title text-sm mb-3">Issues Identified</h3>
            <div className="space-y-2">
              {(activeCase?.issues || []).map((issue, i) => (
                <div key={issue.id} className="border border-[#2a2e40] rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedIssue(expandedIssue === i ? null : i)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-[#1a1c22] transition-colors text-left"
                  >
                    <div className="w-6 h-6 rounded-full bg-navy-800 border border-navy-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xs font-bold text-navy-200">{issue.number}</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-ivory-100">{issue.title}</div>
                      <div className="text-xs text-charcoal-500 mt-0.5 line-clamp-1">{issue.statement}</div>
                    </div>
                    {expandedIssue === i ? <ChevronDown className="w-4 h-4 text-charcoal-500" /> : <ChevronRight className="w-4 h-4 text-charcoal-500" />}
                  </button>
                  {expandedIssue === i && (
                    <div className="px-4 pb-4 pt-2 bg-[#1a1c22] space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-2xs font-semibold text-legal-blue uppercase tracking-wider mb-1">Petitioner Position</div>
                          <div className="text-xs text-ivory-300 leading-relaxed">{issue.petitionerPosition}</div>
                        </div>
                        <div>
                          <div className="text-2xs font-semibold text-legal-amber uppercase tracking-wider mb-1">Respondent Position</div>
                          <div className="text-xs text-ivory-300 leading-relaxed">{issue.respondentPosition}</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-2xs text-charcoal-500 uppercase tracking-wider mb-1">Sub-Issues</div>
                        <div className="flex flex-wrap gap-1">
                          {issue.subIssues.map(s => <span key={s} className="badge badge-gray">{s}</span>)}
                        </div>
                      </div>
                      <div>
                        <div className="text-2xs text-charcoal-500 uppercase tracking-wider mb-1">Relevant Statutes</div>
                        <div className="flex flex-wrap gap-1">
                          {issue.relevantStatutes.map(s => <span key={s} className="badge badge-blue">{s}</span>)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

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
