/**
 * ============================================
 * UI Manager - Управление интерфейсом
 * ============================================
 * Модальные окна, инвентарь, магазин, крафт
 */

import { RECIPES, TOOLS, SHOP_ITEMS, RESOURCES, BUILDINGS, ACHIEVEMENTS, QUEST_TEMPLATES } from '../data/GameData.js';
import { SkillsUI } from './SkillsUI.js';

export class UIManager {
    constructor() {
        this.skillsUI = new SkillsUI(this);
        this.modals = {
            inventory: document.getElementById('inventory-modal'),
            shop: document.getElementById('shop-modal'),
            quests: document.getElementById('quests-modal'),
            achievements: document.getElementById('achievements-modal'),
            settings: document.getElementById('settings-modal'),
            ranking: document.getElementById('ranking-modal')
        };

        this.init();
    }

    /**
     * Инициализация UI
     */
    init() {
        this.setupButtons();
        this.setupModals();
        this.setupSettings();
        this.setupTabs();
        this.setupEnergyAdButton();
        this.renderInventory();
        this.renderCrafting();
        this.renderTools();
        this.renderBuildings();
        this.renderShop();

        // Показываем оффлайн-доход
        this.showWelcomeBack();
    }



    /**
     * Настройка кнопок
     */
    setupButtons() {
        // Инвентарь
        document.getElementById('btn-inventory')?.addEventListener('click', () => {
            this.openModal('inventory');
        });


        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyI' || e.key.toLowerCase() === 'i') {
                this.openModal('inventory');
            }
        });

        // Магазин
        document.getElementById('btn-shop')?.addEventListener('click', () => {
            this.openModal('shop');
        });

        // Навыки
        document.getElementById('btn-skills')?.addEventListener('click', () => {
            if (!this.skills) {
                const { SkillsUI } = require('./SkillsUI.js'); // Assuming bundling handles this, or use top-level import
                // Let's assume we import at top-level
            }
            // For now, assume it's attached to window or imported
            window.VoidTycoon.ui.skillsUI.show();
        });

        // Настройки
        document.getElementById('btn-settings')?.addEventListener('click', () => {
            this.openModal('settings');
            this.renderSettings();
            // Сброс состояния подтверждения
            const confirmDetails = document.getElementById('reset-confirm-container');
            const resetBtn = document.getElementById('btn-reset-progress');
            if (confirmDetails) confirmDetails.style.display = 'none';
            if (resetBtn) resetBtn.style.display = 'block';
        });

        // Обработчики сброса прогресса
        document.getElementById('btn-reset-progress')?.addEventListener('click', () => {
            document.getElementById('btn-reset-progress').style.display = 'none';
            document.getElementById('reset-confirm-container').style.display = 'block';
        });

        document.getElementById('btn-cancel-reset')?.addEventListener('click', () => {
            document.getElementById('reset-confirm-container').style.display = 'none';
            document.getElementById('btn-reset-progress').style.display = 'block';
        });

        document.getElementById('btn-confirm-reset')?.addEventListener('click', () => {
            window.VoidTycoon.storage.resetProgress();
            location.reload();
        });


        // Квесты
        document.getElementById('btn-quests')?.addEventListener('click', () => {
            this.openModal('quests');
            this.renderQuests();
        });

        // Достижения
        document.getElementById('btn-achievements')?.addEventListener('click', () => {
            this.openModal('achievements');
            this.renderAchievements();
        });

        document.getElementById('btn-ranking')?.addEventListener('click', () => {
            this.openModal('ranking');
            this.renderRanking();
        });
    }

    /**
     * Обновление активного окна (вызывается из Game loop)
     */
    updateActiveView() {
        // Если открыт инвентарь - обновляем его содержимое для актуальности ресурсов
        const invModal = document.getElementById('inventory-modal');
        if (invModal && !invModal.classList.contains('hidden')) {
            // Проверяем активную вкладку
            if (invModal.querySelector('.tab-btn[data-tab="items"]')?.classList.contains('active')) {

            } else if (invModal.querySelector('.tab-btn[data-tab="craft"]')?.classList.contains('active')) {
                this.renderCrafting();
            } else if (invModal.querySelector('.tab-btn[data-tab="tools"]')?.classList.contains('active')) {
                this.renderTools();
            }
        }
    }

    /**
     * Настройка модальных окон
     */
    setupModals() {
        // Закрытие по кнопке
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeAllModals();
            });
        });

        // Закрытие по клику вне контента
        Object.values(this.modals).forEach(modal => {
            if (!modal) return;
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeAllModals();
                }
            });
        });
    }

    /**
     * Настройка вкладок
     */
    setupTabs() {
        document.querySelectorAll('.modal-tabs').forEach(tabsContainer => {
            tabsContainer.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const tabName = btn.dataset.tab;
                    const modal = btn.closest('.modal-content');

                    // Активация кнопки
                    tabsContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    // Показ контента
                    modal.querySelectorAll('.tab-content').forEach(content => {
                        content.classList.toggle('active', content.dataset.tab === tabName);
                    });

                    // Перерисовка при переключении
                    if (tabName === 'craft') this.renderCrafting();
                    if (tabName === 'tools') this.renderTools();
                    if (tabName === 'items') this.renderInventory();
                });
            });
        });
    }

    /**
     * Кнопка восстановления энергии за рекламу
     */
    setupEnergyAdButton() {
        const adBtn = document.getElementById('energy-ad-btn');
        if (!adBtn) return;

        adBtn.addEventListener('click', () => {
            this.showRewardedAd();
        });
    }

    /**
     * Показ рекламы с наградой (AdsGram)
     */
    showRewardedAd() {
        // Используем централизованный AdsManager
        if (window.VoidTycoon?.ads) {
            window.VoidTycoon.ads.showAdForEnergy();
        } else {

            this.grantAdReward();
        }
    }

    /**
     * Выдача награды за рекламу
     */
    grantAdReward() {
        const storage = window.VoidTycoon.storage;
        if (!storage) return;

        storage.restoreEnergy(50);
        this.showNotification('⚡ +50 энергии!', 'success');
        window.VoidTycoon.telegram?.hapticFeedback('success');

        // Обновляем HUD
        const scene = window.VoidTycoon.game?.scene?.getScene('GameScene');
        scene?.updateHUD();
    }

    /**
     * Открытие модального окна
     */
    openModal(modalId) {
        this.closeAllModals();
        const modal = this.modals[modalId];
        if (!modal) return;

        modal.classList.remove('hidden');
        window.VoidTycoon.telegram?.showBackButton();
        window.VoidTycoon.telegram?.hapticFeedback('light');
        window.VoidTycoon.sound?.playClick();

        // Обновление содержимого
        if (modalId === 'inventory') {
            this.renderInventory();
            this.renderCrafting();
            this.renderTools();
        } else if (modalId === 'shop') {
            this.renderShop();
        }
    }

    /**
     * Закрытие всех модальных окон
     */
    closeAllModals() {
        Object.values(this.modals).forEach(modal => {
            if (modal) modal.classList.add('hidden');
        });
        window.VoidTycoon.telegram?.hideBackButton();
    }

    /**
     * Рендер инвентаря
     */
    renderInventory() {
        const grid = document.getElementById('inventory-grid');
        if (!grid) return;

        const storage = window.VoidTycoon.storage;
        if (!storage) return;

        const inventory = storage.getInventory();
        const equipped = storage.getEquipped();

        grid.innerHTML = '';

        for (let i = 0; i < 20; i++) {
            const item = inventory[i];
            const slot = document.createElement('div');
            slot.className = 'inv-slot';

            if (item) {
                slot.classList.add('has-item');
                slot.innerHTML = `
                    <span class="item-icon">${item.icon}</span>
                    ${item.quantity > 1 ? `<span class="item-count">${item.quantity}</span>` : ''}
                `;

                // Клик для использования или просмотра
                slot.addEventListener('click', () => this.handleItemClick(i));
            }

            grid.appendChild(slot);
        }
    }

    /**
     * Обработка клика по предмету
     */
    handleItemClick(slotIndex) {
        const storage = window.VoidTycoon.storage;
        const item = storage.getInventory()[slotIndex];

        if (!item) return;

        // Если это ресурс или обычный предмет без эффекта - показываем инфо
        if (item.type === 'resource' || !item.effect) {
            // Попробуем найти описание в RESOURCES (если это ресурс) или в самом предмете
            let desc = item.description;

            if (!desc && item.type === 'resource' && RESOURCES[item.id]) {
                desc = RESOURCES[item.id].description;
            }

            if (!desc) desc = 'Предмет';

            this.showNotification(`ℹ️ ${item.name}: ${desc}`, 'info');
            return;
        }

        // Если расходуемый предмет с эффектом - используем
        this.useItem(slotIndex);
    }

    /**
     * Использование предмета
     */
    useItem(slotIndex) {
        const storage = window.VoidTycoon.storage;
        const item = storage.getInventory()[slotIndex];

        if (!item) return;

        // Consumable предметы
        if (item.type === 'consumable' && item.effect) {
            if (item.effect.energy) {
                storage.restoreEnergy(item.effect.energy);
                this.showNotification(`⚡ +${item.effect.energy} энергии!`, 'success');
            }
            if (item.effect.xp) {
                storage.addXP(item.effect.xp);
                this.showNotification(`✨ +${item.effect.xp} XP!`, 'success');
            }

            storage.removeFromInventory(slotIndex);
            this.renderInventory();

            const scene = window.VoidTycoon.game?.scene?.getScene('GameScene');
            scene?.updateHUD();
        }

        window.VoidTycoon.telegram?.hapticFeedback('light');
    }

    /**
     * Рендер крафта
     */
    renderCrafting() {
        const panel = document.getElementById('craft-panel');
        if (!panel) return;

        const storage = window.VoidTycoon.storage;
        if (!storage) return;

        const resources = storage.getResources();

        panel.innerHTML = '';

        RECIPES.forEach(recipe => {
            const canCraft = recipe.ingredients.every(ing =>
                resources[ing.resourceId] >= ing.amount
            );

            const recipeEl = document.createElement('div');
            recipeEl.className = `craft-recipe ${canCraft ? 'available' : ''}`;

            const ingredientsHtml = recipe.ingredients.map(ing => {
                const have = resources[ing.resourceId] || 0;
                const enough = have >= ing.amount;
                const resData = RESOURCES[ing.resourceId];

                return `
                    <div class="ingredient ${enough ? 'have' : 'need'}">
                        <span>${resData?.icon || '?'}</span>
                        <span class="cost-display" style="font-size:0.9em">Нужно: <b>${ing.amount}</b> <span style="color:${enough ? '#4cd137' : '#ff6b6b'}">(Есть: ${Math.floor(have)})</span></span>
                    </div>
                `;
            }).join('');

            recipeEl.innerHTML = `
                <div class="recipe-header">
                    <span class="recipe-icon">${recipe.result.icon}</span>
                    <div>
                        <div class="recipe-name">${recipe.result.name}</div>
                        <div class="recipe-desc">${recipe.result.description || ''}</div>
                    </div>
                </div>
                <div class="recipe-ingredients">${ingredientsHtml}</div>
                <button class="craft-btn" ${canCraft ? '' : 'disabled'}>
                    ${canCraft ? '⚒️ Создать' : '🔒 Недостаточно ресурсов'}
                </button>
            `;

            if (canCraft) {
                recipeEl.querySelector('.craft-btn').addEventListener('click', () => {
                    this.craftItem(recipe);
                });
            }

            panel.appendChild(recipeEl);
        });
    }

    /**
     * Крафт предмета
     */
    craftItem(recipe) {
        const storage = window.VoidTycoon.storage;

        // Проверка ресурсов
        const canCraft = recipe.ingredients.every(ing =>
            storage.getResources()[ing.resourceId] >= ing.amount
        );

        if (!canCraft) return;

        // Расход ресурсов
        recipe.ingredients.forEach(ing => {
            storage.useResource(ing.resourceId, ing.amount);
        });

        // Выдача результата
        if (recipe.result.type === 'resource') {
            // Ресурс (добавляем в общий пул)
            storage.addResource(recipe.result.id, recipe.result.amount || 1);
        } else if (recipe.result.id && TOOLS[recipe.result.id]) {
            // Это инструмент - разблокируем
            storage.unlockTool(recipe.result.id);
        } else {
            // Обычный предмет в инвентарь (зелья и т.д.)
            storage.addToInventory({ ...recipe.result, quantity: 1 });
        }

        // XP за крафт
        storage.addXP(recipe.xpReward || 20);
        storage.data.stats.totalCrafted++;
        storage.save();

        // Уведомление
        this.showNotification(`✨ Создано: ${recipe.result.name}!`, 'success');
        window.VoidTycoon.telegram?.hapticFeedback('success');
        window.VoidTycoon.sound?.playSuccess();

        // Обновление UI
        this.renderCrafting();
        this.renderTools();
        this.renderInventory();
        this.checkAchievements();
        this.trackQuestProgress('craft', null, 1);

        const scene = window.VoidTycoon.game?.scene?.getScene('GameScene');
        scene?.updateHUD();
    }

    /**
     * Рендер инструментов
     */
    renderTools() {
        const panel = document.getElementById('tools-panel');
        if (!panel) return;

        const storage = window.VoidTycoon.storage;
        if (!storage) return;

        const unlocked = storage.data.tools.unlocked;
        const current = storage.data.tools.current;
        const playerLevel = storage.getPlayer().level;

        panel.innerHTML = '';

        Object.values(TOOLS).forEach(tool => {
            const isUnlocked = unlocked.includes(tool.id);
            const isEquipped = current === tool.id;
            const canUse = playerLevel >= tool.level;

            const toolEl = document.createElement('div');
            toolEl.className = `craft-recipe ${isEquipped ? 'available' : ''}`;

            toolEl.innerHTML = `
                <div class="recipe-header">
                    <span class="recipe-icon">${tool.icon}</span>
                    <div>
                        <div class="recipe-name">${tool.name} ${isEquipped ? '✓' : ''}</div>
                        <div class="recipe-desc">${tool.description}</div>
                        <div class="recipe-desc">⚡ -${tool.energyCost} | Скорость: x${tool.speed} | Уровень: ${tool.level}</div>
                    </div>
                </div>
                <button class="craft-btn" ${isUnlocked && canUse && !isEquipped ? '' : 'disabled'}>
                    ${!isUnlocked ? '🔒 Скрафтите' : (!canUse ? `🔒 Уровень ${tool.level}` : (isEquipped ? '✓ Экипировано' : '🎯 Экипировать'))}
                </button>
            `;

            if (isUnlocked && canUse && !isEquipped) {
                toolEl.querySelector('.craft-btn').addEventListener('click', () => {
                    storage.equipTool(tool.id);
                    this.showNotification(`🎯 ${tool.name} экипирован!`, 'success');
                    window.VoidTycoon.telegram?.hapticFeedback('medium');
                    this.renderTools();
                });
            }

            panel.appendChild(toolEl);
        });
    }

    /**
     * Рендер построек
     */
    renderBuildings() {
        const panel = document.getElementById('buildings-panel');
        if (!panel) return;

        const storage = window.VoidTycoon.storage;
        if (!storage) return;

        const ownedBuildings = storage.data.buildings || {};
        const resources = storage.getResources();

        panel.innerHTML = '';

        Object.values(BUILDINGS).forEach(building => {
            const currentLevel = ownedBuildings[building.id] || 0;
            const maxLevel = building.maxLevel;
            const isMaxed = currentLevel >= maxLevel;

            // Вычисляем стоимость следующего уровня
            const nextLevelCost = {};
            let canAfford = true;

            if (!isMaxed) {
                const multiplier = Math.pow(building.costMultiplier, currentLevel);
                for (const [res, amount] of Object.entries(building.baseCost)) {
                    const cost = Math.floor(amount * multiplier);
                    nextLevelCost[res] = cost;
                    if ((resources[res] || 0) < cost) {
                        canAfford = false;
                    }
                }
            }

            // Формируем описание цены
            let costHtml = '';
            if (isMaxed) {
                costHtml = '<span style="color: #ffd700">⭐ MAX LEVEL</span>';
            } else {
                costHtml = Object.entries(nextLevelCost)
                    .map(([res, amount]) => `${RESOURCES[res]?.icon || res} ${amount}`)
                    .join(' ');
            }

            // Формируем описание производства
            const prodHtml = Object.entries(building.production)
                .map(([res, amount]) => `+${amount}/сек ${RESOURCES[res]?.icon || res}`)
                .join(', ');

            const buildingEl = document.createElement('div');
            buildingEl.className = `craft-recipe ${canAfford ? 'available' : ''}`;

            buildingEl.innerHTML = `
                <div class="recipe-header">
                    <span class="recipe-icon">${building.icon}</span>
                    <div>
                        <div class="recipe-name">${building.name} (Уровень ${currentLevel})</div>
                        <div class="recipe-desc">${building.description}</div>
                         <div class="recipe-desc" style="color: #4cd137">${prodHtml}</div>
                         <div class="recipe-cost">${costHtml}</div>
                    </div>
                </div>
                <button class="craft-btn" ${canAfford && !isMaxed ? '' : 'disabled'}>
                    ${isMaxed ? '✓' : (currentLevel === 0 ? '🔨 Построить' : '⬆️ Улучшить')}
                </button>
            `;

            if (canAfford && !isMaxed) {
                buildingEl.querySelector('.craft-btn').addEventListener('click', () => {
                    this.buyBuilding(building.id, nextLevelCost);
                });
            }

            panel.appendChild(buildingEl);
        });
    }

    /**
     * Покупка здания
     */
    buyBuilding(buildingId, cost) {
        const storage = window.VoidTycoon.storage;

        // Списываем ресурсы
        for (const [res, amount] of Object.entries(cost)) {
            storage.useResource(res, amount);
        }

        // Повышаем уровень
        if (!storage.data.buildings) storage.data.buildings = {};
        storage.data.buildings[buildingId] = (storage.data.buildings[buildingId] || 0) + 1;
        storage.save();

        if (buildingId === 'turret') {
            const scene = window.VoidTycoon.game?.scene?.getScene('GameScene');
            scene?.loadBuiltTurrets();
        }

        // Проверка победы
        if (buildingId === 'portal') {
            this.showWinScreen();
            return;
        }

        this.showNotification(`🏗️ ${BUILDINGS[buildingId].name} улучшено!`, 'success');
        window.VoidTycoon.sound?.playLevelUp();
        window.VoidTycoon.telegram?.hapticFeedback('success');

        this.renderBuildings();
        this.renderInventory();
        this.checkAchievements();
    }

    /**
     * Экран Победы
     */
    showWinScreen() {
        // Создаем оверлей победы
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.background = 'rgba(0,0,0,0.9)';
        overlay.style.zIndex = '9999';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.color = 'white';
        overlay.style.textAlign = 'center';
        overlay.style.animation = 'fadeIn 2s';

        overlay.innerHTML = `
            <div style="font-size: 5rem;">🌌</div>
            <h1 style="font-size: 3rem; margin: 20px 0; color: #a29bfe; text-shadow: 0 0 20px #6c5ce7;">ПОБЕДА!</h1>
            <p style="font-size: 1.2rem; max-width: 80%; line-height: 1.6;">
                Ты построил Портал Измерений и сбежал из Пустоты!<br>
                Ты стал настоящим Магнатом.
            </p>
            <div style="margin-top: 40px; font-size: 1.5rem; color: #ffd700;">
                ⭐ Спасибо за игру! ⭐
            </div>
            <button id="win-reload" style="margin-top: 50px; padding: 15px 40px; font-size: 1.2rem; background: #6c5ce7; border: none; border-radius: 30px; color: white; cursor: pointer;">
                Начать Новую Игру +
            </button>
        `;

        document.body.appendChild(overlay);
        window.VoidTycoon.sound?.playLevelUp();

        document.getElementById('win-reload').addEventListener('click', () => {

            window.VoidTycoon.storage.resetProgress();
            location.reload();
        });
    }

    /**
     * Показ оффлайн-дохода
     */
    showWelcomeBack() {
        const storage = window.VoidTycoon.storage;
        const earnings = storage?.offlineEarnings;

        if (!earnings) return;

        const { earnings: resources, seconds } = earnings;
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        // Форматируем время
        let timeStr = '';
        if (hours > 0) timeStr += `${hours}ч `;
        timeStr += `${minutes}мин`;

        // Форматируем ресурсы
        const RESOURCE_ICONS = {
            wood: '🪵', iron: '🔩', crystal: '💎',
            hardwood: '🟫', steel: '🏗️', chip: '💾', quantum: '⚛️'
        };

        const resourcesHtml = Object.entries(resources)
            .filter(([_, amt]) => amt > 0)
            .map(([res, amt]) => `
                <div style="display: flex; align-items: center; gap: 8px; margin: 8px 0;">
                    <span style="font-size: 1.5rem;">${RESOURCE_ICONS[res] || '📦'}</span>
                    <span style="font-size: 1.2rem; color: #4cd137;">+${Math.floor(amt)}</span>
                </div>
            `).join('');

        // Создаём попап
        const overlay = document.createElement('div');
        overlay.className = 'welcome-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); z-index: 9998;
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            color: white; text-align: center; animation: fadeIn 0.5s;
        `;

        overlay.innerHTML = `
            <div style="font-size: 3rem; margin-bottom: 10px;">👋</div>
            <h2 style="margin: 10px 0; color: #a29bfe;">С возвращением!</h2>
            <p style="color: #888; margin-bottom: 20px;">Ты отсутствовал ${timeStr}</p>
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; min-width: 200px;">
                <div style="font-size: 0.9rem; color: #888; margin-bottom: 10px;">Твои здания заработали:</div>
                ${resourcesHtml}
            </div>
            <button id="welcome-close" style="margin-top: 30px; padding: 15px 40px; background: #6c5ce7; border: none; border-radius: 30px; color: white; font-size: 1rem; cursor: pointer;">
                🎉 Забрать
            </button>
        `;

        document.body.appendChild(overlay);
        window.VoidTycoon.sound?.playSuccess();
        window.VoidTycoon.telegram?.hapticFeedback('success');

        document.getElementById('welcome-close').addEventListener('click', () => {
            overlay.remove();
            // Обновляем HUD
            const scene = window.VoidTycoon.game?.scene?.getScene('GameScene');
            scene?.updateHUD();
        });
    }

    /**
     * Рендер магазина
     */
    renderShop() {
        const container = document.getElementById('shop-items');
        if (!container) return;

        container.innerHTML = '';

        SHOP_ITEMS.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'shop-item';

            itemEl.innerHTML = `
                <span class="item-icon">${item.icon}</span>
                <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-desc">${item.description}</div>
                </div>
                <button class="buy-btn">
                    <span class="star-icon">⭐</span>
                    ${item.price?.amount || item.priceStars || 0}
                </button>
            `;

            itemEl.querySelector('.buy-btn').addEventListener('click', () => {
                this.purchaseItem(item);
            });

            container.appendChild(itemEl);
        });
    }

    /**
     * Покупка товара
     */
    async purchaseItem(item) {
        const telegram = window.VoidTycoon.telegram;
        const storage = window.VoidTycoon.storage;

        try {
            const result = await telegram.payWithStars(
                item.priceStars,
                item.name,
                item.description,
                item.id
            );

            if (result.success) {
                // Применяем награду
                this.applyPurchase(item);
            } else if (result.reason === 'cancelled') {
                this.showNotification('Покупка отменена', 'error');
            }
        } catch (error) {
            console.error('Ошибка покупки:', error);
            this.showNotification('Ошибка оплаты', 'error');
        }
    }

    /**
     * Применение покупки
     */
    applyPurchase(item) {
        const storage = window.VoidTycoon.storage;

        switch (item.action) {
            case 'vip':
                storage.activateVIP(item.duration);
                this.showNotification('👑 VIP статус активирован!', 'success');
                break;

            case 'resources':
                Object.entries(item.rewards).forEach(([resource, amount]) => {
                    storage.addResource(resource, amount);
                });
                this.showNotification('📦 Ресурсы получены!', 'success');
                break;

            case 'energy':
                storage.data.player.energy = storage.data.player.maxEnergy;
                storage.save();
                this.showNotification('⚡ Энергия восстановлена!', 'success');
                break;
        }

        window.VoidTycoon.telegram?.hapticFeedback('success');

        const scene = window.VoidTycoon.game?.scene?.getScene('GameScene');
        scene?.updateHUD();
    }

    /**
     * Отрисовка настроек
     */
    renderSettings() {
        const storage = window.VoidTycoon.storage;
        if (!storage) return;

        const settings = storage.data.settings;

        document.getElementById('setting-sound').checked = settings.soundEnabled;
        document.getElementById('setting-music').checked = settings.musicEnabled !== false;
        document.getElementById('setting-haptic').checked = settings.vibrationEnabled;
    }

    /**
     * Настройка обработчиков настроек
     */
    setupSettings() {
        // Звук
        document.getElementById('setting-sound')?.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            window.VoidTycoon.storage.data.settings.soundEnabled = enabled;
            window.VoidTycoon.storage.save();
            window.VoidTycoon.sound.masterVolume = enabled ? 0.5 : 0;
        });

        // Музыка
        document.getElementById('setting-music')?.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            window.VoidTycoon.storage.data.settings.musicEnabled = enabled;
            window.VoidTycoon.storage.save();
            if (enabled) {
                window.VoidTycoon.sound.startAmbientMusic();
            } else {
                window.VoidTycoon.sound.isMusicPlaying = false; // Stop logic need improvement in SoundManager
            }
        });

        // Вибрация
        document.getElementById('setting-haptic')?.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            window.VoidTycoon.storage.data.settings.vibrationEnabled = enabled;
            window.VoidTycoon.storage.save();
        });

        // Сброс прогресса
        document.getElementById('btn-reset-progress')?.addEventListener('click', () => {
            if (confirm('⚠️ Вы уверены? Весь прогресс будет потерян навсегда!')) {
                window.VoidTycoon.storage.resetProgress();
                location.reload();
            }
        });
    }

    /**
     * Показ уведомления
     */
    showNotification(message, type = 'info') {
        const container = document.getElementById('notifications-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `<span>${message}</span>`;

        container.appendChild(notification);

        // Удаление через 3 секунды
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    /**
     * Рендер достижений
     */
    renderAchievements() {
        const container = document.getElementById('achievements-list');
        const starsEl = document.getElementById('stars-count');
        if (!container) return;

        const storage = window.VoidTycoon.storage;
        if (!storage) return;

        const unlocked = storage.data.achievements || [];
        const stars = storage.data.stats?.stars || 0;

        if (starsEl) starsEl.textContent = stars;

        container.innerHTML = '';

        ACHIEVEMENTS.forEach(achievement => {
            const isUnlocked = unlocked.includes(achievement.id);

            // Получаем текущий прогресс
            let currentValue = 0;
            const stat = achievement.condition.stat;

            if (stat === 'level') {
                currentValue = storage.data.player?.level || 1;
            } else if (stat === 'totalBuildings') {
                currentValue = Object.values(storage.data.buildings || {}).reduce((a, b) => a + b, 0);
            } else {
                currentValue = storage.data.stats?.[stat] || 0;
            }

            const progress = Math.min(currentValue / achievement.condition.value, 1);
            const progressPercent = Math.floor(progress * 100);

            const el = document.createElement('div');
            el.className = `achievement-item ${isUnlocked ? 'unlocked' : ''}`;
            el.style.cssText = `
                display: flex; align-items: center; gap: 12px;
                background: ${isUnlocked ? 'rgba(76,209,55,0.15)' : 'rgba(255,255,255,0.05)'};
                padding: 12px; border-radius: 12px; margin-bottom: 10px;
                border: 1px solid ${isUnlocked ? '#4cd137' : 'rgba(255,255,255,0.1)'};
            `;

            el.innerHTML = `
                <div style="font-size: 2rem; opacity: ${isUnlocked ? 1 : 0.5};">${achievement.icon}</div>
                <div style="flex: 1;">
                    <div style="font-weight: bold; color: ${isUnlocked ? '#4cd137' : '#fff'};">${achievement.name}</div>
                    <div style="font-size: 0.85rem; color: #888;">${achievement.description}</div>
                    ${!isUnlocked ? `
                        <div style="margin-top: 6px; background: rgba(255,255,255,0.1); height: 4px; border-radius: 2px; overflow: hidden;">
                            <div style="width: ${progressPercent}%; height: 100%; background: #6c5ce7;"></div>
                        </div>
                        <div style="font-size: 0.75rem; color: #666; margin-top: 2px;">${currentValue}/${achievement.condition.value}</div>
                    ` : ''}
                </div>
                <div style="color: #ffd700; font-size: 0.9rem;">
                    ${isUnlocked ? '✅' : `⭐ ${achievement.reward.stars}`}
                </div>
            `;

            container.appendChild(el);
        });
    }

    /**
     * Проверка и разблокировка достижений
     */
    checkAchievements() {
        const storage = window.VoidTycoon.storage;
        if (!storage) return;

        const unlocked = storage.data.achievements || [];
        let newUnlocks = [];

        ACHIEVEMENTS.forEach(achievement => {
            if (unlocked.includes(achievement.id)) return;

            let currentValue = 0;
            const stat = achievement.condition.stat;

            if (stat === 'level') {
                currentValue = storage.data.player?.level || 1;
            } else if (stat === 'totalBuildings') {
                currentValue = Object.values(storage.data.buildings || {}).reduce((a, b) => a + b, 0);
            } else {
                currentValue = storage.data.stats?.[stat] || 0;
            }

            if (currentValue >= achievement.condition.value) {
                unlocked.push(achievement.id);
                newUnlocks.push(achievement);

                // Награда
                storage.data.stats.stars = (storage.data.stats.stars || 0) + achievement.reward.stars;
            }
        });

        if (newUnlocks.length > 0) {
            storage.data.achievements = unlocked;
            storage.save();

            // Показываем уведомления
            newUnlocks.forEach(ach => {
                this.showNotification(`🏆 Достижение: ${ach.name}! +${ach.reward.stars}⭐`, 'success');
            });

            window.VoidTycoon.sound?.playLevelUp();
            window.VoidTycoon.telegram?.hapticFeedback('success');
        }
    }

    /**
     * Рендер ежедневных квестов
     */
    renderQuests() {
        const container = document.getElementById('quests-list');
        const timerEl = document.getElementById('quests-timer');
        if (!container) return;

        const storage = window.VoidTycoon.storage;
        if (!storage) return;

        // Генерируем квесты на основе даты (seed = день)
        const today = new Date();
        const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

        // Выбираем 3 квеста на сегодня
        const todayQuests = this.getDailyQuests(dateSeed);

        // Получаем прогресс
        const questProgress = storage.data.quests || {};
        const todayKey = `day_${dateSeed}`;

        if (!questProgress[todayKey]) {
            questProgress[todayKey] = {};
            storage.data.quests = questProgress;
        }

        const todayProgress = questProgress[todayKey];

        // Таймер до обновления
        this.updateQuestTimer(timerEl);

        container.innerHTML = '';

        todayQuests.forEach(quest => {
            const progress = todayProgress[quest.id] || 0;
            const isComplete = progress >= quest.target;
            const isClaimed = todayProgress[`${quest.id}_claimed`] || false;
            const progressPercent = Math.min(progress / quest.target * 100, 100);

            const el = document.createElement('div');
            el.style.cssText = `
                display: flex; align-items: center; gap: 12px;
                background: ${isComplete ? 'rgba(76,209,55,0.1)' : 'rgba(255,255,255,0.05)'};
                padding: 12px; border-radius: 12px; margin-bottom: 10px;
                border: 1px solid ${isComplete ? '#4cd137' : 'rgba(255,255,255,0.1)'};
            `;

            el.innerHTML = `
                <div style="font-size: 1.8rem;">${quest.icon}</div>
                <div style="flex: 1;">
                    <div style="font-weight: bold; color: ${isComplete ? '#4cd137' : '#fff'};">${quest.name}</div>
                    <div style="font-size: 0.85rem; color: #888;">${quest.description}</div>
                    <div style="margin-top: 6px; background: rgba(255,255,255,0.1); height: 4px; border-radius: 2px; overflow: hidden;">
                        <div style="width: ${progressPercent}%; height: 100%; background: ${isComplete ? '#4cd137' : '#6c5ce7'}; transition: width 0.3s;"></div>
                    </div>
                    <div style="font-size: 0.75rem; color: #666; margin-top: 2px;">${Math.min(progress, quest.target)}/${quest.target}</div>
                </div>
                <div style="text-align: center;">
                    ${isClaimed ? '<span style="color: #4cd137;">✅</span>' :
                    (isComplete ? `<button class="claim-quest-btn" data-quest="${quest.id}" style="padding: 8px 12px; background: #4cd137; border: none; border-radius: 8px; color: white; cursor: pointer;">⭐ ${quest.reward.stars}</button>` :
                        `<span style="color: #ffd700;">⭐ ${quest.reward.stars}</span>`)}
                </div>
            `;

            container.appendChild(el);
        });

        // Обработчики кнопок "Забрать"
        container.querySelectorAll('.claim-quest-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const questId = btn.dataset.quest;
                const quest = todayQuests.find(q => q.id === questId);
                if (quest) {
                    storage.data.stats.stars = (storage.data.stats.stars || 0) + quest.reward.stars;
                    storage.data.quests[todayKey][`${questId}_claimed`] = true;
                    storage.save();
                    this.showNotification(`⭐ +${quest.reward.stars} Stars!`, 'success');
                    window.VoidTycoon.sound?.playSuccess();
                    this.renderQuests();
                }
            });
        });
    }

    /**
     * Получить квесты на день
     */
    getDailyQuests(seed) {
        const shuffled = [...QUEST_TEMPLATES].sort((a, b) => {
            const hashA = (seed * 31 + a.id.charCodeAt(0)) % 1000;
            const hashB = (seed * 31 + b.id.charCodeAt(0)) % 1000;
            return hashA - hashB;
        });
        return shuffled.slice(0, 3);
    }

    /**
     * Обновление таймера квестов
     */
    updateQuestTimer(el) {
        if (!el) return;

        const update = () => {
            const now = new Date();
            const midnight = new Date(now);
            midnight.setHours(24, 0, 0, 0);
            const diff = midnight - now;

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            el.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        };

        update();
        // Обновляем каждую секунду пока модалка открыта
        this.questTimerInterval = setInterval(update, 1000);
    }

    /**
     * Трекинг прогресса квестов
     */
    trackQuestProgress(type, resourceType, amount) {
        const storage = window.VoidTycoon.storage;
        if (!storage) return;

        const today = new Date();
        const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        const todayKey = `day_${dateSeed}`;

        if (!storage.data.quests) storage.data.quests = {};
        if (!storage.data.quests[todayKey]) storage.data.quests[todayKey] = {};

        const todayQuests = this.getDailyQuests(dateSeed);

        todayQuests.forEach(quest => {
            // Пропускаем уже завершённые
            if (storage.data.quests[todayKey][`${quest.id}_claimed`]) return;

            let shouldUpdate = false;

            if (type === 'resource' && quest.trackResource) {
                // Квест на сбор конкретного ресурса
                if (quest.trackResource === resourceType) {
                    shouldUpdate = true;
                }
            } else if (type === 'craft' && quest.trackStat === 'dailyCrafts') {
                shouldUpdate = true;
                amount = 1;
            }

            if (shouldUpdate) {
                const currentProgress = storage.data.quests[todayKey][quest.id] || 0;
                storage.data.quests[todayKey][quest.id] = currentProgress + amount;
                storage.save();
            }
        });
    }
    /**
     * Рендеринг таблицы лидеров (Mock Data)
     */
    async renderRanking() {
        const container = document.getElementById('ranking-list');
        if (!container) return;

        container.innerHTML = `
            <div style="text-align:center; padding: 20px; color: #888;">⏳ Загрузка лидеров...</div>
            <div id="debug-log" style="font-family: monospace; font-size: 10px; color: #aaa; max-height: 100px; overflow-y: auto; background: rgba(0,0,0,0.5); padding: 5px; margin-top: 10px; text-align: left;"></div>
        `;

        const myName = window.VoidTycoon?.telegram?.getUsername() || 'Вы';
        const myXP = window.VoidTycoon?.storage?.data?.stats?.totalXP || 0;
        const storage = window.VoidTycoon?.storage;

        if (storage && window.VoidTycoon?.leaderboard) {
            // Use Telegram ID or generate random one for browser testing
            let userId = window.VoidTycoon.telegram?.getUserId();
            if (!userId) {
                userId = parseInt(localStorage.getItem('void_tycoon_user_id')) ||
                    Math.floor(Math.random() * 1000000000);
                localStorage.setItem('void_tycoon_user_id', userId);
                console.log('Using browser test ID:', userId);
            }

            console.log('Syncing score...', userId, myName, myXP);
            await window.VoidTycoon.leaderboard.syncScore(userId, myName, myXP);
        }

        const users = await window.VoidTycoon.leaderboard.getTopPlayers(50);

        container.innerHTML = '';

        if (!users || users.length === 0) {
            let errorMsg = '';
            if (window.VoidTycoon.leaderboard.lastError) {
                errorMsg = `<br><span style="color:red; font-size:12px;">${window.VoidTycoon.leaderboard.lastError.message || 'Ошибка сети'}</span>`;
            }
            container.innerHTML = `<div style="text-align:center; padding: 20px; color:#aaa;">Список пуст. Стань первым! 🥇${errorMsg}</div>`;
            return;
        }

        let myRank = -1;

        users.forEach((user, index) => {
            const rank = index + 1;
            const isMe = user.username === myName && user.xp === myXP;

            const item = document.createElement('div');
            item.className = 'ranking-item';
            item.style.cssText = `
                display: flex; 
                justify-content: space-between; 
                padding: 10px; 
                background: ${isMe ? 'rgba(108, 92, 231, 0.3)' : 'rgba(255,255,255,0.05)'}; 
                border-radius: 8px;
                align-items: center;
                border: ${isMe ? '1px solid #6c5ce7' : 'none'};
                margin-bottom: 5px;
            `;

            let rankBadge = `<span style="width: 24px; text-align: center; color: #888; font-weight: bold;">#${rank}</span>`;
            if (rank === 1) rankBadge = '🥇';
            if (rank === 2) rankBadge = '🥈';
            if (rank === 3) rankBadge = '🥉';

            item.innerHTML = `
                <div style="display: flex; gap: 10px; align-items: center;">
                    <div style="font-size: 1.2rem; min-width: 30px;">${rankBadge}</div>
                    <div style="font-weight: ${isMe ? 'bold' : 'normal'}; color: ${isMe ? '#fff' : '#ccc'};">
                        ${user.username || 'Аноним'}
                    </div>
                </div>
                <div style="color: #ffd700; font-weight: bold;">${this.formatNumber(user.xp)} XP</div>
            `;

            container.appendChild(item);

            if (isMe) myRank = rank;
        });

        const footerRank = document.querySelector('.user-rank');
        if (footerRank) {
            footerRank.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                   <span style="font-weight: bold; color: #a29bfe;">${myRank > 0 ? '#' + myRank : '-'}</span>
                   <span>${myName}</span>
                </div>
                <span style="font-weight: bold; color: #ffd700;">${this.formatNumber(myXP)} XP</span>
             `;
        }
    }

    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num.toString();
    }

    /**
     * Экран победы
     */
    showWinScreen() {
        // Создаем оверлей
        const overlay = document.createElement('div');
        overlay.id = 'win-screen';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 3000;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: #fff;
            animation: fadeIn 1s ease;
        `;

        const storage = window.VoidTycoon.storage;
        const prestige = storage.data.player.prestigeMultiplier || 1;
        const nextPrestige = prestige + 0.5;

        overlay.innerHTML = `
            <div style="text-align: center; max-width: 500px; padding: 20px;">
                <div style="font-size: 80px; margin-bottom: 20px;">🌌</div>
                <h1 style="font-size: 3rem; color: #a29bfe; margin-bottom: 10px; text-shadow: 0 0 20px #6c5ce7;">ПОБЕДА!</h1>
                <p style="font-size: 1.2rem; color: #ccc; margin-bottom: 30px;">
                    Вы построили Портал Измерений и покорили Пустоту.<br>
                    Ваша империя достигла вершины развития.
                </p>

                <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px; margin-bottom: 30px;">
                    <h3 style="margin-bottom: 15px;">🚀 НОВАЯ ИГРА+ (ПРЕСТИЖ)</h3>
                    <p>Начните заново с бонусом:</p>
                    <div style="font-size: 1.5rem; color: #ffd700; margin: 10px 0;">
                        x${prestige} ➔ <span style="font-weight: bold; color: #55efc4;">x${nextPrestige}</span> к добыче
                    </div>
                </div>

                <button id="btn-prestige" style="
                    background: linear-gradient(135deg, #6c5ce7, #a29bfe);
                    border: none;
                    padding: 15px 40px;
                    font-size: 1.2rem;
                    color: white;
                    border-radius: 50px;
                    cursor: pointer;
                    font-weight: bold;
                    box-shadow: 0 10px 30px rgba(108, 92, 231, 0.5);
                    transition: transform 0.2s;
                ">ВОЙТИ В ПОРТАЛ 🌀</button>

                <br><br>
                <button id="btn-stay" style="
                    background: transparent;
                    border: 1px solid #555;
                    padding: 10px 20px;
                    color: #888;
                    border-radius: 20px;
                    cursor: pointer;
                ">Остаться в этом мире</button>
            </div>
        `;

        document.body.appendChild(overlay);

        document.getElementById('btn-prestige').addEventListener('click', () => {
            window.VoidTycoon.storage.performPrestige();
            location.reload();
        });

        document.getElementById('btn-stay').addEventListener('click', () => {
            overlay.remove();
        });

        window.VoidTycoon.sound?.playSuccess();
        window.VoidTycoon.telegram?.hapticFeedback('heavy');
    }
}
