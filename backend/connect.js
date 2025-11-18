const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'mysql',
    database: 'adatbazis_reka'
});

module.exports = pool;