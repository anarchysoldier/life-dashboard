
/* v1.26: favoriti su polje favorite na postojećim zapisima; persist() ih sprema. */
(function(){
const TYPES={'Tasks':'tasks','Chores':'chores','Shopping':'shopping','Notes':'notes','Događaji':'events','Reminders':'reminders'};
function lookup(type,id){return (state[TYPES[type]]||[]).find(x=>String(x.id)===String(id))}
function star(type,id,active){return '<button class="v126-star'+(active?' active':'')+'" data-v126-star="'+esc(type)+':'+esc(id)+'" title="'+(active?'Ukloni iz favorita':'Dodaj u favorite')+'" aria-label="'+(active?'Ukloni iz favorita':'Dodaj u favorite')+'" aria-pressed="'+(active?'true':'false')+'">'+(active?'★':'☆')+'</button>'}
function favorites(){const groups=Object.entries(TYPES).flatMap(([type,key])=>(state[key]||[]).filter(x=>x.favorite).map(x=>({type,x})));return '<div class="card v126-favlist"><div class="cardhead"><h3>☆ Favoriti</h3><span class="tiny">'+groups.length+' spremljenih</span></div><p class="tiny">Označi zvjezdicom stavku u bilo kojem modulu kako bi se prikazala ovdje.</p>'+ (groups.map(({type,x})=>'<div class="v126-fav"><div class="info"><div class="name">'+esc(x.name||'Bez naziva')+'</div><div class="meta">'+esc(type)+(x.due?' · '+esc(x.due):'')+(x.folder?' · '+esc(x.folder):'')+'</div></div><div class="v126-fav-actions">'+star(type,x.id,true)+'<button class="smallbtn" data-v126-open="'+esc(type)+':'+esc(x.id)+'">Otvori</button></div></div>').join('')||'<p class="tiny">Još nema favorita.</p>')+'</div>'}
const oldOther=other;other=function(){if(state.page==='Favoriti')return favorites();return oldOther()};
const oldRender=render;render=function(){oldRender();requestAnimationFrame(addStars)};
function addStars(){
 if(state.page==='Favoriti')return;
 document.querySelectorAll('#content [data-edit]').forEach(btn=>{
  const [type,id]=String(btn.dataset.edit).split(':');if(!TYPES[type]||!lookup(type,id))return;
  const parent=btn.closest('.item,.tile');if(!parent||parent.querySelector('[data-v126-star]'))return;
  const holder=document.createElement('span');holder.innerHTML=star(type,id,!!lookup(type,id).favorite);parent.appendChild(holder.firstElementChild);
 });
 // Shopping i drugi redovi bez gumba za uređivanje.
 if(state.page==='Shopping')document.querySelectorAll('#content .item').forEach(row=>{
  if(row.querySelector('[data-v126-star]'))return;
  const toggle=row.querySelector('[data-toggle]');if(!toggle)return;
  const [type,id]=String(toggle.dataset.toggle).split(':');if(type!=='Shopping'||!lookup(type,id))return;
  row.insertAdjacentHTML('beforeend',star(type,id,!!lookup(type,id).favorite));
 });
}
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-v126-star],[data-v126-open]');if(!b)return;
 e.preventDefault();e.stopImmediatePropagation();
 const v=b.dataset.v126Star||b.dataset.v126Open;const idx=v.indexOf(':');const type=v.slice(0,idx),id=v.slice(idx+1),o=lookup(type,id);if(!o)return;
 if(b.dataset.v126Star!==undefined){
  o.favorite=!o.favorite;persist();
  if(state.page==='Favoriti'){
   const oldY=window.scrollY;render();requestAnimationFrame(()=>window.scrollTo({top:oldY,behavior:'instant'}));
  }else{
   document.querySelectorAll('[data-v126-star]').forEach(el=>{
    if(el.dataset.v126Star!==v)return;
    el.classList.toggle('active',!!o.favorite);
    el.textContent=o.favorite?'★':'☆';
    el.title=o.favorite?'Ukloni iz favorita':'Dodaj u favorite';
    el.setAttribute('aria-label',el.title);
    el.setAttribute('aria-pressed',String(!!o.favorite));
   });
  }
  toast(o.favorite?'Dodano u favorite.':'Uklonjeno iz favorita.');
 }
 else {nav(type);state.search=o.name||'';render();}
},true);
addStars();
})();
