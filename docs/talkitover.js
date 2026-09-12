/*! TalkItOver v1.0.2 — hand this page to the reader's own LLM.
 *
 * MIT License · Copyright (c) 2026 Ralf D. Müller
 * https://github.com/raifdmueller/talkitover
 *
 * <script src="talkitover.js"></script>
 * <talk-it-over url="https://example.org/episode-331.md"
 *               prompt="Load {url}. I would like to talk it over."
 *               label="Let's talk it over"
 *               providers="claude,chatgpt,copy"></talk-it-over>
 *
 * Vendor this file into your repository — it must not be loaded from a CDN or
 * from the hub site, so the button keeps working when they do not.
 *
 * The button remembers the reader's provider (localStorage, if available).
 * The chevron reopens the choice. Add providers via TalkItOver.providers.
 *
 * data-prompt carries the content type and its version ("referenz@1") for later
 * update pull requests. This file never reads it.
 */
(function () {
  const VERSION = "1.0.2";
  const STORAGE_KEY = "talkitover.provider";

  /* Above this length a provider link is no longer safe: browsers, proxies and
   * the providers themselves truncate long URLs, and a truncated prompt fails
   * silently. Beyond it the prompt goes to the clipboard instead.
   * The number is a conservative guess until Spike #9 measures the real one. */
  const MAX_URL_LENGTH = 6000;

  const DEFAULTS = {
    label: "Let's talk it over",
    prompt: "Load {url} and talk it over with me. Cite what you use.",
  };

  const providers = {
    claude: { name: "with Claude", url: (p) => "https://claude.ai/new?q=" + p },
    chatgpt: { name: "with ChatGPT", url: (p) => "https://chatgpt.com/?q=" + p },
    copy: { name: "or copy the prompt", copy: true },
  };

  // ─── Logik ──────────────────────────────────────────────────────────────────

  function buildPrompt(template, url) {
    return String(template).replaceAll("{url}", url);
  }

  function providerIds(attribute) {
    const ids = String(attribute || Object.keys(providers).join(","))
      .split(",")
      .map((id) => id.trim())
      .filter((id) => providers[id]);
    // Ein Provider, zweimal genannt, ergab zwei gleiche Einträge im Menü.
    return [...new Set(ids)];
  }

  function providerUrl(id, prompt) {
    const provider = providers[id];
    if (!provider || !provider.url) return null;
    return provider.url(encodeURIComponent(prompt));
  }

  function needsClipboardFallback(id, prompt) {
    const url = providerUrl(id, prompt);
    return url !== null && url.length > api.maxUrlLength;
  }

  const api = {
    version: VERSION,
    providers,
    defaults: DEFAULTS,
    maxUrlLength: MAX_URL_LENGTH,
    buildPrompt,
    providerIds,
    providerUrl,
    needsClipboardFallback,
  };

  // ─── Darstellung ────────────────────────────────────────────────────────────

  const remember = {
    get() { try { return localStorage.getItem(STORAGE_KEY); } catch { return null; } },
    set(v) { try { localStorage.setItem(STORAGE_KEY, v); } catch { /* private mode: forget */ } },
  };

  const ICON = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none"
    stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">
    <path d="M3 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-7l-5 4v-4H6a3 3 0 0 1-3-3z"/>
    <path d="M12 5.2Q12.7 9.3 16.8 10Q12.7 10.7 12 14.8Q11.3 10.7 7.2 10Q11.3 9.3 12 5.2z"
      fill="var(--tio-accent, #e5a50a)" stroke="none"/>
  </svg>`;

  const CHEVRON = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 9l6 6 6-6"/></svg>`;

  const CHECK = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5 12l5 5L20 7"/></svg>`;

  const STYLE = `
    :host { display: inline-block; position: relative; font: inherit; color: var(--tio-fg, inherit); }
    button { font: inherit; color: inherit; background: var(--tio-bg, transparent); cursor: pointer;
      border: 1px solid var(--tio-border, color-mix(in srgb, currentColor 35%, transparent));
      padding: .55em .9em; display: inline-flex; align-items: center; gap: .55em; line-height: 1.2; }
    button:hover { background: var(--tio-hover, color-mix(in srgb, currentColor 8%, transparent)); }
    button:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
    .main { border-radius: var(--tio-radius, 8px) 0 0 var(--tio-radius, 8px); white-space: nowrap; }
    .more { border-left: 0; padding: .55em .5em; border-radius: 0 var(--tio-radius, 8px) var(--tio-radius, 8px) 0; }
    .row { display: inline-flex; }
    .menu { position: absolute; z-index: 10; top: calc(100% + 6px); right: 0; min-width: 100%;
      display: flex; flex-direction: column; padding: 4px; margin: 0;
      color: var(--tio-menu-fg, CanvasText); background: var(--tio-menu-bg, Canvas);
      border: 1px solid var(--tio-border, color-mix(in srgb, currentColor 35%, transparent));
      border-radius: var(--tio-radius, 8px); box-shadow: 0 6px 20px rgba(0,0,0,.12); }
    .menu[hidden] { display: none; }
    .menu button { border: 0; border-radius: 6px; width: 100%; justify-content: flex-end;
      white-space: nowrap; background: transparent; gap: .6em; }
    .menu button:hover { background: color-mix(in srgb, currentColor 8%, transparent); }
    .menu svg { visibility: hidden; }
    .menu button[aria-checked="true"] svg { visibility: visible; }
  `;

  class TalkItOver extends HTMLElement {
    connectedCallback() {
      const root = this.attachShadow({ mode: "open" });
      const label = this.getAttribute("label") || DEFAULTS.label;
      const ids = providerIds(this.getAttribute("providers"));

      root.innerHTML = `<style>${STYLE}</style>
        <div class="row">
          <button class="main" type="button">${ICON}<span class="label"></span></button>
          <button class="more" type="button" aria-label="Choose LLM" aria-haspopup="menu" aria-expanded="false">${CHEVRON}</button>
        </div>
        <div class="menu" role="menu" hidden>
          ${ids.map((id) => `<button type="button" role="menuitemradio" data-id="${id}" aria-checked="false">
            ${CHECK}<span>… ${providers[id].name}</span></button>`).join("")}
        </div>`;

      this.$main = root.querySelector(".main");
      this.$label = root.querySelector(".label");
      // Als Text, nicht als Markup: das Label kommt aus einem Attribut, und ein
      // Integrator könnte es aus der URL oder aus Inhalten befüllen.
      this.$label.textContent = label;
      this.$more = root.querySelector(".more");
      this.$menu = root.querySelector(".menu");
      this.label = label;
      this.refreshLabel();

      this.$main.addEventListener("click", () => {
        const choice = remember.get();
        choice && providers[choice] && ids.includes(choice) ? this.run(choice) : this.toggle(true);
      });
      this.$more.addEventListener("click", () => this.toggle());
      this.$menu.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-id]");
        if (btn) { remember.set(btn.dataset.id); this.refreshLabel(); this.toggle(false); this.run(btn.dataset.id); }
      });
      document.addEventListener("click", (e) => { if (!e.composedPath().includes(this)) this.toggle(false); });
      this.addEventListener("keydown", (e) => { if (e.key === "Escape") this.toggle(false); });
    }

    refreshLabel() {
      const c = providers[remember.get()];
      this.$label.textContent = c && !c.copy ? `${this.label} ${c.name}` : this.label;
    }

    prompt() {
      return buildPrompt(
        this.getAttribute("prompt") || DEFAULTS.prompt,
        this.getAttribute("url") || location.href
      );
    }

    toggle(open = this.$menu.hidden) {
      const current = remember.get();
      this.$menu.querySelectorAll("[data-id]").forEach((b) =>
        b.setAttribute("aria-checked", String(b.dataset.id === current)));
      this.$menu.hidden = !open;
      this.$more.setAttribute("aria-expanded", String(open));
      // Ein providers-Attribut aus lauter unbekannten IDs lässt das Menü leer.
      if (open) this.$menu.querySelector("button")?.focus();
    }

    async run(id) {
      const prompt = this.prompt();
      if (providers[id].copy) return this.handOver(prompt, "Prompt copied");
      if (needsClipboardFallback(id, prompt)) {
        return this.handOver(prompt, "Too long for a link — prompt copied");
      }
      window.open(providerUrl(id, prompt), "_blank", "noopener,noreferrer");
    }

    async handOver(prompt, note) {
      try { await navigator.clipboard.writeText(prompt); }
      catch { window.prompt("Copy this prompt:", prompt); return; }
      this.$label.textContent = note;
      setTimeout(() => this.refreshLabel(), 2000);
    }
  }

  customElements.define("talk-it-over", TalkItOver);
  window.TalkItOver = api;
})();
