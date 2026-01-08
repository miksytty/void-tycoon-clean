/**
 * ============================================
 * Сущность игрока
 * ============================================
 * Управление, анимация, физика
 */

import Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player', 0);

        // Добавляем в сцену и физику
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Настройки
        this.speed = 180;
        this.setCollideWorldBounds(false); // Бесконечный мир
        this.setDepth(100);

        // Размер коллайдера
        this.body.setSize(20, 24);
        this.body.setOffset(6, 8);

        // Создание анимации
        this.createAnimations();

        // Направление взгляда
        this.facing = 'down';
        this.isMoving = false;
    }

    /**
     * Создание анимаций
     */
    createAnimations() {
        // Анимация ходьбы
        if (!this.scene.anims.exists('walk')) {
            this.scene.anims.create({
                key: 'walk',
                frames: this.scene.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
                frameRate: 10,
                repeat: -1
            });
        }

        // Анимация idle
        if (!this.scene.anims.exists('idle')) {
            this.scene.anims.create({
                key: 'idle',
                frames: [{ key: 'player', frame: 0 }],
                frameRate: 1
            });
        }
    }

    /**
     * Обновление игрока
     */
    update(cursors, wasd, joystick) {
        let vx = 0;
        let vy = 0;

        // Клавиатура
        if (cursors.left.isDown || wasd.A.isDown) vx = -1;
        else if (cursors.right.isDown || wasd.D.isDown) vx = 1;

        if (cursors.up.isDown || wasd.W.isDown) vy = -1;
        else if (cursors.down.isDown || wasd.S.isDown) vy = 1;

        // Джойстик (приоритет)
        if (joystick && joystick.active) {
            if (Math.abs(joystick.x) > 0.2) vx = joystick.x;
            if (Math.abs(joystick.y) > 0.2) vy = joystick.y;
        }

        // Нормализация диагонального движения
        if (vx !== 0 && vy !== 0) {
            const len = Math.sqrt(vx * vx + vy * vy);
            vx /= len;
            vy /= len;
        }

        // Применение скорости
        this.setVelocity(vx * this.speed, vy * this.speed);

        // Анимация
        this.isMoving = vx !== 0 || vy !== 0;

        if (this.isMoving) {
            this.play('walk', true);

            // Отражение спрайта по X
            if (vx < 0) this.setFlipX(true);
            else if (vx > 0) this.setFlipX(false);
        } else {
            this.play('idle', true);
        }
    }
}
