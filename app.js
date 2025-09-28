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
const EARTH_NIGHT_MAP_PATH = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_night_4096.jpg';
const CLOUDS_TEXTURE_PATH = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_1024.png';
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
    
    // Load user preferences
    loadUserPreferences();
    // Add the 'View All Countries' floating button
    createCountriesButton();
    
    // Start animation loop
    animate();
}

function createCountriesButton() {
    // Small floating button placed near the controls area
    const btn = document.createElement('button');
    btn.className = 'view-countries-btn';
    btn.title = 'View all countries';
    btn.innerHTML = '<i class="fas fa-globe"></i>';
    btn.style.position = 'fixed';
    btn.style.right = '20px';
    btn.style.bottom = '120px';
    btn.style.zIndex = '60';
    btn.style.pointerEvents = 'auto';
    document.body.appendChild(btn);

    btn.addEventListener('click', () => {
        // Open the countries modal without a preselected country
        openCountriesModal(null);
    });
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
    const starsGeometry = new THREE.BufferGeometry();
    const starsVertices = [];

    // Generate random star positions in a large sphere
    for (let i = 0; i < 1000; i++) {
        const x = (Math.random() - 0.5) * 200;
        const y = (Math.random() - 0.5) * 200;
        const z = (Math.random() - 0.5) * 200;
        starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));

    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.5,
        transparent: true,
        opacity: 0.8
    });

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
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

        // Previously we auto-opened the countries modal here. Now we only add a pin and let the user
        // open the full countries list explicitly via the 'View All Countries' button.
    } else {
        console.log('No intersection with globe found');
    }
}

// Get country info from coordinates using OpenWeather reverse geocoding
function getCountryAtLocation(latitude, longitude) {
    return fetch(`${REVERSE_GEOCODING_API_URL}?lat=${latitude}&lon=${longitude}&limit=1&appid=${WEATHER_API_KEY}`)
        .then(r => {
            if (!r.ok) throw new Error('Reverse geocoding failed');
            return r.json();
        })
        .then(arr => {
            if (!arr || arr.length === 0) return null;
            const item = arr[0];
            return {
                name: item.name || null,
                country: item.country || null,
                state: item.state || null,
                lat: item.lat,
                lon: item.lon
            };
        });
}

// Cache for fetched countries list
let ALL_COUNTRIES_CACHE = null;

function fetchAllCountries() {
    if (ALL_COUNTRIES_CACHE) return Promise.resolve(ALL_COUNTRIES_CACHE);

    // Try a trimmed fields query to reduce payload and avoid server errors
    const urlWithFields = 'https://restcountries.com/v3.1/all?fields=name,cca2,cca3,region,capital,population,latlng,flags,maps';

    return fetch(urlWithFields)
        .then(r => {
            if (!r.ok) {
                // If server returns 400 Bad Request or similar, try the full endpoint as a fallback
                console.warn('Primary countries request failed with status', r.status, '- retrying without fields');
                return fetch('https://restcountries.com/v3.1/all');
            }
            return r;
        })
        .then(r => {
            if (!r.ok) throw new Error('Failed to fetch countries');
            return r.json();
        })
        .then(list => {
            // Normalize into useful shape
            const countries = list.map(c => ({
                name: (c.name && (c.name.common || c.name.official)) || c.cca2 || c.cca3 || 'Unknown',
                cca2: c.cca2 || '',
                cca3: c.cca3 || '',
                region: c.region || '',
                capital: Array.isArray(c.capital) ? c.capital[0] : c.capital || '',
                population: c.population || 0,
                latlng: c.latlng || [],
                flag: (c.flags && (c.flags.svg || c.flags.png)) || '',
                maps: (c.maps && c.maps.googleMaps) || ''
            }));
            // Sort alphabetically
            countries.sort((a, b) => a.name.localeCompare(b.name));
            ALL_COUNTRIES_CACHE = countries;
            return countries;
        })
        .catch(err => {
            console.error('fetchAllCountries error:', err);
            // Fallback: minimal local list so UI still works offline
            const fallback = [
                { name: 'United States', cca2: 'US', cca3: 'USA', region: 'Americas', capital: 'Washington, D.C.', population: 331002651, latlng: [38, -97], flag: '', maps: '' },
                { name: 'India', cca2: 'IN', cca3: 'IND', region: 'Asia', capital: 'New Delhi', population: 1380004385, latlng: [20.5937, 78.9629], flag: '', maps: '' },
                { name: 'United Kingdom', cca2: 'GB', cca3: 'GBR', region: 'Europe', capital: 'London', population: 67886011, latlng: [55, -3], flag: '', maps: '' },
                { name: 'Australia', cca2: 'AU', cca3: 'AUS', region: 'Oceania', capital: 'Canberra', population: 25499884, latlng: [-25, 133], flag: '', maps: '' },
                { name: 'South Africa', cca2: 'ZA', cca3: 'ZAF', region: 'Africa', capital: 'Pretoria', population: 59308690, latlng: [-30, 25], flag: '', maps: '' }
            ];
            ALL_COUNTRIES_CACHE = fallback;
            return fallback;
        });
}

