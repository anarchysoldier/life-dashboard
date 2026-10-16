
/* v1.28 – dovršavanje ponavljanja bez mijenjanja postojeće navigacije */
(function(){
 const oldItem=itemHTML,oldToggle=toggle,oldForm=form,oldSave=saveForm;
 const today=()=>localISO(new Date());
 const active=o=>!o.done&&o.status!=='Gotovo';
 const paused=o=>o.status==='Pauzirano'||o.paused===true;
 const dateOnly=o=>dateForCalendar(o.due);
 const nextDate=o=>typeof choreNextDate==='function'?choreNextDate(dateOnly(o)||today(),o.repeat,o.repeatDays):null;
 const repeating=o=>o.repeat&&o.repeat!=='Ne ponavlja se';
 const seq=o=>Math.max(1,Number(o.repeatSequence)||1);
 const canNext=(o,next)=>!!next&&(!o.repeatEndMode||o.repeatEndMode==='never'||(o.repeatEndMode==='count'&&seq(o)<Number(o.repeatCount||1))||(o.repeatEndMode==='date'&&next<=o.repeatUntil));
 function overdueCount(o){
   if(!active(o)||paused(o)||!repeating(o)||!dateOnly(o)||dateOnly(o)>=today())return 0;
   let d=dateOnly(o),n=0;
   while(d&&d<today()&&n<10000){n++;const candidate=typeof choreNextDate==='function'?choreNextDate(d,o.repeat,o.repeatDays):null;if(!candidate||candidate<=d)break;d=candidate;if(o.repeatEndMode==='count'&&seq(o)+n>=Number(o.repeatCount||1))break;if(o.repeatEndMode==='date'&&d>o.repeatUntil)break}
   return n;
 }
 itemHTML=function(o,type){
   const html=oldItem(o,type);
   if(type!=='Tasks'&&type!=='Chores')return html;
   const count=overdueCount(o),isPaused=paused(o);
   if(!count&&!isPaused)return html;
   const note=isPaused?`<span class="v128-pause">⏸ Pauzirano${o.pauseUntil?' do '+esc(o.pauseUntil):' do nastavka'}</span>`:`<span class="v128-late">Zakasnilo · ${count} ${count===1?'propušten termin':'propuštenih termina'}</span>`;
   return html.replace('</div><button',note+'</div><button');
 };
 // Za zadatke omogućuje ručnu pauzu i nastavak, kao kod Chores.
 form=function(type,id){oldForm(type,id);if(type!=='Tasks')return;const o=state.tasks.find(x=>String(x.id)===String(id))||{};const actions=document.querySelector('#overlay .modal .actions');if(!actions)return;const block=document.createElement('div');block.className='grid2';block.innerHTML=`<label class="field">Ponavljanje zadatka<select id="v128Pause"><option value="active">Aktivno</option><option value="paused">Pauzirano</option></select></label><label class="field">Pauzirano do (prazno = ručno)<input type="date" id="v128PauseUntil" value="${esc(o.pauseUntil||'')}"></label>`;actions.before(block);block.querySelector('#v128Pause').value=paused(o)?'paused':'active';};
 saveForm=function(type,id){const isTask=type==='Tasks',p=isTask?document.getElementById('v128Pause')?.value:null,u=isTask?document.getElementById('v128PauseUntil')?.value:null;const name=isTask?document.getElementById('fName')?.value.trim():null;oldSave(type,id);if(isTask&&name&&p){const o=id?state.tasks.find(x=>String(x.id)===String(id)):state.tasks.find(x=>x.name===name);if(o){o.paused=p==='paused';o.pauseUntil=u||'';if(o.paused)o.status='Pauzirano';else if(o.status==='Pauzirano')o.status='U tijeku';persist();render()}}};
 // Pri dovršavanju zakašnjelog ponavljanja ne stvaraj svaki propušteni termin.
 // Umjesto toga napravi samo prvi budući termin, sa sažetkom propuštanja.
 toggle=function(type,id){
   if(type!=='Tasks'&&type!=='Chores')return oldToggle(type,id);
   const arr=type==='Tasks'?state.tasks:state.chores,o=arr.find(x=>String(x.id)===String(id));if(!o)return;
   if(paused(o)&&o.pauseUntil&&o.pauseUntil<=today()){o.paused=false;o.status='U tijeku'}
   if(paused(o)){toast('Ponavljanje je pauzirano. Nastavi ga kroz Uredi.');return}
   if(!active(o)||!repeating(o)){oldToggle(type,id);return}
   const missed=overdueCount(o),now=new Date(),at=now.toLocaleString('hr-HR');
   o.done=true;o.status='Gotovo';o.completedAt=at;o.completedBy='Trenutačni korisnik';
   o.history=Array.isArray(o.history)?o.history:[];
   o.history.push({at,by:o.completedBy,due:o.due,missed,completedISO:now.toISOString()});
   o.missedOccurrences=missed;
   let next=nextDate(o),skipped=0;
   // Propuštene datume objedini i sljedeći zadatak stavi na prvi budući termin.
   while(next&&next<today()&&skipped<10000&&canNext({...o,repeatSequence:seq(o)+skipped},next)){
     const after=typeof choreNextDate==='function'?choreNextDate(next,o.repeat,o.repeatDays):null;
     if(!after||after<=next)break;next=after;skipped++;
   }
   if(next&&canNext({...o,repeatSequence:seq(o)+skipped},next)&&!arr.some(x=>String(x.recurringFrom)===String(o.id)&&x.due===next)){
     const nextItem={...o,id:Date.now()+Math.floor(Math.random()*100000),due:next,done:false,status:'Novo',completedAt:'',completedBy:'',history:[],recurringFrom:o.id,repeatSequence:seq(o)+skipped+1,missedOccurrences:0};
     arr.unshift(nextItem);
   }
   persist();render();toast(missed?`Obavljeno; objedinjeno ${missed} propuštenih termina.`:'Obavljeno; sljedeći termin je ažuriran.');
 };
 // Istek datumske pauze primjenjuje se pri otvaranju i povratku u aplikaciju.
 function resumeExpired(){let changed=false;for(const arr of [state.tasks,state.chores])for(const o of arr){if(paused(o)&&o.pauseUntil&&o.pauseUntil<=today()){o.paused=false;o.status='U tijeku';changed=true}}if(changed){persist();render()}}
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)resumeExpired()});
 resumeExpired();
})();
