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

    async checkReferral() {
        if (!this.telegram || !this.storage) return;

        const startParam = this.telegram.getStartParam();
        const myId = String(this.telegram.getUserId());
        const myUsername = this.telegram.getUsername() || 'Player';

        // Basic check: param exists, not self
        if (startParam && startParam !== myId) {

            // Check if we already processed a referral for this user (stored locally)
            const alreadyReferred = localStorage.getItem('void_referrer');

            if (!alreadyReferred) {
                console.log('[Social] New referral detected:', startParam);

                // Award Crystals (Invitee)
                this.storage.addResource('crystal', 100);

                // Log to Supabase (Server-side tracking)
                // We assume startParam is the Referrer's ID
                const referrerId = startParam;

                if (window.VoidTycoon.analytics) {
                    await window.VoidTycoon.analytics.logEvent('referral_join', {
                        referrer_id: referrerId,
                        referee_id: myId,
                        referee_username: myUsername
                    });
                }

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

            } else {
                console.log('[Social] Referral already processed.');
            }
        }
    }

    /**
     * Fetches the list of players who used this user's referral link.
     */
    async getReferrals() {
        const myId = this.telegram?.getUserId();
        if (!myId || !window.VoidTycoon.leaderboard?.client) return [];

        try {
            // Fetch 'referral_join' events where referrer_id matches myId
            // note: 'data' is a JSONB column in 'events' table
            const { data, error } = await window.VoidTycoon.leaderboard.client
                .from('events')
                .select('data, created_at')
                .eq('event_type', 'referral_join')
                .contains('data', { referrer_id: String(myId) })
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error('[Social] Error fetching referrals:', error);
                return [];
            }

            // Map to cleaner format
            return data.map(row => ({
                username: row.data.referee_username || 'Unknown',
                date: new Date(row.created_at).toLocaleDateString()
            }));

        } catch (e) {
            console.error('[Social] Fetch failed:', e);
            return [];
        }
    }

    inviteFriends() {
        if (!this.telegram) return;
        this.telegram.shareReferralLink();
    }
}