function openCountriesModal(clickedCountryInfo) {
    fetchAllCountries()
        .then(countries => buildCountriesModal(countries, clickedCountryInfo))
        .catch(err => {
            console.error('Error loading countries list:', err);
            alert('Could not load countries list. Please try again later.');
        });
}

function buildCountriesModal(countries, clickedCountryInfo) {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'detailed-modal countries-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Countries</h2>
                <button class="close-modal"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <div class="countries-sidebar">
                    <input type="text" class="country-search" placeholder="Search countries..." />
                    <div class="countries-list"></div>
                </div>
                <div class="countries-main">
                    <div class="countries-info-placeholder">
                        <p>Select a country from the list to view details.</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close handlers
    modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    const listContainer = modal.querySelector('.countries-list');
    const mainContainer = modal.querySelector('.countries-main');
    const searchInput = modal.querySelector('.country-search');

    // Build list items
    function renderList(filter = '') {
        listContainer.innerHTML = '';
        const filtered = countries.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));
        filtered.forEach(country => {
            const item = document.createElement('div');
            item.className = 'country-item';
            item.innerHTML = `
                <div class="country-head">
                    <img src="${country.flag}" alt="flag" class="country-flag" />
                    <span class="country-name">${country.name}</span>
                    <button class="expand-btn"><i class="fas fa-chevron-right"></i></button>
                </div>
                <div class="country-details" style="display:none;">
                    <p><strong>Capital:</strong> ${country.capital || 'N/A'}</p>
                    <p><strong>Region:</strong> ${country.region || 'N/A'}</p>
                    <p><strong>Population:</strong> ${country.population.toLocaleString()}</p>
                    <p><strong>Lat/Lng:</strong> ${country.latlng.length ? country.latlng.join(', ') : 'N/A'}</p>
                    <div style="margin-top:10px;display:flex;gap:8px;">
                        <button class="view-country-btn details-button">View on Globe</button>
                        <a class="open-maps" target="_blank" rel="noopener noreferrer">Open in Maps</a>
                    </div>
                </div>
            `;

            // Expand/collapse
            const head = item.querySelector('.country-head');
            const expandBtn = item.querySelector('.expand-btn');
            const details = item.querySelector('.country-details');
            head.addEventListener('click', () => {
                const isVisible = details.style.display !== 'none';
                // collapse others
                listContainer.querySelectorAll('.country-details').forEach(d => d.style.display = 'none');
                if (!isVisible) details.style.display = 'block';
            });

            expandBtn.addEventListener('click', (e) => { e.stopPropagation(); head.click(); });

            // View on Globe
            const viewBtn = item.querySelector('.view-country-btn');
            viewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (country.latlng.length === 2) {
                    const [lat, lon] = country.latlng;
                    // Compute 3D position
                    const phi = (90 - lat) * (Math.PI / 180);
                    const theta = (lon + 180) * (Math.PI / 180);
                    const x = -GLOBE_RADIUS * Math.sin(phi) * Math.cos(theta);
                    const y = GLOBE_RADIUS * Math.cos(phi);
                    const z = GLOBE_RADIUS * Math.sin(phi) * Math.sin(theta);
                    const position = new THREE.Vector3(x, y, z);
                    addPin(position, lat, lon);
                    rotateGlobeToPosition(position);
                    // Show detailed info for this position
                    showDetailedInfo(lat, lon);
                } else {
                    alert('Coordinates for this country are not available');
                }
            });

            // Open in maps
            const mapsLink = item.querySelector('.open-maps');
            if (country.maps) {
                mapsLink.href = country.maps;
                mapsLink.textContent = 'Open in Maps';
            } else if (country.latlng.length === 2) {
                mapsLink.href = `https://www.google.com/maps/search/?api=1&query=${country.latlng[0]},${country.latlng[1]}`;
                mapsLink.textContent = 'Open in Maps';
            } else {
                mapsLink.style.display = 'none';
            }

            listContainer.appendChild(item);
        });
    }

    // Initial render
    renderList('');

    // If clickedCountryInfo provided, attempt to auto-expand that country
    if (clickedCountryInfo && clickedCountryInfo.country) {
        const matched = countries.find(c => c.cca2 === clickedCountryInfo.country || c.cca3 === clickedCountryInfo.country);
        if (matched) {
            // wait a tick to ensure list is populated
            setTimeout(() => {
                const el = Array.from(listContainer.querySelectorAll('.country-item')).find(n => n.querySelector('.country-name')?.textContent === matched.name);
                if (el) el.querySelector('.country-head').click();
            }, 100);
        }
    }

    // Hook search
    searchInput.addEventListener('input', (e) => {
        renderList(e.target.value);
    });
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
            const recommendations = getClothingRecommendation(data);
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
                    ${generateClothingHTML(recommendations)}
                </div>
            `;
            
            weatherDataElement.innerHTML = weatherHTML;
            
            // Update location name - removed since panel is gone
            // document.getElementById('location-name').textContent = data.name || `Lat: ${latitude.toFixed(2)}, Lon: ${longitude.toFixed(2)}`;
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

function getClothingRecommendation(weatherData) {
    const temp = weatherData.main.temp;
    const feelsLike = weatherData.main.feels_like;
    const humidity = weatherData.main.humidity;
    const windSpeed = weatherData.wind.speed;
    const weatherId = weatherData.weather[0].id;
    const weatherMain = weatherData.weather[0].main.toLowerCase();
    
    let recommendations = {
        top: [],
        bottom: [],
        accessories: [],
        footwear: [],
        outerwear: [],
        special: []
    };
    
    // Temperature-based recommendations (using feels-like for comfort)
    const effectiveTemp = feelsLike;
    
    if (effectiveTemp < -10) {
        recommendations.top.push("Heavy thermal base layer", "Multiple sweaters", "Fleece jacket");
        recommendations.bottom.push("Thermal long underwear", "Insulated snow pants");
        recommendations.outerwear.push("Heavy winter coat", "Fur-lined hood");
        recommendations.footwear.push("Insulated winter boots", "Thick wool socks");
        recommendations.accessories.push("Heavy scarf", "Winter gloves", "Balaclava", "Thermal hat");
    } else if (effectiveTemp < 0) {
        recommendations.top.push("Thermal base layer", "Sweater", "Fleece jacket");
        recommendations.bottom.push("Thermal pants", "Warm jeans");
        recommendations.outerwear.push("Winter coat", "Heavy jacket");
        recommendations.footwear.push("Winter boots", "Wool socks");
        recommendations.accessories.push("Scarf", "Gloves", "Warm hat");
    } else if (effectiveTemp < 10) {
        recommendations.top.push("Long-sleeve shirt", "Light sweater");
        recommendations.bottom.push("Jeans", "Warm pants");
        recommendations.outerwear.push("Light jacket", "Blazer");
        recommendations.footwear.push("Sneakers", "Boots");
        recommendations.accessories.push("Light scarf", "Hat");
    } else if (effectiveTemp < 15) {
        recommendations.top.push("Long-sleeve shirt", "Blouse");
        recommendations.bottom.push("Jeans", "Chinos");
        recommendations.outerwear.push("Light jacket", "Cardigan");
        recommendations.footwear.push("Sneakers", "Loafers");
    } else if (effectiveTemp < 20) {
        recommendations.top.push("T-shirt", "Polo shirt");
        recommendations.bottom.push("Jeans", "Chinos", "Shorts");
        recommendations.outerwear.push("Light jacket (optional)");
        recommendations.footwear.push("Sneakers", "Sandals");
    } else if (effectiveTemp < 25) {
        recommendations.top.push("T-shirt", "Tank top");
        recommendations.bottom.push("Shorts", "Light pants");
        recommendations.footwear.push("Sandals", "Sneakers");
    } else if (effectiveTemp < 30) {
        recommendations.top.push("Light T-shirt", "Tank top");
        recommendations.bottom.push("Shorts", "Light pants");
        recommendations.footwear.push("Sandals", "Flip-flops");
        recommendations.accessories.push("Sunglasses");
    } else {
        recommendations.top.push("Light tank top", "Sleeveless shirt");
        recommendations.bottom.push("Shorts", "Light pants");
        recommendations.footwear.push("Sandals", "Flip-flops");
        recommendations.accessories.push("Sunglasses", "Sun hat");
        recommendations.special.push("Stay hydrated", "Apply sunscreen");
    }
    
    // Weather condition adjustments
    if (weatherMain.includes('rain') || weatherMain.includes('drizzle')) {
        recommendations.outerwear.push("Raincoat", "Poncho");
        recommendations.accessories.push("Umbrella");
        recommendations.footwear.push("Waterproof boots");
        recommendations.special.push("Rain gear essential");
    } else if (weatherMain.includes('snow')) {
        recommendations.outerwear.push("Snow jacket");
        recommendations.footwear.push("Snow boots");
        recommendations.accessories.push("Snow gloves");
        recommendations.special.push("Winter traction devices");
    } else if (weatherMain.includes('thunderstorm')) {
        recommendations.outerwear.push("Waterproof jacket");
        recommendations.accessories.push("Umbrella");
        recommendations.special.push("Stay indoors if possible");
    } else if (weatherMain.includes('fog') || weatherMain.includes('mist')) {
        recommendations.accessories.push("Reflective clothing");
        recommendations.special.push("Drive carefully");
    } else if (weatherMain.includes('clear') && effectiveTemp > 25) {
        recommendations.accessories.push("Sunglasses", "Sun hat");
        recommendations.special.push("High UV protection");
    }
    
    // Humidity adjustments
    if (humidity > 80) {
        recommendations.top.push("Breathable fabrics");
        recommendations.special.push("Light, moisture-wicking clothes");
    } else if (humidity < 30) {
        recommendations.accessories.push("Lip balm");
        recommendations.special.push("Moisturize skin");
    }
    
    // Wind adjustments
    if (windSpeed > 10) {
        recommendations.outerwear.push("Windbreaker");
        recommendations.accessories.push("Wind-resistant accessories");
        recommendations.special.push("Secure loose items");
    } else if (windSpeed > 5) {
        recommendations.special.push("Light wind protection");
    }
    
    // Remove duplicates and format
    Object.keys(recommendations).forEach(key => {
        recommendations[key] = [...new Set(recommendations[key])];
    });
    
    return recommendations;
}

function generateClothingHTML(recommendations) {
    let html = '<div class="clothing-section"><h4><i class="fas fa-tshirt"></i> Clothing Recommendations</h4>';
    
    if (recommendations.top.length > 0) {
        html += `<div class="clothing-category"><strong>Top:</strong> ${recommendations.top.join(', ')}</div>`;
    }
    if (recommendations.bottom.length > 0) {
        html += `<div class="clothing-category"><strong>Bottom:</strong> ${recommendations.bottom.join(', ')}</div>`;
    }
    if (recommendations.outerwear.length > 0) {
        html += `<div class="clothing-category"><strong>Outerwear:</strong> ${recommendations.outerwear.join(', ')}</div>`;
    }
    if (recommendations.footwear.length > 0) {
        html += `<div class="clothing-category"><strong>Footwear:</strong> ${recommendations.footwear.join(', ')}</div>`;
    }
    if (recommendations.accessories.length > 0) {
        html += `<div class="clothing-category"><strong>Accessories:</strong> ${recommendations.accessories.join(', ')}</div>`;
    }
    if (recommendations.special.length > 0) {
        html += `<div class="clothing-category"><strong>Special Notes:</strong> ${recommendations.special.join(', ')}</div>`;
    }
    
    html += '</div>';
    return html;
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
        fetch(`${AIR_QUALITY_API_URL}?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}`)
    ])
    .then(responses => Promise.all(responses.map(r => r.json())))
    .then(([current, forecast, airQuality]) => {
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
                
                ${generateClothingHTML(getClothingRecommendation(current))}
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
                // Location name is no longer displayed since panel is removed
                console.log('Location:', locationName);
            }
        })
        .catch(error => {
            console.error('Error getting location info:', error);
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

// Weather Prediction System for Indian Cities
// Ported from Python ML model

// Indian city climate characteristics
const CLIMATE_DATA = {
    'delhi': {
        base_temp_max: 28, base_temp_min: 18, rain_prob: 0.25,
        common_weather: ['clear', 'haze', 'rain', 'thunderstorm', 'fog'],
        seasonal_variation: 12
    },
    'mumbai': {
        base_temp_max: 30, base_temp_min: 24, rain_prob: 0.35,
        common_weather: ['clear', 'rain', 'thunderstorm', 'haze', 'clouds'],
        seasonal_variation: 6
    },
    'bangalore': {
        base_temp_max: 26, base_temp_min: 19, rain_prob: 0.30,
        common_weather: ['clear', 'clouds', 'rain', 'thunderstorm', 'mist'],
        seasonal_variation: 8
    },
    'kolkata': {
        base_temp_max: 29, base_temp_min: 21, rain_prob: 0.40,
        common_weather: ['clear', 'haze', 'rain', 'thunderstorm', 'clouds'],
        seasonal_variation: 10
    },
    'chennai': {
        base_temp_max: 32, base_temp_min: 26, rain_prob: 0.20,
        common_weather: ['clear', 'clouds', 'rain', 'haze', 'thunderstorm'],
        seasonal_variation: 4
    }
};

function analyzeWeatherPatterns(currentData, forecastData) {
    const patterns = {
        avg_temp: currentData.main.temp,
        humidity: currentData.main.humidity,
        pressure: currentData.main.pressure,
        weather_type: currentData.weather[0].main.toLowerCase(),
        wind_speed: currentData.wind.speed,
        temp_variations: [],
        temp_trend: 0
    };
    
    // Analyze forecast patterns
    if (forecastData && forecastData.list) {
        const temps = forecastData.list.slice(0, 8).map(item => item.main.temp);
        patterns.temp_variations = temps;
        
        // Calculate temperature trend
        if (temps.length > 1) {
            let trend = 0;
            for (let i = 1; i < temps.length; i++) {
                trend += temps[i] - temps[i-1];
            }
            patterns.temp_trend = trend / (temps.length - 1);
        }
    }
    
    return patterns;
}

function predictWeatherMLBased(patterns, days, cityClimate) {
    const cityData = CLIMATE_DATA[cityClimate.toLowerCase()] || CLIMATE_DATA['delhi'];
    
    const predictedTempsMax = [];
    const predictedTempsMin = [];
    const predictedWeather = [];
    const predictedPrecipitation = [];
    
    const currentTemp = patterns.avg_temp;
    const currentWeather = patterns.weather_type;
    const humidity = patterns.humidity;
    
    for (let day = 0; day < days; day++) {
        // Temperature prediction based on real data + seasonal patterns
        const now = new Date();
        const futureDate = new Date(now.getTime() + (day + 1) * 24 * 60 * 60 * 1000);
        const dayOfYear = Math.floor((futureDate - new Date(futureDate.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        
        // Seasonal adjustment
        const seasonalFactor = cityData.seasonal_variation * Math.sin(2 * Math.PI * dayOfYear / 365 - Math.PI/2);
        
        // Weather persistence (real weather tends to persist)
        const weatherPersistence = day < 3 ? 0.7 : 0.3;
        
        // Predict weather based on current conditions and city patterns
        let weather;
        if (Math.random() < weatherPersistence && day < 3) {
            weather = currentWeather;
        } else {
            // Use city-specific weather patterns with weighted probabilities
            const weatherProbs = [0.4, 0.25, 0.15, 0.12, 0.08];
            const rand = Math.random();
            let cumulative = 0;
            for (let i = 0; i < weatherProbs.length; i++) {
                cumulative += weatherProbs[i];
                if (rand <= cumulative) {
                    weather = cityData.common_weather[i];
                    break;
                }
            }
            weather = weather || cityData.common_weather[0];
        }
        
        predictedWeather.push(weather);
        
        // Temperature prediction
        const baseAdjustment = (currentTemp - cityData.base_temp_max) * 0.3;
        const trendAdjustment = (patterns.temp_trend || 0) * day * 0.1;
        
        // Weather-based temperature adjustment
        const weatherTempEffects = {
            'clear': 2, 'sunny': 2,
            'rain': -3, 'thunderstorm': -4,
            'clouds': -1, 'haze': 0, 'mist': -1, 'fog': -2
        };
        
        const tempEffect = weatherTempEffects[weather] || 0;
        
        // Generate noise (normal distribution approximation)
        const noise = (Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() - 3) * 2;
        
        let tempMax = cityData.base_temp_max + seasonalFactor + baseAdjustment + trendAdjustment + tempEffect + noise;
        let tempMin = cityData.base_temp_min + seasonalFactor + baseAdjustment + trendAdjustment + tempEffect + noise * 0.5 - 3;
        
        // Ensure min < max
        if (tempMin >= tempMax) {
            tempMin = tempMax - 4;
        }
            
        predictedTempsMax.push(tempMax);
        predictedTempsMin.push(tempMin);
        
        // Precipitation prediction based on weather and humidity
        let precip = 0;
        if (['rain', 'thunderstorm'].includes(weather)) {
            const baseRain = 5 + (humidity - 50) * 0.2;
            precip = Math.max(0, baseRain + Math.random() * 15);
        } else if (['clouds', 'haze'].includes(weather) && humidity > 70) {
            precip = Math.random() * 5;
        }
            
        predictedPrecipitation.push(precip);
    }
    
    return {
        tempsMax: predictedTempsMax,
        tempsMin: predictedTempsMin,
        weather: predictedWeather,
        precipitation: predictedPrecipitation
    };
}

function createPredictionPanel() {
    const panel = document.createElement('div');
    panel.id = 'prediction-panel';
    panel.className = 'prediction-panel';
    panel.innerHTML = `
        <div class="prediction-header">
            <h3><i class="fas fa-chart-line"></i> Weather Predictions</h3>
            <button class="close-prediction-btn" title="Close">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="prediction-content">
            <div class="prediction-controls">
                <select id="prediction-city">
                    <option value="delhi">Delhi</option>
                    <option value="mumbai">Mumbai</option>
                    <option value="bangalore">Bangalore</option>
                    <option value="kolkata">Kolkata</option>
                    <option value="chennai">Chennai</option>
                </select>
                <select id="prediction-days">
                    <option value="1">1 Day</option>
                    <option value="3">3 Days</option>
                    <option value="7" selected>7 Days</option>
                    <option value="10">10 Days</option>
                    <option value="15">15 Days</option>
                </select>
                <button id="generate-prediction-btn" class="generate-prediction-btn">
                    <i class="fas fa-magic"></i> Predict
                </button>
            </div>
            <div id="prediction-results" class="prediction-results">
                <p class="prediction-placeholder">Select a city and click "Predict" to see weather forecasts</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(panel);
    
    // Add event listeners
    document.querySelector('.close-prediction-btn').addEventListener('click', () => {
        panel.style.display = 'none';
    });
    
    document.getElementById('generate-prediction-btn').addEventListener('click', generatePredictions);
    
    return panel;
}

