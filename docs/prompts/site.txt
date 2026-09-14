# Content-Typ „Site"

Version: site@1

Für Sites ohne Index: persönliche Websites, Blogs, kleine Projektseiten. Der
Prompt trägt die Seiten selbst — es gibt keine Datei, die sie auflistet, und es
muss auch keine geben.

Das Rezept nimmt **den Inhalt des ersten Codeblocks** dieser Datei, ersetzt
`{pages}` durch die Seitenliste aus dem Generator, setzt das Ergebnis als
`prompt`-Attribut in den Button und schreibt `data-prompt="site@1"` daneben.

**Der Unterschied zu `katalog`:** Dort gibt es einen Index, und der Prompt nennt
zusätzlich die Seiten, weil das LLM den Links im Index nicht folgen darf. Hier
gibt es gar keinen Index. Der Prompt *ist* die Liste, und jede genannte Datei
ist die Seite als Text — ein Abruf, kein Sprung.

**Warum Text und nicht die HTML-Seite:** Auf einer gemessenen Site waren 472 KB
HTML nur 91 KB Text; der Rest war auf jeder Seite dasselbe Menü. Wer die
HTML-Seiten übergibt, füllt das Fenster des Lesers mit Navigation.

**Warum „Page:" in jeder Datei:** Gefragt nach „dem Link" reichte ein LLM die
rohe Datei durch, aus der es gelesen hatte — einen Download, nichts, was man
einem Kollegen schickt. Es hatte nichts Besseres. Jede Textfassung nennt darum
oben die Adresse, die ein Mensch öffnen kann.

```
Load {url}. That is one page of a site, as plain text.

Your fetch tool may refuse a link it only found inside a document it fetched,
so every URL you might need is here in my message instead. Each file is one
page as text and names the address a person can open at the top.

{pages}

When I ask for a link, give me the page a person can open — each file names it
under "Page:" — never the .md file you read from.

Ask what I am looking for before you fetch anything. Then fetch what matches,
read it, and answer from what you read. Keep it short and name the page each
answer came from.

If nothing here fits, say so — do not answer from memory and do not go looking
elsewhere.
```
