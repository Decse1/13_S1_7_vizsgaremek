let url = "http://localhost:3000";
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API-k importálása és regisztrálása
<<<<<<< Updated upstream
<<<<<<< Updated upstream
require("./apik/post/raktar.js")(app);
require("./apik/post&get/bejelent.js")(app);
=======
require("./apik/get/raktar.js")(app);
require("./apik/post/bejelent.js")(app);
>>>>>>> Stashed changes
=======
require("./apik/get/raktar.js")(app);
require("./apik/post/bejelent.js")(app);
>>>>>>> Stashed changes
require("./apik/post/felhasznalo_ad.js")(app);
require("./apik/post/ceg_ad.js")(app);
require("./apik/partnerek.js")(app);
require("./apik/post/kategoriak.js")(app);

app.listen(3000, () => 
    console.log(`Szerver fut: ${url}\nAPI-k:\n\t${url}/api/Raktar\n\t${url}/api/Bejelent\n\t${url}/api/Fehasznalo_ad\n\t${url}/api/Ceg_ad\n\t${url}/api/Partnerek_en_vevo\n\t${url}/api/Partnerek_en_elado\n\t${url}/api/Kategoriak`)
);