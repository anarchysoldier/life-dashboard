
/* v1.19: Shopping uses the same localStorage key as previous versions. */
state.shoppingHistory=Array.isArray(saved.shoppingHistory)?saved.shoppingHistory:[];
// shoppingHistory is saved by the main persist function.
const shopOldForm=form,shopOldSave=saveForm,shopOldCollection=collection,shopOldItem=itemHTML,shopOldToggle=toggle;
const shopCategories=['Namirnice','Voće i povrće','Meso i riba','Pekara','Piće','Drogerija','Kuća','Odjeća','Ostalo'];
const shopGet=id=>state.shopping.find(x=>String(x.id)===String(id));
const shopText=v=>String(v??'').trim();
form=function(type,id){
 if(type!=='Shopping')return shopOldForm(type,id);
 state.menu=false;
 const o=id?shopGet(id):null;
 const v=o||{};
 const cats=[...new Set([...shopCategories,...state.shopping.map(x=>x.category).filter(Boolean)])];
 const stores=[...new Set(state.shopping.map(x=>x.store).filter(Boolean))];
 const categoryOptions=cats.map(c=>`<option value="${esc(c)}" ${v.category===c?'selected':''}>${esc(c)}</option>`).join('');
 modal((id?'Uredi':'Dodaj')+' · Shopping',`<label class="field">Naziv artikla<input id="fName" value="${esc(v.name||'')}" placeholder="npr. Mlijeko" autofocus></label><div class="grid2"><label class="field">Količina i jedinica<input id="fQty" value="${esc(v.qty||'')}" placeholder="npr. 2 L ili 3 kom"></label><label class="field">Trgovina<input id="fStore" list="shopStores" value="${esc(v.store||'')}" placeholder="npr. Lidl"><datalist id="shopStores">${stores.map(x=>`<option value="${esc(x)}">`).join('')}</datalist></label></div><label class="field">Kategorija<select id="fCategory">${categoryOptions}</select></label><label class="field">Napomena (neobavezno)<textarea id="fShopNote" rows="2" placeholder="npr. bez laktoze">${esc(v.note||'')}</textarea></label>`, `<button class="smallbtn" data-close>Odustani</button>${id?`<button class="smallbtn" data-delete="Shopping:${id}">Ukloni</button>`:''}<button class="primary" data-save="Shopping:${id||0}">Spremi</button>`);
};
saveForm=function(type,id){
 if(type!=='Shopping')return shopOldSave(type,id);
 const name=shopText($('#fName')?.value);if(!name)return toast('Upiši naziv artikla.');
 const o=id?shopGet(id):{id:Date.now()+Math.floor(Math.random()*10000),done:false};if(!o)return toast('Artikl nije pronađen.');
 o.name=name;o.qty=shopText($('#fQty')?.value);o.store=shopText($('#fStore')?.value);o.category=$('#fCategory')?.value||'Ostalo';o.note=shopText($('#fShopNote')?.value);
 if(!id)state.shopping.push(o);
 persist();close();render();notify((id?'Ažuriran artikl: ':'Dodan artikl: ')+name);
};
function shopToggle(id){
 const o=shopGet(id);if(!o)return;
 o.done=!o.done;
 if(o.done){o.boughtAt=new Date().toISOString();state.shoppingHistory.unshift({id:Date.now()+Math.floor(Math.random()*10000),itemId:o.id,name:o.name,qty:o.qty||'',store:o.store||'',category:o.category||'Ostalo',at:o.boughtAt})}
 else {o.boughtAt='';/* History is a record of purchases, not current checkbox state. */}
 persist();render();toast(o.done?'Artikl označen kupljenim.':'Artikl vraćen na popis.');
}
toggle=function(type,id){if(type==='Shopping')return shopToggle(id);return shopOldToggle(type,id)};
function shopRow(o){const done=!!o.done;return `<div class="shop-item ${done?'bought':''}"><input type="checkbox" data-toggle="Shopping:${esc(o.id)}" ${done?'checked':''} aria-label="Kupljeno: ${esc(o.name)}"><div class="shop-info"><div class="shop-name">${esc(o.name)}</div><div class="shop-meta">${esc(o.qty||'Bez količine')}${o.store?' · '+esc(o.store):''}${o.note?' · '+esc(o.note):''}</div></div><div class="shop-actions"><button class="smallbtn" data-edit="Shopping:${esc(o.id)}" title="Uredi">Uredi</button><button class="smallbtn" data-shop-remove="${esc(o.id)}" title="Ukloni s popisa">×</button></div></div>`}
function shopPage(){
 const term=state.search.toLocaleLowerCase('hr-HR');
 const rows=state.shopping.filter(o=>[o.name,o.qty,o.store,o.category,o.note].some(v=>String(v||'').toLocaleLowerCase('hr-HR').includes(term)));
 const groups={};rows.forEach(o=>{const k=state.shopGroup==='store'?(o.store||'Bez trgovine'):(o.category||'Ostalo');(groups[k]??=[]).push(o)});
 const total=state.shopping.length,bought=state.shopping.filter(x=>x.done).length;
 const groupButtons=`<button class="smallbtn" data-group="category" ${state.shopGroup==='category'?'style="border-color:var(--blue)"':''}>Kategorije</button><button class="smallbtn" data-group="store" ${state.shopGroup==='store'?'style="border-color:var(--blue)"':''}>Trgovine</button>`;
 let content=Object.entries(groups).sort(([a],[b])=>a.localeCompare(b,'hr')).map(([group,items])=>{
 const sorted=[...items];if(state.shopSort==='alpha')sorted.sort((a,b)=>a.name.localeCompare(b.name,'hr'));
 return `<div class="card shop-section"><h3>${esc(group)} <span class="shop-chip">${items.filter(x=>!x.done).length} za kupnju</span></h3>${sorted.map(shopRow).join('')}</div>`;
 }).join('')||'<div class="card shop-empty">Nema artikala za zadanu pretragu.</div>';
 return `<div class="shop-toolbar"><input class="search" id="filter" placeholder="Pretraži artikle, trgovine, kategorije…" value="${esc(state.search)}"><button class="primary" data-create="Shopping">＋ Dodaj artikl</button></div><div class="shop-toolbar">${groupButtons}<button class="smallbtn" data-shop-sort>${state.shopSort==='alpha'?'Redoslijed unosa':'Sortiraj A–Ž'}</button><button class="smallbtn" data-shop-history>↺ Povijest kupnje</button><button class="smallbtn" data-shop-clear-bought ${bought?'':'disabled'}>Ukloni kupljene (${bought})</button></div><div class="shop-summary">${total-bought} za kupnju · ${bought} kupljeno · ukupno ${total} artikala. Kupljeni ostaju prekriženi dok ih ne ukloniš.</div>${content}`;
}
collection=function(type){if(type==='Shopping')return shopPage();return shopOldCollection(type)};
function shopHistory(){
 const rows=state.shoppingHistory.slice(0,100).map(h=>`<div class="shop-history-row"><div><strong>${esc(h.name)}</strong><small>${esc(h.qty||'')} ${h.store?'· '+esc(h.store):''} · ${new Date(h.at).toLocaleString('hr-HR')}</small></div><button class="smallbtn" data-shop-readd="${esc(h.id)}" title="Ponovno dodaj na popis">＋ Dodaj</button></div>`).join('');
 modal('Povijest kupnje',`<p class="tiny">Posljednjih 100 označavanja artikala kao kupljenih. Povijest se čuva lokalno u ovom pregledniku.</p>${rows||'<p class="tiny">Još nema kupnji.</p>'}`);
}
/* Capture prevents the original generic handler from handling Shopping-specific actions twice. */
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.shopHistory!==undefined){e.stopImmediatePropagation();shopHistory();return}
 if(b.dataset.shopRemove!==undefined){e.stopImmediatePropagation();const o=shopGet(b.dataset.shopRemove);if(!o)return;state.shopping=state.shopping.filter(x=>x!==o);state.trash.unshift({type:'Shopping',item:o,at:new Date().toLocaleString('hr-HR')});persist();render();toast('Artikl premješten u koš.');return}
 if(b.dataset.shopClearBought!==undefined){e.stopImmediatePropagation();const done=state.shopping.filter(x=>x.done);if(!done.length)return;done.forEach(o=>state.trash.unshift({type:'Shopping',item:o,at:new Date().toLocaleString('hr-HR')}));state.shopping=state.shopping.filter(x=>!x.done);persist();render();toast('Kupljeni artikli premješteni u koš.');return}
 if(b.dataset.shopReadd!==undefined){e.stopImmediatePropagation();const h=state.shoppingHistory.find(x=>String(x.id)===b.dataset.shopReadd);if(!h)return;state.shopping.push({id:Date.now()+Math.floor(Math.random()*10000),name:h.name,qty:h.qty,store:h.store,category:h.category,done:false});persist();close();render();toast('Artikl ponovno dodan na popis.');return}
},true);
