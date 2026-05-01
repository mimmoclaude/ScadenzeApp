import React, { useState, useRef } from 'react';
import { getSetting } from '../db';
import { analyzePDFBill } from '../lib/pdfAnalyzer';

const inp = {width:"100%",border:"1.5px solid #E2E8F0",borderRadius:11,padding:"12px 13px",fontSize:15,outline:"none",background:"#F8FAFC",color:"#1E293B",WebkitAppearance:"none"};
const btn = (bg,col,ex={}) => ({background:bg,color:col,border:"none",borderRadius:13,padding:"14px",fontWeight:700,fontSize:15,cursor:"pointer",width:"100%",...ex});

// Stato analisi PDF
const STATI = { idle:'idle', loading:'loading', ok:'ok', warn:'warn', err:'err' };

export function Bills({ billData, setBillData, importBill, fmt }) {
  const [form,   setForm]   = useState({title:"",amount:"",dueDate:""});
  const [stato,  setStato]  = useState(STATI.idle);
  const [msg,    setMsg]    = useState('');
  const [fonte,  setFonte]  = useState('');   // 'regex' | 'claude' | 'none'
  const [draft,  setDraft]  = useState(null); // campi pre-compilati editabili
  const fileRef = useRef(null);

  // ── Lettura manuale ──────────────────────────────────────────────────────
  const handleAddManual = () => {
    if (!form.title || !form.amount || !form.dueDate) {
      alert("⚠️ Riempi tutti i campi");
      return;
    }
    setBillData({ title: form.title, amount: form.amount, dueDate: form.dueDate, description: "" });
    setForm({title:"",amount:"",dueDate:""});
  };

  // ── Lettura PDF ──────────────────────────────────────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';          // reset input per permettere ri-selezione

    setStato(STATI.loading);
    setMsg('Analisi in corso…');
    setDraft(null);
    setBillData(null);

    try {
      const apiKey = await getSetting('anthropicApiKey').catch(() => null);
      const result = await analyzePDFBill(file, apiKey || null);

      if (result.errore === 'pdf_scansionato') {
        setStato(STATI.err);
        setMsg('PDF scansionato: il testo non è leggibile. Inserisci i dati manualmente oppure attiva l\'analisi AI (Claude API).');
        return;
      }

      // Converti data "GG/MM/AAAA" → "AAAA-MM-GG" per input[type=date]
      let dueDateISO = '';
      if (result.scadenza) {
        const [d, m, y] = result.scadenza.split('/');
        dueDateISO = `${y}-${m}-${d}`;
      }

      setDraft({
        title:   result.fornitore || '',
        amount:  result.importo   != null ? String(result.importo) : '',
        dueDate: dueDateISO,
        categoria: result.categoria,
      });
      setFonte(result.fonte);

      if (result.warn || !result.importo || !result.scadenza) {
        setStato(STATI.warn);
        setMsg('Alcuni campi non rilevati automaticamente — verifica e correggi prima di aggiungere.');
      } else {
        setStato(STATI.ok);
        setMsg(`Estratti con ${result.fonte === 'claude' ? '🤖 Claude AI' : '🔍 analisi testo'} — verifica i dati.`);
      }
    } catch (err) {
      console.error('[Bills] PDF analysis error:', err);
      setStato(STATI.err);
      setMsg(`Errore: ${err.message || 'impossibile leggere il PDF'}`);
    }
  };

  const handleConfirmDraft = () => {
    if (!draft?.title || !draft?.amount || !draft?.dueDate) {
      alert('⚠️ Compila almeno titolo, importo e data prima di aggiungere.');
      return;
    }
    setBillData({ title: draft.title, amount: draft.amount, dueDate: draft.dueDate, description: '' });
    setDraft(null);
    setStato(STATI.idle);
  };

  const handleDiscardDraft = () => { setDraft(null); setStato(STATI.idle); setMsg(''); };

  // ── Colori stato ─────────────────────────────────────────────────────────
  const statoStyle = {
    [STATI.ok]:   { bg:'#F0FDF4', border:'#86EFAC', icon:'✅', col:'#15803D' },
    [STATI.warn]: { bg:'#FFFBEB', border:'#FCD34D', icon:'⚠️', col:'#92400E' },
    [STATI.err]:  { bg:'#FEF2F2', border:'#FECACA', icon:'❌', col:'#991B1B' },
  }[stato] || null;

  return (
    <div style={{padding:14}} className="fade">

      {/* ── SEZIONE LETTURA PDF ─────────────────────────────────────────── */}
      <div className="card" style={{padding:18,marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
          <div style={{width:44,height:44,borderRadius:14,background:"#EFF6FF",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>📄</div>
          <div>
            <div style={{fontWeight:700,fontSize:16,color:"#1E293B"}}>Leggi PDF bolletta</div>
            <div style={{fontSize:12,color:"#64748B",marginTop:2}}>Estrazione automatica dati</div>
          </div>
        </div>

        {/* Input file nascosto */}
        <input ref={fileRef} type="file" accept="application/pdf,.pdf"
          style={{display:"none"}} onChange={handleFileChange}/>

        <button
          onClick={() => fileRef.current?.click()}
          disabled={stato === STATI.loading}
          style={{...btn(stato===STATI.loading?"#94A3B8":"#4285F4","#fff"),
            marginBottom: stato!==STATI.idle ? 12 : 0,
            WebkitTapHighlightColor:"transparent",
            opacity: stato===STATI.loading ? .7 : 1}}>
          {stato === STATI.loading
            ? '⏳ Analisi in corso…'
            : '📄 Seleziona PDF bolletta'}
        </button>

        {/* Banner stato analisi */}
        {statoStyle && (
          <div style={{background:statoStyle.bg,border:`1px solid ${statoStyle.border}`,borderRadius:11,
            padding:"10px 13px",fontSize:13,color:statoStyle.col,lineHeight:1.55}}>
            {statoStyle.icon} {msg}
          </div>
        )}

        {/* Campi estratti editabili */}
        {draft && (
          <div style={{marginTop:14}}>
            <div style={{fontSize:12,fontWeight:700,color:"#64748B",marginBottom:10,
              display:"flex",alignItems:"center",gap:6}}>
              <span>DATI ESTRATTI</span>
              {fonte==='claude' && <span style={{background:"#EDE9FE",color:"#7C3AED",
                borderRadius:99,padding:"2px 8px",fontSize:11}}>🤖 Claude AI</span>}
              {fonte==='regex' && <span style={{background:"#E0F2FE",color:"#0369A1",
                borderRadius:99,padding:"2px 8px",fontSize:11}}>🔍 Analisi testo</span>}
            </div>

            <label style={{fontSize:12,fontWeight:600,color:"#64748B",display:"block",marginBottom:4}}>
              Fornitore / Titolo *
            </label>
            <input value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}
              placeholder="Es. Enel Energia, TIM…" style={{...inp,marginBottom:10}}/>

            <label style={{fontSize:12,fontWeight:600,color:"#64748B",display:"block",marginBottom:4}}>
              Importo (€) *
            </label>
            <input type="number" value={draft.amount}
              onChange={e=>setDraft({...draft,amount:e.target.value})}
              placeholder="0.00" step="0.01" style={{...inp,marginBottom:10}}/>

            <label style={{fontSize:12,fontWeight:600,color:"#64748B",display:"block",marginBottom:4}}>
              Data scadenza *
            </label>
            <input type="date" value={draft.dueDate}
              onChange={e=>setDraft({...draft,dueDate:e.target.value})}
              style={{...inp,marginBottom:14}}/>

            <div style={{display:"flex",gap:8}}>
              <button onClick={handleConfirmDraft}
                style={{...btn("#16A34A","#fff"),flex:1,WebkitTapHighlightColor:"transparent"}}>
                ✅ Aggiungi alle scadenze
              </button>
              <button onClick={handleDiscardDraft}
                style={{...btn("#F1F5F9","#64748B",{width:"auto",padding:"14px 16px"}),
                  WebkitTapHighlightColor:"transparent"}}>
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── SEZIONE MANUALE ─────────────────────────────────────────────── */}
      <div className="card" style={{padding:18,marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
          <div style={{width:44,height:44,borderRadius:14,background:"#F0FDF4",display:"flex",
            alignItems:"center",justifyContent:"center",fontSize:24}}>✏️</div>
          <div>
            <div style={{fontWeight:700,fontSize:16,color:"#1E293B"}}>Inserimento manuale</div>
            <div style={{fontSize:12,color:"#64748B",marginTop:2}}>Compila i dati a mano</div>
          </div>
        </div>

        <label style={{fontSize:12,fontWeight:600,color:"#64748B",display:"block",marginBottom:5}}>
          Titolo bolletta *
        </label>
        <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})}
          placeholder="Es. Bolletta Enel, TIM Fibra…" style={{...inp,marginBottom:12}}/>

        <label style={{fontSize:12,fontWeight:600,color:"#64748B",display:"block",marginBottom:5}}>
          Importo (€) *
        </label>
        <input type="number" value={form.amount}
          onChange={e=>setForm({...form,amount:e.target.value})}
          placeholder="0.00" step="0.01" style={{...inp,marginBottom:12}}/>

        <label style={{fontSize:12,fontWeight:600,color:"#64748B",display:"block",marginBottom:5}}>
          Data scadenza *
        </label>
        <input type="date" value={form.dueDate}
          onChange={e=>setForm({...form,dueDate:e.target.value})}
          style={{...inp,marginBottom:14}}/>

        <button onClick={handleAddManual}
          style={{...btn("#4285F4","#fff"),WebkitTapHighlightColor:"transparent"}}>
          ➕ Anteprima Bolletta
        </button>
      </div>

      {/* ── PREVIEW BOLLETTA PRONTA ─────────────────────────────────────── */}
      {billData && (
        <div className="card fade" style={{padding:16,marginBottom:12,border:"2px solid #BBF7D0"}}>
          <div style={{fontWeight:700,color:"#16A34A",marginBottom:12,fontSize:15}}>
            ✅ Bolletta pronta
          </div>
          {[["📌","Titolo",billData.title],
            ["💰","Importo",`€${parseFloat(billData.amount).toFixed(2)}`],
            ["📅","Scadenza",billData.dueDate ? fmt(billData.dueDate) : "N/D"]]
            .map(([e,k,v]) => (
              <div key={k} style={{display:"flex",gap:8,marginBottom:8,fontSize:14}}>
                <span>{e}</span>
                <span style={{color:"#64748B"}}>{k}:</span>
                <span style={{fontWeight:600,color:"#1E293B"}}>{v}</span>
              </div>
            ))}
          <div style={{display:"flex",gap:8,marginTop:14}}>
            <button onClick={importBill}
              style={{...btn("#16A34A","#fff"),flex:1,WebkitTapHighlightColor:"transparent"}}>
              ✅ Aggiungi alle scadenze
            </button>
            <button onClick={()=>setBillData(null)}
              style={{...btn("#F1F5F9","#64748B",{width:"auto",padding:"14px 16px"}),
                WebkitTapHighlightColor:"transparent"}}>✕</button>
          </div>
        </div>
      )}

      {/* ── INFO FUNZIONAMENTO ──────────────────────────────────────────── */}
      <div className="card" style={{padding:16}}>
        <div style={{fontWeight:700,fontSize:14,color:"#1E293B",marginBottom:10}}>
          ℹ️ Come funziona la lettura PDF
        </div>
        {[
          ["🔍","Analisi testo (offline)","Legge PDF digitali (da PC/app) — funziona sempre, senza internet"],
          ["🤖","Claude AI (opzionale)","Se inserisci la tua API key in Impostazioni, attiva l'AI per massima accuratezza e PDF scansionati"],
          ["✏️","Correzione manuale","I campi estratti sono sempre modificabili prima di salvare"],
        ].map(([ico,titolo,desc]) => (
          <div key={titolo} style={{display:"flex",gap:10,padding:"9px 0",
            borderBottom:"1px solid #F1F5F9",alignItems:"flex-start"}}>
            <span style={{fontSize:18,flexShrink:0}}>{ico}</span>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:"#374151"}}>{titolo}</div>
              <div style={{fontSize:11,color:"#94A3B8",marginTop:2,lineHeight:1.5}}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
