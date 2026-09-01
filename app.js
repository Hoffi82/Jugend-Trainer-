const SUPABASE_URL = 'https://jvgqvtnqncelbhuordzy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_4PusmhJVMm0b3Bm-2Y-FPQ__tnZZzZO';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function showMessage(text){
  const t=document.getElementById('toast');
  if(!t) return;
  t.textContent=text;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),3500);
}

(async () => {
  const { data, error } = await db.auth.getSession();
  if (error || !data.session) {
    window.location.replace('login.html');
    return;
  }

  const name = data.session.user.user_metadata?.display_name;
  if (name && !['Hoffi','Kai','Marcel'].includes(name)) {
    await db.auth.signOut();
    window.location.replace('login.html');
    return;
  }

  const header = document.querySelector('.secure');
  if (header && name) header.textContent = `🔒 Angemeldet: ${name}`;
})();
