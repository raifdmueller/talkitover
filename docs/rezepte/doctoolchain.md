TalkItOver — Recipe "docToolchain" (v1)
Applies when the site is built by docToolchain. The sources are AsciiDoc, the
build is a Gradle task, and the published pages are HTML — the AsciiDoc itself
never reaches the reader.

Same shape as Recipe 1 and the Jekyll recipe: the generator reads the BUILT
site, turns each page into text, and writes the prompt. What docToolchain adds
is where that step belongs and what its sites look like.

STEP 1 — Check the preconditions.

  a) A `docToolchainConfig.groovy` or the `dtcw` wrapper is in the repository.
  b) The build already publishes a site — look for the task that produces it
     (`generateSite`, a microsite task, or whatever the project wired up) and
     for the directory it writes into.

  (b) missing -> STOP. Say that the project builds documents but not a site,
  and that a button needs published pages to point at. Change nothing.

STEP 2 — Do NOT trust the sitemap.

  Measured on doctoolchain.org, three sites, 2026-09-14:

    docToolchain v4   109 entries, all of them https://localhost/...
    dacli              25 entries, all of them https://jbake.org/...
    Bausteinsicht      53 entries, correct
    all three          one dead entry each (lunrjsindex.html)

  Two of three carried a baseUrl that was never overridden, and every site had
  an entry that answers 404. A generator that reads the sitemap would produce a
  prompt full of addresses that lead nowhere.

  Walk the built directory instead. The files that are there are the truth.

  While you are at it: tell the maintainer. A sitemap pointing at localhost is
  broken for search engines too, and that is worth more to them than a button.

STEP 3 — Find the content container.

  Fetch two pages of the built site and find the element that wraps the article.
  On all three docToolchain sites it is a single `<main>`. Left out, every text
  version carries the same menu, and a bundle is half navigation.

STEP 4 — Vendor talkitover.js and install the generator.

  Download https://raifdmueller.github.io/talkitover/talkitover.js and
  https://raifdmueller.github.io/talkitover/vorlagen/talkitover-build.mjs and
  commit both. Do not rewrite the generator.

  Add one small script that calls build() with this project's values:

    root         the built site
    out          where the text versions go, inside the published tree
    siteUrl      the site's address, with a trailing slash
    sections     the landing pages, most important first, path exact
    container    the element from STEP 3
    extension    `.txt`
    groupOf      see STEP 5 — this one decides whether the prompt is usable
    bundleLimit  see STEP 6
    prose        the first fenced code block of
                 https://raifdmueller.github.io/talkitover/prompts/site.md

STEP 5 — Give the bundles names, or the prompt is useless.

  A docToolchain site is large. Without a grouping, the generator packs purely
  by size, and the prompt ends up naming "Weitere Seiten 17" thirty-eight times.
  The reader's LLM then has addresses without meaning and cannot choose which
  one to fetch — measured on doctoolchain.org before this rule existed.

  Group by the structure the site already has: the directory. One level is
  usually right. On doctoolchain.org that gives 21 groups with names a reader
  recognises — `dacli · spec`, `docToolchain v4 · 015_tasks`.

  Two levels split too finely (`dacli · arc42` held a single page), no level at
  all gives no names at all.

STEP 6 — Take the SMALLEST bundle limit that fits.

  Two limits work against each other. The provider URL must stay under 6000
  characters or the button falls back to the clipboard. The other end truncates
  long documents, and a truncated bundle is silent: the LLM answers from half a
  document without knowing.

  So raise the bundle limit only until the prompt fits, and not one step
  further. Measured across the three docToolchain sites, 184 pages, 1368 KB of
  text:

    40 KB   50 entries   provider URL 6169   over the limit
    60 KB   40 entries   provider URL 5285   fits
    80 KB   39 entries   provider URL 5385   fits
    120 KB  37 entries   provider URL 5320   fits

  60 KB is the answer there: the first that fits. The larger ones buy almost no
  entries and pay for it with bundles nobody has shown a fetcher will swallow.

  Nothing fits at any limit -> the site is too large for one button. Say so, and
  propose one button per product instead of one for the whole domain.

STEP 7 — Wire it into the build.

  The generator needs the built site, so it runs AFTER the site task and BEFORE
  publishing. Where that hook lives depends on how the project publishes:

    a CI workflow    add a step between the build and the upload
    a Gradle task    make the generator task depend on the site task, and the
                     publish task depend on the generator

  Prefer the Gradle route where the project has one: it keeps the step with the
  build that owns it, and it runs the same way on a laptop as in CI.

  Ignore the generated files in version control. They are derived, and they
  change whenever the content does.

STEP 8 — Place the button.

  Into the template the site already uses for every page — docToolchain sites
  have one. One button for the whole site, at the top where a reader decides
  what to do. Not in a footer, not floating.

  The prompt goes into the attribute on ONE physical line, its line breaks
  written as `&#10;`. A blank line inside an HTML attribute ends the element in
  most template pipelines and tears the page apart at exactly that spot.

STEP 9 — Check your own work, then open the pull request.

  Before committing, verify:
    [ ] The diff contains the vendored file, the generator, its configuration,
        the build wiring, one button, and nothing else.
    [ ] No file contains prose you wrote.
    [ ] The build runs twice in a row and produces the same prompt.
    [ ] Open two generated text files and read them. The article is there, the
        menu is not, and the first two lines are the title and "Page:".
    [ ] Every bundle in the prompt has a name a reader would recognise.
    [ ] Every URL in the prompt answers 200 with a text Content-Type.
    [ ] The provider URL stays under 6000 characters.

  Then open a pull request that says, in this order: what the reader gets, which
  files changed, that nothing has to be operated, and how to undo it. Name the
  numbers the generator reported, and mention the sitemap finding from STEP 2
  separately — it is a bug of theirs, not of this change.

If you stop at any step, say which step, which condition failed, and what the
maintainer can do about it. A clear stop beats a half-talkable site.
