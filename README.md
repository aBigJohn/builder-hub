# builder-hud: Claude Code mod

Ein Band über der Chatzeile von Claude Code, mit einer Krabben-Crew für Hintergrund-Agents.

- **Fortschritt:** Ein Balken zeigt den aktuellen Meilenstein aus deiner `TASKS.md`.
- **Verbrauch:** Darunter stehen das 5-Stunden-Limit (`5h:`) und das Kontextfenster (`C:`), mit dem Prozentwert im Balken.
- **Crew:** Pixel-Clawds im Kostüm (Carlos, Herby, Maurice, Diddy, Jeffrey, Bibi). Der Button **Crew** öffnet ein Panel mit allen Hintergrund-Agents vom Typ `builder`: Aufgabe, Status, Tokens und Kosten. Wer arbeitet, läuft im Band animiert mit.
- **Aufgaben:** Der Button öffnet die `TASKS.md` als Panel. Ein Klick hakt eine Aufgabe ab.

Auf dem Desktop (Claude-App, Code-Tab) wird gezeichnet, im Terminal gibt es eine Textversion. Die Farben sind im Tokyo-Night-Neon-Stil.

## Installieren

**Mit einem Befehl (empfohlen):** Starte `claude` in einem Terminal und tippe:

```
/plugin install builder-hud --marketplace aBigJohn/builder-hub
```

Bestätige „Add marketplace?“ mit `y` und wähle den Scope „user“. Danach läuft der Mod in jeder neuen
Sitzung, auch im Code-Tab der Desktop-App. Dort selbst gibt es den `/plugin`-Befehl nicht, deshalb
den Befehl im Terminal tippen. Updates holst du mit `claude plugin update builder-hud`.

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

## Was er erwartet

- **Aufgabenliste:** `notes/TASKS.md` im Arbeitsordner oder `projects/<name>/notes/TASKS.md`. Das Format:
  ```markdown
  ## M1 — Erster Meilenstein
  - [x] erledigt
  - [~] in Arbeit
  - [ ] offen
  ```
  `##` startet eine Gruppe. Alle anderen Zeilen werden ignoriert.
- **Crew:** Hintergrund-Agents vom Typ `builder` (z. B. ein eigener Agent `.claude/agents/builder.md`). Steht in der Beschreibung des Agents `Diddy: Tests reparieren`, trägt er Diddys Kostüm. Ohne Namen bekommt er das nächste freie Kostüm.
- Befehle: `/tasks` und `/crew` öffnen die Panels.

## Selbst anpassen

Die Kostüme liegen als JSON in `design-kit/designs/`. Wie du sie änderst und neu erzeugst, steht in `design-kit/README.md`. Tests laufen mit `claude plugin test <ordner>`.

## Credits

- **Farben:** Tokyo-Night-Palette, die Farbwerte so, wie [claude-skins](https://github.com/hellosverre/claude-skins) sie ausliefert (MIT, © hellosverre). Übernommen wurden nur Farbwerte, kein Code.
- **Idee:** Fortschrittsbalken und Figuren pro Agent sind angeregt von `savvy-progress` / `savvy-flow` aus [claude-kit](https://github.com/JohnnyVizz/claude-kit). Von dort stammt kein Code.
- **Clawd:** Die Krabbe ist Clawd, das Maskottchen von Claude Code, als Pixel-Fanart. Das ist ein inoffizieller Fan-Mod und steht in keiner Verbindung zu Anthropic.

Lizenz: MIT, siehe `LICENSE`.
