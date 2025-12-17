// js/supabase-config.js - الإصدار الصحيح للنطاق

// 1. تعريف المتغيرات في النطاق العام (window)
// ملاحظة: لكي يعمل process.env في المتصفح، يجب أن يتم حقنه بواسطة بيئة الاستضافة
// (مثل Vercel) أثناء عملية البناء. إذا فشل، يجب استخدام القيم المباشرة.

if (typeof supabase !== 'undefined') {
    // قم بإنشاء العميل وإتاحته عالمياً
    window.supabaseClient = supabase.createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
    );
    console.log('✅ Supabase Client configured and assigned to window.supabaseClient');
} else {
    console.error('⚠️ Supabase library is not loaded before supabase-config.js');
}

// 2. تهيئة JSONBin في النطاق العام أيضاً
window.JSONBIN_API_KEY = process.env.JSONBIN_API_KEY;
window.JSONBIN_BIN_ID = '694130b343b1c97be9f1ea04'; // يمكن ترك المعرف هنا

// وظائف مساعدة لـ JSONBin، تستخدم الآن المتغيرات العامة
async function updateJSONBin(data) {
    if (!window.JSONBIN_API_KEY) {
        console.error('JSONBin API Key is missing');
        return null;
    }
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${window.JSONBIN_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                // نستخدم X-Master-Key لأننا نستخدم PUT/GET للوصول الخاص
                'X-Master-Key': window.JSONBIN_API_KEY, 
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
    if (!window.JSONBIN_API_KEY) {
        console.error('JSONBin API Key is missing');
        return null;
    }
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${window.JSONBIN_BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': window.JSONBIN_API_KEY
            }
        });
        return await response.json();
    } catch (error) {
        console.error('JSONBin error:', error);
        return null;
    }
}
