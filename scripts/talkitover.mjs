/**
 * Baut den TalkItOver-Prompt für diese Site — die Hub-Site durch ihr eigenes
 * Rezept (E7, Issue #21).
 *
 * Läuft zwischen zwei Jekyll-Durchläufen: Der erste erzeugt das HTML, dieses
 * Script liest es und schreibt Textfassungen und den Prompt, der zweite rendert
 * damit den Button. Eine Runde weniger ginge nicht — Jekyll kann nichts
 * einsetzen, was es noch nicht gibt.
 */
import fs from 'node:fs'
import path from 'node:path'
import { build, readTextFiles, URL_BUDGET } from '../docs/vorlagen/talkitover-build.mjs'

const ROOT = path.join(import.meta.dirname, '..')
const BUILT = path.join(ROOT, '_site')
const TEXT = path.join(ROOT, 'docs', 'text')
const SITE_URL = 'https://raifdmueller.github.io/talkitover/'

/* Die Reihenfolge entscheidet, was einzeln genannt wird, wenn das Budget eng
 * wird. Wer hier landet, sucht das Rezept — nicht die Erkenntnisse. */
const SECTIONS = [
  'index.html',
  'einstieg.txt',
  'rezepte/rezept-0.txt',
  'rezepte/rezept-1.txt',
  'rezepte/jekyll.txt',
  'rezepte/doctoolchain.txt',
  'galerie/index.html',
  'erkenntnisse/index.html',
]

/* demo.html ist eine Testseite ohne Inhalt für Leser, t6.html ein Messaufbau aus
 * Fülltext. prd.adoc liefert GitHub Pages als application/octet-stream aus — ein
 * Fetcher lehnt das ab (#35). */
const SKIP = ['demo.html', 't6.html', 'text']

const prose = firstCodeBlock(fs.readFileSync(path.join(ROOT, 'docs/prompts/site.txt'), 'utf-8'))

/** Der Prompt ist der erste Codeblock der Content-Typ-Datei — wie im Rezept. */
function firstCodeBlock(markdown) {
  const found = markdown.match(/^```\n([\s\S]*?)^```/m)
  if (!found) throw new Error('In prompts/site.txt steht kein Codeblock.')
  return found[1].trimEnd()
}

const result = build({
  root: BUILT,
  out: TEXT,
  siteUrl: SITE_URL,
  sections: SECTIONS,
  skip: SKIP,
  stripSuffix: / · TalkItOver$/,
  extraPages: readTextFiles(BUILT, SITE_URL, { skip: SKIP }),
  // .txt, nicht .md: GitHub Pages rendert jede .md-Datei durch Liquid, auch
  // ohne Front Matter. Eine Textfassung mit .md liefe im zweiten Durchlauf ein
  // zweites Mal durch Liquid — und ein Liquid-Beispiel darin bricht den Bau ab.
  extension: '.txt',
  prose,
})

fs.writeFileSync(
  path.join(ROOT, 'docs', '_data', 'talkitover.json'),
  `${JSON.stringify({ url: result.url, prompt: result.prompt, version: 'site@2', length: result.length }, null, 2)}\n`,
  'utf-8'
)

console.warn(
  `TalkItOver: ${result.entries.length} Einträge (${result.named} einzeln, ` +
    `${result.bundled.length} Bündel), Provider-URL ${result.length} von ${URL_BUDGET}.`
)
