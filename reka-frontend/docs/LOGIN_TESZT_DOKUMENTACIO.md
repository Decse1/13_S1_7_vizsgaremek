# Bejelentkezés Teszt Dokumentáció

## Áttekintés

Ez a dokumentum részletezi a bejelentkezési funkció end-to-end (E2E) tesztjeit, amelyek Selenium WebDriver és Mocha keretrendszer segítségével készültek.

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

### Konfiguráció
- **Teszt fájl**: `tests/e2e/login.test.js`
- **Timeout**: 60000 ms (60 másodperc)
- **Alkalmazás URL**: `http://localhost:5173/bejelentkezes`
- **Átirányítási cél**: `http://localhost:5173/kezdolap`

## Tesztelt Bejelentkezési Adatok

### Érvényes teszt felhasználó
- **Felhasználónév**: Kovács Péter
- **Jelszó**: pwd123

### Érvénytelen teszt adatok
- **Felhasználónév**: invaliduser
- **Jelszó**: wrongpassword

## Teszt Esetek

### 1. Bejelentkezési oldal betöltése

**Cél**: Ellenőrizni, hogy a bejelentkezési oldal megfelelően betöltődik és tartalmazza az összes szükséges elemet.

**Lépések**:
1. Navigálás a bejelentkezési oldalra
2. Várakozás a login form megjelenésére
3. Elemek keresése és ellenőrzése

**Elvárt eredmény**:
- ✓ A bejelentkezési űrlap megjelenik
- ✓ A felhasználónév mező jelen van (`[data-test="username-input"]`)
- ✓ A jelszó mező jelen van (`[data-test="password-input"]`)
- ✓ A bejelentkezés gomb jelen van (`[data-test="login-button"]`)

**Teszt azonosító**: `loads the login page`

---

### 2. Hibaüzenet megjelenítése érvénytelen adatok esetén

**Cél**: Ellenőrizni, hogy érvénytelen bejelentkezési adatok esetén megfelelő hibaüzenet jelenik meg.

**Lépések**:
1. Navigálás a bejelentkezési oldalra
2. Érvénytelen felhasználónév megadása ("invaliduser")
3. Érvénytelen jelszó megadása ("wrongpassword")
4. Bejelentkezés gomb megnyomása
5. Várakozás a hibaüzenetre

**Elvárt eredmény**:
- ✓ Hibaüzenet jelenik meg (`[data-test="error-alert"]`)
- ✓ A hibaüzenet szövege nem üres (`[data-test="error-message"]`)
- ✓ A felhasználó a bejelentkezési oldalon marad

**Teszt azonosító**: `shows error message on invalid credentials`

---

### 3. Sikeres bejelentkezés érvényes adatokkal

**Cél**: Ellenőrizni, hogy érvényes bejelentkezési adatokkal a felhasználó sikeresen be tud jelentkezni.

**Lépések**:
1. Navigálás a bejelentkezési oldalra
2. Érvényes felhasználónév megadása ("Kovács Péter")
3. Érvényes jelszó megadása ("pwd123")
4. Bejelentkezés gomb megnyomása
5. Várakozás az átirányításra

**Elvárt eredmény**:
- ✓ A rendszer átirányít a kezdőlapra (`http://localhost:5173/kezdolap`)
- ✓ A felhasználó sikeresen bejelentkezett
- ✓ A munkamenet létrejött

**Teszt azonosító**: `successfully logs in with valid credentials`

---

### 4. Kötelező mezők validálása

**Cél**: Ellenőrizni, hogy üres mezők esetén a form nem küldhető el.

**Lépések**:
1. Navigálás a bejelentkezési oldalra
2. Mezők üresen hagyása
3. Bejelentkezés gomb megnyomása
4. URL ellenőrzése

**Elvárt eredmény**:
- ✓ Az űrlap nem kerül elküldésre (HTML5 validáció)
- ✓ A felhasználó a bejelentkezési oldalon marad
- ✓ A böngésző beépített validációs üzenete megjelenik

**Teszt azonosító**: `validates required fields`

---

### 5. Hibaüzenet bezárása

**Cél**: Ellenőrizni, hogy a hibaüzenet bezárható a felhasználó által.

**Lépések**:
1. Navigálás a bejelentkezési oldalra
2. Érvénytelen adatok megadása
3. Bejelentkezés gomb megnyomása
4. Várakozás a hibaüzenet megjelenésére
5. Bezárás gomb megnyomása
6. Várakozás az animáció befejeződésére (500ms)

**Elvárt eredmény**:
- ✓ A hibaüzenet megjelenik
- ✓ A bezárás gomb működik (`[data-test="error-alert"] .btn-close`)
- ✓ A hibaüzenet eltűnik a DOM-ból
- ✓ Nincs látható hibaüzenet az oldalon

**Teszt azonosító**: `can close error message`

---

### 6. Átirányítás már bejelentkezett felhasználó esetén

**Cél**: Ellenőrizni, hogy bejelentkezett felhasználó nem férhet hozzá a login oldalhoz.

