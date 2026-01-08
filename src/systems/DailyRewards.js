/**
 * ============================================
 * Система ежедневных наград
 * ============================================
 */

import { DAILY_REWARDS } from '../data/GameData.js';

export class DailyRewardsManager {
    constructor() {
        this.overlay = null;
    }

    /**
     * Проверка доступности награды
     */
    checkDailyReward() {
        const storage = window.VoidTycoon.storage;
        if (!storage) return;

        const now = Date.now();
        const lastClaim = storage.data.stats.lastDailyClaim || 0;
        const currentStreak = storage.data.stats.dailyStreak || 0;

        // Проверяем прошло ли 24 часа
        const hoursSinceLast = (now - lastClaim) / (1000 * 60 * 60);

        if (hoursSinceLast >= 24) {
            // Проверяем сброс стрика (больше 48 часов)
            let newStreak = currentStreak;
            if (hoursSinceLast >= 48) {
                newStreak = 0;
            }

            this.showRewardPopup(newStreak);
        }
    }

    /**
     * Показ попапа с наградой
     */
    showRewardPopup(currentStreak) {
        // День награды (1-7, потом цикл)
        const rewardDay = (currentStreak % 7) + 1;
        const reward = DAILY_REWARDS[rewardDay - 1];

        this.overlay = document.createElement('div');
        this.overlay.id = 'daily-reward-overlay';
        this.overlay.innerHTML = `
            <div class="daily-box">
                <div class="daily-title">🎁 Ежедневная награда!</div>
                <div class="daily-day">День ${rewardDay}</div>
                <div class="daily-reward-icon">${reward.icon}</div>
                <div class="daily-reward-text">${this.formatRewards(reward.rewards)}</div>
                <div class="daily-streak">🔥 Серия: ${currentStreak + 1} дней</div>
                <button class="daily-claim" id="daily-claim">Забрать!</button>
            </div>
        `;

        const style = document.createElement('style');
        style.id = 'daily-reward-styles';
        style.textContent = `
            #daily-reward-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 3000;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
            }
            
            .daily-box {
                background: linear-gradient(145deg, #2a2a4a, #1a1a2e);
                border: 2px solid #fdcb6e;
                border-radius: 24px;
                padding: 30px;
                text-align: center;
                max-width: 320px;
                animation: dailyPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            
            @keyframes dailyPop {
                from { transform: scale(0.5) rotate(-5deg); opacity: 0; }
                to { transform: scale(1) rotate(0deg); opacity: 1; }
            }
            
            .daily-title {
                font-size: 1.3rem;
                font-weight: 700;
                color: #fdcb6e;
                margin-bottom: 8px;
            }
            
            .daily-day {
                font-size: 0.9rem;
                color: #888;
                margin-bottom: 16px;
            }
            
            .daily-reward-icon {
                font-size: 4rem;
                margin: 16px 0;
                animation: bounce 1s infinite;
            }

            .reward-img-small {
                width: 24px;
                height: 24px;
                vertical-align: middle;
                margin-left: 4px;
            }
            
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            
            .daily-reward-text {
                font-size: 1.1rem;
                color: #fff;
                margin-bottom: 12px;
                display: flex;
                justify-content: center;
                gap: 15px;
                align-items: center;
            }
            
            .daily-streak {
                font-size: 0.9rem;
                color: #e17055;
                margin-bottom: 20px;
            }
            
            .daily-claim {
                width: 100%;
                padding: 14px;
                background: linear-gradient(145deg, #fdcb6e, #e17055);
                border: none;
                border-radius: 12px;
                color: #1a1a2e;
                font-size: 1.1rem;
                font-weight: 700;
                cursor: pointer;
                transition: transform 0.2s;
            }
            
            .daily-claim:active {
                transform: scale(0.95);
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(this.overlay);

        document.getElementById('daily-claim')?.addEventListener('click', () => {
            this.claimReward(currentStreak, reward);
        });
    }

    /**
     * Форматирование наград
     */
    formatRewards(rewards) {
        const parts = [];
        if (rewards.wood) parts.push(`+${rewards.wood} 🪵`);
        if (rewards.iron) parts.push(`+${rewards.iron} 🔩`);
        if (rewards.crystal) parts.push(`+${rewards.crystal} 💎`);
        return parts.join('  ');
    }

    /**
     * Получение награды
     */
    claimReward(currentStreak, reward) {
        const storage = window.VoidTycoon.storage;
        if (!storage) return;

        // Добавляем ресурсы
        Object.entries(reward.rewards).forEach(([resource, amount]) => {
            storage.addResource(resource, amount);
        });

        // Обновляем стрик
        storage.data.stats.dailyStreak = currentStreak + 1;
        storage.data.stats.lastDailyClaim = Date.now();
        storage.save();

        // Закрываем попап
        this.close();

        // Обновляем HUD
        const scene = window.VoidTycoon.game?.scene?.getScene('GameScene');
        scene?.updateHUD();

        // Уведомление
        window.VoidTycoon.ui?.showNotification('🎁 Награда получена!', 'success');
        window.VoidTycoon.telegram?.hapticFeedback('success');
    }

    /**
     * Закрытие попапа
     */
    close() {
        if (this.overlay) {
            this.overlay.style.opacity = '0';
            this.overlay.style.transition = 'opacity 0.3s';
            setTimeout(() => {
                this.overlay?.remove();
                this.overlay = null;
                document.getElementById('daily-reward-styles')?.remove();
            }, 300);
        }
    }
}
