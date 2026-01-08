import { createClient } from '@supabase/supabase-js';

const PROJECT_URL = 'https://pixxzhaiuqcbnmnpnerz.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpeHh6aGFpdXFjYm5tbnBuZXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MTU3NjUsImV4cCI6MjA4MzM5MTc2NX0.TE_Q6s0tfmbzt8dtM6d4hwpHXD2Rutld90k0zX0WEaE';

export class LeaderboardAPI {
    constructor() {
        this.client = null;
        this.lastError = null;
        this.debugLog = [];

        try {
            this.log('Initializing Supabase (Correct URL)...');
            this.client = createClient(PROJECT_URL, ANON_KEY, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false
                }
            });
            this.log('Client initialized.');
        } catch (e) {
            this.log('Init Failed: ' + e.message);
            this.lastError = e;
        }
    }

    log(msg) {
        const time = new Date().toLocaleTimeString();
        const line = `[${time}] ${msg}`;
        console.log(line);
        this.debugLog.push(line);

        // Пишем в UI если есть контейнер
        const debugDiv = document.getElementById('debug-log');
        if (debugDiv) {
            const el = document.createElement('div');
            el.textContent = line;
            el.style.borderBottom = '1px solid #333';
            debugDiv.appendChild(el);
        }
    }

    async syncScore(userId, username, xp) {
        if (!this.client) return;

        try {
            this.log(`Syncing ID: ${userId}, XP: ${xp}`);

            const { error } = await this.client
                .from('leaderboard')
                .upsert({
                    user_id: userId,
                    username: username,
                    xp: xp,
                    updated_at: new Date()
                }, { onConflict: 'user_id' });

            if (error) {
                this.log('Sync Error: ' + JSON.stringify(error));
                this.lastError = error;
            } else {
                this.log('Sync OK');
            }
        } catch (e) {
            this.log('Sync Exception: ' + e.message);
            this.lastError = e;
        }
    }

    async getTopPlayers(limit = 50) {
        if (!this.client) return [];

        try {
            this.log('Fetching top players...');

            const { data, error } = await this.client
                .from('leaderboard')
                .select('username, xp')
                .order('xp', { ascending: false })
                .limit(limit);

            if (error) {
                this.log('Fetch Error: ' + JSON.stringify(error));
                throw error;
            }

            this.log(`Fetch OK. Got ${data?.length} rows.`);
            return data || [];
        } catch (e) {
            this.log('Fetch Exception: ' + e.message);
            this.lastError = e;
            return [];
        }
    }

    async getUserRank(userId) {
        return null;
    }
}

export const leaderboardAPI = new LeaderboardAPI();
