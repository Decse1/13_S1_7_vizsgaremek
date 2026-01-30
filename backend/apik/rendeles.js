const db = require('../connect');
// Figyelem: Itt NEM kell axios, és nem kell pdfkit sem, ha a PDF-et máshol kezeled!

module.exports = (app, authenticateToken, url) => {

    // 1. Új rendelés leadása (Változatlan...)
    app.post('/api/Rendeles_ad', authenticateToken, async (req, res) => {
        try {
            const { partnerseg, sz_cim, termekek } = req.body;
            if (!partnerseg || !sz_cim || !termekek || !Array.isArray(termekek) || termekek.length === 0) {
                return res.status(422).json({ ok: false, uzenet: "Hiányzó adatok vagy üres kosár!" });
            }

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
            const alapSzoveg = utolso_rendszam || szamla_minta;

            if (!alapSzoveg || alapSzoveg === '-') {
                kovetkezoRendszam = "ORD-" + Date.now();
            } else {
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

            const datum = new Date().toISOString().split('T')[0];
            const status = "Új";

            const [result] = await db.query(
                `INSERT INTO Rendeles (partnerseg, datum, status, sz_cim, rendeles_szam, szamla_kesz, szamla_kesz_datum, sztorno) VALUES (?, ?, ?, ?, ?, false, NULL, false)`,
                [partnerseg, datum, status, sz_cim, kovetkezoRendszam]
            );
            
            const ujRendelesId = result.insertId;

            for (const t of termekek) {
                await db.query(
                    `INSERT INTO RendelesTetel (rendeles_id, termek_id, mennyiseg) VALUES (?, ?, ?)`,
                    [ujRendelesId, t.termekId, t.mennyiseg]
                );
            }

            return res.status(200).json({ ok: true, uzenet: "Rendelés sikeresen feldolgozva!", rendelesId: ujRendelesId, rendelesSzam: kovetkezoRendszam });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Adatbázis hiba!", reszletek: err.message });
        }
    });

    // 2. Beérkezett rendelések (Változatlan...)
    app.post('/api/Beerkezett_rendeles', authenticateToken, async (req, res) => {
        try {
            const cegId = req.body.cegId;
            if (!cegId) return res.status(400).json({ ok: false, uzenet: "Hiányzó cég ID" });
            const [rendelok] = await db.query(
                `SELECT DISTINCT C.id AS vevo_id, C.nev AS vevo_neve, R.szamla_kesz 
                FROM Rendeles R 
                JOIN Partnerseg P ON R.partnerseg = P.id 
                JOIN Ceg C ON P.vevo = C.id 
                WHERE P.elado = ?`, [cegId]
            );
            const rendelesek = [];
            for (const vevo of rendelok) {
                const [rendeletTermek] = await db.query(
                    `SELECT 
                        R.id AS rendeles_id,
                        R.rendeles_szam,
                        R.datum,
                        R.status,
                        F.nev AS szallitasi_nev,
                        T.id AS termek_id,
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
                rendelesek.push({ vevo: vevo, tételek: rendeletTermek });
            }
            return res.status(200).json({ ok: true, rendelesek });
        } catch (err) {
            console.error("Hiba a beérkezett rendeléseknél:", err);
            res.status(500).json({ error: "Adatbázis hiba!", details: err.message });
        }
    });

    // 3. Leadott rendelések (Változatlan...)
    app.post('/api/Leadott_rendeles', authenticateToken, async (req, res) => {
        try {
            const cegId = req.body.cegId;
            if (!cegId) return res.status(400).json({ ok: false, uzenet: "Hiányzó cég ID" });
            const [eladok] = await db.query(
                `SELECT DISTINCT C.id AS elado_id, C.nev AS elado_neve, R.rendeles_szam AS rendeles_szam 
                 FROM Rendeles R 
                 JOIN Partnerseg P ON R.partnerseg = P.id 
                 JOIN Ceg C ON P.elado = C.id 
                 WHERE P.vevo = ?`, [cegId]
            );
            const rendelesek = [];
            for (const elado of eladok) {
                const [rendeletTermek] = await db.query(
                    `SELECT T.nev AS termek_neve, RT.mennyiseg AS rendelt_mennyiseg,  R.rendeles_szam, R.status, R.datum
                     FROM Rendeles R 
                     JOIN Partnerseg P ON R.partnerseg = P.id 
                     JOIN RendelesTetel RT ON R.id = RT.rendeles_id 
                     JOIN Termek T ON RT.termek_id = T.id 
                     WHERE P.vevo = ? AND P.elado = ?`, [cegId, elado.elado_id]
                );
                rendelesek.push({ elado: elado, termekek: rendeletTermek });
            }
            return res.status(200).json({ ok: true, rendelesek });
        } catch (err) {
            res.status(500).json({ error: "Adatbázis hiba!" });
        }
    });

    // Státusz frissítés (Javított Catch blokk)
    app.post('/api/Rendeles_statusz_frissit', authenticateToken, async (req, res) => {
        try {
            const rendeles = req.body;
            await db.query(`UPDATE Rendeles SET status = "Teljesítve" WHERE id = ?`, [rendeles.id]);
            for (const t of rendeles.termekek) {
                await db.query(
                    `UPDATE RendelesTetel SET mennyiseg = ? WHERE rendeles_id = ? AND termek_id = ?`, 
                    [t.mennyiseg, rendeles.id, t.termek_id]
                );
                await db.query(`UPDATE Termek SET mennyiseg = mennyiseg - ? WHERE id = ?`, [t.mennyiseg, t.termek_id]);
            }
            return res.status(200).json({ ok: true, uzenet: "Rendelés státusza frissítve!" });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Adatbázis hiba!" });
        }
    });

    // --- A JAVÍTOTT TÖRLÉS ---
    app.post('/api/Rendeles_delete', authenticateToken, async (req, res) => {
        console.log("Törlés kérés érkezett, ID:", req.body.rendelesId);
        try {
            const { rendelesId } = req.body;

            if (!rendelesId) {
                return res.status(400).json({ ok: false, uzenet: "Hiányzó rendelés ID!" });
            }

            const [rendeles] = await db.query(
                `SELECT szamla_kesz FROM Rendeles WHERE id = ?`,
                [rendelesId]
            );

            if (rendeles.length === 0) {
                return res.status(404).json({ ok: false, uzenet: "A rendelés nem található!" });
            }

            const szamlaKesz = rendeles[0].szamla_kesz;

            if (!szamlaKesz) {
                // FIZIKAI TÖRLÉS
                await db.query(`DELETE FROM RendelesTetel WHERE rendeles_id = ?`, [rendelesId]);
                await db.query(`DELETE FROM Rendeles WHERE id = ?`, [rendelesId]);

                return res.status(200).json({ ok: true, uzenet: "Rendelés véglegesen törölve." });
            } else {
                // SZTORNÓZÁS (Logikai törlés)
                await db.query(`UPDATE Rendeles SET sztorno = true WHERE id = ?`, [rendelesId]);
                
                // Mivel az axios nem működik, itt jelezzük a frontendnek, hogy hívja meg a /api/Szamla_storno-t 
                // VAGY csak küldjünk sikeres választ, ha a PDF generálás egy külön gomb lesz.
                return res.status(200).json({ 
                    ok: true, 
                    uzenet: "Rendelés sztornózva az adatbázisban!",
                    action: "generate_pdf_required" 
                });
            }
        } catch (err) {
            console.error("Törlés hiba:", err);
            res.status(500).json({ ok: false, error: "Szerver hiba a művelet során!" });
        }
    }); 
};