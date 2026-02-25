const express = require('express');
const router = express.Router();
const db = require('../connect');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Titkos kulcs a token aláírásához (ezt élesben .env fájlból olvasd be!)
const SECRET_KEY = process.env.JWT_SECRET || 'titkos_kulcs_fejleszteshez_123';

// --- ADATBÁZIS SEGÉDFÜGGVÉNYEK ---

// Felhasználó keresése név alapján
async function getFelhasznaloByNev(username) {
    const [rows] = await db.query(
        `SELECT * FROM Felhasznalo WHERE nev = ?`, 
        [username]
    );
    return rows[0]; // Visszaadja a user objektumot vagy undefined-ot
}

// Cég adat keresése user ID alapján (biztonságos JOIN-nal)
async function getCegAdatByUserId(userId) {
    const [rows] = await db.query(
        `SELECT Ceg.* FROM Ceg 
         INNER JOIN Ceg_alkalmazott ON Ceg.id = Ceg_alkalmazott.cegId 
         WHERE Ceg_alkalmazott.felhasznaloId = ?`, 
        [userId]
    );
    return rows[0]; // Ha nincs cége, undefined lesz
}

// --- ROUTE (VÉGPONT) ---

// Fontos: Mivel a server.js-ben úgy töltöttük be, hogy app.use('/api', ...),
// ezért itt a '/Bejelent' a teljes '/api/Bejelent' útvonalat jelenti.
router.post('/Bejelent', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Validáció: Megadtak-e mindent?
        if (!username || !password) {
            return res.status(400).json({
                ok: false,
                uzenet: "Hiányzó felhasználónév vagy jelszó!"
            });
        }

        // 2. Felhasználó keresése
        const felhasznalo = await getFelhasznaloByNev(username);

        // Ha nincs ilyen felhasználó
        if (!felhasznalo) {
            return res.status(401).json({
                ok: false,
                uzenet: "Hibás felhasználónév vagy jelszó!"
            });
        }

        // 3. Jelszó ellenőrzés (Bcrypt compare)
        const jelszo_egyezik = await bcrypt.compare(password, felhasznalo.jelszo);

        if (!jelszo_egyezik) {
            return res.status(401).json({
                ok: false,
                uzenet: "Hibás felhasználónév vagy jelszó!"
            });
        }

        // 4. Cég adatok lekérése
        const ceg = await getCegAdatByUserId(felhasznalo.id);

        // 5. JWT Token generálása (EZ A KULCSLÉPÉS)
        // A tokenbe belecsomagoljuk a user ID-t és a nevét
        const token = jwt.sign(
            { 
                id: felhasznalo.id, 
                nev: felhasznalo.nev,
            },
            SECRET_KEY,
            { expiresIn: '10m' } // A belépés 8 óráig érvényes
        );

        // 6. Sikeres válasz küldése a Tokennel
        return res.status(200).json({
            ok: true,
            uzenet: "Sikeres bejelentkezés!",
            token: token, // <--- Ezt kell elmentenie a Frontendnek!
            felhasznalo: {
                id: felhasznalo.id,
                nev: felhasznalo.nev,
                jogkor: {
                    rendeles_osszkesz: felhasznalo.rendeles_osszkesz,
                    rendeles_lead: felhasznalo.rendeles_lead,
                    szamla_keszit: felhasznalo.szamla_keszit,
                    raktar_kezel: felhasznalo.raktar_kezel
                },
                telephely_cim: felhasznalo.telephely_cim,
                telefon: felhasznalo.telefon
            },
            ceg: ceg || null // Ha nincs cég, null-t küldünk
        });

    } catch (err) {
        console.error("Login hiba:", err);
        return res.status(500).json({
            ok: false,
            uzenet: "Szerverhiba történt a bejelentkezés során."
        });
    }
});

module.exports = router;
/*app.listen(3000, () =>
  console.log("Szerver fut: http://localhost:3000")
);*/




//const hashedPassword = await bcrypt.hash(password, 10); // A 10-es szám a "salt rounds"
// Ezt a hashedPassword-et mentsd el az adatbázis 'jelszo' mezőjébe.