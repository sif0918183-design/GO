// js/supabase-config.js
(function() {
    // 1. بيانات الاتصال الأساسية
    const S_URL = 'https://yfumkrfhccwvvfiimhjr.supabase.co'.trim();
    const S_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmdW1rcmZoY2N3dnZmaWltaGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NDYyODEsImV4cCI6MjA4MTQyMjI4MX0.iT6dqwPZhhAb3Y9ZvR_CbHJw9on-CS5OCWoiSC95FOI'.trim();

    // 2. تهيئة عميل Supabase في النافذة العالمية
    if (typeof supabase !== 'undefined') {
        window.supabaseClient = supabase.createClient(S_URL, S_KEY);
        console.log("🚀 Supabase Client Initialized");
    } else {
        console.error("❌ مكتبة Supabase لم يتم تحميلها! تأكد من وجود رابط الـ CDN في HTML");
    }

    // 3. إعدادات JSONBin (مهمة للمزامنة)
    window.JSONBIN_API_KEY = '$2a$10$.o4BAbiMjGS4tEZUVokTsufL18lsFyO30xIOXO8wT4dP/sqGN/61e'; // تأكد من وضع مفتاحك الفعلي هنا
    window.JSONBIN_BIN_ID = '694130b343b1c97be9f1ea04';

    // 4. دالة عالمية للتحقق من الاتصال (تستخدمها صفحة التهيئة)
    window.checkSupabaseConnection = async function() {
        try {
            if (!window.supabaseClient) return false;
            // محاولة جلب معلومة بسيطة للتأكد من الاتصال
            const { data, error } = await window.supabaseClient.from('drivers').select('count', { count: 'exact', head: true });
            if (error) throw error;
            return true;
        } catch (err) {
            console.error("Supabase Connection Error:", err.message);
            return false;
        }
    };
})();
