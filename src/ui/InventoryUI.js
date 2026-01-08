// Inventory UI Controller with Crafting
import { RECIPES } from '../data/items';

export class InventoryUI {
    constructor(inventory) {
        this.inventory = inventory;
        this.overlay = document.getElementById('inventory-overlay');
        this.grid = document.getElementById('inventory-grid');
        this.closeBtn = document.getElementById('close-inventory');
        this.isOpen = false;
        this.activeTab = 'inventory'; // 'inventory' or 'craft'
        this.onCraftCallback = null;

        this.init();
    }

    init() {
        // Add tabs
        this.createTabs();

        // Create crafting panel
        this.createCraftingPanel();

        // Create 20 slots
        this.grid.innerHTML = '';
        for (let i = 0; i < 20; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.dataset.index = i;
            slot.innerHTML = `
                <span class="slot-icon"></span>
                <span class="slot-count"></span>
            `;
            // Click to equip
            slot.addEventListener('click', () => this.onSlotClick(i));
            this.grid.appendChild(slot);
        }

        // Close button
        this.closeBtn.addEventListener('click', () => this.close());

        // Click outside to close
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });

        // Create mobile inventory button
        this.createMobileButton();

        // Initial render
        this.render();
    }

    createTabs() {
        const panel = document.getElementById('inventory-panel');
        const header = document.getElementById('inventory-header');

        // Create tabs container
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'inventory-tabs';
        tabsContainer.innerHTML = `
            <button class="tab-btn active" data-tab="inventory">🎒 Items</button>
            <button class="tab-btn" data-tab="craft">⚒️ Craft</button>
        `;

        header.insertAdjacentElement('afterend', tabsContainer);

        // Tab switching
        tabsContainer.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.activeTab = btn.dataset.tab;
                tabsContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updateTabVisibility();
                this.render();
            });
        });
    }

    createCraftingPanel() {
        const panel = document.getElementById('inventory-panel');

        const craftPanel = document.createElement('div');
        craftPanel.id = 'craft-panel';
        craftPanel.className = 'craft-panel hidden';
        craftPanel.innerHTML = `
            <div class="craft-recipes"></div>
        `;

        panel.appendChild(craftPanel);
        this.craftPanel = craftPanel;
        this.recipesContainer = craftPanel.querySelector('.craft-recipes');
    }

    updateTabVisibility() {
        if (this.activeTab === 'inventory') {
            this.grid.classList.remove('hidden');
            this.craftPanel.classList.add('hidden');
        } else {
            this.grid.classList.add('hidden');
            this.craftPanel.classList.remove('hidden');
        }
    }

    onSlotClick(index) {
        const slot = this.inventory.getSlots()[index];
        if (slot && slot.equipable) {
            const equipped = this.inventory.getEquipped();
            if (equipped && equipped.id === slot.id) {
                this.inventory.unequipItem();
                this.showNotification('Unequipped ' + slot.name);
            } else {
                this.inventory.equipItem(index);
                this.showNotification('Equipped ' + slot.name + '! 2x gathering speed!');
            }
            this.render();
        }
    }

    createMobileButton() {
        const btn = document.createElement('div');
        btn.className = 'inventory-button';
        btn.innerHTML = '🎒';
        btn.addEventListener('click', () => this.toggle());
        document.body.appendChild(btn);
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.isOpen = true;
        this.overlay.classList.remove('hidden');
        this.render();
    }

    close() {
        this.isOpen = false;
        this.overlay.classList.add('hidden');
    }

    canCraft(recipe) {
        return recipe.ingredients.every(ing => {
            return this.inventory.getItemCount(ing.item.id) >= ing.amount;
        });
    }

    craft(recipe) {
        if (!this.canCraft(recipe)) return false;

        // Remove ingredients
        recipe.ingredients.forEach(ing => {
            this.inventory.removeItemById(ing.item.id, ing.amount);
        });

        // Add result
        const success = this.inventory.addItem(recipe.result, recipe.resultAmount);

        if (success) {
            this.showNotification(`You crafted ${recipe.name}!`);
            if (this.onCraftCallback) {
                this.onCraftCallback(recipe);
            }
        }

        this.render();
        return success;
    }

    showNotification(message) {
        // Remove existing notification
        const existing = document.querySelector('.craft-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = 'craft-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">✨</span>
                <span class="notification-text">${message}</span>
            </div>
        `;
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 10);

        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 2500);
    }

    renderCrafting() {
        this.recipesContainer.innerHTML = '';

        RECIPES.forEach(recipe => {
            const canCraft = this.canCraft(recipe);
            const recipeEl = document.createElement('div');
            recipeEl.className = `recipe-card ${canCraft ? 'craftable' : 'locked'}`;

            const ingredientsHtml = recipe.ingredients.map(ing => {
                const have = this.inventory.getItemCount(ing.item.id);
                const enough = have >= ing.amount;
                return `
                    <div class="ingredient ${enough ? 'have' : 'need'}">
                        <span class="ing-icon">${ing.item.icon}</span>
                        <span class="ing-count">${have}/${ing.amount}</span>
                    </div>
                `;
            }).join('');

            recipeEl.innerHTML = `
                <div class="recipe-result">
                    <span class="result-icon">${recipe.icon}</span>
                    <span class="result-name">${recipe.name}</span>
                </div>
                <div class="recipe-ingredients">
                    ${ingredientsHtml}
                </div>
                <button class="craft-btn" ${canCraft ? '' : 'disabled'}>
                    ${canCraft ? '⚒️ Create' : '🔒 Need Resources'}
                </button>
            `;

            const craftBtn = recipeEl.querySelector('.craft-btn');
            if (canCraft) {
                craftBtn.addEventListener('click', () => this.craft(recipe));
            }

            this.recipesContainer.appendChild(recipeEl);
        });
    }

    render() {
        // Render inventory slots
        const slots = this.inventory.getSlots();
        const equipped = this.inventory.getEquipped();
        const slotElements = this.grid.querySelectorAll('.inventory-slot');

        slotElements.forEach((el, index) => {
            const item = slots[index];
            const iconEl = el.querySelector('.slot-icon');
            const countEl = el.querySelector('.slot-count');

            if (item) {
                el.classList.add('has-item');
                iconEl.textContent = item.icon;
                countEl.textContent = item.quantity > 1 ? item.quantity : '';
                countEl.style.display = item.quantity > 1 ? 'block' : 'none';

                // Show equipped indicator
                if (equipped && item.id === equipped.id && item.equipable) {
                    el.classList.add('equipped');
                } else {
                    el.classList.remove('equipped');
                }
            } else {
                el.classList.remove('has-item', 'equipped');
                iconEl.textContent = '';
                countEl.textContent = '';
                countEl.style.display = 'none';
            }
        });

        // Render crafting if on that tab
        if (this.activeTab === 'craft') {
            this.renderCrafting();
        }
    }
}
