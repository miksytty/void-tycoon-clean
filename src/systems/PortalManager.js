/**
 * ============================================
 * Portal Manager - Система Портала и Престижа
 * ============================================
 */

export const PORTAL_COSTS = {
    stage1: { wood: 1000, iron: 500, crystal: 50 },      // 0% -> 25%
    stage2: { wood: 1500, iron: 1000, crystal: 100 },    // 25% -> 50%
    stage3: { wood: 1500, iron: 1000, crystal: 150, dimension_key: 1 }, // 50% -> 75%
    stage4: { wood: 1000, iron: 500, crystal: 200, dimension_key: 2 }   // 75% -> 100%
};

export const PORTAL_STAGES = ['foundation', 'frame', 'power_core', 'activation', 'complete'];

export class PortalManager {
    constructor(scene) {
        this.scene = scene;
        this.portalSprite = null;
        this.portalStage = 0; // 0-4 (0=not built, 4=100%)
        this.portalX = 0;
        this.portalY = -200; // Slightly north of spawn
        this.glowEffect = null;
    }

    init() {
        const storage = window.VoidTycoon.storage;
        this.portalStage = storage.data.portalStage || 0;

        if (this.portalStage > 0) {
            this.createPortalVisual();
        }
    }

    createPortalVisual() {
        // Remove existing portal if any
        if (this.portalSprite) {
            this.portalSprite.destroy();
        }
        if (this.glowEffect) {
            this.glowEffect.destroy();
        }

        const stage = this.portalStage;

        // Create portal sprite based on stage
        this.portalSprite = this.scene.add.container(this.portalX, this.portalY);
        this.portalSprite.setDepth(this.portalY);

        // Base platform
        const base = this.scene.add.rectangle(0, 20, 96, 20, 0x4a148c);
        this.portalSprite.add(base);

        if (stage >= 1) {
            // Stage 1: Foundation - stone pillars
            const pillarL = this.scene.add.rectangle(-35, -20, 12, 80, 0x5d4037);
            const pillarR = this.scene.add.rectangle(35, -20, 12, 80, 0x5d4037);
            this.portalSprite.add([pillarL, pillarR]);
        }

        if (stage >= 2) {
            // Stage 2: Frame - arch on top
            const arch = this.scene.add.arc(0, -60, 40, 180, 360, false, 0x7c4dff);
            arch.setStrokeStyle(8, 0x4a148c);
            this.portalSprite.add(arch);
        }

        if (stage >= 3) {
            // Stage 3: Power Core - glowing center
            const core = this.scene.add.circle(0, -30, 25, 0x9c27b0, 0.7);
            this.portalSprite.add(core);

            // Pulsing animation
            this.scene.tweens.add({
                targets: core,
                scaleX: 1.2,
                scaleY: 1.2,
                alpha: 0.5,
                duration: 1000,
                yoyo: true,
                repeat: -1
            });
        }

        if (stage >= 4) {
            // Stage 4: Complete - active portal with particles
            const portalCenter = this.scene.add.circle(0, -30, 30, 0xea80fc, 0.9);
            this.portalSprite.add(portalCenter);

            // Swirling effect
            this.scene.tweens.add({
                targets: portalCenter,
                angle: 360,
                duration: 3000,
                repeat: -1
            });

            // Glow effect
            this.glowEffect = this.scene.add.circle(this.portalX, this.portalY - 30, 50, 0xea80fc, 0.3);
            this.glowEffect.setDepth(this.portalY - 1);

            this.scene.tweens.add({
                targets: this.glowEffect,
                scaleX: 1.5,
                scaleY: 1.5,
                alpha: 0.1,
                duration: 1500,
                yoyo: true,
                repeat: -1
            });

            // "Enter Portal" text
            const enterText = this.scene.add.text(0, 40, '✨ Готов!', {
                fontSize: '14px',
                color: '#ffd700',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);
            this.portalSprite.add(enterText);
        }

        // Stage label
        const stagePercent = stage * 25;
        if (stage < 4) {
            const label = this.scene.add.text(0, 50, `${stagePercent}%`, {
                fontSize: '12px',
                color: '#aaa',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);
            this.portalSprite.add(label);
        }

        // Make portal interactive
        const hitArea = this.scene.add.rectangle(this.portalX, this.portalY, 100, 100, 0x000000, 0);
        hitArea.setInteractive();
        hitArea.on('pointerdown', () => this.onPortalClick());
    }

    onPortalClick() {
        if (this.portalStage >= 4) {
            this.showEnterPortalModal();
        } else {
            this.showUpgradeModal();
        }
    }

    canUpgrade() {
        const storage = window.VoidTycoon.storage;
        const nextStage = this.portalStage + 1;
        const costs = PORTAL_COSTS[`stage${nextStage}`];

        if (!costs) return false;

        for (const [res, amount] of Object.entries(costs)) {
            if ((storage.data.resources[res] || 0) < amount) {
                return false;
            }
        }
        return true;
    }

    upgradePortal() {
        if (!this.canUpgrade()) return false;

        const storage = window.VoidTycoon.storage;
        const nextStage = this.portalStage + 1;
        const costs = PORTAL_COSTS[`stage${nextStage}`];

        // Deduct resources
        for (const [res, amount] of Object.entries(costs)) {
            storage.data.resources[res] -= amount;
        }

        this.portalStage = nextStage;
        storage.data.portalStage = this.portalStage;
        storage.save();

        // Recreate visual
        this.createPortalVisual();

        // Notification
        const stagePercent = this.portalStage * 25;
        window.VoidTycoon.ui?.showNotification(`🌀 Портал улучшен до ${stagePercent}%!`, 'success');
        window.VoidTycoon.telegram?.hapticFeedback('success');

        // Quest progress
        if (this.portalStage === 4) {
            window.VoidTycoon.questManager?.updateProgress('portal_complete', { amount: 1 });
        }

        return true;
    }

    showUpgradeModal() {
        const storage = window.VoidTycoon.storage;
        const nextStage = this.portalStage + 1;
        const costs = PORTAL_COSTS[`stage${nextStage}`];

        if (!costs) return;

        const RESOURCE_ICONS = {
            wood: '🪵', iron: '🔩', crystal: '💎', dimension_key: '🗝️'
        };

        const costsHtml = Object.entries(costs).map(([res, amount]) => {
            const have = storage.data.resources[res] || 0;
            const enough = have >= amount;
            return `
                <div style="display:flex; justify-content:space-between; margin:5px 0;">
                    <span>${RESOURCE_ICONS[res] || '📦'} ${res}</span>
                    <span style="color:${enough ? '#4cd137' : '#ff4757'}">${have}/${amount}</span>
                </div>
            `;
        }).join('');

        const stagePercent = this.portalStage * 25;
        const nextPercent = nextStage * 25;
        const canUpgrade = this.canUpgrade();

        const overlay = document.createElement('div');
        overlay.id = 'portal-upgrade-modal';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); z-index: 9999;
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            color: white;
        `;

        overlay.innerHTML = `
            <div style="width:90%; max-width:350px; background:rgba(76,29,149,0.9); border-radius:15px; padding:20px;">
                <div style="text-align:center; margin-bottom:15px;">
                    <span style="font-size:3rem;">🌀</span>
                    <h2 style="margin:10px 0; color:#ea80fc;">Портал Измерений</h2>
                    <p style="color:#aaa;">Улучшение: ${stagePercent}% → ${nextPercent}%</p>
                </div>
                
                <div style="background:rgba(0,0,0,0.3); border-radius:10px; padding:15px; margin-bottom:15px;">
                    <div style="font-size:0.9rem; color:#888; margin-bottom:10px;">Требуется:</div>
                    ${costsHtml}
                </div>

                <div style="display:flex; gap:10px;">
                    <button id="portal-cancel" style="flex:1; padding:12px; background:#555; border:none; border-radius:8px; color:white; cursor:pointer;">
                        Отмена
                    </button>
                    <button id="portal-upgrade" style="flex:1; padding:12px; background:${canUpgrade ? 'linear-gradient(45deg, #9c27b0, #7c4dff)' : '#333'}; border:none; border-radius:8px; color:white; cursor:pointer;" ${canUpgrade ? '' : 'disabled'}>
                        ⬆️ Улучшить
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        document.getElementById('portal-cancel').addEventListener('click', () => overlay.remove());
        document.getElementById('portal-upgrade').addEventListener('click', () => {
            if (this.upgradePortal()) {
                overlay.remove();
            }
        });
    }

    showEnterPortalModal() {
        const storage = window.VoidTycoon.storage;
        const stats = storage.data.stats;
        const player = storage.data.player;
        const currentPrestige = player.prestigeLevel || 0;
        const nextPrestige = currentPrestige + 1;
        const currentMult = player.prestigeMultiplier || 1;
        const nextMult = 1 + (nextPrestige * 0.5); // +50% per prestige

        const overlay = document.createElement('div');
        overlay.id = 'portal-enter-modal';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.95); z-index: 9999;
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            color: white;
        `;

        overlay.innerHTML = `
            <div style="width:90%; max-width:400px; text-align:center;">
                <div style="font-size:4rem; margin-bottom:20px;">🌌</div>
                <h1 style="color:#ea80fc; margin-bottom:10px;">Покинуть Пустоту?</h1>
                <p style="color:#888; margin-bottom:30px;">Твоё путешествие завершено. Но Пустота зовёт снова...</p>

                <div style="background:rgba(255,255,255,0.1); border-radius:15px; padding:20px; margin-bottom:20px; text-align:left;">
                    <h3 style="color:#ffd700; margin-bottom:15px;">📊 Итоги экспедиции:</h3>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:0.9rem;">
                        <div>🎖️ Уровень: <span style="color:#4cd137">${player.level}</span></div>
                        <div>⚔️ Боссов убито: <span style="color:#4cd137">${stats.bossesKilled || 0}</span></div>
                        <div>📦 Ресурсов собрано: <span style="color:#4cd137">${stats.totalResourcesGathered || 0}</span></div>
                        <div>🏗️ Построек: <span style="color:#4cd137">${(storage.data.placedBuildings || []).length}</span></div>
                    </div>
                </div>

                <div style="background:rgba(156,39,176,0.3); border-radius:15px; padding:20px; margin-bottom:30px;">
                    <h3 style="color:#ea80fc; margin-bottom:10px;">✨ Void Power</h3>
                    <p style="font-size:0.9rem; color:#aaa; margin-bottom:10px;">
                        Престиж ${currentPrestige} → ${nextPrestige}
                    </p>
                    <p style="font-size:1.2rem; color:#ffd700;">
                        Множитель: x${currentMult.toFixed(1)} → <span style="color:#4cd137">x${nextMult.toFixed(1)}</span>
                    </p>
                    <p style="font-size:0.8rem; color:#888; margin-top:10px;">
                        +50% к добыче ресурсов навсегда!
                    </p>
                </div>

                <div style="background:rgba(255,0,0,0.2); border-radius:10px; padding:15px; margin-bottom:20px;">
                    <p style="color:#ff6b6b; font-size:0.85rem;">
                        ⚠️ Ресурсы и постройки будут сброшены.<br>
                        Навыки и достижения сохранятся.
                    </p>
                </div>

                <div style="display:flex; gap:10px;">
                    <button id="portal-stay" style="flex:1; padding:15px; background:#555; border:none; border-radius:10px; color:white; cursor:pointer; font-size:1rem;">
                        Остаться
                    </button>
                    <button id="portal-enter" style="flex:1; padding:15px; background:linear-gradient(45deg, #9c27b0, #ea80fc); border:none; border-radius:10px; color:white; cursor:pointer; font-size:1rem; font-weight:bold;">
                        🌌 Войти в Портал
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        document.getElementById('portal-stay').addEventListener('click', () => overlay.remove());
        document.getElementById('portal-enter').addEventListener('click', () => {
            this.performPrestige();
            overlay.remove();
        });
    }

