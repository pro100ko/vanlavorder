class VanLavOrderApp {
    constructor() {
        this.salesFile = null;
        this.writeoffsFile = null;
        this.selectedCity = 'pyatigorsk';
        this.weatherApiKey = 'YOUR_OPENWEATHER_API_KEY'; // Замените на ваш API ключ
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateAnalyzeButton();
    }

    bindEvents() {
        const salesInput = document.getElementById('salesFile');
        const writeoffsInput = document.getElementById('writeoffsFile');
        const citySelect = document.getElementById('citySelect');
        const analyzeBtn = document.getElementById('analyzeBtn');

        salesInput.addEventListener('change', (e) => {
            this.salesFile = e.target.files[0];
            this.updateAnalyzeButton();
        });

        writeoffsInput.addEventListener('change', (e) => {
            this.writeoffsFile = e.target.files[0];
            this.updateAnalyzeButton();
        });

        citySelect.addEventListener('change', (e) => {
            this.selectedCity = e.target.value;
        });

        analyzeBtn.addEventListener('click', () => {
            this.analyzeData();
        });
    }

    updateAnalyzeButton() {
        const analyzeBtn = document.getElementById('analyzeBtn');
        analyzeBtn.disabled = !(this.salesFile && this.writeoffsFile);
    }

    async analyzeData() {
        if (!this.salesFile || !this.writeoffsFile) {
            this.showError('Пожалуйста, загрузите оба файла');
            return;
        }

        this.showLoading();
        this.hideError();
        this.hideResult();

        try {
            // Получаем прогноз погоды для выбранного города
            const weatherData = await this.getWeatherForecast();
            
            // Обрабатываем файлы и генерируем прогноз
            const result = await this.processFiles(this.salesFile, this.writeoffsFile, weatherData);
            this.showResult(result);
        } catch (error) {
            console.error('Error:', error);
            this.showError('Ошибка при анализе данных. Проверьте формат файлов и попробуйте снова.');
        } finally {
            this.hideLoading();
        }
    }

    async getWeatherForecast() {
        const cityCoords = this.getCityCoordinates(this.selectedCity);
        
        // Для демонстрации используем симуляцию API
        // В реальном проекте замените на реальный API вызов
        return new Promise((resolve) => {
            setTimeout(() => {
                const weatherData = this.simulateWeatherAPI(cityCoords);
                resolve(weatherData);
            }, 1000);
        });
    }

    getCityCoordinates(city) {
        const coordinates = {
            'pyatigorsk': { lat: 44.0489, lon: 43.0594 },
            'kislovodsk': { lat: 43.9053, lon: 42.7168 },
            'essentuki': { lat: 44.0444, lon: 42.8606 },
            'mineralnye-vody': { lat: 44.2108, lon: 43.1353 },
            'georgievsk': { lat: 44.1519, lon: 43.4697 }
        };
        return coordinates[city] || coordinates['pyatigorsk'];
    }

    simulateWeatherAPI(coords) {
        // Симуляция API OpenWeatherMap
        const weatherConditions = [
            { temp: 24, description: 'солнечно', icon: '01d' },
            { temp: 18, description: 'облачно', icon: '03d' },
            { temp: 22, description: 'переменная облачность', icon: '02d' },
            { temp: 16, description: 'дождь', icon: '09d' },
            { temp: 28, description: 'жарко', icon: '01d' }
        ];
        
        const randomWeather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
        
        return {
            city: this.getCityName(this.selectedCity),
            temperature: randomWeather.temp,
            description: randomWeather.description,
            icon: randomWeather.icon,
            humidity: Math.floor(Math.random() * 30) + 40,
            wind_speed: Math.floor(Math.random() * 10) + 2
        };
    }

    getCityName(cityCode) {
        const cityNames = {
            'pyatigorsk': 'Пятигорск',
            'kislovodsk': 'Кисловодск',
            'essentuki': 'Ессентуки',
            'mineralnye-vody': 'Минеральные Воды',
            'georgievsk': 'Георгиевск'
        };
        return cityNames[cityCode] || 'Пятигорск';
    }

    async processFiles(salesFile, writeoffsFile, weatherData) {
        // Симуляция обработки файлов с учетом погоды
        return new Promise((resolve) => {
            setTimeout(() => {
                const result = this.generateForecastWithWeather(weatherData);
                resolve(result);
            }, 2000);
        });
    }

    generateForecastWithWeather(weatherData) {
        const baseProducts = [
            { name: "Эклер", baseAmount: 45, unit: "шт." },
            { name: "Тирамису", baseAmount: 12, unit: "кг" },
            { name: "Чизкейк", baseAmount: 8, unit: "шт." },
            { name: "Наполеон", baseAmount: 15, unit: "шт." },
            { name: "Медовик", baseAmount: 6, unit: "шт." }
        ];

        // Корректируем прогноз в зависимости от погоды
        const weatherMultiplier = this.getWeatherMultiplier(weatherData);
        
        const forecast = baseProducts.map(product => {
            const adjustedAmount = Math.round(product.baseAmount * weatherMultiplier);
            const reservePercent = this.getReservePercent(weatherData, product.name);
            const totalAmount = Math.round(adjustedAmount * (1 + reservePercent / 100));
            
            return {
                product: product.name,
                forecast_amount: adjustedAmount,
                reserve_percent: reservePercent,
                total_amount: totalAmount,
                unit: product.unit
            };
        });

        return {
            weather: weatherData,
            forecast: forecast,
            analysis_date: new Date().toISOString()
        };
    }

    getWeatherMultiplier(weatherData) {
        // Корректируем прогноз в зависимости от погоды
        let multiplier = 1.0;
        
        if (weatherData.temperature > 25) {
            // Жаркая погода - больше спроса на холодные десерты
            multiplier = 1.2;
        } else if (weatherData.temperature < 10) {
            // Холодная погода - меньше спроса
            multiplier = 0.8;
        } else if (weatherData.description.includes('дождь')) {
            // Дождливая погода - больше спроса на уютные десерты
            multiplier = 1.1;
        }
        
        return multiplier;
    }

    getReservePercent(weatherData, productName) {
        let baseReserve = 10;
        
        // Увеличиваем запас для жаркой погоды (риск порчи)
        if (weatherData.temperature > 25) {
            baseReserve += 5;
        }
        
        // Специфичные корректировки для разных продуктов
        if (productName === "Тирамису" && weatherData.temperature > 20) {
            baseReserve += 10; // Больше запаса для скоропортящихся продуктов в жару
        }
        
        if (productName === "Эклер" && weatherData.description.includes('солнечно')) {
            baseReserve += 3; // Больше спроса в солнечную погоду
        }
        
        return baseReserve;
    }

    showLoading() {
        document.getElementById('loading').style.display = 'block';
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    showResult(data) {
        const resultSection = document.getElementById('resultSection');
        const weatherInfo = document.getElementById('weatherInfo');
        const forecastList = document.getElementById('forecastList');

        // Показываем информацию о погоде
        weatherInfo.innerHTML = `
            <div>
                <strong>${data.weather.city} - Завтра (${data.weather.temperature}°C, ${data.weather.description})</strong><br>
                <small>Влажность: ${data.weather.humidity}% | Ветер: ${data.weather.wind_speed} м/с</small><br>
                <small>Ожидаются продажи:</small>
            </div>
        `;

        // Показываем прогноз по товарам
        forecastList.innerHTML = '';
        data.forecast.forEach(item => {
            const forecastItem = document.createElement('div');
            forecastItem.className = 'forecast-item';
            forecastItem.innerHTML = `
                <h3>${item.product}</h3>
                <div class="forecast-details">
                    <span class="forecast-amount">${item.forecast_amount} ${item.unit}</span>
                    <span class="forecast-reserve">(+${item.reserve_percent}% запас → ${item.total_amount} ${item.unit})</span>
                </div>
            `;
            forecastList.appendChild(forecastItem);
        });

        resultSection.style.display = 'block';
    }

    showError(message) {
        const errorSection = document.getElementById('errorSection');
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = message;
        errorSection.style.display = 'block';
    }

    hideError() {
        document.getElementById('errorSection').style.display = 'none';
    }

    hideResult() {
        document.getElementById('resultSection').style.display = 'none';
    }
}

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new VanLavOrderApp();
});
