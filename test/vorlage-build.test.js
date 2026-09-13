/*
 * Tests für die Generator-Vorlage aus Rezept 1.
 *
 * Die Vorlage wird in fremde Repos kopiert. Was hier grün ist, ist dort nicht
 * automatisch grün — aber was hier rot ist, wäre dort ein Fehler, den niemand
 * mehr auf uns zurückführt.
 */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const fs = require('node:fs')
const os = require('node:os')

const VORLAGE = path.join(__dirname, '..', 'docs', 'vorlagen', 'talkitover-build.mjs')
const load = () => import(`file://${VORLAGE}`)

const page = (title, url, text) => ({ title, url, text })
const prose = 'Load {url}.\n\n{pages}\n\nEnde.'

test('titleOf nimmt den Titel und schneidet den Site-Zusatz ab', async () => {
  const { titleOf } = await load()

  assert.equal(titleOf('<title>Ein Beitrag | Beispiel</title>', / \| Beispiel$/), 'Ein Beitrag')
  assert.equal(titleOf('<title>Ohne Zusatz</title>'), 'Ohne Zusatz')
  assert.equal(titleOf('<p>kein Titel</p>'), null)
})

test('titleOf löst Entities auf', async () => {
  const { titleOf } = await load()

  assert.equal(titleOf('<title>A &amp; B &quot;C&quot;</title>'), 'A & B "C"')
})

/*
 * Das Gerüst ist der Grund für das Script: 472 KB HTML einer echten Site waren
 * 91 KB Text. Bliebe die Navigation stehen, wäre jedes Bündel zur Hälfte
 * dasselbe Menü.
 */
