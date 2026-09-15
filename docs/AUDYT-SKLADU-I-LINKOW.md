# Audyt składu systemów i linków „Budowa”

Stan: 2026-09-15

Źródła: `INTAGO_systemy_sklad_PROSTY.csv`, paczka `INTAGO_RAUVOLET_ASTRA_MATERIAL_PACK_v5`, aktualne kategorie i karty produktów INTAGO.

## Wynik dla aktywnych konfiguracji

| Konfiguracja | Skład w konfiguratorze | Wynik |
| --- | --- | --- |
| TOP BASIC pionowa + C6 | 7 elementów | zgodny z CSV i kartą INTAGO |
| TOP BASIC pionowa + C3 | 7 elementów | zgodny z CSV i kartą INTAGO |
| TOP BASIC pozioma, zawijana na tył | 6 elementów | zgodny z CSV i kartą INTAGO |
| NOBLE MATT zewnętrzna pionowa + C3 | 8 elementów | zgodny z CSV i kartą INTAGO |
| NOBLE MATT wewnętrzna TOP + C6 | 8 elementów | zgodny z CSV i kartą INTAGO |

W CSV znajduje się również wariant `NOBLE MATT wewnętrzna TOP pozioma zawijana na tył`. Nie jest on aktywny w konfiguratorze, ponieważ zgodnie z późniejszą decyzją produktową roleta pozioma występuje wyłącznie jako TOP BASIC. Usunięto także nieużywane mapowanie tego wariantu z kodu.

## Poprawione linkowanie

- Elementy TOP BASIC dobierają stronę produktu według wybranego koloru: biały albo aluminium decor/szary.
- Elementy NOBLE MATT otwierają dokładny produkt dla Boxcar Blonde. Dla kolorów bez osobnej publicznej karty prowadzą do właściwej kategorii elementów zamiast do produktu w innym kolorze.
- Mechanizm C3 prowadzi do wariantu 400, 600, 800, 1000 lub 1200 mm dobranego do wpisanej szerokości.
- Przedłużka C3 prowadzi do produktu „REHAU Przedłużenie mechanizmu C3”.
- Mechanizm C6 prowadzi bezpośrednio do produktu C6.
- Prowadnica TOP prowadzi bezpośrednio do produktu „Rehau prowadnica TOP aluminium”.
- Pozostałe elementy TOP bez osobnej publicznej karty prowadzą do kategorii elementów systemów rolet.

## Źródła online

- https://www.intago.com.pl/zaluzje-meblowe-na-wymiar,c130.html
- https://www.intago.com.pl/profile-zaluzjowe,c96.html
- https://www.intago.com.pl/systemy-zaluzji-mechanizmy-wspomagajace,c95.html