---
name: workflow-init
description: Richtet im aktuellen (leeren) Ordner den Claude-Workflow ein - Vorlage kopieren, Einrichtungs-Interview, erstes Projekt. Nur verwenden, wenn die Person /workflow-init eingibt oder ausdrücklich einen neuen Arbeitsbereich mit diesem Workflow einrichten will.
---

# Workflow einrichten

Die Vorlage liegt im Ordner `vorlage/` neben dieser Datei (im Basisordner dieses Skills, oben
genannt). Sie ist ein erprobter Workflow: `CLAUDE.md` (Grundregeln), `_instructions/` (Wissen +
Skripte), `projects/<name>/` (ein Ordner pro Projekt), `.claude/commands/` (Slash-Befehle).
Überall, wo `{{...}}` steht, fehlt etwas, das nur die Person sagen kann. Der Builder-Agent und das
Band kommen aus diesem Plugin (builder-hud) und müssen nicht kopiert werden.

**Schritt 0 — Kopieren.**
- Prüfe zuerst das aktuelle Arbeitsverzeichnis. Liegen dort schon `CLAUDE.md`, `_instructions/`
  oder `projects/`: **nichts überschreiben**, sondern anhalten und fragen.
- Sonst den ganzen Inhalt von `vorlage/` hineinkopieren, versteckte Einträge (`.claude/`)
  eingeschlossen, z. B. in Bash: `cp -rn "<Basisordner>/vorlage/." .`
- Danach zurücklesen: `CLAUDE.md`, `_instructions/RETRO.md`, `.claude/commands/handoff.md`
  müssen da sein. Fehlt etwas, sag es, statt weiterzumachen.

**Schritt 1 — Lesen.** Lies `LIESMICH.md`, `CLAUDE.md`, `_instructions/RETRO.md`,
`_instructions/templates/STATE.md`, `TASKS.md` und `task-brief.md`, damit du den Ablauf
verstehst. Ändere noch nichts.

**Schritt 2 — Befragen.** Stell die Fragen unten **in zwei bis drei Runden zu je höchstens 4
Fragen** (nicht alles auf einmal). Wo es eine naheliegende Standardantwort gibt, schlag sie vor,
dann muss die Person nur bestätigen. Frag nach, wenn eine Antwort unklar ist.

Runde A — Was wird gebaut:
1. Was ist das Tool? Ein, zwei Sätze, und für wen.
2. In welchem Host-Programm läuft es (z. B. Photoshop), welche Version, welches Betriebssystem?
3. Welche Technik: Plugin-System (z. B. UXP, CEP, C++-SDK), Sprache (JS/TS/C++/...),
   Build-Werkzeuge? Wenn unbekannt: nach kurzer Recherche die passende vorschlagen und in drei
   Sätzen begründen.
4. Gibt es schon Code oder Material (Ordner, Repo, Vorbilder, Screenshots)? Wo?

Runde B — Wie wird getestet und ausgeliefert:
5. Wie testet man eine Änderung (Plugin laden, Entwickler-Tool, Neustart des Host-Programms)?
6. Wohin wird ausgeliefert? Nur lokal, an Testpersonen, in einen Store/Marketplace, per Git?
   Gibt es mehr als ein Ziel? (Dann gilt die Frag-zuerst-Regel aus `deployment.md`.)
7. Git: Wird Git genutzt? Führt die Person Git-Befehle selbst aus, oder darf Claude
   committen/pushen?

Runde C — Wie wir zusammenarbeiten:
8. Sprache und Stil der Antworten (Standard: kurz, Deutsch, To-dos und Tests als nummerierte Liste).
9. Was ohne Rückfrage, was nur mit Rückfrage? (Standard: bauen und lokal testen frei;
   Löschen, Überschreiben fertiger Dateien, Ausliefern und alles nach außen nur nach Rückfrage.)
10. Token-Verbrauch? (Standard: keine großen Multi-Agent-Läufe ohne Absprache; Builder nur für
    größere Aufgaben, kleine Korrekturen im Hauptchat.)
11. Gibt es Ordner, die nie angefasst oder durchsucht werden sollen (große Bibliotheken, fremde
    Projekte)?

**Schritt 3 — Lücken füllen.** Mit den Antworten:
- `CLAUDE.md`: alle `{{...}}` ersetzen, die Harte-Regeln-Liste an das Projekt anpassen (Regeln,
  die nicht passen, streichen; fehlende ergänzen). **Kurz halten** — die Datei wird in jeder
  Sitzung geladen.
- `_instructions/toolchain.md`, `architecture.md`, `deployment.md`, `verification.md`,
  `traps.md`: ausfüllen, was jetzt schon bekannt ist; alles Unbestätigte als **ASSUMED** markieren.
  Für `architecture.md`: einen ersten Entwurf (Module, Datenfluss, Schnittstelle zum
  Host-Programm, Ordnerstruktur im Projekt) machen und ihn **kurz zeigen, bevor** du ihn
  festschreibst.
- `_instructions/templates/TASKS.md`: die Meilensteine auf diese Art von Projekt umschreiben.
  `STATE.md` und `project-CLAUDE.md` nur anpassen, wo etwas nicht passt.
- `_instructions/new-project.ps1`: die Unterordner-Liste (`$dirs`) an die Technik anpassen.
- Die Vorlieben aus Runde C zusätzlich als Memory speichern (falls Memory verfügbar ist).

**Schritt 4 — Erstes Projekt anlegen.** `.\_instructions\new-project.ps1 -Name <kurzer_name>`
ausführen (Name in lower_snake_case, abstimmen), dann `projects/<name>/notes/STATE.md` mit Ziel,
Umfang und Auslieferungsziel füllen, und die ersten 3–5 Aufgaben in
`projects/<name>/notes/TASKS.md` eintragen (jede so groß, dass sich ein Builder lohnt).

**Schritt 5 — Abschluss.** Eine kurze Liste zeigen: was eingerichtet wurde, welche Annahmen noch
ASSUMED sind, und was der erste konkrete Arbeitsschritt ist. Dazu sagen, dass ab jetzt jede
Sitzung im Ordner `projects/<name>/` starten soll, und dass dort das Band die `TASKS.md` zeigt.
