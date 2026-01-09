import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { Boss } from '../entities/Boss.js';
import { WorldGenerator } from '../systems/WorldGenerator.js';
import { ResourceManager } from '../systems/ResourceManager.js';
import { TOOLS, RESOURCES, BUILDINGS, BOSSES, MOBS } from '../data/GameData.js';
import { VirtualJoystick } from '../ui/VirtualJoystick.js';
// Turret removed - simplified gameplay
import { Pet } from '../entities/Pet.js';
import { BuildManager } from '../systems/BuildManager.js';
import { QuestManager } from '../systems/QuestManager.js';
import { PortalManager } from '../systems/PortalManager.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });

        this.player = null;
        this.worldGenerator = null;
        this.resourceManager = null;
        this.isGathering = false;
        this.gatherProgress = 0;
        this.currentResource = null;
        this.lastIncomeTime = 0;
        this.bosses = [];
        // turrets removed
        this.lastBossSpawnCheck = 0;
        this.lastBossSpawnCheck = 0;
        this.lastEnergyRegen = 0;
        this.buildManager = null;
    }

    create() {
        this.cameras.main.setBackgroundColor('#2d5a3d');

        this.groundLayer = this.add.group();
        this.resourcesGroup = this.physics.add.staticGroup();

        this.worldGenerator = new WorldGenerator(this);

        this.resourceManager = new ResourceManager(this);

        this.player = new Player(this, 0, 0);

        this.cameras.main.startFollow(this.player, true, 0.2, 0.2);
        this.cameras.main.setZoom(1);

        this.worldGenerator.generateAroundPlayer();

        this.setupInput();

        this.createSceneUI();

        this.updateHUD();

        this.game.events.emit('ready');

        this.hideLoadingScreen();

        this.time.delayedCall(1500, () => {
            window.VoidTycoon.dailyRewards?.checkDailyReward();
        });

        this.buildManager = new BuildManager(this);
        this.buildManager.init();
        window.VoidTycoon.buildManager = this.buildManager; // Expose globally for UI

        // Quest Manager
        this.questManager = new QuestManager();
        this.questManager.init();
        window.VoidTycoon.questManager = this.questManager;

        // Portal Manager (Endgame)
        this.portalManager = new PortalManager(this);
        this.portalManager.init();
        window.VoidTycoon.portalManager = this.portalManager;

        // loadBuiltTurrets removed - turrets disabled
        this.checkPetSpawn();

        // Story trigger removed - simplified release
    }

    showTutorialArrow() {
        // Find nearest tree
        const tree = this.findNearbyResource('tree');
        if (tree) {
            this.tutorialArrow = this.add.text(tree.x, tree.y - 80, '⬇️', { fontSize: '40px', color: '#ffff00' }).setOrigin(0.5);
            this.tweens.add({
                targets: this.tutorialArrow,
                y: tree.y - 60,
                yoyo: true,
                repeat: -1,
                duration: 500
            });
            // Auto destroy after 10s or when gathered
            this.time.delayedCall(10000, () => {
                if (this.tutorialArrow) this.tutorialArrow.destroy();
            });
        }
    }

    // Helper override for findNearbyResource to accept type
    findNearbyResource(typeFilter = null) {
        const interactionRadius = typeFilter ? 500 : 60; // Larger radius for tutorial finder
        // ... existing logic but optimized
        let closest = null;
        let closestDist = interactionRadius;

        this.resourcesGroup.children.iterate((resource) => {
            if (!resource || !resource.active) return;
            if (typeFilter && resource.resourceType !== typeFilter) return;
            if (!typeFilter && (!resource.resourceType || !['tree', 'rock', 'crystal'].includes(resource.resourceType))) return;

            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, resource.x, resource.y);
            if (dist < closestDist) {
                closest = resource;
                closestDist = dist;
            }
        });
        return closest;
    }

    checkPetSpawn() {
        const storage = window.VoidTycoon.storage;
        const equipped = storage.getEquipped();

        if (this.pet) {
            this.pet.destroy();
            this.pet = null;
        }

        if (equipped && equipped.pet) {
            // Spawn Pet
            // Assuming 'drone_1' style logic for now
            this.pet = new Pet(this, this.player.x, this.player.y, equipped.pet);
        }
    }

    // loadBuiltTurrets removed - turrets disabled for simplified gameplay

    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = {
            W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.setupMobileControls();
    }

    setupMobileControls() {
        this.virtualJoystick = new VirtualJoystick(this);
    }

    tryGatherResource() {
        if (this.isGathering) return;

        const nearbyResource = this.findNearbyResource();
        if (nearbyResource) {
            this.startGathering(nearbyResource);
        } else {
            const text = this.add.text(this.player.x, this.player.y - 50, '❓', {
                fontSize: '24px'
            }).setOrigin(0.5).setDepth(200);

            this.tweens.add({
                targets: text,
                y: text.y - 30,
                alpha: 0,
                duration: 600,
                onComplete: () => text.destroy()
            });
        }
    }

    createSceneUI() {
        this.progressBar = this.add.graphics().setDepth(200);

        this.dayNightOverlay = this.add.rectangle(0, 0, 5000, 5000, 0x000010, 0)
            .setScrollFactor(0)
            .setDepth(150)
            .setOrigin(0.5);
        this.gameTime = 0;

        this.resourcePrompt = this.add.text(0, 0, '', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5).setDepth(200).setVisible(false);

        this.objectiveText = this.add.text(this.cameras.main.width / 2, 60, '', {
            fontFamily: '"Rubik", sans-serif',
            fontSize: '16px',
            fontStyle: 'bold',
            color: '#ffd700',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

        // Adsgram Button Listener
        setTimeout(() => {
            const adBtn = document.getElementById('btn-free-gems');
            if (adBtn) {
                adBtn.onclick = () => {
                    if (!window.VoidTycoon.ads) return;

                    adBtn.disabled = true;
                    adBtn.style.opacity = '0.5';
                    adBtn.textContent = '⏳ Loading...';

                    window.VoidTycoon.ads.showRewardVideo()
                        .then(() => {
                            window.VoidTycoon.storage.addResource('crystal', 50);
                            window.VoidTycoon.ui?.showNotification('Награда получена! +50 💎', 'success');
                            window.VoidTycoon.telegram?.hapticFeedback('success');
                        })
                        .catch((result) => {
                            const currentId = window.VoidTycoon.ads?.blockId || 'unknown';
                            console.log('Ad Error:', result, 'BlockID:', currentId);
                            // Alert removed for production
                            if (result === 'SDK_MISSING' || result === 'SDK_LOAD_TIMEOUT') {
                                window.VoidTycoon.ui?.showNotification('Реклама недоступна (интернет/VPN?)', 'error');
                            } else {
                                // On desktop or no-fill, just show a polite warning
                                window.VoidTycoon.ui?.showNotification('Реклама пока недоступна', 'warning');
                            }
                        })
                        .finally(() => {
                            adBtn.disabled = false;
                            adBtn.style.opacity = '1';
                            adBtn.textContent = '💎 Free (+50)';
                        });
                };
            }
        }, 1000); // Wait for DOM
    }

    updateHUD() {
        const storage = window.VoidTycoon.storage;
        if (!storage) return;

        const resources = storage.getResources();
        const player = storage.getPlayer();

        document.querySelector('#res-wood .res-count').textContent = resources.wood;
        document.querySelector('#res-iron .res-count').textContent = resources.iron;
        document.querySelector('#res-crystal .res-count').textContent = resources.crystal;

        // Show prestige multiplier if > 0
        const prestigeLevel = player.prestigeLevel || 0;
        const prestigeMult = player.prestigeMultiplier || 1;
        if (prestigeLevel > 0) {
            document.getElementById('player-level').textContent = `${player.level} ✨x${prestigeMult.toFixed(1)}`;
        } else {
            document.getElementById('player-level').textContent = player.level;
        }

        const xpForNext = storage.getXPForLevel(player.level + 1);
        const xpPercent = (player.xp / xpForNext) * 100;
        document.getElementById('xp-progress').style.width = `${xpPercent}%`;

        const energyPercent = (player.energy / player.maxEnergy) * 100;
        document.getElementById('energy-progress').style.width = `${energyPercent}%`;
        document.getElementById('energy-text').textContent = `${player.energy}/${player.maxEnergy}`;

        // Update Objective
        if (this.objectiveText) {
            const portalStage = storage.data.portalStage || 0;
            if (portalStage >= 4) {
                this.objectiveText.setText('Цель: Активировать ПОРТАЛ 🌌');
                this.objectiveText.setColor('#ea80fc');
            } else if (portalStage > 0) {
                this.objectiveText.setText('Цель: Достроить ПОРТАЛ 🏗️');
                this.objectiveText.setColor('#00ffff');
            } else if (player.level >= 10) {
                this.objectiveText.setText('Цель: Найти место для ПОРТАЛА 📍');
                this.objectiveText.setColor('#ffd700');
            } else {
                this.objectiveText.setText('Цель: Качаться до 10 уровня ⚔️');
                this.objectiveText.setColor('#ffffff');
            }
        }

        if (window.VoidTycoon?.ui?.updateActiveView) {
            window.VoidTycoon.ui.updateActiveView();
        }
    }

    findNearbyResource() { // Old method replaced by helper above? 
        // Wait, cannot redeclare. I should Replace the existing method completely in the chunk above or here.
        // Let's replace the Logic here to use arguments.
        return this.findNearbyResourceWithType();
    }

    findNearbyResourceWithType(typeFilter = null) {
        const interactionRadius = typeFilter ? 1000 : 60;
        let closest = null;
        let closestDist = interactionRadius;

        this.resourcesGroup.children.iterate((resource) => {
            if (!resource || !resource.active) return;
            if (typeFilter && resource.resourceType !== typeFilter) return;
            // CRITICAL FIX: Ignore objects that don't satisfy the resource contract
            if (!typeFilter && (!resource.resourceType || !['tree', 'rock', 'crystal'].includes(resource.resourceType))) return;

            const dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                resource.x, resource.y
            );

            if (dist < closestDist) {
                closest = resource;
                closestDist = dist;
            }
        });

        return closest;
    }

    findNearbyBoss() {
        const attackRadius = 80;
        for (const boss of this.bosses) {
            if (boss.isDead) continue;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, boss.x, boss.y);
            if (dist < attackRadius) return boss;
        }
        return null;
    }

    startGathering(resource) {
        if (!resource || !resource.resourceType) return; // Safety check

        const storage = window.VoidTycoon.storage;
        const currentTool = TOOLS[storage.data.tools.current];

        if (!storage.useEnergy(currentTool.energyCost)) {
            window.VoidTycoon.ui?.showNotification('Недостаточно энергии! ⚡', 'error');
            window.VoidTycoon.telegram?.hapticFeedback('error');
            return;
        }

        this.isGathering = true;
        this.gatherProgress = 0;
        this.currentResource = resource;
        this.gatherStartTime = this.time.now;

        this.player.setVelocity(0, 0);

        window.VoidTycoon.telegram?.hapticFeedback('light');
    }

    updateGathering() {
        if (!this.isGathering || !this.currentResource) return;

        const storage = window.VoidTycoon.storage;
        const currentTool = TOOLS[storage.data.tools.current];

        const elapsed = this.time.now - this.gatherStartTime;
        const baseDuration = 2000;
        const duration = baseDuration / currentTool.speed;

        this.gatherProgress = Math.min(elapsed / duration, 1);

        this.drawProgressBar();

        if (this.gatherProgress >= 1) {
            this.completeGathering();
        }
    }

    drawProgressBar() {
        this.progressBar.clear();

        const barWidth = 50;
        const barHeight = 8;
        const x = this.player.x - barWidth / 2;
        const y = this.player.y - 40;

        this.progressBar.fillStyle(0x000000, 0.7);
        this.progressBar.fillRoundedRect(x - 2, y - 2, barWidth + 4, barHeight + 4, 4);

        const colors = {
            tree: 0x4caf50,
            rock: 0x78909c,
            crystal: 0xab47bc
        };
        const color = colors[this.currentResource?.resourceType] || 0xffffff;

        this.progressBar.fillStyle(color, 1);
        this.progressBar.fillRoundedRect(x, y, barWidth * this.gatherProgress, barHeight, 3);

        this.progressBar.lineStyle(1, 0xffffff, 0.5);
        this.progressBar.strokeRoundedRect(x - 1, y - 1, barWidth + 2, barHeight + 2, 4);
    }

    completeGathering() {
        if (!this.currentResource) return;

        const storage = window.VoidTycoon.storage;
        const currentTool = TOOLS[storage.data.tools.current];
        const resourceType = this.currentResource.resourceType;

        const baseYields = {
            tree: { type: 'wood', amount: 3, xp: 5 },
            rock: { type: 'iron', amount: 2, xp: 10 },
            crystal: { type: 'crystal', amount: 1, xp: 10 }
        };

        const reward = baseYields[resourceType];
        if (!reward) {
            console.warn('Unknown resource type gathered:', resourceType);
            this.cancelGathering();
            return;
        }

        let efficiencyMult = currentTool.efficiency;
        try {
            const skillLevel = window.VoidTycoon.storage.getSkillLevel('efficiency');
            if (skillLevel > 0) efficiencyMult += skillLevel * 0.2; // +20% per level
        } catch (e) { }

        const amount = Math.floor(reward.amount * efficiencyMult);

        storage.addResource(reward.type, amount);
        storage.addXP(reward.xp);

        window.VoidTycoon.ui?.checkAchievements();
        window.VoidTycoon.ui?.trackQuestProgress('resource', reward.type, amount);

        // Quest system integration
        window.VoidTycoon.questManager?.updateProgress('gather', { resource: reward.type, amount: amount });
        window.VoidTycoon.questManager?.updateProgress('gather_total', { amount: amount });

        if (this.resourceManager.createParticleEffect) {
            this.resourceManager.createParticleEffect(
                this.currentResource.x,
                this.currentResource.y,
                resourceType
            );
        }

        this.cameras.main.shake(100, 0.005);

        const sounds = {
            tree: 'playWoodChop',
            rock: 'playRockHit',
            crystal: 'playCrystalChime'
        };
        if (sounds[resourceType]) window.VoidTycoon.sound?.[sounds[resourceType]]?.();

        this.showFloatingText(this.currentResource.x, this.currentResource.y, `+${amount} ${RESOURCES[reward.type].icon}`, 0x00ff00);
        this.showFloatingText(this.player.x, this.player.y - 40, `+${reward.xp} XP`, 0xffd700);

        const resourceToDestroy = this.currentResource;

        if (resourceToDestroy.body) {
            resourceToDestroy.disableBody(true, false);
        }

        this.tweens.add({
            targets: resourceToDestroy,
            scaleX: 0,
            scaleY: 0,
            alpha: 0,
            angle: 180,
            duration: 300,
            ease: 'Back.in',
            onComplete: () => {
                resourceToDestroy.destroy();
            }
        });

        this.updateHUD();
        window.VoidTycoon.telegram?.hapticFeedback('success');

        this.cancelGathering();
    }

    showRewardText(amount, resourceType) {
        this.showFloatingText(this.currentResource.x, this.currentResource.y, `+${amount}`, 0xffffff);
    }

    cancelGathering() {
        this.isGathering = false;
        this.gatherProgress = 0;
        this.currentResource = null;
        this.progressBar.clear();
    }

    hideLoadingScreen() {
        const screen = document.getElementById('loading-screen');
        if (screen) {
            screen.style.opacity = '0';
            setTimeout(() => {
                screen.style.display = 'none';
            }, 500);
        }
    }

    update(time, delta) {
        let joystickInput = { x: 0, y: 0, active: false };
        if (this.virtualJoystick) {
            const vector = this.virtualJoystick.getVector();
            if (vector.x !== 0 || vector.y !== 0) {
                joystickInput = { x: vector.x, y: vector.y, active: true };
            }
        }

        if (!this.isGathering) {
            this.player.update(this.cursors, this.wasd, joystickInput);
        }

        this.gameTime += delta * 0.0001;
        const cycle = Math.sin(this.gameTime);
        // OPTIMIZATION: Temporarily disabled Day/Night cycle visual update to check performance
        // const darkness = Phaser.Math.Clamp(Math.max(0, -cycle * 0.7), 0, 0.7);
        // if (this.dayNightOverlay) this.dayNightOverlay.fillAlpha = darkness;

        const distMoved = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            this.lastChunkUpdatePos?.x || 0, this.lastChunkUpdatePos?.y || 0
        );

        if (distMoved > 64 || !this.lastChunkUpdatePos) {
            this.worldGenerator.generateAroundPlayer();
            this.lastChunkUpdatePos = { x: this.player.x, y: this.player.y };
        }

        const nearbyResource = this.findNearbyResource();

        const nearbyBossForPrompt = this.findNearbyBoss();

        if (nearbyBossForPrompt && !this.isGathering) {
            this.resourcePrompt.setVisible(true);
            this.resourcePrompt.setPosition(nearbyBossForPrompt.x, nearbyBossForPrompt.y - 60);
            this.resourcePrompt.setText(`[SPACE] ⚔️ Атаковать!`);
        } else if (nearbyResource && !this.isGathering) {
            this.resourcePrompt.setVisible(true);
            this.resourcePrompt.setPosition(nearbyResource.x, nearbyResource.y - 50);

            const names = { tree: 'Дерево', rock: 'Железо', crystal: 'Кристалл' };
            this.resourcePrompt.setText(`[SPACE] ${names[nearbyResource.resourceType] || 'Ресурс'}`);
        } else if (!this.isGathering) {
            this.resourcePrompt.setVisible(false);
        }

        const isActionBtnDown = this.virtualJoystick?.isActionDown() || false;
        const gatherPressed = this.spaceKey.isDown || isActionBtnDown;

        const nearbyBoss = this.findNearbyBoss();

        if (gatherPressed && nearbyBoss && !this.isGathering) {
            this.attackBoss();
        } else if (gatherPressed && nearbyResource && !this.isGathering) {
            this.startGathering(nearbyResource);
        }

        if (this.isGathering) {
            if (!gatherPressed) {
                this.cancelGathering();
            } else {
                this.updateGathering();
            }
        }

        if (time > this.lastIncomeTime + 1000) {
            this.processPassiveIncome();
            this.lastIncomeTime = time;
        }

        // Passive Energy Regeneration (When standing still & not acting)
        if (!this.isGathering && !gatherPressed && this.player.body.velocity.length() < 5) {
            if (time > this.lastEnergyRegen + 1000) {
                const storage = window.VoidTycoon.storage;
                if (storage.data.player.energy < storage.data.player.maxEnergy) {
                    storage.data.player.energy += 1;
                    // Optional: Floating text for regen (maybe too spammy?)
                    // this.showRewardText(1, 'energy'); 
                }
                this.lastEnergyRegen = time;
            }
        } else {
            // Reset timer so we wait a full second after stopping
            this.lastEnergyRegen = time;
        }

        // OPTIMIZATION: Update HUD less frequently (e.g. every 500ms)
        if (!this.lastHudUpdate || time > this.lastHudUpdate + 500) {
            this.updateHUD();
            this.lastHudUpdate = time;
        }

        this.updateBosses();

        // Turrets update removed

        if (time > this.lastBossSpawnCheck + 5000) {
            this.trySpawnBoss();
            this.lastBossSpawnCheck = time;
        }
        if (this.pet) {
            this.pet.update(time, delta);
        }
    }

    trySpawnBoss() {
        const px = this.player.x;
        const py = this.player.y;

        // Try Spawn Bosses
        for (const bossConfig of Object.values(BOSSES)) {
            if (Math.random() > bossConfig.spawnChance) continue;

            const distFromSpawn = Math.sqrt(px * px + py * py);
            if (distFromSpawn < bossConfig.minDistanceFromSpawn) continue;

            const angle = Math.random() * Math.PI * 2;
            const dist = 300 + Math.random() * 200;
            const spawnX = px + Math.cos(angle) * dist;
            const spawnY = py + Math.sin(angle) * dist;

            const boss = new Boss(this, spawnX, spawnY, bossConfig);
            this.bosses.push(boss);

            // Dramatic boss spawn announcement
            this.showFloatingText(spawnX, spawnY - 50, `${bossConfig.icon} ${bossConfig.name}!`, bossConfig.color);
            window.VoidTycoon.ui?.showNotification(`⚠️ Проснулся древний страж Пустоты!`, 'error');

            // Camera effect
            this.cameras.main.shake(300, 0.005);
            window.VoidTycoon.telegram?.hapticFeedback('heavy');

            return; // Only one spawn per cycle
        }

        // Try Spawn Mobs
        if (this.bosses.length < 10) { // Limit max entities
            for (const mobConfig of Object.values(MOBS)) {
                if (Math.random() > mobConfig.spawnChance) continue;

                const angle = Math.random() * Math.PI * 2;
                const dist = 300 + Math.random() * 200;
                const spawnX = px + Math.cos(angle) * dist;
                const spawnY = py + Math.sin(angle) * dist;

                // Basic check for distance from spawn (safe zone)
                if (Math.sqrt(spawnX * spawnX + spawnY * spawnY) < 200) continue;

                const mob = new Boss(this, spawnX, spawnY, mobConfig);
                this.bosses.push(mob);
                break;
            }
        }
    }

    updateBosses() {
        for (let i = this.bosses.length - 1; i >= 0; i--) {
            const boss = this.bosses[i];
            if (boss.isDead) {
                this.bosses.splice(i, 1);
                continue;
            }
            boss.update(this.player);
        }
    }

    attackBoss() {
        const storage = window.VoidTycoon?.storage;
        if (!storage) return;

        const currentTool = TOOLS[storage.data.tools.current];
        const damage = 10 * currentTool.efficiency;

        for (const boss of this.bosses) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, boss.x, boss.y);
            if (dist < 60) {
                // Critical Hit Chance
                let finalDamage = damage;

                let critChance = 0.2; // Base 20%
                try {
                    const skillLevel = window.VoidTycoon.storage.getSkillLevel('luck');
                    if (skillLevel > 0) critChance += skillLevel * 0.05; // +5% per level
                } catch (e) { }

                let isCrit = Math.random() < critChance;
                if (isCrit) finalDamage *= 2;

                boss.takeDamage(finalDamage);

                // JUICE: Camera Shake & Damage Number
                this.cameras.main.shake(isCrit ? 100 : 50, isCrit ? 0.005 : 0.002);

                this.showFloatingText(
                    boss.x,
                    boss.y - 50,
                    isCrit ? `💥 ${Math.floor(finalDamage)}!` : `-${Math.floor(finalDamage)}`,
                    isCrit ? 0xff0000 : 0xffa500
                );

                window.VoidTycoon.telegram?.hapticFeedback(isCrit ? 'heavy' : 'light');
                return;
            }
        }
    }

    processPassiveIncome() {
        const storage = window.VoidTycoon.storage;
        if (!storage) return;

        const ownedBuildings = storage.data.buildings || {};
        let totalIncome = {};
        let hasIncome = false;

        for (const [id, count] of Object.entries(ownedBuildings)) {
            if (count > 0 && BUILDINGS[id]) {
                const production = BUILDINGS[id].production;
                const consumption = BUILDINGS[id].consumption || {};

                let canProduce = true;

                for (const [res, amount] of Object.entries(consumption)) {
                    const required = amount * count;
                    if ((storage.data.resources[res] || 0) < required) {
                        canProduce = false;
                        break;
                    }
                }

                if (canProduce) {
                    for (const [res, amount] of Object.entries(consumption)) {
                        storage.data.resources[res] -= amount * count;
                    }

                    for (const [res, amount] of Object.entries(production)) {
                        totalIncome[res] = (totalIncome[res] || 0) + amount * count;
                    }
                    hasIncome = true;
                }
            }
        }

        if (hasIncome) {
            for (const [res, amount] of Object.entries(totalIncome)) {
                if (amount > 0) {
                    storage.addResource(res, amount);
                }
            }
            this.updateHUD();
        }
    }

    showFloatingText(x, y, message, color = 0xffffff) {
        const shadow = this.add.text(x + 2, y + 2, message, {
            fontFamily: '"Rubik", sans-serif',
            fontSize: '22px',
            fontStyle: 'bold',
            color: '#000000',
            align: 'center'
        }).setOrigin(0.5).setDepth(299).setAlpha(0.6);

        const text = this.add.text(x, y, message, {
            fontFamily: '"Rubik", sans-serif',
            fontSize: '22px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5).setDepth(300);

        text.setTint(color);

        this.tweens.add({
            targets: [text, shadow],
            y: y - 100,
            scale: { from: 0.8, to: 1.2 },
            alpha: 0,
            duration: 1500,
            ease: 'Back.easeOut',
            onComplete: () => {
                text.destroy();
                shadow.destroy();
            }
        });
    }

    showRewardText(amount, resourceType) {
        if (!RESOURCES[resourceType]) return;

        const colors = { tree: 0x4caf50, rock: 0x90a4ae, crystal: 0xe040fb };

        this.showFloatingText(
            this.currentResource.x,
            this.currentResource.y - 40,
            `+${amount} ${RESOURCES[resourceType].icon}`,
            colors[resourceType]
        );
    }
}
