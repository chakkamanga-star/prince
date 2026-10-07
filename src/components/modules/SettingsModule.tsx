'use client'
import { useState } from 'react'
import { Settings, Save, CheckCircle, Key, User, Bell } from 'lucide-react'

export default function SettingsModule() {
  const [saved, setSaved] = useState(false)
  const [apiKey, setApiKey] = useState('AIza••••••••••••••••••••••••••••••••••••••')
  const [supabaseUrl, setSupabaseUrl] = useState('https://qrznwcsqqpksnqktjgcy.supabase.co')
  const [name, setName] = useState('Arjun Singh')
  const [email, setEmail] = useState('arjun@lawschool.edu')
  const [notifications, setNotifications] = useState({ deadlines: true, research: true, sessions: false })

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const sections = [
    { title: 'Profile', icon: User, content: (
      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-xs text-charcoal-400 block mb-1.5">Full Name</label><input value={name} onChange={e => setName(e.target.value)} className="input" /></div>
        <div><label className="text-xs text-charcoal-400 block mb-1.5">Email</label><input value={email} onChange={e => setEmail(e.target.value)} className="input" /></div>
        <div><label className="text-xs text-charcoal-400 block mb-1.5">Law School</label><input defaultValue="National Law School" className="input" /></div>
        <div><label className="text-xs text-charcoal-400 block mb-1.5">Year</label><input defaultValue="4th Year, LLB" className="input" /></div>
      </div>
    )},
    { title: 'API Keys', icon: Key, content: (
      <div className="space-y-4">
        <div className="alert-medium"><Bell className="w-4 h-4 flex-shrink-0" /><span>Keep your API keys secure. Do not share them.</span></div>
        <div><label className="text-xs text-charcoal-400 block mb-1.5">Gemini API Key</label><input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} className="input font-mono text-xs" /></div>
        <div><label className="text-xs text-charcoal-400 block mb-1.5">Supabase URL</label><input value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)} className="input font-mono text-xs" /></div>
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
