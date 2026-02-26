const bcrypt = require('bcrypt');

const plainPasswords = [
    'pass_1'
];

async function hashPasswords() {
    for (let i = 0; i < plainPasswords.length; i++) {
        const hashed = await bcrypt.hash(plainPasswords[i], 10);
        console.log(`Felhasználó ${i+1} hash: '${hashed}'`);
    }
}

hashPasswords();