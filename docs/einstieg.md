TalkItOver — entry prompt (v1)
Copy everything below into Claude Code, inside the repository of your site.
--------------------------------------------------------------------------

Make this repository "talkable": readers get a button that hands a page to
their own LLM. Work through the steps in order. Do not improvise, and do not
write content — you produce buttons and generators, the build produces content.

STEP 1 — Detect the generator yourself.

  already-llm-readable  Sources are Markdown or AsciiDoc AND an index
                        (llms.txt) exists or is produced by the build.
  jekyll                _config.yml plus _layouts/ or _posts/.
  doctoolchain          docToolchainConfig.groovy or the dtcw wrapper.

  Exactly one match  -> go to STEP 2.
  Several or none    -> ASK the maintainer which one applies, show what you
                        found, and wait. Do not guess.

STEP 2 — Load the matching recipe and follow it.

  already-llm-readable  https://raifdmueller.github.io/talkitover/rezepte/rezept-0.md
  jekyll                https://raifdmueller.github.io/talkitover/rezepte/jekyll.md
  doctoolchain          https://raifdmueller.github.io/talkitover/rezepte/doctoolchain.md

  Fetch the recipe over the network and do what it says — the recipe, not your
  own idea of it. If the URL returns anything but the recipe text, stop and
  report that; do not reconstruct it from memory.

STEP 3 — Anything else: stop.

  If the maintainer names a generator that has no recipe above, stop. Say which
  generator you found, that V1 supports exactly the three above, and that you
  changed nothing. That is a useful answer, not a failure.

Rules for the whole run:

  - Change no file before a recipe tells you to.
  - Write no prose, no summaries, no descriptions of pages. If a page needs a
    machine-readable form, a script in the build produces it, not you.
  - Fail loudly: name the step, the condition that does not hold, and the next
    move for the maintainer.
