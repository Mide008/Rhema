// src/components/layout/BottomNav.jsx
import { motion } from 'framer-motion'
import { useApp } from '@/lib/AppContext'
import { useTranslation } from '@/hooks/useTranslation'

export default function BottomNav() {
  const { activePage, setActivePage } = useApp()
  const { t } = useTranslation()
  const TABS = [
    { id: 'home', emoji: '🏠', label: t('navHome') },
    { id: 'bible', emoji: '📖', label: t('navBible') },
    { id: 'warfare', emoji: '⚔️', label: t('navWarfare') },
    { id: 'prayer', emoji: '🙏', label: t('navPrayer') },
    { id: 'saved', emoji: '🔖', label: t('navSaved') },
  ]

  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {TABS.map(tab => {
        const active = activePage === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => setActivePage(tab.id)}
            className={`bottom-nav-item ${active ? 'active' : ''}`}
            aria-current={active ? 'page' : undefined}
            style={{ position: 'relative' }}
          >
            {active && (
              <motion.div
                layoutId="bnav"
                style={{
                  position: 'absolute',
                  top: 4,
                  width: 28,
                  height: 28,
                  background: 'var(--gold-100)',
                  borderRadius: 8,
                  zIndex: 0,
                }}
                transition={{ type: 'spring', damping: 24, stiffness: 300 }}
              />
            )}
            <span style={{ fontSize: 19, position: 'relative', zIndex: 1 }}>
              {tab.emoji}
            </span>
            <span
              style={{
                position: 'relative',
                zIndex: 1,
                fontSize: 10,
                fontWeight: active ? 500 : 400,
                color: active ? 'var(--gold-700)' : 'var(--ink-400)',
              }}
            >
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}