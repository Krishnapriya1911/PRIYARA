const API = window.location.origin + "/api";
const Auth = {
  token:()=>localStorage.getItem("priyaraa_token"),
  user:()=>JSON.parse(localStorage.getItem("priyaraa_user")||"null"),
  isLoggedIn:()=>!!localStorage.getItem("priyaraa_token"),
  isSeller:()=>Auth.user()?.role==="seller",
  save(tok,user){localStorage.setItem("priyaraa_token",tok);localStorage.setItem("priyaraa_user",JSON.stringify(user));},
  clear(){localStorage.removeItem("priyaraa_token");localStorage.removeItem("priyaraa_user");},
  logout(){Auth.clear();window.location.href="/login.html";}
};
async function apiFetch(path,opts={}){
  const tok=Auth.token();
  const res=await fetch(`${API}${path}`,{...opts,headers:{"Content-Type":"application/json",...(tok?{"Authorization":`Bearer ${tok}`}:{}),...(opts.headers||{})},body:opts.body?(typeof opts.body==="string"?opts.body:JSON.stringify(opts.body)):undefined});
  const data=await res.json();
  if(res.status===401&&!window.location.href.includes("login"))Auth.logout();
  return data;
}
async function apiUpload(path,fd){const tok=Auth.token();const res=await fetch(`${API}${path}`,{method:"POST",headers:tok?{"Authorization":`Bearer ${tok}`}:{},body:fd});return res.json();}
const PriyaraaAPI={
  auth:{
    login:(email,pw)=>apiFetch("/auth/login",{method:"POST",body:{email,password:pw}}),
    register:(d)=>apiFetch("/auth/register",{method:"POST",body:d}),
    googleLogin:(d)=>apiFetch("/auth/google-login",{method:"POST",body:d}),
    me:()=>apiFetch("/auth/me"),
    updateProfile:(d)=>apiFetch("/auth/profile",{method:"PUT",body:d}),
  },
  products:{
    list:(f={})=>apiFetch("/products?"+new URLSearchParams(f)),
    get:(id)=>apiFetch(`/products/${id}`),
    create:(d)=>apiFetch("/products",{method:"POST",body:d}),
    update:(id,d)=>apiFetch(`/products/${id}`,{method:"PUT",body:d}),
    delete:(id)=>apiFetch(`/products/${id}`,{method:"DELETE"}),
    review:(id,d)=>apiFetch(`/products/${id}/review`,{method:"POST",body:d}),
  },
  orders:{
    place:(d)=>apiFetch("/orders",{method:"POST",body:d}),
    list:()=>apiFetch("/orders"),
    get:(id)=>apiFetch(`/orders/${id}`),
    status:(id,s)=>apiFetch(`/orders/${id}/status`,{method:"PUT",body:{status:s}}),
    cancel:(id)=>apiFetch(`/orders/${id}/cancel`,{method:"PUT"}),
  },
  messages:{
    conversations:()=>apiFetch("/messages/conversations"),
    get:(uid)=>apiFetch(`/messages/${uid}`),
    send:(uid,t,oid=null)=>apiFetch(`/messages/${uid}`,{method:"POST",body:{text:t,order_id:oid}}),
    unread:()=>apiFetch("/messages/unread/count"),
  },
  reels:{list:(f={})=>apiFetch("/reels?"+new URLSearchParams(f)),create:(d)=>apiFetch("/reels",{method:"POST",body:d}),like:(id)=>apiFetch(`/reels/${id}/like`,{method:"POST"})},
  moments:{list:(f={})=>apiFetch("/moments?"+new URLSearchParams(f)),create:(fd)=>apiUpload("/moments",fd),like:(id)=>apiFetch(`/moments/${id}/like`,{method:"POST"})},
  sellers:{list:()=>apiFetch("/sellers"),get:(id)=>apiFetch(`/sellers/${id}`)},
  sona:{query:(t)=>apiFetch("/sona/query",{method:"POST",body:{query:t}})},
};
function showToast(msg,type="success"){
  const ex=document.getElementById("ptoa");if(ex)ex.remove();
  const t=document.createElement("div");t.id="ptoa";
  t.style.cssText=`position:fixed;bottom:24px;right:24px;z-index:9999;background:${type==="error"?"#C2607E":"#1a1208"};color:white;padding:12px 22px;border-radius:100px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;box-shadow:0 4px 24px rgba(0,0,0,.2);animation:tIn .3s ease;`;
  t.textContent=msg;document.body.appendChild(t);
  setTimeout(()=>{t.style.opacity="0";t.style.transition="opacity .3s";setTimeout(()=>t.remove(),300);},3000);
}
function updateNav(){
  const user=Auth.user();const el=document.querySelector(".nav-right");if(!el||!user)return;
  el.innerHTML=`<div style="display:flex;align-items:center;gap:10px;"><span style="font-family:'Caveat',cursive;font-size:15px;color:var(--muted);">~ ${user.name.split(" ")[0]}</span><div style="width:34px;height:34px;border-radius:50%;background:var(--rosebg);border:1.5px solid var(--rose2);display:flex;align-items:center;justify-content:center;font-size:16px;">${user.avatar||"🌸"}</div><button onclick="Auth.logout()" style="font-size:11px;padding:7px 16px;border:1px solid var(--sand);background:transparent;color:var(--muted);cursor:pointer;font-family:'DM Sans',sans-serif;border-radius:100px;">Logout</button></div>`;
}
const _s=document.createElement("style");_s.textContent="@keyframes tIn{from{transform:translateY(12px);opacity:0;}to{transform:none;opacity:1;}}";document.head.appendChild(_s);
document.addEventListener("DOMContentLoaded",updateNav);
