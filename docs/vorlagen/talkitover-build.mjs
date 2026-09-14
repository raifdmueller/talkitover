/**
 * Erzeugt die Textfassungen und den Prompt für den TalkItOver-Button.
 *
 * Vorlage aus Rezept 1: https://raifdmueller.github.io/talkitover/rezepte/rezept-1.txt
 * MIT · https://github.com/raifdmueller/talkitover
 *
 * Warum das Script überhaupt nötig ist: Das LLM des Lesers holt nur URLs, die
 * in der Nachricht standen, die es bekommen hat. Eine URL, die es in einem
 * geholten Dokument gefunden hat, verweigert es. Ein Index aus Links öffnet
 * eine Site also nicht — die Adressen müssen in den Prompt.
 *
 * Und der Prompt passt nur, solange die Provider-URL nicht zu lang wird. Also
 * misst dieses Script, statt zu raten: Seiten werden einzeln genannt, solange
 * sie einzeln hineinpassen; der Rest wandert in Bündel.
 */
import fs from 'node:fs'
import path from 'node:path'

/** Über dieser Länge fällt der Button auf die Zwischenablage zurück. */
export const URL_BUDGET = 6000

/** Ab hier schneidet die Gegenseite lange Dokumente ab — konservativ gewählt. */
export const BUNDLE_LIMIT = 40 * 1024

// ─── Logik ───────────────────────────────────────────────────────────────────

export function titleOf(html, stripSuffix) {
  const found = html.match(/<title>([^<]*)<\/title>/i)
  if (!found) return null
  const title = decodeEntities(found[1]).trim()
  return stripSuffix ? title.replace(stripSuffix, '').trim() : title
}

/**
 * Der Inhalt ohne Navigation, Kommentare und Fußzeile.
 *
 * Das Gerüst wiederholt sich auf jeder Seite. Bliebe es stehen, bestünde ein
 * Bündel zur Hälfte aus demselben Menü, und das Größenlimit wäre nach der
 * halben Zahl Seiten erreicht.
 */
export function contentOf(html, container = 'main') {
  const inner = html.match(new RegExp(`<${container}[^>]*>([\\s\\S]*?)</${container}>`, 'i'))
  return toText(
    (inner ? inner[1] : html)
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
      .replace(/<(nav|footer|aside)[^>]*>[\s\S]*?<\/\1>/gi, '')
  )
}

/**
 * Packt Seiten in Bündel, ohne eine Seite zu zerschneiden.
 *
 * Die Gegenseite schneidet lange Dokumente ab. Eine halbe Seite liest sich wie
 * eine ganze — weder das LLM noch der Leser merkt es.
 */
export function packBundles(pages, limit = BUNDLE_LIMIT) {
  const bundles = []
  let current = []
  let bytes = 0

  for (const page of pages) {
    const size = Buffer.byteLength(page.text, 'utf-8')
    if (current.length && bytes + size > limit) {
      bundles.push(current)
      current = []
      bytes = 0
    }
    current.push(page)
    bytes += size
  }
  if (current.length) bundles.push(current)
  return bundles
}

/**
 * Packt nach Gruppen, damit ein Bündel einen Namen tragen kann.
 *
 * Gemessen an einer Site mit 184 Seiten: Ohne Gruppierung entstanden 38 Bündel,
 * viele mit einer einzigen Seite, alle namens „Weitere Seiten 17". Das LLM
 * bekommt damit Adressen ohne Bedeutung und kann nicht wählen, welche es holt.
 *
 * Die Grenze kommt von außen — meist das Verzeichnis. Ohne groupOf verhält es
 * sich wie packBundles, nur mit einem Namen davor.
 */
export function packGroups(pages, limit = BUNDLE_LIMIT, groupOf) {
  const order = []
  const byGroup = new Map()

  for (const page of pages) {
    const name = (groupOf ? groupOf(page) : undefined) || 'Weitere Seiten'
    if (!byGroup.has(name)) {
      byGroup.set(name, [])
      order.push(name)
    }
    byGroup.get(name).push(page)
  }

  const bundles = []
  for (const name of order) {
    const parts = packBundles(byGroup.get(name), limit)
    parts.forEach((group, index) => {
      bundles.push({
        group: name,
        // Nur was geteilt werden musste, trägt eine Nummer: Ein „(1/1)" hinter
        // jedem Namen ist Lärm.
        title: parts.length > 1 ? `${name} (${index + 1}/${parts.length})` : name,
        pages: group,
      })
    })
  }

  return bundles
}

