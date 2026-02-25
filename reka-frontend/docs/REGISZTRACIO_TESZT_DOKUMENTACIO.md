# Regisztráció Teszt Dokumentáció

## Áttekintés

Ez a dokumentum részletezi a regisztrációs funkció end-to-end (E2E) tesztjeit, amelyek Selenium WebDriver és Mocha keretrendszer segítségével készültek. A regisztrációs folyamat lehetővé teszi új cégek és felhasználók regisztrációját a RÉKA rendszerbe.

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
4. Backend szerver futtatása (regisztrációs API endpoint elérhetősége)
5. Node.js függőségek telepítése (`npm install`)

### Konfiguráció
- **Teszt fájl**: `tests/e2e/register.test.js`
- **Timeout**: 60000 ms (60 másodperc)
- **Bejelentkezési URL**: `http://localhost:5173/bejelentkezes`
- **Regisztrációs URL**: `http://localhost:5173/regisztracio`
- **Sikeres regisztráció utáni átirányítás**: `http://localhost:5173/bejelentkezes`
- **Sikeres bejelentkezés utáni átirányítás**: `http://localhost:5173/kezdolap`

## Regisztrációs Folyamat

### Felhasználói Útvonal
1. Bejelentkezési oldal betöltése
2. "Hozzáférés kérése a RÉKA-rendszerhez" link megnyomása
3. Átirányítás a regisztrációs oldalra
4. Cég adatainak kitöltése
5. Felhasználói adatok kitöltése
6. Feltételek elfogadása
7. Regisztráció elküldése
8. Sikeres visszajelzés és átirányítás a login oldalra

## Teszt Esetek

### 1. Sikeres regisztráció új céggel és felhasználóval

**Cél**: Ellenőrizni, hogy egy új cég és felhasználó sikeresen regisztrálható a rendszerbe, majd be tud jelentkezni.

**Teszt azonosító**: `successfully registers a new company and user`

#### Lépések

##### 1. fázis: Navigáció a regisztrációs oldalra
1. Várakozás a bejelentkezési oldal betöltésére
2. "Hozzáférés kérése a RÉKA-rendszerhez" link megkeresése
3. Link megnyomása
4. Várakozás az átirányításra (`/regisztracio`)
5. Regisztrációs form megjelenésének ellenőrzése

##### 2. fázis: Cég adatainak kitöltése
- **Cégnév**: Teszt Kft.
- **Cím**: 1095 Budapest, Soroksári út 2.
- **Adószám (HU)**: 55667788999
- **Adószám (EU)**: HU55667788999
- **Telefon**: +361474279
- **E-mail**: teszt@teszt.hu
- **Bankszámlaszám**: 11700002-76327127-14236732

##### 3. fázis: Felhasználói adatok kitöltése
- **Felhasználónév**: Teszt János
- **Jelszó**: pwd123
- **Telephely címe**: 1095 Budapest, Soroksári út 21.
- **Telefon**: +36308372698

##### 4. fázis: Feltételek elfogadása és küldés
1. ÁSZF checkbox bepipálása
2. Submit gomb láthatóvá tétele (scroll)
3. 300ms várakozás a scroll befejeződésére
4. Submit gomb megnyomása

##### 5. fázis: Sikeres regisztráció ellenőrzése
1. Várakozás a sikeres üzenetre (max 15 másodperc)
2. Sikeres üzenet szövegének ellenőrzése ("Sikeres regisztráció")
3. Várakozás az átirányításra a login oldalra (3 másodperc delay a kódban)
4. URL ellenőrzése (`/bejelentkezes`)

##### 6. fázis: Bejelentkezés az újonnan létrehozott fiókkal
1. Felhasználónév megadása (Teszt János)
2. Jelszó megadása (pwd123)
3. Bejelentkezés gomb megnyomása
4. Várakozás az átirányításra (`/kezdolap`)
5. URL ellenőrzése

##### 7. fázis: Céginformációk ellenőrzése
1. Sidebar menü megnyitása (ha mobil nézetben vagyunk)
2. "Céginformációk" menüpont megkeresése (`[data-test="sb-menu-companyinfo"]`)
3. Menüpont megnyomása
4. Várakozás az átirányításra (`/ceginfo`)
5. Oldal tartalmának ellenőrzése:
   - Cégnév megjelenése (Teszt Kft.)
   - Adószám megjelenése (55667788999)

