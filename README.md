# INTAGO Rolety — konfigurator UX v3

Interaktywny konfigurator rolet meblowych, który prowadzi klienta od potrzeb i wymiarów do rekomendacji produktu. Projekt działa jako modułowa aplikacja deweloperska oraz jako pojedynczy, samodzielny plik HTML do prezentacji klientowi.

## Wersja dla klienta

Gotowa paczka znajduje się w `INTAGO-Rolety-Demo-dla-klienta.zip`. Klient rozpakowuje ZIP i otwiera `INTAGO-Rolety-Demo.html` dwuklikiem. Plik nie wymaga instalacji, serwera ani połączenia z internetem.

Ponowne wygenerowanie paczki:

```bash
npm run package:client
```

## Praca nad projektem

```bash
npm start
```

Aplikacja będzie dostępna pod adresem `http://127.0.0.1:4173`.

Pozostałe polecenia:

```bash
npm test
npm run build
```

## Zakres

- siedmioetapowy doradca z prostym wyborem konstrukcji „z dnem / bez dna”,
- rekomendacje ograniczone do pięciu linii INTAGO,
- wizualizacja SVG 2.5D dla rolety pionowej i poziomej,
- różne widoki montażu wewnętrznego i zewnętrznego,
- podgląd frontu, wnętrza, mechanizmu, wymiarów, przekroju i rozstrzelenia,
- przeciąganie uchwytu oraz sterowanie suwakiem,
- instrukcja pomiaru z walidacją,
- zapis konfiguracji w przeglądarce, identyfikator konfiguracji, kopiowanie, druk i zapytanie e-mail,
- układ responsywny i obsługa klawiatury.

## Struktura

- `systems-data.js` — macierz produktów, zakresy i wykończenia,
- `src/engine.js` — reguły dopasowania i walidacji,
- `src/state.js` — stan konfiguratora,
- `src/renderer.js` — model SVG,
- `src/wizard.js` — interakcje i widoki etapów,
- `src/persistence.js` — zapis lokalny,
- `src/quote.js` — identyfikator i treść zapytania,
- `scripts/package-client.mjs` — generator pojedynczego pliku HTML oraz ZIP,
- `docs/architecture.md` — opis techniczny,
- `docs/product-research.md` — źródła i poziom pewności danych.

## Status danych

Znane ograniczenia są egzekwowane przez silnik reguł. Niepotwierdzone kombinacje pozostają oznaczone jako „do weryfikacji”, zamiast być przedstawiane jako pewne. Przed wdrożeniem sprzedażowym trzeba zatwierdzić zakresy wariantów poziomych, pełną macierz systemów, luzy montażowe i mapowanie SKU.
