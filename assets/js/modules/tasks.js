
/* v1.17: nadogradnja postojećih funkcija; isti lokalni spremnik kao v1.16. */
const v117OldForm=form, v117OldSave=saveForm, v117OldCollection=collection, v117OldItem=itemHTML;
state.taskStatusFilter='Sve';state.taskPriorityFilter='Svi';
form=function(type,id){
 if(type!=='Tasks')return v117OldForm(type,id);
 state.menu=false;
 const o=state.tasks.find(x=>x.id===id)||{};
 const selected=(options,value)=>options.map(v=>`<option value="${esc(v)}" ${v===value?'selected':''}>${esc(v)}</option>`).join('');
 modal((id?'Uredi':'Dodaj')+' · Tasks',
 `<label class="field">Naziv zadatka<input id="fName" value="${esc(o.name||'')}" maxlength="180" placeholder="Što treba napraviti?"></label>
 <label class="field">Opis<textarea id="fDescription" rows="3" placeholder="Detalji zadatka (neobavezno)">${esc(o.description||'')}</textarea></label>
 <div class="grid2"><label class="field">Rok<input id="fDue" type="date" value="${esc(dateForCalendar(o.due)||localISO(new Date()))}"></label>
 <label class="field">Prioritet<select id="fPriority">${selected(['Nizak','Srednji','Visok'],o.priority||'Srednji')}</select></label></div>
 <div class="grid2"><label class="field">Status<select id="fStatus">${selected(['Novo','U tijeku','Gotovo'],o.status||'Novo')}</select></label>
 <label class="field">Dodijeljeno<select id="fWho">${window.lifeMembersOptions?window.lifeMembersOptions(o.who||'Svi'):'<option>Svi</option>'}</select></label>
 <label class="field">Ponavljanje<select id="fRepeat">${selected(['Ne ponavlja se','Svaki dan','Svaki tjedan','Svaki mjesec','Svake godine'],o.repeat||'Ne ponavlja se')}</select></label>
 <div class="notice">Ponavljanje: kada označiš zadatak dovršenim, izradit će se sljedeći termin. Podaci ostaju lokalno u ovom pregledniku.</div>`,
 `<button class="smallbtn" data-close>Odustani</button>${id?`<button class="smallbtn" data-delete="Tasks:${id}">Premjesti u koš</button><button class="smallbtn" data-duplicate="Tasks:${id}">Dupliciraj</button>`:''}<button class="primary" data-save="Tasks:${id}">Spremi</button>`);
};
saveForm=function(type,id){
 if(type!=='Tasks')return v117OldSave(type,id);
 const name=$('#fName')?.value.trim();if(!name)return toast('Upiši naziv zadatka.');
 const old=id?state.tasks.find(x=>x.id===id):null;
 if(id&&!old)return toast('Zadatak nije pronađen.');
 const o=old||{id:Date.now(),done:false};
 Object.assign(o,{name,description:$('#fDescription').value.trim(),due:$('#fDue').value,priority:$('#fPriority').value,status:$('#fStatus').value,who:$('#fWho').value,repeat:$('#fRepeat').value});
 o.done=o.status==='Gotovo';if(!old)state.tasks.unshift(o);
 persist();close();render();notify((old?'Uređen':'Dodan')+' zadatak: '+name);
};
itemHTML=function(o,type){
 if(type!=='Tasks')return v117OldItem(o,type);
 const done=o.done||o.status==='Gotovo';
 const memberColor=(o.who&&window.lifeColorForMember)?window.lifeColorForMember(o.who):null;
 const cls=memberColor?' has-member-color':'';
 const styleAttr=memberColor?` style="--member-color:${memberColor}"`:'';
 return `<div class="item${cls} ${done?'done':''}"${styleAttr}><input type="checkbox" data-toggle="Tasks:${o.id}" ${done?'checked':''} aria-label="Dovrši ${esc(o.name)}"><div class="info"><div class="name">${esc(o.name)}</div><div class="meta">${esc(o.due||'Bez roka')} · ${esc(o.who||'Nedodijeljeno')} · <span class="${o.priority==='Visok'?'task-priority-high':''}">${esc(o.priority||'Srednji')} prioritet</span></div>${o.description?`<div class="task-desc">${esc(o.description)}</div>`:''}${o.repeat&&o.repeat!=='Ne ponavlja se'?`<div class="task-detail">↻ ${esc(o.repeat)}</div>`:''}</div><button class="smallbtn" data-edit="Tasks:${o.id}" title="Uredi zadatak">⋯</button></div>`;
};
collection=function(type){
 if(type!=='Tasks')return v117OldCollection(type);
 const source=state.tasks;
 state.tasks=source.filter(x=>(state.taskStatusFilter==='Sve'||(x.status||'Novo')===state.taskStatusFilter)&&(state.taskPriorityFilter==='Svi'||(x.priority||'Srednji')===state.taskPriorityFilter));
 let output;
 try{output=v117OldCollection(type)}finally{state.tasks=source}
 const opts=(values,selected)=>values.map(x=>`<option ${x===selected?'selected':''}>${esc(x)}</option>`).join('');
 return `<div class="task-filters"><label class="tiny">Status <select class="select" id="taskStatusFilter">${opts(['Sve','Novo','U tijeku','Gotovo'],state.taskStatusFilter)}</select></label><label class="tiny">Prioritet <select class="select" id="taskPriorityFilter">${opts(['Svi','Visok','Srednji','Nizak'],state.taskPriorityFilter)}</select></label></div>`+output;
};
const v117OldToggle=toggle;
toggle=function(type,id){
 if(type!=='Tasks')return v117OldToggle(type,id);
 const o=state.tasks.find(x=>x.id===id);if(!o)return;
 const completing=o.status!=='Gotovo';o.status=completing?'Gotovo':'U tijeku';o.done=completing;
 if(completing&&o.repeat&&o.repeat!=='Ne ponavlja se'){
   const d=new Date((dateForCalendar(o.due)||localISO(new Date()))+'T12:00:00');
   if(o.repeat==='Svaki dan')d.setDate(d.getDate()+1);
   else if(o.repeat==='Svaki tjedan')d.setDate(d.getDate()+7);
   else if(o.repeat==='Svaki mjesec')d.setMonth(d.getMonth()+1);
   else if(o.repeat==='Svake godine')d.setFullYear(d.getFullYear()+1);
   const next=localISO(d);
   if(!state.tasks.some(t=>t.recurringFrom===o.id&&t.due===next))state.tasks.unshift({...o,id:Date.now()+Math.floor(Math.random()*1000),due:next,status:'Novo',done:false,recurringFrom:o.id});
 }
 persist();render();toast(completing?'Zadatak dovršen':'Zadatak ponovno aktivan');
};
document.addEventListener('change',e=>{
 if(e.target.id==='taskStatusFilter'){state.taskStatusFilter=e.target.value;render()}
 if(e.target.id==='taskPriorityFilter'){state.taskPriorityFilter=e.target.value;render()}
});

