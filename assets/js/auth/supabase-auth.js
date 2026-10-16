/* Life Dashboard v1.35.2 — Supabase Auth gate. User data remains local in this phase. */
(function(){
'use strict';
const SUPABASE_URL='https://rebtkitlvnsiucktspph.supabase.co'; // public project URL
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_X8DLzhv6pYJSw76qh9Rp3Q_e7Pbvqz7'; // public browser key
const CFG_KEY='life-dashboard-supabase-config-v1';
const el=id=>document.getElementById(id);
const gate=el('authGate');
let client=null,mode='login',pending=false;
const sessionStore={getItem:k=>localStorage.getItem(k)||sessionStorage.getItem(k),setItem:(k,v)=>{(el('authRemember')?.checked!==false?localStorage:sessionStorage).setItem(k,v)},removeItem:k=>{localStorage.removeItem(k);sessionStorage.removeItem(k)}};
let config={};try{config=JSON.parse(localStorage.getItem(CFG_KEY)||'{}')}catch{}
config.url=SUPABASE_URL||config.url||'';
config.key=SUPABASE_PUBLISHABLE_KEY||config.key||'';
function message(t,ok=false){const x=el('authMessage');x.textContent=t;x.classList.toggle('ok',ok)}
function setMode(next){
  mode=next==='signup'?'signup':'login';
  el('authTabLogin').classList.toggle('active',mode==='login');
  el('authTabSignup').classList.toggle('active',mode==='signup');
  el('authRepeatWrap').classList.toggle('auth-hidden',mode!=='signup');
  el('authRepeat').required=mode==='signup';
  el('authPassword').autocomplete=mode==='signup'?'new-password':'current-password';
  el('authSubmit').textContent=mode==='signup'?'Izradi račun':'Prijavi se';
  el('authForgot').classList.toggle('auth-hidden',mode==='signup');
  message('');
}
function lock(){activeUser=null;window.lifeDashboardSignedInUserId=null;window.lifeGoogleAuthChanged?.(null);document.body.classList.add('auth-locked');gate.hidden=false;el('lifeCloudBtn')?.remove();el('lifeCloudModal')?.remove()}
function unlock(user){window.lifeDashboardSignedInUserId=user.id;window.lifeGoogleAuthChanged?.(user.id);gate.hidden=true;document.body.classList.remove('auth-locked');addAccountButton(user);cloudButton(user);if(window.lifeRestoreGoogleConnection && !window.lifeGoogleRestoring){window.lifeGoogleRestoring=true;window.lifeRestoreGoogleConnection().finally(()=>window.lifeGoogleRestoring=false)}}
// Sigurnosna kopija podataka po korisniku. Namjerno ručno pokretanje kako se
// lokalni podaci jednog korisnika ne bi automatski prenijeli na drugi račun.
let activeUser=null;
function cloudButton(user){
 activeUser=user;
 let btn=el('lifeCloudBtn');
 if(!btn){btn=document.createElement('button');btn.id='lifeCloudBtn';btn.className='auth-top-btn';btn.textContent='☁ Sigurnosna kopija';const top=document.querySelector('.topright');if(top)top.prepend(btn)}
}
function cloudModal(){
 if(!activeUser)return;
 let wrap=el('lifeCloudModal');
 if(!wrap){wrap=document.createElement('div');wrap.id='lifeCloudModal';wrap.style.cssText='position:fixed;inset:0;z-index:999999;background:#111827a8;display:flex;align-items:center;justify-content:center;padding:20px';document.body.appendChild(wrap)}
 wrap.innerHTML=`<div style="width:min(480px,100%);background:var(--card,#fff);color:var(--text,#111);border-radius:18px;padding:25px;box-shadow:0 20px 80px #0004"><h2 style="margin:0 0 8px">☁ Supabase sigurnosna kopija</h2><p style="font-size:13px;line-height:1.6">Kopija pripada samo prijavljenom računu. Ne uključuje Google pristupne tokene niti lozinke. Za sada se podaci ne sinkroniziraju automatski.</p><p id="lifeCloudStatus" style="font-size:12px;min-height:18px"></p><div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:16px"><button id="lifeCloudUpload" class="auth-top-btn">↑ Spremi u Supabase</button><button id="lifeCloudDownload" class="auth-top-btn">↓ Vrati iz Supabasea</button><button id="lifeCloudClose" class="auth-top-btn">Zatvori</button></div></div>`;
 wrap.querySelector('#lifeCloudClose').onclick=()=>wrap.remove();
 wrap.addEventListener('click',e=>{if(e.target===wrap)wrap.remove()},{once:true});
 const status=txt=>{const x=el('lifeCloudStatus');if(x)x.textContent=txt};
 wrap.querySelector('#lifeCloudUpload').onclick=async()=>{
  if(!confirm('Spremiti trenutačne lokalne podatke u Supabase i zamijeniti postojeću kopiju ovog računa?'))return;
  const raw=localStorage.getItem('life-dashboard-v1-demo');if(!raw){status('Nema lokalnih podataka za spremanje.');return}
  let data;try{data=JSON.parse(raw)}catch{status('Lokalni podaci nisu ispravan JSON.');return}
  status('Spremanje...');const {error}=await client.from('life_dashboard_backups').upsert({user_id:activeUser.id,payload:data,updated_at:new Date().toISOString()},{onConflict:'user_id'});
  status(error?'Greška: '+error.message:'Kopija je spremljena u Supabase.');
 };
 wrap.querySelector('#lifeCloudDownload').onclick=async()=>{
  status('Dohvaćanje...');const {data,error}=await client.from('life_dashboard_backups').select('payload,updated_at').eq('user_id',activeUser.id).maybeSingle();
  if(error){status('Greška: '+error.message);return}if(!data){status('Nema spremljene kopije za ovaj račun.');return}
  if(!confirm('Vratiti kopiju od '+new Date(data.updated_at).toLocaleString('hr-HR')+'? Ovo će zamijeniti trenutačne lokalne podatke i osvježiti stranicu. Prije toga po potrebi izvezi lokalni backup.')){status('Vraćanje otkazano.');return}
  localStorage.setItem('life-dashboard-v1-demo',JSON.stringify(data.payload));location.reload();
 };
}
document.addEventListener('click',e=>{if(e.target.closest('#lifeCloudBtn'))cloudModal()});
function addAccountButton(user){let btn=el('lifeAccountBtn');if(!btn){btn=document.createElement('button');btn.id='lifeAccountBtn';btn.className='auth-top-btn';const top=document.querySelector('.topright');if(top)top.prepend(btn)}if(btn)btn.textContent='👤 '+(user?.email||'Račun')+' · Odjava'}
function init(){if(!config.url||!config.key){lock();el('authSetup').open=true;message('Prvo unesi Supabase URL i javni ključ projekta.');return false}if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(config.url)){lock();el('authSetup').open=true;message('URL mora biti oblika https://projekt.supabase.co');return false}if(!window.supabase?.createClient){lock();message('Supabase biblioteka nije učitana. Provjeri internetsku vezu ili blokiranje CDN-a.');return false}
try{client=window.supabase.createClient(config.url,config.key,{auth:{storage:sessionStore,autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}});window.lifeSupabaseClient=client;client.auth.onAuthStateChange((event,session)=>{if(session?.user)unlock(session.user);else lock()});client.auth.getSession().then(({data,error})=>{if(error)message(error.message);if(data?.session?.user)unlock(data.session.user);else lock()}).catch(e=>{lock();message(e.message)});return true}catch(e){lock();message('Supabase konfiguracija: '+e.message);return false}}
function busy(b){pending=b;el('authSubmit').disabled=b;el('authSaveConfig').disabled=b}
el('authTabLogin').addEventListener('click',()=>setMode('login'));
el('authTabSignup').addEventListener('click',()=>setMode('signup'));
el('authShowPassword').addEventListener('click',()=>{let x=el('authPassword');x.type=x.type==='password'?'text':'password'});
el('authSaveConfig').addEventListener('click',()=>{const url=el('authUrl').value.trim().replace(/\/$/,'');const key=el('authKey').value.trim();if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)||!key){message('Unesi valjani Supabase Project URL i javni ključ.');return}config={url,key};localStorage.setItem(CFG_KEY,JSON.stringify(config));location.reload()});
el('authForm').addEventListener('submit',async e=>{e.preventDefault();if(pending)return;if(!client){message('Prvo spremi Supabase konfiguraciju.');return}const email=el('authEmail').value.trim(),password=el('authPassword').value;if(mode==='signup'&&password!==el('authRepeat').value){message('Lozinke se ne podudaraju.');return}busy(true);message('');try{if(mode==='signup'){const {data,error}=await client.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname}});if(error)throw error;if(data.session?.user)unlock(data.session.user);else message('Provjeri e-mail i potvrdi registraciju, zatim se prijavi.',true)}else{const {data,error}=await client.auth.signInWithPassword({email,password});if(error)throw error;if(data.user)unlock(data.user)}}catch(e){message(e.message||'Prijava nije uspjela.')}finally{busy(false)}});
el('authForgot').addEventListener('click',async()=>{if(!client)return message('Prvo spremi Supabase konfiguraciju.');const email=el('authEmail').value.trim();if(!email)return message('Prvo upiši e-mail adresu.');try{const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});if(error)throw error;message('Ako račun postoji, poslana je poveznica za reset lozinke.',true)}catch(e){message(e.message)}});
document.addEventListener('click',async e=>{if(e.target.closest('#lifeAccountBtn')){if(!client)return;const {error}=await client.auth.signOut();if(error)alert(error.message);else{el('authPassword').value='';lock()}}});
window.addEventListener('load',()=>{el('authUrl').value=config.url||'';el('authKey').value=config.key||'';lock();init()});
})();