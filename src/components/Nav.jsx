export function Nav({ tab, setTab }) {
  const NAV = [{id:"home",icon:"🏠",label:"Home"},{id:"payments",icon:"📋",label:"Scadenze"},{id:"bills",icon:"📄",label:"Bollette"},{id:"settings",icon:"⚙️",label:"Impostazioni"}];

  return (
    <div style={{background:"linear-gradient(145deg,#162560 0%,#2D4FBD 60%,#3B63E8 100%)",color:"#fff",flexShrink:0,paddingBottom:"env(safe-area-inset-bottom)",position:"relative"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)"}}>
        {NAV.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"10px 0 10px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,border:"none",background:"none",cursor:"pointer",color:tab===t.id?"#fff":"rgba(255,255,255,.45)",transition:"color .2s",position:"relative",WebkitTapHighlightColor:"transparent"}}>
            <span style={{fontSize:21}}>{t.icon}</span>
            <span style={{fontSize:10,fontWeight:tab===t.id?700:400}}>{t.label}</span>
            {tab===t.id&&<div style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)",width:24,height:3,background:"#fff",borderRadius:"3px 3px 0 0"}}/>}
          </button>
        ))}
      </div>
      <div style={{textAlign:"right",paddingRight:10,paddingBottom:2,fontSize:9,opacity:.4,color:"#fff",letterSpacing:.3}}>
        2023 - D. Branca &nbsp;&nbsp;&nbsp; v{__GIT_VERSION__}
      </div>
    </div>
  );
}
