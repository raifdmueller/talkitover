# Content-Typ „Referenz"

Version: referenz@1

Für Seiten, die man nachschlägt: Anchors, Glossare, Templates, API-Referenzen.
Der Leser will eine Auskunft und die Stelle, an der sie steht – keine
Zusammenfassung der Seite.

Das Rezept nimmt **den Inhalt des ersten Codeblocks** dieser Datei, setzt ihn
als `prompt`-Attribut in den Button und schreibt `data-prompt="referenz@1"`
daneben. Ändert sich der Text sinnverändernd, steigt die Versionsnummer.

Die Prompts sind auf Englisch. Sie landen beim Leser, und die Ziel-Sites sind
international. Übersetzungen kommen später als `referenz.de.md`.

```
Load {url}. It is a reference page, and I want to use it — not have it summarised.

Ask me what I am trying to look up before you answer anything.

Then keep your answers short and name the section you took them from. If the
page does not cover what I ask, say so instead of filling the gap from memory.
```
