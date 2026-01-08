import Phaser from 'phaser';

export class Pet extends Phaser.GameObjects.Container {
    constructor(scene, x, y, petId) {
        super(scene, x, y);
        this.scene = scene;
        this.petId = petId; // e.g. 'drone_1'

        // Visuals
        this.sprite = scene.add.text(0, 0, '🛸', { fontSize: '24px' }).setOrigin(0.5);
        this.add(this.sprite);

        // Shadow
        this.shadow = scene.add.text(0, 20, '⚫', { fontSize: '12px', alpha: 0.3 }).setOrigin(0.5);
        this.add(this.shadow);
        this.sendToBack(this.shadow);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.setCircle(10);
        this.body.setCollideWorldBounds(true);

        // Logic stats
        this.followDistance = 60;
        this.speed = 180;
        this.scanRadius = 150;

        // State
        this.state = 'IDLE'; // IDLE, FOLLOW, GATHER
        this.targetResource = null;
        this.lastGatherTime = 0;
    }

    update(time, delta) {
        if (!this.scene.player) return;

        // Hover animation
        this.sprite.y = Math.sin(time * 0.005) * 5;

        // Logic
        const player = this.scene.player;
        const distToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

        if (this.state === 'IDLE' || this.state === 'FOLLOW') {
            if (distToPlayer > this.followDistance * 3) {
                // Teleport if too far
                this.setPosition(player.x, player.y);
            } else if (distToPlayer > this.followDistance) {
                this.state = 'FOLLOW';
                this.scene.physics.moveToObject(this, player, this.speed);
            } else {
                this.body.setVelocity(0, 0);
                this.state = 'IDLE';
            }

            // Try to find resource if idle close to player
            if (this.state === 'IDLE' && time > this.lastGatherTime + 2000) {
                this.findResource();
            }

        } else if (this.state === 'GATHER') {
            if (!this.targetResource || !this.targetResource.active) {
                this.state = 'IDLE';
                this.targetResource = null;
                return;
            }

            const distToRes = Phaser.Math.Distance.Between(this.x, this.y, this.targetResource.x, this.targetResource.y);
            if (distToRes > 20) {
                this.scene.physics.moveToObject(this, this.targetResource, this.speed);
            } else {
                this.body.setVelocity(0, 0);
                // Gather
                this.gatherResource();
                this.lastGatherTime = time;
                this.state = 'RETURN';
            }
        } else if (this.state === 'RETURN') {
            this.scene.physics.moveToObject(this, player, this.speed);
            if (distToPlayer < 30) {
                this.state = 'IDLE';
            }
        }
    }

    findResource() {
        // Simple scan in radius
        // Access scene resources group
        const resources = this.scene.resourcesGroup?.children?.entries || [];

        for (const res of resources) {
            if (res.active && ['tree', 'rock'].includes(res.resourceType)) {
                const d = Phaser.Math.Distance.Between(this.x, this.y, res.x, res.y);
                if (d < this.scanRadius) {
                    this.targetResource = res;
                    this.state = 'GATHER';
                    return;
                }
            }
        }
    }

    gatherResource() {
        if (!this.targetResource) return;

        // Auto-gather effect
        // We simulate a "mini-hit" that gives 1 resource without destroying full node immediately? 
        // OR we duplicate the logic but weaker.
        // Let's just give 1 resource.

        const type = this.targetResource.resourceType;
        const map = { tree: 'wood', rock: 'iron' };

        if (map[type]) {
            window.VoidTycoon.storage.addResource(map[type], 1);

            // Visual
            if (this.scene.showFloatingText) {
                this.scene.showFloatingText(this.x, this.y, `+1 ${map[type] === 'wood' ? '🪵' : '⛓️'}`, 0x00ffff);
            }
        }
    }
}
