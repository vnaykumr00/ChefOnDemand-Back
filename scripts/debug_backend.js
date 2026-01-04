import { getNearbyChefs, getSearchHints } from '../src/services/userService.js';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    console.log("Testing getNearbyChefs...");
    try {
        const chefs = await getNearbyChefs({
            lat: 16.68424150,
            lng: 74.25901480,
            limit: 20
        });
        console.log("Chefs found:", chefs.length);
    } catch (e) {
        console.error("Error in getNearbyChefs:", e);
    }

    console.log("\nTesting getNearbyChefs with Search (Chef)...");
    try {
        const chefs = await getNearbyChefs({
            lat: 16.68424150,
            lng: 74.25901480,
            limit: 20,
            searchQuery: 'Vinay',
            searchType: 'Chef'
        });
        console.log("Chefs found (search):", chefs.length);
    } catch (e) {
        console.error("Error in getNearbyChefs (Search):", e);
    }

    console.log("\nTesting getSearchHints...");
    try {
        const hints = await getSearchHints('Vi');
        console.log("Hints found:", hints);
    } catch (e) {
        console.error("Error in getSearchHints:", e);
    }
}

test();
