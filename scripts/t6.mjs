/**
 * T6 — die Grenze der Provider-URL messen, statt sie zu raten.
 *
 * MAX_URL_LENGTH steht in talkitover.js auf 6000. Der Wert war konservativ
 * gewählt und nie gemessen worden — und er ist mindestens um das Fünffache zu
 * vorsichtig: Claude wie ChatGPT nehmen 30000 Zeichen vollständig an.
 *
 * Angehoben wird er trotzdem noch nicht. 30000 ist gemessen als Untergrenze,
 * nicht als Grenze. Einen Wert auf die Kante des Gemessenen zu setzen wäre
 * wieder geraten, nur mit mehr Selbstvertrauen.
 *
 * Diese Seite baut Links mit Prompts bekannter Länge. Sie benutzt bewusst NICHT
 * das Web Component: das kappt selbst bei 6000 und fiele auf die Zwischenablage
 * zurück, wir würden also unsere eigene Grenze messen statt der des Anbieters.
 *
 * Jeder Prompt trägt seine Kennung in der ersten Zeile und eine Endmarke in der
 * letzten. Kommt die Endmarke im Chat an, war der Prompt vollständig. Kommt sie
 * nicht an, ist genau dort abgeschnitten worden.
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.join(import.meta.dirname, '..')
const OUT = path.join(ROOT, 'docs', 't6.html')

/*
 * Die Längen, bei denen wir nachsehen.
 *
 * 6000 war unsere Annahme. Gemessen am 14.09.2026: ChatGPT nimmt 30000
 * vollständig an — die Endmarke kam zurück. Das ist aber nur die obere Kante
 * dieser Liste gewesen, keine Grenze. Deshalb reicht sie jetzt weiter, bis
 * etwas bricht: Eine Untergrenze zu kennen ist besser als zu raten, aber die
 * Grenze zu kennen ist das Ziel.
 */
const LENGTHS = [6000, 30000, 50000, 100000, 200000]

const PROVIDERS = {
  claude: { name: 'Claude', base: 'https://claude.ai/new?q=' },
  chatgpt: { name: 'ChatGPT', base: 'https://chatgpt.com/?q=' },
}

/*
 * Fülltext aus echten Sätzen dieses Projekts. Zufallszeichen wären falsch:
 * encodeURIComponent bläht Text je nach Inhalt unterschiedlich auf (gemessen
 * 1,24 bis 1,27), und wir wollen die Grenze für echte Prompts kennen.
 */
const FILLER = [
  'Der Button übergibt die Site an das LLM des Lesers, nicht an ein gehostetes Modell.',
  'Es gibt keinen API-Key, keinen Dienst und nichts zu betreiben.',
  'Der Generator liest die gebaute Site und schreibt die Textfassungen.',
  'Was der Prompt nennt, ist erreichbar; was er auslässt, vielleicht nicht.',
  'Eine halbe Datei liest sich wie eine ganze — Abschneiden ist still.',
  'Die Bündelgrenze liegt bei 60 Kilobyte, und dass sie hält, ist gemessen.',
]

/** Der Prompt zu einer Kennung, mit `body` als Fülltext dazwischen. */
export function promptFor(id, body) {
  return [
    id,
    '',
    'Antworte mit genau zwei Zeilen, sonst nichts:',
    '1. die Kennung aus der ersten Zeile dieser Nachricht',
    '2. die allerletzte Zeile dieser Nachricht, wörtlich',
    '',
    'Hol nichts, such nichts. Wenn die letzte Zeile fehlt, sag das statt zu raten.',
    '',
    body,
    '',
    `ENDE ${id}`,
  ].join('\n')
}

/** So viele Zeilen Fülltext, dass die Provider-URL genau `target` lang wird. */
export function padTo(target, id, base) {
  const lengthWith = (body) => base.length + encodeURIComponent(promptFor(id, body)).length

  if (lengthWith('') > target) return null

  // Erst zeilenweise auffüllen, bis es knapp darunter passt.
  const lines = []
  while (lengthWith([...lines, FILLER[lines.length % FILLER.length]].join('\n')) <= target) {
    lines.push(FILLER[lines.length % FILLER.length])
  }
  let body = lines.join('\n')

  // Dann zeichenweise, bis es exakt sitzt. 'x' kodiert als ein Zeichen.
  while (lengthWith(body + 'x') <= target) body += 'x'
  return { body, length: lengthWith(body) }
}

