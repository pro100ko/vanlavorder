from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi import Request
import pandas as pd
import requests
import os
from datetime import datetime, timedelta
from typing import List, Dict, Any
import json
from pathlib import Path

app = FastAPI(title="VanLavOrder", description="Система прогнозирования продаж")

# Настройка статических файлов и шаблонов
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Конфигурация
WEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "your_api_key_here")
CITIES = {
    "pyatigorsk": {"lat": 44.0486, "lon": 43.0594, "name": "Пятигорск"},
    "kislovodsk": {"lat": 43.9053, "lon": 43.1900, "name": "Кисловодск"}
}

class SalesForecaster:
    def __init__(self):
        self.weather_cache = {}
    
    def get_weather_forecast(self, city: str = "pyatigorsk") -> Dict[str, Any]:
        """Получение прогноза погоды через OpenWeatherMap API"""
        if city in self.weather_cache:
            return self.weather_cache[city]
        
        try:
            city_data = CITIES[city]
            url = f"http://api.openweathermap.org/data/2.5/forecast"
            params = {
                "lat": city_data["lat"],
                "lon": city_data["lon"],
                "appid": WEATHER_API_KEY,
                "units": "metric",
                "lang": "ru"
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            # Получаем прогноз на завтра
            tomorrow = datetime.now() + timedelta(days=1)
            tomorrow_str = tomorrow.strftime("%Y-%m-%d")
            
            tomorrow_forecast = None
            for item in data["list"]:
                if item["dt_txt"].startswith(tomorrow_str):
                    tomorrow_forecast = item
                    break
            
            if tomorrow_forecast:
                weather_info = {
                    "temperature": round(tomorrow_forecast["main"]["temp"]),
                    "description": tomorrow_forecast["weather"][0]["description"],
                    "humidity": tomorrow_forecast["main"]["humidity"],
                    "wind_speed": tomorrow_forecast["wind"]["speed"],
                    "city": city_data["name"]
                }
            else:
                # Fallback если прогноз не найден
                weather_info = {
                    "temperature": 20,
                    "description": "ясно",
                    "humidity": 60,
                    "wind_speed": 5,
                    "city": city_data["name"]
                }
            
            self.weather_cache[city] = weather_info
            return weather_info
            
        except Exception as e:
            print(f"Ошибка получения погоды: {e}")
            return {
                "temperature": 20,
                "description": "ясно",
                "humidity": 60,
                "wind_speed": 5,
                "city": "Пятигорск"
            }
    
    def analyze_sales_data(self, sales_df: pd.DataFrame, writeoffs_df: pd.DataFrame) -> Dict[str, Any]:
        """Анализ данных продаж и списаний"""
        try:
            # Конвертируем даты
            sales_df['дата'] = pd.to_datetime(sales_df['дата'])
            writeoffs_df['дата'] = pd.to_datetime(writeoffs_df['дата'])
            
            # Получаем данные за последние 30 дней
            end_date = datetime.now()
            start_date = end_date - timedelta(days=30)
            
            recent_sales = sales_df[sales_df['дата'] >= start_date]
            recent_writeoffs = writeoffs_df[writeoffs_df['дата'] >= start_date]
            
            # Группируем по товарам
            sales_by_product = recent_sales.groupby('товар')['кол-во'].agg(['sum', 'mean', 'count']).reset_index()
            writeoffs_by_product = recent_writeoffs.groupby('товар')['кол-во'].agg(['sum', 'mean']).reset_index()
            
            # Объединяем данные
            merged_data = sales_by_product.merge(
                writeoffs_by_product, 
                on='товар', 
                how='left', 
                suffixes=('_sales', '_writeoffs')
            )
            
            # Заполняем NaN значения
            merged_data = merged_data.fillna(0)
            
            # Рассчитываем прогноз
            forecast_results = []
            
            for _, row in merged_data.iterrows():
                product = row['товар']
                avg_sales = row['mean_sales']
                total_writeoffs = row['sum_writeoffs']
                total_sales = row['sum_sales']
                
                # Базовый прогноз на основе средних продаж
                base_forecast = avg_sales
                
                # Корректировка на основе списаний (если много списаний, увеличиваем прогноз)
                writeoff_rate = total_writeoffs / total_sales if total_sales > 0 else 0
                if writeoff_rate > 0.1:  # Если списания больше 10%
                    base_forecast *= 1.2  # Увеличиваем прогноз на 20%
                
                # Определяем единицу измерения
                unit = "шт." if "кг" not in product.lower() else "кг"
                
                # Рассчитываем запас
                reserve_percent = 15 if writeoff_rate > 0.05 else 10
                reserve_amount = base_forecast * (reserve_percent / 100)
                total_amount = base_forecast + reserve_amount
                
                forecast_results.append({
                    "product": product,
                    "forecast_amount": round(base_forecast, 1),
                    "reserve_percent": reserve_percent,
                    "total_amount": round(total_amount, 1),
                    "unit": unit,
                    "writeoff_rate": round(writeoff_rate * 100, 1)
                })
            
            return forecast_results
            
        except Exception as e:
            print(f"Ошибка анализа данных: {e}")
            raise HTTPException(status_code=400, detail=f"Ошибка анализа данных: {str(e)}")
    
    def generate_forecast(self, sales_file: UploadFile, writeoffs_file: UploadFile) -> Dict[str, Any]:
        """Генерация прогноза на основе загруженных файлов"""
        try:
            # Читаем файлы
            sales_df = pd.read_excel(sales_file.file)
            writeoffs_df = pd.read_excel(writeoffs_file.file)
            
            # Проверяем структуру файлов
            required_sales_columns = ['дата', 'товар', 'кол-во']
            required_writeoffs_columns = ['дата', 'товар', 'кол-во']
            
            if not all(col in sales_df.columns for col in required_sales_columns):
                raise HTTPException(status_code=400, detail="Неверная структура файла продаж")
            
            if not all(col in writeoffs_df.columns for col in required_writeoffs_columns):
                raise HTTPException(status_code=400, detail="Неверная структура файла списаний")
            
            # Получаем прогноз погоды
            weather = self.get_weather_forecast()
            
            # Анализируем данные
            forecast = self.analyze_sales_data(sales_df, writeoffs_df)
            
            return {
                "weather": weather,
                "forecast": forecast,
                "analysis_date": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Ошибка генерации прогноза: {e}")
            raise HTTPException(status_code=500, detail=f"Ошибка генерации прогноза: {str(e)}")

# Инициализация прогнозировщика
forecaster = SalesForecaster()

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    """Главная страница"""
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/api/forecast")
async def create_forecast(
    sales_file: UploadFile = File(...),
    writeoffs_file: UploadFile = File(...)
):
    """API эндпоинт для создания прогноза"""
    
    # Проверяем типы файлов
    if not sales_file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Файл продаж должен быть в формате Excel")
    
    if not writeoffs_file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Файл списаний должен быть в формате Excel")
    
    try:
        result = forecaster.generate_forecast(sales_file, writeoffs_file)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Проверка состояния сервера"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 