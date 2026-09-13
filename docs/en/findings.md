---
layout: default
permalink: /en/findings/
title: What we measured
description: Why an index of links opens nothing, what fits through a provider URL, and which assumptions we disproved while building.
lang: en
home: /en/
translation: /erkenntnisse/
translation_lang: de
translation_label: Deutsch
---

# What we measured

This project made one website talkable — [Semantic
Anchors](https://llm-coding.github.io/Semantic-Anchors/), 459 pages, 196 named
terms. Four assumptions fell along the way, all of which had sounded reasonable
beforehand.

What follows is measured, not assumed. Where there is a number, it came from an
experiment, and where an assumption is still open, we say so.

## A URL's provenance decides, not its format

The reader's LLM fetches a URL that **stood in the message it was given**. A URL
it only found *inside* a document it fetched, it refuses: "not in any prior
search or fetch result".

We checked the same file as `text/plain`, as `text/markdown`, and as HTML with
real `<a href>` links. Identical refusal. So this is not a format problem, and
no better file format solves it.

**The consequence hits the most obvious architecture.** "One index, then branch
from there" has two steps. Step one is allowed, step two is not. An index of
links *lists* a site; it does not *open* it.

## So the URLs belong in the prompt

The permitted channel had been there all along: the button writes the prompt,
the prompt becomes the user's message, and URLs in the user's message are
allowed. We had proved it without noticing — the index URL itself does get
fetched.

Two things came out of this:

Provenance counts **per message**, not only for the first one. When the reader
pastes a URL later, it is fetched. That is the emergency exit when something is
missing, and the prompt tells the LLM to ask for it rather than guess.

Whatever the prompt names is reachable. Whatever it leaves out may not be. That
turns the list in the prompt into an architectural decision, not decoration.

## Search solves provenance and loses the source

Search results are the second permitted provenance. An obvious route, and it
failed on measurement.

Four searches against `llm-coding.github.io` returned **five of its 459 pages**
and not one of the 196 terms. The pages are not at fault: they sit in the
`sitemap.xml`, `robots.txt` allows everything, and the homepage links 210 of
them in its served HTML. Everything that can be done has been done — and they
are still not indexed.

The unrestricted search was worse. It produced a fluent, plausible-sounding
answer about the project — **from a news site, GitHub, and two unrelated blogs**,
without ever touching the website. Provenance was satisfied; fidelity to the
source was gone.

That is exactly what a button is supposed to prevent: the reader wants to talk
to *this* site, not about it.

## The provider URL is the real limit

A click on "with Claude" opens `https://claude.ai/new?q=` plus the encoded
prompt. When that URL grows too long, the prompt goes to the clipboard and the
reader has to paste. One click becomes one chore.

Our ceiling sits at 6000 characters. The bill for Semantic Anchors:

| In the prompt | Characters encoded |
|---|---|
| 12 documentation pages with title and URL | ~1,500 |
| 20 anchor bundles | ~2,200 |
| Instructions and rules | ~1,900 |
| **Total** | **5,628 of 6,000** |

Encoding costs less than you would expect, by the way: a factor of 1.24, not 3.

**The 6000 is a guess.** In a probe, Cloudflare accepted a URL of 64,000
characters — `cf-mitigated: challenge`, not `414 URI Too Long`. So the transport
is not the limit. Whether the application behind it reads the whole parameter we
have not measured, and a silently truncated prompt is precisely the failure this
number guards against. Until that is measured, it stays.

## Bundles instead of leaves, so nothing sits behind a link

196 terms do not fit into the prompt as 196 URLs. Twenty do.

So: one bundle per category, carrying the full text of its terms. Large
categories are split — **at term boundaries, never inside one**. The other end
truncates long documents, and half an entry reads like a whole one. The LLM
would not notice, and neither would the reader.

Result: 20 files, 510 KB, largest 40 KB. After that, nothing sits behind a link
the LLM may not follow.

Whether 40 KB stays under the truncation limit, we do not know. All we have
measured is that 25 KB goes through.

## What you serve has to be readable

Three small findings, half a day each:

**`.adoc` is unreadable.** GitHub Pages does not know the extension and serves
`application/octet-stream` — a download. Every fetcher refuses it. `.md` arrives
as `text/markdown` and gets read. You cannot set custom headers on Pages, so the
file extension decides.

**A cache holds longer than you think.** An assistant answered from an index we
had replaced half an hour earlier, and named files that no longer appeared in
it. The remedy is a token derived from the content in the URL — not from a
timestamp, which throws away caching that harms no one.

**A 200 proves nothing.** A single-page app whose deploy copies `index.html` to
`404.html` answers *every* path with 200. We caught it because an invented path
returned 200. Check the title, not the status.

## A link is a page, not a file

Asked for "the link to the Diátaxis anchor", the LLM handed over the raw `.md`
file — a download, not something you send to a colleague.

It had nothing better. The bundle it had read from named no page at all, and the
index lists terms only by their `.md` URL.

The lesson is broader than the bug: **the files an LLM reads from are not the
addresses a person gets.** If you publish both, say which is which — ideally
where the LLM is already looking.

## A hand-maintained list goes stale. Ours did

Recipe 0 makes Claude Code stop when a site's index is maintained by hand: "A
button would go stale with the next commit."

We then wrote the page list for the prompt by hand ourselves. A demo chat caught
it — it named three pages it could not fetch. Checking against the router's
routes turned up **five missing pages**, two of which were missing from
`sitemap.xml` as well.

That list was already written in the project for the fourth time. The router
knows all of it; we wrote alongside it.

## The shape is measured, not chosen

How many pages the prompt names individually and how many it bundles is not a
drawing-board decision. It is arithmetic: as long as the pages fit into the
provider URL one by one, they are named one by one — then the LLM fetches
exactly the page in question instead of forty kilobytes of neighbourhood.

On a personal website with 43 pages the answer came out as 32 named, 11 in one
bundle, 5392 of 6000 characters. On Semantic Anchors with 459 pages the same
arithmetic gave twelve pages and twenty bundles. Two sites, one rule, two
shapes.

The generator deliberately stops short of the ceiling and leaves a tenth free.
Filled to the edge, the next blog post would overturn the shape — and with it
the URLs already travelling in conversations.

## Most sites have no generator

We had planned for three recipes: already LLM-readable, Jekyll, docToolchain.
The first outside site we looked at was none of them. No `_config.yml`, no
`Gemfile`, a `package.json` that minifies CSS and optimises images — the 43
HTML files sit hand-written in the repository.

Recipe 0 stops there, and rightly so. But "it stops" is no answer for someone
who wants a button. So there is now a recipe that **brings** the generator: it
reads the HTML files that are actually there, writes text versions, and builds
the prompt. 472 KB of HTML turned into 91 KB of text — the rest was the same
menu on every page.

## What is still open

Two numbers are guesses, and both are measurable:

The provider URL limit. A button with a deliberately long prompt shows whether
everything still arrives in the chat.

The fetch truncation limit. A question whose answer sits in the last entry of a
large bundle shows whether 40 KB goes through.

Until then the conservative values stand — and the test that guards them fails
before any reader notices.
