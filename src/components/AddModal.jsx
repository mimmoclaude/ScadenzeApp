const inp = {width:"100%",border:"1.5px solid #E2E8F0",borderRadius:11,padding:"12px 13px",fontSize:15,outline:"none",background:"#F8FAFC",color:"#1E293B",WebkitAppearance:"none"};
const btn = (bg,col,ex={}) => ({background:bg,color:col,border:"none",borderRadius:13,padding:"14px",fontWeight:700,fontSize:15,cursor:"pointer",width:"100%",...ex});
const gGradient = "linear-gradient(135deg,#4285F4 0%,#34A853 100%)";

export function AddModal({ addOpen, setAddOpen, editId, form, setForm, saveForm, CAT, REC }) {
  return addOpen ? (
    <div onClick={e=>{if(e.target===e.currentTarget)setAddOpen(false);}} style={{position:"fixed",inset:0,background:"rgba(15,23,42,.48)",zIndex:500,display:"flex",alignItems:"flex-end",backdropFilter:"blur(3px)"}}>
      <div style={{width:"100%",maxWidth:480,margin:"0 auto",background:"#fff",borderRadius:"22px 22px 0 0",padding:"20px 20px 36px",maxHeight:"92dvh",overflowY:"auto",animation:"slideUp .3s cubic-bezier(.22,1,.36,1)"}}>
        <div style={{width:40,height:4,background:"#E2E8F0",borderRadius:99,margin:"0 auto 18px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{fontFamily:"'DM Serif Display'",fontSize:22,color:"#1E293B"}}>{editId?"Modifica":"Nuova scadenza"}</div>
          <button onClick={()=>setAddOpen(false)} style={{background:"#F1F5F9",border:"none",borderRadius:10,width:36,height:36,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",WebkitTapHighlightColor:"transparent"}}>✕</button>
        </div>
        {[{label:"Titolo *",key:"title",type:"text",ph:"Es. Bolletta Enel, Mutuo…"},{label:"Importo (€)",key:"amount",type:"number",ph:"0.00"},{label:"Data scadenza *",key:"dueDate",type:"date",ph:""}].map(f=>(
          <div key={f.key} style={{marginBottom:14}}>
            <label style={{fontSize:12,fontWeight:600,color:"#64748B",display:"block",marginBottom:5}}>{f.label}</label>
            <input type={f.type} placeholder={f.ph} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})} style={inp}/>
          </div>
        ))}
        <div style={{marginBottom:14}}>
          <label style={{fontSize:12,fontWeight:600,color:"#64748B",display:"block",marginBottom:5}}>Categoria</label>
          <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={inp}>
            {Object.entries(CAT).map(([k,v])=><option key={k} value={k}>{v.emoji} {v.label}</option>)}
          </select>
        </div>
        <div style={{marginBottom:14}}>
          <label style={{fontSize:12,fontWeight:600,color:"#64748B",display:"block",marginBottom:5}}>Frequenza</label>
          <select value={form.recurrence} onChange={e=>setForm({...form,recurrence:e.target.value})} style={inp}>
            {Object.entries(REC).map(([k,v])=><option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div style={{marginBottom:22}}>
          <label style={{fontSize:12,fontWeight:600,color:"#64748B",display:"block",marginBottom:5}}>Note</label>
          <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={2} placeholder="Numero fattura, IBAN…" style={{...inp,resize:"vertical"}}/>
        </div>
        <button onClick={saveForm} style={{...btn(gGradient,"#fff"),borderRadius:14,padding:"15px",WebkitTapHighlightColor:"transparent"}}>
          💾 {editId?"Aggiorna":"Salva scadenza"}
        </button>
      </div>
    </div>
  ) : null;
}
