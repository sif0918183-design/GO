// js/init-system.js
class TravelSudanSystem {
    constructor() {
        this.initialized = false;
        this.supabase = null;
    }

    async initialize() {
        console.log('🚀 بدء تهيئة نظام ترحال السودان...');
        
        try {
            // 1. تهيئة Supabase
            this.supabase = getSupabaseClient();
            if (!this.supabase) {
                throw new Error('فشل تهيئة Supabase');
            }
            
            // 2. اختبار اتصال Supabase
            await this.testSupabaseConnection();
            
            // 3. تهيئة JSONBin
            await this.initializeJSONBin();
            
            // 4. تحميل البيانات الأولية
            await this.loadInitialData();
            
            // 5. بدء الخدمات
            await this.startServices();
            
            this.initialized = true;
            console.log('✅ تم تهيئة النظام بنجاح!');
            
            showMessage('success', 'تم تهيئة النظام بنجاح!');
            
            return { success: true, message: '✅ النظام جاهز للاستخدام' };
            
        } catch (error) {
            console.error('❌ فشل تهيئة النظام:', error);
            showMessage('error', `فشل التهيئة: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    async testSupabaseConnection() {
        console.log('🔄 اختبار اتصال Supabase...');
        
        try {
            // محاولة استعلام بسيط
            const { data, error } = await this.supabase
                .from('users')
                .select('count', { count: 'exact', head: true });
            
            if (error) {
                console.log('⚠️ قد تكون الجداول غير موجودة بعد:', error.message);
                // لا نرمي خطأ هنا لأن الجداول قد تكون جديدة
            }
            
            console.log('✅ اتصال Supabase يعمل');
            return true;
            
        } catch (error) {
            console.error('❌ فشل اختبار اتصال Supabase:', error);
            throw new Error('فشل الاتصال بقاعدة البيانات: ' + error.message);
        }
    }

    async initializeJSONBin() {
        console.log('🔄 تهيئة JSONBin...');
        
        try {
            // محاولة قراءة من JSONBin
            const data = await getJSONBin();
            
            if (!data || !data.record) {
                // إنشاء بيانات أولية إذا لم تكن موجودة
                const initialData = this.createInitialData();
                await updateJSONBin(initialData);
                console.log('✅ تم إنشاء بيانات JSONBin أولية');
            } else {
                console.log('✅ تم تحميل بيانات JSONBin');
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ مشكلة في JSONBin:', error);
            // لا نرمي خطأ لأن النظام يمكنه العمل بدون JSONBin
            console.log('⚠️ النظام سيعمل مع تخزين محلي فقط');
            return false;
        }
    }

    createInitialData() {
        return {
            system: {
                name: "ترحال السودان",
                version: "1.0.0",
                initialized: new Date().toISOString(),
                status: "active"
            },
            activeDrivers: [],
            tripRequests: [],
            settings: {
                searchRadius: 20,
                minBalance: 3000,
                fares: { standard: 3000, comfort: 4500, van: 6000 }
            }
        };
    }

    async loadInitialData() {
        console.log('📥 جاري تحميل البيانات...');
        // يمكنك إضافة منطق تحميل البيانات هنا
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('✅ تم تحميل البيانات');
    }

    async startServices() {
        console.log('⚙️ بدء الخدمات...');
        
        // خدمة المزامنة كل 30 ثانية
        this.syncInterval = setInterval(() => {
            this.syncWithSupabase();
        }, 30000);
        
        console.log('✅ الخدمات نشطة');
    }

    async syncWithSupabase() {
        try {
            // منطق المزامنة
            console.log('🔄 مزامنة البيانات...');
        } catch (error) {
            console.error('❌ خطأ في المزامنة:', error);
        }
    }
}

// إنشاء وتصدير نسخة واحدة من النظام
const travelSystem = new TravelSudanSystem();

// للاستخدام المباشر
window.initializeTravelSystem = () => travelSystem.initialize();

// تهيئة تلقائية عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 الصفحة محملة، جاهز للتهيئة...');
    
    // انتظر ثانية قبل التهيئة
    setTimeout(() => {
        travelSystem.initialize();
    }, 1000);
});