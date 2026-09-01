const SUPABASE_URL = 'https://jvgqvtnqncelbhuordzy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_4PusmhJVMm0b3Bm-2Y-FPQ__tnZZzZO';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const REGISTER_FUNCTION = `${SUPABASE_URL}/functions/v1/trainer-register`;

const allowedTrainers = new Set(['Hoffi', 'Kai', 'Marcel']);
const form = document.getElementById('loginForm');
const message = document.getElementById('loginMessage');
const submitButton = document.getElementById('submitButton');
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const hint = document.getElementById('loginHint');
let mode = 'login';

function emailFor(username) {
  const safeName = username.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `trainer-${safeName}@jvgqvtnqncelbhuordzy.supabase.co`;
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

  try {
    if (mode === 'register') {
      const response = await fetch(REGISTER_FUNCTION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_KEY,
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Trainerkonto konnte nicht angelegt werden.');

      // Das Konto wird serverseitig bereits als E-Mail-bestätigt angelegt.
      // Anschließend erfolgt die normale Supabase-Anmeldung und es entsteht eine Session.
      const { error } = await db.auth.signInWithPassword({ email: emailFor(username), password });
      if (error) throw error;
      window.location.href = 'index.html';
    } else {
      const { error } = await db.auth.signInWithPassword({ email: emailFor(username), password });
      if (error) throw error;
      window.location.href = 'index.html';
    }
  } catch (error) {
    console.error(error);
    const text = error?.message || 'Anmeldung fehlgeschlagen.';
    setMessage(`❌ ${text}`, 'error');
  } finally {
    submitButton.disabled = false;
  }
});

(async () => {
  const { data } = await db.auth.getSession();
  if (data.session) window.location.href = 'index.html';
})();
