/* TalkItOver — hand this page to the reader's own LLM.
 *
 * <script src="talkitover.js"><\/script>
 * <talk-it-over url="https://example.org/episode-331.md"
 *               prompt="Lade {url}. Ich möchte den Inhalt mit Dir besprechen."
 *               label="Let's talk it over"
 *               providers="claude,chatgpt,copy"></talk-it-over>
 *
 * The button remembers the reader's provider (localStorage, if available).
 * The chevron reopens the choice. Add providers via TalkItOver.providers.
 */
(function () {
  const STORAGE_KEY = "talkitover.provider";

  const providers = {
    claude: { name: "with Claude", url: (p) => "https://claude.ai/new?q=" + p },
    chatgpt: { name: "with ChatGPT", url: (p) => "https://chatgpt.com/?q=" + p },
    copy: { name: "or copy the prompt", copy: true },
  };

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
      const label = this.getAttribute("label") || "Let's talk it over";
      const ids = (this.getAttribute("providers") || "claude,chatgpt,copy")
        .split(",").map((s) => s.trim()).filter((id) => providers[id]);

      root.innerHTML = `<style>${STYLE}</style>
        <div class="row">
          <button class="main" type="button">${ICON}<span class="label">${label}</span></button>
          <button class="more" type="button" aria-label="Choose LLM" aria-haspopup="menu" aria-expanded="false">${CHEVRON}</button>
        </div>
        <div class="menu" role="menu" hidden>
          ${ids.map((id) => `<button type="button" role="menuitemradio" data-id="${id}" aria-checked="false">
            ${CHECK}<span>… ${providers[id].name}</span></button>`).join("")}
        </div>`;

      this.$main = root.querySelector(".main");
      this.$label = root.querySelector(".label");
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
      const url = this.getAttribute("url") || location.href;
      const tpl = this.getAttribute("prompt") || "Load {url} and talk it over with me. Cite what you use.";
      return tpl.replaceAll("{url}", url);
    }

    toggle(open = this.$menu.hidden) {
      const current = remember.get();
      this.$menu.querySelectorAll("[data-id]").forEach((b) =>
        b.setAttribute("aria-checked", String(b.dataset.id === current)));
      this.$menu.hidden = !open;
      this.$more.setAttribute("aria-expanded", String(open));
      if (open) this.$menu.querySelector("button").focus();
    }

    async run(id) {
      const p = providers[id];
      if (p.copy) {
        try { await navigator.clipboard.writeText(this.prompt()); }
        catch { window.prompt("Copy this prompt:", this.prompt()); return; }
        this.$label.textContent = "Prompt copied";
        setTimeout(() => this.refreshLabel(), 2000);
        return;
      }
      window.open(p.url(encodeURIComponent(this.prompt())), "_blank", "noopener,noreferrer");
    }
  }

  customElements.define("talk-it-over", TalkItOver);
  window.TalkItOver = { providers };
})();
