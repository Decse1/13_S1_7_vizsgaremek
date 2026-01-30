# Backend Update Required for Order Fulfillment

## File: backend/apik/rendeles.js

### Change Required in `/api/Beerkezett_rendeles` endpoint

Find this query (around line 117):

```javascript
const [rendeletTermek] = await db.query(
    `SELECT 
        R.id AS rendeles_id,
        R.rendeles_szam,
        R.datum,
        F.nev AS szallitasi_nev,
        T.nev AS termek_neve, 
        RT.mennyiseg AS rendelt_mennyiseg
    FROM Rendeles R 
    JOIN Partnerseg P ON R.partnerseg = P.id 
    JOIN RendelesTetel RT ON R.id = RT.rendeles_id 
    JOIN Termek T ON RT.termek_id = T.id 
    JOIN Felhasznalo F ON R.sz_cim = F.id
    WHERE P.elado = ? AND P.vevo = ?
    ORDER BY R.datum DESC`,
    [cegId, vevo.vevo_id]
);
```

**Replace with:**

```javascript
const [rendeletTermek] = await db.query(
    `SELECT 
        R.id AS rendeles_id,
        R.rendeles_szam,
        R.datum,
        R.status,
        F.nev AS szallitasi_nev,
        T.id AS termek_id,
        T.nev AS termek_neve, 
        RT.id AS rendelestetel_id,
        RT.mennyiseg AS rendelt_mennyiseg
    FROM Rendeles R 
    JOIN Partnerseg P ON R.partnerseg = P.id 
    JOIN RendelesTetel RT ON R.id = RT.rendeles_id 
    JOIN Termek T ON RT.termek_id = T.id 
    JOIN Felhasznalo F ON R.sz_cim = F.id
    WHERE P.elado = ? AND P.vevo = ?
    ORDER BY R.datum DESC`,
    [cegId, vevo.vevo_id]
);
```

**Changes:**
1. Added `R.status` - to show order status
2. Added `T.id AS termek_id` - product ID for inventory updates
3. Added `RT.id AS rendelestetel_id` - order item ID for updates

After making this change, restart your backend server.
