'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useMootStore } from '@/store/mootStore'
import {
  Mic, MicOff, Square, Pause, Play, Clock,
  AlertTriangle, BookOpen, ChevronRight, Volume2,
  Settings, Gavel, User, BarChart2, X, CheckCircle, AlertCircle
} from 'lucide-react'
import { generateBenchQuestion, scoreCounselAnswer, generateSessionFeedback } from '@/lib/gemini'

type SimPhase = 'config' | 'active' | 'paused' | 'completed'

const BENCH_ARCHETYPES = [
  { id: 'balanced', label: 'Balanced Bench', color: '#5c64f4' },
  { id: 'procedural', label: 'Procedural Judge', color: '#d4a843' },
  { id: 'constitutional', label: 'Constitutional Judge', color: '#1a6b47' },
  { id: 'skeptical', label: 'Skeptical Judge', color: '#c0392b' },
  { id: 'precedent_focused', label: 'Precedent-Focused', color: '#5c64f4' },
  { id: 'facts_focused', label: 'Facts-Focused', color: '#b45309' },
  { id: 'highly_interruptive', label: 'Highly Interruptive', color: '#c0392b' },
  { id: 'devils_advocate', label: "Devil's Advocate", color: '#7c3aed' },
  { id: 'constitution_bench', label: 'Constitution Bench (5J)', color: '#1a6b47' },
]

interface TranscriptEntry {
  id: string
  speaker: 'bench' | 'counsel'
  benchProfile?: string
  text: string
  timestamp: number
  score?: number
  factWarning?: string
}

function TimerDisplay({ seconds, total }: { seconds: number; total: number }) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const pct = (seconds / total) * 100
  const isWarning = seconds < 60
  const isCritical = seconds < 30

  return (
    <div className={`flex flex-col items-center ${isCritical ? 'animate-timer-warning rounded-xl p-2' : ''}`}>
      <div className={`timer-display ${isCritical ? 'text-legal-red' : isWarning ? 'text-gold-400' : 'text-ivory-100'}`}>
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </div>
      <div className="w-full mt-1 h-1 bg-[#1e2130] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isCritical ? 'bg-legal-red' : isWarning ? 'bg-gold-400' : 'bg-legal-green'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-2xs text-charcoal-500 mt-1">
        {isCritical ? '⚠ Time nearly expired' : isWarning ? '1 minute remaining' : 'Remaining'}
      </div>
    </div>
  )
}

function JudgeCard({ name, archetype, active }: { name: string; archetype: string; active?: boolean }) {
  const arch = BENCH_ARCHETYPES.find(a => a.id === archetype) || BENCH_ARCHETYPES[0]
  return (
    <div className={`rounded-lg p-3 border transition-all duration-300 ${active ? 'border-gold-500/50 bg-gold-500/5 shadow-glow' : 'border-[#2a2e40] bg-[#1a1c22]'}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${arch.color}20`, border: `1px solid ${arch.color}40` }}>
          <Gavel className="w-4 h-4" style={{ color: arch.color }} />
        </div>
        <div>
          <div className="text-xs font-semibold text-ivory-100">{name}</div>
          <div className="text-2xs text-charcoal-500">{arch.label}</div>
        </div>
      </div>
      {active && (
        <div className="flex items-center gap-1.5 mt-1">
          <div className="w-1.5 h-1.5 rounded-full bg-legal-red animate-pulse" />
          <span className="text-2xs text-legal-red">Speaking</span>
        </div>
      )}
    </div>
  )
}

