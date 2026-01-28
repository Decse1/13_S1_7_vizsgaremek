const db = require('../connect');

// --- ADATBÁZIS MŰVELETEK ---

async function ceg_ad(ceg) {
    let fizet = ceg.elofiz ? 1 : 0; // Rövidített if-else
    
    // FONTOS JAVÍTÁS: SQL Injection ellen "?" jeleket használunk!
    // A régi megoldás ('${ceg.nev}') biztonsági rés volt.
    const [rows] = await db.query(
        `INSERT INTO Ceg (nev, adoszam, euAdoszam, cim, email, telefon, elofiz, szamla_minta, szamlaszam) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [ceg.nev, ceg.adoszam, ceg.euAdoszam, ceg.cim, ceg.email, ceg.telefon, fizet, ceg.szamla_minta, ceg.szamlaszam]
    );
    return rows;
}

async function ceg_update(ceg) {
    const [rows] = await db.query(
        `UPDATE Ceg SET nev = ?, adoszam = ?, euAdoszam = ?, cim = ?, email = ?, telefon = ?, elofiz = ?, szamlaszam = ? WHERE id = ?`,
        [ceg.nev, ceg.adoszam, ceg.euAdoszam, ceg.cim, ceg.email, ceg.telefon, ceg.elofiz, ceg.szamlaszam, ceg.id]
    );
    return rows;
}

async function ceg_all(){
    const [rows] = await db.query(`SELECT * FROM Ceg`);
    return rows;
}

// Új segédfüggvény: Csak egy céget kérdez le adószám alapján (gyorsabb)
async function ceg_by_adoszam(adoszam) {
    const [rows] = await db.query(`SELECT id FROM Ceg WHERE adoszam = ?`, [adoszam]);
    return rows[0]; // Visszaadja a céget vagy undefined-ot
}

// --- ROUTER RÉSZ ---

// Itt adjuk át a második paramétert: authenticateToken
module.exports = (app, authenticateToken) => {

    // 1. Cégek listázása (Védett)
    app.get('/api/Ceg_osszes', authenticateToken, async (req, res) => {
        try {
            // Opcionális: Ha tudni akarod ki kérte le:
            // console.log("Lekérdező:", req.user.nev); 
            
            const cegek = await ceg_all();
            return res.status(200).json({ ok: true, cegek });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Adatbázis hiba!" });
        }
    });

    // 2. Új cég felvétele (Védett)
    app.post('/api/Ceg_ad', authenticateToken, async (req, res) => {
        try {
            const ceg = req.body;
            const requiredFields = ['adoszam', 'nev', 'cim', 'szamlaszam'];

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

    // 3. Cég módosítása (Védett)
    app.post('/api/Ceg_update', authenticateToken, async (req, res) => {
        try {
            const ceg = req.body;
            const requiredFields = ['nev', 'adoszam', 'cim', 'id', 'szamlaszam'];

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

            await ceg_update(ceg);

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
};