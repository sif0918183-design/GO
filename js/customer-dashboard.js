// js/customer-dashboard.js
class CustomerDashboard {
    constructor() {
        this.currentUser = null;
        this.activeTrip = null;
        this.initializeDashboard();
    }

    async initializeDashboard() {
        // تحقق من تسجيل الدخول
        const session = localStorage.getItem('travel_session');
        if (!session) {
            window.location.href = 'login.html';
            return;
        }

        const { user } = JSON.parse(session);
        this.currentUser = user;
        
        // تحديث واجهة المستخدم
        this.updateUI();
        
        // تحميل تاريخ الرحلات
        await this.loadTripHistory();
        
        // الاستماع للتحديثات الحية
        this.setupRealTimeUpdates();
    }

    async loadTripHistory() {
        try {
            const { data: trips, error } = await supabaseClient
                .from('trips')
                .select(`
                    *,
                    drivers (
                        users (
                            full_name
                        ),
                        car_make,
                        car_model
                    )
                `)
                .eq('customer_id', this.currentUser.id)
                .order('requested_at', { ascending: false })
                .limit(10);

            if (error) throw error;

            this.renderTripHistory(trips || []);

        } catch (error) {
            console.error('Error loading trip history:', error);
        }
    }

    renderTripHistory(trips) {
        const tbody = document.getElementById('tripsHistory');
        const noHistory = document.getElementById('noHistoryMessage');

        if (!trips.length) {
            noHistory.style.display = 'block';
            return;
        }

        noHistory.style.display = 'none';
        
        tbody.innerHTML = trips.map(trip => `
            <tr>
                <td>${new Date(trip.requested_at).toLocaleDateString('ar-SA')}</td>
                <td>${trip.pickup_address || 'موقع الالتقاط'}</td>
                <td>${trip.dropoff_address || 'الوجهة'}</td>
                <td>${trip.drivers?.users?.full_name || '--'}</td>
                <td>${trip.fare ? trip.fare.toLocaleString() + ' SDG' : '--'}</td>
                <td>
                    ${trip.rating ? '⭐ '.repeat(Math.round(trip.rating)) : '--'}
                </td>
            </tr>
        `).join('');
    }

    setupRealTimeUpdates() {
        // الاستماع لتحديثات الرحلات
        supabaseClient
            .channel('customer-trips')
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'trips',
                    filter: `customer_id=eq.${this.currentUser.id}`
                },
                (payload) => this.handleTripUpdate(payload)
            )
            .subscribe();
    }

    handleTripUpdate(payload) {
        const trip = payload.new;
        
        if (trip.status === 'accepted' || trip.status === 'ongoing') {
            this.showActiveTrip(trip);
        } else if (trip.status === 'completed') {
            this.hideActiveTrip();
            this.loadTripHistory(); // تحديث التاريخ
        }
    }

    showActiveTrip(trip) {
        // إظهار قسم الرحلة النشطة
        document.getElementById('activeTripSection').style.display = 'block';
        
        // تحديث المعلومات
        // ... (تحديث واجهة المستخدم)
    }

    updateUI() {
        // تحديث اسم المستخدم
        document.getElementById('userName').textContent = this.currentUser.full_name;
        
        // تحديث الرصيد (من محفظة افتراضية)
        document.getElementById('userBalance').textContent = '25,000 SDG';
    }
}

// js/request-trip.js
class RequestTripSystem {
    constructor() {
        this.currentStep = 1;
        this.tripData = {};
        this.initializeSteps();
    }

    initializeSteps() {
        // تحديث الخطوات
        this.updateStepIndicator();
        
        // أحداث الأزرار
        document.getElementById('nextStep1')?.addEventListener('click', () => this.goToStep(2));
        document.getElementById('nextStep2')?.addEventListener('click', () => this.goToStep(3));
        document.getElementById('backStep2')?.addEventListener('click', () => this.goToStep(1));
        document.getElementById('backStep3')?.addEventListener('click', () => this.goToStep(2));
        
        // اختيار نوع السيارة
        document.querySelectorAll('.car-option').forEach(option => {
            option.addEventListener('click', (e) => this.selectCarType(e));
        });
        
        // تأكيد الرحلة
        document.getElementById('confirmTripBtn')?.addEventListener('click', () => this.confirmTrip());
        document.getElementById('agreeTerms')?.addEventListener('change', (e) => {
            document.getElementById('confirmTripBtn').disabled = !e.target.checked;
        });
    }

    goToStep(step) {
        this.currentStep = step;
        this.updateStepIndicator();
        
        // إخفاء جميع الخطوات
        document.querySelectorAll('.step-content').forEach(el => {
            el.classList.remove('active');
        });
        
        // إظهار الخطوة الحالية
        document.getElementById(`step${step}`).classList.add('active');
        
        // تحديث البيانات إذا كانت الخطوة 3
        if (step === 3) {
            this.updateSummary();
        }
    }

    updateStepIndicator() {
        document.querySelectorAll('.step').forEach((stepEl, index) => {
            if (index + 1 <= this.currentStep) {
                stepEl.classList.add('active');
            } else {
                stepEl.classList.remove('active');
            }
        });
    }

    selectCarType(event) {
        const option = event.currentTarget;
        const type = option.dataset.type;
        
        // إزالة النشاط من جميع الخيارات
        document.querySelectorAll('.car-option').forEach(el => {
            el.classList.remove('active');
        });
        
        // إضافة النشاط للخيار المحدد
        option.classList.add('active');
        
        // حفظ نوع السيارة
        this.tripData.carType = type;
        this.tripData.carPrice = this.getCarPrice(type);
    }

    getCarPrice(type) {
        const prices = {
            'standard': 3000,
            'comfort': 4500,
            'van': 6000
        };
        return prices[type] || 3000;
    }

    updateSummary() {
        // تحديث ملخص الرحلة
        document.getElementById('summaryCarType').textContent = 
            this.getCarTypeText(this.tripData.carType);
        document.getElementById('summaryPrice').textContent = 
            this.tripData.carPrice?.toLocaleString() + ' SDG';
    }

    getCarTypeText(type) {
        const types = {
            'standard': 'عادي',
            'comfort': 'مريح',
            'van': 'فان'
        };
        return types[type] || 'عادي';
    }

    async confirmTrip() {
        try {
            // التحقق من تسجيل الدخول
            const session = localStorage.getItem('travel_session');
            if (!session) {
                window.location.href = 'login.html';
                return;
            }

            const { user } = JSON.parse(session);
            
            // إظهار نافذة التحميل
            document.getElementById('requestingModal').style.display = 'flex';
            
            // إرسال طلب الرحلة
            const { data: trip, error } = await supabaseClient
                .from('trips')
                .insert({
                    customer_id: user.id,
                    pickup_location: this.tripData.pickupLocation,
                    dropoff_location: this.tripData.dropoffLocation,
                    car_type: this.tripData.carType,
                    fare: this.tripData.carPrice,
                    status: 'pending'
                })
                .select()
                .single();

            if (error) throw error;

            // الانتقال إلى لوحة التحكم
            setTimeout(() => {
                window.location.href = 'customer-dashboard.html';
            }, 3000);

        } catch (error) {
            console.error('Error requesting trip:', error);
            alert(`حدث خطأ: ${error.message}`);
            document.getElementById('requestingModal').style.display = 'none';
        }
    }
}