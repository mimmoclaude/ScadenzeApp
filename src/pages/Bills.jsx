import React, { useState } from 'react';

function Empty({icon,title,sub}){return(
  <div style={{textAlign:"center",padding:"44px 20px"}}>
    <div style={{fontSize:50,marginBottom:12}}>{icon}</div>
    <div style={{fontWeight:600,color:"#475569",fontSize:15}}>{title}</div>
    {sub&&<div style={{fontSize:13,color:"#94A3B8",marginTop:5}}>{sub}</div>}
  </div>
)}

const inp = {width:"100%",border:"1.5px solid #E2E8F0",borderRadius:11,padding:"12px 13px",fontSize:15,outline:"none",background:"#F8FAFC",color:"#1E293B",WebkitAppearance:"none"};
const btn = (bg,col,ex={}) => ({background:bg,color:col,border:"none",borderRadius:13,padding:"14px",fontWeight:700,fontSize:15,cursor:"pointer",width:"100%",...ex});

export function Bills({ billData, setBillData, importBill, fmt }) {
  const [form, setForm] = React.useState({title:"",amount:"",dueDate:""});

  const handleAddManual = () => {
    if (!form.title || !form.amount || !form.dueDate) {
      alert("⚠️ Riempi tutti i campi");
      return;
    }
    const data = {
      title: form.title,
      amount: form.amount,
      dueDate: form.dueDate,
      description: ""
    };
    setBillData(data);
    setForm({title:"",amount:"",dueDate:""});
  };

  return (
    <div style={{padding:14}} className="fade">
      <div className="card" style={{padding:18,marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
          <div style={{width:44,height:44,borderRadius:14,background:"#EFF6FF",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>📄</div>
          <div><div style={{fontWeight:700,fontSize:16,color:"#1E293B"}}>Aggiungi Bolletta</div><div style={{fontSize:12,color:"#64748B",marginTop:2}}>Manualmente o leggi la foto</div></div>
        </div>

        <p style={{fontSize:13,color:"#64748B",marginBottom:12,lineHeight:1.65}}>Compila i dati della bolletta manualmente. Oppure fotografa la bolletta e leggi i dati a mano.</p>

        <label style={{fontSize:12,fontWeight:600,color:"#64748B",display:"block",marginBottom:5}}>Titolo bolletta *</label>
        <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Es. Bolletta Enel, TIM Fibra..." style={{...inp,marginBottom:12}}/>

        <label style={{fontSize:12,fontWeight:600,color:"#64748B",display:"block",marginBottom:5}}>Importo (€) *</label>
        <input type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="0.00" step="0.01" style={{...inp,marginBottom:12}}/>

        <label style={{fontSize:12,fontWeight:600,color:"#64748B",display:"block",marginBottom:5}}>Data scadenza *</label>
        <input type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} style={{...inp,marginBottom:14}}/>

        <button onClick={handleAddManual} style={{...btn("#4285F4","#fff"),WebkitTapHighlightColor:"transparent"}}>
          ➕ Anteprima Bolletta
        </button>
      </div>

      {billData&&<div className="card fade" style={{padding:16,marginBottom:12,border:"2px solid #BBF7D0"}}>
        <div style={{fontWeight:700,color:"#16A34A",marginBottom:12,fontSize:15}}>✅ Bolletta pronta</div>
        {[["📌","Titolo",billData.title],["💰","Importo",`€${parseFloat(billData.amount).toFixed(2)}`],["📅","Scadenza",billData.dueDate?fmt(billData.dueDate):"N/D"]].map(([e,k,v])=>(
          <div key={k} style={{display:"flex",gap:8,marginBottom:8,fontSize:14}}><span>{e}</span><span style={{color:"#64748B"}}>{k}:</span><span style={{fontWeight:600,color:"#1E293B"}}>{v}</span></div>
        ))}
        <div style={{display:"flex",gap:8,marginTop:14}}>
          <button onClick={importBill} style={{...btn("#16A34A","#fff"),flex:1,WebkitTapHighlightColor:"transparent"}}>✅ Aggiungi alle scadenze</button>
          <button onClick={()=>setBillData(null)} style={{...btn("#F1F5F9","#64748B",{width:"auto",padding:"14px 16px"}),WebkitTapHighlightColor:"transparent"}}>✕</button>
        </div>
      </div>}

      <div className="card" style={{padding:16,marginBottom:12,background:"#FFF8E1",border:"1px solid #FCD34D"}}>
        <div style={{fontWeight:700,fontSize:14,color:"#B45309",marginBottom:10}}>💡 Suggerimento</div>
        <p style={{fontSize:13,color:"#92400E",lineHeight:1.6}}>
          Fotografa la bolletta col telefono e leggi importo + data di scadenza.
          Compila il form qui sopra. È veloce! ⚡
        </p>
      </div>

      <div className="card" style={{padding:16}}>
        <div style={{fontWeight:700,fontSize:14,color:"#1E293B",marginBottom:12}}>📋 Che dati servono?</div>
        {[["Titolo","Nome fornitore/tipo bolletta (es. Bolletta Enel)"],["Importo €","Totale da pagare (spesso in rosso)"],["Scadenza","Data ultima per pagare (cerca \"scade il\")"]].map(([k,v])=>(
          <div key={k} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:"1px solid #F1F5F9",alignItems:"flex-start"}}>
            <span style={{fontSize:18,flexShrink:0}}>📝</span>
            <div><div style={{fontSize:13,fontWeight:600,color:"#374151"}}>{k}</div><div style={{fontSize:11,color:"#94A3B8",marginTop:2}}>{v}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}
