// js/auth.js
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.initializeAuth();
    }

    async initializeAuth() {
        // Check for stored session
        const session = localStorage.getItem('travel_session');
        if (session) {
            const { user, type } = JSON.parse(session);
            this.currentUser = user;
            this.userType = type;
            
            // Redirect based on user type
            if (window.location.pathname.includes('login') || 
                window.location.pathname.includes('register')) {
                this.redirectToDashboard();
            }
        }
    }

    async sendVerificationCode(phone) {
        try {
            // Generate 6-digit code
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            
            // Store in Supabase
            const { error } = await supabaseClient
                .from('users')
                .upsert({
                    phone: phone,
                    verification_code: code,
                    verification_expires: new Date(Date.now() + 10 * 60000) // 10 minutes
                }, { onConflict: 'phone' });

            if (error) throw error;

            // هنا يمكنك استخدام خدمة SMS
            // لأغراض التطوير، سنخزن الرمز في localStorage
            localStorage.setItem('verification_code', code);
            localStorage.setItem('verification_phone', phone);
            
            // في الواقع، أرسل الرمز عبر SMS
            console.log(`Verification code for ${phone}: ${code}`);
            
            return { success: true, code: code };
        } catch (error) {
            console.error('Error sending verification code:', error);
            return { success: false, error: error.message };
        }
    }

    async verifyCode(phone, code) {
        try {
            const storedCode = localStorage.getItem('verification_code');
            const storedPhone = localStorage.getItem('verification_phone');
            
            if (storedPhone === phone && storedCode === code) {
                // Update user as verified
                const { error } = await supabaseClient
                    .from('users')
                    .update({ verified: true })
                    .eq('phone', phone);

                if (error) throw error;

                // Clear stored code
                localStorage.removeItem('verification_code');
                localStorage.removeItem('verification_phone');
                
                return { success: true };
            }
            
            return { success: false, error: 'Invalid code' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async registerCustomer(fullName, phone) {
        try {
            const { data, error } = await supabaseClient
                .from('users')
                .insert({
                    full_name: fullName,
                    phone: phone,
                    user_type: 'customer',
                    verified: true
                })
                .select()
                .single();

            if (error) throw error;

            // Create session
            this.createSession(data, 'customer');
            return { success: true, user: data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async registerDriver(phone, password) {
        try {
            const { data, error } = await supabaseClient
                .from('users')
                .update({
                    password: password, // يجب تشفير هذا في الواقع
                    user_type: 'driver'
                })
                .eq('phone', phone)
                .select()
                .single();

            if (error) throw error;

            this.createSession(data, 'driver');
            return { success: true, user: data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async loginDriver(phone, password) {
        try {
            const { data, error } = await supabaseClient
                .from('users')
                .select('*, drivers(*)')
                .eq('phone', phone)
                .eq('user_type', 'driver')
                .single();

            if (error) throw error;

            // في الواقع، قارن كلمة المرور المشفرة
            if (data.password !== password) {
                return { success: false, error: 'Invalid credentials' };
            }

            // Check balance
            const driverData = data.drivers;
            if (driverData && driverData.balance < 3000) {
                return { 
                    success: false, 
                    error: 'رصيدك غير كافي. الرصيد المطلوب: 3,000 SDG' 
                };
            }

            this.createSession(data, 'driver');
            return { success: true, user: data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    createSession(user, type) {
        this.currentUser = user;
        this.userType = type;
        
        const sessionData = {
            user: user,
            type: type,
            timestamp: Date.now()
        };
        
        localStorage.setItem('travel_session', JSON.stringify(sessionData));
        
        // Store active drivers in JSONBin for real-time matching
        if (type === 'driver') {
            this.updateDriverStatus('online');
        }
    }

    async updateDriverStatus(status) {
        if (this.userType !== 'driver') return;
        
        try {
            const { error } = await supabaseClient
                .from('drivers')
                .update({ status: status })
                .eq('id', this.currentUser.id);

            if (error) throw error;

            // Update JSONBin for real-time tracking
            const binData = await getJSONBin();
            const drivers = binData?.record?.activeDrivers || [];
            
            const driverIndex = drivers.findIndex(d => d.id === this.currentUser.id);
            
            if (status === 'online') {
                if (driverIndex === -1) {
                    drivers.push({
                        id: this.currentUser.id,
                        phone: this.currentUser.phone,
                        name: this.currentUser.full_name,
                        status: 'online',
                        lastUpdate: Date.now()
                    });
                }
            } else {
                if (driverIndex !== -1) {
                    drivers.splice(driverIndex, 1);
                }
            }
            
            await updateJSONBin({ activeDrivers: drivers });
            
        } catch (error) {
            console.error('Error updating driver status:', error);
        }
    }

    logout() {
        if (this.userType === 'driver') {
            this.updateDriverStatus('offline');
        }
        
        localStorage.removeItem('travel_session');
        window.location.href = 'index.html';
    }

    redirectToDashboard() {
        if (!this.currentUser) return;
        
        switch (this.userType) {
            case 'customer':
                window.location.href = 'customer-dashboard.html';
                break;
            case 'driver':
                window.location.href = 'driver-dashboard.html';
                break;
            case 'admin':
                window.location.href = 'admin-dashboard.html';
                break;
        }
    }
}

const auth = new AuthSystem();