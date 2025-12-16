// js/main.js - الملف الرئيسي للوظائف العامة
document.addEventListener('DOMContentLoaded', function() {
    // تفعيل القائمة المتنقلة
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
    
    // تحميل ترويسات الصفحات المفقودة
    loadMissingHeaders();
    
    // التحقق من حالة تسجيل الدخول
    checkAuthStatus();
});

// تحميل ترويسات الصفحات المفقودة
function loadMissingHeaders() {
    // قائمة بالصفحات غير الموجودة
    const missingPages = [
        'about.html',
        'how-it-works.html', 
        'pricing.html',
        'driver-register.html',
        'login.html',
        'register.html',
        'driver-requirements.html',
        'driver-earnings.html',
        'driver-center.html',
        'contact.html',
        'help.html',
        'terms.html',
        'privacy.html',
        'safety.html'
    ];
    
    // استبدال الروابط بصفحات قيد التطوير مؤقتاً
    document.querySelectorAll('a').forEach(link => {
        const href = link.getAttribute('href');
        if (missingPages.includes(href)) {
            link.addEventListener('click', function(e) {
                if (!pageExists(href)) {
                    e.preventDefault();
                    showComingSoon(href);
                }
            });
        }
    });
}

function pageExists(page) {
    // في مرحلة التطوير، كل الصفحات غير موجودة
    return false;
}

function showComingSoon(pageName) {
    const pageTitle = getPageTitle(pageName);
    alert(`⏳ ${pageTitle} قيد التطوير\n\nسيتم إطلاق هذه الصفحة قريباً!`);
}

function getPageTitle(pageName) {
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
    return titles[pageName] || 'هذه الصفحة';
}

// التحقق من حالة المصادقة
function checkAuthStatus() {
    const authButtons = document.querySelector('.auth-buttons');
    if (!authButtons) return;
    
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
    localStorage.removeItem('travel_session');
    window.location.href = 'index.html';
}

// وظائف المساعدة العامة
function formatCurrency(amount) {
    return new Intl.NumberFormat('ar-SD', {
        style: 'currency',
        currency: 'SDG',
        minimumFractionDigits: 0
    }).format(amount);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// إظهار رسالة للمستخدم
function showMessage(type, message, duration = 5000) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = `
        <div class="message-content">
            <span class="message-icon">${getMessageIcon(type)}</span>
            <span>${message}</span>
            <button class="message-close">&times;</button>
        </div>
    `;
    
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

// تحقق من رقم الهاتف
function validatePhone(phone) {
    const regex = /^(\+249|0)?(9|1)[0-9]{8}$/;
    return regex.test(phone);
}

// إضافة أنماط الرسائل
const style = document.createElement('style');
style.textContent = `
    .message {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(-100px);
        background: white;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        z-index: 10000;
        min-width: 300px;
        max-width: 500px;
        opacity: 0;
        transition: all 0.3s ease;
    }
    
    .message.show {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
    }
    
    .message.success {
        border-right: 4px solid #27ae60;
    }
    
    .message.error {
        border-right: 4px solid #e74c3c;
    }
    
    .message.warning {
        border-right: 4px solid #f39c12;
    }
    
    .message.info {
        border-right: 4px solid #3498db;
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
        margin-right: auto;
        color: #999;
        padding: 0 5px;
    }
    
    .message-close:hover {
        color: #333;
    }
`;

document.head.appendChild(style);