// Global variables
let scene, camera, renderer, globe, controls;
let raycaster, mouse;
let markers = [];
let isNightMode = false;
let isLoading = true;
let isDragging = false;
let currentPin = null;
let detailsButton = null;
let dragOnlyMode = true;
let currentLocation = null;
let favoriteLocations = JSON.parse(localStorage.getItem('favoriteLocations') || '[]');
let weatherHistory = JSON.parse(localStorage.getItem('weatherHistory') || '[]');
let userPreferences = JSON.parse(localStorage.getItem('userPreferences') || '{}');
let soundEnabled = userPreferences.soundEnabled !== false;

// Constants
const GLOBE_RADIUS = 5;
const MARKER_SIZE = 0.1;
const EARTH_TEXTURE_PATH = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg';
const EARTH_BUMP_MAP_PATH = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg';
const EARTH_SPECULAR_MAP_PATH = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg';
const EARTH_NIGHT_MAP_PATH = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_lights_2048.jpg';
const CLOUDS_TEXTURE_PATH = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_2048.jpg';
const STARS_TEXTURE_PATH = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/stars_milkyway.jpg';

// Weather API configuration
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';
const FORECAST_API_URL = 'https://api.openweathermap.org/data/2.5/forecast';
const AIR_QUALITY_API_URL = 'https://api.openweathermap.org/data/2.5/air_pollution';
const UV_INDEX_API_URL = 'https://api.openweathermap.org/data/2.5/uvi';
const WEATHER_API_KEY = '8b96a2858cb7d52f0cee1aac54204619'; // Hardcoded for client-side

// Geocoding API configuration
const GEOCODING_API_URL = 'https://api.openweathermap.org/geo/1.0/direct';
const REVERSE_GEOCODING_API_URL = 'https://api.openweathermap.org/geo/1.0/reverse';

// Astronomical API configuration
const ASTRONOMY_API_URL = 'https://api.sunrise-sunset.org/json';
const ISS_API_URL = 'http://api.open-notify.org/iss-now.json';

// Audio files for sound effects
const SOUNDS = {
    click: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCjys5fK4bCMIl8uNi3SIe6N1kJGqqAQeFdKWqJYJJXfHi1xfXj5tJ4ShIyQIJXbLjVhf',
    success: 'data:audio/wav;base64,UklGRt4HAABXQVZFZm1ETEQAAAABGAIAQB8AAEAfAQABAAgAZGF0YbQHAABFi8qVQjJ0nH+IuaJKbf2LYnKNxJJBL3Stf4q5oEdu+o5k',
    notification: 'data:audio/wav;base64,UklGRjIEAABXQVZFZm10IBAAAAABAAIARKwAAIhYAQAEABAAZGF0YQ4EAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA=='
};

// Hide loading screen after everything is loaded
window.addEventListener('load', () => {
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                isLoading = false;
            }, 500);
        }
    }, 1500); // Add a small delay for better UX
});

// Initialize the application
document.addEventListener('DOMContentLoaded', init);

function init() {
    // Set up the scene
    setupScene();
    
    // Create the globe
    createGlobe();
    
    // Set up lighting
    setupLighting();
    
    // Set up controls
    setupControls();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize GPS location
    initializeGPS();
    
    // Load user preferences
    loadUserPreferences();
    
    // Start animation loop
    animate();
}

function playSound(soundType) {
    if (!soundEnabled) return;
    
    try {
        const audio = new Audio(SOUNDS[soundType]);
        audio.volume = 0.3;
        audio.play().catch(() => {});
    } catch (e) {
        console.log('Sound not available');
    }
}

function initializeGPS() {
    if ('geolocation' in navigator) {
        const gpsButton = document.createElement('button');
        gpsButton.id = 'gps-button';
        gpsButton.className = 'gps-btn';
        gpsButton.innerHTML = '<i class="fas fa-location-arrow"></i><span>My Location</span>';
        gpsButton.addEventListener('click', getCurrentLocation);
        
        document.querySelector('.controls').appendChild(gpsButton);
    }
}

function getCurrentLocation() {
    playSound('click');
    const gpsButton = document.getElementById('gps-button');
    const icon = gpsButton.querySelector('i');
    
    icon.className = 'fas fa-spinner fa-spin';
    gpsButton.disabled = true;
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            // Calculate position on globe
            const phi = (90 - lat) * (Math.PI / 180);
            const theta = (lng + 180) * (Math.PI / 180);
            
            const x = -GLOBE_RADIUS * Math.sin(phi) * Math.cos(theta);
            const y = GLOBE_RADIUS * Math.cos(phi);
            const z = GLOBE_RADIUS * Math.sin(phi) * Math.sin(theta);
            
            const position3D = new THREE.Vector3(x, y, z);
            
            // Add pin and get weather
            addPin(position3D, lat, lng);
            rotateGlobeToPosition(position3D);
            
            playSound('success');
            icon.className = 'fas fa-location-arrow';
            gpsButton.disabled = false;
            
            currentLocation = { lat, lng };
        },
        (error) => {
            console.error('GPS Error:', error);
            alert('Unable to get your location. Please check your browser settings.');
            icon.className = 'fas fa-location-arrow';
            gpsButton.disabled = false;
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
        }
    );
}