**Elvárt eredmény**:
- ✓ Sikeres navigáció a regisztrációs oldalra
- ✓ Regisztrációs form megfelelően kitölthető
- ✓ Sikeres üzenet megjelenik
- ✓ Átirányítás a login oldalra
- ✓ Sikeres bejelentkezés az új fiókkal
- ✓ Átirányítás a kezdőlapra
- ✓ Sikeres navigáció a céginformációk oldalra
- ✓ Céginformációk helyesen jelennek meg

**Kritikus validációk**:
- Form jelenléte: `[data-test="registration-form"]`
- Sikeres üzenet: `[data-test="success-alert"]` és `[data-test="success-message"]`
- URL változások: `/bejelentkezes` → `/regisztracio` → `/bejelentkezes` → `/kezdolap` → `/ceginfo`
- Cégadatok megjelenítése

---

### 2. Sikertelen regisztráció már létező adószámmal

**Cél**: Ellenőrizni, hogy a rendszer nem engedélyezi duplikált adószámmal történő regisztrációt.

**Teszt azonosító**: `fails registration with existing tax number`

#### Lépések

##### 1. fázis: Navigáció a regisztrációs oldalra
1. Várakozás a bejelentkezési oldal betöltésére
2. Regisztrációs link megnyomása
3. Várakozás az átirányításra
4. Form megjelenésének ellenőrzése

##### 2. fázis: Cég adatainak kitöltése létező adószámmal
- **Cégnév**: Teszt Kft.
- **Cím**: 1095 Budapest, Soroksári út 2.
- **Adószám (HU)**: 12121212-12 ⚠️ *Létező adószám*
- **Adószám (EU)**: HU12121212-12
- **Telefon**: +361474279
- **E-mail**: teszt@teszt.hu
- **Bankszámlaszám**: 11700002-76327127-14236732

##### 3. fázis: Felhasználói adatok kitöltése
- **Felhasználónév**: Teszt János
- **Jelszó**: pwd123
- **Telephely címe**: 1095 Budapest, Soroksári út 21.
- **Telefon**: +36308372698

##### 4. fázis: Feltételek elfogadása és küldés
1. ÁSZF checkbox bepipálása
2. Submit gomb láthatóvá tétele (scroll)
3. 300ms várakozás
4. Submit gomb megnyomása

##### 5. fázis: Hibaüzenet ellenőrzése
1. Várakozás a hibaüzenetre (max 15 másodperc)
2. Hibaüzenet jelenlétének ellenőrzése
3. Hibaüzenet szövegének validálása (nem üres)
4. URL ellenőrzése (marad a `/regisztracio` oldalon)

**Elvárt eredmény**:
- ✓ Hibaüzenet megjelenik (`[data-test="error-alert"]`)
- ✓ Hibaüzenet szövege nem üres (`[data-test="error-message"]`)
- ✓ A felhasználó a regisztrációs oldalon marad
- ✓ A regisztráció nem jön létre
- ✓ Nincs átirányítás a login oldalra

**Kritikus validációk**:
- Hibaüzenet jelenléte
- URL változatlan marad
- Form állapota megmarad

---

## Teszt Életciklus Hookok

### Before Hook (Inicializálás)
**Feladat**: WebDriver inicializálása és Firefox böngésző indítása

**Folyamat**:
1. Firefox opciók létrehozása
2. Firefox bináris keresése több lehetséges útvonalon:
   - `C:\Program Files\Mozilla Firefox\firefox.exe`
   - `C:\Program Files (x86)\Mozilla Firefox\firefox.exe`
   - `%LOCALAPPDATA%\Mozilla Firefox\firefox.exe`
   - `%PROGRAMFILES%\Mozilla Firefox\firefox.exe`
3. Dinamikus `fs` modul import
4. Bináris elérési út beállítása (ha található)
5. WebDriver Builder inicializálása
6. Firefox böngésző elindítása
7. Sikeres indítás logolása

**Hibakezelés**: 
- Folytatás a következő útvonallal, ha az aktuális nem létezik
- Teljes teszt suite leállítása, ha a Firefox nem indítható

---

### After Hook (Lezárás)
**Feladat**: WebDriver bezárása és cleanup

**Folyamat**:
1. Driver létezésének ellenőrzése
2. Böngésző bezárása (`driver.quit()`)
3. Erőforrások felszabadítása

---

