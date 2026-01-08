import Phaser from 'phaser';

export class Turret extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, level = 1) {
        super(scene, x, y, 'turret'); // We might need to generate a texture for 'turret'

        this.level = level;
        this.range = 200 + (level * 20);
        this.damage = 10 + (level * 5);
        this.fireRate = Math.max(200, 1000 - (level * 50));
        this.lastFired = 0;

        scene.add.existing(this);
        scene.physics.add.existing(this, true); // Static body

        // Visual setup if no texture
        if (!scene.textures.exists('turret')) {
            const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
            graphics.lineStyle(2, 0xff0000); // Red outline
            graphics.fillStyle(0x333333); // Dark body
            graphics.fillRect(0, 0, 32, 32);
            graphics.fillStyle(0x00ff00); // Green dot (sensor)
            graphics.fillCircle(16, 16, 5);
            graphics.generateTexture('turret', 32, 32);
        }
        this.setTexture('turret');
        this.setDepth(90); // Below player
    }

    update(time, enemies) {
        if (time > this.lastFired + this.fireRate) {
            const target = this.findTarget(enemies);
            if (target) {
                this.fire(target);
                this.lastFired = time;
            }
        }
    }

    findTarget(enemies) {
        let closest = null;
        let closestDist = this.range;

        for (const enemy of enemies) {
            if (!enemy.active || enemy.isDead) continue;

            const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
            if (dist < closestDist) {
                closest = enemy;
                closestDist = dist;
            }
        }
        return closest;
    }

    fire(target) {
        // Visual line
        const graphics = this.scene.add.graphics();
        graphics.lineStyle(2, 0xffff00, 1);
        graphics.beginPath();
        graphics.moveTo(this.x, this.y);
        graphics.lineTo(target.x, target.y);
        graphics.strokePath();

        this.scene.tweens.add({
            targets: graphics,
            alpha: 0,
            duration: 100,
            onComplete: () => graphics.destroy()
        });

        // Damage logic
        if (target.takeDamage) {
            target.takeDamage(this.damage);
            // Floating text for turret damage
            if (this.scene.showFloatingText) {
                this.scene.showFloatingText(target.x, target.y - 20, `-${this.damage}`, 0xffff00);
            }
        }
    }
}
