# Architektura konfiguratora

## Uruchomienie

Wersja źródłowa jest statyczną aplikacją ES Modules. `npm start` uruchamia niewielki serwer lokalny. `npm run package:client` usuwa importy i eksporty, scala kod oraz style, sprawdza składnię i tworzy pojedynczy plik HTML wraz z paczką ZIP.

Wersja kliencka nie pobiera bibliotek, fontów ani obrazów z internetu. Cały interfejs, model SVG i logika są osadzone w jednym pliku.

## Przepływ danych

`systems-data.js` definiuje produkty i ich możliwości. `src/engine.js` porównuje odpowiedzi użytkownika z tą macierzą i nadaje każdej pozycji jeden ze statusów: zgodna, niezgodna albo wymagająca weryfikacji. Odpowiedź „Nie wiem” pozostaje osobną wartością i nie jest zamieniana na „nie”.

`src/state.js` utrzymuje bieżący etap i wybory. Każda zmiana stanu odświeża kreator, podsumowanie i model. `src/persistence.js` zapisuje bezpieczny podzbiór konfiguracji w `localStorage`, dzięki czemu odświeżenie strony nie kasuje pracy.

## Model SVG

`src/renderer.js` rysuje korpus, prowadnice, listwy i mechanizmy. Listwy są rozmieszczane wzdłuż wyliczonej trasy, dlatego otwieranie wygląda jak zwijanie, a nie jak skalowanie jednej płaszczyzny. Trasa C3 tworzy zwój u góry, zaś wariant prowadzony do tyłu odprowadza pancerz za korpus.

Kierunek, montaż, wymiary i pozycja otwarcia są wejściami renderera. Tryby frontu, wnętrza, mechanizmu, wymiarów, przekroju i widoku rozstrzelonego używają tego samego modelu, więc pozostają ze sobą spójne.

## Rozszerzanie

Nowy produkt należy dodać w `systems-data.js`, podając obsługiwany kierunek, typ montażu, system, zakresy i wykończenia. Silnik automatycznie uwzględni go w rekomendacjach. Nowe ograniczenie zależne od kilku pól najlepiej dodać jako regułę w `src/engine.js` i pokryć testem domenowym.

`src/quote.js` przygotowuje treść zapytania i identyfikator konfiguracji. Obecny przycisk korzysta z `mailto:`. Wdrożenie produkcyjne może zastąpić tę funkcję wywołaniem endpointu bez zmiany reszty kreatora.