function loadUserPreferences() {
    // Apply saved theme
    if (userPreferences.theme === 'light') {
        document.body.classList.add('light-theme');
    }
    
    // Apply sound setting
    soundEnabled = userPreferences.soundEnabled !== false;
}

function setupScene() {
    // Create scene
    scene = new THREE.Scene();
    
    // Create camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 15;
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('globe-container').appendChild(renderer.domElement);
    
    // Create raycaster for interaction
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // Add stars background
    addStarsBackground();
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
}

function addStarsBackground() {
    const textureLoader = new THREE.TextureLoader();
    const starsTexture = textureLoader.load(STARS_TEXTURE_PATH);
    
    const starGeometry = new THREE.SphereGeometry(100, 32, 32);
    const starMaterial = new THREE.MeshBasicMaterial({
        map: starsTexture,
        side: THREE.BackSide
    });
    
    const starSphere = new THREE.Mesh(starGeometry, starMaterial);
    scene.add(starSphere);
}

function createGlobe() {
    const textureLoader = new THREE.TextureLoader();
    
    // Load Earth textures
    const earthTexture = textureLoader.load(EARTH_TEXTURE_PATH);
    const earthBumpMap = textureLoader.load(EARTH_BUMP_MAP_PATH);
    const earthSpecularMap = textureLoader.load(EARTH_SPECULAR_MAP_PATH);
    const earthNightMap = textureLoader.load(EARTH_NIGHT_MAP_PATH);
    const cloudsTexture = textureLoader.load(CLOUDS_TEXTURE_PATH);
    
    // Create Earth sphere
    const earthGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const earthMaterial = new THREE.MeshPhongMaterial({
        map: earthTexture,
        bumpMap: earthBumpMap,
        bumpScale: 0.05,
        specularMap: earthSpecularMap,
        specular: new THREE.Color('grey'),
        shininess: 5
    });
    
    globe = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(globe);
    
    // Create clouds layer
    const cloudsGeometry = new THREE.SphereGeometry(GLOBE_RADIUS + 0.1, 64, 64);
    const cloudsMaterial = new THREE.MeshPhongMaterial({
        map: cloudsTexture,
        transparent: true,
        opacity: 0.4
    });
    
    const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
    scene.add(clouds);
    
    // Store night texture for day/night toggle
    globe.userData.dayTexture = earthTexture;
    globe.userData.nightTexture = earthNightMap;
    globe.userData.clouds = clouds;
}

function setupLighting() {
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambientLight);
    
    // Add directional light (sun)
    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);
    
    // Add point light for night side illumination
    const nightLight = new THREE.PointLight(0x2a5ebb, 0.5);
    nightLight.position.set(-10, 0, 10);
    scene.add(nightLight);
}

function setupControls() {
    // Set up OrbitControls for drag-only interaction
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.minDistance = GLOBE_RADIUS + 2;
    controls.maxDistance = 30;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    
    // Add drag detection
    let mouseDownTime = 0;
    let mouseDownPosition = new THREE.Vector2();
    
    let startPosition = new THREE.Vector2();
    let hasMoved = false;
    
    controls.addEventListener('start', (event) => {
        isDragging = false;
        hasMoved = false;
        mouseDownTime = Date.now();
        startPosition.set(event.clientX || 0, event.clientY || 0);
    });
    
    controls.addEventListener('change', () => {
        if (!hasMoved) {
            hasMoved = true;
            setTimeout(() => {
                isDragging = true;
            }, 50);
        }
    });
    
    controls.addEventListener('end', () => {
        // Reset dragging state after a short delay
        setTimeout(() => {
            isDragging = false;
            hasMoved = false;
        }, 150);
    });
}

function setupEventListeners() {
    // Globe interaction - only click, no hover cursor changes
    renderer.domElement.addEventListener('click', onGlobeClick);
    renderer.domElement.style.cursor = 'grab';
    
    // Add mouse down/up for drag cursor
    renderer.domElement.addEventListener('mousedown', () => {
        renderer.domElement.style.cursor = 'grabbing';
    });
    
    renderer.domElement.addEventListener('mouseup', () => {
        renderer.domElement.style.cursor = 'grab';
    });
    
    // UI controls
    document.getElementById('zoom-in').addEventListener('click', () => {
        gsapZoom(-2);
    });
    
    document.getElementById('zoom-out').addEventListener('click', () => {
        gsapZoom(2);
    });
    
    document.getElementById('reset-view').addEventListener('click', resetView);
    
    document.getElementById('day-night-toggle').addEventListener('change', toggleDayNight);
    
    document.getElementById('close-panel').addEventListener('click', () => {
        document.getElementById('info-panel').classList.remove('active');
    });
    
    // Search functionality
    document.getElementById('search-button').addEventListener('click', searchLocation);
    document.getElementById('search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchLocation();
        }
    });
    
    // Drag mode toggle
    document.getElementById('drag-mode-toggle').addEventListener('click', toggleDragMode);
    
    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    
    // Sound toggle
    document.getElementById('sound-toggle').addEventListener('click', toggleSound);
    
    // Fullscreen toggle
    document.getElementById('fullscreen-toggle').addEventListener('click', toggleFullscreen);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

