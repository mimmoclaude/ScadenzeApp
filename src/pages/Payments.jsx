function Empty({icon,title,sub}){return(
  <div style={{textAlign:"center",padding:"44px 20px"}}>
    <div style={{fontSize:50,marginBottom:12}}>{icon}</div>
    <div style={{fontWeight:600,color:"#475569",fontSize:15}}>{title}</div>
    {sub&&<div style={{fontSize:13,color:"#94A3B8",marginTop:5}}>{sub}</div>}
  </div>
)}

function Tag({text,color}){return <span className="tag" style={{background:color+"18",color}}>{text}</span>}

export function Payments({ filtered, filter, openAdd, openEdit, deletePay, markPaid, syncOne, CAT, REC, fmt, daysLeft, isOverdue }) {
  return (
    <div style={{padding:14}} className="fade">
      <div style={{display:"flex",gap:6,marginBottom:12}}>
        {[["all","Tutte"],["upcoming","In arrivo"],["overdue","Scadute"],["paid","Pagate"]].map(([k,l])=>(
          <button key={k} onClick={()=>filter(k)} style={{flex:1,padding:"7px 4px",borderRadius:99,border:"none",cursor:"pointer",fontWeight:700,fontSize:12,background:"#4285F4",color:"#fff",boxShadow:"0 2px 8px rgba(66,133,244,.3)",WebkitTapHighlightColor:"transparent",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{l}</button>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{fontSize:13,color:"#94A3B8",fontWeight:500}}>{filtered.length} scadenz{filtered.length===1?"a":"e"}</div>
        <button onClick={openAdd} style={{background:"#4285F4",color:"#fff",border:"none",borderRadius:10,padding:"8px 16px",fontWeight:700,fontSize:13,cursor:"pointer",WebkitTapHighlightColor:"transparent"}}>+ Aggiungi</button>
      </div>
      {filtered.length===0 ? <Empty icon="📋" title="Nessuna scadenza" sub="Aggiungila o importa una bolletta"/>
      : filtered.map((p,i)=>(
        <div key={p.id} className="card fade" style={{marginBottom:10,padding:16,opacity:p.paid?.88:1,animationDelay:`${i*25}ms`}}>
          <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
            <div style={{width:44,height:44,borderRadius:14,background:CAT[p.category]?.color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{CAT[p.category]?.emoji}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700,fontSize:15,color:"#1E293B",textDecoration:p.paid?"line-through":"none",marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.title}</div>
              <div style={{fontSize:12,color:"#94A3B8"}}>{fmt(p.dueDate)} · <span style={{color:CAT[p.category]?.color,fontWeight:600}}>{REC[p.recurrence]}</span></div>
              {p.notes&&<div style={{fontSize:11,color:"#94A3B8",marginTop:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.notes}</div>}
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:7}}>
                {p.paid&&<Tag text="✓ Pagato" color="#10B981"/>}
                {isOverdue(p.dueDate)&&!p.paid&&<Tag text="Scaduto" color="#EF4444"/>}
                {!isOverdue(p.dueDate)&&!p.paid&&daysLeft(p.dueDate)<=7&&<Tag text={`⚡ tra ${daysLeft(p.dueDate)}gg`} color="#F59E0B"/>}
                {p.synced&&<Tag text="📅 Cal" color="#34A853"/>}
                {p.emailed&&<Tag text="📧 Mail" color="#4285F4"/>}
              </div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontWeight:800,fontSize:18,color:isOverdue(p.dueDate)&&!p.paid?"#EF4444":"#1E293B"}}>€{p.amount.toFixed(2)}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:6,marginTop:12,paddingTop:12,borderTop:"1px solid #F1F5F9",flexWrap:"wrap"}}>
            <button onClick={()=>markPaid(p.id)} style={{flex:"1 1 auto",minWidth:0,background:p.paid?"#F8FAFC":"#F0FDF4",color:p.paid?"#94A3B8":"#16A34A",border:"none",borderRadius:10,padding:"8px 6px",fontSize:12,fontWeight:700,cursor:"pointer",WebkitTapHighlightColor:"transparent",whiteSpace:"nowrap"}}>{p.paid?"↩️ Riapri":"✓ Pagato"}</button>
            <button onClick={()=>syncOne(p)} style={{flex:"1 1 auto",minWidth:0,background:"#F0F7FF",color:"#4285F4",border:"none",borderRadius:10,padding:"8px 6px",fontSize:12,fontWeight:700,cursor:"pointer",WebkitTapHighlightColor:"transparent",whiteSpace:"nowrap"}}>📅 Sync</button>
            <button onClick={()=>openEdit(p)} className="rBtn" style={{width:38,height:36,background:"#F8FAFC",color:"#64748B",fontSize:16,WebkitTapHighlightColor:"transparent"}}>✏️</button>
            <button onClick={()=>{if(confirm(`Eliminare "${p.title}"?`))deletePay(p.id);}} className="rBtn" style={{width:38,height:36,background:"#FEF2F2",color:"#EF4444",fontSize:16,WebkitTapHighlightColor:"transparent"}}>🗑️</button>
          </div>
        </div>
      ))}
    </div>
  );
}
