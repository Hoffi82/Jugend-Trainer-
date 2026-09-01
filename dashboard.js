const SUPABASE_URL = 'https://jvgqvtnqncelbhuordzy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_4PusmhJVMm0b3Bm-2Y-FPQ__tnZZzZO';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

(async () => {
  const { data, error } = await db.auth.getSession();
  if (error || !data.session) {
    window.location.replace('login.html');
    return;
  }

  const name = data.session.user.user_metadata?.display_name || 'Trainer';
  const nameElement = document.getElementById('trainerName');
  if (nameElement) nameElement.textContent = `Angemeldet: ${name}`;

  const logout = document.getElementById('logoutBtn');
  if (logout) {
    logout.addEventListener('click', async () => {
      logout.disabled = true;
      await db.auth.signOut();
      window.location.replace('login.html');
    });
  }
})();