### BeforeEach Hook (Teszt előkészítés)
**Feladat**: Tiszta állapot biztosítása minden teszt előtt

**Folyamat**:
1. **Cookie tisztítás**: Összes cookie törlése
2. **Navigáció**: Bejelentkezési oldalra navigálás
3. **Storage tisztítás**: LocalStorage és SessionStorage törlése
4. **Stabilizáció**: 500ms várakozás az oldal betöltődésére
5. **Átirányítás detektálás**: 
   - URL ellenőrzése
   - Ha `/kezdolap`-ra irányított át, visszalépés `/bejelentkezes`-re
   - 300ms várakozás

**Jelentőség**: 
- Biztosítja, hogy minden teszt izoláltan, tiszta állapotból indul
- Megakadályozza a tesztek közötti interferenciát
- Garantálja a konzisztens kiindulási állapotot

---

## Data-Test Attribútumok

A tesztek a következő `data-test` attribútumokat használják az elemek azonosítására:

### Általános elemek
| Attribútum | Elem típusa | Leírás |
|------------|-------------|---------|
| `login-form` | Form | Bejelentkezési űrlap (kiindulási pont) |
| `registration-form` | Form | Regisztrációs űrlap konténere |
| `submit-button` | Button | Regisztráció küldése gomb |
| `success-alert` | Div | Sikeres regisztráció üzenet konténer |
| `success-message` | Span/Div | Sikeres regisztráció szövege |
| `error-alert` | Div | Hibaüzenet konténer |
| `error-message` | Span/Div | Hibaüzenet szövege |

### Cég adatok beviteli mezői
| Attribútum | Elem típusa | Leírás |
|------------|-------------|---------|
| `company-name-input` | Input | Cégnév mező |
| `company-address-input` | Input | Cég címe mező |
| `tax-number-hu-input` | Input | Magyar adószám mező |
| `tax-number-eu-input` | Input | EU adószám mező |
| `company-phone-input` | Input | Cég telefonszáma mező |
| `company-email-input` | Input | Cég e-mail címe mező |
| `bank-account-input` | Input | Bankszámlaszám mező |

### Felhasználói adatok beviteli mezői
| Attribútum | Elem típusa | Leírás |
|------------|-------------|---------|
| `username-input` | Input | Felhasználónév mező |
| `password-input` | Input | Jelszó mező |
| `site-address-input` | Input | Telephely címe mező |
| `user-phone-input` | Input | Felhasználó telefonszáma mező |

### Egyéb elemek
| Attribútum | Elem típusa | Leírás |
|------------|-------------|---------|
| `terms-checkbox` | Checkbox | ÁSZF elfogadása checkbox |
| `login-button` | Button | Bejelentkezés gomb (login oldalon) |
| `sb-menu-companyinfo` | Link | Céginformációk sidebar menüpont |

---

## Tesztek Futtatása

### Alapértelmezett futtatás
```bash
npm test
```

### Csak regisztrációs tesztek futtatása
```bash
npx mocha tests/e2e/register.test.js
```

### Headless módban
Szerkeszd a `register.test.js` fájlt és kommenteld ki:
```javascript
options.headless();
```

### Részletes kimenet
```bash
npx mocha tests/e2e/register.test.js --reporter spec
```

### Lassított futtatás (debug célra)
A teszt fájlban növeld a `driver.sleep()` értékeket:
```javascript
await driver.sleep(1000); // 1 másodperc
```

---

## Gyakori Hibák és Megoldások

### 1. Firefox bináris nem található
**Hiba**: Firefox nem indul el
**Megoldás**: 
- Telepítsd a Firefoxot
- Ellenőrizd a telepítési útvonalat
- Add hozzá a custom útvonalat a `possibleFirefoxPaths` tömbhöz

### 2. GeckoDriver problémák
**Hiba**: "geckodriver executable needs to be in PATH"
**Megoldás**:
```powershell
# Töltsd le a GeckoDriver-t és add hozzá a PATH-hoz
$env:PATH += ";C:\path\to\geckodriver"
```

### 3. Timeout hibák
**Hiba**: Element not found within timeout
**Megoldás**:
- Növeld a timeout értékeket
- Ellenőrizd a backend futását
- Ellenőrizd a data-test attribútumokat

### 4. Elem nem kattintható
**Hiba**: "Element is not clickable at point"
**Megoldás**:
- Használj scrollIntoView-t
- Várj az animációk befejeződésére
- Ellenőrizd, hogy nincs-e más elem előtte (pl. Vue DevTools)