async function generatePredictions() {
    const citySelect = document.getElementById('prediction-city');
    const daysSelect = document.getElementById('prediction-days');
    const resultsDiv = document.getElementById('prediction-results');
    const btn = document.getElementById('generate-prediction-btn');
    
    const city = citySelect.value;
    const days = parseInt(daysSelect.value);
    
    // Show loading
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Predicting...';
    resultsDiv.innerHTML = '<p class="loading">Analyzing weather patterns...</p>';
    
    try {
        // Get current weather data for the selected city
        const apiCityNames = {
            'delhi': 'New Delhi',
            'mumbai': 'Mumbai',
            'bangalore': 'Bengaluru',
            'kolkata': 'Kolkata',
            'chennai': 'Chennai'
        };
        
        const apiCityName = apiCityNames[city] || city;
        
        // Fetch current weather
        const currentResponse = await fetch(`${WEATHER_API_URL}?q=${apiCityName},IN&appid=${WEATHER_API_KEY}&units=metric`);
        const currentData = await currentResponse.json();
        
        // Fetch forecast
        const forecastResponse = await fetch(`${FORECAST_API_URL}?q=${apiCityName},IN&appid=${WEATHER_API_KEY}&units=metric`);
        const forecastData = await forecastResponse.json();
        
        if (!currentResponse.ok || !forecastResponse.ok) {
            throw new Error('Failed to fetch weather data');
        }
        
        // Analyze patterns
        const patterns = analyzeWeatherPatterns(currentData, forecastData);
        
        // Generate predictions
        const predictions = predictWeatherMLBased(patterns, days, city);
        
        // Calculate statistics
        const avgTempMax = predictions.tempsMax.reduce((a, b) => a + b, 0) / predictions.tempsMax.length;
        const avgTempMin = predictions.tempsMin.reduce((a, b) => a + b, 0) / predictions.tempsMin.length;
        const avgTemp = (avgTempMax + avgTempMin) / 2;
        const totalPrecipitation = predictions.precipitation.reduce((a, b) => a + b, 0);
        
        // Weather distribution
        const weatherCounts = {};
        predictions.weather.forEach(w => {
            weatherCounts[w] = (weatherCounts[w] || 0) + 1;
        });
        const mostCommonWeather = Object.keys(weatherCounts).reduce((a, b) => weatherCounts[a] > weatherCounts[b] ? a : b);
        
        // Display results
        let html = `
            <div class="prediction-summary">
                <h4>${days} Days Forecast for ${city.charAt(0).toUpperCase() + city.slice(1)}</h4>
                <div class="summary-stats">
                    <div class="stat">
                        <span class="stat-label">Avg Temp:</span>
                        <span class="stat-value">${avgTemp.toFixed(1)}°C</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Max:</span>
                        <span class="stat-value">${Math.max(...predictions.tempsMax).toFixed(1)}°C</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Min:</span>
                        <span class="stat-value">${Math.min(...predictions.tempsMin).toFixed(1)}°C</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Rain:</span>
                        <span class="stat-value">${totalPrecipitation.toFixed(1)}mm</span>
                    </div>
                </div>
            </div>
            
            <div class="charts-section">
                <h5>Visual Analysis</h5>
                <div class="charts-grid">
                    <div class="chart-container">
                        <canvas id="tempChart" width="400" height="200"></canvas>
                    </div>
                    <div class="chart-container">
                        <canvas id="weatherPieChart" width="400" height="200"></canvas>
                    </div>
                    <div class="chart-container">
                        <canvas id="precipitationChart" width="400" height="200"></canvas>
                    </div>
                    <div class="chart-container">
                        <canvas id="tempDistributionChart" width="400" height="200"></canvas>
                    </div>
                    <div class="chart-container">
                        <canvas id="weatherTimelineChart" width="400" height="200"></canvas>
                    </div>
                    <div class="chart-container">
                        <canvas id="statsChart" width="400" height="200"></canvas>
                    </div>
                </div>
            </div>
            
            <div class="weather-distribution">
                <h5>Weather Distribution</h5>
                <div class="weather-bars">
        `;
        
        Object.keys(weatherCounts).forEach(weather => {
            const percentage = (weatherCounts[weather] / days * 100).toFixed(1);
            const emoji = getWeatherEmoji(weather);
            html += `
                <div class="weather-bar">
                    <span class="weather-label">${emoji} ${weather.charAt(0).toUpperCase() + weather.slice(1)}</span>
                    <div class="bar-container">
                        <div class="bar" style="width: ${percentage}%"></div>
                    </div>
                    <span class="percentage">${percentage}%</span>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
            
            <div class="daily-forecast">
                <h5>Daily Forecast</h5>
                <div class="forecast-list">
        `;
        
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i + 1);
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const emoji = getWeatherEmoji(predictions.weather[i]);
            const precipText = predictions.precipitation[i] > 0 ? `, ${predictions.precipitation[i].toFixed(1)}mm` : '';
            
            html += `
                <div class="forecast-day">
                    <div class="day-info">
                        <span class="date">${dateStr}</span>
                        <span class="weather">${emoji} ${predictions.weather[i].charAt(0).toUpperCase() + predictions.weather[i].slice(1)}</span>
                    </div>
                    <div class="temp-info">
                        <span class="temp-max">${predictions.tempsMax[i].toFixed(1)}°C</span>
                        <span class="temp-min">${predictions.tempsMin[i].toFixed(1)}°C</span>
                        ${precipText ? `<span class="precip">${precipText}</span>` : ''}
                    </div>
                </div>
            `;
        }
        
        html += `
                </div>
            </div>
        `;
        
        resultsDiv.innerHTML = html;
        
        // Generate charts after HTML is inserted
        setTimeout(() => {
            generateCharts(predictions, days, avgTemp, weatherCounts, totalPrecipitation);
        }, 100);
        
    } catch (error) {
        console.error('Prediction error:', error);
        resultsDiv.innerHTML = '<p class="error">Failed to generate predictions. Please try again.</p>';
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-magic"></i> Predict';
    }
}