export function build() {
  const rows = []
  for (const target of LENGTHS) {
    const cells = []
    for (const [key, provider] of Object.entries(PROVIDERS)) {
      const id = `T6-${target}-${key.toUpperCase()}`
      const padded = padTo(target, id, provider.base)
      if (!padded) throw new Error(`${target} ist kleiner als der leere Prompt`)
      const url = provider.base + encodeURIComponent(promptFor(id, padded.body))
      cells.push({ provider: provider.name, id, url, length: padded.length })
    }
    rows.push({ target, cells })
  }

  fs.writeFileSync(OUT, page(rows), 'utf-8')
  const exact = rows.every((r) => r.cells.every((c) => c.length === r.target))
  console.warn(
    `T6: ${rows.length} Längen x ${Object.keys(PROVIDERS).length} Anbieter` +
      `, Längen exakt getroffen: ${exact ? 'ja' : 'NEIN'}`
  )
  return rows
}

function page(rows) {
  const links = rows
    .map(
      (row) => `  <tr>
    <th scope="row">${row.target.toLocaleString('de-DE')}</th>
${row.cells
  .map(
    (cell) =>
      `    <td><a href="${cell.url}" rel="nofollow noopener">${cell.provider}</a>` +
      `<br><small>${cell.id}</small></td>`
  )
  .join('\n')}
  </tr>`
    )
    .join('\n')

  return `---
layout: default
title: T6 — wie lang darf die Provider-URL sein?
description: Messrig, keine Leseseite. Buttons mit Prompts bekannter Länge.
sitemap: false
---

<h1>T6 — wie lang darf die Provider-URL sein?</h1>

<p>Das ist kein Inhalt, sondern ein Messaufbau. <strong>Jeder Link öffnet einen
Chat mit einem Prompt genau der angegebenen Länge.</strong></p>

<h2>Was zu tun ist</h2>

<ol>
  <li>Link anklicken. Der Chat öffnet sich mit vorausgefülltem Prompt.</li>
  <li>Abschicken.</li>
  <li>Antwort ansehen: Kommt <code>ENDE T6-&lt;Länge&gt;-&lt;ANBIETER&gt;</code>
      zurück, war der Prompt vollständig. Fehlt die Zeile, wurde abgeschnitten.</li>
  <li><strong>Fang oben an.</strong> Klappt die längste, klappen alle darunter
      auch, und du bist fertig. Klappt sie nicht, arbeite dich nach unten: Die
      letzte Zeile, die noch klappt, ist die Grenze.</li>
</ol>

<p>Stand 14.09.2026: <strong>Beide Anbieter haben 30.000 vollständig
angenommen.</strong> Wo die Grenze wirklich liegt, ist offen — 30.000 war nur
die obere Kante der ersten Messreihe.</p>

<p>Die Links benutzen bewusst nicht den TalkItOver-Button: der kappt selbst bei
6000 Zeichen und fiele auf die Zwischenablage zurück. Wir würden dann unsere
eigene Annahme messen statt der Grenze des Anbieters — und genau die Annahme
steht ja zur Debatte.</p>

<table>
  <thead>
    <tr><th scope="col">Länge der URL</th><th scope="col">Claude</th><th scope="col">ChatGPT</th></tr>
  </thead>
  <tbody>
${links}
  </tbody>
</table>

<p><small>Erzeugt von <code>scripts/t6.mjs</code>. Der Fülltext besteht aus echten
Sätzen dieses Projekts, nicht aus Zufallszeichen: <code>encodeURIComponent</code>
bläht Text je nach Inhalt unterschiedlich auf, und gemessen werden soll die
Grenze für echte Prompts.</small></p>
`
}

if (import.meta.filename === process.argv[1]) build()
