export function Toast({ message }) {
  return message ? (
    <div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:"#1E293B",color:"#fff",borderRadius:14,padding:"12px 22px",fontSize:14,fontWeight:500,zIndex:9999,boxShadow:"0 8px 40px rgba(0,0,0,.3)",animation:"fadeIn .2s ease",whiteSpace:"nowrap",maxWidth:"92vw",textAlign:"center"}}>
      {message}
    </div>
  ) : null;
}
