// js/admin.js
class AdminSystem {
    constructor() {
        this.initializeAdmin();
        this.loadDrivers();
        
        // Event listeners
        document.getElementById('addDriverBtn')?.addEventListener('click', () => this.showRegistrationForm());
        document.getElementById('cancelRegistrationBtn')?.addEventListener('click', () => this.hideRegistrationForm());
        document.getElementById('generatePasswordBtn')?.addEventListener('click', () => this.generatePassword());
        document.getElementById('driverForm')?.addEventListener('submit', (e) => this.registerDriver(e));
        document.getElementById('searchDrivers')?.addEventListener('input', (e) => this.searchDrivers(e.target.value));
    }

    async initializeAdmin() {
        // Check admin authentication
        const session = localStorage.getItem('travel_session');
        if (!session) {
            window.location.href = 'login.html';
            return;
        }
        
        const { type } = JSON.parse(session);
        if (type !== 'admin') {
            window.location.href = 'index.html';
        }
    }

    async registerDriver(event) {
        event.preventDefault();
        
        const formData = {
            whatsapp: document.getElementById('adminWhatsapp').value,
            additional: document.getElementById('adminAdditional').value,
            fullName: document.getElementById('adminFullName').value,
            carCategory: document.getElementById('carCategory').value,
            carMake: document.getElementById('carMake').value,
            carModel: document.getElementById('carModel').value,
            carYear: document.getElementById('carYear').value,
            phone: document.getElementById('driverPhone').value,
            password: document.getElementById('generatedPassword').value
        };

        try {
            // 1. Create user account
            const { data: user, error: userError } = await supabaseClient
                .from('users')
                .insert({
                    phone: formData.phone,
                    full_name: formData.fullName,
                    user_type: 'driver',
                    password: formData.password, // In production, hash this
                    verified: true
                })
                .select()
                .single();

            if (userError) throw userError;

            // 2. Create driver profile
            const { error: driverError } = await supabaseClient
                .from('drivers')
                .insert({
                    id: user.id,
                    whatsapp_number: formData.whatsapp,
                    additional_number: formData.additional,
                    car_category: formData.carCategory,
                    car_make: formData.carMake,
                    car_model: formData.carModel,
                    car_year: formData.carYear,
                    balance: 15000,
                    status: 'offline'
                });

            if (driverError) throw driverError;

            alert('تم تسجيل السائق بنجاح!');
            this.resetForm();
            this.hideRegistrationForm();
            this.loadDrivers();

        } catch (error) {
            console.error('Error registering driver:', error);
            alert(`حدث خطأ: ${error.message}`);
        }
    }

    async loadDrivers() {
        try {
            const { data: drivers, error } = await supabaseClient
                .from('drivers')
                .select(`
                    *,
                    users (
                        full_name,
                        phone,
                        created_at
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.renderDriversTable(drivers);

        } catch (error) {
            console.error('Error loading drivers:', error);
        }
    }

    renderDriversTable(drivers) {
        const tbody = document.getElementById('driversTableBody');
        if (!tbody) return;

        tbody.innerHTML = drivers.map(driver => `
            <tr>
                <td>${driver.users.full_name}</td>
                <td>${driver.users.phone}</td>
                <td>${driver.balance.toLocaleString()} SDG</td>
                <td>
                    <span class="status-badge ${driver.status}">
                        ${this.getStatusText(driver.status)}
                    </span>
                </td>
                <td>${new Date(driver.created_at).toLocaleDateString('ar-SA')}</td>
                <td>
                    <button class="btn-action edit" data-id="${driver.id}">تعديل</button>
                    <button class="btn-action topup" data-id="${driver.id}">تعبئة رصيد</button>
                    <button class="btn-action deactivate" data-id="${driver.id}">
                        ${driver.is_active ? 'تعطيل' : 'تفعيل'}
                    </button>
                </td>
            </tr>
        `).join('');

        // Add event listeners to action buttons
        this.addActionListeners();
    }

    getStatusText(status) {
        const statusMap = {
            'online': 'متصل',
            'offline': 'غير متصل',
            'on_trip': 'في رحلة',
            'inactive': 'غير نشط'
        };
        return statusMap[status] || status;
    }

    generatePassword() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let password = '';
        for (let i = 0; i < 8; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        document.getElementById('generatedPassword').value = password;
    }

    showRegistrationForm() {
        document.getElementById('registrationForm').style.display = 'block';
        document.getElementById('driversList').style.display = 'none';
        this.generatePassword();
    }

    hideRegistrationForm() {
        document.getElementById('registrationForm').style.display = 'none';
        document.getElementById('driversList').style.display = 'block';
    }

    resetForm() {
        document.getElementById('driverForm').reset();
        document.getElementById('imagePreview').innerHTML = '';
    }

    searchDrivers(query) {
        const rows = document.querySelectorAll('#driversTableBody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
        });
    }

    addActionListeners() {
        // Add listeners to action buttons
        document.querySelectorAll('.btn-action.edit').forEach(btn => {
            btn.addEventListener('click', (e) => this.editDriver(e.target.dataset.id));
        });
        
        document.querySelectorAll('.btn-action.topup').forEach(btn => {
            btn.addEventListener('click', (e) => this.topupBalance(e.target.dataset.id));
        });
        
        document.querySelectorAll('.btn-action.deactivate').forEach(btn => {
            btn.addEventListener('click', (e) => this.toggleDriverStatus(e.target.dataset.id));
        });
    }

    async editDriver(driverId) {
        // Implementation for editing driver
        console.log('Edit driver:', driverId);
    }

    async topupBalance(driverId) {
        const amount = prompt('أدخل المبلغ للتعبئة (SDG):');
        if (!amount || isNaN(amount)) return;

        try {
            // Get current balance
            const { data: driver, error } = await supabaseClient
                .from('drivers')
                .select('balance')
                .eq('id', driverId)
                .single();

            if (error) throw error;

            const newBalance = driver.balance + parseFloat(amount);

            // Update balance
            await supabaseClient
                .from('drivers')
                .update({ balance: newBalance })
                .eq('id', driverId);

            // Record transaction
            await supabaseClient
                .from('transactions')
                .insert({
                    driver_id: driverId,
                    amount: parseFloat(amount),
                    transaction_type: 'topup',
                    description: 'تعبئة رصيد بواسطة الإدارة',
                    balance_before: driver.balance,
                    balance_after: newBalance
                });

            alert('تم تعبئة الرصيد بنجاح');
            this.loadDrivers();

        } catch (error) {
            console.error('Error topping up balance:', error);
            alert(`حدث خطأ: ${error.message}`);
        }
    }

    async toggleDriverStatus(driverId) {
        try {
            const { data: driver, error } = await supabaseClient
                .from('drivers')
                .select('is_active')
                .eq('id', driverId)
                .single();

            if (error) throw error;

            const newStatus = !driver.is_active;

            await supabaseClient
                .from('drivers')
                .update({ is_active: newStatus })
                .eq('id', driverId);

            alert(`تم ${newStatus ? 'تفعيل' : 'تعطيل'} السائق`);
            this.loadDrivers();

        } catch (error) {
            console.error('Error toggling driver status:', error);
            alert(`حدث خطأ: ${error.message}`);
        }
    }
}

// Initialize admin system
document.addEventListener('DOMContentLoaded', () => {
    const adminSystem = new AdminSystem();
});