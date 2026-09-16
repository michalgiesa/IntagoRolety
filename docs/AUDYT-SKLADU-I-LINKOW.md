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

- Elementy TOP BASIC prowadzą do referencyjnych białych części zgodnie z decyzją użytkownika.
- Elementy NOBLE MATT otwierają dokładny produkt dla Boxcar Blonde. Linki referencyjne NOBLE pozostają w dekorze Boxcar Blonde; nie znaleziono białych odpowiedników.
- Mechanizm C3 prowadzi do wariantu 400, 600, 800, 1000 lub 1200 mm dobranego do wpisanej szerokości.
- Przedłużka C3 prowadzi do produktu „REHAU Przedłużenie mechanizmu C3”.
- Mechanizm C6 prowadzi bezpośrednio do produktu C6.
- Prowadnica TOP prowadzi bezpośrednio do produktu „Rehau prowadnica TOP aluminium”.
- Pięć części NOBLE WEW nie ma potwierdzonych kart: pokrywa TOP, maskownica z piórem, listwa zamkowa, narożniki TOP i ślizgacze listwy. Ich przekierowania do kategorii usunięto; interfejs informuje o konieczności potwierdzenia linku. Zadanie pełnego linkowania pozostaje nieukończone dla tych części.

## Źródła online

- https://www.intago.com.pl/zaluzje-meblowe-na-wymiar,c130.html
- https://www.intago.com.pl/profile-zaluzjowe,c96.html
- https://www.intago.com.pl/systemy-zaluzji-mechanizmy-wspomagajace,c95.html

## Weryfikacja pięciu propozycji użytkownika

Źródło REHAU: https://interior.rehau.com/downloads/1756642/rauvolet.pdf — strony drukowane 22–27 (TOP i TOP BASIC). Katalog dopuszcza modułowe zestawianie części, ale nie dowolną zamianę prowadnic i akcesoriów.

1. Faktyczny cel linku id4911 to maskownica TOP BASIC 702825, nie pokrywa prowadnicy TOP. Nie przypisano do topCover.
2. id10240 / 17104981068 to trzyczęściowa maskownica nakładana C3 NOBLE, nie potwierdzona maskownica z piórem TOP/C6. Pozostaje tylko w NOBLE zewnętrznym C3.
3. id1873 / 702828: biała listwa zamkowa. Rodzina 17028281XXX występuje w tabelach akcesoriów TOP i TOP BASIC. Przypisano jako referencyjną białą listwę NOBLE WEW.
4. id4900 / 779690/B: narożnik TOP BASIC. Katalog rozróżnia narożniki TOP i TOP BASIC; zgodność tego sklepowego kodu z aluminiowym TOP niepotwierdzona. Nie przypisano do corner90.
5. Faktyczny cel id10236 / 17105451001 to ślizgacz KOMBI. Dla listwy 702828 przypisano id2076 / 793238/B (rodzina 17932381XXX wspólna w tabelach TOP i TOP BASIC), a nie KOMBI. KOMBI pozostaje przy uchwycie NOBLE KOMBI.

Po tej weryfikacji brakuje trzech potwierdzonych kart: topCover, nobleMaskTongue, corner90. Wcześniejsza lista pięciu braków powyżej jest historyczna. Brak linku nie oznacza braku części w magazynie INTAGO. Do pełnego mapowania potrzebne są kody faktycznie używane przy składaniu zestawu id9291; nie stwierdzono, że zestawu nie można zbudować.


## Ustalenie: ukrywanie niepotwierdzonych elementów

Na polecenie użytkownika widok Budowa pokazuje wyłącznie elementy z potwierdzonym linkiem do produktu. Pokrywa TOP, maskownica z piórem i narożnik TOP nie są prezentowane. Pozostają w danych składu; ich brak w podglądzie nie oznacza, że nie są potrzebne do montażu. Uzgodnione części NOBLE C3 (10239, 10236, 10240, 10237) oraz TOP BASIC (2078, 2076) zachowano.