### 5. Duplikált adószám teszt sikertelen
**Hiba**: Nem jelenik meg hibaüzenet
**Megoldás**:
- Ellenőrizd, hogy a `12121212-12` adószám létezik-e a DB-ben
- Futtasd először a sikeres regisztráció tesztet
- Ellenőrizd a backend validációt

### 6. Átirányítási problémák
**Hiba**: Nem történik átirányítás
**Megoldás**:
- Ellenőrizd a router konfigurációt
- Várj hosszabb időt az átirányításra
- Ellenőrizd a Vue router guard-okat

---

## Tesztelési Stratégia

### Pozitív tesztek (Happy Path)
- ✓ Teljes regisztrációs folyamat
- ✓ Sikeres bejelentkezés új fiókkal
- ✓ Cégadatok megjelenítése

### Negatív tesztek
- ✓ Duplikált adószám kezelése
- További lehetséges negatív esetek:
  - Érvénytelen e-mail formátum
  - Hiányzó kötelező mezők
  - Érvénytelen adószám formátum
  - Érvénytelen bankszámlaszám
  - Túl rövid jelszó

### Edge Case-ek
- Speciális karakterek a mezőkben
- Nagyon hosszú szövegek
- Whitespace karakterek
- SQL injection kísérletek
- XSS támadás próbák

---

## Teszt Lefedettség

### Funkcionális lefedettség
- ✓ Navigáció a regisztrációs oldalra
- ✓ Regisztrációs form megjelenítése
- ✓ Cég adatok validálása
- ✓ Felhasználói adatok validálása
- ✓ ÁSZF elfogadása
- ✓ Sikeres regisztráció
- ✓ Hibaüzenet megjelenítés
- ✓ Átirányítások
- ✓ Bejelentkezés új fiókkal
- ✓ Cégadatok megjelenítése
- ✓ Duplikáció kezelés

### UI elemek lefedettség
- ✓ Összes beviteli mező (11 db)
- ✓ ÁSZF checkbox
- ✓ Submit gomb
- ✓ Sikeres üzenet komponens
- ✓ Hibaüzenet komponens
- ✓ Sidebar navigáció
- ✓ Responsive design (mobil/desktop)

### Biztonsági aspektusok
- ✓ Duplikált adószám elutasítása
- Jelszó titkosítás (backend)
- Input sanitization
- CSRF védelem
- XSS védelem

---

## Jövőbeli Fejlesztési Lehetőségek

### 1. Validációs tesztek bővítése
- [ ] E-mail formátum validáció
- [ ] Telefonszám formátum validáció
- [ ] Adószám formátum validáció (magyar szabvány)
- [ ] Bankszámlaszám formátum validáció
- [ ] Jelszó erősség követelmények

### 2. Hibaüzenetek tesztelése
- [ ] Specifikus hibaüzenetek ellenőrzése
- [ ] Többnyelvű hibaüzenetek
- [ ] Hibaüzenet pozícionálás
- [ ] Több egyidejű hiba megjelenítése

### 3. UX tesztek
- [ ] Form autofill működés
- [ ] Tab navigáció
- [ ] Enter billentyű submit
- [ ] Escape billentyű cancel
- [ ] Focus kezelés

### 4. Accessibility tesztek
- [ ] ARIA attribútumok
- [ ] Screen reader kompatibilitás
- [ ] Keyboard-only navigáció
- [ ] Színkontrasztok
- [ ] Focus indikátorok

### 5. Teljesítmény tesztek
- [ ] Regisztrációs idő mérése
- [ ] Form töltési sebesség
- [ ] Backend válaszidő mérése
- [ ] Oldal betöltési idő

### 6. Adatvédelem és GDPR
- [ ] Adatvédelmi tájékoztató linkje
- [ ] Hozzájárulás kezelése
- [ ] Adatok törlése funkció
- [ ] Adatok exportálása

### 7. Többböngészős tesztelés
- [ ] Chrome support
- [ ] Edge support
- [ ] Safari support
- [ ] Mobilböngészők

### 8. Adatbázis cleanup
- [ ] Teszt adatok automatikus törlése
- [ ] Teszt cégek azonosítása
- [ ] Cleanup script létrehozása

### 9. Mock backend használata
- [ ] Gyorsabb tesztek
- [ ] Függetlenség a backend-től
- [ ] Különböző hibaszituációk szimulálása

