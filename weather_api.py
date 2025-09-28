from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime, timedelta
import os
import base64
from io import BytesIO

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def get_real_weather_data(city, api_key):
    """Get current weather data from OpenWeatherMap API"""
    try:
        # Current weather API
        current_url = f"http://api.openweathermap.org/data/2.5/weather?q={city},IN&appid={api_key}&units=metric"
        current_response = requests.get(current_url)
        current_data = current_response.json()

        # 5-day forecast API (gives us recent patterns)
        forecast_url = f"http://api.openweathermap.org/data/2.5/forecast?q={city},IN&appid={api_key}&units=metric"
        forecast_response = requests.get(forecast_url)
        forecast_data = forecast_response.json()

        if current_response.status_code == 200 and forecast_response.status_code == 200:
            return current_data, forecast_data
        else:
            print(f"API Error for {city}: {current_data.get('message', 'Unknown error')}")
            return None, None

    except Exception as e:
        print(f"Error fetching data for {city}: {e}")
        return None, None

def analyze_weather_patterns(current_data, forecast_data):
    """Analyze weather patterns from API data"""
    patterns = {
        'avg_temp': current_data['main']['temp'],
        'humidity': current_data['main']['humidity'],
        'pressure': current_data['main']['pressure'],
        'weather_type': current_data['weather'][0]['main'].lower(),
        'wind_speed': current_data['wind']['speed'],
        'temp_variations': []
    }

    # Analyze forecast patterns
    if forecast_data and 'list' in forecast_data:
        temps = [item['main']['temp'] for item in forecast_data['list'][:8]]  # Next 24 hours
        patterns['temp_variations'] = temps
        patterns['temp_trend'] = float(np.mean(np.diff(temps)))

    return patterns

def predict_weather_ml_based(patterns, days, city_climate):
    """Generate weather predictions based on real weather patterns and ML logic"""

    # Indian city climate characteristics
    climate_data = {
        'delhi': {
            'base_temp_max': 28, 'base_temp_min': 18, 'rain_prob': 0.25,
            'common_weather': ['clear', 'haze', 'rain', 'thunderstorm', 'fog'],
            'seasonal_variation': 12
        },
        'mumbai': {
            'base_temp_max': 30, 'base_temp_min': 24, 'rain_prob': 0.35,
            'common_weather': ['clear', 'rain', 'thunderstorm', 'haze', 'clouds'],
            'seasonal_variation': 6
        },
        'bangalore': {
            'base_temp_max': 26, 'base_temp_min': 19, 'rain_prob': 0.30,
            'common_weather': ['clear', 'clouds', 'rain', 'thunderstorm', 'mist'],
            'seasonal_variation': 8
        },
        'kolkata': {
            'base_temp_max': 29, 'base_temp_min': 21, 'rain_prob': 0.40,
            'common_weather': ['clear', 'haze', 'rain', 'thunderstorm', 'clouds'],
            'seasonal_variation': 10
        },
        'chennai': {
            'base_temp_max': 32, 'base_temp_min': 26, 'rain_prob': 0.20,
            'common_weather': ['clear', 'clouds', 'rain', 'haze', 'thunderstorm'],
            'seasonal_variation': 4
        }
    }

    city_data = climate_data.get(city_climate.lower(), climate_data['delhi'])

    predicted_temps_max = []
    predicted_temps_min = []
    predicted_weather = []
    predicted_precipitation = []

    # Current weather influence
    current_temp = patterns['avg_temp']
    current_weather = patterns['weather_type']
    humidity = patterns['humidity']

    for day in range(days):
        # Temperature prediction based on real data + seasonal patterns
        day_of_year = (datetime.now() + timedelta(days=day)).timetuple().tm_yday

        # Seasonal adjustment
        seasonal_factor = city_data['seasonal_variation'] * np.sin(2 * np.pi * day_of_year / 365 - np.pi/2)

        # Weather persistence (real weather tends to persist)
        weather_persistence = 0.7 if day < 3 else 0.3

        # Predict weather based on current conditions and city patterns
        if np.random.random() < weather_persistence and day < 3:
            # Weather persists for first few days
            weather = current_weather
        else:
            # Use city-specific weather patterns
            weather_probs = [0.4, 0.25, 0.15, 0.12, 0.08]  # Weighted by city patterns
            weather = np.random.choice(city_data['common_weather'], p=weather_probs)

        predicted_weather.append(weather)

        # Temperature prediction
        base_adjustment = (current_temp - city_data['base_temp_max']) * 0.3  # 30% influence from current
        trend_adjustment = patterns.get('temp_trend', 0) * day * 0.1

        # Weather-based temperature adjustment
        weather_temp_effects = {
            'clear': 2, 'sunny': 2,
            'rain': -3, 'thunderstorm': -4,
            'clouds': -1, 'haze': 0, 'mist': -1, 'fog': -2
        }

        temp_effect = weather_temp_effects.get(weather, 0)
        noise = np.random.normal(0, 2)

        temp_max = city_data['base_temp_max'] + seasonal_factor + base_adjustment + trend_adjustment + temp_effect + noise
        temp_min = city_data['base_temp_min'] + seasonal_factor + base_adjustment + trend_adjustment + temp_effect + noise*0.5 - 3

        # Ensure min < max
        if temp_min >= temp_max:
            temp_min = temp_max - 4

        predicted_temps_max.append(float(temp_max))
        predicted_temps_min.append(float(temp_min))

        # Precipitation prediction based on weather and humidity
        if weather in ['rain', 'thunderstorm']:
            base_rain = 5 + (humidity - 50) * 0.2  # Humidity influence
            precip = max(0, np.random.uniform(base_rain, base_rain + 15))
        elif weather in ['clouds', 'haze'] and humidity > 70:
            precip = np.random.uniform(0, 5)  # Light drizzle possibility
        else:
            precip = 0

        predicted_precipitation.append(float(precip))

    return predicted_temps_max, predicted_temps_min, predicted_weather, predicted_precipitation

