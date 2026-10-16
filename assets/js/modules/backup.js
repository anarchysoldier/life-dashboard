/* v1.32: ručni izvoz i povrat lokalnih podataka. Ne dira raspored kartica.
   v1.33: whitelist ključeva; vraćanje više ne briše nove ključeve. */
(function(){
 const BACKUP_VERSION=1;
 const BACKUP_KEYS=[
   'life-dashboard-v1-demo',
   'life-dashboard-supabase-config-v1',
   'life-dashboard-v127-notifications',
   'life-dashboard-google-calendar-settings-v1',
   'life-notes-view'
 ];
 const backupKeys=()=>BACKUP_KEYS.filter(k=>localStorage.getItem(k)!==null);
 const previousSettings=settings;
 settings=function(){
  const html=previousSettings();
  const panel='<div class="card"><h3>Sigurnosna kopija podataka</h3><div class="notice">Ručno spremi lokalne podatke Life Dashboarda u JSON datoteku ili vrati prethodnu kopiju.</div><div class="v132-backup-actions"><button type="button" class="smallbtn" data-v132-export>↓ Preuzmi sigurnosnu kopiju</button><button type="button" class="smallbtn" data-v132-import>↑ Vrati iz sigurnosne kopije</button></div><p class="v132-backup-note">Vraćanje zamjenjuje trenutačne lokalne podatke. Prije vraćanja preporučujemo preuzeti novu kopiju. Datoteka ostaje na tvom računalu; ništa se ne šalje na internet.</p><input id="v132-import-file" type="file" accept=".json,application/json" style="display:none"></div>';
  return html.replace('<div class="settings-panel" data-settings-panel="napredno" hidden>','<div class="settings-panel" data-settings-panel="napredno" hidden>'+panel);
 };
 function downloadBackup(){
  const values={};backupKeys().forEach(k=>values[k]=localStorage.getItem(k));
  const payload={app:'Life Dashboard',format:'life-dashboard-local-backup',version:BACKUP_VERSION,createdAt:new Date().toISOString(),data:values};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='Life_Dashboard_backup_'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
  toast('Sigurnosna kopija pripremljena za preuzimanje.');
 }
 document.addEventListener('click',e=>{
  const exp=e.target.closest('[data-v132-export]');
  if(exp){e.preventDefault();e.stopImmediatePropagation();try{downloadBackup()}catch(err){alert('Izvoz nije uspio: '+err.message)}return}
  const imp=e.target.closest('[data-v132-import]');
  if(imp){e.preventDefault();e.stopImmediatePropagation();document.getElementById('v132-import-file')?.click()}
 },true);
 document.addEventListener('change',async e=>{
  if(e.target.id!=='v132-import-file')return;
  const input=e.target,file=input.files?.[0];input.value='';if(!file)return;
  if(file.size>15*1024*1024){alert('Datoteka je prevelika (maksimalno 15 MB).');return}
  let obj;
  try{obj=JSON.parse(await file.text())}catch{alert('Datoteka nije valjan JSON.');return}
  if(!obj||obj.format!=='life-dashboard-local-backup'||obj.version!==BACKUP_VERSION||!obj.data||typeof obj.data!=='object'||Array.isArray(obj.data)||typeof obj.data['life-dashboard-v1-demo']!=='string'){
   alert('Ovo nije podržana sigurnosna kopija Life Dashboarda.');return;
  }
  const entries=Object.entries(obj.data);
  if(entries.some(([k,v])=>typeof k!=='string'||!BACKUP_KEYS.includes(k)||typeof v!=='string')){
   alert('Sigurnosna kopija sadrži neispravne ili nepoznate ključeve.');return;
  }
  try{const main=JSON.parse(obj.data['life-dashboard-v1-demo']);if(!main||typeof main!=='object'||Array.isArray(main))throw Error('Neispravni podaci')}catch{alert('Sadržaj sigurnosne kopije nije valjan.');return}
  if(!confirm('Vratiti podatke iz sigurnosne kopije od '+(obj.createdAt?new Date(obj.createdAt).toLocaleString('hr-HR'):'nepoznatog datuma')+'?\n\nTrenutačni podaci bit će zamijenjeni onima iz kopije. Ključevi koji nisu u kopiji ostaju netaknuti.'))return;
  const old={};backupKeys().forEach(k=>old[k]=localStorage.getItem(k));
  try{
   // Prepisujemo samo ključeve iz kopije; nove ključeve (npr. iz budućih verzija) ne brišemo.
   entries.forEach(([k,v])=>localStorage.setItem(k,v));
   location.reload();
  }catch(err){
   try{Object.entries(old).forEach(([k,v])=>{if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)})}catch{}
   alert('Vraćanje nije uspjelo. Prethodni podaci pokušani su vratiti. '+err.message);
  }
 },true);
})();