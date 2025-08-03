class VanLavOrderApp {
    constructor() {
        this.salesFile = null;
        this.writeoffsFile = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateAnalyzeButton();
    }

    bindEvents() {
        const salesInput = document.getElementById('salesFile');
        const writeoffsInput = document.getElementById('writeoffsFile');
        const analyzeBtn = document.getElementById('analyzeBtn');
        const demoBtn = document.getElementById('demoBtn');

        salesInput.addEventListener('change', (e) => {
            this.salesFile = e.target.files[0];
            this.updateAnalyzeButton();
        });

        writeoffsInput.addEventListener('change', (e) => {
            this.writeoffsFile = e.target.files[0];
            this.updateAnalyzeButton();
        });

        analyzeBtn.addEventListener('click', () => {
            this.analyzeData();
        });

        demoBtn.addEventListener('click', () => {
            this.runDemo();
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
            // В статической версии используем демо-данные
            const result = await this.processFiles(this.salesFile, this.writeoffsFile);
            this.showResult(result);
        } catch (error) {
            console.error('Error:', error);
            this.showError('Ошибка при анализе данных. Проверьте формат файлов и попробуйте снова.');
        } finally {
            this.hideLoading();
        }
    }

    async processFiles(salesFile, writeoffsFile) {
        // Симуляция обработки файлов
        return new Promise((resolve) => {
            setTimeout(() => {
                const demoResult = this.generateDemoResult();
                resolve(demoResult);
            }, 2000);
        });
    }

    generateDemoResult() {
        const products = [
            { name: "Эклер", forecast: 45, reserve: 10, unit: "шт." },
            { name: "Тирамису", forecast: 12, reserve: 15, unit: "кг" },
            { name: "Чизкейк", forecast: 8, reserve: 10, unit: "шт." },
            { name: "Наполеон", forecast: 15, reserve: 12, unit: "шт." },
            { name: "Медовик", forecast: 6, reserve: 15, unit: "шт." }
        ];

        const weather = {
            temperature: 24,
            description: "солнечно",
            city: "Пятигорск"
        };

        const forecast = products.map(product => ({
            product: product.name,
            forecast_amount: product.forecast,
            reserve_percent: product.reserve,
            total_amount: Math.round(product.forecast * (1 + product.reserve / 100)),
            unit: product.unit
        }));

        return {
            weather: weather,
            forecast: forecast,
            analysis_date: new Date().toISOString()
        };
    }

    runDemo() {
        this.showLoading();
        this.hideError();
        this.hideResult();

        setTimeout(() => {
            const demoResult = this.generateDemoResult();
            this.showResult(demoResult);
        }, 1500);
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
                <strong>Завтра (${data.weather.temperature}°C, ${data.weather.description})</strong><br>
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