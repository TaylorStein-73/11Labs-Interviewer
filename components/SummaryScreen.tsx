'use client'

import { motion } from 'framer-motion'
import { CheckCircle, FileText, MessageSquare, User } from 'react-feather'
import { useState, useEffect, useMemo } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface SummaryScreenProps {
  messages: Message[]
  onConfirm: () => void
  onEdit: () => void
}

export default function SummaryScreen({ messages, onConfirm, onEdit }: SummaryScreenProps) {
  const [soapNote, setSoapNote] = useState<string>('')
  const [isGeneratingSoap, setIsGeneratingSoap] = useState(false)

  // Filter out system messages and get only conversation - memoized to prevent recalculation
  const conversationMessages = useMemo(() =>
    messages.filter((m) => !m.content.includes('function_call') && !m.content.includes('generating_summary') && m.content.trim() !== ''),
  [messages])

  // Generate SOAP note once when needed
  useEffect(() => {
    if (soapNote || isGeneratingSoap || conversationMessages.length === 0) return

    const generateSoapNote = async () => {
      setIsGeneratingSoap(true)
      try {
        const res = await fetch('/api/soap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: conversationMessages })
        })
        if (res.ok) {
          const data = await res.json()
          setSoapNote(data.soapNote || '')
        } else {
          console.error('SOAP generation failed', res.status, res.statusText)
        }
      } catch (err) {
        console.error('SOAP generation error', err)
      } finally {
        setIsGeneratingSoap(false)
      }
    }
    generateSoapNote()
  }, [conversationMessages, soapNote, isGeneratingSoap])

  console.log('SummaryScreen rendered with:')
  console.log('Total messages:', messages.length)
  console.log('Conversation messages length:', conversationMessages.length)

  return (
    <div className="min-h-screen bg-brand-secondary p-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-brand-primary text-white px-8 py-6">
            <div className="flex items-center space-x-3 mb-2">
              <CheckCircle className="w-8 h-8" />
              <h1 className="text-2xl font-bold">Interview Complete</h1>
            </div>
            <p className="text-cream-100">
              Your medical interview has been recorded. Please review the transcript below.
            </p>
          </div>

          <div className="p-8">
            {/* SOAP Note */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="mb-8"
            >
              <h2 className="text-xl font-semibold text-primary mb-4 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-teal-500" />
                <span>SOAP Note</span>
              </h2>

              <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto">
                {soapNote ? (
                  <div className="text-sm text-gray-800 space-y-4">
                    {soapNote.split('\n').map((line, index) => {
                      const trimmedLine = line.trim();
                      
                      // Handle headers (lines starting with ##)
                      if (trimmedLine.startsWith('##')) {
                        const headerText = trimmedLine.replace(/^##\s*/, '');
                        return (
                          <h3 key={index} className="text-lg font-bold text-primary mt-6 mb-2 first:mt-0">
                            {headerText}
                          </h3>
                        );
                      }
                      
                      // Handle subheaders (lines starting with single #)
                      if (trimmedLine.startsWith('#')) {
                        const subHeaderText = trimmedLine.replace(/^#\s*/, '');
                        return (
                          <h4 key={index} className="text-base font-semibold text-gray-700 mt-4 mb-1">
                            {subHeaderText}
                          </h4>
                        );
                      }
                      
                      // Handle bold text (**text**)
                      if (trimmedLine.includes('**')) {
                        const parts = trimmedLine.split(/(\*\*.*?\*\*)/);
                        return (
                          <p key={index} className="leading-relaxed">
                            {parts.map((part, partIndex) => {
                              if (part.startsWith('**') && part.endsWith('**')) {
                                return (
                                  <span key={partIndex} className="font-semibold">
                                    {part.slice(2, -2)}
                                  </span>
                                );
                              }
                              return part;
                            })}
                          </p>
                        );
                      }
                      
                      // Handle bullet points (lines starting with - or *)
                      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
                        const bulletText = trimmedLine.replace(/^[-*]\s*/, '');
                        return (
                          <li key={index} className="ml-4 leading-relaxed list-disc">
                            {bulletText}
                          </li>
                        );
                      }
                      
                      // Regular paragraph (skip empty lines)
                      if (trimmedLine) {
                        return (
                          <p key={index} className="leading-relaxed">
                            {trimmedLine}
                          </p>
                        );
                      }
                      
                      return null;
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    {isGeneratingSoap ? 'Generating SOAP note...' : 'SOAP note not available.'}
                  </p>
                )}
              </div>
            </motion.div>

            {/* Interview Transcript */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-8"
            >
              <h2 className="text-xl font-semibold text-primary mb-4 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-primary" />
                <span>Interview Transcript</span>
              </h2>
              
              <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto">
                {conversationMessages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No conversation recorded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conversationMessages.map((message, index) => (
                      <div key={message.id} className="border-b border-gray-200 pb-3 last:border-b-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            message.role === 'user' 
                              ? 'bg-brand-primary text-white' 
                              : 'bg-gray-200 text-gray-700'
                          }`}>
                            {message.role === 'user' ? 'Patient' : 'AI Interviewer'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.timestamp).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 leading-relaxed pl-2">
                          {message.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>



            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200"
            >
              <button
                onClick={onEdit}
                className="btn-secondary flex-1 px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                Continue Interview
              </button>
              
              <button
                onClick={onConfirm}
                className="btn-primary flex-1 px-6 py-3 rounded-xl font-semibold"
              >
                Complete & Save
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 