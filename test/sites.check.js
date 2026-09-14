#!/usr/bin/env node
/*
 * Prüft die Galerie gegen die Sites, die sie zeigt.
 *
 * Ein Eintrag in der Galerie ist eine Behauptung: „Dieser Button funktioniert."
 * Behauptungen veralten — und ein toter Button in der Auslage kostet mehr
 * Vertrauen, als zwei lebende einbringen.
 *
 * Netzwerk: läuft deshalb NICHT in `npm test`, sondern als eigener Lauf
 * (`npm run check:sites`) und wöchentlich in GitHub Actions. Was ohne Netz
 * prüfbar ist — ob ein Eintrag überhaupt vollständig ist — steckt in validate()
 * und läuft bei jedem Push mit.
 */
const path = require('node:path')

/** Ohne diese Felder lässt sich ein Eintrag weder zeigen noch prüfen. */
const REQUIRED = [
  'name', 'url', 'script', 'target', 'prompt', 'since',
  // Beide Sprachen, sonst steht der Eintrag auf einer der beiden Galerie-Seiten
  // halb übersetzt — und niemand sieht es, der die andere liest.
  'recipe', 'recipe_en', 'note', 'note_en',
]

const ABSOLUTE = ['url', 'script', 'target']

/**
 * Logik: Was an den Daten falsch ist, ohne das Netz zu fragen.
 *
 * Meldet jeden Fehler einzeln. Wer drei Felder vergisst, will das in einem Lauf
 * erfahren und nicht dreimal hintereinander.
 */
function validate(sites) {
  const problems = []
  const seen = new Map()

  sites.forEach((site, index) => {
    const where = site.name || `Eintrag ${index + 1}`

    for (const field of REQUIRED) {
      if (!site[field]) problems.push(`${where}: ${field} fehlt.`)
    }
    for (const field of ABSOLUTE) {
      if (site[field] && !/^https:\/\//.test(site[field])) {
        problems.push(`${where}: ${field} ist keine absolute https-Adresse (${site[field]}).`)
      }
    }
    // Ohne Schrägstrich antwortet GitHub Pages mit 301, und ein Redirect ist
    // eine Sache mehr, die schiefgehen kann.
    if (site.url && /^https:\/\//.test(site.url) && !site.url.endsWith('/')) {
      problems.push(`${where}: url endet nicht auf einem Schrägstrich (${site.url}).`)
    }
    if (site.prompt && !/@\d+$/.test(site.prompt)) {
      problems.push(`${where}: prompt trägt keine Version (${site.prompt}).`)
    }
    if (site.url) {
      if (seen.has(site.url)) problems.push(`${where}: url steht doppelt in der Galerie.`)
      else seen.set(site.url, where)
    }
  })

  return problems
}

/**
 * Logik: Welche Dateien der Button laut Seite ausliefert.
 *
 * Der Prompt steht im Attribut des Elements. Sites, die ihn erst im Browser
 * bauen, geben hier nichts her — dort bleibt es beim geprüften Ziel. Lieber
 * weniger prüfen als etwas Falsches behaupten.
 */
function addressesInPrompt(html, siteUrl) {
  const attribute = html.match(/<talk-it-over[^>]*\sprompt="([^"]*)"/i)
  if (!attribute) return []

  const host = new URL(siteUrl).origin
  const found = attribute[1]
    .replace(/&#10;/g, '\n')
    .replace(/&amp;/g, '&')
    .match(new RegExp(`${host}/[A-Za-z0-9/._-]+\\.[A-Za-z0-9]{1,6}`, 'g'))

  return [...new Set(found || [])]
}

module.exports = { validate, REQUIRED, addressesInPrompt }

// ─── Der Netzlauf ────────────────────────────────────────────────────────────

async function head(url) {
  const response = await fetch(url)
  return {
    status: response.status,
    type: (response.headers.get('content-type') || '').split(';')[0].trim(),
    body: await response.text(),
  }
}

/*
 * Nur text/plain, nicht jedes text/*.
 *
 * Bis zum 14.09.2026 stand hier /^text\//, und genau deshalb hat diese Prüfung
 * wochenlang nichts gemeldet: text/markdown lief glatt durch. Gemessen hat es
 * ChatGPT dann anders gesehen — "400 Unsupported content-type", und statt das
 * zu sagen, sucht es im Netz weiter und antwortet aus dem, was es findet.
 *
 * Ein Ziel, das nur einer der beiden Anbieter lesen kann, ist ein halber
 * Button. Die Galerie behauptet aber einen ganzen.
 */
const READABLE = /^text\/plain$/

async function checkSite(site) {
  const problems = []

  const page = await head(site.url)
  if (page.status !== 200) problems.push(`Die Site antwortet mit ${page.status}.`)

  // Der Button steht auf manchen Sites erst nach dem Rendern im DOM. Die
  // eingebaute Datei liegt dagegen immer da, wo sie hingehört — sie ist das
  // verlässliche Zeichen, dass der Button noch installiert ist.
  const script = await head(site.script)
  if (script.status !== 200) problems.push(`talkitover.js antwortet mit ${script.status}.`)
  else if (!/TalkItOver v/.test(script.body)) {
    problems.push('Unter der script-Adresse liegt nicht talkitover.js.')
  }

  const target = await head(site.target)
  if (target.status !== 200) problems.push(`Das Ziel des Buttons antwortet mit ${target.status}.`)
  else if (!READABLE.test(target.type)) {
    problems.push(`Das Ziel kommt als ${target.type} — ChatGPT lehnt das ab und erfindet dann.`)
  }

  /*
   * Das Ziel ist eine Adresse von vielen. Der Prompt nennt alle, und jede davon
   * muss lesbar sein — sonst fehlt dem Leser genau der Teil, den er sucht.
   *
   * Auf rdmueller.github.io waren 31 von 33 Adressen .md, während das eine
   * geprüfte Ziel unauffällig blieb. Eine Stichprobe von eins ist keine.
   */
  for (const url of addressesInPrompt(page.body, site.url)) {
    const file = await head(url).catch((err) => ({ status: 0, type: err.message }))
    if (file.status !== 200) problems.push(`Im Prompt: ${url} antwortet mit ${file.status}.`)
    else if (!READABLE.test(file.type)) {
      problems.push(`Im Prompt: ${url} kommt als ${file.type}.`)
    }
  }

  const version = (script.body.match(/TalkItOver v([\d.]+)/) || [])[1]
  return { problems, version }
}

async function main() {
  const sites = require(path.join(__dirname, '..', 'docs', '_data', 'sites.json'))

  const broken = validate(sites)
  if (broken.length) {
    console.error('✗ Die Galerie-Daten sind unvollständig:')
    for (const p of broken) console.error(`  - ${p}`)
    process.exit(1)
  }

  let failed = 0
  for (const site of sites) {
    const { problems, version } = await checkSite(site).catch((err) => ({
      problems: [`Nicht erreichbar: ${err.message}`],
    }))
    if (problems.length) {
      failed += 1
      console.error(`✗ ${site.name} (${site.url})`)
      for (const p of problems) console.error(`  - ${p}`)
    } else {
      console.log(`✓ ${site.name} — talkitover.js v${version}, ${site.prompt}`)
    }
  }

  if (failed) {
    console.error(`\n${failed} von ${sites.length} Einträgen sind kaputt.`)
    process.exit(1)
  }
  console.log(`\n${sites.length} Einträge, alle lebendig.`)
}

if (require.main === module) main().catch((err) => { console.error(err.message); process.exit(1) })
