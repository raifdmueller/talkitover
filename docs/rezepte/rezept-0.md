TalkItOver — Recipe 0: "already LLM-readable" (v1)
Applies when the sources are Markdown or AsciiDoc and the index comes from the
build. Nothing is generated here — you add an index reference and a button.

STEP 1 — Check the preconditions.

  a) Sources are plain Markdown or AsciiDoc and reachable as static text
     (raw file URL or published text file).
  b) An index exists: llms.txt, or an equivalent list of the content.

  Either one missing -> STOP. Name which one, and that Recipe 0 does not apply.

  Then look at what the index actually is. An index is a LIST OF LINKS: one
  entry per page, each with a URL. A file that carries the whole site as full
  text is a dump, not an index — every LLM truncates it and then answers from
  whatever happened to fit. Sites often name such a file llms.txt anyway; the
  convention reserves that name for the index and llms-full.txt for the dump.

  Dump instead of index -> the per-page buttons still work, they point at single
  pages. A catalog button (STEP 5) does not: say so, and leave it out rather
  than pointing it at the dump.

STEP 2 — Check the Definition of Done (this is the step that protects the
maintainer, do not skip it).

  Find out how the index is produced. Look for a script in the build:
  package.json scripts, a Makefile target, a CI workflow step.

  Produced by the build  -> continue.
  Maintained by hand     -> STOP. Say: "llms.txt is maintained by hand. A
                            button would go stale with the next commit.
                            This site needs a generator, which Recipe 0 does
                            not provide." Change nothing.

STEP 3 — Vendor talkitover.js.

  Download https://raifdmueller.github.io/talkitover/talkitover.js and commit it
  into the repository, next to the site's other static assets. Keep the header
  comment intact — it carries the version and the MIT licence. Do not load the
  file from a CDN or from the hub site at runtime.

STEP 4 — Place the button.

  One button per content page, at the title or the metadata line — where the
  reader looks before deciding to read. Not in a footer, not floating.

  <script src="PATH/talkitover.js"></script>
  <talk-it-over url="URL-OF-THE-SOURCE-TEXT" prompt="..." data-prompt="TYPE@VERSION"></talk-it-over>

  The url attribute points at the ORIGINAL source text, not at a copy you made:
  the raw file in the upstream repository, or the published text file. If the
  site is a fork, use the upstream URL.

STEP 5 — Fetch the content-type prompt.

  Pick the type that matches the page:

    reference  Pages people look things up in — anchors, glossaries, templates.
               https://raifdmueller.github.io/talkitover/prompts/referenz.md

    catalog    Index pages: llms.txt by the convention, tables of contents,
               term lists. Only when the index is a list of links (STEP 1).
               https://raifdmueller.github.io/talkitover/prompts/katalog.md

  Fetch that file and take the content of its FIRST fenced code block, verbatim,
  as the prompt attribute. Write the version from its header into data-prompt,
  for example data-prompt="referenz@1".

  Put the prompt on ONE physical line and write its line breaks as &#10; — a
  blank line inside an HTML attribute ends the HTML block in most Markdown
  renderers and tears the page apart. Escape quotes the way the target format
  requires.

  If the maintainer has already set a prompt attribute, leave the text alone and
  set data-prompt="custom". A later update must not overwrite their wording.

STEP 6 — Check your own work, then open the pull request.

  Before committing, verify:
    [ ] The diff contains buttons, the vendored file, and nothing else.
    [ ] No file contains prose you wrote. No summaries, no generated
        descriptions, no "About this page".
    [ ] Every button's url resolves to text (fetch one and look).
    [ ] The site still builds.

  Then open a pull request that says, in this order: what the reader gets, which
  files changed, that nothing has to be operated, and how to undo it.

If you stop at any step, say which step, which condition failed, and what the
maintainer can do about it. A clear stop beats a half-talkable site.
