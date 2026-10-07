'use client'

import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import LandingPage from '@/components/LandingPage'

export default function Home() {
  const [showApp, setShowApp] = useState(false)

  // Auto-show app if returning user has active case in storage
  useEffect(() => {
    const stored = localStorage.getItem('mootcourt-ai-store')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed?.state?.activeCase) setShowApp(true)
      } catch {}
    }
  }, [])

  if (showApp) return <AppShell />
  return <LandingPage onEnter={() => setShowApp(true)} />
}
