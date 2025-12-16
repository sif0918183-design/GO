// js/init-system.js
class TravelSudanSystem {
    constructor() {
        this.initialized = false;
        this.jsonBinId = null;
        this.supabaseReady = false;
        this.jsonBinReady = false;
    }

    async initialize() {
        console.log('🚀 Starting Travel Sudan System Initialization...');
        
        try {
            // 1. تهيئة Supabase
            await this.initializeSupabase();
            
            // 2. تهيئة JSONBin
            await this.initializeJSONBin();
            
            // 3. تحميل البيانات الأولية
            await this.loadInitialData();
            
            // 4. بدء الخدمات
            await this.startServices();
            
            this.initialized = true;
            console.log('✅ System initialized successfully!');
            
            return true;
            
        } catch (error) {
            console.error('❌ System initialization failed:', error);
            return false;
        }
    }

    async initializeSupabase() {
        console.log('🔄 Initializing Supabase connection...');
        
        try {
            // اختبار اتصال Supabase
            const { data, error } = await supabaseClient
                .from('users')
                .select('count', { count: 'exact', head: true });
            
            if (error) {
                if (error.message.includes('does not exist')) {
                    console.log('⚠️ Tables not created yet. Please run the SQL script first.');
                }
                throw error;
            }
            
            this.supabaseReady = true;
            console.log('✅ Supabase connected successfully');
            
        } catch (error) {
            console.error('❌ Supabase initialization failed:', error);
            throw error;
        }
    }

