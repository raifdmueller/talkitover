---
layout: default
permalink: /en/gallery/
title: Where the button already stands
description: Sites that hand their content to their readers' LLMs — with recipe, prompt type, and a weekly check that they still work.
lang: en
home: /en/
translation: /galerie/
translation_lang: de
translation_label: Deutsch
---

# Where the button already stands

Every entry is a button in the wild. A weekly run checks that the site still
answers, that `talkitover.js` is still there, and that the button's target is
served as text. What stands here has passed that check.

{% for site in site.data.sites %}
## [{{ site.name }}]({{ site.url }})

{{ site.note_en }}

<table>
<tr><td>Recipe</td><td>{{ site.recipe_en }}</td></tr>
<tr><td>Prompt</td><td><code>{{ site.prompt }}</code></td></tr>
<tr><td>The button hands over</td><td><a href="{{ site.target }}"><code>{{ site.target | replace: 'https://', '' }}</code></a></td></tr>
<tr><td>Talkable since</td><td>{{ site.since }}</td></tr>
</table>
{% endfor %}

## Your site is missing here

Then [get started]({{ site.baseurl }}/einstieg.md) — one prompt in Claude Code,
one pull request, nothing to operate. Then open an issue in the
[repository](https://github.com/raifdmueller/talkitover/issues), and it stands
here.

We only list what can be checked: the address of the site, where
`talkitover.js` sits, and what the button points at.
