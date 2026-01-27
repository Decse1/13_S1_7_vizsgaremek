const db = require('../connect');

// --- ADATBÁZIS SEGÉDFÜGGVÉNYEK ---

async function Partner_en_vevo(ceg_id) {
    // JAVÍTÁS: ? paraméter használata SQL injection ellen
    const [rows] = await db.query(
        `SELECT Partnerseg.id AS id, Ceg.id AS cId, Ceg.nev AS nev, Ceg.adoszam AS adoszamm, 
                Ceg.cim AS cim, Ceg.telefon AS telefon, Partnerseg.fizetesi_ido AS fizetesi_ido, 
                Partnerseg.fizetesi_forma AS fizetesi_forma 
         FROM Ceg 
         INNER JOIN Partnerseg ON Ceg.id = Partnerseg.elado 
         WHERE Partnerseg.vevo = ?`, 
        [ceg_id]
    );
    return rows;
}

async function Partner_en_elado(ceg_id) {
    // JAVÍTÁS: ? paraméter használata SQL injection ellen
    const [rows] = await db.query(
        `SELECT Partnerseg.id AS id, Ceg.id AS cId, Ceg.nev AS nev, Ceg.adoszam AS adoszamm, 
                Ceg.cim AS cim, Ceg.telefon AS telefon, Partnerseg.fizetesi_ido AS fizetesi_ido, 
                Partnerseg.fizetesi_forma AS fizetesi_forma 
         FROM Ceg 
         INNER JOIN Partnerseg ON Ceg.id = Partnerseg.vevo 
         WHERE Partnerseg.elado = ?`, 
        [ceg_id]
    );
    return rows;
}

// --- ROUTER ---

module.exports = (app, authenticateToken) => {

    // 1. Új partnerség létrehozása (Védett)
    app.post('/api/Partnerek_ad', authenticateToken, async (req, res) => {
        try {
            const { eladoId, vevoId, fiz_ido, fiz_forma } = req.body;

            // Validáció: kötelező mezők
            if (!eladoId || !vevoId || !fiz_ido || !fiz_forma || fiz_forma.toString().trim() === '') {
                return res.status(422).json({
                    ok: false,
                    uzenet: "Hiányzó mező(k): eladó, vevő, fizetési idő vagy forma"
                });
            }

            // SQL lekérdezés prepared statement-tel
            // JAVÍTÁS: A változó neve 'fiz_forma' volt, nem 'forma'
            const [rows] = await db.query(
                `INSERT INTO Partnerseg (elado, vevo, fizetesi_ido, fizetesi_forma) VALUES (?, ?, ?, ?)`,
                [eladoId, vevoId, fiz_ido, fiz_forma]
            );

            return res.status(200).json({
                ok: true,
                uzenet: "A partnerség sikeresen hozzá lett adva"
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                ok: false,
                uzenet: "Szerverhiba! Adatbázis hiba."
            });
        }
    });

    // 2. Partnerek lekérdezése, ahol ÉN vagyok a VEVŐ (Védett)
    app.post('/api/Partnerek_en_vevo', authenticateToken, async (req, res) => {
        try {
            const ceg_id = req.body.id;

            // Ellenőrizzük a hiányzó id-t
            if (!ceg_id) {
                return res.status(422).json({
                    ok: false,
                    uzenet: "Hiányzó cég azonosító"
                });
            }

            const partnerek = await Partner_en_vevo(ceg_id);

            if (!partnerek || partnerek.length === 0) {
                return res.status(404).json({
                    ok: false,
                    uzenet: "Nincsenek vevő partnerek"
                });
            }

            return res.status(200).json({
                ok: true,
                uzenet: "",
                partnerek
            });

        } catch (err) {
            console.error(err);
            return res.status(500).json({
                ok: false,
                uzenet: "Szerverhiba! Adatbázis hiba."
            });
        }
    });

    // 3. Partnerek lekérdezése, ahol ÉN vagyok az ELADÓ (Védett)
    app.post('/api/Partnerek_en_elado', authenticateToken, async (req, res) => {
        try {
            const ceg_id = req.body.id;

            // Ellenőrizzük a hiányzó id-t
            if (!ceg_id) {
                return res.status(422).json({
                    ok: false,
                    uzenet: "Hiányzó cég azonosító"
                });
            }

            const partnerek = await Partner_en_elado(ceg_id);

            if (!partnerek || partnerek.length === 0) {
                return res.status(404).json({
                    ok: false,
                    uzenet: "Nincsenek eladó partnerek"
                });
            }

            return res.status(200).json({
                ok: true,
                uzenet: "",
                partnerek
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