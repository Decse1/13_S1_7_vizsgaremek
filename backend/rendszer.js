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

app.listen(3000, () => 
    console.log(`Szerver fut: ${url} | API-k: ${url}/api/Raktar, ${url}/api/Bejelent`)
);