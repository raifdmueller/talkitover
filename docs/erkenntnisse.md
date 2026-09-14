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
Begriffe. Dabei sind Annahmen gefallen, die vorher plausibel klangen — darunter
unsere eigene, die eine Zeit lang als Erkenntnis auf dieser Seite stand.

Was hier steht, ist gemessen, nicht vermutet. Wo eine Zahl steht, kommt sie aus
einem Versuch, und wo eine Annahme offen ist, sagen wir es.

## Eine Beobachtung ist keine Regel. Diese hier stand einen Tag lang auf dieser Seite

Hier stand: „Das LLM des Lesers holt eine URL, die in der Nachricht stand. Eine
URL, die es nur *in* einem geholten Dokument gefunden hat, verweigert es." Das
war die zentrale Erkenntnis dieses Projekts. Die ganze Architektur folgt daraus.

Sie stimmt nicht.

Gesehen hatten wir eine echte Verweigerung, wörtlich „not in any prior search or
fetch result". Daraus haben wir eine Regel gemacht — aus einer Beobachtung, ohne
sie ein zweites Mal zu prüfen. Seit dem 13.09.2026 stand sie hier.

Einen Tag später haben wir die Prüfung nachgeholt: eine Datei geholt, die drei
Adressen auf **fremden** Hosts enthält, und darum gebeten, jede davon zu holen.
Keine einzige dieser Adressen stand in der Nachricht.

Claude hat alle drei geholt. Auf die Frage, was es gehindert habe: „keine Sperre,
kein Timeout, keine Domain-Beschränkung." ChatGPT ebenfalls alle drei, mit
derselben Auskunft. Der Anbieter macht hier keinen Unterschied.

Eine Tiefen-Disziplin hält es trotzdem ein. In den geholten Seiten standen
weitere Adressen — Archiv-Links —, und die hat es **nicht** verfolgt, mit
Begründung: sie standen nicht in der Datei, um die es gebeten wurde. Es hat
gefragt, ob es ihnen folgen soll.

Das ist der Unterschied, den wir übersehen hatten: Es ist eine
**Entscheidung**, keine Sperre. Entscheidungen sehen von außen aus wie Regeln,
bis jemand sie ein zweites Mal prüft.

## „Abgerufen" heißt nicht, dass beide dasselbe gelesen haben

Zwei der drei Adressen aus diesem Versuch sind 525-Byte-Stubs: ein
`<meta http-equiv="refresh">`, ein Satz „Dieser Beitrag ist ins Archiv
umgezogen", Titel „Umgezogen". Der Artikel steht woanders.

Claude sah den Stub, meldete ihn als Stub und nannte die Archiv-Adresse.
ChatGPT meldete, die Seite „enthält den Artikel" — und seine Quellenangabe trug
den Titel der **Archivseite**, nicht „Umgezogen". Sein Fetcher ist der
Weiterleitung gefolgt, Claudes nicht.

Beide haben wahrheitsgemäß berichtet, was sie bekommen haben. Sie haben nur
nicht dasselbe bekommen. **Wer Textfassungen veröffentlicht, sollte sie deshalb
nicht hinter eine Meta-Weiterleitung legen** — sonst liest der eine Leser den
Inhalt und der andere einen Einzeiler, und keiner von beiden merkt es.

## Der andere Anbieter verweigert nicht — er erfindet

ChatGPT holt `text/markdown` gar nicht erst: „400 Unsupported content-type". Das
allein wäre harmlos. Es sagt dem Leser aber nicht, dass es die Datei nicht hat.
Es sucht im Netz weiter und antwortet aus dem, was es findet.

Dreimal gefragt, dreimal falsch:

| Gefragt | Antwort | In der Datei |
|---|---|---|
| Welche `Page:`-Adresse steht in dieser Datei? | `.../spec-driven-development` | drei andere; der genannte Begriff kommt **null mal** vor |
| Wie heißt der letzte Anker in `design-principles-1`? | YAGNI, mit Quellenangabe | Postel's Law. YAGNI ist der letzte Anker der *anderen* Hälfte |
| Was steht in diesem Rezept? | wich auf GitHub Raw aus, „129 Zeilen" | 143 Zeilen |

Der zweite Fall ist der lehrreichste: richtige Kategorie, richtige Form, echter
Ankername, Zitatmarke — nur die falsche Datei. Ohne die Datei in der Hand
erkennt das niemand.

Im Prompt dieses Projekts steht wörtlich „do not answer from memory and do not go
looking elsewhere". Beides wurde getan. **Ein 400 ist kein sicheres Scheitern —
es ist der Auslöser für eine erfundene Antwort.**

