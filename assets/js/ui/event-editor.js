
/* v1.35.5 — zajednički obrazac događaja (Google / lokalno), uređivanje i brisanje.
   Google API ostaje iza postojeće Supabase Edge Function; tajne se ne izlažu pregledniku. */
(function(){
'use strict';
const bridge=()=>window.lifeGoogleBridge;
const html=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const localDT=s=>{
 if(!s)return '';
 const d=new Date(s);if(!Number.isFinite(d.getTime()))return '';
 return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const plusDays=(str,num)=>{
 const d=new Date(str+'T12:00:00');d.setDate(d.getDate()+num);
 return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
};
const validDay=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'');
let editing=null, busy=false;
const legacyForm=form;
function info(message){const el=document.getElementById('gce-feedback');if(el){el.textContent=message;el.hidden=!message}else toast(message)}
function writableCalendars(){const b=bridge();return b?.connected?(b.cfg.calendars||[]).filter(c=>b.cfg.selected.includes(c.id)&&['owner','writer'].includes(c.accessRole)):[]}
function formEvent(date='',googleCal='',googleId='',localId=0){
 const day=validDay(date)?date:validDay(state.calSelected)?state.calSelected:localISO(new Date());
 const b=bridge();const writable=writableCalendars();
 const gev=googleId?b?.events.find(e=>e.id===googleId&&e.calendarId===googleCal):null;
 const lev=localId?state.events.find(e=>String(e.id)===String(localId)):null;
 if(googleId&&!gev)return toast('Google događaj nije učitan. Osvježi kalendar.');
 if(localId&&!lev)return toast('Lokalni događaj nije pronađen.');
 if(gev&&!writable.some(c=>c.id===gev.calendarId))return toast('Za ovaj Google kalendar nemaš pravo uređivanja.');
 editing=gev?{kind:'google',id:gev.id,calendarId:gev.calendarId}:lev?{kind:'local',id:lev.id}:null;
 busy=false;
 const allDay=gev?gev.allDay:lev?(lev.allDay||!lev.time):false;
 const start=gev?(gev.start.dateTime?localDT(gev.start.dateTime):gev.start.date):lev?((lev.due||day)+'T'+(lev.time||'09:00')):day+'T09:00';
 const end=gev?(gev.end.dateTime?localDT(gev.end.dateTime):plusDays(gev.end.date,-1)):lev?((lev.endDate||lev.due||day)+'T'+(lev.endTime||'10:00')):day+'T10:00';
 const startVal=allDay?start.slice(0,10):start.includes('T')?start:start+'T09:00';
 const endVal=allDay?end.slice(0,10):end.includes('T')?end:end+'T10:00';
 let selected=gev?gev.calendarId:lev?'local':writable.some(c=>c.id===b?.cfg.defaultId)?b.cfg.defaultId:(writable[0]?.id||'local');
 const calendars=`<option value="local" ${selected==='local'?'selected':''}>Lokalni događaj (samo ovaj preglednik)</option>`+
   writable.map(c=>`<option value="${html(c.id)}" ${selected===c.id?'selected':''}>Google · ${html(c.summary)}</option>`).join('');
 const isGoogle=selected!=='local';
 const description=gev?.description||lev?.description||'';
 const location=gev?.location||lev?.location||'';
 const title=gev?.name||lev?.name||'';
 const types=editing?'':`<label class="field">Vrsta zapisa<select id="gce-type" class="select"><option value="Događaji">Događaj</option><option value="Tasks">Zadatak (Tasks)</option><option value="Chores">Kućni posao (Chores)</option><option value="Reminders">Podsjetnik (Reminders)</option></select></label>`;
 const repeatOpts=['Ne ponavlja se','Svaki dan','Svaki tjedan','Svaki mjesec','Svake godine'].map(x=>`<option ${lev?.repeat===x?'selected':''}>${x}</option>`).join('');
 const body=`<div class="gce-unified">${types}
 <label class="field">Naziv događaja<input id="gce-title" value="${html(title)}" placeholder="npr. Sastanak, liječnik, rođendan" maxlength="240"></label>
 <div class="gc-form-grid">
 <label class="field" style="grid-column:1/-1">Spremi u kalendar<select id="gce-calendar" class="select" ${editing?.kind==='google'?'disabled':''}>${calendars}</select></label>
 <label class="field gce-check"><input id="gce-allday" type="checkbox" ${allDay?'checked':''}> Cijeli dan</label>
 <div class="gce-spacer"></div>
 <label class="field">Početak<input id="gce-start" type="${allDay?'date':'datetime-local'}" value="${html(startVal)}"></label>
 <label class="field">Završetak${allDay?' (uključivo)':''}<input id="gce-end" type="${allDay?'date':'datetime-local'}" value="${html(endVal)}"></label>
 <label class="field" style="grid-column:1/-1">Lokacija<input id="gce-location" value="${html(location)}" placeholder="Neobavezno"></label>
 <label class="field" style="grid-column:1/-1">Opis<textarea id="gce-description" rows="3">${html(description)}</textarea></label>
 <label class="field" id="gce-repeat-wrap" style="grid-column:1/-1" ${isGoogle?'hidden':''}>Ponavljanje (lokalno)<select id="gce-repeat">${repeatOpts}</select></label>
 </div>
 <p class="gc-form-hint" id="gce-source-hint">${isGoogle?'Događaj će se odmah spremiti u Google Calendar.':'Lokalni događaj ostaje samo u ovom pregledniku.'}</p>
 ${!writable.length&&!editing?'<p class="gc-form-hint">Za Google događaje poveži račun i odaberi kalendar s pravom uređivanja u Postavkama.</p>':''}
 <p id="gce-feedback" class="gce-feedback" role="alert" hidden></p></div>`;
 const buttons=`<div class="gc-event-actions">${editing?`<button class="smallbtn gce-danger" data-gce-delete>${editing.kind==='google'?'Obriši iz Googlea':'Premjesti u koš'}</button>`:'<span></span>'}
 <div class="right"><button class="smallbtn" data-close>Odustani</button><button class="primary" data-gce-save>${editing?'Spremi promjene':'Spremi događaj'}</button></div></div>`;
 modal(editing?'Uredi događaj':'Novi događaj',body,buttons);
 document.getElementById('gce-title')?.focus();
}
function changeAllDay(){
 const whole=document.getElementById('gce-allday')?.checked;
 for(const id of ['gce-start','gce-end']){
  const el=document.getElementById(id);if(!el)continue;
  const value=el.value;
  el.type=whole?'date':'datetime-local';
  el.value=whole?value.slice(0,10):value.length===10?value+(id==='gce-start'?'T09:00':'T10:00'):value;
 }
 const label=document.getElementById('gce-end')?.closest('label');if(label)label.firstChild.textContent=whole?'Završetak (uključivo)':'Završetak';
}
function busyUI(on){busy=on;document.querySelectorAll('[data-gce-save],[data-gce-delete]').forEach(el=>{el.disabled=on})}
async function saveEvent(){
 if(busy)return;
 const type=document.getElementById('gce-type')?.value||'Događaji';
 const startInput=document.getElementById('gce-start');
 if(type!=='Događaji'){
  const day=startInput?.value.slice(0,10)||localISO(new Date());
  pendingDate=day;legacyForm(type,0);
  if(document.getElementById('fDue'))document.getElementById('fDue').value=day;
  pendingDate=null;return;
 }
 const title=document.getElementById('gce-title')?.value.trim()||'';
 const cal=document.getElementById('gce-calendar')?.value||'local';
 const allDay=!!document.getElementById('gce-allday')?.checked;
 const start=startInput?.value||'',end=document.getElementById('gce-end')?.value||'';
 if(!title)return info('Unesi naziv događaja.');
 if(!start||!end)return info('Odaberi početak i završetak.');
 if(allDay?end<start:!(new Date(end)>new Date(start)))return info('Završetak mora biti nakon početka (ili isti dan za cjelodnevni događaj).');
 const description=document.getElementById('gce-description')?.value||'';
 const location=document.getElementById('gce-location')?.value||'';
 if(cal==='local'){
  if(editing?.kind==='google')return info('Google događaj nije moguće premjestiti u lokalni kalendar uređivanjem.');
  const local=editing?.kind==='local'?state.events.find(e=>String(e.id)===String(editing.id)):null;
  if(editing?.kind==='local'&&!local)return info('Lokalni događaj više ne postoji.');
  const o=local||{id:Date.now()+Math.floor(Math.random()*10000),done:false};
  Object.assign(o,{name:title,due:start.slice(0,10),time:allDay?'':start.slice(11,16),endDate:end.slice(0,10),endTime:allDay?'':end.slice(11,16),allDay,description,location,repeat:document.getElementById('gce-repeat')?.value||o.repeat||'Ne ponavlja se'});
  if(!local)state.events.unshift(o);
  persist();close();render();toast(local?'Lokalni događaj ažuriran.':'Lokalni događaj dodan.');return;
 }
 if(editing?.kind==='local')return info('Za prijenos lokalnog događaja u Google izradi novi Google događaj.');
 if(!bridge()?.connected)return info('Google nije povezan. Provjeri Postavke.');
 if(!writableCalendars().some(c=>c.id===cal))return info('Nemaš pravo uređivanja odabranog Google kalendara.');
 const startObj=allDay?{date:start}:{dateTime:new Date(start).toISOString()};
 const endObj=allDay?{date:plusDays(end,1)}:{dateTime:new Date(end).toISOString()};
 busyUI(true);info('Spremam u Google Calendar…');
 try{
  const payload={summary:title,start:startObj,end:endObj,description,location};
  await bridge().request(editing?'PATCH':'POST',cal,editing?.id||'',payload);
  close();toast(editing?'Google događaj ažuriran.':'Google događaj dodan.');
  try{await bridge().refresh()}catch(refreshError){console.warn('Google osvježavanje nakon spremanja:',refreshError);toast('Događaj je spremljen; osvježi prikaz ako ga odmah ne vidiš.')}
 }catch(err){info('Google spremanje nije uspjelo: '+(err?.message||String(err)))}
 finally{busyUI(false)}
}
async function deleteEvent(){
 if(busy||!editing)return;
 const google=editing.kind==='google';
 if(!confirm(google?'Trajno obrisati ovaj događaj iz Google Calendara?':'Premjestiti ovaj lokalni događaj u koš?'))return;
 if(!google){
  const i=state.events.findIndex(e=>String(e.id)===String(editing.id));
  if(i<0)return info('Lokalni događaj nije pronađen.');
  const [o]=state.events.splice(i,1);
  state.trash.unshift({type:'Događaji',item:o,at:new Date().toLocaleString('hr-HR')});
  persist();close();render();toast('Lokalni događaj premješten u koš.');return;
 }
 busyUI(true);info('Brišem iz Google Calendara…');
 try{await bridge().request('DELETE',editing.calendarId,editing.id);close();toast('Google događaj obrisan.');try{await bridge().refresh()}catch(refreshError){console.warn('Google osvježavanje nakon brisanja:',refreshError);toast('Događaj je obrisan; osvježi prikaz ako ga još vidiš.')}}
 catch(err){info('Google brisanje nije uspjelo: '+(err?.message||String(err)))}
 finally{busyUI(false)}
}
// Zamjenjujemo isključivo obrazac događaja; ostali moduli i drag/drop ostaju isti.
form=function(type,id){
 if(type==='Događaji'){
  const date=pendingDate||(state.page==='Kalendar'?state.calSelected:localISO(new Date()));pendingDate=null;
  return formEvent(date,'','',id||0);
 }
 return legacyForm(type,id);
};
dayAdd=function(date){pendingDate=date;formEvent(date);pendingDate=null;};
window.lifeOpenGoogleEvent=formEvent;
document.addEventListener('click',e=>{
 const btn=e.target.closest('button');if(!btn)return;
 if(btn.hasAttribute('data-gc-new')){e.preventDefault();e.stopImmediatePropagation();formEvent(btn.dataset.gcNew);return}
 if(btn.hasAttribute('data-gc-edit')){e.preventDefault();e.stopImmediatePropagation();formEvent('',btn.dataset.gcEdit,btn.dataset.gcEvent);return}
 if(btn.hasAttribute('data-gce-save')){e.preventDefault();e.stopImmediatePropagation();void saveEvent();return}
 if(btn.hasAttribute('data-gce-delete')){e.preventDefault();e.stopImmediatePropagation();void deleteEvent();return}
},true);
document.addEventListener('change',e=>{
 if(e.target?.id==='gce-allday'){changeAllDay();return}
 if(e.target?.id==='gce-calendar'){
  const google=e.target.value!=='local';
  const repeat=document.getElementById('gce-repeat-wrap');if(repeat)repeat.hidden=google;
  const tip=document.getElementById('gce-source-hint');if(tip)tip.textContent=google?'Događaj će se odmah spremiti u Google Calendar.':'Lokalni događaj ostaje samo u ovom pregledniku.';
 }
 if(e.target?.id==='gce-type'){
  const t=e.target.value;
  const form=e.target.closest('.gce-unified');
  if(form){for(const el of form.children){if(el===e.target.closest('label'))continue;el.hidden=t!=='Događaji'} }
  const btn=document.querySelector('[data-gce-save]');if(btn)btn.textContent=t==='Događaji'?'Spremi događaj':'Nastavi na '+t;
 }
});
})();
