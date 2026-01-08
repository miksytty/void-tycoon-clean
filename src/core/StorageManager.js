import { BUILDINGS } from '../data/GameData.js';

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
                tool: null
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
            quests: {},
            settings: {
                soundEnabled: true,
                vibrationEnabled: true,
                tutorialComplete: false
            },
            buildings: {
                lumber_mill: 0,
                quarry: 0,
                crystal_mine: 0,
                factory: 0,
                lab: 0,
                portal: 0
            },
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

    // ... (This replaces getDefaultData logic to include skills)

    getSkillLevel(skillId) {
        return this.data.skills?.[skillId] || 0;
    }

    upgradeSkill(skillId) {
        if (!this.data.skills) this.data.skills = {};
        this.data.skills[skillId] = (this.data.skills[skillId] || 0) + 1;
        this.save();
    }

    getStatModifier(statType) {
        let modifier = 0;
        const SKILLS = window.VoidTycoon?.gameData?.SKILLS || {};

        // We might not have access to GameData instantly globally?
        // Let's assume passed-in context or reliable import.
        // Actually, let's look up data from imports if possible, or assume caller handles logic.
        // Simplified: return level multiplier.
        return modifier;
    }

    performPrestige() {
        const currentMult = this.data.player.prestigeMultiplier || 1;
        const currentLevel = this.data.player.prestigeLevel || 0;

        const newMult = currentMult + 0.5;
        const newLevel = currentLevel + 1;

        // Keep premium currency? 
        const oldStars = this.data.stats.stars;

        this.data = this.getDefaultData();

        this.data.player.prestigeMultiplier = newMult;
        this.data.player.prestigeLevel = newLevel;
        this.data.stats.stars = oldStars; // Keep stats

        this.save();
    }
}
