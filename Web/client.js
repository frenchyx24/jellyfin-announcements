(() => {
  if (window.__nflixNoticeLoaded) return;
  window.__nflixNoticeLoaded = true;
  const categories = { announcement: 'Annonces', update: 'Mises à jour', maintenance: 'Maintenances', incident: 'Incidents' };
  let client, userId = '', identity = '', active = [], feed = [], read = new Set(), shown = new Set(), isAdmin = false, busy = false, generation = 0, cleanupAdmin, adminScript;
  let filter = '', query = '', unreadOnly = false, mode = 'user', focusBefore;
  const css = document.createElement('link'); css.rel = 'stylesheet';
  css.href = (location.pathname.includes('/web') ? location.pathname.split('/web')[0] : '') + '/Plugins/NflixNotice/notice.css'; document.head.append(css);
  const widget = document.createElement('div'); widget.className = 'nn-widget'; widget.hidden = true;
  widget.innerHTML = `<button class="nn-launch" type="button" aria-label="Ouvrir le centre d’annonces"><span class="nn-launch-icon" aria-hidden="true">✦</span><span>Annonces</span><b class="nn-badge" hidden></b></button><div class="nn-toast" hidden role="status"><span class="nn-toast-glow" aria-hidden="true">✦</span><div class="nn-toast-copy"><small></small><strong></strong><span></span></div><button type="button" aria-label="Fermer la notification">×</button></div>
    <dialog class="nn-dashboard"><div class="nn-dashboard-shell"><header class="nn-dashboard-head"><div><span class="nn-brand">NFLIX / Le fil du serveur</span><h1>Quoi de neuf ?</h1><p>Retrouvez les annonces et les changements, même après avoir fermé leur popup.</p></div><button type="button" class="nn-close" aria-label="Fermer le dashboard">×</button></header><nav class="nn-dashboard-tabs"><button type="button" data-mode="user" aria-pressed="true">Mon dashboard</button><button type="button" data-mode="admin" hidden aria-pressed="false">Administration</button></nav><div class="nn-user-dashboard"><div class="nn-feed-summary"></div><div class="nn-user-toolbar"><label>Rechercher<input type="search" placeholder="Titre, nouveautés, version…" data-search></label><label class="nn-check"><input type="checkbox" data-unread> Non lues uniquement</label><button type="button" class="nn-secondary" data-read-all>Tout marquer comme lu</button><button type="button" class="nn-secondary" data-refresh>Actualiser</button></div><nav class="nn-category-tabs" aria-label="Catégories"></nav><div class="nn-feed-error" role="status"></div><div class="nn-user-feed"></div></div><div class="nn-admin" data-admin-root hidden></div></div></dialog>`;
  document.body.append(widget);
  const q = selector => widget.querySelector(selector);
  const dialog = q('dialog'), toast = q('.nn-toast'); let toastTimer;
  const key = n => n.id + ':' + (n.updatedAt || n.createdAt);
  const storageKey = type => 'nflixNotice:' + client.serverAddress() + ':' + userId + ':' + type;
  const stored = type => { try { return new Set(JSON.parse(localStorage.getItem(storageKey(type)) || '[]')); } catch { return new Set(); } };
  const persist = () => { try { localStorage.setItem(storageKey('read'), JSON.stringify([...read].slice(-2000))); localStorage.setItem(storageKey('shown'), JSON.stringify([...shown].slice(-2000))); } catch {} };
  const call = async (path, options = {}) => {
    const headers = { 'Content-Type': 'application/json' };
    if (client.setRequestHeaders) client.setRequestHeaders(headers);
    else headers.Authorization = 'MediaBrowser Client="Nflix Notice", Device="Web", DeviceId="nflix-notice-web", Version="0.2.0", Token="' + client.accessToken() + '"';
    const response = await fetch(client.getUrl('Plugins/NflixNotice/' + path), { ...options, headers });
    if (!response.ok) { const error = new Error(response.status === 401 ? 'Session expirée. Reconnectez-vous.' : 'Impossible de charger les annonces (' + response.status + ').'); error.status = response.status; throw error; }
    return response.status === 204 ? null : response.json();
  };
  const formatDate = value => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  const markRead = n => { read.add(key(n)); persist(); render(); };
  const render = () => {
    const unread = feed.filter(n => !read.has(key(n))).length;
    q('.nn-badge').hidden = !unread; q('.nn-badge').textContent = unread;
    q('[data-mode="admin"]').hidden = !isAdmin;
    q('.nn-feed-summary').textContent = feed.length + ' publications / ' + unread + ' non lues';
    const tabs = q('.nn-category-tabs'); tabs.replaceChildren();
    for (const [value, label] of [['', 'Tout le fil'], ...Object.entries(categories)]) { const button = document.createElement('button'); button.type = 'button'; button.textContent = label; button.setAttribute('aria-pressed', String(filter === value)); button.onclick = () => { filter = value; render(); }; tabs.append(button); }
    const list = q('.nn-user-feed'); list.replaceChildren();
    const visible = feed.filter(n => (!filter || n.category === filter) && (!unreadOnly || !read.has(key(n))) && `${n.title} ${n.message} ${n.version || ''}`.toLocaleLowerCase('fr').includes(query)).sort((a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.startsAt) - new Date(a.startsAt));
    if (!visible.length) { const empty = document.createElement('div'); empty.className = 'nn-empty'; empty.textContent = feed.length ? 'Aucune publication ne correspond à votre recherche.' : 'Le fil est calme. Les prochaines annonces apparaîtront ici.'; list.append(empty); }
    for (const n of visible) {
      const card = document.createElement('article'); card.className = 'nn-news nn-level-' + n.level + (!read.has(key(n)) ? ' nn-unread' : '');
      const top = document.createElement('div'); top.className = 'nn-card-top'; const category = document.createElement('span'); category.className = 'nn-tag'; category.textContent = categories[n.category] || 'Annonce'; const meta = document.createElement('span'); meta.textContent = [n.pinned ? 'Épinglée' : '', n.archived || n.endsAt && new Date(n.endsAt) <= new Date() ? 'Historique' : '', !read.has(key(n)) ? 'Non lue' : 'Lue'].filter(Boolean).join(' / '); top.append(category, meta);
      const title = document.createElement('h2'); title.textContent = n.title; const time = document.createElement('time'); time.dateTime = n.startsAt; time.textContent = formatDate(n.startsAt) + (n.version ? ' / ' + n.version : '');
      const message = document.createElement('p'); message.className = 'nn-news-message'; message.textContent = n.message;
      const actions = document.createElement('div'); actions.className = 'nn-row-actions';
      if (n.actionUrl) { try { const url = new URL(n.actionUrl); if (['http:', 'https:'].includes(url.protocol)) { const link = document.createElement('a'); link.className = 'nn-action'; link.href = url.href; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = n.actionLabel || 'En savoir plus'; link.onclick = () => markRead(n); actions.append(link); } } catch {} }
      if (!read.has(key(n))) { const button = document.createElement('button'); button.type = 'button'; button.className = 'nn-secondary'; button.textContent = 'Marquer comme lu'; button.onclick = () => markRead(n); actions.append(button); }
      card.append(top, title, time, message, actions); list.append(card);
    }
  };
  const clearSession = () => { generation++; identity = ''; userId = ''; isAdmin = false; active = []; feed = []; read.clear(); shown.clear(); cleanupAdmin?.(); cleanupAdmin = null; q('[data-admin-root]').replaceChildren(); q('[data-admin-root]').hidden = true; q('.nn-user-dashboard').hidden = false; mode = 'user'; filter = ''; query = ''; unreadOnly = false; q('[data-search]').value = ''; q('[data-unread]').checked = false; widget.hidden = true; toast.hidden = true; clearTimeout(toastTimer); if (dialog.open) dialog.close(); };
  const resolveClient = async () => {
    if (window.ApiClient?.accessToken) return window.ApiClient;
    if (window.require) return new Promise(resolve => { try { window.require(['apiClient'], resolve, () => resolve(null)); } catch { resolve(null); } });
    return null;
  };
  const refresh = async () => {
    if (busy) return; busy = true;
    try {
      client = await resolveClient();
      if (!client?.accessToken?.() || !client.getCurrentUserId?.()) { if (identity) clearSession(); return; }
      const nextIdentity = client.serverAddress() + ':' + client.getCurrentUserId() + ':' + client.accessToken();
      if (identity !== nextIdentity) { clearSession(); identity = nextIdentity; userId = client.getCurrentUserId(); read = stored('read'); shown = stored('shown'); }
      const currentGeneration = generation;
      const [published, current] = await Promise.all([call('Feed'), call('Active')]);
      let admin = false;
      try { const user = await client.getCurrentUser(); admin = Boolean((user.Policy || user.policy)?.IsAdministrator ?? (user.Policy || user.policy)?.isAdministrator); } catch {}
      if (currentGeneration !== generation || client.serverAddress() + ':' + client.getCurrentUserId() + ':' + client.accessToken() !== nextIdentity) return;
      feed = published; active = current; isAdmin = admin; widget.hidden = false; q('.nn-feed-error').textContent = ''; render();
      const fresh = active.filter(n => n.showPopup !== false && !read.has(key(n)) && !shown.has(key(n))).sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
      if (fresh.length && !dialog.open) {
        const n = fresh[0]; shown.add(key(n)); persist();
        toast.dataset.notice = n.id; toast.querySelector('small').textContent = categories[n.category] || 'Nouvelle annonce'; toast.querySelector('strong').textContent = n.title; toast.querySelector('.nn-toast-copy > span').textContent = n.message; toast.className = 'nn-toast nn-level-' + n.level; toast.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.hidden = true; }, 10000);
      }
    } catch (error) { q('.nn-feed-error').textContent = error.message; if (error.status === 401) clearSession(); else if (userId) widget.hidden = false; }
    finally { busy = false; }
  };
  const showMode = async next => {
    if (next === 'admin' && !isAdmin) return;
    mode = next; q('.nn-user-dashboard').hidden = mode !== 'user'; q('[data-admin-root]').hidden = mode !== 'admin';
    widget.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    if (mode === 'admin' && !cleanupAdmin) {
      const currentGeneration = generation;
      try {
        if (!window.NflixNoticeAdminMount) { if (!adminScript) adminScript = new Promise((resolve, reject) => { const script = document.createElement('script'); script.src = client.getUrl('Plugins/NflixNotice/admin.js'); script.onload = resolve; script.onerror = () => { adminScript = null; reject(new Error('Impossible de charger l’administration. Réessayez.')); }; document.head.append(script); }); await adminScript; }
        if (generation === currentGeneration && isAdmin && mode === 'admin') cleanupAdmin = window.NflixNoticeAdminMount(q('[data-admin-root]'), client);
      } catch (error) { q('[data-admin-root]').textContent = error.message; }
    }
  };
  const open = () => { focusBefore = document.activeElement; toast.hidden = true; if (!dialog.open) dialog.showModal(); render(); refresh(); };
  q('.nn-launch').onclick = open;
  q('.nn-close').onclick = () => dialog.close();
  dialog.addEventListener('close', () => { focusBefore?.focus(); });
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  toast.querySelector('button').onclick = event => { event.stopPropagation(); toast.hidden = true; };
  toast.onclick = () => { const n = active.find(n => n.id === toast.dataset.notice); if (n?.dismissible) markRead(n); open(); };
  widget.querySelectorAll('[data-mode]').forEach(button => button.onclick = () => showMode(button.dataset.mode));
  q('[data-search]').oninput = event => { query = event.target.value.trim().toLocaleLowerCase('fr'); render(); };
  q('[data-unread]').onchange = event => { unreadOnly = event.target.checked; render(); };
  q('[data-read-all]').onclick = () => { feed.forEach(n => read.add(key(n))); persist(); render(); };
  q('[data-refresh]').onclick = refresh;
  window.addEventListener('nflixnotice:changed', refresh);
  window.addEventListener('hashchange', () => { if (/login|logout|selectserver/.test(location.hash)) clearSession(); refresh(); });
  window.addEventListener('storage', event => { if (userId && event.key === storageKey('read')) { read = stored('read'); render(); } });
  refresh(); setInterval(refresh, 30000);
})();
