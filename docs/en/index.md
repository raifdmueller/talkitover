---
layout: default
permalink: /en/
title: Make your site talkable
description: One button hands your site to your reader's own LLM. The whole site, in the original — and you operate nothing.
lang: en
home: /en/
translation: /
translation_lang: de
translation_label: Deutsch
---

<div class="hero">
{% include logo.svg %}

<h1>Make your site talkable.</h1>

<p>One button hands it to your reader's own LLM. The whole site, in the
original — and you operate nothing.</p>

<div class="actions">
{% include talkitover.html %}
</div>

<p class="muted">Not a mockup: the button hands over <em>this</em> site — the
recipes, the prompts, the findings. Ask it how to start.</p>
</div>

## Why not just a chat widget

Because you would have to run it. A hosted LLM brings costs, abuse, and a key
that must not go into your repository.

TalkItOver turns that around: the reader brings their own LLM, your site hands
it the content. What they ask, you never see — and you do not need to.

Try the button above: the conversation starts with a question to you. That is
deliberate. A summary you could have read yourself.

## What you get

You run one prompt in Claude Code. At the end there is a pull request in your
repository:

| In the PR | Not in the PR |
|---|---|
| One button that hands your readers the index of your site | No prose written by an LLM |
| `talkitover.js`, copied into your repository, MIT | No runtime dependency on this site |
| Where needed, a generator plus a build step | No hosted LLM, no API key |

The generator is the point. What an LLM writes today is stale by the next
commit. A script in the build is not.

## Where the button already stands

Three sites hand their content to their readers' LLMs today, each by a
different recipe — this one among them. Three shapes, the same button.
[The gallery]({{ site.baseurl }}/en/gallery/) shows all three, and a weekly run
checks that they still work.

## What we learned doing it

Making a site talkable is not a design question. It is a question of what the
reader's LLM is allowed to fetch at all. Four assumptions fell over along the
way — measured and written down:
[What we measured]({{ site.baseurl }}/en/findings/).

## How to start

1. [Copy the entry prompt]({{ site.baseurl }}/einstieg.md)
2. Paste it into Claude Code, in the repository of your site.
3. Review the pull request and merge it.

Claude Code recognises your generator by itself. Where it is ambiguous, it
asks. Where it does not know it, it stops and says why — it does not improvise.

## What works today

| Case | Recipe |
|---|---|
| Sources already Markdown or AsciiDoc, index from the build | [Recipe 0]({{ site.baseurl }}/rezepte/rezept-0.md) |
| Hand-written HTML in the repository, a build step present | [Recipe 1]({{ site.baseurl }}/rezepte/rezept-1.md) |
| Jekyll | [Recipe Jekyll]({{ site.baseurl }}/rezepte/jekyll.md) |
| docToolchain | in progress |
| Antora, Hugo, MkDocs | not in V1 |

The recipes are written in English — they are read by Claude Code, not by you.
