
/* v1.29 — evidencija stvarno spremljenih promjena; bez ograničenja broja zapisa. */
(function(){
 const keys=[['Tasks','tasks'],['Chores','chores'],['Shopping','shopping'],['Notes','notes'],['Reminders','reminders'],['Događaji','events']];
 const clone=x=>JSON.parse(JSON.stringify(x||[]));
 let previous=Object.fromEntries([...keys.map(([,k])=>k),'trash'].map(k=>[k,clone(state[k])]));
 const originalPersist=persist;
 const realLog=v123Log;
 // Stari click-logger bilježio je i neuspješne klikove. Novi prati stvarne promjene.
 v123Log=function(){};
 let busy=false;
 function label(o){return String(o?.name||o?.title||o?.item||o?.text||'Bez naziva').slice(0,130)}
 function add(action,module,name){state.activity=Array.isArray(state.activity)?state.activity:[];const now=new Date();state.activity.unshift({at:now.toLocaleString('hr-HR'),iso:now.toISOString(),action,module,member:'Lokalni korisnik',msg:`${action}: ${name}`});}
 function compare(module,key){
   const before=previous[key]||[],after=Array.isArray(state[key])?state[key]:[];
   const oldMap=new Map(before.map((o,i)=>[String(o.id??'index-'+i),o]));
   const newMap=new Map(after.map((o,i)=>[String(o.id??'index-'+i),o]));
   for(const [id,o] of newMap){const old=oldMap.get(id);if(!old){add('Dodano',module,label(o));continue}if(JSON.stringify(old)===JSON.stringify(o))continue;
     const wasDone=!!old.done||old.status==='Gotovo',isDone=!!o.done||o.status==='Gotovo';
     if(wasDone!==isDone)add(isDone?'Dovršeno':'Ponovno aktivirano',module,label(o));
     else if(old.status!==o.status&&o.status==='Pauzirano')add('Pauzirano',module,label(o));
     else if(old.status==='Pauzirano'&&o.status!=='Pauzirano')add('Nastavljeno',module,label(o));
     else add('Uređeno',module,label(o));
   }
   for(const [id,o] of oldMap)if(!newMap.has(id))add('Uklonjeno',module,label(o));
   previous[key]=clone(after);
 }
 persist=function(){
   if(busy)return originalPersist();
   busy=true;
   try{
     trimHistory();
     for(const [module,key] of keys)compare(module,key);
     const oldTrash=previous.trash||[],newTrash=Array.isArray(state.trash)?state.trash:[];
     const getId=(x,i)=>String(x.trashId??x.id??x.deletedAt??'index-'+i);
     const oldMap=new Map(oldTrash.map((x,i)=>[getId(x,i),x]));
     const newMap=new Map(newTrash.map((x,i)=>[getId(x,i),x]));
     for(const [id,o] of newMap)if(!oldMap.has(id))add('U koš','Koš',label(o.data||o.item||o));
     for(const [id,o] of oldMap)if(!newMap.has(id))add('Uklonjeno iz koša','Koš',label(o.data||o.item||o));
     previous.trash=clone(newTrash);
     return originalPersist();
   }finally{busy=false}
 };
 const baseOther=other;
 const filter={module:'Svi',action:'Sve',member:'Svi',from:'',to:'',q:'',page:0};
 const pageSize=40;
 function renderLog(){
   const all=Array.isArray(state.activity)?state.activity:[];
   const date=e=>e.iso?e.iso.slice(0,10):v123Date(e);
   const values=(field)=>[...new Set(all.map(e=>String(e[field]|| (field==='member'?'Lokalni korisnik':'Ostalo'))))].sort((a,b)=>a.localeCompare(b,'hr'));
   const option=(val,selected)=>`<option value="${esc(val)}" ${val===selected?'selected':''}>${esc(val)}</option>`;
   const selection=(field,first)=>`<select data-v129-filter="${field}">${option(first,filter[field])}${values(field).map(x=>option(x,filter[field])).join('')}</select>`;
   const found=all.filter(e=>{const d=date(e);return (filter.module==='Svi'||e.module===filter.module)&&(filter.action==='Sve'||e.action===filter.action)&&(filter.member==='Svi'||(e.member||'Lokalni korisnik')===filter.member)&&(!filter.from||d>=filter.from)&&(!filter.to||d<=filter.to)&&(!filter.q||(String(e.msg||'')+' '+String(e.module||'')+' '+String(e.action||'')).toLocaleLowerCase('hr-HR').includes(filter.q.toLocaleLowerCase('hr-HR')))});
   const pages=Math.max(1,Math.ceil(found.length/pageSize));filter.page=Math.max(0,Math.min(filter.page,pages-1));
   const shown=found.slice(filter.page*pageSize,(filter.page+1)*pageSize);
   return `<div class="card"><div class="cardhead"><h3>Dnevnik aktivnosti</h3></div><p class="tiny">Evidencija lokalno spremljenih promjena. Nema ograničenja od 500 zapisa u prikazu; koristi stranice i filtre. Izvršitelj je zasad „Lokalni korisnik”.</p><div class="v129-tools"><input type="search" data-v129-filter="q" placeholder="Pretraži aktivnosti..." value="${esc(filter.q)}" aria-label="Pretraži aktivnosti">${selection('module','Svi')}${selection('action','Sve')}${selection('member','Svi')}<label>Od <input type="date" data-v129-filter="from" value="${esc(filter.from)}"></label><label>Do <input type="date" data-v129-filter="to" value="${esc(filter.to)}"></label><button class="smallbtn" data-v129-reset>Očisti filtre</button></div><div class="v129-count">Pronađeno ${found.length} od ukupno ${all.length} aktivnosti</div>${shown.map(e=>`<div class="v129-event"><div class="v129-event-title">${esc(e.msg||e.action||'Aktivnost')}</div><div class="v129-event-meta">${esc(e.at||'')} · ${esc(e.module||'Ostalo')} · ${esc(e.action||'Ostalo')} · ${esc(e.member||'Lokalni korisnik')}</div></div>`).join('')||'<p class="tiny">Nema aktivnosti za odabrane filtre.</p>'}<div class="v129-page"><button data-v129-page="prev" ${filter.page===0?'disabled':''}>← Prethodna</button><span class="tiny">Stranica ${filter.page+1} / ${pages}</span><button data-v129-page="next" ${filter.page>=pages-1?'disabled':''}>Sljedeća →</button></div></div>`;
 }
 other=function(){return state.page==='Aktivnosti'?renderLog():baseOther()};
 document.addEventListener('change',e=>{const k=e.target.dataset?.v129Filter;if(!k)return;filter[k]=e.target.value;filter.page=0;render()},true);
 document.addEventListener('input',e=>{if(e.target.dataset?.v129Filter!=='q')return;const pos=e.target.selectionStart;filter.q=e.target.value;filter.page=0;const el=document.getElementById('content');if(el){el.innerHTML=renderLog();const inp=el.querySelector('[data-v129-filter="q"]');inp?.focus();inp?.setSelectionRange(pos,pos)}},true);
 document.addEventListener('click',e=>{const b=e.target.closest('[data-v129-page],[data-v129-reset]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();if(b.hasAttribute('data-v129-reset'))Object.assign(filter,{module:'Svi',action:'Sve',member:'Svi',from:'',to:'',q:'',page:0});else filter.page+=b.dataset.v129Page==='next'?1:-1;render()},true);
})();
