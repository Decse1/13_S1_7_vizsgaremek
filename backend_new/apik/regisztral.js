const db = require('../connect');
const bcrypt = require("bcrypt");
const szamla = require('./szamla'); // Bár itt nincs használva, meghagytam, ha később kell

// --- ADATBÁZIS SEGÉDFÜGGVÉNYEK ---

async function getFelhasznaloIdByNev(nev) {
    const [rows] = await db.query(`SELECT id FROM Felhasznalo WHERE nev = ?`, [nev]);
    return rows[0]; 
}

async function ceg_by_adoszam(adoszam) {
    const [rows] = await db.query(`SELECT id FROM Ceg WHERE adoszam = ?`, [adoszam]);
    return rows[0];
}

async function ceg_ad(ceg, fizet) {
    // ÚJ SÉMA JAVÍTÁS: Bekerült a 'rendeles_minta' oszlop is!
    const [rows] = await db.query(
        `INSERT INTO Ceg (nev, adoszam, euAdoszam, cim, email, telefon, elofiz, szamla_minta, rendeles_minta, szamlaszam) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [ceg.nev, ceg.adoszam, ceg.euAdoszam, ceg.cim, ceg.email, ceg.telefon, fizet, ceg.szamla_minta, ceg.rendeles_minta, ceg.szamlaszam]
    );
    return rows;
}

async function felhasznalo_ad(profil, hashedPassword) {
    // Biztonságos logikai konverzió és opcionális telefon kezelés
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

// --- ROUTER ---

module.exports = (app) => {

    // 1. Új felhasználó hozzáadása (Regisztráció része)
    app.post('/api/Regisz/Felhasznalo_ad', async (req, res) => {
        try {
            const profil = req.body;
            // JAVÍTÁS: cegId kötelező, telefon kikerült!
            const requiredFields = ['nev', 'jelszo', 'telephely_cim', 'cegId'];

            for (const field of requiredFields) {
                if (!profil[field] || profil[field].toString().trim() === '') {
                    return res.status(422).json({
                        ok: false,
                        uzenet: `Hiányzó kötelező mező: ${field}`
                    });
                }
            }

            // Jogosultságok biztonságos ellenőrzése
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

    // 2. Új cég hozzáadása (Regisztráció része)
    app.post('/api/Regisz/Ceg_ad', async (req, res) => {
        try {
            const ceg = req.body;
            let fizet = ceg.elofiz ? 1 : 0;
            let requiredFields;
            
            // JAVÍTÁS: Ha előfizető, a rendeles_minta is kötelező!
            if(fizet === 1){
                requiredFields = ['adoszam', 'nev', 'cim', 'szamla_minta', 'rendeles_minta', 'szamlaszam'];
            }
            else{
                requiredFields = ['adoszam', 'nev', 'cim', 'szamlaszam'];
            }

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

            const existing = await ceg_by_adoszam(ceg.adoszam);

            if (existing) {
                return res.status(409).json({
                    ok: false,
                    uzenet: "Már létező adószám!",
                    cegId: existing.id
                });
            }

            const tmp = await ceg_ad(ceg, fizet);

            return res.status(200).json({
                ok: true,
                uzenet: "Sikeres adatfelvétel!",
                cegId: tmp.insertId // Kivettem a stringgé konvertálást (template literal), így tiszta számként (integer) megy vissza a frontendre
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