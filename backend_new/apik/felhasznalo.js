const db = require('../connect');
const bcrypt = require("bcrypt");

// --- ADATBÁZIS SEGÉDFÜGGVÉNYEK ---

async function getFelhasznaloIdByNev(nev) {
    const [rows] = await db.query(`SELECT id FROM Felhasznalo WHERE nev = ?`, [nev]);
    return rows[0]; 
}

async function felhasznalo_ad(profil, hashedPassword) {
    // A logikai értékeket biztosítjuk, hogy 1 vagy 0 formátumban kerüljenek az adatbázisba
    const [rows] = await db.query(
        `INSERT INTO Felhasznalo (nev, jelszo, telephely_cim, telefon, rendeles_osszkesz, rendeles_lead, szamla_keszit, raktar_kezel) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            profil.nev, 
            hashedPassword, 
            profil.telephely_cim, 
            profil.telefon || null, 
            profil.rendeles_osszkesz ? 1 : 0, 
            profil.rendeles_lead ? 1 : 0, 
            profil.szamla_keszit ? 1 : 0, 
            profil.raktar_kezel ? 1 : 0
        ]
    );
    return rows;
}

async function alkalmazott_ad(profil, tmp) {
    await db.query(
        `INSERT INTO Ceg_alkalmazott (cegId, felhasznaloId) VALUES (?, ?)`, 
        [profil.cegId, tmp.insertId]
    );
}

// ÚJ LOGIKA: Dinamikusan építjük fel a lekérdezést, hogy a jelszó opcionális legyen
async function felhasznalo_update(profil, hashedPassword) {
    let query = `UPDATE Felhasznalo SET nev = ?, telephely_cim = ?, telefon = ?, rendeles_osszkesz = ?, rendeles_lead = ?, szamla_keszit = ?, raktar_kezel = ?`;
    let params = [
        profil.nev, 
        profil.telephely_cim, 
        profil.telefon || null, 
        profil.rendeles_osszkesz ? 1 : 0, 
        profil.rendeles_lead ? 1 : 0, 
        profil.szamla_keszit ? 1 : 0, 
        profil.raktar_kezel ? 1 : 0
    ];

    // Ha van új jelszó, hozzáfűzzük a frissítéshez
    if (hashedPassword) {
        query += `, jelszo = ?`;
        params.push(hashedPassword);
    }

    query += ` WHERE id = ?`;
    params.push(profil.id);

    const [rows] = await db.query(query, params);
    return rows;
}

async function alkalmazottak_list(cegId) {
    const [rows] = await db.query(
        `SELECT f.id, f.nev, f.rendeles_osszkesz, f.rendeles_lead, f.szamla_keszit, f.raktar_kezel, f.telephely_cim, f.telefon 
         FROM Ceg_alkalmazott ca 
         INNER JOIN Felhasznalo f ON f.id = ca.felhasznaloId 
         INNER JOIN Ceg c ON c.id = ca.cegId 
         WHERE c.id = ?`, 
        [cegId]
    );
    return rows;
}


// --- ROUTER ---

module.exports = (app, authenticateToken) => {

    // 1. Új felhasználó hozzáadása (Védett)
    app.post('/api/Felhasznalo_ad', authenticateToken, async (req, res) => {
        try {
            const profil = req.body;
            // JAVÍTVA: cegId kötelező lett, telefon kikerült a kötelezőkből!
            const requiredFields = ['nev', 'jelszo', 'telephely_cim', 'cegId'];

            for (const field of requiredFields) {
                if (!profil[field] || profil[field].toString().trim() === '') {
                    return res.status(422).json({
                        ok: false,
                        uzenet: `Hiányzó kötelező mező: ${field}`
                    });
                }
            }

            // Jogosultságok ellenőrzése (elfogadunk true/false-t vagy 0/1-et is)
            const permissionFields = ['rendeles_osszkesz', 'rendeles_lead', 'szamla_keszit', 'raktar_kezel'];
            for (const field of permissionFields) {
                if (profil[field] !== undefined && typeof profil[field] !== 'boolean' && profil[field] !== 0 && profil[field] !== 1) {
                    return res.status(422).json({
                        ok: false,
                        uzenet: `Érvénytelen érték a(z) ${field} mezőben (csak logikai érték lehet)`
                    });
                }
            }

            const existingUser = await getFelhasznaloIdByNev(profil.nev);

            if (existingUser) {
                return res.status(409).json({
                    ok: false,
                    uzenet: "A felhasználó név már létezik"
                });
            }

            const hashedPassword = await bcrypt.hash(profil.jelszo, 10);
            
            const tmp = await felhasznalo_ad(profil, hashedPassword);
            await alkalmazott_ad(profil, tmp);

            return res.status(200).json({
                ok: true,
                uzenet: "Sikeres adatfelvétel!"
            });

        } catch (err) {
            console.error(err);
            return res.status(500).json({
                ok: false,
                uzenet: "Szerverhiba! Adatbázis hiba."
            });
        }
    });

    // 2. Felhasználó módosítása (Védett)
    app.post('/api/Felhasznalo_update', authenticateToken, async (req, res) => {
        try {
            const profil = req.body;
            // JAVÍTVA: jelszo és telefon kikerült a kötelezőkből!
            const requiredFields = ['id', 'nev', 'telephely_cim'];

            for (const field of requiredFields) {
                if (!profil[field] || profil[field].toString().trim() === '') {
                    return res.status(422).json({
                        ok: false,
                        uzenet: `Hiányzó kötelező mező: ${field}`
                    });
                }
            }

            const permissionFields = ['rendeles_osszkesz', 'rendeles_lead', 'szamla_keszit', 'raktar_kezel'];
            for (const field of permissionFields) {
                if (profil[field] !== undefined && typeof profil[field] !== 'boolean' && profil[field] !== 0 && profil[field] !== 1) {
                    return res.status(422).json({
                        ok: false,
                        uzenet: `Érvénytelen érték a(z) ${field} mezőben`
                    });
                }
            }

            // JAVÍTVA: Csak akkor hashelünk új jelszót, ha meg is adták
            let hashedPassword = null;
            if (profil.jelszo && profil.jelszo.trim() !== '') {
                hashedPassword = await bcrypt.hash(profil.jelszo, 10);
            }

            await felhasznalo_update(profil, hashedPassword);

            return res.status(200).json({
                ok: true,
                uzenet: "Sikeres módosítás!"
            });

        } catch (err) {
            console.error(err);
            return res.status(500).json({
                ok: false,
                uzenet: "Szerverhiba! Adatbázis hiba."
            });
        }
    });

    // 4. Alkalmazottak listázása (Védett)
    app.post('/api/Alkalmazottak', authenticateToken, async (req, res) => {
        try {
            if (!req.body.id) {
                return res.status(400).json({ ok: false, uzenet: "Hiányzó Cég ID!" });
            }

            const rows = await alkalmazottak_list(req.body.id);
            
            return res.status(200).json({ 
                ok: true, 
                alkalmazottak: rows 
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Adatbázis hiba!" });
        }
    });
};