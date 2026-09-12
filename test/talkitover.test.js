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
    // Der vm-Kontext bringt keine Web-Globals mit; im Browser sind sie da.
    URL,
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

/* Invarianten von providerIds. Die Beispiele oben sagen, was bei vier Eingaben
 * herauskommt; diese Tests sagen, was für jede Eingabe gelten muss. Genau so
 * fällt auf, dass eine doppelte ID zweimal im Menü landet — ein Beispieltest
 * hätte den Fall erst gefunden, wenn jemand ihn aufgeschrieben hätte. */
const PROVIDER_ATTRIBUTES = [
  null,
  undefined,
  '',
  'claude',
  'copy,claude',
  'claude,chatgpt,copy',
  ' claude , copy ',
  'claude,foo',
  'foo,bar',
  'claude,,copy',
  'claude,claude',
  'copy,claude,copy,chatgpt',
  'CLAUDE',
  'claude;copy',
]

test('#10 Invariante: jede zurückgegebene ID ist ein bekannter Provider', () => {
  const { api } = load()
  const known = Object.keys(api.providers)
  for (const attribute of PROVIDER_ATTRIBUTES) {
    for (const id of api.providerIds(attribute)) {
      assert.ok(known.includes(id), `${attribute}: ${id} ist kein Provider`)
    }
  }
})

test('#10 Invariante: die Reihenfolge des Attributs bleibt erhalten', () => {
  const { api } = load()
  for (const attribute of PROVIDER_ATTRIBUTES) {
    if (attribute == null || attribute === '') continue
    const wanted = String(attribute).split(',').map((id) => id.trim())
    const got = [...api.providerIds(attribute)]

    let position = -1
    for (const id of got) {
      const next = wanted.indexOf(id, position + 1)
      assert.ok(next > position, `${attribute}: ${id} steht nicht in der Reihenfolge des Attributs`)
      position = next
    }
  }
})

test('#10 Invariante: kein Provider steht zweimal im Menü', () => {
  const { api } = load()
  for (const attribute of PROVIDER_ATTRIBUTES) {
    const got = [...api.providerIds(attribute)]
    assert.deepEqual(got, [...new Set(got)], `${attribute}: doppelte ID`)
  }
})

test('#10 Invariante: ohne Attribut gilt genau die Provider-Liste', () => {
  const { api } = load()
  const known = Object.keys(api.providers)
  for (const nothing of [null, undefined, '']) {
    assert.deepEqual([...api.providerIds(nothing)], known)
  }
})

test('#10 Invariante: das Ergebnis übersteht den zweiten Durchlauf unverändert', () => {
  const { api } = load()
  for (const attribute of PROVIDER_ATTRIBUTES) {
    const once = [...api.providerIds(attribute)]
    if (once.length === 0) continue
    assert.deepEqual([...api.providerIds(once.join(','))], once, `${attribute}: nicht idempotent`)
  }
})

/* Ein LLM bekommt nur den Prompt-Text. Ein Pfad wie /Semantic-Anchors/llms.txt
 * hat für den keinen Host, gegen den er auflösen könnte — die Seite, die der
 * Betreiber meint, ist für das LLM unerreichbar. Gefunden am Katalog-Button von
 * Semantic Anchors, der BASE_URL ins url-Attribut schrieb. */
const PAGE = 'https://llm-coding.github.io/Semantic-Anchors/'

test('#10 Ein wurzelrelativer Pfad wird zur vollständigen URL', () => {
  const { api } = load()
  assert.equal(
    api.absoluteUrl('/Semantic-Anchors/llms-index.txt', PAGE),
    'https://llm-coding.github.io/Semantic-Anchors/llms-index.txt'
  )
})

test('#10 Ein relativer Pfad wird gegen die Seite aufgelöst', () => {
  const { api } = load()
  assert.equal(
    api.absoluteUrl('docs/anchors/4mat.adoc', PAGE),
    'https://llm-coding.github.io/Semantic-Anchors/docs/anchors/4mat.adoc'
  )
})

test('#10 Eine vollständige URL bleibt, wie sie ist', () => {
  const { api } = load()
  const absolute = 'https://raw.githubusercontent.com/org/repo/main/a.adoc'
  assert.equal(api.absoluteUrl(absolute, PAGE), absolute)
})

test('#10 Ohne url-Attribut ist die Seite selbst die Referenz', () => {
  const { api } = load()
  assert.equal(api.absoluteUrl(null, PAGE), PAGE)
  assert.equal(api.absoluteUrl('', PAGE), PAGE)
})

test('#10 Invariante: was der Prompt nennt, ist immer eine auflösbare URL', () => {
  const { api } = load()
  const references = [
    null,
    '',
    '/Semantic-Anchors/llms-index.txt',
    'docs/anchors/4mat.adoc',
    './relative.md',
    '../eine-ebene-hoeher.md',
    'https://example.org/a.md',
    'http://example.org/b.md?q=1#teil',
    '//example.org/schemalos.md',
  ]
  for (const reference of references) {
    const url = api.absoluteUrl(reference, PAGE)
    assert.ok(/^https?:\/\//.test(url), `${reference} ergab keine vollständige URL: ${url}`)
    assert.equal(new URL(url).href, url, `${reference} ist nicht normalisiert`)
  }
})

test('#10 Der Prompt trägt die aufgelöste URL, nicht den Pfad', () => {
  const { api } = load()
  const prompt = api.buildPrompt('Load {url}.', api.absoluteUrl('/a/b.txt', PAGE))
  assert.equal(prompt, 'Load https://llm-coding.github.io/a/b.txt.')
})
