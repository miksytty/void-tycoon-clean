export class AdsManager {
    constructor(blockId) {
        this.blockId = "20849";
        this.debug = true;
    }

    async checkSDK() {
        if (window.Adsgram) return true;

        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 20; // 2 seconds total (20 * 100ms)

            const interval = setInterval(() => {
                attempts++;
                if (window.Adsgram) {
                    clearInterval(interval);
                    resolve(true);
                } else if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    resolve(false);
                }
            }, 100);
        });
    }

    async showRewardVideo() {
        const isReady = await this.checkSDK();

        if (!isReady) {
            console.error("Adsgram SDK failed to load within timeout.");
            alert('Adsgram SDK failed to load. Please check your internet or adblocker');
            throw 'SDK_LOAD_TIMEOUT'; // Reject the promise
        }

        console.log('Initializing Adsgram with BlockID:', this.blockId);

        try {
            const AdController = window.Adsgram.init({
                blockId: this.blockId,
                debug: this.debug
            });
            return AdController.show();
        } catch (e) {
            console.error("Adsgram init failed:", e);
            throw e;
        }
    }
}
