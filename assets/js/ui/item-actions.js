
/* v1.26.1: zvjezdica prije izbornika, brisanje pretrage i potvrda Enterom */
(function(){
 function arrange(){
  document.querySelectorAll('#content .v126-star').forEach(star=>{
   if(star.classList.contains('v127-placed'))return;
   const row=star.closest('.item,.tile,.notes-card,.notes-row');if(!row)return;
   const edit=row.querySelector('[data-edit], [data-notes-menu], [data-menu], .relative > button, button[aria-label*="Uredi"], button[title*="Uredi"]');
   if(edit&&edit!==star){edit.parentElement.insertBefore(star,edit)}
   else {const actions=row.querySelector('.actions,.minirow');if(actions)actions.insertBefore(star,actions.firstChild);}
   star.classList.add('v127-placed');
  });
 }
 // Postojeći prikaz zvjezdice dodaje u sljedećem animation frameu.
 const obs=new MutationObserver(()=>{requestAnimationFrame(arrange)});
 const content=document.getElementById('content');if(content)obs.observe(content,{childList:true,subtree:true});
 requestAnimationFrame(arrange);
 function updateSearch(){
  const input=document.getElementById('v125Input');if(!input)return;
  const top=input.closest('.v125-top');if(!top)return;
  let clear=top.querySelector('#v127ClearSearch');
  if(!clear){clear=document.createElement('button');clear.id='v127ClearSearch';clear.type='button';clear.textContent='×';clear.title='Obriši pretragu';clear.setAttribute('aria-label','Obriši tekst pretrage');input.insertAdjacentElement('afterend',clear)}
  clear.hidden=!input.value;
 }
 const observer=new MutationObserver(updateSearch);observer.observe(document.body,{childList:true,subtree:true});
 document.addEventListener('input',e=>{if(e.target.id==='v125Input')updateSearch()},true);
 document.addEventListener('click',e=>{if(!e.target.closest('#v127ClearSearch'))return;e.preventDefault();e.stopImmediatePropagation();const input=document.getElementById('v125Input');if(!input)return;input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus()},true);
 document.addEventListener('keydown',e=>{
  if(e.key!=='Enter'||e.isComposing||e.ctrlKey||e.altKey||e.metaKey||e.shiftKey||e.repeat)return;
  const target=e.target;
  if(target.matches('textarea,[contenteditable="true"]')||target.closest('[contenteditable="true"]'))return;
  const search=document.getElementById('v125Shade');
  if(search&&search.contains(target)){
   if(target.id==='v125Input'){const first=search.querySelector('[data-v125-open]');if(first){e.preventDefault();first.click()}}return;
  }
  const dialog=target.closest('#overlay .modal');if(!dialog)return;
  if(target.matches('button,[role="button"]'))return; // standardni Enter na gumbu
  const action=Array.from(dialog.querySelectorAll('.actions button')).find(b=>b.classList.contains('primary')&&!b.disabled)||Array.from(dialog.querySelectorAll('.actions button')).find(b=>!b.disabled&&!b.hasAttribute('data-close'));
  if(action){e.preventDefault();action.click()}
 },true);
})();
