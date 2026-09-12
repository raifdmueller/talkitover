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

/* Grenzwerte der Clipboard-Entscheidung, für jeden Provider, der eine URL baut.
 * Die Invariante oben prüft, DASS die Entscheidung genau einmal kippt; hier steht,
 * WO sie kippt: bei maxUrlLength ist die URL noch gültig, ein Zeichen mehr nicht. */
test('#10 Die Clipboard-Grenze liegt genau bei maxUrlLength', () => {
  const { api } = load()
  for (const id of ['claude', 'chatgpt']) {
    const overhead = api.providerUrl(id, '').length
    const fits = 'x'.repeat(api.maxUrlLength - overhead)

    assert.equal(api.providerUrl(id, fits).length, api.maxUrlLength)
    assert.equal(api.needsClipboardFallback(id, fits), false, `${id}: genau auf der Grenze`)
    assert.equal(api.needsClipboardFallback(id, fits.slice(1)), false, `${id}: eins darunter`)
    assert.equal(api.needsClipboardFallback(id, fits + 'x'), true, `${id}: eins darüber`)
  }
})

test('#10 copy kennt keine Grenze — es gibt keine URL, die zu lang werden könnte', () => {
  const { api } = load()
  assert.equal(api.needsClipboardFallback('copy', 'x'.repeat(api.maxUrlLength * 2)), false)
})

/* Ein providers-Attribut mit lauter unbekannten IDs ergab eine leere Liste, und
 * das Öffnen des Menüs griff dann auf einen Button zu, den es nicht gab. */
test('#10 Unbekannte Provider-IDs ergeben eine leere Liste, keinen Absturz', () => {
  const { api, src } = load()

  // Die Arrays entstehen im vm-Kontext; erst kopieren, sonst vergleicht
  // deepEqual auch den Prototyp aus dem anderen Realm.
  const ids = (attribute) => [...api.providerIds(attribute)]

  assert.deepEqual(ids('foo,bar'), [])
  assert.deepEqual(ids('claude,foo'), ['claude'])
  assert.deepEqual(ids(null), ['claude', 'chatgpt', 'copy'])
  assert.deepEqual(ids(' claude , copy '), ['claude', 'copy'])

  assert.ok(
    !/querySelector\("button"\)\.focus\(\)/.test(src),
    'der Fokus-Aufruf prüft, ob es einen Button gibt'
  )
})

/* Das Label kam als Attribut herein und ging ungefiltert in innerHTML. */
test('#10 Das Label wird als Text gesetzt, nicht als Markup eingesetzt', () => {
  const { src } = load()
  const template = src.slice(src.indexOf('root.innerHTML'), src.indexOf('this.$main ='))

  assert.ok(!template.includes('${label}'), 'kein Label im innerHTML-Template')
  assert.ok(/\.textContent = label/.test(src), 'Label wird über textContent gesetzt')
})
