'use client'
import { useState } from 'react'
import { useMootStore } from '@/store/mootStore'
import { NotebookPen, Plus, Trash2, Send, Loader2 } from 'lucide-react'
import { legalResearch } from '@/lib/gemini'

interface Note { id: string; title: string; content: string; tags: string[]; createdAt: string }

export default function LLMNotebook() {
  const { activeCase } = useMootStore()
  const [notes, setNotes] = useState<Note[]>([
    { id: 'n1', title: 'Alternative Remedy — Key Points', content: 'Key rule: Alternative remedy is NOT an absolute bar when fundamental rights are infringed.\n\nCases to cite:\n1. Whirlpool (1998) — three exceptions to alternative remedy rule\n2. L. Chandra Kumar (1997) — Art 32 is basic structure\n\nBench questions to prepare:\n- "Has the petitioner exhausted all remedies before the CAT?"\n- Counter: The exception applies here because FRs are directly infringed.', tags: ['Issue I', 'Maintainability', 'Research'], createdAt: '2024-10-05' },
    { id: 'n2', title: 'Article 21 — Right to Livelihood', content: 'Article 21 encompasses the right to livelihood (Olga Tellis case).\n\nApplication here: Dismissal from service = deprivation of livelihood = potential Art. 21 violation.', tags: ['Issue II', 'Article 21'], createdAt: '2024-10-03' },
  ])
  const [selectedNote, setSelectedNote] = useState<Note | null>(notes[0])
  const [editing, setEditing] = useState(false)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiResponse, setAiResponse] = useState<string | null>(null)

  const addNote = () => {
    const newNote: Note = { id: `n-${Date.now()}`, title: 'New Note', content: '', tags: [], createdAt: new Date().toISOString().split('T')[0] }
    setNotes(prev => [newNote, ...prev])
    setSelectedNote(newNote)
    setEditing(true)
  }

  const updateNote = (field: keyof Note, val: string) => {
    if (!selectedNote) return
    const updated = { ...selectedNote, [field]: val }
    setSelectedNote(updated)
    setNotes(prev => prev.map(n => n.id === updated.id ? updated : n))
  }

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id))
    if (selectedNote?.id === id) setSelectedNote(notes.find(n => n.id !== id) || null)
  }

  const handleAsk = async () => {
    if (!query.trim()) return
    setLoading(true)
    setAiResponse(null)
    try {
      const resp = await legalResearch(query, `Case: ${activeCase?.name}. Current Note: ${selectedNote?.content}`)
      setAiResponse(resp.text || '')
    } catch {
      setAiResponse('Unable to fetch response. Please try again.')
    }
    setLoading(false)
  }

  const insertAiResponse = () => {
    if (!aiResponse || !selectedNote) return
    updateNote('content', selectedNote.content + '\n\n---\n🤖 AI Research:\n' + aiResponse)
    setAiResponse(null)
    setQuery('')
  }

  return (
    <div className="max-w-6xl flex gap-5 h-[calc(100vh-160px)]">
      {/* Notes list */}
      <div className="w-60 flex-shrink-0 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <NotebookPen className="w-4 h-4 text-gold-400" />
            <span className="text-sm font-semibold text-ivory-100">Notebook</span>
          </div>
          <button onClick={addNote} className="btn-ghost p-1.5"><Plus className="w-4 h-4" /></button>
        </div>
        <div className="space-y-1.5 overflow-y-auto flex-1">
          {notes.map(note => (
            <button key={note.id} onClick={() => { setSelectedNote(note); setEditing(false) }}
              className={`w-full text-left p-3 rounded-lg border transition-all ${selectedNote?.id === note.id ? 'border-gold-500/50 bg-gold-500/8' : 'border-[#2a2e40] bg-[#13151c] hover:border-charcoal-500'}`}>
              <div className="text-xs font-medium text-ivory-200 truncate">{note.title}</div>
              <div className="text-2xs text-charcoal-500 mt-0.5">{note.createdAt}</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {note.tags.slice(0,2).map(t => <span key={t} className="badge badge-gray text-2xs py-0">{t}</span>)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      {selectedNote && (
        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
          <div className="flex items-center gap-2">
            {editing ? (
              <input value={selectedNote.title} onChange={e => updateNote('title', e.target.value)}
                className="flex-1 bg-transparent text-lg font-bold text-ivory-100 focus:outline-none border-b border-[#2a2e40] pb-1" />
            ) : (
              <h2 className="flex-1 text-lg font-bold text-ivory-100">{selectedNote.title}</h2>
            )}
            <button onClick={() => setEditing(!editing)} className="btn-secondary text-xs px-3 py-1.5">
              {editing ? 'Done' : 'Edit'}
            </button>
            <button onClick={() => deleteNote(selectedNote.id)} className="btn-ghost p-2 text-legal-red">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <textarea value={selectedNote.content} readOnly={!editing} onChange={e => updateNote('content', e.target.value)}
            className={`flex-1 bg-[#13151c] border border-[#1e2130] rounded-lg p-4 text-sm text-ivory-300 leading-relaxed resize-none focus:outline-none focus:border-gold-500/50 ${editing ? 'cursor-text' : 'cursor-default'}`} />

          {/* AI assistant */}
          <div className="bg-[#13151c] border border-[#1e2130] rounded-lg p-3 space-y-2">
            <div className="text-2xs text-charcoal-500 uppercase tracking-wider">Ask AI about this note</div>
            <div className="flex gap-2">
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Ask a legal question related to this note…"
                className="input flex-1 text-xs" onKeyDown={e => e.key === 'Enter' && handleAsk()} />
              <button onClick={handleAsk} disabled={loading || !query.trim()} className="btn-primary px-3">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            {aiResponse && (
              <div className="bg-[#1a1c22] border border-[#2a2e40] rounded-md p-3 text-xs text-ivory-300 max-h-48 overflow-y-auto">
                {aiResponse}
                <button onClick={insertAiResponse} className="btn-secondary text-xs mt-2 py-1 px-3">Insert into Note</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
