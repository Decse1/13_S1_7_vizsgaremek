let url = "http://localhost:3000";
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API-k importálása és regisztrálása
require("./apik/get/raktar.js")(app);
require("./apik/post&get/bejelent.js")(app);
require("./apik/post/felhasznalo_ad.js")(app);
require("./apik/post/ceg_ad.js")(app);

app.listen(3000, () => 
    console.log(`Szerver fut: ${url} | API-k: ${url}/api/Raktar, ${url}/api/Bejelent, ${url}/api/Fehasznalo_ad, ${url}/api/Ceg_ad`)
);