const db = require('../connect');

// --- ADATBÁZIS SEGÉDFÜGGVÉNYEK ---

async function szuro_pCeg(pCeg) {
    const [rows] = await db.query(
        `SELECT termek_kategoria.id AS katId, termek_kategoria.nev AS katNev 
         FROM Termek_kategoria 
         INNER JOIN Termek ON Termek_kategoria.id = Termek.kategoria 
         WHERE Termek.tulajdonos = ? 
         GROUP BY termek_kategoria.id`, 
        [pCeg]
    );
    return rows;
}

async function szurt_termek(szuro, pCeg){
    const [rows] = await db.query(
        `SELECT * FROM Termek WHERE kategoria = ? AND tulajdonos = ?`, 
        [szuro, pCeg]
    );
    return rows; 
}

async function osszes_termek(pCeg){
    const [rows] = await db.query(
        `SELECT * FROM Termek WHERE tulajdonos = ?`, 
        [pCeg]
    );
    return rows;
}

async function termek_ad(termek) {
    const [rows] = await db.query(
        `INSERT INTO Termek (tulajdonos, nev, cikkszam, mennyiseg, kiszereles, min_vas_menny, leiras, ar, kategoria, afa_kulcs) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [
            termek.tulajdonos, termek.nev, termek.cikkszam || null, termek.mennyiseg, 
            termek.kiszereles, termek.min_vas_menny, termek.leiras || null, termek.ar, 
            termek.kategoria, termek.afa_kulcs
        ]
    );
    return rows;
}

async function termek_update(termek) {
    const [rows] = await db.query(
        `UPDATE Termek SET tulajdonos = ?, nev = ?, cikkszam = ?, mennyiseg = ?, kiszereles = ?, min_vas_menny = ?, leiras = ?, ar = ?, kategoria = ?, afa_kulcs = ? 
         WHERE id = ?`,
        [
            termek.tulajdonos, termek.nev, termek.cikkszam || null, termek.mennyiseg, 
            termek.kiszereles, termek.min_vas_menny, termek.leiras || null, termek.ar, 
            termek.kategoria, termek.afa_kulcs, termek.id
        ]
    );
    return rows;
}

// --- ROUTER ---

module.exports = (app, authenticateToken) => {

    // 1. Összes kategória (Védett)
    app.post('/api/Kategoriak_all', authenticateToken, async (req, res) => {
        try {
            const [rows] = await db.query('SELECT * FROM Termek_kategoria');
            return res.status(200).json({ ok: true, kategoriak: rows});
        } catch (err) {
            console.error(err);
            res.status(500).json({ ok: false, uzenet: "Adatbázis hiba!" });
        }
    });

    // 2. Szűrők lekérése cég alapján (Védett)
    app.post('/api/Kategoriak_szurt', authenticateToken, async (req, res) => {
        try {
            const pCeg = req.body.id;
            
            if (!pCeg) return res.status(422).json({ ok: false, uzenet: "Hiányzó cég ID!" });

            const szurok = await szuro_pCeg(pCeg);
            
            if (!szurok || szurok.length === 0) {
                return res.status(404).json({ ok: false, uzenet: "Nincsenek szűrők!" });
            } else {
                return res.status(200).json({ ok: true, uzenet: "", szurok });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ ok: false, uzenet: "Adatbázis hiba!" });
        }
    });

    // 3. Szűrt termékek lekérése (Védett)
    app.post('/api/Szurt_termek', authenticateToken, async (req, res) => {
        try {
            const szuro = req.body.szuro;
            const pCeg = req.body.id;

            if (!pCeg || !szuro) return res.status(422).json({ ok: false, uzenet: "Hiányzó adatok!" });

            const termekek = await szurt_termek(szuro, pCeg);
            return res.status(200).json({ ok: true, uzenet: "", termekek: termekek || [] });
        } catch (err) {
            console.error(err);
            res.status(500).json({ ok: false, uzenet: "Adatbázis hiba!" });
        }
    });

    // 4. Összes termék lekérése (Védett)
    app.post('/api/Osszes_termek', authenticateToken, async (req, res) => {
        try {
            const pCeg = req.body.id;
            
            if (!pCeg) return res.status(422).json({ ok: false, uzenet: "Hiányzó cég ID!" });

            const termekek = await osszes_termek(pCeg); 
            
            return res.status(200).json({ ok: true, uzenet: "", termekek: termekek || [] });
        } catch (err) {
            console.error(err);
            res.status(500).json({ ok: false, uzenet: "Adatbázis hiba!" });
        }
    });

    // 5. Termék hozzáadása (Védett)
    app.post('/api/Termek_ad', authenticateToken, async (req, res) => {
        try {
            const termek = req.body;

            const requiredFields = [
                'mennyiseg', 'kiszereles', 'min_vas_menny', 'ar', 
                'kategoria', 'afa_kulcs', 'tulajdonos', 'nev'
            ];

            for (const field of requiredFields) {
                // JAVÍTÁS: A 0 érték engedélyezése, undefined és null szűrése
                if (termek[field] === undefined || termek[field] === null || termek[field].toString().trim() === '') {
                    return res.status(422).json({
                        ok: false,
                        uzenet: `Hiányzó vagy érvénytelen mező: ${field}`
                    });
                }
            }

            await termek_ad(termek);

            return res.status(200).json({
                ok: true,
                uzenet: "Sikeres termék hozzáadás"
            });

        } catch (err) {
            console.error(err);
            return res.status(500).json({
                ok: false,
                uzenet: "Szerverhiba! Adatbázis hiba."
            });
        }
    });

    // 6. Termék frissítése (Védett)
    app.post('/api/Termek_update', authenticateToken, async (req, res) => {
        try {
            const termek = req.body;
            
            const requiredFields = [
                'id', 'mennyiseg', 'kiszereles', 'min_vas_menny', 'ar', 
                'kategoria', 'afa_kulcs', 'tulajdonos', 'nev'
            ];

            for (const field of requiredFields) {
                // JAVÍTÁS: Itt is mehet a 0 érték!
                if (termek[field] === undefined || termek[field] === null || termek[field].toString().trim() === '') {
                    return res.status(422).json({
                        ok: false,
                        uzenet: `Hiányzó vagy érvénytelen mező: ${field}`
                    });
                }
            }

            await termek_update(termek);

            return res.status(200).json({
                ok: true,
                uzenet: "Sikeres termék frissítés"
            });

        } catch (err) {
            console.error(err);
            return res.status(500).json({
                ok: false,
                uzenet: "Szerverhiba! Adatbázis hiba."
            });
        }
    });
}