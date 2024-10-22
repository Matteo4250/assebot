const fs = require('fs').promises;
const path = require('path');

const LISTINGS_FILE = path.join(__dirname, '..', 'data', 'listings.json');

async function loadListings() {
    try {
        const data = await fs.readFile(LISTINGS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

async function saveListings(listings) {
    await fs.writeFile(LISTINGS_FILE, JSON.stringify(listings, null, 2));
}

async function saveListing(messageId, listingData) {
    const listings = await loadListings();
    listings[messageId] = listingData;
    await saveListings(listings);
}

module.exports = {
    saveListing,
    loadListings,
    saveListings
};