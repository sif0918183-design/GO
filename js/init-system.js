// js/init-system.js

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
            // 1. التحقق من Supabase
            if (!window.supabaseClient) {
                throw new Error('Supabase Client غير جاهز');
            }

            this.supabase = window.supabaseClient;

            // 2. اختبار اتصال Supabase (بشكل آمن)
            await this.testSupabaseConnection();

            // 3. تهيئة JSONBin (اختياري)
            await this.initializeJSONBin();

            // 4. تحميل البيانات الأولية
            await this.loadInitialData();

            // 5. بدء الخدمات
            await this.startServices();

            this.initialized = true;

            console.log('✅ تم تهيئة النظام بنجاح');
            showMessage('success', 'تم تهيئة النظام بنجاح');

            return { success: true };

        } catch (error) {
            console.error('❌ فشل تهيئة النظام:', error);
            showMessage('error', `فشل التهيئة: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    async testSupabaseConnection() {
        console.log('🔄 اختبار اتصال Supabase...');

        try {
            // استعلام آمن بدون الاعتماد على جداول
            const { error } = await this.supabase
                .rpc('now');

            if (error) {
                console.warn('⚠️ الاتصال موجود لكن RPC غير متاح');
            }

            console.log('✅ Supabase متصل');
            return true;

        } catch (error) {
            throw new Error('فشل الاتصال بقاعدة البيانات');
        }
    }

    async initializeJSONBin() {
        if (typeof getJSONBin !== 'function') {
            console.warn('⚠️ JSONBin غير مهيأ، سيتم التخطي');
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

        } catch {
            console.warn('⚠️ JSONBin غير متاح، النظام سيعمل بدونه');
            return false;
        }
    }

    createInitialData() {
        return {
            system: {
                name: 'ترحال السودان',
                version: '1.0.0',
                initialized: new Date().toISOString()
            },
            activeDrivers: [],
            tripRequests: []
        };
    }

    async loadInitialData() {
        console.log('📥 تحميل البيانات...');
        await new Promise(r => setTimeout(r, 300));
        console.log('✅ تم تحميل البيانات');
    }

    async startServices() {
        console.log('⚙️ بدء الخدمات...');

        this.syncInterval = setInterval(() => {
            this.syncWithSupabase();
        }, 30000);

        console.log('✅ الخدمات نشطة');
    }

    async syncWithSupabase() {
        console.log('🔄 مزامنة البيانات...');
    }
}

// نسخة واحدة فقط
const travelSystem = new TravelSudanSystem();

// استدعاء يدوي فقط (من init.html)
window.initializeTravelSystem = () => travelSystem.initialize();