/* v1.18 — Chores: lokalni modul, kompatibilan s postojećim podacima */
const choreCategories=['Čišćenje','Okućnica','Održavanje','Kuhinja','Ostalo'];
const choreAreas=['Kuća','Dvorište','Vrt','Garaža','Ostalo'];
function choreOptions(values,value){return values.map(x=>`<option value="${esc(x)}" ${x===value?'selected':''}>${esc(x)}</option>`).join('')}
function choreNextDate(iso,repeat,days){
 const d=new Date((iso||localISO(new Date()))+'T12:00:00');if(Number.isNaN(d.getTime()))return null;
 if(repeat==='Svaki dan')d.setDate(d.getDate()+1);
 else if(repeat==='Svaki tjedan')d.setDate(d.getDate()+7);
 else if(repeat==='Svaki mjesec'){const day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+1);d.setDate(Math.min(day,new Date(d.getFullYear(),d.getMonth()+1,0).getDate()))}
 else if(repeat==='Svake godine'){const m=d.getMonth(),day=d.getDate();d.setFullYear(d.getFullYear()+1, m,Math.min(day,new Date(d.getFullYear()+1,m+1,0).getDate()))}
 else if(repeat==='Odabrani dani'){const selected=(days||[]).map(Number);if(!selected.length)return null;for(let i=1;i<=7;i++){const n=new Date(d);n.setDate(n.getDate()+i);if(selected.includes(n.getDay()))return localISO(n)}return null}
 else return null;
 return localISO(d);
}
function choreOverdue(o){return !o.done&&o.status!=='Gotovo'&&o.status!=='Pauzirano'&&o.due&&dateForCalendar(o.due)<localISO(new Date())}
const v118OldForm=form,v118OldSave=saveForm,v118OldItem=itemHTML,v118OldToggle=toggle,v118OldCollection=collection;
form=function(type,id){
 if(type!=='Chores')return v118OldForm(type,id);
 const o=state.chores.find(x=>x.id===id)||{};
 const selectedDays=(o.repeatDays||[]).map(Number);
 modal((id?'Uredi':'Dodaj')+' · Chores',`
 <label class="field">Naziv posla<input id="fName" value="${esc(o.name||'')}" maxlength="180" placeholder="Što treba obaviti?"></label>
 <label class="field">Opis<input id="fDescription" value="${esc(o.description||'')}" placeholder="Kratki opis (neobavezno)"></label>
 <div class="grid2"><label class="field">Rok<input id="fDue" type="date" value="${esc(dateForCalendar(o.due)||localISO(new Date()))}"></label><label class="field">Vrijeme podsjetnika<input id="fReminderTime" type="time" value="${esc(o.reminderTime||'15:00')}"></label></div>
 <div class="grid2"><label class="field">Status<select id="fStatus">${choreOptions(['Novo','U tijeku','Gotovo','Pauzirano'],o.status||'Novo')}</select></label><label class="field">Prioritet<select id="fPriority">${choreOptions(['Nizak','Srednji','Visok'],o.priority||'Srednji')}</select></label></div>
 <div class="grid2"><label class="field">Kategorija<select id="fCategory">${choreOptions([...new Set([...choreCategories,o.category].filter(Boolean))],o.category||'Ostalo')}</select></label><label class="field">Područje<select id="fArea">${choreOptions([...new Set([...choreAreas,o.area].filter(Boolean))],o.area||'Kuća')}</select></label></div>
 
 <label class="field">Dodijeljeno<select id="fWho">${window.lifeMembersOptions?window.lifeMembersOptions(o.who||'Svi'):'<option>Svi</option>'}</select></label>
 
 <label class="field">Ponavljanje<select id="fRepeat">${choreOptions(['Ne ponavlja se','Svaki dan','Svaki tjedan','Odabrani dani','Svaki mjesec','Svake godine'],o.repeat||'Ne ponavlja se')}</select></label>
 <div class="field">Dani ponavljanja (za „Odabrani dani”)</div><div class="chore-days">${[['Pon',1],['Uto',2],['Sri',3],['Čet',4],['Pet',5],['Sub',6],['Ned',0]].map(([label,num])=>`<label><input type="checkbox" class="chore-weekday" value="${num}" ${selectedDays.includes(num)?'checked':''}>${label}</label>`).join('')}</div>
 <details class="chore-more" ${o.notes||o.estimatedCost||o.actualCost||o.imageUrl||o.pauseUntil?'open':''}><summary>Više detalja</summary>
 <div class="grid2"><label class="field">Procjena troška (€)<input id="fEstimated" type="number" min="0" step="0.01" value="${esc(o.estimatedCost??'')}"></label><label class="field">Stvarni trošak (€)<input id="fActual" type="number" min="0" step="0.01" value="${esc(o.actualCost??'')}"></label></div>
 <label class="field">Pauzirano do (neobavezno)<input id="fPauseUntil" type="date" value="${esc(o.pauseUntil||'')}"></label>
 <label class="field">Bilješke<textarea id="fNotes" rows="3">${esc(o.notes||'')}</textarea></label>
 <label class="field">Poveznica na sliku (https://)<input id="fImageUrl" type="url" value="${esc(o.imageUrl||'')}" placeholder="https://..."></label>
 ${o.completedAt?`<div class="tiny">Posljednje izvršenje: ${esc(o.completedBy||'')} · ${esc(o.completedAt)}</div>`:''}
 </details>
 <div class="notice">Ovo je lokalna verzija: podsjetnici se spremaju, ali push obavijesti i sinkronizacija s Notionom još nisu aktivni. Ponavljanje stvara sljedeći termin nakon dovršetka.</div>`,
 `<button class="smallbtn" data-close>Odustani</button>${id?`<button class="smallbtn" data-delete="Chores:${id}">U koš</button><button class="smallbtn" data-duplicate="Chores:${id}">Dupliciraj</button>`:''}<button class="primary" data-save="Chores:${id||0}">Spremi</button>`);
};
saveForm=function(type,id){
 if(type!=='Chores')return v118OldSave(type,id);
 const name=$('#fName')?.value.trim();if(!name)return toast('Upiši naziv posla.');
 const repeat=$('#fRepeat').value,repeatDays=[...document.querySelectorAll('.chore-weekday:checked')].map(x=>Number(x.value));
 if(repeat==='Odabrani dani'&&!repeatDays.length)return toast('Odaberi barem jedan dan ponavljanja.');
 const imageUrl=$('#fImageUrl').value.trim();if(imageUrl&&!/^https:\/\//i.test(imageUrl))return toast('Poveznica na sliku mora počinjati s https://');
 const arr=state.chores,o=id?arr.find(x=>x.id===id):{id:Date.now(),done:false,history:[]};if(!o)return toast('Posao nije pronađen.');
 const wasDone=o.status==='Gotovo'||o.done;
 Object.assign(o,{name,description:$('#fDescription').value.trim(),due:$('#fDue').value,reminderTime:$('#fReminderTime').value,status:$('#fStatus').value,priority:$('#fPriority').value,category:$('#fCategory').value,area:$('#fArea').value,who:$('#fWho').value,repeat,repeatDays,estimatedCost:$('#fEstimated').value,actualCost:$('#fActual').value,pauseUntil:$('#fPauseUntil').value,notes:$('#fNotes').value,imageUrl});
 o.done=o.status==='Gotovo';if(o.status==='Pauzirano')o.paused=true;else o.paused=false;
 if(!id)arr.unshift(o);
 if(o.done&&!wasDone)choreComplete(o,false);
 persist();close();render();notify((id?'Uređen':'Dodan')+' posao: '+name);
};
function choreComplete(o,showToast=true){
 const now=new Date(),at=now.toLocaleString('hr-HR');o.status='Gotovo';o.done=true;o.completedAt=at;o.completedBy='Trenutačni korisnik';o.history=Array.isArray(o.history)?o.history:[];o.history.push({at,by:o.completedBy,due:o.due});
 const next=choreNextDate(dateForCalendar(o.due)||localISO(now),o.repeat,o.repeatDays);
 if(next&&!state.chores.some(x=>x.recurringFrom===o.id&&x.due===next)){
 const nextItem={...o,id:Date.now()+Math.floor(Math.random()*100000),due:next,status:'Novo',done:false,completedAt:'',completedBy:'',history:[],recurringFrom:o.id};state.chores.unshift(nextItem);
 }
 if(showToast)toast(next?'Posao obavljen; stvoren je sljedeći termin.':'Posao označen obavljenim.');
}
toggle=function(type,id){
 if(type!=='Chores')return v118OldToggle(type,id);
 const o=state.chores.find(x=>x.id===id);if(!o)return;
 if(o.status==='Gotovo'||o.done){o.status='U tijeku';o.done=false;toast('Posao ponovno aktivan.')}else choreComplete(o);
 persist();render();
};
itemHTML=function(o,type){
 if(type!=='Chores')return v118OldItem(o,type);
 const done=o.done||o.status==='Gotovo',late=choreOverdue(o),paused=o.status==='Pauzirano';
 const money=(v)=>v!==''&&v!==undefined&&v!==null?Number(v).toLocaleString('hr-HR',{style:'currency',currency:'EUR'}):'';
 const cost=(o.estimatedCost!==''&&o.actualCost!==''&&o.estimatedCost!=null&&o.actualCost!=null)?` · Razlika: ${money(Number(o.actualCost)-Number(o.estimatedCost))}`:'';
 const memberColor=(o.who&&window.lifeColorForMember)?window.lifeColorForMember(o.who):null;
 const cls=memberColor?' has-member-color':'';
 const styleAttr=memberColor?` style="--member-color:${memberColor}"`:'';
 return `<div class="item${cls} ${done?'done':''}"${styleAttr}><input type="checkbox" data-toggle="Chores:${o.id}" ${done?'checked':''} aria-label="Dovrši ${esc(o.name)}"><div class="info"><div class="name">${esc(o.name)}</div><div class="meta">${esc(o.due||'Bez roka')} · ${esc(o.category||'Ostalo')} · ${esc(o.area||'Kuća')} · ${esc(o.who||'Svi')}${esc(cost)}</div>${o.description?`<div class="task-desc">${esc(o.description)}</div>`:''}${o.repeat&&o.repeat!=='Ne ponavlja se'?`<div class="task-detail">↻ ${esc(o.repeat)}</div>`:''}${done&&o.completedAt?`<div class="task-detail">✓ ${esc(o.completedBy)} · ${esc(o.completedAt)}</div>`:''}</div>${late?'<span class="tag warn">Zakašnjelo</span>':paused?'<span class="tag">Pauzirano</span>':done?'<span class="tag green">Gotovo</span>':''}<button class="smallbtn" data-edit="Chores:${o.id}" title="Uredi posao">⋯</button></div>`;
};
collection=function(type){
 if(type!=='Chores')return v118OldCollection(type);
 const original=state.chores;
 const filtered=original.filter(o=>((state.choreStatusFilter||'Sve')==='Sve'||(state.choreStatusFilter==='Zakašnjelo'?choreOverdue(o):(o.status||'Novo')===state.choreStatusFilter))&&((state.choreCategoryFilter||'Sve')==='Sve'||(o.category||'Ostalo')===state.choreCategoryFilter));
 state.chores=filtered;let output;try{output=v118OldCollection(type)}finally{state.chores=original}
 return `<div class="chore-filters"><label class="tiny">Status <select class="select" id="choreStatusFilter">${choreOptions(['Sve','Novo','U tijeku','Gotovo','Zakašnjelo','Pauzirano'],state.choreStatusFilter||'Sve')}</select></label><label class="tiny">Kategorija <select class="select" id="choreCategoryFilter">${choreOptions(['Sve',...new Set([...choreCategories,...original.map(o=>o.category).filter(Boolean)])],state.choreCategoryFilter||'Sve')}</select></label></div>`+output;
};
document.addEventListener('change',e=>{
 if(e.target.id==='choreStatusFilter'){state.choreStatusFilter=e.target.value;render()}
 if(e.target.id==='choreCategoryFilter'){state.choreCategoryFilter=e.target.value;render()}
});
