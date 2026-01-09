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
            if (!this.checkAvailability()) {
                console.warn('Adsgram SDK not loaded or blocked');
                // For development/testing locally without SDK, maybe reject or mock?
                // Request said: "reject promise (error or skip)"
                reject('SDK_MISSING');
                return;
            }

            try {
                const AdController = window.Adsgram.init({
                    blockId: this.blockId,
                    debug: this.debug
                });

                AdController.show()
                    .then((result) => {
                        // result: { done: true } or similar
                        console.log('Adsgram Result:', result);
                        resolve(result);
                    })
                    .catch((result) => {
                        // result: { done: false, description: 'skipped' or error }
                        console.warn('Adsgram Error/Skip:', result);
                        reject(result);
                    });
            } catch (e) {
                console.error('Adsgram Init Error:', e);
                reject(e);
            }
        });
    }
}
