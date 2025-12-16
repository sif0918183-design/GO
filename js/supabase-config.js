/* =========================================================
   Supabase Configuration (Static Frontend Safe Setup)
   Project: ترحال السودان
   ========================================================= */

/* تأكد أن مكتبة Supabase محملة */
if (typeof supabase === 'undefined') {
    console.error('❌ مكتبة Supabase غير محملة');
}

/* بيانات Supabase (anon key فقط) */
const SUPABASE_URL = 'https://yfumkrfhccwvvfiimhjr.supabase.co';
const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmdW1rcmZoY2N3dnZmaWltaGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NDYyODEsImV4cCI6MjA4MTQyMjI4MX0.iT6dqwPZhhAb3Y9ZvR_CbHJw9on-CS5OCWoiSC95FOI';

/* إنشاء Supabase Client وجعله عامًا */
window.supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

console.log('✅ Supabase Client جاهز');

/* =========================================================
   JSONBin Configuration (⚠️ غير آمن للبيانات الحساسة)
   ========================================================= */

/*
 ⚠️ تحذير أمني:
 JSONBin Master Key لا يجب استخدامه لتخزين بيانات حساسة
 مثل: أرقام الهواتف، كلمات المرور، المدفوعات
 استخدمه فقط لبيانات مؤقتة أو عامة
*/

const JSONBIN_API_KEY = '$2a$10$.o4BAbiMjGS4tEZUVokTsufL18lsFyO30xIOXO8wT4dP/sqGN/61e'; // ضع المفتاح هنا مؤقتًا
const JSONBIN_BIN_ID = '694130b343b1c97be9f1ea04';

/* تحديث البيانات في JSONBin */
async function updateJSONBin(data) {
    if (!JSONBIN_API_KEY || JSONBIN_API_KEY === 'PUT_YOUR_JSONBIN_API_KEY_HERE') {
        console.warn('⚠️ JSONBin API Key غير مُعرّف');
        return null;
    }

    try {
        const response = await fetch(
            `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': JSONBIN_API_KEY,
                    'X-Bin-Versioning': 'false'
                },
                body: JSON.stringify(data)
            }
        );

        if (!response.ok) {
            throw new Error('فشل تحديث JSONBin');
        }

        return await response.json();
    } catch (error) {
        console.error('❌ JSONBin Update Error:', error);
        return null;
    }
}

/* جلب البيانات من JSONBin */
async function getJSONBin() {
    if (!JSONBIN_API_KEY || JSONBIN_API_KEY === 'PUT_YOUR_JSONBIN_API_KEY_HERE') {
        console.warn('⚠️ JSONBin API Key غير مُعرّف');
        return null;
    }

    try {
        const response = await fetch(
            `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`,
            {
                headers: {
                    'X-Master-Key': JSONBIN_API_KEY
                }
            }
        );

        if (!response.ok) {
            throw new Error('فشل جلب بيانات JSONBin');
        }

        return await response.json();
    } catch (error) {
        console.error('❌ JSONBin Fetch Error:', error);
        return null;
    }
}

/* =========================================================
   Helpers
   ========================================================= */

function isSupabaseReady() {
    return typeof window.supabaseClient !== 'undefined';
}