function gsapZoom(delta) {
    const targetDistance = Math.max(
        GLOBE_RADIUS + 2,
        Math.min(30, camera.position.distanceTo(controls.target) + delta)
    );
    
    const targetPosition = camera.position.clone()
        .sub(controls.target)
        .normalize()
        .multiplyScalar(targetDistance)
        .add(controls.target);
    
    // Simple animation without GSAP
    const startPosition = camera.position.clone();
    const startTime = Date.now();
    const duration = 500; // ms
    
    function updateZoom() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
        
        camera.position.lerpVectors(startPosition, targetPosition, easeProgress);
        
        if (progress < 1) {
            requestAnimationFrame(updateZoom);
        }
    }
    
    updateZoom();
}

function resetView() {
    const startRotation = globe.rotation.clone();
    const targetRotation = new THREE.Euler(0, 0, 0);
    const startCameraPos = camera.position.clone();
    const targetCameraPos = new THREE.Vector3(0, 0, 15);
    const startTime = Date.now();
    const duration = 1000; // ms
    
    controls.autoRotate = true;
    
    function updateReset() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
        
        // Interpolate rotation
        globe.rotation.x = startRotation.x + (targetRotation.x - startRotation.x) * easeProgress;
        globe.rotation.y = startRotation.y + (targetRotation.y - startRotation.y) * easeProgress;
        globe.rotation.z = startRotation.z + (targetRotation.z - startRotation.z) * easeProgress;
        
        // Interpolate camera position
        camera.position.lerpVectors(startCameraPos, targetCameraPos, easeProgress);
        
        if (progress < 1) {
            requestAnimationFrame(updateReset);
        } else {
            controls.reset();
        }
    }
    
    updateReset();
}

function toggleDayNight() {
    isNightMode = document.getElementById('day-night-toggle').checked;
    
    if (isNightMode) {
        globe.material.map = globe.userData.nightTexture;
        globe.userData.clouds.material.opacity = 0.1;
        document.body.classList.add('night-mode');
        document.body.classList.remove('day-mode');
    } else {
        globe.material.map = globe.userData.dayTexture;
        globe.userData.clouds.material.opacity = 0.4;
        document.body.classList.add('day-mode');
        document.body.classList.remove('night-mode');
    }
    
    globe.material.needsUpdate = true;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onGlobeClick(event) {
    console.log('Globe clicked - Loading:', isLoading, 'DragOnly:', dragOnlyMode, 'Dragging:', isDragging);
    
    if (isLoading) {
        console.log('Ignoring click - still loading');
        return;
    }
    
    if (dragOnlyMode && isDragging) {
        console.log('Ignoring click - in drag mode and dragging');
        return;
    }
    
    console.log('Processing click...');
    
    // Calculate mouse position in normalized device coordinates
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    console.log('Mouse position:', { x: mouse.x, y: mouse.y });
    
    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);
    
    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObject(globe);
    
    console.log('Intersections found:', intersects.length);
    
    if (intersects.length > 0) {
        const intersectionPoint = intersects[0].point;
        
        // Convert 3D point to latitude and longitude with better accuracy
        const normalizedPoint = intersectionPoint.clone().normalize();
        
        // Convert to spherical coordinates
        const phi = Math.acos(-normalizedPoint.y); // 0 to PI
        const theta = Math.atan2(-normalizedPoint.x, normalizedPoint.z); // -PI to PI
        
        // Convert to lat/lng
        const latitude = (Math.PI / 2 - phi) * (180 / Math.PI);
        const longitude = theta * (180 / Math.PI);
        
        console.log('Clicked coordinates:', { latitude, longitude, point: intersectionPoint });
        
        // Add pin at clicked position
        addPin(intersectionPoint, latitude, longitude);
    } else {
        console.log('No intersection with globe found');
    }
}

// Removed hover function - no cursor changes on hover

function addPin(position, latitude, longitude) {
    // Remove previous pins and buttons
    removeCurrentPin();
    
    // Create pin group with material
    const pinGroup = createPinGeometry();
    const pinMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff3333,
        shininess: 100,
        specular: 0x222222
    });
    
    // Apply material to all parts
    pinGroup.children.forEach(child => {
        child.material = pinMaterial.clone();
    });
    
    // Position pin on globe surface
    const pinPosition = position.clone().normalize().multiplyScalar(GLOBE_RADIUS + 0.2);
    pinGroup.position.copy(pinPosition);
    
    // Orient pin to point outward from globe center
    pinGroup.lookAt(pinPosition.clone().add(pinPosition.clone().normalize()));
    
    pinGroup.userData.latitude = latitude;
    pinGroup.userData.longitude = longitude;
    
    // Add pin to scene
    scene.add(pinGroup);
    currentPin = pinGroup;
    
    console.log('Pin created at:', { position: pinPosition, latitude, longitude });
    
    // Create details button in DOM
    createDetailsButton(pinGroup);
    
    // Add pin drop animation
    animatePinDrop(pinGroup);
}

function createPinGeometry() {
    // Create a better pin with multiple parts
    const group = new THREE.Group();
    
    // Pin head (sphere at top)
    const headGeometry = new THREE.SphereGeometry(0.06, 16, 16);
    const head = new THREE.Mesh(headGeometry);
    head.position.y = 0.15;
    group.add(head);
    
    // Pin body (cylinder)
    const bodyGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
    const body = new THREE.Mesh(bodyGeometry);
    body.position.y = 0;
    group.add(body);
    
    // Pin tip (small cone at bottom)
    const tipGeometry = new THREE.ConeGeometry(0.02, 0.08, 8);
    const tip = new THREE.Mesh(tipGeometry);
    tip.position.y = -0.19;
    group.add(tip);
    
    return group;
}

