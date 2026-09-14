---
layout: default
permalink: /galerie/
title: Wo der Button schon steht
description: Sites, die ihren Inhalt an das LLM ihrer Leser übergeben — mit Rezept, Prompt-Typ und einer wöchentlichen Prüfung, ob sie noch funktionieren.
lang: de
translation: /en/gallery/
translation_lang: en
translation_label: English
---

# Wo der Button schon steht

Jeder Eintrag ist ein Button in freier Wildbahn. Ein wöchentlicher Lauf prüft,
ob die Site noch antwortet, ob `talkitover.js` noch dort liegt, und ob das Ziel
des Buttons als Text ausgeliefert wird. Was hier steht, hat diese Prüfung
bestanden.

{% for site in site.data.sites %}
## [{{ site.name }}]({{ site.url }})

{{ site.note }}

<table>
<tr><td>Rezept</td><td>{{ site.recipe }}</td></tr>
<tr><td>Prompt</td><td><code>{{ site.prompt }}</code></td></tr>
<tr><td>Der Button übergibt</td><td><a href="{{ site.target }}"><code>{{ site.target | replace: 'https://', '' }}</code></a></td></tr>
<tr><td>Talkable seit</td><td>{{ site.since }}</td></tr>
</table>
{% endfor %}

## Deine Site fehlt hier

Dann [fang an]({{ site.baseurl }}/einstieg.txt) — ein Prompt in Claude Code, ein
Pull Request, kein Betrieb. Danach ein Issue im
[Repo](https://github.com/raifdmueller/talkitover/issues), und sie steht hier.

Wir tragen nur ein, was geprüft werden kann: die Adresse der Site, wo
`talkitover.js` liegt, und worauf der Button zeigt.
