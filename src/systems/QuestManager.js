/**
 * ============================================
 * Quest Manager - Система квестов
 * ============================================
 */

export const QUESTS = {
    first_steps: {
        id: 'first_steps',
        name: 'Первые шаги',
        description: 'Собери 10 дерева',
        icon: '🌲',
        type: 'gather',
        target: { resource: 'wood', amount: 10 },
        reward: { xp: 50 }
    },
    builder: {
        id: 'builder',
        name: 'Строитель',
        description: 'Построй Лесопилку',
        icon: '🏗️',
        type: 'build',
        target: { building: 'lumber_mill', amount: 1 },
        reward: { xp: 100, crystal: 5 }
    },
    hunter: {
        id: 'hunter',
        name: 'Охотник',
        description: 'Убей 3 мобов',
        icon: '⚔️',
        type: 'kill',
        target: { amount: 3 },
        reward: { xp: 150, crystal: 10 }
    },
    gatherer_50: {
        id: 'gatherer_50',
        name: 'Старатель',
        description: 'Собери 50 любых ресурсов',
        icon: '💎',
        type: 'gather_total',
        target: { amount: 50 },
        reward: { xp: 75, iron: 20 }
    },
    iron_miner: {
        id: 'iron_miner',
        name: 'Шахтёр',
        description: 'Добудь 20 железа',
        icon: '🔩',
        type: 'gather',
        target: { resource: 'iron', amount: 20 },
        reward: { xp: 100, wood: 50 }
    },
    crystal_hunter: {
        id: 'crystal_hunter',
        name: 'Искатель кристаллов',
        description: 'Найди 5 кристаллов',
        icon: '💠',
        type: 'gather',
        target: { resource: 'crystal', amount: 5 },
        reward: { xp: 200, iron: 30 }
    },
    boss_slayer: {
        id: 'boss_slayer',
        name: 'Победитель Стража',
        description: 'Победи первого босса',
        icon: '💀',
        type: 'boss_kill',
        target: { amount: 1 },
        reward: { xp: 500, crystal: 25, dimension_key: 1 }
    }
};

export class QuestManager {
    constructor() {
        this.activeQuests = [];
        this.completedQuests = [];
        this.questProgress = {};
    }

    init() {
        const storage = window.VoidTycoon.storage;

        // Load completed quests
        this.completedQuests = storage.data.completedQuests || [];
        this.questProgress = storage.data.questProgress || {};

        // Activate first quests if none active
        this.activateInitialQuests();
    }

    activateInitialQuests() {
        // Activate quests that aren't completed yet
        const initialQuestIds = ['first_steps', 'gatherer_50'];

        for (const questId of initialQuestIds) {
            if (!this.completedQuests.includes(questId)) {
                this.activeQuests.push(questId);
            }
        }

        // Always have at least one active quest
        if (this.activeQuests.length === 0) {
            // Find any incomplete quest
            for (const questId of Object.keys(QUESTS)) {
                if (!this.completedQuests.includes(questId)) {
                    this.activeQuests.push(questId);
                    break;
                }
            }
        }
    }

    /**
     * Update quest progress
     * @param {string} type - 'gather', 'build', 'kill', 'gather_total'
     * @param {object} data - { resource, building, amount }
     */
    updateProgress(type, data) {
        const storage = window.VoidTycoon.storage;

        for (const questId of this.activeQuests) {
            const quest = QUESTS[questId];
            if (!quest || quest.type !== type) continue;

            // Initialize progress if needed
            if (!this.questProgress[questId]) {
                this.questProgress[questId] = 0;
            }

            let shouldProgress = false;

            switch (type) {
                case 'gather':
                    if (data.resource === quest.target.resource) {
                        shouldProgress = true;
                    }
                    break;
                case 'gather_total':
                    shouldProgress = true;
                    break;
                case 'build':
                    if (data.building === quest.target.building) {
                        shouldProgress = true;
                    }
                    break;
                case 'kill':
                    shouldProgress = true;
                    break;
                case 'boss_kill':
                    shouldProgress = true;
                    break;
            }

            if (shouldProgress) {
                this.questProgress[questId] += data.amount || 1;

                // Check completion
                if (this.questProgress[questId] >= quest.target.amount) {
                    this.completeQuest(questId);
                }
            }
        }

        // Save progress
        storage.data.questProgress = this.questProgress;
        storage.save();
    }

