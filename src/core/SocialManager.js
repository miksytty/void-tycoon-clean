export class SocialManager {
    constructor() {
        this.telegram = null;
        this.storage = null;
        this.ui = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        this.telegram = window.VoidTycoon.telegram;
        this.storage = window.VoidTycoon.storage;
        this.ui = window.VoidTycoon.ui;
        this.initialized = true;

        this.checkReferral();
    }

    checkReferral() {
        if (!this.telegram || !this.storage) return;

        const startParam = this.telegram.getStartParam();
        const myId = String(this.telegram.getUserId());

        // Basic check: param exists, not self
        if (startParam && startParam !== myId) {

            // Check if we already processed a referral for this user (stored locally)
            const alreadyReferred = localStorage.getItem('void_referrer');

            if (!alreadyReferred) {
                console.log('[Social] New referral detected:', startParam);

                // Award Crystals
                this.storage.addResource('crystal', 100);

                // Show Notification (delayed to ensure UI is ready)
                setTimeout(() => {
                    this.ui?.showNotification('🎁 +100 💎 за приглашение!', 'success');
                    this.ui?.showAlert(
                        'Добро пожаловать!',
                        'Вы вошли по приглашению друга и получили 100 Кристаллов!'
                    );
                }, 1500);

                // Mark as processed
                localStorage.setItem('void_referrer', startParam);

                // Optional: Tracking event could be sent to backend here
            } else {
                console.log('[Social] Referral already processed.');
            }
        }
    }

    inviteFriends() {
        if (!this.telegram) return;
        this.telegram.shareReferralLink();
    }
}