### 10. Visual regression testing
- [ ] Screenshot összehasonlítás
- [ ] Layout változások detektálása
- [ ] Cross-browser vizuális konzisztencia

---

## Teszt Adatok Kezelése

### Statikus teszt adatok
```javascript
const validCompany = {
  name: 'Teszt Kft.',
  address: '1095 Budapest, Soroksári út 2.',
  taxNumberHu: '55667788999',
  taxNumberEu: 'HU55667788999',
  phone: '+361474279',
  email: 'teszt@teszt.hu',
  bankAccount: '11700002-76327127-14236732'
};

const validUser = {
  username: 'Teszt János',
  password: 'pwd123',
  siteAddress: '1095 Budapest, Soroksári út 21.',
  phone: '+36308372698'
};

const existingTaxNumber = {
  hu: '12121212-12',
  eu: 'HU12121212-12'
};
```

### Dinamikus teszt adatok generálása
Jövőbeli fejlesztés: Faker.js vagy hasonló könyvtár használata:
```javascript
import { faker } from '@faker-js/faker/locale/hu';

const randomCompany = {
  name: faker.company.name(),
  address: faker.location.streetAddress(),
  email: faker.internet.email()
};
```

---

## Problémamegoldási Útmutató

### Debug módszer
1. **Headless mode kikapcsolása**: Kommenteld ki az `options.headless()` sort
2. **Screenshot készítése hiba esetén**:
```javascript
try {
  // teszt kód
} catch (error) {
  await driver.takeScreenshot().then((image) => {
    require('fs').writeFileSync('error.png', image, 'base64');
  });
  throw error;
}
```

3. **Lassított futtatás**:
```javascript
await driver.sleep(2000); // 2 másodperc várakozás minden lépés után
```

4. **Console log olvasása**:
```javascript
const logs = await driver.manage().logs().get('browser');
console.log('Browser console:', logs);
```

### Gyakori kérdések

**K: Miért kell 3 másodperc a sikeres regisztráció után?**
V: A kódban beépített delay biztosítja, hogy a felhasználó lássa a sikeres üzenetet átirányítás előtt.

**K: Mi történik, ha a sidebar menü nincs látható?**
V: A teszt automatikusan detektálja és megnyitja a hamburger menüt mobil nézetben.

**K: Hogyan lehet gyorsítani a teszteket?**
V: Mock backend használatával és headless módban való futtatással.

**Q: Biztonságos a teszt jelszavak tárolása?**
V: Ez csak teszt környezet, de production-ben használj környezeti változókat.

---

## Teljesítmény Metrikák

### Átlagos futási idők
- **Sikeres regisztráció teszt**: ~25-30 másodperc
- **Sikertelen regisztráció teszt**: ~15-20 másodperc
- **Teljes test suite**: ~45-50 másodperc

### Optimalizálási lehetőségek
- Parallel test execution (jelenleg szekvenciális)
- Headless mode használata (2-3x gyorsabb)
- Mock API (5-10x gyorsabb)
- Shared browser sessions (óvatosan!)

---

## Megjegyzések

- A tesztek valós backend API-t használnak (nem mock)
- Minden teszt teljesen izolált (clean state)
- A tesztek vizuálisan követhetők fejlesztés közben
- Automatikus cleanup minden teszt előtt
- Windows környezetre optimalizált
- Responsive design tesztelés (desktop + mobile view)

---

## Verzió Információk

- **Dokumentáció verzió**: 1.0
- **Utolsó frissítés**: 2026. február 25.
- **Szerző**: Csuka Tamás
- **Projekt**: Réka Frontend - Vizsgaremek
- **Test Suite**: Registration E2E Tests

---

## Kapcsolódó Dokumentációk

- [Bejelentkezés Teszt Dokumentáció](./LOGIN_TESZT_DOKUMENTACIO.md)
- [JWT Implementation Summary](./JWT_IMPLEMENTATION_SUMMARY.md)
- [Backend Update Needed](./BACKEND_UPDATE_NEEDED.md)

---

*Ez a dokumentáció a regisztrációs funkcionalitás E2E tesztjeinek részletes leírását tartalmazza. A tesztek biztosítják, hogy az új cégek és felhasználók regisztrációja minden aspektusában megfelelően működik, beleértve a validációkat, hibaüzeneteket és a teljes felhasználói élményt.*
