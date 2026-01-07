let url = "http://localhost:3000";
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API-k importálása és regisztrálása
require("./apik/raktar.js")(app);
require("./apik/bejelent.js")(app);
require("./apik/felhasznalo.js")(app);
require("./apik/ceg.js")(app);
require("./apik/partnerek.js")(app);
require("./apik/termek.js")(app);
require("./apik/ceg_osszes.js")(app);
require("./apik/cegadat_api_hu.js")(app);
require("./apik/rendeles.js")(app);

app.listen(3000, () => 
    console.log(`Szerver fut: ${url}\nAPI-k:
        \t${url}/api/Raktar
        \t${url}/api/Bejelent
        \t${url}/api/Felhasznalo_ad
        \t${url}/api/Felhasznalo_update
        \t${url}/api/Felhasznalo_delete
        \t${url}/api/Ceg_ad
        \t${url}/api/Ceg_update
        \t${url}/api/Ceg_delete
        \t${url}/api/Partnerek_en_vevo
        \t${url}/api/Partnerek_en_elado
        \t${url}/api/Kategoriak
        \t${url}/api/Szurt_termek
        \t${url}/api/Osszes_termek
        \t${url}/api/Ceg_osszes
        \t${url}/api/Rendeles_ad
        \t${url}/api/Beerkezett_rendeles
        \t${url}/api/Termek_ad
        \t${url}/api/Termek_update
        \t${url}/api/detail
        \t${url}/api/search/name
        \t${url}/api/search/vat`)
);