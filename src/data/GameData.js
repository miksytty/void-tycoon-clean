



// Simplified: Only Pet (no boots/backpack complexity)
export const ITEMS = {
    drone_1: { id: 'drone_1', name: 'Дрон-Шахтер', type: 'pet', icon: '🛸', description: 'Авто-сбор ресурсов' }
};

// SKINS, BOOSTERS, STORY removed for simplified release
// Keep as comments in case needed later:
/*
export const SKINS = {
    default: { id: 'default', name: 'Стандарт', icon: '👤', price: 0 },
    astronaut: { id: 'astronaut', name: 'Космонавт', icon: '👩‍🚀', price: 50 },
    ninja: { id: 'ninja', name: 'Ниндзя', icon: '🥷', price: 100 },
    knight: { id: 'knight', name: 'Рыцарь', icon: '🛡️', price: 200 }
};

export const BOOSTERS = {
    speed_boost: { id: 'speed_boost', name: 'Скорость x2 (1м)', icon: '⏩', duration: 60000, price: 10, effect: 'speed', value: 2 },
    resource_boost: { id: 'resource_boost', name: 'Ресурсы x2 (1м)', icon: '💎', duration: 60000, price: 20, effect: 'resource', value: 2 }
};

export const STORY = {
    start: [
        { speaker: 'System', text: 'Инициализация... Связь с Колонистом установлена.' },
        { speaker: 'System', text: 'Внимание! Вы находитесь в секторе "Пустота".' },
        { speaker: 'System', text: 'Ваша задача: Построить Портал и вернуться домой.' },
        { speaker: 'System', text: 'Начните с добычи Дерева 🌲.' }
    ],
    first_craft: [
        { speaker: 'System', text: 'Отличная работа! Первые инструменты готовы.' },
        { speaker: 'System', text: 'Теперь стройте здания для автоматической добычи!' }
    ]
};
*/

// Simplified to 5 core technologies only
export const TECHNOLOGIES = {
    improved_mining: {
        id: 'improved_mining',
        name: 'Усиленная кирка',
        icon: '⛏️',
        description: '+50% к добыче ресурса кликом',
        cost: { wood: 500, iron: 200 },
        effect: { type: 'gather_mult', value: 0.5 },
        reqBuilding: 'lumber_mill'
    },
    logistics: {
        id: 'logistics',
        name: 'Логистика',
        icon: '📦',
        description: 'Пассивный доход +20%',
        cost: { wood: 1000, hardwood: 100 },
        effect: { type: 'passive_mult', value: 0.2 },
        reqBuilding: 'lumber_mill'
    },
    turbo_boots: {
        id: 'turbo_boots',
        name: 'Грави-двигатель',
        icon: '🥾',
        description: 'Скорость бега +25%',
        cost: { steel: 100, chip: 10 },
        effect: { type: 'speed_mult', value: 0.25 },
        reqBuilding: 'factory'
    },
    quantum_bag: {
        id: 'quantum_bag',
        name: 'Квантовый карман',
        icon: '🎒',
        description: '+5 Слотов инвентаря',
        cost: { crystal: 200, quantum: 1 },
        effect: { type: 'inventory_slots', value: 5 },
        reqBuilding: 'lab'
    },
    automation: {
        id: 'automation',
        name: 'Автоматизация',
        icon: '⚙️',
        description: 'Все здания работают на 30% быстрее',
        cost: { chip: 20, quantum: 5 },
        effect: { type: 'building_speed', value: 0.3 },
        reqBuilding: 'lab'
    }
};

