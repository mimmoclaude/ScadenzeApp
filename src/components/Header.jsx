export function Header({ tab, token, userEmail, overdue, upcoming, totalDue }) {
  return (
    <div style={{background:"linear-gradient(145deg,#162560 0%,#2D4FBD 60%,#3B63E8 100%)",color:"#fff",paddingTop:"calc(env(safe-area-inset-top) + 12px)",flexShrink:0,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-30,right:-30,width:130,height:130,borderRadius:"50%",background:"rgba(255,255,255,.06)"}}/>
      <div style={{position:"absolute",top:20,right:60,width:60,height:60,borderRadius:"50%",background:"rgba(255,255,255,.04)"}}/>

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,padding:"0 20px",position:"relative"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:38,height:38,borderRadius:11,background:"rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>💳</div>
          <div>
            <div style={{fontFamily:"'DM Serif Display'",fontSize:21,letterSpacing:"-0.3px",lineHeight:1}}>ScadenzeApp</div>
            <div style={{fontSize:11,opacity:.65,marginTop:2}}>Pagamenti · Bollette · Google</div>
          </div>
        </div>
        <div style={{background:token?"rgba(52,168,83,.3)":"rgba(255,255,255,.12)",borderRadius:10,padding:"5px 10px",fontSize:11,fontWeight:600,border:token?"1px solid rgba(52,168,83,.5)":"none",maxWidth:130,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
          {token ? `✅ ${userEmail.split("@")[0]}` : "⚪ Non connesso"}
        </div>
      </div>

      {tab==="home" && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:9,marginBottom:16,padding:"0 20px",position:"relative"}}>
          {[{n:overdue.length,l:"Scadute",bg:"rgba(239,68,68,.85)"},{n:upcoming.length,l:"In arrivo",bg:"rgba(255,255,255,.14)"},{n:`€${totalDue.toFixed(0)}`,l:"Totale dovuto",bg:"rgba(255,255,255,.1)"}].map(c=>(
            <div key={c.l} style={{background:c.bg,borderRadius:14,padding:"11px 12px",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,.1)"}}>
              <div style={{fontSize:22,fontWeight:800,letterSpacing:"-0.5px"}}>{c.n}</div>
              <div style={{fontSize:10,opacity:.82,marginTop:3,fontWeight:500}}>{c.l}</div>
            </div>
          ))}
        </div>
      )}
      {tab!=="home" && <div style={{height:14}}/>}
    </div>
  );
}
