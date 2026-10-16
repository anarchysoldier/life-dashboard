
/* v1.21 — kompatibilno sa spremljenim podacima v1.20 */
const v121OldModal=modal, v121OldSave=saveForm, v121OldForm=form, v121OldOccurrences=v120Occurrences;
let v121EditingType='';
function v121RepeatControls(o){
 const mode=o.repeatEndMode||'never';
 return `<div class="repeat-end-panel" id="repeatEndPanel"><label class="field">Završetak ponavljanja<select id="fRepeatEndMode"><option value="never" ${mode==='never'?'selected':''}>Nikada</option><option value="count" ${mode==='count'?'selected':''}>Nakon određenog broja termina</option><option value="date" ${mode==='date'?'selected':''}>Do datuma</option></select></label><label class="field" id="repeatCountWrap" ${mode!=='count'?'hidden':''}>Ukupan broj termina (uključuje prvi)<input id="fRepeatCount" type="number" min="1" max="10000" step="1" value="${Math.max(1,Number(o.repeatCount)||10)}"></label><label class="field" id="repeatUntilWrap" ${mode!=='date'?'hidden':''}>Zadnji dopušteni datum<input id="fRepeatUntil" type="date" value="${esc(o.repeatUntil||dateForCalendar(o.due)||localISO(new Date()))}"></label><div class="tiny">Ograničenje vrijedi za prikaz u kalendaru i stvaranje sljedećeg termina nakon dovršetka.</div></div>`;
}
function v121RefreshEnd(){
 const repeat=$('#fRepeat')?.value||'Ne ponavlja se',mode=$('#fRepeatEndMode')?.value||'never';
 const panel=$('#repeatEndPanel');if(panel)panel.hidden=repeat==='Ne ponavlja se';
 if($('#repeatCountWrap'))$('#repeatCountWrap').hidden=mode!=='count';
 if($('#repeatUntilWrap'))$('#repeatUntilWrap').hidden=mode!=='date';
}
modal=function(title,body,buttons){
 if(['Tasks','Chores','Događaji','Reminders'].includes(v121EditingType)&&body.includes('id="fRepeat"')&&!body.includes('id="repeatEndPanel"')){
   const arr=state[v121EditingType==='Događaji'?'events':v121EditingType.toLowerCase()]||[];
   const o=arr.find(x=>String(x.id)===String(v121EditingId))||{};
   body+=v121RepeatControls(o);
 }
 v121OldModal(title,body,buttons);v121RefreshEnd();
};
let v121EditingId=0;
form=function(type,id){
 v121EditingType=type;v121EditingId=id;
 if(type==='Događaji'||type==='Reminders'){
   state.menu=false;
   const arr=type==='Događaji'?state.events:state.reminders,o=arr.find(x=>String(x.id)===String(id))||{};
   const repeat=o.repeat||'Ne ponavlja se';
   const opts=['Ne ponavlja se','Svaki dan','Svaki tjedan','Svaki mjesec','Svake godine'].map(x=>`<option ${x===repeat?'selected':''}>${x}</option>`).join('');
   modal((id?'Uredi':'Dodaj')+' · '+type,`<label class="field">Naziv<input id="fName" value="${esc(o.name||'')}" maxlength="180" placeholder="Naziv"></label><label class="field">Opis<textarea id="fDescription" rows="3">${esc(o.description||'')}</textarea></label><div class="grid2"><label class="field">Datum<input type="date" id="fDue" value="${esc(dateForCalendar(o.due)||pendingDate||localISO(new Date()))}"></label><label class="field">Vrijeme<input type="time" id="fTime" value="${esc(o.time||'')}" ></label></div><label class="field">Ponavljanje<select id="fRepeat">${opts}</select></label>`, `<button class="smallbtn" data-close>Odustani</button>${id?`<button class="smallbtn" data-delete="${type}:${id}">Premjesti u koš</button>`:''}<button class="primary" data-save="${type}:${id||0}">Spremi</button>`);
 } else v121OldForm(type,id);
 v121EditingType='';v121EditingId=0;
};
function v121ReadRepeat(o){
 const mode=$('#fRepeatEndMode')?.value||'never';
 if(mode==='count'){const n=Number($('#fRepeatCount')?.value);if(!Number.isInteger(n)||n<1||n>10000){toast('Broj termina mora biti od 1 do 10000.');return false}o.repeatCount=n}
 if(mode==='date'){const until=$('#fRepeatUntil')?.value,first=$('#fDue')?.value;if(!until||until<first){toast('Završni datum ne smije biti prije prvog termina.');return false}o.repeatUntil=until}
 o.repeatEndMode=mode;
 return true;
}
saveForm=function(type,id){
 if(!['Tasks','Chores','Događaji','Reminders'].includes(type))return v121OldSave(type,id);
 const name=$('#fName')?.value.trim();if(!name)return toast('Upiši naziv.');
 const tmp={};if(!v121ReadRepeat(tmp))return;
 if(type==='Događaji'||type==='Reminders'){
   const arr=type==='Događaji'?state.events:state.reminders;
   let o=id?arr.find(x=>String(x.id)===String(id)):null;
   if(id&&!o)return toast('Stavka nije pronađena.');
   if(!o){o={id:Date.now()+Math.floor(Math.random()*10000),done:false};arr.unshift(o)}
   Object.assign(o,tmp,{name,description:$('#fDescription')?.value.trim()||'',due:$('#fDue').value,time:$('#fTime').value,repeat:$('#fRepeat').value});
   persist();close();render();notify((id?'Ažurirano: ':'Dodano: ')+name);return;
 }
 // Originalna validacija i spremanje ostaju u Tasks/Chores modulima.
 v121OldSave(type,id);
 const arr=type==='Tasks'?state.tasks:state.chores;
 const target=id?arr.find(x=>String(x.id)===String(id)):arr.find(x=>x.name===name);
 if(target){Object.assign(target,tmp);persist();render()}
};
function v121RepeatDates(o,from,to){
 const first=dateForCalendar(o.due||o.date||o.start);if(!first)return [];
 const mode=o.repeatEndMode||'never',count=mode==='count'?Math.max(1,Number(o.repeatCount)||1):Infinity,until=mode==='date'?(o.repeatUntil||first):'9999-12-31';
 const repeat=o.repeat||'Ne ponavlja se',result=[];
 const d=new Date(first+'T12:00:00'),end=new Date(to+'T12:00:00');
 const anchorDay=d.getDate(),anchorMonth=d.getMonth();
 const selected=o.repeatDays||o.days||[];
 for(let i=0;i<10000&&i<count&&d<=end;i++){
   const iso=localISO(d);if(iso>until)break;if(iso>=from)result.push(iso);
   if(repeat==='Svaki dan')d.setDate(d.getDate()+1);
   else if(repeat==='Svaki tjedan')d.setDate(d.getDate()+7);
   else if(repeat==='Svaki mjesec'){d.setDate(1);d.setMonth(d.getMonth()+1);d.setDate(Math.min(anchorDay,new Date(d.getFullYear(),d.getMonth()+1,0).getDate()))}
   else if(repeat==='Svake godine'){d.setFullYear(d.getFullYear()+1,anchorMonth,1);d.setDate(Math.min(anchorDay,new Date(d.getFullYear(),anchorMonth+1,0).getDate()))}
   else if(repeat==='Odabrani dani'||repeat==='Odabranim danima'){
     d.setDate(d.getDate()+1);
     if(Array.isArray(selected)&&selected.length){let guard=0;while(guard++<7&&!selected.includes(d.getDay())&&!selected.includes(String(d.getDay()))&&!selected.includes(['Ned','Pon','Uto','Sri','Čet','Pet','Sub'][d.getDay()]))d.setDate(d.getDate()+1)}
   }else break;
 }
 return result;
}
v120Occurrences=function(o,kind,from,to){return v121RepeatDates(o,from,to)};
// Sprječava stvaranje sljedećeg zadatka ili posla nakon posljednjeg dopuštenog termina.
const v121OldToggle=toggle;
toggle=function(type,id){
 if(type!=='Tasks'&&type!=='Chores')return v121OldToggle(type,id);
 const arr=type==='Tasks'?state.tasks:state.chores,o=arr.find(x=>String(x.id)===String(id));
 if(!o)return v121OldToggle(type,id);
 const before=new Set(arr.map(x=>String(x.id)));
 v121OldToggle(type,id);
 const generated=arr.filter(x=>!before.has(String(x.id))&&String(x.recurringFrom)===String(o.id));
 for(const next of generated){
   const original=dateForCalendar(o.due)||localISO(new Date());
   const allowed=v121RepeatDates(o,original,next.due);
   const nextAllowed=allowed.includes(next.due);
   // Za niz već generiranih termina prati redni broj i ograničenje.
   const sequence=(Number(o.repeatSequence)||1)+1;
   if(!nextAllowed||(o.repeatEndMode==='count'&&sequence>Number(o.repeatCount||1))){arr.splice(arr.indexOf(next),1)}
   else {next.repeatSequence=sequence;next.repeatEndMode=o.repeatEndMode;next.repeatCount=o.repeatCount;next.repeatUntil=o.repeatUntil}
 }
 persist();render();
};
document.addEventListener('change',e=>{if(e.target.id==='fRepeat'||e.target.id==='fRepeatEndMode')v121RefreshEnd()});
