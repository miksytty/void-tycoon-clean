export class LeaderboardManager {
    constructor() {
        this.api = window.VoidTycoon.leaderboard; // The Supabase client instance
        this.lastSync = 0;
    }

    /**
     * Saves the current player's score to the global leaderboard.
     * @param {number} score - The score to save (e.g., total XP).
     * @param {boolean} force - Whether to bypass throttling.
     */
    async saveScore(score, force = false) {
        if (!this.api) return;

        const now = Date.now();
        // Throttle: Sync max once per 60 seconds unless forced (e.g. game over or level up)
        if (!force && now - this.lastSync < 60000) {
            return;
        }

        const telegram = window.VoidTycoon.telegram;
        const userId = telegram?.getUserId();
        const username = telegram?.getUsername() || 'Player';

        if (userId) {
            await this.api.syncScore(userId, username, score);
            this.lastSync = now;
        }
    }

    /**
     * Retrieves the top players from the leaderboard.
     * @param {number} limit - Number of players to fetch.
     * @returns {Promise<Array>} List of players {username, xp}.
     */
    async getTopPlayers(limit = 10) {
        if (!this.api) return [];
        return await this.api.getTopPlayers(limit);
    }
}
