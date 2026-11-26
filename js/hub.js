/* Game Hub — reads games.json, draws a small code-made preview for each game. */
(() => {
  const LANG_KEY = "gamehub.lang.v1";
  const T = {
    ko: { newest: "방금 나온 신작", play: "바로 시작", noSign: "가입 · 설치 없음", all: "전체", recent: "최근 7일", newStamp: "NEW",
      empty: "최근 7일 안에 나온 게임이 없어요.", released: (d) => `${d} 공개`, dockK: "NEW · 방금 나온 게임", dockGo: "한 판 하기",
      date: (d) => `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, "0")}`, longDate: (d) => `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`, title: "게임 허브 — 범민 공방의 무료 브라우저 게임", desc: "범민 공방에서 직접 만든 무료 브라우저 게임. 설치도 가입도 없이 휴대폰이나 PC에서 바로 한 판." },
    en: { newest: "Just released", play: "Play now", noSign: "No sign-up · no install", all: "All", recent: "Last 7 days", newStamp: "NEW",
      empty: "Nothing released in the last 7 days.", released: (d) => `Released ${d}`, dockK: "NEW · just released", dockGo: "Play",
      date: (d) => `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, "0")}`, longDate: (d) => d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }), title: "Game Hub — free browser games from BeomMin’s workshop", desc: "Free browser games, all made in-house by BeomMin Park. No install, no sign-up. Phone or PC." },
  };
  const TONES = { trayora: "#dcd3ff", swingloom: "#cfe6ff", rattlecart: "#ffe0c7", quiltrun: "#d3f0dc", cuehop: "#ffd8e3" };
  const DOTS = { trayora: "#4aa3e0", swingloom: "#ffd84d", rattlecart: "#f2b630", quiltrun: "#4d7cf0", cuehop: "#e8483a" };
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const S = { lang: readLang(), games: [], filter: "all" };

  function readLang() {
    let s = null; try { s = localStorage.getItem(LANG_KEY); } catch (e) {}
    const m = /[?&]lang=(ko|en)\b/.exec(location.search); if (m) s = m[1];
    if (s === "ko" || s === "en") return s;
    return (navigator.language || "").toLowerCase().indexOf("ko") === 0 ? "ko" : "en";
  }
  const loc = (v) => (!v ? "" : typeof v === "string" ? v : v[S.lang] || v.en || v.ko || "");
  const tagsOf = (g) => (!g.tags ? [] : Array.isArray(g.tags) ? g.tags : g.tags[S.lang] || g.tags.en || g.tags.ko || []);
  const playable = (g) => g.status === "live" && Boolean(g.url);
  const dateOf = (g) => { const d = g.released ? new Date(g.released + "T00:00:00") : null; return d && !isNaN(d) ? d : null; };
  function hashHue(id) { let h = 0; for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % 360; }
  const tone = (g) => TONES[g.id] || `hsl(${hashHue(g.id)} 75% 88%)`;
  const dot = (g) => DOTS[g.id] || `hsl(${hashHue(g.id)} 70% 55%)`;
  // games.json order = release order (the routine appends). `released` dates win if present.
  function chronological() {
    const list = S.games.map((g, i) => ({ g, i, t: dateOf(g) ? dateOf(g).getTime() : NaN }));
    list.sort((a, b) => (Number.isFinite(a.t) && Number.isFinite(b.t) && a.t !== b.t ? a.t - b.t : a.i - b.i));
    return list.map((x, n) => Object.assign({}, x.g, { _no: n + 1 }));
  }
  function newest() {
    const live = chronological().filter(playable);
    return live.find((g) => g.featured === true) || live[live.length - 1] || null;
  }
  const no = (g) => "No." + String(g._no).padStart(2, "0");

  function el(tag, attrs, kids) {
    const svg = /^(svg|path)$/.test(tag);
    const n = svg ? document.createElementNS("http://www.w3.org/2000/svg", tag) : document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (v == null || v === false) return;
      if (k === "text") n.textContent = v;
      else if (k === "style" && typeof v === "object") Object.entries(v).forEach(([sk, sv]) => n.style.setProperty(sk, sv));
      else n.setAttribute(k, v === true ? "" : v);
    });
    (kids || []).forEach((c) => c != null && c !== false && n.append(c));
    return n;
  }
  const arrow = () => el("svg", { viewBox: "0 0 16 16", width: 14, height: 14, "aria-hidden": "true" }, [el("path", { d: "M5 3l5 5-5 5", fill: "none", stroke: "currentColor", "stroke-width": "2.2", "stroke-linecap": "round", "stroke-linejoin": "round" })]);
  const playIcon = () => el("svg", { viewBox: "0 0 16 16", width: 12, height: 12, "aria-hidden": "true" }, [el("path", { d: "M4 2.5l9 5.5-9 5.5z", fill: "currentColor" })]);

  /* ---------- mini previews (all drawn in code, 240x180 logical px) ---------- */
  const W = 240, H = 180;
  const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); c.fill(); };
  const DRAW = {
    trayora(c, t) {
      c.fillStyle = "#18203a"; c.fillRect(0, 0, W, H);
      const s = 17, ox = 52, oy = 14, P = ["#4aa3e0", "#f2c230", "#6cbf5a", "#8a5cd6", "#e04848"];
      const board = ["........", "....3...", "1...33..", "11..23.4", "112.22.4", "0124.244", "01240444", "000..000"];
      const cyc = t % 4, clear = cyc > 2.0 && cyc < 2.9;
      for (let r = 0; r < 8; r++) for (let q = 0; q < 8; q++) {
        let ch = board[r][q];
        if (r === 7 && cyc > 1.7 && ch === ".") ch = "1";
        const x = ox + q * s, y = oy + r * s;
        c.fillStyle = "#222c4a"; rr(c, x, y, s - 2, s - 2, 3);
        if (ch === ".") continue;
        if (r === 7 && clear) { c.fillStyle = Math.floor(t * 10) % 2 ? "#ffffff" : "#ffe680"; rr(c, x, y, s - 2, s - 2, 3); continue; }
        if (r === 7 && cyc >= 2.9) continue;
        c.fillStyle = P[+ch % 5]; rr(c, x, y, s - 2, s - 2, 3);
        c.fillStyle = "rgba(255,255,255,.28)"; c.fillRect(x + 2, y + 2, s - 6, 3);
      }
      if (cyc <= 1.7) { // a two-block piece travels from the tray into the gap
        const k = Math.min(1, cyc / 1.4), e = 1 - Math.pow(1 - k, 3);
        const tx = ox + 3 * s, ty = oy + 7 * s, sx = 196, sy = 150;
        const x = sx + (tx - sx) * e, y = sy + (ty - sy) * e;
        c.fillStyle = P[1]; rr(c, x, y, s - 2, s - 2, 3); rr(c, x + s, y, s - 2, s - 2, 3);
      }
    },
    swingloom(c, t) {
      c.fillStyle = "#121a2c"; c.fillRect(0, 0, W, H);
      c.fillStyle = "rgba(255,255,255,.5)";
      for (let i = 0; i < 26; i++) { const x = (i * 97) % W, y = (i * 53) % 120; c.fillRect(x, y, 1.5, 1.5); }
      c.fillStyle = "#26314d"; c.fillRect(0, 150, W, 30);
      c.fillStyle = "#5fbf6a"; c.fillRect(150, 146, 70, 6);
      const pins = [[70, 40], [150, 30], [205, 58]];
      pins.forEach(([x, y]) => { c.strokeStyle = "#7d8cc4"; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 6, 0, 7); c.stroke(); });
      const a = Math.sin(t * 2.1) * 0.95, L = 72, px = pins[0][0] + Math.sin(a) * L, py = pins[0][1] + Math.cos(a) * L;
      c.setLineDash([3, 4]); c.strokeStyle = "rgba(180,160,255,.35)"; c.beginPath(); c.arc(pins[0][0], pins[0][1], L, 0.2, Math.PI - 0.2); c.stroke(); c.setLineDash([]);
      c.strokeStyle = "#e9e3ff"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(pins[0][0], pins[0][1]); c.lineTo(px, py); c.stroke();
      const g = c.createRadialGradient(px, py, 2, px, py, 22); g.addColorStop(0, "rgba(255,216,77,.6)"); g.addColorStop(1, "rgba(255,216,77,0)");
      c.fillStyle = g; c.beginPath(); c.arc(px, py, 22, 0, 7); c.fill();
      c.fillStyle = "#ffd84d"; c.beginPath(); c.arc(px, py, 8, 0, 7); c.fill();
      c.fillStyle = "#121a2c"; c.fillRect(px - 3.5, py - 2, 2, 3); c.fillRect(px + 1.5, py - 2, 2, 3);
    },
    rattlecart(c, t) {
      const sky = c.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#1a2236"); sky.addColorStop(1, "#2d3550");
      c.fillStyle = sky; c.fillRect(0, 0, W, H);
      const sc = t * 46;
      c.fillStyle = "#232c44";
      for (let i = 0; i < 9; i++) { const x = ((i * 37 - sc * 0.3) % 333 + 333) % 333 - 40, h = 40 + (i * 29) % 50; c.fillRect(x, 120 - h, 26, h + 60); }
      const gy = (x) => 128 + Math.sin((x + sc) / 34) * 16 + Math.sin((x + sc) / 13) * 4;
      c.fillStyle = "#59617a"; c.beginPath(); c.moveTo(0, H);
      for (let x = 0; x <= W; x += 4) c.lineTo(x, gy(x));
      c.lineTo(W, H); c.fill();
      c.strokeStyle = "#8b93ad"; c.lineWidth = 2; c.beginPath(); for (let x = 0; x <= W; x += 4) c.lineTo(x, gy(x)); c.stroke();
      const cx = 96, y1 = gy(cx - 14), y2 = gy(cx + 14), ang = Math.atan2(y2 - y1, 28), cy = (y1 + y2) / 2 - 12;
      c.save(); c.translate(cx, cy + Math.sin(t * 18) * 0.8); c.rotate(ang);
      c.fillStyle = "#f2b630"; rr(c, -20, -12, 40, 14, 3);
      c.fillStyle = "#1d1b17"; c.fillRect(-6, -21, 13, 9); c.fillStyle = "#f2b630"; c.fillRect(-4, -19, 9, 5);
      c.fillStyle = "#1d1b17"; c.fillRect(-20, -12, 3, 14);
      [[-13, 4], [13, 4]].forEach(([wx, wy]) => { c.fillStyle = "#111"; c.beginPath(); c.arc(wx, wy, 7, 0, 7); c.fill(); c.fillStyle = "#bbb"; c.beginPath(); c.arc(wx, wy, 2.5, 0, 7); c.fill(); });
      c.restore();
      c.fillStyle = "#ff5b8a"; c.beginPath(); c.arc(196, gy(196) - 30 + Math.sin(t * 3) * 3, 4, 0, 7); c.fill();
    },
    quiltrun(c, t) {
      const s = 10; c.fillStyle = "#ece6d6"; c.fillRect(0, 0, W, H);
      const zone = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x * s, y * s, w * s, h * s);
        c.strokeStyle = "rgba(255,255,255,.55)"; c.setLineDash([2, 2]); c.lineWidth = 1; c.strokeRect(x * s + 2.5, y * s + 2.5, w * s - 5, h * s - 5); c.setLineDash([]); };
      zone(0, 0, 6, 7, "#b9b24a"); zone(17, 0, 7, 5, "#f08fb0"); zone(18, 11, 6, 7, "#e7ef4a"); zone(0, 12, 5, 6, "#5fc6e0");
      const base = [6, 5, 7, 6]; zone(base[0], base[1], base[2], base[3], "#4d7cf0");
      const cyc = t % 5, loop = [[13, 6], [17, 6], [17, 10], [13, 10]];
      if (cyc > 4) { zone(13, 6, 4, 4, "#4d7cf0"); }
      const path = [[13, 6]].concat(loop.slice(1), [[13, 10]]);
      const len = 12, k = Math.min(cyc / 3.6, 1) * len;
      let pos = [13, 6], drawn = [[13 * s + 5, 6 * s + 5]], acc = 0;
      for (let i = 1; i < path.length; i++) {
        const [ax, ay] = path[i - 1], [bx, by] = path[i], seg = Math.abs(bx - ax) + Math.abs(by - ay);
        if (acc + seg >= k) { const f = (k - acc) / seg; pos = [ax + (bx - ax) * f, ay + (by - ay) * f]; drawn.push([pos[0] * s + 5, pos[1] * s + 5]); break; }
        acc += seg; pos = [bx, by]; drawn.push([bx * s + 5, by * s + 5]);
      }
      if (cyc <= 4) { c.strokeStyle = "rgba(77,124,240,.55)"; c.lineWidth = 8; c.lineJoin = "round"; c.beginPath(); drawn.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); }
      c.fillStyle = "#1d1b17"; c.fillRect(pos[0] * s - 1, pos[1] * s - 1, 12, 12);
      c.fillStyle = "#7fa6ff"; c.fillRect(pos[0] * s + 1, pos[1] * s + 1, 8, 8);
      const bx = 20 * s - Math.abs(((t * 18) % 60) - 30) , by = 7 * s;
      c.fillStyle = "#1d1b17"; c.fillRect(bx - 1, by - 1, 12, 12); c.fillStyle = "#f08fb0"; c.fillRect(bx + 1, by + 1, 8, 8);
    },
    cuehop(c, t) {
      c.fillStyle = "#3a2723"; c.fillRect(0, 0, W, H);
      c.strokeStyle = "#4b332d"; c.lineWidth = 1;
      for (let y = 0; y < H; y += 10) for (let x = (y / 10) % 2 ? 0 : 10; x < W; x += 20) c.strokeRect(x + .5, y + .5, 20, 10);
      c.fillStyle = "#171214"; c.fillRect(14, 20, W - 28, 130);
      const plats = [[18, 130, 46], [96, 112, 40], [168, 96, 56]];
      plats.forEach(([x, y, w]) => { c.fillStyle = "#8a5a44"; c.fillRect(x, y, w, 8); c.fillStyle = "#b07a5c"; c.fillRect(x, y, w, 2); });
      c.fillStyle = "#8a5a44"; c.fillRect(14, 150, W - 28, 10);
      const cyc = (t % 3.2) / 3.2;
      for (let i = 0; i < 6; i++) { const x = 66 + i * 5; c.fillStyle = "#ece6d6"; c.beginPath(); c.moveTo(x, 150); c.lineTo(x + 2.5, 143); c.lineTo(x + 5, 150); c.fill(); }
      const pop = cyc > 0.6 ? Math.min(1, (cyc - 0.6) * 8) : 0;
      if (pop) { c.fillStyle = "#e8483a"; for (let i = 0; i < 4; i++) { const x = 100 + i * 8; c.beginPath(); c.moveTo(x, 112); c.lineTo(x + 4, 112 - 8 * pop); c.lineTo(x + 8, 112); c.fill(); } }
      let x, y;
      if (cyc < 0.35) { const k = cyc / 0.35; x = 36 + (110 - 36) * k; y = 122 - Math.sin(k * Math.PI) * 38 + (112 - 130) * k; }
      else if (cyc < 0.45) { x = 110; y = 104; }
      else if (cyc < 0.8) { const k = (cyc - 0.45) / 0.35; x = 110 + (190 - 110) * k; y = 104 - Math.sin(k * Math.PI) * 34 + (96 - 112) * k; }
      else { x = 190; y = 88; }
      c.fillStyle = "#ece6d6"; c.fillRect(x - 5, y - 10, 10, 10);
      c.fillStyle = "#e8483a"; c.fillRect(x - 5, y - 13, 10, 4);
      c.fillStyle = "#171214"; c.fillRect(x + 1, y - 7, 2, 2);
      c.fillStyle = "#5fbf6a"; c.fillRect(210, 70, 6, 26); c.fillRect(206, 70, 12, 4);
    },
  };
  const live = new Set();
  function cartridge(g) {
    const draw = DRAW[g.id];
    let screen;
    if (draw) {
      screen = el("canvas", { width: W * 2, height: H * 2, role: "img", "aria-label": loc(g.name) });
      const c = screen.getContext("2d"); c.scale(2, 2);
      const item = { c, draw, seen: false }; screen._item = item;
      draw(c, 1.3);
      if (!reduce && "IntersectionObserver" in window) io.observe(screen);
    } else {
      screen = el("img", { src: g.thumbnail, alt: loc(g.name), loading: "lazy" });
    }
    return el("div", { class: "cart", style: { "--dot": dot(g) } }, [screen, el("div", { class: "cart-lbl" }, [el("span", { text: no(g) }), el("i")])]);
  }
  const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? live.add(e.target._item) : live.delete(e.target._item))), { rootMargin: "40px" }) : null;
  let last = 0;
  function tick(now) {
    if (now - last > 33) { last = now; const t = now / 1000; live.forEach((it) => it.draw(it.c, t)); }
    requestAnimationFrame(tick);
  }
  if (!reduce) requestAnimationFrame(tick);

  /* ---------- render ---------- */
  function hero(g) {
    const box = document.getElementById("hero");
    box.replaceChildren(); if (!g) return;
    box.style.setProperty("--tone", tone(g));
    const d = dateOf(g);
    box.append(
      el("span", { class: "hero-big", "aria-hidden": "true", text: String(g._no).padStart(2, "0") }),
      el("div", { class: "hero-txt" }, [
        el("span", { class: "hero-flag" }, [el("i", { text: T[S.lang].newStamp }), T[S.lang].newest]),
        el("span", { class: "hero-no", text: `${no(g)}${d ? " · " + T[S.lang].released(T[S.lang].longDate(d)) : ""}` }),
        el("h2", { text: loc(g.name) }),
        el("p", { text: loc(g.shortDescription) }),
        el("div", { class: "hero-tags" }, tagsOf(g).map((x) => el("span", { class: "tag", text: x }))),
        el("div", { class: "hero-cta" }, [el("a", { class: "btn-ink", href: g.url }, [playIcon(), T[S.lang].play]), el("small", { text: T[S.lang].noSign })]),
      ]),
      el("a", { class: "hero-art", href: g.url, "aria-label": loc(g.name) }, [cartridge(g)])
    );
  }
  function card(g, isNew) {
    const d = dateOf(g);
    return el("a", { class: "card", href: g.url, style: { "--tone": tone(g) } }, [
      isNew ? el("span", { class: "stamp", text: T[S.lang].newStamp }) : null,
      el("div", { class: "card-tile" }, [cartridge(g)]),
      el("div", { class: "card-body" }, [
        el("div", { class: "card-title" }, [el("h3", { text: loc(g.name) }), el("span", { text: d ? T[S.lang].date(d) : "" })]),
        el("p", { class: "card-desc", text: loc(g.shortDescription) }),
        el("div", { class: "card-foot" }, [el("div", { class: "tags" }, tagsOf(g).map((x) => el("span", { class: "tag", text: x }))), el("span", { class: "go", "aria-hidden": "true" }, [arrow()])]),
      ]),
    ]);
  }
  function isRecent(g) { const d = dateOf(g); return d && Date.now() - d.getTime() < 7 * 864e5; }
  function grid() {
    const all = chronological().filter(playable).reverse(), top = newest();
    const recent = all.filter(isRecent);
    const chips = document.getElementById("chips");
    chips.replaceChildren(...[["all", T[S.lang].all, all.length], ["recent", T[S.lang].recent, recent.length]].map(([k, label, n]) =>
      el("button", { class: "chip", type: "button", role: "tab", "aria-selected": String(S.filter === k), "data-filter": k }, [label, el("span", { text: String(n) })])));
    const list = S.filter === "recent" ? recent : all;
    const box = document.getElementById("grid");
    live.clear();
    box.replaceChildren(...(list.length ? list.map((g) => card(g, top && g.id === top.id)) : [el("p", { class: "empty", text: T[S.lang].empty })]));
  }
  function releaseLog() {
    const all = chronological().filter(playable).reverse(), top = newest();
    document.getElementById("release-log").replaceChildren(...all.map((g) => {
      const d = dateOf(g);
      return el("li", {}, [el("a", { href: g.url }, [
        el("span", { class: "log-date", text: d ? T[S.lang].date(d) : "—" }),
        el("span", { class: "log-name" }, [loc(g.name), top && g.id === top.id ? el("i", { class: "log-new", text: "NEW" }) : null, el("small", { text: tagsOf(g).join(" · ") })]),
        el("span", { class: "log-sw", style: { "--tone": tone(g) }, text: String(g._no).padStart(2, "0") }),
      ])]);
    }));
  }
  function dock(g) {
    const d = document.getElementById("dock"), q = document.getElementById("quick-play");
    if (!g) return;
    q.href = g.url;
    d.href = g.url; d.hidden = false; d.style.setProperty("--tone", tone(g));
    d.replaceChildren(el("span", { class: "dock-sw", text: String(g._no).padStart(2, "0") }), el("span", { class: "dock-t" }, [el("small", { text: T[S.lang].dockK }), el("b", { text: loc(g.name) })]), el("span", { class: "dock-go", text: T[S.lang].dockGo }));
  }
  function render() {
    const html = document.documentElement; html.lang = S.lang; html.setAttribute("data-lang", S.lang);
    document.title = T[S.lang].title;
    const setMeta = (sel, v) => { const n = document.querySelector(sel); if (n) n.setAttribute("content", v); };
    setMeta('meta[name="description"]', T[S.lang].desc); setMeta('meta[property="og:title"]', T[S.lang].title); setMeta('meta[property="og:description"]', T[S.lang].desc);
    setMeta('meta[name="twitter:title"]', T[S.lang].title); setMeta('meta[name="twitter:description"]', T[S.lang].desc); setMeta('meta[property="og:locale"]', S.lang === "ko" ? "ko_KR" : "en_US");
    document.querySelectorAll("[data-set-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.setLang === S.lang)));
    live.clear();
    const g = newest(), lv = chronological().filter(playable);
    hero(g); grid(); releaseLog(); dock(g);
    document.querySelectorAll("[data-count]").forEach((n) => (n.textContent = String(lv.length)));
    document.querySelectorAll("[data-names]").forEach((n) => (n.textContent = lv.map((x) => loc(x.name)).join(", ")));
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest("[data-set-lang]");
    if (b) { S.lang = b.dataset.setLang; try { localStorage.setItem(LANG_KEY, S.lang); } catch (x) {} render(); }
    const f = e.target.closest && e.target.closest("[data-filter]");
    if (f) { S.filter = f.dataset.filter; grid(); }
  });
  // mobile dock appears once the hero has scrolled away
  window.addEventListener("scroll", () => { const d = document.getElementById("dock"), h = document.getElementById("hero"); if (d && h) d.classList.toggle("on", h.getBoundingClientRect().bottom < 0); }, { passive: true });
  async function init() {
    render();
    try {
      const r = await fetch("games.json", { cache: "no-cache" });
      if (!r.ok) throw new Error("games.json " + r.status);
      const d = await r.json();
      S.games = (Array.isArray(d) ? d : d.games || []).filter((g) => g && g.id);
      render();
    } catch (err) { console.error(err); document.getElementById("games-error").hidden = false; }
  }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", init) : init();
})();
