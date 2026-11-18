# LinkedIn Feed Experiment

Lokale Demo eines LinkedIn-Feeds mit Filtern für KI-Beiträge und Anzeigen.

- KI-Beiträge und Anzeigen unabhängig ein- und ausblenden
- Aktuelle Anzahl sichtbarer Beiträge in beiden Filterkarten
- Kurzer Hinweis mit Prozentangabe beim Umschalten
- Gelbe Markierung von KI-Begriffen

## Lokal öffnen

Im Projektordner starten:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Anschliessend `http://127.0.0.1:8765/KI-filter-prototyp/` im Browser öffnen.

Die ursprünglichen LinkedIn- und Tracking-Skripte wurden entfernt und Tracking-Parameter bereinigt. Die Demo enthält gespeicherte Inhalte und ist keine offizielle LinkedIn-Erweiterung.

Live: https://herrbuerli.github.io/LinkedIn/KI-filter-prototyp/
