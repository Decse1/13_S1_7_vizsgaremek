# Oldalsáv és Navigációs Menü Teszt Dokumentáció

## Áttekintés

Ez a dokumentum részletezi az oldalsáv (sidebar) és navigációs menü funkciók end-to-end (E2E) tesztjeit, amelyek Selenium WebDriver és Mocha keretrendszer segítségével készültek. A tesztek célja az alkalmazás teljes navigációs rendszerének átfogó ellenőrzése, beleértve az oldalsáv menüpontjait, a profilmenüt, a logó navigációt, valamint a mobilnézetes működést.

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
5. Érvényes teszt felhasználó a rendszerben (Kovács Péter)

### Konfiguráció
- **Teszt fájl**: `tests/e2e/sbmenus.test.js`
- **Timeout**: 90000 ms (90 másodperc)
- **Alkalmazás URL**: `http://localhost:5173/`
- **Login URL**: `http://localhost:5173/bejelentkezes`
- **Kezdőlap URL**: `http://localhost:5173/kezdolap`

## Tesztelt Bejelentkezési Adatok

### Bejelentkezett felhasználó
- **Felhasználónév**: Kovács Péter
- **Jelszó**: pwd123

> **Megjegyzés**: Minden navigációs teszt megköveteli az előzetes bejelentkezést.

## Teszt Esetek

### 1. Teljes navigációs rendszer átfogó tesztelése

**Cél**: Ellenőrizni, hogy minden elérhető oldalsáv menüpont, a profilmenü és a logó megfelelően navigál a céloldalakra.

**Lépések**:
1. Bejelentkezés érvényes felhasználóval
2. Átirányítás a kezdőlapra
3. Oldalsáv menüpontok végigtesztelése:
   - Kezdőlap menüpont
   - Áruház menüpont (jogosultságfüggő)
   - Raktárkezelés menüpont (jogosultságfüggő)
   - Partnerségek menüpont
   - Beérkezett rendelések menüpont (jogosultságfüggő)
   - Leadott rendelések menüpont (jogosultságfüggő)
   - Cégem menüpont
   - Kosár menüpont (jogosultságfüggő)
4. Mobilnézet detektálása és kezelése
5. Profilmenü tesztelése:
   - Profilmenü megnyitása
   - Profiladatok menüpont kattintása
   - Navigáció ellenőrzése
6. Logó navigáció tesztelése:
   - RÉKA logó kattintása
   - Kezdőlapra történő átirányítás ellenőrzése

**Elvárt eredmény**:
- ✓ Sikeres bejelentkezés
- ✓ Minden elérhető menüpont megjelenik
- ✓ Jogosultságfüggő menüpontok megfelelően kezelve
- ✓ Desktop és mobilnézet helyes működése
- ✓ Minden menüpont a megfelelő oldalra navigál
- ✓ Profilmenü navigáció működik
- ✓ Logó visszanavigál a kezdőlapra
- ✓ URL-ek helyesen módosulnak

**Részletes menüpont ellenőrzések**:

| Menüpont | Data-test attribútum | Cél útvonal | Kötelező |
|----------|---------------------|-------------|----------|
| Kezdőlap | `sb-menu-home` | `/kezdolap` | Igen |
| Áruház | `sb-menu-store` | `/store` | Nem |
| Raktárkezelés | `sb-menu-warehouse` | `/raktar` | Nem |
| Partnerségek | `sb-menu-partnerships` | `/partnersegek` | Igen |
| Beérkezett rendelések | `sb-menu-receivedorders` | `/rendelesek/beerkezett` | Nem |
| Leadott rendelések | `sb-menu-sentorders` | `/rendelesek/leadott` | Nem |
| Cégem | `sb-menu-companyinfo` | `/ceginfo` | Igen |
| Kosár | `sb-menu-cart` | `/kosar` | Nem |

**Teszt azonosító**: `navigates through all available sidebar menu items, profile menu, and logo`