export default function BenchSimulator() {
  const { activeCase } = useMootStore()
  const [phase, setPhase] = useState<SimPhase>('config')

  // Config state
  const [selectedIssue, setSelectedIssue] = useState(activeCase?.issues[0]?.id || '')
  const [selectedSide, setSelectedSide] = useState<'petitioner' | 'respondent'>('petitioner')
  const [benchSize, setBenchSize] = useState(3)
  const [difficulty, setDifficulty] = useState(3)
  const [interruptionLevel, setInterruptionLevel] = useState<'low' | 'medium' | 'high'>('medium')
  const [allocatedTime, setAllocatedTime] = useState(900)
  const [selectedArchetypes, setSelectedArchetypes] = useState(['balanced', 'precedent_focused', 'skeptical'])
  const [factChecking, setFactChecking] = useState(true)
  const [citationChecking, setCitationChecking] = useState(true)

  // Simulation state
  const [timeRemaining, setTimeRemaining] = useState(allocatedTime)
  const [isRunning, setIsRunning] = useState(false)
  const [isMicActive, setIsMicActive] = useState(false)
  const [activeSpeaker, setActiveSpeaker] = useState<'bench' | 'counsel' | null>(null)
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null)
  const [sessionScore, setSessionScore] = useState(0)
  const [answersCount, setAnswersCount] = useState(0)
  const [sidebarAlerts, setSidebarAlerts] = useState<string[]>([
    'Establish jurisdictional foundation before substantive arguments.',
    'Cite L. Chandra Kumar on Article 32 bar to alternative remedy.',
    'Be prepared for: "Why not approach CAT first?"'
  ])
  const [extensionMode, setExtensionMode] = useState(false)
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [sessionFeedback, setSessionFeedback] = useState<Record<string, unknown> | null>(null)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const transcriptRef = useRef<HTMLDivElement>(null)

  const currentIssue = activeCase?.issues.find(i => i.id === selectedIssue)

  // Timer
  useEffect(() => {
    if (isRunning && phase === 'active') {
      timerRef.current = setInterval(() => {
        setTimeRemaining(t => {
          if (t <= 1) {
            setIsRunning(false)
            setPhase('completed')
            return 0
          }
          if (t === 61) {
            setActiveSpeaker('bench')
            setTranscript(prev => [...prev, {
              id: `sys-${Date.now()}`,
              speaker: 'bench',
              benchProfile: 'System',
              text: 'Counsel, one minute remains in your allotted time.',
              timestamp: allocatedTime - t + 1
            }])
            setTimeout(() => setActiveSpeaker('counsel'), 2000)
          }
          return t - 1
        })
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isRunning, phase])

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [transcript])

  const startSimulation = useCallback(async () => {
    setPhase('active')
    setTimeRemaining(allocatedTime)
    setIsRunning(true)
    setTranscript([])
    setActiveSpeaker('bench')

    // Opening question
    setIsGeneratingQuestion(true)
    const openingPhrases = [
      `Counsel for the ${selectedSide}, you may proceed.`,
      `The Court is ready. Counsel for the ${selectedSide}, begin your submissions.`,
      `Counsel, the Court has read your memorial. You may address Issue ${currentIssue?.number} — ${currentIssue?.title}.`
    ]
    const opening = openingPhrases[Math.floor(Math.random() * openingPhrases.length)]

    await new Promise(r => setTimeout(r, 1500))
    setTranscript([{
      id: `bench-open`,
      speaker: 'bench',
      benchProfile: 'Court',
      text: opening,
      timestamp: 0
    }])
    setActiveSpeaker('counsel')
    setIsGeneratingQuestion(false)
  }, [allocatedTime, selectedSide, currentIssue])

  const handleCounselSubmit = useCallback(async (answer: string) => {
    if (!answer.trim()) return

    const elapsed = allocatedTime - timeRemaining
    const entry: TranscriptEntry = {
      id: `counsel-${Date.now()}`,
      speaker: 'counsel',
      text: answer,
      timestamp: elapsed
    }
    setTranscript(prev => [...prev, entry])
    setCurrentInput('')

    // Score the answer if there was a question
    if (currentQuestion) {
      setIsGeneratingQuestion(true)
      try {
        const scored = await scoreCounselAnswer({
          question: currentQuestion,
          answer,
          issue: currentIssue?.title || '',
          propositionContext: activeCase?.proposition || ''
        })
        const score = scored.score || 50
        setSessionScore(prev => {
          const newAvg = ((prev * answersCount) + score) / (answersCount + 1)
          return Math.round(newAvg)
        })
        setAnswersCount(prev => prev + 1)

        // Update entry with score
        setTranscript(prev => prev.map(e => e.id === entry.id ? { ...e, score } : e))

        // Add fact warning if needed
        if (!scored.fact_accurate) {
          setSidebarAlerts(prev => [
            `⚠ Factual concern in last answer: ${scored.weaknesses?.[0] || 'Check proposition'}`,
            ...prev.slice(0, 4)
          ])
        }

        // Generate bench reaction
        const shouldInterrupt =
          scored.bench_reaction === 'unconvinced' ||
          (interruptionLevel === 'high' && Math.random() > 0.3) ||
          (interruptionLevel === 'medium' && Math.random() > 0.6)

        if (shouldInterrupt) {
          await new Promise(r => setTimeout(r, 1000))
          setActiveSpeaker('bench')
          const prevQuestions = transcript.filter(e => e.speaker === 'bench').map(e => e.text)
          const newQ = await generateBenchQuestion({
            issue: currentIssue?.title || '',
            currentArgument: answer,
            archetype: selectedArchetypes[Math.floor(Math.random() * selectedArchetypes.length)],
            difficulty,
            previousQuestions: prevQuestions,
            propositionContext: activeCase?.proposition || '',
            caseContext: `${activeCase?.name} — ${selectedSide}`
          })
          setCurrentQuestion(newQ)
          setTranscript(prev => [...prev, {
            id: `bench-${Date.now()}`,
            speaker: 'bench',
            benchProfile: BENCH_ARCHETYPES.find(a => a.id === selectedArchetypes[0])?.label || 'Court',
            text: newQ,
            timestamp: allocatedTime - timeRemaining
          }])
          setActiveSpeaker('counsel')
        } else {
          setActiveSpeaker('counsel')
        }
      } catch {
        setActiveSpeaker('counsel')
      } finally {
        setIsGeneratingQuestion(false)
      }
    } else {
      // Unprompted — may get interrupted
      if (Math.random() > 0.5) {
        await new Promise(r => setTimeout(r, 2000))
        setActiveSpeaker('bench')
        setIsGeneratingQuestion(true)
        const newQ = await generateBenchQuestion({
          issue: currentIssue?.title || '',
          currentArgument: answer,
          archetype: selectedArchetypes[Math.floor(Math.random() * selectedArchetypes.length)],
          difficulty,
          previousQuestions: transcript.filter(e => e.speaker === 'bench').map(e => e.text),
          propositionContext: activeCase?.proposition || '',
          caseContext: `${activeCase?.name} — ${selectedSide}`
        })
        setCurrentQuestion(newQ)
        setTranscript(prev => [...prev, {
          id: `bench-${Date.now()}`,
          speaker: 'bench',
          benchProfile: BENCH_ARCHETYPES.find(a => a.id === selectedArchetypes[0])?.label || 'Court',
          text: newQ,
          timestamp: allocatedTime - timeRemaining
        }])
        setActiveSpeaker('counsel')
        setIsGeneratingQuestion(false)
      }
    }
  }, [currentQuestion, currentIssue, activeCase, selectedSide, selectedArchetypes, difficulty, interruptionLevel, transcript, allocatedTime, timeRemaining, answersCount])

  const endSimulation = useCallback(async () => {
    setIsRunning(false)
    setPhase('completed')
    setActiveSpeaker('bench')
    setTranscript(prev => [...prev, {
      id: 'close',
      speaker: 'bench',
      benchProfile: 'Court',
      text: 'The Court thanks counsel. The submissions are concluded. The matter will be heard further.',
      timestamp: allocatedTime - timeRemaining
    }])

    // Generate feedback
    setFeedbackLoading(true)
    try {
      const qas = transcript.filter(e => e.speaker === 'counsel').map(e => ({
        q: transcript.find(q => q.speaker === 'bench' && q.timestamp < e.timestamp)?.text || '',
        a: e.text,
        score: e.score || 50
      }))
      const feedback = await generateSessionFeedback({
        questions: qas,
        totalScore: sessionScore,
        issue: currentIssue?.title || '',
        side: selectedSide
      })
      setSessionFeedback(feedback)
    } catch {}
    setFeedbackLoading(false)
  }, [transcript, timeRemaining, allocatedTime, sessionScore, currentIssue, selectedSide])

  const seekExtension = () => {
    setExtensionMode(true)
    setActiveSpeaker('bench')
    setTranscript(prev => [...prev, {
      id: `ext-req-${Date.now()}`,
      speaker: 'bench',
      benchProfile: 'Court',
      text: 'Counsel, how much additional time do you require?',
      timestamp: allocatedTime - timeRemaining
    }])
    setTimeout(() => {
      const granted = Math.random() > 0.4
      const extra = granted ? (Math.random() > 0.5 ? 60 : 30) : 0
      setTranscript(prev => [...prev, {
        id: `ext-res-${Date.now()}`,
        speaker: 'bench',
        benchProfile: 'Court',
        text: granted
          ? `The Court grants ${extra} additional seconds to counsel.`
          : 'The Court is unable to grant an extension. Counsel may briefly summarise.',
        timestamp: allocatedTime - timeRemaining + 10
      }])
      if (granted) setTimeRemaining(t => t + extra)
      setExtensionMode(false)
      setActiveSpeaker('counsel')
    }, 2500)
  }

  if (phase === 'config') return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ivory-100">BenchSimulator</h1>
        <p className="text-sm text-charcoal-400 mt-1">Configure your oral simulation before the bench.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Issue */}
        <div className="card">
          <h3 className="text-sm font-semibold text-ivory-200 mb-3">Issue</h3>
          <div className="space-y-2">
            {activeCase?.issues.map(issue => (
              <label key={issue.id} className="flex items-start gap-3 p-2.5 rounded-md cursor-pointer hover:bg-[#1e2130] transition-colors">
                <input type="radio" name="issue" value={issue.id} checked={selectedIssue === issue.id}
                  onChange={() => setSelectedIssue(issue.id)} className="mt-0.5 accent-gold-500" />
                <div>
                  <div className="text-sm font-medium text-ivory-200">Issue {issue.number} — {issue.title}</div>
                  <div className="text-xs text-charcoal-500 mt-0.5 line-clamp-2">{issue.statement}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Side & Time */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-sm font-semibold text-ivory-200 mb-3">Side</h3>
            <div className="grid grid-cols-2 gap-2">
              {(['petitioner', 'respondent'] as const).map(s => (
                <button key={s} onClick={() => setSelectedSide(s)}
                  className={`py-2 rounded-md text-sm font-medium border transition-all ${
                    selectedSide === s ? 'bg-gold-500/20 border-gold-500/50 text-gold-300' : 'border-[#2a2e40] text-charcoal-400 hover:border-charcoal-500'
                  }`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-ivory-200 mb-3">Time Allocation</h3>
            <div className="grid grid-cols-3 gap-2">
              {[{label: '10 min', val: 600}, {label: '15 min', val: 900}, {label: '20 min', val: 1200}].map(opt => (
                <button key={opt.val} onClick={() => setAllocatedTime(opt.val)}
                  className={`py-2 rounded-md text-sm font-medium border transition-all ${
                    allocatedTime === opt.val ? 'bg-gold-500/20 border-gold-500/50 text-gold-300' : 'border-[#2a2e40] text-charcoal-400'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-ivory-200 mb-3">Difficulty: {difficulty}/5</h3>
            <input type="range" min={1} max={5} value={difficulty} onChange={e => setDifficulty(+e.target.value)}
              className="w-full accent-gold-500" />
            <div className="flex justify-between text-2xs text-charcoal-500 mt-1">
              <span>Introductory</span><span>Extreme</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bench composition */}
      <div className="card">
        <h3 className="text-sm font-semibold text-ivory-200 mb-3">Bench Composition (select {benchSize} judges)</h3>
        <div className="flex gap-2 mb-3">
          {[1,2,3,5].map(n => (
            <button key={n} onClick={() => setBenchSize(n)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                benchSize === n ? 'bg-gold-500/20 border-gold-500/50 text-gold-300' : 'border-[#2a2e40] text-charcoal-400'
              }`}>
              {n} Judge{n > 1 ? 's' : ''}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {BENCH_ARCHETYPES.map(arch => {
            const isSelected = selectedArchetypes.includes(arch.id)
            return (
              <button key={arch.id}
                onClick={() => {
                  if (isSelected) setSelectedArchetypes(prev => prev.filter(a => a !== arch.id))
                  else if (selectedArchetypes.length < benchSize) setSelectedArchetypes(prev => [...prev, arch.id])
                }}
                className={`flex items-center gap-2 p-2.5 rounded-md border text-xs transition-all ${
                  isSelected ? 'border-gold-500/50 bg-gold-500/10 text-gold-200' : 'border-[#2a2e40] text-charcoal-400 hover:border-charcoal-500'
                }`}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: arch.color }} />
                <span className="text-left">{arch.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Options */}
      <div className="card">
        <h3 className="text-sm font-semibold text-ivory-200 mb-3">Options</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Fact Checking', value: factChecking, set: setFactChecking },
            { label: 'Citation Checking', value: citationChecking, set: setCitationChecking },
          ].map(opt => (
            <label key={opt.label} className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => opt.set(!opt.value)}
                className={`w-9 h-5 rounded-full transition-colors relative ${opt.value ? 'bg-gold-500' : 'bg-charcoal-700'}`}>
                <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.75 transition-transform ${opt.value ? 'translate-x-4' : 'translate-x-0.75'}`} />
              </div>
              <span className="text-sm text-ivory-200">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <button onClick={startSimulation}
        className="w-full btn-primary py-4 text-base font-bold justify-center">
        <Mic className="w-5 h-5" />
        START BENCH SIMULATION
      </button>
    </div>
  )

  // Active simulation UI
  return (
    <div className="flex flex-col h-[calc(100vh-120px)] gap-4">
      {/* Top bar */}
      <div className="flex items-center justify-between bg-[#13151c] border border-[#1e2130] rounded-lg px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="badge badge-red animate-pulse">LIVE</div>
          <span className="text-sm font-semibold text-ivory-100">{activeCase?.name}</span>
          <span className="text-xs text-charcoal-400">Issue {currentIssue?.number} — {currentIssue?.title}</span>
        </div>
        <div className="flex items-center gap-4">
          <TimerDisplay seconds={timeRemaining} total={allocatedTime} />
          <div className="flex gap-2">
            {isRunning ? (
              <button onClick={() => setIsRunning(false)} className="btn-secondary p-2">
                <Pause className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={() => setIsRunning(true)} className="btn-success p-2">
                <Play className="w-4 h-4" />
              </button>
            )}
            <button onClick={seekExtension} disabled={extensionMode} className="btn-secondary text-xs px-3">
              Seek Extension
            </button>
            <button onClick={endSimulation} className="btn-danger p-2">
              <Square className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-4 flex-1 overflow-hidden">
        {/* Left - Transcript */}
        <div className="flex-1 flex flex-col gap-3">
          {/* Judge cards */}
          <div className="flex gap-3">
            {selectedArchetypes.slice(0, benchSize).map((arch, i) => (
              <JudgeCard key={arch} name={`Justice ${['A', 'B', 'C', 'D', 'E'][i]}`} archetype={arch}
                active={activeSpeaker === 'bench'} />
            ))}
          </div>

          {/* Transcript */}
          <div ref={transcriptRef} className="flex-1 overflow-y-auto space-y-3 pr-1">
            {transcript.length === 0 && (
              <div className="flex items-center justify-center h-full text-charcoal-600 text-sm">
                Simulation starting...
              </div>
            )}
            {transcript.map(entry => (
              <div key={entry.id} className={`flex ${entry.speaker === 'counsel' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${entry.speaker === 'bench' ? 'transcript-bench' : 'transcript-counsel'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xs font-semibold opacity-70">
                      {entry.speaker === 'bench' ? `${entry.benchProfile || 'Court'}` : 'Counsel'}
                    </span>
                    <span className="text-2xs opacity-40">
                      {Math.floor(entry.timestamp / 60)}:{String(entry.timestamp % 60).padStart(2, '0')}
                    </span>
                    {entry.score !== undefined && (
                      <span className={`text-2xs font-bold ml-auto ${entry.score >= 70 ? 'text-legal-green' : entry.score >= 50 ? 'text-gold-400' : 'text-legal-red'}`}>
                        {entry.score}/100
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed">{entry.text}</p>
                  {entry.factWarning && (
                    <div className="mt-2 flex items-center gap-1.5 text-legal-red text-2xs">
                      <AlertTriangle className="w-3 h-3" /> {entry.factWarning}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isGeneratingQuestion && (
              <div className="flex items-center gap-2 text-charcoal-500 text-sm">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-2xs">Bench deliberating…</span>
              </div>
            )}
          </div>

          {/* Input */}
          {phase === 'active' && (
            <div className="bg-[#13151c] border border-[#1e2130] rounded-lg p-3">
              {activeSpeaker === 'counsel' ? (
                <>
                  {currentQuestion && (
                    <div className="text-xs text-gold-300 mb-2 italic">"{currentQuestion}"</div>
                  )}
                  <div className="flex gap-2">
                    <textarea
                      value={currentInput}
                      onChange={e => setCurrentInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCounselSubmit(currentInput) } }}
                      placeholder="Submit your argument or answer (Enter to submit, Shift+Enter for new line)…"
                      rows={2}
                      className="flex-1 bg-[#1a1c22] border border-[#2a2e40] rounded-md px-3 py-2 text-sm text-ivory-200 placeholder-charcoal-600 focus:outline-none focus:border-gold-500/50 resize-none"
                    />
                    <button onClick={() => handleCounselSubmit(currentInput)} disabled={!currentInput.trim() || isGeneratingQuestion}
                      className="btn-primary px-4 self-end">
                      Submit
                    </button>
                  </div>
                  <div className="text-2xs text-charcoal-600 mt-1">
                    <User className="w-3 h-3 inline mr-1" />Counsel is speaking — Session score: {sessionScore}/100
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3 py-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-gold-400 animate-pulse" />
                  <span className="text-sm text-gold-300">Bench is speaking…</span>
                </div>
              )}
            </div>
          )}

          {/* Completed - show score */}
          {phase === 'completed' && (
            <div className="card border-gold-500/30">
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-gold-400">{sessionScore}/100</div>
                <div className="text-sm text-charcoal-400">Session Score</div>
              </div>
              {feedbackLoading ? (
                <div className="text-center text-sm text-charcoal-500">Generating feedback…</div>
              ) : sessionFeedback ? (
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-semibold text-legal-green mb-1">What Went Well</div>
                    {((sessionFeedback as any).what_went_well || []).map((w: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-ivory-300"><CheckCircle className="w-3.5 h-3.5 text-legal-green mt-0.5 flex-shrink-0" />{w}</div>
                    ))}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-legal-red mb-1">What the Bench Exposed</div>
                    {((sessionFeedback as any).what_bench_exposed || []).map((w: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-ivory-300"><AlertCircle className="w-3.5 h-3.5 text-legal-red mt-0.5 flex-shrink-0" />{w}</div>
                    ))}
                  </div>
                  {(sessionFeedback as any).most_dangerous_weakness && (
                    <div className="alert-critical text-sm">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <div><strong>Most Dangerous Weakness:</strong> {(sessionFeedback as any).most_dangerous_weakness}</div>
                    </div>
                  )}
                </div>
              ) : null}
              <button onClick={() => { setPhase('config'); setTranscript([]); setSessionScore(0) }}
                className="btn-primary w-full mt-4 justify-center">
                Start New Simulation
              </button>
            </div>
          )}
        </div>

        {/* Right sidebar - Intelligence panel */}
        <div className="w-72 flex-shrink-0 space-y-3">
          <div className="card">
            <div className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider mb-3">Intelligence Panel</div>
            <div className="space-y-2">
              {sidebarAlerts.map((alert, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-md bg-[#1a1c22] border border-[#2a2e40] text-xs text-ivory-300">
                  <AlertTriangle className="w-3.5 h-3.5 text-gold-400 flex-shrink-0 mt-0.5" />
                  <span>{alert}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider mb-3">Key Authorities</div>
            <div className="space-y-2">
              {[
                { name: 'L. Chandra Kumar v. UoI', cite: '(1997) 3 SCC 261', status: 'binding' },
                { name: 'S.P. Sampath Kumar v. UoI', cite: '(1987) 1 SCC 124', status: 'binding' },
                { name: 'Romesh Thappar v. State of Madras', cite: '1950 SCR 594', status: 'binding' },
              ].map(auth => (
                <div key={auth.name} className="p-2 rounded-md bg-[#1a1c22] border border-[#2a2e40]">
                  <div className="text-xs font-medium text-ivory-200">{auth.name}</div>
                  <div className="text-2xs text-charcoal-500 mt-0.5">{auth.cite}</div>
                  <div className="badge badge-green mt-1 text-2xs">{auth.status}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider mb-2">Live Score</div>
            <div className={`text-2xl font-bold ${sessionScore >= 70 ? 'text-legal-green' : sessionScore >= 50 ? 'text-gold-400' : 'text-legal-red'}`}>
              {sessionScore}<span className="text-sm text-charcoal-500">/100</span>
            </div>
            <div className="text-2xs text-charcoal-500">{answersCount} answers evaluated</div>
          </div>
        </div>
      </div>
    </div>
  )
}
