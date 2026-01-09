import Phaser from 'phaser';
import { BUILDINGS } from '../data/GameData.js';

export class BuildManager {
    constructor(scene) {
        this.scene = scene;
        this.isBuildMode = false;
        this.selectedBuildingId = null;
        this.previewSprite = null;
        this.builtBuildingsGroup = scene.physics.add.staticGroup();
    }

    init() {
        this.loadBuildings();

        // Input listener for placement
        this.scene.input.on('pointerdown', (pointer) => {
            if (this.isBuildMode && this.selectedBuildingId) {
                // Adjust for camera scroll to get world coordinates
                const worldX = pointer.worldX;
                const worldY = pointer.worldY;
                this.tryPlaceBuilding(worldX, worldY);
            }
        });

        // Input listener for preview movement
        this.scene.input.on('pointermove', (pointer) => {
            if (this.isBuildMode && this.previewSprite) {
                this.previewSprite.setPosition(pointer.worldX, pointer.worldY);

                // Snap to grid (32px)
                const snapX = Math.round(pointer.worldX / 32) * 32;
                const snapY = Math.round(pointer.worldY / 32) * 32;
                this.previewSprite.setPosition(snapX, snapY);

                // Color validation (green/red)
                const isValid = this.isValidLocation(snapX, snapY);
                this.previewSprite.setTint(isValid ? 0x00ff00 : 0xff0000);
            }
        });

        // Start production timer (every 10s check, production is periodic)
        this.scene.time.addEvent({
            delay: 10000,
            callback: () => this.processProduction(),
            loop: true
        });
    }

    toggleBuildMode(buildingId) {
        if (this.isBuildMode && this.selectedBuildingId === buildingId) {
            this.exitBuildMode();
            return;
        }

        this.isBuildMode = true;
        this.selectedBuildingId = buildingId;
        const config = BUILDINGS[buildingId];

        if (!this.previewSprite) {
            this.previewSprite = this.scene.add.sprite(0, 0, 'building_base')
                .setAlpha(0.6)
                .setDepth(1000);

            // If sprite not found, use fallback or create texture
            // ... (fallback logic remains if needed, but we prioritize loaded assets) ...

            const textureKey = this.scene.textures.exists(buildingId) ? buildingId : 'building_base';

            if (!this.scene.textures.exists(textureKey) && !this.scene.textures.exists('building_base')) {
                // Create a simple box texture on the fly if needed
                const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
                graphics.fillStyle(0xffffff);
                graphics.fillRect(0, 0, 32, 32);
                graphics.generateTexture('building_base', 32, 32);
            }
            this.previewSprite.setTexture(textureKey);
        } else {
            const textureKey = this.scene.textures.exists(buildingId) ? buildingId : 'building_base';
            this.previewSprite.setTexture(textureKey);
        }

        // Scale preview
        const targetSize = (config.size || 2) * 32;
        const scale = targetSize / Math.max(this.previewSprite.width, this.previewSprite.height);
        this.previewSprite.setScale(scale);

        this.previewSprite.setVisible(true);
        if (config.color) this.previewSprite.setTint(config.color);

        window.VoidTycoon.ui?.showNotification(`Режим строительства: ${config.name}`, 'info');
    }

    exitBuildMode() {
        this.isBuildMode = false;
        this.selectedBuildingId = null;
        if (this.previewSprite) {
            this.previewSprite.setVisible(false);
        }
    }

    isValidLocation(x, y) {
        // Simple check: distance from player
        const dist = Phaser.Math.Distance.Between(x, y, this.scene.player.x, this.scene.player.y);
        if (dist < 50) return false; // Too close to player

        // Check distance from other buildings
        let overlap = false;
        this.builtBuildingsGroup.children.iterate((b) => {
            if (Phaser.Math.Distance.Between(x, y, b.x, b.y) < 40) overlap = true;
        });
        if (overlap) return false;

        // Check resources overlap (trees/rocks)
        // This is expensive if many resources, maybe optimize later
        // For now, allow building over resources (destroys them?) or just ignore

        return true;
    }