**Mobilnézet kezelés**:
- A teszt automatikusan detektálja a nézetport méretet
- Bootstrap `lg` breakpoint alatt (992px) mobilnézetként kezel
- Mobilnézetben minden menüpont kattintás előtt megnyitja az oldalsávot
- Hamburger menü használata mobilnézetben
- Overlay használata az oldalsáv bezárásához

**Konzolos kimenet**:
```
Step 1: Logging in...
✓ Login successful
Step 2: Testing sidebar menu items...

Testing menu item: Kezdőlap
  → Clicked Kezdőlap
  ✓ Kezdőlap - Navigation successful (http://localhost:5173/kezdolap)

Testing menu item: Áruház
  ⊘ Áruház - Not available (permission required)

...

Step 3: Testing profile menu...
  ✓ Profile menu opened
  → Clicked Profiladatok
  ✓ Profiladatok - Navigation successful

Step 4: Testing logo navigation...
  → Clicked RÉKA logo
  ✓ Logo navigation successful - Redirected to home page

✅ All navigation tests completed successfully!
```

---

### 2. Oldalsáv megnyitása és bezárása mobilnézetben

**Cél**: Ellenőrizni, hogy mobilnézetben az oldalsáv hamburger menüvel megfelelően nyitható és zárható.

**Lépések**:
1. Bejelentkezés érvényes felhasználóval
2. Átirányítás a kezdőlapra
3. Böngésző átméretezése mobilnézetre (375x667 px)
4. Hamburger menü gomb ellenőrzése
5. Oldalsáv megnyitása hamburger menüvel
6. Oldalsáv `show` osztályának ellenőrzése
7. Oldalsáv bezárása overlay kattintással
8. Oldalsáv `show` osztályának eltávolításának ellenőrzése
9. Böngésző visszaállítása desktop méretre (1280x720 px)

**Elvárt eredmény**:
- ✓ Hamburger menü látható mobilnézetben
- ✓ Hamburger menüre kattintva az oldalsáv megnyílik
- ✓ Megnyitott oldalsáv rendelkezik `show` osztállyal
- ✓ Overlay kattintásra az oldalsáv bezáródik
- ✓ Bezárt oldalsáv nem rendelkezik `show` osztállyal
- ✓ Animációk megfelelően működnek (300ms várakozás)

**Teszt azonosító**: `verifies sidebar opens and closes on mobile view`

**Részletes műveletek**:

1. **Mobilnézet beállítása**:
   ```javascript
   await driver.manage().window().setRect({ width: 375, height: 667 });
   ```
   - iPhone SE méret szimuláció
   - 300ms várakozás az átméreteződésre

2. **Hamburger menü működése**:
   - Data-test attribútum: `sb-menu-open`
   - Láthatóság ellenőrzése assertion-nel
   - Kattintás után 300ms animációs idő

3. **Oldalsáv státusz ellenőrzése**:
   - CSS osztály vizsgálata: `.show`
   - Data-test attribútum: `sb-menu`
   - Dinamikus osztályváltozás követése

4. **Overlay bezárás**:
   - Selector: `.overlay`
   - Kattintás szimulálása
   - Animáció befejezésének várakozása

**Konzolos kimenet**:
```
Testing sidebar toggle functionality...
✓ Sidebar opened successfully
✓ Sidebar closed successfully
```

---

## Teszt Életciklus Hookok

### Before Hook (Inicializálás)
**Feladat**: WebDriver inicializálása és Firefox böngésző indítása

**Folyamat**:
1. Firefox opciók objektum létrehozása
2. Firefox bináris keresése több lehetséges útvonalon:
   - `C:\Program Files\Mozilla Firefox\firefox.exe`
   - `C:\Program Files (x86)\Mozilla Firefox\firefox.exe`
   - `%LOCALAPPDATA%\Mozilla Firefox\firefox.exe`
   - `%PROGRAMFILES%\Mozilla Firefox\firefox.exe`
3. WebDriver Builder inicializálása Firefox-szal
4. Firefox böngésző elindítása
5. Sikeres indítás naplózása

**Hibakezelés**: 
- Részletes hibaüzenet konzolra írása
- Error stack trace megjelenítése
- Teszt suite leállítása sikertelen inicializálás esetén

