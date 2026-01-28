let url = "http://localhost:3000";
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./connect');
// 1. Beimportáljuk a biztonsági őrt (Middleware)
const authenticateToken = require('./middleware/auth'); 

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

async function startServer() {
    try {
        // Adatbázis inicializálása
        await initDatabase();

        // --- API-k betöltése ---

        // A. BEJELENTKEZÉS (Publikus, nem kell token)
        // Mivel a bejelent.js-t átírtuk 'router'-re az előző lépésben, 
        // így kell betölteni (app.use):
        app.use('/api', require("./apik/bejelent.js")); 

        // B. VÉDETT API-k (Ahol szükség lehet a tokenre)
        // Átadjuk az 'app'-ot ÉS az 'authenticateToken'-t paraméterként,
        // így ezekben a fájlokban használhatod a védelmet.
        
        require("./apik/raktar.js")(app, authenticateToken);
        require("./apik/felhasznalo.js")(app, authenticateToken);
        require("./apik/ceg.js")(app, authenticateToken);
        require("./apik/partnerek.js")(app, authenticateToken);
        require("./apik/termek.js")(app, authenticateToken);
        require("./apik/cegadat_api_hu.js")(app); // Ez valószínűleg publikus marad
        require("./apik/rendeles.js")(app, authenticateToken);
        require("./apik/regisztral.js")(app);
        require("./apik/szamla.js")(app);

        // Szerver indítása
        app.listen(3000, () => {
            console.log(`Szerver fut: ${url}\nAPI-k:`
                +`\n\t${url}/api/Raktar`
                +`\n\t${url}/api/Bejelent`
                +`\n\t${url}/api/Felhasznalo_ad`
                +`\n\t${url}/api/Felhasznalo_update`
                +`\n\t${url}/api/Felhasznalo_delete`
                +`\n\t${url}/api/Alkalmazottak`
                +`\n\t${url}/api/Ceg_ad`
                +`\n\t${url}/api/Ceg_update`
                +`\n\t${url}/api/Ceg_delete`
                +`\n\t${url}/api/Partnerek_ad`
                +`\n\t${url}/api/Partnerek_en_vevo`
                +`\n\t${url}/api/Partnerek_en_elado`
                +`\n\t${url}/api/Kategoriak_all`
                +`\n\t${url}/api/Kategoriak_szurt`
                +`\n\t${url}/api/Szurt_termek`
                +`\n\t${url}/api/Osszes_termek`
                +`\n\t${url}/api/Ceg_osszes`
                +`\n\t${url}/api/Rendeles_ad`
                +`\n\t${url}/api/Beerkezett_rendeles`
                +`\n\t${url}/api/Termek_ad`
                +`\n\t${url}/api/Termek_update`
                +`\n\t${url}/api/Regisz/Ceg_ad`
                +`\n\t${url}/api/Regisz/Felhasznalo_ad`
                +`\n\t${url}/api/Szamla_create`
                +`\n\t${url}/api/Rendeles_statusz_frissit`
                +`\n\t${url}/api/detail`
                +`\n\t${url}/api/search/name`
                +`\n\t${url}/api/search/vat`);
            console.log(`🔐 Biztonsági modul (JWT) aktív.`);
        });

    } catch (err) {
        console.error("❌ Szerver nem indul! Hiba oka:");
        console.error(err); 
        process.exit(1);
    }
}

startServer();