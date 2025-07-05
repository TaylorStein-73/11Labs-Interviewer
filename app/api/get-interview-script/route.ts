import { NextResponse } from 'next/server'
import * as yaml from 'js-yaml'
import * as fs from 'fs'
import * as path from 'path'

/**
 * GET /api/get-interview-script
 * Returns the interview script structure for the progress tracker
 */
export async function GET() {
  try {
    // Read and parse the YAML interview script
    const yamlPath = path.join(process.cwd(), 'interview-script.yaml')
    
    if (!fs.existsSync(yamlPath)) {
      return NextResponse.json({ 
        error: 'Interview script file not found',
        success: false 
      }, { status: 500 })
    }
    
    const yamlContent = fs.readFileSync(yamlPath, 'utf8')
    const interviewScript = yaml.load(yamlContent) as any
    
    // Return the script structure
    return NextResponse.json({
      sections: interviewScript.sections || {},
      questions: interviewScript.questions || {},
      success: true
    })
    
  } catch (error: any) {
    console.error('Error loading interview script:', error)
    return NextResponse.json({
      error: error.message || 'Failed to load interview script',
      success: false 
    }, { status: 500 })
  }
} 