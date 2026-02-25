const mysql = require('mysql2/promise');

const servers = {
    ampps: {
        host: 'localhost',
        user: 'root',
        password: 'mysql',
        database: 'adatbazis_reka'
    },
    xampp: {
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'adatbazis_reka'
    }
};

let pool;

async function initDatabase() {
    try {
        pool = mysql.createPool(servers.ampps);
        await pool.query('SELECT 1');
        console.log('✅ AMPPS MySQL');
    } catch {
        pool = mysql.createPool(servers.xampp);
        await pool.query('SELECT 1');
        console.log('✅ XAMPP MySQL');
    }
}

async function query(sql, params = []) {
    if (!pool) {
        throw new Error('❌ MySQL nincs inicializálva');
    }
    return pool.query(sql, params);
}

module.exports = {
    initDatabase,
    query
};