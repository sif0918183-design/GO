// js/call-system.js - نظام المكالمات (تم تصحيح مشكلة النطاق)

class CallSystem {
    constructor() {
        this.peerConnection = null;
        this.localStream = null;
        this.remoteStream = null;
        this.isCalling = false;
        this.currentCall = null;
        this.callTimeout = null;
        this.ringtone = null;
        this.initializeAudio();
        
        // التحقق من وجود التبعيات الأساسية لـ JSONBin
        if (typeof window.getJSONBin === 'undefined' || typeof window.updateJSONBin === 'undefined') {
             console.error('❌ فشل بدء نظام المكالمات: دالتا JSONBin (getJSONBin/updateJSONBin) غير مُعرّفتين في النطاق العام. تأكد من تحميل supabase-config.js.');
        }
    }

    initializeAudio() {
        // إنشاء نغمة الرنين
        this.ringtone = new Audio();
        this.ringtone.src = this.createRingtone();
        this.ringtone.loop = true;
    }

    createRingtone() {
        // ... (كود إنشاء نغمة الرنين) ...
        // ملاحظة: تم ترك هذا الجزء كما هو، لكن إنشاء نغمة رنين بالـ Web Audio API خارجياً معقد ولا يعمل بالكفاءة المطلوبة في هذا المثال البسيط.
        return 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ'; // نغمة افتراضية
    }

    async startCall(driverId, tripId) {
        if (this.isCalling) {
            console.log('Already in a call');
            return false;
        }
        // ... (بقية منطق بدء المكالمة) ...
        
        try {
            // بدء المكالمة مع السائق
            this.isCalling = true;
            this.currentCall = { driverId, tripId, startTime: Date.now() };
            
            this.showCallInterface('جاري الاتصال...', driverId);
            this.playRingtone();
            this.simulateWebRTCCall(driverId);
            
            this.callTimeout = setTimeout(() => {
                if (this.isCalling) {
                    this.endCall('انتهت مهلة الإجابة');
                }
            }, 30000);
            
            return true;
            
        } catch (error) {
            console.error('Error starting call:', error);
            this.isCalling = false;
            return false;
        }
    }

    simulateWebRTCCall(driverId) {
        // محاكاة عملية الاتصال
        setTimeout(() => {
            this.notifyDriverOfCall(driverId);
        }, 1000);
    }

    async notifyDriverOfCall(driverId) {
        try {
            // 💡 استخدام window.getJSONBin
            const binData = await window.getJSONBin(); 
            const activeCalls = binData?.record?.activeCalls || [];
            
            activeCalls.push({
                driverId: driverId,
                tripId: this.currentCall?.tripId,
                timestamp: Date.now(),
                status: 'ringing'
            });
            
            // 💡 استخدام window.updateJSONBin
            await window.updateJSONBin({ 
                ...binData?.record,
                activeCalls: activeCalls
            });
            
        } catch (error) {
            console.error('Error notifying driver:', error);
        }
    }

    async answerCall(callId) {
        if (!this.isCalling) return false;
        
        try {
            this.stopRingtone();
            this.updateCallInterface('متصل', 'success');
            this.simulateConnectedCall();
            
            await this.updateCallStatus('answered');
            
            return true;
            
        } catch (error) {
            console.error('Error answering call:', error);
            return false;
        }
    }

    simulateConnectedCall() {
        // محاكاة اتصال ناجح
        setTimeout(() => {
            console.log('Call connected successfully');
        }, 1000);
    }

    async endCall(reason = 'تم إنهاء المكالمة') {
        if (!this.isCalling) return;
        
        this.stopRingtone();
        
        if (this.callTimeout) {
            clearTimeout(this.callTimeout);
            this.callTimeout = null;
        }
        
        this.hideCallInterface();
        
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        
        await this.updateCallStatus('ended', reason);
        
        this.isCalling = false;
        this.currentCall = null;
        
        console.log('Call ended:', reason);
    }
    
    // ... (playRingtone, stopRingtone, showCallInterface, hideCallInterface, updateCallInterface, startCallTimer تبقى كما هي) ...

    async updateCallStatus(status, reason = '') {
        try {
            // 💡 استخدام window.getJSONBin
            const binData = await window.getJSONBin(); 
            const activeCalls = binData?.record?.activeCalls || [];
            
            // تحديث آخر مكالمة
            if (activeCalls.length > 0) {
                activeCalls[activeCalls.length - 1].status = status;
                if (reason) {
                    activeCalls[activeCalls.length - 1].reason = reason;
                    activeCalls[activeCalls.length - 1].endTime = Date.now();
                }
            }
            
            // 💡 استخدام window.updateJSONBin
            await window.updateJSONBin({ 
                ...binData?.record,
                activeCalls: activeCalls
            });
            
        } catch (error) {
            console.error('Error updating call status:', error);
        }
    }
}

const callSystem = new CallSystem();

// **js/geolocation.js (لا يحتاج إلى تعديل)**
// ... (يبقى كما هو)
const geolocation = new GeolocationService();
