(() => {
  const T = {
    ko: {
      free: "무료", play: "무료 플레이", soon: "출시 예정", released: "공개일", devices: "지원 기기", tags: "태그",
      devDefault: "휴대폰 · PC (브라우저)", noDate: "—", newBadge: "신작", featured: "추천", nextTitle: "다음 게임 작업 중",
      nextSub: "새 게임이 나오면 여기에 가장 먼저 올라와요.", listNew: "최근 공개 순", listAll: "이름 순",
      count: (n) => `게임 ${n}개`, logNext: "다음 게임", logNextSub: "작업 예정", logRelease: (n) => `${n} 공개`,
      empty: "검색 결과가 없어요. 다른 단어로 찾아볼까요?", shot: (n, i) => `${n} 화면 ${i}`, hoverHint: "마우스를 올리면 플레이 화면 미리보기",
    },
    en: {
      free: "Free", play: "Play for free", soon: "Coming soon", released: "Released", devices: "Platforms", tags: "Tags",
      devDefault: "Phone · PC (browser)", noDate: "—", newBadge: "New", featured: "Featured", nextTitle: "Next game in the works",
      nextSub: "New releases show up here first.", listNew: "Newest first", listAll: "A to Z",
      count: (n) => `${n} game${n === 1 ? "" : "s"}`, logNext: "Next game", logNextSub: "Coming up", logRelease: (n) => `${n} released`,
      empty: "Nothing matches. Try another word?", shot: (n, i) => `${n} screen ${i}`, hoverHint: "Hover to preview gameplay",
    },
  };
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const S = { ctx: null, slide: 0, media: 0, tab: "new", sel: null, q: "", timers: [], hoverTimer: null, paused: false };

  const media = (g) => [g.thumbnail].concat(Array.isArray(g.screenshots) ? g.screenshots : []).filter((v, i, a) => v && a.indexOf(v) === i);
  function fmtDate(g, lang) {
    if (!g.released) return T[lang].noDate;
    const d = new Date(g.released + "T00:00:00");
    if (isNaN(d)) return T[lang].noDate;
    return lang === "ko" ? `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일` : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }
  const devices = (g, ctx) => (g.platforms ? ctx.loc(g.platforms) : T[ctx.lang].devDefault);
  const allTags = (g) => [].concat((g.tags && g.tags.ko) || [], (g.tags && g.tags.en) || [], Array.isArray(g.tags) ? g.tags : []);
  function matches(g) {
    if (!S.q) return true;
    const q = S.q.toLowerCase();
    const hay = [g.name && g.name.ko, g.name && g.name.en, ...allTags(g)].filter(Boolean).join(" ").toLowerCase();
    return hay.includes(q);
  }
  function newestFirst(ctx) {
    const list = ctx.games.slice().reverse();
    const f = list.find((g) => g.featured === true);
    return f ? [f].concat(list.filter((g) => g !== f)) : list;
  }

  function playBtn(ctx, g, cls) {
    const t = T[ctx.lang];
    if (!ctx.playable(g)) return ctx.el("span", { class: cls + " is-soon" }, [t.soon]);
    return ctx.el("a", { class: cls, href: g.url, target: "_blank", rel: "noopener noreferrer", "aria-label": `${ctx.loc(g.name)} — ${t.play}` }, [t.play]);
  }
  function tagRow(ctx, g, max) {
    const tags = ctx.tags(g.tags).slice(0, max || 6);
    return ctx.el("ul", { class: "tagrow" }, tags.map((x) => ctx.el("li", {}, [x])));
  }

  /* ---------- carousel ---------- */
  function renderCarousel() {
    const ctx = S.ctx, { el, loc, lang } = ctx, t = T[lang];
    const slides = newestFirst(ctx).filter(ctx.playable);
    const stage = document.getElementById("car-stage");
    const dots = document.getElementById("car-dots");
    if (!slides.length) { stage.replaceChildren(); dots.replaceChildren(); return; }
    S.slide = (S.slide + slides.length) % slides.length;
    const g = slides[S.slide];
    const m = media(g);
    S.media = S.media % m.length;
    const name = loc(g.name);
    const mainImg = el("img", { src: m[S.media], alt: t.shot(name, S.media + 1), width: "1280", height: "720", decoding: "async" });
    const main = el("a", { class: "car-main", href: g.url, target: "_blank", rel: "noopener noreferrer", tabindex: "-1" }, [
      mainImg,
      el("span", { class: "car-flag" }, [S.slide === 0 ? t.newBadge : t.featured]),
      el("span", { class: "car-progress", style: { "--n": String(m.length) } }, m.map((_, i) => el("i", { class: i === S.media ? "on" : "" }))),
    ]);
    const thumbs = el("div", { class: "car-thumbs" }, m.slice(0, 4).map((src, i) =>
      el("button", {
        type: "button", class: "car-thumb" + (i === S.media ? " on" : ""), "aria-label": t.shot(name, i + 1),
        onmouseenter: () => setMedia(i), onclick: () => setMedia(i),
      }, [el("img", { src, alt: "", width: "320", height: "180", decoding: "async" })])
    ));
    const side = el("div", { class: "car-side" }, [
      el("h2", { class: "car-title" }, [name]),
      thumbs,
      el("p", { class: "car-desc" }, [loc(g.shortDescription)]),
      tagRow(ctx, g, 4),
      el("p", { class: "car-meta" }, [el("span", {}, [t.released + " "]), el("b", {}, [fmtDate(g, lang)])]),
      el("div", { class: "buy" }, [el("span", { class: "price" }, [t.free]), playBtn(ctx, g, "btn-play")]),
    ]);
    stage.replaceChildren(el("article", { class: "car-slide", "data-game-id": g.id }, [main, side]));
    dots.replaceChildren(...slides.map((s, i) => el("button", {
      type: "button", class: i === S.slide ? "on" : "", "aria-label": loc(s.name), onclick: () => { S.slide = i; S.media = 0; renderCarousel(); },
    })));
  }
  function setMedia(i) { S.media = i; renderCarousel(); }
  function tick() {
    if (S.paused || document.hidden || !S.ctx) return;
    const slides = newestFirst(S.ctx).filter(S.ctx.playable);
    if (!slides.length) return;
    const m = media(slides[S.slide % slides.length]);
    if (S.media + 1 < Math.min(m.length, 4)) S.media++;
    else { S.media = 0; S.slide = (S.slide + 1) % slides.length; }
    renderCarousel();
  }

  /* ---------- capsules ---------- */
  function capsule(ctx, g, big) {
    const { el, loc, lang } = ctx, t = T[lang];
    const m = media(g);
    const img = el("img", { src: g.thumbnail, alt: "", width: "1280", height: "720", decoding: "async", loading: big ? "eager" : "lazy" });
    const bar = el("span", { class: "cap-bar" }, m.map((_, i) => el("i", { class: i === 0 ? "on" : "" })));
    let idx = 0;
    const show = (i) => { idx = i; img.src = m[i]; bar.querySelectorAll("i").forEach((n, k) => n.classList.toggle("on", k === i)); };
    const start = () => { if (m.length < 2 || reduce) return; clearInterval(S.hoverTimer); show(1 % m.length); S.hoverTimer = setInterval(() => show((idx + 1) % m.length), 950); };
    const stop = () => { clearInterval(S.hoverTimer); show(0); };
    const isNew = newestFirst(ctx)[0] === g;
    const kids = [
      el("span", { class: "cap-media" }, [img, m.length > 1 ? bar : null, isNew ? el("span", { class: "cap-new" }, [t.newBadge]) : null]),
      el("span", { class: "cap-info" }, [
        el("span", { class: "cap-name" }, [loc(g.name)]),
        el("span", { class: "cap-tags" }, [ctx.tags(g.tags).join(" · ")]),
        big ? el("span", { class: "cap-desc" }, [loc(g.shortDescription)]) : null,
        el("span", { class: "cap-price" }, [ctx.playable(g) ? t.free : t.soon]),
      ]),
    ];
    const attrs = { class: "cap" + (big ? " big" : ""), "data-game-id": g.id, onmouseenter: start, onmouseleave: stop, onfocus: start, onblur: stop };
    return ctx.playable(g)
      ? el("a", Object.assign(attrs, { href: g.url, target: "_blank", rel: "noopener noreferrer", "aria-label": `${loc(g.name)} — ${t.play}` }), kids)
      : el("div", attrs, kids);
  }
  function renderCapsules() {
    const ctx = S.ctx, { el, lang } = ctx, t = T[lang];
    const list = newestFirst(ctx).filter(matches);
    const box = document.getElementById("capsules");
    const items = list.map((g, i) => capsule(ctx, g, i === 0 && !S.q));
    if (!S.q && !ctx.games.some((g) => !ctx.playable(g))) {
      items.push(el("div", { class: "cap next", "aria-hidden": "true" }, [
        el("span", { class: "next-art" }, [el("i"), el("i"), el("i"), el("i")]),
        el("span", { class: "cap-info" }, [el("span", { class: "cap-name" }, [t.nextTitle]), el("span", { class: "cap-tags" }, [t.nextSub])]),
      ]));
    }
    if (!list.length) items.push(el("p", { class: "empty" }, [t.empty]));
    box.className = "capsules n" + Math.min(list.length, 5) + (S.q ? " searching" : "");
    box.replaceChildren(...items);
  }

  /* ---------- tabs + list + detail ---------- */
  function row(ctx, g) {
    const { el, loc, lang } = ctx, t = T[lang];
    const kids = [
      el("img", { class: "row-img", src: g.thumbnail, alt: "", width: "1280", height: "720", loading: "lazy", decoding: "async" }),
      el("span", { class: "row-main" }, [el("span", { class: "row-name" }, [loc(g.name)]), el("span", { class: "row-tags" }, [ctx.tags(g.tags).join(", ")]), el("span", { class: "row-date" }, [fmtDate(g, lang)])]),
      el("span", { class: "row-price" }, [ctx.playable(g) ? t.free : t.soon]),
    ];
    const attrs = {
      class: "row" + (S.sel === g.id ? " on" : ""), "data-game-id": g.id,
      onmouseenter: () => select(g.id), onfocus: () => select(g.id),
    };
    return ctx.playable(g) ? el("a", Object.assign(attrs, { href: g.url, target: "_blank", rel: "noopener noreferrer" }), kids) : el("div", attrs, kids);
  }
  function select(id) {
    if (S.sel === id) return;
    S.sel = id;
    document.querySelectorAll("#list .row").forEach((r) => r.classList.toggle("on", r.dataset.gameId === id));
    renderDetail();
  }
  function renderList() {
    const ctx = S.ctx, { el, loc, lang } = ctx, t = T[lang];
    document.querySelectorAll("[data-tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === S.tab)));
    const base = ctx.games.filter(matches);
    const box = document.getElementById("list");
    const out = [];
    if (S.tab === "genre") {
      const groups = new Map();
      base.forEach((g) => ctx.tags(g.tags).forEach((tag) => { if (!groups.has(tag)) groups.set(tag, []); groups.get(tag).push(g); }));
      groups.forEach((gs, tag) => out.push(el("h3", { class: "list-h" }, [tag, el("small", {}, [" · " + t.count(gs.length)])]), ...gs.map((g) => row(ctx, g))));
    } else {
      const sorted = S.tab === "new"
        ? base.slice().reverse()
        : base.slice().sort((a, b) => loc(a.name).localeCompare(loc(b.name), lang));
      out.push(el("p", { class: "list-sub" }, [S.tab === "new" ? t.listNew : t.listAll, " · ", t.count(sorted.length)]), ...sorted.map((g) => row(ctx, g)));
    }
    if (!base.length) out.push(el("p", { class: "empty" }, [t.empty]));
    box.replaceChildren(...out);
    if (!S.sel || !base.some((g) => g.id === S.sel)) S.sel = (base.slice().reverse()[0] || {}).id || null;
    document.querySelectorAll("#list .row").forEach((r) => r.classList.toggle("on", r.dataset.gameId === S.sel));
    renderDetail();
  }
  function renderDetail() {
    const ctx = S.ctx, { el, loc, lang } = ctx, t = T[lang];
    const box = document.getElementById("detail");
    const g = ctx.games.find((x) => x.id === S.sel);
    if (!g) { box.replaceChildren(); return; }
    const m = media(g);
    const big = el("img", { class: "det-big", src: m[1] || m[0], alt: t.shot(loc(g.name), 1), width: "1280", height: "720", decoding: "async" });
    box.replaceChildren(
      el("h3", { class: "det-name" }, [loc(g.name)]),
      big,
      el("div", { class: "det-strip" }, m.map((src) => el("button", { type: "button", "aria-label": t.shot(loc(g.name), m.indexOf(src) + 1), onmouseenter: () => (big.src = src), onclick: () => (big.src = src) }, [el("img", { src, alt: "", width: "320", height: "180", loading: "lazy" })]))),
      el("p", { class: "det-desc" }, [loc(g.shortDescription)]),
      el("dl", { class: "det-meta" }, [
        el("dt", {}, [t.released]), el("dd", {}, [fmtDate(g, lang)]),
        el("dt", {}, [t.devices]), el("dd", {}, [devices(g, ctx)]),
        el("dt", {}, [t.tags]), el("dd", {}, [tagRow(ctx, g)]),
      ]),
      el("div", { class: "buy" }, [el("span", { class: "price" }, [ctx.playable(g) ? t.free : t.soon]), playBtn(ctx, g, "btn-play")])
    );
  }

  /* ---------- genre tiles + log ---------- */
  function renderGenres() {
    const ctx = S.ctx, { el, lang } = ctx, t = T[lang];
    const groups = new Map();
    newestFirst(ctx).forEach((g) => ctx.tags(g.tags).forEach((tag) => { if (!groups.has(tag)) groups.set(tag, []); groups.get(tag).push(g); }));
    const tiles = [];
    let i = 0;
    groups.forEach((gs, tag) => {
      const shot = media(gs[0])[1 + (i % 3)] || gs[0].thumbnail;
      tiles.push(el("button", {
        type: "button", class: "gtile", style: { backgroundImage: `url("${shot}")` },
        onclick: () => { S.q = tag; document.getElementById("q").value = tag; S.tab = "all"; renderAllLists(); document.getElementById("browse").scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); },
      }, [el("span", { class: "gtile-name" }, [tag]), el("span", { class: "gtile-n" }, [t.count(gs.length)])]));
      i++;
    });
    document.getElementById("genre-tiles").replaceChildren(...tiles);
  }
  function renderLog() {
    const ctx = S.ctx, { el, loc, lang } = ctx, t = T[lang];
    const items = [];
    if (!ctx.games.some((g) => !ctx.playable(g))) items.push(el("li", { class: "next" }, [el("time", {}, [t.logNextSub]), el("span", {}, [t.logNext])]));
    newestFirst(ctx).forEach((g) => items.push(el("li", {}, [
      el("time", {}, [fmtDate(g, lang)]),
      ctx.playable(g) ? el("a", { href: g.url, target: "_blank", rel: "noopener noreferrer" }, [t.logRelease(loc(g.name))]) : el("span", {}, [loc(g.name) + " · " + t.soon]),
      el("small", {}, [ctx.tags(g.tags).join(" · ")]),
    ])));
    document.getElementById("release-log").replaceChildren(...items);
  }

  function renderAllLists() { renderCapsules(); renderList(); }

  function bindOnce() {
    if (bindOnce.done) return; bindOnce.done = true;
    document.querySelectorAll("[data-car]").forEach((b) => b.addEventListener("click", () => { S.slide += Number(b.dataset.car); S.media = 0; renderCarousel(); }));
    const car = document.getElementById("carousel");
    car.addEventListener("mouseenter", () => (S.paused = true));
    car.addEventListener("mouseleave", () => (S.paused = false));
    car.addEventListener("focusin", () => (S.paused = true));
    car.addEventListener("focusout", () => (S.paused = false));
    document.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => { S.tab = b.dataset.tab; renderList(); }));
    document.getElementById("q").addEventListener("input", (e) => { S.q = e.target.value.trim(); renderAllLists(); });
    if (!reduce) S.timers.push(setInterval(tick, 3800));
  }

  window.HUB = {
    meta: {
      ko: { title: "게임 허브 — 한판공방의 무료 브라우저 게임", desc: "한판공방이 직접 만든 무료 브라우저 게임 스토어. 설치도 가입도 없이 폰과 PC에서 바로 플레이." },
      en: { title: "Game Hub — free browser games from Hanpan Gongbang", desc: "A small store shelf of free browser games, all made in-house at Hanpan Gongbang. No install, no sign-up. Phone or PC." },
    },
    render(ctx) {
      S.ctx = ctx;
      const q = document.getElementById("q");
      q.placeholder = q.dataset["ph" + (ctx.lang === "ko" ? "Ko" : "En")];
      renderCarousel(); renderCapsules(); renderList(); renderGenres(); renderLog();
      bindOnce();
    },
  };
})();
