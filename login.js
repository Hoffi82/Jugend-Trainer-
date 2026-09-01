const SUPABASE_URL = 'https://jvgqvtnqncelbhuordzy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_4PusmhJVMm0b3Bm-2Y-FPQ__tnZZzZO';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const allowedTrainers = new Set(['Hoffi', 'Kai', 'Marcel']);
const form = document.getElementById('loginForm');
const message = document.getElementById('loginMessage');
const submitButton = document.getElementById('submitButton');
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const hint = document.getElementById('loginHint');
let mode = 'login';

// Wie bei Cold N' Dark: Der Trainername bleibt der sichtbare Benutzername.
// Supabase Auth bekommt intern nur eine technische .local-Adresse. Dadurch
// wird keine Trainer-E-Mail benötigt und der Benutzer muss keine E-Mail kennen.
function emailFor(username) {
  return `trainer+${encodeURIComponent(username.trim().toLowerCase()).replace(/%/g, '')}@atsv-jugend.local`;
}

function setMessage(text, type = '') {
  message.textContent = text;
  message.className = `login-message ${type}`.trim();
}

function setMode(nextMode) {
  mode = nextMode;
  const register = mode === 'register';
  loginTab.classList.toggle('active', !register);
  registerTab.classList.toggle('active', register);
  submitButton.textContent = register ? '🔐 Trainerkonto anlegen' : '🔐 Anmelden';
  document.getElementById('password').autocomplete = register ? 'new-password' : 'current-password';
  hint.textContent = register
    ? 'Nur Hoffi, Kai und Marcel können hier ein eigenes Passwort für ihr Trainerkonto festlegen.'
    : 'Nur Hoffi, Kai und Marcel sind als Trainer freigeschaltet.';
  setMessage('');
}

loginTab.addEventListener('click', () => setMode('login'));
registerTab.addEventListener('click', () => setMode('register'));

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  setMessage('');

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  if (!allowedTrainers.has(username)) {
    setMessage('Dieser Trainer ist nicht freigeschaltet.', 'error');
    return;
  }
  if (password.length < 6) {
    setMessage('Das Passwort muss mindestens 6 Zeichen haben.', 'error');
    return;
  }

  submitButton.disabled = true;
  const email = emailFor(username);

  try {
    if (mode === 'register') {
      const { data, error } = await db.auth.signUp({
        email,
        password,
        options: { data: { display_name: username, member_role: 'trainer' } }
      });
      if (error) throw error;

      if (data.session) {
        window.location.href = 'index.html';
      } else {
        setMessage('Konto angelegt. Falls im Supabase-Projekt eine Bestätigung aktiviert ist, muss sie zuerst abgeschlossen werden.', 'ok');
      }
    } else {
      const { error } = await db.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.location.href = 'index.html';
    }
  } catch (error) {
    console.error(error);
    const text = error?.message || 'Anmeldung fehlgeschlagen.';
    setMessage(mode === 'register' && /already registered|already exists/i.test(text)
      ? 'Für diesen Trainer gibt es bereits ein Konto. Bitte über „Einloggen“ anmelden.'
      : `❌ ${text}`, 'error');
  } finally {
    submitButton.disabled = false;
  }
});

(async () => {
  const { data } = await db.auth.getSession();
  if (data.session) window.location.href = 'index.html';
})();
