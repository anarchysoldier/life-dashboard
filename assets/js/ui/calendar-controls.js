
/* v1.31 – bolji pregled dana i brzi odabir datuma */
function cal31ShiftDay(n){
 const d=new Date((state.calSelected||localISO(new Date()))+'T12:00:00');
 if(!Number.isFinite(d.getTime()))return;
 d.setDate(d.getDate()+n);
 const iso=localISO(d);state.calSelected=iso;state.year=d.getFullYear();state.month=d.getMonth();state.selectedDay=d.getDate();render();
}
function cal31Jump(iso){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(iso||''))return;
 const d=new Date(iso+'T12:00:00');if(!Number.isFinite(d.getTime())||localISO(d)!==iso)return;
 state.calSelected=iso;state.year=d.getFullYear();state.month=d.getMonth();state.selectedDay=d.getDate();render();
}
const cal31OldOther=other;
other=function(){
 if(state.page!=='Kalendar')return cal31OldOther();
 const html=cal31OldOther();
 const today=state.calSelected||localISO(new Date());
 const total=v120Entries(today).length;
 const controls=`<div class="cal31-tools"><span class="cal31-count">${total} ${total===1?'stavka':'stavki'} na odabrani dan</span></div>`;
 return html.replace('<div class="cal-v120">','<div class="cal-v120">'+controls);
};
const cal31OldDayPanel=v120DayPanel;
v120DayPanel=function(){
 const iso=state.calSelected||localISO(new Date()), d=new Date(iso+'T12:00:00');
 const pretty=d.toLocaleDateString('hr-HR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
 const items=v120Entries(iso).slice().sort((a,b)=>{
  const at=/^([01]\d|2[0-3]):[0-5]\d$/.test(a.o.time||'')?a.o.time:'99:99';
  const bt=/^([01]\d|2[0-3]):[0-5]\d$/.test(b.o.time||'')?b.o.time:'99:99';
  return at.localeCompare(bt)||a.o.name.localeCompare(b.o.name,'hr');
 });
 return `<div class="card day-panel"><div class="cardhead"><h3 style="text-transform:capitalize">${pretty}</h3><button class="primary" data-cal-add="${iso}">＋ Dodaj</button></div>
 <div class="cal31-daynav"><button class="smallbtn" data-cal31-day="-1" aria-label="Prethodni dan">‹</button><button class="smallbtn" data-cal31-today>Danas</button><button class="smallbtn" data-cal31-day="1" aria-label="Sljedeći dan">›</button><span class="tiny" style="margin-left:8px">${items.length} ${items.length===1?'obveza':'obveza'}</span></div>
 ${items.length?items.map(({label,o,dot})=>`<div class="cal31-entry ${o.done||o.status==='Gotovo'?'done':''}"><span class="cal31-time">${esc(o.time||'—')}</span><i class="dot ${dot}" aria-hidden="true"></i><div class="info"><div class="name">${esc(o.name)}</div><div class="meta">${esc(label)}${o.who?' · '+esc(o.who):''}${o.status?' · '+esc(o.status):''}</div></div>${label.startsWith('Google · ')?`<button class="smallbtn" data-gc-edit="${esc(o.calendarId)}" data-gc-event="${esc(o.id)}">Uredi</button>`:`<button class="smallbtn" data-edit="${label}:${o.id}">Uredi</button>`}</div>`).join(''):'<p class="tiny">Nema obveza za odabrani datum.</p>'}</div>`;
};
/* Existing other() calls v120DayPanel dynamically, so override above applies immediately. */
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.hasAttribute('data-cal31-jump')){e.stopImmediatePropagation();cal31Jump(document.getElementById('cal31Date')?.value);return}
 if(b.hasAttribute('data-cal31-day')){e.stopImmediatePropagation();cal31ShiftDay(Number(b.dataset.cal31Day));return}
 if(b.hasAttribute('data-cal31-today')){e.stopImmediatePropagation();cal31Jump(localISO(new Date()));return}
},true);
document.addEventListener('keydown',e=>{
 if(e.target?.id==='cal31Date'&&e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();cal31Jump(e.target.value)}
},true);
