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

        const chunkData = { tiles: [], resources: [] };

        // Determine Biome
        // Determine Biome using approximate center of chunk
        const biome = this.getBiome(worldX + this.chunkSize / 2, worldY + this.chunkSize / 2);

        for (let tx = 0; tx < tilesPerChunk; tx++) {
            for (let ty = 0; ty < tilesPerChunk; ty++) {
                const tileX = worldX + tx * this.tileSize + this.tileSize / 2;
                const tileY = worldY + ty * this.tileSize + this.tileSize / 2;

                let textureKey = 'tile_grass_light';

                if (biome === 'wasteland') textureKey = 'tile_grass_dark';
                else if (biome === 'forest') textureKey = (tx + ty) % 2 === 0 ? 'tile_grass_light' : 'tile_grass_dark';
                else if (biome === 'crystal') textureKey = 'tile_grass_dark';

                // Add slight variation noise
                if (this.noise(tileX, tileY) > 0.7) {
                    // textureKey variation could go here
                }

                // Tint based on biome
                const tile = this.scene.add.image(tileX, tileY, textureKey);
                if (biome === 'wasteland') tile.setTint(0x888888);
                if (biome === 'crystal') tile.setTint(0xddaaff);

                tile.setDepth(-10000000);
                this.scene.groundLayer.add(tile);
                chunkData.tiles.push(tile);
            }
        }

        this.generateResourcesInChunk(chunkX, chunkY, worldX, worldY, chunkData, biome);
        this.loadedChunks.set(`${chunkX},${chunkY}`, chunkData);
    }

    // Radial Biome System
    getBiome(x, y) {
        // Distance from spawn (0,0)
        const distance = Math.sqrt(x * x + y * y);

        // Zone 1: Safe Forest (0 - 1500px radius)
        if (distance < 1500) {
            return 'forest';
        }

        // Zone 2: Wasteland / Badlands (1500 - 3500px radius)
        if (distance < 3500) {
            // Mix with some noise for variation borders
            const n = this.getNoise(x * 0.001, y * 0.001);
            if (n > 0.7) return 'forest'; // Patches of life
            return 'wasteland';
        }

        // Zone 3: Crystal Void (3500px+)
        return 'crystal';
    }

    getResourceTypeForBiome(biome, rand) {
        if (biome === 'forest') {
            // Mostly trees, some rocks
            if (rand < 0.7) return 'tree';
            return 'rock';
        }
        if (biome === 'wasteland') {
            // Mostly rocks/iron, dead trees (wood), rare crystals
            if (rand < 0.6) return 'rock';
            if (rand < 0.9) return 'tree'; // Dry wood
            return 'crystal';
        }
        if (biome === 'crystal') {
            // Crystals and Rocks
            if (rand < 0.6) return 'crystal';
            return 'rock';
        }
        return 'tree';
    }

    // Improved Noise Wrapper
    getNoise(x, y) {
        return Math.abs(Math.sin(x * 12.989 + y * 78.233 + this.seed));
    }

    // Removed getResourceType as it's replaced by getResourceTypeForBiome

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

        // REMOVED TWEEN FOR PERFORMANCE

        return resource;
    }

    cleanupDistantChunks(currentChunkX, currentChunkY) {
        const maxDistance = this.viewDistance + 2;

        this.loadedChunks.forEach((chunkData, key) => {
            const [cx, cy] = key.split(',').map(Number);
            const dx = Math.abs(cx - currentChunkX);
            const dy = Math.abs(cy - currentChunkY);

            if (dx > maxDistance || dy > maxDistance) {
                // Optimized cleanup: destroy tracked objects directly
                if (chunkData.tiles) {
                    chunkData.tiles.forEach(tile => tile.destroy());
                }
                if (chunkData.resources) {
                    chunkData.resources.forEach(resource => resource.destroy());
                }

                this.loadedChunks.delete(key);
            }
        });
    }

    // Improved smooth noise (Value Noise)
    smoothNoise(x, y) {
        const floorX = Math.floor(x);
        const floorY = Math.floor(y);
        const fractX = x - floorX;
        const fractY = y - floorY;

        const sX = fractX * fractX * (3 - 2 * fractX);
        const sY = fractY * fractY * (3 - 2 * fractY);

        const tl = this.rawNoise(floorX, floorY);
        const tr = this.rawNoise(floorX + 1, floorY);
        const bl = this.rawNoise(floorX, floorY + 1);
        const br = this.rawNoise(floorX + 1, floorY + 1);

        const top = tl + (tr - tl) * sX;
        const bottom = bl + (br - bl) * sX;

        return top + (bottom - top) * sY;
    }

    rawNoise(x, y) {
        const n = Math.sin(x * 12.9898 + y * 78.233 + this.seed) * 43758.5453;
        return n - Math.floor(n);
    }

    noise(x, y) {
        return this.rawNoise(x, y);
    }

    seededRandom(seed) {
        const x = Math.sin(seed + this.seed) * 10000;
        return x - Math.floor(x);
    }

    getBiomeAt(x, y) {
        const n = this.smoothNoise(x * 0.002, y * 0.002);

        if (n < 0.35) return 'wasteland';
        if (n > 0.65) return 'crystal';
        return 'forest';
    }

    // generateResourcesInChunk now calculates biome per resource location
    generateResourcesInChunk(chunkX, chunkY, worldX, worldY, chunkData) {
        const padding = 40;

        if (chunkX === 0 && chunkY === 0) {
            // Spawn area safety
            const starters = [
                { x: 80, y: 60, t: 'tree' }, { x: 150, y: 80, t: 'tree' },
                { x: 300, y: 100, t: 'rock' }, { x: 400, y: 300, t: 'crystal' }
            ];
            starters.forEach(s => {
                const r = this.spawnResource(worldX + s.x, worldY + s.y, s.t);
                chunkData.resources.push(r);
            });
            return;
        }

        const clusters = WORLD_CONFIG.resourceClusters;

        for (let i = 0; i < clusters; i++) {
            const centerX = worldX + padding + this.seededRandom(chunkX * 1000 + chunkY + i * 100) * (this.chunkSize - padding * 2);
            const centerY = worldY + padding + this.seededRandom(chunkX + chunkY * 1000 + i * 200) * (this.chunkSize - padding * 2);

            const biomeAtCluster = this.getBiome(centerX, centerY);
            const resourceType = this.getResourceTypeForBiome(biomeAtCluster, this.seededRandom(chunkX + i));

            const clusterSize = WORLD_CONFIG.clusterSize;
            for (let j = 0; j < clusterSize; j++) {
                const offsetX = (this.seededRandom(centerX + j * 10) - 0.5) * 100;
                const offsetY = (this.seededRandom(centerY + j * 20) - 0.5) * 100;

                const resX = centerX + offsetX;
                const resY = centerY + offsetY;

                if (resX > worldX + padding && resX < worldX + this.chunkSize - padding &&
                    resY > worldY + padding && resY < worldY + this.chunkSize - padding) {
                    const r = this.spawnResource(resX, resY, resourceType);
                    chunkData.resources.push(r);
                }
            }
        }
    }
}
