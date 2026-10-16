
/* v1.20 — funkcionalni prikaz kalendara; postojeće module ne mijenjamo */
state.calFilters={Tasks:true,Chores:true,'Događaji':true,Reminders:true};
state.calSelected=localISO(new Date());
const v120OldOther=other;
const v120OldCalendar=calendar;
const v120Categories=[['Tasks','tasks','task'],['Chores','chores','chore'],['Događaji','events','event'],['Reminders','reminders','reminder']];
function v120Occurrences(o,kind,from,to){
 const first=dateForCalendar(o.due||o.date||o.start);if(!first)return [];
 const repeat=o.repeat||'Ne ponavlja se',dates=[];
 let d=new Date(first+'T12:00:00'),end=new Date(to+'T12:00:00'),start=new Date(from+'T12:00:00');
 if(!Number.isFinite(d.getTime()))return [];
 for(let i=0;i<450&&d<=end;i++){
  if(d>=start)dates.push(localISO(d));
  if(repeat==='Svaki dan')d.setDate(d.getDate()+1);
  else if(repeat==='Svaki tjedan')d.setDate(d.getDate()+7);
  else if(repeat==='Svaki mjesec'){const day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+1);d.setDate(Math.min(day,new Date(d.getFullYear(),d.getMonth()+1,0).getDate()))}
  else if(repeat==='Svake godine'){const month=d.getMonth(),day=d.getDate();d.setFullYear(d.getFullYear()+1,month,1);d.setDate(Math.min(day,new Date(d.getFullYear(),month+1,0).getDate()))}
  else if(repeat==='Odabrani dani'||repeat==='Odabranim danima'){d.setDate(d.getDate()+1);const selected=o.repeatDays||o.days||[];if(Array.isArray(selected)&&selected.length){let guard=0;while(guard++<7&&!selected.includes(d.getDay())&&!selected.includes(String(d.getDay()))&&!selected.includes(['Ned','Pon','Uto','Sri','Čet','Pet','Sub'][d.getDay()]))d.setDate(d.getDate()+1)}}
  else break;
 }
 return dates;
}
function v120Entries(date){const local=v120Categories.flatMap(([label,key,dot])=>state.calFilters[label]?(state[key]||[]).filter(o=>v120Occurrences(o,key,date,date).includes(date)).map(o=>({label,key,dot,o})):[]);const google=state.calFilters['Google']===false?[]:(window.lifeGoogleEvents||[]).filter(o=>o.day===date).map(o=>({label:'Google · '+o.calendarName,key:'google',dot:'google',o}));return [...local,...google]}
function v120Calendar(){
 const first=new Date(state.year,state.month,1),month=first.toLocaleDateString('hr-HR',{month:'long',year:'numeric'}),start=(first.getDay()+6)%7,len=new Date(state.year,state.month+1,0).getDate();let cells='';
 for(let i=0;i<42;i++){
  const day=i-start+1,valid=day>0&&day<=len,iso=valid?`${state.year}-${String(state.month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`:'';
  const entries=valid?v120Entries(iso):[],dots=[...new Set(entries.map(x=>x.dot))];
  cells+=`<button class="${valid?'':'out'} ${iso===state.calSelected?'selected':''} ${iso===localISO(new Date())?'today':''}" ${valid?`data-cal-date="${iso}"`: 'disabled'} aria-label="${valid?day+'. '+(state.month+1)+'. '+state.year+', '+entries.length+' obveza':''}">${valid?day:''}<span class="dots">${dots.map(k=>k==='google'?'<i class="dot google"></i>':`<i class="dot ${k}"></i>`).join('')}</span></button>`;
 }
 return `<div class="card"><div class="calendarbar"><h3 style="margin:0;text-transform:capitalize">${month}</h3><div class="minirow"><button class="smallbtn" data-cal-month="-1" aria-label="Prethodni mjesec">‹</button><button class="smallbtn" data-cal-today>Danas</button><button class="smallbtn" data-cal-month="1" aria-label="Sljedeći mjesec">›</button></div></div><div class="caldays">${['Pon','Uto','Sri','Čet','Pet','Sub','Ned'].map(x=>'<span>'+x+'</span>').join('')}</div><div class="calgrid">${cells}</div><div class="callegend">${v120Categories.map(([label,,dot])=>`<span><i class="dot ${dot}"></i>${label}</span>`).join('')}<span><i class="dot google"></i>Google</span></div></div>`;
}
function v120DayPanel(){
 const date=state.calSelected,entries=v120Entries(date),pretty=new Date(date+'T12:00:00').toLocaleDateString('hr-HR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
 return `<div class="card day-panel"><div class="cardhead"><h3 style="text-transform:capitalize">${pretty}</h3><div class="minirow"><button class="primary" data-cal-add="${date}">＋ Dodaj</button></div></div>${entries.length?entries.map(({label,o})=>`<div class="day-entry ${o.done||o.status==='Gotovo'?'done':''}"><div class="info"><div class="name">${esc(o.name)}</div><div class="meta">${esc(label)} · ${esc(o.who||o.priority||'')} ${o.status?' · '+esc(o.status):''}</div></div>${label.startsWith('Google · ')?`<button class="smallbtn" data-gc-edit="${esc(o.calendarId)}" data-gc-event="${esc(o.id)}">Uredi</button>`:`<button class="smallbtn" data-edit="${label}:${o.id}">Uredi</button>`}</div>`).join(''):'<p class="tiny">Nema obveza za odabrani datum.</p>'}</div>`;
}
other=function(){if(state.page!=='Kalendar')return v120OldOther();return `<div class="cal-v120"><div class="cal-filterbar">${v120Categories.map(([label])=>`<label><input type="checkbox" data-cal-filter="${label}" ${state.calFilters[label]?'checked':''}> ${label}</label>`).join('')}<label><input type="checkbox" data-google-filter ${state.calFilters['Google']!==false?'checked':''}> Google</label></div>${v120Calendar()}${v120DayPanel()}</div>`};
// Početna stranica koristi istu oznaku događaja, a postojeći izgled kartice ostaje.
calendar=function(){return state.page==='Početna'?v120Calendar():v120OldCalendar()};
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.calDate){e.stopImmediatePropagation();state.calSelected=b.dataset.calDate;state.selectedDay=Number(b.dataset.calDate.slice(-2));if(state.page==='Početna')state.page='Kalendar';render();return}
 if(b.dataset.calMonth){e.stopImmediatePropagation();const d=new Date(state.year,state.month+Number(b.dataset.calMonth),1);state.year=d.getFullYear();state.month=d.getMonth();state.calSelected=localISO(d);render();return}
 if(b.hasAttribute('data-cal-today')){e.stopImmediatePropagation();const d=new Date();state.year=d.getFullYear();state.month=d.getMonth();state.calSelected=localISO(d);render();return}
 if(b.dataset.calAdd){e.stopImmediatePropagation();pendingDate=b.dataset.calAdd;dayAdd(b.dataset.calAdd);return}
},true);
document.addEventListener('change',e=>{if(e.target.dataset.calFilter){state.calFilters[e.target.dataset.calFilter]=e.target.checked;render()}},true);
