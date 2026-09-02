const db=window.supabase.createClient('https://jvgqvtnqncelbhuordzy.supabase.co','sb_publishable_4PusmhJVMm0b3Bm-2Y-FPQ__tnZZzZO');
const allowed=new Set(['Hoffi','Kai','Marcel']);
const teamSelect=document.getElementById('teamSelect'),form=document.getElementById('gameForm'),games=document.getElementById('games'),status=document.getElementById('status');
let allGames=[];
const esc=v=>String(v??'').replace(/[&<>\'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
function msg(t,c=''){status.textContent=t;status.className=`status ${c}`.trim()}
function localDateString(){const now=new Date(),y=now.getFullYear(),m=String(now.getMonth()+1).padStart(2,'0'),d=String(now.getDate()).padStart(2,'0');return `${y}-${m}-${d}`}
const eventLabel={tor:'⚽ Tor',gelb:'🟨 Gelbe Karte',gelb_rot:'🟨🟥 Gelb-Rot',rot:'🟥 Rote Karte',einwechslung:'↗ Einwechslung',auswechslung:'↙ Auswechslung'};
const allowedEventTypes=new Set(Object.keys(eventLabel));

async function load(){
  const t=await db.from('jugend_teams').select('id,name,season').order('name');
  if(t.error)throw t.error;
  teamSelect.innerHTML='<option value="">Mannschaft auswählen…</option>'+(t.data||[]).map(x=>`<option value="${x.id}">${esc(x.name)}${x.season?' · '+esc(x.season):''}</option>`).join('');
  const r=await db.from('jugend_games').select('id,team_id,opponent,game_date,game_time,location,goals_for,goals_against,jugend_teams(name)').order('game_date',{ascending:false});
  if(r.error)throw r.error;
  allGames=r.data||[];
  games.innerHTML=allGames.length?allGames.map(g=>`<div class="list-item"><strong>${esc(g.jugend_teams?.name||'Mannschaft')} – ${esc(g.opponent)}</strong><div>${new Date(g.game_date+'T00:00:00').toLocaleDateString('de-DE')}${g.game_time?' · '+esc(g.game_time.slice(0,5)):''}${g.location?' · '+esc(g.location):''}</div><div class="game-result">Ergebnis: ${g.goals_for==null?'noch offen':esc(g.goals_for)+' : '+esc(g.goals_against)}</div><div class="game-tools"><button type="button" class="secondary game-open" data-id="${g.id}">⚽ Kader & Ereignisse</button></div><div id="detail-${g.id}"></div></div>`).join(''):'<div class="empty">Noch keine Spiele angelegt.</div>';
  games.querySelectorAll('.game-open').forEach(b=>b.onclick=()=>openGame(Number(b.dataset.id)));
}

async function openGame(id){
  const host=document.getElementById('detail-'+id);if(!host)return;
  host.innerHTML='<div class="mini">Lade Kader…</div>';
  const g=allGames.find(x=>x.id===id);if(!g)return;
  const p=await db.from('jugend_players').select('id,display_name,position').eq('team_id',g.team_id).eq('active',true).order('display_name');
  if(p.error){host.innerHTML='<div class="status error">'+esc(p.error.message)+'</div>';return}
  const gp=await db.from('jugend_game_players').select('player_id,starter,minutes,goals,yellow_cards,red_cards,note').eq('game_id',id);
  if(gp.error){host.innerHTML='<div class="status error">'+esc(gp.error.message)+'</div>';return}
  const ev=await db.from('jugend_game_events').select('id,player_id,event_type,minute,note,jugend_players(display_name)').eq('game_id',id).order('minute',{ascending:true});
  if(ev.error){host.innerHTML='<div class="status error">'+esc(ev.error.message)+'</div>';return}
  const map=new Map((gp.data||[]).map(x=>[x.player_id,x]));
  host.innerHTML=`<div class="game-panel"><h3>Ergebnis</h3><div class="result-form"><label>ATSV<input id="gf-${id}" type="number" min="0" value="${g.goals_for??''}"></label><label>Gegner<input id="ga-${id}" type="number" min="0" value="${g.goals_against??''}"></label><button type="button" class="secondary" id="saveResult-${id}">Ergebnis speichern</button></div><div id="resultStatus-${id}" class="status"></div><h3>Kader & Einsatz</h3><div class="game-player mini"><span>Spieler</span><span>Startelf</span><span>Min.</span><span>Tore</span><span>Gelb</span><span>Rot</span></div>${(p.data||[]).map(x=>{const v=map.get(x.id)||{};return `<div class="game-player" data-player="${x.id}"><span class="name">${esc(x.display_name)} <small>(${esc(x.position||'')})</small></span><label><input type="checkbox" class="starter" ${v.starter?'checked':''}></label><label><input type="number" class="minutes" min="0" max="150" value="${v.minutes??0}"></label><label><input type="number" class="goals" min="0" value="${v.goals??0}"></label><label><input type="number" class="yellow" min="0" value="${v.yellow_cards??0}"></label><label><input type="number" class="red" min="0" value="${v.red_cards??0}"></label></div>`}).join('')}<button type="button" class="primary" id="saveSquad-${id}">Kader & Statistik speichern</button><div id="saveStatus-${id}" class="status"></div><h3 style="margin-top:22px">Spielereignis hinzufügen</h3><div class="event-form"><label>Spieler<select id="eventPlayer-${id}">${(p.data||[]).map(x=>`<option value="${x.id}">${esc(x.display_name)}</option>`).join('')}</select></label><label>Minute<input id="eventMinute-${id}" type="number" min="1" max="150"></label><label>Ereignis<select id="eventType-${id}"><option value="tor">⚽ Tor</option><option value="gelb">🟨 Gelbe Karte</option><option value="gelb_rot">🟨🟥 Gelb-Rot</option><option value="rot">🟥 Rote Karte</option><option value="einwechslung">↗ Einwechslung</option><option value="auswechslung">↙ Auswechslung</option></select></label><button type="button" class="secondary" id="addEvent-${id}">Ereignis speichern</button></div><div id="eventStatus-${id}" class="status"></div><div class="event-list"><strong>Ereignisse</strong>${(ev.data||[]).length?(ev.data||[]).map(e=>`<div class="event-row">${e.minute?esc(e.minute)+'. Minute · ':''}<strong>${esc(eventLabel[e.event_type]||e.event_type)}</strong>${e.jugend_players?.display_name?' · '+esc(e.jugend_players.display_name):''}${e.note?' · '+esc(e.note):''}</div>`).join(''):'<div class="mini" style="margin-top:8px">Noch keine Ereignisse erfasst.</div>'}</div></div>`;

  document.getElementById(`saveResult-${id}`).onclick=async()=>{
    const gfRaw=document.getElementById(`gf-${id}`).value,gaRaw=document.getElementById(`ga-${id}`).value;
    const gf=Number(gfRaw),ga=Number(gaRaw),resultStatus=document.getElementById(`resultStatus-${id}`);
    if(gfRaw===''||gaRaw===''||!Number.isInteger(gf)||!Number.isInteger(ga)||gf<0||ga<0){resultStatus.textContent='Bitte gültige Tore (0 oder höher) eintragen.';resultStatus.className='status error';return}
    const {error}=await db.from('jugend_games').update({goals_for:gf,goals_against:ga}).eq('id',id);
    if(error){resultStatus.textContent='❌ '+error.message;resultStatus.className='status error';return}
    resultStatus.textContent='✓ Ergebnis gespeichert.';resultStatus.className='status ok';
    g.goals_for=gf;g.goals_against=ga;
    const resultLine=host.closest('.list-item')?.querySelector('.game-result');if(resultLine)resultLine.textContent=`Ergebnis: ${g.goals_for} : ${g.goals_against}`;
  };

  document.getElementById(`saveSquad-${id}`).onclick=async()=>{
    const rows=[...host.querySelectorAll('.game-player[data-player]')];
    const saveStatus=document.getElementById(`saveStatus-${id}`);
    const data=[];
    for(const row of rows){
      const playerId=Number(row.dataset.player);
      const minutesRaw=row.querySelector('.minutes').value;
      const goalsRaw=row.querySelector('.goals').value;
      const yellowRaw=row.querySelector('.yellow').value;
      const redRaw=row.querySelector('.red').value;
      const minutes=Number(minutesRaw),goals=Number(goalsRaw),yellow=Number(yellowRaw),red=Number(redRaw);
      if(!Number.isInteger(playerId)||playerId<1||minutesRaw===''||!Number.isInteger(minutes)||minutes<0||minutes>150||goalsRaw===''||!Number.isInteger(goals)||goals<0||yellowRaw===''||!Number.isInteger(yellow)||yellow<0||redRaw===''||!Number.isInteger(red)||red<0){saveStatus.textContent='Bitte nur gültige Statistikwerte eintragen: Minuten 0–150, Tore/Karten 0 oder höher.';saveStatus.className='status error';return}
      data.push({game_id:id,player_id:playerId,starter:row.querySelector('.starter').checked,minutes,goals,yellow_cards:yellow,red_cards:red});
    }
    if(!data.length){saveStatus.textContent='Keine Spieler vorhanden.';saveStatus.className='status error';return}
    const {error}=await db.from('jugend_game_players').upsert(data,{onConflict:'game_id,player_id'});
    if(error){saveStatus.textContent='❌ '+error.message;saveStatus.className='status error';return}
    saveStatus.textContent='✓ Kader und Statistik gespeichert.';saveStatus.className='status ok';
  };

  document.getElementById(`addEvent-${id}`).onclick=async()=>{
    const minuteRaw=document.getElementById(`eventMinute-${id}`).value;
    const minute=Number(minuteRaw);
    const playerId=Number(document.getElementById(`eventPlayer-${id}`).value)||null;
    const eventType=document.getElementById(`eventType-${id}`).value;
    const s=document.getElementById(`eventStatus-${id}`);
    if(!Number.isInteger(minute)||minute<1||minute>150||!playerId){s.textContent='Bitte Spieler und gültige Minute (1–150) auswählen.';s.className='status error';return}
    if(!allowedEventTypes.has(eventType)){s.textContent='Bitte ein gültiges Ereignis auswählen.';s.className='status error';return}
    const {error}=await db.from('jugend_game_events').insert({game_id:id,player_id:playerId,minute,event_type:eventType});
    s.textContent=error?'❌ '+error.message:'✓ Ereignis gespeichert.';s.className=`status ${error?'error':'ok'}`.trim();
    if(!error)openGame(id);
  };
}

form.addEventListener('submit',async e=>{e.preventDefault();const row={team_id:Number(teamSelect.value),opponent:document.getElementById('opponent').value.trim(),game_date:document.getElementById('gameDate').value,game_time:document.getElementById('gameTime').value||null,location:document.getElementById('location').value.trim()||null};if(!row.team_id){msg('Bitte Mannschaft auswählen.','error');return}if(!row.opponent||!row.game_date){msg('Bitte Gegner und Datum eintragen.','error');return}const {error}=await db.from('jugend_games').insert(row);if(error){msg('❌ '+error.message,'error');return}form.reset();document.getElementById('gameDate').value=localDateString();msg('✓ Spiel gespeichert.','ok');await load()});

(async()=>{const {data}=await db.auth.getSession();if(!data.session||!allowed.has(data.session.user.user_metadata?.display_name)){location.replace('login.html');return}document.getElementById('gameDate').value=localDateString();try{await load()}catch(e){msg('❌ '+e.message,'error')}})();