/* v1.47 — Cache članova kućanstva za dodjelu zadataka. */
(function(){
'use strict';

window.lifeHouseholdMembers=[];
window.lifeMembersReady=false;

async function refreshMembers(){
  const client=window.lifeSupabaseClient;
  if(!client){window.lifeMembersReady=false;return}
  try{
    const {data:households,error:e1}=await client.rpc('get_my_households');
    if(e1||!households?.length){window.lifeMembersReady=true;window.lifeHouseholdMembers=[];return}
    const hid=households[0].id;
    const {data:members,error:e2}=await client.rpc('get_household_members',{p_household_id:hid});
    if(e2){console.warn('[members]',e2.message);window.lifeMembersReady=true;return}
    window.lifeHouseholdMembers=(members||[]).map(m=>({
      id:m.user_id,
      name:m.full_name||'Korisnik',
      email:m.email||'',
      color:m.profile_color||'#638dd9',
      role:m.role||'member'
    }));
    window.lifeMembersReady=true;
    console.info('[members] učitano',window.lifeHouseholdMembers.length,'članova');
  }catch(e){console.warn('[members]',e);window.lifeMembersReady=true}
}

window.lifeGetMembers=function(){
  return window.lifeHouseholdMembers||[];
};

window.lifeMembersOptions=function(selected){
  const members=window.lifeGetMembers();
  const sel=String(selected||'').toLowerCase();
  const isOpen=!sel||sel==='svi'||sel==='bilo tko'||sel==='oboje';
  let html='';
  html+='<option value="Svi"'+(isOpen?' selected':'')+'>Svi</option>';
  members.forEach(m=>{
    const name=String(m.name||'');
    const isSel=name.toLowerCase()===sel;
    html+=`<option value="${name.replace(/"/g,'&quot;')}"${isSel?' selected':''}>${name.replace(/</g,'&lt;')}</option>`;
  });
  if(selected && !isOpen && !members.some(m=>String(m.name).toLowerCase()===sel)){
    const v=String(selected);
    html+=`<option value="${v.replace(/"/g,'&quot;')}" selected>${v.replace(/</g,'&lt;')}</option>`;
  }
  return html;
};

window.lifeDashboardMembersChanged=refreshMembers;
if(window.lifeDashboardSignedInUserId)refreshMembers();
setInterval(()=>{if(!document.hidden&&window.lifeDashboardSignedInUserId)refreshMembers()},60000);

console.info('[members] Modul učitan.');
})();