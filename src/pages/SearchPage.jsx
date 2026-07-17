import { useState, useEffect, useRef } from 'react'
import { useApp } from '@/lib/AppContext'
import { useAI } from '@/lib/useAI'
import { languageLabelFor } from '@/lib/aiServices'
import { useTranslation } from '@/hooks/useTranslation'
import { RevealCard } from '@/components/ui/MotionComponents'
import EmptyState from '@/components/ui/EmptyState'

export default function SearchPage() {
  const { showToast, user } = useApp()
  const { ask, loading, error } = useAI()
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [hasSearched, setHasSearched] = useState(false)
  const resultsRef = useRef(null)

  useEffect(() => {
    const savedQuery = sessionStorage.getItem('rhema_search_query')
    if (savedQuery) {
      sessionStorage.removeItem('rhema_search_query')
      setQuery(savedQuery)
      handleSearch(null, savedQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = async (e, override) => {
    e?.preventDefault()
    const term = (override ?? query).trim()
    if (!term) {
      showToast(t('noQuery') || 'Please enter a search term', '⚠️')
      return
    }

    setHasSearched(true)
    setResults([])

    try {
      const prompt = `
        You are a pastoral AI assistant. The user is searching for scripture guidance.
        Their search: "${term}".
        Suggest 4-6 relevant Bible verses. For each, provide the reference, the full verse text, and a brief reason.
        Return a valid JSON object with no extra text:
        {
          "verses": [
            { "reference": "Isaiah 41:10", "text": "Fear not, for I am with you...", "reason": "God promises his presence." },
            ...
          ],
          "pastoral_note": "A warm, encouraging message (2-3 sentences)."
        }
        ${languageLabelFor(user.language)!=='English' ? `Respond fully in ${languageLabelFor(user.language)}.\n        ` : ''}Do not include any markdown or extra text. Return ONLY the JSON.
      `
      const response = await ask(prompt)
      if (response) {
        let parsed
        try {
          const jsonMatch = response.match(/\{[\s\S]*\}/)
          parsed = JSON.parse(jsonMatch ? jsonMatch[0] : response)
        } catch {
          parsed = { verses: [], pastoral_note: response }
        }
        setResults(parsed.verses || [])
        if (parsed.verses?.length === 0) {
          showToast(t('noVersesFound'), '📖')
        } else {
          showToast(`${parsed.verses.length} ${t('versesFound')}`, '✨')
          setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
        }
      } else {
        showToast(error || t('aiRequestFailed'), '❌')
      }
    } catch (err) {
      console.error('Search error:', err)
      showToast(t('aiRequestFailed'), '❌')
    }
  }


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <RevealCard>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10 }}>
          <input
            className="input-search"
            placeholder={t('searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1 }}
            autoFocus
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '...' : '🔍 Search'}
          </button>
        </form>
      </RevealCard>

      {loading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div className="loading-dots">
            <div className="loading-dot" />
            <div className="loading-dot" />
            <div className="loading-dot" />
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 12 }}>
            {t('searching')}
          </p>
        </div>
      )}

      {!loading && hasSearched && results.length === 0 && (
        <EmptyState
          icon="📖"
          headline={t('noVersesFound')}
          body={`${t('tryDifferentWords')}`}
          ctaLabel="Try again"
          onCta={() => { setQuery(''); setHasSearched(false); }}
        />
      )}

      {!loading && results.length > 0 && (
        <div ref={resultsRef} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {results.map((verse, idx) => (
            <div key={idx} className="verse-card">
              <span className="verse-ref">{verse.reference}</span>
              <p className="verse-text">{verse.text || `[${verse.reference}]`}</p>
              {verse.reason && (
                <p className="verse-note" style={{ fontSize: 13, color: 'var(--ink-500)' }}>
                  {verse.reason}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}