import { NextResponse } from 'next/server'

// Edge Function: fetch full completed transcript from ElevenLabs once the call has ended.
// ------------------------------------------------------------------------------------
// 1. Client POSTs { conversationId } as soon as the WebSocket closes.
// 2. We poll GET /v1/convai/conversations/:conversationId until status === "done" (max 30s).
// 3. We transform ElevenLabs' native schema into the UI-friendly ConversationMessage[] format.
// 4. JSON is returned to the browser where it's injected into state.
// ------------------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const { conversationId } = await request.json()
    console.log('Transcript API called with conversation ID:', conversationId)
    
    if (!conversationId) {
      console.log('No conversation ID provided')
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 })
    }

    const apiKey = process.env.XI_API_KEY
    if (!apiKey) {
      console.log('No API key configured')
      return NextResponse.json({ error: 'XI_API_KEY is not configured' }, { status: 500 })
    }

    console.log('Making request to ElevenLabs API for conversation:', conversationId)
    let done = false
    let transcript = []
    let attempts = 0
    const maxAttempts = 60 // 30 seconds max wait time

    while (!done && attempts < maxAttempts) {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
        {
          headers: { 'xi-api-key': apiKey }
        }
      )

      console.log('ElevenLabs API response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.log('ElevenLabs API error response:', errorText)
        throw new Error(`ElevenLabs API error: ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log('ElevenLabs conversation data:', data)
      console.log('ElevenLabs conversation status:', data.status)
      
      done = data.status === 'done'
      transcript = data.transcript || []
      console.log('Transcript length:', transcript.length)
      
      if (!done) {
        console.log(`Attempt ${attempts + 1}/${maxAttempts} - waiting for transcript to be ready...`)
        await new Promise(resolve => setTimeout(resolve, 500)) // Wait 500ms before next check
        attempts++
      }
    }

    if (!done) {
      console.log('Transcript processing timeout')
      return NextResponse.json({ 
        error: 'Transcript processing timeout',
        transcript: transcript // Return partial transcript if available
      }, { status: 408 })
    }

    console.log('Final transcript:', transcript)

    // Convert ElevenLabs transcript format to our format
    const formattedTranscript = transcript.map((entry: any, index: number) => {
      let role: 'user' | 'assistant' = entry.role === 'user' ? 'user' : 'assistant'
      // Some payloads may use 'ai' or 'agent' or 'assistant'
      if (['ai', 'assistant', 'agent'].includes(entry.role)) role = 'assistant'
      return {
        id: `transcript_${index}`,
        role,
        content: entry.message || entry.text || '',
        timestamp: new Date(Date.now() - (entry.time_in_call_secs || 0) * 1000),
      }
    })

    console.log('Formatted transcript:', formattedTranscript)

    return NextResponse.json({ 
      transcript: formattedTranscript,
      conversationId,
      status: 'done'
    })

  } catch (error: any) {
    console.error('Error fetching transcript:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch transcript' 
    }, { status: 500 })
  }
} 