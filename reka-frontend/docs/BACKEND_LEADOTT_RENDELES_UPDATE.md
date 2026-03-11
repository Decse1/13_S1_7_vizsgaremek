# Backend Update Required for Leadott Rendelés

## Issue
The `Leadott_rendeles` endpoint doesn't return the `rendeles_id` (R.id), which is needed for downloading invoices from the sent orders page.

## Required Change

In the backend file `backend_new/apik/rendeles.js`, update the `Leadott_rendeles` endpoint query to include `R.id`:

### Current Query (Line ~96):
```javascript
const [rows] = await db.query(
    `SELECT 
        C.id AS elado_id, C.nev AS elado_neve, 
        T.nev AS termek_neve, 
        RT.mennyiseg AS rendelt_mennyiseg,  
        R.rendeles_szam, R.status, R.datum, R.szamla_kesz, R.sztorno
    FROM Rendeles R 
    JOIN Partnerseg P ON R.partnerseg = P.id 
    JOIN Ceg C ON P.elado = C.id 
    JOIN RendelesTetel RT ON R.id = RT.rendeles_id 
    JOIN Termek T ON RT.termek_id = T.id 
    WHERE P.vevo = ?
    ORDER BY R.datum DESC`, 
    [cegId]
);
```

### Updated Query (Add R.id):
```javascript
const [rows] = await db.query(
    `SELECT 
        C.id AS elado_id, C.nev AS elado_neve, 
        T.nev AS termek_neve, 
        RT.mennyiseg AS rendelt_mennyiseg,  
        R.id AS rendeles_id,
        R.rendeles_szam, R.status, R.datum, R.szamla_kesz, R.sztorno
    FROM Rendeles R 
    JOIN Partnerseg P ON R.partnerseg = P.id 
    JOIN Ceg C ON P.elado = C.id 
    JOIN RendelesTetel RT ON R.id = RT.rendeles_id 
    JOIN Termek T ON RT.termek_id = T.id 
    WHERE P.vevo = ?
    ORDER BY R.datum DESC`, 
    [cegId]
);
```

### Update the response mapping (Line ~110):
```javascript
rendelesekMap.get(row.elado_id).termekek.push({
    rendeles_id: row.rendeles_id,  // Add this line
    termek_neve: row.termek_neve,
    rendelt_mennyiseg: row.rendelt_mennyiseg,
    rendeles_szam: row.rendeles_szam,
    status: row.status,
    datum: row.datum,
    szamla_kesz: row.szamla_kesz,
    sztorno: row.sztorno
});
```

## Why This Change is Needed
- The frontend needs the `rendeles_id` to call the `/Szamla_create` endpoint
- This enables buyers to download invoices for their sent orders when `szamla_kesz = 1`
- Matches the pattern used in `Beerkezett_rendeles` endpoint
