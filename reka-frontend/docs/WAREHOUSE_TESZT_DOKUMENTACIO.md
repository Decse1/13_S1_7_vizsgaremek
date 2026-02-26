# Raktár (Warehouse) Teszt Dokumentáció

## Áttekintés

Ez a dokumentum részletezi a raktár funkció end-to-end (E2E) tesztjeit, amelyek Selenium WebDriver és Mocha keretrendszer segítségével készültek. A tesztek a raktárkezelési funkciók, jogosultság-kezelés, és előfizetés-alapú hozzáférés működését ellenőrzik.

## Tesztkörnyezet

### Használt technológiák
- **Tesztkeretrendszer**: Mocha
- **Böngésző automatizáció**: Selenium WebDriver
- **Böngésző**: Mozilla Firefox
- **Assertion könyvtár**: Node.js beépített `assert` modul
- **Nyelv**: JavaScript (ES6+)

### Előfeltételek
1. Mozilla Firefox telepítése
2. GeckoDriver telepítése és PATH környezeti változóban való elérhetősége
3. Fejlesztői szerver futtatása a `http://localhost:5173` címen
4. Node.js függőségek telepítése (`npm install`)
5. Backend API elérhetősége a raktár műveletek végrehajtásához

### Konfiguráció
- **Teszt fájl**: `tests/e2e/warehouse.test.js`
- **Timeout**: 90000 ms (90 másodperc) - megnövelt érték az összetett műveletek miatt
- **Alkalmazás URL**: `http://localhost:5173/raktar`
- **Login URL**: `http://localhost:5173/bejelentkezes`

## Tesztelt Felhasználók és Jogosultságok

### Kovács Péter (Teljes hozzáférés)
- **Felhasználónév**: Kovács Péter
- **Jelszó**: pwd123
- **Jellemzők**: 
  - Előfizetéssel rendelkezik
  - Teljes jogosultság a raktárkezeléshez
  - Új termék hozzáadására jogosult

### Molnár Zoltán (Előfizetés nélkül)
- **Felhasználónév**: Molnár Zoltán
- **Jelszó**: pwd123
- **Jellemzők**: 
  - Előfizetés nélkül
  - Raktár oldal megtekintése korlátozott
  - Előfizetési figyelmeztetés jelenik meg

### osszeallit (Jogosultság nélkül)
- **Felhasználónév**: osszeallit
- **Jelszó**: pwd123
- **Jellemzők**: 
  - Nincs jogosultsága a raktárkezeléshez
  - Sem előfizetési figyelmeztetés, sem hozzáadás gomb nem jelenik meg

### lead (Hozzáférés nélkül)
- **Felhasználónév**: lead
- **Jelszó**: pwd123
- **Jellemzők**: 
  - Nincs hozzáférése a raktár modulhoz
  - A Raktár menüpont nem jelenik meg

## Helper Funkciók

### login(username, password)
**Cél**: Bejelentkezés megadott felhasználóval

**Lépések**:
1. Felhasználónév mező kitöltése
2. Jelszó mező kitöltése
3. Bejelentkezés gomb megnyomása
4. Várakozás az átirányításra a kezdőlapra
5. 500ms várakozás az oldal stabilizálódására

**Visszatérési érték**: Promise (async)

---

### navigateToWarehouse()
**Cél**: Navigálás a Raktár oldalra mind desktop, mind mobil nézetben

**Lépések**:
1. Ablakméret ellenőrzése (mobilnézet detektálása < 992px)
2. Ha mobilnézet: hamburger menü megnyitása
3. Raktár menüpont megkeresése és kattintás
4. Várakozás a `/raktar` URL-re történő navigálásra
5. 500ms várakozás az oldal betöltődésére

**Visszatérési érték**: Promise (async)

---

## Teszt Esetek

### 1. Új termék sikeres hozzáadása összes kötelező adattal

**Cél**: Ellenőrizni, hogy előfizetéssel és jogosultsággal rendelkező felhasználó képes új terméket hozzáadni a raktárhoz.

