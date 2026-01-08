/**
 * ============================================
 * Sound Manager 2.0 - Synthesized Audio Engine
 * ============================================
 * Generates retro SFX and ambient music using Web Audio API
 * No external assets required.
 */

export class SoundManager {
    constructor() {
        this.context = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.initialized = false;
        this.musicInterval = null;

        // Music State
        this.currentChord = 0;
        this.isMuted = false;

        // Scale (C Minor Pentatonic)
        this.scale = [261.63, 311.13, 349.23, 392.00, 466.16, 523.25];
    }

    init() {
        if (this.initialized) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.context = new AudioContext();

            // Master Mix
            this.masterGain = this.context.createGain();
            this.masterGain.gain.value = 0.5;
            this.masterGain.connect(this.context.destination);

            // Buses
            this.musicGain = this.context.createGain();
            this.musicGain.gain.value = 0.3;
            this.musicGain.connect(this.masterGain);

            this.sfxGain = this.context.createGain();
            this.sfxGain.gain.value = 0.6;
            this.sfxGain.connect(this.masterGain);

            this.initialized = true;
            console.log('🔊 Audio Engine Initialized');

            // Unlock audio context on interaction
            // Unlock audio context on interaction
            const unlock = () => {
                const start = () => {
                    if (!this.musicInterval) this.startMusic();
                };

                if (this.context.state === 'suspended') {
                    this.context.resume().then(start);
                } else {
                    start();
                }

                document.removeEventListener('click', unlock);
                document.removeEventListener('keydown', unlock);
                document.removeEventListener('touchstart', unlock);
            };
            document.addEventListener('click', unlock);
            document.addEventListener('keydown', unlock);
            document.addEventListener('touchstart', unlock);

        } catch (e) {
            console.warn('AudioContext not supported', e);
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.5, this.context.currentTime, 0.1);
        }
        return this.isMuted;
    }

    // ==========================================
    // SYNTHESIZERS
    // ==========================================

    playTone(freq, type, duration, vol, bus = null) {
        if (!this.initialized) this.init();
        if (this.isMuted) return;

        // Use sfxGain as default bus if none provided or invalid
        const targetBus = (bus && bus instanceof AudioNode) ? bus : this.sfxGain;

        // Safety check: if sound system failed to init properly
        if (!this.context || !targetBus) return;

        try {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.context.currentTime);

            gain.gain.setValueAtTime(vol, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

            osc.connect(gain);
            gain.connect(targetBus); // Safe connection

            osc.start();
            osc.stop(this.context.currentTime + duration);
        } catch (e) {
            console.warn('Audio synthesis error:', e);
        }
    }

    playNoise(duration, vol) {
        if (!this.initialized) this.init();
        if (this.isMuted) return;

        const bufferSize = this.context.sampleRate * duration;
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.context.createBufferSource();
        noise.buffer = buffer;

        const gain = this.context.createGain();
        gain.gain.setValueAtTime(vol, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

        noise.connect(gain);
        gain.connect(this.sfxGain);

        noise.start();
    }

    // ==========================================
    // GAME SFX
    // ==========================================

    playClick() {
        this.playTone(800, 'sine', 0.1, 0.1);
    }

    // Legacy mapping
    playWoodChop() { this.playChop(); }
    playRockHit() { this.playMine(); }
    playCrystalCollect() { this.playCrystal(); }
    playError() { this.playTone(150, 'sawtooth', 0.2, 0.2); }

    playChop() {
        // Wood chop: Noise burst + low thump
        this.playNoise(0.1, 0.3);
        this.playTone(150, 'square', 0.1, 0.1);
    }

    playMine() {
        // Metal cling
        this.playTone(1200, 'triangle', 0.3, 0.1);
        this.playTone(1800, 'sine', 0.4, 0.05); // Overtone
    }

    playCrystal() {
        // Magical shimmer
        this.playTone(880, 'sine', 0.5, 0.1);
        setTimeout(() => this.playTone(1100, 'sine', 0.5, 0.1), 50);
        setTimeout(() => this.playTone(1320, 'sine', 0.5, 0.1), 100);
    }

    playCraft() {
        // Success chord
        this.playTone(523.25, 'triangle', 0.3, 0.1); // C5
        setTimeout(() => this.playTone(659.25, 'triangle', 0.3, 0.1), 100); // E5
    }

    playLevelUp() {
        // Victory fanfare style
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 'square', 0.4, 0.15);
            }, i * 100);
        });
    }

    playSuccess() {
        // Long magical sweep
        if (!this.initialized) this.init();
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.frequency.setValueAtTime(440, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.context.currentTime + 1.5);
        gain.gain.setValueAtTime(0.2, this.context.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.context.currentTime + 1.5);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.context.currentTime + 1.5);
    }

    // ==========================================
    // AMBIENT MUSIC (Brian Eno Style)
    // ==========================================

    startMusic() {
        if (this.musicInterval) return;

        // Generative loop
        this.musicInterval = setInterval(() => {
            if (this.context && this.context.state === 'running' && Math.random() > 0.4) {
                this.playAmbientNote();
            }
        }, 2500);

        this.playAmbientNote(); // Start immediately
    }

    playAmbientNote() {
        if (this.isMuted) return;

        // Random note from pentatonic scale
        const freq = this.scale[Math.floor(Math.random() * this.scale.length)];

        // Very long attack, long release (Pad sound)
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = Math.random() > 0.5 ? 'sine' : 'triangle';
        osc.frequency.value = freq / 2; // Lower octave

        const now = this.context.currentTime;
        const duration = 4 + Math.random() * 2;

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 1); // Fade in
        gain.gain.linearRampToValueAtTime(0, now + duration); // Fade out

        // Lowpass Filter
        const filter = this.context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 600;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.start();
        osc.stop(now + duration);
    }
}

export const soundManager = new SoundManager();
