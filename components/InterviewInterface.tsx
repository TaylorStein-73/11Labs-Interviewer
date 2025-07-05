'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useTypingEffect } from '@/components/useTypingEffect'
import { X, Square } from 'react-feather'
import { useState, useEffect } from 'react'
import ProgressTracker from '@/components/ProgressTracker'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface InterviewInterfaceProps {
  currentText: string
  isAudioPlaying: boolean
  onStartListening: () => void
  onStopListening: () => void
  onEndInterview: () => void
  messages: Message[]
  isConnected: boolean
}

// Audio Visualizer Component
const AudioVisualizer = ({ 
  isActive, 
  isListening, 
  isSpeaking, 
  userMessageTrigger 
}: { 
  isActive: boolean, 
  isListening: boolean, 
  isSpeaking: boolean,
  userMessageTrigger: number
}) => {
  const [pulsePhase, setPulsePhase] = useState(0)
  const [sonarPulses, setSonarPulses] = useState<number[]>([])

  useEffect(() => {
    // Gentle pulse animation for speaking
    const interval = setInterval(() => {
      setPulsePhase(prev => (prev + 0.04) % (Math.PI * 2))
    }, 100)

    return () => clearInterval(interval)
  }, [])

  // Trigger sonar pulse when user sends a message
  useEffect(() => {
    if (userMessageTrigger > 0) {
      const pulseId = Date.now()
      setSonarPulses(prev => [...prev, pulseId])
      
      // Remove pulse after animation completes
      setTimeout(() => {
        setSonarPulses(prev => prev.filter(id => id !== pulseId))
      }, 2000)
    }
  }, [userMessageTrigger])

  // Slightly more noticeable pulse scale
  const pulseScale = 1 + Math.sin(pulsePhase) * (isSpeaking ? 0.12 : 0.05)

  return (
    <div className="relative">
      {/* Subtle ripple effect - only when speaking */}
      {isSpeaking && (
        <motion.div
          className="absolute inset-0 rounded-full border border-teal-300 border-opacity-20"
          animate={{
            scale: [1, 1.4],
            opacity: [0.3, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
      )}

      {/* Sonar pulses for user messages */}
      {sonarPulses.map(pulseId => (
        <motion.div
          key={pulseId}
          className="absolute inset-0 rounded-full border-2 border-primary-500"
          initial={{
            scale: 1,
            opacity: 0.6
          }}
          animate={{
            scale: 2.5,
            opacity: 0
          }}
          transition={{
            duration: 2,
            ease: "easeOut"
          }}
        />
      ))}
      
      {/* Main circle */}
      <motion.div 
        className={`w-48 h-48 rounded-full transition-all duration-1000 ease-out ${
          isListening 
            ? 'bg-primary-600 shadow-lg' 
            : isSpeaking 
              ? 'bg-teal-500 shadow-lg' 
              : 'bg-gray-300 shadow-md'
        }`}
        animate={{ 
          scale: pulseScale
        }}
        transition={{ 
          duration: 0.1,
          ease: "easeOut"
        }}
      />
    </div>
  )
}

export default function InterviewInterface({
  currentText,
  isAudioPlaying,
  onStartListening,
  onStopListening,
  onEndInterview,
  messages,
  isConnected
}: InterviewInterfaceProps) {
  const [showEndButton, setShowEndButton] = useState(false)
  const [userMessageTrigger, setUserMessageTrigger] = useState(0)
  const animatedCurrentText = useTypingEffect(currentText, 30)

  // Filter out system messages for display
  const conversationMessages = messages.filter(
    (message) => !message.content.includes('function_call') && 
                 !message.content.includes('generating_summary') &&
                 message.content.trim() !== ''
  )

  // Show end button after 5 conversation exchanges
  useEffect(() => {
    if (conversationMessages.length >= 10) {
      setShowEndButton(true)
    }
  }, [conversationMessages.length])

  // Trigger sonar pulse when user sends a message
  useEffect(() => {
    const userMessages = conversationMessages.filter(msg => msg.role === 'user')
    if (userMessages.length > 0) {
      setUserMessageTrigger(userMessages.length)
    }
  }, [conversationMessages])

  const handleMicClick = () => {
    if (isConnected) {
      onStopListening()
    } else {
      onStartListening()
    }
  }

  // Determine visual states
  const isListening = isConnected && !isAudioPlaying
  const isSpeaking = isAudioPlaying
  const isActive = isConnected || isAudioPlaying || currentText.length > 0



  return (
    <div className="min-h-screen bg-white flex flex-col relative">
      {/* Header - minimal */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full animate-pulse ${
              'bg-green-500'
            }`} />
            <span className="text-sm text-gray-600 font-medium">
              {isConnected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
          
          {showEndButton && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={onEndInterview}
              className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              title="End Interview"
            >
              <X className="w-5 h-5 text-gray-600" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Progress Tracker */}
      <ProgressTracker messages={messages} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 pt-24 pb-32">
        {/* Audio Visualizer */}
        <div className="mb-8">
          <AudioVisualizer 
            isActive={isActive} 
            isListening={isListening} 
            isSpeaking={isSpeaking}
            userMessageTrigger={userMessageTrigger}
          />
        </div>
      </div>

      {/* Closed Captioning */}
      <AnimatePresence>
        {animatedCurrentText.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-32 left-6 right-6 max-w-2xl mx-auto z-40"
          >
            <p className="text-gray-700 text-center text-lg leading-relaxed font-medium drop-shadow-sm">
              {animatedCurrentText}
            </p>
          </motion.div>
        )}
      </AnimatePresence>



      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="flex items-center justify-center">
          {/* End interview button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEndInterview}
            className="flex items-center space-x-2 px-4 py-3 bg-red-100 text-red-700 hover:bg-red-200 rounded-xl font-medium transition-colors"
          >
            <Square className="w-4 h-4" />
            <span>End Interview</span>
          </motion.button>
        </div>
      </div>
    </div>
  )
} 