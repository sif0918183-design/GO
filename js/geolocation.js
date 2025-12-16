// js/geolocation.js
class GeolocationService {
    constructor() {
        this.userLocation = null;
        this.watchId = null;
        this.locationAccuracy = 50; // بالمتر
    }

    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('المتصفح لا يدعم تحديد الموقع'));
                return;
            }

            const options = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: position.timestamp
                    };
                    resolve(this.userLocation);
                },
                (error) => {
                    console.error('Error getting location:', error);
                    reject(this.getLocationError(error));
                },
                options
            );
        });
    }

    startTracking(callback) {
        if (!navigator.geolocation) return null;

        const options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        };

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                this.userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp
                };
                if (callback) callback(this.userLocation);
            },
            (error) => {
                console.error('Error watching location:', error);
            },
            options
        );

        return this.watchId;
    }

    stopTracking() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // نصف قطر الأرض بالكيلومتر
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c; // المسافة بالكيلومتر
        return distance;
    }

    toRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    getLocationError(error) {
        switch(error.code) {
            case error.PERMISSION_DENIED:
                return "تم رفض إذن الموقع";
            case error.POSITION_UNAVAILABLE:
                return "معلومات الموقع غير متاحة";
            case error.TIMEOUT:
                return "انتهت مهلة طلب الموقع";
            default:
                return "حدث خطأ غير معروف";
        }
    }
}

const geolocation = new GeolocationService();