Deshalb heißt jede Datei, die ein Prompt nennt, hier `.txt`. `text/plain` lesen
beide Anbieter; `text/markdown` liest nur einer.

## Die Architektur steht. Ihre Begründung war die falsche

Alles in den Prompt, Tiefe 1, Bündel statt Index — das bleibt. Aber nicht mehr,
weil Verweisen verboten wäre. Sondern weil:

Der eine Anbieter folgt aus freien Stücken, und was eine Entscheidung ist, kann
sich zwischen Versionen, Oberflächen und Einstellungen ändern. Der andere folgt
gar nicht und erfindet an der Stelle etwas. Ein Entwurf, der auf keine der beiden
Eigenschaften angewiesen ist, überlebt beide.

Die Liste im Prompt bleibt damit eine Architekturentscheidung, keine Dekoration —
nur trägt sie jetzt die Begründung, die sie wirklich hat.

## Also gehören die URLs in den Prompt

Der sichere Kanal war die ganze Zeit da: Der Button schreibt den Prompt, der
Prompt wird zur Nachricht des Nutzers, und URLs in der Nachricht des Nutzers
werden geholt — von beiden Anbietern, ohne Umweg und ohne Suche.

Die Herkunft zählt **pro Nachricht**, nicht nur für die erste. Fügt der Leser
später eine URL ein, wird sie geholt. Das ist der Notausgang, wenn etwas fehlt,
und der Prompt sagt dem LLM, es soll danach fragen statt zu raten.

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

Die Bündelgrenze liegt inzwischen bei 60 KB, und dass sie hält, ist gemessen —
siehe weiter unten.

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

## Die Abschneidegrenze liegt bei rund 100 KB, nicht bei 40

Am 14.09.2026 gemessen, beide Male dieselbe Frage: „Wie heißt der letzte Eintrag
in dieser Datei?" Wer die Antwort weiß, weiß, ob die Datei ganz angekommen ist.

| Datei | Größe | Ergebnis bei Claude |
|---|---|---|
| ein Bündel | 61 KB | **vollständig** — letzter Eintrag richtig benannt |
| llms.txt | 544 KB | abgeschnitten mitten in der dritten Kategorie, bei rund 100 KB |

Unsere Bündelgrenze von 60 KB liegt damit belegt im sicheren Bereich, nicht mehr
geschätzt. Höher zu gehen wäre möglich — wir tun es nicht: Der Gewinn wären ein
bis zwei Einträge weniger im Prompt, der Einsatz eine Datei, von der wir dann
wieder raten müssten, ob sie ankommt. Abschneiden ist still. Eine halbe Datei
liest sich wie eine ganze.

Für ChatGPT ist die Zahl weiter offen. Dort scheiterte der Abruf schon am
Content-Type, bevor die Länge eine Rolle spielte.

## Die Provider-URL ist viel großzügiger als angenommen

6000 Zeichen standen als `MAX_URL_LENGTH` im Web Component — konservativ
gewählt, nie gemessen. Am 14.09.2026 nachgeholt, mit Links genau bekannter
Länge und einer Endmarke als letzter Zeile: Kommt sie im Chat an, war der
Prompt vollständig.

| Länge der URL | Claude | ChatGPT |
|---|---|---|
| 30.000 | vollständig | vollständig |

Beide Anbieter nehmen das Fünffache unserer Annahme. Die knappste Stelle im
System, um die wir uns Sorgen gemacht haben — Semantic Anchors mit 5891 von
6000 —, war nie knapp.

**Der Wert steht trotzdem weiter auf 6000.** 30.000 war die obere Kante der
Messreihe, also eine Untergrenze, keine Grenze. Einen Wert auf die Kante des
Gemessenen zu setzen wäre wieder geraten, nur mit mehr Selbstvertrauen — und
genau diesen Fehler haben wir heute schon einmal korrigiert, weiter oben auf
dieser Seite. Die Messreihe läuft jetzt bis 200.000.

## Was offen ist

Wo die Provider-URL wirklich bricht. Wir kennen eine Untergrenze von 30.000
für beide Anbieter, nicht die Grenze.

Und die Abschneidegrenze für ChatGPT: Dort scheiterte der Abruf am
Content-Type, bevor die Länge eine Rolle spielte. Für Claude liegt sie bei rund
100 KB, siehe oben.

Bis dahin gelten die konservativen Werte, und die Tests, die sie bewachen,
fallen um, bevor die Leserschaft es merkt.
