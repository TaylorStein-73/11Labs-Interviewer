// Simple webhook forwarder for stable ElevenLabs integration
// Deploy this to Vercel for a stable URL that forwards to your local dev server

export default async function handler(req, res) {
  // Your current ngrok URL - update this when ngrok restarts
  const LOCAL_DEV_URL = process.env.LOCAL_DEV_URL || 'https://b1c1-2601-152-1481-4760-b50c-23be-60ee-4fe8.ngrok-free.app';
  
  try {
    // Forward the request to your local development server
    // Check if it's a get-section call or legacy get-next-question
    const endpoint = req.body && req.body.section_name ? '/api/get-section' : '/api/get-next-question';
    
    const response = await fetch(`${LOCAL_DEV_URL}${endpoint}`, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });
    
    const data = await response.json();
    
    // Return the response from your local server
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error('Forwarder error:', error);
    res.status(500).json({ 
      error: 'Failed to reach local development server',
      message: 'Make sure your local server and ngrok are running'
    });
  }
} 