
(function(){
 const previousOther=other;
 let range='month';
 const fmt=n=>new Intl.NumberFormat('hr-HR').format(n);
 const iso=x=>{if(!x)return '';const d=String(x);if(/^\d{4}-\d{2}-\d{2}/.test(d))return d.slice(0,10);const p=d.match(/^(\d{1,2})\.(?:\s*)(\d{1,2})\.(?:\s*)(\d{4})/);return p?`${p[3]}-${p[2].padStart(2,'0')}-${p[1].padStart(2,'0')}`:''};
 const done=x=>!!(x.done||x.status==='Gotovo'||x.status==='Dovršeno');
 function view(){
  const today=new Date(),start=new Date(today.getFullYear(),today.getMonth(),1);
  if(range==='week'){start.setTime(today.getTime());start.setDate(today.getDate()-((today.getDay()+6)%7));start.setHours(0,0,0,0)}
  if(range==='year')start.setMonth(0);
  if(range==='all')start.setFullYear(1970,0,1);
  const from=`${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,'0')}-${String(start.getDate()).padStart(2,'0')}`;
  const to=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const tasks=state.tasks||[],chores=state.chores||[],shopping=state.shopping||[],activities=state.activity||[];
  const inRange=d=>!!d&&d>=from&&d<=to;
  const finished=activities.filter(x=>/dovrš|izvrš|završ|promjena statusa/i.test(String(x.action||''))&&inRange(iso(x.iso||x.at)));
  const doneTasks=tasks.filter(done),doneChores=chores.filter(done);
  const late=chores.filter(x=>!done(x)&&x.status!=='Pauzirano'&&iso(x.due)&&iso(x.due)<to).length;
  const expenses=chores.reduce((sum,x)=>sum+(Number(x.actualCost??x.actual??x.stvarniTrosak??x.costActual)||0),0);
  const members={};doneChores.forEach(x=>{const name=x.completedBy||x.doneBy||x.who||'Nije zabilježeno';members[name]=(members[name]||0)+1});
  const memberList=Object.entries(members).sort((a,b)=>b[1]-a[1]);const maxMember=Math.max(1,...memberList.map(x=>x[1]));
  const months=Array.from({length:6},(_,i)=>{const d=new Date(today.getFullYear(),today.getMonth()-5+i,1);return {key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,name:d.toLocaleDateString('hr-HR',{month:'short'})}});
  const bars=months.map(m=>({...m,n:activities.filter(x=>/dovrš|izvrš|završ/i.test(String(x.action||''))&&iso(x.iso||x.at).startsWith(m.key)).length}));
  const maxBar=Math.max(1,...bars.map(x=>x.n));
  const metrics=[['Aktivni Tasks',tasks.length-doneTasks.length],['Dovršeni Tasks',doneTasks.length],['Dovršeni Chores',doneChores.length],['Zakašnjeli Chores',late],['Shopping – kupljeno',shopping.filter(x=>x.done).length],['Stvarni trošak Chores',expenses.toLocaleString('hr-HR',{style:'currency',currency:'EUR'})]];
  return `<div class="card"><div class="v130-toolbar"><div><h3 style="margin:0 0 5px">Statistika kućanstva</h3><span class="tiny">Pregled podataka i zabilježenih aktivnosti</span></div><select data-v130-range aria-label="Razdoblje"><option value="week" ${range==='week'?'selected':''}>Ovaj tjedan</option><option value="month" ${range==='month'?'selected':''}>Ovaj mjesec</option><option value="year" ${range==='year'?'selected':''}>Ova godina</option><option value="all" ${range==='all'?'selected':''}>Sve vrijeme</option></select></div><div class="v130-grid">${metrics.map(([k,v])=>`<div class="v130-stat"><small>${esc(k)}</small><strong>${typeof v==='number'?fmt(v):esc(v)}</strong></div>`).join('')}</div><div class="v130-panels"><section class="v130-panel"><h4>Zabilježena dovršavanja · zadnjih 6 mjeseci</h4><div class="v130-chart">${bars.map(x=>`<div class="v130-col"><span class="tiny">${x.n}</span><div class="v130-bar" style="height:${Math.max(3,x.n/maxBar*105)}px"></div><small>${esc(x.name)}</small></div>`).join('')}</div><p class="v130-legend">Graf koristi samo radnje dovršavanja zabilježene u dnevniku aktivnosti.</p></section><section class="v130-panel"><h4>Dovršeni Chores po članu</h4>${memberList.length?memberList.map(([name,n])=>`<div class="v130-member"><span>${esc(name)}</span><div class="v130-track"><div class="v130-fill" style="width:${100*n/maxMember}%"></div></div><b>${n}</b></div>`).join(''):'<p class="tiny">Još nema dovršenih poslova.</p>'}<p class="v130-legend">Prikaz prema dostupnom polju izvršitelja.</p></section></div><p class="tiny" style="margin-top:18px">Brojčani pokazatelji predstavljaju trenutačno stanje i ne mijenjaju se s odabirom razdoblja. Razdoblje se primjenjuje na povijesne podatke; graf prikazuje zadnjih šest mjeseci. Povijesni podaci mogu biti nepotpuni jer se sve radnje nisu bilježile u ranijim verzijama.</p><button class="smallbtn" data-action="export">Izvezi CSV</button></div>`;
 }
 other=function(){return state.page==='Statistika'?view():previousOther()};
 document.addEventListener('change',e=>{if(!e.target.matches('[data-v130-range]'))return;range=e.target.value;render()},true);
})();
