import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

def generate_sample_data():
    """Генерация примеров данных для тестирования"""
    
    # Генерируем даты за последние 30 дней
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    dates = pd.date_range(start=start_date, end=end_date, freq='D')
    
    # Список товаров
    products = [
        "Эклер", "Тирамису", "Чизкейк", "Наполеон", "Медовик",
        "Прага", "Сметанник", "Птичье молоко", "Красный бархат", "Торт Молочный"
    ]
    
    # Генерируем данные продаж
    sales_data = []
    for date in dates:
        # Генерируем от 3 до 8 товаров в день
        num_products = random.randint(3, 8)
        daily_products = random.sample(products, num_products)
        
        for product in daily_products:
            # Базовое количество продаж
            base_amount = random.randint(10, 50)
            
            # Корректировка по дням недели
            if date.weekday() in [5, 6]:  # Выходные
                base_amount = int(base_amount * 1.5)
            
            # Корректировка по погоде (симуляция)
            if random.random() < 0.3:  # 30% шанс жаркой погоды
                base_amount = int(base_amount * 0.8)  # Меньше продаж в жару
            
            sales_data.append({
                'дата': date.strftime('%Y-%m-%d'),
                'товар': product,
                'кол-во': base_amount
            })
    
    # Генерируем данные списаний
    writeoffs_data = []
    for date in dates:
        # Списания происходят реже
        if random.random() < 0.4:  # 40% шанс списаний в день
            num_writeoffs = random.randint(1, 3)
            writeoff_products = random.sample(products, num_writeoffs)
            
            for product in writeoff_products:
                # Количество списаний меньше продаж
                writeoff_amount = random.randint(1, 5)
                
                writeoffs_data.append({
                    'дата': date.strftime('%Y-%m-%d'),
                    'товар': product,
                    'кол-во': writeoff_amount
                })
    
    # Создаем DataFrame
    sales_df = pd.DataFrame(sales_data)
    writeoffs_df = pd.DataFrame(writeoffs_data)
    
    # Сохраняем в Excel файлы
    sales_df.to_excel('sample_sales.xlsx', index=False)
    writeoffs_df.to_excel('sample_writeoffs.xlsx', index=False)
    
    print("✅ Созданы примеры данных:")
    print(f"📊 Продажи: {len(sales_data)} записей -> sample_sales.xlsx")
    print(f"📉 Списания: {len(writeoffs_data)} записей -> sample_writeoffs.xlsx")
    print("\n📋 Структура файла продаж:")
    print(sales_df.head())
    print("\n📋 Структура файла списаний:")
    print(writeoffs_df.head())

if __name__ == "__main__":
    generate_sample_data() 