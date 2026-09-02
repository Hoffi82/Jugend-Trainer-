const db=window.supabase.createClient('https://jvgqvtnqncelbhuordzy.supabase.co','sb_publishable_4PusmhJVMm0b3Bm-2Y-FPQ__tnZZzZO');
const allowed=new Set(['Hoffi','Kai','Marcel']);
const teamSelect=document.getElementById('teamSelect'),form=document.getElementById('runForm'),list=document.getElementById('runList'),summary=document.getElementById('summary'),status=document.getElementById('status'),playerSelect=document.getElementById('playerSelect');
const esc=v=>String(v??'').replace(/[&<>\'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;",'"':'&quot;'}[c]));
function localDateString(){const now=new Date(),y=now.getFullYear(),m=String(now.getMonth()+1).padStart(2,'0'),d=String(now.getDate()).padStart(2,'0');return `${y}-${m}-${d}`}
function msg(t,c=''){status.textContent=t;status.className=`status ${c}`.trim()}
function durationText(minutes){const m=Number(minutes);const h=Math.floor(m/60),rest=m%60;return h?`${h} Std. ${String(rest).padStart(2,'0')} Min.`:`${m} Min.`}
async function loadPlayers(teamId){
  if(!teamId){playerSelect.innerHTML='<option value="">Erst Mannschaft auswählen…</option>';playerSelect.disabled=true;return}
  const p=await db.from('jugend_players').select('id,display_name').eq('team_id',Number(teamId)).eq('active',true).order('display_name');
  if(p.error)throw p.error;
  playerSelect.innerHTML='<option value="">Spieler auswählen…</option>'+(p.data||[]).map(x=>`<option value="${x.id}">${esc(x.display_name)}</option>`).join('');
  playerSelect.disabled=!(p.data||[]).length;
  if(!p.data?.length)playerSelect.innerHTML='<option value="">Keine aktiven Spieler vorhanden</option>';
}
async function load(){
  const t=await db.from('jugend_teams').select('id,name,season').order('name');
  if(t.error)throw t.error;
  teamSelect.innerHTML='<option value="">Mannschaft auswählen…</option>'+(t.data||[]).map(x=>`<option value="${x.id}">${esc(x.name)}${x.season?' · '+esc(x.season):''}</option>`).join('');
  await loadPlayers(teamSelect.value);
  const r=await db.from('jugend_preparation_runs').select('id,team_id,player_id,run_date,distance_km,duration_minutes,note,jugend_teams(name),jugend_players(display_name)').order('run_date',{ascending:false}).order('id',{ascending:false});
  if(r.error)throw r.error;
  const rows=r.data||[];
  const km=rows.reduce((s,x)=>s+Number(x.distance_km||0),0),minutes=rows.reduce((s,x)=>s+Number(x.duration_minutes||0),0);
  summary.textContent=rows.length?`${rows.length} Läufe · ${km.toFixed(2).replace('.',',')} km · ${durationText(minutes)} Gesamtzeit`:'Noch keine Läufe.';
  list.innerHTML=rows.length?rows.map(x=>`<div class="list-item"><strong>🏃 ${esc(x.jugend_teams?.name||'Mannschaft')} · ${esc(x.jugend_players?.display_name||'Spieler')}</strong><div>${new Date(x.run_date+'T00:00:00').toLocaleDateString('de-DE')} · ${Number(x.distance_km).toFixed(2).replace('.',',')} km · ${durationText(x.duration_minutes)}</div>${x.note?`<small>${esc(x.note)}</small>`:''}</div>`).join(''):'<div class="empty">Noch keine Läufe erfasst.</div>';
}
teamSelect.addEventListener('change',async()=>{try{await loadPlayers(teamSelect.value)}catch(e){msg('❌ '+e.message,'error')}});
form.addEventListener('submit',async e=>{e.preventDefault();const row={team_id:Number(teamSelect.value),player_id:Number(playerSelect.value),run_date:document.getElementById('runDate').value,distance_km:Number(document.getElementById('distance').value.replace(',','.')),duration_minutes:Number(document.getElementById('duration').value),note:document.getElementById('note').value.trim()||null};if(!row.team_id){msg('Bitte Mannschaft auswählen.','error');return}if(!row.player_id){msg('Bitte Spieler auswählen.','error');return}if(!row.run_date){msg('Bitte Datum eintragen.','error');return}if(!Number.isFinite(row.distance_km)||row.distance_km<=0||row.distance_km>999.99){msg('Bitte gültige Kilometer eintragen.','error');return}if(!Number.isInteger(row.duration_minutes)||row.duration_minutes<1||row.duration_minutes>999){msg('Bitte eine gültige Dauer in Minuten eintragen.','error');return}const {error}=await db.from('jugend_preparation_runs').insert(row);if(error){msg('❌ '+error.message,'error');return}form.reset();playerSelect.innerHTML='<option value="">Erst Mannschaft auswählen…</option>';playerSelect.disabled=true;document.getElementById('runDate').value=localDateString();msg('✓ Lauf gespeichert.','ok');await load()});
(async()=>{const {data}=await db.auth.getSession();if(!data.session||!allowed.has(data.session.user.user_metadata?.display_name)){location.replace('login.html');return}document.getElementById('runDate').value=localDateString();playerSelect.disabled=true;try{await load()}catch(e){msg('❌ '+e.message,'error')}})();