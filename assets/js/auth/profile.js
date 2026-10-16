/* v1.46 — Profil modal: ime, boja, promjena lozinke, odjava + lista članova + invite. */
(function(){
'use strict';
const el=id=>document.getElementById(id);
function esc_(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

function profileModal(){
  const client=window.lifeSupabaseClient;
  if(!client)return;
  client.auth.getUser().then(({data})=>{
    const u=data?.user;
    if(!u)return;
    const meta=u.user_metadata||{};
    const name=meta.full_name||u.email?.split('@')[0]||'Korisnik';
    const email=u.email||'—';
    const color=meta.profile_color||'#638dd9';
    const role=(state.memberRoles&&state.memberRoles[name])||'Član';

    let wrap=el('lifeProfileModal');
    if(!wrap){
      wrap=document.createElement('div');
      wrap.id='lifeProfileModal';
      wrap.style.cssText='position:fixed;inset:0;z-index:999999;background:#111827a8;display:flex;align-items:center;justify-content:center;padding:20px;overflow:auto';
      document.body.appendChild(wrap);
    }
    wrap.innerHTML=`
      <div style="width:min(480px,100%);background:var(--panel,#fff);color:var(--text,#111);border-radius:18px;padding:25px;box-shadow:0 20px 80px #0004;max-height:90vh;overflow:auto">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
          <h2 style="margin:0;font-size:20px">👤 Moj profil</h2>
          <button type="button" data-profile-close style="border:0;background:transparent;color:var(--muted);font-size:22px;cursor:pointer;padding:4px 8px">×</button>
        </div>
        <div style="text-align:center;margin-bottom:20px">
          <div style="display:inline-grid;place-items:center;width:70px;height:70px;border-radius:50%;background:${esc_(color)};color:#fff;font-size:28px;font-weight:700;margin-bottom:10px">${esc_(name.slice(0,1).toUpperCase())}</div>
          <div style="font-size:16px;font-weight:650">${esc_(name)}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:3px">${esc_(email)}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:5px">${esc_(role)}</div>
        </div>
        <div style="border-top:1px solid var(--line);padding-top:16px;margin-bottom:8px">
          <label style="display:block;font-size:12px;font-weight:600;margin-bottom:6px">Ime i prezime</label>
          <input id="profileName" type="text" value="${esc_(name)}" maxlength="80" style="width:100%;padding:10px;border:1px solid var(--line);border-radius:9px;background:var(--bg);color:var(--text);font:inherit">
        </div>
        <div style="margin-bottom:16px">
          <label style="display:block;font-size:12px;font-weight:600;margin-bottom:6px">Boja profila</label>
          <div style="display:flex;gap:8px;align-items:center">
            <input id="profileColor" type="color" value="${esc_(color)}" style="width:50px;height:38px;border:1px solid var(--line);border-radius:9px;cursor:pointer">
            <span style="font-size:11px;color:var(--muted)">Koristi se u kalendaru i pri dodjeli zadataka</span>
          </div>
        </div>
        <button type="button" id="profileSaveBtn" style="width:100%;padding:12px;border:0;border-radius:10px;background:#5e83d8;color:#fff;font-weight:700;cursor:pointer;margin-bottom:12px">Spremi promjene</button>
        <p id="profileStatus" style="font-size:12px;min-height:16px;text-align:center;color:var(--muted);margin:0 0 18px"></p>
        <div style="border-top:1px solid var(--line);padding-top:14px;margin-bottom:14px">
          <button type="button" data-profile-password style="width:100%;padding:10px;border:1px solid var(--line);border-radius:9px;background:transparent;color:var(--text);font-weight:600;cursor:pointer">🔑 Promijeni lozinku</button>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button type="button" data-profile-close style="flex:1;padding:10px;border:1px solid var(--line);border-radius:9px;background:transparent;color:var(--text);cursor:pointer">Zatvori</button>
          <button type="button" data-profile-logout style="flex:1;padding:10px;border:1px solid #d96771;border-radius:9px;background:transparent;color:#d96771;font-weight:600;cursor:pointer">Odjava</button>
        </div>
      </div>`;

    const status=txt=>{const x=el('profileStatus');if(x)x.textContent=txt};
    wrap.querySelector('#profileSaveBtn').onclick=async()=>{
      const newName=el('profileName').value.trim();
      const newColor=el('profileColor').value;
      if(!newName||newName.length<2){status('Ime mora imati barem 2 znaka.');return}
      status('Spremanje…');
      try{
        const {error}=await client.auth.updateUser({data:{full_name:newName,profile_color:newColor}});
        if(error)throw error;
        window.lifeCurrentUserName=newName;
        status('Spremljeno.');
        setTimeout(()=>{wrap.remove();if(typeof render==='function')render();},600);
      }catch(e){status('Greška: '+(e?.message||String(e)))}
    };
  });
}

document.addEventListener('click',e=>{
  if(e.target.closest('#lifeAccountBtn')){
    e.preventDefault();e.stopImmediatePropagation();
    profileModal();
    return;
  }
  if(e.target.closest('[data-profile-close]')){
    e.preventDefault();e.stopImmediatePropagation();
    el('lifeProfileModal')?.remove();
    return;
  }
  if(e.target.closest('[data-profile-logout]')){
    e.preventDefault();e.stopImmediatePropagation();
    const client=window.lifeSupabaseClient;
    if(client)client.auth.signOut();
    el('lifeProfileModal')?.remove();
    return;
  }
  if(e.target.closest('[data-profile-password]')){
    e.preventDefault();e.stopImmediatePropagation();
    const client=window.lifeSupabaseClient;
    if(!client)return;
    client.auth.getUser().then(({data})=>{
      const u=data?.user;
      if(!u)return;
      if(confirm('Poslat ćemo ti link za promjenu lozinke na '+u.email+'. Nastaviti?')){
        client.auth.resetPasswordForEmail(u.email,{redirectTo:location.origin+location.pathname})
          .then(({error})=>{
            if(error)alert('Greška: '+error.message);
            else alert('Provjeri e-mail — poslan je link za promjenu lozinke.');
          });
      }
    });
    return;
  }
  if(e.target.closest('[data-action="invite"]')){
    e.preventDefault();e.stopImmediatePropagation();
    createInvite();
    return;
  }
  if(e.target.closest('[data-invite-close]')){
    e.preventDefault();e.stopImmediatePropagation();
    el('lifeInviteModal')?.remove();
    return;
  }
},true);

async function loadHouseholdMembers(){
  const box=document.getElementById('householdMembersList');
  if(!box)return;
  const client=window.lifeSupabaseClient;
  if(!client){box.innerHTML='<p class="tiny">Nisi prijavljen.</p>';return}
  box.innerHTML='<p class="tiny">Učitavanje…</p>';
  try{
    const {data:{session}}=await client.auth.getSession();
    if(!session)return;
    const {data:households,error:e1}=await client.rpc('get_my_households');
    if(e1||!households?.length){box.innerHTML='<p class="tiny">Nema podataka.</p>';return}
    const hid=households[0].id;
    const {data:members,error:e2}=await client.rpc('get_household_members',{p_household_id:hid});
    if(e2){box.innerHTML='<p class="tiny">Greška: '+e2.message+'</p>';return}
    if(!members?.length){box.innerHTML='<p class="tiny">Nema članova.</p>';return}
    const rows=members.map(m=>{
      const isMe=m.user_id===window.lifeDashboardSignedInUserId;
      const color=m.profile_color||'#638dd9';
      const roleLabel={owner:'Vlasnik',admin:'Administrator',member:'Član'}[m.role]||m.role;
      const joined=new Date(m.joined_at).toLocaleDateString('hr-HR');
      const initial=(m.full_name||'?').slice(0,1).toUpperCase();
      return `<div class="setting" style="gap:12px"><span style="display:flex;align-items:center;gap:10px;min-width:0"><span style="display:inline-grid;place-items:center;width:32px;height:32px;border-radius:50%;background:${color};color:#fff;font-weight:700;font-size:13px;flex:none">${initial}</span><span style="min-width:0"><b>${esc_(m.full_name)}</b>${isMe?' <span class="pill" style="font-size:9px">Ti</span>':''}<span class="tiny" style="display:block;margin-top:2px">${esc_(roleLabel)} · od ${joined}</span></span></span></div>`;
    }).join('');
    box.innerHTML=rows;
  }catch(e){box.innerHTML='<p class="tiny">Greška: '+(e?.message||e)+'</p>'}
}

async function createInvite(){
  const client=window.lifeSupabaseClient;
  if(!client)return;
  try{
    const {data:households,error:e1}=await client.rpc('get_my_households');
    if(e1||!households?.length){alert('Nema kućanstva.');return}
    const hid=households[0].id;
    const {data:code,error:e2}=await client.rpc('create_household_invite',{p_household_id:hid});
    if(e2){alert('Greška: '+e2.message);return}
    const link=location.origin+location.pathname+'?invite='+code;
    let wrap=el('lifeInviteModal');
    if(!wrap){
      wrap=document.createElement('div');
      wrap.id='lifeInviteModal';
      wrap.style.cssText='position:fixed;inset:0;z-index:999999;background:#111827a8;display:flex;align-items:center;justify-content:center;padding:20px;overflow:auto';
      document.body.appendChild(wrap);
    }
    wrap.innerHTML=`
      <div style="width:min(500px,100%);background:var(--panel,#fff);color:var(--text,#111);border-radius:18px;padding:25px;box-shadow:0 20px 80px #0004">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <h2 style="margin:0;font-size:20px">✉️ Pozivnica</h2>
          <button type="button" data-invite-close style="border:0;background:transparent;color:var(--muted);font-size:22px;cursor:pointer;padding:4px 8px">×</button>
        </div>
        <p style="font-size:13px;line-height:1.6;color:var(--muted);margin:0 0 14px">Pošalji ovaj link osobi koju želiš pozvati. Kod vrijedi 7 dana i može se iskoristiti samo jednom.</p>
        <label style="display:block;font-size:12px;font-weight:600;margin-bottom:6px">Kod pozivnice</label>
        <div style="display:flex;gap:6px;margin-bottom:14px">
          <input type="text" readonly value="${code}" style="flex:1;padding:11px;border:1px solid var(--line);border-radius:9px;background:var(--bg);color:var(--text);font:inherit;font-family:monospace;font-size:14px;font-weight:600;text-align:center;letter-spacing:2px">
        </div>
        <label style="display:block;font-size:12px;font-weight:600;margin-bottom:6px">Link za pozivnicu</label>
        <input id="inviteLink" type="text" readonly value="${link}" style="width:100%;padding:11px;border:1px solid var(--line);border-radius:9px;background:var(--bg);color:var(--text);font:inherit;font-size:12px;margin-bottom:14px">
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button type="button" id="inviteCopyLink" style="flex:1;padding:11px;border:0;border-radius:10px;background:#5e83d8;color:#fff;font-weight:700;cursor:pointer">📋 Kopiraj link</button>
          <button type="button" data-invite-close style="flex:1;padding:11px;border:1px solid var(--line);border-radius:10px;background:transparent;color:var(--text);cursor:pointer">Zatvori</button>
        </div>
        <p id="inviteStatus" style="font-size:12px;color:var(--muted);text-align:center;margin:10px 0 0;min-height:16px"></p>
      </div>`;
    const status=t=>{const x=el('inviteStatus');if(x)x.textContent=t};
    wrap.querySelector('#inviteCopyLink').onclick=async()=>{
      try{
        await navigator.clipboard.writeText(link);
        status('✅ Link kopiran u međuspremnik.');
      }catch{
        const inp=el('inviteLink');inp.select();document.execCommand('copy');status('✅ Link kopiran.');
      }
    };
  }catch(e){alert('Greška: '+(e?.message||e))}
}

window.lifeLoadHouseholdMembers=loadHouseholdMembers;
})();