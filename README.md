# builder-hud: Claude Code mod

Ein Band über der Chatzeile von Claude Code, mit einer Krabben-Crew für Hintergrund-Agents.

- **Fortschritt:** Ein Balken zeigt den aktuellen Meilenstein aus deiner `TASKS.md`.
- **Verbrauch:** Darunter stehen das 5-Stunden-Limit (`5h:`) und das Kontextfenster (`C:`), mit dem Prozentwert im Balken.
- **Woche:** In der Mitte ein großer Balken für das Wochenlimit, gemessen an einem gleichmäßigen Tempo seit dem letzten Reset (pro Tag 1/7, gut 14,3 %). Die Marke zeigt, wo du heute stehen würdest: blau = noch Luft, grün = im Plan, orange = schneller als geplant.
- **Crew:** Pixel-Clawds im Kostüm (Carlos, Herby, Maurice, Diddy, Jeffrey, Bibi). Der Button **Crew** öffnet ein Panel mit allen Agents der Sitzung: Aufgabe, Status, Tokens und Kosten. Wer arbeitet, läuft im Band animiert mit, auch solange ein Agent auf seinen eigenen Hintergrundbefehl wartet (`run_in_background`, Monitor).
- **Aufgaben:** Der Button öffnet die `TASKS.md` als Panel. Ein Klick hakt eine Aufgabe ab.

- **Builder:** Der Agent-Typ `builder` (Opus, High) kommt mit dem Plugin: ein frischer Agent mit leerem Kontext für genau eine Aufgabe. Er ändert nur die erlaubten Dateien, prüft selbst und meldet kurz zurück.
- **Dynamische Agents** (aus per Standard): Mit `/dynamisch` oder dem Schalter im Crew-Panel kommen `builder-medium` (Sonnet, Medium) und `builder-light` (Haiku, Medium) dazu. Claude wählt dann je nach Aufgabe den kleinsten passenden. Aus = immer Opus High. Die Wahl bleibt über Sitzungen erhalten.
- **`/workflow-init`:** Richtet in einem leeren Ordner einen ganzen Arbeitsbereich ein (Grundregeln, `_instructions/`, Projekte mit `TASKS.md`), mit einem kurzen Interview. Der Hauptchat plant und prüft, Builder setzen die Aufgaben um.

Auf dem Desktop (Claude-App, Code-Tab) wird gezeichnet, im Terminal gibt es eine Textversion. Die Farben sind im Tokyo-Night-Neon-Stil.

## Installieren

**Mit einem Befehl (empfohlen):** Starte `claude` in einem Terminal und tippe:

```
/plugin install builder-hud --marketplace aBigJohn/builder-hub
```

Bestätige „Add marketplace?“ mit `y` und wähle den Scope „user“. Danach läuft der Mod in jeder neuen
Sitzung, auch im Code-Tab der Desktop-App. Dort selbst gibt es den `/plugin`-Befehl nicht, deshalb
den Befehl im Terminal tippen.

**Updates:** Jeder Commit hier ist eine neue Version.
- **Automatisch:** einmal in `claude` im Terminal `/plugin` öffnen → Tab „Marketplaces“ →
  `builder-hub` → „Enable auto-update“. Claude Code holt neue Versionen dann von selbst, ein paar
  Minuten nach deiner ersten Nachricht; sie laufen ab der nächsten Sitzung.
- **Von Hand:** `claude plugin update builder-hud@builder-hub`, danach Claude neu starten oder in
  einer laufenden Sitzung `/reload-plugins`.

**Oder von Hand** (zum Mitentwickeln):

1. Das Repo klonen oder als Zip entpacken, an einen festen Ort, z. B. `~/.claude/mods/builder-hub`.
2. Claude Code den Ordner nennen, auf eine der beiden Arten:
   - **Dauerhaft (auch für die Desktop-App):** in `~/.claude/settings.json` eintragen:
     ```json
     { "env": { "CLAUDE_CODE_PLUGIN_DIRS": "C:\\Users\\<du>\\.claude\\mods\\builder-hub" } }
     ```
     Unter macOS/Linux geht auch `~/.claude/mods/builder-hub`. Mehrere Ordner trennst du mit `;` (Windows) bzw. `:`.
   - **Nur für eine Sitzung im Terminal:** `claude --plugin-dir <pfad>/builder-hub`
3. Claude Code bzw. die App neu starten.

## Voraussetzungen

- Eine aktuelle Claude-Code-Version (Mods mit Hooks-Modul; getestet mit 2.1.295).
- Ein Abo mit Zugriff auf Opus: Der Builder läuft auf Opus mit hohem Effort. Das kostet mehr als
  kleinere Modelle, deshalb macht der Hauptchat kleine Korrekturen selbst.
- Die Vorlage von `/workflow-init` ist auf Windows ausgelegt (`new-project.ps1`). Unter macOS/Linux
  braucht das Skript PowerShell 7 (`pwsh`), oder Claude legt das Projekt von Hand an.

## Was er erwartet

- **Aufgabenliste:** `notes/TASKS.md` im Arbeitsordner oder `projects/<name>/notes/TASKS.md`. Das Format:
  ```markdown
  ## M1 — Erster Meilenstein
  - [x] erledigt
  - [~] in Arbeit
  - [ ] offen
  ```
  `##` startet eine Gruppe. Alle anderen Zeilen werden ignoriert.
- **Crew:** Jeder Agent bekommt eine Krabbe, egal welcher Typ (`general-purpose`, `Explore`, ein eigener `builder` …). Steht in der Beschreibung des Agents `Diddy: Tests reparieren`, trägt er Diddys Kostüm. Ohne Namen bekommt er das nächste freie Kostüm.
  Nur `builder` zeigen: Option `crew` auf `builder` stellen (im `/config`-Menü oder in `settings.json` unter `pluginConfigs`).
- Befehle: `/tasks` und `/crew` öffnen die Panels, `/dynamisch` schaltet die dynamischen Agents.

## Selbst anpassen

Die Kostüme liegen als JSON in `design-kit/designs/`. Wie du sie änderst und neu erzeugst, steht in `design-kit/README.md`. Tests laufen mit `claude plugin test <ordner>`.

## Credits

- **Farben:** Tokyo-Night-Palette, die Farbwerte so, wie [claude-skins](https://github.com/hellosverre/claude-skins) sie ausliefert (MIT, © hellosverre). Übernommen wurden nur Farbwerte, kein Code.
- **Idee:** Fortschrittsbalken und Figuren pro Agent sind angeregt von `savvy-progress` / `savvy-flow` aus [claude-kit](https://github.com/JohnnyVizz/claude-kit). Von dort stammt kein Code.
- **Clawd:** Die Krabbe ist Clawd, das Maskottchen von Claude Code, als Pixel-Fanart. Das ist ein inoffizieller Fan-Mod und steht in keiner Verbindung zu Anthropic.

Lizenz: MIT, siehe `LICENSE`.