    performPrestige() {
        const storage = window.VoidTycoon.storage;
        const player = storage.data.player;

        // Increase prestige
        player.prestigeLevel = (player.prestigeLevel || 0) + 1;
        player.prestigeMultiplier = 1 + (player.prestigeLevel * 0.5);

        // Reset resources
        storage.data.resources = {
            wood: 0, hardwood: 0, iron: 0, steel: 0,
            crystal: 0, chip: 0, quantum: 0, dimension_key: 0
        };

        // Reset buildings
        storage.data.placedBuildings = [];
        storage.data.buildings = {
            lumber_mill: 0, quarry: 0, crystal_mine: 0,
            factory: 0, lab: 0, portal: 0, turret: 0
        };

        // Reset portal
        storage.data.portalStage = 0;
        this.portalStage = 0;

        // Reset player level but keep XP formula benefits
        player.level = 1;
        player.xp = 0;
        player.energy = player.maxEnergy; // Keep max energy earned

        // Keep skills, achievements
        // Keep stats for history

        storage.save();

        // Show prestige celebration
        this.showPrestigeCelebration(player.prestigeLevel, player.prestigeMultiplier);

        // Refresh game
        setTimeout(() => {
            window.location.reload();
        }, 3000);
    }

    showPrestigeCelebration(level, mult) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(45deg, #1a0033, #4a148c); z-index: 99999;
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            color: white; animation: fadeIn 0.5s;
        `;

        overlay.innerHTML = `
            <div style="text-align:center; animation: scaleIn 0.5s;">
                <div style="font-size:6rem; margin-bottom:20px;">🌌</div>
                <h1 style="font-size:2.5rem; color:#ffd700; margin-bottom:10px;">ПРЕСТИЖ ${level}!</h1>
                <p style="font-size:1.5rem; color:#ea80fc;">Void Power: x${mult.toFixed(1)}</p>
                <p style="color:#888; margin-top:30px;">Перезагрузка...</p>
            </div>
        `;

        document.body.appendChild(overlay);

        window.VoidTycoon.telegram?.hapticFeedback('success');
        window.VoidTycoon.audio?.playSFX('levelup');
    }

    // Check if player can see portal (level 10+)
    canSeePortal() {
        const storage = window.VoidTycoon.storage;
        return storage.data.player.level >= 10 || this.portalStage > 0;
    }

    // Start building portal from scratch
    startPortal() {
        if (this.portalStage === 0) {
            this.portalStage = 0;
            this.createPortalVisual();
            window.VoidTycoon.ui?.showNotification('🌀 Место для Портала отмечено!', 'info');
        }
    }
}
