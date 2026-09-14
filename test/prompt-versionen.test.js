/*
 * Die Versionsnummer eines Prompts muss seinen Text meinen.
 *
 * `data-prompt="site@1"` steht in jedem Button, den ein Rezept gesetzt hat. Es
 * ist das einzige Mittel, später zu erkennen, welchen Text ein Button trägt —
 * und damit, welche Buttons ein Fund von heute betrifft.
 *
 * Am 14.09.2026 habe ich den Text aller drei Prompts geändert und keine Nummer
 * erhöht. Danach hieß `site@1` zweierlei, und das Mittel war stumpf. Kein Test
 * hat es gemerkt: Es gab keinen.
 *
 * Diese Tests binden die Nummer an den Text. Sie können nicht entscheiden, ob
 * eine Änderung sinnverändernd war — aber sie erzwingen, dass jemand
 * entscheidet, statt die Frage zu übersehen.
 */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const lock = require('./prompt-versionen.json')
const load = () => import('../scripts/prompt-versionen.mjs')

const DOCS = path.join(__dirname, '..', 'docs')

test('jeder Prompt deklariert eine Version und trägt sie in seinem Beispiel', async () => {
  const { readPrompts } = await load()
  const prompts = readPrompts()

  assert.ok(prompts.length >= 3, 'in docs/prompts liegen keine Prompts mehr')

  for (const prompt of prompts) {
    assert.ok(prompt.version, `${prompt.file}: kein "Version: <typ>@<n>" im Kopf`)
    assert.match(prompt.version, /^[a-z]+@\d+$/, `${prompt.file}: ${prompt.version}`)
    assert.ok(prompt.block, `${prompt.file}: kein Codeblock — da steht der Prompt drin`)

    // Die Datei erklärt selbst, was das Rezept in den Button schreiben soll.
    // Steht dort eine andere Nummer als im Kopf, baut das Rezept Buttons, die
    // über sich selbst falsch Auskunft geben.
    const imBeispiel = [...prompt.text.matchAll(/data-prompt="([^"]+)"/g)].map((m) => m[1])
    assert.deepEqual(
      [...new Set(imBeispiel)],
      [prompt.version],
      `${prompt.file}: Kopf sagt ${prompt.version}, das Beispiel sagt ${imBeispiel.join(', ')}`
    )
  }
})

/*
 * Der Rotbeweis dieses Tests ist der Grund, warum es ihn gibt: Ein Wort im
 * Prompt ändern, ohne die Nummer zu erhöhen, muss rot werden.
 */
test('ändert sich der Prompttext, passt der Fingerabdruck nicht mehr', async () => {
  const { readPrompts } = await load()

  for (const prompt of readPrompts()) {
    const notiert = lock[prompt.file]
    assert.ok(notiert, `${prompt.file}: kein Fingerabdruck notiert — npm run prompts:fingerprint`)
    assert.equal(
      prompt.fingerprint,
      notiert.fingerprint,
      `${prompt.file}: Der Prompttext hat sich geändert, notiert ist ${notiert.version}. ` +
        'Sinnverändernd? Dann Version erhöhen und eine Zeile "Was <typ>@<n> gegenüber ' +
        '@<n-1> gelernt hat" ergänzen. Nur Kosmetik? Dann npm run prompts:fingerprint.'
    )
    assert.equal(prompt.version, notiert.version, `${prompt.file}: Version ohne neuen Fingerabdruck`)
  }
})

/*
 * Eine Nummer ohne Begründung nützt niemandem. Wer einen Button mit
 * `katalog@3` findet, will wissen, was @4 anders macht.
 */
test('ab @2 steht in der Datei, was die Version gelernt hat', async () => {
  const { readPrompts } = await load()

  for (const prompt of readPrompts()) {
    const [typ, nummer] = prompt.version.split('@')
    if (Number(nummer) < 2) continue

    assert.match(
      prompt.text,
      new RegExp(`Was ${typ}@${nummer} gegenüber @${Number(nummer) - 1} gelernt hat`),
      `${prompt.file}: ${prompt.version} erklärt nicht, was es gegenüber @${Number(nummer) - 1} kann`
    )
  }
})

/*
 * Die Rezepte setzen die Buttons. Nennen sie eine alte Nummer, trägt jeder
 * neue Button den neuen Text unter dem alten Namen — genau der Fehler, den die
 * Nummer verhindern soll.
 */
test('die Rezepte nennen die Version, die der Prompt heute hat', async () => {
  const { readPrompts } = await load()
  const aktuell = new Map(readPrompts().map((p) => [p.version.split('@')[0], p.version]))
  const dir = path.join(DOCS, 'rezepte')

  const veraltet = []
  for (const file of fs.readdirSync(dir)) {
    const text = fs.readFileSync(path.join(dir, file), 'utf8')
    for (const [, genannt] of text.matchAll(/data-prompt="([a-z]+@\d+)"/g)) {
      const typ = genannt.split('@')[0]
      if (aktuell.has(typ) && aktuell.get(typ) !== genannt) {
        veraltet.push(`rezepte/${file}: ${genannt}, aktuell ist ${aktuell.get(typ)}`)
      }
    }
  }

  assert.deepEqual(veraltet, [])
})

/*
 * Der Prompt sprach nach der Umstellung auf .txt noch von "the .md file you
 * read from" — er beschrieb dem LLM eine Datei, die es nicht mehr gibt. Das
 * stand live auf drei Sites und fiel niemandem auf, weil kein Test in den
 * Prompt selbst gesehen hat.
 */
test('kein Prompt nennt dem LLM eine .md-Datei', async () => {
  const { readPrompts } = await load()

  for (const prompt of readPrompts()) {
    assert.doesNotMatch(
      prompt.block,
      /\.md\b/,
      `${prompt.file}: nennt .md — seit der Umstellung liefert die Site .txt aus`
    )
  }
})
