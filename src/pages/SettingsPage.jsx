import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '@/lib/AppContext'
import { useTranslation } from '@/hooks/useTranslation'
import { TRANSLATIONS } from '@/lib/bibleData'
import { RevealCard } from '@/components/ui/MotionComponents'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'

const LANGS=[{code:'en',label:'English'},{code:'yo',label:'Yoruba'},{code:'ig',label:'Igbo'},{code:'pc',label:'Pidgin English'},{code:'fr',label:'French'},{code:'es',label:'Spanish'},{code:'pt',label:'Portuguese'}]
const TYPES=[{id:'pastor',label:'Pastor / Minister'},{id:'believer',label:'Everyday believer'},{id:'group-leader',label:'Group / cell leader'},{id:'student',label:'Bible student'}]
const DENS=['Pentecostal / Charismatic','Anglican / Episcopal','Baptist','Catholic','Non-denominational','Methodist','Reformed / Presbyterian','Adventist','Prefer not to say']
const AI_KEYS=[
  {key:'claude',label:'Claude (Anthropic)',env:'ANTHROPIC_API_KEY',url:'https://console.anthropic.com',noteKey:'primary'},
  {key:'gemini',label:'Gemini (Google)',env:'GEMINI_API_KEY',url:'https://aistudio.google.com/app/apikey',noteKey:'backup'},
  {key:'groq',label:'Groq (LLaMA 3)',env:'GROQ_API_KEY',url:'https://console.groq.com',noteKey:'ultraFast'},
  {key:'openrouter',label:'OpenRouter',env:'OPENROUTER_API_KEY',url:'https://openrouter.ai/keys',noteKey:'freeModels'},
]

function Toggle({checked,onChange}){
  return(
    <button role="switch" aria-checked={checked} onClick={onChange} style={{width:44,height:24,borderRadius:12,flexShrink:0,background:checked?'var(--gold-500)':'var(--ink-200)',border:'none',cursor:'pointer',position:'relative',transition:'background 0.2s'}}>
      <span style={{position:'absolute',top:3,left:checked?22:3,width:18,height:18,borderRadius:'50%',background:'white',transition:'left 0.2s',boxShadow:'0 1px 4px rgba(0,0,0,0.18)'}}/>
    </button>
  )
}

