const fs = require('fs').promises;
const path = require('path');

const LEADERBOARD_FILE = path.join(__dirname, '..', 'data', 'leaderboard.json');

async function getUserRanking() {
    try {
        const data = await fs.readFile(LEADERBOARD_FILE, 'utf8');
        return data.trim() ? JSON.parse(data) : {}; // Retourner un objet vide si le fichier est vide
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error('Fichier du classement non trouvé.');
            return {}; // Retourner un objet vide si le fichier n'existe pas
        } else {
            console.error('Erreur lors de la lecture du fichier du classement :', error);
            throw error;
        }
    }
}

async function saveUserRanking(ranking) {
    try {
        await fs.writeFile(LEADERBOARD_FILE, JSON.stringify(ranking, null, 2));
    } catch (error) {
        console.error('Erreur lors de la sauvegarde du fichier du classement :', error);
        throw error;
    }
}

module.exports = { getUserRanking, saveUserRanking };
