import { useState, useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { OAuth2Client } from '@byteowls/capacitor-oauth2';
import { getPayments, addPayment, updatePayment, deletePayment, getSetting, setSetting, deleteAllPayments, exportPayments, importData } from './db';
import { Header } from './components/Header';
import { Nav } from './components/Nav';
import { Home } from './pages/Home';
import { Payments } from './pages/Payments';
import { Bills } from './pages/Bills';
import { Settings } from './pages/Settings';
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

// ─── APP ──────────────────────────────────────────────────────────────────────
export function App() {
  const [tab,        setTab]        = useState("home");
  const [payments,   setPayments]   = useState([]);
  const [token,      setToken]      = useState(null);
  const [userEmail,  setUserEmail]  = useState("");
  const [clientId,   setClientId]   = useState("837673127946-ec145h4fjbp66mqgedngkcv8c6vaf7gp.apps.googleusercontent.com");
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
  const tokenClientRef = useRef(null);

  // ── Bootstrap ────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      const p = await getPayments();
      setPayments(p);
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
        const resp = await OAuth2Client.authenticate({
          authorizationBaseUrl: "https://accounts.google.com/o/oauth2/auth",
          accessTokenEndpoint: "https://www.googleapis.com/oauth2/v4/token",
          scope: "email profile https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/gmail.send",
          resourceUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
          web: { appId: cid, responseType: "token" },
          android: { appId: "837673127946-psh05dosektugr8490oq1cubbsnv28jn.apps.googleusercontent.com", responseType: "code", redirectUrl: "com.scadenze.app:/oauth2redirect" },
          pkceEnabled: true,
        });
        const tk = resp["access_token"];
        setToken(tk);
        const email = resp["email"] || resp["resourceUrl"]?.email || "";
        setUserEmail(email);
        await setSetting("userEmail", email);
        if (!notifEmail) { setNotifEmail(email); await setSetting("notifEmail", email); }
        notify(`✅ Connesso come ${email || "Google"}`);
      } catch(e) {
        notify("❌ Login fallito: " + (e.message || e));
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
      try { await OAuth2Client.logout({ appId: clientId }); } catch {}
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
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:"#E8EDF8",maxWidth:480,margin:"0 auto",position:"relative"}}>
      <Toast message={toast} />
      <LoadingOverlay visible={loading} />

      <Header tab={tab} token={token} userEmail={userEmail} overdue={overdue} upcoming={upcoming} totalDue={totalDue} />

      <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
        {tab==="home" && <Home openAdd={openAdd} overdue={overdue} upcoming={upcoming} totalDue={totalDue} payments={payments} markPaid={markPaid} syncOne={syncOne} syncAll={syncAll} CAT={CAT} REC={REC} fmt={fmt} daysLeft={daysLeft} isOverdue={isOverdue} />}
        {tab==="payments" && <Payments filtered={filtered} filter={setFilter} openAdd={openAdd} openEdit={openEdit} deletePay={deletePay} markPaid={markPaid} syncOne={syncOne} CAT={CAT} REC={REC} fmt={fmt} daysLeft={daysLeft} isOverdue={isOverdue} />}
        {tab==="bills" && <Bills billData={billData} setBillData={setBillData} importBill={importBill} fmt={fmt} />}
        {tab==="settings" && <Settings token={token} userEmail={userEmail} clientId={clientId} setClientId={setClientId} notifEmail={notifEmail} setNotifEmail={setNotifEmail} handleLogin={handleLogin} handleLogout={handleLogout} payments={payments} setPayments={setPayments} setSetting={setSetting} />}
        <div style={{height:16}}/>
      </div>

      <Nav tab={tab} setTab={setTab} />
      <AddModal addOpen={addOpen} setAddOpen={setAddOpen} editId={editId} form={form} setForm={setForm} saveForm={saveForm} CAT={CAT} REC={REC} />
    </div>
  );
}
