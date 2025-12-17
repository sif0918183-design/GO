// js/main.js - الملف الرئيسي للوظائف العامة في ترحال السودان

// =======================================================
// 1. التحقق من تحميل المكتبات الخارجية (Supabase)
// =======================================================

// في حال تم تحميل هذا الملف قبل supabase-config.js
if (typeof supabase === 'undefined') {
    console.warn('⚠️ مكتبة Supabase لم يتم تحميلها بعد. جاري التحقق من التحميل الديناميكي...');
    
    // إذا لم تكن المكتبة محملة، قم بتحميلها ديناميكياً
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = () => {
        console.log('✅ تم تحميل Supabase بنجاح ديناميكياً.');
        // إعادة تهيئة الخدمات بعد تحميل المكتبة إذا لزم الأمر
        // (يفترض أن هذا يتم بالفعل عبر init.html)
    };
    script.onerror = () => {
        console.error('❌ فشل تحميل مكتبة Supabase.');
        // يمكن إضافة دالة showMessage هنا إذا كانت معرفة بالفعل
    };
    document.head.appendChild(script);
}

// =======================================================
// 2. إعداد وتفعيل أحداث DOM
// =======================================================

document.addEventListener('DOMContentLoaded', function() {
    // تفعيل القائمة المتنقلة (Mobile Menu)
    setupMobileMenu();
    
    // تحميل ترويسات الصفحات المفقودة (لإظهار رسالة 'قيد التطوير')
    loadMissingHeaders();
    
    // التحقق من حالة تسجيل الدخول وتحديث أزرار المصادقة
    checkAuthStatus();
    
    // إضافة أنماط الرسائل المنبثقة عند تحميل الصفحة
    addMessageStyles();
});

// =======================================================
// 3. وظائف تفعيل واجهة المستخدم (UI Functions)
// =======================================================

function setupMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {  
        menuToggle.addEventListener('click', function() {  
            navLinks.classList.toggle('active');  
            menuToggle.textContent = navLinks.classList.contains('active') ? '✕' : '☰';  
        });  
          
        // إغلاق القائمة عند النقر على رابط  
        document.querySelectorAll('.nav-links a').forEach(link => {  
            link.addEventListener('click', () => {  
                navLinks.classList.remove('active');  
                menuToggle.textContent = '☰';  
            });  
        });  
    }  
}

function loadMissingHeaders() {
    // قائمة بالصفحات غير الموجودة حالياً
    const missingPages = [
        'about.html', 'how-it-works.html', 'pricing.html', 
        'driver-register.html', 'login.html', 'register.html', 
        'driver-requirements.html', 'driver-earnings.html', 
        'driver-center.html', 'contact.html', 'help.html', 
        'terms.html', 'privacy.html', 'safety.html'
    ];

    // استبدال الروابط بصفحات قيد التطوير مؤقتاً  
    document.querySelectorAll('a').forEach(link => {  
        const href = link.getAttribute('href');  
        if (missingPages.includes(href)) {  
            link.addEventListener('click', function(e) {  
                // في مرحلة التطوير، نفترض أن كل الصفحات غير موجودة
                e.preventDefault();  
                showComingSoon(href);  
            });  
        }  
    });
}

function showComingSoon(pageName) {
    const titles = {
        'about.html': 'عن ترحال',
        'how-it-works.html': 'كيف تعمل',
        'pricing.html': 'الأسعار',
        'driver-register.html': 'التسجيل كسائق',
        'login.html': 'تسجيل الدخول',
        'register.html': 'التسجيل',
        'driver-requirements.html': 'متطلبات السائقين',
        'driver-earnings.html': 'أرباح السائقين',
        'driver-center.html': 'مركز السائقين',
        'contact.html': 'اتصل بنا',
        'help.html': 'المساعدة',
        'terms.html': 'الشروط والأحكام',
        'privacy.html': 'سياسة الخصوصية',
        'safety.html': 'السلامة'
    };
    const pageTitle = titles[pageName] || 'هذه الصفحة';
    alert(`⏳ ${pageTitle} قيد التطوير\n\nسيتم إطلاق هذه الصفحة قريباً!`);
}

// =======================================================
// 4. وظائف المصادقة (Auth Functions)
// =======================================================

