export class TelegramAPI {
    constructor() {
        this.webapp = null;
        this.user = null;
        this.isReady = false;
        this.themeParams = {};
    }

    async init() {
        return new Promise((resolve) => {
            if (window.Telegram && window.Telegram.WebApp) {
                this.webapp = window.Telegram.WebApp;

                this.webapp.ready();

                this.webapp.expand();

                this.user = this.webapp.initDataUnsafe?.user || null;

                this.themeParams = this.webapp.themeParams || {};
                this.applyTheme();

                this.webapp.onEvent('themeChanged', () => this.applyTheme());

                if (this.webapp.BackButton && this.webapp.isVersionAtLeast('6.1')) {
                    this.webapp.BackButton.onClick(() => {
                        window.VoidTycoon.ui?.closeAllModals();
                    });
                }

                this.webapp.MainButton.setParams({
                    text: 'PLAY',
                    color: '#6c5ce7',
                    text_color: '#ffffff',
                    is_visible: false
                });

                this.isReady = true;

            } else {
                this.user = {
                    id: 123456789,
                    first_name: 'Developer',
                    username: 'dev_user',
                    language_code: 'en'
                };
                this.isReady = true;
            }

            resolve();
        });
    }

    applyTheme() {
        if (!this.webapp) return;

        const theme = this.webapp.themeParams;
        const root = document.documentElement;

        if (theme.bg_color) {
            root.style.setProperty('--tg-theme-bg-color', theme.bg_color);
        }
        if (theme.text_color) {
            root.style.setProperty('--tg-theme-text-color', theme.text_color);
        }
        if (theme.hint_color) {
            root.style.setProperty('--tg-theme-hint-color', theme.hint_color);
        }
        if (theme.link_color) {
            root.style.setProperty('--tg-theme-link-color', theme.link_color);
        }
        if (theme.button_color) {
            root.style.setProperty('--tg-theme-button-color', theme.button_color);
        }
        if (theme.button_text_color) {
            root.style.setProperty('--tg-theme-button-text-color', theme.button_text_color);
        }
        if (theme.secondary_bg_color) {
            root.style.setProperty('--tg-theme-secondary-bg-color', theme.secondary_bg_color);
        }

        const isDark = this.webapp.colorScheme === 'dark';
        document.body.classList.toggle('light-theme', !isDark);
    }

    getUserId() {
        return this.user?.id || 0;
    }

    getUsername() {
        return this.user?.first_name || this.user?.username || 'Player';
    }

    showBackButton() {
        if (this.webapp?.BackButton && this.webapp.isVersionAtLeast('6.1')) {
            this.webapp.BackButton.show();
        }
    }

    hideBackButton() {
        if (this.webapp?.BackButton && this.webapp.isVersionAtLeast('6.1')) {
            this.webapp.BackButton.hide();
        }
    }

    hapticFeedback(type = 'light') {
        if (this.webapp?.HapticFeedback && this.webapp.isVersionAtLeast('6.1')) {
            try {
                switch (type) {
                    case 'light':
                        this.webapp.HapticFeedback.impactOccurred('light');
                        break;
                    case 'medium':
                        this.webapp.HapticFeedback.impactOccurred('medium');
                        break;
                    case 'heavy':
                        this.webapp.HapticFeedback.impactOccurred('heavy');
                        break;
                    case 'success':
                        this.webapp.HapticFeedback.notificationOccurred('success');
                        break;
                    case 'error':
                        this.webapp.HapticFeedback.notificationOccurred('error');
                        break;
                }
            } catch (e) { }
        }
    }

    async payWithStars(amount, title, description, payload) {
        return new Promise((resolve, reject) => {
            if (!this.webapp) {
                reject(new Error('WebApp not available'));
                return;
            }

            const invoiceParams = {
                title: title,
                description: description,
                payload: payload,
                currency: 'XTR',
                prices: [{ label: title, amount: amount }],
                provider_token: ''
            };

            this.webapp.openInvoice(
                this.createInvoiceLink(invoiceParams),
                (status) => {
                    if (status === 'paid') {
                        this.hapticFeedback('success');
                        resolve({ success: true, payload });
                    } else if (status === 'cancelled') {
                        resolve({ success: false, reason: 'cancelled' });
                    } else {
                        reject(new Error('Payment failed'));
                    }
                }
            );
        });
    }

    createInvoiceLink(params) {
        const botUsername = 'VoidTycoonBot';
        return `https://t.me/${botUsername}?startattach=invoice_${params.payload}`;
    }

    getStartParam() {
        return this.webapp?.initDataUnsafe?.start_param || null;
    }

    generateReferralLink() {
        const userId = this.getUserId();
        const botUsername = 'void_tycoon_game_bot';
        const appName = 'game';
        return `https://t.me/${botUsername}/${appName}?startapp=${userId}`;
    }

    shareReferralLink() {
        const link = this.generateReferralLink();
        const text = 'Помоги мне выбраться из Пустоты в Void Tycoon! Получи 100 кристаллов на старте! 💎';

        if (this.webapp) {
            const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
            this.webapp.openTelegramLink(shareUrl);
        } else {
            if (navigator.share) {
                navigator.share({
                    title: 'Void Tycoon',
                    text: text,
                    url: link
                });
            } else {
                navigator.clipboard.writeText(link);
                window.VoidTycoon.ui?.showNotification('Link copied!', 'success');
            }
        }
    }

    close() {
        if (this.webapp) {
            this.webapp.close();
        }
    }
}
