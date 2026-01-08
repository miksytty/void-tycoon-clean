# 🎵 Музыка и Звуки для Void Tycoon

## Бесплатные Источники:

### Музыка (BGM):
1. **Основная тема** - Sci-Fi Ambient:
   - https://freesound.org/people/joshuaempyre/sounds/251461/ (Space Ambient)
   - https://pixabay.com/music/search/space/ (Free Space Music)

2. **Боевая тема** - Intense Electronic:
   - https://pixabay.com/music/search/battle/
   
3. **Победа** - Epic Victory:
   - https://pixabay.com/music/search/victory/

### Звуковые Эффекты (SFX):
1. **UI Клики**: https://freesound.org/people/LittleRobotSoundFactory/
2. **Добыча ресурсов**: https://freesound.org/people/plasterbrain/sounds/
3. **Level Up**: https://freesound.org/people/colorsCrimsonTears/sounds/
4. **Крафтинг**: https://freesound.org/people/fins/sounds/

### Как добавить:
```javascript
// В SoundManager.js добавить:
this.bgm = this.scene.sound.add('theme_space', { loop: true, volume: 0.3 });
this.bgm.play();

// Эффекты:
this.scene.sound.add('ui_click').play();
this.scene.sound.add('gather_wood').play();
```

## Рекомендованные паки (All-in-One):
- **Sci-Fi UI Pack**: https://kenney.nl/assets/sci-fi-sounds
- **Interface Sounds**: https://kenney.nl/assets/interface-sounds

Все источники - Creative Commons 0 (CC0) - бесплатно для коммерческого использования!
