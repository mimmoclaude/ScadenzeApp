import { useState, useEffect } from 'react';

const inp  = {width:'100%', border:'1.5px solid #E2E8F0', borderRadius:11, padding:'12px 13px',
  fontSize:15, outline:'none', background:'#F8FAFC', color:'#1E293B', WebkitAppearance:'none'};
const inpS = {...inp, padding:'10px 12px', fontSize:14};

const INIT = {
  title:'', date:'', time:'', endDate:'', endTime:'',
  allDay:false, location:'', category:'personal',
  recurrence:'once', reminder:30, notes:'',
};

const APPT_REC = { once:'Una volta', weekly:'Settimanale', monthly:'Mensile', annual:'Annuale' };

export function AddAppointmentModal({ open, onClose, editId, initForm, onSave, APPT_CAT }) {
  const [form, setForm] = useState(INIT);

  useEffect(() => {
    if (open) setForm(initForm ? { ...INIT, ...initForm } : INIT);
  }, [open, editId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.title.trim()) { alert('⚠️ Il titolo è obbligatorio'); return; }
    if (!form.date)          { alert('⚠️ La data è obbligatoria');  return; }
    onSave({ ...form, reminder: Number(form.reminder) });
  };

  return (
    <div
      style={{position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:200,
        display:'flex', alignItems:'flex-end', justifyContent:'center'}}
      onClick={e => e.target === e.currentTarget && onClose()}>

      <div
        style={{background:'#fff', borderRadius:'22px 22px 0 0', width:'100%', maxWidth:480,
          maxHeight:'92vh', display:'flex', flexDirection:'column', overflowY:'auto',
          padding:'20px 20px 32px'}}
        onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18}}>
          <div style={{fontWeight:700, fontSize:17, color:'#1E293B'}}>
            {editId ? '✏️ Modifica appuntamento' : '📅 Nuovo appuntamento'}
          </div>
          <button onClick={onClose}
            style={{background:'#F1F5F9', border:'none', borderRadius:99, width:32, height:32,
              cursor:'pointer', fontSize:18, color:'#64748B', display:'flex',
              alignItems:'center', justifyContent:'center'}}>✕</button>
        </div>

        {/* ── Titolo ── */}
        <label style={{fontSize:12, fontWeight:600, color:'#64748B', display:'block', marginBottom:5}}>Titolo *</label>
        <input value={form.title} onChange={e => set('title', e.target.value)}
          placeholder="Es. Visita medico, Riunione…" style={{...inp, marginBottom:14}}/>

        {/* ── Data + Ora inizio ── */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:form.allDay?14:10}}>
          <div>
            <label style={{fontSize:12, fontWeight:600, color:'#64748B', display:'block', marginBottom:5}}>Data *</label>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={inpS}/>
          </div>
          {!form.allDay && (
            <div>
              <label style={{fontSize:12, fontWeight:600, color:'#64748B', display:'block', marginBottom:5}}>Ora inizio</label>
              <input type="time" value={form.time} onChange={e => set('time', e.target.value)} style={inpS}/>
            </div>
          )}
        </div>

        {/* ── Data fine + Ora fine ── */}
        {!form.allDay && (
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10}}>
            <div>
              <label style={{fontSize:12, fontWeight:600, color:'#64748B', display:'block', marginBottom:5}}>Data fine (opz.)</label>
              <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} style={inpS}/>
            </div>
            <div>
              <label style={{fontSize:12, fontWeight:600, color:'#64748B', display:'block', marginBottom:5}}>Ora fine</label>
              <input type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} style={inpS}/>
            </div>
          </div>
        )}

        {/* ── Tutto il giorno ── */}
        <label style={{display:'flex', alignItems:'center', gap:8, marginBottom:14, cursor:'pointer'}}>
          <input type="checkbox" checked={form.allDay} onChange={e => set('allDay', e.target.checked)}
            style={{width:18, height:18, cursor:'pointer', accentColor:'#7C3AED'}}/>
          <span style={{fontSize:14, color:'#475569', fontWeight:500}}>Tutto il giorno</span>
        </label>

        {/* ── Luogo ── */}
        <label style={{fontSize:12, fontWeight:600, color:'#64748B', display:'block', marginBottom:5}}>Luogo (opzionale)</label>
        <input value={form.location} onChange={e => set('location', e.target.value)}
          placeholder="Es. Studio medico, Sala conferenze…" style={{...inp, marginBottom:14}}/>

        {/* ── Categoria + Promemoria ── */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14}}>
          <div>
            <label style={{fontSize:12, fontWeight:600, color:'#64748B', display:'block', marginBottom:5}}>Categoria</label>
            <select value={form.category} onChange={e => set('category', e.target.value)} style={inpS}>
              {Object.entries(APPT_CAT).map(([k,v]) => (
                <option key={k} value={k}>{v.emoji} {v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{fontSize:12, fontWeight:600, color:'#64748B', display:'block', marginBottom:5}}>Promemoria</label>
            <select value={form.reminder} onChange={e => set('reminder', e.target.value)} style={inpS}>
              <option value={0}>Nessuno</option>
              <option value={15}>15 min prima</option>
              <option value={30}>30 min prima</option>
              <option value={60}>1 ora prima</option>
              <option value={1440}>1 giorno prima</option>
            </select>
          </div>
        </div>

        {/* ── Ricorrenza ── */}
        <label style={{fontSize:12, fontWeight:600, color:'#64748B', display:'block', marginBottom:5}}>Ricorrenza</label>
        <select value={form.recurrence} onChange={e => set('recurrence', e.target.value)} style={{...inp, marginBottom:14}}>
          {Object.entries(APPT_REC).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
        </select>

        {/* ── Note ── */}
        <label style={{fontSize:12, fontWeight:600, color:'#64748B', display:'block', marginBottom:5}}>Note</label>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
          placeholder="Note aggiuntive…" rows={3}
          style={{...inp, resize:'none', marginBottom:20}}/>

        {/* ── Salva ── */}
        <button onClick={handleSave}
          style={{background:'#7C3AED', color:'#fff', border:'none', borderRadius:13, padding:'16px',
            fontWeight:700, fontSize:15, cursor:'pointer', width:'100%',
            WebkitTapHighlightColor:'transparent'}}>
          {editId ? '✅ Aggiorna appuntamento' : '✅ Salva appuntamento'}
        </button>
      </div>
    </div>
  );
}
