/* v1.41 — Sinkronizacija podataka između članova kućanstva preko Supabasea.
   Aktivira se nakon prijave. Ne dira postojeće funkcije — samo dodaje sync sloj.
   v1.41 — resetira activity-log snapshot nakon pull-a (bez lažnog "Uređeno"). */
(function(){
'use strict';

let client = null;
let activeHouseholdId = null;
let lastPushedJson = '';
let lastPulledJson = '';
let pushInFlight = false;
let initialized = false;

// Stanje koje se sinkronizira između uređaja.
// 'activity' je namjerno izostavljen — dnevnik aktivnosti je per-uređaj.
const SYNCED_KEYS = [
  'theme','house','tasks','chores','shopping','notes','reminders','events',
  'custom','notifications','quick','lang','weatherLocation','cardPrefs',
  'defaultCardColor','cardOrder','layoutPreset','trash','shopSort',
  'shopGroup','dailyEnabled','dailyTime','quietFrom','quietTo','mobileHome',
  'memberRoles','invites','activeFilter','shoppingHistory'
];

function toast_(msg){
  try { if (typeof toast === 'function') toast(msg); } catch(e){}
}

function pickSyncedPayload(){
  const out = {};
  for (const k of SYNCED_KEYS){
    if (state[k] !== undefined) out[k] = state[k];
  }
  return out;
}

async function getHouseholdId(){
  try {
    const { data, error } = await client.rpc('get_my_households');
    if (error) { console.warn('[cloud-sync] get_my_households greška:', error.message); return null; }
    if (!Array.isArray(data) || !data.length) {
      console.warn('[cloud-sync] korisnik nema kućanstvo');
      return null;
    }
    return data[0].id;
  } catch(e) {
    console.warn('[cloud-sync] getHouseholdId:', e);
    return null;
  }
}

async function pushToSupabase(){
  if (!client || !activeHouseholdId || pushInFlight) return;
  const payload = pickSyncedPayload();
  const json = JSON.stringify(payload);
  if (json === lastPushedJson) return;
  pushInFlight = true;
  try {
    const { error } = await client
      .from('household_data')
      .update({ payload, updated_at: new Date().toISOString() })
      .eq('household_id', activeHouseholdId);
    if (error) throw error;
    lastPushedJson = json;
  } catch(e) {
    console.warn('[cloud-sync] push nije uspio:', e?.message || e);
  } finally {
    pushInFlight = false;
  }
}

async function pullFromSupabase(){
  if (!client || !activeHouseholdId) return;
  try {
    const { data, error } = await client
      .from('household_data')
      .select('payload, updated_at')
      .eq('household_id', activeHouseholdId)
      .maybeSingle();
    if (error) throw error;

    const remote = data?.payload;
    const remoteEmpty = !remote || typeof remote !== 'object' || Object.keys(remote).length === 0;

    if (remoteEmpty) {
      // Prvi put — prebaci lokalne podatke na server.
      console.info('[cloud-sync] Server je prazan, šaljem lokalne podatke.');
      lastPushedJson = '';
      await pushToSupabase();
      return;
    }

    const remoteJson = JSON.stringify(remote);
    if (remoteJson === lastPulledJson) return;

    // Zameni samo sinkronizirane ključeve, ne diraj UI stanje.
    for (const k of SYNCED_KEYS){
      if (remote[k] !== undefined) state[k] = remote[k];
    }
    lastPulledJson = remoteJson;
    lastPushedJson = JSON.stringify(pickSyncedPayload());

    // KLJUČNO: resetiraj activity-log snapshot bez logiranja.
    // Bez ovoga svaki pull izgleda kao masovna promjena (jsonb ne čuva redoslijed ključeva).
    try { window.lifeActivityResetSnapshot?.(); } catch(e){}

    console.info('[cloud-sync] Podaci povučeni iz Supabasea.');
    try { if (typeof render === 'function') render(); } catch(e){}
  } catch(e) {
    console.warn('[cloud-sync] pull nije uspio:', e?.message || e);
  }
}

async function handleInviteFromUrl(){
  const params = new URLSearchParams(location.search);
  const code = params.get('invite');
  if (!code) return;
  try {
    const { data, error } = await client.rpc('join_household_by_code', { p_code: code });
    if (error) {
      console.warn('[cloud-sync] pozivnica:', error.message);
      toast_('Pozivnica nije valjana: ' + error.message);
    } else {
      console.info('[cloud-sync] pridružen kućanstvu:', data);
      toast_('Pridružen si kućanstvu.');
      // Očisti kod iz URL-a.
      const url = new URL(location.href);
      url.searchParams.delete('invite');
      history.replaceState(null, '', url.pathname + url.search + url.hash);
    }
  } catch(e) {
    console.warn('[cloud-sync] greška pri pridruživanju:', e);
  }
}

async function startSync(){
  if (initialized) return;
  initialized = true;

  client = window.lifeSupabaseClient;
  if (!client) { console.warn('[cloud-sync] Supabase klijent nije dostupan.'); return; }

  // Ako je invite u URL-u, obradi ga prije svega ostalog.
  await handleInviteFromUrl();

  activeHouseholdId = await getHouseholdId();
  if (!activeHouseholdId) {
    console.warn('[cloud-sync] Nema aktivnog kućanstva, sync se ne pokreće.');
    return;
  }
  console.info('[cloud-sync] Aktivno kućanstvo:', activeHouseholdId);

  // Prvo povuci, pa onda kreni s periodičnim push-om.
  await pullFromSupabase();

  // Periodički push — svakih 2s provjeri ima li promjena.
  setInterval(() => {
    if (!activeHouseholdId) return;
    pushToSupabase();
  }, 2000);

  // Periodički pull — svakih 10s provjeri je li drugi član nešto promijenio.
  setInterval(() => {
    if (!activeHouseholdId) return;
    if (document.hidden) return;
    pullFromSupabase();
  }, 10000);

  // Sync kad se vrati fokus na tab.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && activeHouseholdId) pullFromSupabase();
  });
}

// Hook koji poziva supabase-auth.js nakon prijave.
window.lifeDashboardSyncReady = function(userId){
  if (userId) setTimeout(startSync, 100);
  else {
    initialized = false;
    activeHouseholdId = null;
    lastPushedJson = '';
    lastPulledJson = '';
  }
};

// Ako je korisnik već prijavljen u trenutku učitavanja (npr. refresh stranice).
if (window.lifeDashboardSignedInUserId){
  setTimeout(startSync, 200);
}

console.info('[cloud-sync] Modul učitan.');
})();