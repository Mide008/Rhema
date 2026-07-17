// api/ai.js — Vercel Serverless Function (Node runtime)
// Keeps every AI provider key server-side. The browser only ever calls
// same-origin /api/ai and never sees ANTHROPIC_API_KEY / GEMINI_API_KEY / etc.

export const config = { runtime: 'nodejs' }

const isRealKey = (k) => !!k && !/^your[-_]/i.test(k) && k.length > 8

async function callClaude(prompt, key) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) throw new Error(`Claude ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const text = data.content?.find(b => b.type === 'text')?.text
  if (!text) throw new Error('Claude returned no text content')
  return text
}

async function callGemini(prompt, key) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  })
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned no text content')
  return text
}

async function callGroq(prompt, key) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4096,
    }),
  })
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('Groq returned no text content')
  return text
}

async function callOpenRouter(prompt, key) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4096,
    }),
  })
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('OpenRouter returned no text content')
  return text
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return }
  const { prompt } = req.body || {}
  if (!prompt || typeof prompt !== 'string') { res.status(400).json({ error: 'Missing prompt' }); return }

  const keys = {
    claude: process.env.ANTHROPIC_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    groq: process.env.GROQ_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
  }

  const chain = [
    ['claude', callClaude],
    ['gemini', callGemini],
    ['groq', callGroq],
    ['openrouter', callOpenRouter],
  ]

  const errors = []
  for (const [name, fn] of chain) {
    const key = keys[name]
    if (!isRealKey(key)) continue
    try {
      const text = await fn(prompt, key)
      res.status(200).json({ text, engine: name })
      return
    } catch (err) {
      errors.push(`${name}: ${err.message}`)
      continue
    }
  }

  res.status(502).json({
    error: 'No AI engine could fulfil this request. Add a real key for ANTHROPIC_API_KEY, GEMINI_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY in your Vercel project environment variables.',
    details: errors,
  })
}
