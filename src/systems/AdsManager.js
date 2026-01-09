export class AdsManager {
    constructor(blockId) {
        // Ensure blockId is string
        this.blockId = String(blockId || 'int-7521'); // Default demo block
        this.debug = true;
    }

    checkAvailability() {
        return typeof window.Adsgram !== 'undefined';
    }

    showRewardVideo() {
        return new Promise((resolve, reject) => {
            // 1. Try Adsgram
            if (this.checkAvailability()) {
                try {
                    const AdController = window.Adsgram.init({
                        blockId: this.blockId,
                        debug: this.debug
                    });

                    AdController.show()
                        .then((result) => {
                            console.log('Adsgram Result:', result);
                            resolve(result);
                        })
                        .catch((result) => {
                            console.warn('Adsgram Error/Skip:', result);
                            // Fallback removed per user request (real ads only)
                            // If needed for localhost, we can add a check later
                            reject(result);
                        });
                    return;
                } catch (e) {
                    console.error('Adsgram Init Error:', e);
                }
            }

            // 2. Fallback / No SDK
            console.log('SDK missing or failed.');
            reject('SDK_MISSING');
        });
    }

    // simulateAd removed
}