**Lépések**:
1. Bejelentkezés Kovács Péter felhasználóval
2. Navigálás a Raktár oldalra
3. Oldal cím ellenőrzése ("Raktár")
4. "Új termék felvétele" gomb megnyomása
5. Várakozás a modal megjelenésére
6. Form kitöltése:
   - **Terméknév**: "Tesztrúd"
   - **Készlet**: 60
   - **Cikkszám**: "RUD-001"
   - **Kiszerelés**: "db"
   - **Minimum vásárlási mennyiség**: 1
   - **Leírás**: "Ez egy tesztrúd"
   - **Ár**: 4000
   - **Kategória**: "Irodaszer"
   - **ÁFA kulcs**: 27
7. "Mentés" gomb megnyomása
8. Várakozás az oldal újratöltésére
9. Termék megjelenésének ellenőrzése a táblázatban

**Elvárt eredmény**:
- ✓ Sikeres bejelentkezés
- ✓ Raktár oldal betöltése
- ✓ Modal megnyitása
- ✓ Form sikeres kitöltése
- ✓ Termék mentése
- ✓ Oldal újratöltése
- ✓ Új termék ("Tesztrúd" vagy "RUD-001") megjelenik a táblázatban

**Teszt azonosító**: `successfully adds a new product with all required data`

---

### 2. Előfizetési figyelmeztetés megjelenítése előfizetés nélküli felhasználóknak

**Cél**: Ellenőrizni, hogy előfizetés nélküli felhasználók megfelelő figyelmeztetést kapnak.

**Lépések**:
1. Bejelentkezés Molnár Zoltán felhasználóval (előfizetés nélkül)
2. Navigálás a Raktár oldalra
3. Előfizetési figyelmeztetés megjelenésének ellenőrzése
4. Figyelmeztetés szövegének ellenőrzése
5. "Új termék felvétele" gomb hiányának ellenőrzése

**Elvárt eredmény**:
- ✓ Sikeres navigálás a Raktár oldalra
- ✓ Előfizetési figyelmeztetés látható (`[data-test="subscription-required-warning"]`)
- ✓ Figyelmeztetés szövege nem üres
- ✓ "Új termék felvétele" gomb nem jelenik meg
- ✓ Felhasználó nem tud új terméket hozzáadni

**Teszt azonosító**: `shows subscription required warning for users without subscription`

---

### 3. Sem hozzáadás gomb, sem előfizetési figyelmeztetés jogosultság nélküli felhasználóknak

**Cél**: Ellenőrizni, hogy jogosultság nélküli felhasználók számára nem jelennek meg a raktárkezelési funkciók.

**Lépések**:
1. Bejelentkezés osszeallit felhasználóval (jogosultság nélkül)
2. Navigálás a Raktár oldalra
3. "Új termék felvétele" gomb hiányának ellenőrzése
4. Előfizetési figyelmeztetés hiányának ellenőrzése

**Elvárt eredmény**:
- ✓ Sikeres navigálás a Raktár oldalra
- ✓ "Új termék felvétele" gomb nem jelenik meg
- ✓ Előfizetési figyelmeztetés nem jelenik meg
- ✓ Felhasználó csak megtekintheti a termékeket, de nem módosíthat

**Teszt azonosító**: `shows neither add button nor subscription warning for users without permissions`

---

### 4. Raktár menüpont elrejtése hozzáférés nélküli felhasználóknak

**Cél**: Ellenőrizni, hogy a Raktár menüpont nem jelenik meg olyan felhasználóknak, akiknek nincs hozzáférésük.

**Lépések**:
1. Bejelentkezés lead felhasználóval (hozzáférés nélkül)
2. Ablakméret ellenőrzése (desktop/mobil)
3. Ha mobil: hamburger menü megnyitása
4. Raktár menüpont hiányának ellenőrzése
5. Ha mobil: overlay bezárása

**Elvárt eredmény**:
- ✓ Sikeres bejelentkezés
- ✓ Raktár menüpont (`[data-test="sb-menu-warehouse"]`) nem jelenik meg a menüben
- ✓ Felhasználó nem férhet hozzá a Raktár modulhoz
- ✓ Mind desktop, mind mobil nézetben megfelelően működik

**Teszt azonosító**: `hides Raktár menu option for users without access`

---

### 5. Mobilnézet oldalsáv interakció tesztelése

**Cél**: Ellenőrizni, hogy a Raktár oldal mobilnézetben is megfelelően működik és elérhető.

