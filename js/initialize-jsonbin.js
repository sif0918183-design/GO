// js/initialize-jsonbin.js
async function initializeJSONBin() {
    const initialData = {
        system: {
            name: "ترحال السودان",
            version: "1.0.0",
            lastUpdated: new Date().toISOString(),
            status: "active"
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
            totalAvailable: 0
        },
        tripStats: {
            totalToday: 0,
            completedToday: 0,
            cancelledToday: 0,
            revenueToday: 0,
            activeNow: 0
        },
        callQueue: [],
        locationUpdates: {},
        systemSettings: {
            searchRadiusKm: 20,
            minimumBalance: 3000,
            rideFare: {
                standard: 3000,
                comfort: 4500,
                van: 6000
            },
            platformFeePercentage: 15,
            callTimeoutSeconds: 30,
            driverInactivityTimeout: 300,
            locationUpdateInterval: 30,
            maxDriversPerRequest: 10
        },
        cities: {
            "الخرطوم": {
                center: {
                    lat: 15.5007,
                    lng: 32.5599
                },
                radius: 50,
                active: true
            },
            "أم درمان": {
                center: {
                    lat: 15.6445,
                    lng: 32.4818
                },
                radius: 30,
                active: true
            },
            "بحري": {
                center: {
                    lat: 15.6333,
                    lng: 32.5528
                },
                radius: 25,
                active: true
            }
        },
        landmarks: {
            airports: [
                {
                    id: "airport_krt",
                    name: "مطار الخرطوم الدولي",
                    location: {
                        lat: 15.5896,
                        lng: 32.5532
                    }
                }
            ],
            hospitals: [
                {
                    id: "hospital_medical",
                    name: "مستشفى السلاح الطبي",
                    location: {
                        lat: 15.5881,
                        lng: 32.5412
                    }
                }
            ],
            universities: [
                {
                    id: "university_khartoum",
                    name: "جامعة الخرطوم",
                    location: {
                        lat: 15.5975,
                        lng: 32.5325
                    }
                }
            ],
            markets: [
                {
                    id: "market_omdurman",
                    name: "سوق أم درمان",
                    location: {
                        lat: 15.6532,
                        lng: 32.4789
                    }
                }
            ]
        },
        driverActivity: {},
        customerActivity: {},
        callHistory: [],
        tripHistory: [],
        notifications: {
            unread: 0,
            lastNotification: null
        },
        supportTickets: {
            open: 0,
            inProgress: 0,
            resolved: 0
        },
        promotions: {
            active: [
                {
                    code: "WELCOME1000",
                    name: "ترحيب 1000",
                    description: "خصم ترحيبي للمستخدمين الجدد",
                    discount: 1000,
                    type: "fixed",
                    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
                }
            ]
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
            }
        },
        backup: {
            lastBackup: null,
            backupInterval: 86400000,
            autoBackup: true
        }
    };

    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY,
                'X-Bin-Name': 'travel-sudan-live-data',
                'X-Bin-Private': 'false'
            },
            body: JSON.stringify(initialData)
        });

        const result = await response.json();
        
        if (result.metadata && result.metadata.id) {
            console.log('✅ JSONBin initialized successfully with ID:', result.metadata.id);
            localStorage.setItem('jsonbin_id', result.metadata.id);
            return result.metadata.id;
        } else {
            throw new Error('Failed to get bin ID from response');
        }
        
    } catch (error) {
        console.error('❌ Error initializing JSONBin:', error);
        
        // استخدام تخزين محلي كبديل
        console.log('⚠️ Using localStorage as fallback');
        localStorage.setItem('travel_sudan_data', JSON.stringify(initialData));
        return 'local';
    }
}

// دالة لتحميل البيانات من JSONBin
async function loadJSONBinData() {
    const binId = localStorage.getItem('jsonbin_id') || JSONBIN_BIN_ID;
    
    if (binId === 'local') {
        // استخدام البيانات من localStorage
        const localData = localStorage.getItem('travel_sudan_data');
        return localData ? JSON.parse(localData) : null;
    }

    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
            headers: {
                'X-Master-Key': JSONBIN_API_KEY
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result.record;
        
    } catch (error) {
        console.error('Error loading JSONBin data:', error);
        
        // محاولة استخدام localStorage كبديل
        const localData = localStorage.getItem('travel_sudan_data');
        if (localData) {
            console.log('Using fallback data from localStorage');
            return JSON.parse(localData);
        }
        
        return null;
    }
}

