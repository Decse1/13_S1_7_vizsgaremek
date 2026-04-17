const db = require('../connect');

// --- ADATBÁZIS SEGÉDFÜGGVÉNYEK ---

async function rak_kesz(own) {
    // JAVÍTÁS: ? paraméter használata SQL injection ellen
    const [rows] = await db.query(
        `SELECT * FROM Termek WHERE Termek.tulajdonos = ?`, 
        [own]
    );
    return rows;
}

// --- ROUTER ---

module.exports = (app, authenticateToken) => {

    // Raktárkészlet lekérdezése (Védett)
    app.post('/api/Raktar', authenticateToken, async (req, res) => {
        try {
            const p_ceg = req.body.id;

            if (!p_ceg) {
                return res.status(422).json({
                    ok: false,
                    uzenet: "Hiányzó cég azonosító"
                });
            }

            const termekek = await rak_kesz(p_ceg);

            if (!termekek || termekek.length === 0) {
                return res.status(404).json({
                    ok: false,
                    uzenet: "Nincsenek termékek a raktárban"
                });
            }

            return res.status(200).json({
                ok: true,
                uzenet: "",
                termekek
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