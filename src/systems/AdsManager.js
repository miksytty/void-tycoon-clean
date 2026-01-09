export class AdsManager {
    constructor(blockId) {
        this.blockId = "20849";
        this.debug = true;
    }

    checkAvailability() {
        return !!window.Adsgram;
    }

    showRewardVideo() {
        if (!window.Adsgram) {
            console.error("Adsgram SDK not found");
            return Promise.reject("SDK_MISSING");
        }
        const AdController = window.Adsgram.init({
            blockId: "20849",
            debug: true
        });
        return AdController.show();
    }
}
