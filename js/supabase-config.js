// js/supabase-config.js

// 1. إعدادات الثوابت
const S_URL = 'https://yfumkrfhccwvvfiimhjr.supabase.co'.trim();
const S_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmdW1rcmZoY2N3dnZmaWltaGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NDYyODEsImV4cCI6MjA4MTQyMjI4MX0.iT6dqwPZhhAb3Y9ZvR_CbHJw9on-CS5OCWoiSC95FOI'.trim();

// 2. تهيئة عميل Supabase في النطاق العام (window)
try {
    if (typeof supabase !== 'undefined') {
        window.supabaseClient = supabase.createClient(S_URL, S_KEY);
        console.log("✅ تم تهيئة window.supabaseClient بنجاح");
    } else {
        console.error("❌ مكتبة Supabase لم يتم تحميلها من الـ CDN!");
    }
} catch (error) {
    console.error("❌ خطأ أثناء تهيئة عميل Supabase:", error);
}

// 3. إعدادات JSONBin (بيانات حية)
window.JSONBIN_API_KEY = '$2a$10$.o4BAbiMjGS4tEZUVokTsufL18lsFyO30xIOXO8wT4dP/sqGN/61e'; // استبدل بمفتاحك الحقيقي إذا تغير
window.JSONBIN_BIN_ID = '694130b343b1c97be9f1ea04';

// 4. دالة جلب البيانات من JSONBin
window.getJSONBin = async function() {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${window.JSONBIN_BIN_ID}/latest`, {
            headers: { 'X-Master-Key': window.JSONBIN_API_KEY }
        });
        const result = await response.json();
        return result;
    } catch (err) {
        console.error("JSONBin Fetch Error:", err);
        return null;
    }
};

// 5. دالة تحديث البيانات في JSONBin
window.updateJSONBin = async function(data) {
    try {
        await fetch(`https://api.jsonbin.io/v3/b/${window.JSONBIN_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': window.JSONBIN_API_KEY,
                'X-Bin-Versioning': 'false'
            },
            body: JSON.stringify(data)
        });
        console.log("✅ تم تحديث JSONBin بنجاح");
    } catch (err) {
        console.error("JSONBin Update Error:", err);
    }
};
