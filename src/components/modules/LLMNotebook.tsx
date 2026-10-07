'use client'
import { useState } from 'react'
import { useMootStore } from '@/store/mootStore'
import { NotebookPen, Plus, Trash2, Send, Loader2, Download, Check } from 'lucide-react'
import { legalResearch } from '@/lib/gemini'
import { usePersistentState } from '@/lib/usePersistentState'

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: string
}

const DEFAULT_NOTES: Note[] = [
  {
    id: 'n1',
    title: 'Alternative Remedy — Key Points',
    content: 'Key rule: Alternative remedy is NOT an absolute bar when fundamental rights are infringed.\n\nCases to cite:\n1. Whirlpool (1998) — three exceptions to alternative remedy rule\n2. L. Chandra Kumar (1997) — Art 32 is basic structure\n\nBench questions to prepare:\n- "Has the petitioner exhausted all remedies before the CAT?"\n- Counter: The exception applies here because FRs are directly infringed.',
    tags: ['Issue I', 'Maintainability', 'Research'],
    createdAt: '2025-01-15'
  },
  {
    id: 'n2',
    title: 'Article 21 — Right to Livelihood',
    content: 'Article 21 encompasses the right to livelihood (Olga Tellis case).\n\nApplication here: Dismissal from service = deprivation of livelihood = potential Art. 21 violation.',
    tags: ['Issue II', 'Article 21'],
    createdAt: '2025-01-18'
  },
]

export default function LLMNotebook() {
  const { activeCase } = useMootStore()
  const [notes, setNotes] = usePersistentState<Note[]>('moot-llm-notes', DEFAULT_NOTES)
  const [selectedId, setSelectedId] = useState<string>(notes[0]?.id || '')
  const [editing, setEditing] = useState(false)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiResponse, setAiResponse] = useState<string | null>(null)

  const selectedNote = notes.find(n => n.id === selectedId) || notes[0] || null

  const addNote = () => {
    const newNote: Note = {
      id: `n-${Date.now()}`,
      title: 'Untitled Note',
      content: '',
      tags: ['Research'],
      createdAt: new Date().toISOString().split('T')[0]
    }
    setNotes(prev => [newNote, ...prev])
    setSelectedId(newNote.id)
    setEditing(true)
  }

  const updateNote = (field: keyof Note, val: any) => {
    if (!selectedNote) return
    setNotes(prev => prev.map(n => n.id === selectedNote.id ? { ...n, [field]: val } : n))
  }

  const deleteNote = (id: string) => {
    const rem = notes.filter(n => n.id !== id)
    setNotes(rem)
    if (selectedId === id) setSelectedId(rem[0]?.id || '')
  }

  const handleAsk = async () => {
    if (!query.trim()) return
    setLoading(true)
    setAiResponse(null)
    try {
      const resp = await legalResearch(
        query,
        `Case: ${activeCase?.name || ''}. Current Note Title: ${selectedNote?.title}. Note Content: ${selectedNote?.content}`
      )
      setAiResponse(resp.text || 'No response returned.')
    } catch {
      setAiResponse('Unable to fetch legal research response. Please check your API key and connection.')
    }
    setLoading(false)
  }

  const insertAiResponse = () => {
    if (!aiResponse || !selectedNote) return
    updateNote('content', (selectedNote.content ? selectedNote.content + '\n\n' : '') + '--- 🤖 AI Legal Analysis ---\n' + aiResponse)
    setAiResponse(null)
    setQuery('')
  }

  const exportNote = () => {
    if (!selectedNote) return
    const blob = new Blob([`${selectedNote.title}\nDate: ${selectedNote.createdAt}\nTags: ${selectedNote.tags.join(', ')}\n\n${selectedNote.content}`], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${selectedNote.title.replace(/\s+/g, '_')}.txt`
    a.click()
  }

  return (
    <div className="max-w-6xl flex gap-5 h-[calc(100vh-160px)]">
      {/* Notes list */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <NotebookPen className="w-4 h-4 text-gold-400" />
            <span className="text-sm font-semibold text-ivory-100">Legal Notebook</span>
          </div>
          <button onClick={addNote} className="btn-secondary text-xs px-2 py-1 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> New
          </button>
        </div>
        <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
          {notes.map(note => (
            <button
              key={note.id}
              onClick={() => { setSelectedId(note.id); setEditing(false) }}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                selectedNote?.id === note.id ? 'border-gold-500/50 bg-gold-500/10' : 'border-[#2a2e40] bg-[#13151c] hover:border-charcoal-500'
              }`}
            >
              <div className="text-xs font-medium text-ivory-200 truncate">{note.title || 'Untitled'}</div>
              <div className="text-2xs text-charcoal-500 mt-0.5">{note.createdAt}</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {note.tags.slice(0, 2).map(t => <span key={t} className="badge badge-gray text-2xs py-0">{t}</span>)}
              </div>
            </button>
          ))}
          {notes.length === 0 && (
            <div className="text-center py-8 text-xs text-charcoal-500">
              No notes yet. Click "+ New" to create one.
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      {selectedNote ? (
        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
          <div className="flex items-center gap-2 bg-[#13151c] border border-[#1e2130] p-3 rounded-lg">
            {editing ? (
              <input
                value={selectedNote.title}
                onChange={e => updateNote('title', e.target.value)}
                className="flex-1 bg-transparent text-base font-bold text-ivory-100 focus:outline-none border-b border-gold-500/40 pb-0.5"
                placeholder="Note title…"
              />
            ) : (
              <h2 className="flex-1 text-base font-bold text-ivory-100 truncate">{selectedNote.title}</h2>
            )}
            <button onClick={exportNote} className="btn-ghost p-1.5 text-charcoal-400 hover:text-ivory-200" title="Export as text">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={() => setEditing(!editing)} className="btn-secondary text-xs px-3 py-1">
              {editing ? 'Done' : 'Edit Title'}
            </button>
            <button onClick={() => deleteNote(selectedNote.id)} className="btn-ghost p-1.5 text-legal-red hover:bg-legal-red/10" title="Delete note">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <textarea
            value={selectedNote.content}
            onChange={e => updateNote('content', e.target.value)}
            className="flex-1 bg-[#13151c] border border-[#1e2130] rounded-lg p-4 text-sm text-ivory-300 leading-relaxed resize-none focus:outline-none focus:border-gold-500/50"
            placeholder="Type your legal notes, observations, or draft arguments here…"
          />

          {/* AI assistant */}
          <div className="bg-[#13151c] border border-[#1e2130] rounded-lg p-3 space-y-2">
            <div className="text-2xs text-charcoal-500 uppercase tracking-wider">Ask AI about this note / case</div>
            <div className="flex gap-2">
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder='Ask a legal question... e.g. "What cases support the argument drafted in this note?"'
                className="input flex-1 text-xs"
                onKeyDown={e => e.key === 'Enter' && handleAsk()}
              />
              <button onClick={handleAsk} disabled={loading || !query.trim()} className="btn-primary px-3 text-xs">
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
            {aiResponse && (
              <div className="bg-[#1a1c22] border border-[#2a2e40] rounded-md p-3 text-xs text-ivory-300 max-h-48 overflow-y-auto space-y-2">
                <div className="whitespace-pre-wrap">{aiResponse}</div>
                <button onClick={insertAiResponse} className="btn-secondary text-xs py-1 px-3 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-legal-green" /> Insert into Note
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-charcoal-500 text-sm">
          Select or create a note to start writing.
        </div>
      )}
    </div>
  )
}
