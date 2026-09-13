TalkItOver — Recipe 0: "already LLM-readable" (v2)
Applies when the sources are Markdown or AsciiDoc and the index comes from the
build. Nothing is generated here — you add ONE button that hands the site's
index to the reader's own LLM.

One button, not one per page. A button on a single page hands over that page and
nothing else: the reader's LLM then knows one section of your site and cannot
know the rest exists. The index lets it fetch whatever the question needs.

STEP 1 — Check the preconditions.

  a) Sources are plain Markdown or AsciiDoc and reachable as static text
     (raw file URL or published text file).
  b) An index exists: llms.txt by the convention, or an equivalent file.

  Either one missing -> STOP. Name which one, and that Recipe 0 does not apply.

  Then look at what the index actually IS. An index is a LIST OF LINKS: one
  entry per page, each with a URL, and no definitions. A file that carries the
  whole site as full text is a dump — every LLM truncates it and then answers
  from whatever happened to fit, confidently. Sites often name such a file
  llms.txt anyway; the convention reserves that name for the index and
  llms-full.txt for the dump.

  Dump instead of index -> STOP. Say that the site has a full-text file but no
  index, that a button pointing at it would mislead the reader, and that the
  generator recipes (Jekyll, docToolchain) can produce one. Change nothing.

  Then check the index COVERS the site: documentation, reference pages,
  whatever else is published — not one section of it. An index listing only the
  glossary promises a conversation about the site and delivers a corner of it.
  Incomplete -> say which parts are missing before you go on.

  Then check the entries can actually be FETCHED. Pick three and look at the
  response headers, not just the status:

    Content-Type must be text: text/plain, text/markdown, text/html. A server
      that does not know an extension declares application/octet-stream — a
      binary download — and web fetchers refuse it. GitHub Pages does this to
      .adoc, .rst and .org, among others. Status 200 proves nothing here.

    Size: a few hundred kilobytes is where fetchers start giving up. An entry
      that carries a whole book is not a link, it is a dead end.

    Redirects: a URL that answers 301 first adds a step that can fail. Link the
      address that answers directly — usually the one with the trailing slash.

  Entries that fail this -> the index needs to point at a fetchable form of the
  same content. For a build that already renders, that is one more output
  format, not new prose. Say so; do not set a button on links that lead nowhere.

STEP 2 — Check the Definition of Done (this is the step that protects the
maintainer, do not skip it).

  Find out how the index is produced. Look for a script in the build:
  package.json scripts, a Makefile target, a CI workflow step.

  Produced by the build  -> continue.
  Maintained by hand     -> STOP. Say: "The index is maintained by hand. A
                            button would go stale with the next commit.
                            This site needs a generator, which Recipe 0 does
                            not provide." Change nothing.

STEP 3 — Vendor talkitover.js.

  Download https://raifdmueller.github.io/talkitover/talkitover.js and commit it
  into the repository, next to the site's other static assets. Keep the header
  comment intact — it carries the version and the MIT licence. Do not load the
  file from a CDN or from the hub site at runtime.

STEP 4 — Place the one button.

  Where a reader arrives and decides what to do: the start page, near the
  headline, or in a header that every page shares. Not in a footer, not
  floating.

  <script src="PATH/talkitover.js"></script>
  <talk-it-over url="FULL-URL-OF-THE-INDEX" prompt="..." data-prompt="katalog@1"></talk-it-over>

  The url attribute names the index by a FULL URL with scheme and host. The
  reader's LLM receives nothing but the prompt text: a path like /llms.txt has
  no host to resolve against, so the file is unreachable for it. talkitover.js
  resolves a relative url against the current page, which saves the case where a
  template has no choice — but a build that knows its own address writes it out.

  If the site is a fork, use the upstream address.

STEP 5 — Fetch the content-type prompt.

  The site button hands over an index, so the type is:

    catalog    https://raifdmueller.github.io/talkitover/prompts/katalog.md

  Fetch that file and take the content of its FIRST fenced code block, verbatim,
  as the prompt attribute. Write the version from its header into data-prompt.

  Put the prompt on ONE physical line and write its line breaks as &#10; — a
  blank line inside an HTML attribute ends the HTML block in most Markdown
  renderers and tears the page apart. Escape quotes the way the target format
  requires.

  If the maintainer has already set a prompt attribute, leave the text alone and
  set data-prompt="custom". A later update must not overwrite their wording.

  A maintainer who wants per-page buttons in addition can use the "reference"
  type (prompts/referenz.md). Do not add them on your own: they multiply across
  every page and hand over a fragment each.

STEP 6 — Check your own work, then open the pull request.

  Before committing, verify:
    [ ] The diff contains one button, the vendored file, and nothing else.
    [ ] No file contains prose you wrote. No summaries, no generated
        descriptions, no "About this page".
    [ ] The button's url resolves to the index (fetch it and look), and three
        sampled entries answer with a text Content-Type, without a redirect,
        small enough to read.
    [ ] The site still builds.

  Then open a pull request that says, in this order: what the reader gets, which
  files changed, that nothing has to be operated, and how to undo it.

If you stop at any step, say which step, which condition failed, and what the
maintainer can do about it. A clear stop beats a half-talkable site.
