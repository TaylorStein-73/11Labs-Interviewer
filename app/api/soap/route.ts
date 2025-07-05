import { NextResponse } from 'next/server'

/**
 * POST /api/soap
 * Generates a SOAP note (Subjective, Objective, Assessment, Plan) from the provided interview transcript.
 * Expects body: { transcript: ConversationMessage[] }
 * Requires env var OPENAI_API_KEY.
 */
export async function POST(request: Request) {
  try {
    const { transcript } = await request.json()

    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      return NextResponse.json({ error: 'Transcript array is required' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 500 })
    }

    // Build user prompt from transcript
    const transcriptText = transcript
      .map((entry: any) => {
        const speaker = entry.role === 'assistant' ? 'AI' : 'Patient'
        return `${speaker}: ${entry.content}`
      })
      .join('\n')

    const systemPrompt = `You are a clinical documentation assistant. Using the provided patient interview transcript, generate a detailed yet concise SOAP note.\n\nGuidelines:\n- Organize the note under the headings: Subjective, Objective, Assessment, Plan.\n- Use bullet points where appropriate.\n- Only include information present in the transcript; do not fabricate details.\n- Keep the language professional and clear.\n- Return markdown formatted text starting with '## Subjective' etc.`

    const body = {
      model: 'gpt-3.5-turbo-0125',
      temperature: 0.3,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: transcriptText },
      ],
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: `OpenAI error: ${errorText}` }, { status: response.status })
    }

    const result = await response.json()
    const soapNote = result.choices?.[0]?.message?.content?.trim() || ''

    return NextResponse.json({ soapNote })
  } catch (err: any) {
    console.error('SOAP note generation failed:', err)
    return NextResponse.json({ error: err.message || 'Unexpected error' }, { status: 500 })
  }
} 