**Konzol kimenet**:
```
Found Firefox at: C:\Program Files\Mozilla Firefox\firefox.exe
Attempting to start Firefox...
Firefox started successfully!
```

---

### After Hook (Lezárás)
**Feladat**: WebDriver bezárása és erőforrások felszabadítása

**Folyamat**:
1. Driver létezésének ellenőrzése
2. Böngésző teljes bezárása (`driver.quit()`)
3. Memória felszabadítása
4. Geckodriver folyamat leállítása

**Jelentőség**: Biztosítja, hogy nem maradnak háttérfolyamatok a tesztek után.

---

### BeforeEach Hook (Teszt előkészítés)
**Feladat**: Minden teszt előtt tiszta állapot (clean state) biztosítása

**Folyamat**:
1. **Cookie-k törlése**: 
   ```javascript
   await driver.manage().deleteAllCookies();
   ```
2. **Navigálás a login oldalra**:
   ```javascript
   await driver.get('http://localhost:5173/bejelentkezes');
   ```
3. **Storage-ok tisztítása**:
   ```javascript
   await driver.executeScript('window.localStorage.clear(); window.sessionStorage.clear();');
   ```
4. **URL ellenőrzés**:
   - Automatikus átirányítás detektálása
   - Ha nem a login oldalon vagyunk, újranavigálás
5. **Stabilizálási idő**: 300ms várakozás

**Jelentőség**: 
- Minden teszt izoláltan fut
- Nincs cross-test interference
- Reprodukálható teszteredmények
- Konzisztens kiindulási állapot

---

## Data-Test Attribútumok

### Oldalsáv menü elemek

| Attribútum | Elem típusa | Leírás | Jogosultság |
|------------|-------------|---------|-------------|
| `sb-menu` | Div/Nav | Oldalsáv konténer | - |
| `sb-menu-open` | Button | Hamburger menü gomb (mobilnézet) | - |
| `sb-menu-home` | Link/Button | Kezdőlap menüpont | Mindenki |
| `sb-menu-store` | Link/Button | Áruház menüpont | Jogosultságfüggő |
| `sb-menu-warehouse` | Link/Button | Raktárkezelés menüpont | Jogosultságfüggő |
| `sb-menu-partnerships` | Link/Button | Partnerségek menüpont | Mindenki |
| `sb-menu-receivedorders` | Link/Button | Beérkezett rendelések | Jogosultságfüggő |
| `sb-menu-sentorders` | Link/Button | Leadott rendelések | Jogosultságfüggő |
| `sb-menu-companyinfo` | Link/Button | Cégem menüpont | Mindenki |
| `sb-menu-cart` | Link/Button | Kosár menüpont | Jogosultságfüggő |

### Profilmenü elemek

| Attribútum | Elem típusa | Leírás | Nézet |
|------------|-------------|---------|-------|
| `pf-menu-open-name` | Button | Profilmenü gomb (desktop) | Desktop |
| `pf-menu-open-pfp` | Button | Profilmenü gomb (mobilnézet) | Mobilnézet |
| `pf-menu-pfinfo` | Link | Profiladatok menüpont | Mindkettő |

### Navigációs elemek

| Attribútum | Elem típusa | Leírás |
|------------|-------------|---------|
| `logo-home` | Link | RÉKA logó (kezdőlapra navigál) |

### Bejelentkezési elemek (teszthez szükséges)

| Attribútum | Elem típusa | Leírás |
|------------|-------------|---------|
| `username-input` | Input | Felhasználónév beviteli mező |
| `password-input` | Input | Jelszó beviteli mező |
| `login-button` | Button | Bejelentkezés gomb |

## Útvonalak (Routes)

A tesztek során ellenőrzött útvonalak:

