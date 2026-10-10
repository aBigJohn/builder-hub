# Claude-Workflow-Vorlage

Eine leere, allgemeine Kopie des Arbeitsablaufs, mit dem Stefan seine Projekte mit Claude Code baut.
Nichts darin ist auf ein Thema festgelegt. Die Lücken (`{{...}}`) füllt dein Claude in der ersten
Sitzung selbst, nachdem es dich gefragt hat, was du bauen willst.

## So legst du los

1. Einmal: den Mod **builder-hud** installieren. In einem Terminal `claude` starten und
   `/plugin install builder-hud --marketplace aBigJohn/builder-hub` eingeben, Scope „user“.
2. Einen leeren Ordner anlegen, wo dein Arbeitsbereich liegen soll, und Claude Code **in genau
   diesem Ordner** öffnen.
3. `/workflow-init` eingeben. Claude kopiert diese Vorlage hinein und stellt dir Fragen: was du
   baust, womit, wie du testest, wie du arbeiten willst. Danach füllt es `CLAUDE.md` und
   `_instructions/` aus und legt dein erstes Projekt unter `projects/<name>/` an.
4. Ab dann jede Sitzung **im Projektordner** `projects/<name>/` starten. Dann lädt Claude beide
   `CLAUDE.md` (Arbeitsbereich + Projekt) automatisch und liest zuerst `notes/STATE.md`.

## Was wo liegt

```
CLAUDE.md                 Grundregeln, wird in JEDER Sitzung automatisch geladen. Kurz halten!
_instructions/            Gesammeltes Wissen, wiederverwendbare Skripte. Nur Text.
  RETRO.md                Fehler, die schon bezahlt wurden. Jede Sitzung zuerst lesen.
  architecture.md         Aufbau deines Tools (Module, Datenfluss, Schnittstellen)
  toolchain.md            Pfade, Versionen, welche Installation wofür
  verification.md         Wie man beweist, dass etwas funktioniert
  deployment.md           Wohin gebaut/ausgeliefert wird - und die Frag-zuerst-Regel
  traps.md                Fallen der Umgebung (Shell, Build, Zielumgebung)
  scripts.md              Liste der fertigen Skripte - vor jedem neuen Skript lesen
  templates/              Vorlagen für neue Projekte (STATE.md, Projekt-CLAUDE.md, Kickoff)
  new-project.ps1         Legt ein neues Projekt unter projects/ an
projects/<name>/          Ein Ordner pro Projekt/Produkt, in sich geschlossen
  notes/TASKS.md          Meilensteine und Aufgaben, das Band zeigt den Fortschritt
  notes/STATE.md          Fakten, gelöste Fehler, Lektionen: die Übergabe an die nächste Sitzung
tools/                    Gemeinsame Werkzeuge (Skripte, Hilfsprogramme)
backups/                  Deine eigenen Sicherungen - Claude fasst sie nicht an
.claude/commands/         Eigene Slash-Befehle: /handoff, /update-guides
```

## Die Idee dahinter (das Wichtigste in einem Absatz)

Claude vergisst zwischen Sitzungen alles. Deshalb steht der Stand jedes Projekts in
`notes/STATE.md` (die Übergabe an die nächste Sitzung), die Fehler, die schon einmal Zeit gekostet
haben, in `_instructions/RETRO.md`, und das gesammelte Fachwissen in einzelnen Themen-Dateien unter
`_instructions/`, die nur geladen werden, wenn eine Aufgabe sie braucht. Wissen fließt nur in eine
Richtung: Projekt → `_instructions/`, und zwar erst, wenn du sagst
**"Projekt fertig, Guides aktualisieren"** (oder `/update-guides`).

## Hauptchat und Builder

- Der **Hauptchat** plant mit dir, pflegt `TASKS.md` und `STATE.md` und prüft Ergebnisse.
  Kleine Korrekturen macht er selbst.
- Größere Aufgaben gehen an einen **Builder**: einen frischen Hintergrund-Agent (Opus, High) mit
  leerem Kontext, nur für diese eine Aufgabe. Claude fragt vorher: „Soll ich daraus eine
  Builder-Aufgabe machen?“
- Im Band siehst du, wer gerade arbeitet (eine Krabbe pro Builder), unter **Crew** Kosten und
  Tokens, unter **Aufgaben** die `TASKS.md`.
- Warum: Ein frischer Agent arbeitet genauer als eine lange Sitzung mit vollem Kontext, und der
  Hauptchat bleibt schlank.

## Zwei Befehle, die du dir merken solltest

- **`/handoff`**: vor dem Schließen einer Sitzung. Claude schreibt den Stand in `notes/STATE.md`.
- **`/update-guides`**: wenn ein Projekt oder Meilenstein fertig ist. Claude prüft die gesammelten
  Lektionen und übernimmt nur die, die den Aufnahmetest bestehen.
