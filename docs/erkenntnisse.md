---
layout: default
permalink: /erkenntnisse/
title: Was wir gemessen haben
description: Warum ein Index aus Links nichts öffnet, was durch eine Provider-URL passt, und welche Annahmen wir beim Bauen widerlegt haben.
lang: de
translation: /en/findings/
translation_lang: en
translation_label: English
---

# Was wir gemessen haben

Dieses Projekt hat eine Website talkable gemacht — [Semantic
Anchors](https://llm-coding.github.io/Semantic-Anchors/), 459 Seiten, 196
Begriffe. Dabei sind vier Annahmen gefallen, die vorher plausibel klangen.

Was hier steht, ist gemessen, nicht vermutet. Wo eine Zahl steht, kommt sie aus
einem Versuch, und wo eine Annahme offen ist, sagen wir es.

## Die Herkunft einer URL entscheidet, nicht ihr Format

Das LLM des Lesers holt eine URL, die **in der Nachricht stand**, die es bekommen
hat. Eine URL, die es nur *in* einem geholten Dokument gefunden hat, verweigert
es: „not in any prior search or fetch result".

Wir haben das für dieselbe Datei als `text/plain`, als `text/markdown` und als
HTML mit echten `<a href>` geprüft. Identische Verweigerung. Es ist also kein
Format-Problem, und kein besseres Dateiformat löst es.

**Die Konsequenz trifft die naheliegendste Architektur.** „Ein Index, und von
dort verzweigen" ist zweistufig. Stufe eins ist erlaubt, Stufe zwei nicht. Ein
Index aus Links *listet* eine Site, er *öffnet* sie nicht.

## Also gehören die URLs in den Prompt

Der erlaubte Kanal war die ganze Zeit da: Der Button schreibt den Prompt, der
Prompt wird zur Nachricht des Nutzers, und URLs in der Nachricht des Nutzers
sind erlaubt. Bewiesen hatten wir das längst, ohne es zu merken — die Index-URL
selbst wird ja geholt.

Zwei Dinge, die dabei herauskamen:

Die Herkunft zählt **pro Nachricht**, nicht nur für die erste. Fügt der Leser
später eine URL ein, wird sie geholt. Das ist der Notausgang, wenn etwas fehlt,
und der Prompt sagt dem LLM, es soll danach fragen statt zu raten.

Was der Prompt nennt, ist erreichbar. Was er auslässt, vielleicht nicht. Damit
wird die Liste im Prompt zur Architekturentscheidung — nicht zu Dekoration.

## Suchen löst die Herkunft und verliert die Quelle

Suchergebnisse sind die zweite erlaubte Herkunft. Naheliegend, und in der
Messung durchgefallen.

Vier Suchen gegen `llm-coding.github.io` lieferten **fünf von 459 Seiten**,
keinen einzigen der 196 Begriffe. Die Seiten sind nicht schuld: Sie liegen in
der `sitemap.xml`, die `robots.txt` erlaubt alles, und die Startseite verlinkt
210 von ihnen im ausgelieferten HTML. Handwerklich ist alles getan — indexiert
ist es trotzdem nicht.

Schlimmer war die erste Suche ohne Domain-Filter. Sie lieferte eine flüssige,
richtig klingende Antwort über das Projekt — **aus heise, GitHub und zwei
fremden Blogs**, ohne die Website je zu berühren. Die Herkunftsregel war
erfüllt, die Treue zur Quelle war weg.

Genau das soll ein Button verhindern: Der Leser will mit *dieser* Seite reden,
nicht über sie.

## Die Provider-URL ist die eigentliche Grenze

Ein Klick auf „mit Claude" öffnet `https://claude.ai/new?q=` plus den kodierten
Prompt. Wird die URL zu lang, landet der Prompt in der Zwischenablage und der
Leser muss einfügen. Aus einem Klick wird ein Handgriff.

Unser Deckel steht bei 6000 Zeichen. Die Rechnung für Semantic Anchors:

| Im Prompt | Zeichen kodiert |
|---|---|
| 12 Doku-Seiten mit Titel und URL | ~1 500 |
| 20 Anker-Bündel | ~2 200 |
| Anweisungen und Regeln | ~1 900 |
| **Summe** | **5 628 von 6 000** |

Die Kodierung kostet übrigens weniger, als man denkt: Faktor 1,24, nicht 3.

**Die 6000 sind geraten.** In einer Sonde hat Cloudflare eine URL mit 64 000
Zeichen angenommen — `cf-mitigated: challenge`, kein `414 URI Too Long`. Die
Leitung ist also nicht die Grenze. Ob die Anwendung dahinter den ganzen
Parameter liest, haben wir nicht gemessen, und ein still abgeschnittener Prompt
ist genau der Fehler, gegen den die Zahl schützt. Bis das gemessen ist, bleibt
sie stehen.

## Bündel statt Blätter, damit nichts hinter einem Link liegt

196 Begriffe passen nicht als 196 URLs in den Prompt. 20 passen.

Also ein Bündel pro Kategorie, mit dem Volltext seiner Begriffe. Große
Kategorien werden geteilt — **an Begriffsgrenzen, nie mittendrin**: Die
Gegenseite schneidet lange Dokumente ab, und ein halber Eintrag liest sich wie
ein ganzer. Das LLM würde es nicht merken und der Leser auch nicht.

Ergebnis: 20 Dateien, 510 KB, größte 40 KB. Danach liegt nichts mehr hinter
einem Link, den das LLM nicht holen darf.

Ob 40 KB unter der Abschneidegrenze liegen, wissen wir nicht. Gemessen ist nur,
dass 25 KB durchgehen.

## Was ausgeliefert wird, muss auch lesbar sein

Drei kleine Befunde, die je einen halben Tag gekostet haben:

**`.adoc` ist unlesbar.** GitHub Pages kennt die Endung nicht und liefert
`application/octet-stream` — einen Download. Jeder Fetcher lehnt das ab. `.md`
kommt als `text/markdown` und wird gelesen. Eigene Header kann man auf Pages
nicht setzen, also entscheidet die Dateiendung.

**Ein Cache hält länger als gedacht.** Ein Assistent antwortete aus einem Index,
den wir eine halbe Stunde vorher ersetzt hatten, und nannte Dateien, die darin
nicht mehr vorkamen. Die Abhilfe ist ein Token aus dem Inhalt in der URL — nicht
aus dem Zeitstempel, sonst wirft man Caching weg, das niemandem schadet.

**„200" beweist gar nichts.** Eine Single-Page-App, deren Deploy `index.html`
nach `404.html` kopiert, antwortet auf *jeden* Pfad mit 200. Wir haben es
gemerkt, weil ein erfundener Pfad 200 lieferte. Prüfe den Titel, nicht den
Status.

## Ein Link ist eine Seite, keine Datei

Gefragt nach „dem Link zum Diátaxis-Anker" reichte das LLM die rohe
`.md`-Datei — einen Download, nichts, was man einem Kollegen schickt.

Es hatte nichts Besseres. Das Bündel, aus dem es gelesen hatte, nannte
überhaupt keine Seite, und der Index listet Begriffe nur mit ihrer `.md`-URL.

Die Lehre ist allgemeiner als der Bug: **Die Dateien, aus denen ein LLM liest,
sind nicht die Adressen, die ein Mensch bekommt.** Wer beides anbietet, muss
sagen, welche wofür ist — am besten dort, wo das LLM ohnehin hinsieht.

## Eine handgepflegte Liste veraltet. Auch unsere

Rezept 0 lässt Claude Code abbrechen, wenn der Index einer Site von Hand
gepflegt wird: „A button would go stale with the next commit."

Wir haben die Seitenliste für den Prompt dann selbst von Hand geschrieben. Ein
Demo-Chat hat uns darauf gestoßen — er nannte drei Seiten, die er nicht abrufen
konnte. Der Abgleich gegen die Routen ergab **fünf fehlende Seiten**, zwei davon
fehlten auch in der `sitemap.xml`.

Die Liste stand da schon zum vierten Mal im Projekt. Der Router weiß alles; wir
haben danebengeschrieben.

## Die Form gehört gemessen, nicht gewählt

Wie viele Seiten der Prompt einzeln nennt und wie viele er bündelt, ist keine
Entscheidung am Reißbrett. Es ist eine Rechnung: Solange die Seiten einzeln in
die Provider-URL passen, werden sie einzeln genannt — dann holt das LLM genau
die eine Seite, um die es geht, statt vierzig Kilobyte Nachbarschaft.

Auf einer persönlichen Website mit 43 Seiten kam heraus: 32 einzeln, 11 in
einem Bündel, 5392 von 6000 Zeichen. Bei Semantic Anchors mit 459 Seiten kam
dieselbe Rechnung auf zwölf Seiten und zwanzig Bündel. Zwei Sites, eine Regel,
zwei Formen.

Der Generator füllt dabei bewusst nicht bis an die Kante, sondern lässt ein
Zehntel frei. Bis an die Kante gefüllt würde der nächste Blogbeitrag die Form
umwerfen — und mit ihr die URLs, die schon in Gesprächen unterwegs sind.

## Die meisten Sites haben keinen Generator

Wir hatten drei Rezepte vorgesehen: schon LLM-lesbar, Jekyll, docToolchain. Die
erste fremde Site, die wir uns angesehen haben, war nichts davon. Kein
`_config.yml`, kein `Gemfile`, ein `package.json`, das CSS minimiert und Bilder
optimiert — die 43 HTML-Dateien liegen von Hand geschrieben im Repo.

Rezept 0 bricht dort ab, und das ist richtig so. Aber „bricht ab" ist keine
Antwort für jemanden, der einen Button will. Also gibt es jetzt ein Rezept, das
den Generator **mitbringt**: Es liest die HTML-Dateien, die tatsächlich da sind,
schreibt Textfassungen und baut den Prompt. Aus 472 KB HTML wurden 91 KB Text —
der Rest war auf jeder Seite dasselbe Menü.

## Was offen ist

Zwei Zahlen sind geraten, und beide sind messbar:

Die Grenze der Provider-URL. Ein Button mit absichtlich langem Prompt zeigt, ob
im Chat noch alles ankommt.

Die Abschneidegrenze beim Abruf. Eine Frage, deren Antwort im letzten Eintrag
eines großen Bündels steht, zeigt, ob 40 KB durchgehen.

Bis dahin stehen die konservativen Werte — und der Test, der sie bewacht, fällt
um, bevor die Leserschaft es merkt.
