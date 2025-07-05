export const runtime = 'nodejs'

export const dynamic = 'force-dynamic'

export const fetchCache = 'force-no-store'

import { NextResponse } from 'next/server'
import * as yaml from 'js-yaml'
import * as fs from 'fs'
import * as path from 'path'

interface Question {
  id: number
  question: string
  category: string
  follow_up: number[]
}

interface InterviewScript {
  questions: Record<string, Question>
  flow: {
    start: number
    end_conditions: string[]
  }
}

/**
 * POST /api/get-next-question
 * Function to be called by ElevenLabs agent to get the next question.
 * Expects: { question_id: number }
 * Returns the specific question from the interview script YAML file.
 */
export async function POST(request: Request) {
  const timestamp = new Date().toISOString()
  
  try {
    const body = await request.json().catch(() => ({}))
    
    // Log incoming request
    console.log('\n' + '='.repeat(80))
    console.log(`🔍 GET_NEXT_QUESTION API CALLED - ${timestamp}`)
    console.log('📥 INPUT PARAMETERS:', JSON.stringify(body, null, 2))
    
    const { question_id } = body
    
    // If no question_id provided, start with the first question
    const questionId = question_id || 1
    console.log(`📋 Resolved question_id: ${questionId} ${question_id ? '(provided)' : '(defaulted to 1)'}`)
    
    // Read and parse the YAML interview script
    const yamlPath = path.join(process.cwd(), 'interview-script.yaml')
    
    if (!fs.existsSync(yamlPath)) {
      const errorResponse = { 
        error: 'Interview script file not found',
        success: false 
      }
      console.log('❌ ERROR - YAML file not found:', yamlPath)
      console.log('📤 ERROR RESPONSE:', JSON.stringify(errorResponse, null, 2))
      console.log('='.repeat(80) + '\n')
      return NextResponse.json(errorResponse, { status: 500 })
    }
    
    const yamlContent = fs.readFileSync(yamlPath, 'utf8')
    const interviewScript = yaml.load(yamlContent) as InterviewScript
    
    // Find the requested question
    const question = interviewScript.questions[questionId.toString()]
    
    if (!question) {
      const errorResponse = { 
        error: `Question with ID ${questionId} not found`,
        available_questions: Object.keys(interviewScript.questions).map(Number),
        success: false 
      }
      console.log(`❌ ERROR - Question ID ${questionId} not found`)
      console.log('📤 ERROR RESPONSE:', JSON.stringify(errorResponse, null, 2))
      console.log('='.repeat(80) + '\n')
      return NextResponse.json(errorResponse, { status: 404 })
    }
    
    const response = { 
      question_id: question.id,
      question: question.question,
      category: question.category,
      follow_up_questions: question.follow_up,
      success: true 
    }
    
    // Log successful response
    console.log('✅ SUCCESS - Question found')
    console.log('📤 RESPONSE DATA:', JSON.stringify(response, null, 2))
    console.log('📋 QUESTION PREVIEW:', question.question.substring(0, 100) + (question.question.length > 100 ? '...' : ''))
    console.log('🏷️  CATEGORY:', question.category)
    console.log('➡️  FOLLOW-UP OPTIONS:', question.follow_up)
    console.log('='.repeat(80) + '\n')
    
    return NextResponse.json(response)
    
  } catch (error: any) {
    const errorResponse = {
      error: error.message || 'Unexpected error',
      success: false 
    }
    
    console.log('❌ UNEXPECTED ERROR in get_next_question')
    console.log('🚨 ERROR DETAILS:', error)
    console.log('📤 ERROR RESPONSE:', JSON.stringify(errorResponse, null, 2))
    console.log('='.repeat(80) + '\n')
    
    return NextResponse.json(errorResponse, { status: 500 })
  }
} 