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
