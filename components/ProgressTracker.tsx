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

function extractCategoriesFromScript(script: InterviewScript): Category[] {
  if (!script.sections) return []
  
  const categories: Category[] = []
  let order = 1
  
  for (const [sectionId, section] of Object.entries(script.sections)) {
    // Extract the main category from the first word of question IDs
    const mainCategory = sectionId.split('_')[0] // e.g., 'pregnancy_history' -> 'pregnancy'
    
    categories.push({
      id: mainCategory,
      name: section.title,
      isActive: false,
      isCompleted: false,
      order: order++
    })
  }
  
  return categories
}

function detectCurrentCategory(messages: ConversationMessage[], categories: Category[]): string | null {
  if (messages.length === 0 || categories.length === 0) return null
  
  // Look at the most recent assistant messages to determine current category
  const recentAssistantMessages = messages
    .filter(msg => msg.role === 'assistant')
    .slice(-2)
    .map(msg => msg.content.toLowerCase())
  
  if (recentAssistantMessages.length === 0) return null
  
  const recentText = recentAssistantMessages.join(' ')
  
  // Generate keywords based on category names and common terms
  const categoryKeywords = {
    pregnancy: ['pregnant', 'pregnancy', 'pregnancies', 'birth', 'miscarriage', 'stillbirth', 'ectopic', 'termination', 'gestational', 'delivery', 'vaginal', 'c-section', 'cerclage', 'diabetes', 'blood pressure', 'cholestasis', 'blood clots', 'live birth', 'outcome'],
    lifestyle: ['smoke', 'smoking', 'alcohol', 'drink', 'cannabis', 'drug', 'substance', 'tobacco', 'nicotine', 'vape', 'recreational', 'cigarettes', 'drinks per week'],
    interview: ['thank you', 'complete', 'recorded', 'review', 'dr. stein', 'information for dr', 'look forward', 'today']
  }
  
  // Check categories in reverse order (most recent first)
  for (const category of [...categories].reverse()) {
    const keywords = categoryKeywords[category.id as keyof typeof categoryKeywords] || []
    if (keywords.some(keyword => recentText.includes(keyword))) {
      return category.id
    }
  }
  
  return null
}

function detectCompletedCategories(messages: ConversationMessage[], categories: Category[]): Set<string> {
  const completed = new Set<string>()
  const assistantMessages = messages
    .filter(msg => msg.role === 'assistant')
    .map(msg => msg.content.toLowerCase())
  
  if (assistantMessages.length === 0) return completed
  
  // Generate keywords based on category names
  const categoryKeywords = {
    pregnancy: ['pregnant', 'pregnancy', 'pregnancies', 'birth', 'miscarriage', 'stillbirth', 'ectopic', 'termination', 'gestational', 'delivery', 'vaginal', 'c-section', 'cerclage', 'diabetes', 'blood pressure', 'cholestasis', 'blood clots', 'live birth', 'outcome'],
    lifestyle: ['smoke', 'smoking', 'alcohol', 'drink', 'cannabis', 'drug', 'substance', 'tobacco', 'nicotine', 'vape', 'recreational', 'cigarettes', 'drinks per week'],
    interview: ['thank you', 'complete', 'recorded', 'review', 'dr. stein', 'information for dr', 'look forward', 'today']
  }
  
  // Track which categories have been encountered
  const categoryEncountered = new Map<string, boolean>()
  let currentCategoryOrder = 0
  
  // Analyze messages chronologically to understand flow
  for (const message of assistantMessages) {
    for (const category of categories) {
      const keywords = categoryKeywords[category.id as keyof typeof categoryKeywords] || []
      if (keywords.some(keyword => message.includes(keyword))) {
        categoryEncountered.set(category.id, true)
        currentCategoryOrder = Math.max(currentCategoryOrder, category.order)
      }
    }
  }
  
  // Mark categories as completed based on progression
  for (const category of categories) {
    if (categoryEncountered.has(category.id) && currentCategoryOrder > category.order) {
      completed.add(category.id)
    }
  }
  
  // Special case: if we're in completion phase, mark previous categories as completed
  if (categoryEncountered.has('interview')) {
    categories.forEach(cat => {
      if (cat.order < 3) { // Assuming interview is the last category
        completed.add(cat.id)
      }
    })
  }
  
  // If we've progressed to lifestyle, pregnancy should be completed
  if (categoryEncountered.has('lifestyle') && currentCategoryOrder > 1) {
    completed.add('pregnancy')
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
        setScriptCategories(extractedCategories)
      }
    }
    
    loadScript()
  }, [])
  
  useEffect(() => {
    if (scriptCategories.length === 0) return
    
    const currentCategory = detectCurrentCategory(messages, scriptCategories)
    const completedCategories = detectCompletedCategories(messages, scriptCategories)
    
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