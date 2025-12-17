// js/initialize-jsonbin.js

async function initializeJSONBin() {
    // التأكد من وجود المفتاح
    const apiKey = window.JSONBIN_API_KEY;
    if (!apiKey) {
        console.error("❌ JSONBIN_API_KEY is missing");
        return 'local';
    }

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
        driverStats: { totalOnline: 0, totalOffline: 0, totalBusy: 0, totalAvailable: 0 },
        tripStats: { totalToday: 0, completedToday: 0, cancelledToday: 0, revenueToday: 0, activeNow: 0 },
        systemSettings: {
            searchRadiusKm: 20,
            minimumBalance: 3000,
            rideFare: { standard: 3000, comfort: 4500, van: 6000 },
            platformFeePercentage: 15,
            callTimeoutSeconds: 30
        },
        cities: {
            "الخرطوم": { center: { lat: 15.5007, lng: 32.5599 }, radius: 50, active: true }
        }
    };

    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': apiKey,
                'X-Bin-Name': 'travel-sudan-live-data',
                'X-Bin-Private': 'false'
            },
            body: JSON.stringify(initialData)
        });

        const result = await response.json();
        
        if (result.metadata && result.metadata.id) {
            console.log('✅ JSONBin initialized with ID:', result.metadata.id);
            localStorage.setItem('jsonbin_id', result.metadata.id);
            return result.metadata.id;
        }
        throw new Error('No metadata ID');
        
    } catch (error) {
        console.error('❌ Error initializing JSONBin:', error);
        localStorage.setItem('travel_sudan_data', JSON.stringify(initialData));
        return 'local';
    }
}

// دالة تحميل البيانات
window.loadJSONBinData = async function() {
    const binId = localStorage.getItem('jsonbin_id') || window.JSONBIN_BIN_ID;
    
    if (!binId || binId === 'local') {
        const localData = localStorage.getItem('travel_sudan_data');
        return localData ? JSON.parse(localData) : null;
    }

    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
            headers: { 'X-Master-Key': window.JSONBIN_API_KEY }
        });
        const result = await response.json();
        return result.record;
    } catch (error) {
        console.error('Error loading JSONBin:', error);
        return JSON.parse(localStorage.getItem('travel_sudan_data'));
    }
};

// دالة التحديث
window.updateJSONBin = async function(data) {
    const binId = localStorage.getItem('jsonbin_id') || window.JSONBIN_BIN_ID;
    
    if (!binId || binId === 'local') {
        localStorage.setItem('travel_sudan_data', JSON.stringify(data));
        return { success: true };
    }

    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': window.JSONBIN_API_KEY,
                'X-Bin-Versioning': 'false'
            },
            body: JSON.stringify(data)
        });
        return await response.json();
    } catch (error) {
        console.error('Update failed:', error);
        localStorage.setItem('travel_sudan_data', JSON.stringify(data));
    }
};

// دالة المزامنة مع Supabase
window.syncWithSupabase = async function() {
    try {
        if (!window.supabaseClient) return;

        const { data: activeDrivers, error } = await window.supabaseClient
            .from('drivers')
            .select('id, status')
            .eq('status', 'online');

        if (error) throw error;

        const binData = await window.loadJSONBinData();
        if (binData) {
            binData.activeDrivers = activeDrivers || [];
            binData.system.lastUpdated = new Date().toISOString();
            await window.updateJSONBin(binData);
            console.log('✅ Synced with Supabase');
        }
    } catch (error) {
        console.error('❌ Sync Error:', error);
    }
};