    async initializeJSONBin() {
        console.log('🔄 Initializing JSONBin...');
        
        // التحقق من وجود JSONBin ID مخزن
        this.jsonBinId = localStorage.getItem('travel_jsonbin_id');
        
        if (!this.jsonBinId) {
            console.log('🆕 Creating new JSONBin...');
            
            try {
                const response = await fetch('https://api.jsonbin.io/v3/b', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': JSONBIN_API_KEY,
                        'X-Bin-Name': `travel-sudan-${Date.now()}`,
                        'X-Bin-Private': false
                    },
                    body: JSON.stringify(this.getInitialJSONBinData())
                });
                
                const result = await response.json();
                
                if (result.metadata && result.metadata.id) {
                    this.jsonBinId = result.metadata.id;
                    localStorage.setItem('travel_jsonbin_id', this.jsonBinId);
                    console.log('✅ JSONBin created with ID:', this.jsonBinId);
                } else {
                    throw new Error('Failed to create JSONBin');
                }
                
            } catch (error) {
                console.error('❌ JSONBin creation failed:', error);
                console.log('⚠️ Using localStorage as fallback');
                this.jsonBinId = 'local';
            }
        } else {
            console.log('✅ Using existing JSONBin ID:', this.jsonBinId);
        }
        
        this.jsonBinReady = true;
    }

    getInitialJSONBinData() {
        return {
            system: {
                name: "ترحال السودان",
                version: "1.0.0",
                lastUpdated: new Date().toISOString(),
                status: "active",
                initializedAt: new Date().toISOString()
            },
            activeDrivers: [],
            customerLocations: {},
            driverLocations: {},
            tripRequests: [],
            activeCalls: [],
            ongoingTrips: {},
            driverStats: {
                totalOnline: 0,
                totalOffline: 0,
                totalBusy: 0,
                totalAvailable: 0,
                lastUpdate: new Date().toISOString()
            },
            tripStats: {
                totalToday: 0,
                completedToday: 0,
                cancelledToday: 0,
                revenueToday: 0,
                activeNow: 0,
                lastUpdate: new Date().toISOString()
            },
            callQueue: [],
            locationUpdates: {},
            systemSettings: {
                searchRadiusKm: 20,
                minimumBalance: 3000,
                rideFare: {
                    standard: 3000,
                    comfort: 4500,
                    van: 6000,
                    currency: "SDG"
                },
                platformFeePercentage: 15,
                callTimeoutSeconds: 30,
                driverInactivityTimeout: 300,
                locationUpdateInterval: 30,
                maxDriversPerRequest: 10,
                driverStartBalance: 15000
            },
            cities: {
                "الخرطوم": {
                    center: { lat: 15.5007, lng: 32.5599 },
                    radius: 50,
                    active: true,
                    drivers: 0
                },
                "أم درمان": {
                    center: { lat: 15.6445, lng: 32.4818 },
                    radius: 30,
                    active: true,
                    drivers: 0
                },
                "بحري": {
                    center: { lat: 15.6333, lng: 32.5528 },
                    radius: 25,
                    active: true,
                    drivers: 0
                }
            },
            landmarks: {
                airports: [
                    {
                        id: "airport_krt",
                        name: "مطار الخرطوم الدولي",
                        location: { lat: 15.5896, lng: 32.5532 },
                        type: "airport"
                    }
                ],
                hospitals: [
                    {
                        id: "hospital_medical",
                        name: "مستشفى السلاح الطبي",
                        location: { lat: 15.5881, lng: 32.5412 },
                        type: "hospital"
                    }
                ],
                universities: [
                    {
                        id: "university_khartoum",
                        name: "جامعة الخرطوم",
                        location: { lat: 15.5975, lng: 32.5325 },
                        type: "university"
                    }
                ],
                markets: [
                    {
                        id: "market_omdurman",
                        name: "سوق أم درمان",
                        location: { lat: 15.6532, lng: 32.4789 },
                        type: "market"
                    }
                ]
            },
            driverActivity: {},
            customerActivity: {},
            callHistory: [],
            tripHistory: [],
            notifications: {
                unread: 0,
                lastNotification: null,
                list: []
            },
            supportTickets: {
                open: 0,
                inProgress: 0,
                resolved: 0,
                lastTicket: null
            },
            promotions: {
                active: [
                    {
                        code: "WELCOME1000",
                        name: "ترحيب 1000",
                        description: "خصم ترحيبي للمستخدمين الجدد",
                        discount: 1000,
                        type: "fixed",
                        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                        usageCount: 0
                    }
                ],
                expired: []
            },
            systemAlerts: [],
            performanceMetrics: {
                responseTimes: {
                    tripRequest: 0,
                    driverSearch: 0,
                    callResponse: 0
                },
                successRates: {
                    tripCompletion: 0,
                    callAnswer: 0,
                    payment: 0
                },
                uptime: 100
            },
            backup: {
                lastBackup: null,
                backupInterval: 86400000,
                autoBackup: true,
                nextBackup: new Date(Date.now() + 86400000).toISOString()
            },
            adminStats: {
                totalUsers: 0,
                totalDrivers: 0,
                totalTrips: 0,
                totalRevenue: 0,
                systemUptime: "0 days"
            }
        };
    }

    async loadInitialData() {
        console.log('📥 Loading initial data...');
        
        try {
            // تحميل بيانات المدن من Supabase
            const { data: cities, error: citiesError } = await supabaseClient
                .from('cities')
                .select('*')
                .eq('is_active', true);
            
            if (!citiesError && cities) {
                console.log(`✅ Loaded ${cities.length} cities`);
            }
            
            // تحميل بيانات السائقين المتصلين
            const { data: drivers, error: driversError } = await supabaseClient
                .from('drivers')
                .select('id, status, current_location')
                .eq('status', 'online')
                .eq('is_active', true);
            
            if (!driversError && drivers) {
                console.log(`✅ Loaded ${drivers.length} online drivers`);
                
                // تحديث JSONBin
                await this.updateActiveDrivers(drivers);
            }
            
            console.log('✅ Initial data loaded successfully');
            
        } catch (error) {
            console.error('❌ Error loading initial data:', error);
        }
    }

    async updateActiveDrivers(drivers) {
        if (!this.jsonBinReady) return;
        
        try {
            const binData = await this.getJSONBinData();
            if (!binData) return;
            
            binData.activeDrivers = drivers.map(driver => ({
                id: driver.id,
                status: driver.status,
                location: driver.current_location,
                lastUpdate: new Date().toISOString()
            }));
            
            binData.driverStats.totalOnline = drivers.length;
            binData.driverStats.lastUpdate = new Date().toISOString();
            
            await this.updateJSONBinData(binData);
            
        } catch (error) {
            console.error('Error updating active drivers:', error);
        }
    }

    async getJSONBinData() {
        if (this.jsonBinId === 'local') {
            const data = localStorage.getItem('travel_sudan_data');
            return data ? JSON.parse(data) : null;
        }
        
        try {
            const response = await fetch(`https://api.jsonbin.io/v3/b/${this.jsonBinId}/latest`, {
                headers: {
                    'X-Master-Key': JSONBIN_API_KEY
                }
            });
            
            const result = await response.json();
            return result.record;
            
        } catch (error) {
            console.error('Error getting JSONBin data:', error);
            return null;
        }
    }

    async updateJSONBinData(data) {
        if (this.jsonBinId === 'local') {
            localStorage.setItem('travel_sudan_data', JSON.stringify(data));
            return { success: true };
        }
        
        try {
            const response = await fetch(`https://api.jsonbin.io/v3/b/${this.jsonBinId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': JSONBIN_API_KEY,
                    'X-Bin-Versioning': false
                },
                body: JSON.stringify(data)
            });
            
            return await response.json();
            
        } catch (error) {
            console.error('Error updating JSONBin:', error);
            return { success: false, error: error.message };
        }
    }

    async startServices() {
        console.log('⚙️ Starting system services...');
        
        // 1. خدمة تحديث الموقع
        this.startLocationService();
        
        // 2. خدمة المزامنة مع Supabase
        this.startSyncService();
        
        // 3. خدمة مراقبة النظام
        this.startMonitoringService();
        
        // 4. خدمة النسخ الاحتياطي
        this.startBackupService();
        
        console.log('✅ All services started successfully');
    }

    startLocationService() {
        console.log('📍 Starting location service...');
        
        // هذا سيعمل عند تسجيل دخول المستخدم
        // سيتم تفعيله من صفحات المستخدمين
    }

    startSyncService() {
        console.log('🔄 Starting sync service...');
        
        // مزامنة البيانات كل 30 ثانية
        setInterval(async () => {
            if (!this.supabaseReady || !this.jsonBinReady) return;
            
            try {
                await this.syncData();
            } catch (error) {
                console.error('Sync error:', error);
            }
        }, 30000);
    }

    async syncData() {
        // مزامنة السائقين المتصلين
        const { data: drivers } = await supabaseClient
            .from('drivers')
            .select('id, status, current_location, last_location_update')
            .eq('status', 'online')
            .eq('is_active', true);
        
        if (drivers) {
            await this.updateActiveDrivers(drivers);
        }
        
        // مزامنة الرحلات النشطة
        const { data: activeTrips } = await supabaseClient
            .from('trips')
            .select('id, status, customer_id, driver_id, pickup_address')
            .in('status', ['accepted', 'ongoing', 'arriving']);
        
        if (activeTrips) {
            const binData = await this.getJSONBinData();
            if (binData) {
                binData.ongoingTrips = activeTrips.reduce((acc, trip) => {
                    acc[trip.id] = {
                        status: trip.status,
                        customerId: trip.customer_id,
                        driverId: trip.driver_id,
                        pickup: trip.pickup_address
                    };
                    return acc;
                }, {});
                
                binData.tripStats.activeNow = activeTrips.length;
                await this.updateJSONBinData(binData);
            }
        }
    }

    startMonitoringService() {
        console.log('👁️ Starting monitoring service...');
        
        // مراقبة أداء النظام
        setInterval(async () => {
            const binData = await this.getJSONBinData();
            if (!binData) return;
            
            // تسجيل وقت الاستجابة
            const responseTime = Date.now();
            binData.performanceMetrics.lastResponseTime = responseTime;
            binData.system.lastUpdated = new Date().toISOString();
            
            await this.updateJSONBinData(binData);
            
        }, 60000); // كل دقيقة
    }

    startBackupService() {
        console.log('💾 Starting backup service...');
        
        // نسخ احتياطي كل 24 ساعة
        setInterval(async () => {
            const binData = await this.getJSONBinData();
            if (!binData) return;
            
            // حفظ نسخة احتياطية في localStorage
            const backup = {
                timestamp: new Date().toISOString(),
                data: binData
            };
            
            localStorage.setItem(`travel_backup_${Date.now()}`, JSON.stringify(backup));
            
            // تحديث وقت النسخ الاحتياطي الأخير
            binData.backup.lastBackup = new Date().toISOString();
            binData.backup.nextBackup = new Date(Date.now() + 86400000).toISOString();
            
            await this.updateJSONBinData(binData);
            
            console.log('✅ Backup completed');
            
        }, 86400000); // 24 ساعة
    }

    // دالة للمساعدة في الحصول على إعدادات النظام
    async getSystemSetting(key) {
        const binData = await this.getJSONBinData();
        if (!binData) return null;
        
        const keys = key.split('.');
        let value = binData;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return null;
            }
        }
        
        return value;
    }

    // دالة لتحديث إعدادات النظام
    async updateSystemSetting(key, value) {
        const binData = await this.getJSONBinData();
        if (!binData) return false;
        
        const keys = key.split('.');
        let obj = binData;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!obj[keys[i]] || typeof obj[keys[i]] !== 'object') {
                obj[keys[i]] = {};
            }
            obj = obj[keys[i]];
        }
        
        obj[keys[keys.length - 1]] = value;
        binData.system.lastUpdated = new Date().toISOString();
        
        const result = await this.updateJSONBinData(binData);
        return result.success;
    }
}

// إنشاء وتصدير نسخة واحدة من النظام
const travelSystem = new TravelSudanSystem();

// تصدير الدوال الرئيسية
export async function initializeSystem() {
    return await travelSystem.initialize();
}

export async function getSystemData() {
    return await travelSystem.getJSONBinData();
}

export async function updateSystemData(data) {
    return await travelSystem.updateJSONBinData(data);
}

export async function getSetting(key) {
    return await travelSystem.getSystemSetting(key);
}

export async function updateSetting(key, value) {
    return await travelSystem.updateSystemSetting(key, value);
}

export function isSystemReady() {
    return travelSystem.initialized;
}

// تهيئة النظام تلقائياً عند تحميل الصفحة
if (typeof window !== 'undefined') {
    window.addEventListener('load', async () => {
        console.log('🌍 Travel Sudan System Loading...');
        
        // انتظر قليلاً قبل التهيئة
        setTimeout(async () => {
            await travelSystem.initialize();
        }, 1000);
    });
}