// دالة لتحديث البيانات في JSONBin
async function updateJSONBin(data) {
    const binId = localStorage.getItem('jsonbin_id') || JSONBIN_BIN_ID;
    
    if (binId === 'local') {
        // تحديث البيانات في localStorage
        localStorage.setItem('travel_sudan_data', JSON.stringify(data));
        return { success: true, metadata: { id: 'local' } };
    }

    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY,
                'X-Bin-Versioning': 'false'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (result.metadata) {
            // تحديث وقت التحديث الأخير
            data.system.lastUpdated = new Date().toISOString();
        }
        
        return result;
        
    } catch (error) {
        console.error('Error updating JSONBin:', error);
        
        // محاولة التحديث في localStorage
        try {
            localStorage.setItem('travel_sudan_data', JSON.stringify(data));
            return { success: true, metadata: { id: 'local' } };
        } catch (localError) {
            console.error('Error updating localStorage:', localError);
            return { success: false, error: localError.message };
        }
    }
}

// دالة للمزامنة مع Supabase
async function syncWithSupabase() {
    try {
        // الحصول على بيانات السائقين المتصلين من Supabase
        const { data: activeDrivers, error: driversError } = await supabaseClient
            .from('drivers')
            .select('id, status, current_location, last_location_update')
            .eq('status', 'online')
            .eq('is_active', true)
            .gte('balance', 3000);

        if (driversError) throw driversError;

        // تحديث JSONBin
        const binData = await loadJSONBinData();
        if (!binData) return;

        binData.activeDrivers = activeDrivers || [];
        binData.driverStats.totalOnline = activeDrivers?.length || 0;
        binData.system.lastUpdated = new Date().toISOString();

        await updateJSONBin(binData);
        
        console.log('✅ Synced with Supabase successfully');
        
    } catch (error) {
        console.error('❌ Error syncing with Supabase:', error);
    }
}

// تهيئة النظام عند التحميل
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing Travel Sudan System...');
    
    // التحقق من وجود JSONBin ID
    let binId = localStorage.getItem('jsonbin_id');
    
    if (!binId) {
        console.log('🆕 No JSONBin found, initializing new one...');
        binId = await initializeJSONBin();
    }
    
    // تحميل البيانات
    const data = await loadJSONBinData();
    
    if (data) {
        console.log('📊 System data loaded successfully');
        
        // تحديث واجهة المستخدم بالإحصائيات
        updateDashboardStats(data);
        
        // بدء المزامنة الدورية مع Supabase
        setInterval(syncWithSupabase, 30000); // كل 30 ثانية
        
        // بدء تحديث البيانات الحية
        startLiveUpdates();
    } else {
        console.error('❌ Failed to load system data');
    }
});

// دالة لتحديث إحصائيات لوحة التحكم
function updateDashboardStats(data) {
    // تحديث إحصائيات السائقين
    document.getElementById('totalOnlineDrivers')?.textContent = 
        data.driverStats.totalOnline || 0;
    document.getElementById('totalAvailableDrivers')?.textContent = 
        data.driverStats.totalAvailable || 0;
    
    // تحديث إحصائيات الرحلات
    document.getElementById('activeTrips')?.textContent = 
        data.tripStats.activeNow || 0;
    document.getElementById('tripsToday')?.textContent = 
        data.tripStats.totalToday || 0;
    document.getElementById('revenueToday')?.textContent = 
        (data.tripStats.revenueToday || 0).toLocaleString() + ' SDG';
    
    // تحديث آخر تحديث
    document.getElementById('lastUpdated')?.textContent = 
        new Date(data.system.lastUpdated).toLocaleString('ar-SA');
}

// دالة لتحديث البيانات الحية
function startLiveUpdates() {
    // تحديث الموقع الحي للمستخدمين
    setInterval(async () => {
        const session = localStorage.getItem('travel_session');
        if (!session) return;
        
        const { user, type } = JSON.parse(session);
        
        if (type === 'driver' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const location = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: Date.now()
                };
                
                // تحديث JSONBin
                const binData = await loadJSONBinData();
                if (!binData) return;
                
                binData.driverLocations[user.id] = location;
                binData.system.lastUpdated = new Date().toISOString();
                
                await updateJSONBin(binData);
            });
        }
    }, 30000); // كل 30 ثانية
}