function removeCurrentPin() {
    if (currentPin) {
        scene.remove(currentPin);
        currentPin = null;
    }
    
    if (detailsButton) {
        detailsButton.remove();
        detailsButton = null;
    }
    
    // Also remove old markers for backward compatibility
    markers.forEach(marker => scene.remove(marker));
    markers = [];
}

function animatePinDrop(pin) {
    const startY = pin.position.y + 2;
    const endY = pin.position.y;
    const startTime = Date.now();
    const duration = 800; // ms
    
    pin.position.y = startY;
    pin.scale.set(0.1, 0.1, 0.1);
    
    function updateDrop() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for bounce effect
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const bounce = Math.sin(progress * Math.PI * 2) * 0.1 * (1 - progress);
        
        pin.position.y = startY + (endY - startY) * easeOut + bounce;
        
        // Scale animation
        const scale = 0.1 + (0.9 * easeOut);
        pin.scale.set(scale, scale, scale);
        
        if (progress < 1) {
            requestAnimationFrame(updateDrop);
        }
    }
    
    updateDrop();
}

function createDetailsButton(pin) {
    // Create button element
    const button = document.createElement('div');
    button.className = 'details-button';
    button.innerHTML = `
        <div class="button-content">
            <i class="fas fa-info-circle"></i>
            <span>View Details</span>
        </div>
    `;
    
    // Position button
    button.style.position = 'absolute';
    button.style.transform = 'translate(-50%, -50%)';
    button.style.pointerEvents = 'auto';
    button.style.zIndex = '100';
    
    // Add click event
    button.addEventListener('click', () => {
        showDetailedInfo(pin.userData.latitude, pin.userData.longitude);
    });
    
    // Add to DOM
    document.body.appendChild(button);
    detailsButton = button;
    
    // Start button position updates
    updateButtonPosition();
}

function updateButtonPosition() {
    if (!currentPin || !detailsButton) return;
    
    // Project 3D position to screen coordinates
    const vector = currentPin.position.clone();
    vector.project(camera);
    
    // Convert to screen coordinates
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (vector.y * -0.5 + 0.5) * window.innerHeight;
    
    // Update button position
    detailsButton.style.left = x + 'px';
    detailsButton.style.top = (y - 40) + 'px';
    
    // Hide button if pin is behind the globe
    const distance = camera.position.distanceTo(currentPin.position);
    const globeDistance = camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
    detailsButton.style.opacity = distance < globeDistance + 1 ? '1' : '0';
}

function getWeatherData(latitude, longitude) {
    const weatherDataElement = document.getElementById('weather-data');
    weatherDataElement.innerHTML = '<p>Loading weather data...</p>';
    
    fetch(`${WEATHER_API_URL}?lat=${latitude}&lon=${longitude}&units=metric&appid=${WEATHER_API_KEY}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Weather data not available');
            }
            return response.json();
        })
        .then(data => {
            const weatherHTML = `
                <div class="weather-details">
                    <div class="weather-main">
                        <i class="weather-icon fas ${getWeatherIcon(data.weather[0].id)}"></i>
                        <span class="temperature">${Math.round(data.main.temp)}°C</span>
                    </div>
                    <p class="weather-description">${data.weather[0].description}</p>
                    <div class="weather-info-grid">
                        <div>
                            <p><i class="fas fa-tint"></i> Humidity: ${data.main.humidity}%</p>
                            <p><i class="fas fa-wind"></i> Wind: ${data.wind.speed} m/s</p>
                        </div>
                        <div>
                            <p><i class="fas fa-compress-alt"></i> Pressure: ${data.main.pressure} hPa</p>
                            <p><i class="fas fa-eye"></i> Visibility: ${(data.visibility / 1000).toFixed(1)} km</p>
                        </div>
                    </div>
                </div>
            `;
            
            weatherDataElement.innerHTML = weatherHTML;
            
            // Update location name
            document.getElementById('location-name').textContent = data.name || `Lat: ${latitude.toFixed(2)}, Lon: ${longitude.toFixed(2)}`;
        })
        .catch(error => {
            console.error('Error fetching weather data:', error);
            weatherDataElement.innerHTML = `<p>Error: ${error.message}</p><p>Please try another location or check your API key.</p>`;
        });
}

function getWeatherIcon(weatherId) {
    // Map OpenWeatherMap weather codes to Font Awesome icons
    if (weatherId >= 200 && weatherId < 300) {
        return 'fa-bolt'; // Thunderstorm
    } else if (weatherId >= 300 && weatherId < 400) {
        return 'fa-cloud-rain'; // Drizzle
    } else if (weatherId >= 500 && weatherId < 600) {
        return 'fa-cloud-showers-heavy'; // Rain
    } else if (weatherId >= 600 && weatherId < 700) {
        return 'fa-snowflake'; // Snow
    } else if (weatherId >= 700 && weatherId < 800) {
        return 'fa-smog'; // Atmosphere
    } else if (weatherId === 800) {
        return 'fa-sun'; // Clear
    } else if (weatherId > 800) {
        return 'fa-cloud'; // Clouds
    }
    return 'fa-cloud';
}

function updateLocationInfo(latitude, longitude) {
    document.getElementById('latitude').textContent = latitude.toFixed(4) + '°';
    document.getElementById('longitude').textContent = longitude.toFixed(4) + '°';
    
    // Get current UTC time
    const utcNow = new Date();
    
    // Calculate approximate local time based on longitude (rough estimate)
    const timeZoneOffsetHours = Math.round(longitude / 15); // Each 15° = 1 hour
    const localTime = new Date(utcNow.getTime() + (timeZoneOffsetHours * 3600000));
    
    // Display the time
    document.getElementById('local-time').textContent = localTime.toLocaleTimeString([], {
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit'
    }) + ` (UTC${timeZoneOffsetHours >= 0 ? '+' : ''}${timeZoneOffsetHours})`;
    
    // Also try to get location name from reverse geocoding
    getReverseGeocodingInfo(latitude, longitude);
}

function searchLocation() {
    const searchInput = document.getElementById('search-input').value.trim();
    
    if (!searchInput) return;
    
    // Show loading state
    document.getElementById('search-button').innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    fetch(`${GEOCODING_API_URL}?q=${encodeURIComponent(searchInput)}&limit=1&appid=${WEATHER_API_KEY}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Location not found');
            }
            return response.json();
        })
        .then(data => {
            if (data.length === 0) {
                throw new Error('Location not found');
            }
            
            const location = data[0];
            const latitude = location.lat;
            const longitude = location.lon;
            
            // Calculate position on globe
            const phi = (90 - latitude) * (Math.PI / 180);
            const theta = (longitude + 180) * (Math.PI / 180);
            
            const x = -GLOBE_RADIUS * Math.sin(phi) * Math.cos(theta);
            const y = GLOBE_RADIUS * Math.cos(phi);
            const z = GLOBE_RADIUS * Math.sin(phi) * Math.sin(theta);
            
            const position = new THREE.Vector3(x, y, z);
            
            // Add pin
            addPin(position, latitude, longitude);
            
            // Rotate globe to show the location
            rotateGlobeToPosition(position);
        })
        .catch(error => {
            console.error('Error searching location:', error);
            alert(`Error: ${error.message}`);
        })
        .finally(() => {
            // Reset search button
            document.getElementById('search-button').innerHTML = '<i class="fas fa-search"></i>';
        });
}