**Lépések**:
1. Bejelentkezés Kovács Péter felhasználóval
2. Böngésző átméretezése mobilnézetre (375x667)
3. Hamburger menü megnyitása
4. Raktár menüpont megkeresése
5. Raktár menüpont megnyomása
6. Navigálás ellenőrzése
7. URL ellenőrzése (`/raktar`)
8. Böngésző átméretezése vissza desktop nézetre (1280x720)

**Elvárt eredmény**:
- ✓ Sikeres átméretezés mobilnézetre
- ✓ Hamburgur menü megnyitható
- ✓ Raktár menüpont látható és kattintható
- ✓ Sikeres navigálás a `/raktar` oldalra
- ✓ Mobilnézetben is minden funkció elérhető

**Teszt azonosító**: `tests mobile view sidebar interaction for warehouse page`

---

## Teszt Életciklus Hookok

### Before Hook (Inicializálás)
**Feladat**: WebDriver inicializálása és Firefox böngésző indítása

**Folyamat**:
1. Firefox opciók beállítása
2. Firefox bináris keresése több lehetséges útvonalon:
   - `C:\Program Files\Mozilla Firefox\firefox.exe`
   - `C:\Program Files (x86)\Mozilla Firefox\firefox.exe`
   - `%LOCALAPPDATA%\Mozilla Firefox\firefox.exe`
   - `%PROGRAMFILES%\Mozilla Firefox\firefox.exe`
3. WebDriver Builder inicializálása
4. Firefox böngésző elindítása
5. Sikeres indítás visszajelzése

**Hibakezelés**: Ha a Firefox nem indítható el, a teljes teszt suite leáll és részletes hibaüzenetet ír ki.

---

### After Hook (Lezárás)
**Feladat**: WebDriver bezárása és erőforrások felszabadítása

**Folyamat**:
1. Ellenőrzi, hogy a driver létezik-e
2. Böngésző bezárása (`driver.quit()`)
3. Erőforrások felszabadítása

---

### BeforeEach Hook (Teszt előkészítés)
**Feladat**: Minden teszt előtt clean state biztosítása

**Folyamat**:
1. Összes cookie törlése (`driver.manage().deleteAllCookies()`)
2. Navigálás a bejelentkezési oldalra
3. LocalStorage és SessionStorage törlése
4. URL ellenőrzés (átirányítás detektálása)
5. Ha szükséges, újra navigálás
6. 300ms várakozás az oldal stabilizálódására

**Jelentőség**: Biztosítja, hogy minden teszt izoláltan, tiszta állapotból indul, megszüntetve a korábbi munkamenetek hatásait.

---

## Data-Test Attribútumok

A tesztek a következő `data-test` attribútumokat használják az elemek azonosítására:

### Általános elemek
| Attribútum | Elem típusa | Leírás |
|------------|-------------|---------|
| `page-title` | H1/H2 | Oldal címe |
| `sb-menu-open` | Button | Hamburger menü gomb (mobil) |
| `sb-menu-warehouse` | Link | Raktár menüpont az oldalsávban |

### Bejelentkezési elemek
| Attribútum | Elem típusa | Leírás |
|------------|-------------|---------|
| `username-input` | Input | Felhasználónév beviteli mező |
| `password-input` | Input | Jelszó beviteli mező |
| `login-button` | Button | Bejelentkezés gomb |

### Raktár oldal elemek
| Attribútum | Elem típusa | Leírás |
|------------|-------------|---------|
| `products-table` | Table | Termékek táblázata |
| `add-product-btn` | Button | Új termék felvétele gomb |
| `subscription-required-warning` | Div | Előfizetési figyelmeztetés |

### Termék hozzáadása modal elemek
| Attribútum | Elem típusa | Leírás |
|------------|-------------|---------|
| `add-product-modal` | Div | Új termék modal konténer |
| `add-product-name-input` | Input | Terméknév mező |
| `add-product-stock-input` | Input | Készlet mező |
| `add-product-cikkszam-input` | Input | Cikkszám mező |
| `add-product-kiszereles-input` | Input | Kiszerelés mező |
| `add-product-min-quantity-input` | Input | Minimum vásárlási mennyiség |
| `add-product-description-input` | Textarea | Leírás mező |
| `add-product-price-input` | Input | Ár mező |
| `add-product-category-select` | Select | Kategória legördülő |
| `add-product-vat-input` | Input | ÁFA kulcs mező |
| `add-modal-save-btn` | Button | Mentés gomb a modalban |

