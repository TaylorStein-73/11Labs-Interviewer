'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Check } from 'react-feather'

interface ConversationMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ProgressTrackerProps {
  messages: ConversationMessage[]
}

interface Category {
  id: string
  name: string
  isActive: boolean
  isCompleted: boolean
  order: number
  keywords: string[]
}

interface InterviewScript {
  sections: Record<string, {
    title: string
    description: string
    base_questions: string[]
    estimated_time: string
  }>
  questions: Record<string, {
    id: string
    section: string
    question: string
    category: string
    title?: string
  }>
}

// Cache for the interview script to avoid repeated fetches
let scriptCache: InterviewScript | null = null

async function fetchInterviewScript(): Promise<InterviewScript | null> {
  if (scriptCache) return scriptCache
  
  try {
    const response = await fetch('/api/get-interview-script')
    if (!response.ok) return null
    
    const data = await response.json()
    scriptCache = data
    return data
  } catch (error) {
    console.error('Failed to fetch interview script:', error)
    return null
  }
}

function extractKeywordsFromQuestions(questions: Record<string, any>, sectionId: string): string[] {
  const keywords = new Set<string>()
  
  // Extract keywords from questions belonging to this section
  Object.values(questions).forEach((question: any) => {
    if (question.section === sectionId) {
      // Extract keywords from question text
      const questionText = question.question?.toLowerCase() || ''
      const titleText = question.title?.toLowerCase() || ''
      const categoryText = question.category?.toLowerCase() || ''
      
      // Add meaningful words (filter out common words)
      const meaningfulWords = [...questionText.split(/\s+/), ...titleText.split(/\s+/), ...categoryText.split(/\s+/)]
        .filter(word => 
          word.length > 3 && 
          !['have', 'been', 'your', 'what', 'when', 'where', 'were', 'with', 'that', 'this', 'they', 'them', 'from', 'about', 'would', 'could', 'should', 'after', 'before', 'during', 'since'].includes(word)
        )
        .map(word => word.replace(/[^a-zA-Z]/g, '')) // Remove punctuation
        .filter(word => word.length > 2)
      
      meaningfulWords.forEach(word => keywords.add(word))
    }
  })
  
  // Add section-specific keywords based on section ID
  const sectionKeywords = extractSectionKeywords(sectionId)
  sectionKeywords.forEach(keyword => keywords.add(keyword))
  
  return Array.from(keywords)
}

function extractSectionKeywords(sectionId: string): string[] {
  // Extract base keywords from section ID
  const baseKeywords = sectionId.split('_').map(word => word.toLowerCase())
  
  // Add common variations and synonyms
  const keywordMap: Record<string, string[]> = {
    pregnancy: ['pregnant', 'pregnancies', 'birth', 'delivery', 'gestational', 'obstetric'],
    fertility: ['fertility', 'genetic', 'carrier', 'screening', 'diagnostic', 'testing'],
    lifestyle: ['lifestyle', 'substance', 'smoking', 'alcohol', 'drug', 'tobacco'],
    interview: ['interview', 'complete', 'completion', 'thank', 'recorded', 'review'],
    history: ['history', 'medical', 'health'],
    testing: ['testing', 'test', 'tests', 'screening', 'screen']
  }
  
  const keywords: string[] = [...baseKeywords]
  
  baseKeywords.forEach(baseWord => {
    if (keywordMap[baseWord]) {
      keywords.push(...keywordMap[baseWord])
    }
  })
  
  return keywords
}

function extractCategoriesFromScript(script: InterviewScript): Category[] {
  if (!script.sections) return []
  
  const categories: Category[] = []
  let order = 1
  
  for (const [sectionId, section] of Object.entries(script.sections)) {
    // Extract the main category from the section ID
    const mainCategory = sectionId.split('_')[0]
    
    // Generate keywords dynamically from the script
    const keywords = extractKeywordsFromQuestions(script.questions, sectionId)
    
    categories.push({
      id: mainCategory,
      name: section.title,
      isActive: false,
      isCompleted: false,
      order: order++,
      keywords: keywords
    })
  }
  
  return categories
}

