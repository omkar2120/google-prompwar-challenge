// Optional serverless proxy (Vercel/Netlify-compatible) that keeps the Groq API
// key server-side instead of shipping it in the client bundle.
//
// To use it: deploy this file (Vercel auto-detects `/api/*`), set GROQ_API_KEY
// in the deployment's server env, and set VITE_GROQ_PROXY_URL=/api/groq in the
// frontend env. The client (src/lib/groqClient.js) will then omit the
// Authorization header and route requests through here.
//
// It transparently forwards /chat/completions and /audio/transcriptions.

const GROQ_BASE = 'https://api.groq.com/openai/v1';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GROQ_API_KEY not configured on the server.' });
    return;
  }

  // Map the sub-path (?path=chat/completions or ?path=audio/transcriptions).
  const path = (req.query?.path || 'chat/completions').replace(/^\//, '');
  const contentType = req.headers['content-type'] || 'application/json';

  try {
    const upstream = await fetch(`${GROQ_BASE}/${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': contentType,
      },
      body: contentType.includes('application/json') ? JSON.stringify(req.body) : req,
      duplex: 'half',
    });
    const text = await upstream.text();
    res.status(upstream.status).setHeader('Content-Type', 'application/json').send(text);
  } catch (err) {
    res.status(502).json({ error: `Proxy error: ${err.message}` });
  }
}
