import Phaser from 'phaser';

export class Boss extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, config) {
        // Use configured texture or default 'boss' (or fallback to color-tinted logic if texture missing)
        super(scene, x, y, config.texture || 'boss');

        this.scene = scene;
        this.config = config;
        this.isBoss = !!config.isBoss; // Flag to distinguish boss from mob

        this.hp = config.hp;
        this.maxHp = config.hp;
        this.damage = config.damage;
        this.moveSpeed = config.speed;
        this.detectionRange = config.detectionRange;
        this.attackRange = config.attackRange;
        this.dropChance = config.dropChance;
        this.drops = config.drops;
        this.xpReward = config.xpReward;
        this.crystalDropMin = config.crystalDropMin || 20;
        this.crystalDropMax = config.crystalDropMax || 50;

        // Hit & Run mechanics
        this.lastAttackTime = 0;
        this.attackCooldown = 3000; // 3 seconds between attacks
        this.isWindingUp = false;
        this.windUpDuration = 800; // 0.8 second wind-up
        this.isAggro = false;
        this.isDead = false;

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setTint(config.color);
        this.setScale(config.size);
        this.setDepth(50);

        this.body.setSize(24, 24);
        this.body.setOffset(4, 4);

        this.createHealthBar();
        this.createNameTag();
        this.createWindUpIndicator();
    }

    createHealthBar() {
        // Bigger health bar for boss
        this.healthBarBg = this.scene.add.rectangle(0, 0, 60, 8, 0x333333);
        this.healthBarBg.setDepth(51);
        this.healthBarBg.setStrokeStyle(1, 0x000000);

        this.healthBar = this.scene.add.rectangle(0, 0, 60, 8, 0xff0000);
        this.healthBar.setDepth(52);
    }

    createNameTag() {
        this.nameTag = this.scene.add.text(0, 0, `${this.config.icon} ${this.config.name}`, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ff4444',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.nameTag.setOrigin(0.5);
        this.nameTag.setDepth(53);
    }

    createWindUpIndicator() {
        // Visual indicator for attack wind-up
        this.windUpCircle = this.scene.add.circle(0, 0, 40, 0xff0000, 0);
        this.windUpCircle.setDepth(49);
        this.windUpCircle.setStrokeStyle(3, 0xff0000, 0);
    }

    update(player) {
        if (this.isDead) return;

        const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

        // Screen darkening effect when close
        this.updateScreenDarkness(distance);

        if (distance < this.detectionRange) {
            this.isAggro = true;
        }

        if (this.isAggro && !this.isWindingUp) {
            if (distance > this.attackRange) {
                // Chase player
                const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
                this.setVelocity(
                    Math.cos(angle) * this.moveSpeed,
                    Math.sin(angle) * this.moveSpeed
                );
                this.setFlipX(player.x < this.x);
            } else {
                // In attack range - try Hit & Run attack
                this.setVelocity(0, 0);
                this.tryAttack(player);
            }
        }

        this.updateUI();
    }

    updateScreenDarkness(distance) {
        if (!this.isBoss) return; // Optimization: Mobs don't have aura
        // Create darkness overlay if not exists
        if (!this.darknessOverlay) {
            this.darknessOverlay = this.scene.add.rectangle(
                this.scene.cameras.main.scrollX + this.scene.cameras.main.width / 2,
                this.scene.cameras.main.scrollY + this.scene.cameras.main.height / 2,
                this.scene.cameras.main.width * 2,
                this.scene.cameras.main.height * 2,
                0x000000,
                0
            );
            this.darknessOverlay.setDepth(100);
            this.darknessOverlay.setScrollFactor(0);
        }

        // Darken screen when close
        const maxDarkness = 0.3;
        const darkDistance = 200;

        if (distance < darkDistance) {
            const alpha = (1 - distance / darkDistance) * maxDarkness;
            this.darknessOverlay.setAlpha(alpha);
        } else {
            this.darknessOverlay.setAlpha(0);
        }
    }

    updateUI() {
        const barY = this.y - 35;
        this.healthBarBg.setPosition(this.x, barY);

        const healthPercent = this.hp / this.maxHp;
        this.healthBar.setPosition(this.x - 30 + (healthPercent * 30), barY);
        this.healthBar.setSize(60 * healthPercent, 8);

        this.nameTag.setPosition(this.x, this.y - 50);

        // Update wind-up circle position
        this.windUpCircle.setPosition(this.x, this.y);
    }

    tryAttack(player) {
        const now = Date.now();
        if (now - this.lastAttackTime < this.attackCooldown) return;

        this.lastAttackTime = now;
        this.isWindingUp = true;

        // Show wind-up warning
        this.showWindUpWarning();

        // After wind-up, execute attack
        this.scene.time.delayedCall(this.windUpDuration, () => {
            if (this.isDead) return;

            this.isWindingUp = false;
            this.executeAttack(player);
        });
    }

    showWindUpWarning() {
        // Flash the boss red
        this.scene.tweens.add({
            targets: this,
            scaleX: this.config.size * 1.3,
            scaleY: this.config.size * 1.3,
            duration: 200,
            yoyo: true,
            repeat: 1
        });

        // Expanding danger circle
        this.windUpCircle.setAlpha(0.3);
        this.windUpCircle.setStrokeStyle(3, 0xff0000, 1);

        this.scene.tweens.add({
            targets: this.windUpCircle,
            radius: 60,
            alpha: 0,
            duration: this.windUpDuration,
            onComplete: () => {
                this.windUpCircle.setRadius(40);
            }
        });

        // Warning text
        const warningText = this.scene.add.text(this.x, this.y - 70, '⚠️ АТАКА!', {
            fontSize: '16px',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(200);

        this.scene.tweens.add({
            targets: warningText,
            y: this.y - 90,
            alpha: 0,
            duration: this.windUpDuration,
            onComplete: () => warningText.destroy()
        });
    }

    executeAttack(player) {
        const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

        // Player successfully dodged if they moved away
        if (distance > this.attackRange + 20) {
            this.scene.showFloatingText(player.x, player.y - 40, 'DODGE!', 0x00ff00);
            return;
        }

        const storage = window.VoidTycoon?.storage;
        if (storage) {
            const reducedDamage = Math.max(1, Math.floor(this.damage * 0.6));
            storage.data.player.energy = Math.max(0, storage.data.player.energy - reducedDamage);
            storage.save();

            const scene = window.VoidTycoon.game?.scene?.getScene('GameScene');
            scene?.updateHUD();
            scene?.showFloatingText(player.x, player.y - 20, `-${this.damage} ⚡`, 0xff0000);

            // Camera shake on hit
            this.scene.cameras.main.shake(200, 0.01);
            window.VoidTycoon.telegram?.hapticFeedback('heavy');
        }
    }

    takeDamage(amount) {
        if (this.isDead) return;

        this.hp -= amount;

        this.scene.tweens.add({
            targets: this,
            alpha: 0.5,
            duration: 100,
            yoyo: true
        });

        this.scene.showFloatingText(this.x, this.y - 20, `-${Math.floor(amount)}`, 0xffff00);

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        this.isDead = true;
        this.setVelocity(0, 0);

        // Remove darkness overlay
        if (this.darknessOverlay) {
            this.darknessOverlay.destroy();
        }

        const storage = window.VoidTycoon?.storage;
        if (storage) {
            // Grant XP (5x normal mob XP)
            storage.addXP(this.xpReward);

            // Crystal drop (20-50)
            const crystalAmount = Phaser.Math.Between(this.crystalDropMin, this.crystalDropMax);
            storage.addResource('crystal', crystalAmount);

            // Loot fountain effect
            this.createLootFountain(crystalAmount);

            // Chance for Void Key (20%)
            if (Math.random() < this.dropChance) {
                const drop = this.drops[Math.floor(Math.random() * this.drops.length)];
                storage.addResource(drop, 1);

                this.scene.time.delayedCall(500, () => {
                    this.scene.showFloatingText(this.x, this.y - 40, '🗝️ Ключ Пустоты!', 0xffd700);
                    window.VoidTycoon.ui?.showNotification('🗝️ Ключ Пустоты получен!', 'success');
                });
            }

            storage.data.stats.bossesKilled = (storage.data.stats.bossesKilled || 0) + 1;
            storage.save();

            // Quest system - track kills and boss kills
            window.VoidTycoon.questManager?.updateProgress('kill', { amount: 1 });
            window.VoidTycoon.questManager?.updateProgress('boss_kill', { amount: 1 });
        }

        // Victory notification
        window.VoidTycoon.ui?.showNotification(`💀 ${this.config.name} повержен! +${this.xpReward} XP`, 'success');

        // Death animation
        this.scene.tweens.add({
            targets: [this, this.healthBarBg, this.healthBar, this.nameTag],
            alpha: 0,
            scale: 0,
            angle: 360,
            duration: 800,
            ease: 'Back.easeIn',
            onComplete: () => {
                this.healthBarBg.destroy();
                this.healthBar.destroy();
                this.nameTag.destroy();
                this.windUpCircle.destroy();
                this.destroy();
            }
        });

        window.VoidTycoon.telegram?.hapticFeedback('success');
        window.VoidTycoon.sound?.playLevelUp();
    }

    createLootFountain(crystalAmount) {
        // Create particle fountain for loot
        const particleCount = Math.min(crystalAmount, 20);

        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = Phaser.Math.Between(100, 200);
            const delay = i * 30;

            this.scene.time.delayedCall(delay, () => {
                // Create crystal particle
                const particle = this.scene.add.text(this.x, this.y, '💎', {
                    fontSize: '20px'
                }).setDepth(200);

                // Fountain trajectory
                this.scene.tweens.add({
                    targets: particle,
                    x: this.x + Math.cos(angle) * speed,
                    y: this.y - 80,
                    duration: 300,
                    ease: 'Quad.easeOut',
                    onComplete: () => {
                        // Fall down
                        this.scene.tweens.add({
                            targets: particle,
                            y: this.y + 20,
                            alpha: 0,
                            duration: 400,
                            ease: 'Quad.easeIn',
                            onComplete: () => particle.destroy()
                        });
                    }
                });
            });
        }

        // Big crystal amount text
        this.scene.time.delayedCall(300, () => {
            this.scene.showFloatingText(this.x, this.y - 60, `+${crystalAmount} 💎`, 0x9c27b0);
        });
    }

    destroy() {
        if (this.healthBarBg) this.healthBarBg.destroy();
        if (this.healthBar) this.healthBar.destroy();
        if (this.nameTag) this.nameTag.destroy();
        if (this.windUpCircle) this.windUpCircle.destroy();
        if (this.darknessOverlay) this.darknessOverlay.destroy();
        super.destroy();
    }
}
