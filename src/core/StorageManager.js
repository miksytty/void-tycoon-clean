import { BUILDINGS, PROCESSING_RECIPES, ITEMS } from '../data/GameData.js';

const STORAGE_VERSION = 1;
const LOCAL_KEY_PREFIX = 'void_tycoon_';

export class StorageManager {
    constructor(telegramAPI) {
        this.telegram = telegramAPI;
        this.cloudStorage = null;
        this.cloudStorageEnabled = true;
        this.data = this.getDefaultData();
        this.saveTimeout = null;
        this.lastSaveTime = 0;
    }

    getDefaultData() {
        return {
            version: STORAGE_VERSION,
            player: {
                level: 1,
                xp: 0,
                energy: 100,
                maxEnergy: 100,
                lastEnergyUpdate: Date.now(),
                vipStatus: false,
                vipExpires: 0,
                prestigeMultiplier: 1,
                prestigeLevel: 0
            },
            resources: {
                wood: 0,
                hardwood: 0,
                iron: 0,
                steel: 0,
                crystal: 0,
                chip: 0,
                quantum: 0
            },
            inventory: new Array(20).fill(null),
            equipped: {
                tool: null,
                pet: null // Simplified: Only pet, no boots/backpack
            },
            tools: {
                unlocked: ['basic_axe'],
                current: 'basic_axe'
            },
            stats: {
                totalResourcesGathered: 0,
                totalCrafted: 0,
                totalPlayed: 0,
                referrals: 0,
                dailyStreak: 0,
                lastDailyClaim: 0,
                lastOnlineTime: Date.now(),
                stars: 0,
                totalXP: 0
            },
            achievements: [],
            technologies: [],
            achievements: [],
            technologies: [],
            processingQueue: [], // Array of { id, recipeId, startTime, duration, completed }
            quests: {},
            settings: {
                soundEnabled: true,
                vibrationEnabled: true,
                tutorialComplete: false
            },
            buildings: { // Legacy counts, maybe keep for stats?
                lumber_mill: 0,
                quarry: 0,
                crystal_mine: 0,
                factory: 0,
                lab: 0,
                portal: 0,
                turret: 0
            },
            placedBuildings: [], // Array of { id, type, x, y, lastProduction }
            skills: {
                speed: 0,
                efficiency: 0,
                backpack: 0,
                luck: 0
            },
            world: {
                lastChunkX: 0,
                lastChunkY: 0
            }
        };
    }

    async init() {
        if (this.telegram.webapp?.CloudStorage) {
            this.cloudStorage = this.telegram.webapp.CloudStorage;
        }

        await this.load();

        this.recoverEnergy();

        this.offlineEarnings = this.calculateOfflineProgress();

        setInterval(() => this.save(), 30000);

        window.addEventListener('beforeunload', () => this.saveSync());
    }

    calculateOfflineProgress() {
        let lastOnline = this.data.stats?.lastOnlineTime;

        if (!lastOnline || lastOnline < 1735689600000 || lastOnline > Date.now()) {
            this.data.stats.lastOnlineTime = Date.now();
            this.save();
            return null;
        }

        const now = Date.now();
        const elapsedMs = now - lastOnline;

        const MIN_OFFLINE = 60 * 1000;
        const MAX_OFFLINE = 8 * 60 * 60 * 1000;

        if (elapsedMs < MIN_OFFLINE) return null;

        const cappedMs = Math.min(elapsedMs, MAX_OFFLINE);
        const seconds = Math.floor(cappedMs / 1000);

        const ownedBuildings = this.data.buildings || {};
        const earnings = {};
        let hasEarnings = false;

        for (const [id, count] of Object.entries(ownedBuildings)) {
            if (count > 0 && BUILDINGS[id]) {
                const production = BUILDINGS[id].production || {};

                for (const [res, perSecond] of Object.entries(production)) {
                    const amount = perSecond * count * seconds;
                    if (amount > 0) {
                        earnings[res] = (earnings[res] || 0) + amount;
                        hasEarnings = true;
                    }
                }
            }
        }

        // Offline Processing Logic
        if (this.data.processingQueue && this.data.processingQueue.length > 0) {
            this.data.processingQueue.forEach(job => {
                if (!job.completed) {
                    const jobElapsed = now - job.startTime;
                    if (jobElapsed >= job.duration) {
                        job.completed = true;
                        hasEarnings = true; // Mark as having something to notify (though this is structural return)
                    }
                }
            });
        }

        if (hasEarnings) {
            for (const [res, amount] of Object.entries(earnings)) {
                this.data.resources[res] = (this.data.resources[res] || 0) + Math.floor(amount);
            }

            this.data.stats.lastOnlineTime = now;
            this.save();

            return { earnings: earnings, seconds: seconds };
        }

        this.data.stats.lastOnlineTime = now;
        return null;
    }

