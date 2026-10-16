/* v1.35.7: Google Calendar with private per-user offline IndexedDB snapshot.
   v1.44: Panel se ubacuje unutar "Napredno" taba u Postavkama. */
(function(){

async function gcProxy(action,payload={}){
 const sb=window.lifeSupabaseClient;
 if(!sb)throw Error('Prijavi se u Life Dashboard i pokušaj ponovno.');
 const {data:{session}}=await sb.auth.getSession();
 if(!session)throw Error('Supabase sesija nije aktivna.');
 const r=await fetch('https://rebtkitlvnsiucktspph.supabase.co/functions/v1/google-calendar/'+action,{
 method:action==='status'?'GET':'POST',headers:{'apikey':'sb_publishable_X8DLzhv6pYJSw76qh9Rp3Q_e7Pbvqz7','Authorization':'Bearer '+session.access_token,'Content-Type':'application/json'},
 ...(action==='status'?{}:{body:JSON.stringify(payload)})});
 const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'Google servis '+r.status);return d;
}

const STORE='life-dashboard-google-calendar-settings-v1';
// Javni OAuth Client ID aplikacije. Postavi ga ovdje jednom za sve korisnike GitHub Pages stranice.
const APP_GOOGLE_CLIENT_ID = '754527240127-n1vi6do8aias99i32f4pdh50s6upjrvk.apps.googleusercontent.com';

let cfg;try{cfg=JSON.parse(localStorage.getItem(STORE)||'{}')}catch{cfg={}}
cfg={clientId:APP_GOOGLE_CLIENT_ID||cfg.clientId||'',calendars:cfg.calendars||[],selected:cfg.selected||[],shared:cfg.shared||[],defaultId:cfg.defaultId||''};
let accessToken=null,tokenClient=null,connected=false,busy=false,connectionChecking=true;
let gcFeedback='';
let googleEvents=[],fetching=false,lastFetchKey='',lastFetchAt=0,googleError='';window.lifeGoogleEvents=googleEvents;
/* Jedna potpuna kopija po prijavljenom Supabase korisniku, mjesecu i odabranim kalendarima.
   IndexedDB čuva podatke na uređaju; ne čuva OAuth tokene. */
const GC_CACHE_DB='life-dashboard-google-events-cache-v1',GC_CACHE_STORE='snapshots';
let activeCacheKey=null,cacheLoading=Promise.resolve(),cacheUpdatedAt=0,cacheUserId=null;
function userId(){return window.lifeDashboardSignedInUserId||null}
function selectedKey(){return [...cfg.selected].sort().join('|')}
function snapshotKey(){const id=userId();return id&&cfg.selected.length?id+'|'+state.year+'-'+String(state.month).padStart(2,'0')+'|'+selectedKey():null}
function openCacheDB(){return new Promise((resolve,reject)=>{
 if(!window.indexedDB)return reject(Error('IndexedDB nije dostupan'));
 const r=indexedDB.open(GC_CACHE_DB,1);
 r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(GC_CACHE_STORE))r.result.createObjectStore(GC_CACHE_STORE,{keyPath:'key'})};
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error||Error('IndexedDB nije dostupan'));
})}
async function cacheRead(key){const db=await openCacheDB();try{return await new Promise((resolve,reject)=>{
 const r=db.transaction(GC_CACHE_STORE,'readonly').objectStore(GC_CACHE_STORE).get(key);
 r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error);
})}finally{db.close()}}
async function cacheWrite(key,events){const db=await openCacheDB();try{await new Promise((resolve,reject)=>{
 const t=db.transaction(GC_CACHE_STORE,'readwrite');
 t.objectStore(GC_CACHE_STORE).put({key,events,updatedAt:Date.now()});
 t.oncomplete=()=>resolve();t.onerror=()=>reject(t.error);
})}finally{db.close()}}
async function cacheClearUser(uid){if(!uid)return;const db=await openCacheDB();try{await new Promise((resolve,reject)=>{
 const t=db.transaction(GC_CACHE_STORE,'readwrite'),store=t.objectStore(GC_CACHE_STORE);
 const r=store.openCursor();r.onsuccess=()=>{const cur=r.result;if(cur){if(String(cur.key).startsWith(uid+'|'))cur.delete();cur.continue()}};
 t.oncomplete=()=>resolve();t.onerror=()=>reject(t.error);
})}finally{db.close()}}
function setVisibleGoogleEvents(events){googleEvents=events;window.lifeGoogleEvents=googleEvents}
function loadMonthCache(){
 const key=snapshotKey();if(!key)return Promise.resolve();
 if(activeCacheKey===key)return cacheLoading;
 activeCacheKey=key;setVisibleGoogleEvents([]);cacheUpdatedAt=0;
 cacheLoading=cacheRead(key).then(record=>{
  if(snapshotKey()!==key||activeCacheKey!==key)return;
  if(record&&Array.isArray(record.events)){setVisibleGoogleEvents(record.events);cacheUpdatedAt=record.updatedAt||0}
  // Prikaz se osvježava iz lokalne kopije iako Google API još nije odgovorio.
  const yscroll=window.scrollY;render();requestAnimationFrame(()=>window.scrollTo(0,yscroll));
 }).catch(e=>{console.warn('[Life Dashboard] Lokalna kopija Google događaja nije dostupna:',e)});
 return cacheLoading;
}
window.lifeGoogleAuthChanged=function(uid){
 if(cacheUserId===uid)return;
 cacheUserId=uid;activeCacheKey=null;lastFetchKey='';lastFetchAt=0;
 setVisibleGoogleEvents([]);cacheUpdatedAt=0;
 if(!uid){connected=false;connectionChecking=true;return}
 void loadMonthCache();
};
const save=()=>localStorage.setItem(STORE,JSON.stringify(cfg));
const htmlEscape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const originalSettings=settings;
settings=function(){
  const html=originalSettings();
  const panel='<section class="gc-panel" id="googleCalendarIntegration"><h3>📅 Integracije · Google Calendar</h3><p class="gc-muted">Poveži Google račun i odaberi kalendare za sinkronizaciju. Posljednji uspješno učitani događaji čuvaju se na ovom uređaju i dostupni su i pri prekidu Google veze. Google autorizacija sigurno se čuva na Supabaseu.</p><div id="gc-ui"></div></section>';
  return html.replace('<div class="settings-panel" data-settings-panel="napredno" hidden>','<div class="settings-panel" data-settings-panel="napredno" hidden>'+panel);
};
window.lifeGoogleBridge={
 get events(){return googleEvents},get connected(){return connected},get checking(){return connectionChecking},get cfg(){return cfg},
 get cachedAt(){return cacheUpdatedAt},
 async request(method,calendarId,eventId,payload){
  return gcProxy('api',{method,path:'/calendar/v3/calendars/'+encodeURIComponent(calendarId)+'/events'+(eventId?'/'+encodeURIComponent(eventId):''),body:payload});
 },
 async refresh(){lastFetchAt=0;await fetchGoogleEvents(true)}
};
const originalRender=render;
render=function(){originalRender();if(state.page==='Postavke')draw();if(state.page==='Kalendar'||state.page==='Početna')scheduleGoogleFetch()};
function scheduleGoogleFetch(){
 const key=snapshotKey();if(!key)return;
 // Lokalna kopija prvo, zatim mreža. Google API nikad ne briše kopiju pri pogrešci.
 void loadMonthCache().then(()=>{
  if(snapshotKey()!==key||!connected||fetching)return;
  if(key===lastFetchKey&&Date.now()-lastFetchAt<120000)return;
  lastFetchKey=key;lastFetchAt=Date.now();void fetchGoogleEvents();
 });
}
async function fetchGoogleEvents(force=false){
 const key=snapshotKey();if(!connected||!key)return;
 if(fetching)return;
 // Prikazujemo zadnju sačuvanu verziju dok osvježavamo mrežne podatke.
 await loadMonthCache();if(key!==snapshotKey())return;
 if(fetching)return;
 fetching=true;googleError='';
 const year=state.year,month=state.month,ids=[...cfg.selected],calendars=[...cfg.calendars];
 const from=new Date(Date.UTC(year,month,1)).toISOString(),to=new Date(Date.UTC(year,month+1,1)).toISOString(),result=[];
 let success=false;
 try{
  for(const id of ids){
   const cal=calendars.find(c=>c.id===id);if(!cal)throw Error('Nije pronađen odabrani kalendar. Osvježi kalendare u Postavkama.');
   let page='';do{
    const qs=new URLSearchParams({timeMin:from,timeMax:to,singleEvents:'true',orderBy:'startTime',maxResults:'2500'});
    if(page)qs.set('pageToken',page);
    const data=await gcProxy('api',{method:'GET',path:'/calendar/v3/calendars/'+encodeURIComponent(id)+'/events',query:Object.fromEntries(qs)});
    for(const e of data.items||[]){
     if(e.status==='cancelled'||!e.start)continue;
     const start=e.start.dateTime||e.start.date||'',day=start.slice(0,10);if(!day)continue;
     let time='';if(e.start.dateTime){const dt=new Date(e.start.dateTime);time=Number.isFinite(dt.getTime())?dt.toLocaleTimeString('hr-HR',{hour:'2-digit',minute:'2-digit'}):''}
     result.push({id:e.id,calendarId:id,calendarName:cal.summary,name:e.summary||'(Bez naziva)',day,time,start:e.start,end:e.end||{},description:e.description||'',location:e.location||'',allDay:!!e.start.date,color:/^#[0-9a-f]{6}$/i.test(cal.backgroundColor||'')?cal.backgroundColor:'#4285f4'});
    }
    page=data.nextPageToken||'';
   }while(page);
  }
  success=true;
 }catch(e){
  googleError=e.message||String(e);
  console.warn('[Life Dashboard] Google nije dostupan; zadržavam lokalno spremljene događaje:',e);
 }finally{
  fetching=false;
  lastFetchKey=key;lastFetchAt=Date.now();
  if(success){
   // Spremi SAMO potpuno uspješno učitani skup. Neuspjeh ne smije prepisati stare podatke.
   try{await cacheWrite(key,result);cacheUpdatedAt=Date.now()}
   catch(e){console.warn('[Life Dashboard] Nije moguće spremiti kopiju događaja:',e)}
   if(snapshotKey()===key&&activeCacheKey===key)setVisibleGoogleEvents(result);
  }
  if(snapshotKey()===key){const yscroll=window.scrollY;render();requestAnimationFrame(()=>window.scrollTo(0,yscroll))}
 }
}
document.addEventListener('change',e=>{if(e.target.matches('[data-google-filter]')){state.calFilters['Google']=e.target.checked;render()}});
function draw(){const el=document.getElementById('gc-ui');if(!el){window.lifeUpdateAdminConnections?.();return;}
const list=cfg.calendars.filter(c=>c.accessRole==='owner'||c.accessRole==='writer'||c.accessRole==='reader'||c.accessRole==='freeBusyReader');
const selected=cfg.selected.filter(id=>list.some(c=>c.id===id));
const writable=list.filter(c=>selected.includes(c.id)&&['owner','writer'].includes(c.accessRole));
let rows=list.map(c=>`<div class="gc-item"><label><input type="checkbox" data-gc-select="${htmlEscape(c.id)}" ${selected.includes(c.id)?'checked':''}><span style="display:inline-block;width:8px;height:18px;border-radius:4px;background:${/^#[0-9a-f]{6}$/i.test(c.backgroundColor||'')?c.backgroundColor:'#9ca3af'}"></span><span>${htmlEscape(c.summary)} ${c.primary?'(glavni)':''}<small class="gc-muted"> · ${c.accessRole==='reader'?'Samo čitanje':c.accessRole==='freeBusyReader'?'Samo zauzetost':'Uređivanje'}</small></span></label><select class="select" data-gc-privacy="${htmlEscape(c.id)}" ${selected.includes(c.id)?'':'disabled'}><option value="private" ${!cfg.shared.includes(c.id)?'selected':''}>Privatno</option><option value="shared" ${cfg.shared.includes(c.id)?'selected':''}>Kućanstvo</option></select></div>`).join('');
el.innerHTML=`<div class="setting"><span>Status računa</span><b>${connected?'🟢 Trajno povezano preko Supabasea':'⚪ Nije povezano'}</b></div>${cfg.clientId?'':`<details class="gc-setup"><summary>Početna konfiguracija Google integracije (administrator)</summary><label class="field">Google OAuth Client ID<input id="gc-client-id" class="select" placeholder="123456789-....apps.googleusercontent.com"><span class="gc-muted">Ovo je privremena konfiguracija samo za ovaj preglednik. Za povezivanje jednim klikom na svim uređajima javni Client ID treba jednom upisati u APP_GOOGLE_CLIENT_ID unutar HTML-a. Nikad ne unositi Client Secret.</span></label><button class="smallbtn" data-gc-save-id>Spremi konfiguraciju</button></details>`}<div class="gc-toolbar"><button class="primary" data-gc-connect ${busy?'disabled':''}>${busy?'Povezivanje…':connected?'Ponovno autoriziraj':'Poveži Google račun'}</button>${connected?'<button class="smallbtn" data-gc-disconnect>Odspoji</button>':''}<button class="smallbtn" data-gc-refresh ${connected?'':'disabled'}>Osvježi kalendare</button></div><p class="gc-status" id="gc-status" role="status" aria-live="polite" style="white-space:pre-wrap;overflow-wrap:anywhere;${gcFeedback?'font-weight:600;color:var(--text,#111);':''}">${htmlEscape(gcFeedback||(connected?'Autorizacija se sigurno obnavlja putem Supabasea.':'Za prikaz stvarnih kalendara potrebno je povezivanje Google računa.'))}</p><h4>Kalendari za prikaz i sinkronizaciju</h4>${rows?`<div class="gc-list">${rows}</div>`:'<p class="gc-muted">Nakon prijave ovdje će se prikazati kalendari s povezanog Google računa.</p>'}<div class="setting"><label for="gc-default">Zadani kalendar za nove događaje</label><select class="select" id="gc-default"><option value="">— Odaberi kalendar —</option>${writable.map(c=>`<option value="${htmlEscape(c.id)}" ${cfg.defaultId===c.id?'selected':''}>${htmlEscape(c.summary)}</option>`).join('')}</select></div><p class="gc-muted">Zadani kalendar mora dopuštati uređivanje. Dijeljenje s kućanstvom zasad je spremljena postavka, ne Googleova dozvola. Google autorizacija ostaje aktivna nakon ponovne prijave. Događaje možeš dodavati i uređivati u prikazu Kalendar. Promjene se odmah šalju Googleu.</p>`;
}
function message(t){gcFeedback=t;let e=document.getElementById('gc-status');if(e)e.textContent=t;}
function loadGIS(){return new Promise((resolve,reject)=>{if(window.google?.accounts?.oauth2)return resolve();let s=document.querySelector('script[data-google-gis]');if(!s){s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.async=true;s.dataset.googleGis='1';document.head.appendChild(s)}s.addEventListener('load',resolve,{once:true});s.addEventListener('error',()=>reject(Error('Google skripta nije učitana.')),{once:true});});}
async function calendars(){if(!connected)return;busy=true;draw();try{let all=[],next='';do{const u='https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=250'+(next?'&pageToken='+encodeURIComponent(next):'');let j=await gcProxy('api',{method:'GET',path:'/calendar/v3/users/me/calendarList',query:Object.fromEntries(new URL(u).searchParams)});all.push(...(j.items||[]));next=j.nextPageToken||''}while(next);cfg.calendars=all.map(c=>({id:c.id,summary:c.summary,primary:!!c.primary,accessRole:c.accessRole,backgroundColor:c.backgroundColor}));cfg.selected=cfg.selected.filter(id=>all.some(c=>c.id===id));cfg.shared=cfg.shared.filter(id=>cfg.selected.includes(id));if(!cfg.defaultId||!all.some(c=>c.id===cfg.defaultId)){cfg.defaultId=''}save();}catch(e){alert('Ne mogu dohvatiti kalendare: '+e.message)}finally{busy=false;draw()}}
async function connect(){
 if(busy)return;
 busy=true;gcFeedback='Pokrećem Google autorizaciju…';draw();
 try{
  const d=await gcProxy('start');
  if(!d?.url||!d.url.startsWith('https://accounts.google.com/'))throw Error('Google servis nije vratio adresu za prijavu.');
  window.location.assign(d.url);
 }catch(e){
  gcFeedback='Povezivanje nije uspjelo: '+(e?.message||String(e));
  console.error('[Life Dashboard] Google povezivanje:',e);
 }finally{busy=false;draw()}
}
async function restoreConnection(){
 // Učitaj posljednji uspješno dohvaćeni mjesec prije mrežnih poziva.
 await loadMonthCache();
 const result=new URLSearchParams(location.search).get('google_connection');
 if(result){
  const notices={success:'Google autorizacija je potvrđena. Provjeravam povezani račun…',failed:'Google autorizacija nije uspjela.',expired:'Google autorizacija je istekla. Pokušaj ponovno.',no_refresh_token:'Google nije vratio trajni token. Pokušaj ponovno.'};
  gcFeedback=notices[result]||'Google autorizacija: '+result;
  try{const u=new URL(location.href);u.searchParams.delete('google_connection');history.replaceState(null,'',u.pathname+u.search+u.hash)}catch{}
 }
 try{
  const d=await gcProxy('status');connected=!!d.connected;accessToken=null;
  if(connected){gcFeedback='Google račun trajno povezan.';await calendars();lastFetchAt=0;fetchGoogleEvents();}
  else if(result==='success')gcFeedback='Google autorizacija nije pronađena u bazi. Provjeri postavke Edge Function.';
  connectionChecking=false;draw();
 }catch(e){connected=false;gcFeedback='Google servis trenutno nije dostupan: '+(e?.message||String(e));connectionChecking=false;draw();}
}
window.lifeRestoreGoogleConnection=restoreConnection;

document.addEventListener('click',e=>{if(e.target.closest('[data-gc-save-id]')){const value=document.getElementById('gc-client-id')?.value.trim()||'';if(!/^[\w-]+\.apps\.googleusercontent\.com$/.test(value)){message('Unesi valjani Google OAuth Client ID.');return}cfg.clientId=value;save();draw();return}if(e.target.closest('[data-gc-connect]')){connect();return}if(e.target.closest('[data-gc-refresh]')){calendars();return}if(e.target.closest('[data-gc-disconnect]')){void (async()=>{try{await gcProxy('disconnect');await cacheClearUser(userId());accessToken=null;connected=false;connectionChecking=false;setVisibleGoogleEvents([]);activeCacheKey=null;cfg.calendars=[];cfg.selected=[];cfg.shared=[];cfg.defaultId='';save();draw();render()}catch(err){alert('Odspajanje: '+err.message)}})();return}});
document.addEventListener('change',e=>{let t=e.target;if(t.dataset.gcSelect!==undefined){let id=t.dataset.gcSelect;cfg.selected=t.checked?[...new Set([...cfg.selected,id])]:cfg.selected.filter(x=>x!==id);if(!t.checked){cfg.shared=cfg.shared.filter(x=>x!==id);if(cfg.defaultId===id)cfg.defaultId=''}save();draw();lastFetchAt=0;render()}if(t.dataset.gcPrivacy!==undefined){let id=t.dataset.gcPrivacy;cfg.shared=t.value==='shared'?[...new Set([...cfg.shared,id])]:cfg.shared.filter(x=>x!==id);save()}if(t.id==='gc-default'){cfg.defaultId=t.value;save()}});
})();