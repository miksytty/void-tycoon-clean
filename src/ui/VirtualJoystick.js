export class VirtualJoystick {
    constructor(scene) {
        this.scene = scene;
        this.isActive = false;
        this.vector = { x: 0, y: 0 };
        this.baseRadius = 60;
        this.maxDistance = 40;

        this.isActionActive = false;
        this.container = null;
        this.actionBtn = null;

        if (this.isTouchDevice()) {
            this.create();
        }
    }

    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    create() {
        this.container = document.createElement('div');
        this.container.className = 'joystick-container';
        this.container.innerHTML = `
            <div class="joystick-base">
                <div class="joystick-thumb"></div>
            </div>
        `;
        document.body.appendChild(this.container);

        this.base = this.container.querySelector('.joystick-base');
        this.thumb = this.container.querySelector('.joystick-thumb');

        const rect = this.base.getBoundingClientRect();
        this.centerX = rect.width / 2;
        this.centerY = rect.height / 2;

        this.base.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        this.base.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });

        this.boundGlobalEnd = (e) => this.onGlobalTouchEnd(e);
        document.addEventListener('touchend', this.boundGlobalEnd, { passive: false });
        document.addEventListener('touchcancel', this.boundGlobalEnd, { passive: false });

        this.actionBtn = document.createElement('div');
        this.actionBtn.id = 'mobile-action-btn';
        this.actionBtn.innerHTML = '⛏️';
        document.body.appendChild(this.actionBtn);

        this.actionBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isActionActive = true;
            if (window.VoidTycoon?.telegram) {
                window.VoidTycoon.telegram.hapticFeedback('light');
            }
        });

        this.actionBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isActionActive = false;
        });

        this.actionBtn.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.isActionActive = false;
        });
    }

    onTouchStart(e) {
        e.preventDefault();
        this.isActive = true;
        this.touchId = e.changedTouches[0].identifier;
        this.updateThumbPosition(e.changedTouches[0]);
    }

    onTouchMove(e) {
        e.preventDefault();
        if (!this.isActive) return;

        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === this.touchId) {
                this.updateThumbPosition(e.changedTouches[i]);
                break;
            }
        }
    }

    onGlobalTouchEnd(e) {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === this.touchId) {
                this.reset();
                break;
            }
        }
    }

    reset() {
        this.isActive = false;
        this.touchId = null;
        this.vector = { x: 0, y: 0 };
        if (this.thumb) {
            this.thumb.style.transform = 'translate(-50%, -50%)';
        }
    }

    updateThumbPosition(touch) {
        if (!this.base) return;
        const rect = this.base.getBoundingClientRect();

        let x = touch.clientX - rect.left - this.centerX;
        let y = touch.clientY - rect.top - this.centerY;

        const distance = Math.sqrt(x * x + y * y);

        if (distance > this.maxDistance) {
            x = (x / distance) * this.maxDistance;
            y = (y / distance) * this.maxDistance;
        }

        this.thumb.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;

        this.vector = {
            x: x / this.maxDistance,
            y: y / this.maxDistance
        };
    }

    getVector() {
        return this.vector;
    }

    isActionDown() {
        return this.isActionActive;
    }

    destroy() {
        if (this.container) this.container.remove();
        if (this.actionBtn) this.actionBtn.remove();

        document.removeEventListener('touchend', this.boundGlobalEnd);
        document.removeEventListener('touchcancel', this.boundGlobalEnd);
    }
}