| Útvonal | Leírás | Jogosultság |
|---------|---------|-------------|
| `/` | Gyökér útvonal (átirányít) | - |
| `/bejelentkezes` | Bejelentkezési oldal | Vendég |
| `/kezdolap` | Kezdőlap | Bejelentkezett |
| `/store` | Áruház | Jogosultságfüggő |
| `/raktar` | Raktárkezelés | Jogosultságfüggő |
| `/partnersegek` | Partnerségek | Bejelentkezett |
| `/rendelesek/beerkezett` | Beérkezett rendelések | Jogosultságfüggő |
| `/rendelesek/leadott` | Leadott rendelések | Jogosultságfüggő |
| `/ceginfo` | Cégadatok | Bejelentkezett |
| `/kosar` | Kosár | Jogosultságfüggő |
| `/userinfo` | Profiladatok | Bejelentkezett |

## Tesztek Futtatása

### Alapértelmezett futtatás (látható böngészővel)
```bash
npm test
```

### Csak sidebar tesztek futtatása
```bash
npx mocha tests/e2e/sbmenus.test.js
```

### Specifikus teszt futtatása grep használatával
```bash
npx mocha tests/e2e/sbmenus.test.js --grep "navigates through"
```

vagy

```bash
npx mocha tests/e2e/sbmenus.test.js --grep "mobile view"
```

### Headless módban
Szerkeszd a `sbmenus.test.js` fájlt:
```javascript
// Uncomment this line:
options.headless();
```

Majd:
```bash
npx mocha tests/e2e/sbmenus.test.js
```

### Részletes kimenet specifikációval
```bash
npx mocha tests/e2e/sbmenus.test.js --reporter spec
```

### NPM script használata
Ha van dedikált script a `package.json`-ben:
```bash
npm run test:sidebar
```
vagy
```bash
npm run test:sbmenus
```

## Gyakori Hibák és Megoldások

### 1. Firefox nem található
**Hiba**: 
```
Failed to start Firefox:
Error: Could not find Firefox binary
```

**Megoldás**: 
- Ellenőrizd, hogy Firefox telepítve van-e
- Futtasd: `firefox --version` parancssorból
- Frissítsd a Firefox útvonalat a tesztben
- Ellenőrizd a `possibleFirefoxPaths` tömb elemeit

### 2. GeckoDriver hiba
**Hiba**: 
```
Error: geckodriver not found in PATH
```

**Megoldás**:
- Töltsd le a GeckoDriver-t: https://github.com/mozilla/geckodriver/releases
- Add hozzá a PATH környezeti változóhoz
- Vagy helyezd el a projekt `node_modules/.bin/` könyvtárában
- Futtasd: `geckodriver --version` az ellenőrzéshez

### 3. Timeout hibák
**Hiba**: 
```
Error: Timeout waiting for element [data-test="sb-menu-home"]
Timeout: 10000ms exceeded
```

**Megoldás**:
- Ellenőrizd, hogy a dev szerver fut-e (`http://localhost:5173`)
- Növeld a timeout értékét lassabb gépeken:
  ```javascript
  this.timeout(120000); // 2 perc
  ```
- Ellenőrizd a hálózati kapcsolatot
- Győződj meg róla, hogy a komponensek betöltődtek

### 4. Elem nem található
**Hiba**: 
```
NoSuchElementError: Unable to locate element: [data-test="sb-menu-store"]
```

**Megoldás**:
- Ez lehet normális, ha az elem jogosultságfüggő
- Ellenőrizd, hogy a teszt felhasználónak van-e jogosultsága
- Ellenőrizd a `data-test` attribútumok helyességét a komponensben
- Használj `findElements()` helyett `findElement()`-et és ellenőrizd a hosszt

### 5. Átirányítási problémák
**Hiba**: 
```
AssertionError: Should navigate to /raktar, but got /kezdolap
```

**Megoldás**:
- A felhasználónak nincs jogosultsága az adott oldalhoz
- Ellenőrizd a backend jogosultságokat
- Használj megfelelő jogosultságokkal rendelkező teszt felhasználót
- Ellenőrizd az auth store-t és a tokeneket

### 6. Mobilnézet nem működik
**Hiba**: 
```
Error: Hamburger menu should be visible on mobile
```

**Megoldás**:
- Ellenőrizd a viewport méret beállítását
- Növeld a várakozási időt az átméretezés után:
  ```javascript
  await driver.sleep(500);
  ```
