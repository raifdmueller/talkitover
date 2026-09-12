/* Tests für docs/talkitover.js (#10).
 *
 * Jeder Test nennt Issue und Gherkin-Szenario, damit er zur Story zurückführt.
 * Getestet wird die Logik hinter dem Button – Prompt bauen, Provider-URL bauen,
 * Grenze erkennen. Das DOM-Verhalten deckt der Live-Button auf der Konzept-Seite
 * ab (#14); dafür braucht es einen Browser, keinen Mock.
 */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const SOURCE = path.join(__dirname, '..', 'docs', 'talkitover.js')

function load() {
  const src = fs.readFileSync(SOURCE, 'utf8')
  const sandbox = {
    HTMLElement: class {},
    customElements: { define() {} },
    document: { addEventListener() {} },
    navigator: {},
    setTimeout,
  }
  sandbox.window = sandbox
  vm.runInNewContext(src, sandbox)
  return { api: sandbox.TalkItOver, src }
}

test('#10 Prompt entsteht aus Attribut und URL: jedes {url} wird ersetzt', () => {
  const { api } = load()
  const url = 'https://example.org/a.adoc'
  assert.equal(
    api.buildPrompt('Load {url}. Read {url} again.', url),
    `Load ${url}. Read ${url} again.`
  )
  assert.ok(!api.buildPrompt('Load {url}.', url).includes('{url}'))
})

test('#10 Ohne Attribute greift der Default', () => {
  const { api } = load()
  assert.equal(api.defaults.label, "Let's talk it over")
  assert.ok(api.defaults.prompt.includes('{url}'), 'Default-Prompt trägt den Platzhalter')
})

test('#10 Provider-Set nach E8', () => {
  const { api } = load()
  assert.deepEqual(Object.keys(api.providers), ['claude', 'chatgpt', 'copy'])
})

test('#10 Der Leser ohne passenden Provider kommt weiter: copy öffnet keine URL', () => {
  const { api } = load()
  assert.equal(api.providers.copy.copy, true)
  assert.equal(api.providerUrl('copy', 'anything'), null)
})

/* Invariante: Was der Leser klickt, kommt beim LLM unverändert an – egal welche
 * Zeichen im Prompt stehen. Diese Eigenschaft verbindet Eingabe und Ausgabe;
 * ein Test mit nur einem Beispiel-Prompt würde einen Kodierungsfehler bei
 * Umlauten oder & nicht bemerken. */
test('#10 Invariante: der Prompt übersteht die URL-Kodierung unverändert', () => {
  const { api } = load()
  const prompts = [
    'plain',
    'Lade https://x.org/a.adoc?q=1&r=2 und besprich es',
    'Umlaute äöü ß, Anführung "so" und \'so\'',
    'Sonderzeichen # + % / \\ ? = & @ : ;',
    'Zeilen\numbruch\tund Tab',
    'Emoji 🤖 und CJK 漢字',
    '{url} blieb stehen',
  ]
  for (const id of ['claude', 'chatgpt']) {
    for (const prompt of prompts) {
      const url = new URL(api.providerUrl(id, prompt))
      assert.equal(url.searchParams.get('q'), prompt, `${id}: ${prompt}`)
    }
  }
})

/* Invariante: Die Entscheidung "Link oder Zwischenablage" hängt monoton an der
 * Promptlänge. Sie kippt genau einmal – ein längerer Prompt darf nie wieder im
 * Link landen, sonst schneidet der Provider ihn still ab. */
test('#10 Invariante: die Clipboard-Grenze kippt genau einmal', () => {
  const { api } = load()
  let flips = 0
  let previous = api.needsClipboardFallback('claude', '')
  assert.equal(previous, false, 'der leere Prompt passt in den Link')
  for (let length = 1; length <= api.maxUrlLength * 2; length += 17) {
    const current = api.needsClipboardFallback('claude', 'x'.repeat(length))
    if (current !== previous) flips += 1
    previous = current
  }
  assert.equal(flips, 1)
  assert.equal(previous, true, 'der doppelt zu lange Prompt geht in die Zwischenablage')
})

test('#10 Die Komponente liest data-prompt nicht (#11)', () => {
  const { src } = load()
  assert.ok(
    !/getAttribute\(\s*["']data-prompt/.test(src),
    'data-prompt ist Metadatei für spätere Update-PRs, kein Eingabewert'
  )
})

test('#10 Die vendored Kopie nennt Version und Lizenz im Header', () => {
  const { api, src } = load()
  const header = src.slice(0, src.indexOf('*/'))
  assert.ok(header.includes(api.version), `Header nennt Version ${api.version}`)
  assert.ok(header.includes('MIT'), 'Header nennt die Lizenz')
})
