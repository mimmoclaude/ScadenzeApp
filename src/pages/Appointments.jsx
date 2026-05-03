const todayISO = () => new Date().toISOString().slice(0, 10);

function statusBadge(appt) {
  if (appt.done) return { label:'✓ Fatto', color:'#10B981' };
  const t = todayISO();
  if (appt.date < t)  return { label:'⚠️ Passato', color:'#EF4444' };
  if (appt.date === t) return { label:'📅 Oggi',   color:'#F59E0B' };
  const days = Math.ceil((new Date(appt.date) - new Date(t)) / 86400000);
  if (days <= 7)       return { label:`⚡ tra ${days}gg`, color:'#F59E0B' };
  return null;
}

function Empty({ icon, title, sub }) {
  return (
    <div style={{textAlign:'center', padding:'44px 20px'}}>
      <div style={{fontSize:50, marginBottom:12}}>{icon}</div>
      <div style={{fontWeight:600, color:'#475569', fontSize:15}}>{title}</div>
      {sub && <div style={{fontSize:13, color:'#94A3B8', marginTop:5}}>{sub}</div>}
    </div>
  );
}

const EMPTY = {
  all:      { icon:'📅', title:'Nessun appuntamento',           sub:'Aggiungine uno con il pulsante +' },
  today:    { icon:'☀️', title:'Nessun appuntamento oggi',       sub:'Buona giornata!' },
  week:     { icon:'🗓️', title:'Nessuna agenda questa settimana', sub:'Nessun impegno in vista' },
  archived: { icon:'📦', title:'Archivio vuoto',                 sub:'Gli appuntamenti archiviati appariranno qui' },
};