function checkAuthStatus() {
    const authButtons = document.querySelector('.auth-buttons');
    if (!authButtons) return;

    // استخدام localStorage لتخزين الجلسة
    const session = localStorage.getItem('travel_session');  
    if (session) {  
        const { user, type } = JSON.parse(session);  
          
        // تغيير أزرار المصادقة  
        authButtons.innerHTML = `  
            <a href="${type === 'driver' ? 'driver-dashboard.html' : 'customer-dashboard.html'}"   
               class="btn-outline">لوحة التحكم</a>  
            <a href="#" class="btn-primary" id="logoutBtn">تسجيل خروج</a>  
        `;  
          
        // إضافة حدث تسجيل الخروج  
        document.getElementById('logoutBtn')?.addEventListener('click', logout);  
    }
}

// تسجيل الخروج
function logout() {
    // ⚠️ ملاحظة: يمكن استخدام window.supabaseClient.auth.signOut() هنا
    // لتسجيل الخروج الفعلي من Supabase.
    
    localStorage.removeItem('travel_session');
    window.location.href = 'index.html';
}

// =======================================================
// 5. وظائف المساعدة العامة (Utility Functions)
// =======================================================

function formatCurrency(amount) {
    // تنسيق العملة بالريال السوداني (SDG)
    return new Intl.NumberFormat('ar-SD', {
        style: 'currency',
        currency: 'SDG',
        minimumFractionDigits: 0
    }).format(amount);
}

function formatDate(date) {
    // تنسيق التاريخ والوقت
    return new Date(date).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// تحقق من رقم الهاتف (صيغة سودانية)
function validatePhone(phone) {
    // مثال: +2499xxxxxxx أو 09xxxxxxx أو 1xxxxxxx
    const regex = /^((\+249|0)?[91][0-9]{8})$/;
    return regex.test(phone);
}

// =======================================================
// 6. نظام الرسائل المنبثقة (Toast/Message System)
// =======================================================

// إظهار رسالة للمستخدم
function showMessage(type, message, duration = 5000) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = `<div class="message-content">
        <span class="message-icon">${getMessageIcon(type)}</span>
        <span>${message}</span>
        <button class="message-close">&times;</button>
    </div>`;

    document.body.appendChild(messageDiv);  
      
    // إضافة تأثير الظهور  
    setTimeout(() => messageDiv.classList.add('show'), 10);  
      
    // إغلاق الرسالة  
    const closeBtn = messageDiv.querySelector('.message-close');  
    closeBtn.addEventListener('click', () => {  
        messageDiv.classList.remove('show');  
        setTimeout(() => messageDiv.remove(), 300);  
    });  
      
    // إغلاق تلقائي بعد المدة  
    if (duration > 0) {  
        setTimeout(() => {  
            if (messageDiv.parentNode) {  
                messageDiv.classList.remove('show');  
                setTimeout(() => messageDiv.remove(), 300);  
            }  
        }, duration);  
    }  
      
    return messageDiv;
}

function getMessageIcon(type) {
    const icons = {
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'info': 'ℹ️'
    };
    return icons[type] || '💡';
}

// إضافة أنماط الرسائل المنبثقة (CSS Injected via JS)
function addMessageStyles() {
    const style = document.createElement('style');
    style.textContent = `
    .message {
        position: fixed;
        top: 20px;
        /* استخدام right و left معًا وتطبيق transform لضمان المركزية في RTL */
        left: 50%;
        transform: translateX(50%) translateY(-100px); 
        background: white;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        z-index: 10000;
        min-width: 300px;
        max-width: 500px;
        opacity: 0;
        transition: all 0.3s ease;
        text-align: right; /* ضمان أن النص داخل الرسالة يبدأ من اليمين */
    }

    .message.show {  
        transform: translateX(50%) translateY(0);  
        opacity: 1;  
    }  
      
    /* تعديل border-right إلى border-left ليتناسب مع RTL */
    .message.success {  
        border-left: 4px solid #27ae60;  
    }  
      
    .message.error {  
        border-left: 4px solid #e74c3c;  
    }  
      
    .message.warning {  
        border-left: 4px solid #f39c12;  
    }  
      
    .message.info {  
        border-left: 4px solid #3498db;  
    }  
      
    .message-content {  
        padding: 15px 20px;  
        display: flex;  
        align-items: center;  
        gap: 10px;  
    }  
      
    .message-icon {  
        font-size: 20px;  
    }  
      
    .message-close {  
        background: none;  
        border: none;  
        font-size: 24px;  
        cursor: pointer;  
        /* استخدام margin-left: auto في RTL لتحريك زر الإغلاق لليسار */
        margin-left: auto;  
        color: #999;  
        padding: 0 5px;  
    }  
      
    .message-close:hover {  
        color: #333;  
    }
    `;

    document.head.appendChild(style);
}
