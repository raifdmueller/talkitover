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

/*
 * Eine Textfassung trägt den Inhalt der Seite, nicht ihre Bedienelemente.
 *
 * Der Generator liest das HTML des ersten Jekyll-Durchlaufs — und darin gibt es
 * den Button noch nicht, weil dieses Script seine Daten erst schreibt. Stehen
 * bleibt, was das Template stattdessen rendert. Genau so kam der Satz "Der
 * Button fehlt: npm run build:talkitover lief nicht ..." in die ausgelieferte
 * Textfassung der Startseite und stand dort für jeden Leser.
 *
 * Geprüft wird deshalb die ausgelieferte Include-Datei selbst, nicht ein
 * Beispiel daneben: Nur so fällt der Test um, wenn jemand den Ersatztext
 * wieder in ein Tag setzt, das der Generator durchlässt.
 */
test('der Ersatztext des Includes landet nicht in der Textfassung', async () => {
  const { contentOf } = await load()
  const include = fs.readFileSync(
    path.join(__dirname, '..', 'docs/_includes/talkitover.html'),
    'utf8'
  )

  /* Was Jekyll rendert, wenn die Daten fehlen: der else-Zweig ohne Liquid. */
  const fallback = include
    .slice(include.indexOf('{%- else -%}'))
    .replace(/\{%-?[\s\S]*?-?%\}/g, '')

  assert.match(fallback, /Button fehlt/, 'der else-Zweig sagt weiterhin Bescheid')

  const text = contentOf(`<main><h1>Titel</h1>${fallback}<p>Inhalt.</p></main>`)

  assert.match(text, /# Titel/)
  assert.match(text, /Inhalt\./)
  assert.doesNotMatch(text, /Button fehlt/)
  assert.doesNotMatch(text, /build:talkitover/)
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
    bundle: (b, i) => ({ title: b.title, url: `https://example.org/text/b-${i + 1}.md` }),
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
    bundle: (b, i) => ({ title: b.title, url: `https://example.org/b${i}.md` }),
  }

  for (const budget of [300, 600, 900, 1500, 3000, 20000]) {
    const { named, bundled } = chooseShape(pages, { prose, budget, reserve: 0, entryOf })
    const seen = [...named, ...bundled.flatMap((b) => b.pages)].map((p) => p.url).sort()
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
  assert.ok(urls.includes('https://example.org/text/seite.txt'), 'die HTML-Seite als Textfassung')
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

/*
 * Jekyll rendert .md — auch ohne Front Matter, auf GitHub Pages immer. Eine
 * erzeugte Textfassung, die .md heißt, läuft damit ein zweites Mal durch
 * Liquid. Steht darin ein Liquid-Beispiel, bricht der Bau ab; steht ein
 * Ausdruck darin, verschwindet er still. Genau das hat einen Deploy gekostet.
 *
 * Mit .txt ist die Datei für Jekyll eine statische Datei: kein Liquid, kein
 * Layout, und text/plain ist abrufbar.
 */
test('build kann die Textfassungen unter einer anderen Endung ablegen', async () => {
  const { build } = await load()
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tio-'))
  fs.writeFileSync(path.join(dir, 'seite.html'), '<title>Seite</title><main><p>Inhalt.</p></main>')

  const result = build({
    root: dir,
    out: path.join(dir, 'text'),
    siteUrl: 'https://example.org/',
    prose: 'Load {url}.\n\n{pages}\n',
    extension: '.txt',
  })

  assert.deepEqual(
    result.entries.map((e) => e.url),
    ['https://example.org/text/seite.txt']
  )
  assert.equal(fs.existsSync(path.join(dir, 'text', 'seite.txt')), true)
  assert.equal(fs.existsSync(path.join(dir, 'text', 'seite.md')), false)
  fs.rmSync(dir, { recursive: true })
})

/*
 * Die Voreinstellung war '.md'. Sie ist es nicht mehr.
 *
 * Am 14.09.2026 gemessen: GitHub Pages liefert .md als text/markdown aus, und
 * ChatGPT antwortet darauf mit "400 Unsupported content-type". Es sagt das aber
 * nicht — es sucht weiter und antwortet aus dem, was es findet. Dreimal gefragt,
 * dreimal falsch, jedes Mal plausibel: einmal die Nachbardatei statt der
 * gefragten, einmal eine Adresse, die in der Datei null mal vorkommt.
 *
 * Eine Voreinstellung, die eine Site für einen Anbieter unlesbar macht und
 * stattdessen Erfundenes liefert, ist keine sichere Voreinstellung. '.txt'
 * nehmen beide.
 */
test('ohne Angabe ist es .txt — der einzige Typ, den beide Anbieter nehmen', async () => {
  const { build } = await load()
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tio-'))
  fs.writeFileSync(path.join(dir, 'seite.html'), '<title>Seite</title><main><p>Inhalt.</p></main>')

  const result = build({
    root: dir,
    out: path.join(dir, 'text'),
    siteUrl: 'https://example.org/',
    prose: 'Load {url}.\n\n{pages}\n',
  })

  assert.match(result.entries[0].url, /\.txt$/)
  fs.rmSync(dir, { recursive: true })
})

/*
 * Der Bündel-Dateiname muss dieselbe Endung tragen wie die URL im Prompt.
 * Diese Site erzeugt keine Bündel — der Fehler wäre erst auf der nächsten Site
 * aufgefallen, und dort als 404 auf einen Link, den der Prompt selbst nennt.
 */
test('Bündel liegen unter genau der Adresse, die der Prompt nennt', async () => {
  const { build } = await load()
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tio-'))
  for (let i = 0; i < 12; i += 1) {
    fs.writeFileSync(
      path.join(dir, `seite-${i}.html`),
      `<title>Eine Seite mit einem recht langen Titel ${i}</title><main><p>${'Inhalt. '.repeat(50)}</p></main>`
    )
  }

  const result = build({
    root: dir,
    out: path.join(dir, 'text'),
    siteUrl: 'https://example.org/',
    prose: 'Load {url}.\n\n{pages}\n',
    budget: 900,
    reserve: 0,
    extension: '.txt',
  })

  assert.ok(result.bundled.length > 0, 'bei diesem Budget muss gebündelt werden')
  for (const entry of result.entries) {
    const name = entry.url.split('/').pop()
    assert.equal(
      fs.existsSync(path.join(dir, 'text', name)),
      true,
      `${name} wird im Prompt genannt, liegt aber nicht da`
    )
  }
  fs.rmSync(dir, { recursive: true })
})

/*
 * Der Include liegt zweimal im Repo: als Vorlage, die fremde Sites
 * herunterladen, und als der Include, den diese Site selbst benutzt. Zwei
 * Fassungen driften auseinander — und dann liefert das Rezept etwas anderes
 * aus, als hier nachweislich funktioniert.
 */
test('die ausgelieferte Include-Vorlage und der eigene Include tun dasselbe', () => {
  const read = (...parts) =>
    fs.readFileSync(path.join(__dirname, '..', ...parts), 'utf8')
  // Der Kommentarkopf unterscheidet sich bewusst: die Vorlage nennt Herkunft
  // und Lizenz. Verglichen wird, was Jekyll ausführt.
  const code = (text) => text.replace(/\{%-?\s*comment[\s\S]*?endcomment\s*-?%\}/, '').trim()

  assert.equal(
    code(read('docs', '_includes', 'talkitover.html')),
    code(read('docs', 'vorlagen', 'talkitover-include.html'))
  )
})

/*
 * GitHub Pages führt Liquid auch in Dateien ohne Front Matter aus. Ein
 * Liquid-Beispiel in einem Rezept hat damit schon einmal den Deploy zerrissen —
 * und schlimmer: Claude Code liest diese Dateien und würde die Schutzmarken
 * mitkopieren.
 */
/*
 * Rezepte, Prompts und der Einstieg müssen .txt heißen.
 *
 * GitHub Pages liefert .md als text/markdown aus. ChatGPT antwortet darauf mit
 * "400 Unsupported content-type" — und sagt es dem Leser nicht, sondern sucht
 * im Netz weiter und antwortet aus dem, was es findet. Am 14.09.2026 dreimal
 * gemessen, dreimal falsch: einmal die Nachbardatei statt der gefragten, einmal
 * eine Adresse, die in der Datei null mal vorkommt. Ohne die Datei in der Hand
 * ist das nicht zu erkennen.
 *
 * .txt kommt als text/plain und wird von beiden Anbietern gelesen. Nebenbei
 * rendert Jekyll .md ohne Front Matter auf GitHub Pages als eigene Seite — die
 * stand dann ein zweites Mal im Prompt.
 */
/*
 * Ein Querverweis auf einen Schritt, den es nicht gibt, schickt Claude Code ins
 * Leere — und zwar mitten in einem Lauf in einem fremden Repo, wo niemand mehr
 * nachsehen kann, was gemeint war. Beim Einfügen eines neuen Schritts ist genau
 * das fast passiert: Die Nummern verschieben sich, die Verweise nicht.
 */
test('jeder Querverweis in einem Rezept zeigt auf einen Schritt, den es gibt', () => {
  const dir = path.join(__dirname, '..', 'docs', 'rezepte')

  for (const file of fs.readdirSync(dir)) {
    const text = fs.readFileSync(path.join(dir, file), 'utf8')
    const steps = new Set(
      [...text.matchAll(/^STEP (\d+) —/gm)].map((found) => Number(found[1]))
    )
    if (steps.size === 0) continue

    assert.deepEqual(
      [...steps].sort((a, b) => a - b),
      [...steps].map((_, index) => index + 1),
      `${file}: die Schritte sind nicht lückenlos von 1 an durchnummeriert`
    )

    const referenced = [...text.matchAll(/(?:see|from) STEP (\d+)/g)].map((f) => Number(f[1]))
    for (const number of referenced) {
      assert.ok(steps.has(number), `${file}: Verweis auf STEP ${number}, den es nicht gibt`)
    }
  }
})

test('Rezepte, Prompts und Einstieg heißen .txt', () => {
  const dir = path.join(__dirname, '..', 'docs')
  const wrong = [
    ...fs.readdirSync(path.join(dir, 'rezepte')).map((f) => `rezepte/${f}`),
    ...fs.readdirSync(path.join(dir, 'prompts')).map((f) => `prompts/${f}`),
    ...fs.readdirSync(dir).filter((f) => f.startsWith('einstieg.')),
  ].filter((f) => !f.endsWith('.txt'))

  assert.deepEqual(
    wrong,
    [],
    'Diese Dateien kämen als text/markdown und wären für ChatGPT unerreichbar'
  )
})

test('in Rezepten und Prompts steht kein Liquid', () => {
  const dir = path.join(__dirname, '..', 'docs')
  const files = [
    ...fs.readdirSync(path.join(dir, 'rezepte')).map((f) => ['rezepte', f]),
    ...fs.readdirSync(path.join(dir, 'prompts')).map((f) => ['prompts', f]),
    ['einstieg.txt'],
  ]

  for (const parts of files) {
    const text = fs.readFileSync(path.join(dir, ...parts), 'utf8')
    assert.doesNotMatch(text, /\{%|\{\{/, `${parts.join('/')} enthält Liquid`)
  }
})

/*
 * Auf einer Site mit 184 Seiten entstanden 38 Bündel, viele mit einer einzigen
 * Seite, und alle hießen "Weitere Seiten 17". Das LLM kann daraus nicht wählen:
 * Es sieht Adressen ohne Bedeutung.
 *
 * Also wird vor dem Packen nach einer natürlichen Grenze partitioniert — meist
 * dem Verzeichnis. Dann heißt ein Bündel "Handbuch" und nicht "Bündel 17".
 */
const group = (title, url, text, g) => ({ title, url, text, group: g })

test('packGroups mischt keine zwei Gruppen in ein Bündel', async () => {
  const { packGroups } = await load()
  const pages = [
    group('A1', '/a1', 'x'.repeat(10), 'Handbuch'),
    group('B1', '/b1', 'x'.repeat(10), 'Tutorial'),
    group('A2', '/a2', 'x'.repeat(10), 'Handbuch'),
  ]

  const bundles = packGroups(pages, 1000, (p) => p.group)

  for (const bundle of bundles) {
    const groups = new Set(bundle.pages.map((p) => p.group))
    assert.equal(groups.size, 1, 'ein Bündel, eine Gruppe')
  }
  assert.deepEqual(bundles.map((b) => b.group).sort(), ['Handbuch', 'Tutorial'])
})

test('packGroups verliert keine Seite, bei welchem Limit auch immer', async () => {
  const { packGroups } = await load()
  const pages = Array.from({ length: 20 }, (_, i) =>
    group(`T${i}`, `/p${i}`, 'x'.repeat(1000), `G${i % 4}`)
  )

  for (const limit of [500, 1000, 1500, 3000, 100000]) {
    const seen = packGroups(pages, limit, (p) => p.group).flatMap((b) => b.pages)
    assert.deepEqual(
      seen.map((p) => p.url).sort(),
      pages.map((p) => p.url).sort(),
      `Limit ${limit}`
    )
  }
})

test('packGroups nummeriert nur die Gruppen, die geteilt werden mussten', async () => {
  const { packGroups } = await load()
  const pages = [
    group('A1', '/a1', 'x'.repeat(600), 'Gross'),
    group('A2', '/a2', 'x'.repeat(600), 'Gross'),
    group('B1', '/b1', 'x'.repeat(10), 'Klein'),
  ]

  const bundles = packGroups(pages, 1000, (p) => p.group)

  assert.deepEqual(
    bundles.map((b) => b.title),
    ['Gross (1/2)', 'Gross (2/2)', 'Klein']
  )
})

test('ohne Gruppierung bleibt es beim reinen Packen nach Größe', async () => {
  const { packGroups } = await load()
  const pages = Array.from({ length: 4 }, (_, i) =>
    group(`T${i}`, `/p${i}`, 'x'.repeat(400), undefined)
  )

  const bundles = packGroups(pages, 1000)

  assert.equal(bundles.length, 2)
  assert.equal(bundles[0].title, 'Weitere Seiten (1/2)')
})

/*
 * Die Bündelgrenze ist eine geratene Zahl — gemessen ist nur, dass 25 KB
 * durchgehen. Wer eine Site mit anderer Textmenge baut, muss sie verschieben
 * können, ohne die Vorlage zu ändern.
 */
test('build reicht die Bündelgrenze durch', async () => {
  const { build } = await load()
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tio-'))
  for (let i = 0; i < 6; i += 1) {
    fs.writeFileSync(
      path.join(dir, `s-${i}.html`),
      `<title>Seite ${i}</title><main><p>${'x'.repeat(9000)}</p></main>`
    )
  }
  const common = {
    root: dir,
    out: path.join(dir, 'text'),
    siteUrl: 'https://example.org/',
    prose: 'Load {url}.\n\n{pages}\n',
    budget: 400,
    reserve: 0,
  }

  const eng = build({ ...common, bundleLimit: 10 * 1024 })
  const weit = build({ ...common, bundleLimit: 60 * 1024 })

  assert.ok(
    eng.bundled.length > weit.bundled.length,
    `enge Grenze muss mehr Bündel ergeben: ${eng.bundled.length} vs ${weit.bundled.length}`
  )
  fs.rmSync(dir, { recursive: true })
})
