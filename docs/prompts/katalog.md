# Content-Typ „Katalog"

Version: katalog@1

Für Index-Seiten: `llms.txt` nach Konvention, Inhaltsverzeichnisse, Anchor- und
Begriffslisten. Der Leser will nicht den Index besprechen, sondern über ihn
zu den zwei, drei Seiten finden, die seine Frage beantworten.

Das Rezept nimmt **den Inhalt des ersten Codeblocks** dieser Datei, setzt ihn
als `prompt`-Attribut in den Button und schreibt `data-prompt="katalog@1"`
daneben.

**Die Bedingung dahinter:** Der Button darf nur auf einen Index zeigen, der aus
Links besteht — eine Liste von Einträgen mit URL. Zeigt er auf eine Datei, die
die ganze Site als Volltext enthält, schneidet das LLM sie ab und antwortet aus
dem, was zufällig noch im Fenster stand. Groß und vollständig ist hier
schlechter als klein und verzweigt. Rezept 0 prüft das, bevor es den Button
setzt.

```
Load {url}. It is an index of reference pages, not the content itself: every
entry links to a source file.

Ask me what I am looking for before you fetch anything.

Then fetch only the entries that match, read them, and answer from what you
read. Keep it short and name the entry each answer came from. If no entry fits,
say so instead of answering from memory.
```
