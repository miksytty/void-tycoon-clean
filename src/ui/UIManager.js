/**
 * ============================================
 * UI Manager - Управление интерфейсом
 * ============================================
 * Модальные окна, инвентарь, магазин, крафт
 */

import { RECIPES, TOOLS, SHOP_ITEMS, RESOURCES, BUILDINGS, ACHIEVEMENTS, QUEST_TEMPLATES, TECHNOLOGIES } from '../data/GameData.js';
// SKINS, BOOSTERS, STORY, PROCESSING_RECIPES removed - simplified release
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
            ranking: document.getElementById('ranking-modal'),
            research: document.getElementById('research-modal')
            // smelter removed - simplified release
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



    setupEnergyAdButton() {
        // Simple manual binding since method might not exist in early version
        const btn = document.getElementById('energy-ad-btn');
        if (btn) {
            btn.addEventListener('click', () => {
                const ads = window.VoidTycoon.ads;
                if (ads) {
                    ads.showRewardedAd(() => {
                        window.VoidTycoon.storage.restoreEnergy(50);
                        this.showNotification('⚡ +50 Энергии!', 'success');
                        this.updateHUD();
                    });
                } else {
                    console.warn('AdsManager not ready');
                }
            });
        }
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
            // SkillsUI is already instantiated in constructor as this.skillsUI
            this.skillsUI.show();
        });

        // Исследования
        document.getElementById('btn-research')?.addEventListener('click', () => {
            this.openModal('research');
            this.renderResearch();
        });


        // Smelter removed - simplified gameplay

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

        // Audio Controls
        const soundBtn = document.getElementById('btn-sound');
        if (soundBtn) {
            // Set initial state
            setTimeout(() => { // Wait for audio manager init
                if (window.VoidTycoon?.audio?.isMuted) soundBtn.textContent = '🔇';
            }, 500);

            soundBtn.addEventListener('click', () => {
                const audio = window.VoidTycoon.audio;
                if (audio) {
                    const muted = audio.toggleMute();
                    soundBtn.textContent = muted ? '🔇' : '🔊';
                    if (!muted) audio.playSFX('click');
                }
            });
        }

        // Global Click Sound
        document.body.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                // Ignore if it's the sound button itself (handled above to avoid double click when unmuring)
                if (e.target.id === 'btn-sound' || e.target.closest('#btn-sound')) return;
                window.VoidTycoon.audio?.playSFX('click');
            }
        });

        document.getElementById('btn-ranking')?.addEventListener('click', () => {
            this.openModal('ranking');
            this.renderRanking();
        });

        // Friends & Referral
        document.getElementById('btn-friends')?.addEventListener('click', () => {
            this.openModal('friends');
            this.renderFriends();
        });

        document.getElementById('btn-invite-friend')?.addEventListener('click', () => {
            window.VoidTycoon.social?.inviteFriends();
        });

        // Строительство (New Button Handler)
        document.getElementById('btn-build')?.addEventListener('click', () => {
            this.openModal('inventory');
            // Switch to buildings tab
            const btn = document.querySelector('.tab-btn[data-tab="buildings"]');
            if (btn) btn.click();
        });

        // Квесты
        document.getElementById('btn-quests')?.addEventListener('click', () => {
            this.showQuestsModal();
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

        // Analytics
        window.VoidTycoon.analytics?.logEvent('ad_watched', { type: 'energy' });
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
        window.VoidTycoon.audio?.playSFX('click');

        // Обновление содержимого
        if (modalId === 'inventory') {
            this.renderInventory();
            this.renderCrafting();
            this.renderTools();
        } else if (modalId === 'shop') {
            this.renderShop();
        } else if (modalId === 'research') {
            this.renderResearch();
        } else if (modalId === 'smelter') {
            this.renderSmelter();
            // Start loop for progress
            if (this.smelterInterval) clearInterval(this.smelterInterval);
            this.smelterInterval = setInterval(() => this.updateSmelterUI(), 100);
        } else {
            // Clear interval if closed
            if (this.smelterInterval) {
                clearInterval(this.smelterInterval);
                this.smelterInterval = null;
            }
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
                    ${this.isItemEquipped(item) ? '<span style="position:absolute; top:2px; right:2px; font-size:10px;">🛡️</span>' : ''}
                `;

                // Клик для использования или просмотра
                slot.addEventListener('click', () => this.handleItemClick(i));
            }

            grid.appendChild(slot);
        }
    }

    isItemEquipped(item) {
        if (!item) return false;
        const storage = window.VoidTycoon.storage;
        const equipped = storage.getEquipped();
        if (!equipped) return false;

        if (item.type === 'equipment') {
            return equipped[item.slot] === item.id;
        }
        if (item.type === 'pet') {
            return equipped.pet === item.id;
        }
        return false;
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

        if (item.type === 'equipment' || item.type === 'pet') {
            const equippedConfig = storage.getEquipped();
            // Check if already equipped
            let isEquipped = false;
            // Need to match ID. 
            // equipped.feet = 'boots_1', equipped.pet = 'drone_1'
            if (equippedConfig[item.slot] === item.id) isEquipped = true; // For equipment
            if (item.type === 'pet' && equippedConfig.pet === item.id) isEquipped = true;

            // If equipped, unequip? Or just show status.
            // Let's implement Equip logic.
            if (!isEquipped) {
                if (storage.equipItem(item.id, item.slot || (item.type === 'pet' ? 'pet' : 'backpack'))) {
                    this.showNotification(`⚔️ ${item.name} экипирован!`, 'success');
                    window.VoidTycoon.audio?.playSFX('collect');
                    this.renderInventory();
                }
            } else {
                if (storage.unequipItem(item.slot || (item.type === 'pet' ? 'pet' : 'backpack'))) {
                    this.showNotification(`📦 ${item.name} снят!`, 'info');
                    this.renderInventory();
                }
            }
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
        window.VoidTycoon.audio?.playSFX('collect');

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
     * Рендер построек (Selection Menu)
     */
    renderBuildings() {
        const panel = document.getElementById('buildings-panel');
        if (!panel) return;

        const storage = window.VoidTycoon.storage;
        if (!storage) return;

        const resources = storage.getResources();

        panel.innerHTML = '';

        Object.values(BUILDINGS).forEach(building => {
            // New logic: Check fixed cost
            let canAfford = true;
            for (const [res, amount] of Object.entries(building.cost)) {
                if ((resources[res] || 0) < amount) {
                    canAfford = false;
                }
            }

            // Формируем описание цены
            const costHtml = Object.entries(building.cost)
                .map(([res, amount]) => `${RESOURCES[res]?.icon || res} ${amount}`)
                .join(' ');

            // Формируем описание производства (if available)
            let prodHtml = '';
            if (building.production) {
                prodHtml = Object.entries(building.production)
                    .map(([res, amount]) => `+${amount}/мин ${RESOURCES[res]?.icon || res}`)
                    .join(', ');
            }

            const buildingEl = document.createElement('div');
            buildingEl.className = `craft-recipe ${canAfford ? 'available' : ''}`;

            buildingEl.innerHTML = `
                <div class="recipe-header">
                    <span class="recipe-icon">${building.icon}</span>
                    <div>
                        <div class="recipe-name">${building.name}</div>
                        <div class="recipe-desc">${building.description}</div>
                         <div class="recipe-desc" style="color: #4cd137">${prodHtml}</div>
                         <div class="recipe-cost">${costHtml}</div>
                    </div>
                </div>
                <button class="craft-btn" ${canAfford ? '' : 'disabled'}>
                    🔨 Разместить
                </button>
            `;

            if (canAfford) {
                buildingEl.querySelector('.craft-btn').addEventListener('click', () => {
                    this.closeAllModals();
                    // Toggle build mode
                    if (window.VoidTycoon.buildManager) {
                        window.VoidTycoon.buildManager.toggleBuildMode(building.id);
                    } else {
                        console.error('BuildManager not found');
                    }
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

        // Turret handling removed - simplified release

        // Проверка победы
        if (buildingId === 'portal') {
            this.showWinScreen();
            return;
        }

        this.showNotification(`🏗️ ${BUILDINGS[buildingId].name} улучшено!`, 'success');
        window.VoidTycoon.audio?.playSFX('levelup');
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
        window.VoidTycoon.audio?.playSFX('levelup');

        document.getElementById('win-reload').addEventListener('click', () => {

            window.VoidTycoon.storage.resetProgress();
            location.reload();
        });
    }

    /**
     * Показ оффлайн-дохода с кнопками "Забрать" и "Удвоить"
     */
    showWelcomeBack() {
        const storage = window.VoidTycoon.storage;
        const earningsData = storage?.offlineEarnings;

        if (!earningsData || !earningsData.pending) return;

        const { earnings: resources, seconds } = earningsData;
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        // Проверяем есть ли реальные ресурсы
        const hasResources = Object.values(resources).some(amt => amt > 0);
        if (!hasResources) return;

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
        overlay.id = 'welcome-back-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); z-index: 9998;
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            color: white; text-align: center; animation: fadeIn 0.5s;
        `;

        overlay.innerHTML = `
            <div style="font-size: 3rem; margin-bottom: 10px;">👋</div>
            <h2 style="margin: 10px 0; color: #a29bfe; font-size: 1.8rem;">С возвращением!</h2>
            <p style="color: #888; margin-bottom: 20px;">Ты отсутствовал ${timeStr}</p>
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; min-width: 200px;">
                <div style="font-size: 0.9rem; color: #888; margin-bottom: 10px;">Твои здания заработали:</div>
                ${resourcesHtml}
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 25px;">
                <button id="welcome-double" style="padding: 15px 40px; background: linear-gradient(45deg, #f39c12, #e74c3c); border: none; border-radius: 30px; color: white; font-size: 1rem; cursor: pointer; font-weight: bold;">
                    🎬 Удвоить за рекламу (x2)
                </button>
                <button id="welcome-claim" style="padding: 15px 40px; background: #6c5ce7; border: none; border-radius: 30px; color: white; font-size: 1rem; cursor: pointer;">
                    🎉 Забрать
                </button>
            </div>
        `;

        document.body.appendChild(overlay);
        window.VoidTycoon.audio?.playSFX('collect');
        window.VoidTycoon.telegram?.hapticFeedback('success');

        // Функция применения ресурсов
        const applyResources = (multiplier = 1) => {
            for (const [res, amount] of Object.entries(resources)) {
                const finalAmount = Math.floor(amount * multiplier);
                storage.addResource(res, finalAmount);
            }
            storage.save();

            overlay.remove();
            this.showNotification(multiplier > 1 ? '🎉 Ресурсы удвоены!' : '🎉 Ресурсы получены!', 'success');

            // Обновляем HUD
            const scene = window.VoidTycoon.game?.scene?.getScene('GameScene');
            scene?.updateHUD();
        };

        // Кнопка обычного забора
        document.getElementById('welcome-claim').addEventListener('click', () => {
            applyResources(1);
        });

        // Кнопка удвоения за рекламу
        document.getElementById('welcome-double').addEventListener('click', () => {
            const ads = window.VoidTycoon.ads;
            if (ads && ads.showRewardedAd) {
                ads.showRewardedAd(() => {
                    applyResources(2);
                });
            } else {
                // Fallback если реклама недоступна
                this.showNotification('Реклама недоступна', 'error');
                applyResources(1);
            }
        });
    }

    /**
     * Рендер магазина
     */
    async renderShop() {
        // Updated Shop with Tabs
        const list = document.getElementById('shop-items');
        if (!list) return;

        let tabsContainer = document.getElementById('shop-tabs');
        if (!tabsContainer) {
            const modalContent = list.parentElement; // shop-modal > modal-content
            // Insert before shop-items
            tabsContainer = document.createElement('div');
            tabsContainer.id = 'shop-tabs';
            tabsContainer.className = 'modal-tabs';
            tabsContainer.innerHTML = `
                <div class="tab-btn active" data-tab="resources">Ресурсы</div>
                <!-- Skins and Boosters tabs removed - not implemented -->
            `;
            modalContent.insertBefore(tabsContainer, list);

            // Add Click Handlers
            tabsContainer.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    // Update Active Interface
                    tabsContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    this.renderShopTab(e.target.dataset.tab);
                });
            });
        }

        // Render default tab (resources) or current active
        const activeTab = tabsContainer.querySelector('.tab-btn.active')?.dataset.tab || 'resources';
        this.renderShopTab(activeTab);
    }

    renderShopTab(tabName) {
        const list = document.getElementById('shop-items');
        list.style.display = 'flex'; // Ensure visible
        list.innerHTML = '';
        const storage = window.VoidTycoon.storage;

        if (tabName === 'resources') {
            this.renderShopItem(list, {
                id: 'energy_refill', name: 'Батончик', icon: '🍫',
                description: 'Восстановить 50 энергии', priceStars: 1,
                action: () => {
                    // Check stars logic needed
                    // Assuming 'stars' in stats
                    if ((storage.data.stats.stars || 0) >= 1) {
                        storage.data.stats.stars -= 1;
                        storage.restoreEnergy(50);
                        this.showNotification('Energy Restored!', 'success');
                        storage.save();
                        this.renderShopTab('resources'); // Refresh UI
                    } else {
                        this.showNotification('Недостаточно звезд ⭐', 'error');
                    }
                }
            });
        } else if (tabName === 'skins') {
            Object.values(SKINS).forEach(skin => {
                const owned = storage.data.skins?.includes(skin.id) || skin.id === 'default';
                const equipped = storage.data.currentSkin === skin.id;

                this.renderShopItem(list, {
                    ...skin,
                    description: owned ? (equipped ? 'Экипировано' : 'Нажмите, чтобы надеть') : `Цена: ${skin.price} ⭐`,
                    action: () => {
                        if (owned) {
                            if (!storage.data.currentSkin) storage.data.currentSkin = 'default';
                            storage.data.currentSkin = skin.id;
                            storage.save();
                            this.showNotification(`Облик ${skin.name} выбран!`, 'success');
                            this.renderShopTab('skins'); // Refresh
                        } else {
                            if ((storage.data.stats.stars || 0) >= skin.price) {
                                storage.data.stats.stars -= skin.price;
                                if (!storage.data.skins) storage.data.skins = [];
                                storage.data.skins.push(skin.id);
                                storage.save();
                                this.showNotification(`Облик ${skin.name} куплен!`, 'success');
                                this.renderShopTab('skins');
                            } else {
                                this.showNotification('Недостаточно звезд ⭐', 'error');
                            }
                        }
                    },
                    btnText: owned ? (equipped ? '✓' : 'Надеть') : (skin.price + ' ⭐')
                });
            });
        } else if (tabName === 'boosters') {
            Object.values(BOOSTERS).forEach(boost => {
                this.renderShopItem(list, {
                    ...boost,
                    description: `Длительность: ${boost.duration / 60000} мин. Цена: ${boost.price} ⭐`,
                    action: () => {
                        if ((storage.data.stats.stars || 0) >= boost.price) {
                            storage.data.stats.stars -= boost.price;
                            // Mock booster activation
                            this.showNotification(`${boost.name} активирован!`, 'success');
                            storage.save();
                            this.renderShopTab('boosters');
                        } else {
                            this.showNotification('Недостаточно звезд ⭐', 'error');
                        }
                    },
                    btnText: boost.price + ' ⭐'
                });
            });
        }
    }

    renderShopItem(container, item) {
        const el = document.createElement('div');
        el.className = 'shop-item';
        el.innerHTML = `
             <div class="item-icon">${item.icon}</div>
             <div class="item-info">
                 <div class="item-name">${item.name}</div>
                 <div class="item-desc">${item.description}</div>
             </div>
             <button class="buy-btn">${item.btnText || (item.priceStars + ' ⭐')}</button>
        `;
        el.querySelector('button').onclick = item.action;
        container.appendChild(el);
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
     * Рендер Лаборатории (Исследования)
     */
    renderResearch() {
        const container = document.getElementById('research-list');
        if (!container) return;

        const storage = window.VoidTycoon.storage;
        if (!storage) return;

        container.innerHTML = '';

        const buildings = storage.data.buildings || {};

        Object.values(TECHNOLOGIES).forEach(tech => {
            const isUnlocked = storage.hasTechnology(tech.id);
            const buildingReq = tech.reqBuilding;
            const hasBuilding = !buildingReq || (buildings[buildingReq] && buildings[buildingReq] > 0);

            // Если не построено требуемое здание и не изучено - скрываем или показываем заглушку?
            // Покажем, но заблокируем с сообщением

            const canAfford = Object.entries(tech.cost).every(([res, amount]) =>
                (storage.getResources()[res] || 0) >= amount
            );

            const costHtml = Object.entries(tech.cost)
                .map(([res, amount]) => `${RESOURCES[res]?.icon || res} ${amount}`)
                .join(' ');

            const el = document.createElement('div');
            el.className = `shop-item ${isUnlocked ? 'unlocked' : ''} ${!hasBuilding ? 'locked-req' : ''}`;
            el.style.cssText = `
                display: flex; align-items: center; gap: 10px;
                padding: 12px;
                background: ${isUnlocked ? 'rgba(76, 209, 55, 0.1)' : 'rgba(255,255,255,0.05)'};
                border: 1px solid ${isUnlocked ? '#4cd137' : 'rgba(255,255,255,0.1)'};
                border-radius: 10px;
                margin-bottom: 10px;
                opacity: ${!hasBuilding && !isUnlocked ? 0.6 : 1};
            `;

            let btnHtml = '';
            if (isUnlocked) {
                btnHtml = `<span style="color: #4cd137; font-weight: bold;">Изучено ✅</span>`;
            } else if (!hasBuilding) {
                btnHtml = `<span style="color: #ff6b6b; font-size: 0.8rem;">Требуется: ${BUILDINGS[buildingReq]?.name || buildingReq}</span>`;
            } else {
                btnHtml = `
                    <button class="buy-btn" ${canAfford ? '' : 'disabled'} style="font-size: 0.9rem; padding: 6px 12px;">
                        🔬 Изучить
                    </button>
                    <div style="font-size: 0.75rem; margin-top: 4px; color: ${canAfford ? '#ffd700' : '#ff6b6b'};">${costHtml}</div>
                `;
            }

            el.innerHTML = `
                <div style="font-size: 2rem;">${tech.icon}</div>
                <div style="flex: 1;">
                    <div style="font-weight: bold; color: ${isUnlocked ? '#4cd137' : '#fff'};">${tech.name}</div>
                    <div style="font-size: 0.85rem; color: #aaa;">${tech.description}</div>
                </div>
                <div style="text-align: right; min-width: 100px;">
                    ${btnHtml}
                </div>
            `;

            if (!isUnlocked && hasBuilding) {
                const btn = el.querySelector('.buy-btn');
                if (btn) {
                    btn.addEventListener('click', () => {
                        this.unlockResearch(tech);
                    });
                }
            }

            container.appendChild(el);
        });
    }

    /**
     * Покупка исследования
     */
    unlockResearch(tech) {
        const storage = window.VoidTycoon.storage;

        // Проверка цены еще раз
        const canAfford = Object.entries(tech.cost).every(([res, amount]) =>
            (storage.getResources()[res] || 0) >= amount
        );

        if (!canAfford) return;

        // Списываем
        Object.entries(tech.cost).forEach(([res, amount]) => {
            storage.useResource(res, amount);
        });

        if (storage.unlockTechnology(tech.id)) {
            this.showNotification(`🧪 ${tech.name} изучено!`, 'success');
            window.VoidTycoon.audio?.playSFX('levelup');
            window.VoidTycoon.telegram?.hapticFeedback('success');

            // Если технология дает эффект для игрока (например +инвентарь), применяем сразу если нужно?
            // Но обычно мы проверяем hasTechnology при действии.
            // Для инвентаря придется обновить UI инвентаря.
            if (tech.effect.type === 'inventory_slots') {
                // Resize inventory array logic if needed? 
                // Currently storage.inventory is fixed size in default data. 
                // Ideally storage.inventory size should be dynamic or checked against a cap.
                // Assuming storage.getInventorySize() exists or we modify getInventory to check tech.
            }

            this.renderResearch();

            // Обновить HUD (ресурсы списались)
            const scene = window.VoidTycoon.game?.scene?.getScene('GameScene');
            scene?.updateHUD();
        }
    }

    /**
     * Рендер Плавильни
     */
    renderSmelter() {
        const queueContainer = document.getElementById('smelter-queue');
        const recipesContainer = document.getElementById('smelter-recipes');
        const slotsEl = document.getElementById('smelter-slots-count');

        if (!queueContainer || !recipesContainer) return;

        const storage = window.VoidTycoon.storage;
        if (!storage) return;

        // Slots
        const smelterLevel = storage.data.buildings?.smelter || 0;
        const totalSlots = Math.max(1, smelterLevel * 2);
        const activeJobs = storage.getProcessingQueue().filter(j => !j.completed).length;

        if (slotsEl) slotsEl.textContent = `${activeJobs}/${totalSlots}`;

        // Render Queue
        queueContainer.innerHTML = '';
        const queue = storage.getProcessingQueue();

        if (queue.length === 0) {
            queueContainer.innerHTML = '<div style="text-align:center; color:#666;">Очередь пуста</div>';
        } else {
            queue.forEach(job => {
                const recipe = PROCESSING_RECIPES[job.recipeId];
                if (!recipe) return;

                const jobEl = document.createElement('div');
                jobEl.className = 'job-item';
                jobEl.dataset.id = job.id;
                jobEl.style.cssText = `
                    background: rgba(255,255,255,0.05);
                    padding: 10px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                `;

                const progress = Math.min(100, (Date.now() - job.startTime) / job.duration * 100);
                const isDone = job.completed || progress >= 100;

                jobEl.innerHTML = `
                    <div style="font-size: 1.5rem;">${isDone ? '✅' : '⏳'}</div>
                    <div style="flex: 1;">
                        <div style="font-weight: bold;">${recipe.name}</div>
                         <div style="background: rgba(255,255,255,0.1); height: 6px; border-radius: 3px; margin-top: 5px; overflow: hidden;">
                            <div class="job-progress" style="width: ${progress}%; height: 100%; background: ${isDone ? '#4cd137' : '#ffd700'}; transition: width 0.1s;"></div>
                        </div>
                         <div style="font-size: 0.75rem; color: #888; margin-top: 2px;">
                            ${isDone ? 'Готово!' : this.formatTime(Math.max(0, job.duration - (Date.now() - job.startTime)))}
                         </div>
                    </div>
                    ${isDone ? `<button class="claim-btn" style="padding: 5px 15px; background: #4cd137; border: none; border-radius: 5px; color: white; cursor: pointer;">Забрать</button>` : ''}
                `;

                if (isDone) {
                    jobEl.querySelector('.claim-btn').addEventListener('click', () => {
                        if (storage.claimProcessedItem(job.id)) {
                            window.VoidTycoon.audio?.playSFX('collect');
                            this.renderSmelter();
                            const scene = window.VoidTycoon.game?.scene?.getScene('GameScene');
                            scene?.updateHUD();
                        }
                    });
                }

                queueContainer.appendChild(jobEl);
            });
        }

        // Render Recipes
        recipesContainer.innerHTML = '';
        Object.values(PROCESSING_RECIPES).forEach(recipe => {
            const canAfford = Object.entries(recipe.input).every(([res, amount]) =>
                (storage.getResources()[res] || 0) >= amount
            );

            const inputHtml = Object.entries(recipe.input)
                .map(([res, amount]) => `${RESOURCES[res]?.icon || res} ${amount}`)
                .join(' ');

            const outputHtml = Object.entries(recipe.output)
                .map(([res, amount]) => `${RESOURCES[res]?.icon || res} ${amount}`)
                .join(' ');

            const el = document.createElement('div');
            el.style.cssText = `
                display: flex; align-items: center; gap: 10px;
                padding: 10px;
                background: rgba(255,255,255,0.05);
                border-radius: 8px;
                border: 1px solid rgba(255,255,255,0.1);
            `;

            el.innerHTML = `
                <div style="flex: 1;">
                    <div style="font-weight: bold;">${recipe.name}</div>
                    <div style="font-size: 0.8rem; color: #aaa;">${inputHtml} ➔ ${outputHtml}</div>
                    <div style="font-size: 0.75rem; color: #666;">⏳ ${recipe.duration / 1000} сек</div>
                </div>
                <button class="craft-btn" ${canAfford && activeJobs < totalSlots ? '' : 'disabled'} 
                    style="padding: 8px 12px; background: #e67e22; border: none; border-radius: 6px; color: white; opacity: ${canAfford && activeJobs < totalSlots ? 1 : 0.5}; cursor: pointer;">
                    Start
                </button>
            `;

            el.querySelector('.craft-btn').addEventListener('click', () => {
                const result = storage.addProcessingJob(recipe);
                if (result.success) {
                    this.renderSmelter();
                    const scene = window.VoidTycoon.game?.scene?.getScene('GameScene');
                    scene?.updateHUD();
                } else {
                    if (result.reason === 'slots_full') this.showNotification('Очередь переполнена!', 'error');
                    if (result.reason === 'no_resources') this.showNotification('Недостаточно ресурсов!', 'error');
                }
            });

            recipesContainer.appendChild(el);
        });
    }

    updateSmelterUI() {
        if (document.getElementById('smelter-modal').classList.contains('hidden')) return;

        const storage = window.VoidTycoon.storage;
        if (!storage) return;

        const queue = storage.getProcessingQueue();
        queue.forEach(job => {
            const jobEl = document.querySelector(`.job-item[data-id="${job.id}"]`);
            if (jobEl) {
                const progress = Math.min(100, (Date.now() - job.startTime) / job.duration * 100);
                const isDone = job.completed || progress >= 100;

                const bar = jobEl.querySelector('.job-progress');
                if (bar) bar.style.width = `${progress}%`;

                // If just finished, re-render to show claim button
                // Need to be careful not to spam re-renders. 
                // Simple hack: if progress >= 100 and no claim button, re-render.
                if (isDone && !jobEl.querySelector('.claim-btn')) {
                    this.renderSmelter();
                }
            }
        });
    }

    formatTime(ms) {
        const s = Math.ceil(ms / 1000);
        const m = Math.floor(s / 60);
        const rs = s % 60;
        return `${m}:${rs.toString().padStart(2, '0')}`;
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
            // Adjust master volume (0.5 when enabled, 0 when disabled)
            window.VoidTycoon.audio.volume = enabled ? 0.5 : 0;
            window.VoidTycoon.audio.saveSettings();
        });

        // Музыка
        document.getElementById('setting-music')?.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            window.VoidTycoon.storage.data.settings.musicEnabled = enabled;
            window.VoidTycoon.storage.save();
            if (enabled) {
                window.VoidTycoon.audio.playBGM();
            } else {
                window.VoidTycoon.audio.stopBGM();
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

            window.VoidTycoon.audio?.playSFX('levelup');
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
                    window.VoidTycoon.audio?.playSFX('collect');
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

        window.VoidTycoon.audio?.playSFX('collect');
        window.VoidTycoon.telegram?.hapticFeedback('heavy');
    }
    // --- Dialog System ---

    showDialog(dialogId) {
        const dialogData = STORY[dialogId];
        if (!dialogData) return;

        const container = document.getElementById('dialog-container');
        if (!container) return;

        this.currentDialog = dialogData;
        this.currentDialogIndex = 0;
        this.dialogActive = true;

        container.style.display = 'block';
        this.renderDialogStep();

        if (!this.dialogHandlerSetup) {
            container.addEventListener('click', () => this.nextDialogStep());
            this.dialogHandlerSetup = true;
        }
    }

    renderDialogStep() {
        if (!this.currentDialog || this.currentDialogIndex >= this.currentDialog.length) {
            this.closeDialog();
            return;
        }

        const step = this.currentDialog[this.currentDialogIndex];
        const container = document.getElementById('dialog-container');

        container.querySelector('.dialog-speaker').textContent = step.speaker;
        container.querySelector('.dialog-text').textContent = step.text;
    }

    nextDialogStep() {
        this.currentDialogIndex++;
        this.renderDialogStep();
    }

    closeDialog() {
        const container = document.getElementById('dialog-container');
        if (container) container.style.display = 'none';
        this.dialogActive = false;

        if (!this.tutorialArrowShown) {
            const scene = window.VoidTycoon.game?.scene?.getScene('GameScene');
            scene?.showTutorialArrow();
            this.tutorialArrowShown = true;
        }
    }

    /**
     * Показ модального окна квестов
     */
    showQuestsModal() {
        const questManager = window.VoidTycoon.questManager;
        if (!questManager) {
            this.showNotification('Система квестов не загружена', 'error');
            return;
        }

        const activeQuests = questManager.getActiveQuests();
        const completedCount = questManager.getCompletedCount();
        const totalCount = questManager.getTotalCount();
        const storage = window.VoidTycoon.storage;
        const playerLevel = storage.data.player.level;
        const playerXP = storage.data.player.xp;
        const xpNeeded = questManager.getXPForLevel(playerLevel + 1);

        // Build quests HTML
        let questsHtml = '';
        if (activeQuests.length === 0) {
            questsHtml = '<div style="text-align:center; color:#888; padding:20px;">🎉 Все квесты выполнены!</div>';
        } else {
            activeQuests.forEach(quest => {
                const progressPercent = Math.min(100, (quest.progress / quest.targetAmount) * 100);
                const rewardHtml = Object.entries(quest.reward).map(([key, val]) => {
                    if (key === 'xp') return `<span style="color:#ffd700">+${val} XP</span>`;
                    return `<span style="color:#4cd137">+${val} ${key}</span>`;
                }).join(' ');

                questsHtml += `
                    <div style="background:rgba(255,255,255,0.05); border-radius:10px; padding:15px; margin-bottom:10px;">
                        <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                            <span style="font-size:1.5rem;">${quest.icon}</span>
                            <div>
                                <div style="font-weight:bold; color:#fff;">${quest.name}</div>
                                <div style="font-size:0.85rem; color:#888;">${quest.description}</div>
                            </div>
                        </div>
                        <div style="background:rgba(0,0,0,0.3); border-radius:5px; height:20px; overflow:hidden; margin-bottom:5px;">
                            <div style="background:linear-gradient(90deg, #6c5ce7, #a29bfe); height:100%; width:${progressPercent}%; transition:width 0.3s;"></div>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:0.85rem;">
                            <span style="color:#aaa;">${quest.progress}/${quest.targetAmount}</span>
                            <span>${rewardHtml}</span>
                        </div>
                    </div>
                `;
            });
        }

        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.id = 'quests-modal-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); z-index: 9998;
            display: flex; flex-direction: column; 
            justify-content: flex-start; align-items: center;
            padding-top: 60px;
            color: white; overflow-y: auto;
        `;

        overlay.innerHTML = `
            <div style="width:90%; max-width:400px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h2 style="margin:0; color:#a29bfe; font-size:1.5rem;">📜 Квесты</h2>
                    <button id="quests-close" style="background:none; border:none; color:#fff; font-size:1.5rem; cursor:pointer;">✕</button>
                </div>
                
                <!-- Player Level -->
                <div style="background:rgba(108,92,231,0.3); border-radius:12px; padding:15px; margin-bottom:20px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <span style="font-size:1.2rem; font-weight:bold;">🎖️ Уровень ${playerLevel}</span>
                        <span style="color:#ffd700;">${playerXP}/${xpNeeded} XP</span>
                    </div>
                    <div style="background:rgba(0,0,0,0.3); border-radius:5px; height:10px; overflow:hidden;">
                        <div style="background:#ffd700; height:100%; width:${(playerXP / xpNeeded) * 100}%;"></div>
                    </div>
                </div>

                <!-- Completed Counter -->
                <div style="text-align:center; margin-bottom:15px; color:#888;">
                    Выполнено: ${completedCount}/${totalCount}
                </div>

                <!-- Quest List -->
                ${questsHtml}
            </div>
        `;

        document.body.appendChild(overlay);

        document.getElementById('quests-close').addEventListener('click', () => {
            overlay.remove();
        });

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
    }

    async renderRanking() {
        const container = document.getElementById('ranking-list');
        if (!container) return;

        container.innerHTML = '<div style="text-align:center; padding:20px;">Загрузка...</div>';

        const manager = window.VoidTycoon.leaderboardManager;
        let players = [];

        if (manager) {
            players = await manager.getTopPlayers(10);
        }

        container.innerHTML = '';

        if (!players || players.length === 0) {
            container.innerHTML = '<div style="text-align:center; opacity:0.6; padding:20px;">Пока нет данных</div>';

            // Add fake data if empty (for demo)
            // players = [{username: 'DevHost', xp: 9999}, {username: 'PlayerOne', xp: 5000}];
            if (players.length === 0) return;
        }

        const myId = window.VoidTycoon?.telegram?.getUserId();

        players.forEach((p, index) => {
            // Check if user_id matches
            const isMe = p.user_id && String(p.user_id) === String(myId);
            const rank = index + 1;

            let name = p.username || 'Unknown';
            if (name.length > 15) name = name.substring(0, 15) + '...';

            let rankIcon = `<span style="color:#888;">#${rank}</span>`;
            if (rank === 1) rankIcon = '🥇';
            if (rank === 2) rankIcon = '🥈';
            if (rank === 3) rankIcon = '🥉';

            const item = document.createElement('div');
            item.style.cssText = `
                display: flex; justify-content: space-between; align-items: center;
                background: ${isMe ? 'rgba(108, 92, 231, 0.3)' : 'rgba(255, 255, 255, 0.05)'};
                padding: 12px; border-radius: 10px; margin-bottom: 6px;
                border: ${isMe ? '1px solid #6c5ce7' : '1px solid rgba(255,255,255,0.05)'};
            `;

            item.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-weight: bold; width: 24px; text-align: center; font-size: 1.2rem;">${rankIcon}</span>
                    <span style="${isMe ? 'color: #a29bfe; font-weight: bold;' : 'color: #eee;'}">${name}</span>
                </div>
                <span style="color: #ffd700; font-weight: bold; font-family: monospace; font-size: 1.1rem;">${this.formatNumber(p.xp)} XP</span>
            `;

            container.appendChild(item);
        });
    }

    async renderFriends() {
        const list = document.getElementById('referrals-list');
        if (!list) return;

        list.innerHTML = '<div style="text-align:center; padding:20px; color:#888;">⏳ Загрузка друзей...</div>';

        const friends = await window.VoidTycoon.social?.getReferrals() || [];

        list.innerHTML = '';
        const countEl = document.getElementById('friends-count-badge');
        if (countEl) countEl.textContent = friends.length;

        if (friends.length === 0) {
            list.innerHTML = `
                <div style="text-align:center; padding:20px; opacity:0.6;">
                    <div style="font-size: 2rem; margin-bottom: 10px;">🤷‍♂️</div>
                    Пока никого...<br>Отправь ссылку друзьям!
                </div>`;
            return;
        }

        friends.forEach(f => {
            const item = document.createElement('div');
            item.style.cssText = `
                display: flex; justify-content: space-between; align-items: center;
                background: rgba(255, 255, 255, 0.05);
                padding: 10px 14px; border-radius: 8px; margin-bottom: 6px;
                border: 1px solid rgba(255,255,255,0.05);
            `;
            item.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.2rem;">👤</span>
                    <span style="color: #eee; font-weight: 500;">${f.username}</span>
                </div>
                <span style="color: #888; font-size: 0.8rem;">${f.date}</span>
            `;
            list.appendChild(item);
        });
    }

    get hasOpenModals() {
        return document.querySelectorAll('.modal:not(.hidden)').length > 0 || document.getElementById('quests-modal-overlay');
    }
}
