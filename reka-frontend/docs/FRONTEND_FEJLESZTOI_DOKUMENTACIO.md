# Frontend fejlesztői dokumentáció (Reka Frontend)

## 1. Áttekintés
Ez a repository-rész a **REKA** webalkalmazás frontendje. A projekt **Vue 3**-ra épül (Single File Componentek – `.vue`), a build/dev környezet **Vite**.

**Fő célok**
- Felhasználói felület biztosítása (guest + bejelentkezett + admin/partner szerepkörök szerint).
- Token-alapú autentikáció kezelése (JWT) a kliens oldalon.
- Oldalak és navigáció (Vue Router).
- Állapotkezelés store-okkal (Pinia jellegű store struktúra a `src/stores` alatt).

Kapcsolódó (részletesebb) doksik: lásd a `docs/` mappa meglévő fájljait (JWT, Permissions, Auto logout, Cart, tesztdoksi stb.).

---

## 2. Technológiai stack
- **Vue 3** (Composition API, `script setup`)
- **Vite** (dev server + build)
- **Vue Router** (kliens oldali routing)
- **Axios** (HTTP kliens; központosított konfiguráció a `src/axios.js` fájlban)
- **E2E tesztek**: `tests/e2e/*` (Playwright / hasonló futtató a projekt beállításaitól függően)

---

## 3. Projektstruktúra

```
reka-frontend/
  index.html
  vite.config.js
  package.json
  public/
  src/
    main.js
    App.vue
    router.js
    axios.js
    assets/
    components/
    pages/
    stores/
  tests/
    e2e/
  docs/
```

### 3.1 `src/main.js`
Belépési pont: itt történik tipikusan az app létrehozása, router és store regisztrálás, valamint a globális stílusok importja.

### 3.2 `src/App.vue`
Root komponens. Ide kerülnek a globális layoutelemek (pl. navigációs sáv), és itt renderelődik a `router-view`.

### 3.3 `src/router.js`
- Route-ok definíciója.
- Route guard(ok): autentikáció, szerepkör/jogosultság, 404 kezelés.
- Hibás elérés esetén query paraméterekkel történő visszairányítás (pl. `?error=admin-only`).

### 3.4 `src/axios.js`
Központi Axios konfiguráció.

Javasolt felelősségek (a meglévő megoldás alapján):
- `baseURL` beállítás
- JWT token automatikus csatolása requestekhez (interceptor)
- 401/403 kezelése (pl. logout + redirect)

### 3.5 `src/stores/*`
Központi állapotkezelés.

- `src/stores/auth.js`
  - belépés/kilépés
  - token tárolás
  - bejelentkezett felhasználó és cég (pl. `authStore.ceg`)
  - jogosultságok / szerepkörök
- `src/stores/cart.js`
  - kosárban lévő tételek állapota
  - mennyiségek, összegzés

### 3.6 `src/pages/*`
Route-szintű oldalak (a router jellemzően ezekre mutat).

**Példák**
- `Kezdolap.vue`: kezdőoldal + route error üzenetek megjelenítése.
- `Bejelentkezes.vue`, `Regisztracio.vue`: auth felületek.
- `Raktar.vue`, `UserList.vue`: admin/jogosultság függő oldalak.

### 3.7 `src/components/*`
Újrafelhasználható UI elemek.
- `NavBar.vue`, `NavBarGuest.vue`: navigáció bejelentkezett / guest állapothoz.

---

## 4. Routing és hibakezelés

### 4.1 Route hibák query paraméterrel
A `Kezdolap.vue` jelenleg kezel több, route guardból érkező hibát, a query paraméter alapján:
- `?error=page-not-found`
- `?error=admin-only`
- `?error=insufficient-permissions`

A minta lényege:
- `useRoute()`-tal kiolvassa a query-t
- `showError` + `errorMessage` state-nek megfelelően megjelenít egy dismisselhető alertet
- auto-hide 5 másodperc után

**Fejlesztői konvenció**
- Ha guard alapján redirect történik, a router push/replace során állíts query paramétert, majd a céloldal (pl. Kezdőlap) jelenítse meg a felhasználóbarát hibaüzenetet.

---

## 5. Autentikáció és jogosultság (összefoglaló)
A részletek a `docs/JWT_IMPLEMENTATION*.md` és `docs/PERMISSIONS_IMPLEMENTATION.md` fájlokban vannak.

A frontend tipikus folyamata:
1. Bejelentkezéskor a backend visszaadja a JWT-t.
2. A token eltárolásra kerül (pl. `localStorage`/`sessionStorage` vagy store).
3. Az Axios request interceptor hozzáadja az `Authorization: Bearer <token>` headert.
4. Route guardok biztosítják, hogy a védett oldalak csak megfelelő szerepkörrel legyenek elérhetők.
5. Token lejárat / 401 esetén automatikus logout és redirect.

---

## 6. UI/UX és stílus
- Globális CSS: `src/assets/global.css`
- Betűkészletek: `src/assets/fonts.css` + `public/*.ttf`

Konvenciók:
- Oldal layout: `pages/*` felelős a fő tartalomért.
- Újrafelhasználható elemek: `components/*`.
- Tesztelhetőség: ahol lehet, `data-test` attribútum használata.

---

## 7. E2E tesztek
A tesztek a `tests/e2e/` mappában vannak.

Általános konvenciók:
- `setup.js`: közös beállítások, login helper, seed adatok (ha van).
- `*.test.js`: user flow tesztek.
- A UI elemeket lehetőség szerint `data-test` szelektorokkal célozzuk (stabilabb, mint class/id).

---

## 8. Fejlesztési környezet

### 8.1 Követelmények
- Node.js + npm (verzió a `package.json`/CI alapján)

### 8.2 Elérhető scriptek
A pontos lista a `package.json`-ban található.

Tipikusak:
- `dev`: Vite dev server
- `build`: production build
- `preview`: build preview
- `test` / `test:e2e`: tesztek futtatása

---

## 9. Konvenciók és javaslatok

### 9.1 Kódstílus
- Composition API (`ref`, `computed`, `watch`, `onMounted`).
- Oldalanként minimalizált üzleti logika; ahol lehet, store-ba vagy szolgáltatás (service) rétegbe szervezni.

### 9.2 Hibakezelés
- API hibákat egy helyen normalizálni (pl. Axios response interceptor).
- User-facing üzenetek egységes formában (toast/alert komponens).

### 9.3 Új oldal hozzáadása (ajánlott lépések)
1. Új fájl `src/pages/UjOldal.vue`.
2. Új route hozzáadása a `src/router.js`-ban.
3. Ha védett: guard + redirect `?error=...` paraméterrel.
4. UI tesztszelektorok (`data-test`).
5. E2E teszt hozzáadása `tests/e2e/`.

---

## 10. Gyakori hibák / troubleshooting
- **Üres oldal / route loop**: ellenőrizd a guard feltételeit és a redirect célját.
- **401 a legtöbb kérésre**: token nincs csatolva (Axios interceptor), vagy lejárt (auto logout).
- **E2E instabil tesztek**: használj `data-test` szelektorokat, kerüld a timing alapú várakozást.

---

## 11. Kapcsolódó dokumentumok
- `docs/JWT_IMPLEMENTATION.md`
- `docs/JWT_QUICK_REFERENCE.md`
- `docs/AUTO_LOGOUT_IMPLEMENTATION.md`
- `docs/PERMISSIONS_IMPLEMENTATION.md`
- `docs/CART_IMPLEMENTATION.md`
- `docs/*TESZT_DOKUMENTACIO.md`
