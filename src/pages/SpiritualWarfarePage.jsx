import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '@/lib/AppContext'
import { useAI } from '@/lib/useAI'
import { useTranslation } from '@/hooks/useTranslation'
import { useAIServices, RESPONSE_LANGUAGES } from '@/lib/aiServices'
import { TRANSLATIONS } from '@/lib/bibleData'
import { RevealCard, MagneticBtn, MotionHeadline } from '@/components/ui/MotionComponents'
import EmptyState from '@/components/ui/EmptyState'

const QUICK_SITUATIONS = [
  { key:'fear', emoji:'😰', label:'Fear & anxiety' },
  { key:'addiction', emoji:'⛓️', label:'Addiction' },
  { key:'financial', emoji:'💰', label:'Financial crisis' },
  { key:'sickness', emoji:'🩺', label:'Sickness' },
  { key:'marriage', emoji:'💔', label:'Broken marriage' },
  { key:'depression', emoji:'🌧', label:'Depression' },
  { key:'unemployment', emoji:'📉', label:'Unemployment' },
  { key:'family', emoji:'👪', label:'Family conflict' },
]

export default function SpiritualWarfarePage(){
  const { t } = useTranslation()
  const { showToast, warfareEntries, saveWarfareEntry, deleteWarfareEntry, user } = useApp()
  const { ask, loading } = useAI()
  const services = useAIServices(ask)
  const [situation, setSituation] = useState('')
  const [tran, setTran] = useState(user.translation || 'KJV')
  const [lang, setLang] = useState('en')
  const [result, setResult] = useState(null)
  const [view, setView] = useState('build')

  const langLabel = RESPONSE_LANGUAGES.find(l=>l.code===lang)?.label || 'English'

  const generate = async () => {
    if (!situation.trim()) { showToast('Describe what you\'re facing first', '⚠️'); return }
    setResult(null)
    const r = await services.generateWarfare({ situation: situation.trim(), translation: tran, languageLabel: langLabel })
    if (r) { setResult(r); showToast('Battle plan ready', '⚔️') }
    else showToast('Could not generate — check your AI keys in Settings', '❌')
  }

  const quickPick = (label) => { setSituation(`I'm dealing with ${label.toLowerCase()}.`) }

  const shareWA = () => {
    if (!result) return
    const msg = `⚔️ *Spiritual Warfare — ${situation}*\n\n${result.solution}\n\n*Declarations:*\n${result.declarations?.map(d=>`✦ ${d}`).join('\n')}\n\n— Rhema AI · OmniCraft Studios`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
    showToast(t('shareToWhatsApp'), '💬')
  }

  const save = () => { if (result) saveWarfareEntry({ situation, translation: tran, language: lang, ...result }) }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <RevealCard>
        <div style={{ borderRadius:24, overflow:'hidden', position:'relative', background:'var(--ink-900)', padding:28 }}>
          <div style={{ position:'absolute', top:-40, right:-40, width:220, height:220, background:'radial-gradient(circle,rgba(212,168,75,0.18) 0%,transparent 70%)' }}/>
          <div style={{ fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--gold-300)', marginBottom:8 }}>⚔️ Spiritual Warfare Engine</div>
          <MotionHeadline text="Fight the battle with the Word." as="h1" style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(20px,3vw,30px)', fontWeight:400, color:'rgba(250,247,242,0.95)', lineHeight:1.2 }}/>
          <p style={{ fontSize:13, color:'rgba(250,247,242,0.55)', marginTop:10, maxWidth:480, lineHeight:1.6 }}>
            Tell it what you're really facing — fear, addiction, a financial crisis, sickness, a broken marriage, depression. It will hand you scripture to stand on, declarations to speak, and a real strategy to fight with.
          </p>
        </div>
      </RevealCard>

      <div style={{ display:'flex', gap:0, background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:12, padding:4, width:'fit-content' }}>
        {[['build','⚔️ Build'],['library',`📁 Saved (${warfareEntries.length})`]].map(([m,label])=>(
          <button key={m} onClick={()=>setView(m)} style={{ padding:'8px 16px', borderRadius:9, fontSize:13, fontWeight:500, cursor:'pointer', background:view===m?'var(--ink-900)':'transparent', color:view===m?'var(--text-inverse)':'var(--text-muted)', border:'none', transition:'all var(--dur-fast) ease' }}>
            {label}
          </button>
        ))}
      </div>

      {view==='build' && (
        <>
          <RevealCard delay={0.05}>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div className="input-group">
                <label className="input-label">What are you facing?</label>
                <textarea className="textarea-field" rows={4} placeholder="Be specific — e.g. I've been struggling with panic attacks since I lost my job, and I feel like God has gone quiet."
                  value={situation} onChange={e=>setSituation(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize:12, fontWeight:500, color:'var(--text-muted)', marginBottom:8 }}>Or start from a common battle:</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {QUICK_SITUATIONS.map(q=>(
                    <button key={q.key} onClick={()=>quickPick(q.label)} className="tag tag-gold" style={{ cursor:'pointer', padding:'7px 14px', fontSize:13 }}>
                      {q.emoji} {q.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid-2" style={{ gap:12 }}>
                <div className="input-group">
                  <label className="input-label">Scripture translation</label>
                  <select className="select-field" value={tran} onChange={e=>setTran(e.target.value)}>
                    {TRANSLATIONS.map(tr=><option key={tr.code} value={tr.code}>{tr.code} — {tr.name}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Response language</label>
                  <select className="select-field" value={lang} onChange={e=>setLang(e.target.value)}>
                    {RESPONSE_LANGUAGES.map(l=><option key={l.code} value={l.code}>{l.label}</option>)}
                  </select>
                </div>
              </div>
              <MagneticBtn onClick={generate} disabled={!situation.trim()||loading} className="btn btn-primary btn-lg" style={{ width:'100%', justifyContent:'center', gap:10 }}>
                {loading ? <><span className="loading-dots"><span className="loading-dot"/><span className="loading-dot"/><span className="loading-dot"/></span> Building your battle plan…</> : <>⚔️ Get My Battle Plan</>}
              </MagneticBtn>
            </div>
          </RevealCard>

          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div className="card-elevated">
                  <div style={{ fontSize:11, fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--gold-700)', marginBottom:8 }}>✦ Your Situation</div>
                  <p style={{ fontSize:14, color:'var(--ink-700)', lineHeight:1.7 }}>{result.situationSummary}</p>
                </div>

                <div className="card-gold">
                  <div style={{ fontSize:11, fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--gold-700)', marginBottom:8 }}>✦ The Solution</div>
                  <p style={{ fontFamily:'var(--font-serif)', fontSize:16, fontStyle:'italic', color:'var(--ink-800)', lineHeight:1.75 }}>{result.solution}</p>
                </div>

                <div>
                  <div style={{ fontSize:11, fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:10 }}>⚔️ Battle Scriptures</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {result.battleScriptures?.map((v,i)=>(
                      <div key={i} className="verse-card" style={{ padding:'18px 22px' }}>
                        <span className="verse-ref">{v.ref} · {tran}</span>
                        <p className="verse-text">{v.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div style={{ fontSize:11, fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:10 }}>🕊 Declarations</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {result.declarations?.map((d,i)=>(
                      <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                        <span style={{ color:'var(--gold-500)', fontSize:16, lineHeight:1.6 }}>✦</span>
                        <p style={{ fontSize:14.5, color:'var(--ink-800)', lineHeight:1.7, fontWeight:500 }}>{d}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div style={{ fontSize:11, fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:10 }}>🙏 Prayer Points</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {result.prayerPoints?.map((p,i)=>(
                      <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                        <span style={{ color:'var(--terra-500)', fontSize:13, marginTop:2 }}>{i+1}.</span>
                        <p style={{ fontSize:14, color:'var(--ink-700)', lineHeight:1.7 }}>{p}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-dark">
                  <div style={{ fontSize:11, fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--gold-300)', marginBottom:10 }}>🎯 How To Fight — Next 7 Days</div>
                  <p style={{ fontSize:14, lineHeight:1.8, whiteSpace:'pre-wrap', color:'rgba(250,247,242,0.88)' }}>{result.howToFight}</p>
                </div>

                <div style={{ background:'var(--sage-100)', borderRadius:16, padding:20 }}>
                  <p style={{ fontSize:14, color:'var(--sage-600)', lineHeight:1.75, fontStyle:'italic' }}>{result.encouragement}</p>
                </div>

                <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                  <button onClick={save} className="btn btn-gold">🔖 Save Battle Plan</button>
                  <button onClick={shareWA} className="btn btn-outline">💬 WhatsApp</button>
                  <button onClick={()=>{ setResult(null); setSituation('') }} className="btn btn-ghost">Start over</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {view==='library' && (
        warfareEntries.length===0
          ? <EmptyState icon="⚔️" headline="No battle plans saved yet." body="Build one above and save it for whenever you need to return to it." ctaLabel="Build one now" onCta={()=>setView('build')}/>
          : <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {warfareEntries.map(e=>(
                <div key={e.id} className="card">
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:4 }}>{e.date}</div>
                      <p style={{ fontSize:14, fontWeight:500, color:'var(--text-primary)' }}>{e.situationSummary || e.situation}</p>
                    </div>
                    <button onClick={()=>deleteWarfareEntry(e.id)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color:'var(--terra-400)' }}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
      )}
    </div>
  )
}
