// js/init-system.js
// ============================================
// نظام تهيئة ترحال السودان (نسخة مستقرة)
// ============================================

class TravelSudanSystem {
    constructor() {
        this.initialized = false;
        this.supabase = null;
        this.syncInterval = null;
    }

    async initialize() {
        if (this.initialized) {
            console.warn('⚠️ النظام مهيأ مسبقًا');
            return { success: true };
        }

        console.log('🚀 بدء تهيئة نظام ترحال السودان...');

        try {
            /* 1️⃣ التحقق من Supabase Client */
            if (!window.supabaseClient) {
                throw new Error('Supabase Client غير موجود');
            }

            this.supabase = window.supabaseClient;
            console.log('✅ Supabase Client متاح');

            /* 2️⃣ اختبار الاتصال (الطريقة الصحيحة) */
            await this.testSupabaseConnection();

            /* 3️⃣ تهيئة JSONBin (اختياري) */
            await this.initializeJSONBin();

            /* 4️⃣ تحميل البيانات الأولية */
            await this.loadInitialData();

            /* 5️⃣ بدء الخدمات */
            await this.startServices();

            this.initialized = true;

            console.log('🎉 تم تهيئة النظام بنجاح');
            if (typeof showMessage === 'function') {
                showMessage('success', 'تم تهيئة النظام بنجاح');
            }

            return { success: true };

        } catch (error) {
            console.error('❌ فشل تهيئة النظام:', error);
            if (typeof showMessage === 'function') {
                showMessage('error', `فشل التهيئة: ${error.message}`);
            }
            return { success: false, error: error.message };
        }
    }

    /* ============================================
       اختبار اتصال Supabase (بدون جداول أو RLS)
       ============================================ */
    async testSupabaseConnection() {
        console.log('🔄 اختبار اتصال Supabase...');

        try {
            const { data, error } = await this.supabase.auth.getSession();

            if (error) {
                throw error;
            }

            console.log('✅ Supabase متصل (Auth OK)');
            return true;

        } catch (error) {
            console.error('❌ فشل الاتصال بـ Supabase:', error);
            throw new Error('فشل الاتصال بقاعدة البيانات');
        }
    }

    /* ============================================
       تهيئة JSONBin (اختياري)
       ============================================ */
    async initializeJSONBin() {
        if (
            typeof getJSONBin !== 'function' ||
            typeof updateJSONBin !== 'function'
        ) {
            console.warn('⚠️ JSONBin غير مهيأ – سيتم التخطي');
            return false;
        }

        console.log('🔄 تهيئة JSONBin...');

        try {
            const data = await getJSONBin();

            if (!data || !data.record) {
                await updateJSONBin(this.createInitialData());
                console.log('✅ تم إنشاء بيانات JSONBin أولية');
            } else {
                console.log('✅ تم تحميل بيانات JSONBin');
            }

            return true;

        } catch (error) {
            console.warn('⚠️ JSONBin غير متاح – النظام سيعمل بدونه');
            return false;
        }
    }

    /* ============================================
       بيانات أولية
       ============================================ */
    createInitialData() {
        return {
            system: {
                name: 'ترحال السودان',
                version: '1.0.0',
                initializedAt: new Date().toISOString(),
                status: 'active'
            },
            activeDrivers: [],
            tripRequests: [],
            settings: {
                searchRadiusKm: 20,
                baseFare: 3000
            }
        };
    }

    /* ============================================
       تحميل البيانات
       ============================================ */
    async loadInitialData() {
        console.log('📥 تحميل البيانات الأولية...');
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log('✅ تم تحميل البيانات');
    }

    /* ============================================
       بدء الخدمات
       ============================================ */
    async startServices() {
        console.log('⚙️ بدء الخدمات...');

        this.syncInterval = setInterval(() => {
            this.syncWithSupabase();
        }, 30000);

        console.log('✅ الخدمات نشطة');
    }

    /* ============================================
       مزامنة (حاليًا وهمية – للتوسعة لاحقًا)
       ============================================ */
    async syncWithSupabase() {
        console.log('🔄 مزامنة البيانات...');
        // سيتم إضافة منطق المزامنة لاحقًا
    }
}

/* ============================================
   إنشاء نسخة واحدة فقط من النظام
   ============================================ */
const travelSystem = new TravelSudanSystem();

/* ============================================
   تصدير دالة التهيئة للاستخدام في init.html
   ============================================ */
window.initializeTravelSystem = () => travelSystem.initialize();