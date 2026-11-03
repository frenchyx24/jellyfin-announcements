(() => {
  window.NflixNoticeAdminMount = function (root, client) {
    if (root.__nnCleanup) root.__nnCleanup();
    const abort = new AbortController();
    const on = (node, event, fn) => node.addEventListener(event, fn, { signal: abort.signal });
    const q = selector => root.querySelector(selector);
    const categories = { announcement: 'Annonce', update: 'Mise à jour', maintenance: 'Maintenance', incident: 'Incident' };
    const date = value => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
    const state = n => n.archived ? 'archived' : !n.enabled ? 'draft' : new Date(n.startsAt) > new Date() ? 'scheduled' : n.endsAt && new Date(n.endsAt) <= new Date() ? 'expired' : 'published';
    const states = { archived: 'Archivée', draft: 'Brouillon', scheduled: 'Programmée', expired: 'Terminée', published: 'Publiée' };
    let items = [], editing = null, pending = false;
    const call = async (path, options = {}) => {
      const headers = { 'Content-Type': 'application/json' };
      if (client.setRequestHeaders) client.setRequestHeaders(headers);
      else headers.Authorization = 'MediaBrowser Client="Nflix Notice", Device="Web", DeviceId="nflix-notice-web", Version="0.2.0", Token="' + client.accessToken() + '"';
      const response = await fetch(client.getUrl('Plugins/NflixNotice/' + path), { ...options, signal: abort.signal, headers });
      if (!response.ok) { const text = await response.text(); throw new Error(response.status === 403 ? 'Ce compte ne dispose pas des droits administrateur.' : response.status === 401 ? 'Session expirée. Reconnectez-vous.' : text.slice(0, 300) || 'Erreur serveur ' + response.status); }
      return response.status === 204 ? null : response.json();
    };
    root.innerHTML = `<header class="nn-head"><div><span class="nn-brand">NFLIX / Communication</span><h1>Votre espace de publication</h1><p>Les annonces, les changements et les rendez-vous du serveur.</p></div><button type="button" class="nn-primary" data-new>Nouvelle publication</button></header>
      <div class="nn-stats" aria-label="Résumé des publications"></div><div class="nn-admin-status" role="status" aria-live="polite"></div>
      <div class="nn-workspace"><section class="nn-library"><div class="nn-section-head"><h2>Publications</h2><button type="button" class="nn-secondary" data-refresh>Actualiser</button></div>
      <div class="nn-filters"><label>Rechercher<input type="search" data-search placeholder="Titre, message, version…"></label><label>Catégorie<select data-category><option value="">Toutes</option>${Object.entries(categories).map(([key, value]) => `<option value="${key}">${value}</option>`).join('')}</select></label><label>État<select data-state><option value="">Tous</option>${Object.entries(states).map(([key, value]) => `<option value="${key}">${value}</option>`).join('')}</select></label></div><div class="nn-admin-list"></div></section>
      <section class="nn-editor"><div class="nn-section-head"><h2 data-editor-title>Nouvelle publication</h2><button type="button" class="nn-secondary" data-reset>Annuler</button></div>
      <div class="nn-presets" aria-label="Modèles"><button type="button" data-preset="announcement">Annonce</button><button type="button" data-preset="update">Mise à jour</button><button type="button" data-preset="maintenance">Maintenance</button><button type="button" data-preset="incident">Incident</button></div>
      <form><div class="nn-fields"><label>Catégorie<select name="category">${Object.entries(categories).map(([key, value]) => `<option value="${key}">${value}</option>`).join('')}</select></label><label>Priorité<select name="level"><option value="info">Information</option><option value="warning">Attention</option><option value="urgent">Urgent</option></select></label></div>
      <label>Titre<input name="title" required maxlength="120" placeholder="Ce que vos utilisateurs doivent savoir"></label><label>Message<textarea name="message" required maxlength="10000" rows="7" placeholder="Détaillez l’annonce, les nouveautés ou les changements…"></textarea></label>
      <label>Version ou service concerné<input name="version" maxlength="80" placeholder="Ex. Jellyfin 12.4 / NFLIX"></label>
      <div class="nn-fields"><label>Début d’affichage<input name="startsAt" type="datetime-local"></label><label>Fin de la popup<input name="endsAt" type="datetime-local"></label></div><p class="nn-help">Après la date de fin, la publication reste consultable dans l’historique utilisateur.</p>
      <div class="nn-fields"><label>Texte du bouton<input name="actionLabel" maxlength="80" placeholder="Voir les changements"></label><label>Lien du bouton<input name="actionUrl" type="url" maxlength="2048" placeholder="https://…"></label></div>
      <div class="nn-options"><label class="nn-check"><input name="showPopup" type="checkbox" checked> Afficher une popup</label><label class="nn-check"><input name="dismissible" type="checkbox" checked> Autoriser « Compris »</label><label class="nn-check"><input name="pinned" type="checkbox"> Épingler dans le dashboard</label></div>
      <div class="nn-preview"><span class="nn-muted">Aperçu utilisateur</span><article class="nn-card"><div class="nn-card-top"><span class="nn-tag" data-preview-category></span><span data-preview-version></span></div><h3 data-preview-title></h3><p data-preview-message></p><span class="nn-action" data-preview-link></span></article></div>
      <div class="nn-form-foot"><button type="button" class="nn-secondary" data-draft>Enregistrer le brouillon</button><button class="nn-primary" type="submit" data-publish>Publier</button></div></form></section></div>`;
    const form = q('form');
    const say = (text, bad = false) => { q('.nn-admin-status').textContent = text; q('.nn-admin-status').classList.toggle('nn-error', bad); };
    const preview = () => {
      q('[data-preview-category]').textContent = categories[form.elements.category.value];
      q('[data-preview-title]').textContent = form.elements.title.value || 'Le titre de votre publication';
      q('[data-preview-message]').textContent = form.elements.message.value || 'Votre message apparaîtra ici.';
      q('[data-preview-version]').textContent = form.elements.version.value;
      q('[data-preview-link]').textContent = form.elements.actionUrl.value ? form.elements.actionLabel.value || 'En savoir plus' : '';
      q('.nn-preview article').className = 'nn-card nn-level-' + form.elements.level.value;
      q('[data-publish]').textContent = editing ? 'Enregistrer et publier' : form.elements.startsAt.value && new Date(form.elements.startsAt.value) > new Date() ? 'Programmer' : 'Publier';
    };
    const localDate = value => { if (!value) return ''; const d = new Date(value); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
    const edit = (item = null, duplicate = false) => {
      editing = duplicate ? null : item;
      form.reset();
      if (item) for (const field of form.elements) { if (!field.name || item[field.name] === undefined) continue; if (field.type === 'checkbox') field.checked = item[field.name]; else field.value = ['startsAt', 'endsAt'].includes(field.name) ? localDate(item[field.name]) : item[field.name] ?? ''; }
      if (duplicate) { form.elements.title.value += ' (copie)'; form.elements.startsAt.value = ''; form.elements.endsAt.value = ''; }
      q('[data-editor-title]').textContent = editing ? 'Modifier la publication' : 'Nouvelle publication'; preview();
    };
    const render = () => {
      const stats = q('.nn-stats'); stats.replaceChildren();
      for (const [key, label] of [['published', 'En ligne'], ['scheduled', 'Programmées'], ['draft', 'Brouillons'], ['archived', 'Archivées']]) { const cell = document.createElement('div'); const number = document.createElement('strong'); number.textContent = items.filter(n => state(n) === key).length; const text = document.createElement('span'); text.textContent = label; cell.append(number, text); stats.append(cell); }
      const list = q('.nn-admin-list'); list.replaceChildren();
      const query = q('[data-search]').value.trim().toLocaleLowerCase('fr');
      const filtered = items.filter(n => (!q('[data-category]').value || n.category === q('[data-category]').value) && (!q('[data-state]').value || state(n) === q('[data-state]').value) && `${n.title} ${n.message} ${n.version}`.toLocaleLowerCase('fr').includes(query)).sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
      if (!filtered.length) { const empty = document.createElement('p'); empty.className = 'nn-empty'; empty.textContent = items.length ? 'Aucune publication ne correspond à ces filtres.' : 'Votre fil est vide. Écrivez votre première publication dans l’éditeur.'; list.append(empty); }
      for (const item of filtered) {
        const card = document.createElement('article'); card.className = 'nn-admin-row nn-level-' + item.level;
        const meta = document.createElement('div'); meta.className = 'nn-card-top'; const tag = document.createElement('span'); tag.className = 'nn-tag'; tag.textContent = categories[item.category] || 'Annonce'; const status = document.createElement('span'); status.textContent = states[state(item)] + (item.pinned ? ' / Épinglée' : ''); meta.append(tag, status);
        const title = document.createElement('h3'); title.textContent = item.title; const message = document.createElement('p'); message.textContent = item.message; const time = document.createElement('small'); time.textContent = 'Affichage : ' + date(item.startsAt) + (item.version ? ' / ' + item.version : '');
        const actions = document.createElement('div'); actions.className = 'nn-row-actions';
        const action = (label, handler) => { const button = document.createElement('button'); button.type = 'button'; button.className = 'nn-secondary'; button.textContent = label; button.onclick = handler; actions.append(button); };
        action('Modifier', () => { if (pending) return; edit(item); q('.nn-editor').scrollIntoView({ behavior: 'smooth', block: 'start' }); form.elements.title.focus(); });
        action('Dupliquer', () => { if (!pending) edit(item, true); });
        action(item.archived ? 'Restaurer' : 'Archiver', () => mutate(async () => { await call('Admin', { method: 'POST', body: JSON.stringify({ ...item, archived: !item.archived }) }); say(item.archived ? 'Publication restaurée.' : 'Publication archivée. Elle reste visible dans l’historique.'); }));
        action('Supprimer', () => { if (confirm('Supprimer définitivement cette publication ?')) mutate(async () => { await call('Admin/' + item.id, { method: 'DELETE' }); if (editing?.id === item.id) edit(); say('Publication supprimée.'); }); });
        card.append(meta, title, message, time, actions); list.append(card);
      }
    };
    const load = async () => { items = await call('Admin'); render(); };
    const mutate = async fn => { if (pending) return; pending = true; root.querySelectorAll('button').forEach(b => b.disabled = true); try { await fn(); await load(); window.dispatchEvent(new Event('nflixnotice:changed')); } catch (error) { if (error.name !== 'AbortError') say(error.message, true); } finally { pending = false; root.querySelectorAll('button').forEach(b => b.disabled = false); } };
    const save = enabled => {
      if (!form.reportValidity()) return;
      const data = new FormData(form); const payload = { ...(editing || {}), title: data.get('title'), message: data.get('message'), category: data.get('category'), level: data.get('level'), version: data.get('version'), actionLabel: data.get('actionLabel'), actionUrl: data.get('actionUrl'), enabled, archived: false, showPopup: data.has('showPopup'), dismissible: data.has('dismissible'), pinned: data.has('pinned'), startsAt: data.get('startsAt') ? new Date(data.get('startsAt')).toISOString() : new Date().toISOString(), endsAt: data.get('endsAt') ? new Date(data.get('endsAt')).toISOString() : null };
      mutate(async () => { const saved = await call('Admin', { method: 'POST', body: JSON.stringify(payload) }); edit(saved); say(!enabled ? 'Brouillon enregistré. Il est invisible aux utilisateurs.' : state(saved) === 'scheduled' ? 'Publication programmée.' : 'Publication publiée.'); });
    };
    on(form, 'submit', event => { event.preventDefault(); save(true); }); on(form, 'input', preview);
    on(q('[data-draft]'), 'click', () => save(false)); on(q('[data-reset]'), 'click', () => edit()); on(q('[data-new]'), 'click', () => { edit(); form.elements.title.focus(); });
    on(q('[data-refresh]'), 'click', () => mutate(async () => { say('Publications actualisées.'); }));
    for (const selector of ['[data-search]', '[data-category]', '[data-state]']) on(q(selector), 'input', render);
    root.querySelectorAll('[data-preset]').forEach(button => on(button, 'click', () => { edit(); const category = button.dataset.preset; form.elements.category.value = category; form.elements.level.value = category === 'incident' ? 'urgent' : category === 'maintenance' ? 'warning' : 'info'; form.elements.title.value = { announcement: '', update: 'Les nouveautés de NFLIX', maintenance: 'Maintenance prévue', incident: 'Incident en cours' }[category]; preview(); }));
    edit(); load().catch(error => { if (error.name !== 'AbortError') say(error.message, true); });
    root.__nnCleanup = () => abort.abort(); return root.__nnCleanup;
  };
})();
