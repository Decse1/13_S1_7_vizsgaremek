const db = require('../connect');


async function Partner_en_vevo(ceg_id) {
  const [rows] = await db.query(`SELECT Partnerseg.id AS id, Ceg.nev AS nev, Ceg.adoszam AS adoszamm, Ceg.cim AS cim, Ceg.telefon AS telefon, Partnerseg.fizetesi_ido AS fizetesi_ido, Partnerseg.fizetesi_forma AS fizetesi_forma FROM Ceg  INNER JOIN Partnerseg ON Ceg.id = Partnerseg.elado WHERE Partnerseg.vevo = "${ceg_id}"`);
  //console.log(rows);
  return rows;
}
async function Partner_en_elado(ceg_id) {
  const [rows] = await db.query(`SELECT Partnerseg.id AS id, Ceg.nev AS nev, Ceg.adoszam AS adoszamm, Ceg.cim AS cim, Ceg.telefon AS telefon, Partnerseg.fizetesi_ido AS fizetesi_ido, Partnerseg.fizetesi_forma AS fizetesi_forma FROM Ceg INNER JOIN Partnerseg ON Ceg.id = Partnerseg.vevo WHERE Partnerseg.elado = "${ceg_id}"`);
  //console.log(rows);
  return rows;
}

module.exports = (app) => {
    app.post('/api/Partnerek_en_vevo', async (req, res) => {
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


    app.post('/api/Partnerek_en_elado', async (req, res) => {
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
}