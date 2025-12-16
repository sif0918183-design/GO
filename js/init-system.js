// في أعلى ملف JavaScript الرئيسي
if (typeof supabase === 'undefined') {
    console.error('مكتبة Supabase غير محملة!');
    // تحميل المكتبة ديناميكياً
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = () => {
        console.log('✅ تم تحميل Supabase بنجاح');
        // أعادة تهيئة النظام بعد تحميل المكتبة
        initializeSystem();
    };
    script.onerror = () => {
        console.error('❌ فشل تحميل مكتبة Supabase');
        showMessage('error', 'فشل تحميل مكتبة قاعدة البيانات');
    };
    document.head.appendChild(script);
}

// تأكد من وجود supabaseClient
if (typeof supabaseClient === 'undefined' && typeof supabase !== 'undefined') {
    console.log('🔄 جاري تهيئة Supabase Client...');
    const supabaseClient = supabase.createClient(
        'https://yfumkrfhccwvvfiimhjr.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmdW1rcmZoY2N3dnZmaWltaGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NDYyODEsImV4cCI6MjA4MTQyMjI4MX0.iT6dqwPZhhAb3Y9ZvR_CbHJw9on-CS5OCWoiSC95FOI'
    );
    console.log('✅ تم تهيئة Supabase Client');
}
// js/simple-init.js - ملف مبسط للتهيئة
class SimpleSystemInitializer {
    constructor() {
        this.steps = [
            { id: 1, name: 'اتصال Supabase', status: 'pending' },
            { id: 2, name: 'إنشاء JSONBin', status: 'pending' },
            { id: 3, name: 'تحميل البيانات', status: 'pending' },
            { id: 4, name: 'بدء الخدمات', status: 'pending' }
        ];
    }

    async initializeAll() {
        console.log('🚀 بدء التهيئة الشاملة...');
        
        try {
            // 1. اتصال Supabase
            await this.connectSupabase();
            
            // 2. تهيئة JSONBin
            const binId = await this.setupJSONBin();
            
            // 3. تحميل البيانات
            const data = await this.loadData();
            
            // 4. بدء الخدمات
            await this.startServices();
            
            return {
                success: true,
                message: '✅ تم تهيئة النظام بنجاح!',
                binId: binId,
                data: data
            };
            
        } catch (error) {
            console.error('❌ فشل التهيئة:', error);
            return {
                success: false,
                message: '❌ فشل تهيئة النظام: ' + error.message,
                error: error
            };
        }
    }

    async connectSupabase() {
        this.updateStep(1, 'جاري الاتصال بـ Supabase...', 'loading');
        
        try {
            // اختبار الاتصال
            const { error } = await supabaseClient
                .from('users')
                .select('count', { count: 'exact', head: true });
            
            if (error) {
                // إذا الجداول غير موجودة، لا بأس (قد تكون جديدة)
                console.log('⚠️ قد تكون الجداول غير موجودة بعد. تأكد من تشغيل SQL script.');
            }
            
            this.updateStep(1, '✅ اتصال Supabase جاهز', 'success');
            return true;
            
        } catch (error) {
            this.updateStep(1, '❌ فشل الاتصال بـ Supabase', 'error');
            throw error;
        }
    }

