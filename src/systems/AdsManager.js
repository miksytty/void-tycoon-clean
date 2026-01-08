export class AdsManager {
    constructor() {
        this.blockId = '20770';
        this.adController = null;
        this.isReady = false;
        this.init();
    }

    init() {
        if (typeof window.Adsgram !== 'undefined') {
            try {
                this.adController = window.Adsgram.init({
                    blockId: this.blockId
                });
                this.isReady = true;
            } catch (e) { }
        }
    }

    async showAdForEnergy() {
        const success = await this.showRewardedAd();
        if (success && window.VoidTycoon?.storage) {
            window.VoidTycoon.storage.restoreEnergy(50);
            window.VoidTycoon.ui?.showFloatingText(null, '+50 ⚡', '#ffff00');
            window.VoidTycoon.telegram?.hapticFeedback('success');
            const scene = window.VoidTycoon.game?.scene?.getScene('GameScene');
            scene?.updateHUD();
        }
        return success;
    }

    async showAdForCrystals() {
        const success = await this.showRewardedAd();
        if (success && window.VoidTycoon?.storage) {
            window.VoidTycoon.storage.addResource('crystals', 5);
            window.VoidTycoon.ui?.showFloatingText(null, '+5 💎', '#00ffff');
            window.VoidTycoon.telegram?.hapticFeedback('success');
            const scene = window.VoidTycoon.game?.scene?.getScene('GameScene');
            scene?.updateHUD();
        }
        return success;
    }

    async showRewardedAd() {
        if (!this.isReady || !this.adController) {
            this.init();
            if (!this.isReady) {
                return false;
            }
        }
        try {
            const result = await this.adController.show();
            return result.done;
        } catch (error) {
            return false;
        }
    }
}
