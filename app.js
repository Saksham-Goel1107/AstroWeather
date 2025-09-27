// Global variables
let scene, camera, renderer, globe, controls;
let raycaster, mouse;
let markers = [];
let isNightMode = false;
let isLoading = true;

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
const WEATHER_API_KEY = '8b96a2858cb7d52f0cee1aac54204619'; // Hardcoded for client-side

// Geocoding API configuration
const GEOCODING_API_URL = 'https://api.openweathermap.org/geo/1.0/direct';

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
    
    // Start animation loop
    animate();
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
    // Set up OrbitControls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.minDistance = GLOBE_RADIUS + 2;
    controls.maxDistance = 30;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
}

function setupEventListeners() {
    // Globe interaction
    renderer.domElement.addEventListener('click', onGlobeClick);
    renderer.domElement.addEventListener('mousemove', onGlobeHover);
    
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
    if (isLoading) return;
    
    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);
    
    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObject(globe);
    
    if (intersects.length > 0) {
        const intersectionPoint = intersects[0].point;
        const normalizedPoint = intersectionPoint.clone().normalize();
        
        // Convert to latitude and longitude
        const latitude = Math.asin(normalizedPoint.y) * (180 / Math.PI);
        const longitude = Math.atan2(normalizedPoint.x, normalizedPoint.z) * (180 / Math.PI);
        
        // Add marker at clicked position
        addMarker(intersectionPoint, latitude, longitude);
        
        // Get weather data for the location
        getWeatherData(latitude, longitude);
        
        // Update info panel
        updateLocationInfo(latitude, longitude);
        
        // Show info panel
        document.getElementById('info-panel').classList.add('active');
    }
}

function onGlobeHover(event) {
    if (isLoading) return;
    
    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);
    
    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObject(globe);
    
    if (intersects.length > 0) {
        document.body.style.cursor = 'pointer';
    } else {
        document.body.style.cursor = 'default';
    }
}

function addMarker(position, latitude, longitude) {
    // Remove previous markers
    markers.forEach(marker => scene.remove(marker));
    markers = [];
    
    // Create marker geometry
    const markerGeometry = new THREE.SphereGeometry(MARKER_SIZE, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff4444 });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    
    // Position marker slightly above the globe surface
    marker.position.copy(position.normalize().multiplyScalar(GLOBE_RADIUS + 0.05));
    marker.userData.latitude = latitude;
    marker.userData.longitude = longitude;
    
    // Add marker to scene
    scene.add(marker);
    markers.push(marker);
    
    // Create pulse effect
    const pulseGeometry = new THREE.SphereGeometry(MARKER_SIZE * 1.2, 16, 16);
    const pulseMaterial = new THREE.MeshBasicMaterial({
        color: 0xff4444,
        transparent: true,
        opacity: 0.4
    });
    
    const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
    pulse.position.copy(marker.position);
    scene.add(pulse);
    markers.push(pulse);
    
    // Animate pulse
    animatePulse(pulse);
}

function animatePulse(pulse) {
    const startScale = 1;
    const endScale = 2;
    const duration = 1500; // ms
    const startTime = Date.now();
    
    function updatePulse() {
        const elapsed = Date.now() - startTime;
        const progress = (elapsed % duration) / duration;
        
        const scale = startScale + (endScale - startScale) * progress;
        pulse.scale.set(scale, scale, scale);
        
        pulse.material.opacity = 0.4 * (1 - progress);
        
        requestAnimationFrame(updatePulse);
    }
    
    updatePulse();
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
    
    // Calculate and display local time
    const date = new Date();
    const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
    const localTime = new Date(utcTime + (3600000 * (longitude / 15)));
    
    document.getElementById('local-time').textContent = localTime.toLocaleTimeString();
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
            
            // Add marker
            addMarker(position, latitude, longitude);
            
            // Get weather data
            getWeatherData(latitude, longitude);
            
            // Update info panel
            updateLocationInfo(latitude, longitude);
            
            // Show info panel
            document.getElementById('info-panel').classList.add('active');
            
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

function animate() {
    requestAnimationFrame(animate);
    
    // Update controls
    controls.update();
    
    // Rotate clouds slightly faster than the globe
    if (globe.userData.clouds) {
        globe.userData.clouds.rotation.y += 0.0002;
    }
    
    // Render scene
    renderer.render(scene, camera);
}