function generateCharts(predictions, days, avgTemp, weatherCounts, totalPrecipitation) {
    const daysRange = Array.from({length: days}, (_, i) => i + 1);
    
    // 1. Temperature Chart
    const tempCtx = document.getElementById('tempChart').getContext('2d');
    new Chart(tempCtx, {
        type: 'line',
        data: {
            labels: daysRange,
            datasets: [{
                label: 'Max Temperature (°C)',
                data: predictions.tempsMax,
                borderColor: '#ff6b6b',
                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                fill: false,
                tension: 0.4,
                pointBackgroundColor: '#ff6b6b',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }, {
                label: 'Min Temperature (°C)',
                data: predictions.tempsMin,
                borderColor: '#4ecdc4',
                backgroundColor: 'rgba(78, 205, 196, 0.1)',
                fill: false,
                tension: 0.4,
                pointBackgroundColor: '#4ecdc4',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Temperature Prediction',
                    color: '#ffffff',
                    font: { size: 14, weight: 'bold' }
                },
                legend: {
                    labels: { color: '#ffffff' }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Days',
                        color: '#ffffff'
                    },
                    ticks: { color: '#ffffff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Temperature (°C)',
                        color: '#ffffff'
                    },
                    ticks: { color: '#ffffff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        }
    });
    
    // 2. Weather Distribution Pie Chart
    const weatherLabels = Object.keys(weatherCounts);
    const weatherData = Object.values(weatherCounts);
    const weatherColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd'];
    
    const pieCtx = document.getElementById('weatherPieChart').getContext('2d');
    new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: weatherLabels.map(w => w.charAt(0).toUpperCase() + w.slice(1)),
            datasets: [{
                data: weatherData,
                backgroundColor: weatherColors.slice(0, weatherLabels.length),
                borderColor: '#ffffff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Weather Distribution',
                    color: '#ffffff',
                    font: { size: 14, weight: 'bold' }
                },
                legend: {
                    labels: { color: '#ffffff' }
                }
            }
        }
    });
    
    // 3. Precipitation Chart
    const precipCtx = document.getElementById('precipitationChart').getContext('2d');
    new Chart(precipCtx, {
        type: 'bar',
        data: {
            labels: daysRange,
            datasets: [{
                label: 'Precipitation (mm)',
                data: predictions.precipitation,
                backgroundColor: 'rgba(116, 185, 255, 0.6)',
                borderColor: '#74b9ff',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Daily Precipitation',
                    color: '#ffffff',
                    font: { size: 14, weight: 'bold' }
                },
                legend: {
                    labels: { color: '#ffffff' }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Days',
                        color: '#ffffff'
                    },
                    ticks: { color: '#ffffff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Precipitation (mm)',
                        color: '#ffffff'
                    },
                    ticks: { color: '#ffffff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    beginAtZero: true
                }
            }
        }
    });
    
    // 4. Temperature Distribution Histogram
    const allTemps = [...predictions.tempsMax, ...predictions.tempsMin];
    const tempDistCtx = document.getElementById('tempDistributionChart').getContext('2d');
    new Chart(tempDistCtx, {
        type: 'bar',
        data: {
            labels: Array.from({length: Math.ceil((Math.max(...allTemps) - Math.min(...allTemps)) / 2) + 1}, 
                              (_, i) => (Math.min(...allTemps) + i * 2).toFixed(1)),
            datasets: [{
                label: 'Max Temps',
                data: createHistogramData(predictions.tempsMax, Math.min(...allTemps), Math.max(...allTemps)),
                backgroundColor: 'rgba(255, 107, 107, 0.6)',
                borderColor: '#ff6b6b',
                borderWidth: 1
            }, {
                label: 'Min Temps',
                data: createHistogramData(predictions.tempsMin, Math.min(...allTemps), Math.max(...allTemps)),
                backgroundColor: 'rgba(78, 205, 196, 0.6)',
                borderColor: '#4ecdc4',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Temperature Distribution',
                    color: '#ffffff',
                    font: { size: 14, weight: 'bold' }
                },
                legend: {
                    labels: { color: '#ffffff' }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Temperature (°C)',
                        color: '#ffffff'
                    },
                    ticks: { color: '#ffffff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Frequency',
                        color: '#ffffff'
                    },
                    ticks: { color: '#ffffff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    beginAtZero: true
                }
            }
        }
    });
    
    // 5. Weather Timeline
    const uniqueWeather = [...new Set(predictions.weather)];
    const weatherNumeric = predictions.weather.map(w => uniqueWeather.indexOf(w));
    
    const timelineCtx = document.getElementById('weatherTimelineChart').getContext('2d');
    new Chart(timelineCtx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Weather Conditions',
                data: daysRange.map((day, i) => ({ x: day, y: weatherNumeric[i] })),
                backgroundColor: weatherColors.slice(0, uniqueWeather.length),
                borderColor: '#ffffff',
                borderWidth: 2,
                pointRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Daily Weather Conditions',
                    color: '#ffffff',
                    font: { size: 14, weight: 'bold' }
                },
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Days',
                        color: '#ffffff'
                    },
                    ticks: { color: '#ffffff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Weather Type',
                        color: '#ffffff'
                    },
                    ticks: {
                        color: '#ffffff',
                        callback: function(value) {
                            return uniqueWeather[value] ? uniqueWeather[value].charAt(0).toUpperCase() + uniqueWeather[value].slice(1) : '';
                        }
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        }
    });
    
    // 6. Statistics Summary
    const statsCtx = document.getElementById('statsChart').getContext('2d');
    new Chart(statsCtx, {
        type: 'bar',
        data: {
            labels: ['Avg Temp', 'Max Temp', 'Min Temp'],
            datasets: [{
                label: 'Temperature (°C)',
                data: [avgTemp, Math.max(...predictions.tempsMax), Math.min(...predictions.tempsMin)],
                backgroundColor: ['#8a2be2', '#ff6b6b', '#4ecdc4'],
                borderColor: '#ffffff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Temperature Statistics',
                    color: '#ffffff',
                    font: { size: 14, weight: 'bold' }
                },
                legend: {
                    labels: { color: '#ffffff' }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#ffffff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Temperature (°C)',
                        color: '#ffffff'
                    },
                    ticks: { color: '#ffffff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        }
    });
}

function createHistogramData(data, minVal, maxVal) {
    const binSize = 2;
    const bins = Math.ceil((maxVal - minVal) / binSize) + 1;
    const histogram = new Array(bins).fill(0);
    
    data.forEach(value => {
        const binIndex = Math.floor((value - minVal) / binSize);
        if (binIndex >= 0 && binIndex < bins) {
            histogram[binIndex]++;
        }
    });
    
    return histogram;
}

function getWeatherEmoji(weather) {
    const emojis = {
        'clear': '☀️',
        'sunny': '☀️',
        'rain': '🌧️',
        'thunderstorm': '⛈️',
        'clouds': '☁️',
        'haze': '🌫️',
        'mist': '🌫️',
        'fog': '🌫️'
    };
    return emojis[weather] || '🌤️';
}

// Add prediction button to controls
function addPredictionButton() {
    const controls = document.querySelector('.controls');
    if (controls) {
        const predictionBtn = document.createElement('button');
        predictionBtn.id = 'prediction-toggle-btn';
        predictionBtn.className = 'control-btn';
        predictionBtn.title = 'Weather Predictions (Ctrl+P)';
        predictionBtn.innerHTML = '<i class="fas fa-chart-line"></i>';
        
        predictionBtn.addEventListener('click', () => {
            let panel = document.getElementById('prediction-panel');
            if (!panel) {
                panel = createPredictionPanel();
            }
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        });
        
        controls.appendChild(predictionBtn);
    }
}

// Add keyboard shortcut for predictions
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        const panel = document.getElementById('prediction-panel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        } else {
            const newPanel = createPredictionPanel();
            newPanel.style.display = 'block';
        }
    }
});

// Initialize prediction system
document.addEventListener('DOMContentLoaded', () => {
    // Add prediction button after a short delay to ensure controls are loaded
    setTimeout(addPredictionButton, 2000);
});