export function promptFrom(prose, entries) {
  return prose.replace('{pages}', entries.map((e) => `- ${e.title}: ${e.url}`).join('\n'))
}

export function providerUrlLength(prose, entries) {
  const filled = promptFrom(prose, entries).replaceAll('{url}', entries[0] ? entries[0].url : '')
  return ('https://claude.ai/new?q=' + encodeURIComponent(filled)).length
}

/**
 * Wählt die Form: wie viele Seiten einzeln, wie viele im Bündel.
 *
 * Mit Reserve, nicht bis an die Kante. Bis an die Kante gefüllt würde der
 * nächste Beitrag die Form umwerfen — und mit ihr die URLs, die schon in
 * Gesprächen unterwegs sind.
 */
export function chooseShape(pages, {
  prose, budget = URL_BUDGET, reserve = 0.1, entryOf, groupOf,
  bundleLimit = BUNDLE_LIMIT,
}) {
  const ceiling = Math.floor(budget * (1 - reserve))
  let named = [...pages]
  let bundled = []

  for (;;) {
    const entries = [...named.map(entryOf.page), ...bundled.map(entryOf.bundle)]
    if (!named.length || providerUrlLength(prose, entries) <= ceiling) {
      return { named, bundled }
    }
    // Die letzte einzeln genannte Seite rutscht in die Bündel und wird neu
    // gepackt — sonst entstünden Bündel, die kleiner sind als das Limit.
    const rest = [...bundled.flatMap((b) => b.pages), named[named.length - 1]]
    named = named.slice(0, -1)
    bundled = packGroups(rest, bundleLimit, groupOf)
  }
}

export function slugOf(url, siteUrl) {
  return url
    .replace(siteUrl, '')
    .replace(/\.html?$/, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function decodeEntities(text) {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
}

/** Überschriften und Listen überleben als Markdown, alles andere wird Text. */
function toText(html) {
  const strip = (inner) => inner.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  return decodeEntities(
    html
      .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, l, inner) => `\n\n${'#'.repeat(Number(l))} ${strip(inner)}\n`)
      .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, inner) => `\n- ${strip(inner)}`)
      .replace(/<\/(p|div|tr|blockquote|section)>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ─── Komposition ─────────────────────────────────────────────────────────────

export function readPages(root, siteUrl, options = {}) {
  const { skip = [], container, stripSuffix } = options
  const found = []

  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      const relative = path.relative(root, full).split(path.sep).join('/')
      if (skip.some((s) => relative === s || relative.startsWith(`${s}/`))) continue
      if (entry.isDirectory()) walk(full)
      else if (entry.isFile() && /\.html?$/.test(entry.name)) {
        const html = fs.readFileSync(full, 'utf-8')
        const title = titleOf(html, stripSuffix)
        if (title) found.push({ title, url: siteUrl + relative, text: contentOf(html, container) })
      }
    }
  }

  walk(root)
  return found
}

/**
 * Dateien, die schon Text sind.
 *
 * Manche Sites veröffentlichen neben dem HTML Rohdateien — Jekyll reicht jede
 * Datei ohne Front Matter unverändert durch. Sie brauchen keine Umwandlung und
 * keine zweite Adresse: Der Prompt nennt sie, wie sie liegen.
 */
export function readTextFiles(root, siteUrl, options = {}) {
  const { extensions = ['.md', '.txt'], skip = [] } = options
  const found = []

  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      const relative = path.relative(root, full).split(path.sep).join('/')
      if (skip.some((s) => relative === s || relative.startsWith(`${s}/`))) continue
      if (entry.isDirectory()) walk(full)
      else if (entry.isFile() && extensions.some((e) => entry.name.endsWith(e))) {
        const text = fs.readFileSync(full, 'utf-8')
        found.push({ title: firstLineAsTitle(text, entry.name), url: siteUrl + relative, text, asIs: true })
      }
    }
  }

  walk(root)
  return found
}

