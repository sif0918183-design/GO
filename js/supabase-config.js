// js/supabase-config.js - الإصدار المبسط
console.log('📦 تحميل supabase-config.js');

// تأكد من وجود مكتبة Supabase
if (typeof supabase === 'undefined') {
    console.error('❌ مكتبة Supabase غير محملة!');
    throw new Error('يجب تحميل مكتبة Supabase أولاً');
}

// إنشاء العميل مباشرة
const supabaseClient = supabase.createClient(
    'https://yfumkrfhccwvvfiimhjr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmdW1rcmZoY2N3dnZmaWltaGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NDYyODEsImV4cCI6MjA4MTQyMjI4MX0.iT6dqwPZhhAb3Y9ZvR_CbHJw9on-CS5OCWoiSC95FOI',
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true
        }
    }
);

console.log('✅ تم تهيئة Supabase Client:', supabaseClient);

// جعله متاحاً عالمياً للسهولة
window.supabaseClient = supabaseClient;

// JSONBin إعدادات
window.JSONBIN_API_KEY = '$2a$10$.o4BAbiMjGS4tEZUVokTsufL18lsFyO30xIOXO8wT4dP/sqGN/61e';
window.JSONBIN_BIN_ID = '694130b343b1c97be9f1ea04';

console.log('✅ supabase-config.js محمل بالكامل');