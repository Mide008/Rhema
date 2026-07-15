// src/services/bibleApi.js
// Real Bible text — replaces the old SAMPLE_CHAPTERS placeholder.
// Primary source: bible-api.com (free, keyless, CORS-enabled, public-domain translations).
// Optional upgrade: ESV, proxied server-side via /api/bible-esv so the ESV_API_KEY
// never reaches the browser. Configure ESV_API_KEY in Vercel project settings —
// get one free at https://api.esv.org/account/create-application/

// Map our TRANSLATIONS codes to bible-api.com's free public-domain identifiers.
// bible-api.com does not license NIV/NLT/ESV/AMP/MSG/NASB/CSB — those fall back
// to KJV text with a note, unless the server-side ESV proxy is configured.
const BIBLE_API_MAP = {
  KJV: 'kjv', NKJV: 'kjv', WEB: 'web', NCV: 'web', GNT: 'web',
  ASV: 'asv', YLT: 'ylt', BBE: 'bbe', WEBSTER: 'webster',
  CLEMENTINE: 'clementine', ALMEIDA: 'almeida', RCCV: 'rccv',
}

const CACHE_PREFIX = 'rhema_bible_cache_'
const memCache = new Map()

function cacheGet(key) {
  if (memCache.has(key)) return memCache.get(key)
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    if (raw) { const v = JSON.parse(raw); memCache.set(key, v); return v }
  } catch {}
  return null
}
function cacheSet(key, value) {
  memCache.set(key, value)
  try { localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value)) } catch {}
}

async function fetchFromBibleApi(bookName, chapter, apiCode) {
  const ref = encodeURIComponent(`${bookName} ${chapter}`)
  const url = `https://bible-api.com/${ref}?translation=${apiCode}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`bible-api.com ${res.status}`)
  const data = await res.json()
  if (!data?.verses?.length) throw new Error('No verses in response')
  return data.verses.map(v => ({ v: v.verse, text: v.text.trim() }))
}

async function fetchFromESVProxy(bookName, chapter) {
  const res = await fetch(`/api/bible-esv?book=${encodeURIComponent(bookName)}&chapter=${chapter}`)
  if (!res.ok) throw new Error(`ESV proxy ${res.status}`)
  const data = await res.json()
  const raw = data?.passages?.[0] || ''
  const parts = raw.split(/\[(\d+)\]/).filter(s => s.trim())
  const verses = []
  for (let i = 0; i < parts.length; i += 2) {
    const num = parseInt(parts[i], 10)
    const text = (parts[i + 1] || '').trim()
    if (num && text) verses.push({ v: num, text })
  }
  return verses
}

/**
 * Fetch real chapter text for a book/chapter/translation.
 * Returns { verses: [{v,text}], source: 'esv'|'bible-api'|'kjv-fallback', note?: string }
 */
export async function fetchChapter(bookName, chapter, translationCode = 'KJV') {
  const cacheKey = `${bookName}_${chapter}_${translationCode}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  // Try the server-side ESV proxy first if ESV was requested — it silently
  // 404s if ESV_API_KEY isn't configured, and we fall through to bible-api.com.
  if (translationCode === 'ESV') {
    try {
      const verses = await fetchFromESVProxy(bookName, chapter)
      if (verses.length) { const result = { verses, source: 'esv' }; cacheSet(cacheKey, result); return result }
    } catch (err) {
      console.warn('ESV proxy unavailable, falling back:', err.message)
    }
  }

  const apiCode = BIBLE_API_MAP[translationCode] || 'kjv'
  try {
    const verses = await fetchFromBibleApi(bookName, chapter, apiCode)
    const isNativeMatch = translationCode === 'KJV' || translationCode === 'WEB' || translationCode === 'ASV' || translationCode === 'YLT' || translationCode === 'BBE'
    const result = isNativeMatch
      ? { verses, source: 'bible-api' }
      : { verses, source: 'kjv-fallback', note: `${translationCode} text isn't available from a free public-domain source — showing ${apiCode.toUpperCase()} instead. Configure ESV_API_KEY in your Vercel project for live ESV.` }
    cacheSet(cacheKey, result)
    return result
  } catch (err) {
    console.error('bible-api.com failed:', err.message)
    return { verses: [], source: 'error', note: 'Could not load this chapter. Check your connection and try again.' }
  }
}
