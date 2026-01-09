/**
 * ============================================
 * Boot Scene - PIXEL ART ENGINE (FIXED)
 * ============================================
 * Reliable textured generation using Phaser Graphics
 */

import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // All assets are generated procedurally!
    }

    create() {
        try {
            console.log("🎨 Starting Asset Generation...");
            this.generateTextures();
            console.log("✅ Assets Generated. Starting Game...");
            this.scene.start('GameScene');
        } catch (e) {
            console.error("🔥 Asset Generation Failed:", e);
        }
    }

    generateTextures() {
        this.createPlayerTexture();
        this.createTreeTexture();
        this.createRockTexture();
        this.createCrystalTexture();
        this.createGroundTextures();
        this.createWastelandTexture();
        this.createCrystalGroundTexture();
        this.createParticleTextures();
        this.createBossTexture();
        this.createBuildingTextures();
        this.createMobTextures(); // NEW mob sprites
    }

    // ... existing methods ...

    createWastelandTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // Base - dark, dry earth
        g.fillStyle(0x3e2723);
        g.fillRect(0, 0, 32, 32);

        // Cracks
        g.lineStyle(1, 0x1a1a1a, 0.5);
        g.beginPath();
        g.moveTo(5, 5); g.lineTo(10, 15); g.lineTo(5, 25);
        g.moveTo(20, 5); g.lineTo(25, 12);
        g.moveTo(15, 25); g.lineTo(25, 20);
        g.strokePath();

        // Dark patches
        g.fillStyle(0x2d1b18);
        g.fillRect(8, 8, 4, 4);
        g.fillRect(22, 20, 6, 2);

        g.generateTexture('tile_wasteland', 32, 32);
    }

    createCrystalGroundTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // Base - dark purple ground
        g.fillStyle(0x2a0e36);
        g.fillRect(0, 0, 32, 32);

        // Shimmering specks
        g.fillStyle(0x9c27b0);
        g.fillRect(5, 10, 2, 2);
        g.fillRect(25, 5, 2, 2);
        g.fillRect(15, 25, 2, 2);

        // Light lines
        g.lineStyle(1, 0x7b1fa2, 0.3);
        g.strokeRect(10, 10, 12, 12);

        g.generateTexture('tile_crystal', 32, 32);
    }


    createPlayerTexture() {
        const frameWidth = 32;
        const frameHeight = 32;
        const textureWidth = frameWidth * 4; // 4 frames

        // Create a graphics object that doesn't render to screen automatically
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        for (let i = 0; i < 4; i++) {
            const ox = i * frameWidth;
            const bounce = (i % 2 === 1) ? -1 : 0; // Bounce up on walk frames

            // --- FRAME DRAWING ---

            // Legs Animation logic
            let leftLegY = 26;
            let rightLegY = 26;

            if (i === 1) { // Left step
                leftLegY -= 1;
                rightLegY += 1;
            } else if (i === 3) { // Right step
                leftLegY += 1;
                rightLegY -= 1;
            }

            // Legs
            g.fillStyle(0x2d3436);
            g.fillRect(ox + 10, leftLegY, 4, 6);
            g.fillRect(ox + 18, rightLegY, 4, 6);

            // Body (Tunic)
            g.fillStyle(0x6c5ce7);
            g.fillRect(ox + 8, 12 + bounce, 16, 14);

            // Belt
            g.fillStyle(0xffd700);
            g.fillRect(ox + 8, 20 + bounce, 16, 2);

            // Head
            g.fillStyle(0xffccaa);
            g.fillRect(ox + 10, 4 + bounce, 12, 10);

            // Hood/Hair
            g.fillStyle(0x512da8);
            g.fillRect(ox + 10, 2 + bounce, 12, 4);  // Top
            g.fillRect(ox + 8, 4 + bounce, 2, 8);    // Left side
            g.fillRect(ox + 22, 4 + bounce, 2, 8);   // Right side

            // Eyes
            g.fillStyle(0x000000);
            g.fillRect(ox + 14, 8 + bounce, 2, 2);
            g.fillRect(ox + 18, 8 + bounce, 2, 2);
        }

        g.generateTexture('player', textureWidth, frameHeight);
        g.destroy(); // Clean up graphics

        // Manually slice the texture into frames for animation
        const texture = this.textures.get('player');
        if (texture) {
            // Frame 0: Idle
            texture.add(0, 0, 0, 0, frameWidth, frameHeight);
            // Frame 1: Walk 1
            texture.add(1, 0, 32, 0, frameWidth, frameHeight);
            // Frame 2: Idle (Repeated for loop)
            texture.add(2, 0, 64, 0, frameWidth, frameHeight);
            // Frame 3: Walk 2
            texture.add(3, 0, 96, 0, frameWidth, frameHeight);
        }
    }

    createTreeTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // Trunk
        g.fillStyle(0x5d4037);
        g.fillRect(26, 40, 12, 24);

        // Leaves (Pixelated Circles)
        g.fillStyle(0x2e7d32);
        g.fillRect(16, 20, 32, 32); // Base
        g.fillRect(20, 10, 24, 12); // Top
        g.fillRect(10, 24, 8, 20); // Left
        g.fillRect(46, 24, 8, 20); // Right

        // Highlights
        g.fillStyle(0x4caf50);
        g.fillRect(20, 20, 10, 10);
        g.fillRect(40, 30, 8, 8);

        // Fruits
        g.fillStyle(0xff5252);
        g.fillRect(20, 30, 4, 4);
        g.fillRect(35, 15, 4, 4);
        g.fillRect(40, 40, 4, 4);

        g.generateTexture('tree', 64, 64);
    }

    createRockTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // Base
        g.fillStyle(0x37474f);
        g.fillRect(10, 20, 44, 34);
        g.fillRect(20, 10, 24, 10);

        // Highlights (3D effect)
        g.fillStyle(0x546e7a); // Light side
        g.fillRect(14, 24, 10, 10);
        g.fillRect(24, 14, 10, 10);
        g.fillRect(20, 40, 10, 10);

        // Ore Veins
        g.fillStyle(0xffb74d);
        g.fillRect(30, 30, 8, 4);
        g.fillRect(40, 25, 4, 8);
        g.fillRect(15, 35, 6, 2);

        g.generateTexture('rock', 64, 64);
    }

    createCrystalTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // Main Cluster
        g.fillStyle(0x7b1fa2);
        g.beginPath();
        g.moveTo(24, 10);
        g.lineTo(34, 30);
        g.lineTo(24, 54);
        g.lineTo(14, 30);
        g.closePath();
        g.fillPath();

        // Side Shard
        g.fillStyle(0x4a148c);
        g.beginPath();
        g.moveTo(14, 35);
        g.lineTo(8, 25);
        g.lineTo(18, 45);
        g.closePath();
        g.fillPath();

        // Shine
        g.fillStyle(0xe040fb);
        g.fillRect(22, 15, 4, 10);
        g.fillRect(24, 30, 2, 10);

        g.generateTexture('crystal', 48, 64);
    }

    createGroundTextures() {
        // Grass Tile
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x66bb6a);
        g.fillRect(0, 0, 32, 32);

        // Detail
        g.fillStyle(0x81c784);
        g.fillRect(4, 4, 2, 2);
        g.fillRect(20, 15, 2, 2);
        g.fillRect(12, 26, 2, 2);

        g.generateTexture('tile_grass_light', 32, 32);

        // Darker
        g.fillStyle(0x43a047);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(0x2e7d32);
        g.fillRect(8, 8, 2, 2);
        g.fillRect(24, 24, 2, 2);

        g.generateTexture('tile_grass_dark', 32, 32);
    }

    createParticleTextures() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xffffff);
        g.fillRect(0, 0, 4, 4);
        g.generateTexture('particle', 4, 4);

        g.clear();
        g.fillStyle(0xffd700);
        g.fillRect(0, 0, 4, 4);
        g.generateTexture('particle_gold', 4, 4);

        g.clear();
        g.fillStyle(0x795548);
        g.fillRect(0, 0, 4, 4);
        g.generateTexture('particle_wood', 4, 4);

        g.clear();
        g.fillStyle(0x90a4ae);
        g.fillRect(0, 0, 4, 4);
        g.generateTexture('particle_iron', 4, 4);

        g.clear();
        g.fillStyle(0xe040fb);
        g.fillRect(0, 0, 4, 4);
        g.generateTexture('particle_crystal', 4, 4);
    }

    createMobTextures() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // --- SLIME ---
        g.clear();
        g.fillStyle(0x00ff00); // Inner body
        g.fillCircle(16, 20, 12);
        g.fillStyle(0xccffcc); // Highlight
        g.fillCircle(12, 16, 4);
        g.fillStyle(0x000000); // Eyes
        g.fillCircle(12, 18, 2);
        g.fillCircle(20, 18, 2);
        g.generateTexture('mob_slime', 32, 32);

        // --- BAT ---
        g.clear();
        g.fillStyle(0x303030); // Body
        g.fillCircle(16, 16, 8);
        g.beginPath(); // Wings
        g.moveTo(8, 16);
        g.lineTo(0, 8);
        g.lineTo(8, 20);
        g.moveTo(24, 16);
        g.lineTo(32, 8);
        g.lineTo(24, 20);
        g.fillPath();
        g.fillStyle(0xff0000); // Red eyes
        g.fillRect(14, 14, 1, 1);
        g.fillRect(17, 14, 1, 1);
        g.generateTexture('mob_bat', 32, 32);

        // --- GOBLIN ---
        g.clear();
        g.fillStyle(0x2e7d32); // Skin
        g.fillRect(10, 8, 12, 10); // Head
        g.fillRect(8, 18, 16, 14); // Body
        g.fillStyle(0x558b2f); // Ears
        g.fillTriangle(10, 12, 4, 8, 10, 16);
        g.fillTriangle(22, 12, 28, 8, 22, 16);
        g.fillStyle(0xffffff); // Eyes
        g.fillRect(12, 10, 3, 3);
        g.fillRect(17, 10, 3, 3);
        g.fillStyle(0x000000); // Pupils
        g.fillRect(13, 11, 1, 1);
        g.fillRect(18, 11, 1, 1);
        g.generateTexture('mob_goblin', 32, 32);

        g.destroy();
    }

    createBossTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // --- BOSS (Improved) ---
        // Dark Aura
        g.fillStyle(0x1a0033);
        g.fillCircle(32, 32, 30);

        // Spikes
        g.fillStyle(0x4a148c);
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x = 32 + Math.cos(angle) * 32;
            const y = 32 + Math.sin(angle) * 32;
            g.fillCircle(x, y, 6);
        }

        // Core
        g.fillStyle(0xff0000);
        g.fillCircle(32, 32, 15);
        g.fillStyle(0xffa0a0);
        g.fillCircle(28, 28, 5); // Shine

        // Evil Eyes
        g.fillStyle(0xffff00);
        g.beginPath();
        g.moveTo(24, 28); g.lineTo(28, 32); g.lineTo(24, 34);
        g.moveTo(40, 28); g.lineTo(36, 32); g.lineTo(40, 34);
        g.fillPath();

        g.generateTexture('boss', 64, 64);
        g.destroy();
    }

    createBuildingTextures() {
        // Lumber Mill - wooden hut with logs
        const lm = this.make.graphics({ x: 0, y: 0, add: false });
        // Base structure
        lm.fillStyle(0x8d6e63);
        lm.fillRect(8, 20, 48, 40);
        // Roof
        lm.fillStyle(0x5d4037);
        lm.fillRect(4, 10, 56, 14);
        lm.fillRect(12, 4, 40, 10);
        // Door
        lm.fillStyle(0x3e2723);
        lm.fillRect(26, 36, 12, 24);
        // Window
        lm.fillStyle(0x81d4fa);
        lm.fillRect(40, 28, 10, 10);
        // Logs pile
        lm.fillStyle(0xa1887f);
        lm.fillRect(4, 50, 16, 8);
        lm.fillRect(6, 44, 12, 8);
        lm.generateTexture('lumber_mill', 64, 64);

        // Quarry - stone mine entrance
        const qu = this.make.graphics({ x: 0, y: 0, add: false });
        // Stone base
        qu.fillStyle(0x78909c);
        qu.fillRect(8, 24, 48, 36);
        // Dark entrance
        qu.fillStyle(0x263238);
        qu.fillRect(20, 32, 24, 28);
        // Support beams
        qu.fillStyle(0x5d4037);
        qu.fillRect(16, 24, 6, 36);
        qu.fillRect(42, 24, 6, 36);
        qu.fillRect(16, 20, 32, 6);
        // Ore pile
        qu.fillStyle(0xffb74d);
        qu.fillRect(50, 48, 10, 8);
        qu.fillRect(52, 42, 6, 8);
        qu.generateTexture('quarry', 64, 64);

        // Smelter - furnace with fire
        const sm = this.make.graphics({ x: 0, y: 0, add: false });
        // Brick base
        sm.fillStyle(0xbf360c);
        sm.fillRect(12, 16, 40, 44);
        // Chimney
        sm.fillStyle(0x8d6e63);
        sm.fillRect(36, 4, 12, 16);
        // Fire opening
        sm.fillStyle(0xff6f00);
        sm.fillRect(20, 40, 24, 16);
        // Fire glow
        sm.fillStyle(0xffeb3b);
        sm.fillRect(26, 44, 12, 8);
        // Smoke particles (decorative)
        sm.fillStyle(0x9e9e9e);
        sm.fillRect(40, 0, 4, 6);
        sm.fillRect(38, 6, 4, 4);
        sm.generateTexture('smelter', 64, 64);

        // Portal - magical gate
        const pt = this.make.graphics({ x: 0, y: 0, add: false });
        // Stone frame
        pt.fillStyle(0x4a148c);
        pt.fillRect(20, 8, 56, 80);
        // Inner glow
        pt.fillStyle(0x7c4dff);
        pt.fillRect(28, 16, 40, 64);
        // Swirl center
        pt.fillStyle(0xea80fc);
        pt.fillRect(40, 36, 16, 24);
        // Runes
        pt.fillStyle(0xffeb3b);
        pt.fillRect(22, 20, 4, 8);
        pt.fillRect(70, 20, 4, 8);
        pt.fillRect(22, 64, 4, 8);
        pt.fillRect(70, 64, 4, 8);
        pt.generateTexture('portal', 96, 96);
    }
}