export const RESOURCES = {
    wood: { id: 'wood', name: 'Дерево', icon: '🪵', color: 0x8B4513, description: 'Основной строительный материал.' },
    hardwood: { id: 'hardwood', name: 'Брус', icon: '🟫', color: 0x5D4037, description: 'Обработанное дерево для зданий.' },
    iron: { id: 'iron', name: 'Железо', icon: '🔩', color: 0x708090, description: 'Металл для инструментов.' },
    steel: { id: 'steel', name: 'Сталь', icon: '🏗️', color: 0x455A64, description: 'Прочный сплав.' },
    crystal: { id: 'crystal', name: 'Кристалл', icon: '💎', color: 0x9932CC, description: 'Магический минерал.' },
    chip: { id: 'chip', name: 'Микрочип', icon: '💾', color: 0x2E7D32, description: 'Высокие технологии.' },
    quantum: { id: 'quantum', name: 'Ядро Пустоты', icon: '⚛️', color: 0x00BCD4, description: 'Энергия из других миров.' },
    dimension_key: { id: 'dimension_key', name: 'Ключ Измерений', icon: '🗝️', color: 0xFFD700, description: 'Открывает Портал. Выпал из Босса.' }
};

export const TOOLS = {
    basic_axe: {
        id: 'basic_axe',
        name: 'Каменный топор',
        icon: '🪓',
        description: 'Базовый инструмент',
        speed: 1.0,
        efficiency: 1,
        energyCost: 1,
        level: 1
    },
    iron_axe: {
        id: 'iron_axe',
        name: 'Железный топор',
        icon: '⚒️',
        description: 'Усиленный инструмент',
        speed: 1.5,
        efficiency: 1.5,
        energyCost: 1,
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

// BALANCED MOBS FOR BETA
export const BOSSES = {
    void_guardian: {
        id: 'void_guardian',
        name: 'Лесной Страж',
        icon: '🐗', // Changed to Boar for forest vibe
        hp: 150, // Moderate challenge
        damage: 8,
        speed: 90, // Fast but outrunnable
        detectionRange: 200,
        attackRange: 40,
        dropChance: 0.3,
        drops: ['dimension_key'],
        xpReward: 300,
        color: 0x4caf50,
        size: 1.5,
        spawnChance: 0.005,
        minDistanceFromSpawn: 400
    },
    crystal_golem: {
        id: 'crystal_golem',
        name: 'Стальной Голем', // Badlands boss
        icon: '🗿',
        hp: 400, // Tanky
        damage: 15,
        speed: 40, // Slow but hits hard
        detectionRange: 150,
        attackRange: 50,
        dropChance: 0.25,
        drops: ['dimension_key', 'steel'],
        xpReward: 800,
        color: 0x607d8b,
        size: 2.0,
        spawnChance: 0.003,
        minDistanceFromSpawn: 1500 // In Wasteland
    },
    void_lord: {
        id: 'void_lord',
        name: 'ПОВЕЛИТЕЛЬ ПУСТОТЫ',
        icon: '👑',
        hp: 2000, // True Boss
        damage: 40,
        speed: 120, // Very fast
        detectionRange: 400,
        attackRange: 80,
        dropChance: 1.0, // Guaranteed drop
        drops: ['dimension_key', 'quantum'],
        xpReward: 5000,
        color: 0x9c27b0,
        size: 3.0,
        spawnChance: 0.001,
        minDistanceFromSpawn: 3500 // In Crystal Zone
    }
};

export const MOBS = {
    slime: {
        id: 'slime',
        name: 'Слизень',
        icon: '🦠',
        hp: 20, // Easy kill
        damage: 3, // Annoying poke
        speed: 40,
        detectionRange: 150,
        attackRange: 35,
        dropChance: 0.6,
        drops: ['wood'],
        xpReward: 5,
        color: 0x8bc34a,
        size: 0.8,
        spawnChance: 0.03,
        minDistanceFromSpawn: 200
    },
    bat: {
        id: 'bat',
        name: 'Кровавая Мышь', // Wasteland mob
        icon: '🦇',
        hp: 60, // Takes a few hits
        damage: 10, // Dangerous in groups
        speed: 100, // Very fast
        detectionRange: 250,
        attackRange: 30,
        dropChance: 0.4,
        drops: ['iron'],
        xpReward: 25,
        color: 0xe53935,
        size: 0.6,
        spawnChance: 0.02,
        minDistanceFromSpawn: 1500
    },
    void_wisp: { // NEW MOB for Crystal Zone
        id: 'void_wisp',
        name: 'Дух Пустоты',
        icon: '👻',
        hp: 150,
        damage: 20,
        speed: 60,
        detectionRange: 300,
        attackRange: 100, // Rangedish
        dropChance: 0.5,
        drops: ['crystal'],
        xpReward: 80,
        color: 0x00bcd4,
        size: 0.9,
        spawnChance: 0.02,
        minDistanceFromSpawn: 3500
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

export const PROCESSING_RECIPES = {
    steel_smelt: {
        id: 'steel_smelt',
        name: 'Слиток стали',
        input: { iron: 2 }, // 2 Iron -> 1 Steel (More efficient than craft?) Let's check craft: 5 Iron -> 1 Steel. Yes.
        output: { steel: 1 },
        duration: 20000, // 20 seconds
        xp: 10
    },
    hardwood_process: {
        id: 'hardwood_process',
        name: 'Сушка дерева',
        input: { wood: 2 },
        output: { hardwood: 1 },
        duration: 10000,
        xp: 5
    }
};

export const SKILLS = {
    speed: {
        id: 'speed',
        name: 'Скороход',
        icon: '⚡',
        description: 'Увеличивает скорость бега',
        maxLevel: 5,
        costPerLevel: { resource: 'wood', amount: 50, growth: 2.0 }, // 50, 100, 200...
        effect: { type: 'speed_mult', value: 0.1 } // +10% per level
    },
    efficiency: {
        id: 'efficiency',
        name: 'Острый глаз',
        icon: '👁️',
        description: 'Больше ресурсов при добыче',
        maxLevel: 5,
        costPerLevel: { resource: 'iron', amount: 30, growth: 2.0 },
        effect: { type: 'yield_mult', value: 0.2 } // +20% per level
    },
    backpack: {
        id: 'backpack',
        name: 'Рюкзак',
        icon: '🎒',
        description: 'Макс. энергия +10',
        maxLevel: 5,
        costPerLevel: { resource: 'wood', amount: 100, growth: 1.5 },
        effect: { type: 'energy_add', value: 10 } // +10 energy per level
    },
    luck: {
        id: 'luck',
        name: 'Удача',
        icon: '🍀',
        description: 'Шанс крита x2',
        maxLevel: 3,
        costPerLevel: { resource: 'crystal', amount: 10, growth: 2.0 },
        effect: { type: 'crit_chance_add', value: 0.05 } // +5% crit chance
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
 
export const BUILDINGS = {
    lumber_mill: {
        id: 'lumber_mill',
        name: '���������',
        icon: '??',
        description: '������������� �������� ������.',
        cost: { wood: 100 },
        production: { wood: 5 }, // +5 per minute
        productionInterval: 60000,
        size: 2, // 2x2 tiles (approx 64x64)
        color: 0x8d6e63
    },
    quarry: {
        id: 'quarry',
        name: '�����',
        icon: '??',
        description: '������������� �������� ������.',
        cost: { wood: 50, iron: 50 },
        production: { iron: 3 }, // +3 per minute
        productionInterval: 60000,
        size: 2,
        color: 0x78909c
    },
    smelter: {
        id: 'smelter',
        name: '���������',
        icon: '??',
        description: '������������ ���� � ������.',
        cost: { wood: 200, iron: 100 },
        production: {}, // Process based
        size: 2,
        color: 0xe64a19
    },
    portal: {
        id: 'portal',
        name: '������ ���������',
        icon: '??',
        description: '���� �����. ������� �����.',
        cost: { wood: 1000, steel: 500, crystal: 50, dimension_key: 1 },
        production: {},
        size: 3,
        color: 0x9c27b0
    }
};

