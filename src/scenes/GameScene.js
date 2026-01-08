import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { WorldGenerator } from '../systems/WorldGenerator.js';
import { ResourceManager } from '../systems/ResourceManager.js';
import { TOOLS, RESOURCES, BUILDINGS } from '../data/GameData.js';
import { VirtualJoystick } from '../ui/VirtualJoystick.js';

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
    }

    create() {
        this.cameras.main.setBackgroundColor('#2d5a3d');

        this.groundLayer = this.add.group();
        this.resourcesGroup = this.physics.add.staticGroup();

        this.worldGenerator = new WorldGenerator(this);

        this.resourceManager = new ResourceManager(this);

        this.player = new Player(this, 0, 0);

        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
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
    }

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
    }

    updateHUD() {
        const storage = window.VoidTycoon.storage;
        if (!storage) return;

        const resources = storage.getResources();
        const player = storage.getPlayer();

        document.querySelector('#res-wood .res-count').textContent = resources.wood;
        document.querySelector('#res-iron .res-count').textContent = resources.iron;
        document.querySelector('#res-crystal .res-count').textContent = resources.crystal;

        document.getElementById('player-level').textContent = player.level;

        const xpForNext = storage.getXPForLevel(player.level + 1);
        const xpPercent = (player.xp / xpForNext) * 100;
        document.getElementById('xp-progress').style.width = `${xpPercent}%`;

        const energyPercent = (player.energy / player.maxEnergy) * 100;
        document.getElementById('energy-progress').style.width = `${energyPercent}%`;
        document.getElementById('energy-text').textContent = `${player.energy}/${player.maxEnergy}`;

        if (window.VoidTycoon?.ui?.updateActiveView) {
            window.VoidTycoon.ui.updateActiveView();
        }
    }

    findNearbyResource() {
        const interactionRadius = 60;
        let closest = null;
        let closestDist = interactionRadius;

        this.resourcesGroup.children.iterate((resource) => {
            if (!resource || !resource.active) return;

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

    startGathering(resource) {
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
        const amount = Math.floor(reward.amount * currentTool.efficiency);

        storage.addResource(reward.type, amount);
        storage.addXP(reward.xp);

        window.VoidTycoon.ui?.checkAchievements();
        window.VoidTycoon.ui?.trackQuestProgress('resource', reward.type, amount);

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
        const darkness = Phaser.Math.Clamp(Math.max(0, -cycle * 0.7), 0, 0.7);
        if (this.dayNightOverlay) this.dayNightOverlay.fillAlpha = darkness;

        this.worldGenerator.generateAroundPlayer();

        const nearbyResource = this.findNearbyResource();

        if (nearbyResource && !this.isGathering) {
            this.resourcePrompt.setVisible(true);
            this.resourcePrompt.setPosition(nearbyResource.x, nearbyResource.y - 50);

            const names = { tree: 'Дерево', rock: 'Железо', crystal: 'Кристалл' };
            this.resourcePrompt.setText(`[SPACE] ${names[nearbyResource.resourceType] || 'Ресурс'}`);
        } else if (!this.isGathering) {
            this.resourcePrompt.setVisible(false);
        }

        const isActionBtnDown = this.virtualJoystick?.isActionDown() || false;
        const gatherPressed = this.spaceKey.isDown || isActionBtnDown;

        if (gatherPressed && nearbyResource && !this.isGathering) {
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
