---
layout: default
title: Mach deine Site talkable
description: Ein Button, der deine Seite an den LLM deines Lesers übergibt. Ein Claude-Code-Lauf, ein PR, kein Betrieb.
---

# Dein Leser hat schon ein LLM. Gib ihm die Seite.

Wer eine Doku-Seite oder ein Transcript mit Claude besprechen will, kopiert
heute Text, rät URLs oder scheitert an JavaScript. Du könntest ein LLM hosten –
und hättest Kosten, Missbrauch und Betrieb am Hals.

TalkItOver dreht das um: Der Leser bringt seinen LLM mit, deine Site reicht ihm
den Inhalt. Du betreibst nichts.

## So fühlt sich das an

Der Button unten übergibt einen Anchor aus
[Semantic Anchors](https://llm-coding.github.io/Semantic-Anchors/) an deinen
LLM – den Originaltext, nicht eine Kopie.

<div class="actions">
<talk-it-over
  url="https://raw.githubusercontent.com/LLM-Coding/Semantic-Anchors/main/docs/anchors/diataxis-framework.adoc"
  prompt="Load {url}. It is a reference page, and I want to use it — not have it summarised.&#10;&#10;Ask me what I am trying to look up before you answer anything.&#10;&#10;Then keep your answers short and name the section you took them from. If the page does not cover what I ask, say so instead of filling the gap from memory."
  data-prompt="referenz@1"
  label="Let's talk it over"></talk-it-over>
</div>

<p class="muted">Das Gespräch beginnt mit einer Frage an dich. Das ist Absicht:
Eine Zusammenfassung hättest du auch selbst lesen können.</p>

## Was du bekommst

Du führst einen Prompt in Claude Code aus. Am Ende steht ein Pull Request in
deinem Repo:

| Im PR | Nicht im PR |
|---|---|
| Ein Button an Titel und Metadaten deiner Seiten | Kein vom LLM geschriebener Fließtext |
| `talkitover.js`, kopiert in dein Repo, MIT | Keine Laufzeitabhängigkeit von dieser Site |
| Bei Bedarf ein Generator plus Build-Schritt | Kein gehostetes LLM, kein API-Key |

Der Generator ist der Punkt. Was ein LLM heute schreibt, ist beim nächsten
Commit veraltet. Ein Script im Build ist es nicht.

## So fängst du an

1. [Einstiegs-Prompt kopieren]({{ site.baseurl }}/einstieg.md)
2. In Claude Code einfügen, im Repo deiner Site.
3. PR reviewen und mergen.

Claude Code erkennt deinen Generator selbst. Ist er nicht eindeutig, fragt er
dich. Kennt er ihn nicht, bricht er ab und sagt warum – er improvisiert nicht.

## Was heute geht

| Fall | Rezept |
|---|---|
| Quelltexte schon Markdown oder AsciiDoc, Index aus dem Build | [Rezept 0]({{ site.baseurl }}/rezepte/rezept-0.md) |
| Jekyll | in Arbeit |
| docToolchain | in Arbeit |
| Antora, Hugo, MkDocs | nicht in V1 |
