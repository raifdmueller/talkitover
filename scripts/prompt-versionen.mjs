/**
 * Bindet die Versionsnummer eines Prompts an seinen Text.
 *
 * `referenz.txt` schreibt die Regel selbst hin: „Ändert sich der Text
 * sinnverändernd, steigt die Versionsnummer." Am 14.09.2026 habe ich den Text
 * aller drei Prompts geändert und keine Nummer erhöht. Damit hieß `site@1`
 * zwei Tage lang zweierlei, und ein Button mit `data-prompt="site@1"` sagte
 * nicht mehr, welchen Text er trägt — wofür die Nummer allein da ist.
 *
 * Deshalb liegt neben jedem Prompt ein Fingerabdruck seines Codeblocks. Ändert
 * sich der Block, wird der Test rot, und die Frage „neue Nummer oder nicht?"
 * muss beantwortet werden. Der Fingerabdruck ersetzt kein Urteil — er erzwingt
 * nur, dass eines gefällt wird.
 *
 * Erneuern nach einer bewussten Entscheidung:  npm run prompts:fingerprint
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

export const PROMPT_DIR = path.join(import.meta.dirname, '..', 'docs', 'prompts')
export const LOCK = path.join(import.meta.dirname, '..', 'test', 'prompt-versionen.json')

/** Die Version, die der Kopf der Datei deklariert. */
export function declaredVersion(text) {
  return text.match(/^Version: (\S+)$/m)?.[1] ?? null
}

/**
 * Der erste Codeblock — das ist der Prompt, alles andere ist Kommentar.
 *
 * Die Versionsnummer beschreibt, was beim Leser ankommt. Wer die Herleitung
 * darüber umformuliert, ändert nichts am Prompt und soll keine Nummer erhöhen
 * müssen.
 */
export function promptBlock(text) {
  return text.match(/^```\n([\s\S]*?)\n```/m)?.[1] ?? null
}

export function fingerprint(block) {
  return crypto.createHash('sha256').update(block, 'utf8').digest('hex').slice(0, 16)
}

/** Datei für Datei: Name, deklarierte Version, Fingerabdruck des Prompts. */
export function readPrompts(dir = PROMPT_DIR) {
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.txt'))
    .sort()
    .map((file) => {
      const text = fs.readFileSync(path.join(dir, file), 'utf8')
      const block = promptBlock(text)
      return {
        file,
        text,
        version: declaredVersion(text),
        block,
        fingerprint: block ? fingerprint(block) : null,
      }
    })
}

export function write(dir = PROMPT_DIR, lock = LOCK) {
  const entries = Object.fromEntries(
    readPrompts(dir).map((prompt) => [prompt.file, { version: prompt.version, fingerprint: prompt.fingerprint }])
  )
  fs.writeFileSync(lock, `${JSON.stringify(entries, null, 2)}\n`, 'utf8')
  console.warn(`Fingerabdrücke erneuert: ${Object.keys(entries).join(', ')}`)
  return entries
}

if (import.meta.filename === process.argv[1]) write()
