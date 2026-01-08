/**
 * ============================================
 * Система туториала
 * ============================================
 * Пошаговое обучение новых игроков
 */

import { TUTORIAL_STEPS } from '../data/GameData.js';

export class TutorialManager {
    constructor() {
        this.currentStep = 0;
        this.isActive = false;
        this.completedSteps = new Set();
        this.overlay = null;

        this.checkFirstRun();
    }

    /**
     * Проверка первого запуска
     */
    checkFirstRun() {
        const storage = window.VoidTycoon.storage;
        if (!storage) return;

        const tutorialComplete = storage.data.settings?.tutorialComplete;

        if (!tutorialComplete) {
            this.start();
        }
    }

    /**
     * Запуск туториала
     */
    start() {
        this.isActive = true;
        this.currentStep = 0;
        this.createOverlay();
        this.showStep(0);
    }

    /**
     * Создание оверлея туториала
     */
    createOverlay() {
        if (this.overlay) return;

        this.overlay = document.createElement('div');
        this.overlay.id = 'tutorial-overlay';
        this.overlay.innerHTML = `
            <div class="tutorial-box">
                <div class="tutorial-title" id="tutorial-title"></div>
                <div class="tutorial-text" id="tutorial-text"></div>
                <div class="tutorial-buttons">
                    <button class="tutorial-skip" id="tutorial-skip">Пропустить</button>
                    <button class="tutorial-next" id="tutorial-next">Далее →</button>
                </div>
            </div>
        `;

        // Стили
        const style = document.createElement('style');
        style.textContent = `
            #tutorial-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                z-index: 2000;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
            }
            
            .tutorial-box {
                background: linear-gradient(145deg, #2a2a4a, #1a1a2e);
                border: 2px solid #6c5ce7;
                border-radius: 20px;
                padding: 24px;
                max-width: 350px;
                text-align: center;
                box-shadow: 0 20px 60px rgba(108, 92, 231, 0.3);
                animation: tutorialPop 0.3s ease;
            }
            
            @keyframes tutorialPop {
                from { transform: scale(0.8); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
            
            .tutorial-title {
                font-size: 1.4rem;
                font-weight: 700;
                margin-bottom: 12px;
                color: #fff;
            }
            
            .tutorial-text {
                font-size: 1rem;
                color: #aaa;
                line-height: 1.5;
                margin-bottom: 20px;
            }
            
            .tutorial-buttons {
                display: flex;
                gap: 12px;
            }
            
            .tutorial-skip {
                flex: 1;
                padding: 12px;
                background: transparent;
                border: 1px solid #666;
                color: #888;
                border-radius: 10px;
                font-size: 0.9rem;
                cursor: pointer;
            }
            
            .tutorial-next {
                flex: 2;
                padding: 12px;
                background: linear-gradient(145deg, #6c5ce7, #5541d7);
                border: none;
                color: #fff;
                border-radius: 10px;
                font-size: 0.95rem;
                font-weight: 600;
                cursor: pointer;
            }
            
            .tutorial-next:active {
                transform: scale(0.95);
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(this.overlay);

        // События
        document.getElementById('tutorial-skip')?.addEventListener('click', () => this.skip());
        document.getElementById('tutorial-next')?.addEventListener('click', () => this.next());
    }

    /**
     * Показ шага туториала
     */
    showStep(index) {
        if (index >= TUTORIAL_STEPS.length) {
            this.complete();
            return;
        }

        const step = TUTORIAL_STEPS[index];

        document.getElementById('tutorial-title').textContent = step.title;
        document.getElementById('tutorial-text').textContent = step.text;

        // Меняем текст кнопки на последнем шаге
        const nextBtn = document.getElementById('tutorial-next');
        if (index === TUTORIAL_STEPS.length - 1) {
            nextBtn.textContent = '🎮 Играть!';
        } else {
            nextBtn.textContent = 'Далее →';
        }

        window.VoidTycoon.telegram?.hapticFeedback('light');
    }

    /**
     * Следующий шаг
     */
    next() {
        this.currentStep++;

        if (this.currentStep >= TUTORIAL_STEPS.length) {
            this.complete();
        } else {
            this.showStep(this.currentStep);
        }
    }

    /**
     * Пропуск туториала
     */
    skip() {
        this.complete();
    }

    /**
     * Завершение туториала
     */
    complete() {
        this.isActive = false;

        // Сохраняем флаг
        const storage = window.VoidTycoon.storage;
        if (storage) {
            storage.data.settings.tutorialComplete = true;
            storage.save();
        }

        // Удаляем оверлей
        if (this.overlay) {
            this.overlay.style.opacity = '0';
            this.overlay.style.transition = 'opacity 0.3s';
            setTimeout(() => {
                if (this.overlay) {
                    this.overlay.remove();
                    this.overlay = null;
                }
            }, 300);
        }

        // Показываем приветствие
        window.VoidTycoon.ui?.showNotification('🎮 Удачной игры!', 'success');
        window.VoidTycoon.telegram?.hapticFeedback('success');
    }
}