test('contentOf wirft Gerüst weg und behält den Inhalt', async () => {
  const { contentOf } = await load()
  const html = `
    <nav class="navbar"><a href="/">Start</a></nav>
    <main><h1>Titel</h1><p>Erster Absatz.</p><ul><li>Ein Punkt</li></ul></main>
    <footer>Impressum</footer>`
  const text = contentOf(html)

  assert.match(text, /# Titel/)
  assert.match(text, /Erster Absatz\./)
  assert.match(text, /- Ein Punkt/)
  assert.doesNotMatch(text, /Start|Impressum/)
  assert.doesNotMatch(text, /</)
})

test('contentOf kommt ohne den Container aus', async () => {
  const { contentOf } = await load()

  assert.match(contentOf('<p>Nur ein Absatz.</p>'), /Nur ein Absatz\./)
})

/*
 * Die Invariante, an der die Vollständigkeit hängt: Jede Seite landet in genau
 * einem Bündel, bei jedem Limit. Ein Packer, der die Seite fallen lässt, die
 * nicht mehr passt, liefert Bündel, die richtig aussehen.
 */
test('packBundles platziert jede Seite genau einmal, bei jedem Limit', async () => {
  const { packBundles } = await load()
  const pages = [1, 2, 3, 4, 5].map((n) => page(`T${n}`, `/u${n}`, 'x'.repeat(n * 1000)))

  for (const limit of [1, 999, 1000, 1001, 3000, 5000, 15001, 100000]) {
    const flat = packBundles(pages, limit).flat()
    assert.deepEqual(
      flat.map((p) => p.url).sort(),
      pages.map((p) => p.url).sort(),
      `Limit ${limit}`
    )
  }
})

test('packBundles hält das Limit ein, sobald mehr als eine Seite im Bündel ist', async () => {
  const { packBundles } = await load()
  const pages = [1, 2, 3, 4].map((n) => page(`T${n}`, `/u${n}`, 'x'.repeat(n * 1000)))

  for (const limit of [2500, 4000, 6000]) {
    for (const bundle of packBundles(pages, limit)) {
      const bytes = bundle.reduce((sum, p) => sum + Buffer.byteLength(p.text), 0)
      // Eine Seite, die allein schon größer ist als das Limit, kann nicht
      // geteilt werden — sie ist der einzige erlaubte Ausreißer.
      if (bundle.length > 1) assert.ok(bytes <= limit, `${bytes} > ${limit}`)
    }
  }
})

test('promptFrom setzt jeden Eintrag ein, wie viele es auch sind', async () => {
  const { promptFrom } = await load()

  for (const count of [0, 1, 7, 60]) {
    const entries = Array.from({ length: count }, (_, i) => ({ title: `T${i}`, url: `/u${i}` }))
    const prompt = promptFrom(prose, entries)
    for (const entry of entries) assert.ok(prompt.includes(entry.url))
  }
})

/*
 * Die Form wird gemessen, nicht geraten. Hier wird geprüft, dass die Messung
 * auch greift: Bei kleinem Budget muss gebündelt werden, bei großem nicht.
 */
test('chooseShape bündelt erst, wenn das Budget es erzwingt', async () => {
  const { chooseShape, providerUrlLength } = await load()
  const pages = Array.from({ length: 30 }, (_, i) =>
    page(`Ein Beitrag mit längerem Titel ${i}`, `https://example.org/p${i}.html`, 'x'.repeat(500))
  )
  const entryOf = {
    page: (p) => ({ title: p.title, url: `https://example.org/text/${p.url.slice(-8)}.md` }),
    bundle: (_, i) => ({ title: `Weitere ${i + 1}`, url: `https://example.org/text/b-${i + 1}.md` }),
  }

  const weit = chooseShape(pages, { prose, budget: 100000, reserve: 0, entryOf })
  const eng = chooseShape(pages, { prose, budget: 1200, reserve: 0, entryOf })

  assert.equal(weit.named.length, 30, 'bei viel Platz wird nichts gebündelt')
  assert.equal(weit.bundled.length, 0)
  assert.ok(eng.named.length < 30, 'bei wenig Platz wird gebündelt')
  assert.ok(eng.bundled.length > 0)

  // Und das Ergebnis hält das Budget wirklich ein.
  const entries = [...eng.named.map(entryOf.page), ...eng.bundled.map(entryOf.bundle)]
  assert.ok(providerUrlLength(prose, entries) <= 1200)
})

/*
 * Kardinalität: Keine Seite darf beim Umschichten verloren gehen. Der Schritt,
 * bei dem eine Seite aus der Einzelliste in die Bündel wandert, ist genau die
 * Stelle, an der ein Abzählfehler sie verschwinden ließe.
 */
test('chooseShape verliert keine Seite, bei welchem Budget auch immer', async () => {
  const { chooseShape } = await load()
  const pages = Array.from({ length: 25 }, (_, i) =>
    page(`Titel ${i}`, `https://example.org/p${i}.html`, 'x'.repeat(2000))
  )
  const entryOf = {
    page: (p) => ({ title: p.title, url: p.url }),
    bundle: (_, i) => ({ title: `B${i}`, url: `https://example.org/b${i}.md` }),
  }

  for (const budget of [300, 600, 900, 1500, 3000, 20000]) {
    const { named, bundled } = chooseShape(pages, { prose, budget, reserve: 0, entryOf })
    const seen = [...named, ...bundled.flat()].map((p) => p.url).sort()
    assert.deepEqual(seen, pages.map((p) => p.url).sort(), `Budget ${budget}`)
  }
})

test('slugOf macht aus einer URL einen Dateinamen ohne Pfadtrenner', async () => {
  const { slugOf } = await load()
  const site = 'https://example.org/'

  assert.equal(slugOf('https://example.org/pages/blog/ein-text.html', site), 'pages-blog-ein-text')
  assert.equal(slugOf('https://example.org/index.html', site), 'index')
  assert.doesNotMatch(slugOf('https://example.org/a/b/c.html', site), /[/\\]/)
})

/*
 * Manche Sites veröffentlichen neben dem HTML schon Text — Rohdateien, die
 * Jekyll unverändert durchreicht. Die Hub-Site selbst ist so: Ihre Rezepte und
 * Prompts sind .md-Dateien ohne Front Matter, und sie sind der eigentliche
 * Inhalt. Ein Generator, der nur HTML liest, übersieht genau die.
 */
test('readTextFiles findet Dateien, die schon Text sind', async () => {
  const { readTextFiles } = await load()
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tio-'))
  fs.mkdirSync(path.join(dir, 'rezepte'))
  fs.writeFileSync(path.join(dir, 'rezepte', 'rezept-0.md'), 'TalkItOver — Recipe 0\nText.\n')
  fs.writeFileSync(path.join(dir, 'notiz.txt'), '# Eine Notiz\n\nText.\n')
  fs.writeFileSync(path.join(dir, 'seite.html'), '<title>HTML</title><main><p>x</p></main>')

  const found = readTextFiles(dir, 'https://example.org/')

  assert.deepEqual(
    found.map((p) => p.url).sort(),
    ['https://example.org/notiz.txt', 'https://example.org/rezepte/rezept-0.md']
  )
  // Die Datei ist schon da, wo sie hingehört — sie wird nicht noch einmal
  // geschrieben, und der Prompt nennt ihre eigene Adresse.
  for (const page of found) assert.equal(page.asIs, true)
  fs.rmSync(dir, { recursive: true })
})

test('readTextFiles nimmt den Titel aus der ersten Zeile', async () => {
  const { readTextFiles } = await load()
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tio-'))
  fs.writeFileSync(path.join(dir, 'mit-raute.md'), '# Der Titel\n\nText.\n')
  fs.writeFileSync(path.join(dir, 'ohne-raute.md'), 'Der nackte Titel\n\nText.\n')
  fs.writeFileSync(path.join(dir, 'leer.md'), '\n\n\nText nach Leerzeilen.\n')

  const byName = Object.fromEntries(
    readTextFiles(dir, 'https://example.org/').map((p) => [p.url.split('/').pop(), p.title])
  )

  assert.equal(byName['mit-raute.md'], 'Der Titel')
  assert.equal(byName['ohne-raute.md'], 'Der nackte Titel')
  assert.equal(byName['leer.md'], 'Text nach Leerzeilen.')
  fs.rmSync(dir, { recursive: true })
})

/*
 * Die Invariante, die den Unterschied ausmacht: Eine Datei, die schon Text ist,
 * wird im Prompt unter ihrer eigenen Adresse genannt. Würde build() sie
 * kopieren, gäbe es dieselbe Datei zweimal auf der Site — und die Kopie würde
 * veralten.
 */
test('build nennt schon-Text-Dateien unter ihrer eigenen Adresse', async () => {
  const { build, readTextFiles } = await load()
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tio-'))
  fs.writeFileSync(path.join(dir, 'roh.md'), '# Roh\n\nSchon Text.\n')
  fs.writeFileSync(path.join(dir, 'seite.html'), '<title>Seite</title><main><p>Inhalt.</p></main>')

  const result = build({
    root: dir,
    out: path.join(dir, 'text'),
    siteUrl: 'https://example.org/',
    prose: 'Load {url}.\n\n{pages}\n',
    extraPages: readTextFiles(dir, 'https://example.org/'),
  })

  const urls = result.entries.map((e) => e.url)
  assert.ok(urls.includes('https://example.org/roh.md'), 'die Rohdatei unter ihrer Adresse')
  assert.ok(urls.includes('https://example.org/text/seite.md'), 'die HTML-Seite als Textfassung')
  assert.equal(fs.existsSync(path.join(dir, 'text', 'roh.md')), false, 'keine Kopie der Rohdatei')
  fs.rmSync(dir, { recursive: true })
})

/*
 * sections nennt die Seiten, die zuerst kommen sollen — sie überleben das
 * Budget, wenn es knapp wird. Der Vergleich muss den Pfad genau treffen:
 * "index.html" mit endsWith passt auch auf "en/findings/index.html", und dann
 * stehen alle Seiten auf demselben Rang. Auf der ersten Site mit
 * verschachtelten Pfaden ist genau das passiert.
 */
test('sections trifft den Pfad genau, nicht nur sein Ende', async () => {
  const { build } = await load()
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tio-'))
  for (const [file, title] of [
    ['index.html', 'Start'],
    ['a/index.html', 'A'],
    ['b/index.html', 'B'],
  ]) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true })
    fs.writeFileSync(path.join(dir, file), `<title>${title}</title><main><p>x</p></main>`)
  }

  const result = build({
    root: dir,
    out: path.join(dir, 'text'),
    siteUrl: 'https://example.org/',
    sections: ['index.html', 'b/index.html'],
    prose: 'Load {url}.\n\n{pages}\n',
  })

  assert.deepEqual(
    result.entries.map((e) => e.title),
    ['Start', 'B', 'A'],
    'die genannten Abschnitte in ihrer Reihenfolge, dann der Rest'
  )
  fs.rmSync(dir, { recursive: true })
})
