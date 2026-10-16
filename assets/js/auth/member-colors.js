/* v1.48 — Boje članova u kalendaru i listi zadataka. */
(function(){
'use strict';

// Vraća boju za ime člana (iz cache-a window.lifeHouseholdMembers).
window.lifeColorForMember=function(name){
  if(!name)return '#638dd9';
  const members=window.lifeGetMembers?window.lifeGetMembers():[];
  const found=members.find(m=>String(m.name).toLowerCase()===String(name).toLowerCase());
  if(found)return found.color||'#638dd9';
  // Fallback za stare hardkodirane vrijednosti.
  const fallback={'emanuel':'#638dd9','lucia':'#d97ba6','oboje':'#a17bd2','svi':'#8190a2'};
  return fallback[String(name).toLowerCase()]||'#638dd9';
};

// Vraća HTML s točkom obojenom prema članu.
window.lifeColoredDot=function(memberName,title){
  const color=window.lifeColorForMember(memberName);
  return `<i class="dot" style="background:${color}" title="${String(title||memberName||'').replace(/"/g,'&quot;')}"></i>`;
};

console.info('[member-colors] Modul učitan.');
})();