function rotateGlobeToPosition(position) {
    // Disable auto-rotation during animation
    controls.autoRotate = false;
    
    // Calculate target rotation
    const targetRotation = new THREE.Euler();
    targetRotation.y = Math.atan2(-position.x, -position.z);
    targetRotation.x = Math.atan2(position.y, Math.sqrt(position.x * position.x + position.z * position.z));
    
    const startRotation = globe.rotation.clone();
    const startTime = Date.now();
    const duration = 1000; // ms
    
    function updateRotation() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
        
        // Interpolate rotation
        globe.rotation.x = startRotation.x + (targetRotation.x - startRotation.x) * easeProgress;
        globe.rotation.y = startRotation.y + (targetRotation.y - startRotation.y) * easeProgress;
        
        if (progress < 1) {
            requestAnimationFrame(updateRotation);
        } else {
            // Re-enable auto-rotation after animation
            setTimeout(() => {
                controls.autoRotate = true;
            }, 1000);
        }
    }
    
    updateRotation();
}

function showDetailedInfo(latitude, longitude) {
    // Create detailed modal overlay
    const modal = document.createElement('div');
    modal.className = 'detailed-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Location Details</h2>
                <button class="close-modal"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <div class="modal-left">
                    <div class="mini-globe-container">
                        <div id="mini-globe"></div>
                        <div class="coordinates-display">
                            <p><i class="fas fa-map-marker-alt"></i> ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°</p>
                        </div>
                    </div>
                </div>
                <div class="modal-right">
                    <div class="info-section">
                        <h3><i class="fas fa-cloud-sun"></i> Weather Information</h3>
                        <div id="detailed-weather" class="loading">
                            <div class="loading-spinner"></div>
                            <p>Loading detailed weather data...</p>
                        </div>
                    </div>
                    <div class="info-section">
                        <h3><i class="fas fa-clock"></i> Time & Date</h3>
                        <div id="time-info">
                            <div class="time-display">
                                <div class="local-time">
                                    <span class="time-label">Local Time</span>
                                    <span class="time-value" id="detailed-local-time">--:--</span>
                                    <span class="timezone-info" id="timezone-offset">UTC+0</span>
                                </div>
                                <div class="utc-time">
                                    <span class="time-label">UTC Time</span>
                                    <span class="time-value" id="detailed-utc-time">--:--</span>
                                </div>
                            </div>
                            <div class="date-info">
                                <div class="current-date">
                                    <span class="date-label">Current Date</span>
                                    <span class="date-value" id="current-date"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="info-section">
                        <h3><i class="fas fa-sun"></i> Astronomical Data</h3>
                        <div id="astronomy-info" class="loading">
                            <div class="loading-spinner"></div>
                            <p>Loading astronomical data...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to DOM
    document.body.appendChild(modal);
    
    // Add event listeners
    modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // Initialize mini globe
    initMiniGlobe(latitude, longitude);
    
    // Load detailed weather data
    loadDetailedWeatherData(latitude, longitude);
    
    // Update time displays
    updateTimeDisplays(longitude);
    
    // Load astronomical data
    loadAstronomicalData(latitude, longitude);
}