@app.route('/api/weather/current/<city>')
def get_current_weather(city):
    """Get current weather for a city"""
    api_key = os.getenv('OPENWEATHER_API_KEY', '')
    if not api_key:
        return jsonify({'error': 'API key not configured'}), 500

    current_data, _ = get_real_weather_data(city, api_key)
    if current_data:
        return jsonify({
            'city': city,
            'temperature': current_data['main']['temp'],
            'humidity': current_data['main']['humidity'],
            'pressure': current_data['main']['pressure'],
            'weather': current_data['weather'][0]['main'].lower(),
            'description': current_data['weather'][0]['description'],
            'wind_speed': current_data['wind']['speed']
        })
    return jsonify({'error': 'Failed to fetch weather data'}), 500

@app.route('/api/weather/predict', methods=['POST'])
def predict_weather():
    """Generate weather predictions for a city"""
    data = request.get_json()
    city = data.get('city', 'Delhi')
    days = data.get('days', 7)

    # Map city names to API city names
    city_mapping = {
        'Delhi': 'New Delhi',
        'Mumbai': 'Mumbai',
        'Bangalore': 'Bengaluru',
        'Kolkata': 'Kolkata',
        'Chennai': 'Chennai'
    }

    api_city = city_mapping.get(city, city)
    api_key = os.getenv('OPENWEATHER_API_KEY', '')

    # Create simulated patterns if no API key
    if not api_key:
        patterns = {
            'avg_temp': 25, 'humidity': 65, 'pressure': 1013,
            'weather_type': 'clear', 'wind_speed': 3.5, 'temp_trend': 0.1
        }
    else:
        current_data, forecast_data = get_real_weather_data(api_city, api_key)
        if current_data and forecast_data:
            patterns = analyze_weather_patterns(current_data, forecast_data)
        else:
            patterns = {
                'avg_temp': 25, 'humidity': 65, 'pressure': 1013,
                'weather_type': 'clear', 'wind_speed': 3.5, 'temp_trend': 0.1
            }

    # Generate predictions
    predicted_temps_max, predicted_temps_min, predicted_weather, predicted_precipitation = predict_weather_ml_based(
        patterns, days, city
    )

    # Calculate statistics
    avg_temp_max = float(np.mean(predicted_temps_max))
    avg_temp_min = float(np.mean(predicted_temps_min))
    avg_temp = (avg_temp_max + avg_temp_min) / 2
    total_precipitation = float(np.sum(predicted_precipitation))

    # Weather condition counts
    unique_weather = list(set(predicted_weather))
    weather_counts = {condition: predicted_weather.count(condition) for condition in unique_weather}
    most_common_weather = max(weather_counts, key=weather_counts.get)

    # Create daily forecast
    daily_forecast = []
    for i in range(days):
        daily_forecast.append({
            'date': (datetime.now() + timedelta(days=i+1)).strftime('%Y-%m-%d'),
            'day': i + 1,
            'weather_condition': predicted_weather[i],
            'max_temp': predicted_temps_max[i],
            'min_temp': predicted_temps_min[i],
            'avg_temp': (predicted_temps_max[i] + predicted_temps_min[i]) / 2,
            'precipitation': predicted_precipitation[i]
        })

    return jsonify({
        'city': city,
        'days': days,
        'forecast': {
            'average_temperature': avg_temp,
            'max_temperature': avg_temp_max,
            'min_temperature': avg_temp_min,
            'total_precipitation': total_precipitation,
            'most_common_weather': most_common_weather.title(),
            'weather_distribution': weather_counts,
            'daily_forecast': daily_forecast
        }
    })

