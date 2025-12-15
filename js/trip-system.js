// js/trip-system.js
class TripSystem {
    constructor() {
        this.currentTrip = null;
        this.tripChannel = null;
        this.initializeTripSystem();
    }

    async initializeTripSystem() {
        // Subscribe to trip updates
        this.tripChannel = supabaseClient
            .channel('trip-updates')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'trips' },
                this.handleTripUpdate.bind(this)
            )
            .subscribe();
    }

    async requestTrip(customerId, pickupLocation) {
        try {
            // 1. Find nearby drivers
            const nearbyDrivers = await this.findNearbyDrivers(pickupLocation);
            
            if (nearbyDrivers.length === 0) {
                return { success: false, error: 'لا يوجد سائقين متاحين في منطقتك' };
            }

            // 2. Create trip request
            const { data: trip, error } = await supabaseClient
                .from('trips')
                .insert({
                    customer_id: customerId,
                    pickup_location: `POINT(${pickupLocation.lng} ${pickupLocation.lat})`,
                    status: 'pending'
                })
                .select()
                .single();

            if (error) throw error;

            // 3. Notify drivers via JSONBin (real-time)
            await this.notifyDrivers(trip.id, nearbyDrivers, pickupLocation);

            this.currentTrip = trip;
            return { success: true, trip: trip };

        } catch (error) {
            console.error('Error requesting trip:', error);
            return { success: false, error: error.message };
        }
    }

    async findNearbyDrivers(location, radiusKm = 20) {
        try {
            // Get active drivers from JSONBin
            const binData = await getJSONBin();
            const activeDrivers = binData?.record?.activeDrivers || [];
            
            // For demo, return all active drivers
            // In production, implement geospatial query
            const driverIds = activeDrivers.map(d => d.id);
            
            // Get driver details from Supabase
            const { data: drivers, error } = await supabaseClient
                .from('drivers')
                .select('*, users(full_name, phone)')
                .in('id', driverIds)
                .gte('balance', 3000)
                .eq('status', 'online')
                .eq('is_active', true);

            if (error) throw error;

            return drivers || [];
        } catch (error) {
            console.error('Error finding nearby drivers:', error);
            return [];
        }
    }

    async notifyDrivers(tripId, drivers, location) {
        // Store trip request in JSONBin for real-time access
        const binData = await getJSONBin();
        const tripRequests = binData?.record?.tripRequests || [];
        
        tripRequests.push({
            tripId: tripId,
            location: location,
            drivers: drivers.map(d => d.id),
            createdAt: Date.now()
        });
        
        await updateJSONBin({
            ...binData?.record,
            tripRequests: tripRequests
        });
    }

    async acceptTrip(driverId, tripId) {
        try {
            // Check driver balance
            const { data: driver, error: driverError } = await supabaseClient
                .from('drivers')
                .select('balance')
                .eq('id', driverId)
                .single();

            if (driverError) throw driverError;

            if (driver.balance < 3000) {
                return { 
                    success: false, 
                    error: 'رصيدك غير كافي. الرصيد المطلوب: 3,000 SDG' 
                };
            }

            // Update trip with driver
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

            // Remove from JSONBin trip requests
            await this.removeTripRequest(tripId);

            return { success: true, trip: trip };

        } catch (error) {
            console.error('Error accepting trip:', error);
            return { success: false, error: error.message };
        }
    }

    async completeTrip(tripId, distanceKm, fare = 3000) {
        try {
            const { data: trip, error } = await supabaseClient
                .from('trips')
                .update({
                    status: 'completed',
                    completed_at: new Date(),
                    distance_km: distanceKm,
                    fare: fare
                })
                .eq('id', tripId)
                .select('*, drivers(balance, id)')
                .single();

            if (error) throw error;

            // Deduct fare from driver's balance
            const newBalance = trip.drivers.balance - fare;
            
            await supabaseClient
                .from('drivers')
                .update({ balance: newBalance })
                .eq('id', trip.driver_id);

            // Record transaction
            await supabaseClient
                .from('transactions')
                .insert({
                    driver_id: trip.driver_id,
                    amount: -fare,
                    transaction_type: 'ride_fee',
                    description: `رسوم رحلة #${tripId.slice(0, 8)}`,
                    balance_before: trip.drivers.balance,
                    balance_after: newBalance
                });

            return { success: true, trip: trip };

        } catch (error) {
            console.error('Error completing trip:', error);
            return { success: false, error: error.message };
        }
    }

    handleTripUpdate(payload) {
        // Handle real-time trip updates
        const trip = payload.new;
        
        switch (trip.status) {
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
        // Notify customer via WebSocket or polling
        console.log('Trip accepted:', trip);
        // Update UI
    }
}

const tripSystem = new TripSystem();