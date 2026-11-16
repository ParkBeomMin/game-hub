(() => {
  const LANG_KEY = "gamehub.lang.v1";
  const GAMES_URL = "games.json";

  const COPY = {
    ko: {
      title: "게임 허브 · 범민 게임",
      desc: "직접 만든 브라우저 게임을 한곳에서. 트레이오라를 지금 플레이하고, 곧 공개될 스윙룸을 만나 보세요.",
      live: "플레이 가능",
      soon: "곧 공개",
      play: "지금 플레이",
      playPortal: "포털에서 플레이",
      count: (n) => `총 ${n}개`,
      shotAlt: (name, i) => `${name} 스크린샷 ${i}`,
      thumbAlt: (name) => `${name} 썸네일`,
    },
    en: {
      title: "Game Hub · BeomMin Park",
      desc: "Original browser games by BeomMin Park. Play Trayora now, and look out for Swingloom.",
      live: "Live",
      soon: "Coming soon",
      play: "Play now",
      playPortal: "Play on portal",
      count: (n) => `${n} title${n === 1 ? "" : "s"}`,
      shotAlt: (name, i) => `${name} screenshot ${i}`,
      thumbAlt: (name) => `${name} thumbnail`,
    },
  };

  const state = {
    lang: readLang(),
    games: [],
  };

  function readLang() {
    let saved = null;
    try {
      saved = localStorage.getItem(LANG_KEY);
    } catch (e) {
      /* ignore */
    }
    if (saved === "ko" || saved === "en") return saved;
    return (navigator.language || "").toLowerCase().indexOf("ko") === 0 ? "ko" : "en";
  }

  function setLang(lang) {
    if (lang !== "ko" && lang !== "en") return;
    state.lang = lang;
    const html = document.documentElement;
    html.lang = lang;
    html.setAttribute("data-lang", lang);
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch (e) {
      /* ignore */
    }
    applyMeta();
    syncLangButtons();
    renderGames();
  }

  function applyMeta() {
    const copy = COPY[state.lang];
    document.title = copy.title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", copy.desc);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (ogTitle) ogTitle.setAttribute("content", copy.title);
    if (ogDesc) ogDesc.setAttribute("content", copy.desc);
    if (twTitle) twTitle.setAttribute("content", copy.title);
    if (twDesc) twDesc.setAttribute("content", copy.desc);
    const locale = document.querySelector('meta[property="og:locale"]');
    if (locale) locale.setAttribute("content", state.lang === "ko" ? "ko_KR" : "en_US");
  }

  function syncLangButtons() {
    document.querySelectorAll("[data-set-lang]").forEach((btn) => {
      const on = btn.getAttribute("data-set-lang") === state.lang;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function loc(value) {
    if (!value) return "";
    if (typeof value === "string") return value;
    return value[state.lang] || value.en || value.ko || "";
  }

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.entries(attrs).forEach(([key, val]) => {
        if (val == null || val === false) return;
        if (key === "class") node.className = val;
        else if (key === "text") node.textContent = val;
        else if (key === "html") node.innerHTML = val;
        else if (key.startsWith("on") && typeof val === "function") node.addEventListener(key.slice(2), val);
        else node.setAttribute(key, val === true ? "" : val);
      });
    }
    (children || []).forEach((child) => {
      if (child) node.append(child);
    });
    return node;
  }

  function renderGames() {
    const grid = document.getElementById("game-grid");
    const count = document.getElementById("games-count");
    if (!grid) return;
    const copy = COPY[state.lang];
    grid.replaceChildren();
    state.games.forEach((game, index) => {
      grid.append(renderCard(game, copy, index));
    });
    if (count) {
      count.hidden = state.games.length === 0;
      count.textContent = copy.count(state.games.length);
    }
  }

  function renderCard(game, copy, index) {
    const name = loc(game.name);
    const isLive = game.status === "live";
    const url = game.url || "";
    const canPlay = isLive && Boolean(url);
    const isPortal = game.playMode === "portal";

    const media = el("div", { class: "card-media" }, [
      el("img", {
        src: game.thumbnail,
        alt: copy.thumbAlt(name),
        width: "1280",
        height: "720",
        loading: index === 0 ? "eager" : "lazy",
        decoding: "async",
      }),
      el("span", {
        class: isLive ? "badge badge-live" : "badge badge-soon",
        text: isLive ? copy.live : copy.soon,
      }),
    ]);

    const tags = Array.isArray(locTags(game.tags)) ? locTags(game.tags) : [];
    const tagList = tags.length
      ? el(
          "ul",
          { class: "tags" },
          tags.map((tag) => el("li", { text: tag }))
        )
      : null;

    const shots = Array.isArray(game.screenshots) ? game.screenshots.filter(Boolean) : [];
    const shotRow =
      shots.length > 0
        ? el(
            "div",
            { class: "shots" },
            shots.map((src, i) =>
              el(
                "button",
                {
                  class: "shot",
                  type: "button",
                  "aria-label": copy.shotAlt(name, i + 1),
                  onclick: () => openLightbox(src, copy.shotAlt(name, i + 1)),
                },
                [
                  el("img", {
                    src,
                    alt: "",
                    width: "320",
                    height: "180",
                    loading: "lazy",
                    decoding: "async",
                  }),
                ]
              )
            )
          )
        : null;

    let action;
    if (canPlay) {
      action = el("a", {
        class: isPortal ? "btn btn-primary btn-portal" : "btn btn-primary",
        href: url,
        target: "_blank",
        rel: "noopener noreferrer",
        text: isPortal ? copy.playPortal : copy.play,
      });
    } else {
      action = el("button", {
        class: "btn btn-disabled",
        type: "button",
        disabled: true,
        text: copy.soon,
      });
    }

    const article = el("article", { class: "game-card", "data-game-id": game.id }, [
      media,
      el("div", { class: "card-body" }, [
        el("h3", { class: "card-title", text: name }),
        el("p", { class: "card-desc", text: loc(game.shortDescription) }),
        tagList,
        shotRow,
        el("div", { class: "card-actions" }, [action]),
      ]),
    ]);
    return article;
  }

  function locTags(tags) {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    return tags[state.lang] || tags.en || tags.ko || [];
  }

  function openLightbox(src, alt) {
    const box = document.getElementById("lightbox");
    const img = document.getElementById("lightbox-image");
    if (!box || !img) return;
    img.src = src;
    img.alt = alt || "";
    box.hidden = false;
    document.body.style.overflow = "hidden";
    const closeBtn = box.querySelector("[data-lightbox-close]");
    if (closeBtn) closeBtn.focus();
  }

  function closeLightbox() {
    const box = document.getElementById("lightbox");
    const img = document.getElementById("lightbox-image");
    if (!box) return;
    box.hidden = true;
    if (img) img.removeAttribute("src");
    document.body.style.overflow = "";
  }

  async function loadGames() {
    const res = await fetch(GAMES_URL, { cache: "no-cache" });
    if (!res.ok) throw new Error("games.json " + res.status);
    const data = await res.json();
    const list = Array.isArray(data) ? data : data.games;
    if (!Array.isArray(list)) throw new Error("invalid games data");
    return list;
  }

  function bind() {
    document.querySelectorAll("[data-set-lang]").forEach((btn) => {
      btn.addEventListener("click", () => setLang(btn.getAttribute("data-set-lang")));
    });
    const box = document.getElementById("lightbox");
    if (box) {
      box.addEventListener("click", (ev) => {
        if (ev.target === box || ev.target.closest("[data-lightbox-close]")) closeLightbox();
      });
    }
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") closeLightbox();
    });
  }

  async function init() {
    applyMeta();
    syncLangButtons();
    bind();
    const error = document.getElementById("games-error");
    try {
      state.games = await loadGames();
      renderGames();
    } catch (err) {
      console.error(err);
      const grid = document.getElementById("game-grid");
      if (grid) grid.replaceChildren();
      if (error) error.hidden = false;
    }
  }

  init();
})();
