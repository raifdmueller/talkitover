---
layout: default
title: Mach deine Site talkable
description: Ein Button übergibt deine Site an den LLM deines Lesers. Die ganze Site, im Original — und du betreibst nichts.
---

<div class="hero">
{% include logo.svg %}

<h1>Mach deine Site talkable.</h1>

<p>Ein Button übergibt sie an den LLM deines Lesers. Die ganze Site, im
Original — und du betreibst nichts.</p>

<div class="actions">
{% include talkitover.html %}
</div>

<p class="muted">Kein Mockup: Der Button übergibt <em>diese</em> Site — die
Rezepte, die Prompts, die Erkenntnisse. Frag ihn, wie du anfängst.</p>
</div>

## Warum nicht einfach ein Chat-Widget

Weil du es betreiben müsstest. Ein gehostetes LLM bringt Kosten, Missbrauch und
einen Schlüssel, der nicht in dein Repo darf.

TalkItOver dreht das um: Der Leser bringt seinen LLM mit, deine Site reicht ihm
den Inhalt. Was er fragt, siehst du nie — und musst es auch nicht.

Probier den Button oben aus: Das Gespräch beginnt mit einer Frage an dich. Das
ist Absicht. Eine Zusammenfassung hättest du auch selbst lesen können.

## Was du bekommst

Du führst einen Prompt in Claude Code aus. Am Ende steht ein Pull Request in
deinem Repo:

| Im PR | Nicht im PR |
|---|---|
| Ein Button, der deiner Leserschaft den Index deiner Site übergibt | Kein vom LLM geschriebener Fließtext |
| `talkitover.js`, kopiert in dein Repo, MIT | Keine Laufzeitabhängigkeit von dieser Site |
| Bei Bedarf ein Generator plus Build-Schritt | Kein gehostetes LLM, kein API-Key |

Der Generator ist der Punkt. Was ein LLM heute schreibt, ist beim nächsten
Commit veraltet. Ein Script im Build ist es nicht.

## Wo der Button schon steht

Drei Sites übergeben ihren Inhalt heute an den LLM ihrer Leser, jede nach einem
anderen Rezept — darunter diese hier. Drei Formen, derselbe Button.
[Die Galerie]({{ site.baseurl }}/galerie/) zeigt alle drei, und ein wöchentlicher
Lauf prüft, ob sie noch funktionieren.

## Was wir dabei gelernt haben

Eine Site talkable zu machen ist keine Design-Frage, sondern eine Frage, was das
LLM des Lesers überhaupt abrufen darf. Vier Annahmen sind uns dabei um die Ohren
geflogen — nachgemessen und aufgeschrieben:
[Was wir gemessen haben]({{ site.baseurl }}/erkenntnisse/) —
auch [in English]({{ site.baseurl }}/en/findings/).

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
| HTML von Hand im Repo, Build-Schritt vorhanden | [Rezept 1]({{ site.baseurl }}/rezepte/rezept-1.md) |
| Jekyll | [Rezept Jekyll]({{ site.baseurl }}/rezepte/jekyll.md) |
| docToolchain | in Arbeit |
| Antora, Hugo, MkDocs | nicht in V1 |
