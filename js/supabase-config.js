// js/supabase-config.js - الإصدار النهائي
console.log('🚀 تهيئة Supabase...');

// تأكد من تحميل المكتبة
if (typeof supabase === 'undefined') {
  console.error('❌ مكتبة Supabase غير محملة');
  throw new Error('يجب تحميل مكتبة Supabase أولاً: https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
}

// إنشاء العميل
const supabaseClient = supabase.createClient(
  'https://yfumkrfhccwvvfiimhjr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmdW1rcmZoY2N3dnZmaWltaGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NDYyODEsImV4cCI6MjA4MTQyMjI4MX0.iT6dqwPZhhAb3Y9ZvR_CbHJw9on-CS5OCWoiSC95FOI',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      autoRefreshToken: true
    },
    global: {
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmdW1rcmZoY2N3dnZmaWltaGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NDYyODEsImV4cCI6MjA4MTQyMjI4MX0.iT6dqwPZhhAb3Y9ZvR_CbHJw9on-CS5OCWoiSC95FOI'
      }
    }
  }
);

// اختبار الاتصال تلقائياً
(async function testConnection() {
  console.log('🔄 اختبار اتصال Supabase...');
  
  try {
    // استعلام بسيط جداً
    const { data, error } = await supabaseClient
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ خطأ في الاتصال:', error);
      
      if (error.code === 'PGRST301' || error.message.includes('does not exist')) {
        console.log('💡 الحل: الجداول غير موجودة. يرجى:');
        console.log('1. فتح Supabase Dashboard');
        console.log('2. الذهاب إلى SQL Editor');
        console.log('3. نسخ كود إنشاء الجداول');
        console.log('4. تشغيل (Run) الكود');
      }
    } else {
      console.log('✅ اتصال Supabase ناجح!');
      console.log('📊 البيانات:', data);
    }
  } catch (err) {
    console.error('🔥 خطأ غير متوقع:', err);
  }
})();

// جعل supabaseClient متاحاً عالمياً
window.supabaseClient = supabaseClient;

// JSONBin إعدادات
window.JSONBIN_CONFIG = {
  API_KEY: '$2a$10$.o4BAbiMjGS4tEZUVokTsufL18lsFyO30xIOXO8wT4dP/sqGN/61e',
  BIN_ID: '694130b343b1c97be9f1ea04'
};

console.log('✅ Supabase متهيئ وجاهز للاستخدام');