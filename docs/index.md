---
layout: default
title: Mach deine Site talkable
description: Ein Button, der deine Seite an den LLM deines Lesers übergibt. Ein Claude-Code-Lauf, ein PR, kein Betrieb.
---

<div class="hero">
{% include logo.svg %}

<h1>Dein Leser hat schon ein LLM. Gib ihm die Seite.</h1>

<p>Ein Button, der deine Site an den LLM deines Lesers übergibt. Du betreibst
nichts, zahlst nichts und hostest kein Modell.</p>

<div class="actions">
<talk-it-over
  url="https://llm-coding.github.io/Semantic-Anchors/llms-index.md?v=9e92517e"
  prompt="Load {url}. It is the index of one site: it names everything published&#10;there and holds none of it.&#10;&#10;Your fetch tool may refuse a link it only found inside that index, so&#10;every URL you need is here in my message.&#10;&#10;Pages about the project. A question about a workflow or a method is&#10;usually answered here, not by a single term:&#10;&#10;- About: https://llm-coding.github.io/Semantic-Anchors/about/&#10;- Spec-Driven Development: https://llm-coding.github.io/Semantic-Anchors/spec-driven-development/&#10;- Brownfield Workflow: https://llm-coding.github.io/Semantic-Anchors/brownfield/&#10;- Brownfield Experiment 1a Report: https://llm-coding.github.io/Semantic-Anchors/brownfield-experiment-report/&#10;- Brownfield Fair Comparison: https://llm-coding.github.io/Semantic-Anchors/brownfield-fair-comparison/&#10;- Socratic Code-Theory Recovery Skill: https://llm-coding.github.io/Semantic-Anchors/socratic-recovery-skill/&#10;- Semantic Contracts: https://llm-coding.github.io/Semantic-Anchors/contracts/&#10;- AgentSkill: https://llm-coding.github.io/Semantic-Anchors/agentskill/&#10;- Evaluations: https://llm-coding.github.io/Semantic-Anchors/evaluations/&#10;- Full Reference: https://llm-coding.github.io/Semantic-Anchors/all-anchors/&#10;- Changelog: https://llm-coding.github.io/Semantic-Anchors/changelog/&#10;- Contributing: https://llm-coding.github.io/Semantic-Anchors/contributing/&#10;&#10;The named terms by category, each file holding its terms in full:&#10;&#10;- Communication &amp; Presentation (1/2): https://llm-coding.github.io/Semantic-Anchors/bundles/communication-presentation-1.md&#10;- Communication &amp; Presentation (2/2): https://llm-coding.github.io/Semantic-Anchors/bundles/communication-presentation-2.md&#10;- Creative Writing: https://llm-coding.github.io/Semantic-Anchors/bundles/creative-writing.md&#10;- Design Principles &amp; Patterns (1/3): https://llm-coding.github.io/Semantic-Anchors/bundles/design-principles-1.md&#10;- Design Principles &amp; Patterns (2/3): https://llm-coding.github.io/Semantic-Anchors/bundles/design-principles-2.md&#10;- Design Principles &amp; Patterns (3/3): https://llm-coding.github.io/Semantic-Anchors/bundles/design-principles-3.md&#10;- Development Workflow: https://llm-coding.github.io/Semantic-Anchors/bundles/development-workflow.md&#10;- Dialogue Interaction: https://llm-coding.github.io/Semantic-Anchors/bundles/dialogue-interaction.md&#10;- Documentation: https://llm-coding.github.io/Semantic-Anchors/bundles/documentation.md&#10;- Knowledge Management: https://llm-coding.github.io/Semantic-Anchors/bundles/knowledge-management.md&#10;- Meta: https://llm-coding.github.io/Semantic-Anchors/bundles/meta.md&#10;- Problem Solving (1/2): https://llm-coding.github.io/Semantic-Anchors/bundles/problem-solving-1.md&#10;- Problem Solving (2/2): https://llm-coding.github.io/Semantic-Anchors/bundles/problem-solving-2.md&#10;- Requirements Engineering: https://llm-coding.github.io/Semantic-Anchors/bundles/requirements-engineering.md&#10;- Software Architecture (1/2): https://llm-coding.github.io/Semantic-Anchors/bundles/software-architecture-1.md&#10;- Software Architecture (2/2): https://llm-coding.github.io/Semantic-Anchors/bundles/software-architecture-2.md&#10;- Statistical Methods &amp; Process Monitoring: https://llm-coding.github.io/Semantic-Anchors/bundles/statistical-methods.md&#10;- Strategic Planning (1/2): https://llm-coding.github.io/Semantic-Anchors/bundles/strategic-planning-1.md&#10;- Strategic Planning (2/2): https://llm-coding.github.io/Semantic-Anchors/bundles/strategic-planning-2.md&#10;- Testing &amp; Quality Practices: https://llm-coding.github.io/Semantic-Anchors/bundles/testing-quality.md&#10;&#10;All the contracts in one file: https://llm-coding.github.io/Semantic-Anchors/contracts.txt&#10;Everything at once, large and likely cut short: https://llm-coding.github.io/Semantic-Anchors/llms.txt&#10;&#10;Use the index to find a term's category, then fetch that category above.&#10;If a fetch is refused, say so and ask me to paste the URL.&#10;&#10;When I ask for a link, give me the page a person can open — each bundle&#10;names it under the term — never the .md file you read from.&#10;&#10;Ask what I am looking for before you fetch anything. Then fetch what&#10;matches, read it, and answer from what you read. Keep it short and name&#10;where each answer came from.&#10;&#10;If nothing here fits, say so — do not answer from memory and do not go&#10;looking elsewhere."
  data-prompt="katalog@3"
  label="Let's talk it over"></talk-it-over>
</div>

<p class="muted">Kein Mockup: derselbe Button, den
<a href="https://llm-coding.github.io/Semantic-Anchors/">Semantic Anchors</a>
ausliefert. Er übergibt die ganze Site — 12 Doku-Seiten, 21 Contracts,
196 Begriffe.</p>
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
| Jekyll | in Arbeit |
| docToolchain | in Arbeit |
| Antora, Hugo, MkDocs | nicht in V1 |
