import { setSetting } from '../db';

const inp = {width:"100%",border:"1.5px solid #E2E8F0",borderRadius:11,padding:"12px 13px",fontSize:15,outline:"none",background:"#F8FAFC",color:"#1E293B",WebkitAppearance:"none"};
const btn = (bg,col,ex={}) => ({background:bg,color:col,border:"none",borderRadius:13,padding:"14px",fontWeight:700,fontSize:15,cursor:"pointer",width:"100%",...ex});
const gGradient = "linear-gradient(135deg,#4285F4 0%,#34A853 100%)";

export function Settings({ token, userEmail, clientId, setClientId, notifEmail, setNotifEmail, handleLogin, handleLogout, payments, setPayments, setSetting: setSettingFunc }) {
  const handleExport = async () => {
    const data = {
      payments,
      settings: { gClientId: clientId, userEmail, notifEmail },
      exportDate: new Date().toISOString()
    };
    const json = JSON.stringify(data, null, 2);
    const filename = `scadenze-backup-${new Date().toISOString().split('T')[0]}.json`;
    const blob = new Blob([json], { type: 'application/json' });

    // Android WebView: usa Web Share API (a.click() non funziona su Android)
    try {
      const file = new File([blob], filename, { type: 'application/json' });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Backup Scadenze App' });
        return;
      }
    } catch (e) {
      if (e?.name === 'AbortError') return; // utente ha annullato la condivisione
      // altri errori: fallback al metodo classico
    }

    // Fallback per browser desktop
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      setPayments(data.payments);
      if (data.settings.gClientId) setClientId(data.settings.gClientId);
      if (data.settings.notifEmail) setNotifEmail(data.settings.notifEmail);
    } catch {
      alert('Errore importazione file');
    }
  };

  return (
    <div style={{padding:14}} className="fade">

      {/* Google Connect */}
      <div className="card" style={{padding:18,marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
          <svg width="44" height="44" viewBox="0 0 44 44"><rect width="44" height="44" rx="13" fill="#fff" stroke="#E2E8F0" strokeWidth="1"/><path d="M22.5 19.3v5.4h7.5c-.3 1.9-2 5.6-7.5 5.6-4.5 0-8.2-3.7-8.2-8.3s3.7-8.3 8.2-8.3c2.6 0 4.3 1.1 5.3 2l3.6-3.5C29 9.4 26 8 22.5 8 15.6 8 10 13.6 10 20.5S15.6 33 22.5 33c7.8 0 13-5.5 13-13.2 0-.9-.1-1.6-.2-2.2h-12.8z" fill="#4285F4"/></svg>
          <div>
            <div style={{fontWeight:700,fontSize:16,color:"#1E293B"}}>Google Account</div>
            <div style={{fontSize:12,color:"#64748B",marginTop:2}}>Calendar · Gmail · Zero redirect URI</div>
          </div>
        </div>

        <div style={{background:"#F0F7FF",border:"1px solid #BFDBFE",borderRadius:11,padding:13,marginBottom:14,fontSize:12,color:"#1D4ED8",lineHeight:1.8}}>
          <b>⚡ Setup Google Cloud Console:</b><br/>
          1. Vai su <b>console.cloud.google.com</b><br/>
          2. Crea progetto → <b>API e servizi → Libreria</b><br/>
          3. Abilita <b>Google Calendar API</b> e <b>Gmail API</b><br/>
          4. <b>Credenziali → Crea → ID client OAuth 2.0</b><br/>
          5. Tipo: <b>Applicazione Web</b><br/>
          6. <b>Origini JavaScript autorizzate</b>: aggiungi <code>http://localhost:3000</code> + dominio produzione<br/>
          7. Copia il <b>Client ID</b> (termina con <code>.apps.googleusercontent.com</code>)
        </div>

        <label style={{fontSize:12,fontWeight:600,color:"#64748B",display:"block",marginBottom:5}}>Google Client ID</label>
        <input value={clientId} onChange={e=>setClientId(e.target.value)} onBlur={()=>setSetting("gClientId",clientId)}
          placeholder="123456789-abc.apps.googleusercontent.com"
          style={{...inp,fontFamily:"monospace",fontSize:11,marginBottom:12}}/>

        <label style={{fontSize:12,fontWeight:600,color:"#64748B",display:"block",marginBottom:5}}>📧 Email per notifiche</label>
        <input value={notifEmail} onChange={e=>setNotifEmail(e.target.value)} onBlur={()=>setSetting("notifEmail",notifEmail)}
          placeholder="tua@gmail.com"
          style={{...inp,marginBottom:14}}/>

        <button onClick={token ? handleLogout : handleLogin} style={{...btn(token?"#FEF2F2":gGradient, token?"#EF4444":"#fff"),WebkitTapHighlightColor:"transparent"}}>
          {token ? `🚪 Disconnetti (${userEmail})` : "🔑 Accedi con Google"}
        </button>

        {token && <div style={{marginTop:10,padding:"10px 12px",background:"#F0FDF4",borderRadius:10,fontSize:12,color:"#16A34A",fontWeight:500}}>
          ✅ Connesso · il token dura 1 ora. Se smette di funzionare, disconnetti e riconnetti.
        </div>}
      </div>

      {/* Sync Info */}
      <div className="card" style={{padding:18,marginBottom:12}}>
        <div style={{fontWeight:700,fontSize:15,color:"#1E293B",marginBottom:12}}>🔄 Come funziona la sync</div>
        {[["📅","Google Calendar","Evento con promemoria popup 1h prima + email 24h prima"],["📧","Gmail","Email di promemoria all'indirizzo configurato"],["🔔","Notifiche","Gestite direttamente da Google — arrivano anche su Android"]].map(([e,t,s])=>(
          <div key={t} style={{display:"flex",gap:12,padding:"9px 0",borderBottom:"1px solid #F1F5F9"}}>
            <span style={{fontSize:22,flexShrink:0}}>{e}</span>
            <div><div style={{fontSize:13,fontWeight:600,color:"#374151"}}>{t}</div><div style={{fontSize:11,color:"#94A3B8",marginTop:2}}>{s}</div></div>
          </div>
        ))}
      </div>

      {/* Data Management */}
      <div className="card" style={{padding:18,marginBottom:12}}>
        <div style={{fontWeight:700,fontSize:15,color:"#1E293B",marginBottom:12}}>💾 Gestione dati</div>
        <button onClick={handleExport} style={{...btn("#4285F4","#fff"),marginBottom:10,WebkitTapHighlightColor:"transparent"}}>📥 Esporta backup JSON</button>
        <label style={{display:"block"}}>
          <input type="file" accept=".json" onChange={handleImport} style={{display:"none"}}/>
          <button onClick={e=>e.currentTarget.parentElement.querySelector('input').click()} style={{...btn("#10B981","#fff"),WebkitTapHighlightColor:"transparent"}}>📤 Importa backup JSON</button>
        </label>
      </div>

      {/* Summary */}
      <div className="card" style={{padding:18,marginBottom:12}}>
        <div style={{fontWeight:700,fontSize:15,color:"#1E293B",marginBottom:12}}>📊 Riepilogo</div>
        {[["Scadenze",payments.length],["Importo dovuto",`€${payments.filter(p=>!p.paid).reduce((s,p)=>s+p.amount,0).toFixed(2)}`],["Su Calendar",payments.filter(p=>p.synced).length],["Email inviate",payments.filter(p=>p.emailed).length],["Pagate",payments.filter(p=>p.paid).length],["Account Google",token?userEmail:"Non connesso"]].map(([k,v])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #F1F5F9",fontSize:14}}>
            <span style={{color:"#64748B"}}>{k}</span>
            <span style={{fontWeight:700,color:"#1E293B",maxWidth:180,textAlign:"right",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{height:20}}/>
    </div>
  );
}
