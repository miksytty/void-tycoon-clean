
export const RESOURCES = {
    wood: { id: 'wood', name: 'Дерево', icon: '🪵', color: 0x8B4513 },
    hardwood: { id: 'hardwood', name: 'Брус', icon: '🟫', color: 0x5D4037 },
    iron: { id: 'iron', name: 'Железо', icon: '🔩', color: 0x708090 },
    steel: { id: 'steel', name: 'Сталь', icon: '🏗️', color: 0x455A64 },
    crystal: { id: 'crystal', name: 'Кристалл', icon: '💎', color: 0x9932CC },
    chip: { id: 'chip', name: 'Микрочип', icon: '💾', color: 0x2E7D32 },
    quantum: { id: 'quantum', name: 'Ядро Пустоты', icon: '⚛️', color: 0x00BCD4 }
};

export const TOOLS = {
    basic_axe: {
        id: 'basic_axe',
        name: 'Каменный топор',
        icon: '🪓',
        description: 'Базовый инструмент',
        speed: 1.0,
        efficiency: 1,
        energyCost: 2,
        level: 1
    },
    iron_axe: {
        id: 'iron_axe',
        name: 'Железный топор',
        icon: '⚒️',
        description: 'Усиленный инструмент',
        speed: 1.5,
        efficiency: 1.5,
        energyCost: 2,
        level: 3,
        craftRecipe: { wood: 5, iron: 3 }
    },
    crystal_axe: {
        id: 'crystal_axe',
        name: 'Лазерный резак',
        icon: '💠',
        description: 'Высокотехнологичная добыча',
        speed: 2.5,
        efficiency: 2,
        energyCost: 1,
        level: 7,
        craftRecipe: { steel: 10, chip: 2 }
    },
    void_axe: {
        id: 'void_axe',
        name: 'Рука Пустоты',
        icon: '🌀',
        description: 'Абсолютная власть над материей',
        speed: 5.0,
        efficiency: 5,
        energyCost: 0,
        level: 15,
        craftRecipe: { quantum: 5, chip: 20 }
    }
};

export const RECIPES = [
    {
        id: 'craft_hardwood',
        result: { id: 'hardwood', name: 'Брус', icon: '🟫', type: 'resource', amount: 1 },
        ingredients: [{ resourceId: 'wood', amount: 5 }],
        xpReward: 5
    },
    {
        id: 'craft_steel',
        result: { id: 'steel', name: 'Сталь', icon: '🏗️', type: 'resource', amount: 1 },
        ingredients: [{ resourceId: 'iron', amount: 5 }],
        xpReward: 15
    },
    {
        id: 'craft_chip',
        result: { id: 'chip', name: 'Микрочип', icon: '💾', type: 'resource', amount: 1 },
        ingredients: [{ resourceId: 'crystal', amount: 5 }, { resourceId: 'steel', amount: 2 }],
        xpReward: 50
    },
    {
        id: 'craft_quantum',
        result: { id: 'quantum', name: 'Ядро Пустоты', icon: '⚛️', type: 'resource', amount: 1 },
        ingredients: [{ resourceId: 'chip', amount: 10 }, { resourceId: 'crystal', amount: 10 }],
        xpReward: 200
    },
    {
        id: 'iron_axe',
        result: TOOLS.iron_axe,
        ingredients: [{ resourceId: 'wood', amount: 20 }, { resourceId: 'iron', amount: 10 }],
        xpReward: 30
    },
    {
        id: 'crystal_axe',
        result: TOOLS.crystal_axe,
        ingredients: [{ resourceId: 'steel', amount: 20 }, { resourceId: 'chip', amount: 5 }],
        xpReward: 150
    },
    {
        id: 'void_axe',
        result: TOOLS.void_axe,
        ingredients: [{ resourceId: 'quantum', amount: 5 }, { resourceId: 'chip', amount: 50 }],
        xpReward: 500
    }
];

export const BUILDINGS = {
    lumber_mill: {
        id: 'lumber_mill',
        name: 'Лесопилка',
        description: 'Автодобыча дерева',
        icon: '🏚️',
        baseCost: { wood: 50 },
        costMultiplier: 1.5,
        production: { wood: 1 },
        maxLevel: 10
    },
    quarry: {
        id: 'quarry',
        name: 'Карьер',
        description: 'Автодобыча железа',
        icon: '🏗️',
        baseCost: { wood: 100, iron: 50 },
        costMultiplier: 1.6,
        production: { iron: 0.5 },
        maxLevel: 10
    },
    factory: {
        id: 'factory',
        name: 'Завод',
        description: 'Переплавка Железа в Сталь',
        icon: '🏭',
        baseCost: { wood: 500, iron: 300 },
        costMultiplier: 1.8,
        production: { steel: 0.2 },
        consumption: { iron: 1.0 },
        maxLevel: 5
    },
    lab: {
        id: 'lab',
        name: 'Лаборатория',
        description: 'Синтез Микрочипов',
        icon: '🔬',
        baseCost: { steel: 200, crystal: 100 },
        costMultiplier: 2.0,
        production: { chip: 0.05 },
        consumption: { crystal: 0.5 },
        maxLevel: 5
    },
    portal: {
        id: 'portal',
        name: 'ПОРТАЛ ИЗМЕРЕНИЙ',
        description: 'Построй, чтобы победить!',
        icon: '🌌',
        baseCost: { hardwood: 1000, steel: 1000, chip: 500, quantum: 20 },
        costMultiplier: 1,
        production: {},
        maxLevel: 1
    }
};

