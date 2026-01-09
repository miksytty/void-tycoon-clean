export class AdsManager {
    constructor(blockId) {
        this.blockId = "20849";
        this.debug = true;
    }

    /**
     * Waits for the Adsgram SDK to load.
     * Polls every 500ms for up to 10 seconds.
     * @returns {Promise<boolean>} True if loaded, false if timed out.
     */
    async waitForSDK() {
        if (window.Adsgram) return true;

        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 20; // 10 seconds / 500ms = 20 attempts

            const interval = setInterval(() => {
                attempts++;
                if (window.Adsgram) {
                    clearInterval(interval);
                    resolve(true);
                } else if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    resolve(false);
                }
            }, 500);
        });
    }

    async showRewardVideo() {
        console.log(`[AdsManager] Waiting for Adsgram SDK (BlockID: ${this.blockId})...`);

        const isReady = await this.waitForSDK();

        if (!isReady) {
            console.error("[AdsManager] SDK load timeout.");
            alert('Adsgram SDK failed to load. Please disable VPN or AdBlock and reload.');
            throw new Error('SDK_LOAD_TIMEOUT');
        }

        try {
            console.log('[AdsManager] Initializing and showing ad...');
            const AdController = window.Adsgram.init({
                blockId: this.blockId,
                debug: this.debug
            });
            return await AdController.show();
        } catch (error) {
            // Log technical errors but let the caller handle UI notifications if needed
            console.error("[AdsManager] Ad show error:", error);
            throw error;
        }
    }
}
