export const TEXTS = {
    en: {
        system_init: 'System Initialization...',
        void_sector: 'Warning! You are in the VOID sector.',
        task_portal: 'Objective: Build the Portal to escape.',
        start_mining: 'Start by mining Wood 🌲.',
        settings: 'Settings',
        sound: 'Sound',
        music: 'Music',
        vibration: 'Vibration',
        reset: 'Reset Progress',
        language: 'Language',
        save_success: 'Game Saved!',
        inventory: 'Inventory',
        shop: 'Shop',
        build: 'Build',
        back: 'Back'
    },
    ru: {
        system_init: 'Инициализация системы...',
        void_sector: 'Внимание! Вы находитесь в секторе ПУСТОТА.',
        task_portal: 'Задача: Построить Портал для побега.',
        start_mining: 'Начните с добычи Дерева 🌲.',
        settings: 'Настройки',
        sound: 'Звук',
        music: 'Музыка',
        vibration: 'Вибрация',
        reset: 'Сброс Прогресса',
        language: 'Язык',
        save_success: 'Игра сохранена!',
        inventory: 'Инвентарь',
        shop: 'Магазин',
        build: 'Строт-во',
        back: 'Назад'
    }
};

export class LocalizationManager {
    constructor() {
        this.lang = 'ru'; // Default
        this.listeners = [];
    }

    init() {
        // Load saved language if available
        const saved = localStorage.getItem('void_lang');
        if (saved && ['ru', 'en'].includes(saved)) {
            this.lang = saved;
        }
    }

    setLanguage(lang) {
        if (!['ru', 'en'].includes(lang)) return;
        this.lang = lang;
        localStorage.setItem('void_lang', lang);
        this.notifyListeners();
    }

    t(key) {
        return TEXTS[this.lang][key] || key;
    }

    subscribe(callback) {
        this.listeners.push(callback);
    }

    notifyListeners() {
        this.listeners.forEach(cb => cb(this.lang));
    }
}
