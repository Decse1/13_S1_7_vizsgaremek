const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;

// Middleware a POST form adatok feldolgozásához
app.use(bodyParser.urlencoded({ extended: true }));

// Főoldal – HTML form
app.get("/", (req, res) => {
  res.send(`
    <h1>Összeadó alkalmazás</h1>
    <form action="/sum" method="post">
      <input type="text" name="num1" placeholder="Első szám" required>
      <input type="text" name="num2" placeholder="Második szám" required>
      <button type="submit">Számol</button>
    </form>
  `);
});

// POST feldolgozás
app.post("/sum", (req, res) => {
  const num1 = parseFloat(req.body.num1);
  const num2 = parseFloat(req.body.num2);
  const sum = num1 + num2;

  res.send(`<h2>A két szám összege: ${sum}</h2>
            <a href="/">Vissza</a>`);
});

// Szerver indítása
app.listen(port, () => {
  console.log(`Szerver fut: http://localhost:${port}`);
});