    async load() {
        try {
            let savedData = null;

            if (this.cloudStorage) {
                savedData = await this.loadFromCloud();
            }

            if (!savedData) {
                savedData = this.loadFromLocal();
            }

            if (savedData) {
                this.data = this.mergeData(this.getDefaultData(), savedData);
            }

        } catch (error) {
            console.error('Data load error:', error);
        }
    }

    loadFromCloud() {
        if (!this.cloudStorageEnabled) return Promise.resolve(null);

        return new Promise((resolve) => {
            try {
                this.cloudStorage.getItem('gameData', (error, value) => {
                    if (error) {
                        this.cloudStorageEnabled = false;
                        resolve(null);
                    } else if (!value) {
                        resolve(null);
                    } else {
                        try {
                            resolve(JSON.parse(value));
                        } catch {
                            resolve(null);
                        }
                    }
                });
            } catch (e) {
                console.log('CloudStorage unavailable, using LocalStorage');
                this.cloudStorageEnabled = false;
                resolve(null);
            }
        });
    }

    loadFromLocal() {
        try {
            const data = localStorage.getItem(LOCAL_KEY_PREFIX + 'gameData');
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    }

    mergeData(defaults, saved) {
        const result = { ...defaults };

        for (const key in saved) {
            if (saved[key] !== null && typeof saved[key] === 'object' && !Array.isArray(saved[key])) {
                result[key] = this.mergeData(defaults[key] || {}, saved[key]);
            } else {
                result[key] = saved[key];
            }
        }

        return result;
    }

    save() {
        const now = Date.now();
        if (now - this.lastSaveTime < 2000) {
            if (!this.saveTimeout) {
                this.saveTimeout = setTimeout(() => {
                    this.saveTimeout = null;
                    this.performSave();
                }, 2000);
            }
            return;
        }

        this.performSave();
    }

    performSave() {
        this.lastSaveTime = Date.now();
        const dataStr = JSON.stringify(this.data);

        if (this.cloudStorage && this.cloudStorageEnabled) {
            try {
                this.cloudStorage.setItem('gameData', dataStr, () => { });
            } catch (e) {
                this.cloudStorageEnabled = false;
            }
        }

        try {
            localStorage.setItem(LOCAL_KEY_PREFIX + 'gameData', dataStr);
        } catch (error) { }

        const now = Date.now();
        if (!this.lastLeaderboardSync || now - this.lastLeaderboardSync > 60000) {
            this.lastLeaderboardSync = now;
            const userId = this.telegram?.getUserId();
            const username = this.telegram?.getUsername();
            const totalXP = this.data.stats.totalXP || this.data.player.xp;

            if (userId && window.VoidTycoon?.leaderboard) {
                window.VoidTycoon.leaderboard.syncScore(userId, username, totalXP);
            }
        }
    }

    saveSync() {
        try {
            localStorage.setItem(LOCAL_KEY_PREFIX + 'gameData', JSON.stringify(this.data));
        } catch { }
    }

    recoverEnergy() {
        const now = Date.now();
        const lastUpdate = this.data.player.lastEnergyUpdate;
        const elapsed = now - lastUpdate;

        const recoveryRate = 30000;
        const recovered = Math.floor(elapsed / recoveryRate);

        if (recovered > 0) {
            this.data.player.energy = Math.min(
                this.data.player.maxEnergy,
                this.data.player.energy + recovered
            );
            this.data.player.lastEnergyUpdate = now;
            this.save();
        }
    }

    getPlayer() {
        return this.data.player;
    }

    getResources() {
        return this.data.resources;
    }

    getInventory() {
        // Should we resize based on backpack?
        // Default 20. If backpack gives +5, return 25 sized array?
        // Logic currently uses data.inventory which is fixed length in defaults.
        // We should handle "virtual" size or resize array.
        return this.data.inventory;
    }

    getInventorySize() {
        const base = 20;
        const extra = this.getEquipmentStats().slots || 0;
        return base + extra;
    }

    getEquipped() {
        return this.data.equipped;
    }

    getStats() {
        return this.data.stats;
    }

    addResource(type, amount) {
        if (this.data.resources[type] !== undefined) {
            if (this.isVIP()) {
                amount *= 2;
            }

            const prestige = this.data.player.prestigeMultiplier || 1;
            amount *= prestige;

            this.data.resources[type] += amount;
            this.data.stats.totalResourcesGathered += amount;
            this.save();

            return true;
        }
        return false;
    }

    useResource(type, amount) {
        if (this.data.resources[type] >= amount) {
            this.data.resources[type] -= amount;
            this.save();
            return true;
        }
        return false;
    }

    isVIP() {
        return this.data.player.vipStatus && Date.now() < this.data.player.vipExpires;
    }

    activateVIP(durationDays = 30) {
        this.data.player.vipStatus = true;
        this.data.player.vipExpires = Date.now() + (durationDays * 24 * 60 * 60 * 1000);
        this.save();
    }

    addXP(amount) {
        this.data.player.xp += amount;

        if (!this.data.stats.totalXP) this.data.stats.totalXP = 0;
        this.data.stats.totalXP += amount;

        const xpForNextLevel = this.getXPForLevel(this.data.player.level + 1);

        while (this.data.player.xp >= xpForNextLevel) {
            this.data.player.xp -= xpForNextLevel;
            this.data.player.level++;
            this.data.player.maxEnergy += 10;
            this.data.player.energy = this.data.player.maxEnergy;

            window.VoidTycoon.ui?.showNotification(
                `🎉 Level ${this.data.player.level}!\n⚡ Max Energy: ${this.data.player.maxEnergy}`,
                'success'
            );

            setTimeout(() => {
                window.VoidTycoon.ui?.showFloatingText(null, '🔋 Full Energy!', '#00ff00');
            }, 500);

            window.VoidTycoon.telegram?.hapticFeedback('success');
            window.VoidTycoon.sound?.playLevelUp();
        }

        this.save();
    }

    getXPForLevel(level) {
        return Math.floor(100 * Math.pow(1.5, level - 1));
    }

    useEnergy(amount) {
        if (this.data.player.energy >= amount) {
            this.data.player.energy -= amount;
            this.data.player.lastEnergyUpdate = Date.now();
            this.save();
            return true;
        }
        return false;
    }

    restoreEnergy(amount) {
        this.data.player.energy = Math.min(
            this.data.player.maxEnergy,
            this.data.player.energy + amount
        );
        this.save();
    }

    addToInventory(item) {
        const maxSlots = this.getInventorySize();
        // Ensure array is large enough? Or just check against maxSlots index
        // data.inventory might be length 20. If we have 25 slots, we might need to push.

        // Find first null in existing
        let emptyIndex = this.data.inventory.findIndex(slot => slot === null);

        if (emptyIndex === -1 && this.data.inventory.length < maxSlots) {
            emptyIndex = this.data.inventory.length;
        } else if (emptyIndex >= maxSlots) {
            return false; // Full
        }

        if (emptyIndex !== -1) {
            this.data.inventory[emptyIndex] = item;
            this.save();
            return true;
        }

        return false;
    }

    removeFromInventory(index) {
        if (this.data.inventory[index]) {
            this.data.inventory[index] = null;
            this.save();
            return true;
        }
        return false;
    }

    equipTool(toolId) {
        this.data.tools.current = toolId;
        this.save();
    }

    unlockTool(toolId) {
        if (!this.data.tools.unlocked.includes(toolId)) {
            this.data.tools.unlocked.push(toolId);
            this.save();
        }
    }

    resetProgress() {
        this.data = this.getDefaultData();
        this.save();
    }

    getSkillLevel(skillId) {
        return this.data.skills?.[skillId] || 0;
    }

    upgradeSkill(skillId) {
        if (!this.data.skills) this.data.skills = {};
        this.data.skills[skillId] = (this.data.skills[skillId] || 0) + 1;
        this.save();
    }

    performPrestige() {
        const currentMult = this.data.player.prestigeMultiplier || 1;
        const currentLevel = this.data.player.prestigeLevel || 0;

        const newMult = currentMult + 0.5;
        const newLevel = currentLevel + 1;

        // Keep premium currency
        const oldStars = this.data.stats.stars;

        this.data = this.getDefaultData();

        this.data.player.prestigeMultiplier = newMult;
        this.data.player.prestigeLevel = newLevel;
        this.data.stats.stars = oldStars;

        this.save();
    }

    hasTechnology(techId) {
        return this.data.technologies && this.data.technologies.includes(techId);
    }

    unlockTechnology(techId) {
        if (!this.data.technologies) this.data.technologies = [];
        if (!this.data.technologies.includes(techId)) {
            this.data.technologies.push(techId);
            this.save();
            return true;
        }
        return false;
    }

    // --- Processing System (Smelter) ---

    getProcessingQueue() {
        return this.data.processingQueue || [];
    }

    addProcessingJob(recipe) {
        if (!this.data.processingQueue) this.data.processingQueue = [];

        // Check if we have free slots (Base 1 + 1 per Smelter level?)
        // For now, let's limit to 3 hardcoded or based on Smelter building count * 2
        const smelterCount = this.data.buildings?.smelter || 0;
        const maxSlots = Math.max(1, smelterCount * 2);

        const activeJobs = this.data.processingQueue.filter(j => !j.completed).length;
        if (activeJobs >= maxSlots) return { success: false, reason: 'slots_full' };

        // Check resources (Double check, although UI checks too)
        for (const [res, amount] of Object.entries(recipe.input)) {
            if ((this.data.resources[res] || 0) < amount) {
                return { success: false, reason: 'no_resources' };
            }
        }

        // Deduct resources
        for (const [res, amount] of Object.entries(recipe.input)) {
            this.data.resources[res] -= amount;
        }

        const job = {
            id: Date.now() + Math.random().toString(36).substr(2, 5),
            recipeId: recipe.id,
            startTime: Date.now(),
            duration: recipe.duration,
            completed: false
        };

        this.data.processingQueue.push(job);
        this.save();
        return { success: true, job };
    }

    claimProcessedItem(jobId) {
        if (!this.data.processingQueue) return false;

        const index = this.data.processingQueue.findIndex(j => j.id === jobId);
        if (index === -1) return false;

        const job = this.data.processingQueue[index];
        if (!job.completed) return false;

        // Give Output - using imported PROCESSING_RECIPES
        const recipe = PROCESSING_RECIPES[job.recipeId];

        if (recipe) {
            return this.finishClaim(job, recipe);
        }

        return false;
    }

    // Helper to finish claim (refactored to avoid import async issues inside sync method)
    finishClaim(job, recipe) {
        if (!recipe) return false;

        for (const [res, amount] of Object.entries(recipe.output)) {
            this.addResource(res, amount);
        }

        if (recipe.xp) {
            this.addXP(recipe.xp);
        }

        // Remove from queue
        this.data.processingQueue = this.data.processingQueue.filter(j => j.id !== job.id);
        this.save();
        return true;
    }

    // --- Equipment System ---

    equipItem(itemId, slot) {
        // Find in inventory
        const invIndex = this.data.inventory.findIndex(i => i && i.id === itemId);
        if (invIndex === -1 && !this.data.tools.unlocked.includes(itemId)) {
            // Maybe it's a tool?
            return false;
        }

        // Only handling inventory items for now (boots, backpack) + Pet
        if (invIndex !== -1) {
            const item = this.data.inventory[invIndex];

            // Unequip current if any
            if (this.data.equipped[slot]) {
                const currentId = this.data.equipped[slot];
                // Swap: put current back to inventory slot
                this.data.inventory[invIndex] = { id: currentId, type: 'equipment' }; // Simplified, ideally we store full obj
                // BUT wait, inventory stores objects? Yes.
                // Let's assume we need to fetch full item data if we only store ID.
                // Actually defaults say 'inventory: new Array(20).fill(null)'.
                // So we store the object.
                // We need to restore the object. 
                // Let's assume we store { id, ... } in inventory.
                // And equipped stores ID.
            } else {
                this.removeFromInventory(invIndex);
            }

            this.data.equipped[slot] = itemId;
            this.save();
            return true;
        }

        return false;
    }

    unequipItem(slot) {
        if (!this.data.equipped[slot]) return false;

        const itemId = this.data.equipped[slot];

        // Try to add to inventory
        // Need to reconstruct item object? Or fetch from GameData.
        // Let's assume we can fetch by ID from ITEMS.
        const itemDef = ITEMS[itemId] || { id: itemId, type: 'equipment' };

        if (this.addToInventory(itemDef)) {
            this.data.equipped[slot] = null;
            this.save();
            return true;
        }

        return false; // Inventory full
    }

    getEquipmentStats() {
        // Iterate equipped slots and sum stats
        const stats = { speed: 1.0, hp: 1.0, slots: 0 };
        // We need GameData access to know stats of equipped items.

        const itemsDB = ITEMS || {};

        for (const [slot, id] of Object.entries(this.data.equipped)) {
            if (id && itemsDB[id]) {
                const itemStats = itemsDB[id].stats;
                if (itemStats) {
                    if (itemStats.speed) stats.speed += itemStats.speed;
                    if (itemStats.slots) stats.slots += itemStats.slots;
                    // ... other stats
                }
            }
        }
        return stats;
    }
}
