import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '@/lib/AppContext'
import { useAI } from '@/lib/useAI'
import { useTranslation } from '@/hooks/useTranslation'
import { MOODS } from '@/lib/bibleData'
import { RevealCard } from '@/components/ui/MotionComponents'
import EmptyState from '@/components/ui/EmptyState'

export default function InspirePage() {
  const { showToast, setActivePage } = useApp()
  const { ask, loading } = useAI()
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [selectedMood, setSelectedMood] = useState(null)
  const [results, setResults] = useState([])
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (e) => {
    e?.preventDefault()
    const searchTerm = query.trim() || selectedMood?.label || ''
    if (!searchTerm) {
      showToast('Please enter a topic or select a mood', '⚠️')
      return
    }

    setHasSearched(true)
    setResults([])

    try {
      const prompt = `
        You are a pastoral AI assistant. The user is seeking scripture guidance.
        Their situation or feeling: "${searchTerm}".
        Suggest 4-6 relevant Bible verses. For each, provide the reference, the full verse text, and a brief reason.
        Return a valid JSON object with no extra text:
        {
          "verses": [
            { "reference": "Isaiah 41:10", "text": "Fear not, for I am with you...", "reason": "God promises his presence and strength." },
            ...
          ],
          "pastoral_note": "A warm, encouraging message (2-3 sentences)."
        }
        Do not include any markdown or extra text. Return ONLY the JSON.
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
        }
      }
    } catch (error) {
      console.error('Search error:', error)
      showToast(t('aiRequestFailed'), '❌')
    }
  }

  const handleMoodClick = (mood) => {
    setSelectedMood(mood)
    setQuery(mood.label)
    setTimeout(() => handleSearch(), 100)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <RevealCard>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 500 }}>
            {t('findYourWord')}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            {t('describeSituation')}
          </p>

          <form onSubmit={handleSearch} style={{ position: 'relative' }}>
            <input
              className="input-search"
              placeholder={t('searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ paddingRight: 80 }}
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              style={{
                position: 'absolute',
                right: 6,
                top: '50%',
                transform: 'translateY(-50%)',
                padding: '8px 16px',
              }}
              disabled={loading}
            >
              {loading ? '...' : '🔍 Search'}
            </button>
          </form>

          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8 }}>
              {t('moodLabel')}
            </div>
            <div className="mood-grid">
              {MOODS.slice(0, 8).map((mood) => (
                <motion.button
                  key={mood.key}
                  className={`mood-chip ${selectedMood?.key === mood.key ? 'selected' : ''}`}
                  onClick={() => handleMoodClick(mood)}
                  whileTap={{ scale: 0.92 }}
                  whileHover={{ y: -2 }}
                >
                  <span className="mood-emoji">{mood.emoji}</span>
                  <span className="mood-label">{mood.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </RevealCard>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ textAlign: 'center', padding: 40 }}
          >
            <div className="loading-dots">
              <div className="loading-dot" />
              <div className="loading-dot" />
              <div className="loading-dot" />
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 12 }}>
              {t('searching')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && hasSearched && results.length === 0 && (
        <EmptyState
          icon="📖"
          headline={t('noVersesFound')}
          body={t('tryDifferentWords')}
          ctaLabel="Try again"
          onCta={() => { setQuery(''); setSelectedMood(null); setHasSearched(false); }}
        />
      )}

      {!loading && results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {results.map((verse, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="verse-card"
            >
              <span className="verse-ref">{verse.reference}</span>
              <p className="verse-text">{verse.text || `[${verse.reference}]`}</p>
              {verse.reason && (
                <p className="verse-note" style={{ fontSize: 13, color: 'var(--ink-500)' }}>
                  {verse.reason}
                </p>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={() => {
                    const msg = `*${verse.reference}*\n\n_${verse.text || ''}_\n\n— Rhema AI 📖`
                    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
                    showToast(t('shareToWhatsApp'), '💬')
                  }}
                  className="btn btn-gold btn-sm"
                >
                  💬 {t('share')}
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${verse.reference}: ${verse.text || ''}`)
                    showToast(t('copied'), '📋')
                  }}
                  className="btn btn-outline btn-sm"
                >
                  📋 {t('copy')}
                </button>
                <button
                  onClick={() => setActivePage('sermon')}
                  className="btn btn-outline btn-sm"
                >
                  🎙 {t('sermon')}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}