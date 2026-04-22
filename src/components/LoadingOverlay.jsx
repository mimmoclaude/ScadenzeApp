function Spinner() {
  return <div style={{width:20,height:20,border:"2.5px solid #E2E8F0",borderTopColor:"#4285F4",borderRadius:"50%",animation:"spin .65s linear infinite"}}/>;
}

export function LoadingOverlay({ visible }) {
  return visible ? (
    <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.3)",zIndex:998,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(3px)"}}>
      <div className="card" style={{padding:"22px 32px",display:"flex",alignItems:"center",gap:12}}>
        <Spinner/>
        <span style={{color:"#475569",fontSize:14,fontWeight:500}}>Elaborazione…</span>
      </div>
    </div>
  ) : null;
}
