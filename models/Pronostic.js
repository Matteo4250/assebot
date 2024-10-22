const fs = require('fs').promises;
const path = require('path');

const PRONOS_FILE = path.join(__dirname, '..', 'data', 'pronos.json');

async function getPronostics() {
    const data = await fs.readFile(PRONOS_FILE, 'utf8');
    return JSON.parse(data);
}

async function savePronostics(pronostics) {
    await fs.writeFile(PRONOS_FILE, JSON.stringify(pronostics, null, 2));
}

function lockPronostics(pronostics) {
    return pronostics.map(prono => ({ ...prono, locked: true }));
}

module.exports = {
    getPronostics,
    savePronostics,
    lockPronostics
};
