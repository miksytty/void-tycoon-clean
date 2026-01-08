// Item definitions for the inventory system
export const ITEMS = {
    coin: {
        id: 'coin',
        name: 'Gold Coin',
        icon: '🪙',
        stackable: true,
        maxStack: 99
    },
    potion: {
        id: 'potion',
        name: 'Health Potion',
        icon: '🧪',
        stackable: true,
        maxStack: 10
    },
    key: {
        id: 'key',
        name: 'Golden Key',
        icon: '🔑',
        stackable: false,
        maxStack: 1
    },
    gem: {
        id: 'gem',
        name: 'Magic Gem',
        icon: '💎',
        stackable: true,
        maxStack: 50
    },
    sword: {
        id: 'sword',
        name: 'Iron Sword',
        icon: '⚔️',
        stackable: false,
        maxStack: 1
    },
    shield: {
        id: 'shield',
        name: 'Wood Shield',
        icon: '🛡️',
        stackable: false,
        maxStack: 1
    },
    apple: {
        id: 'apple',
        name: 'Red Apple',
        icon: '🍎',
        stackable: true,
        maxStack: 20
    },
    scroll: {
        id: 'scroll',
        name: 'Magic Scroll',
        icon: '📜',
        stackable: true,
        maxStack: 5
    },
    // Resources
    wood: {
        id: 'wood',
        name: 'Wood',
        icon: '🪵',
        stackable: true,
        maxStack: 99
    },
    stone: {
        id: 'stone',
        name: 'Stone',
        icon: '🪨',
        stackable: true,
        maxStack: 99
    },
    // Tools
    stoneAxe: {
        id: 'stoneAxe',
        name: 'Stone Axe',
        icon: '🪓',
        stackable: false,
        maxStack: 1,
        equipable: true,
        gatherSpeedBonus: 2 // 2x faster gathering
    }
};

export const ITEM_LIST = Object.values(ITEMS);

// Resources that can be gathered (not regular collectibles)
export const RESOURCES = {
    tree: {
        id: 'tree',
        name: 'Tree',
        gatherTime: 2000, // 2 seconds
        yields: ITEMS.wood,
        yieldAmount: 3
    },
    rock: {
        id: 'rock',
        name: 'Rock',
        gatherTime: 2000, // 2 seconds
        yields: ITEMS.stone,
        yieldAmount: 2
    }
};

// Crafting Recipes
export const RECIPES = [
    {
        id: 'stoneAxe',
        name: 'Stone Axe',
        icon: '🪓',
        result: ITEMS.stoneAxe,
        resultAmount: 1,
        ingredients: [
            { item: ITEMS.wood, amount: 3 },
            { item: ITEMS.stone, amount: 2 }
        ]
    }
];
