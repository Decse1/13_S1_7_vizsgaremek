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
require("./apik/felhasznalo_ad.js")(app);
require("./apik/ceg_ad.js")(app);
require("./apik/partnerek.js")(app);
require("./apik/kategoriak.js")(app);
require("./apik/ceg_osszes.js")(app);

app.listen(3000, () => 
    console.log(`Szerver fut: ${url}\nAPI-k:\n\t${url}/api/Raktar\n\t${url}/api/Bejelent\n\t${url}/api/Fehasznalo_ad\n\t${url}/api/Ceg_ad\n\t${url}/api/Partnerek_en_vevo\n\t${url}/api/Partnerek_en_elado\n\t${url}/api/Kategoriak\n\t${url}/api/Ceg_osszes`)
);