# Настройка API погоды для Ван Лав

## Получение API ключа OpenWeatherMap

1. Зарегистрируйтесь на [OpenWeatherMap](https://openweathermap.org/api)
2. Получите бесплатный API ключ
3. Замените `YOUR_OPENWEATHER_API_KEY` в файле `app.js` на ваш ключ

## Реальная интеграция с API

Для подключения реального API погоды замените метод `getWeatherForecast` в `app.js`:

```javascript
async getWeatherForecast() {
    const cityCoords = this.getCityCoordinates(this.selectedCity);
    
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${cityCoords.lat}&lon=${cityCoords.lon}&appid=${this.weatherApiKey}&units=metric&lang=ru`
        );
        
        if (!response.ok) {
            throw new Error('Ошибка получения данных о погоде');
        }
        
        const data = await response.json();
        
        // Получаем прогноз на завтра
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        const tomorrowForecast = data.list.find(item => 
            item.dt_txt.startsWith(tomorrowStr)
        );
        
        if (!tomorrowForecast) {
            throw new Error('Прогноз на завтра недоступен');
        }
        
        return {
            city: this.getCityName(this.selectedCity),
            temperature: Math.round(tomorrowForecast.main.temp),
            description: tomorrowForecast.weather[0].description,
            icon: tomorrowForecast.weather[0].icon,
            humidity: tomorrowForecast.main.humidity,
            wind_speed: Math.round(tomorrowForecast.wind.speed)
        };
    } catch (error) {
        console.error('Ошибка API погоды:', error);
        // Возвращаем симуляцию в случае ошибки
        return this.simulateWeatherAPI(cityCoords);
    }
}
```

## Координаты городов

Координаты уже настроены для следующих городов:
- Пятигорск: 44.0489, 43.0594
- Кисловодск: 43.9053, 42.7168
- Ессентуки: 44.0444, 42.8606
- Минеральные Воды: 44.2108, 43.1353
- Георгиевск: 44.1519, 43.4697

## Лимиты API

Бесплатный тариф OpenWeatherMap включает:
- 60 запросов в минуту
- Прогноз на 5 дней с интервалом 3 часа
- Данные о текущей погоде

## Безопасность

⚠️ **ВАЖНО**: Не публикуйте API ключ в открытом доступе!
- Используйте переменные окружения
- Ограничьте доступ к API по IP
- Регулярно ротируйте ключи
