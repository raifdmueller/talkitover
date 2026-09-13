#!/usr/bin/env node
/*
 * Prüft den Demo-Button der Startseite gegen die Site, die er übergibt.
 *
 * Der Prompt steht als Kopie in docs/index.md — die Startseite hat keinen
 * Build-Schritt, der ihn holen könnte. Eine Kopie veraltet, und genau davor
 * warnt Rezept 0 in Schritt 2. Also wird sie geprüft statt gehofft.
 *
 * Netzwerk: läuft deshalb NICHT in `npm test`, sondern als eigener Lauf
 * (`npm run check:demo`) und wöchentlich in GitHub Actions. Ein Fehler hier
 * bedeutet: Die andere Site hat sich bewegt, unsere Kopie nicht.
 */
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')

const page = fs.readFileSync(path.join(__dirname, '..', 'docs', 'index.md'), 'utf8')

const decode = (value) =>
  value
    .replace(/&#10;/g, '\n')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')

const button = page.match(/<talk-it-over[\s\S]*?<\/talk-it-over>/)
if (!button) fail('Auf der Startseite steht kein <talk-it-over>-Button.')

const attribute = (name) => {
  const found = button[0].match(new RegExp(`${name}="([^"]*)"`))
  if (!found) fail(`Dem Button fehlt das Attribut ${name}.`)
  return found[1]
}

const problems = []
function fail(message) {
  console.error(`✗ ${message}`)
  process.exit(1)
}

async function main() {
  const url = attribute('url')
  const prompt = decode(attribute('prompt'))
  const index = new URL(url)
  const token = index.searchParams.get('v')

  const live = await fetch(index.origin + index.pathname).then((r) => {
    if (!r.ok) fail(`Der Index antwortet mit ${r.status}: ${index}`)
    return r.text()
  })

  // Der Cache-Token ist der Inhalts-Hash des Index. Weicht er ab, zeigt der
  // Button auf eine Fassung, die es nicht mehr gibt.
  const current = crypto.createHash('sha256').update(live).digest('hex').slice(0, 8)
  if (token !== current) {
    problems.push(`Cache-Token ist ${token}, der Index hat inzwischen ${current}.`)
  }

  // Jede URL im Prompt muss die Site noch kennen. Die Volltext-Datei steht
  // absichtlich nicht im Index — sie ist der letzte Ausweg, kein Eintrag.
  const urls = (prompt.match(/https:\/\/\S+/g) || []).map((u) => u.replace(/[.,]$/, ''))
  const unknown = urls.filter((u) => !live.includes(u) && !u.endsWith('/llms.txt'))
  if (unknown.length) {
    problems.push(`${unknown.length} URL(s) kennt der Index nicht mehr:\n    ${unknown.join('\n    ')}`)
  }

  if (problems.length) {
    console.error('✗ Der Demo-Button ist veraltet:')
    for (const p of problems) console.error(`  - ${p}`)
    console.error('\n  Neu erzeugen: den Prompt der Semantic-Anchors-Startseite übernehmen.')
    process.exit(1)
  }

  console.log(`✓ Demo-Button aktuell: ${urls.length} URLs, Token ${token}.`)
}

main().catch((err) => fail(err.message))
