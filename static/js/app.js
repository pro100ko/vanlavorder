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
            const formData = new FormData();
            formData.append('sales_file', this.salesFile);
            formData.append('writeoffs_file', this.writeoffsFile);

            const response = await fetch('/api/forecast', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            this.showResult(result);

        } catch (error) {
            console.error('Error:', error);
            this.showError('Ошибка при анализе данных. Проверьте формат файлов и попробуйте снова.');
        } finally {
            this.hideLoading();
        }
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