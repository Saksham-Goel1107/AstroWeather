# Troubleshooting Guide

## Python Server Not Loading - Solutions

### Issue: Python Server Won't Start

**Problem**: The Python server fails to start due to environment or dependency issues.

**Solutions** (try in order):

#### Option 1: Use the Batch File (Windows)
```cmd
# Double-click this file in Windows Explorer
run_server.bat
```

#### Option 2: Manual Python Execution
```cmd
# Try these commands in Command Prompt:
python weather_api.py

# OR if that doesn't work:
"C:\Users\joshi\AppData\Local\Microsoft\WindowsApps\PythonSoftwareFoundation.Python.3.11_qbz5n2kfra8p0\python.exe" weather_api.py
```

#### Option 3: Use the Automated Startup
```cmd
python start.py
```

#### Option 4: Check Dependencies
```cmd
# Verify all packages are installed
pip list | findstr "Flask numpy pandas requests"
```

### Common Issues and Fixes

#### 1. "Module not found" errors
**Fix**: Reinstall dependencies in the correct Python environment
```cmd
# Install for the current Python executable
python -m pip install -r requirements.txt
```

#### 2. Port 5000 already in use
**Fix**: Change the port in `weather_api.py`:
```python
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)  # Changed from 5000 to 5001
```

#### 3. API Key issues
**Fix**: The server works without an API key (uses demo data). To add real weather data:
1. Get a free API key from [OpenWeatherMap](https://openweathermap.org/api)
2. Add it to `weather_api.py`:
```python
env['OPENWEATHER_API_KEY'] = 'your_actual_api_key_here'
```

### Testing the Server

#### Quick Test
1. Start the server using any method above
2. Open your browser and go to: `http://localhost:5000/test`
3. You should see: `{"status": "ok", "message": "Server is running!"}`

#### Full Integration Test
```cmd
python test_integration.py
```

### Alternative: Run Without Python Server

If you can't get the Python server running, you can still use the AstroWeather globe:

1. **Start frontend only**:
```cmd
npx http-server -p 8080 -c-1 --cors
```

2. **Open in browser**: `http://localhost:8080/glob.html`

3. **Use basic features**: The globe will work, but weather prediction features will show connection errors (expected without the backend).

### Getting Help

If you're still having issues:

1. **Check the console**: Look for specific error messages
2. **Verify Python version**: `python --version` (should be 3.7+)
3. **Check dependencies**: `pip list` (should show Flask, numpy, etc.)
4. **Test network**: `ping localhost` (should work)
5. **Check ports**: `netstat -an | findstr :5000` (should not show conflicts)

### Environment Information

**Current Setup**:
- Python: 3.11.9 ✅
- Dependencies: Installed ✅
- Backend Code: Ready ✅
- Frontend Code: Ready ✅

**Expected URLs**:
- Frontend: http://localhost:8080/glob.html
- Backend API: http://localhost:5000/api/weather/predict
- Test endpoint: http://localhost:5000/test

---

*If you continue to have issues, the frontend will work independently and show appropriate error messages for the missing backend connection.*