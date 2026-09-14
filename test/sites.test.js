/*
 * Tests für die Galerie-Daten und ihre Prüfung.
 *
 * Der Netzlauf (npm run check:sites) kann nur sagen, ob eine Adresse antwortet.
 * Ob ein Eintrag überhaupt prüfbar IST — alle Felder da, Adressen absolut —
 * gehört hierher, wo es bei jedem Push läuft.
 */
const { test } = require('node:test')
const assert = require('node:assert/strict')

const { validate, REQUIRED } = require('./sites.check.js')
const sites = require('../docs/_data/sites.json')

const entry = (over = {}) => ({
  name: 'Beispiel',
  url: 'https://example.org/',
  script: 'https://example.org/talkitover.js',
  target: 'https://example.org/index.md',
  prompt: 'site@1',
  recipe: 'Rezept 1',
  recipe_en: 'Recipe 1',
  note: 'Eine Site.',
  note_en: 'A site.',
  since: '2026-01-01',
  ...over,
})

test('die echten Galerie-Daten sind vollständig und prüfbar', () => {
  assert.ok(sites.length > 0, 'die Galerie ist nicht leer')
  assert.deepEqual(validate(sites), [])
})

/*
 * Kardinalität: Jedes Pflichtfeld wird geprüft, nicht nur die, an die ich beim
 * Schreiben gedacht habe. Ein neues Pflichtfeld in REQUIRED wird hier
 * automatisch mitgeprüft.
 */
for (const field of REQUIRED) {
  test(`ein Eintrag ohne ${field} fällt auf`, () => {
    const broken = entry()
    delete broken[field]

    const problems = validate([broken])
    assert.equal(problems.length, 1)
    assert.match(problems[0], new RegExp(field))
  })
}

/*
 * Eine relative Adresse hat keinen Host. In der Galerie führt sie ins Leere,
 * und die Netzprüfung könnte sie gar nicht erst abrufen.
 */
for (const field of ['url', 'script', 'target']) {
  test(`${field} muss absolut sein`, () => {
    const problems = validate([entry({ [field]: '/talkitover.js' })])

    assert.equal(problems.length, 1)
    assert.match(problems[0], new RegExp(field))
  })
}

// Ohne Schrägstrich antwortet GitHub Pages mit 301, und ein Redirect ist eine
// Sache mehr, die schiefgehen kann — dieselbe Regel wie in den Rezepten.
test('die Adresse der Site endet auf einem Schrägstrich', () => {
  assert.deepEqual(validate([entry({ url: 'https://example.org' })]).length, 1)
  assert.deepEqual(validate([entry({ url: 'https://example.org/' })]), [])
})

test('zwei Einträge mit derselben Adresse fallen auf', () => {
  const problems = validate([entry(), entry({ name: 'Anders' })])

  assert.equal(problems.length, 1)
  assert.match(problems[0], /doppelt|zweimal/i)
})

test('der Prompt-Typ trägt eine Version', () => {
  assert.equal(validate([entry({ prompt: 'site' })]).length, 1)
  assert.deepEqual(validate([entry({ prompt: 'katalog@3' })]), [])
})

test('validate meldet jeden Fehler einzeln, nicht nur den ersten', () => {
  const problems = validate([entry({ url: '/x', script: '/y', prompt: 'ohne' })])

  assert.equal(problems.length, 3)
})


/*
 * Die Netzprüfung lief wochenlang grün, während eine Galerie-Site 31 ihrer 33
 * Adressen als text/markdown auslieferte. Zwei Gründe, beide hier behoben:
 * Sie akzeptierte jedes text/*, und sie prüfte genau eine Adresse.
 *
 * Diese Tests prüfen die Logik ohne Netz — was der Lauf aus einer Seite liest.
 */
test('addressesInPrompt findet die Dateien der eigenen Site', () => {
  const { addressesInPrompt } = require('./sites.check.js')
  const html =
    '<talk-it-over url="https://example.org/text/index.txt" ' +
    'prompt="Load https://example.org/text/index.txt&#10;' +
    '- Rezept: https://example.org/rezepte/eins.md&#10;' +
    '- Fremd: https://anderswo.org/x.txt"></talk-it-over>'

  assert.deepEqual(addressesInPrompt(html, 'https://example.org/'), [
    'https://example.org/text/index.txt',
    'https://example.org/rezepte/eins.md',
  ])
})

test('addressesInPrompt behauptet nichts über Sites, die den Prompt erst im Browser bauen', () => {
  const { addressesInPrompt } = require('./sites.check.js')

  assert.deepEqual(addressesInPrompt('<div id="app"></div>', 'https://example.org/'), [])
})

test('addressesInPrompt nennt jede Adresse einmal', () => {
  const { addressesInPrompt } = require('./sites.check.js')
  const html =
    '<talk-it-over prompt="https://example.org/a.txt und nochmal https://example.org/a.txt"></talk-it-over>'

  assert.deepEqual(addressesInPrompt(html, 'https://example.org/'), ['https://example.org/a.txt'])
})
