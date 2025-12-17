// js/enhanced-trip-system.js - نظام الرحلات المتقدم (تم تصحيح مشكلة النطاق)

class EnhancedTripSystem {
    constructor() {
        this.activeTrip = null;
        this.drivers = [];
        this.locationUpdateInterval = null;
        this.callQueue = [];
        this.callInProgress = false;
        
        // التحقق من أن جميع التبعيات الأساسية مُعرّفة في النطاق العام
        if (typeof window.supabaseClient === 'undefined' || 
            typeof window.geolocation === 'undefined' || 
            typeof window.getJSONBin === 'undefined' || 
            typeof window.updateJSONBin === 'undefined' || 
            typeof window.callSystem === 'undefined') {
            
            console.error('❌ فشل بدء نظام الرحلات: هناك تبعيات (مثل supabaseClient أو geolocation) غير مُعرّفة في النطاق العام (window). يرجى التحقق من ترتيب تحميل الملفات.');
            return; 
        }

        this.initializeSystem();
    }

    async initializeSystem() {
        // بدء تتبع الموقع للمستخدم الحالي
        await this.startLocationTracking();
        
        // الاستماع لطلبات الرحلات الجديدة
        this.setupTripListeners();
        
        // الاستماع للمكالمات
        this.setupCallListeners();
    }

    async startLocationTracking() {
        try {
            // استخدام window.geolocation
            const location = await window.geolocation.getCurrentLocation();
            console.log('Current location:', location);
            
            // تحديث الموقع كل 30 ثانية
            window.geolocation.startTracking((newLocation) => {
                this.updateUserLocation(newLocation);
            });
            
        } catch (error) {
            console.error('Error starting location tracking:', error);
            // استخدام موقع افتراضي (الخرطوم)
            this.updateUserLocation({
                lat: 15.5007,
                lng: 32.5599,
                accuracy: 1000
            });
        }
    }

    async updateUserLocation(location) {
        try {
            // تحديث موقع المستخدم في Supabase و JSONBin
            const session = localStorage.getItem('travel_session');
            if (!session) return;
            
            const { user, type } = JSON.parse(session);
            
            if (type === 'customer') {
                // استخدام window.getJSONBin و window.updateJSONBin
                const binData = await window.getJSONBin();
                const customerLocations = binData?.record?.customerLocations || {};
                
                customerLocations[user.id] = {
                    lat: location.lat,
                    lng: location.lng,
                    timestamp: Date.now(),
                    accuracy: location.accuracy
                };
                
                await window.updateJSONBin({
                    ...binData?.record,
                    customerLocations: customerLocations
                });
                
            } else if (type === 'driver') {
                // استخدام window.supabaseClient
                const { error } = await window.supabaseClient
                    .from('drivers')
                    .update({
                        current_location: `POINT(${location.lng} ${location.lat})`
                    })
                    .eq('id', user.id);
                
                if (error) throw error;
                
                // استخدام window.getJSONBin و window.updateJSONBin
                const binData = await window.getJSONBin();
                const driverLocations = binData?.record?.driverLocations || {};
                
                driverLocations[user.id] = {
                    lat: location.lat,
                    lng: location.lng,
                    timestamp: Date.now(),
                    accuracy: location.accuracy
                };
                
                await window.updateJSONBin({
                    ...binData?.record,
                    driverLocations: driverLocations
                });
            }
            
        } catch (error) {
            console.error('Error updating user location:', error);
        }
    }

    async requestTrip(pickupLocation, destination, carType = 'standard') {
        try {
            // ... (تحقق من تسجيل الدخول)
            const session = localStorage.getItem('travel_session');
            if (!session) {
                throw new Error('يجب تسجيل الدخول أولاً');
            }
            
            const { user } = JSON.parse(session);
            
            // البحث عن سائقين قريبين
            const nearbyDrivers = await this.findNearbyDrivers(pickupLocation);
            
            if (nearbyDrivers.length === 0) {
                return { 
                    success: false, 
                    error: 'لا يوجد سائقين متاحين في منطقتك' 
                };
            }
            
            // إنشاء رحلة (باستخدام window.supabaseClient)
            const { data: trip, error } = await window.supabaseClient
                .from('trips')
                .insert({
                    customer_id: user.id,
                    pickup_location: `POINT(${pickupLocation.lng} ${pickupLocation.lat})`,
                    dropoff_location: `POINT(${destination.lng} ${destination.lat})`,
                    status: 'pending',
                    car_type: carType,
                    requested_at: new Date()
                })
                .select()
                .single();
            
            if (error) throw error;
            
            // ... (بقية منطق المكالمات)
            
            this.activeTrip = trip;
            return { success: true, trip: trip, drivers: nearbyDrivers };
            
        } catch (error) {
            console.error('Error requesting trip:', error);
            return { success: false, error: error.message };
        }
    }

