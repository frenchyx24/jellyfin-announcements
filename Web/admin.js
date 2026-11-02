(() => {
  const root = document.getElementById("nflix-notice-admin"); if (!root) return;
  const base = (window.ApiClient?.serverAddress?.() || location.origin).replace(/\/$/, "");
  const token = () => window.ApiClient?.accessToken?.() || "";
  const call = async (path, options = {}) => {
    const response = await fetch(base + "/Plugins/NflixNotice/" + path, { ...options, headers: { "X-Emby-Token": token(), "Content-Type": "application/json", ...(options.headers || {}) } });
    if (!response.ok) throw new Error("Erreur API " + response.status);
    return response.status === 204 ? null : response.json();
  };
  const list = document.getElementById("nn-list"), count = document.getElementById("nn-count"), status = document.getElementById("nn-status"), form = document.getElementById("nn-form");
  const say = (text, bad = false) => { status.textContent = text; status.className = bad ? "nn-error" : "nn-success"; };
  const load = async () => {
    try { const items = await call("Admin"); count.textContent = items.length + (items.length === 1 ? " élément" : " éléments"); list.replaceChildren();
      if (!items.length) { list.innerHTML = '<div class="nn-empty nn-empty-wide"><span>✧</span><strong>Votre fil commence ici.</strong><p>Publiez votre première annonce pour informer vos utilisateurs.</p></div>'; return; }
      items.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(item => {
        const card = document.createElement("article"); card.className = "nn-row nn-level-" + item.level;
        const body = document.createElement("div"); body.className = "nn-row-body";
        const meta = document.createElement("div"); meta.className = "nn-card-top";
        const tag = document.createElement("span"); tag.className = "nn-tag"; tag.textContent = item.level.toUpperCase();
        const date = document.createElement("time"); date.textContent = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt)); meta.append(tag, date);
        const title = document.createElement("h3"); title.textContent = item.title; const msg = document.createElement("p"); msg.textContent = item.message; body.append(meta,title,msg);
        const del = document.createElement("button"); del.className = "nn-delete"; del.type = "button"; del.textContent = "Retirer"; del.onclick = async () => { if (!confirm("Retirer cette annonce ?")) return; try { await call("Admin/" + item.id, { method: "DELETE" }); await load(); } catch (e) { say(e.message, true); } };
        card.append(body,del); list.append(card);
      });
    } catch (e) { say("Accès refusé ou serveur indisponible. Connectez-vous avec un compte administrateur.", true); }
  };
  form.addEventListener("submit", async event => { event.preventDefault(); const data = new FormData(form);
    const payload = { title: data.get("title"), message: data.get("message"), level: data.get("level"), dismissible: data.has("dismissible"), enabled: true, startsAt: new Date().toISOString(), endsAt: data.get("endsAt") ? new Date(data.get("endsAt")).toISOString() : null };
    try { await call("Admin", { method: "POST", body: JSON.stringify(payload) }); form.reset(); form.elements.dismissible.checked = true; say("Annonce publiée."); await load(); } catch (e) { say("Publication impossible. Vérifiez les champs et vos droits administrateur.", true); }
  });
  load();
})();