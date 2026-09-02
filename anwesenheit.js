const SUPABASE_URL = 'https://jvgqvtnqncelbhuordzy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_4PusmhJVMm0b3Bm-2Y-FPQ__tnZZzZO';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const allowedTrainers = new Set(['Hoffi', 'Kai', 'Marcel']);
const teamSelect = document.getElementById('teamSelect');
const dateInput = document.getElementById('trainingDate');
const loadButton = document.getElementById('loadButton');
const saveButton = document.getElementById('saveButton');
const attendancePanel = document.getElementById('attendancePanel');
const playerList = document.getElementById('playerList');
const statusBox = document.getElementById('status');
const summary = document.getElementById('summary');
let players = [];
let attendance = new Map();

function setStatus(text, type = '') {
  statusBox.textContent = text;
  statusBox.className = `status ${type}`.trim();
}
function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}
function localDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function updateSummary() {
  const values = [...attendance.values()];
  const counts = { anwesend: 0, entschuldigt: 0, unentschuldigt: 0 };
  values.forEach(v => counts[v]++);
  summary.textContent = `Anwesend: ${counts.anwesend} · Entschuldigt: ${counts.entschuldigt} · Unentschuldigt: ${counts.unentschuldigt}`;
}
function renderPlayers() {
  playerList.innerHTML = players.length ? players.map(player => `
    <div class="player-row" data-player="${player.id}" style="align-items:center;gap:12px;flex-wrap:wrap">
      <div style="min-width:180px"><strong>${esc(player.display_name)}</strong><br><small>${esc(player.position || 'Keine Position')}</small></div>
      <div style="display:flex;gap:7px;flex-wrap:wrap">
        ${[['anwesend','✓ Anwesend'],['entschuldigt','↗ Entschuldigt'],['unentschuldigt','✕ Unentschuldigt']].map(([value,label]) => `<button type="button" class="secondary attendance-choice" data-value="${value}" style="padding:9px 11px">${label}</button>`).join('')}
      </div>
    </div>`).join('') : '<div class="empty">Für diese Mannschaft sind noch keine aktiven Spieler angelegt.</div>';
  document.querySelectorAll('.player-row').forEach(row => {
    const id = Number(row.dataset.player);
    const current = attendance.get(id) || 'anwesend';
    attendance.set(id, current);
    row.querySelectorAll('.attendance-choice').forEach(button => {
      button.addEventListener('click', () => {
        attendance.set(id, button.dataset.value);
        row.querySelectorAll('.attendance-choice').forEach(b => b.style.borderColor = '');
        button.style.borderColor = '#e00020';
        updateSummary();
      });
      if (button.dataset.value === current) button.style.borderColor = '#e00020';
    });
  });
  updateSummary();
}

async function loadTeams() {
  const { data, error } = await db.from('jugend_teams').select('id,name,season').order('name');
  if (error) throw error;
  teamSelect.innerHTML = '<option value="">Mannschaft auswählen…</option>' + (data || []).map(t => `<option value="${t.id}">${esc(t.name)}${t.season ? ` · ${esc(t.season)}` : ''}</option>`).join('');
}

async function loadAttendance() {
  const teamId = Number(teamSelect.value);
  const date = dateInput.value;
  if (!teamId || !date) { setStatus('Bitte Mannschaft und Datum auswählen.', 'error'); return; }
  setStatus('Lade Spieler…');
  loadButton.disabled = true;
  try {
    const [{ data: playerData, error: playerError }, { data: attendanceData, error: attendanceError }] = await Promise.all([
      db.from('jugend_players').select('id,display_name,position').eq('team_id', teamId).eq('active', true).order('display_name'),
      db.from('jugend_attendance').select('player_id,status').eq('team_id', teamId).eq('training_date', date)
    ]);
    if (playerError) throw playerError;
    if (attendanceError) throw attendanceError;
    players = playerData || [];
    attendance = new Map((attendanceData || []).map(row => [row.player_id, row.status]));
    players.forEach(p => { if (!attendance.has(p.id)) attendance.set(p.id, 'anwesend'); });
    renderPlayers();
    attendancePanel.hidden = false;
    setStatus(`${players.length} Spieler geladen.`, 'ok');
  } catch (error) {
    console.error(error);
    setStatus(`❌ ${error.message || 'Daten konnten nicht geladen werden.'}`, 'error');
  } finally { loadButton.disabled = false; }
}

async function saveAttendance() {
  const teamId = Number(teamSelect.value);
  const date = dateInput.value;
  if (!teamId || !date || !players.length) return;
  saveButton.disabled = true;
  setStatus('Speichere Anwesenheit…');
  try {
    const rows = players.map(player => ({ team_id: teamId, player_id: player.id, training_date: date, status: attendance.get(player.id) || 'anwesend' }));
    const { error } = await db.from('jugend_attendance').upsert(rows, { onConflict: 'player_id,training_date' });
    if (error) throw error;
    setStatus('✓ Anwesenheit wurde gespeichert.', 'ok');
  } catch (error) {
    console.error(error);
    setStatus(`❌ ${error.message || 'Speichern fehlgeschlagen.'}`, 'error');
  } finally { saveButton.disabled = false; }
}

(async () => {
  const { data, error } = await db.auth.getSession();
  if (error || !data.session || !allowedTrainers.has(data.session.user.user_metadata?.display_name)) {
    window.location.replace('login.html'); return;
  }
  dateInput.value = localDateString();
  try { await loadTeams(); } catch (error) { setStatus(`❌ ${error.message || 'Mannschaften konnten nicht geladen werden.'}`, 'error'); }
})();

loadButton.addEventListener('click', loadAttendance);
saveButton.addEventListener('click', saveAttendance);