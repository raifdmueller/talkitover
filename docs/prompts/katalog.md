# Content-Typ „Katalog"

Version: katalog@2

Für Index-Seiten: `llms.txt` nach Konvention, Inhaltsverzeichnisse, Anchor- und
Begriffslisten. Der Leser will nicht den Index besprechen, sondern über ihn
zu den zwei, drei Seiten finden, die seine Frage beantworten.

Das Rezept nimmt **den Inhalt des ersten Codeblocks** dieser Datei, setzt ihn
als `prompt`-Attribut in den Button und schreibt `data-prompt="katalog@2"`
daneben.

**Die Bedingung dahinter:** Der Button darf nur auf einen Index zeigen, der aus
Links besteht — eine Liste von Einträgen mit URL. Zeigt er auf eine Datei, die
die ganze Site als Volltext enthält, schneidet das LLM sie ab und antwortet aus
dem, was zufällig noch im Fenster stand. Groß und vollständig ist hier
schlechter als klein und verzweigt. Rezept 0 prüft das, bevor es den Button
setzt.

**Was katalog@2 gegenüber @1 gelernt hat:** Ein Leser fragte nach einem Thema,
zu dem die Site drei Doku-Seiten hat — und bekam eine Antwort allein aus dem
Begriffskatalog. Das LLM hatte den längsten Abschnitt des Index für den ganzen
Index gehalten. Und als zwei Abrufe scheiterten, suchte es still im Web weiter,
statt es zu sagen. Beides steht jetzt im Prompt.

```
Load {url}. It is an index of what one site publishes, not the content itself:
every entry links to a page or a file.

Read the whole index before you decide anything. It holds more than one kind of
entry — pages about the project, reference terms, whatever else the site keeps —
and the longest section is not automatically the one that answers me.

Ask me what I am looking for before you fetch anything.

Then fetch the entries that match, read them, and answer from what you read.
Keep it short and name the entry each answer came from.

If an entry will not load, say so plainly instead of working around it. If
nothing in the index fits, say that — do not answer from memory and do not go
looking elsewhere.
```
