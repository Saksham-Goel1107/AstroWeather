# AstroWeather with ML Weather Prediction System

A stunning 3D globe application with integrated real-time weather data and AI-powered weather prediction system for Indian cities.

## 🌟 Features

### Core Features
- **Interactive 3D Globe**: Navigate through a beautiful 3D representation of Earth
- **Real-time Weather**: Get instant weather data for any location
- **AI Weather Prediction**: ML-powered weather forecasting for Indian cities
- **Astronomical Data**: Sunrise/sunset times, moon phases, and celestial events
- **Smart Search**: Find any location instantly with intelligent search
- **Responsive Design**: Seamless experience across all devices

### Weather Prediction System
- **Indian Cities Support**: Delhi, Mumbai, Bangalore, Kolkata, Chennai
- **Multi-day Forecasts**: 1, 3, 7, 10, or 15-day predictions
- **Real-time Data Integration**: Uses current weather patterns for accurate predictions
- **Climate-specific Models**: City-specific climate characteristics and seasonal variations
- **Weather Persistence**: Accounts for weather patterns that tend to persist
- **Export Functionality**: Download prediction data as CSV files
- **Visual Analytics**: Charts and graphs for weather distribution and trends

## 🚀 Quick Start

### Prerequisites
- Python 3.7 or higher
- Node.js (for frontend server if needed)
- OpenWeatherMap API key (free)

### Installation

1. **Clone or download the AstroWeather files**

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Get your OpenWeatherMap API key:**
   - Visit [OpenWeatherMap](https://openweathermap.org/api)
   - Sign up for a free account
   - Generate an API key

4. **Configure API key:**
   Edit `weather_api.py` and replace the API key:
   ```python
   env['OPENWEATHER_API_KEY'] = 'YOUR_API_KEY_HERE'
   ```

### Running the Application

#### Option 1: Automated Startup (Recommended)
```bash
python start.py
```
This will:
- Install dependencies automatically
- Start the weather prediction backend server (port 5000)
- Start the frontend server (port 8080)
- Open your browser automatically

#### Option 2: Manual Startup
```bash
# Terminal 1: Start backend server
python weather_api.py

# Terminal 2: Start frontend server
npx http-server -p 8080 -c-1 --cors

# Open browser to: http://localhost:8080/glob.html
```

#### Option 3: Using npm scripts
```bash
npm run install-deps  # Install Python dependencies
npm run start-backend # Start Flask server
npm run start-frontend # Start frontend server
```

## 🎯 How to Use

### Basic Globe Navigation
1. **Rotate**: Click and drag to rotate the globe
2. **Zoom**: Use zoom in/out buttons or mouse wheel
3. **Search**: Enter location name in search box
4. **Click**: Click on any location to add a pin and view details

### Weather Prediction System
1. **Open Prediction Panel**: Click the cloud icon (☁️) in the control panel
2. **Select City**: Choose from Delhi, Mumbai, Bangalore, Kolkata, or Chennai
3. **Choose Duration**: Select prediction period (1-15 days)
4. **Generate**: Click "Generate Prediction" to create forecast
5. **View Results**: See detailed daily forecasts with temperature ranges
6. **Export Data**: Download prediction data as CSV file

### Understanding Predictions
- **Weather Distribution**: Shows probability of different weather types
- **Temperature Trends**: Daily high/low temperatures with averages
- **Precipitation**: Expected rainfall amounts
- **Weather Persistence**: First few days tend to follow current weather patterns

## 🔧 Configuration

### API Configuration
- **OpenWeatherMap API Key**: Required for real-time weather data
- **Backend Port**: Default 5000 (configurable in `weather_api.py`)
- **Frontend Port**: Default 8080 (configurable in startup scripts)

### Customization Options
- **City Climate Data**: Modify climate characteristics in `weather_api.py`
- **Prediction Parameters**: Adjust weather persistence and seasonal factors
- **UI Theme**: Toggle between light and dark themes

## 📁 Project Structure

```
AstroWeather/
├── index.html          # Landing page
├── glob.html           # Main 3D globe interface
├── app.js              # Frontend JavaScript
├── styles.css          # CSS styles
├── weather_api.py      # Flask backend with ML prediction
├── start.py           # Startup script
├── requirements.txt    # Python dependencies
├── package.json        # Node.js configuration
└── README.md          # This file
```

## 🔍 API Endpoints

### Weather Prediction
- `POST /api/weather/predict` - Generate weather predictions
- `GET /api/weather/current/<city>` - Get current weather
- `GET /api/weather/export/<city>/<days>` - Export prediction data
- `GET /api/cities` - Get available cities

### Example API Usage
```javascript
// Generate 7-day prediction for Bangalore
fetch('http://localhost:5000/api/weather/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ city: 'Bangalore', days: 7 })
})
.then(response => response.json())
.then(data => console.log(data));
```

## 🛠️ Development

### Adding New Cities
1. Add city data to `climate_data` in `weather_api.py`
2. Update city selection dropdown in `glob.html`
3. Add city mapping in API endpoints

### Modifying Prediction Algorithm
- **Seasonal Factors**: Adjust `seasonal_variation` values
- **Weather Persistence**: Modify persistence probability (0.7 for first 3 days)
- **Temperature Effects**: Update `weather_temp_effects` dictionary
- **Climate Data**: Customize base temperatures and weather patterns

### Troubleshooting

**Backend server won't start:**
- Check Python version (3.7+ required)
- Verify all dependencies are installed
- Check if port 5000 is available

**Weather data not loading:**
- Verify OpenWeatherMap API key is valid
- Check internet connection
- Ensure API endpoints are accessible

**Frontend not loading:**
- Check if frontend server is running on port 8080
- Verify all files are in the correct directory
- Clear browser cache if needed

## 🌐 Browser Support

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Mobile browsers**: Responsive design with touch support

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the browser console for errors
3. Verify all dependencies are installed correctly
4. Ensure API keys are properly configured

---

**Built with ❤️ for space and weather enthusiasts**

*Experience the beauty of our planet through interactive weather data and astronomical wonders*