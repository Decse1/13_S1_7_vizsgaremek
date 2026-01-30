const db = require('../connect');


module.exports = (app, authenticateToken) => {

    // 1. Új rendelés leadása (Védett)
    app.post('/api/Rendeles_ad', authenticateToken, async (req, res) => {
        try {
            const { partnerseg, sz_cim, termekek } = req.body;

            // 1. Validáció
            if (!partnerseg || !sz_cim || !termekek || !Array.isArray(termekek) || termekek.length === 0) {
                return res.status(422).json({ ok: false, uzenet: "Hiányzó adatok vagy üres kosár!" });
            }

            // --- RENDELÉSSZÁM GENERÁLÁS START ---
            
            // 2. Lekérjük az eladóhoz tartozó számla mintát és az utolsó kiadott rendelésszámot
            // A Partnerseg táblán keresztül eljutunk az Eladóig (Ceg), onnan a mintáig.
            const [eladoAdatok] = await db.query(`
                SELECT c.szamla_minta, 
                    (SELECT r.rendeles_szam 
                        FROM Rendeles r 
                        WHERE r.partnerseg IN (SELECT id FROM Partnerseg WHERE elado = c.id)
                        ORDER BY r.id DESC LIMIT 1) as utolso_rendszam
                FROM Partnerseg p
                JOIN Ceg c ON p.elado = c.id
                WHERE p.id = ?`, 
                [partnerseg]
            );

            if (!eladoAdatok || eladoAdatok.length === 0) {
                return res.status(404).json({ ok: false, uzenet: "A megadott partnerség nem létezik!" });
            }

            const { szamla_minta, utolso_rendszam } = eladoAdatok[0];
            let kovetkezoRendszam;

            // Meghatározzuk az alapot: ha volt már rendelés, azt növeljük, ha nem, a mintát vesszük alapul
            const alapSzoveg = utolso_rendszam || szamla_minta;

            if (!alapSzoveg || alapSzoveg === '-') {
                kovetkezoRendszam = "ORD-" + Date.now(); // Fallback, ha nincs minta megadva
            } else {
                // Dinamikus szétválasztás az első számjegynél (ahogy korábban megbeszéltük)
                const elsoSzamIndex = alapSzoveg.search(/\d/);
                
                if (elsoSzamIndex === -1) {
                    kovetkezoRendszam = alapSzoveg + "1";
                } else {
                    const prefix = alapSzoveg.slice(0, elsoSzamIndex);
                    const szamResz = alapSzoveg.slice(elsoSzamIndex);
                    const ujSzam = parseInt(szamResz, 10) + 1;
                    kovetkezoRendszam = prefix + ujSzam.toString().padStart(szamResz.length, '0');
                }
            }
            // --- RENDELÉSSZÁM GENERÁLÁS END ---

            const datum = new Date().toISOString().split('T')[0];
            const status = "Új";

            // 3. Rendelés fejléc beszúrása az új rendelésszámmal
            const [result] = await db.query(
                `INSERT INTO Rendeles (partnerseg, datum, status, sz_cim, rendeles_szam) VALUES (?, ?, ?, ?, ?)`,
                [partnerseg, datum, status, sz_cim, kovetkezoRendszam]
            );
            
            const ujRendelesId = result.insertId;

            // 4. Tételek beszúrása ciklusban
            for (const t of termekek) {
                await db.query(
                    `INSERT INTO RendelesTetel (rendeles_id, termek_id, mennyiseg) VALUES (?, ?, ?)`,
                    [ujRendelesId, t.termekId, t.mennyiseg]
                );
            }

            return res.status(200).json({ 
                ok: true, 
                uzenet: "Rendelés sikeresen feldolgozva!",
                rendelesId: ujRendelesId,
                rendelesSzam: kovetkezoRendszam
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Adatbázis hiba!", reszletek: err.message });
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
                 WHERE P.elado = ? AND R.status = 'Új'`, // Csak az új rendelések érdekelnek?
                [cegId]
            );

            const rendelesek = [];

            // 2. lépés: Minden vevőhöz lekérjük a tételeket
            for (const vevo of rendelok) {
                const [rendeletTermek] = await db.query(
                    `SELECT T.nev AS termek_neve, RT.mennyiseg AS rendelt_mennyiseg, R.datum 
                     FROM Rendeles R 
                     JOIN Partnerseg P ON R.partnerseg = P.id 
                     JOIN Rendelestetel RT ON R.id = RT.rendeles_id 
                     JOIN Termek T ON RT.termek_id = T.id 
                     WHERE R.status = 'Új' AND P.elado = ? AND P.vevo = ?`,
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
                    `SELECT T.nev AS termek_neve, RT.mennyiseg AS rendelt_mennyiseg, R.status, R.datum
                     FROM Rendeles R 
                     JOIN Partnerseg P ON R.partnerseg = P.id 
                     JOIN Rendelestetel RT ON R.id = RT.rendeles_id 
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

    app.post('/api/Rendeles_statusz_frissit', authenticateToken, async (req, res) => {
        try {
            const rendeles = req.body;
            await db.query(
                `UPDATE Rendeles SET status = "Teljesítve" WHERE id = ?`,
                [rendeles.id]
            );
            for (const t of rendeles.termekek) {
                await db.query(
                    `UPDATE Rendelestetel SET mennyiseg = ? WHERE id = ?`,
                    [t.mennyiseg, t.id]
                );
                await db.query(
                    `UPDATE Termek SET mennyiseg = mennyiseg - ? WHERE id = ?`,
                    [t.mennyiseg, t.id]
                );
            }
            return res.status(200).json({ ok: true, uzenet: "Rendelés státusza frissítve!" });
        } catch (error) {
            console.error(err);
            res.status(500).json({ error: "Adatbázis hiba!" });
        }
    });
        
};