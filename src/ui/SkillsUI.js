import { SKILLS, RESOURCES } from '../data/GameData.js';

export class SkillsUI {
    constructor(parent) {
        this.parent = parent;
        this.container = null;
    }

    show() {
        if (this.container) return;

        this.container = document.createElement('div');
        this.container.className = 'modal-overlay';

        const content = document.createElement('div');
        content.className = 'modal-content skills-modal';

        const header = document.createElement('div');
        header.className = 'modal-header';
        header.innerHTML = `<h2>🎓 Навыки</h2>`;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-btn';
        closeBtn.innerHTML = '×';
        closeBtn.onclick = () => this.hide();
        header.appendChild(closeBtn);

        const skillsGrid = document.createElement('div');
        skillsGrid.className = 'skills-grid';
        this.renderSkillsFunc(skillsGrid);

        content.appendChild(header);
        content.appendChild(skillsGrid);
        this.container.appendChild(content);

        document.body.appendChild(this.container);

        // Animation
        requestAnimationFrame(() => content.classList.add('active'));
    }

    renderSkillsFunc(grid) {
        const storage = window.VoidTycoon.storage;
        const playerSkills = storage.data.skills || {};

        Object.values(SKILLS).forEach(skill => {
            const currentLevel = playerSkills[skill.id] || 0;
            const isMax = currentLevel >= skill.maxLevel;

            const card = document.createElement('div');
            card.className = `skill-card ${isMax ? 'maxed' : ''}`;

            let costText = '';
            let canAfford = false;

            if (!isMax) {
                const cost = Math.floor(skill.costPerLevel.amount * Math.pow(skill.costPerLevel.growth, currentLevel));
                const resIcon = RESOURCES[skill.costPerLevel.resource].icon;
                costText = `${cost} ${resIcon}`;

                const playerRes = storage.getResources()[skill.costPerLevel.resource] || 0;
                canAfford = playerRes >= cost;
            }

            card.innerHTML = `
                <div class="skill-icon">${skill.icon}</div>
                <div class="skill-info">
                    <h3>${skill.name} <span class="skill-level">Lvl ${currentLevel}/${skill.maxLevel}</span></h3>
                    <p>${skill.description}</p>
                    <div class="skill-effect">
                        Текущий бонус: +${Math.round(currentLevel * skill.effect.value * (skill.id === 'efficiency' ? 100 : 10))}${skill.id === 'backpack' ? '' : '%'}
                    </div>
                </div>
                ${!isMax ? `
                    <button class="upgrade-btn ${canAfford ? '' : 'disabled'}" onclick="window.VoidTycoon.ui.skillsUI.upgradeSkill('${skill.id}')">
                        ${costText} ⬆️
                    </button>
                ` : `<div class="max-badge">MAX</div>`}
            `;

            grid.appendChild(card);
        });
    }

    upgradeSkill(skillId) {
        const storage = window.VoidTycoon.storage;
        const skillsDefs = SKILLS;
        const skill = skillsDefs[skillId];

        if (!skill) return;

        const currentLevel = storage.getSkillLevel(skillId);
        if (currentLevel >= skill.maxLevel) return;

        const cost = Math.floor(skill.costPerLevel.amount * Math.pow(skill.costPerLevel.growth, currentLevel));
        const costRes = skill.costPerLevel.resource;

        if (storage.useResource(costRes, cost)) {
            storage.upgradeSkill(skillId);

            // Apply Immediate Effects
            if (skillId === 'backpack') {
                storage.data.player.maxEnergy += skill.effect.value;
            }

            window.VoidTycoon.audio?.playSFX('levelup');
            window.VoidTycoon.telegram?.hapticFeedback('success');

            // Re-render
            const grid = this.container.querySelector('.skills-grid');
            grid.innerHTML = '';
            this.renderSkillsFunc(grid);
        } else {
            window.VoidTycoon.ui.showNotification('Недостаточно ресурсов!', 'error');
            window.VoidTycoon.telegram?.hapticFeedback('error');
        }
    }

    hide() {
        if (!this.container) return;
        this.container.remove();
        this.container = null;
    }
}