- Ellenőrizd a CSS media query breakpoint-okat
- Frissítsd a böngészőt

### 7. Overlay nem kattintható
**Hiba**: 
```
ElementNotInteractableError: Element <div class="overlay"> could not be clicked
```

**Megoldás**:
- Várj az overlay megjelenésére:
  ```javascript
  await driver.wait(until.elementLocated(By.css('.overlay')), 5000);
  ```
- Ellenőrizd, hogy az overlay valóban látható-e
- Használj `executeScript()` kattintáshoz:
  ```javascript
  await driver.executeScript("document.querySelector('.overlay').click();");
  ```

### 8. Profil menü nem nyílik meg
**Hiba**: 
```
TimeoutError: Waiting for element to be located By(css selector, [data-test="pf-menu-pfinfo"])
```

**Megoldás**:
- Ellenőrizd, hogy a profilmenü gomb látható-e
- Desktop és mobilnézet közötti különbség kezelése
- Várj a dropdown animáció befejezésére:
  ```javascript
  await driver.sleep(500);
  ```
- Használj explicit wait-et:
  ```javascript
  await driver.wait(until.elementIsVisible(profileMenuButton), 5000);
  ```

## Teszt Lefedettség

### Navigációs funkciók lefedettség
- ✓ Összes oldalsáv menüpont navigáció
- ✓ Jogosultságfüggő menüpontok kezelése
- ✓ Profilmenü navigáció
- ✓ Logó navigáció
- ✓ URL változások ellenőrzése
- ✓ Átirányítások követése
- ✓ Desktop nézet navigáció
- ✓ Mobilnézet navigáció

### UI elemek lefedettség
- ✓ Oldalsáv konténer
- ✓ Hamburger menü gomb
- ✓ Összes menüpont link
- ✓ Profilmenü gomb (desktop)
- ✓ Profilmenü gomb (mobilnézet)
- ✓ Profilmenü dropdown
- ✓ RÉKA logó link
- ✓ Overlay elem
- ✓ Sidebar show/hide animáció

### Responsive design lefedettség
- ✓ Desktop nézetváltás (≥992px)
- ✓ Mobilnézet (< 992px)
- ✓ Hamburger menü megjelenés/eltűnés
- ✓ Overlay működés mobilnézetben
- ✓ Sidebar slide animáció
- ✓ Viewport átméretezés kezelése

### Jogosultság-alapú funkciók
- ✓ Kötelező menüpontok mindig megjelennek
- ✓ Opcionális menüpontok graceful kezelése
- ✓ Jogosultság nélküli menüpontok kihagyása
- ✓ Hibaüzenetek megfelelő kezelése

## Jövőbeli Fejlesztési Lehetőségek

### 1. Billentyűzet navigáció
- Tab navigáció tesztelése
- Enter/Space billentyűk tesztelése
- Escape billentyű (sidebar bezárás)
- Arrow navigáció a menüben

### 2. Accessibility tesztek
- ARIA attribútumok ellenőrzése
- Screen reader támogatás
- Focus management
- Kontrasztarány ellenőrzés
- Alternative text-ek

### 3. Kijelentkezés tesztelése
- Kijelentkezés gomb funkció
- Átirányítás login oldalra
- Session törlés
- Token invalidálás

### 4. Több böngésző támogatás
- Chrome/Chromium tesztek
- Edge tesztek
- Safari tesztek (macOS)
- Cross-browser compatibility

### 5. Különböző képernyőméretek
- Tablet nézet (768px - 991px)
- Kis mobil (320px szélesség)
- Nagy desktop (1920px+)
- 4K felbontás

### 6. Teljesítmény mérések
- Navigációs sebesség
- Animációk fluidity-ja
- Time to Interactive (TTI)
- First Contentful Paint (FCP)

### 7. Több felhasználói szerepkör
- Admin felhasználó tesztelése
- Raktáros felhasználó
- Partner felhasználó
- Vendég felhasználó
- Jogosultság mátrix ellenőrzés

### 8. Error boundary tesztelés
- Nem létező útvonal navigáció
- API hiba esetén navigation
- Network error kezelés
- 404 oldal megjelenítés