    async findNearbyDrivers(location, radiusKm = 20) {
        try {
            // استخدام window.getJSONBin
            const binData = await window.getJSONBin();
            const activeDrivers = binData?.record?.activeDrivers || [];
            const driverLocations = binData?.record?.driverLocations || {};
            
            // ... (فلترة السائقين)
            
            // استخدام window.supabaseClient
            const { data: drivers, error } = await window.supabaseClient
                .from('drivers')
                .select(`
                    *,
                    users (
                        full_name,
                        phone
                    )
                `)
                .in('id', onlineDriverIds)
                .gte('balance', 3000)
                .eq('is_active', true);
            
            if (error) throw error;
            
            // حساب المسافات باستخدام window.geolocation
            const driversWithDistance = drivers.map(driver => {
                const driverLoc = driverLocations[driver.id];
                let distance = 999; 
                
                if (driverLoc) {
                    distance = window.geolocation.calculateDistance(
                        location.lat, location.lng,
                        driverLoc.lat, driverLoc.lng
                    );
                }
                
                return {
                    ...driver,
                    distance: distance
                };
            });
            
            return driversWithDistance
                .filter(d => d.distance <= radiusKm)
                .sort((a, b) => a.distance - b.distance);
            
        } catch (error) {
            console.error('Error finding nearby drivers:', error);
            return [];
        }
    }

    async startCallingDrivers() {
        if (this.callInProgress || this.callQueue.length === 0) return;
        
        this.callInProgress = true;
        
        // الاتصال بكل سائق في قائمة الانتظار
        for (const call of this.callQueue) {
            if (call.status !== 'waiting') continue;
            
            call.status = 'calling';
            
            // بدء المكالمة مع السائق (باستخدام window.callSystem)
            const callStarted = await window.callSystem.startCall(call.driverId, call.tripId);
            
            if (callStarted) {
                // انتظار إجابة السائق (30 ثانية كحد أقصى)
                await this.waitForDriverResponse(call);
                
                // ... (منطق القبول والإلغاء)
                if (call.status === 'accepted') {
                    await this.assignTripToDriver(call.driverId, call.tripId);
                    break;
                }
            }
            
            // ... (انتظار)
        }
        
        this.callInProgress = false;
    }

    async waitForDriverResponse(call) {
        return new Promise((resolve) => {
            let checkCount = 0;
            const maxChecks = 30;
            
            const checkInterval = setInterval(async () => {
                checkCount++;
                
                // استخدام window.getJSONBin
                const binData = await window.getJSONBin();
                const activeCalls = binData?.record?.activeCalls || [];
                
                // ... (منطق التحقق من المكالمة)
                
            }, 1000);
        });
    }

    async assignTripToDriver(driverId, tripId) {
        try {
            // ... (منطق إلغاء المكالمات الأخرى)
            
            // تعيين السائق للرحلة (باستخدام window.supabaseClient)
            const { data: trip, error } = await window.supabaseClient
                .from('trips')
                .update({
                    driver_id: driverId,
                    status: 'accepted',
                    accepted_at: new Date()
                })
                .eq('id', tripId)
                .select()
                .single();
            
            if (error) throw error;
            
            // ... (إرسال إشعار وتحديث الواجهة)
            
            return { success: true, trip: trip };
            
        } catch (error) {
            console.error('Error assigning trip to driver:', error);
            return { success: false, error: error.message };
        }
    }

    setupTripListeners() {
        // الاستماع لتحديثات الرحلات (باستخدام window.supabaseClient)
        window.supabaseClient
            .channel('trip-updates')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'trips' },
                (payload) => this.handleTripUpdate(payload)
            )
            .subscribe();
        
        this.setupTripRequestListener();
    }

    // ... (بقية الدوال) ...

    async checkForNewTripRequests(driverId) {
        try {
            // استخدام window.supabaseClient
            const { data: driver, error } = await window.supabaseClient
                .from('drivers')
                .select('balance, status')
                .eq('id', driverId)
                .single();
            
            // استخدام window.getJSONBin
            const binData = await window.getJSONBin();
            const tripRequests = binData?.record?.tripRequests || [];
            const driverLocation = binData?.record?.driverLocations?.[driverId];
            
            // استخدام window.geolocation
            // ...
            
        } catch (error) {
            console.error('Error checking for trip requests:', error);
        }
    }

    async notifyDriverOfTripRequest(driverId, tripRequest) {
        // استخدام window.getJSONBin و window.updateJSONBin
        const binData = await window.getJSONBin();
        const tripRequests = binData?.record?.tripRequests || [];
        
        // ... (منطق التحديث)
        
        await window.updateJSONBin({
            ...binData?.record,
            tripRequests: tripRequests
        });
    }

    async checkIncomingCalls() {
        // استخدام window.getJSONBin
        const binData = await window.getJSONBin();
        const activeCalls = binData?.record?.activeCalls || [];
        
        // ... (منطق المكالمة)
        
        if (incomingCall && !window.callSystem.isCalling) { // استخدام window.callSystem
            this.showIncomingCall(incomingCall);
        }
    }

    showIncomingCall(call) {
        // إظهار واجهة المكالمة الواردة للسائق (باستخدام window.callSystem)
        window.callSystem.showCallInterface('مكالمة واردة', call.tripId);
    }
    
    // ... (بقية الدوال تبقى كما هي ما لم تستخدم أي متغيرات عالمية أخرى)
}

const enhancedTripSystem = new EnhancedTripSystem();
