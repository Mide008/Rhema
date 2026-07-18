// src/components/layout/Sidebar.jsx
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '@/lib/AppContext'
import { useTranslation } from '@/hooks/useTranslation'
import Icon3D, { GLYPHS } from '@/components/ui/Icon3D'

function buildNav(t){
  return [
    {label:'',items:[
      {id:'home',   icon:'home',label:t('navHome')},
      {id:'bible',  icon:'book',label:t('navBible')},
      {id:'inspire',icon:'sparkle',label:t('navInspire')},
      {id:'search', icon:'search',label:t('navSearch')},
    ]},
    {label:t('navGrowthSection'),items:[
      {id:'devotional',  icon:'leaf',label:t('navDevotional')},
      {id:'warfare',     icon:'sword',label:t('navWarfare')},
      {id:'confessions', icon:'heart',label:t('navConfessions')},
      {id:'prayer', icon:'praying',label:t('navPrayer')},
    ]},
    {label:t('navMinistrySection'),items:[
      {id:'sermon', icon:'megaphone',label:t('navSermon')},
      {id:'sunday', icon:'church',label:t('navSunday')},
      {id:'social', icon:'globe',label:t('navSocial')},
      {id:'study',  icon:'library',label:t('navStudy')},
    ]},
    {label:t('navLibrarySection'),items:[
      {id:'saved',  icon:'bookmark',label:t('navSaved')},
    ]},
  ]
}

export default function Sidebar(){
  const {activePage,setActivePage,sidebarOpen,setSidebarOpen,user}=useApp()
  const { t } = useTranslation()
  const NAV = buildNav(t)
  const go=id=>{setActivePage(id);setSidebarOpen(false)}
  return(
    <>
      <aside style={{width:'var(--sidebar-w)',flexShrink:0,background:'var(--ink-900)',display:'flex',flexDirection:'column',position:'fixed',left:0,top:0,bottom:0,zIndex:'var(--z-nav)',borderRight:'1px solid rgba(255,255,255,0.05)'}} className="desktop-only">
        <Inner activePage={activePage} go={go} user={user} NAV={NAV} t={t}/>
      </aside>
      <AnimatePresence>
        {sidebarOpen&&(
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setSidebarOpen(false)}
              style={{position:'fixed',inset:0,background:'rgba(28,23,16,0.55)',backdropFilter:'blur(4px)',WebkitBackdropFilter:'blur(4px)',zIndex:200}}/>
            <motion.aside initial={{x:'-100%'}} animate={{x:0,transition:{type:'spring',damping:28,stiffness:300}}} exit={{x:'-100%',transition:{duration:0.2}}}
              style={{width:'var(--sidebar-w)',background:'var(--ink-900)',display:'flex',flexDirection:'column',position:'fixed',left:0,top:0,bottom:0,zIndex:300}}>
              <button onClick={()=>setSidebarOpen(false)} style={{position:'absolute',top:14,right:14,background:'none',border:'none',cursor:'pointer',color:'rgba(250,247,242,0.45)',fontSize:20,display:'flex',padding:6}}>×</button>
              <Inner activePage={activePage} go={go} user={user} NAV={NAV} t={t}/>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function Inner({activePage,go,user,NAV,t}){
  return(
    <div style={{display:'flex',flexDirection:'column',height:'100%',padding:'0 10px',overflow:'hidden'}}>
      <div style={{padding:'22px 12px 16px',borderBottom:'1px solid rgba(255,255,255,0.06)',flexShrink:0}}>
        <div style={{fontFamily:'var(--font-serif)',fontSize:24,fontWeight:600,color:'var(--gold-300)',letterSpacing:'-0.01em',lineHeight:1}}>Rhema AI</div>
        <div style={{fontSize:9,letterSpacing:'0.14em',textTransform:'uppercase',color:'rgba(250,247,242,0.25)',marginTop:4}}>The Living Word · OmniCraft Studios</div>
      </div>
      <nav style={{flex:1,overflowY:'auto',paddingTop:8,paddingBottom:8}}>
        {NAV.map((section,si)=>(
          <div key={si}>
            {section.label&&<div style={{fontSize:9,letterSpacing:'0.13em',textTransform:'uppercase',color:'rgba(250,247,242,0.24)',padding:'var(--space-2) var(--space-4)',marginTop:'var(--space-4)'}}>{section.label}</div>}
            {section.items.map((item,ii)=>{
              const active=activePage===item.id
              return(
                <motion.button key={item.id} onClick={()=>go(item.id)} whileTap={{scale:0.97}}
                  initial={{opacity:0,x:-8}} animate={{opacity:1,x:0,transition:{delay:si*0.04+ii*0.03+0.1}}}
                  aria-current={active?'page':undefined}
                  style={{display:'flex',alignItems:'center',gap:'var(--space-3)',padding:'10px var(--space-4)',borderRadius:'var(--radius-md)',color:active?'var(--gold-300)':'rgba(250,247,242,0.52)',background:active?'rgba(212,168,75,0.12)':'transparent',fontSize:14,fontWeight:400,cursor:'pointer',width:'100%',border:'none',transition:'all var(--dur-fast) ease',position:'relative',justifyContent:'flex-start'}}>
                  {active&&<span style={{position:'absolute',left:-1,top:'50%',transform:'translateY(-50%)',width:3,height:'60%',background:'var(--gold-400)',borderRadius:'0 2px 2px 0'}}/>}
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} style={{flexShrink:0}}>{GLYPHS[item.icon]}</svg>
                  <span style={{flex:1,textAlign:'left'}}>{item.label}</span>
                  {active&&<div style={{width:5,height:5,borderRadius:'50%',background:'var(--gold-400)'}}/>}
                </motion.button>
              )
            })}
          </div>
        ))}
      </nav>
      <div style={{padding:'12px 4px',borderTop:'1px solid rgba(255,255,255,0.06)',flexShrink:0}}>
        <button onClick={()=>go('settings')} style={{display:'flex',alignItems:'center',gap:10,padding:'10px var(--space-4)',borderRadius:'var(--radius-md)',color:activePage==='settings'?'var(--gold-300)':'rgba(250,247,242,0.52)',background:activePage==='settings'?'rgba(212,168,75,0.12)':'transparent',width:'100%',border:'none',cursor:'pointer',transition:'all var(--dur-fast) ease'}}>
          <div style={{width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,var(--gold-700),var(--gold-500))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'var(--ink-900)',flexShrink:0}}>{(user?.name||'R').slice(0,2).toUpperCase()}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:500,color:'rgba(250,247,242,0.85)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.name||'Welcome'}</div>
            <div style={{fontSize:10,color:'rgba(250,247,242,0.33)',textTransform:'capitalize'}}>{user?.type||'believer'}</div>
          </div>
          <span style={{fontSize:14,color:'rgba(250,247,242,0.28)'}}>⚙️</span>
        </button>
      </div>
    </div>
  )
}