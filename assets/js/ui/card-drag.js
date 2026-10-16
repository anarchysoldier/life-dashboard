
(function(){
 let a=null;
 const grid=()=>document.getElementById('dashgrid');
 const cards=g=>Array.from(g.querySelectorAll(':scope > .dashcard[data-card]'));
 function layout(){compactDashboard()}
 function move(x,y){
  if(!a)return;
  a.x=x;a.y=y;
  a.ghost.style.left=x+'px';a.ghost.style.top=y+'px';
  const g=grid();if(!g)return;
  const others=cards(g).filter(c=>c!==a.el);
  if(!others.length)return;
  // Find the nearest card using its screen rectangle. Avoid moving to a distant
  // top card while the pointer is below the visible cards.
  let nearest=null,best=Infinity;
  for(const c of others){const r=c.getBoundingClientRect();
   const dx=Math.max(r.left-x,0,x-r.right),dy=Math.max(r.top-y,0,y-r.bottom);
   const d=dx*dx+dy*dy;
   if(d<best){best=d;nearest=c}
  }
  if(nearest){
   const r=nearest.getBoundingClientRect();
   const before=y<r.top+r.height/2;
   const ref=before?nearest:nearest.nextElementSibling;
   if(ref!==a.el && (ref || a.el!==g.lastElementChild)){
    const oldY=window.scrollY;
    g.insertBefore(a.el,ref);
    layout();
    // Preserve viewport when the browser scroll-anchors to the moved source.
    if(Math.abs(window.scrollY-oldY)>1)window.scrollTo(0,oldY);
   }
  }
  const b=g.getBoundingClientRect();
  if(x>=b.left&&x<=b.right){
   const w=Math.max(1,Math.min(4,Number(state.cardPrefs[a.key]?.width||2)));
   const ratio=(x-b.left)/Math.max(1,b.width);
   const side=w>=4?'auto':ratio<.40?'left':ratio>.60?'right':a.el.dataset.side||'auto';
   if(side!==a.el.dataset.side){a.el.dataset.side=side;a.el.style.setProperty('--card-side',side==='left'?'1':side==='right'?String(5-w):'auto');layout()}
  }
 }
 function tick(){
  if(!a)return;
  const edge=95,h=innerHeight;
  const speed=a.y>h-edge?Math.min(26,4+(a.y-(h-edge))*.36):a.y<edge?-Math.min(26,4+(edge-a.y)*.36):0;
  if(speed){const old=window.scrollY;window.scrollBy(0,speed);if(window.scrollY!==old)move(a.x,a.y)}
  a.raf=requestAnimationFrame(tick);
 }
 function stop(commit){
  if(!a)return;
  // Spremi položaj prije promjene DOM-a: uklanjanje ghosta i ponovno
  // mjerenje masonry redova ne smiju pomaknuti korisnika na vrh.
  const keepX=window.scrollX,keepY=window.scrollY;
  const old=a,g=grid();a=null;
  cancelAnimationFrame(old.raf);
  old.ghost.remove();old.el.classList.remove('drag-source');
  document.documentElement.classList.remove('ld-dragging');document.body.classList.remove('ld-dragging');
  if(g){
   if(commit){
    const order=cards(g).map(c=>c.dataset.card);
    state.cardOrder=[...order,...state.cardOrder.filter(k=>!order.includes(k))];
    state.cardPrefs[old.key]={...(state.cardPrefs[old.key]||{}),side:old.el.dataset.side||'auto'};
    persist();
   }else{
    for(const key of old.order){const el=cards(g).find(c=>c.dataset.card===key);if(el)g.appendChild(el)}
    old.el.dataset.side=old.side;
   }
   layout();
  }
  // Scroll anchoring preglednika može se aktivirati nakon ponovnog izračuna.
  // Vraćamo samo poziciju pri puštanju, bez blokiranja ručnog skrolanja.
  window.scrollTo({left:keepX,top:keepY,behavior:'instant'});
  requestAnimationFrame(()=>window.scrollTo({left:keepX,top:keepY,behavior:'instant'}));
  if(commit)toast('Raspored kartica spremljen.');
 }
 document.addEventListener('dragstart',e=>{if(e.target.closest('#dashgrid .dashcard')){e.preventDefault();e.stopImmediatePropagation()}},true);
 document.addEventListener('pointerdown',e=>{
  if(e.button!==0||a)return;
  const handle=e.target.closest('#dashgrid .dashcard .draghandle');if(!handle)return;
  const el=handle.closest('#dashgrid > .dashcard[data-card]'),g=grid();if(!el||!g)return;
  e.preventDefault();e.stopImmediatePropagation();
  const rect=el.getBoundingClientRect();
  const ghost=el.cloneNode(true);ghost.removeAttribute('id');ghost.classList.add('ld-drag-ghost');ghost.classList.remove('drag-source');
  ghost.style.width=Math.min(rect.width,innerWidth-24)+'px';ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';
  document.body.appendChild(ghost);
  a={el,key:el.dataset.card,order:cards(g).map(c=>c.dataset.card),side:el.dataset.side||'auto',ghost,x:e.clientX,y:e.clientY,pointerId:e.pointerId,raf:0};
  el.classList.add('drag-source');document.documentElement.classList.add('ld-dragging');document.body.classList.add('ld-dragging');
  // Global capture listeners keep tracking even when the grid scrolls away.
  a.raf=requestAnimationFrame(tick);
 },true);
 window.addEventListener('pointermove',e=>{if(a&&e.pointerId===a.pointerId){e.preventDefault();move(e.clientX,e.clientY)}},true);
 window.addEventListener('pointerup',e=>{if(a&&e.pointerId===a.pointerId){e.preventDefault();stop(true)}},true);
 window.addEventListener('pointercancel',e=>{if(a&&e.pointerId===a.pointerId)stop(false)},true);
 window.addEventListener('blur',()=>stop(false));
})();
