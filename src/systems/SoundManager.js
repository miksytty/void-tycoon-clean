// src/systems/SoundManager.js
// Simple sound manager using Web Audio API.
// Provides background music (streamed from a free CC0 URL) and lightweight SFX generated on‑the‑fly.

export const SoundManager = {
    _audioCtx: null,
    _bgAudio: null,
    _bgVolume: 0.5,
    _sfxVolume: 0.7,
    _enabled: true,

    init() {
        if (!window.AudioContext && !window.webkitAudioContext) {
            console.warn('Web Audio API not supported – sound disabled');
            this._enabled = false;
            return;
        }
        this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this._loadBackgroundMusic();
    },

    // ---------------------------------------------------------------------
    // Extend SoundManager with music control
    startAmbientMusic() {
        if (!this._enabled) return;
        if (this._bgAudio) {
            this._bgAudio.play().catch(err => console.warn('Music play error', err));
        } else {
            this._loadBackgroundMusic();
        }
        this._bgPlaying = true;
    },

    stopAmbientMusic() {
        if (this._bgAudio) {
            this._bgAudio.pause();
            this._bgAudio.currentTime = 0;
        }
        this._bgPlaying = false;
    },

    setMasterVolume(volume) {
        this._bgVolume = volume;
        if (this._bgAudio) this._bgAudio.volume = volume;
        this._sfxVolume = volume; // keep SFX in sync
    },

    // expose current state for UIManager
    get masterVolume() {
        return this._bgVolume;
    },
    set masterVolume(v) {
        this.setMasterVolume(v);
    },
    // ---------------------------------------------------------------------
    // Background music – streamed from a free CC0 track (example URL).
    // Replace the URL with any royalty‑free loop you prefer.
    // ---------------------------------------------------------------------
    _loadBackgroundMusic() {
        if (!this._enabled) return;
        const musicUrl = 'https://cdn.jsdelivr.net/gh/kenney/kenney_sounds@master/Audio/Background%20Music/Loop%20(1).mp3'; // CC0 example
        this._bgAudio = new Audio(musicUrl);
        this._bgAudio.loop = true;
        this._bgAudio.volume = this._bgVolume;
        // Don't auto-play - browser blocks until user interaction
        // Music will start when user enables it in Settings or first click
    },

    toggleMusic(enabled) {
        this._enabled = enabled;
        if (this._bgAudio) {
            if (enabled) this._bgAudio.play();
            else this._bgAudio.pause();
        }
    },

    // ---------------------------------------------------------------------
    // Simple SFX – generated with an oscillator (beep, click, success).
    // type: 'click' | 'gather' | 'levelup' | 'purchase'
    // ---------------------------------------------------------------------
    playSfx(type) {
        if (!this._enabled || !this._audioCtx) return;
        const osc = this._audioCtx.createOscillator();
        const gain = this._audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this._audioCtx.destination);

        // Frequency & duration per type
        let freq = 440;
        let duration = 0.1;
        switch (type) {
            case 'click':
                freq = 600; duration = 0.05; break;
            case 'gather':
                freq = 800; duration = 0.07; break;
            case 'levelup':
                freq = 1200; duration = 0.2; break;
            case 'purchase':
                freq = 500; duration = 0.15; break;
            default:
                freq = 440; duration = 0.1;
        }
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(this._sfxVolume, this._audioCtx.currentTime);
        osc.start();
        osc.stop(this._audioCtx.currentTime + duration);
    },

    // Convenience wrappers for common SFX
    playClick() {
        this.playSfx('click');
    },
    playSuccess() {
        this.playSfx('purchase');
    },
    playLevelUp() {
        this.playSfx('levelup');
    },
    playGather() {
        this.playSfx('gather');
    }
};
