#!/usr/bin/env python3
"""
Simple test to check if the Flask server can start
"""

import sys
print("Python version:", sys.version)

try:
    import flask
    print("OK Flask version:", flask.__version__)
except ImportError as e:
    print("ERROR Flask import error:", e)
    sys.exit(1)

try:
    import flask_cors
    print("OK Flask-CORS version:", flask_cors.__version__)
except ImportError as e:
    print("ERROR Flask-CORS import error:", e)

try:
    import numpy as np
    print("OK NumPy version:", np.__version__)
except ImportError as e:
    print("ERROR NumPy import error:", e)

try:
    import pandas as pd
    print("OK Pandas version:", pd.__version__)
except ImportError as e:
    print("ERROR Pandas import error:", e)

try:
    import requests
    print("OK Requests version:", requests.__version__)
except ImportError as e:
    print("ERROR Requests import error:", e)

print("\nTesting basic Flask app...")
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/test')
def test():
    return {'status': 'ok', 'message': 'Server is running!'}

if __name__ == '__main__':
    print("Starting test server on http://localhost:5000")
    print("Test endpoint: http://localhost:5000/test")
    try:
        app.run(debug=True, host='0.0.0.0', port=5000)
    except Exception as e:
        print("ERROR Server error:", e)