    completeQuest(questId) {
        const quest = QUESTS[questId];
        if (!quest) return;

        const storage = window.VoidTycoon.storage;

        // Remove from active
        this.activeQuests = this.activeQuests.filter(id => id !== questId);

        // Add to completed
        this.completedQuests.push(questId);
        storage.data.completedQuests = this.completedQuests;

        // Grant rewards
        for (const [key, value] of Object.entries(quest.reward)) {
            if (key === 'xp') {
                this.grantXP(value);
            } else {
                storage.addResource(key, value);
            }
        }

        storage.save();

        // Visual feedback
        window.VoidTycoon.ui?.showNotification(`✅ Квест выполнен: ${quest.name}!`, 'success');
        window.VoidTycoon.telegram?.hapticFeedback('success');
        window.VoidTycoon.sound?.playLevelUp();

        // Particle effect at player
        const scene = window.VoidTycoon.game?.scene?.getScene('GameScene');
        if (scene && scene.player) {
            this.showQuestCompleteEffect(scene, scene.player.x, scene.player.y);
        }

        // Unlock next quest
        this.unlockNextQuest(questId);
    }

    unlockNextQuest(completedQuestId) {
        // Quest chain logic
        const questChain = {
            'first_steps': 'builder',
            'builder': 'iron_miner',
            'gatherer_50': 'hunter',
            'hunter': 'crystal_hunter',
            'crystal_hunter': 'boss_slayer'
        };

        const nextQuestId = questChain[completedQuestId];
        if (nextQuestId && !this.completedQuests.includes(nextQuestId)) {
            this.activeQuests.push(nextQuestId);
            window.VoidTycoon.ui?.showNotification(`📜 Новый квест: ${QUESTS[nextQuestId].name}`, 'info');
        }
    }

    grantXP(amount) {
        const storage = window.VoidTycoon.storage;
        const player = storage.data.player;

        player.xp += amount;

        // Check level up
        const xpNeeded = this.getXPForLevel(player.level + 1);

        while (player.xp >= xpNeeded) {
            player.xp -= xpNeeded;
            player.level++;
            this.onLevelUp(player.level);
        }

        storage.save();
        // Update HUD via scene
        const scene = window.VoidTycoon.game?.scene?.getScene('GameScene');
        scene?.updateHUD();
    }

    getXPForLevel(level) {
        // Formula: 100 * (level ^ 1.5)
        return Math.floor(100 * Math.pow(level, 1.5));
    }

    onLevelUp(newLevel) {
        const storage = window.VoidTycoon.storage;
        const player = storage.data.player;

        // Increase max energy
        player.maxEnergy += 10;

        // Restore full energy
        player.energy = player.maxEnergy;

        storage.save();

        // Level 10: Unlock Portal
        if (newLevel === 10) {
            window.VoidTycoon.portalManager?.startPortal();
        }

        // Haptic feedback
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }

        // Big visual effect
        const scene = window.VoidTycoon.game?.scene?.getScene('GameScene');
        if (scene && scene.player) {
            this.showLevelUpEffect(scene, scene.player.x, scene.player.y, newLevel);
        }

        window.VoidTycoon.ui?.showNotification(`🎉 LEVEL UP! Уровень ${newLevel}!`, 'success');
        window.VoidTycoon.sound?.playLevelUp();
    }

    showLevelUpEffect(scene, x, y, level) {
        // Big "LEVEL UP!" text
        const levelText = scene.add.text(x, y - 60, `LEVEL UP!`, {
            fontSize: '48px',
            fontFamily: 'Arial Black',
            color: '#ffd700',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setDepth(10000);

        const levelNumText = scene.add.text(x, y - 20, `Level ${level}`, {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#6c5ce7',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(10000);

        // Animation
        scene.tweens.add({
            targets: [levelText, levelNumText],
            y: '-=80',
            alpha: { from: 1, to: 0 },
            scale: { from: 1, to: 1.5 },
            duration: 2500,
            ease: 'Power2',
            onComplete: () => {
                levelText.destroy();
                levelNumText.destroy();
            }
        });

        // Particle burst
        if (scene.textures.exists('particle_gold')) {
            const particles = scene.add.particles(x, y, 'particle_gold', {
                speed: { min: 100, max: 250 },
                scale: { start: 2, end: 0 },
                lifespan: 1000,
                quantity: 30,
                blendMode: 'ADD'
            });

            scene.time.delayedCall(1000, () => particles.destroy());
        }
    }

    showQuestCompleteEffect(scene, x, y) {
        // Particle burst
        if (scene.textures.exists('particle')) {
            const particles = scene.add.particles(x, y, 'particle', {
                speed: { min: 50, max: 150 },
                scale: { start: 1.5, end: 0 },
                lifespan: 800,
                quantity: 20,
                tint: [0x4cd137, 0x00d2d3, 0x6c5ce7]
            });

            scene.time.delayedCall(800, () => particles.destroy());
        }
    }

    getActiveQuests() {
        return this.activeQuests.map(id => {
            const quest = QUESTS[id];
            const progress = this.questProgress[id] || 0;
            return {
                ...quest,
                progress,
                targetAmount: quest.target.amount
            };
        });
    }

    getCompletedCount() {
        return this.completedQuests.length;
    }

    getTotalCount() {
        return Object.keys(QUESTS).length;
    }
}
