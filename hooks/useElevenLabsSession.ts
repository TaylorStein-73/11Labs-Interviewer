'use client'

import { useConversation, type Role } from '@11labs/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

export type SessionStatus = 'idle' | 'connecting' | 'connected' | 'error'

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface UseElevenLabsSessionReturn {
  status: SessionStatus
  currentText: string
  messages: ConversationMessage[]
  isSpeaking: boolean
  connect: () => void
  disconnect: () => void
  onSessionEnd?: () => void
}

/**
 * Strict-mode safe hook that owns the full ElevenLabs conversation lifecycle.
 * It never calls disconnect during React 18 dev double-mounts and exposes a clean API.
 */
export function useElevenLabsSession(onSessionEnd?: () => void): UseElevenLabsSessionReturn {
  const [status, setStatus] = useState<SessionStatus>('idle')
  const [currentText, setCurrentText] = useState('')
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)

  // Flags to protect against double connect/disconnect in React Strict Mode
  const hasConnectedRef = useRef(false)
  const isConnectingRef = useRef(false)
  const shouldDisconnectRef = useRef(false)
  const conversationIdRef = useRef<string | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)

  // Function to fetch transcript from ElevenLabs API
  const fetchTranscript = async (id: string) => {
    try {
      const response = await fetch('/api/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: id }),
      })
      
      console.log('Transcript API response status:', response.status)
      const data = await response.json()
      console.log('Transcript API response data:', data)
      
      if (data.error) {
        console.error('Error fetching transcript:', data.error)
        setMessages([])
      }
      
      if (data.transcript && data.transcript.length > 0) {
        console.log('Received transcript with', data.transcript.length, 'messages')
        console.log('Setting messages to:', data.transcript)
        setMessages(data.transcript)
      } else {
        console.log('No transcript received, using empty array')
        setMessages([])
      }
    } catch (error) {
      console.error('Failed to fetch transcript:', error)
      setMessages([])
    }
  }

  const conversation = useConversation({
    onError: (error: string) => {
      console.log('ElevenLabs session error:', error)
      toast(error)
      setStatus('error')
      hasConnectedRef.current = false
      isConnectingRef.current = false
    },
    onConnect: () => {
      console.log('ElevenLabs session connected')
      console.log('Conversation object after connect:', conversation)
      setStatus('connected')
      hasConnectedRef.current = true
      isConnectingRef.current = false
    },
    onDisconnect: () => {
      console.log('ElevenLabs session disconnected')
      console.log('Conversation object:', conversation)
      console.log('Conversation properties:', Object.keys(conversation))
      
      setStatus('idle')
      hasConnectedRef.current = false
      isConnectingRef.current = false
      
      // Clean up audio stream
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop())
        audioStreamRef.current = null
      }
      
      // Fetch the real transcript from ElevenLabs API
      if (conversationIdRef.current) {
        console.log('Fetching transcript for conversation:', conversationIdRef.current)
        fetchTranscript(conversationIdRef.current)
      } else {
        console.log('No conversation ID available, using empty array')
        setMessages([])
      }
      
      // Call the callback when session ends
      if (onSessionEnd) {
        console.log('Calling onSessionEnd callback')
        onSessionEnd()
      } else {
        console.log('No onSessionEnd callback provided')
      }
    },
    onMessage: ({ message, source }: { message: string; source: Role }) => {
      console.log('🎙️ ElevenLabs message received:', { message, source, timestamp: new Date().toISOString() })
      
      if (source === 'ai') {
        console.log('🤖 Setting currentText to:', message)
        setCurrentText(message)
      }

      // Capture messages in real-time so the Interview screen can display them
      setMessages((prev) => {
        const newMessage: ConversationMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          role: source === 'ai' ? 'assistant' : 'user',
          content: message,
          timestamp: new Date(),
        }
        console.log('📝 Adding message to state:', newMessage)
        return [...prev, newMessage]
      })

      if (source === 'ai') {
        // No automatic clearing; caption stays until next agent response
      }
    },
  })

  /** Connect once – safe against double calls */
  const connect = useCallback(async () => {
    if (status === 'connected' || isConnectingRef.current) return

    try {
      isConnectingRef.current = true
      setStatus('connecting')
      // Get microphone permission and store the stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioStreamRef.current = stream

      const res = await fetch('/api/i', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      // startSession resolves with the ElevenLabs conversationId (string)
      const id: string = await conversation.startSession({ signedUrl: data.apiKey })
      console.log('Session started with ElevenLabs conversationId:', id)

      // store conversation id in state & ref for later transcript retrieval
      setConversationId(id)
      conversationIdRef.current = id

      // onConnect callback will set status to 'connected'
    } catch (err: any) {
      console.error('❌ Connection error:', err)
      toast(err.message || 'Failed to connect')
      setStatus('error')
      isConnectingRef.current = false
      
      // Clean up stream on error
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop())
        audioStreamRef.current = null
      }
    }
  }, [status, conversation])

  /** Clean disconnect if we really connected */
  const disconnect = useCallback(async () => {
    shouldDisconnectRef.current = true
    if (!hasConnectedRef.current) return
    try {
      await conversation.endSession()
    } finally {
      setStatus('idle')
      hasConnectedRef.current = false
      
      // Clean up audio stream
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop())
        audioStreamRef.current = null
      }
    }
  }, [conversation])

  /* Real cleanup – runs only on real unmount, not on Strict Mode re-mount */
  useEffect(() => {
    return () => {
      if (shouldDisconnectRef.current) disconnect()
      
      // Clean up audio stream
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop())
        audioStreamRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debug: Monitor messages state changes
  useEffect(() => {
    console.log('Messages state changed:', messages)
    console.log('Messages count:', messages.length)
  }, [messages])

  return {
    status,
    currentText,
    messages,
    isSpeaking: conversation.isSpeaking,
    connect,
    disconnect,
    onSessionEnd,
  }
} 