**Lépések**:
1. Bejelentkezés érvényes adatokkal
2. Átirányítás a kezdőlapra
3. Kísérlet a bejelentkezési oldal újralátogatására
4. Várakozás az automatikus átirányításra

**Elvárt eredmény**:
- ✓ A sikeres bejelentkezés után átirányítás történik
- ✓ A bejelentkezési oldal megnyitásakor ismét átirányítás történik a kezdőlapra
- ✓ A már bejelentkezett felhasználó nem láthatja a login formot
- ✓ A munkamenet megmarad

**Teszt azonosító**: `redirects to home if already logged in`

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
5. Ha szükséges, újratöltés
6. 300ms várakozás az oldal stabilizálódására

**Jelentőség**: Biztosítja, hogy minden teszt izoláltan, tiszta állapotból indul.

---

## Data-Test Attribútumok

A tesztek a következő `data-test` attribútumokat használják az elemek azonosítására:

| Attribútum | Elem típusa | Leírás |
|------------|-------------|---------|
| `login-form` | Form | A bejelentkezési űrlap konténere |
| `username-input` | Input | Felhasználónév beviteli mező |
| `password-input` | Input | Jelszó beviteli mező |
| `login-button` | Button | Bejelentkezés gomb |
| `error-alert` | Div | Hibaüzenet konténer |
| `error-message` | Span/Div | Hibaüzenet szövege |

## Tesztek Futtatása

### Alapértelmezett futtatás (látható böngészővel)
```bash
npm test
```

### Fejlett futtatási opciók

**Csak login tesztek futtatása**:
```bash
npx mocha tests/e2e/login.test.js
```

**Headless módban** (szerkeszd a `login.test.js` fájlt):
```javascript
// Uncomment this line:
options.headless();
```

**Részletes kimenet**:
```bash
npx mocha tests/e2e/login.test.js --reporter spec
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
- Töltsd le a GeckoDriver-t
- Add hozzá a PATH környezeti változóhoz
- Vagy helyezd el a projekt gyökérkönyvtárában

### 3. Timeout hibák
**Hiba**: "Timeout waiting for element"
**Megoldás**:
- Ellenőrizd, hogy a dev szerver fut
- Növeld a timeout értékét lassabb gépeken
- Ellenőrizd a data-test attribútumokat

### 4. Elem nem található
**Hiba**: "Element not found"
**Megoldás**:
- Ellenőrizd a data-test attribútumok helyességét
- Várj az elem megjelenésére (`until.elementLocated()`)
- Ellenőrizd, hogy az oldal teljesen betöltődött

## Teszt Lefedettség

### Funkcionális lefedettség
- ✓ Oldal betöltés
- ✓ Form validáció
- ✓ Sikeres bejelentkezés
- ✓ Sikertelen bejelentkezés
- ✓ Hibaüzenet megjelenítés
- ✓ Hibaüzenet bezárás
- ✓ Munkamenet kezelés
- ✓ Átirányítások
- ✓ Clean state tesztelés

### UI elemek lefedettség
- ✓ Felhasználónév mező
- ✓ Jelszó mező
- ✓ Bejelentkezés gomb
- ✓ Hibaüzenet komponens
- ✓ Bezárás gomb

## Jövőbeli Fejlesztési Lehetőségek

1. **Jelszó láthatóság toggle**: Teszt a jelszó megjelenítés/elrejtés funkciójára
2. **Elfelejtett jelszó**: Teszt az "Elfelejtett jelszó" linkre
3. **Regisztrációs link**: Teszt a regisztrációs oldalra navigálásra
4. **Többnyelvűség**: Különböző nyelveken való tesztelés
5. **Accessibility**: ARIA attribútumok és billentyűzet navigáció tesztelése
6. **Jelszó erősség**: Jelszó követelmények validálása
7. **Automatikus kijelentkezés**: Session timeout tesztelése
8. **Több böngésző**: Chrome, Edge, Safari support
9. **Mobilos nézet**: Responsive design tesztelése
10. **Teljesítmény**: Bejelentkezési sebesség mérése

## Megjegyzések

- A tesztek izoláltan futnak, minden teszt előtt tiszta állapot biztosított
- A tesztek valós backend-del dolgoznak (nem mock)
- A tesztek vizuálisan követhetők fejlesztés közben (látható böngésző)
- Cookie, LocalStorage és SessionStorage tisztítása minden teszt előtt történik
- A timeout értékek optimalizálva vannak Windows környezetre

## Verzió Információk

- **Dokumentáció verzió**: 1.0
- **Utolsó frissítés**: 2026. február 25.
- **Szerző**: Csuka Tamás
- **Projekt**: Réka Frontend - Vizsgaremek

---

*Ez a dokumentáció a login funkcionalitás E2E tesztjeinek részletes leírását tartalmazza. A tesztek biztosítják, hogy a bejelentkezési folyamat minden aspektusa megfelelően működik.*
