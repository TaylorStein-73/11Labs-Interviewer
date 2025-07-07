export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { NextResponse } from 'next/server'
import * as yaml from 'js-yaml'
import * as fs from 'fs'
import * as path from 'path'

/**
 * POST /api/get-section
 * Returns an entire interview section with all questions and intelligent guidance
 * Expects: { section_name: string, conversation_context?: any }
 * Returns: Section info, all questions, and conversational guidance for natural flow
 * 
 * SCRIPT-AGNOSTIC: Works with any interview script that follows the section structure
 */
export async function POST(request: Request) {
  const timestamp = new Date().toISOString()
  
  try {
    const body = await request.json().catch(() => ({}))
    
    console.log('\n' + '='.repeat(80))
    console.log(`🎯 GET_SECTION API CALLED - ${timestamp}`)
    console.log('📥 INPUT PARAMETERS:', JSON.stringify(body, null, 2))
    
    const { section_name, conversation_context = {} } = body
    
    if (!section_name) {
      const errorResponse = { 
        error: 'section_name is required',
        success: false 
      }
      console.log('❌ ERROR - No section_name provided')
      console.log('📤 ERROR RESPONSE:', JSON.stringify(errorResponse, null, 2))
      console.log('='.repeat(80) + '\n')
      return NextResponse.json(errorResponse, { status: 400 })
    }
    
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
    const script = yaml.load(yamlContent) as any
    
    // Validate section exists
    const section = script.sections?.[section_name]
    if (!section) {
      const errorResponse = { 
        error: `Section '${section_name}' not found`,
        available_sections: script.sections ? Object.keys(script.sections as Record<string, any>) : [],
        success: false 
      }
      console.log(`❌ ERROR - Section '${section_name}' not found`)
      console.log('📤 ERROR RESPONSE:', JSON.stringify(errorResponse, null, 2))
      console.log('='.repeat(80) + '\n')
      return NextResponse.json(errorResponse, { status: 404 })
    }
    
    // Get all questions for this section
    const sectionQuestions = script.questions ? Object.values(script.questions as Record<string, any>)
      .filter((q: any) => q.section === section_name)
      .reduce((acc: any, q: any) => {
        acc[q.id] = q
        return acc
      }, {}) : {}
    
    // Generate section-specific conversation guidance
    const sectionGuidance = generateSectionGuidance(section_name, section, sectionQuestions, script, conversation_context)
    
    // Get section order from script metadata or infer from sections
    const sectionOrder = getSectionOrder(script)
    const nextSection = getNextSection(section_name, sectionOrder)
    
    const response = {
      section_name,
      section_info: section,
      questions: sectionQuestions,
      conversation_guidance: sectionGuidance,
      total_questions: Object.keys(sectionQuestions).length,
      estimated_time: section.estimated_time,
      success: true,
      next_section: nextSection,
      section_order: sectionOrder,
      script_metadata: script.metadata || {}
    }
    
    console.log('✅ SUCCESS - Section loaded successfully')
    console.log('📤 SECTION INFO:', section_name)
    console.log('🏷️  TOTAL QUESTIONS:', Object.keys(sectionQuestions).length)
    console.log('⏱️  ESTIMATED TIME:', section.estimated_time)
    console.log('➡️  NEXT SECTION:', nextSection)
    console.log('🔄 SECTION ORDER:', sectionOrder)
    console.log('='.repeat(80) + '\n')
    
    return NextResponse.json(response)
    
  } catch (error: any) {
    const errorResponse = {
      error: error.message || 'Unexpected error',
      success: false 
    }
    
    console.log('❌ UNEXPECTED ERROR in get_section')
    console.log('🚨 ERROR DETAILS:', error)
    console.log('📤 ERROR RESPONSE:', JSON.stringify(errorResponse, null, 2))
    console.log('='.repeat(80) + '\n')
    
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

/**
 * Extract section order from script - looks for explicit order or infers from structure
 */
function getSectionOrder(script: any): string[] {
  // Option 1: Explicit section order in metadata
  if (script.metadata?.section_order) {
    return script.metadata.section_order
  }
  
  // Option 2: Look for section_order field
  if (script.section_order) {
    return script.section_order
  }
  
  // Option 3: Infer from sections object order (may not be reliable)
  if (script.sections) {
    return Object.keys(script.sections)
  }
  
  return []
}

/**
 * Get next section based on dynamic section order
 */
function getNextSection(currentSection: string, sectionOrder: string[]): string | null {
  const currentIndex = sectionOrder.indexOf(currentSection)
  
  if (currentIndex === -1 || currentIndex === sectionOrder.length - 1) {
    return null // No next section
  }
  
  return sectionOrder[currentIndex + 1]
}

/**
 * Generate conversation guidance that adapts to any script structure
 */
function generateSectionGuidance(sectionName: string, section: any, questions: any, script: any, context: any): string {
  // Check if script provides custom guidance
  if (section.conversation_guidance) {
    return section.conversation_guidance
  }
  
  // Generate dynamic guidance based on section structure
  const questionCount = Object.keys(questions).length
  const questionTypes = Object.values(questions).map((q: any) => q.type)
  const hasBranchingQuestions = questionTypes.includes('branching')
  const hasDetailQuestions = questionTypes.includes('detail')
  
  // Build adaptive guidance
  let guidance = `
${section.title?.toUpperCase() || sectionName.toUpperCase()} SECTION GUIDANCE:

🎯 OBJECTIVE: ${section.description || 'Complete this section of the interview naturally and thoroughly.'}

📋 SECTION OVERVIEW:
- Total questions: ${questionCount}
- Estimated time: ${section.estimated_time || 'Not specified'}
- Question types: ${questionTypes.join(', ')}

🧠 CONVERSATION APPROACH:
- Work through questions in logical order based on user responses
- Listen carefully to what users tell you voluntarily
- Don't ask for information already provided
- Use natural transitions between related questions`

  // Add branching guidance if applicable
  if (hasBranchingQuestions) {
    guidance += `
- Follow branching logic based on user answers
- Adapt question flow based on their responses`
  }

  // Add detail collection guidance if applicable  
  if (hasDetailQuestions) {
    guidance += `
- Collect detailed information when users indicate relevant experiences
- Be thorough but not repetitive`
  }

  // Add specific question flow if available
  const baseQuestions = section.base_questions
  if (baseQuestions && baseQuestions.length > 0) {
    guidance += `

💡 STARTING POINT:
- Begin with: ${baseQuestions.join(' or ')}
- Let user responses guide the natural flow from there`
  }

  // Add generic best practices
  guidance += `

🗣️ CONVERSATIONAL STYLE:
- Be professional but warm and conversational
- Acknowledge information already shared
- Use natural transitions between questions  
- Reference previous answers when relevant
- Be empathetic for sensitive topics

🎁 COMPLETION CRITERIA:
- All relevant questions in this section addressed
- User has had opportunity to share related information
- Ready to transition to next section or conclude

Remember: Have a natural conversation, don't interrogate!`

  return guidance
} 