### 9. Breadcrumb navigáció
- Breadcrumb megjelenítés
- Breadcrumb kattintások
- Aktív oldal jelölés

### 10. Jelenlegi oldal kiemelés
- Aktív menüpont vizuális jelzése
- CSS osztály ellenőrzés
- Szín kontraszt

### 11. Search funkció
- Keresés a menüben
- Quick navigation
- Billentyű shortcut-ok

### 12. Dark mode
- Témaváltás tesztelése
- Színséma perzisztencia
- Contrast ratio ellenőrzés

### 13. Animációk részletes tesztelése
- Slide in/out animációk
- FadeAnimációk
- Timing függvények
- Animáció megszakítás

### 14. Swipe gesture-ök
- Mobilon swipe to close
- Swipe to open
- Touch event-ek

### 15. Notification-ök
- Új értesítések a menüben
- Badge megjelenítés
- Értesítés kattintás

## Megjegyzések

### Tesztelési stratégia
- A tesztek valós backend-del dolgoznak, nem mock adatokkal
- Minden teszt tiszta állapotból indul (clean state)
- Izolált tesztek - nincs függőség a futtatási sorrenden
- Comprehensive coverage - minden navigációs útvonal tesztelve

### Böngésző specifikus beállítások
- Firefox használata a konzisztencia érdekében
- GeckoDriver automatikus PATH keresés
- Többféle Firefox telepítési útvonal támogatás
- Windows környezetre optimalizált

### Timeout értékek
- Általános teszt timeout: 90000ms (90 sec)
- Element wait timeout: 5000-10000ms
- Animációs várakozás: 300-500ms
- URL változás timeout: 5000ms

### Responsive tesztelés
- Bootstrap breakpoint-ok követése
- 992px alatt mobilnézet
- Automatikus viewport detektálás
- Desktop és mobile workflow különbség

### Jogosultság kezelés
- Opcionális menüpontok graceful fail
- Console log jelzi a nem elérhető menüpontokat
- `⊘` szimbólum a nem elérhető funkcióknál
- Teszt nem failel jogosultság hiány miatt

### Konzol kimenet
- Részletes, strukturált logging
- Step-by-step követhető folyamat
- Sikeres műveletek ✓ jellel
- Nem elérhető funkciók ⊘ jellel
- Kattintott elemek → jellel

## Verzió Információk

- **Dokumentáció verzió**: 1.0
- **Utolsó frissítés**: 2026. február 26.
- **Szerző**: Csuka Tamás
- **Projekt**: Réka Frontend - Vizsgaremek
- **Teszt suite verzió**: 1.0
- **Framework verzió**: Mocha 10.x, Selenium WebDriver 4.x

## Kapcsolódó Dokumentációk

- [Bejelentkezés Teszt Dokumentáció](./LOGIN_TESZT_DOKUMENTACIO.md)
- [Regisztráció Teszt Dokumentáció](./REGISZTRACIO_TESZT_DOKUMENTACIO.md)
- [Raktár Teszt Dokumentáció](./WAREHOUSE_TESZT_DOKUMENTACIO.md)

## Tesztelt Komponensek

### Frontend komponensek
- `NavBar.vue` - Navigációs sáv és oldalsáv komponens
- Oldalsáv menü rendszer
- Profilmenü dropdown
- RÉKA logó link
- Overlay komponens
- Responsive hamburger menü

### Router útvonalak
- Kezdőlap route
- Áruház route
- Raktárkezelés route
- Partnerségek route
- Rendelések route-ok
- Cégadatok route
- Kosár route
- Profiladatok route

### State management
- Authentication store (bejelentkezési állapot)
- Permissions store (jogosultságok)
- Navigation guards (route védelem)

---

*Ez a dokumentáció az oldalsáv és navigációs menü funkcionalitás E2E tesztjeinek részletes leírását tartalmazza. A tesztek biztosítják, hogy az alkalmazás teljes navigációs rendszere, beleértve a desktop és mobilnézetet, valamint a jogosultság-alapú menüpontokat, megfelelően működik minden körülmény között.*