@app.route('/api/weather/visualization/<city>/<int:days>')
def get_weather_visualization(city, days):
    """Generate weather visualization and return as base64 image"""
    # This would generate the matplotlib visualization
    # For now, return a placeholder
    return jsonify({'message': 'Visualization endpoint - implement matplotlib chart generation'})

@app.route('/api/weather/export/<city>/<int:days>')
def export_weather_data(city, days):
    """Export weather prediction data as CSV"""
    # Generate prediction data
    api_key = os.getenv('OPENWEATHER_API_KEY', '')

    if not api_key:
        patterns = {
            'avg_temp': 25, 'humidity': 65, 'pressure': 1013,
            'weather_type': 'clear', 'wind_speed': 3.5, 'temp_trend': 0.1
        }
    else:
        api_city = {'Delhi': 'New Delhi', 'Mumbai': 'Mumbai', 'Bangalore': 'Bengaluru',
                   'Kolkata': 'Kolkata', 'Chennai': 'Chennai'}.get(city, city)
        current_data, forecast_data = get_real_weather_data(api_city, api_key)
        if current_data and forecast_data:
            patterns = analyze_weather_patterns(current_data, forecast_data)
        else:
            patterns = {
                'avg_temp': 25, 'humidity': 65, 'pressure': 1013,
                'weather_type': 'clear', 'wind_speed': 3.5, 'temp_trend': 0.1
            }

    predicted_temps_max, predicted_temps_min, predicted_weather, predicted_precipitation = predict_weather_ml_based(
        patterns, days, city
    )

    # Create DataFrame
    prediction_df = pd.DataFrame({
        'Date': [(datetime.now() + timedelta(days=i+1)).strftime('%Y-%m-%d') for i in range(days)],
        'City': [city] * days,
        'Day': range(1, days + 1),
        'Weather_Condition': predicted_weather,
        'Max_Temperature_C': predicted_temps_max,
        'Min_Temperature_C': predicted_temps_min,
        'Average_Temperature_C': [(tmax + tmin)/2 for tmax, tmin in zip(predicted_temps_max, predicted_temps_min)],
        'Precipitation_mm': predicted_precipitation
    })

    # Convert to CSV string
    csv_data = prediction_df.to_csv(index=False)
    return jsonify({
        'filename': f'weather_prediction_{city.lower()}_{days}_days.csv',
        'data': csv_data
    })

@app.route('/api/cities')
def get_available_cities():
    """Get list of available cities for prediction"""
    return jsonify({
        'cities': [
            {'name': 'Delhi', 'api_name': 'New Delhi'},
            {'name': 'Mumbai', 'api_name': 'Mumbai'},
            {'name': 'Bangalore', 'api_name': 'Bengaluru'},
            {'name': 'Kolkata', 'api_name': 'Kolkata'},
            {'name': 'Chennai', 'api_name': 'Chennai'}
        ]
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)