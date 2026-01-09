export class AnalyticsManager {
    constructor() {
        this.client = window.VoidTycoon.leaderboard?.client; // Access raw Supabase client
        this.resizeQueue = [];
    }

    /**
     * Logs a custom event to Supabase 'events' table.
     * @param {string} eventName - Name of the event (e.g., 'tutorial_complete')
     * @param {object} params - Additional data
     */
    async logEvent(eventName, params = {}) {
        if (!this.client) return;

        const telegram = window.VoidTycoon.telegram;
        const userId = telegram?.getUserId();

        if (!userId) return;

        try {
            await this.client.from('events').insert({
                user_id: userId,
                event_name: eventName,
                event_data: params,
                created_at: new Date().toISOString()
            });
            console.log(`[Analytics] Sent: ${eventName}`);
        } catch (e) {
            // Silently fail if table doesn't exist or network error
            console.warn('[Analytics] Failed to send event', e);
        }
    }
}
