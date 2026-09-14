/*
 * Tests für den Messaufbau T6.
 *
 * Ein Messaufbau, der die falsche Länge baut, misst die falsche Grenze — und
 * niemand merkt es, weil das Ergebnis trotzdem plausibel aussieht. Deshalb
 * prüfen diese Tests die Rechnung, nicht die Seite.
 */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const fs = require('node:fs')

const load = () => import('../scripts/t6.mjs')

const CLAUDE = 'https://claude.ai/new?q='
const CHATGPT = 'https://chatgpt.com/?q='

test('padTo trifft die Ziellänge auf das Zeichen genau', async () => {
  const { padTo, promptFor } = await load()

  for (const base of [CLAUDE, CHATGPT]) {
    for (const target of [4000, 6000, 8000, 12000, 20000, 30000]) {
      const id = `T6-${target}-X`
      const padded = padTo(target, id, base)
      const real = base.length + encodeURIComponent(promptFor(id, padded.body)).length

      assert.equal(real, target, `${base} bei ${target}`)
      assert.equal(padded.length, target)
    }
  }
})

/*
 * Die Endmarke ist das ganze Messinstrument: Kommt sie im Chat an, war der
 * Prompt vollständig. Steht sie nicht als LETZTE Zeile, misst der Versuch
 * nichts — dann fehlt sie auch bei einem Prompt, der vollständig ankam.
 */
test('die Endmarke steht ganz am Schluss und trägt die Kennung', async () => {
  const { promptFor, padTo } = await load()
  const id = 'T6-8000-CLAUDE'
  const { body } = padTo(8000, id, CLAUDE)
  const prompt = promptFor(id, body)
  const lines = prompt.split('\n')

  assert.equal(lines.at(-1), `ENDE ${id}`)
  assert.equal(lines[0], id, 'die Kennung steht auch vorn, sonst ist die Antwort nicht zuzuordnen')
  assert.equal(prompt.split(`ENDE ${id}`).length - 1, 1, 'die Endmarke kommt genau einmal vor')
})

/*
 * Der Fülltext darf nicht aus Zufallszeichen bestehen. encodeURIComponent
 * bläht Text je nach Inhalt unterschiedlich auf; gemessen werden soll die
 * Grenze für echte Prompts, nicht für eine günstige Zeichenverteilung.
 */
test('der Fülltext hat den Aufblähfaktor echter Prompts', async () => {
  const { padTo, promptFor } = await load()
  const id = 'T6-12000-CLAUDE'
  const { body } = padTo(12000, id, CLAUDE)
  const prompt = promptFor(id, body)
  const factor = encodeURIComponent(prompt).length / prompt.length

  assert.ok(factor > 1.15, `Aufblähfaktor ${factor.toFixed(3)} — zu glatt für echten Text`)
  assert.ok(factor < 1.45, `Aufblähfaktor ${factor.toFixed(3)} — unrealistisch hoch`)
})

test('jede Länge bekommt beide Anbieter, und jede Kennung ist eindeutig', async () => {
  const { build } = await load()
  const rows = build()
  const ids = rows.flatMap((row) => row.cells.map((cell) => cell.id))

  assert.equal(new Set(ids).size, ids.length)
  for (const row of rows) {
    assert.deepEqual(
      row.cells.map((cell) => cell.provider),
      ['Claude', 'ChatGPT']
    )
    for (const cell of row.cells) assert.equal(cell.length, row.target)
  }
})

/*
 * Der Messaufbau darf die Site nicht verschmutzen: Die Seite besteht aus
 * Fülltext und gehört nicht in den Prompt des eigenen Buttons.
 */
test('t6.html ist vom Site-Prompt ausgenommen', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'talkitover.mjs'), 'utf8')
  const skip = source.match(/const SKIP = \[([^\]]*)\]/)

  assert.ok(skip, 'scripts/talkitover.mjs hat keine SKIP-Liste mehr')
  assert.match(skip[1], /'t6\.html'/)
})
