// main.js – entry point for Void Tycoon
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { GameScene } from './scenes/GameScene.js';
import { TelegramAPI } from './core/TelegramAPI.js';
import { StorageManager } from './core/StorageManager.js';
import { UIManager } from './ui/UIManager.js';
import { TutorialManager } from './systems/TutorialManager.js';
import { DailyRewardsManager } from './systems/DailyRewards.js';
import { AdsManager } from './systems/AdsManager.js';
import { LocalizationManager } from './systems/LocalizationManager.js';
import { leaderboardAPI } from './core/SupabaseClient.js';
import { initSecurity } from './systems/Security.js';
import { AudioManager } from './core/AudioManager.js';
import { SocialManager } from './core/SocialManager.js';

// Initialize global managers
import './styles/premium-effects.css'; // 🎨 Premium Visual Effects

window.VoidTycoon = {
    telegram: null,
    storage: null,
    ui: null,
    tutorial: null,
    dailyRewards: null,
    ads: new AdsManager('20849'), // Production Block ID
    localization: new LocalizationManager(),
    audio: new AudioManager(), // New robust audio
    social: new SocialManager(), // Referral & Socials
    leaderboard: leaderboardAPI,
    game: null
};

// Initialize localization
window.VoidTycoon.localization.init();

async function initApp() {
    try {
        initSecurity();
        updateLoadingText('Wait...');
        window.VoidTycoon.telegram = new TelegramAPI();
        await window.VoidTycoon.telegram.init();

        window.VoidTycoon.storage = new StorageManager(window.VoidTycoon.telegram);
        await window.VoidTycoon.storage.init();

        window.VoidTycoon.ui = new UIManager();
        window.VoidTycoon.tutorial = new TutorialManager();
        window.VoidTycoon.dailyRewards = new DailyRewardsManager();

        // Init Social Manager (Referrals)
        window.VoidTycoon.social.init();

        const config = {
            type: Phaser.AUTO,
            parent: 'game-container',
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: '#1a1a2e',
            scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
            physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
            render: { antialias: false, pixelArt: true, roundPixels: true },
            fps: { target: 165, forceSetTimeOut: false },
            scene: [BootScene, GameScene]
        };

        window.VoidTycoon.game = new Phaser.Game(config);

        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) loadingScreen.style.display = 'none';
        }, 1000);
    } catch (error) {
        console.error('Init error:', error);
        updateLoadingText('Error loading. Please refresh.');
    }
}

function updateLoadingText(text) {
    const loadText = document.getElementById('load-text');
    if (loadText) loadText.textContent = text;
}

window.updateLoadProgress = function (progress) {
    const progressBar = document.getElementById('load-progress');
    if (progressBar) progressBar.style.width = `${progress * 100}%`;
};

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        setTimeout(() => loadingScreen.style.display = 'none', 500);
    }
}

document.addEventListener('DOMContentLoaded', initApp);
