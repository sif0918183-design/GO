// js/supabase-config.js
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// JSONBin.io configuration for storing temporary data
const JSONBIN_API_KEY = '$2a$10$your-jsonbin-api-key';
const JSONBIN_BIN_ID = 'your-bin-id';

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
