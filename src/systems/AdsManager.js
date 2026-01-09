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
                            // Fallback to simulation if error (for testing)
                            console.log('Falling back to simulation...');
                            this.simulateAd(resolve);
                        });
                    return;
                } catch (e) {
                    console.error('Adsgram Init Error:', e);
                }
            }

            // 2. Fallback / No SDK
            console.log('SDK missing or failed, using simulation.');
            this.simulateAd(resolve);
        });
    }

    simulateAd(onSuccess) {
        // Mock Ad Interface
        const adOverlay = document.createElement('div');
        adOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: black; color: white; z-index: 10000;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            font-family: sans-serif;
        `;
        adOverlay.innerHTML = `
            <div style="font-size: 4rem; margin-bottom: 20px;">📺</div>
            <h1 style="margin: 0; color: #ffd700;">TEST AD</h1>
            <p style="color: #ccc;">Adsgram failed or testing mode</p>
            <p style="font-size: 1.5rem; font-weight: bold;">Wait: <span id="ad-timer">3</span>s</p>
        `;
        document.body.appendChild(adOverlay);

        let timeLeft = 3;
        const timer = setInterval(() => {
            timeLeft--;
            const timerEl = document.getElementById('ad-timer');
            if (timerEl) timerEl.textContent = timeLeft;

            if (timeLeft <= 0) {
                clearInterval(timer);
                adOverlay.remove();
                if (onSuccess) onSuccess({ done: true, mock: true });
            }
        }, 1000);
    }
}
