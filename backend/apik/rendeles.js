const db = require('../connect');

module.exports = (app, authenticateToken) => {

    // 1. Új rendelés leadása (Védett)
    app.post('/api/Rendeles_ad', authenticateToken, async (req, res) => {
        try {
            const { partnerseg, sz_cim, termekek } = req.body;
            
            // Validáció
            if (!partnerseg || !sz_cim || !termekek || !Array.isArray(termekek) || termekek.length === 0) {
                return res.status(422).json({ ok: false, uzenet: "Hiányzó adatok vagy üres kosár!" });
            }

            const datum = new Date().toISOString().split('T')[0];
            const statusz = "Új";

            // Rendelés fejléc beszúrása
            // JAVÍTÁS: insertId kinyerése
            const [result] = await db.query(
                `INSERT INTO Rendeles (partnerseg, datum, statusz, szamlazasi_cim) VALUES (?, ?, ?, ?)`,
                [partnerseg, datum, statusz, sz_cim]
            );
            
            const ujRendelesId = result.insertId;

            // Tételek beszúrása ciklusban
            for (const t of termekek) {
                await db.query(
                    `INSERT INTO Rendeles_termek (rendeles_id, termek_id, mennyiseg) VALUES (?, ?, ?)`,
                    [ujRendelesId, t.termekId, t.mennyiseg]
                );
            }

            return res.status(200).json({ 
                ok: true, 
                uzenet: "Rendelés sikeresen feldolgozva!",
                rendelesId: ujRendelesId
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Adatbázis hiba!" });
        }
    });

    // 2. Beérkezett rendelések lekérdezése (Én vagyok az ELADÓ)
    app.post('/api/Beerkezett_rendeles', authenticateToken, async (req, res) => {
        try {
            const cegId = req.body.cegId;

            if (!cegId) return res.status(400).json({ ok: false, uzenet: "Hiányzó cég ID" });

            // 1. lépés: Kik rendeltek tőlem?
            const [rendelok] = await db.query(
                `SELECT DISTINCT C.id AS vevo_id, C.nev AS vevo_neve 
                 FROM Rendeles R 
                 JOIN Partnerseg P ON R.partnerseg = P.id 
                 JOIN Ceg C ON P.vevo = C.id 
                 WHERE P.elado = ? AND R.statusz = 'Új'`, // Csak az új rendelések érdekelnek?
                [cegId]
            );

            const rendelesek = [];

            // 2. lépés: Minden vevőhöz lekérjük a tételeket
            for (const vevo of rendelok) {
                const [rendeletTermek] = await db.query(
                    `SELECT T.nev AS termek_neve, RT.mennyiseg AS rendelt_mennyiseg, R.datum 
                     FROM Rendeles R 
                     JOIN Partnerseg P ON R.partnerseg = P.id 
                     JOIN Rendeles_termek RT ON R.id = RT.rendeles_id 
                     JOIN Termek T ON RT.termek_id = T.id 
                     WHERE R.statusz = 'Új' AND P.elado = ? AND P.vevo = ?`,
                    [cegId, vevo.vevo_id]
                );

                rendelesek.push({
                    vevo: vevo,
                    termekek: rendeletTermek,
                });
            }

            return res.status(200).json({ ok: true, rendelesek });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Adatbázis hiba!" });
        }
    });

    // 3. Leadott rendelések lekérdezése (Én vagyok a VEVŐ)
    app.post('/api/Leadott_rendeles', authenticateToken, async (req, res) => {
        try {
            const cegId = req.body.cegId;

            if (!cegId) return res.status(400).json({ ok: false, uzenet: "Hiányzó cég ID" });

            // 1. lépés: Kiktől rendeltem?
            const [eladok] = await db.query(
                `SELECT DISTINCT C.id AS elado_id, C.nev AS elado_neve 
                 FROM Rendeles R 
                 JOIN Partnerseg P ON R.partnerseg = P.id 
                 JOIN Ceg C ON P.elado = C.id 
                 WHERE P.vevo = ?`,
                [cegId]
            );

            const rendelesek = [];

            // 2. lépés: Tételek lekérése
            for (const elado of eladok) {
                const [rendeletTermek] = await db.query(
                    `SELECT T.nev AS termek_neve, RT.mennyiseg AS rendelt_mennyiseg, R.statusz, R.datum
                     FROM Rendeles R 
                     JOIN Partnerseg P ON R.partnerseg = P.id 
                     JOIN Rendeles_termek RT ON R.id = RT.rendeles_id 
                     JOIN Termek T ON RT.termek_id = T.id 
                     WHERE P.vevo = ? AND P.elado = ?`,
                    [cegId, elado.elado_id]
                );

                rendelesek.push({
                    elado: elado,
                    termekek: rendeletTermek,
                });
            }

            return res.status(200).json({ ok: true, rendelesek });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Adatbázis hiba!" });
        }
    });
};