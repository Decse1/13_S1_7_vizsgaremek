const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET_KEY = process.env.JWT_SECRET || 'titkos_kulcs_fejleszteshez_123';

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ ok: false, uzenet: "Nincs token" });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ ok: false, uzenet: "Érvénytelen token" });
        }

        // --- ÚJ RÉSZ KEZDETE ---
        
        // 1. Összeállítjuk az új tiszta adatcsomagot (az előző user adataiból)
        // Fontos: Az 'iat' és 'exp' mezőket NEM szabad átmásolni, mert azokat a sign újra generálja!
        const newPayload = { 
            id: user.id, 
            nev: user.nev, 
            role: user.role 
        };

        // 2. Generálunk egy ÚJ tokent (megint 8 órára, vagy amennyire szeretnéd)
        const newToken = jwt.sign(newPayload, SECRET_KEY, { expiresIn: '10m' });

        // 3. Betesszük a válasz fejlécébe, hogy a frontend megtalálja
        // 'x-new-token' néven fogjuk küldeni
        res.setHeader('x-new-token', newToken);
        
        // Biztosítjuk, hogy a frontend olvashassa ezt a headert (CORS miatt fontos lehet)
        res.setHeader('Access-Control-Expose-Headers', 'x-new-token');

        // --- ÚJ RÉSZ VÉGE ---

        req.user = user;
        next();
    });
}

module.exports = authenticateToken;