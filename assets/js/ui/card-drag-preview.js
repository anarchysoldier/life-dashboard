
(function(){
 let moving=null,originalOrder=null,frame=0;
 const grid=()=>document.getElementById('dashgrid');
 const cards=g=>[...g.querySelectorAll(':scope > .dashcard[data-card]')];
 const clear=()=>{if(frame)cancelAnimationFrame(frame);frame=0;document.querySelectorAll('#dashgrid .drag-preview-active').forEach(el=>el.classList.remove('drag-preview-active'));moving=null;originalOrder=null;};
 const measure=()=>{if(frame)return;frame=requestAnimationFrame(()=>{frame=0;if(moving&&grid())compactDashboard()})};
 document.addEventListener('dragstart',e=>{
  const card=e.target.closest('#dashgrid > .dashcard[data-card]');
  if(!card||e.target.closest('button,a,input,select,textarea'))return;
  const g=grid();if(!g)return;
  moving=card;originalOrder=cards(g).map(el=>el.dataset.card);
  card.classList.add('drag-preview-active');
 },false);
 document.addEventListener('dragover',e=>{
  if(!moving)return;
  const g=grid();if(!g||!g.contains(e.target))return;
  e.preventDefault();
  // Prikaži lijevo/desno sidrenje odmah tijekom povlačenja.
  const bounds=g.getBoundingClientRect();
  const rel=(e.clientX-bounds.left)/Math.max(1,bounds.width);
  const width=Math.max(1,Math.min(4,Number(state.cardPrefs[moving.dataset.card]?.width||2)));
  const nextSide=width>=4?'auto':rel<.45?'left':rel>.55?'right':(moving.dataset.side||'auto');
  if(moving.dataset.side!==nextSide){
    moving.dataset.side=nextSide;
    moving.style.setProperty('--card-side',nextSide==='left'?'1':nextSide==='right'?String(5-width):'auto');
    measure();
  }
  const target=e.target.closest('#dashgrid > .dashcard[data-card]');
  if(!target||target===moving)return;
  const rect=target.getBoundingClientRect();
  const before=e.clientY<rect.top+rect.height/2;
  const reference=before?target:target.nextElementSibling;
  if(reference===moving||(!reference&&moving===g.lastElementChild))return;
  g.insertBefore(moving,reference);
  measure();
 },true);
 document.addEventListener('drop',e=>{
  if(!moving)return;
  const g=grid();if(!g)return;
  e.preventDefault();e.stopImmediatePropagation();
  if(g.contains(e.target)){
   const order=cards(g).map(el=>el.dataset.card);
   state.cardOrder=[...order,...state.cardOrder.filter(k=>!order.includes(k))];
   const key=moving.dataset.card;
   state.cardPrefs[key]={...(state.cardPrefs[key]||{}),side:moving.dataset.side||'auto'};
   persist();
   clear();
   render();
   toast('Raspored kartica spremljen.');
  }else{
   const old=originalOrder||[];
   old.forEach(k=>{const el=cards(g).find(x=>x.dataset.card===k);if(el)g.appendChild(el)});
   clear();compactDashboard();
  }
 },true);
 document.addEventListener('dragend',()=>{
  if(!moving)return;
  const g=grid(),old=originalOrder||[];
  if(g){old.forEach(k=>{const el=cards(g).find(x=>x.dataset.card===k);if(el)g.appendChild(el)});}
  clear();if(g)compactDashboard();
 },true);
})();
