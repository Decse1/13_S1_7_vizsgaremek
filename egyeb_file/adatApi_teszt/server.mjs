import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

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

        if (!response.ok) return res.status(response.status).json({ error: 'Hiba az API hívás során' });

        const data = await response.json();
        res.json(data);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Az új proxy végpont a kereséshez
// Példa: http://localhost:3000/api/search?name=Kovács Lajos&businessType=all
app.get('/api/search', async (req, res) => {
    // A query paraméterek (name, businessType) átvétele
    const queryName = req.query.name; 
    const queryBusinessType = req.query.businessType || 'all'; // Ha nincs megadva, legyen 'all'

    // A külső API URL összeállítása
    const externalApiUrl = `https://api.cegadatapi.hu/v1/search?name=${encodeURIComponent(queryName)}&businessType=${encodeURIComponent(queryBusinessType)}`;

    if (!CEG_API_KEY) {
        return res.status(500).json({ error: 'Szerver hiba: Az API kulcs nincs beállítva!' });
    }

    try {
        const apiResponse = await axios.get(externalApiUrl, {
            headers: {
                'X-Api-Key': CEG_API_KEY, 
            },
        });

        res.status(apiResponse.status).json(apiResponse.data);

    } catch (error) {
        console.error('Hiba a kereső API hívásakor:', error.message);
        
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        
        res.status(500).json({ error: 'Hálózati hiba a proxy szerveren a keresés során.' });
    }
});

// Szerver indítása
const PORT = 3000;
app.listen(PORT, () => console.log(`Proxy fut a ${PORT}-es porton: http://localhost:${PORT}`));