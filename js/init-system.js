// js/init-system.js - نظام بدء تهيئة ترحال السودان

/**
 * دالة مساعدة لعملية تهيئة خدمات التخزين (JSONBin)
 * @returns {object} حالة النجاح أو الفشل
 */
async function initializeStorageService() {
    // التحقق من وجود المفتاح في النطاق العام
    if (typeof window.JSONBIN_API_KEY === 'undefined' || !window.JSONBIN_API_KEY) {
        return { success: false, error: 'JSONBIN_API_KEY is missing or undefined.' };
    }

    try {
        // محاولة جلب البيانات كاختبار بسيط للاتصال
        const statusData = await getJSONBin(); 
        
        if (statusData && statusData.record) {
            console.log('✅ تم الاتصال بخدمة التخزين بنجاح.');
            // يمكنك هنا التحقق من سلامة البيانات
            return { success: true };
        } else {
             // قد يكون statusData null في حالة وجود خطأ في getJSONBin
            return { success: false, error: statusData ? statusData.message : 'Failed to retrieve data from JSONBin.' };
        }

    } catch (e) {
        console.error('Storage initialization error:', e);
        return { success: false, error: 'Storage exception: ' + e.message };
    }
}

/**
 * الدالة الرئيسية لتهيئة النظام والخدمات
 * يتم استدعاؤها من init.html
 * @returns {object} حالة نجاح أو فشل التهيئة بالكامل
 */
async function initializeTravelSystem() {
    // 1. التحقق من وجود عميل Supabase
    if (typeof window.supabaseClient === 'undefined') {
        return { success: false, error: 'supabaseClient is not defined.' };
    }

    try {
        // 2. اختبار الاتصال بقاعدة بيانات Supabase
        console.log('🔄 جاري اختبار اتصال Supabase...');
        // نختار جدول بسيط جداً أو نستخدم دالة عامة لعد الصفوف كاختبار
        const { data, error } = await window.supabaseClient
            .from('services_status') // يفترض وجود هذا الجدول
            .select('status_id')
            .limit(1);

        if (error) {
            console.error('Supabase DB Connection Error:', error);
            // إظهار رسالة خطأ واضحة
            return { success: false, error: 'فشل الاتصال بـ Supabase: ' + error.message };
        }
        console.log('✅ تم الاتصال بـ Supabase بنجاح.');

        // 3. تهيئة خدمات التخزين
        console.log('🔄 جاري تهيئة خدمات التخزين...');
        const storageResult = await initializeStorageService();

        if (!storageResult.success) {
            console.error('Storage Service Error:', storageResult.error);
            return { success: false, error: 'فشل تهيئة التخزين: ' + storageResult.error };
        }
        console.log('✅ تم تهيئة خدمات التخزين بنجاح.');

        // 4. تسجيل نجاح التهيئة النهائية
        return { success: true };

    } catch (e) {
        console.error('Initialization Process Exception:', e);
        return { success: false, error: 'خطأ غير متوقع: ' + e.message };
    }
}
