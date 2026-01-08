export class AdsManager {
    constructor() {
        this.enabled = true;
        this.lastAdTime = 0;
    }

    showRewardedAd(onSuccess, onError) {
        if (!this.enabled) {
            if (onError) onError('Ads disabled');
            return;
        }

        console.log('Showing rewarded ad...');

        // Mock Ad Simulation
        const adOverlay = document.createElement('div');
        adOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: black; color: white; z-index: 10000;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
        `;
        adOverlay.innerHTML = `
            <h1>РЕКЛАМА</h1>
            <p>Просмотр рекламы дает бонусы...</p>
            <div style="font-size: 3rem;">📺</div>
            <p>Осталось: <span id="ad-timer">3</span> сек</p>
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
                if (onSuccess) onSuccess();
            }
        }, 1000);
    }
}
