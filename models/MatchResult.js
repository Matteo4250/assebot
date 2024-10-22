const fs = require('fs').promises;
const path = require('path');

const MATCH_RESULT_FILE = path.join(__dirname, '..', 'data', 'matchResult.json');

async function getMatchResult() {
    try {
        const data = await fs.readFile(MATCH_RESULT_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return null; // Return null if file does not exist
    }
}

async function saveMatchResult(result) {
    await fs.writeFile(MATCH_RESULT_FILE, JSON.stringify(result, null, 2));
}

module.exports = {
    getMatchResult,
    saveMatchResult
};