function detectCurrentCategory(messages: ConversationMessage[], categories: Category[]): string | null {
  if (messages.length === 0 || categories.length === 0) return null
  
  // Look at the most recent assistant messages to determine current category
  const recentAssistantMessages = messages
    .filter(msg => msg.role === 'assistant')
    .slice(-3) // Look at more recent messages for better detection
    .map(msg => msg.content.toLowerCase())
  
  if (recentAssistantMessages.length === 0) return null
  
  const recentText = recentAssistantMessages.join(' ')
  
  // Score each category based on keyword matches
  const categoryScores: { [key: string]: number } = {}
  
  categories.forEach(category => {
    let score = 0
    category.keywords.forEach(keyword => {
      if (recentText.includes(keyword)) {
        // Weight longer keywords more heavily
        score += keyword.length > 5 ? 2 : 1
      }
    })
    categoryScores[category.id] = score
  })
  
  // Find the category with the highest score
  const maxScore = Math.max(...Object.values(categoryScores))
  if (maxScore === 0) return null
  
  const bestCategory = Object.entries(categoryScores)
    .find(([_, score]) => score === maxScore)?.[0]
  
  return bestCategory || null
}

function detectCompletedCategories(messages: ConversationMessage[], categories: Category[]): Set<string> {
  const completed = new Set<string>()
  const assistantMessages = messages
    .filter(msg => msg.role === 'assistant')
    .map(msg => msg.content.toLowerCase())
  
  if (assistantMessages.length === 0) return completed
  
  // Track which categories have been encountered and when
  const categoryEncounters: { [key: string]: number[] } = {}
  
  // Analyze messages chronologically to understand flow
  assistantMessages.forEach((message, index) => {
    categories.forEach(category => {
      const matchCount = category.keywords.filter(keyword => 
        message.includes(keyword)
      ).length
      
      if (matchCount > 0) {
        if (!categoryEncounters[category.id]) {
          categoryEncounters[category.id] = []
        }
        categoryEncounters[category.id].push(index)
      }
    })
  })
  
  // Determine completion based on progression
  const currentCategory = detectCurrentCategory(messages, categories)
  const currentCategoryOrder = categories.find(cat => cat.id === currentCategory)?.order || 0
  
  // Mark categories as completed if:
  // 1. They have been encountered AND
  // 2. We've moved to a later category in the sequence
  categories.forEach(category => {
    if (categoryEncounters[category.id] && 
        categoryEncounters[category.id].length > 0 && 
        currentCategoryOrder > category.order) {
      completed.add(category.id)
    }
  })
  
  // Special case: if we're in the final category (completion), mark all previous as completed
  const finalCategory = categories.find(cat => cat.order === Math.max(...categories.map(c => c.order)))
  if (finalCategory && currentCategory === finalCategory.id) {
    categories.forEach(cat => {
      if (cat.order < finalCategory.order) {
        completed.add(cat.id)
      }
    })
  }
  
  return completed
}

export default function ProgressTracker({ messages }: ProgressTrackerProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [scriptCategories, setScriptCategories] = useState<Category[]>([])
  
  // Load interview script categories on mount
  useEffect(() => {
    const loadScript = async () => {
      const script = await fetchInterviewScript()
      if (script) {
        const extractedCategories = extractCategoriesFromScript(script)
        console.log('Extracted categories:', extractedCategories) // Debug log
        setScriptCategories(extractedCategories)
      }
    }
    
    loadScript()
  }, [])
  
  useEffect(() => {
    if (scriptCategories.length === 0) return
    
    const currentCategory = detectCurrentCategory(messages, scriptCategories)
    const completedCategories = detectCompletedCategories(messages, scriptCategories)
    
    console.log('Current category:', currentCategory) // Debug log
    console.log('Completed categories:', Array.from(completedCategories)) // Debug log
    
    const updatedCategories = scriptCategories.map(cat => ({
      ...cat,
      isActive: currentCategory === cat.id,
      isCompleted: completedCategories.has(cat.id)
    }))
    
    setCategories(updatedCategories)
  }, [messages, scriptCategories])
  
  // Don't show progress tracker if no messages yet or categories not loaded
  if (messages.length === 0 || categories.length === 0) return null
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute top-6 left-6 z-20"
    >
      <div className="">
        <div className="space-y-3">
          {categories.map((category) => (
            <motion.div
              key={category.id}
              className="flex items-center space-x-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {/* Icon */}
              <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                {category.isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Check className="w-4 h-4 text-gray-500" />
                  </motion.div>
                ) : (
                  <div className={`w-2 h-2 rounded-full ${
                    category.isActive ? 'bg-gray-700' : 'bg-gray-300'
                  }`} />
                )}
              </div>
              
              {/* Text */}
              <span className={`text-sm font-medium ${
                category.isCompleted 
                  ? 'text-gray-500' 
                  : category.isActive 
                    ? 'text-gray-700' 
                    : 'text-gray-400'
              }`}>
                {category.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
} 