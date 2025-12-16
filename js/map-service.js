// js/map-service.js
class MapService {
    constructor() {
        this.map = null;
        this.userMarker = null;
        this.destinationMarker = null;
        this.routeLine = null;
        this.driversMarkers = {};
        this.mapInitialized = false;
    }

    initMap(elementId, center = [15.5007, 32.5599]) { // إحداثيات الخرطوم
        if (!elementId) {
            console.error('Map element ID is required');
            return null;
        }

        try {
            // إنشاء الخريطة
            this.map = L.map(elementId).setView(center, 13);
            
            // إضافة طبقة OpenStreetMap
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19
            }).addTo(this.map);

            // إضافة طبقة للعربية
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                subdomains: ['a', 'b', 'c']
            }).addTo(this.map);

            this.mapInitialized = true;
            console.log('Map initialized successfully');
            return this.map;

        } catch (error) {
            console.error('Error initializing map:', error);
            // Fallback: عرض خريطة بسيطة
            this.showFallbackMap(elementId);
            return null;
        }
    }

    showFallbackMap(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        element.innerHTML = `
            <div class="fallback-map">
                <div class="map-placeholder">
                    <div class="map-grid">
                        <div class="grid-line horizontal"></div>
                        <div class="grid-line vertical"></div>
                        <div class="user-marker">📍</div>
                        <div class="destination-marker">🏁</div>
                    </div>
                </div>
                <div class="map-controls">
                    <button class="btn-locate" id="locateMeBtn">📍 تحديد موقعي</button>
                </div>
            </div>
        `;
    }

    setUserLocation(lat, lng) {
        if (!this.mapInitialized) return;
        
        if (this.userMarker) {
            this.map.removeLayer(this.userMarker);
        }
        
        this.userMarker = L.marker([lat, lng], {
            icon: L.divIcon({
                className: 'user-marker-icon',
                html: '<div class="user-pulse-marker">📍</div>',
                iconSize: [40, 40],
                iconAnchor: [20, 40]
            })
        }).addTo(this.map);
        
        // توجيه الخريطة للموقع
        this.map.setView([lat, lng], 15);
        
        // إضافة دائرة توضيحية
        L.circle([lat, lng], {
            color: '#3498db',
            fillColor: '#3498db',
            fillOpacity: 0.1,
            radius: 100
        }).addTo(this.map);
    }

    setDestination(lat, lng, address = '') {
        if (!this.mapInitialized) return;
        
        if (this.destinationMarker) {
            this.map.removeLayer(this.destinationMarker);
        }
        
        this.destinationMarker = L.marker([lat, lng], {
            icon: L.divIcon({
                className: 'destination-marker-icon',
                html: '<div class="destination-marker">🏁</div>',
                iconSize: [40, 40],
                iconAnchor: [20, 40]
            })
        }).addTo(this.map);
        
        if (address) {
            this.destinationMarker.bindPopup(address).openPopup();
        }
        
        // رسم خط بين الموقع والوجهة
        if (this.userMarker) {
            this.drawRoute(this.userMarker.getLatLng(), [lat, lng]);
        }
    }

    drawRoute(start, end) {
        if (!this.mapInitialized) return;
        
        // إزالة الخط القديم إذا كان موجودًا
        if (this.routeLine) {
            this.map.removeLayer(this.routeLine);
        }
        
        // رسم خط مستقيم (في الإصدار الحقيقي، استخدم خدمة توجيه)
        this.routeLine = L.polyline([start, end], {
            color: '#f39c12',
            weight: 4,
            opacity: 0.7,
            dashArray: '10, 10'
        }).addTo(this.map);
        
        // إضافة مسافة تقريبية
        const distance = geolocation.calculateDistance(
            start.lat, start.lng,
            end.lat, end.lng
        );
        
        const midPoint = [
            (start.lat + end.lat) / 2,
            (start.lng + end.lng) / 2
        ];
        
        L.popup()
            .setLatLng(midPoint)
            .setContent(`المسافة: ${distance.toFixed(1)} كم`)
            .openOn(this.map);
    }

    addDriverMarker(driverId, lat, lng, driverName = '') {
        if (!this.mapInitialized) return;
        
        // إزالة العلامة القديمة إذا كانت موجودة
        if (this.driversMarkers[driverId]) {
            this.map.removeLayer(this.driversMarkers[driverId]);
        }
        
        // إنشاء علامة جديدة للسائق
        const driverMarker = L.marker([lat, lng], {
            icon: L.divIcon({
                className: 'driver-marker-icon',
                html: `<div class="driver-marker">🚗</div>`,
                iconSize: [35, 35],
                iconAnchor: [17, 35]
            }),
            zIndexOffset: 1000
        }).addTo(this.map);
        
        if (driverName) {
            driverMarker.bindPopup(`سائق: ${driverName}`);
        }
        
        this.driversMarkers[driverId] = driverMarker;
        return driverMarker;
    }

    removeDriverMarker(driverId) {
        if (this.driversMarkers[driverId]) {
            this.map.removeLayer(this.driversMarkers[driverId]);
            delete this.driversMarkers[driverId];
        }
    }

    clearAllDrivers() {
        Object.keys(this.driversMarkers).forEach(driverId => {
            this.removeDriverMarker(driverId);
        });
    }

    // البحث عن عنوان باستخدام Nominatim (OpenStreetMap)
    async searchLocation(query) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=sd&limit=5`
            );
            
            const data = await response.json();
            return data.map(result => ({
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon),
                display_name: result.display_name,
                type: result.type
            }));
            
        } catch (error) {
            console.error('Error searching location:', error);
            return [];
        }
    }

    // عكس الجيوكودينج (من إحداثيات إلى عنوان)
    async reverseGeocode(lat, lng) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            
            const data = await response.json();
            return {
                address: data.display_name,
                city: data.address?.city || data.address?.town || data.address?.village,
                country: data.address?.country
            };
            
        } catch (error) {
            console.error('Error reverse geocoding:', error);
            return null;
        }
    }
}

const mapService = new MapService();