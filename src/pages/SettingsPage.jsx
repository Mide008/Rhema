import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '@/lib/AppContext'
import { useTranslation } from '@/hooks/useTranslation'
import { TRANSLATIONS } from '@/lib/bibleData'
import { RevealCard } from '@/components/ui/MotionComponents'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'
import { idbGetAll, idbClear } from '@/lib/idb'

const LANGS=[{code:'en',label:'English'},{code:'yo',label:'Yoruba'},{code:'ig',label:'Igbo'},{code:'pcm',label:'Nigerian Pidgin'},{code:'fr',label:'French'},{code:'es',label:'Spanish'}]
const TYPES=[{id:'pastor',label:'Pastor / Minister'},{id:'believer',label:'Everyday believer'},{id:'group-leader',label:'Group / cell leader'},{id:'student',label:'Bible student'}]
const DENS=['Pentecostal / Charismatic','Anglican / Episcopal','Baptist','Catholic','Non-denominational','Methodist','Reformed / Presbyterian','Adventist','Prefer not to say']

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
  const [fontScale,setFontScale]=useState(()=>parseFloat(localStorage.getItem('rhema_font_scale')||'1'))
  const fileRef=useRef(null)
  const upd=(f,v)=>setUser(u=>({...u,[f]:v}))

  useEffect(()=>{
    document.documentElement.style.setProperty('--font-scale', fontScale)
    localStorage.setItem('rhema_font_scale', String(fontScale))
  },[fontScale])

  const handleLanguageChange = (code) => {
    upd('language', code)
    showToast(`Language: ${LANGS.find(l=>l.code===code)?.label}`, '🌐')
  }

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2*1024*1024) { showToast('Image must be under 2MB','⚠️'); return }
    const reader = new FileReader()
    reader.onload = () => { upd('photo', reader.result); showToast('Profile photo updated','✓') }
    reader.readAsDataURL(file)
  }

  const handleExportData = async () => {
    const localData = {}
    for (let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i)
      try { localData[k] = JSON.parse(localStorage.getItem(k)) } catch { localData[k] = localStorage.getItem(k) }
    }
    const offlineEntries = await idbGetAll()
    const payload = { exportedAt: new Date().toISOString(), user, localStorage: localData, offlineEntries }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `rhema-ai-data-${Date.now()}.json`
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
    showToast('Your data was downloaded','📧')
  }

  const handleDeleteData = async () => {
    localStorage.clear()
    await idbClear()
    showToast('All local data deleted','⚠️')
    setTimeout(()=>window.location.reload(), 900)
  }

  const SECTIONS=[
    {id:'profile',emoji:'👤',label:t('profile'),desc:user.name,content:(
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div onClick={()=>fileRef.current?.click()} style={{width:64,height:64,borderRadius:'50%',background:user.photo?`url(${user.photo}) center/cover`:'linear-gradient(135deg,var(--gold-400),var(--gold-700))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:700,color:'var(--ink-900)',flexShrink:0,cursor:'pointer',border:'2px solid var(--border-gold)'}}>
            {!user.photo && (user.name||'R').slice(0,2).toUpperCase()}
          </div>
          <div>
            <button className="btn btn-outline btn-sm" onClick={()=>fileRef.current?.click()}>📷 {t('changePhoto')||'Change photo'}</button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{display:'none'}}/>
          </div>
        </div>
        <div className="input-group"><label className="input-label">{t('yourName')}</label><input className="input-field" value={user.name||''} onChange={e=>upd('name',e.target.value)}/></div>
        <div className="input-group"><label className="input-label">{t('email')}</label><input className="input-field" value={user.email||''} type="email" onChange={e=>upd('email',e.target.value)}/></div>
        <div className="input-group">
          <label className="input-label">{t('iAm')}</label>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>{TYPES.map(ty=><button key={ty.id} onClick={()=>upd('type',ty.id)} className={`tag ${user.type===ty.id?'tag-dark':'tag-ink'}`} style={{cursor:'pointer',padding:'7px 14px',fontSize:12.5}}>{ty.label}</button>)}</div>
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
    {id:'appearance',emoji:'🔠',label:t('appearance')||'Appearance',desc:`${Math.round(fontScale*100)}% text size`,content:(
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <div className="input-group">
          <label className="input-label">{t('textSize')||'Text size'}</label>
          <input type="range" min="0.85" max="1.4" step="0.05" value={fontScale} onChange={e=>setFontScale(parseFloat(e.target.value))} style={{width:'100%'}}/>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--text-muted)'}}><span>A</span><span style={{fontSize:18}}>A</span></div>
        </div>
        <p style={{fontSize:{'--font-scale':fontScale}[0]?undefined:16*fontScale,color:'var(--text-primary)'}}>Preview: "The Lord is my shepherd, I shall not want."</p>
      </div>
    )},
    {id:'bible',emoji:'📖',label:t('biblePreferences'),desc:user.translation||'KJV',content:(
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div className="input-group">
          <label className="input-label">{t('defaultTranslation')}</label>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {TRANSLATIONS.map(tr=>(
              <button key={tr.code} onClick={()=>{upd('translation',tr.code);showToast(`Default: ${tr.name}`,'📖')}}
                style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',borderRadius:10,cursor:'pointer',background:user.translation===tr.code?'var(--gold-50)':'var(--bg-card)',border:`1.5px solid ${user.translation===tr.code?'var(--gold-400)':'var(--border-subtle)'}`,transition:'all 0.15s'}}>
                <div><span style={{fontSize:13,fontWeight:user.translation===tr.code?600:400,marginRight:10}}>{tr.code}</span><span style={{fontSize:12,color:'var(--text-muted)'}}>{tr.name}</span></div>
                <span style={{fontSize:11,color:'var(--ink-300)',maxWidth:140,textAlign:'right'}}>{tr.notes}</span>
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
        <button className="btn btn-gold" style={{alignSelf:'flex-start'}} onClick={async()=>{
          upd('notifs', notifs)
          if ('Notification' in window) {
            const perm = await Notification.requestPermission()
            if (perm !== 'granted') { showToast('Enable notifications in your browser settings to receive reminders','🔕'); return }
          }
          showToast(t('saveNotifications'),'🔔')
        }}>{t('save')}</button>
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
        <p style={{fontSize:11,color:'var(--text-muted)'}}>Nav, actions and core screens are translated. Deeper AI-generated content (sermons, devotionals) is asked for in this language directly.</p>
      </div>
    )},
    {id:'privacy',emoji:'🔒',label:t('privacy'),desc:'Local-first storage',content:(
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <div style={{background:'var(--gold-50)',border:'1px solid var(--border-gold)',borderRadius:10,padding:14,fontSize:13,color:'var(--gold-800)',lineHeight:1.65}}>{t('dataPrivacy')}</div>
        <button onClick={handleExportData} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',background:'none',border:'none',cursor:'pointer',borderBottom:'1px solid var(--border-subtle)'}}>
          <span style={{fontSize:14}}>{t('downloadData')}</span><span style={{color:'var(--ink-200)'}}>→</span>
        </button>
        {!deleteConfirm
          ?<button onClick={()=>setDeleteConfirm(true)} style={{fontSize:13,color:'var(--terra-500)',fontWeight:500,background:'none',border:'none',cursor:'pointer',padding:0,textAlign:'left'}}>{t('deleteAccount')}</button>
          :<div style={{background:'var(--terra-100)',border:'1px solid rgba(168,90,72,0.25)',borderRadius:12,padding:16}}>
            <p style={{fontSize:14,fontWeight:500,color:'var(--terra-600)',marginBottom:8}}>{t('deleteConfirm')}</p>
            <div style={{display:'flex',gap:10,marginTop:12}}>
              <button onClick={handleDeleteData} className="btn btn-sm" style={{background:'var(--terra-500)',color:'white'}}>{t('yesDelete')}</button>
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
          <div style={{width:56,height:56,borderRadius:'50%',background:user.photo?`url(${user.photo}) center/cover`:'linear-gradient(135deg,var(--gold-400),var(--gold-700))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:700,color:'var(--ink-900)',flexShrink:0}}>
            {!user.photo && (user.name||'R').slice(0,2).toUpperCase()}
          </div>
          <div>
            <div style={{fontFamily:'var(--font-serif)',fontSize:20,fontWeight:500}}>{user.name||'Welcome'}</div>
            <div style={{fontSize:13,color:'var(--text-muted)',textTransform:'capitalize',display:'flex',alignItems:'center',gap:8}}>
              {TYPES.find(ty=>ty.id===user.type)?.label||user.type}
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
