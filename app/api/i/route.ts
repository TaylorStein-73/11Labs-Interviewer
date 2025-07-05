export const runtime = 'edge'

export const dynamic = 'force-dynamic'

export const fetchCache = 'force-no-store'

import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  let agentId = process.env.AGENT_ID
  let apiKey = process.env.XI_API_KEY
  try {
    const body = await request.json()
    if (body.apiKey) apiKey = body.apiKey
    if (body.agentId) agentId = body.agentId
  } catch (e) {}
  if (!agentId) throw Error('AGENT_ID is not set or received.')
  if (!apiKey) throw Error('XI_API_KEY is not set or received.')
  try {
    const apiUrl = new URL('https://api.elevenlabs.io/v1/convai/conversation/get_signed_url')
    apiUrl.searchParams.set('agent_id', agentId)
    const response = await fetch(apiUrl.toString(), {
      headers: { 'xi-api-key': apiKey },
    })
    if (!response.ok) throw new Error(response.statusText)
    const data = await response.json()
    
    console.log('ElevenLabs signed URL response:', JSON.stringify(data, null, 2))
    
    // Try to extract conversation ID from the signed URL
    let conversationId = null
    if (data.signed_url) {
      try {
        const url = new URL(data.signed_url)
        // The conversation ID might be in the URL path or query params
        console.log('Signed URL path:', url.pathname)
        console.log('Signed URL search params:', url.searchParams.toString())
        
        // Try to extract from path: /v1/convai/conversation/:conversation_id
        const pathParts = url.pathname.split('/')
        if (pathParts.includes('conversation') && pathParts.length > 3) {
          const convIndex = pathParts.indexOf('conversation')
          if (convIndex >= 0 && convIndex + 1 < pathParts.length) {
            conversationId = pathParts[convIndex + 1]
            console.log('Extracted conversation ID from URL path:', conversationId)
          }
        }
      } catch (error) {
        console.log('Error parsing signed URL:', error)
      }
    }
    
    // If we couldn't extract from URL, use the one from response or generate one
    if (!conversationId) {
      conversationId = data.conversation_id || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    
    console.log('Using conversation ID:', conversationId)
    
    return NextResponse.json({ 
      apiKey: data.signed_url,
      conversationId: conversationId
    })
  } catch (error) {
    // @ts-ignore
    const message = error.message || error.toString()
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
