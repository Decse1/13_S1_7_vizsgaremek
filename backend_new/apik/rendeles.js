const db = require('../connect');

module.exports = (app, authenticateToken, url) => {

    // 1. Új rendelés leadása
    app.post('/api/Rendeles_ad', authenticateToken, async (req, res) => {
        try {
            const { partnerseg, sz_cim, termekek } = req.body;
            
            if (!partnerseg || !sz_cim || !termekek || !Array.isArray(termekek) || termekek.length === 0) {
                return res.status(422).json({ ok: false, uzenet: "Hiányzó adatok vagy üres kosár!" });
            }

            // ÚJ SÉMA: szamla_minta helyett rendeles_minta használata
            const [eladoAdatok] = await db.query(`
                SELECT c.rendeles_minta, 
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

            const { rendeles_minta, utolso_rendszam } = eladoAdatok[0];
            let kovetkezoRendszam;
            const alapSzoveg = utolso_rendszam || rendeles_minta;

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

            // ÚJ SÉMA: szamla_kesz_datum kikerült a Rendeles táblából
            const [result] = await db.query(
                `INSERT INTO Rendeles (partnerseg, datum, status, sz_cim, rendeles_szam, szamla_kesz, sztorno) 
                 VALUES (?, ?, ?, ?, ?, false, false)`,
                [partnerseg, datum, status, sz_cim, kovetkezoRendszam]
            );
            
            const ujRendelesId = result.insertId;

            // Tételek beszúrása
            for (const t of termekek) {
                await db.query(
                    `INSERT INTO RendelesTetel (rendeles_id, termek_id, mennyiseg, nev, ar, afa_kulcs) VALUES (?, ?, ?, ?, ?, ?)`,
                    [ujRendelesId, t.termekId, t.mennyiseg, t.nev, t.ar, t.afa_kulcs]
                );
            }

            return res.status(200).json({ 
                ok: true, 
                uzenet: "Rendelés sikeresen feldolgozva!", 
                rendelesId: ujRendelesId, 
                rendelesSzam: kovetkezoRendszam 
            });

        } catch (err) {
            console.error("Hiba rendelés leadásakor:", err);
            res.status(500).json({ error: "Adatbázis hiba!", reszletek: err.message });
        }
    });

    // 2. Beérkezett rendelések
    app.post('/api/Beerkezett_rendeles', authenticateToken, async (req, res) => {
        try {
            const cegId = req.body.cegId;
            if (!cegId) return res.status(400).json({ ok: false, uzenet: "Hiányzó cég ID" });

            const [rows] = await db.query(
                `SELECT 
                    C.id AS vevo_id, C.nev AS vevo_neve,
                    R.id AS rendeles_id, R.rendeles_szam, R.datum, R.status, R.sztorno, R.szamla_kesz,
                    F.nev AS szallitasi_nev,
                    T.id AS termek_id, T.nev AS termek_neve,
                    RT.mennyiseg AS rendelt_mennyiseg
                FROM Rendeles R 
                JOIN Partnerseg P ON R.partnerseg = P.id 
                JOIN Ceg C ON P.vevo = C.id 
                JOIN RendelesTetel RT ON R.id = RT.rendeles_id 
                JOIN Termek T ON RT.termek_id = T.id 
                JOIN Felhasznalo F ON R.sz_cim = F.id
                WHERE P.elado = ?
                ORDER BY R.datum DESC`, 
                [cegId]
            );

            const rendelesekMap = new Map();
            for (const row of rows) {
                if (!rendelesekMap.has(row.vevo_id)) {
                    rendelesekMap.set(row.vevo_id, {
                        vevo: { vevo_id: row.vevo_id, vevo_neve: row.vevo_neve },
                        tételek: []
                    });
                }
                rendelesekMap.get(row.vevo_id).tételek.push({
                    rendeles_id: row.rendeles_id,
                    rendeles_szam: row.rendeles_szam,
                    datum: row.datum,
                    status: row.status,
                    sztorno: row.sztorno,
                    szamla_kesz: row.szamla_kesz,
                    szallitasi_nev: row.szallitasi_nev,
                    termek_id: row.termek_id,
                    termek_neve: row.termek_neve,
                    rendelt_mennyiseg: row.rendelt_mennyiseg
                });
            }

            return res.status(200).json({ ok: true, rendelesek: Array.from(rendelesekMap.values()) });

        } catch (err) {
            console.error("Hiba a beérkezett rendeléseknél:", err);
            res.status(500).json({ error: "Adatbázis hiba!", details: err.message });
        }
    });

    // 3. Leadott rendelések
    app.post('/api/Leadott_rendeles', authenticateToken, async (req, res) => {
        try {
            const cegId = req.body.cegId;
            if (!cegId) return res.status(400).json({ ok: false, uzenet: "Hiányzó cég ID" });

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

            const rendelesekMap = new Map();
            for (const row of rows) {
                if (!rendelesekMap.has(row.elado_id)) {
                    rendelesekMap.set(row.elado_id, {
                        elado: { elado_id: row.elado_id, elado_neve: row.elado_neve },
                        termekek: []
                    });
                }
                rendelesekMap.get(row.elado_id).termekek.push({
                    termek_neve: row.termek_neve,
                    rendelt_mennyiseg: row.rendelt_mennyiseg,
                    rendeles_szam: row.rendeles_szam,
                    status: row.status,
                    datum: row.datum,
                    szamla_kesz: row.szamla_kesz,
                    sztorno: row.sztorno
                });
            }

            return res.status(200).json({ ok: true, rendelesek: Array.from(rendelesekMap.values()) });

        } catch (err) {
            console.error("Hiba a leadott rendeléseknél:", err);
            res.status(500).json({ error: "Adatbázis hiba!", details: err.message });
        }
    });

    // 4. Státusz frissítés 
    app.post('/api/Rendeles_statusz_frissit', authenticateToken, async (req, res) => {
        try {
            const rendeles = req.body;
            
            if (!rendeles.id || !Array.isArray(rendeles.termekek)) {
                return res.status(400).json({ ok: false, uzenet: "Érvénytelen rendelés adatok!" });
            }

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
            console.error("Hiba státusz frissítéskor:", err);
            res.status(500).json({ error: "Adatbázis hiba!", details: err.message });
        }
    });

    // 5. Rendelés törlése
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
                await db.query(`DELETE FROM RendelesTetel WHERE rendeles_id = ?`, [rendelesId]);
                await db.query(`DELETE FROM Rendeles WHERE id = ?`, [rendelesId]);

                return res.status(200).json({ ok: true, uzenet: "Rendelés véglegesen törölve." });
            } else {
                await db.query(`UPDATE Rendeles SET sztorno = true WHERE id = ?`, [rendelesId]);
                
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