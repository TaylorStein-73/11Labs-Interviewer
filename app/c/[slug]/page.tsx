'use client'

import { useElevenLabsSession } from '@/hooks/useElevenLabsSession'
import InterviewInterface from '@/components/InterviewInterface'
import SummaryScreen from '@/components/SummaryScreen'
import WelcomeScreen from '@/components/WelcomeScreen'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

type Phase = 'welcome' | 'interview' | 'summary'

export default function InterviewPage() {
  const [phase, setPhase] = useState<Phase>('welcome')

  const {
    status,
    currentText,
    messages,
    isSpeaking,
    connect,
    disconnect,
  } = useElevenLabsSession(() => {
    console.log('handleSessionEnd called - transitioning to summary phase')
    console.log('Current phase before transition:', phase)
    console.log('Messages at session end:', messages)
    console.log('Messages length at session end:', messages.length)
    setPhase('summary')
  })

  const startInterview = () => {
    setPhase('interview')
    connect()
  }

  const endInterview = () => {
    disconnect()
    setPhase('summary')
  }

  const editSummary = () => {
    setPhase('interview')
    connect()
  }

  const confirmSummary = () => {
    toast('Interview completed successfully!')
  }

  // Debug phase changes
  useEffect(() => {
    console.log('Phase changed to:', phase)
  }, [phase])

  switch (phase) {
    case 'welcome':
      return <WelcomeScreen onStartInterview={startInterview} />
    case 'interview':
      return (
        <InterviewInterface
          currentText={currentText}
          isAudioPlaying={isSpeaking}
          onStartListening={connect}
          onStopListening={disconnect}
          onEndInterview={endInterview}
          messages={messages}
          isConnected={status === 'connected'}
        />
      )
    case 'summary':
      console.log('Rendering SummaryScreen with messages:', messages)
      return (
        <SummaryScreen
          messages={messages}
          onConfirm={confirmSummary}
          onEdit={editSummary}
        />
      )
    default:
      return null
  }
}
