// js/call-system.js
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
    }

    initializeAudio() {
        // إنشاء نغمة الرنين
        this.ringtone = new Audio();
        this.ringtone.src = this.createRingtone();
        this.ringtone.loop = true;
    }

    createRingtone() {
        // إنشاء نغمة رنين بسيطة باستخدام Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
        
        // تسجيل النغمة
        const recorder = new MediaRecorder(new MediaStream());
        // هذا مثال مبسط، في الواقع تحتاج لتنفيذ أكثر تعقيدًا
        
        return 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ'; // نغمة افتراضية
    }

    async startCall(driverId, tripId) {
        if (this.isCalling) {
            console.log('Already in a call');
            return false;
        }

        try {
            // بدء المكالمة مع السائق
            this.isCalling = true;
            this.currentCall = { driverId, tripId, startTime: Date.now() };
            
            // إظهار واجهة المكالمة
            this.showCallInterface('جاري الاتصال...', driverId);
            
            // تشغيل نغمة الرنين
            this.playRingtone();
            
            // محاكاة اتصال WebRTC (في الإنتاج الحقيقي، استخدم خدمة مثل Socket.io + STUN/TURN)
            this.simulateWebRTCCall(driverId);
            
            // مهلة للإجابة (30 ثانية)
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
            // إرسال إشعار للسائق عبر JSONBin (للتجربة)
            this.notifyDriverOfCall(driverId);
        }, 1000);
    }

    async notifyDriverOfCall(driverId) {
        try {
            // تحديث حالة المكالمة في JSONBin
            const binData = await getJSONBin();
            const activeCalls = binData?.record?.activeCalls || [];
            
            activeCalls.push({
                driverId: driverId,
                tripId: this.currentCall?.tripId,
                timestamp: Date.now(),
                status: 'ringing'
            });
            
            await updateJSONBin({
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
            // إيقاف نغمة الرنين
            this.stopRingtone();
            
            // تحديث واجهة المكالمة
            this.updateCallInterface('متصل', 'success');
            
            // محاكاة الاتصال الناجح
            this.simulateConnectedCall();
            
            // تحديث حالة المكالمة
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
            // هنا يمكنك إضافة منطق WebRTC الحقيقي
            console.log('Call connected successfully');
        }, 1000);
    }

    async endCall(reason = 'تم إنهاء المكالمة') {
        if (!this.isCalling) return;
        
        // إيقاف نغمة الرنين
        this.stopRingtone();
        
        // إلغاء المهلة
        if (this.callTimeout) {
            clearTimeout(this.callTimeout);
            this.callTimeout = null;
        }
        
        // إغلاق واجهة المكالمة
        this.hideCallInterface();
        
        // إغلاق أي اتصالات WebRTC
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        
        // تحديث حالة المكالمة
        await this.updateCallStatus('ended', reason);
        
        this.isCalling = false;
        this.currentCall = null;
        
        console.log('Call ended:', reason);
    }

    playRingtone() {
        if (this.ringtone) {
            this.ringtone.play().catch(e => console.error('Error playing ringtone:', e));
        }
    }

    stopRingtone() {
        if (this.ringtone) {
            this.ringtone.pause();
            this.ringtone.currentTime = 0;
        }
    }

    showCallInterface(status, driverId) {
        // إنشاء واجهة المكالمة
        const callHtml = `
            <div class="call-overlay" id="callOverlay">
                <div class="call-modal">
                    <div class="call-header">
                        <h3>🚖 طلب رحلة</h3>
                        <div class="call-status" id="callStatus">${status}</div>
                    </div>
                    
                    <div class="call-body">
                        <div class="call-animation">
                            <div class="call-pulse"></div>
                            <div class="call-icon">📞</div>
                        </div>
                        
                        <div class="call-info">
                            <p>طلب رحلة جديد</p>
                            <p class="driver-id">سائق #${driverId?.slice(0, 8) || '---'}</p>
                        </div>
                        
                        <div class="call-timer" id="callTimer">00:00</div>
                        
                        <div class="call-actions">
                            <button class="btn-call accept" id="acceptCallBtn">
                                <span class="call-btn-icon">✅</span>
                                <span>قبول</span>
                            </button>
                            <button class="btn-call reject" id="rejectCallBtn">
                                <span class="call-btn-icon">❌</span>
                                <span>رفض</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // إضافة واجهة المكالمة للصفحة
        const existingCall = document.getElementById('callOverlay');
        if (existingCall) {
            existingCall.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', callHtml);
        
        // إضافة مستمعي الأحداث
        document.getElementById('acceptCallBtn')?.addEventListener('click', () => {
            this.answerCall();
        });
        
        document.getElementById('rejectCallBtn')?.addEventListener('click', () => {
            this.endCall('تم رفض المكالمة');
        });
        
        // بدء عداد الوقت
        this.startCallTimer();
    }

    updateCallInterface(status, type = 'info') {
        const statusElement = document.getElementById('callStatus');
        if (statusElement) {
            statusElement.textContent = status;
            statusElement.className = `call-status ${type}`;
        }
    }

    hideCallInterface() {
        const callOverlay = document.getElementById('callOverlay');
        if (callOverlay) {
            callOverlay.remove();
        }
    }

    startCallTimer() {
        const timerElement = document.getElementById('callTimer');
        if (!timerElement) return;
        
        let seconds = 0;
        this.timerInterval = setInterval(() => {
            seconds++;
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            timerElement.textContent = 
                `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    async updateCallStatus(status, reason = '') {
        try {
            const binData = await getJSONBin();
            const activeCalls = binData?.record?.activeCalls || [];
            
            // تحديث آخر مكالمة
            if (activeCalls.length > 0) {
                activeCalls[activeCalls.length - 1].status = status;
                if (reason) {
                    activeCalls[activeCalls.length - 1].reason = reason;
                    activeCalls[activeCalls.length - 1].endTime = Date.now();
                }
            }
            
            await updateJSONBin({
                ...binData?.record,
                activeCalls: activeCalls
            });
            
        } catch (error) {
            console.error('Error updating call status:', error);
        }
    }
}

const callSystem = new CallSystem();