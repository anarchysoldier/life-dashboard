
/* v1.31.3: jedinstvena oznaka zakašnjenja za Tasks, bez izmjena Chores ili rasporeda kartica */
(function(){
 const previousItem=itemHTML;
 itemHTML=function(o,type){
   const html=previousItem(o,type);
   if(type!=='Tasks')return html;
   const today=localISO(new Date());
   const due=dateForCalendar(o.due);
   const late=!o.done&&o.status!=='Gotovo'&&o.status!=='Pauzirano'&&o.paused!==true&&(o.status==='Zakašnjelo'||(due&&due<today));
   if(!late||html.includes('>Zakašnjelo</span>'))return html;
   const marker='<span class="tag warn">Zakašnjelo</span>';
   const edit=html.match(/<button\b[^>]*data-edit="Tasks:[^"]+"[^>]*>/);
   if(edit)return html.replace(edit[0],marker+edit[0]);
   return html.replace(/<\/div>\s*$/,marker+'</div>');
 };
 const previousCollection=collection;
 collection=function(type){
   const html=previousCollection(type);
   if(type!=='Tasks')return html;
   return html.replace(/<input\b(?=[^>]*\bid="filter")(?=[^>]*\bclass="search")[^>]*>/,function(input){
     return '<span class="v1313-searchwrap">'+input+'<button type="button" class="v1313-clear" data-v1313-clear aria-label="Obriši pretragu" title="Obriši pretragu" '+(state.search?'':'hidden')+'>×</button></span>';
   });
 };
 document.addEventListener('click',function(e){
   const clear=e.target.closest('[data-v1313-clear]');if(!clear)return;
   e.preventDefault();e.stopImmediatePropagation();
   state.search='';render();
   document.querySelector('#filter')?.focus();
 },true);
 document.addEventListener('input',function(e){
   if(e.target.id!=='filter'||state.page!=='Tasks')return;
   const btn=e.target.closest('.v1313-searchwrap')?.querySelector('[data-v1313-clear]');
   if(btn)btn.hidden=!e.target.value;
 },true);
})();
