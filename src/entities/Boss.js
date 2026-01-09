import Phaser from 'phaser';

export class Boss extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, config) {
        super(scene, x, y, 'boss');

        this.scene = scene;
        this.config = config;
        this.hp = config.hp;
        this.maxHp = config.hp;
        this.damage = config.damage;
        this.moveSpeed = config.speed;
        this.detectionRange = config.detectionRange;
        this.attackRange = config.attackRange;
        this.dropChance = config.dropChance;
        this.drops = config.drops;
        this.xpReward = config.xpReward;
        this.lastAttackTime = 0;
        this.attackCooldown = 1000;
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
    }

    createHealthBar() {
        this.healthBarBg = this.scene.add.rectangle(0, 0, 40, 6, 0x333333);
        this.healthBarBg.setDepth(51);

        this.healthBar = this.scene.add.rectangle(0, 0, 40, 6, 0xff0000);
        this.healthBar.setDepth(52);
    }

    createNameTag() {
        this.nameTag = this.scene.add.text(0, 0, this.config.icon, {
            fontSize: '16px'
        });
        this.nameTag.setOrigin(0.5);
        this.nameTag.setDepth(53);
    }

    update(player) {
        if (this.isDead) return;

        const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

        if (distance < this.detectionRange) {
            this.isAggro = true;
        }

        if (this.isAggro) {
            if (distance > this.attackRange) {
                const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
                this.setVelocity(
                    Math.cos(angle) * this.moveSpeed,
                    Math.sin(angle) * this.moveSpeed
                );

                this.setFlipX(player.x < this.x);
            } else {
                this.setVelocity(0, 0);
                this.tryAttack(player);
            }
        }

        this.updateUI();
    }

    updateUI() {
        const barY = this.y - 25;
        this.healthBarBg.setPosition(this.x, barY);
        this.healthBar.setPosition(this.x - 20 + (this.hp / this.maxHp * 20), barY);
        this.healthBar.setSize(40 * (this.hp / this.maxHp), 6);

        this.nameTag.setPosition(this.x, this.y - 35);
    }

    tryAttack(player) {
        const now = Date.now();
        if (now - this.lastAttackTime < this.attackCooldown) return;

        this.lastAttackTime = now;

        const storage = window.VoidTycoon?.storage;
        if (storage) {
            // Balance: Reduced energy damage by 40% (User Request)
            const reducedDamage = Math.max(1, Math.floor(this.damage * 0.6));
            storage.data.player.energy = Math.max(0, storage.data.player.energy - reducedDamage);
            storage.save();

            const scene = window.VoidTycoon.game?.scene?.getScene('GameScene');
            scene?.updateHUD();
            scene?.showFloatingText(player.x, player.y - 20, `-${this.damage} ⚡`, 0xff0000);

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

        this.scene.showFloatingText(this.x, this.y - 20, `-${amount}`, 0xffff00);

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        this.isDead = true;
        this.setVelocity(0, 0);

        const storage = window.VoidTycoon?.storage;
        if (storage) {
            storage.addXP(this.xpReward);

            if (Math.random() < this.dropChance) {
                const drop = this.drops[Math.floor(Math.random() * this.drops.length)];
                storage.addResource(drop, 1);

                this.scene.showFloatingText(this.x, this.y, `🗝️ Ключ Измерений!`, 0xffd700);
                window.VoidTycoon.ui?.showNotification('🗝️ Ключ Измерений получен!', 'success');
            }

            storage.data.stats.bossesKilled = (storage.data.stats.bossesKilled || 0) + 1;
            storage.save();

            // Quest system - track kills
            window.VoidTycoon.questManager?.updateProgress('kill', { amount: 1 });
        }

        this.scene.tweens.add({
            targets: [this, this.healthBarBg, this.healthBar, this.nameTag],
            alpha: 0,
            scale: 0,
            duration: 500,
            onComplete: () => {
                this.healthBarBg.destroy();
                this.healthBar.destroy();
                this.nameTag.destroy();
                this.destroy();
            }
        });

        window.VoidTycoon.telegram?.hapticFeedback('success');
    }

    destroy() {
        if (this.healthBarBg) this.healthBarBg.destroy();
        if (this.healthBar) this.healthBar.destroy();
        if (this.nameTag) this.nameTag.destroy();
        super.destroy();
    }
}
