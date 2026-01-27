const db = require('../connect');
const bcrypt = require("bcrypt");

// --- ADATBÁZIS SEGÉDFÜGGVÉNYEK ---

// Optimalizálás: Csak azt nézzük meg, létezik-e a név, nem kérjük le az összeset
async function getFelhasznaloIdByNev(nev) {
    const [rows] = await db.query(`SELECT id FROM Felhasznalo WHERE nev = ?`, [nev]);
    return rows[0]; // Visszaadja a sort vagy undefined-ot
}

// Add this function near the top with the other helper functions (after getFelhasznaloIdByNev)
async function ceg_by_adoszam(adoszam) {
    const [rows] = await db.query(`SELECT id FROM Ceg WHERE adoszam = ?`, [adoszam]);
    return rows[0]; // Returns the row or undefined
}

async function ceg_ad(ceg) {
    let fizet = ceg.elofiz ? 1 : 0; // Rövidített if-else
    
    // FONTOS JAVÍTÁS: SQL Injection ellen "?" jeleket használunk!
    // A régi megoldás ('${ceg.nev}') biztonsági rés volt.
    const [rows] = await db.query(
        `INSERT INTO Ceg (nev, adoszam, euAdoszam, cim, email, telefon, elofiz) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`, 
        [ceg.nev, ceg.adoszam, ceg.euAdoszam, ceg.cim, ceg.email, ceg.telefon, fizet]
    );
    return rows;
}

async function felhasznalo_ad(profil, hashedPassword) {
    const [rows] = await db.query(
        `INSERT INTO Felhasznalo (nev, jelszo, kategoria, telephely_cim, telefon) VALUES (?, ?, ?, ?, ?)`,
        [profil.nev, hashedPassword, profil.kategoria, profil.telephely_cim, profil.telefon]
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

module.exports = (app) => {

    // 1. Új felhasználó hozzáadása (Védett)
    app.post('/api/Regisz/Felhasznalo_ad', async (req, res) => {
        try {
            const profil = req.body;
            const requiredFields = ['nev', 'jelszo', 'kategoria', 'telephely_cim', 'telefon', 'cegId'];

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

    app.post('/api/Regisz/Ceg_ad', async (req, res) => {
        try {
            const ceg = req.body;
            const requiredFields = ['adoszam', 'nev', 'cim'];

            for (const field of requiredFields) {
                if (!ceg[field] || ceg[field].toString().trim() === '') {
                    return res.status(422).json({
                        ok: false,
                        uzenet: `Hiányzó mező: ${field}`
                    });
                }
            }

            if (!ceg.email && !ceg.telefon) {
                return res.status(422).json({
                    ok: false,
                    uzenet: "Kérem adjon meg legalább egy elérhetőséget (email vagy telefon)!"
                });
            }

            // OPTIMALIZÁLÁS: Nem kérjük le az összes céget, csak azt az egyet keressük
            const existing = await ceg_by_adoszam(ceg.adoszam);

            if (existing) {
                return res.status(409).json({
                    ok: false,
                    uzenet: "Már létező adószám!",
                    cegId: existing.id
                });
            }

            const tmp = await ceg_ad(ceg);

            return res.status(200).json({
                ok: true,
                uzenet: "Sikeres adatfelvétel!",
                cegId: `${tmp.insertId}`
            });

        } catch (err) {
            console.error(err);
            return res.status(500).json({
                ok: false,
                uzenet: "Szerverhiba! Adatbázis hiba."
            });
        }
    });
};