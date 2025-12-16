// js/enhanced-trip-system.js
class EnhancedTripSystem {
    constructor() {
        this.activeTrip = null;
        this.drivers = [];
        this.locationUpdateInterval = null;
        this.callQueue = [];
        this.callInProgress = false;
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
            const location = await geolocation.getCurrentLocation();
            console.log('Current location:', location);
            
            // تحديث الموقع كل 30 ثانية
            geolocation.startTracking((newLocation) => {
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
            // تحديث موقع المستخدم في Supabase
            const session = localStorage.getItem('travel_session');
            if (!session) return;
            
            const { user, type } = JSON.parse(session);
            
            if (type === 'customer') {
                // تحديث موقع الزبون في JSONBin للتتبع الحقيقي
                const binData = await getJSONBin();
                const customerLocations = binData?.record?.customerLocations || {};
                
                customerLocations[user.id] = {
                    lat: location.lat,
                    lng: location.lng,
                    timestamp: Date.now(),
                    accuracy: location.accuracy
                };
                
                await updateJSONBin({
                    ...binData?.record,
                    customerLocations: customerLocations
                });
                
            } else if (type === 'driver') {
                // تحديث موقع السائق في قاعدة البيانات
                const { error } = await supabaseClient
                    .from('drivers')
                    .update({
                        current_location: `POINT(${location.lng} ${location.lat})`
                    })
                    .eq('id', user.id);
                
                if (error) throw error;
                
                // تحديث في JSONBin للتتبع الحقيقي
                const binData = await getJSONBin();
                const driverLocations = binData?.record?.driverLocations || {};
                
                driverLocations[user.id] = {
                    lat: location.lat,
                    lng: location.lng,
                    timestamp: Date.now(),
                    accuracy: location.accuracy
                };
                
                await updateJSONBin({
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
            // التحقق من تسجيل الدخول
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
            
            // إنشاء رحلة
            const { data: trip, error } = await supabaseClient
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
            
            // إضافة الرحلات للمكالمات
            this.callQueue = nearbyDrivers.map(driver => ({
                driverId: driver.id,
                tripId: trip.id,
                driverName: driver.users?.full_name || `سائق ${driver.id.slice(0, 8)}`,
                distance: driver.distance,
                status: 'waiting'
            }));
            
            // بدء عملية الاتصال بالسائقين
            this.startCallingDrivers();
            
            this.activeTrip = trip;
            return { success: true, trip: trip, drivers: nearbyDrivers };
            
        } catch (error) {
            console.error('Error requesting trip:', error);
            return { success: false, error: error.message };
        }
    }

    async findNearbyDrivers(location, radiusKm = 20) {
        try {
            // الحصول على السائقين المتصلين من JSONBin
            const binData = await getJSONBin();
            const activeDrivers = binData?.record?.activeDrivers || [];
            const driverLocations = binData?.record?.driverLocations || {};
            
            // فلترة السائقين المتصلين فقط
            const onlineDriverIds = activeDrivers
                .filter(d => d.status === 'online')
                .map(d => d.id);
            
            if (onlineDriverIds.length === 0) return [];
            
            // الحصول على معلومات السائقين من Supabase
            const { data: drivers, error } = await supabaseClient
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
            
            // حساب المسافات
            const driversWithDistance = drivers.map(driver => {
                const driverLoc = driverLocations[driver.id];
                let distance = 999; // مسافة كبيرة افتراضية
                
                if (driverLoc) {
                    distance = geolocation.calculateDistance(
                        location.lat, location.lng,
                        driverLoc.lat, driverLoc.lng
                    );
                }
                
                return {
                    ...driver,
                    distance: distance
                };
            });
            
            // ترتيب حسب الأقرب
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
            
            // تحديث حالة المكالمة
            call.status = 'calling';
            
            // بدء المكالمة مع السائق
            const callStarted = await callSystem.startCall(call.driverId, call.tripId);
            
            if (callStarted) {
                // انتظار إجابة السائق (30 ثانية كحد أقصى)
                await this.waitForDriverResponse(call);
                
                // إذا تم قبول المكالمة، توقف عن الاتصال بالباقين
                if (call.status === 'accepted') {
                    await this.assignTripToDriver(call.driverId, call.tripId);
                    break;
                }
            }
            
            // الانتقال للسائق التالي بعد 2 ثانية
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        this.callInProgress = false;
    }

    async waitForDriverResponse(call) {
        return new Promise((resolve) => {
            let checkCount = 0;
            const maxChecks = 30; // 30 ثانية كحد أقصى
            
            const checkInterval = setInterval(async () => {
                checkCount++;
                
                // التحقق من حالة المكالمة
                const binData = await getJSONBin();
                const activeCalls = binData?.record?.activeCalls || [];
                
                const currentCall = activeCalls.find(c => 
                    c.driverId === call.driverId && c.tripId === call.tripId
                );
                
                if (currentCall?.status === 'answered') {
                    call.status = 'accepted';
                    clearInterval(checkInterval);
                    resolve(true);
                } else if (checkCount >= maxChecks) {
                    call.status = 'timeout';
                    clearInterval(checkInterval);
                    resolve(false);
                }
                
            }, 1000);
        });
    }

    async assignTripToDriver(driverId, tripId) {
        try {
            // إلغاء جميع المكالمات الأخرى
            this.callQueue.forEach(call => {
                if (call.driverId !== driverId && call.status === 'calling') {
                    call.status = 'cancelled';
                }
            });
            
            // تعيين السائق للرحلة
            const { data: trip, error } = await supabaseClient
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
            
            // إرسال إشعار للمستخدم
            this.notifyCustomerOfDriverAssignment(driverId, tripId);
            
            // تحديث واجهة المستخدم
            this.updateTripInterface(trip);
            
            return { success: true, trip: trip };
            
        } catch (error) {
            console.error('Error assigning trip to driver:', error);
            return { success: false, error: error.message };
        }
    }

    setupTripListeners() {
        // الاستماع لتحديثات الرحلات
        supabaseClient
            .channel('trip-updates')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'trips' },
                (payload) => this.handleTripUpdate(payload)
            )
            .subscribe();
        
        // الاستماع لطلبات الرحلات الجديدة (للسائقين)
        this.setupTripRequestListener();
    }

    setupTripRequestListener() {
        // التحقق من طلبات الرحلات الجديدة كل 5 ثوانٍ
        setInterval(async () => {
            const session = localStorage.getItem('travel_session');
            if (!session) return;
            
            const { user, type } = JSON.parse(session);
            
            if (type === 'driver') {
                await this.checkForNewTripRequests(user.id);
            }
        }, 5000);
    }

    async checkForNewTripRequests(driverId) {
        try {
            // التحقق من رصيد السائق
            const { data: driver, error } = await supabaseClient
                .from('drivers')
                .select('balance, status')
                .eq('id', driverId)
                .single();
            
            if (error || driver.balance < 3000 || driver.status !== 'online') {
                return;
            }
            
            // البحث عن رحلات قريبة
            const binData = await getJSONBin();
            const tripRequests = binData?.record?.tripRequests || [];
            const driverLocation = binData?.record?.driverLocations?.[driverId];
            
            if (!driverLocation) return;
            
            // البحث عن رحلات في نطاق 20 كم
            const nearbyTrips = tripRequests.filter(request => {
                const distance = geolocation.calculateDistance(
                    driverLocation.lat, driverLocation.lng,
                    request.location.lat, request.location.lng
                );
                return distance <= 20 && 
                       !request.drivers.includes(driverId) &&
                       request.status === 'pending';
            });
            
            // إرسال إشعار للرحلات القريبة
            for (const trip of nearbyTrips) {
                await this.notifyDriverOfTripRequest(driverId, trip);
            }
            
        } catch (error) {
            console.error('Error checking for trip requests:', error);
        }
    }

    async notifyDriverOfTripRequest(driverId, tripRequest) {
        // تحديث JSONBin لإضافة السائق لقائمة المكالمات
        const binData = await getJSONBin();
        const tripRequests = binData?.record?.tripRequests || [];
        
        const tripIndex = tripRequests.findIndex(t => t.tripId === tripRequest.tripId);
        if (tripIndex !== -1 && !tripRequests[tripIndex].drivers.includes(driverId)) {
            tripRequests[tripIndex].drivers.push(driverId);
            
            await updateJSONBin({
                ...binData?.record,
                tripRequests: tripRequests
            });
        }
    }

    setupCallListeners() {
        // الاستماع للمكالمات الواردة
        setInterval(async () => {
            await this.checkIncomingCalls();
        }, 3000);
    }

    async checkIncomingCalls() {
        const session = localStorage.getItem('travel_session');
        if (!session) return;
        
        const { user, type } = JSON.parse(session);
        
        if (type === 'driver') {
            // التحقق من المكالمات الواردة للسائق
            const binData = await getJSONBin();
            const activeCalls = binData?.record?.activeCalls || [];
            
            const incomingCall = activeCalls.find(call => 
                call.driverId === user.id && 
                call.status === 'ringing'
            );
            
            if (incomingCall && !callSystem.isCalling) {
                // إظهار نافذة المكالمة للسائق
                this.showIncomingCall(incomingCall);
            }
        }
    }

    showIncomingCall(call) {
        // إظهار واجهة المكالمة الواردة للسائق
        callSystem.showCallInterface('مكالمة واردة', call.tripId);
    }

    handleTripUpdate(payload) {
        const trip = payload.new;
        
        // تحديث واجهة المستخدم بناءً على حالة الرحلة
        switch(trip.status) {
            case 'accepted':
                this.onTripAccepted(trip);
                break;
            case 'ongoing':
                this.onTripStarted(trip);
                break;
            case 'completed':
                this.onTripCompleted(trip);
                break;
            case 'cancelled':
                this.onTripCancelled(trip);
                break;
        }
    }

    onTripAccepted(trip) {
        // تحديث واجهة الزبون والسائق
        if (this.activeTrip?.id === trip.id) {
            this.updateTripInterface(trip);
        }
        
        // إرسال إشعارات
        this.sendNotification('تم قبول رحلتك', 'سائق في الطريق إليك');
    }

    updateTripInterface(trip) {
        // تحديث واجهة المستخدم بناءً على حالة الرحلة
        const tripStatusElement = document.getElementById('tripStatus');
        if (tripStatusElement) {
            const statusText = {
                'pending': 'جاري البحث عن سائق',
                'accepted': 'سائق في الطريق',
                'ongoing': 'في الرحلة',
                'completed': 'مكتملة',
                'cancelled': 'ملغاة'
            };
            
            tripStatusElement.textContent = statusText[trip.status] || trip.status;
        }
    }

    sendNotification(title, message) {
        // إرسال إشعار للمستخدم
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body: message });
        }
    }
}

const enhancedTripSystem = new EnhancedTripSystem();