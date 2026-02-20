const db = require('../connect');
const bcrypt = require("bcrypt");

// --- ADATBÁZIS SEGÉDFÜGGVÉNYEK ---

// Optimalizálás: Csak azt nézzük meg, létezik-e a név, nem kérjük le az összeset
async function getFelhasznaloIdByNev(nev) {
    const [rows] = await db.query(`SELECT id FROM Felhasznalo WHERE nev = ?`, [nev]);
    return rows[0]; // Visszaadja a sort vagy undefined-ot
}

async function felhasznalo_ad(profil, hashedPassword) {
    const [rows] = await db.query(
        `INSERT INTO Felhasznalo (nev, jelszo, telephely_cim, telefon, rendeles_osszkesz, rendeles_lead, szamla_keszit, raktar_kezel) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [profil.nev, hashedPassword, profil.telephely_cim, profil.telefon, profil.rendeles_osszkesz, profil.rendeles_lead, profil.szamla_keszit, profil.raktar_kezel]
    );
    return rows;
}

async function alkalmazott_ad(profil, tmp) {
    // Itt is ? paramétereket használunk
    await db.query(
        `INSERT INTO Ceg_alkalmazott (cegId, felhasznaloId) VALUES (?, ?)`, 
        [profil.cegId, tmp.insertId]
    );
}

async function felhasznalo_update(profil, hashedPassword) {
    const [rows] = await db.query(
        `UPDATE Felhasznalo SET nev = ?, jelszo = ?, telephely_cim = ?, telefon = ?, rendeles_osszkesz = ?, rendeles_lead = ?, szamla_keszit = ?, raktar_kezel = ? WHERE id = ?`,
        [profil.nev, hashedPassword, profil.telephely_cim, profil.telefon, profil.rendeles_osszkesz, profil.rendeles_lead, profil.szamla_keszit, profil.raktar_kezel, profil.id]
    );
    return rows;
}

async function alkalmazottak_list(cegId) {
    // JAVÍTÁS: ? paraméter használata SQL injection ellen
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
            const requiredFields = ['nev', 'jelszo', 'telephely_cim', 'telefon', 'rendeles_osszkesz', 'rendeles_lead', 'szamla_keszit', 'raktar_kezel'];

            for (const field of requiredFields) {
                if (!profil[field] || profil[field].toString().trim() === '') {
                    return res.status(422).json({
                        ok: false,
                        uzenet: `Hiányzó mező: ${field}`
                    });
                }
            }

            // Ellenőrizzük, hogy a felhasználónév létezik-e (Gyorsabb lekérdezés)
            const existingUser = await getFelhasznaloIdByNev(profil.nev);

            if (existingUser) {
                return res.status(409).json({
                    ok: false,
                    uzenet: "A felhasználó név már létezik"
                });
            }

            // Jelszó titkosítása
            const hashedPassword = await bcrypt.hash(profil.jelszo, 10);

            // Adatbázis műveletek
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
            const requiredFields = ['nev', 'jelszo', 'rendeles_osszkesz', 'rendeles_lead', 'szamla_keszit', 'raktar_kezel', 'telephely_cim', 'telefon', 'cegId', 'id'];

            for (const field of requiredFields) {
                if (!profil[field] || profil[field].toString().trim() === '') {
                    return res.status(422).json({
                        ok: false,
                        uzenet: `Hiányzó mező: ${field}`
                    });
                }
            }

            // FONTOS: Módosításnál is hashelni kell a jelszót, 
            // különben nem fog tudni belépni a user!
            const hashedPassword = await bcrypt.hash(profil.jelszo, 10);

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
            if (!req.body.id) { // Ez a cég ID-ja
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