export const SHOP_ITEMS = [
    {
        id: 'starter_pack',
        name: 'Старт',
        icon: '🎁',
        description: '+Resources',
        price: { amount: 10, currency: 'stars' },
        rewards: { wood: 100, iron: 50 }
    },
    {
        id: 'vip_30',
        name: 'VIP 30 Дней',
        icon: '👑',
        description: 'x2 Ресурсов',
        price: { amount: 50, currency: 'stars' },
        duration: 30
    }
];

export const WORLD_CONFIG = {
    chunkSize: 512,
    tileSize: 32,
    resourceDensity: 0.15,
    resourceClusters: 4,
    clusterSize: 5,
    viewDistance: 2
};

export const LEVEL_CONFIG = {
    baseXP: 100,
    xpMultiplier: 1.5,
    maxLevel: 50,
    energyPerLevel: 5
};

export const XP_REWARDS = {
    gatherWood: 5,
    gatherIron: 10,
    gatherCrystal: 25,
    craft: 15,
    levelUp: 0
};

export const TUTORIAL_STEPS = [
    { id: 'welcome', title: '👋 Привет!', text: 'Добро пожаловать в Void Tycoon v1.0!', action: null },
    { id: 'move', title: '🕹️ Движение', text: 'Используй WASD или джойстик.', action: 'move' },
    { id: 'gather', title: '🪓 Добыча', text: 'Добывай ресурсы кликом.', action: 'gather' },
    { id: 'craft', title: '🔨 Крафт', text: 'Создавай новые материалы.', action: 'inventory' }
];

export const DAILY_REWARDS = [
    { day: 1, rewards: { wood: 50 }, icon: '🪵' },
    { day: 2, rewards: { iron: 30 }, icon: '🔩' },
    { day: 3, rewards: { steel: 10 }, icon: '🏗️' },
    { day: 4, rewards: { crystal: 20 }, icon: '💎' },
    { day: 5, rewards: { chip: 5 }, icon: '💾' },
    { day: 6, rewards: { quantum: 1 }, icon: '⚛️' },
    { day: 7, rewards: { wood: 1000, iron: 1000, crystal: 500 }, icon: '👑' }
];

export const ACHIEVEMENTS = [
    { id: 'first_gather', name: 'Первый шаг', description: 'Собери первый ресурс', icon: '🌱', condition: { stat: 'totalResourcesGathered', value: 1 }, reward: { stars: 1 } },
    { id: 'gatherer_100', name: 'Сборщик', description: 'Собери 100 ресурсов', icon: '🪓', condition: { stat: 'totalResourcesGathered', value: 100 }, reward: { stars: 5 } },
    { id: 'gatherer_1000', name: 'Мастер-сборщик', description: 'Собери 1000 ресурсов', icon: '⚒️', condition: { stat: 'totalResourcesGathered', value: 1000 }, reward: { stars: 20 } },
    { id: 'first_craft', name: 'Изобретатель', description: 'Скрафти первый предмет', icon: '🔧', condition: { stat: 'totalCrafted', value: 1 }, reward: { stars: 2 } },
    { id: 'crafter_10', name: 'Мастер-крафтер', description: 'Скрафти 10 предметов', icon: '🔨', condition: { stat: 'totalCrafted', value: 10 }, reward: { stars: 10 } },
    { id: 'level_5', name: 'Развитие', description: 'Достигни 5 уровня', icon: '📈', condition: { stat: 'level', value: 5 }, reward: { stars: 5 } },
    { id: 'level_10', name: 'Эксперт', description: 'Достигни 10 уровня', icon: '🏆', condition: { stat: 'level', value: 10 }, reward: { stars: 15 } },
    { id: 'first_building', name: 'Строитель', description: 'Построй первое здание', icon: '🏠', condition: { stat: 'totalBuildings', value: 1 }, reward: { stars: 5 } },
    { id: 'daily_3', name: 'Постоянство', description: '3 дня подряд в игре', icon: '📅', condition: { stat: 'dailyStreak', value: 3 }, reward: { stars: 10 } },
    { id: 'daily_7', name: 'Преданность', description: '7 дней подряд в игре', icon: '🔥', condition: { stat: 'dailyStreak', value: 7 }, reward: { stars: 25 } }
];

export const QUEST_TEMPLATES = [
    { id: 'gather_wood', name: 'Дровосек', description: 'Собери 50 дерева', icon: '🪵', target: 50, trackResource: 'wood', reward: { stars: 2 } },
    { id: 'gather_iron', name: 'Горняк', description: 'Собери 30 железа', icon: '🔩', target: 30, trackResource: 'iron', reward: { stars: 3 } },
    { id: 'gather_crystal', name: 'Кристалломан', description: 'Собери 10 кристаллов', icon: '💎', target: 10, trackResource: 'crystal', reward: { stars: 5 } },
    { id: 'craft_any', name: 'Крафтер', description: 'Скрафти 3 предмета', icon: '⚒️', target: 3, trackStat: 'dailyCrafts', reward: { stars: 3 } },
    { id: 'play_time', name: 'Игроман', description: 'Играй 10 минут', icon: '⏱️', target: 600, trackStat: 'sessionTime', reward: { stars: 2 } }
];
