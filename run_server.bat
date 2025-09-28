@echo off
echo Starting AstroWeather Backend Server...
echo ======================================

REM Try to use python from PATH first
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python not found in PATH, trying alternative locations...
    REM Try the Microsoft Store Python
    "C:\Users\joshi\AppData\Local\Microsoft\WindowsApps\PythonSoftwareFoundation.Python.3.11_qbz5n2kfra8p0\python.exe" --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo ERROR: Python not found. Please install Python 3.7+
        pause
        exit /b 1
    ) else (
        "C:\Users\joshi\AppData\Local\Microsoft\WindowsApps\PythonSoftwareFoundation.Python.3.11_qbz5n2kfra8p0\python.exe" weather_api.py
    )
) else (
    python weather_api.py
)

pause