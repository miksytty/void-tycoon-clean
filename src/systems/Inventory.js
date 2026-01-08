// Inventory system with LocalStorage persistence
const STORAGE_KEY = 'phaser_game_inventory';
const EQUIPPED_KEY = 'phaser_game_equipped';
const MAX_SLOTS = 20;

export class Inventory {
    constructor() {
        this.slots = new Array(MAX_SLOTS).fill(null);
        this.equipped = null; // Currently equipped item
        this.load();
    }

    // Add item to inventory
    addItem(item, quantity = 1) {
        // First, try to stack with existing items
        if (item.stackable) {
            for (let i = 0; i < this.slots.length; i++) {
                const slot = this.slots[i];
                if (slot && slot.id === item.id && slot.quantity < item.maxStack) {
                    const canAdd = Math.min(quantity, item.maxStack - slot.quantity);
                    slot.quantity += canAdd;
                    quantity -= canAdd;
                    if (quantity <= 0) {
                        this.save();
                        return true;
                    }
                }
            }
        }

        // Find empty slot for remaining items
        while (quantity > 0) {
            const emptyIndex = this.slots.findIndex(s => s === null);
            if (emptyIndex === -1) {
                console.warn('Inventory is full!');
                return false;
            }

            const addQuantity = item.stackable ? Math.min(quantity, item.maxStack) : 1;
            this.slots[emptyIndex] = {
                id: item.id,
                name: item.name,
                icon: item.icon,
                stackable: item.stackable,
                maxStack: item.maxStack,
                quantity: addQuantity,
                equipable: item.equipable || false,
                gatherSpeedBonus: item.gatherSpeedBonus || 1
            };
            quantity -= addQuantity;
        }

        this.save();
        return true;
    }

    // Remove item from inventory
    removeItem(slotIndex, quantity = 1) {
        const slot = this.slots[slotIndex];
        if (!slot) return false;

        slot.quantity -= quantity;
        if (slot.quantity <= 0) {
            this.slots[slotIndex] = null;
        }

        this.save();
        return true;
    }

    // Remove item by ID
    removeItemById(itemId, quantity = 1) {
        let remaining = quantity;
        for (let i = 0; i < this.slots.length && remaining > 0; i++) {
            const slot = this.slots[i];
            if (slot && slot.id === itemId) {
                const toRemove = Math.min(remaining, slot.quantity);
                slot.quantity -= toRemove;
                remaining -= toRemove;
                if (slot.quantity <= 0) {
                    this.slots[i] = null;
                }
            }
        }
        this.save();
        return remaining === 0;
    }

    // Equip item
    equipItem(slotIndex) {
        const slot = this.slots[slotIndex];
        if (!slot || !slot.equipable) return false;

        this.equipped = { ...slot };
        this.save();
        return true;
    }

    // Unequip item
    unequipItem() {
        this.equipped = null;
        this.save();
    }

    // Get equipped item
    getEquipped() {
        return this.equipped;
    }

    // Get gather speed multiplier
    getGatherSpeedMultiplier() {
        return this.equipped?.gatherSpeedBonus || 1;
    }

    // Get all slots
    getSlots() {
        return this.slots;
    }

    // Get item count by id
    getItemCount(itemId) {
        return this.slots.reduce((count, slot) => {
            if (slot && slot.id === itemId) {
                return count + slot.quantity;
            }
            return count;
        }, 0);
    }

    // Save to LocalStorage
    save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.slots));
            localStorage.setItem(EQUIPPED_KEY, JSON.stringify(this.equipped));
        } catch (e) {
            console.error('Failed to save inventory:', e);
        }
    }

    // Load from LocalStorage
    load() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                if (Array.isArray(parsed)) {
                    this.slots = parsed.slice(0, MAX_SLOTS);
                    while (this.slots.length < MAX_SLOTS) {
                        this.slots.push(null);
                    }
                }
            }
            const equippedData = localStorage.getItem(EQUIPPED_KEY);
            if (equippedData) {
                this.equipped = JSON.parse(equippedData);
            }
        } catch (e) {
            console.error('Failed to load inventory:', e);
        }
    }

    // Clear inventory
    clear() {
        this.slots = new Array(MAX_SLOTS).fill(null);
        this.equipped = null;
        this.save();
    }
}

