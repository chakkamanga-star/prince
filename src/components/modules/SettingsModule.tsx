'use client'
import { useEffect, useState } from 'react'
import { Settings, Save, CheckCircle, Key, User, Bell, XCircle, Loader2 } from 'lucide-react'
import { usePersistentState } from '@/lib/usePersistentState'
import { getHealth } from '@/lib/gemini'

const DEFAULT_PROFILE = { name: '', email: '', school: '', year: '' }
const DEFAULT_NOTIFS = { deadlines: true, research: true, sessions: false }

export default function SettingsModule() {
  const [saved, setSaved] = useState(false)
  const [stored, setStored] = usePersistentState('settings', { profile: DEFAULT_PROFILE, notifications: DEFAULT_NOTIFS })
  const [profile, setProfile] = useState(DEFAULT_PROFILE)
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFS)
  const [geminiOk, setGeminiOk] = useState<boolean | null>(null)

  // Load saved values once they are read from storage
  useEffect(() => { setProfile(stored.profile); setNotifications(stored.notifications) }, [stored])
  useEffect(() => { getHealth().then(h => setGeminiOk(h.gemini)).catch(() => setGeminiOk(false)) }, [])

  const handleSave = () => {
    setStored({ profile, notifications })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const field = (label: string, key: keyof typeof DEFAULT_PROFILE, placeholder = '') => (
    <div><label className="text-xs text-charcoal-400 block mb-1.5">{label}</label>
      <input value={profile[key]} placeholder={placeholder} onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))} className="input" /></div>
  )

  const sections = [
    { title: 'Profile', icon: User, content: (
      <div className="grid grid-cols-2 gap-4">
        {field('Full Name', 'name', 'Your name')}
        {field('Email', 'email', 'you@example.com')}
        {field('Law School', 'school', 'Your institution')}
        {field('Year', 'year', 'e.g. 4th Year, LLB')}
      </div>
    )},
    { title: 'Connections', icon: Key, content: (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-md bg-[#1a1c22] border border-[#2a2e40]">
          {geminiOk === null ? <Loader2 className="w-4 h-4 animate-spin text-gold-400" /> : geminiOk ? <CheckCircle className="w-4 h-4 text-legal-green" /> : <XCircle className="w-4 h-4 text-legal-red" />}
          <div className="flex-1">
            <div className="text-sm text-ivory-200">Gemini AI</div>
            <div className="text-xs text-charcoal-500">{geminiOk === null ? 'Checking…' : geminiOk ? 'Connected — API key configured on the server' : 'Not configured — set GEMINI_API_KEY in your hosting environment variables'}</div>
          </div>
        </div>
        <p className="text-xs text-charcoal-500">API keys are kept server-side as environment variables and are never entered or stored in the browser.</p>
      </div>
    )},
    { title: 'Notifications', icon: Bell, content: (
      <div className="space-y-3">
        {[
          { key: 'deadlines', label: 'Deadline Reminders', desc: 'Get reminded 3 days before memorial and oral deadlines' },
          { key: 'research', label: 'New Research Alerts', desc: 'Alert when relevant new judgments are found' },
          { key: 'sessions', label: 'Session Summaries', desc: 'Receive AI summary after each BenchSimulator session' },
        ].map(item => (
          <div key={item.key} className="flex items-start gap-3 p-3 rounded-md bg-[#1a1c22] border border-[#2a2e40]">
            <div onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
              className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer flex-shrink-0 mt-0.5 ${notifications[item.key as keyof typeof notifications] ? 'bg-gold-500' : 'bg-charcoal-700'}`}>
              <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${notifications[item.key as keyof typeof notifications] ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            <div>
              <div className="text-sm text-ivory-200">{item.label}</div>
              <div className="text-xs text-charcoal-500 mt-0.5">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    )},
  ]

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-ivory-100">Settings</h1>
          <p className="text-sm text-charcoal-400 mt-0.5">Platform preferences and credentials</p></div>
        <button onClick={handleSave} className="btn-primary">
          {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
        </button>
      </div>

      {sections.map(section => {
        const Icon = section.icon
        return (
          <div key={section.title} className="card">
            <div className="flex items-center gap-2 mb-4">
              <Icon className="w-4 h-4 text-gold-400" />
              <h3 className="section-title text-base">{section.title}</h3>
            </div>
            {section.content}
          </div>
        )
      })}

      <div className="card">
        <h3 className="section-title text-base mb-3">About MootCourt AI</h3>
        <div className="space-y-2 text-xs text-charcoal-400">
          <p>Version 1.0.0 · Built for Indian moot court competitions</p>
          <p>AI Legal Research is powered by Google Gemini with Google Search grounding.</p>
          <p>All AI-generated content is for educational purposes only and must be independently verified before relying on it in any legal context.</p>
        </div>
      </div>
    </div>
  )
}
