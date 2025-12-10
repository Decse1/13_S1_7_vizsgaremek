const express = require('express');
const fetch = require('node-fetch'); // node-fetch v2
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Proxy végpont
app.get('/api/ceg', async (req, res) => {
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: "Hiányzó id paraméter" });

    const apiKey = '12345678'; // ide tedd a saját API kulcsodat
    const url = `https://api.cegadatapi.hu/v1/detail?id=${encodeURIComponent(id)}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'X-Api-Key': apiKey }
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Hiba az API hívás során' });
        }

        const data = await response.json();
        res.json(data);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Szerver indítása
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Proxy fut a ${PORT}-es porton: http://localhost:${PORT}`);
});