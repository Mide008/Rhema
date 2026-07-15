import { getScriptureGuidanceGemini } from './gemini';

const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;
const CLAUDE_URL = 'https://api.anthropic.com/v1/messages';

function buildPrompt(userInput, mood) {
  return `
    You are a pastoral AI assistant. The user is feeling: ${mood || 'unknown'}.
    They said: "${userInput}".
    Based on their situation, suggest 3-5 relevant Bible verses (book, chapter, verse only — no full text).
    Return a JSON object with:
    {
      "verses": [
        { "reference": "Isaiah 41:10", "reason": "A reason why this verse applies..." },
        ...
      ],
      "pastoral_note": "A warm, encouraging message (2-3 sentences)."
    }
  `;
}

export const getScriptureGuidance = async (userInput, mood = null) => {
  try {
    // Try Claude first
    const response = await fetch(CLAUDE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 800,
        messages: [{ role: 'user', content: buildPrompt(userInput, mood) }],
      }),
    });

    if (!response.ok) throw new Error('Claude API error');
    const data = await response.json();
    const content = data.content[0].text;
    return JSON.parse(content);
    
  } catch (error) {
    console.warn('Claude failed, falling back to Gemini:', error);
    // Fallback to Gemini
    return await getScriptureGuidanceGemini(userInput, mood);
  }
};