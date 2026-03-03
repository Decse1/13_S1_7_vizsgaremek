const { exec } = require('child_process');
let CEG_API_KEY= "";
const API_BASE_URL = "https://api.cegadatapi.hu";

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question(``,api => {
    CEG_API_KEY = api;
    console.log(`Az API kulcs beállítva`);
    readline.close(); // Fontos lezárni, különben nem áll le a program
});
/**
 * A fő funkció, ami elvégzi a CURL hívást.
 * @param {string} endpoint - Az API végpontja (pl. /v1/search)
 * @param {string} params - A paraméterek string formában (pl. "name=...&businessType=...")
 */
function runCurlProxy(endpoint, params) {
    return new Promise((resolve, reject) => {
        if (!CEG_API_KEY) {
            return reject({ status: 500, data: { error: 'Szerver hiba: Az API kulcs nincs beállítva!' } });
        }

        // A CURL parancs összeállítása a kulccsal és az URL-enkódoláshoz szükséges --data-urlencode kapcsolóval
        const fullCurlCommand = `curl --ssl-no-revoke -G "${API_BASE_URL}${endpoint}" -H "X-Api-Key: ${CEG_API_KEY}" --data-urlencode "${params}"`;
        //console.log(fullCurlCommand);
        
        console.log(`[CURL]: ${endpoint} hívása...`);
        //console.log(`[PARANCS]: ${fullCurlCommand}`); // Ezt vedd ki, ha már nem kell debugolni

        exec(fullCurlCommand, (error, stdout) => {
            if (error) {
                console.error(`Curl futtatási hiba: ${error.message}`);
                return reject({ status: 500, data: { error: `Szerver oldali hiba a CURL futtatásakor.` } });
            }
            
            try {
                //A CURL kimenetét JSON-ként küldjük vissza, feltételezve, hogy az API JSON-t ad
                console.log(`[CURL KIMENET]: ${stdout}`);
                const data = JSON.parse(stdout);
                resolve({ status: 200, data: data.response.results }); 
            } catch (parseError) {
                console.error('Hiba a CURL kimenet feldolgozásakor (nem JSON).');
                reject({ status: 500, data: { error: 'A külső API érvénytelen JSON formátumot küldött.' } });
            }
        });
    });
}

// 1. DETAIL VÉGPONT (/api/detail)
module.exports =  (app) => {
    app.post('/api/detail', async (req, res) => {
        try {
            console.log(req.body);
            const params = `id=${req.body.adoszam}`;
            console.log(params);
            const result = await runCurlProxy('/v1/detail', params);
            res.status(result.status).json(result.data);
        } catch (error) {
            res.status(error.status || 500).json(error.data || { error: 'Hiba a detail lekérdezésnél.' });
        }
    });

    // 2. SEARCH VÉGPONT (/api/search)
    app.post('/api/search/name', async (req, res) => {
        const nev = req.body.name;
        console.log(nev); 

        if (!nev) {
            return res.status(400).json({ error: 'Hiányzó paraméterek: name és businessType kötelező.' });
        }
        
        try {
            // A paraméterek string formájú összeállítása a CURL --data-urlencode kapcsolójához
            const params = `name=${nev}" --data-urlencode "businessType=all`;
            const result = await runCurlProxy('/v1/search', params);
            console.log(result.data);
            res.status(result.status).json(result.data);
        } catch (error) {
            res.status(error.status || 500).json(error.data || { error: 'Hiba a keresésnél.' });
        }
    });

    app.post('/api/search/vat', async (req, res) => {
        const adoszam = req.body.vatNumber; 

        if (!adoszam) {
            return res.status(400).json({ error: 'Hiányzó paraméterek: name és businessType kötelező.' });
        }
        
        try {
            // A paraméterek string formájú összeállítása a CURL --data-urlencode kapcsolójához
            const params = `vatNumber=${adoszam}" --data-urlencode "businessType=all`;
            const result = await runCurlProxy('/v1/search', params);
            console.log(result.data);
            res.status(result.status).json(result.data);
        } catch (error) {
            res.status(error.status || 500).json(error.data || { error: 'Hiba a keresésnél.' });
        }
    });
}
/*app.listen(PORT, () => {
    console.log(`Node.js Proxy (Egyszerűsített CURL) elindítva a http://localhost:${PORT} címen.`);
});*/