function initMiniGlobe(latitude, longitude) {
    const container = document.getElementById('mini-globe');
    const size = 200;
    
    // Create mini scene
    const miniScene = new THREE.Scene();
    const miniCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    const miniRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    miniRenderer.setSize(size, size);
    miniRenderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(miniRenderer.domElement);
    
    // Create mini globe
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load(EARTH_TEXTURE_PATH);
    
    const globeGeometry = new THREE.SphereGeometry(2, 32, 32);
    const globeMaterial = new THREE.MeshPhongMaterial({ map: earthTexture });
    const miniGlobe = new THREE.Mesh(globeGeometry, globeMaterial);
    miniScene.add(miniGlobe);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    miniScene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 3, 5);
    miniScene.add(directionalLight);
    
    // Position camera to show the selected location
    miniCamera.position.set(0, 0, 6);
    
    // Rotate globe to show the location
    const phi = (90 - latitude) * (Math.PI / 180);
    const theta = (longitude + 180) * (Math.PI / 180);
    miniGlobe.rotation.y = -theta;
    miniGlobe.rotation.x = phi - Math.PI / 2;
    
    // Add location marker
    const markerGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff3333 });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    
    const markerPosition = new THREE.Vector3();
    markerPosition.setFromSphericalCoords(2.05, phi, theta);
    marker.position.copy(markerPosition);
    miniScene.add(marker);
    
    // Animation loop for mini globe
    function animateMini() {
        requestAnimationFrame(animateMini);
        miniGlobe.rotation.y += 0.005;
        miniRenderer.render(miniScene, miniCamera);
    }
    animateMini();
}

