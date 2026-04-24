import { setSetting } from '../db';

const inp = {width:"100%",border:"1.5px solid #E2E8F0",borderRadius:11,padding:"12px 13px",fontSize:15,outline:"none",background:"#F8FAFC",color:"#1E293B",WebkitAppearance:"none"};
const btn = (bg,col,ex={}) => ({background:bg,color:col,border:"none",borderRadius:13,padding:"14px",fontWeight:700,fontSize:15,cursor:"pointer",width:"100%",...ex});
const gGradient = "linear-gradient(135deg,#4285F4 0%,#34A853 100%)";

export function Settings({ token, userEmail, clientId, setClientId, notifEmail, setNotifEmail, handleLogin, handleLogout, payments, setPayments, setSetting: setSettingFunc, enablePush, handleTogglePush, notifyDays, handleSetNotifyDays, fcmToken, firebaseConfigured, syncAllToFirestore }) {
  const toggleDay = (d) => {
    const has = (notifyDays || []).includes(d);
    const next = has ? notifyDays.filter(x => x !== d) : [...(notifyDays || []), d].sort((a,b) => b - a);
    handleSetNotifyDays?.(next);
  };
  const handleExport = async () => {
    const data = {
      payments,
      settings: { gClientId: clientId, userEmail, notifEmail },
      exportDate: new Date().toISOString()
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scadenze-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
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

        {/* Mostra logout se c'è token attivo OPPURE email salvata (token scaduto) */}
        <button onClick={(token || userEmail) ? handleLogout : handleLogin} style={{...btn((token||userEmail)?"#FEF2F2":gGradient, (token||userEmail)?"#EF4444":"#fff"),WebkitTapHighlightColor:"transparent"}}>
          {(token || userEmail) ? `🚪 Disconnetti${userEmail ? ` (${userEmail})` : ""}` : "🔑 Accedi con Google"}
        </button>

        {token && <div style={{marginTop:10,padding:"10px 12px",background:"#F0FDF4",borderRadius:10,fontSize:12,color:"#16A34A",fontWeight:500}}>
          ✅ Connesso · il token dura 1 ora. Se smette di funzionare, disconnetti e riconnetti.
        </div>}
        {!token && userEmail && <div style={{marginTop:10,padding:"10px 12px",background:"#FEF3C7",borderRadius:10,fontSize:12,color:"#B45309",fontWeight:500}}>
          ⚠️ Sessione scaduta · disconnetti e riconnetti per sincronizzare
        </div>}
      </div>

      {/* Notifiche Push Remote */}
      <div className="card" style={{padding:18,marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div>
            <div style={{fontWeight:700,fontSize:16,color:"#1E293B"}}>🔔 Notifiche push</div>
            <div style={{fontSize:12,color:"#64748B",marginTop:2}}>Promemoria anche ad app chiusa (FCM)</div>
          </div>
          {/* Switch on/off */}
          <label style={{position:"relative",display:"inline-block",width:48,height:28,flexShrink:0}}>
            <input type="checkbox" checked={!!enablePush} disabled={!firebaseConfigured || !userEmail} onChange={e => handleTogglePush?.(e.target.checked)} style={{opacity:0,width:0,height:0}}/>
            <span style={{position:"absolute",cursor:(!firebaseConfigured||!userEmail)?"not-allowed":"pointer",inset:0,background:enablePush?"#10B981":"#CBD5E1",borderRadius:14,transition:"0.2s",opacity:(!firebaseConfigured||!userEmail)?0.5:1}}>
              <span style={{position:"absolute",height:22,width:22,left:enablePush?23:3,top:3,background:"#fff",borderRadius:"50%",transition:"0.2s",boxShadow:"0 2px 4px rgba(0,0,0,0.2)"}}/>
            </span>
          </label>
        </div>

        {!firebaseConfigured && (
          <div style={{background:"#FEF3C7",border:"1px solid #FDE68A",borderRadius:11,padding:11,fontSize:12,color:"#92400E",lineHeight:1.5,marginBottom:10}}>
            ⚠️ <b>Firebase non configurato.</b> Compila <code>src/firebaseConfig.js</code> con i dati del tuo progetto Firebase e aggiungi <code>google-services.json</code> in <code>android/app/</code>.
          </div>
        )}
        {firebaseConfigured && !userEmail && (
          <div style={{background:"#F0F7FF",border:"1px solid #BFDBFE",borderRadius:11,padding:11,fontSize:12,color:"#1D4ED8",lineHeight:1.5,marginBottom:10}}>
            ℹ️ Prima accedi con Google per attivare le notifiche push.
          </div>
        )}

        {enablePush && firebaseConfigured && userEmail && (
          <>
            <div style={{fontSize:12,fontWeight:600,color:"#64748B",marginBottom:8,marginTop:6}}>Quando notificare (giorni di anticipo)</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
              {[7, 3, 1, 0].map(d => {
                const active = (notifyDays || []).includes(d);
                const label = d === 0 ? "Oggi" : d === 1 ? "1 giorno" : `${d} giorni`;
                return (
                  <button key={d} onClick={() => toggleDay(d)}
                    style={{flex:"1 1 40%",padding:"10px 12px",borderRadius:10,border:active?"2px solid #10B981":"1.5px solid #E2E8F0",background:active?"#ECFDF5":"#F8FAFC",color:active?"#065F46":"#64748B",fontWeight:600,fontSize:13,cursor:"pointer",WebkitTapHighlightColor:"transparent"}}>
                    {active ? "✓ " : ""}{label}
                  </button>
                );
              })}
            </div>

            <button onClick={syncAllToFirestore} style={{...btn("#4285F4","#fff"),marginBottom:8,WebkitTapHighlightColor:"transparent"}}>
              ☁️ Sincronizza scadenze su cloud
            </button>

            <div style={{fontSize:11,color:"#94A3B8",lineHeight:1.6,marginTop:4}}>
              Stato: {fcmToken ? <span style={{color:"#16A34A",fontWeight:600}}>✅ Dispositivo registrato</span> : <span style={{color:"#F59E0B",fontWeight:600}}>⏳ In attesa token...</span>}<br/>
              Il server controlla ogni giorno alle 8:00 e invia una push per ogni scadenza nei giorni selezionati.
            </div>
          </>
        )}
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
