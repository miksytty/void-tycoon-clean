/**
 * ============================================
 * Менеджер ресурсов
 * ============================================
 * Эффекты частиц при добыче
 */

import Phaser from 'phaser';

export class ResourceManager {
    constructor(scene) {
        this.scene = scene;
        this.particleEmitters = {};

        this.setupParticleEmitters();
    }

    /**
     * Настройка эмиттеров частиц
     */
    setupParticleEmitters() {
        // Частицы дерева
        this.particleEmitters.tree = this.scene.add.particles(0, 0, 'particle_wood', {
            speed: { min: 50, max: 150 },
            angle: { min: 220, max: 320 },
            scale: { start: 1, end: 0 },
            lifespan: 600,
            gravityY: 200,
            quantity: 0,
            emitting: false
        }).setDepth(250);

        // Частицы железа
        this.particleEmitters.rock = this.scene.add.particles(0, 0, 'particle_iron', {
            speed: { min: 50, max: 150 },
            angle: { min: 220, max: 320 },
            scale: { start: 1, end: 0 },
            lifespan: 600,
            gravityY: 250,
            quantity: 0,
            emitting: false
        }).setDepth(250);

        // Частицы кристалла
        this.particleEmitters.crystal = this.scene.add.particles(0, 0, 'particle_crystal', {
            speed: { min: 80, max: 180 },
            angle: { min: 0, max: 360 },
            scale: { start: 1.2, end: 0 },
            lifespan: 800,
            gravityY: 100,
            quantity: 0,
            emitting: false,
            tint: [0xab47bc, 0xce93d8, 0x9c27b0]
        }).setDepth(250);

        // Частицы пыли (ходьба)
        // Check if particle_wood exists, or generic particle
        const dustTexture = 'particle'; // Default white square from BootScene
        this.particleEmitters.dust = this.scene.add.particles(0, 0, dustTexture, {
            speed: { min: 10, max: 30 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 0.5, end: 0 },
            lifespan: 400,
            quantity: 0,
            emitting: false,
            tint: 0xcccccc
        }).setDepth(10); // Under player
    }

    createDust(x, y) {
        if (this.particleEmitters.dust) {
            this.particleEmitters.dust.emitParticleAt(x, y, 1);
        }
    }

    /**
     * Создание эффекта частиц при добыче
     */
    createParticleEffect(x, y, resourceType) {
        const emitter = this.particleEmitters[resourceType];

        if (emitter) {
            emitter.setPosition(x, y);
            emitter.explode(15);
        }
    }

    /**
     * Воспроизведение звука добычи (если есть звуки)
     */
    playGatherSound(resourceType) {
        // Звуки можно добавить позже
        // this.scene.sound.play(`gather_${resourceType}`);
    }
}
