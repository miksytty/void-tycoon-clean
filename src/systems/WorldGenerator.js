import Phaser from 'phaser';
import { WORLD_CONFIG } from '../data/GameData.js';

export class WorldGenerator {
    constructor(scene) {
        this.scene = scene;
        this.loadedChunks = new Map();
        this.chunkSize = WORLD_CONFIG.chunkSize;
        this.tileSize = WORLD_CONFIG.tileSize;
        this.viewDistance = WORLD_CONFIG.viewDistance;

        this.seed = window.VoidTycoon?.storage?.getPlayer()?.id || Date.now();
    }

    generateAroundPlayer() {
        const player = this.scene.player;
        if (!player) return;

        const currentChunkX = Math.floor(player.x / this.chunkSize);
        const currentChunkY = Math.floor(player.y / this.chunkSize);

        for (let dx = -this.viewDistance; dx <= this.viewDistance; dx++) {
            for (let dy = -this.viewDistance; dy <= this.viewDistance; dy++) {
                const chunkX = currentChunkX + dx;
                const chunkY = currentChunkY + dy;
                const chunkKey = `${chunkX},${chunkY}`;

                if (!this.loadedChunks.has(chunkKey)) {
                    this.generateChunk(chunkX, chunkY);
                    this.loadedChunks.set(chunkKey, true);
                }
            }
        }

        this.cleanupDistantChunks(currentChunkX, currentChunkY);
    }

    generateChunk(chunkX, chunkY) {
        const worldX = chunkX * this.chunkSize;
        const worldY = chunkY * this.chunkSize;
        const tilesPerChunk = this.chunkSize / this.tileSize;

        for (let tx = 0; tx < tilesPerChunk; tx++) {
            for (let ty = 0; ty < tilesPerChunk; ty++) {
                const tileX = worldX + tx * this.tileSize + this.tileSize / 2;
                const tileY = worldY + ty * this.tileSize + this.tileSize / 2;

                const isLight = this.noise(tileX, tileY) > 0.5;
                const textureKey = isLight ? 'tile_grass_light' : 'tile_grass_dark';

                const tile = this.scene.add.image(tileX, tileY, textureKey);
                tile.setDepth(-10000000); // Земля всегда на самом дне
                tile.chunkKey = `${chunkX},${chunkY}`;

                this.scene.groundLayer.add(tile);
            }
        }

        this.generateResourcesInChunk(chunkX, chunkY, worldX, worldY);
    }

    generateResourcesInChunk(chunkX, chunkY, worldX, worldY) {
        const padding = 40;

        if (chunkX === 0 && chunkY === 0) {
            this.spawnResource(worldX + 80, worldY + 60, 'tree');
            this.spawnResource(worldX + 150, worldY + 80, 'tree');
            this.spawnResource(worldX + 200, worldY + 150, 'tree');
            this.spawnResource(worldX + 100, worldY + 200, 'tree');

            this.spawnResource(worldX + 300, worldY + 100, 'rock');
            this.spawnResource(worldX + 350, worldY + 180, 'rock');
            this.spawnResource(worldX + 280, worldY + 250, 'rock');

            this.spawnResource(worldX + 400, worldY + 300, 'crystal');
            return;
        }

        const clusters = WORLD_CONFIG.resourceClusters;

        for (let i = 0; i < clusters; i++) {
            const centerX = worldX + padding + this.seededRandom(chunkX * 1000 + chunkY + i * 100) * (this.chunkSize - padding * 2);
            const centerY = worldY + padding + this.seededRandom(chunkX + chunkY * 1000 + i * 200) * (this.chunkSize - padding * 2);

            const resourceType = this.getResourceType(chunkX, chunkY, i);

            const clusterSize = WORLD_CONFIG.clusterSize;
            for (let j = 0; j < clusterSize; j++) {
                const offsetX = (this.seededRandom(centerX + j * 10) - 0.5) * 100;
                const offsetY = (this.seededRandom(centerY + j * 20) - 0.5) * 100;

                const resX = centerX + offsetX;
                const resY = centerY + offsetY;

                if (resX > worldX + padding && resX < worldX + this.chunkSize - padding &&
                    resY > worldY + padding && resY < worldY + this.chunkSize - padding) {
                    this.spawnResource(resX, resY, resourceType);
                }
            }
        }
    }

    getResourceType(chunkX, chunkY, clusterIndex) {
        const distance = Math.sqrt(chunkX * chunkX + chunkY * chunkY);
        const rand = this.seededRandom(chunkX * 100 + chunkY * 10 + clusterIndex);

        if (distance > 1 && rand < 0.05) {
            return 'crystal';
        }

        if (rand < 0.5) {
            return 'rock';
        }

        return 'tree';
    }

    spawnResource(x, y, type) {
        const textureMap = {
            tree: 'tree',
            rock: 'rock',
            crystal: 'crystal'
        };

        const resource = this.scene.physics.add.staticImage(x, y, textureMap[type]);
        resource.resourceType = type;
        resource.setDepth(y);

        resource.body.setSize(30, 30);
        resource.body.setOffset(-15, 10);

        this.scene.resourcesGroup.add(resource);

        this.scene.tweens.add({
            targets: resource,
            scaleX: 1.03,
            scaleY: 0.97,
            duration: 1500 + Math.random() * 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        return resource;
    }

    cleanupDistantChunks(currentChunkX, currentChunkY) {
        const maxDistance = this.viewDistance + 2;

        this.loadedChunks.forEach((value, key) => {
            const [cx, cy] = key.split(',').map(Number);
            const dx = Math.abs(cx - currentChunkX);
            const dy = Math.abs(cy - currentChunkY);

            if (dx > maxDistance || dy > maxDistance) {
                this.scene.groundLayer.children.each((tile) => {
                    if (tile.chunkKey === key) {
                        tile.destroy();
                    }
                });

                const worldX = cx * this.chunkSize;
                const worldY = cy * this.chunkSize;

                this.scene.resourcesGroup.children.each((resource) => {
                    if (resource.x >= worldX && resource.x < worldX + this.chunkSize &&
                        resource.y >= worldY && resource.y < worldY + this.chunkSize) {
                        resource.destroy();
                    }
                });

                this.loadedChunks.delete(key);
            }
        });
    }

    noise(x, y) {
        const n = Math.sin(x * 12.9898 + y * 78.233 + this.seed) * 43758.5453;
        return n - Math.floor(n);
    }

    seededRandom(seed) {
        const x = Math.sin(seed + this.seed) * 10000;
        return x - Math.floor(x);
    }
}