export function Appointments({ appointments, apptFilter, setApptFilter, openAdd, openEdit,
  deleteAppt, markDone, archiveAppt, unarchiveAppt, syncAppt, APPT_CAT, fmt }) {

  const t = todayISO();

  // ── Filtro ──────────────────────────────────────────────────────────────
  const filtered = (() => {
    const active   = appointments.filter(a => !a.archived);
    const archived = appointments.filter(a =>  a.archived);
    switch (apptFilter) {
      case 'today':
        return active.filter(a => a.date === t);
      case 'week': {
        const end = new Date(); end.setDate(end.getDate() + 7);
        const endStr = end.toISOString().slice(0, 10);
        return active.filter(a => a.date >= t && a.date <= endStr).sort((a,b) => a.date.localeCompare(b.date));
      }
      case 'archived':
        return archived.sort((a,b) => b.date.localeCompare(a.date));
      default:
        return active.sort((a,b) => a.date.localeCompare(b.date));
    }
  })();

  // ── Raggruppamento per data (escluso archivio) ───────────────────────────
  const groups = apptFilter !== 'archived'
    ? filtered.reduce((acc, a) => { (acc[a.date] = acc[a.date] || []).push(a); return acc; }, {})
    : null;

  const fmtHeader = (d) => {
    if (d === t) return '📅 OGGI';
    const dt = new Date(d + 'T12:00:00');
    return dt.toLocaleDateString('it-IT', { weekday:'short', day:'2-digit', month:'long' }).toUpperCase();
  };

  // ── Singola card ─────────────────────────────────────────────────────────
  const Card = (appt) => {
    const cat    = APPT_CAT[appt.category] || APPT_CAT.other;
    const status = statusBadge(appt);
    const arch   = appt.archived;

    return (
      <div key={appt.id} className="card fade" style={{marginBottom:10, padding:16, opacity:appt.done?.88:1}}>
        <div style={{display:'flex', gap:12, alignItems:'flex-start'}}>
          <div style={{width:44, height:44, borderRadius:14, background:cat.color+'18',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0}}>
            {cat.emoji}
          </div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontWeight:700, fontSize:15, color:'#1E293B',
              textDecoration:appt.done?'line-through':'none', marginBottom:3,
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
              {appt.title}
            </div>
            <div style={{fontSize:12, color:'#94A3B8'}}>
              {fmt(appt.date)}
              {!appt.allDay && appt.time && ` · ${appt.time}`}
              {!appt.allDay && appt.endTime && `→${appt.endTime}`}
              {appt.allDay && ' · Tutto il giorno'}
            </div>
            {appt.location && (
              <div style={{fontSize:11, color:'#64748B', marginTop:2,
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                📍 {appt.location}
              </div>
            )}
            <div style={{display:'flex', gap:5, flexWrap:'wrap', marginTop:6}}>
              {status && <span className="tag" style={{background:status.color+'18', color:status.color}}>{status.label}</span>}
              {appt.synced && <span className="tag" style={{background:'#34A85318', color:'#34A853'}}>📅 Cal</span>}
            </div>
          </div>
        </div>

        {/* Azioni */}
        <div style={{display:'flex', gap:6, marginTop:12, paddingTop:12,
          borderTop:'1px solid #F1F5F9', flexWrap:'wrap'}}>
          {arch ? (
            <>
              <button onClick={() => unarchiveAppt(appt.id)}
                style={{flex:'1 1 auto', minWidth:0, background:'#EDE9FE', color:'#7C3AED',
                  border:'none', borderRadius:10, padding:'8px 6px', fontSize:12, fontWeight:700,
                  cursor:'pointer', WebkitTapHighlightColor:'transparent'}}>
                ↩️ Ripristina
              </button>
              <button onClick={() => { if(confirm(`Eliminare "${appt.title}"?`)) deleteAppt(appt.id); }}
                className="rBtn" style={{width:38, height:36, background:'#FEF2F2', color:'#EF4444', fontSize:16,
                  WebkitTapHighlightColor:'transparent'}}>🗑️</button>
            </>
          ) : (
            <>
              <button onClick={() => markDone(appt.id)}
                style={{flex:'1 1 auto', minWidth:0,
                  background:appt.done?'#F8FAFC':'#F0FDF4', color:appt.done?'#94A3B8':'#16A34A',
                  border:'none', borderRadius:10, padding:'8px 6px', fontSize:12, fontWeight:700,
                  cursor:'pointer', WebkitTapHighlightColor:'transparent', whiteSpace:'nowrap'}}>
                {appt.done ? '↩️ Riapri' : '✓ Fatto'}
              </button>
              <button onClick={() => syncAppt(appt)}
                style={{flex:'1 1 auto', minWidth:0, background:'#F0F7FF', color:'#4285F4',
                  border:'none', borderRadius:10, padding:'8px 6px', fontSize:12, fontWeight:700,
                  cursor:'pointer', WebkitTapHighlightColor:'transparent', whiteSpace:'nowrap'}}>
                📅 Sync
              </button>
              <button onClick={() => openEdit(appt)}
                className="rBtn" style={{width:38, height:36, background:'#F8FAFC', color:'#64748B',
                  fontSize:16, WebkitTapHighlightColor:'transparent'}}>✏️</button>
              <button onClick={() => archiveAppt(appt.id)}
                className="rBtn" style={{width:38, height:36, background:'#FFF7ED', color:'#EA580C',
                  fontSize:16, WebkitTapHighlightColor:'transparent'}}>📦</button>
              <button onClick={() => { if(confirm(`Eliminare "${appt.title}"?`)) deleteAppt(appt.id); }}
                className="rBtn" style={{width:38, height:36, background:'#FEF2F2', color:'#EF4444',
                  fontSize:16, WebkitTapHighlightColor:'transparent'}}>🗑️</button>
            </>
          )}
        </div>
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{padding:14}} className="fade">

      {/* Filtri */}
      <div style={{display:'flex', gap:6, marginBottom:12}}>
        {[['all','Tutti'],['today','Oggi'],['week','Settimana'],['archived','📦 Arch']].map(([k,l]) => (
          <button key={k} onClick={() => setApptFilter(k)} style={{
            flex:1, padding:'7px 4px', borderRadius:99, border:'none', cursor:'pointer',
            fontWeight:700, fontSize:11, WebkitTapHighlightColor:'transparent',
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
            background: apptFilter===k ? '#7C3AED' : '#EDE9FE',
            color:       apptFilter===k ? '#fff'    : '#7C3AED',
          }}>{l}</button>
        ))}
      </div>

      {/* Contatore + pulsante aggiungi */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
        <div style={{fontSize:13, color:'#94A3B8', fontWeight:500}}>
          {filtered.length} appuntament{filtered.length===1?'o':'i'}
        </div>
        {apptFilter !== 'archived' && (
          <button onClick={openAdd} style={{background:'#7C3AED', color:'#fff', border:'none',
            borderRadius:10, padding:'8px 16px', fontWeight:700, fontSize:13,
            cursor:'pointer', WebkitTapHighlightColor:'transparent'}}>
            + Aggiungi
          </button>
        )}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <Empty {...(EMPTY[apptFilter] || EMPTY.all)} />
      ) : groups ? (
        Object.keys(groups).sort().map(d => (
          <div key={d}>
            <div style={{fontSize:11, fontWeight:700, color:'#94A3B8', letterSpacing:1,
              marginBottom:6, marginTop:8, paddingLeft:2}}>
              {fmtHeader(d)}
            </div>
            {groups[d].map(a => Card(a))}
          </div>
        ))
      ) : (
        filtered.map(a => Card(a))
      )}
    </div>
  );
}