/** Die erste Zeile mit Inhalt ist der Titel — mit oder ohne Raute davor. */
function firstLineAsTitle(text, fallback) {
  const line = text.split('\n').map((l) => l.trim()).find(Boolean)
  if (!line) return fallback
  return line.replace(/^#+\s*/, '').trim() || fallback
}

export function build(options) {
  const {
    root, out, siteUrl, sections = [], prose, dates = {}, budget, reserve,
    extraPages = [],
    // Grenze für die Bündel, meist das Verzeichnis. Ohne sie heißen alle
    // Bündel gleich, und das LLM kann nicht wählen, welches es holt.
    groupOf,
    // Geraten, nicht gemessen: Gemessen ist nur, dass 25 KB durchgehen. Wer
    // eine Site mit anderer Textmenge baut, verschiebt die Grenze hier.
    bundleLimit,
    // '.txt' ist die einzige Endung, die beide Anbieter nehmen: GitHub Pages
    // liefert .md als text/markdown aus, und ChatGPT antwortet darauf mit
    // "400 Unsupported content-type". Es verweigert dann nicht bloß — es sucht
    // im Netz weiter und antwortet aus dem, was es findet, ohne das zu sagen.
    // Gemessen am 14.09.2026: dreimal gefragt, dreimal falsch, jedes Mal
    // plausibel genug, um ohne die Datei in der Hand unbemerkt zu bleiben.
    //
    // Nebenbei rendert Jekyll .md auch ohne Front Matter — auf GitHub Pages
    // immer. Eine Textfassung mit dieser Endung liefe ein zweites Mal durch
    // Liquid und stünde zusätzlich als eigene Seite im Prompt.
    extension = '.txt',
  } = options
  const pages = readPages(root, siteUrl, { ...options, skip: [...(options.skip || []), outName(out)] })
  const ordered = order([...pages, ...extraPages], sections, dates, siteUrl)

  const directory = outName(out)
  const entryOf = {
    // Eine Datei, die schon Text ist, liegt bereits dort, wo sie hingehört.
    // Eine Kopie daneben wäre dieselbe Seite zweimal — und die Kopie veraltet.
    page: (page) =>
      page.asIs
        ? { title: page.title, url: page.url }
        : { title: page.title, url: `${siteUrl}${directory}/${slugOf(page.url, siteUrl)}${extension}` },
    bundle: (bundle, index) => ({
      title: bundle.title,
      url: `${siteUrl}${directory}/bundle-${index + 1}${extension}`,
      pages: bundle.pages.length,
    }),
  }

  const { named, bundled } = chooseShape(ordered, {
    prose, budget, reserve, entryOf, groupOf, bundleLimit,
  })

  fs.rmSync(out, { recursive: true, force: true })
  fs.mkdirSync(out, { recursive: true })
  for (const page of ordered) {
    if (page.asIs) continue
    fs.writeFileSync(path.join(out, `${slugOf(page.url, siteUrl)}${extension}`), asText(page), 'utf-8')
  }
  bundled.forEach((bundle, index) => {
    const header = `# ${bundle.title}\n\n> ${bundle.pages.length} Seiten im Volltext, von ${siteUrl}\n\n`
    fs.writeFileSync(
      path.join(out, `bundle-${index + 1}${extension}`),
      header + bundle.pages.map(asText).join('\n---\n\n') + '\n',
      'utf-8'
    )
  })

  const entries = [...named.map(entryOf.page), ...bundled.map(entryOf.bundle)]
  return {
    entries,
    prompt: promptFrom(prose, entries),
    url: entries.length ? entries[0].url : siteUrl,
    length: providerUrlLength(prose, entries),
    named: named.length,
    bundled: bundled.map((b) => ({ title: b.title, pages: b.pages.length })),
  }
}

/**
 * Abschnittsseiten zuerst, dann die jüngsten Beiträge.
 *
 * Was oben steht, wird einzeln genannt, wenn das Budget knapp wird. Nach den
 * jüngsten Beiträgen wird am häufigsten gefragt, und einzeln genannt heißt:
 * ein kleiner, genauer Abruf statt vierzig Kilobyte Nachbarschaft.
 */
function order(pages, sections, dates, siteUrl) {
  // Genau der Pfad, nicht nur sein Ende: "index.html" mit endsWith passt auch
  // auf "en/findings/index.html", und dann steht die halbe Site auf Rang null.
  const rank = (page) => {
    const index = sections.findIndex((s) => page.url === siteUrl + s)
    return index === -1 ? sections.length : index
  }
  return [...pages].sort(
    (a, b) =>
      rank(a) - rank(b) ||
      (dates[b.url] || '').localeCompare(dates[a.url] || '') ||
      a.url.localeCompare(b.url)
  )
}

const asText = (page) => `# ${page.title}\nPage: ${page.url}\n\n${page.text}\n`
const outName = (out) => path.basename(out)