function loadDetailedWeatherData(latitude, longitude) {
    const weatherContainer = document.getElementById('detailed-weather');
    
    // Load multiple weather data sources
    Promise.all([
        fetch(`${WEATHER_API_URL}?lat=${latitude}&lon=${longitude}&units=metric&appid=${WEATHER_API_KEY}`),
        fetch(`${FORECAST_API_URL}?lat=${latitude}&lon=${longitude}&units=metric&appid=${WEATHER_API_KEY}`),
        fetch(`${AIR_QUALITY_API_URL}?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}`),
        fetch(`${UV_INDEX_API_URL}?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}`)
    ])
    .then(responses => Promise.all(responses.map(r => r.json())))
    .then(([current, forecast, airQuality, uvIndex]) => {
        weatherContainer.innerHTML = `
            <div class="advanced-weather">
                <div class="current-weather">
                    <div class="weather-main">
                        <i class="weather-icon fas ${getWeatherIcon(current.weather[0].id)}"></i>
                        <div class="temp-info">
                            <span class="temperature">${Math.round(current.main.temp)}°C</span>
                            <span class="feels-like">Feels like ${Math.round(current.main.feels_like)}°C</span>
                        </div>
                    </div>
                    <p class="weather-description">${current.weather[0].description}</p>
                    
                    <div class="weather-details-grid">
                        <div class="detail-item">
                            <i class="fas fa-tint"></i>
                            <span class="label">Humidity</span>
                            <span class="value">${current.main.humidity}%</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-wind"></i>
                            <span class="label">Wind</span>
                            <span class="value">${current.wind.speed} m/s</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-compress-alt"></i>
                            <span class="label">Pressure</span>
                            <span class="value">${current.main.pressure} hPa</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-sun"></i>
                            <span class="label">UV Index</span>
                            <span class="value">${uvIndex.value ? Math.round(uvIndex.value) : 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-leaf"></i>
                            <span class="label">Air Quality</span>
                            <span class="value">${getAQILabel(airQuality.list?.[0]?.main?.aqi || 0)}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-cloud"></i>
                            <span class="label">Clouds</span>
                            <span class="value">${current.clouds.all}%</span>
                        </div>
                    </div>
                </div>
                
                <div class="forecast-section">
                    <h4><i class="fas fa-calendar-week"></i> 7-Day Forecast</h4>
                    <div class="forecast-list">
                        ${generateForecastHTML(forecast)}
                    </div>
                </div>
                
                <div class="air-quality-section">
                    <h4><i class="fas fa-wind"></i> Air Quality Details</h4>
                    <div class="air-quality-grid">
                        ${generateAirQualityHTML(airQuality)}
                    </div>
                </div>
            </div>
        `;
    })
    .catch(error => {
        weatherContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading weather data</p>
            </div>
        `;
    });
}

function getAQILabel(aqi) {
    const labels = ['N/A', 'Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
    return labels[aqi] || 'N/A';
}

function generateForecastHTML(forecast) {
    if (!forecast.list) return '<p>Forecast data unavailable</p>';
    
    // Group by day
    const dailyForecasts = {};
    forecast.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateKey = date.toDateString();
        
        if (!dailyForecasts[dateKey]) {
            dailyForecasts[dateKey] = {
                date: date,
                temps: [],
                weather: item.weather[0],
                humidity: [],
                wind: []
            };
        }
        
        dailyForecasts[dateKey].temps.push(item.main.temp);
        dailyForecasts[dateKey].humidity.push(item.main.humidity);
        dailyForecasts[dateKey].wind.push(item.wind.speed);
    });
    
    return Object.values(dailyForecasts).slice(0, 7).map(day => {
        const minTemp = Math.round(Math.min(...day.temps));
        const maxTemp = Math.round(Math.max(...day.temps));
        const avgHumidity = Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length);
        
        return `
            <div class="forecast-day">
                <div class="day-name">${day.date.toLocaleDateString([], {weekday: 'short'})}</div>
                <i class="forecast-icon fas ${getWeatherIcon(day.weather.id)}"></i>
                <div class="temp-range">${minTemp}° - ${maxTemp}°</div>
                <div class="humidity">${avgHumidity}% humidity</div>
            </div>
        `;
    }).join('');
}

function generateAirQualityHTML(airQuality) {
    if (!airQuality.list?.[0]) return '<p>Air quality data unavailable</p>';
    
    const components = airQuality.list[0].components;
    return `
        <div class="aqi-item">
            <span class="aqi-label">CO</span>
            <span class="aqi-value">${components.co?.toFixed(2) || 'N/A'} μg/m³</span>
        </div>
        <div class="aqi-item">
            <span class="aqi-label">NO₂</span>
            <span class="aqi-value">${components.no2?.toFixed(2) || 'N/A'} μg/m³</span>
        </div>
        <div class="aqi-item">
            <span class="aqi-label">O₃</span>
            <span class="aqi-value">${components.o3?.toFixed(2) || 'N/A'} μg/m³</span>
        </div>
        <div class="aqi-item">
            <span class="aqi-label">PM2.5</span>
            <span class="aqi-value">${components.pm2_5?.toFixed(2) || 'N/A'} μg/m³</span>
        </div>
        <div class="aqi-item">
            <span class="aqi-label">PM10</span>
            <span class="aqi-value">${components.pm10?.toFixed(2) || 'N/A'} μg/m³</span>
        </div>
        <div class="aqi-item">
            <span class="aqi-label">SO₂</span>
            <span class="aqi-value">${components.so2?.toFixed(2) || 'N/A'} μg/m³</span>
        </div>
    `;
}

function updateTimeDisplays(longitude) {
    const utcNow = new Date();
    
    // Calculate approximate local time offset
    const timeZoneOffsetHours = Math.round(longitude / 15);
    const localTime = new Date(utcNow.getTime() + (timeZoneOffsetHours * 3600000));
    
    // Format times properly
    const localTimeStr = localTime.toLocaleTimeString([], {
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
    });
    
    const utcTimeStr = utcNow.toLocaleTimeString([], {
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false,
        timeZone: 'UTC'
    });
    
    document.getElementById('detailed-local-time').textContent = localTimeStr;
    document.getElementById('detailed-utc-time').textContent = utcTimeStr;
    
    // Update timezone offset display
    const timezoneElement = document.getElementById('timezone-offset');
    if (timezoneElement) {
        timezoneElement.textContent = `UTC${timeZoneOffsetHours >= 0 ? '+' : ''}${timeZoneOffsetHours}`;
    }
    
    // Update current date
    const currentDateElement = document.getElementById('current-date');
    if (currentDateElement) {
        const dateStr = localTime.toLocaleDateString([], {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        currentDateElement.textContent = dateStr;
    }
}

function toggleDragMode() {
    dragOnlyMode = !dragOnlyMode;
    const button = document.getElementById('drag-mode-toggle');
    const icon = button.querySelector('i');
    const text = button.querySelector('.drag-mode-text');
    
    if (dragOnlyMode) {
        icon.className = 'fas fa-lock';
        text.textContent = 'Drag Only';
        button.classList.add('active');
        renderer.domElement.style.cursor = 'grab';
    } else {
        icon.className = 'fas fa-unlock';
        text.textContent = 'Click Mode';
        button.classList.remove('active');
        renderer.domElement.style.cursor = 'crosshair';
    }
}

function getReverseGeocodingInfo(latitude, longitude) {
    // Get location name from coordinates
    fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${WEATHER_API_KEY}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                const location = data[0];
                const locationName = `${location.name}${location.state ? ', ' + location.state : ''}, ${location.country}`;
                document.getElementById('location-name').textContent = locationName;
                
                // Also get weather data
                getWeatherData(latitude, longitude);
                
                // Update info panel
                updateLocationInfo(latitude, longitude);
                
                // Show info panel
                document.getElementById('info-panel').classList.add('active');
            } else {
                document.getElementById('location-name').textContent = `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`;
            }
        })
        .catch(error => {
            console.error('Error getting location info:', error);
            document.getElementById('location-name').textContent = `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`;
        });
}

function toggleTheme() {
    playSound('click');
    document.body.classList.toggle('light-theme');
    userPreferences.theme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
    localStorage.setItem('userPreferences', JSON.stringify(userPreferences));
    
    const icon = document.querySelector('#theme-toggle i');
    icon.className = userPreferences.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    userPreferences.soundEnabled = soundEnabled;
    localStorage.setItem('userPreferences', JSON.stringify(userPreferences));
    
    const icon = document.querySelector('#sound-toggle i');
    icon.className = soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
    
    if (soundEnabled) playSound('success');
}

function toggleFullscreen() {
    playSound('click');
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

function handleKeyboardShortcuts(event) {
    if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
            case 'l':
                event.preventDefault();
                getCurrentLocation();
                break;
            case 't':
                event.preventDefault();
                toggleTheme();
                break;
            case 'm':
                event.preventDefault();
                toggleSound();
                break;
            case 'f':
                event.preventDefault();
                toggleFullscreen();
                break;
            case 'd':
                event.preventDefault();
                toggleDragMode();
                break;
        }
    }
    
    // ESC key
    if (event.key === 'Escape') {
        const modal = document.querySelector('.detailed-modal');
        if (modal) {
            modal.remove();
        }
    }
}

function getAstronomicalData(latitude, longitude) {
    return fetch(`${ASTRONOMY_API_URL}?lat=${latitude}&lng=${longitude}&formatted=0`)
        .then(response => response.json())
        .then(data => {
            const sunrise = new Date(data.results.sunrise);
            const sunset = new Date(data.results.sunset);
            const solarNoon = new Date(data.results.solar_noon);
            const dayLength = data.results.day_length;
            
            return {
                sunrise: sunrise.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                sunset: sunset.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                solarNoon: solarNoon.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                dayLength: formatDuration(dayLength),
                civilTwilight: {
                    begin: new Date(data.results.civil_twilight_begin).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                    end: new Date(data.results.civil_twilight_end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                }
            };
        })
        .catch(() => ({
            sunrise: 'N/A',
            sunset: 'N/A',
            solarNoon: 'N/A',
            dayLength: 'N/A',
            civilTwilight: { begin: 'N/A', end: 'N/A' }
        }));
}

function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
}

function getMoonPhase() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    
    // Simplified moon phase calculation
    const totalDays = Math.floor((year - 2000) * 365.25) + Math.floor((month - 1) * 30.44) + day;
    const moonCycle = totalDays % 29.53;
    
    if (moonCycle < 1.84566) return { name: 'New Moon', icon: 'fas fa-circle', emoji: '🌑' };
    else if (moonCycle < 5.53699) return { name: 'Waxing Crescent', icon: 'fas fa-circle', emoji: '🌒' };
    else if (moonCycle < 9.22831) return { name: 'First Quarter', icon: 'fas fa-circle', emoji: '🌓' };
    else if (moonCycle < 12.91963) return { name: 'Waxing Gibbous', icon: 'fas fa-circle', emoji: '🌔' };
    else if (moonCycle < 16.61096) return { name: 'Full Moon', icon: 'fas fa-circle', emoji: '🌕' };
    else if (moonCycle < 20.30228) return { name: 'Waning Gibbous', icon: 'fas fa-circle', emoji: '🌖' };
    else if (moonCycle < 23.99361) return { name: 'Last Quarter', icon: 'fas fa-circle', emoji: '🌗' };
    else return { name: 'Waning Crescent', icon: 'fas fa-circle', emoji: '🌘' };
}

function loadAstronomicalData(latitude, longitude) {
    const astronomyContainer = document.getElementById('astronomy-info');
    
    getAstronomicalData(latitude, longitude)
        .then(astroData => {
            const moonPhase = getMoonPhase();
            
            astronomyContainer.innerHTML = `
                <div class="astronomy-grid">
                    <div class="astro-section">
                        <h5><i class="fas fa-sun"></i> Sun</h5>
                        <div class="astro-details">
                            <div class="astro-item">
                                <span class="astro-label">Sunrise</span>
                                <span class="astro-value">${astroData.sunrise}</span>
                            </div>
                            <div class="astro-item">
                                <span class="astro-label">Sunset</span>
                                <span class="astro-value">${astroData.sunset}</span>
                            </div>
                            <div class="astro-item">
                                <span class="astro-label">Solar Noon</span>
                                <span class="astro-value">${astroData.solarNoon}</span>
                            </div>
                            <div class="astro-item">
                                <span class="astro-label">Day Length</span>
                                <span class="astro-value">${astroData.dayLength}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="astro-section">
                        <h5><i class="fas fa-moon"></i> Moon</h5>
                        <div class="astro-details">
                            <div class="moon-phase">
                                <span class="moon-emoji">${moonPhase.emoji}</span>
                                <span class="moon-name">${moonPhase.name}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="astro-section">
                        <h5><i class="fas fa-clock"></i> Twilight</h5>
                        <div class="astro-details">
                            <div class="astro-item">
                                <span class="astro-label">Civil Dawn</span>
                                <span class="astro-value">${astroData.civilTwilight.begin}</span>
                            </div>
                            <div class="astro-item">
                                <span class="astro-label">Civil Dusk</span>
                                <span class="astro-value">${astroData.civilTwilight.end}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        })
        .catch(() => {
            astronomyContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Astronomical data unavailable</p>
                </div>
            `;
        });
}

function animate() {
    requestAnimationFrame(animate);
    
    // Update controls
    controls.update();
    
    // Update button position if exists
    if (currentPin && detailsButton) {
        updateButtonPosition();
    }
    
    // Rotate clouds slightly faster than the globe
    if (globe.userData.clouds) {
        globe.userData.clouds.rotation.y += 0.0002;
    }
    
    // Render scene
    renderer.render(scene, camera);
}
