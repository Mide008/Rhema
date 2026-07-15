const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export const getScriptureGuidanceGemini = async (userInput, mood = null) => {
  const prompt = `
    You are a pastoral AI assistant. The user is feeling: ${mood || 'unknown'}.
    They said: "${userInput}".
    Based on their situation, suggest 3-5 relevant Bible verses (book, chapter, verse only — no full text).
    Return a JSON object with:
    {
      "verses": [
        { "reference": "Isaiah 41:10", "reason": "..." },
        ...
      ],
      "pastoral_note": "A warm, encouraging message (2-3 sentences)."
    }
  `;

  const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) throw new Error('Gemini API error');
  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  return JSON.parse(text);
};