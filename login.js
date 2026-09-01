const allowedTrainers = new Set(['Hoffi', 'Kai', 'Marcel']);
const form = document.getElementById('loginForm');
const message = document.getElementById('loginMessage');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  if (!allowedTrainers.has(username)) {
    message.textContent = 'Dieser Trainer ist nicht freigeschaltet.';
    return;
  }

  if (!password) {
    message.textContent = 'Bitte dein Passwort eingeben.';
    return;
  }

  message.textContent = 'Die sichere Kontoverbindung wird als nächster Schritt mit Supabase Auth verbunden.';
});
