/* Shared hub core: games.json, language, ordering. Each direction supplies window.HUB.render(ctx). */
(() => {
  const LANG_KEY = "gamehub.lang.v1";
  const state = { lang: readLang(), games: [] };
  function readLang() {
    let s = null;
    try { s = localStorage.getItem(LANG_KEY); } catch (e) {}
    if (s === "ko" || s === "en") return s;
    return (navigator.language || "").toLowerCase().indexOf("ko") === 0 ? "ko" : "en";
  }
  const loc = (v) => (!v ? "" : typeof v === "string" ? v : v[state.lang] || v.en || v.ko || "");
  const tags = (t) => (!t ? [] : Array.isArray(t) ? t : (t[state.lang] || t.en || t.ko || []));
  const playable = (g) => g.status === "live" && Boolean(g.url);
  // games.json order = release order (the routine appends). Optional `released` dates win if present.
  function chronological() {
    const list = state.games.map((g, i) => ({ g, i, t: g.released ? Date.parse(g.released) : NaN }));
    list.sort((a, b) => (Number.isFinite(a.t) && Number.isFinite(b.t) && a.t !== b.t ? a.t - b.t : a.i - b.i));
    return list.map((x, n) => Object.assign({}, x.g, { _no: n + 1 }));
  }
  function newest() {
    const live = chronological().filter(playable);
    return live.find((g) => g.featured === true) || live[live.length - 1] || null;
  }
  function el(tag, attrs, kids) {
    const svgTags = /^(svg|path|circle|rect|g|ellipse|polygon|polyline|line|text|defs|clipPath|image|use|pattern|tspan)$/;
    const n = svgTags.test(tag) ? document.createElementNS("http://www.w3.org/2000/svg", tag) : document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (v == null || v === false) return;
      if (k === "class") n.setAttribute("class", v);
      else if (k === "text") n.textContent = v;
      else if (k === "style" && typeof v === "object") Object.entries(v).forEach(([sk, sv]) => (sk.startsWith("--") ? n.style.setProperty(sk, sv) : (n.style[sk] = sv)));
      else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? "" : v);
    });
    (kids || []).forEach((c) => c != null && c !== false && n.append(c));
    return n;
  }
  function hashHue(id) { let h = 0; for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % 360; }
  function applyLang() {
    const html = document.documentElement;
    html.lang = state.lang; html.setAttribute("data-lang", state.lang);
    const M = window.HUB.meta[state.lang];
    document.title = M.title;
    const set = (s, v) => { const n = document.querySelector(s); if (n) n.setAttribute("content", v); };
    set('meta[name="description"]', M.desc); set('meta[property="og:title"]', M.title);
    set('meta[property="og:description"]', M.desc); set('meta[name="twitter:title"]', M.title);
    set('meta[name="twitter:description"]', M.desc);
    set('meta[property="og:locale"]', state.lang === "ko" ? "ko_KR" : "en_US");
    document.querySelectorAll("[data-set-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.setLang === state.lang)));
  }
  function render() {
    applyLang();
    window.HUB.render({ lang: state.lang, games: chronological(), newest: newest(), loc, tags, playable, el, hashHue });
    const live = chronological().filter(playable);
    document.querySelectorAll("[data-live-count]").forEach((n) => (n.textContent = String(live.length)));
    document.querySelectorAll("[data-live-names]").forEach((n) => (n.textContent = live.map((g) => loc(g.name)).join(", ")));
  }
  function setLang(l) {
    if (l !== "ko" && l !== "en") return;
    state.lang = l;
    try { localStorage.setItem(LANG_KEY, l); } catch (e) {}
    render();
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest("[data-set-lang]");
    if (b) setLang(b.dataset.setLang);
  });
  async function init() {
    applyLang();
    try {
      const r = await fetch("games.json", { cache: "no-cache" });
      if (!r.ok) throw new Error("games.json " + r.status);
      const d = await r.json();
      state.games = (Array.isArray(d) ? d : d.games || []).filter((g) => g && g.id);
      render();
    } catch (err) {
      console.error(err);
      const e = document.getElementById("games-error"); if (e) e.hidden = false;
    }
  }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", init) : init();
})();
