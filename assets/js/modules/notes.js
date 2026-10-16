
/* v1.22 — sve ostaje u jednoj HTML datoteci, postojeći podaci ostaju kompatibilni */
state.notesView=localStorage.getItem('life-notes-view')||'cards';
state.notesFolderFilter='';
let notesCurrentId=null,notesSaveTimer=null,notesEditorReady=false;
function notesPlain(html){const t=document.createElement('div');t.innerHTML=html||'';return t.textContent||''}
function notesSafeHtml(raw){
 const doc=new DOMParser().parseFromString('<div>'+String(raw||'')+'</div>','text/html');
 const allow=new Set(['DIV','P','BR','B','STRONG','I','EM','U','H2','H3','UL','OL','LI','A','BLOCKQUOTE']);
 function clean(node){for(const child of [...node.childNodes]){if(child.nodeType===8){child.remove();continue}if(child.nodeType!==1)continue;if(!allow.has(child.tagName)){const frag=doc.createDocumentFragment();while(child.firstChild)frag.appendChild(child.firstChild);child.replaceWith(frag);clean(node);continue}const safeUrl=child.tagName==='A'?child.getAttribute('data-safe-url'):null;for(const a of [...child.attributes])child.removeAttribute(a.name);if(safeUrl)child.setAttribute('href',safeUrl);clean(child)}}
 // Keep only safe links, without preserving arbitrary attributes.
 for(const a of doc.querySelectorAll('a')){const url=a.getAttribute('href')||'';if(/^https?:\/\//i.test(url))a.setAttribute('data-safe-url',url)}
 const root=doc.body.firstElementChild;clean(root);return root.innerHTML;
}
function notesPage(){
 const folders=[...new Set(state.notes.map(n=>n.folder||'Ostalo'))].sort((a,b)=>a.localeCompare(b,'hr'));
 const term=state.search.toLocaleLowerCase('hr-HR');
 const filtered=state.notes.filter(n=>(!state.notesFolderFilter||(n.folder||'Ostalo')===state.notesFolderFilter)&&[n.name,notesPlain(n.html||esc(n.body||'')),n.tags,n.folder].join(' ').toLocaleLowerCase('hr-HR').includes(term));
 const controls=`<div class="notes-toolbar"><input class="search" id="filter" placeholder="Pretraži bilješke, mape, oznake…" value="${esc(state.search)}"><select class="select" id="notesFolderFilter"><option value="">Sve mape</option>${folders.map(f=>`<option value="${esc(f)}" ${state.notesFolderFilter===f?'selected':''}>${esc(f)}</option>`).join('')}</select><button class="smallbtn" data-notes-view="cards" ${state.notesView==='cards'?'style="border-color:var(--blue)"':''}>Kartice</button><button class="smallbtn" data-notes-view="list" ${state.notesView==='list'?'style="border-color:var(--blue)"':''}>Popis</button><button class="primary" data-notes-new>＋ Nova bilješka</button></div>`;
 const item=n=>{const tags=String(n.tags||'').split(',').map(x=>x.trim()).filter(Boolean).map(x=>`<span class="notes-label">#${esc(x)}</span>`).join('');const preview=notesPlain(n.html||esc(n.body||''));return state.notesView==='cards'?`<div class="card notes-card" data-notes-open="${n.id}" role="button" tabindex="0"><h3>${esc(n.name)}</h3><div class="notes-preview">${esc(preview.slice(0,260))}</div><div class="notes-meta">📁 ${esc(n.folder||'Ostalo')} ${n.updatedAt?'· '+new Date(n.updatedAt).toLocaleDateString('hr-HR'):''}</div>${tags}</div>`:`<div class="item notes-row" data-notes-open="${n.id}" role="button" tabindex="0"><div class="info"><div class="name">${esc(n.name)}</div><div class="meta">${esc(n.folder||'Ostalo')} · ${esc(preview.slice(0,95))}</div></div><button class="smallbtn" data-notes-edit="${n.id}">Uredi</button></div>`};
 return controls+(state.notesView==='cards'?`<div class="notes-grid">${filtered.map(item).join('')}</div>`:`<div class="card">${filtered.map(item).join('')}</div>`)+(filtered.length?'':'<div class="card tiny">Nema bilješki koje odgovaraju pretrazi.</div>');
}
const notesOldCollection=collection;
collection=function(type){if(type==='Notes')return notesPage();return notesOldCollection(type)};
const notesOldForm=form;
form=function(type,id){if(type==='Notes'){notesOpen(id||0);return}return notesOldForm(type,id)};
function notesOpen(id){
 clearTimeout(notesSaveTimer);notesCurrentId=id||0;
 const n=state.notes.find(x=>String(x.id)===String(id))||{name:'',folder:'Ostalo',tags:'',body:'',html:''};
 const content=n.html||esc(n.body||'').replace(/\n/g,'<br>');
 modal(id?'Uredi bilješku':'Nova bilješka',`<label class="field">Naslov<input id="notesTitle" value="${esc(n.name)}" placeholder="Naziv bilješke"></label><div class="grid2"><label class="field">Mapa<input id="notesFolder" value="${esc(n.folder||'Ostalo')}" placeholder="npr. Kuća"></label><label class="field">Oznake (odvojene zarezom)<input id="notesTags" value="${esc(n.tags||'')}" placeholder="npr. ideje, važno"></label></div><div class="tiny">Uređivanje teksta</div><div class="notes-editor-toolbar"><button class="smallbtn" type="button" data-notes-format="bold" title="Podebljano"><b>B</b></button><button class="smallbtn" type="button" data-notes-format="italic" title="Kurziv"><i>I</i></button><button class="smallbtn" type="button" data-notes-format="underline" title="Podcrtano"><u>U</u></button><button class="smallbtn" type="button" data-notes-format="h2">Naslov</button><button class="smallbtn" type="button" data-notes-format="insertUnorderedList">• Popis</button><button class="smallbtn" type="button" data-notes-format="insertOrderedList">1. Popis</button><button class="smallbtn" type="button" data-notes-format="link">🔗 Poveznica</button></div><div class="notes-editor" id="notesEditor" contenteditable="true" role="textbox" aria-multiline="true">${notesSafeHtml(content)}</div><p class="notes-save-status" id="notesSaveStatus">Promjene se automatski spremaju nakon početka uređivanja.</p>`,`<button class="smallbtn" data-notes-close>Zatvori</button>${id?`<button class="smallbtn" data-notes-duplicate="${id}">Dupliciraj</button><button class="smallbtn" data-notes-delete="${id}">U koš</button>`:''}<button class="primary" data-notes-save>Spremi</button>`);
 notesEditorReady=true;
}
function notesSave(quiet=false){
 if(!notesEditorReady||!$('#notesTitle'))return false;
 const name=$('#notesTitle').value.trim();const editor=$('#notesEditor');if(!name){if(!quiet)toast('Upiši naslov bilješke.');return false}
 const html=notesSafeHtml(editor.innerHTML),folder=$('#notesFolder').value.trim()||'Ostalo',tags=$('#notesTags').value.trim();
 let n=state.notes.find(x=>String(x.id)===String(notesCurrentId));
 if(!n){n={id:Date.now()+Math.floor(Math.random()*10000)};state.notes.unshift(n);notesCurrentId=n.id}
 Object.assign(n,{name,folder,tags,html,body:notesPlain(html),updatedAt:new Date().toISOString()});persist();
 if($('#notesSaveStatus'))$('#notesSaveStatus').textContent='Spremljeno · '+new Date().toLocaleTimeString('hr-HR');
 if(!quiet){notesEditorReady=false;close();render();toast('Bilješka spremljena.')}
 return true;
}
function notesSchedule(){clearTimeout(notesSaveTimer);if($('#notesSaveStatus'))$('#notesSaveStatus').textContent='Spremanje…';notesSaveTimer=setTimeout(()=>notesSave(true),650)}
function notesClose(){clearTimeout(notesSaveTimer);if(notesEditorReady){if($('#notesTitle')?.value.trim())notesSave(true);else if($('#notesEditor')?.textContent.trim())return toast('Upiši naslov ili izbriši sadržaj prije zatvaranja.')}notesEditorReady=false;close();render()}
// Capture handling isolates Notes from the older generic actions.
document.addEventListener('click',e=>{
 const open=e.target.closest('[data-notes-open]');if(open){e.stopImmediatePropagation();notesOpen(open.dataset.notesOpen);return}
 const b=e.target.closest('button');if(!b)return;
 if(b.hasAttribute('data-notes-new')){e.stopImmediatePropagation();notesOpen(0);return}
 if(b.dataset.notesView){e.stopImmediatePropagation();state.notesView=b.dataset.notesView;localStorage.setItem('life-notes-view',state.notesView);render();return}
 if(b.dataset.notesEdit){e.stopImmediatePropagation();notesOpen(b.dataset.notesEdit);return}
 if(b.hasAttribute('data-notes-save')){e.stopImmediatePropagation();clearTimeout(notesSaveTimer);notesSave(false);return}
 if(b.hasAttribute('data-notes-close')){e.stopImmediatePropagation();notesClose();return}
 if(b.dataset.notesDuplicate){e.stopImmediatePropagation();if(!notesSave(true))return;const src=state.notes.find(x=>String(x.id)===String(notesCurrentId));const copy={...src,id:Date.now()+Math.floor(Math.random()*10000),name:src.name+' (kopija)',updatedAt:new Date().toISOString()};state.notes.unshift(copy);persist();notesEditorReady=false;close();render();toast('Bilješka duplicirana.');return}
 if(b.dataset.notesDelete){e.stopImmediatePropagation();const n=state.notes.find(x=>String(x.id)===String(notesCurrentId));if(n){state.notes=state.notes.filter(x=>x!==n);state.trash.unshift({type:'Notes',item:n,at:new Date().toLocaleString('hr-HR')});persist()}notesEditorReady=false;close();render();toast('Bilješka premještena u koš.');return}
 if(b.dataset.notesFormat){e.preventDefault();e.stopImmediatePropagation();const ed=$('#notesEditor');if(!ed)return;ed.focus();const fmt=b.dataset.notesFormat;if(fmt==='link'){const url=prompt('Unesi URL poveznice (https://):');if(url&&/^https?:\/\//i.test(url))document.execCommand('createLink',false,url)}else if(fmt==='h2')document.execCommand('formatBlock',false,'h2');else document.execCommand(fmt,false,null);notesSchedule();return}
 if(notesEditorReady&&b.hasAttribute('data-close')){e.stopImmediatePropagation();notesClose()}
},true);
document.addEventListener('input',e=>{if(notesEditorReady&&['notesTitle','notesFolder','notesTags','notesEditor'].includes(e.target.id))notesSchedule()},true);
document.addEventListener('change',e=>{if(e.target.id==='notesFolderFilter'){state.notesFolderFilter=e.target.value;render()}},true);
document.addEventListener('keydown',e=>{const item=e.target.closest('[data-notes-open]');if(item&&(e.key==='Enter'||e.key===' ')){e.preventDefault();notesOpen(item.dataset.notesOpen)}},true);