## Tesztek Futtatása

### Alapértelmezett futtatás (látható böngészővel)
```bash
npm run test:warehouse
```
vagy
```bash
npm test
```

### Csak warehouse tesztek futtatása
```bash
npx mocha tests/e2e/warehouse.test.js
```

### Headless módban (szerkeszd a `warehouse.test.js` fájlt)
```javascript
// Uncomment this line:
options.headless();
```

### Részletes kimenet
```bash
npx mocha tests/e2e/warehouse.test.js --reporter spec
```

### Tesztek futtatása debug módban
```bash
npx mocha tests/e2e/warehouse.test.js --inspect-brk
```

## Gyakori Hibák és Megoldások

### 1. Firefox nem található
**Hiba**: "Failed to start Firefox"
**Megoldás**: 
- Ellenőrizd, hogy Firefox telepítve van
- Frissítsd a Firefox útvonalat a tesztben
- Győződj meg róla, hogy a PATH változó megfelelően van beállítva

### 2. GeckoDriver hiba
**Hiba**: "geckodriver not found in PATH"
**Megoldás**:
- Töltsd le a megfelelő GeckoDriver verziót
- Add hozzá a PATH környezeti változóhoz
- Vagy helyezd el a projekt gyökérkönyvtárában

### 3. Timeout hibák
**Hiba**: "Timeout waiting for element"
**Megoldás**:
- Ellenőrizd, hogy a dev szerver fut
- Ellenőrizd, hogy a backend API elérhető
- Növeld a timeout értékét lassabb gépeken (jelenleg 90s)
- Ellenőrizd a data-test attribútumokat

### 4. Modal nem jelenik meg
**Hiba**: "add-product-modal not found"
**Megoldás**:
- Ellenőrizd, hogy a felhasználó rendelkezik előfizetéssel
- Ellenőrizd, hogy az "Új termék felvétele" gomb megnyomásra került
- Várj az animáció befejeződésére
- Ellenőrizd a frontend komponens működését

### 5. Termék nem jelenik meg a táblázatban
**Hiba**: "New product should appear in the table"
**Megoldás**:
- Ellenőrizd a backend API működését
- Ellenőrizd, hogy a mentés sikeres volt
- Várj az oldal újratöltésére (2000ms)
- Ellenőrizd, hogy a táblázat újratöltődött

### 6. Előfizetési figyelmeztetés nem jelenik meg
**Hiba**: "subscription-required-warning not found"
**Megoldás**:
- Ellenőrizd, hogy a teszt felhasználónak nincs előfizetése
- Ellenőrizd a jogosultság-kezelési logikát
- Ellenőrizd a data-test attribútum helyességét

### 7. Mobilnézet tesztelési problémák
**Hiba**: "Hamburger menu not clickable"
**Megoldás**:
- Ellenőrizd az ablakméret beállítását (375x667)
- Várj az átméretezés után (300ms)
- Ellenőrizd, hogy a hamburger menü látható mobilnézetben

## Teszt Lefedettség

### Funkcionális lefedettség
- ✓ Új termék hozzáadása (összes mező)
- ✓ Előfizetés-alapú hozzáférés ellenőrzése
- ✓ Jogosultság-alapú funkció láthatóság
- ✓ Menü láthatóság hozzáférés alapján
- ✓ Mobilnézet navigáció
- ✓ Desktop és mobil nézet kompatibilitás
- ✓ Modal megnyitás és bezárás
- ✓ Form validáció és mentés
- ✓ Táblázat frissítés sikeres mentés után

### Jogosultság-kezelési lefedettség
- ✓ Teljes hozzáférés (előfizetéssel + jogosultsággal)
- ✓ Előfizetés hiánya
- ✓ Jogosultság hiánya
- ✓ Teljes hozzáférés hiánya
- ✓ Menüpont megjelenítés/elrejtés