export default function SettingsPage(){
  const {user,setUser,showToast}=useApp()
  const { t } = useTranslation()
  const { canInstall, installed, promptInstall } = useInstallPrompt()
  const [open,setOpen]=useState(null)
  const [notifs,setNotifs]=useState({daily:true,sermon:false,prayer:false})
  const [deleteConfirm,setDeleteConfirm]=useState(false)
  const [aiStatus,setAiStatus]=useState(null)
  const [aiStatusError,setAiStatusError]=useState(false)
  const upd=(f,v)=>setUser(u=>({...u,[f]:v}))

  useEffect(()=>{
    fetch('/api/ai-status')
      .then(r=>r.ok ? r.json() : Promise.reject())
      .then(setAiStatus)
      .catch(()=>setAiStatusError(true))
  },[])

  const handleLanguageChange = (code) => {
    upd('language', code)
    showToast(`Language: ${LANGS.find(l=>l.code===code)?.label}`, '🌐')
  }

  const SECTIONS=[
    {id:'profile',emoji:'👤',label:t('profile'),desc:user.name,content:(
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <div className="input-group"><label className="input-label">{t('yourName')}</label><input className="input-field" value={user.name||''} onChange={e=>upd('name',e.target.value)}/></div>
        <div className="input-group"><label className="input-label">{t('email')}</label><input className="input-field" value={user.email||''} type="email" onChange={e=>upd('email',e.target.value)}/></div>
        <div className="input-group">
          <label className="input-label">{t('iAm')}</label>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>{TYPES.map(t=><button key={t.id} onClick={()=>upd('type',t.id)} className={`tag ${user.type===t.id?'tag-dark':'tag-ink'}`} style={{cursor:'pointer',padding:'7px 14px',fontSize:12.5}}>{t.label}</button>)}</div>
        </div>
        <div className="input-group"><label className="input-label">{t('denomination')}</label><select className="select-field" value={user.denomination||''} onChange={e=>upd('denomination',e.target.value)}>{DENS.map(d=><option key={d}>{d}</option>)}</select></div>
        <div className="input-group"><label className="input-label">{t('churchName')}</label><input className="input-field" placeholder="Your church" value={user.church||''} onChange={e=>upd('church',e.target.value)}/></div>
        <button className="btn btn-gold" style={{alignSelf:'flex-start'}} onClick={()=>showToast(t('profileSaved'),'✓')}>{t('saveProfile')}</button>
      </div>
    )},
    {id:'install',emoji:'📲',label:t('installApp'),desc:installed?t('installedDesc'):(canInstall?t('installAvailable'):t('installUnavailable')),content:(
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <div style={{background:'var(--gold-50)',border:'1px solid var(--border-gold)',borderRadius:10,padding:14,fontSize:13,color:'var(--gold-800)',lineHeight:1.65}}>
          {t('installDesc')}
        </div>
        {installed
          ?<div style={{fontSize:14,fontWeight:500,color:'var(--sage-600)',display:'flex',alignItems:'center',gap:8}}>✅ {t('installedDesc')}</div>
          :<button className="btn btn-gold" disabled={!canInstall} onClick={async()=>{const c=await promptInstall();if(c?.outcome==='accepted')showToast(t('installedDesc'),'📲')}} style={{alignSelf:'flex-start',opacity:canInstall?1:0.5}}>
            📲 {canInstall?t('installNow'):t('installUnavailable')}
          </button>
        }
      </div>
    )},
    {id:'bible',emoji:'📖',label:t('biblePreferences'),desc:user.translation||'KJV',content:(
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div className="input-group">
          <label className="input-label">{t('defaultTranslation')}</label>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {TRANSLATIONS.map(t=>(
              <button key={t.code} onClick={()=>{upd('translation',t.code);showToast(`Default: ${t.name}`,'📖')}}
                style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',borderRadius:10,cursor:'pointer',background:user.translation===t.code?'var(--gold-50)':'var(--bg-card)',border:`1.5px solid ${user.translation===t.code?'var(--gold-400)':'var(--border-subtle)'}`,transition:'all 0.15s'}}>
                <div><span style={{fontSize:13,fontWeight:user.translation===t.code?600:400,marginRight:10}}>{t.code}</span><span style={{fontSize:12,color:'var(--text-muted)'}}>{t.name}</span></div>
                <span style={{fontSize:11,color:'var(--ink-300)',maxWidth:140,textAlign:'right'}}>{t.notes}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )},
    {id:'notifications',emoji:'🔔',label:t('notifications'),desc:notifs.daily?`${t('dailyVerse')} at ${user.notifTime||'07:00'}`:t('notificationsDesc'),content:(
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        {[{key:'daily',label:t('dailyVerse'),desc:t('dailyVerseDesc')},{key:'sermon',label:t('sermonReminder'),desc:t('sermonReminderDesc')},{key:'prayer',label:t('prayerReminder'),desc:t('prayerReminderDesc')}].map(({key,label,desc})=>(
          <div key={key} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--border-subtle)'}}>
            <div><div style={{fontSize:14,fontWeight:500}}>{label}</div><div style={{fontSize:12,color:'var(--text-muted)'}}>{desc}</div></div>
            <Toggle checked={notifs[key]} onChange={()=>setNotifs(n=>({...n,[key]:!n[key]}))}/>
          </div>
        ))}
        {notifs.daily&&<div className="input-group"><label className="input-label">{t('dailyVerseTime')}</label><input type="time" className="input-field" value={user.notifTime||'07:00'} onChange={e=>upd('notifTime',e.target.value)}/></div>}
        <button className="btn btn-gold" style={{alignSelf:'flex-start'}} onClick={()=>showToast(t('saveNotifications'),'🔔')}>{t('save')}</button>
      </div>
    )},
    {id:'language',emoji:'🌐',label:t('language'),desc:LANGS.find(l=>l.code===user.language)?.label||'English',content:(
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {LANGS.map(l=>(
          <button key={l.code} onClick={()=>handleLanguageChange(l.code)}
            style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',borderRadius:10,cursor:'pointer',background:user.language===l.code?'var(--gold-50)':'var(--bg-card)',border:`1.5px solid ${user.language===l.code?'var(--gold-400)':'var(--border-subtle)'}`,transition:'all 0.15s'}}>
            <span style={{fontSize:14,fontWeight:user.language===l.code?500:400}}>{l.label}</span>
            {user.language===l.code&&<span style={{fontSize:12,color:'var(--gold-700)',fontWeight:600}}>✓ Selected</span>}
          </button>
        ))}
      </div>
    )},
    {id:'ai',emoji:'🤖',label:t('aiEngines'),desc:t('multiAI'),content:(
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <div style={{background:'var(--gold-50)',border:'1px solid var(--border-gold)',borderRadius:10,padding:14,fontSize:13,color:'var(--gold-800)',lineHeight:1.65}}>
          <strong>{t('aiFallback')}</strong> Keys are stored server-side only (Vercel project environment variables) and are never sent to this browser.
        </div>
        {aiStatusError && <div style={{fontSize:12,color:'var(--terra-600)'}}>Could not reach /api/ai-status — this is expected in local `vite dev` without `vercel dev`; it works once deployed.</div>}
        {AI_KEYS.map(k=>{
          const connected = aiStatus?.[k.key] === true
          return (
            <div key={k.label} style={{padding:'12px 14px',borderRadius:10,background:'var(--bg-card)',border:'1px solid var(--border-subtle)'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontSize:14,fontWeight:500,display:'flex',alignItems:'center',gap:8}}>
                  {k.label}
                  <span className={`tag ${connected?'tag-sage':'tag-terra'}`} style={{fontSize:9}}>{connected ? '● Connected' : '○ Not set'}</span>
                </span>
                <a href={k.url} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:'var(--gold-700)',fontWeight:500}}>{t('getFreeKey')}</a>
              </div>
              <code style={{fontSize:11,color:'var(--text-muted)',background:'var(--bg-primary)',padding:'2px 6px',borderRadius:4}}>{k.env}</code>
              <p style={{fontSize:12,color:'var(--ink-400)',marginTop:4}}>{t(k.noteKey)}</p>
            </div>
          )
        })}
      </div>
    )},
    {id:'privacy',emoji:'🔒',label:t('privacy'),desc:'GDPR compliant',content:(
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <div style={{background:'var(--gold-50)',border:'1px solid var(--border-gold)',borderRadius:10,padding:14,fontSize:13,color:'var(--gold-800)',lineHeight:1.65}}>{t('dataPrivacy')}</div>
        <button onClick={()=>showToast('Export requested — check your email','📧')} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',background:'none',border:'none',cursor:'pointer',borderBottom:'1px solid var(--border-subtle)'}}>
          <span style={{fontSize:14}}>{t('downloadData')}</span><span style={{color:'var(--ink-200)'}}>→</span>
        </button>
        {!deleteConfirm
          ?<button onClick={()=>setDeleteConfirm(true)} style={{fontSize:13,color:'var(--terra-500)',fontWeight:500,background:'none',border:'none',cursor:'pointer',padding:0,textAlign:'left'}}>{t('deleteAccount')}</button>
          :<div style={{background:'var(--terra-100)',border:'1px solid rgba(168,90,72,0.25)',borderRadius:12,padding:16}}>
            <p style={{fontSize:14,fontWeight:500,color:'var(--terra-600)',marginBottom:8}}>{t('deleteConfirm')}</p>
            <div style={{display:'flex',gap:10,marginTop:12}}>
              <button onClick={()=>showToast('Deletion requested','⚠️')} className="btn btn-sm" style={{background:'var(--terra-500)',color:'white'}}>{t('yesDelete')}</button>
              <button onClick={()=>setDeleteConfirm(false)} className="btn btn-outline btn-sm">{t('keepAccount')}</button>
            </div>
          </div>
        }
      </div>
    )},
    {id:'about',emoji:'ℹ️',label:t('about'),desc:t('version'),content:(
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div style={{textAlign:'center',padding:'20px 0'}}>
          <div style={{fontFamily:'var(--font-serif)',fontSize:32,fontWeight:600,color:'var(--gold-700)',marginBottom:6}}>Rhema AI</div>
          <div style={{fontSize:14,color:'var(--text-muted)',fontStyle:'italic',marginBottom:4}}>{t('tagline')}</div>
          <div style={{fontSize:12,color:'var(--text-muted)'}}>{t('version')} · {t('builtBy')}</div>
        </div>
        <div style={{background:'var(--gold-50)',border:'1px solid var(--border-gold)',borderRadius:10,padding:14,fontSize:13,color:'var(--gold-800)',lineHeight:1.7}}>
          {t('aiDisclaimer')}
        </div>
        <button onClick={()=>showToast(t('thankYou'),'⭐')} className="btn btn-outline" style={{justifyContent:'center',gap:8}}>⭐ {t('rateApp')}</button>
        <div style={{textAlign:'center',fontSize:11,color:'var(--text-muted)',paddingTop:8}}>© 2026 OmniCraft Studios. All rights reserved.</div>
      </div>
    )},
  ]

  return(
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <RevealCard>
        <div className="card-gold" style={{display:'flex',alignItems:'center',gap:16,marginBottom:4}}>
          <div style={{width:56,height:56,borderRadius:'50%',background:'linear-gradient(135deg,var(--gold-400),var(--gold-700))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:700,color:'var(--ink-900)',flexShrink:0}}>
            {(user.name||'R').slice(0,2).toUpperCase()}
          </div>
          <div>
            <div style={{fontFamily:'var(--font-serif)',fontSize:20,fontWeight:500}}>{user.name||'Welcome'}</div>
            <div style={{fontSize:13,color:'var(--text-muted)',textTransform:'capitalize',display:'flex',alignItems:'center',gap:8}}>
              {TYPES.find(t=>t.id===user.type)?.label||user.type}
              <span className="tag tag-gold" style={{fontSize:10}}>{user.translation}</span>
            </div>
          </div>
        </div>
      </RevealCard>

      {SECTIONS.map((s,i)=>(
        <motion.div key={s.id} className="card" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}} style={{padding:0,overflow:'hidden'}}>
          <button onClick={()=>setOpen(open===s.id?null:s.id)} style={{width:'100%',display:'flex',alignItems:'center',gap:14,padding:'14px 20px',background:'none',border:'none',cursor:'pointer',textAlign:'left'}}>
            <div style={{width:36,height:36,borderRadius:9,background:open===s.id?'var(--ink-900)':'var(--gold-100)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:18,transition:'all 0.15s'}}>
              {s.emoji}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:500}}>{s.label}</div>
              <div style={{fontSize:12,color:'var(--text-muted)',marginTop:1}}>{s.desc}</div>
            </div>
            <motion.span animate={{rotate:open===s.id?90:0}} style={{fontSize:12,color:'var(--text-muted)',transition:'transform 0.15s'}}>›</motion.span>
          </button>
          <AnimatePresence>
            {open===s.id&&(
              <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} style={{overflow:'hidden'}}>
                <div style={{padding:'0 20px 20px',borderTop:'1px solid var(--border-subtle)',paddingTop:16}}>{s.content}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  )
}