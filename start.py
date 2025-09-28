#!/usr/bin/env python3
"""
Startup script for AstroWeather with integrated weather prediction
"""

import os
import sys
import subprocess
import webbrowser
from threading import Timer

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 7):
        print("ERROR: Python 3.7 or higher is required")
        sys.exit(1)
    print(f"Python {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro} detected")

def install_dependencies():
    """Install Python dependencies"""
    print("Installing Python dependencies...")
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'])
        print("Dependencies installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"Failed to install dependencies: {e}")
        sys.exit(1)

def start_backend_server():
    """Start the Flask backend server"""
    print("Starting weather prediction backend server...")
    try:
        # Set environment variable for API key (you can change this)
        env = os.environ.copy()
        env['OPENWEATHER_API_KEY'] = '8b96a2858cb7d52f0cee1aac54204619'  # Add your API key here

        # Try different Python executables
        python_executables = [
            sys.executable,
            r"C:\Users\joshi\AppData\Local\Microsoft\WindowsApps\PythonSoftwareFoundation.Python.3.11_qbz5n2kfra8p0\python.exe",
            r"C:\Python311\python.exe",
            r"C:\Python310\python.exe",
            r"C:\Python39\python.exe",
            r"C:\Python38\python.exe"
        ]

        backend_process = None
        for python_exe in python_executables:
            try:
                print(f"  Trying Python executable: {python_exe}")
                backend_process = subprocess.Popen([
                    python_exe, 'weather_api.py'
                ], env=env, cwd=os.getcwd())
                print(f"Backend server started with {python_exe}")
                break
            except (FileNotFoundError, subprocess.SubprocessError):
                continue

        if backend_process is None:
            print("Could not find a working Python executable")
            print("Please ensure Python 3.7+ is installed and try running:")
            print("   python weather_api.py")
            sys.exit(1)

        print("Backend server started on http://localhost:5000")
        return backend_process

    except Exception as e:
        print(f"Failed to start backend server: {e}")
        sys.exit(1)

def start_frontend_server():
    """Start the frontend server"""
    print("Starting frontend server...")
    try:
        # Start the http-server for the frontend
        frontend_process = subprocess.Popen([
            'npx', 'http-server', '-p', '8080', '-c-1', '--cors'
        ], cwd=os.getcwd())

        print("Frontend server started on http://localhost:8080")
        return frontend_process

    except Exception as e:
        print(f"Failed to start frontend server: {e}")
        sys.exit(1)

def open_browser():
    """Open the browser after a delay"""
    def _open():
        webbrowser.open('http://localhost:8080/glob.html')
        print("Opening AstroWeather in your browser...")
    Timer(2, _open).start()

def main():
    """Main startup function"""
    print("Starting AstroWeather with Weather Prediction System")
    print("=" * 60)

    # Check Python version
    check_python_version()

    # Check if requirements.txt exists
    if not os.path.exists('requirements.txt'):
        print("ERROR: requirements.txt not found")
        sys.exit(1)

    # Install dependencies
    install_dependencies()

    # Start servers
    backend_process = start_backend_server()
    frontend_process = start_frontend_server()

    # Open browser
    open_browser()

    print("\nAstroWeather is now running!")
    print("Weather prediction backend: http://localhost:5000")
    print("Frontend interface: http://localhost:8080")
    print("\nPress Ctrl+C to stop all servers")

    try:
        # Wait for both processes
        backend_process.wait()
        frontend_process.wait()
    except KeyboardInterrupt:
        print("\nShutting down servers...")
        backend_process.terminate()
        frontend_process.terminate()
        print("Servers stopped")

if __name__ == "__main__":
    main()