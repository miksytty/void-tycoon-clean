export class AudioManager {
    constructor() {
        this.ctx = null;
        this.bgmNode = null;
        this.bgmGain = null;

        this.isMuted = false;
        this.volume = 0.5;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        } catch (e) {
            console.error('Web Audio API not supported');
        }

        this.init();
    }

    init() {
        // Load settings from storage
        const storage = window.VoidTycoon?.storage;
        if (storage) {
            const settings = storage.data.settings || {};
            this.isMuted = settings.muted || false;
            this.volume = settings.volume || 0.5;
        }

        // Initialize BGM (mock or procedural)
        // For now, we assume user interacts first before audio starts
        window.addEventListener('click', () => {
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        }, { once: true });
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.saveSettings();

        // Stop/Start BGM
        if (this.isMuted) {
            this.stopBGM();
        } else {
            this.playBGM();
        }

        return this.isMuted;
    }

    saveSettings() {
        const storage = window.VoidTycoon?.storage;
        if (storage) {
            if (!storage.data.settings) storage.data.settings = {};
            storage.data.settings.muted = this.isMuted;
            storage.data.settings.volume = this.volume;
            storage.save();
        }
    }

    playSFX(type) {
        if (this.isMuted || !this.ctx) return;

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        // Procedural SFX generation
        switch (type) {
            case 'click':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, t);
                osc.frequency.exponentialRampToValueAtTime(300, t + 0.1);
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
                osc.start(t);
                osc.stop(t + 0.1);
                break;

            case 'hit_wood':
                // Noise-like sound for wood (approximated with low freq square)
                osc.type = 'square';
                osc.frequency.setValueAtTime(150, t);
                osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
                gain.gain.setValueAtTime(0.2, t);
                gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
                osc.start(t);
                osc.stop(t + 0.1);
                break;

            case 'hit_stone':
                // Sharp noise for stone (sawtooth/triangle)
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(100, t); // Low thud
                gain.gain.setValueAtTime(0.3, t);
                gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
                osc.start(t);
                osc.stop(t + 0.08);
                break;

            case 'collect':
                // High pitch ping
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1200, t);
                osc.frequency.exponentialRampToValueAtTime(2000, t + 0.1);
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
                osc.start(t);
                osc.stop(t + 0.15);
                break;

            case 'levelup':
                // Success chord
                this.playTone(440, 0.2, 0);       // A4
                this.playTone(554.37, 0.2, 0.1);  // C#5
                this.playTone(659.25, 0.4, 0.2);  // E5
                break;

            case 'error':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, t);
                osc.frequency.linearRampToValueAtTime(100, t + 0.2);
                gain.gain.setValueAtTime(0.2, t);
                gain.gain.linearRampToValueAtTime(0.01, t + 0.2);
                osc.start(t);
                osc.stop(t + 0.2);
                break;
        }
    }

    playTone(freq, duration, delay = 0) {
        if (this.isMuted || !this.ctx) return;

        const t = this.ctx.currentTime + delay;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sine';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

        osc.start(t);
        osc.stop(t + duration);
    }

    playBGM() {
        if (this.isMuted || !this.ctx) return;
        // Placeholder for BGM - for now silence or very simple ambient drone
        // Doing a real BGM procedurally is complex. 
        // We will just keep it silent or integrate the external URL properly later.
    }

    stopBGM() {
        // Stop logic
    }
}
