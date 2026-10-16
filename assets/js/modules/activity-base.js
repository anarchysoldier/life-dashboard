
/* v1.23 — statistika i dnevnik aktivnosti. Ne mijenja postojeće module. */
const v123BaseOther=other;
const v123Types=['Tasks','Chores','Shopping','Notes','Događaji','Reminders'];
let v123Filters={module:'Svi',action:'Sve',member:'Svi',date:''};
function v123Date(entry){if(entry.iso)return entry.iso.slice(0,10);const m=String(entry.at||'').match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);return m?m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0'):''}
function v123Stats(){
 const tasks=state.tasks||[],chores=state.chores||[],shopping=state.shopping||[];
 const completed=a=>a.filter(x=>x.done||x.status==='Gotovo').length;
 const late=chores.filter(x=>x.status==='Zakašnjelo'||(!x.done&&x.status!=='Gotovo'&&dateForCalendar(x.due)&&dateForCalendar(x.due)<localISO(new Date()))).length;
 const bought=shopping.filter(x=>x.done).length;
 const money=chores.reduce((sum,x)=>sum+(Number(x.actualCost??x.actual??x.stvarniTrosak)||0),0);
 const members={};chores.forEach(x=>{if(x.done||x.status==='Gotovo'){let name=x.completedBy||x.doneBy||x.who||'Nije zabilježeno';members[name]=(members[name]||0)+1}});
 const metrics=[['Tasks – aktivni',tasks.length-completed(tasks)],['Tasks – završeni',completed(tasks)],['Chores – završeni',completed(chores)],['Chores – zakašnjeli',late],['Shopping – kupljeni',bought],['Shopping – ukupno',shopping.length]];
 const max=Math.max(1,...Object.values(members));
 return `<div class="card"><div class="cardhead"><h3>Statistika kućanstva</h3><button class="smallbtn" data-action="export">Izvezi CSV</button></div><p class="tiny">Pregled trenutačno spremljenih podataka u ovom pregledniku. Brojevi ne predstavljaju povijesne izvještaje.</p><div class="v123-stats">${metrics.map(([label,num])=>`<div class="v123-metric"><span>${esc(label)}</span><strong>${num}</strong></div>`).join('')}</div><h3>Izvršeni Chores po članu</h3>${Object.entries(members).length?Object.entries(members).map(([name,n])=>`<div class="v123-bar"><span>${esc(name)}</span><div class="v123-bar-track"><div class="v123-bar-fill" style="width:${100*n/max}%"></div></div><b>${n}</b></div>`).join(''):'<p class="tiny">Još nema završenih poslova.</p>'}<p class="tiny" style="margin-top:15px">Izvršitelj se prikazuje prema dostupnim podacima; bez prijave korisnika identitet nije pouzdano potvrđen. Povijesni trendovi bit će dostupni nakon uvođenja evidencije pojedinih izvršenja.</p></div>`;
}
function v123Activity(){
 const entries=(state.activity||[]).map(e=>({module:e.module||'Nije određeno',action:e.action||'Ostalo',member:e.member||'Lokalni korisnik',...e}));
 const filtered=entries.filter(e=>(v123Filters.module==='Svi'||e.module===v123Filters.module)&&(v123Filters.action==='Sve'||e.action===v123Filters.action)&&(v123Filters.member==='Svi'||e.member===v123Filters.member)&&(!v123Filters.date||v123Date(e)===v123Filters.date));
 const opts=(items,sel)=>items.map(x=>`<option value="${esc(x)}" ${x===sel?'selected':''}>${esc(x)}</option>`).join('');
 const modules=['Svi',...new Set(entries.map(e=>e.module))],actions=['Sve',...new Set(entries.map(e=>e.action))],members=['Svi',...new Set(entries.map(e=>e.member))];
 return `<div class="card"><h3>Dnevnik aktivnosti</h3><p class="tiny">Zabilježene radnje na ovom uređaju. Starije aktivnosti bez detaljnih podataka prikazuju se kao „Ostalo”.</p><div class="v123-filter"><select id="v123Module" aria-label="Modul">${opts(modules,v123Filters.module)}</select><select id="v123Action" aria-label="Vrsta radnje">${opts(actions,v123Filters.action)}</select><select id="v123Member" aria-label="Član">${opts(members,v123Filters.member)}</select><input id="v123Date" type="date" aria-label="Datum" value="${esc(v123Filters.date)}"><button class="smallbtn" data-v123-clear>Očisti filtre</button></div><div class="tiny">Prikazano: ${filtered.length} / ${entries.length}</div>${filtered.slice(0,500).map(e=>`<div class="v123-log"><div class="info"><div class="name">${esc(e.msg||e.action||'Aktivnost')}</div><div class="meta">${esc(e.at||'')} · ${esc(e.module)} · ${esc(e.action)} · ${esc(e.member)}</div></div></div>`).join('')||'<p class="tiny">Nema aktivnosti za odabrane filtre.</p>'}</div>`;
}
other=function(){if(state.page==='Statistika')return v123Stats();if(state.page==='Aktivnosti')return v123Activity();return v123BaseOther()};
function v123Log(action,module,msg){state.activity.unshift({at:new Date().toLocaleString('hr-HR'),iso:new Date().toISOString(),action,module,member:'Lokalni korisnik',msg});if(state.activity.length>5000)state.activity.length=5000;persist()}
// Zabilježi korisničke radnje nakon izvršavanja postojećih handlera.
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 let action='',module='',msg='';
 if(b.dataset.toggle){module=b.dataset.toggle.split(':')[0];action='Promjena statusa';msg='Promijenjen status stavke u modulu '+module}
 else if(b.dataset.save!==undefined){module=state.page;action='Spremanje';msg='Spremljena stavka u modulu '+module}
 else if(b.dataset.delete!==undefined){module=state.page;action='Brisanje';msg='Stavka premještena u koš: '+module}
 else if(b.dataset.restore!==undefined){module='Koš';action='Vraćanje';msg='Vraćena stavka iz koša'}
 else if(b.hasAttribute('data-notes-save')){module='Notes';action='Spremanje';msg='Spremljena bilješka'}
 else if(b.hasAttribute('data-notes-duplicate')){module='Notes';action='Dupliciranje';msg='Duplicirana bilješka'}
 else if(b.hasAttribute('data-notes-delete')){module='Notes';action='Brisanje';msg='Bilješka premještena u koš'}
 if(action)setTimeout(()=>v123Log(action,module,msg),0);
},true);
document.addEventListener('change',e=>{let k={v123Module:'module',v123Action:'action',v123Member:'member',v123Date:'date'}[e.target.id];if(k){v123Filters[k]=e.target.value;render()}},true);
document.addEventListener('click',e=>{if(e.target.closest('[data-v123-clear]')){e.stopImmediatePropagation();v123Filters={module:'Svi',action:'Sve',member:'Svi',date:''};render()}},true);
