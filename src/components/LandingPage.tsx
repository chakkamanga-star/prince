'use client'

import { useState } from 'react'
import { useMootStore } from '@/store/mootStore'
import { Gavel, Mic, ArrowRight, BookOpen, Scale, CheckCircle, Shield, Search, Calendar, Upload } from 'lucide-react'

export default function LandingPage({ onEnter }: { onEnter: () => void }) {
  const { setActiveModule } = useMootStore()

  const handleEnter = () => {
    setActiveModule('dashboard')
    onEnter()
  }

  const features = [
    { icon: Search, title: 'Legal Research', module: 'legal-research', desc: 'Find and verify Indian authorities with Google Search grounding. Real sources, real citations.', color: '#5c64f4' },
    { icon: BookOpen, title: 'Memorial Editor', module: 'memorial', desc: 'Draft, audit, and strengthen every argument. Compliance checked against your competition brochure.', color: '#d4a843' },
    { icon: Mic, title: 'BenchSimulator', module: 'bench-simulator', desc: 'Face difficult judicial questions before the real Bench does. 12 judge archetypes. Voice-enabled.', color: '#1a6b47' },
    { icon: Scale, title: 'Citation Auditor', module: 'citation-auditor', desc: 'Never rely on an unverified authority. Every citation checked, flagged, and risk-scored.', color: '#c0392b' },
    { icon: Shield, title: 'Case Intelligence', module: 'case-intelligence', desc: 'Turn your proposition into a structured legal strategy. Issues, facts, authorities — all mapped.', color: '#7c3aed' },
    { icon: Calendar, title: 'Preparation Planner', module: 'planner', desc: 'Know exactly what to prepare every day. Adaptive schedule from brochure to oral rounds.', color: '#b45309' },
  ]

  return (
    <div className="min-h-screen bg-[#0f1117] text-ivory-100 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-[#0f1117]/90 backdrop-blur-sm border-b border-[#1e2130]">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gold-500/20 border border-gold-500/30">
            <Gavel className="w-4 h-4 text-gold-400" />
          </div>
          <span className="font-bold text-ivory-100">MootCourt AI</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleEnter} className="btn-secondary text-sm px-4 py-2">Sign In</button>
          <button onClick={handleEnter} className="btn-primary text-sm px-4 py-2">Start Your Moot</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center pt-20">
        {/* Background gradient */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gold-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-navy-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-1/4 w-[300px] h-[300px] bg-legal-green/5 rounded-full blur-3xl" />
        </div>

        {/* Badge */}
        <div className="badge badge-gold mb-6 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
          AI-Powered Legal Preparation System
        </div>

        {/* Main heading */}
        <h1 className="text-5xl md:text-7xl font-extrabold text-ivory-100 leading-tight mb-6 max-w-5xl">
          Prepare Like Counsel.
          <br />
          <span className="text-gold-gradient">Face the Bench</span>
          <br />
          Before You Face the Court.
        </h1>

        <p className="text-lg md:text-xl text-charcoal-300 max-w-2xl mb-4 leading-relaxed">
          An AI-powered moot court preparation system for legal research, memorial drafting,
          citation verification, oral advocacy and realistic Bench simulation.
        </p>

        <p className="text-sm font-semibold text-gold-400/80 tracking-widest uppercase mb-10">
          Prepare the Argument. Challenge the Law. Face the Bench.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <button onClick={handleEnter}
            className="btn-primary text-base px-8 py-3.5 shadow-glow">
            <Mic className="w-5 h-5" />
            Start Your Moot
          </button>
          <button onClick={() => { setActiveModule('bench-simulator'); handleEnter() }}
            className="btn-secondary text-base px-8 py-3.5">
            <Gavel className="w-5 h-5" />
            Explore BenchSimulator
          </button>
          <button onClick={() => { setActiveModule('proposition'); handleEnter() }}
            className="btn-secondary text-base px-8 py-3.5">
            <Upload className="w-5 h-5" />
            Upload Proposition
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 max-w-lg">
          {[
            { value: '18', label: 'Integrated Modules' },
            { value: '12', label: 'Judge Archetypes' },
            { value: '100%', label: 'India-Focused' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-gold-400">{stat.value}</div>
              <div className="text-xs text-charcoal-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-24 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="badge badge-gray mb-4">Platform Overview</div>
          <h2 className="text-3xl font-bold text-ivory-100">Everything You Need to Win</h2>
          <p className="text-charcoal-400 mt-3 max-w-xl mx-auto">
            A complete litigation-preparation workstation, not a generic chatbot.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(f => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                onClick={() => { setActiveModule(f.module); onEnter() }}
                className="card-hover group cursor-pointer"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg mb-4"
                  style={{ backgroundColor: `${f.color}15`, border: `1px solid ${f.color}30` }}>
                  <Icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <h3 className="text-base font-semibold text-ivory-100 mb-2">{f.title}</h3>
                <p className="text-sm text-charcoal-400 leading-relaxed">{f.desc}</p>
                <div className="flex items-center gap-1 mt-4 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: f.color }}>
                  Launch {f.title} <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Premium feature call-out */}
      <section className="px-6 py-20 max-w-4xl mx-auto text-center">
        <div className="card-gold p-10">
          <div className="badge badge-gold mb-4">Flagship Feature</div>
          <h2 className="text-2xl font-bold text-ivory-100 mb-3">The Bench Knows Your Memorial</h2>
          <p className="text-charcoal-300 leading-relaxed max-w-xl mx-auto mb-6">
            The simulated Bench reads your actual proposition, memorial, authorities and facts
            before asking questions. Every question is personalised to your case.
            No generic exercises — a real preparation experience.
          </p>
          <button onClick={() => { setActiveModule('bench-simulator'); handleEnter() }}
            className="btn-primary px-8 py-3 text-base">
            <Mic className="w-5 h-5" />
            Enter BenchSimulator
          </button>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 text-center border-t border-[#1e2130]">
        <h2 className="text-3xl font-bold text-ivory-100 mb-4">Ready to Prepare?</h2>
        <p className="text-charcoal-400 mb-8">Upload your proposition and brochure. The AI does the rest.</p>
        <button onClick={handleEnter} className="btn-primary text-base px-10 py-4 shadow-glow">
          Start Your Moot Now
          <ArrowRight className="w-5 h-5" />
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1e2130] px-6 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Gavel className="w-4 h-4 text-gold-400" />
          <span className="font-semibold text-ivory-200">MootCourt AI</span>
        </div>
        <p className="text-xs text-charcoal-600">
          An educational litigation-preparation system. Not a substitute for legal advice.
          All AI-generated legal content must be independently verified.
        </p>
      </footer>
    </div>
  )
}
