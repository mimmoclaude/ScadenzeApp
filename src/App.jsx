import { useState, useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { getPayments, addPayment, updatePayment, deletePayment, getSetting, setSetting, deleteAllPayments, exportPayments, importData,
         getAppointments, addAppointment, updateAppointment, deleteAppointment } from './db';
import { Header } from './components/Header';
import { Nav } from './components/Nav';
import { Home } from './pages/Home';
import { Payments } from './pages/Payments';
import { Bills } from './pages/Bills';
import { Appointments } from './pages/Appointments';
import { Settings } from './pages/Settings';
import { AddAppointmentModal } from './components/AddAppointmentModal';
import { Toast } from './components/Toast';
import { LoadingOverlay } from './components/LoadingOverlay';
import { AddModal } from './components/AddModal';

// ─── COSTANTI ─────────────────────────────────────────────────────────────────
const CAT = {
  utilities:    { emoji:"⚡", label:"Utenze",        color:"#F59E0B" },
  rent:         { emoji:"🏠", label:"Affitto/Mutuo", color:"#6366F1" },
  insurance:    { emoji:"🛡️", label:"Assicurazione", color:"#10B981" },
  taxes:        { emoji:"🏛️", label:"Tasse/F24",    color:"#EF4444" },
  subscription: { emoji:"📱", label:"Abbonamento",   color:"#8B5CF6" },
  other:        { emoji:"💳", label:"Altro",         color:"#64748B" },
};
const REC = { once:"Una volta", monthly:"Mensile", quarterly:"Trimestrale", annual:"Annuale" };

const APPT_CAT = {
  personal: { emoji:'👤', label:'Personale', color:'#8B5CF6' },
  work:     { emoji:'💼', label:'Lavoro',    color:'#3B82F6' },
  medical:  { emoji:'🏥', label:'Medico',    color:'#EF4444' },
  other:    { emoji:'📌', label:'Altro',     color:'#64748B' },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt       = d => d ? new Date(d).toLocaleDateString("it-IT",{day:"2-digit",month:"short",year:"numeric"}) : "—";
const isOverdue = d => d && new Date(d) < new Date();
const daysLeft  = d => Math.ceil((new Date(d) - new Date()) / 86400000);

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

const GCAL  = "https://www.googleapis.com/calendar/v3";
const GMAIL = "https://www.googleapis.com/gmail/v1";

// ─── API CALLS ────────────────────────────────────────────────────────────────
async function addToCalendar(token, p) {
  const start = new Date(p.dueDate);
  const end   = new Date(start); end.setHours(end.getHours()+1);
  const r = await fetch(`${GCAL}/calendars/primary/events`, {
    method:"POST",
    headers:{ "Authorization":`Bearer ${token}`, "Content-Type":"application/json" },
    body: JSON.stringify({
      summary: `${CAT[p.category]?.emoji} ${p.title} — €${p.amount}`,
      description: `💰 Importo: €${p.amount}\n📂 Categoria: ${CAT[p.category]?.label}\n🔁 Frequenza: ${REC[p.recurrence]}${p.notes?"\n📝 Note: "+p.notes:""}`,
      start: { dateTime: start.toISOString(), timeZone:"Europe/Rome" },
      end:   { dateTime: end.toISOString(),   timeZone:"Europe/Rome" },
      colorId: "5",
      reminders: { useDefault:false, overrides:[
        { method:"email", minutes: 24*60 },
        { method:"popup", minutes: 60 },
      ]},
    }),
  });
  if (!r.ok) { const e=await r.json(); throw new Error(e.error?.message||"Errore Calendar"); }
}

function makeMail(to, p) {
  const subj = `🔔 Scadenza: ${p.title} — €${p.amount.toFixed(2)} il ${fmt(p.dueDate)}`;
  const body = [
    `Ciao,`,``,
    `Ti ricordiamo che il ${fmt(p.dueDate)} scadrà il seguente pagamento:`,``,
    `📌 Oggetto:    ${p.title}`,
    `💰 Importo:    €${p.amount.toFixed(2)}`,
    `📂 Categoria:  ${CAT[p.category]?.label}`,
    `🔁 Frequenza:  ${REC[p.recurrence]}`,
    p.notes ? `📝 Note:       ${p.notes}` : null,
    ``,`— ScadenzeApp`,
  ].filter(l=>l!==null).join("\n");
  const raw = [`From: me`,`To: ${to}`,`Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subj)))}?=`,`MIME-Version: 1.0`,`Content-Type: text/plain; charset=utf-8`,``,body].join("\n");
  return btoa(unescape(encodeURIComponent(raw))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}

async function sendMail(token, to, p) {
  const r = await fetch(`${GMAIL}/users/me/messages/send`, {
    method:"POST",
    headers:{ "Authorization":`Bearer ${token}`, "Content-Type":"application/json" },
    body: JSON.stringify({ raw: makeMail(to, p) }),
  });
  if (!r.ok) { const e=await r.json(); throw new Error(e.error?.message||"Errore Gmail"); }
}

async function addAppointmentToCalendar(token, appt) {
  let start, end;
  if (appt.allDay) {
    start = { date: appt.date };
    end   = { date: appt.endDate || appt.date };
  } else {
    const sDT = new Date(`${appt.date}T${appt.time || '09:00'}:00`);
    const eDT = appt.endTime
      ? new Date(`${appt.endDate || appt.date}T${appt.endTime}:00`)
      : new Date(sDT.getTime() + 3600000);
    start = { dateTime: sDT.toISOString(), timeZone:'Europe/Rome' };
    end   = { dateTime: eDT.toISOString(), timeZone:'Europe/Rome' };
  }
  const reminders = appt.reminder > 0
    ? { useDefault:false, overrides:[{ method:'email', minutes:appt.reminder },{ method:'popup', minutes:appt.reminder }] }
    : { useDefault:false, overrides:[] };
  const body = {
    summary:     `${APPT_CAT[appt.category]?.emoji||'📅'} ${appt.title}`,
    description: appt.notes || '',
    start, end, reminders,
  };
  if (appt.location) body.location = appt.location;
  const r = await fetch(`${GCAL}/calendars/primary/events`, {
    method:'POST',
    headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) { const e = await r.json(); throw new Error(e.error?.message||'Errore Calendar'); }
  const data = await r.json();
  return data.id;
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export function App() {
  const [tab,        setTab]        = useState("home");
  const [payments,   setPayments]   = useState([]);
  const [token,      setToken]      = useState(null);
  const [userEmail,  setUserEmail]  = useState("");
  const [clientId,   setClientId]   = useState("837673127946-ec145h4fjbp66mqgedngkcv8c6vaf7gp.apps.googleusercontent.com"); // Web Client ID
  const [notifEmail, setNotifEmail] = useState("");
  const [loading,    setLoading]    = useState(false);
  const [billUrl,    setBillUrl]    = useState("");
  const [billData,   setBillData]   = useState(null);
  const [billErr,    setBillErr]    = useState("");
  const [addOpen,    setAddOpen]    = useState(false);
  const [editId,     setEditId]     = useState(null);
  const [toast,      setToast]      = useState(null);
  const [filter,     setFilter]     = useState("all");
  const [form,       setForm]       = useState({title:"",amount:"",dueDate:"",recurrence:"monthly",category:"utilities",notes:""});
  // ── Appuntamenti ─────────────────────────────────────────────────────────
  const [appointments,  setAppointments]  = useState([]);
  const [apptFilter,    setApptFilter]    = useState('all');
  const [apptModalOpen, setApptModalOpen] = useState(false);
  const [apptEditId,    setApptEditId]    = useState(null);
  const [apptInitForm,  setApptInitForm]  = useState(null);

  const tokenClientRef  = useRef(null);
  const touchStartX     = useRef(0);
  const touchStartY     = useRef(0);
  const touchCancelled  = useRef(false);

  const TABS = ['home','payments','appointments','bills','settings'];

  // ── Bootstrap ────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      const p = await getPayments();
      setPayments(p);
      const ap = await getAppointments();
      setAppointments(ap);
      const c  = await getSetting("gClientId");   if (c)  { setClientId(c); }
      const e  = await getSetting("userEmail");   if (e)  setUserEmail(e);
      const ne = await getSetting("notifEmail");  if (ne) setNotifEmail(ne);
    };
    loadData();
  }, []);

  // ── Google Identity Services ─────────────────────────────────────────────
  const initGIS = useCallback((cid) => {
    if (!window.google) return null;
    return window.google.accounts.oauth2.initTokenClient({
      client_id: cid,
      scope: SCOPES,
      callback: async (resp) => {
        if (resp.error) {
          notify("❌ " + (resp.error_description || resp.error));
          setLoading(false);
          return;
        }
        const tk = resp.access_token;
        setToken(tk);
        try {
          const me = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${tk}` }
          });
          const info = await me.json();
          setUserEmail(info.email || "");
          await setSetting("userEmail", info.email || "");
          if (!notifEmail) {
            setNotifEmail(info.email || "");
            await setSetting("notifEmail", info.email || "");
          }
          notify(`✅ Connesso come ${info.email}`);
        } catch {
          notify("✅ Connesso a Google");
        }
        setLoading(false);
      },
    });
  }, [notifEmail]);

  const handleLogin = async () => {
    const cid = clientId.trim();
    if (!cid) { notify("⚠️ Inserisci prima il Client ID Google"); return; }

    if (Capacitor.isNativePlatform()) {
      setLoading(true);
      try {
        // Android: usa sempre il Web Client ID (non Android Client ID)
        const WEB_CLIENT_ID = "837673127946-ec145h4fjbp66mqgedngkcv8c6vaf7gp.apps.googleusercontent.com";
        GoogleAuth.initialize({
          clientId: WEB_CLIENT_ID,
          scopes: ["email", "profile",
            "https://www.googleapis.com/auth/calendar.events",
            "https://www.googleapis.com/auth/gmail.send"],
          grantOfflineAccess: false,
        });
        const user = await GoogleAuth.signIn();
        const tk = user.authentication.accessToken;
        setToken(tk);
        const email = user.email || "";
        setUserEmail(email);
        await setSetting("userEmail", email);
        if (!notifEmail) { setNotifEmail(email); await setSetting("notifEmail", email); }
        notify(`✅ Connesso come ${email}`);
      } catch(e) {
        console.error('[GoogleAuth]', e);
        const code = e?.code || e?.errorCode || '';
        const msg = e?.message || e?.error || JSON.stringify(e);
        notify(`❌ Login fallito [${code}]: ${msg}`.slice(0, 180), 6000);
      } finally {
        setLoading(false);
      }
      return;
    }

    const tryLogin = () => {
      if (!window.google?.accounts?.oauth2) { setTimeout(tryLogin, 300); return; }
      setLoading(true);
      const client = initGIS(cid);
      if (!client) { notify("❌ Libreria Google non caricata, riprova"); setLoading(false); return; }
      tokenClientRef.current = client;
      client.requestAccessToken({ prompt: "consent" });
    };
    tryLogin();
  };

  const handleLogout = async () => {
    if (Capacitor.isNativePlatform()) {
      try { await GoogleAuth.signOut(); } catch {}
    } else if (token && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(token, () => {});
    }
    setToken(null);
    setUserEmail("");
    notify("Disconnesso da Google");
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const notify   = (msg, dur=3200) => { setToast(msg); setTimeout(() => setToast(null), dur); };
  const saveAll  = async (list) => {
    for (const p of list) {
      if (p.id) await updatePayment(p);
      else await addPayment(p);
    }
    setPayments(list);
  };
  const openAdd  = () => { setEditId(null); setForm({title:"",amount:"",dueDate:"",recurrence:"monthly",category:"utilities",notes:""}); setAddOpen(true); };
  const openEdit = p  => { setEditId(p.id); setForm({title:p.title,amount:String(p.amount),dueDate:p.dueDate,recurrence:p.recurrence,category:p.category,notes:p.notes||""}); setAddOpen(true); };

  // ── Handlers Appuntamenti ─────────────────────────────────────────────────
  const openAddAppt  = () => { setApptEditId(null); setApptInitForm(null); setApptModalOpen(true); };
  const openEditAppt = a  => { setApptEditId(a.id); setApptInitForm({...a}); setApptModalOpen(true); };

  const saveApptForm = async (form) => {
    const entry = { ...form, synced:false, calEventId:null, done:false, archived:false };
    if (apptEditId) {
      const existing = appointments.find(a => a.id === apptEditId);
      const updated  = { ...existing, ...form };
      await updateAppointment(updated);
      setAppointments(appointments.map(a => a.id === apptEditId ? updated : a));
      notify("✏️ Appuntamento aggiornato!");
    } else {
      const newAppt = { id: Date.now(), ...entry };
      await addAppointment(newAppt);
      setAppointments([...appointments, newAppt]);
      notify("✅ Appuntamento aggiunto!");
    }
    setApptModalOpen(false);
  };

  const deleteAppt = async (id) => {
    await deleteAppointment(id);
    setAppointments(appointments.filter(a => a.id !== id));
    notify("🗑️ Eliminato");
  };

  const markDoneAppt = async (id) => {
    const a = appointments.find(x => x.id === id);
    const updated = { ...a, done: !a.done };
    await updateAppointment(updated);
    setAppointments(appointments.map(x => x.id === id ? updated : x));
  };

  const archiveAppt = async (id) => {
    const a = appointments.find(x => x.id === id);
    const updated = { ...a, archived: true };
    await updateAppointment(updated);
    setAppointments(appointments.map(x => x.id === id ? updated : x));
    notify("📦 Archiviato");
  };

  const unarchiveAppt = async (id) => {
    const a = appointments.find(x => x.id === id);
    const updated = { ...a, archived: false };
    await updateAppointment(updated);
    setAppointments(appointments.map(x => x.id === id ? updated : x));
    notify("↩️ Ripristinato");
  };

  const syncAppt = async (appt) => {
    if (!token) { notify("⚠️ Prima connetti Google in Impostazioni"); return; }
    setLoading(true);
    try {
      const eventId = await addAppointmentToCalendar(token, appt);
      const updated = { ...appt, synced:true, calEventId:eventId };
      await updateAppointment(updated);
      setAppointments(appointments.map(a => a.id === appt.id ? updated : a));
      notify("📅 Aggiunto al calendario!");
    } catch(e) {
      notify(`❌ Calendar: ${e.message}`);
    }
    setLoading(false);
  };

  const onTouchStart = (e) => {
    touchStartX.current    = e.touches[0].clientX;
    touchStartY.current    = e.touches[0].clientY;
    touchCancelled.current = false;
  };
  const onTouchMove = (e) => {
    if (touchCancelled.current) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (dy > dx * 1.2 && dy > 8) touchCancelled.current = true;
  };
  const onTouchEnd = (e) => {
    if (touchCancelled.current || addOpen) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    const curr = TABS.indexOf(tab);
    if (dx < 0 && curr < TABS.length - 1) setTab(TABS[curr + 1]);
    else if (dx > 0 && curr > 0)          setTab(TABS[curr - 1]);
  };

  const saveForm = async () => {
    if (!form.title || !form.dueDate) { notify("⚠️ Titolo e data sono obbligatori"); return; }
    const entry = { ...form, amount: parseFloat(form.amount)||0, synced:false, emailed:false, paid: false };
    let list;
    if (editId) {
      list = payments.map(p => p.id===editId ? {...p,...entry} : p);
      await updatePayment({...payments.find(p => p.id===editId), ...entry});
    } else {
      const id = await addPayment({ id: Date.now(), ...entry });
      list = [...payments, { id, ...entry }];
    }
    setPayments(list);
    setAddOpen(false);
    notify(editId ? "✏️ Aggiornata!" : "✅ Scadenza aggiunta!");
  };

  const deletePay = async (id) => {
    await deletePayment(id);
    setPayments(payments.filter(p=>p.id!==id));
    notify("🗑️ Eliminata");
  };

  const markPaid  = async (id) => {
    const p = payments.find(x => x.id===id);
    const updated = {...p,paid:!p.paid};
    await updatePayment(updated);
    setPayments(payments.map(x => x.id===id ? updated : x));
  };

  // ── Sync ─────────────────────────────────────────────────────────────────
  const syncOne = async (p, silent=false) => {
    if (!token) { notify("⚠️ Prima connetti il tuo account Google in Impostazioni"); return; }
    setLoading(true);
    let calOk=false, mailOk=false;
    try { await addToCalendar(token, p); calOk=true; }
    catch(e) { if(!silent) notify(`❌ Calendar: ${e.message}`); }
    const dest = notifEmail || userEmail;
    if (dest) {
      try { await sendMail(token, dest, p); mailOk=true; }
      catch(e) { if(!silent) notify(`❌ Gmail: ${e.message}`); }
    }
    if (calOk || mailOk) {
      const updated = {...p, synced:calOk, emailed:mailOk};
      await updatePayment(updated);
      setPayments(payments.map(x => x.id===p.id ? updated : x));
      if (!silent) {
        const msg = [calOk?"📅 Aggiunto al calendario":"", mailOk?`📧 Email inviata a ${dest}`:""].filter(Boolean).join(" · ");
        notify(msg);
      }
    }
    setLoading(false);
    return { calOk, mailOk };
  };

  const syncAll = async () => {
    const pending = payments.filter(p => !p.synced && !p.paid);
    if (!pending.length) { notify("Tutte già sincronizzate!"); return; }
    setLoading(true);
    for (const p of pending) await syncOne(p, true);
    setLoading(false);
    notify(`📅 ${pending.length} scadenze sincronizzate con Google!`);
  };

  // ── Bill import ───────────────────────────────────────────────────────────
  const importBill = async () => {
    if (!billData) return;
    const entry = {
      id:Date.now(),
      title:billData.title||"Bolletta",
      amount:parseFloat(billData.amount)||0,
      dueDate:billData.dueDate||"",
      recurrence:"once",
      category:"utilities",
      notes:billData.description||"",
      synced:false,
      emailed:false,
      paid:false
    };
    await addPayment(entry);
    setPayments([...payments, entry]);
    setBillData(null);
    setBillUrl("");
    setTab("payments");
    notify("✅ Bolletta aggiunta alle scadenze!");
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const sorted   = [...payments].sort((a,b) => new Date(a.dueDate)-new Date(b.dueDate));
  const overdue  = sorted.filter(p => !p.paid && isOverdue(p.dueDate));
  const upcoming = sorted.filter(p => !p.paid && !isOverdue(p.dueDate));
  const totalDue = upcoming.reduce((s,p) => s+p.amount, 0);
  const filtered = filter==="all"?sorted : filter==="upcoming"?upcoming : filter==="overdue"?overdue : sorted.filter(p=>p.paid);

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",width:"100%",maxWidth:480,margin:"0 auto",background:"#E8EDF8",position:"relative",overflow:"hidden"}}>
      <Toast message={toast} />
      <LoadingOverlay visible={loading} />

      <Header tab={tab} token={token} userEmail={userEmail} overdue={overdue} upcoming={upcoming} totalDue={totalDue} />

      {/* ── Slider: tutte le schede sempre montate, nessun remount = zero flash ── */}
      <div
        style={{flex:1,overflow:"hidden",position:"relative"}}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div style={{
          display:"flex",
          height:"100%",
          width:`${TABS.length * 100}%`,
          transform:`translateX(-${TABS.indexOf(tab) * (100/TABS.length)}%)`,
          transition:"transform 0.28s cubic-bezier(.22,1,.36,1)",
          willChange:"transform",
        }}>
          {/* HOME */}
          <div style={{width:`${100/TABS.length}%`,height:"100%",overflowY:"auto",WebkitOverflowScrolling:"touch",flexShrink:0}}>
            <Home openAdd={openAdd} overdue={overdue} upcoming={upcoming} totalDue={totalDue} payments={payments} markPaid={markPaid} syncOne={syncOne} syncAll={syncAll} CAT={CAT} REC={REC} fmt={fmt} daysLeft={daysLeft} isOverdue={isOverdue} />
            <div style={{height:16}}/>
          </div>
          {/* SCADENZE */}
          <div style={{width:`${100/TABS.length}%`,height:"100%",overflowY:"auto",WebkitOverflowScrolling:"touch",flexShrink:0}}>
            <Payments filtered={filtered} filter={setFilter} openAdd={openAdd} openEdit={openEdit} deletePay={deletePay} markPaid={markPaid} syncOne={syncOne} CAT={CAT} REC={REC} fmt={fmt} daysLeft={daysLeft} isOverdue={isOverdue} />
            <div style={{height:16}}/>
          </div>
          {/* AGENDA */}
          <div style={{width:`${100/TABS.length}%`,height:"100%",overflowY:"auto",WebkitOverflowScrolling:"touch",flexShrink:0}}>
            <Appointments
              appointments={appointments} apptFilter={apptFilter} setApptFilter={setApptFilter}
              openAdd={openAddAppt} openEdit={openEditAppt}
              deleteAppt={deleteAppt} markDone={markDoneAppt}
              archiveAppt={archiveAppt} unarchiveAppt={unarchiveAppt}
              syncAppt={syncAppt} APPT_CAT={APPT_CAT} fmt={fmt} />
            <div style={{height:16}}/>
          </div>
          {/* BOLLETTE */}
          <div style={{width:`${100/TABS.length}%`,height:"100%",overflowY:"auto",WebkitOverflowScrolling:"touch",flexShrink:0}}>
            <Bills billData={billData} setBillData={setBillData} importBill={importBill} fmt={fmt} />
            <div style={{height:16}}/>
          </div>
          {/* IMPOSTAZIONI */}
          <div style={{width:`${100/TABS.length}%`,height:"100%",overflowY:"auto",WebkitOverflowScrolling:"touch",flexShrink:0}}>
            <Settings token={token} userEmail={userEmail} clientId={clientId} setClientId={setClientId} notifEmail={notifEmail} setNotifEmail={setNotifEmail} handleLogin={handleLogin} handleLogout={handleLogout} payments={payments} setPayments={setPayments} setSetting={setSetting} />
            <div style={{height:16}}/>
          </div>
        </div>
      </div>

      <Nav tab={tab} setTab={setTab} />
      <AddModal addOpen={addOpen} setAddOpen={setAddOpen} editId={editId} form={form} setForm={setForm} saveForm={saveForm} CAT={CAT} REC={REC} />
      <AddAppointmentModal open={apptModalOpen} onClose={() => setApptModalOpen(false)} editId={apptEditId} initForm={apptInitForm} onSave={saveApptForm} APPT_CAT={APPT_CAT} />
    </div>
  );
}
