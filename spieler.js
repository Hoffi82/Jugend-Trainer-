const SUPABASE_URL='https://jvgqvtnqncelbhuordzy.supabase.co';
const SUPABASE_KEY='sb_publishable_4PusmhJVMm0b3Bm-2Y-FPQ__tnZZzZO';
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const allowed=new Set(['Hoffi','Kai','Marcel']);
const teamForm=document.getElementById('teamForm');
const playerForm=document.getElementById('playerForm');
const teamSelect=document.getElementById('teamSelect');
const teamsEl=document.getElementById('teams');
const teamMessage=document.getElementById('teamMessage');
const playerMessage=document.getElementById('playerMessage');
let teams=[];

function msg(el,text,ok=false){el.textContent=text;el.className='status '+(ok?'ok':'error');}
async function guard(){
  const {data,error}=await db.auth.getSession();
  if(error||!data.session){location.replace('login.html');return null;}
  const name=data.session.user.user_metadata?.display_name;
  if(!allowed.has(name)){await db.auth.signOut();location.replace('login.html');return null;}
  return data.session;
}
async function load(){
  const {data,error}=await db.from('jugend_teams').select('id,name,season,jugend_players(id,display_name,position,active)').order('name');
  if(error){msg(teamMessage,'Fehler beim Laden der Mannschaften.');return;}
  teams=data||[];
  teamSelect.innerHTML='<option value="">Mannschaft auswählen</option>'+teams.map(t=>`<option value="${t.id}">${escapeHtml(t.name)}${t.season?' · '+escapeHtml(t.season):''}</option>`).join('');
  teamsEl.innerHTML=teams.length?teams.map(t=>`<article class="team-card"><div class="team-card-head"><div><h3>${escapeHtml(t.name)}</h3><span>${escapeHtml(t.season||'Saison nicht angegeben')}</span></div><strong>${(t.jugend_players||[]).filter(p=>p.active).length} Spieler</strong></div><div class="player-list">${(t.jugend_players||[]).filter(p=>p.active).map(p=>`<div class="player-row"><span>${escapeHtml(p.display_name)}</span><small>${escapeHtml(p.position||'Keine Position')}</small></div>`).join('')||'<div class="empty small">Noch keine Spieler.</div>'}</div></article>`).join(''):'<div class="empty">Noch keine Mannschaft angelegt.</div>';
}
function escapeHtml(value){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
teamForm.addEventListener('submit',async e=>{e.preventDefault();const session=await guard();if(!session)return;const name=document.getElementById('teamName').value.trim();const season=document.getElementById('season').value.trim();if(!name)return;const {error}=await db.from('jugend_teams').insert({name,season:season||null});if(error){msg(teamMessage,'Mannschaft konnte nicht angelegt werden.');return;}teamForm.reset();msg(teamMessage,'Mannschaft erfolgreich angelegt.',true);load();});
playerForm.addEventListener('submit',async e=>{e.preventDefault();const session=await guard();if(!session)return;const team_id=Number(teamSelect.value);const display_name=document.getElementById('playerName').value.trim();const position=document.getElementById('position').value||null;if(!team_id||!display_name)return;const {error}=await db.from('jugend_players').insert({team_id,display_name,position});if(error){msg(playerMessage,'Spieler konnte nicht hinzugefügt werden.');return;}document.getElementById('playerName').value='';document.getElementById('position').value='';msg(playerMessage,'Spieler erfolgreich hinzugefügt.',true);load();});
(async()=>{if(await guard())await load();})();
