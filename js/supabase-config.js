// js/supabase-config.js - إعدادات Supabase و JSONBin

// ----------------------------------------------------
// القيم الثابتة (لضمان عمل التهيئة بغض النظر عن Vercel Env)
// يجب استبدالها بمتغيرات البيئة في بيئة الإنتاج الفعلية للحفاظ على الأمان
// ----------------------------------------------------
const SUPABASE_URL = 'https://yfumkrfhccwvvfiimhjr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmdW1rcmZoY2N3dnZmaWltaGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NDYyODEsImV4cCI6MjA4MTQyMjI4MX0.iT6dqwPZhhAb3Y9ZvR_CbHJw9on-CS5OCWoiSC95FOI';
// مفتاح JSONBin يجب أن يكون سرياً، هذا مفتاح وهمي يجب استبداله بمفتاحك
const LOCAL_JSONBIN_API_KEY = '$2a$10$.o4BAbiMjGS4tEZUVokTsufL18lsFyO30xIOXO8wT4dP/sqGN/61e'; 
const LOCAL_JSONBIN_BIN_ID = '694130b343b1c97be9f1ea04'; 

// ----------------------------------------------------
// تعريف العملاء في النطاق العالمي (window)
// ----------------------------------------------------

// 1. تهيئة Supabase Client
if (typeof supabase !== 'undefined') {
    // نجعل العميل متاحاً في النطاق العام
    window.supabaseClient = supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );
    console.log('✅ Supabase Client configured and assigned to window.supabaseClient.');
} else {
    console.error('❌ Supabase library not loaded. Check script tag order in HTML.');
}

// 2. تهيئة JSONBin API
window.JSONBIN_API_KEY = LOCAL_JSONBIN_API_KEY;
window.JSONBIN_BIN_ID = LOCAL_JSONBIN_BIN_ID;

// ----------------------------------------------------
// وظائف المساعدة لـ JSONBin (تستخدم الآن المتغيرات العامة window.)
// ----------------------------------------------------

async function updateJSONBin(data) {
    if (!window.JSONBIN_API_KEY) {
        console.error('JSONBin API Key is missing. Cannot update data.');
        return null;
    }
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${window.JSONBIN_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': window.JSONBIN_API_KEY,
                'X-Bin-Versioning': 'false'
            },
            body: JSON.stringify(data)
        });
        return await response.json();
    } catch (error) {
        console.error('JSONBin update error:', error);
        return null;
    }
}

async function getJSONBin() {
    if (!window.JSONBIN_API_KEY) {
        console.error('JSONBin API Key is missing. Cannot retrieve data.');
        return null;
    }
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${window.JSONBIN_BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': window.JSONBIN_API_KEY
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('JSONBin retrieval error:', error);
        return null;
    }
}
