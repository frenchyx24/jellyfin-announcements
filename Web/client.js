(() => {
  if (window.__nflixNoticeLoaded) return;
  window.__nflixNoticeLoaded = true;
  const base = (window.ApiClient?.serverAddress?.() || location.origin).replace(/\/$/, "");
  const token = () => window.ApiClient?.accessToken?.() || "";
  const headers = () => ({ "X-Emby-Token": token(), "Content-Type": "application/json" });
  const api = async (path, options = {}) => {
    const response = await fetch(base + "/Plugins/NflixNotice/" + path, { ...options, headers: { ...headers(), ...(options.headers || {}) } });
    if (!response.ok) throw new Error("Nflix Notice API " + response.status);
    return response.status === 204 ? null : response.json();
  };
  const css = document.createElement("link");
  css.rel = "stylesheet"; css.href = base + "/Plugins/NflixNotice/notice.css"; document.head.append(css);
  const dismissed = new Set(JSON.parse(sessionStorage.getItem("nflixNoticeDismissed") || "[]"));
  let notices = [];
  const button = document.createElement("button");
  button.className = "nn-launch"; button.type = "button"; button.setAttribute("aria-label", "Ouvrir les annonces");
  button.innerHTML = '<span class="nn-launch-icon" aria-hidden="true">✦</span><span>Annonces</span><b class="nn-badge" hidden></b>';
  const panel = document.createElement("section");
  panel.className = "nn-panel"; panel.setAttribute("aria-label", "Centre d’annonces"); panel.hidden = true;
  panel.innerHTML = '<header class="nn-panel-head"><div><span class="nn-kicker">NFLIX · À LA UNE</span><h2>Le fil du serveur</h2></div><button class="nn-close" type="button" aria-label="Fermer">×</button></header><div class="nn-feed"></div><footer class="nn-panel-foot">Les infos importantes, sans interrompre votre soirée.</footer>';
  const widget = document.createElement("div"); widget.className = "nn-widget"; widget.append(panel, button); document.body.append(widget);
  const feed = panel.querySelector(".nn-feed"), badge = button.querySelector(".nn-badge");
  const render = () => {
    const visible = notices.filter(n => !dismissed.has(n.id));
    badge.hidden = visible.length === 0; badge.textContent = String(visible.length);
    feed.replaceChildren();
    if (!visible.length) { const empty = document.createElement("div"); empty.className = "nn-empty"; empty.innerHTML = '<span>✧</span><strong>Tout est calme.</strong><p>Aucune annonce pour le moment.</p>'; feed.append(empty); return; }
    visible.forEach((notice, index) => {
      const card = document.createElement("article"); card.className = "nn-card nn-level-" + notice.level; card.style.setProperty("--nn-delay", (index * 55) + "ms");
      const top = document.createElement("div"); top.className = "nn-card-top";
      const tag = document.createElement("span"); tag.className = "nn-tag"; tag.textContent = notice.level === "urgent" ? "IMPORTANT" : notice.level === "warning" ? "À NOTER" : "INFO";
      const time = document.createElement("time"); time.textContent = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(notice.createdAt)); top.append(tag, time);
      const title = document.createElement("h3"); title.textContent = notice.title;
      const message = document.createElement("p"); message.textContent = notice.message;
      card.append(top, title, message);
      if (notice.dismissible) { const dismiss = document.createElement("button"); dismiss.className = "nn-dismiss"; dismiss.type = "button"; dismiss.textContent = "Compris"; dismiss.onclick = () => { dismissed.add(notice.id); sessionStorage.setItem("nflixNoticeDismissed", JSON.stringify([...dismissed])); render(); }; card.append(dismiss); }
      feed.append(card);
    });
  };
  const refresh = async () => { try { notices = await api("Active"); render(); } catch (_) { button.hidden = true; } };
  button.addEventListener("click", () => { panel.hidden = !panel.hidden; if (!panel.hidden) { panel.classList.remove("nn-pop"); requestAnimationFrame(() => panel.classList.add("nn-pop")); } });
  panel.querySelector(".nn-close").addEventListener("click", () => { panel.hidden = true; });
  document.addEventListener("keydown", event => { if (event.key === "Escape") panel.hidden = true; });
  refresh(); window.setInterval(refresh, 90000);
})();