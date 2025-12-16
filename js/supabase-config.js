// js/supabase-config.js - الإصدار الآمن
const supabaseClient = supabase.createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// JSONBin.io configuration for storing temporary data
const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY;
const JSONBIN_BIN_ID = '694130b343b1c97be9f1ea04'; // يمكن ترك معرف الـ Bin في الكود إذا لم يكن سرياً

// Initialize JSONBin
async function updateJSONBin(data) {
    if (!JSONBIN_API_KEY) {
        console.error('JSONBin API Key is missing');
        return null;
    }
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
    if (!JSONBIN_API_KEY) {
        console.error('JSONBin API Key is missing');
        return null;
    }
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