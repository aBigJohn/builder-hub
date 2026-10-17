---
description: Projekt/Meilenstein fertig - Lektions-Kandidaten prüfen und nach _instructions/ übernehmen
---

Das Projekt (oder der Meilenstein) ist fertig. Führe den Capture-Lauf aus. Wissen fließt nur in eine
Richtung: Projekt → `_instructions/`, nie zurück, nie seitwärts in ein anderes Projekt.

1. Alle Kandidaten unter "Lessons — candidates" in `notes/STATE.md` des Projekts sammeln.
2. Jeden gegen den **Aufnahmetest** prüfen (alle drei müssen gelten):
   1. kostete echte Suchzeit (nicht in unter einer Minute aus Doku oder Code zu beantworten)
   2. **nicht** aus den vorliegenden Dateien ableitbar
   3. kommt in einem *anderen* Projekt wieder vor
3. Bestandene in **genau eine** passende Datei unter `_instructions/` schreiben, in diesem Format
   und nicht länger:
   ```markdown
   ### <kurzer Titel, nach dem Symptom benannt>
   **Symptom:** was man beobachtet
   **Cause:** der eigentliche Mechanismus
   **Rule:** was man stattdessen tut
   **Verified:** <Datum> — wie bestätigt   (oder: **ASSUMED** — noch nicht bestätigt)
   ```
   Anderswo nur ein Ein-Zeilen-Verweis, nie eine Kopie.
4. Korrekturen **überschreiben** den alten Eintrag, nie widersprüchliche Einträge stapeln.
   Widerlegtes löschen. Unbestätigtes = ASSUMED.
5. Wenn eine Lektion sich als Prüfung in ein Skript gießen lässt (Check, Guard, Assert): lieber das
   Skript (und `scripts.md`) erweitern als Prosa schreiben.
6. Prozess-Lektionen (wie wir arbeiten, nicht was die Technik tut) gehören nach `RETRO.md`.
7. `_instructions/`-Dateien haben keine Längengrenze (sie laden nur bei Bedarf). `CLAUDE.md` nur
   ändern, wenn sich eine harte Regel oder das Index geändert hat, und kurz halten: sie lädt in
   jeder Sitzung und in jedem Builder.

Am Ende eine Liste: übernommen (wohin), verworfen (warum), gelöscht/korrigiert.