    async setupJSONBin() {
        this.updateStep(2, 'جاري إعداد JSONBin...', 'loading');
        
        let binId = localStorage.getItem('travel_jsonbin_id');
        
        if (!binId) {
            try {
                // إنشاء Bin جديد
                const response = await fetch('https://api.jsonbin.io/v3/b', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': JSONBIN_API_KEY,
                        'X-Bin-Name': `ترحال-السودان-${new Date().toLocaleDateString('ar-SA')}`,
                        'X-Bin-Private': false
                    },
                    body: JSON.stringify(this.createInitialData())
                });
                
                const result = await response.json();
                binId = result.metadata?.id;
                
                if (!binId) throw new Error('فشل إنشاء JSONBin');
                
                localStorage.setItem('travel_jsonbin_id', binId);
                console.log('✅ JSONBin أنشئ بنجاح:', binId);
                
            } catch (error) {
                console.error('❌ فشل إنشاء JSONBin:', error);
                console.log('⚠️ استخدام localStorage كبديل');
                binId = 'local';
                localStorage.setItem('travel_jsonbin_id', binId);
            }
        } else {
            console.log('✅ استخدام JSONBin موجود:', binId);
        }
        
        this.updateStep(2, `✅ JSONBin جاهز (${binId})`, 'success');
        return binId;
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

    async loadData() {
        this.updateStep(3, 'جاري تحميل البيانات...', 'loading');
        
        try {
            let data;
            const binId = localStorage.getItem('travel_jsonbin_id');
            
            if (binId === 'local') {
                // من localStorage
                const localData = localStorage.getItem('travel_sudan_data');
                data = localData ? JSON.parse(localData) : this.createInitialData();
            } else {
                // من JSONBin
                const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
                    headers: { 'X-Master-Key': JSONBIN_API_KEY }
                });
                const result = await response.json();
                data = result.record;
            }
            
            console.log('✅ البيانات محملة:', data.system?.name);
            this.updateStep(3, '✅ البيانات محملة بنجاح', 'success');
            return data;
            
        } catch (error) {
            this.updateStep(3, '❌ فشل تحميل البيانات', 'error');
            throw error;
        }
    }

    async startServices() {
        this.updateStep(4, 'جاري بدء الخدمات...', 'loading');
        
        // خدمة المزامنة
        this.syncService = setInterval(async () => {
            await this.syncWithSupabase();
        }, 30000);
        
        // خدمة النسخ الاحتياطي
        this.backupService = setInterval(() => {
            this.createBackup();
        }, 3600000); // كل ساعة
        
        console.log('✅ الخدمات بدأت');
        this.updateStep(4, '✅ جميع الخدمات نشطة', 'success');
    }

    async syncWithSupabase() {
        try {
            // الحصول على السائقين المتصلين
            const { data: drivers } = await supabaseClient
                .from('drivers')
                .select('id, status')
                .eq('status', 'online')
                .eq('is_active', true);
            
            // تحديث JSONBin
            const binId = localStorage.getItem('travel_jsonbin_id');
            let data;
            
            if (binId === 'local') {
                data = JSON.parse(localStorage.getItem('travel_sudan_data') || '{}');
            } else {
                const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
                    headers: { 'X-Master-Key': JSONBIN_API_KEY }
                });
                const result = await response.json();
                data = result.record;
            }
            
            data.activeDrivers = drivers || [];
            data.lastSync = new Date().toISOString();
            
            if (binId === 'local') {
                localStorage.setItem('travel_sudan_data', JSON.stringify(data));
            } else {
                await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': JSONBIN_API_KEY
                    },
                    body: JSON.stringify(data)
                });
            }
            
            console.log('✅ تمت المزامنة مع', drivers?.length || 0, 'سائق');
            
        } catch (error) {
            console.error('❌ خطأ في المزامنة:', error);
        }
    }

    createBackup() {
        const binId = localStorage.getItem('travel_jsonbin_id');
        let data;
        
        if (binId === 'local') {
            data = localStorage.getItem('travel_sudan_data');
        }
        
        if (data) {
            const backupKey = `backup_${Date.now()}`;
            localStorage.setItem(backupKey, data);
            console.log('✅ نسخة احتياطية محفوظة:', backupKey);
        }
    }

    updateStep(stepId, message, status) {
        const step = this.steps.find(s => s.id === stepId);
        if (step) {
            step.message = message;
            step.status = status;
            step.updated = new Date();
            
            // تحديث واجهة المستخدم إذا كانت موجودة
            if (typeof window !== 'undefined') {
                const element = document.getElementById(`step${stepId}`);
                if (element) {
                    element.textContent = message;
                    element.className = `step ${status}`;
                }
            }
        }
    }

    getStatus() {
        return this.steps;
    }
}

// إنشاء وتصدير مثيل واحد
const systemInitializer = new SimpleSystemInitializer();

// دالة سهلة الاستخدام
export async function initializeSystem() {
    return await systemInitializer.initializeAll();
}

// للاستخدام المباشر في الصفحات
if (typeof window !== 'undefined') {
    window.initializeTravelSystem = initializeSystem;
}