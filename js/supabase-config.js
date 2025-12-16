// js/supabase-config.js
const SUPABASE_URL = 'https://yfumkrfhccwvvfiimhjr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmdW1rcmZoY2N3dnZmaWltaGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NDYyODEsImV4cCI6MjA4MTQyMjI4MX0.iT6dqwPZhhAb3Y9ZvR_CbHJw9on-CS5OCWoiSC95FOI';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// JSONBin.io configuration for storing temporary data
const JSONBIN_API_KEY = '$2a$10$.o4BAbiMjGS4tEZUVokTsufL18lsFyO30xIOXO8wT4dP/sqGN/61e';
const JSONBIN_BIN_ID = '694130b343b1c97be9f1ea04';

// Initialize JSONBin
async function updateJSONBin(data) {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY,
                'X-Bin-Versioning': 'false'
            },
            body: JSON.stringify(data)
        });
        return await response.json();
    } catch (error) {
        console.error('JSONBin error:', error);
        return null;
    }
}

async function getJSONBin() {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': JSONBIN_API_KEY
            }
        });
        return await response.json();
    } catch (error) {
        console.error('JSONBin error:', error);
        return null;
    }
}