    tryPlaceBuilding(rawX, rawY) {
        const x = Math.round(rawX / 32) * 32;
        const y = Math.round(rawY / 32) * 32;

        if (!this.isValidLocation(x, y)) {
            window.VoidTycoon.ui?.showNotification('Нельзя построить здесь!', 'error');
            return;
        }

        const config = BUILDINGS[this.selectedBuildingId];
        const storage = window.VoidTycoon.storage;

        // Check cost
        for (const [res, amount] of Object.entries(config.cost)) {
            if ((storage.data.resources[res] || 0) < amount) {
                window.VoidTycoon.ui?.showNotification(`Не хватает ресурсов: ${res}`, 'error');
                return;
            }
        }

        // Deduct cost
        for (const [res, amount] of Object.entries(config.cost)) {
            storage.data.resources[res] -= amount;
        }

        this.placeBuildingEntity(this.selectedBuildingId, x, y);

        // Save
        storage.data.placedBuildings.push({
            id: Date.now().toString(),
            type: this.selectedBuildingId,
            x: x,
            y: y,
            lastProduction: Date.now()
        });

        // Increment stat (legacy support)
        if (storage.data.buildings) {
            storage.data.buildings[this.selectedBuildingId] = (storage.data.buildings[this.selectedBuildingId] || 0) + 1;
        }

        storage.save();
        window.VoidTycoon.ui?.showNotification(`${config.name} построена!`, 'success');
        window.VoidTycoon.sound?.playBuildSound?.();

        // Exit build mode after one placement? Or keep it? Let's exit for mobile friendliness.
        this.exitBuildMode();
    }

    placeBuildingEntity(type, x, y) {
        const config = BUILDINGS[type];

        // Create sprite
        // Create sprite
        const textureKey = this.scene.textures.exists(config.id) ? config.id : 'building_base';
        const building = this.builtBuildingsGroup.create(x, y, textureKey);

        // Scale to fit tile size (e.g. size 2 = 64x64)
        const targetSize = (config.size || 2) * 32;
        // Use the larger dimension to fit
        const scale = targetSize / Math.max(building.width, building.height);
        building.setScale(scale);

        // Visuals
        if (config.color) building.setTint(config.color);
        building.setDepth(y); // Y-sort
        building.setImmovable(true);

        // Add label/icon
        const label = this.scene.add.text(x, y - 24, config.icon, { fontSize: '20px' }).setOrigin(0.5).setDepth(y + 1);

        // Store ref
        building.buildingType = type;
        building.label = label;
    }

    loadBuildings() {
        const storage = window.VoidTycoon.storage;
        const placed = storage.data.placedBuildings || [];

        placed.forEach(b => {
            this.placeBuildingEntity(b.type, b.x, b.y);
        });

        // Add collider with player
        this.scene.physics.add.collider(this.scene.player, this.builtBuildingsGroup);
    }

    processProduction() {
        const storage = window.VoidTycoon.storage;
        const placed = storage.data.placedBuildings || [];
        const now = Date.now();

        let totalGain = {};

        placed.forEach(b => {
            const config = BUILDINGS[b.type];
            if (!config || !config.production) return;

            // Check interval (default 1 min)
            const interval = config.productionInterval || 60000;
            const elapsed = now - (b.lastProduction || 0);

            if (elapsed >= interval) {
                // Produce
                for (const [res, amount] of Object.entries(config.production)) {
                    totalGain[res] = (totalGain[res] || 0) + amount;
                }

                // Visual feedback at building location
                this.scene.showFloatingText(
                    b.x,
                    b.y - 40,
                    `+${Object.values(config.production)[0]}`,
                    0x00ff00
                );

                b.lastProduction = now;
            }
        });

        // Apply gains
        let hasGain = false;
        for (const [res, amount] of Object.entries(totalGain)) {
            storage.addResource(res, amount);
            hasGain = true;
        }

        if (hasGain) {
            storage.save();
            window.VoidTycoon.ui?.updateHUD();
        }
    }
}
