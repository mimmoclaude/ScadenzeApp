import { useState, useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { getPayments, addPayment, updatePayment, deletePayment, getSetting, setSetting, deleteAllPayments, exportPayments, importData } from './db';
import { saveUserProfile, syncPaymentsToFirestore, upsertPayment, deletePaymentFromFirestore } from './firebase';
import { registerPush } from './fcm';
import { FIREBASE_CONFIGURED } from './firebaseConfig';
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
  // ── Preferenze Notifiche Push ─────────────────────────────────────────────
  const [enablePush, setEnablePush] = useState(false);
  const [notifyDays, setNotifyDays] = useState([3, 1, 0]); // giorni di anticipo (array)
  const [fcmToken,   setFcmToken]   = useState("");
  const tokenClientRef = useRef(null);

  // ── Bootstrap ────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      const p = await getPayments();
      setPayments(p);
      const c  = await getSetting("gClientId");   if (c)  { setClientId(c); }
      const e  = await getSetting("userEmail");   if (e)  setUserEmail(e);
      const ne = await getSetting("notifEmail");  if (ne) setNotifEmail(ne);
      const ep = await getSetting("enablePush");  if (ep !== null && ep !== undefined) setEnablePush(!!ep);
      const nd = await getSetting("notifyDays");  if (Array.isArray(nd) && nd.length) setNotifyDays(nd);
    };
    loadData();
  }, []);

  // ── Push registration: quando enablePush si attiva AND utente loggato ────
  useEffect(() => {
    if (!FIREBASE_CONFIGURED || !enablePush || !userEmail) return;
    let mounted = true;
    (async () => {
      const res = await registerPush({
        onToken: async (tk) => {
          if (!mounted) return;
          setFcmToken(tk);
          try {
            await saveUserProfile({ email: userEmail, fcmToken: tk, enablePush: true, notifyDays });
          } catch (e) { console.error('[saveUserProfile]', e); }
        },
        onNotification: (notif) => {
          const title = notif?.title || notif?.notification?.title || 'Scadenza';
          const body  = notif?.body  || notif?.notification?.body  || '';
          notify(`🔔 ${title}${body ? ' · ' + body : ''}`, 5000);
        },
      });
      if (!res.ok) {
        console.warn('[FCM] registrazione fallita:', res.reason);
        if (res.reason === 'permission-denied') {
          notify('⚠️ Permesso notifiche negato', 4000);
        }
      }
    })();
    return () => { mounted = false; };
  }, [enablePush, userEmail]);

  // ── Quando cambiano notifyDays, aggiorna Firestore ───────────────────────
  useEffect(() => {
    if (!FIREBASE_CONFIGURED || !userEmail || !enablePush) return;
    saveUserProfile({ email: userEmail, notifyDays }).catch(e => console.error('[notifyDays sync]', e));
  }, [notifyDays, userEmail, enablePush]);

  // ── Handler per toggle push dal Settings ─────────────────────────────────
  const handleTogglePush = async (val) => {
    setEnablePush(val);
    await setSetting("enablePush", val);
    if (!val && userEmail && FIREBASE_CONFIGURED) {
      // Disabilita push = rimuove fcmToken da Firestore (il cron non invia più)
      try { await saveUserProfile({ email: userEmail, enablePush: false, fcmToken: "" }); }
      catch (e) { console.error('[disable push]', e); }
    }
  };

  const handleSetNotifyDays = async (days) => {
    setNotifyDays(days);
    await setSetting("notifyDays", days);
  };

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
      try {
        // signOut() = rimuove sessione locale; disconnect() = revoca permessi app
        // Usiamo signOut (più rapido) - l'utente può comunque scegliere altro account
        await GoogleAuth.signOut();
      } catch (e) {
        console.error('[GoogleAuth signOut]', e);
      }
    } else if (token && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(token, () => {});
    }
    setToken(null);
    setUserEmail("");
    // Pulisci anche la persistenza locale per evitare "email fantasma" al riavvio
    await setSetting("userEmail", "");
    notify("✅ Disconnesso da Google");
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

  // ── Helper: sync singolo payment su Firestore se push abilitato ─────────
  const fsUpsert = async (payment) => {
    if (!FIREBASE_CONFIGURED || !userEmail || !enablePush) return;
    try { await upsertPayment(userEmail, payment); }
    catch (e) { console.error('[Firestore upsert]', e); }
  };
  const fsDelete = async (id) => {
    if (!FIREBASE_CONFIGURED || !userEmail || !enablePush) return;
    try { await deletePaymentFromFirestore(userEmail, id); }
    catch (e) { console.error('[Firestore delete]', e); }
  };

  const saveForm = async () => {
    if (!form.title || !form.dueDate) { notify("⚠️ Titolo e data sono obbligatori"); return; }
    const entry = { ...form, amount: parseFloat(form.amount)||0, synced:false, emailed:false, paid: false };
    let list, saved;
    if (editId) {
      saved = {...payments.find(p => p.id===editId), ...entry};
      list = payments.map(p => p.id===editId ? saved : p);
      await updatePayment(saved);
    } else {
      const id = Date.now();
      saved = { id, ...entry };
      await addPayment(saved);
      list = [...payments, saved];
    }
    setPayments(list);
    setAddOpen(false);
    fsUpsert(saved);
    notify(editId ? "✏️ Aggiornata!" : "✅ Scadenza aggiunta!");
  };

  const deletePay = async (id) => {
    await deletePayment(id);
    setPayments(payments.filter(p=>p.id!==id));
    fsDelete(id);
    notify("🗑️ Eliminata");
  };

  const markPaid  = async (id) => {
    const p = payments.find(x => x.id===id);
    const updated = {...p,paid:!p.paid};
    await updatePayment(updated);
    setPayments(payments.map(x => x.id===id ? updated : x));
    fsUpsert(updated);
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
        {tab==="settings" && <Settings token={token} userEmail={userEmail} clientId={clientId} setClientId={setClientId} notifEmail={notifEmail} setNotifEmail={setNotifEmail} handleLogin={handleLogin} handleLogout={handleLogout} payments={payments} setPayments={setPayments} setSetting={setSetting} enablePush={enablePush} handleTogglePush={handleTogglePush} notifyDays={notifyDays} handleSetNotifyDays={handleSetNotifyDays} fcmToken={fcmToken} firebaseConfigured={FIREBASE_CONFIGURED} syncAllToFirestore={async () => { if (!FIREBASE_CONFIGURED || !userEmail) return; try { await syncPaymentsToFirestore(userEmail, payments); notify('☁️ Scadenze sincronizzate su cloud'); } catch (e) { notify('❌ Errore sync cloud'); console.error(e); } }} />}
        <div style={{height:16}}/>
      </div>

      <Nav tab={tab} setTab={setTab} />
      <AddModal addOpen={addOpen} setAddOpen={setAddOpen} editId={editId} form={form} setForm={setForm} saveForm={saveForm} CAT={CAT} REC={REC} />
    </div>
  );
}