### UI elemek lefedettség
- ✓ Raktár oldal cím
- ✓ Termékek táblázata
- ✓ Új termék gomb
- ✓ Előfizetési figyelmeztetés
- ✓ Termék hozzáadása modal
- ✓ Összes form mező
- ✓ Mentés gomb
- ✓ Hamburger menü (mobil)
- ✓ Oldalsáv menüpontok

### Eszköz lefedettség
- ✓ Desktop nézet (1280x720 alapértelmezett)
- ✓ Mobilnézet (375x667)
- ✓ Responsive layout

## Tesztelt Termékadatok

### Teszt termék adatai
- **Terméknév**: Tesztrúd
- **Készlet**: 60
- **Cikkszám**: RUD-001
- **Kiszerelés**: db
- **Minimum vásárlási mennyiség**: 1
- **Leírás**: Ez egy tesztrúd
- **Ár**: 4000 Ft
- **Kategória**: Irodaszer
- **ÁFA kulcs**: 27%

## Jövőbeli Fejlesztési Lehetőségek

1. **Termék szerkesztése**: Meglévő termék módosítása tesztelése
2. **Termék törlése**: Termék törlés funkció tesztelése
3. **Keresés és szűrés**: Termék keresési funkciók tesztelése
4. **Kategória szűrés**: Kategória szerinti szűrés tesztelése
5. **Rendezés**: Táblázat oszlopok szerinti rendezés
6. **Lapozás**: Több termék esetén lapozás tesztelése
7. **Kép feltöltés**: Termékképek feltöltése tesztelése
8. **Készlet figyelmeztetés**: Alacsony készlet esetén figyelmeztetés
9. **Bulk műveletek**: Több termék tömeges műveleteinek tesztelése
10. **Export funkció**: Termékek exportálása (CSV, Excel)
11. **Import funkció**: Termékek importálása tesztelése
12. **Termék duplikálás**: Termék másolása funkció
13. **Validációk**: Hibás adatok esetén validációs üzenetek
14. **Árváltoztatás**: Tömeges árváltoztatás tesztelése
15. **Kategória kezelés**: Új kategória létrehozása
16. **ÁFA kulcsok**: Különböző ÁFA kulcsok tesztelése
17. **Több böngésző**: Chrome, Edge, Safari support
18. **Accessibility**: ARIA attribútumok és billentyűzet navigáció
19. **Teljesítmény**: Nagyobb termékszám esetén teljesítmény mérés
20. **API mock**: Backend mock-olás offline teszteléshez

## Megjegyzések

- A tesztek izoláltan futnak, minden teszt előtt tiszta állapot biztosított
- A tesztek valós backend-del dolgoznak (nem mock)
- A tesztek vizuálisan követhetők fejlesztés közben (látható böngésző alapértelmezetten)
- Cookie, LocalStorage és SessionStorage tisztítása minden teszt előtt történik
- Különböző felhasználói szerepkörök és jogosultságok tesztelése
- Mind desktop, mind mobil nézet tesztelve
- A timeout értékek optimalizálva vannak Windows környezetre
- A megnövelt timeout érték (90s) lehetővé teszi az összetett műveletek végrehajtását
- Helper funkciók használata a kód újrafelhasználhatóságának érdekében

## Biztonság és Adatvédelem

- A tesztek teszt adatokat használnak
- A jelszavak tesztelési célúak
- Éles adatbázis esetén külön teszt környezet használata javasolt
- A tesztek nem módosítanak valós üzleti adatokat (vagy törölendők a teszt után)

## Integráció a CI/CD Pipeline-ba

### GitHub Actions példa
```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Start dev server
        run: npm run dev &
      - name: Run warehouse tests
        run: npm run test:warehouse
```

## Verzió Információk

- **Dokumentáció verzió**: 1.0
- **Utolsó frissítés**: 2026. február 26.
- **Szerző**: Csuka Tamás
- **Projekt**: Réka Frontend - Vizsgaremek

---

*Ez a dokumentáció a raktárkezelési funkcionalitás E2E tesztjeinek részletes leírását tartalmazza. A tesztek biztosítják, hogy a raktárkezelési folyamat minden aspektusa, beleértve a jogosultság-kezelést és az előfizetés-alapú hozzáférést is, megfelelően működik minden eszközön és nézetben.*
