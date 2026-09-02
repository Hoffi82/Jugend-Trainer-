(() => {
  if (document.body.dataset.trainerNav === '1') return;
  document.body.dataset.trainerNav = '1';

  const path = location.pathname.split('/').pop() || 'index.html';
  const items = [
    ['index.html', '⌂', 'Start'],
    ['spieler.html', '👥', 'Spieler'],
    ['termine.html', '📅', 'Termine'],
    ['spiele.html', '⚽', 'Spiele']
  ];
  const moreItems = [
    ['anwesenheit.html', '✅', 'Anwesenheit'],
    ['statistiken.html', '📊', 'Statistiken'],
    ['vorbereitung.html', '🏃', 'Vorbereitung'],
    ['aufgaben.html', '📝', 'Aufgaben'],
    ['mannschaftskasse.html', '💶', 'Kasse']
  ];

  const nav = document.createElement('nav');
  nav.className = 'mobile-nav';
  nav.setAttribute('aria-label', 'Trainer-Navigation');
  nav.innerHTML = items.map(([href, icon, label]) => `
    <a href="${href}" class="mobile-nav-link${path === href ? ' active' : ''}"><span>${icon}</span><small>${label}</small></a>
  `).join('') + `
    <button class="mobile-nav-link mobile-more" type="button" aria-expanded="false"><span>☰</span><small>Mehr</small></button>
    <div class="mobile-more-menu" hidden>
      ${moreItems.map(([href, icon, label]) => `<a href="${href}"${path === href ? ' class="active"' : ''}><span>${icon}</span>${label}</a>`).join('')}
    </div>`;

  document.body.appendChild(nav);
  const more = nav.querySelector('.mobile-more');
  const menu = nav.querySelector('.mobile-more-menu');
  more.addEventListener('click', () => {
    const open = !menu.hidden;
    menu.hidden = open;
    more.setAttribute('aria-expanded', String(!open));
  });
})();
