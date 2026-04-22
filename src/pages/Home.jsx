function Empty({icon,title,sub}){return(
  <div style={{textAlign:"center",padding:"44px 20px"}}>
    <div style={{fontSize:50,marginBottom:12}}>{icon}</div>
    <div style={{fontWeight:600,color:"#475569",fontSize:15}}>{title}</div>
    {sub&&<div style={{fontSize:13,color:"#94A3B8",marginTop:5}}>{sub}</div>}
  </div>
)}

function Tag({text,color}){return <span className="tag" style={{background:color+"18",color}}>{text}</span>}

const gGradient = "linear-gradient(135deg,#4285F4 0%,#34A853 100%)";

export function Home({ openAdd, overdue, upcoming, totalDue, payments, markPaid, syncOne, syncAll, CAT, REC, fmt, daysLeft, isOverdue }) {
  return (
    <div style={{padding:14}} className="fade">
      {overdue.length>0 && <div className="card" style={{marginBottom:12,padding:16,borderLeft:"4px solid #EF4444",background:"#FFF5F5"}}>
        <div style={{fontWeight:700,color:"#DC2626",marginBottom:10}}>⚠️ Pagamenti Scaduti</div>
        {overdue.map(p=>(
          <div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid #FEE2E2"}}>
            <div>
              <div style={{fontWeight:600,fontSize:14,color:"#1E293B"}}>{CAT[p.category]?.emoji} {p.title}</div>
              <div style={{fontSize:12,color:"#94A3B8",marginTop:2}}>{fmt(p.dueDate)}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontWeight:800,color:"#EF4444",fontSize:16}}>€{p.amount.toFixed(2)}</div>
              <button onClick={()=>markPaid(p.id)} style={{fontSize:11,color:"#10B981",fontWeight:700,background:"none",border:"none",cursor:"pointer",marginTop:2,WebkitTapHighlightColor:"transparent"}}>✓ Segna pagato</button>
            </div>
          </div>
        ))}
      </div>}

      <div className="card" style={{padding:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontWeight:700,fontSize:16,color:"#1E293B"}}>📅 Prossime scadenze</div>
          <button onClick={openAdd} style={{background:"#4285F4",color:"#fff",border:"none",borderRadius:9,padding:"6px 15px",fontSize:13,fontWeight:700,cursor:"pointer",WebkitTapHighlightColor:"transparent"}}>+ Nuova</button>
        </div>
        {upcoming.length===0 ? <Empty icon="🎉" title="Nessuna scadenza imminente" sub="Ottimo lavoro!"/>
        : upcoming.slice(0,8).map((p,i) => {
          const d=daysLeft(p.dueDate); const urgent=d<=7;
          return (
            <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 0",borderBottom:i<Math.min(upcoming.length,8)-1?"1px solid #F1F5F9":"none"}}>
              <div style={{width:42,height:42,borderRadius:13,background:CAT[p.category]?.color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:21,flexShrink:0}}>{CAT[p.category]?.emoji}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:14,color:"#1E293B",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.title}</div>
                <div style={{fontSize:11,color:urgent?"#F59E0B":"#94A3B8",fontWeight:urgent?700:400,marginTop:2}}>{fmt(p.dueDate)} · {urgent?`⚡ tra ${d}gg`:`tra ${d}gg`}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontWeight:800,fontSize:16,color:"#1E293B"}}>€{p.amount.toFixed(2)}</div>
                <button onClick={()=>syncOne(p)} style={{fontSize:10,color:p.synced?"#34A853":"#4285F4",fontWeight:700,background:"none",border:"none",cursor:"pointer",marginTop:2,WebkitTapHighlightColor:"transparent"}}>
                  {p.synced?"✅ Sync":"📅 Sync"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {upcoming.length>0 && <button onClick={syncAll} style={{background:gGradient,color:"#fff",border:"none",borderRadius:13,padding:"14px",fontWeight:700,fontSize:15,cursor:"pointer",width:"100%",marginTop:12,WebkitTapHighlightColor:"transparent"}}>📅 Sincronizza tutto con Google</button>}

      <div className="card" style={{marginTop:12,padding:16}}>
        <div style={{fontWeight:700,fontSize:14,color:"#1E293B",marginBottom:12}}>📊 Spese per categoria</div>
        {Object.entries(CAT).map(([k,v])=>{
          const tot=payments.filter(p=>p.category===k&&!p.paid).reduce((s,p)=>s+p.amount,0);
          if(!tot) return null;
          const pct=totalDue>0?(tot/totalDue)*100:0;
          return(<div key={k} style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:13,color:"#475569"}}>{v.emoji} {v.label}</span>
              <span style={{fontSize:13,fontWeight:700,color:"#1E293B"}}>€{tot.toFixed(2)}</span>
            </div>
            <div style={{height:5,background:"#F1F5F9",borderRadius:99,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${pct}%`,background:v.color,borderRadius:99}}/>
            </div>
          </div>);
        })}
      </div>
    </div>
  );
}
