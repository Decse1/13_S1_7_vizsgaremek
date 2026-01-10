const db = require('../connect');

module.exports = (app) => {
    app.get('/api/Ceg_osszes', async (req, res) => {
        try {
            const [rows] = await db.query(`SELECT id, nev FROM Ceg`);
            return res.status(200).json({ ok: true, cegek: rows });
        } catch (err) {
            res.status(500).json({ error: "Adatbázis hiba!" });
            console.log(err);
        }
    });
}