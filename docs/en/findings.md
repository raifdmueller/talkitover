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
terms. Assumptions fell along the way, all of which had sounded reasonable
beforehand — our own among them, after it had stood on this page as a finding.

What follows is measured, not assumed. Where there is a number, it came from an
experiment, and where an assumption is still open, we say so.

## One observation is not a rule. This one stood on this page for a day

This page used to say: "The reader's LLM fetches a URL that stood in the message
it was given. A URL it found only *inside* a fetched document, it refuses." That
was this project's central finding. The whole architecture follows from it.

It is not true.

We had seen a real refusal, word for word: "not in any prior search or fetch
result". From that one observation we made a rule, without testing it a second
time. It stood here from 2026-09-13.

A day later we ran the test we owed it: fetch a file that contains three
addresses on **foreign** hosts, and ask for each of them to be fetched. Not one
of those addresses stood in the message.

Claude fetched all three. Asked what had stopped it: "no block, no timeout, no
domain restriction." ChatGPT fetched all three too, and said the same. The
provider makes no difference here.

It does keep a depth discipline. The fetched pages contained further addresses —
archive links — and it did **not** follow them, with a reason: they were not in
the file it had been asked about. It asked whether it should.

That is the difference we had missed: it is a **choice**, not a block. Choices
look like rules from the outside, until somebody tests them a second time.

## "Fetched" does not mean both read the same thing

Two of the three addresses in that test are 525-byte stubs: a
`<meta http-equiv="refresh">`, one sentence saying the post moved to the
archive, title "Umgezogen". The article lives elsewhere.

Claude saw the stub, reported it as a stub, and named the archive address.
ChatGPT reported that the page "contains the article" — and its citation carried
the title of the **archive page**, not "Umgezogen". Its fetcher followed the
redirect; Claude's did not.

Both reported truthfully what they had received. They had simply not received
the same thing. **So do not put your text versions behind a meta refresh** — one
reader gets the content, the other gets a one-liner, and neither of them notices.

## The other provider does not refuse — it invents

ChatGPT will not fetch `text/markdown` at all: "400 Unsupported content-type".
That alone would be harmless. But it does not tell the reader it lacks the file.
It searches the web instead and answers from whatever it finds.

Asked three times, wrong three times:

| Asked | Answered | In the file |
|---|---|---|
| Which `Page:` address is in this file? | `.../spec-driven-development` | three others; that term appears **zero** times |
| What is the last anchor in `design-principles-1`? | YAGNI, with a citation | Postel's Law. YAGNI is the last anchor of the *other* half |
| What is in this recipe? | fell back to GitHub raw, "129 lines" | 143 lines |

The second case teaches the most: right category, right shape, a real anchor
name, a citation mark — only the wrong file. Nobody catches that without the file
in hand.

This project's own prompt says, word for word, "do not answer from memory and do
not go looking elsewhere". Both were done. **A 400 is not a safe failure — it is
the trigger for an invented answer.**

That is why every file a prompt names here ends in `.txt`. Both providers read
`text/plain`; only one reads `text/markdown`.

**That this was the cause shows in the same question asked after the switch.**
Same file, same wording, only the extension changed:

| | ChatGPT answered |
|---|---|
| as `.md` | **YAGNI** — pieced together from the web, wrong file |
| as `.txt` | **Postel's Law** — right, read from the file |

One character in the extension decides whether a reader gets the content or
something invented about it.

## The architecture stands. Its reasoning was the wrong one

Everything in the prompt, depth 1, bundles instead of an index — that stays. But
no longer because following a link is forbidden. Because:

One provider follows of its own accord, and what is a choice can change between
versions, surfaces and settings. The other does not follow at all and invents
something in that place. A design that depends on neither property survives both.

The list in the prompt stays an architectural decision rather than decoration —
it just now carries the reason it actually has.

## So the URLs belong in the prompt

The safe channel was there all along: the button writes the prompt, the prompt
becomes the user's message, and URLs in the user's message get fetched — by both
providers, with no detour and no search.

Provenance counts **per message**, not only for the first. If the reader pastes a
URL later, it gets fetched. That is the emergency exit when something is missing,
and the prompt tells the LLM to ask for it rather than guess.

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

**That 6000 was a guess.** It is 20,000 by now, and the probe back then already
pointed the right way. In it, Cloudflare accepted a URL of 64,000
characters — `cf-mitigated: challenge`, not `414 URI Too Long`. The transport was
never the limit. Where it really sits is further down.

## Bundles instead of leaves, so nothing sits behind a link

196 terms do not fit into the prompt as 196 URLs. Twenty do.

So: one bundle per category, carrying the full text of its terms. Large
categories are split — **at term boundaries, never inside one**. The other end
truncates long documents, and half an entry reads like a whole one. The LLM
would not notice, and neither would the reader.

Result: 20 files, 510 KB, largest 40 KB. After that, nothing sits behind a link
the LLM may not follow.

The bundle limit is 60 KB by now, and that it holds is measured — see further
down.

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

## The truncation limit is around 100 KB, not 40

Measured on 2026-09-14, the same question both times: "What is the last entry in
this file?" Whoever knows the answer knows whether the file arrived whole.

| File | Size | Result in Claude |
|---|---|---|
| one bundle | 61 KB | **complete** — last entry named correctly |
| llms.txt | 544 KB | cut off inside the third category, at roughly 100 KB |

Our 60 KB bundle limit is therefore demonstrably in the safe range, not guessed.
Going higher would be possible — we do not: the gain would be one or two fewer
entries in the prompt, the stake a file we would again have to guess about.
Truncation is silent. Half a file reads like a whole one.

For ChatGPT the number was open for a long time, because the fetch failed at the
content type first. Since everything is `.txt` it is measurable — the same 61 KB
arrived whole there too.

## The limit is not the provider's but the reader's browser

6000 characters stood as `MAX_URL_LENGTH` in the web component — conservatively
chosen, never measured. Done on 2026-09-14, with links of exactly known length
and an end marker as the last line.

| URL length | Claude | ChatGPT | Browser |
|---|---|---|---|
| 30,000 | complete | complete | navigates |
| 50,000 | complete | complete | navigates |
| 100,000 | never saw it | never saw it | **refuses** |

The third case looks like a provider problem and is not one. The browser says
"this site can't be reached" before the request goes out — the provider never
sees the prompt at all.

**That is the real finding.** We went looking for the provider's limit. It is
not the one that counts: the browser sits in the path, and it is the **reader's**
browser, which we do not know. The effective limit is the minimum of the two,
and one half of it is not ours to measure.

So we stopped bisecting. "Between 50,000 and 100,000" is enough: a stricter
browser moves the number anyway, and knowing exactly where *one* browser gives
out does not help a reader using another.

`MAX_URL_LENGTH` has been **20,000** since — well under half of what held, not
at the edge of it. The old value was eight times too low.

What lets the number sit that high at all is the fallback: past the limit the
prompt goes to the clipboard. One more click, nothing lost. A limit set too low
costs every reader the one-click path and forces bundling that was never needed.

## What is still open

The limit of the browsers we did not measure. It is not measurable — we do not
know the reader's browser, which is why `MAX_URL_LENGTH` sits with a margin
rather than at the edge.

That is all. Every other number on this page came out of a test.
