# Geometria techniczna — paczka v5

## Changelog

- Kopia wejściowego HTML: `qa/INTAGO-Rolety-before-technical-geometry.html`.
- E9: podziałka 26,5 mm, grubość 8 mm.
- TOP BASIC: przekrój prowadnicy 35 mm w głąb korpusu × 13 mm do wnętrza; kanał 9,5 mm. Przekrój nie zależy od szerokości ani wysokości szafki.
- Standardowe listwy mają 46 mm wysokości. Uchwyt w przekroju ma 28 mm głębokości.
- NOBLE C3 ma osobny profil techniczny; nie zastępuje niepotwierdzonego profilu TOP w NOBLE WEW.
- Listwa maskująca C3 nie jest już powiększana do 120–190 mm wysokości strefy mechanizmu. Przebieg animacji i obliczenie drogi otwarcia zachowano.
- Przekrój: usunięto minimalną grubość 1,5 jednostki SVG dla płaszcza i 3 jednostek dla uchwytu. Teraz grubości są przeliczane z mm tą samą skalą co korpus.
- Dodano `mmToSvg(mm, axis, scale)` w geometrii korpusu; uchwyt i grubości przekroju używają tej funkcji. Istniejąca projekcja współrzędnych 3D nadal stosuje skalę korpusu.
- Kontrola integralności potwierdziła identyczność katalogu, cen, komponentów, silnika doboru, reconcile, formularza i aplikacji względem kopii wejściowej. Składnia skryptu HTML jest poprawna.

## Raport wymiarów

Źródła rysunkowe znajdują się w `qa/material-v5/INTAGO_RAUVOLET_ASTRA_MATERIAL_PACK_v5/09_COMPONENT_REFERENCE_IMAGES/`.

| Element | Wymiar techniczny mm | Poprzednia geometria | Nowa geometria | Źródło |
|---|---|---|---|---|
| E9 | 26,5 × 8 | podziałka 24,2; przekrój minimum 1,5 SVG | podziałka 26,5; przekrój 8 × skala | SLATS/E9, rysunek przekroju; component_dimensions_v5.json |
| E23 | 45 × 8, trzy elementy | podziałka 25 | podziałka pozostawiona 25 z TODO; grubość 8 × skala | SLATS/E23, rysunek trzyczęściowy |
| Prowadnica TOP BASIC | 35 × 13; kanał 9,5; warga 4 | widoczna szerokość 20, kanał 26% szerokości | widoczny występ 13; głębokość strefy 35; kanał 9,5; oś płaszcza w połowie strefy | TOP_BASIC/guide, rysunek przekroju |
| Narożnik TOP BASIC | 48,5 × 48,5 × 13 | strefa 48,5, uproszczony tor | obrys strefy zachowany; promień toru bez zmian | TOP_BASIC/90deg_corner |
| Standardowa listwa maskująca | 46 × 28 | 45; w C3 nadpisywana wysokością strefy | front 46, dane głębokości 28; powierzchnia w widoku ogólnym uproszczona | STANDARD/masking_rail |
| Standardowa listwa uchwytowa | 46 × 28 | 50, ograniczana proporcją mebla; przekrój 10/min.3 SVG | 46; przekrój 28 × skala | STANDARD/handle_rail |
| NOBLE C3 prowadnica | 29 × 19, projekcja 16 | wspólny profil noble: 29, strefa 35 | face 29, strefa 29, płaszczyzna zewnętrzna 19; projekcja 16 zapisana, krawędź nakładania zgodna z dotychczasowym montażem | NOBLE_C3/guide |
| NOBLE C3 maskownica | 73,2 × 17 | 73,2; w C3 nadpisywana wysokością strefy | front 73,2, dane głębokości 17; uproszczona powierzchnia | NOBLE_C3/masking_rail |
| NOBLE KOMBI uchwyt | 75 × 8 | 75 ograniczane proporcją; przekrój 10/min.3 SVG | 75; przekrój 8 × skala | NOBLE/handle_rail |
| TOP NOBLE WEW | niepotwierdzony w sprawdzonych materiałach | wcześniejszy profil 29 / 35 | pozostawiony z TODO | geometry_facts_v2 nie zawiera przekroju TOP |
| C3, zajęta strefa | 330 × 120/140/160/190 | wartości zgodne | bez zmian; oddzielone od maskownicy | zadanie użytkownika / dane istniejącego modelu |
| Zwinięty płaszcz C3 | orientacyjne Ø110/130/150/180 | te same envelope | bez zmian; nie jest wymiarem metalowego bębna | zadanie użytkownika |

## Wymiary niepotwierdzone

- Dokładna podziałka widocznej lameli E23: 45 mm opisuje zespół trzech elementów. Nie uznano 45 mm za pojedynczą lamelę ani nie wprowadzono arbitralnie 15 mm.
- Pełny przekrój prowadnicy TOP oraz maskownica wariantu NOBLE WEW.
- Promień osi toru w narożniku TOP BASIC; wymiar obrysu 48,5 mm nie wyznacza jednoznacznie promienia osi.
- Ślizgacze, zaślepki, szczegóły wewnętrzne C6 i metalowego C3. Uproszczenia pozostawiono.
- Wewnętrzne luzy robocze i dokładny offset osi płaszcza w kanale — model pozostaje poglądowy.

## QA

Przygotowano `qa/technical-geometry-gallery.html`: 5 systemów × 5 widoków, 3 zestawy rozmiarów wybierane końcówką adresu `#0`, `#1`, `#2`.

| System | Mały S×W mm | Średni S×W mm | Maksymalny S×W mm |
|---|---|---|---|
| TOP BASIC pionowy | 400×350 | 700×700 | 1200×525 |
| TOP BASIC poziomy | 560×350 | 800×700 | 1200×525 |
| TOP BASIC C3 | 400×650 | 700×1400 | 1200×2200 |
| NOBLE WEW | 400×350 | 700×700 | 1200×525 |
| NOBLE ZEWN | 400×650 | 700×1400 | 1200×2200 |

Głębokość scen galerii: 400 mm. Otwarcie: 50%. Widoki: Wygląd, Mechanizm, Wymiary, Przekrój, Budowa (warstwy renderera).

**Wizualny QA pozostaje niewykonany:** narzędzie przeglądarki odrzuciło otwarcie lokalnej galerii z powodu polityki URL. Nie potwierdzono wzrokowo braku kolizji we wszystkich 75 scenach. Galeria jest materiałem do kontroli, nie dowodem jej ukończenia.
