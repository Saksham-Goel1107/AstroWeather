// Homepage JavaScript for AstroWeather
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all homepage functionality
    initNavigation();
    initScrollEffects();
    initAnimations();
    initMobileMenu();
    initGlobePreview();
});

// Navigation functionality
function initNavigation() {
    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelectorAll('.nav-link');

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 70; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Scroll effects and animations
function initScrollEffects() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe all feature cards and sections
    document.querySelectorAll('.feature-card, .about-content, .cta-content').forEach(el => {
        observer.observe(el);
    });
}

// Initialize animations
function initAnimations() {
    // Add CSS for scroll animations
    const style = document.createElement('style');
    style.textContent = `
        .feature-card, .about-content, .cta-content {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.6s ease;
        }

        .feature-card.animate-in, .about-content.animate-in, .cta-content.animate-in {
            opacity: 1;
            transform: translateY(0);
        }

        .feature-card:nth-child(odd) {
            transition-delay: 0.1s;
        }

        .feature-card:nth-child(even) {
            transition-delay: 0.2s;
        }
    `;
    document.head.appendChild(style);

    // Stagger animation for feature cards
    setTimeout(() => {
        document.querySelectorAll('.feature-card').forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('animate-in');
            }, index * 100);
        });
    }, 500);
}

// Mobile menu functionality
function initMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', () => {
            navLinks.classList.toggle('mobile-active');
            mobileToggle.innerHTML = navLinks.classList.contains('mobile-active')
                ? '<i class="fas fa-times"></i>'
                : '<i class="fas fa-bars"></i>';
        });

        // Close mobile menu when clicking a link
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('mobile-active');
                mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
            });
        });
    }
}

// Enhanced Globe Preview with Interactive Demo
function initGlobePreview() {
    const globeSphere = document.querySelector('.globe-sphere');
    const floatingElements = document.querySelectorAll('.weather-icon, .satellite, .moon');
    const globeContainer = document.querySelector('.globe-container');
    const locationCards = document.querySelectorAll('.location-card');
    const controlBtns = document.querySelectorAll('.control-btn');
    const weatherPoints = document.querySelectorAll('.weather-point');

    if (globeSphere) {
        // Enhanced hover effects
        globeSphere.addEventListener('mouseenter', () => {
            globeSphere.style.animationDuration = '8s';
            globeContainer.style.transform = 'scale(1.05)';
            createGlobeParticles();
        });

        globeSphere.addEventListener('mouseleave', () => {
            globeSphere.style.animationDuration = '25s';
            globeContainer.style.transform = 'scale(1)';
            removeGlobeParticles();
        });

        // Click effect for interaction
        globeSphere.addEventListener('click', () => {
            globeSphere.style.animationPlayState = 'paused';
            setTimeout(() => {
                globeSphere.style.animationPlayState = 'running';
            }, 2000);
        });
    }

    // Interactive location cards
    locationCards.forEach((card, index) => {
        card.addEventListener('click', () => {
            // Remove active class from all cards
            locationCards.forEach(c => c.classList.remove('active'));
            // Add active class to clicked card
            card.classList.add('active');

            // Update globe rotation to focus on selected location
            const locations = ['new-york', 'tokyo'];
            const rotationAngles = [0, 120]; // Different angles for each location
            globeContainer.style.transform = `rotateY(${rotationAngles[index % rotationAngles.length]}deg) rotateX(10deg) scale(1.05)`;

            setTimeout(() => {
                globeContainer.style.transform = 'rotateY(0deg) rotateX(10deg) scale(1)';
            }, 2000);
        });
    });

    // Dashboard controls
    controlBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            controlBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');

            const viewType = btn.dataset.view;
            updateDashboardView(viewType);
        });
    });

    // Interactive weather points
    weatherPoints.forEach((point, index) => {
        point.addEventListener('click', () => {
            // Highlight the corresponding location card
            const locationNames = ['new-york', 'tokyo'];
            const targetCard = document.querySelector(`[data-location="${locationNames[index % locationNames.length]}"]`);

            if (targetCard) {
                locationCards.forEach(c => c.classList.remove('active'));
                targetCard.classList.add('active');

                // Add pulse effect to the point
                point.style.animation = 'none';
                setTimeout(() => {
                    point.style.animation = 'point-pulse 3s ease-in-out infinite';
                }, 10);
            }
        });
    });

    // Add click effects to floating elements
    floatingElements.forEach(element => {
        element.addEventListener('click', () => {
            element.style.animationPlayState = 'paused';
            element.style.transform += ' scale(1.2)';
            setTimeout(() => {
                element.style.animationPlayState = 'running';
                element.style.transform = element.style.transform.replace(' scale(1.2)', '');
            }, 1000);
        });
    });
}

// Update dashboard view based on control selection
function updateDashboardView(viewType) {
    const locationCards = document.querySelectorAll('.location-card');

    locationCards.forEach(card => {
        const weatherIcon = card.querySelector('.weather-icon i');
        const temp = card.querySelector('.temp');
        const condition = card.querySelector('.condition');
        const stats = card.querySelectorAll('.stat');

        switch(viewType) {
            case 'weather':
                // Default weather view
                weatherIcon.className = card.dataset.location === 'new-york' ? 'fas fa-sun' : 'fas fa-cloud-rain';
                temp.textContent = card.dataset.location === 'new-york' ? '22°C' : '28°C';
                condition.textContent = card.dataset.location === 'new-york' ? 'Sunny' : 'Rainy';
                stats[0].querySelector('.value').textContent = card.dataset.location === 'new-york' ? '65%' : '85%';
                stats[1].querySelector('.value').textContent = card.dataset.location === 'new-york' ? '12 km/h' : '8 km/h';
                break;

            case 'temp':
                // Temperature focus view
                weatherIcon.className = 'fas fa-thermometer-half';
                temp.style.fontSize = '20px';
                temp.style.color = card.dataset.location === 'new-york' ? '#ff6b6b' : '#4ecdc4';
                setTimeout(() => {
                    temp.style.fontSize = '';
                    temp.style.color = '';
                }, 2000);
                break;

            case 'wind':
                // Wind focus view
                weatherIcon.className = 'fas fa-wind';
                stats[1].style.background = 'rgba(59, 130, 246, 0.2)';
                setTimeout(() => {
                    stats[1].style.background = '';
                }, 2000);
                break;
        }
    });
}

// Create dynamic particles around the globe
function createGlobeParticles() {
    const globeContainer = document.querySelector('.globe-container');
    const particleCount = 15;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'globe-particle';
        particle.style.left = Math.random() * 120 + '%';
        particle.style.top = Math.random() * 120 + '%';
        particle.style.animationDelay = Math.random() * 3 + 's';
        particle.style.animationDuration = (Math.random() * 2 + 2) + 's';

        globeContainer.appendChild(particle);

        // Remove particle after animation
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 5000);
    }
}

function removeGlobeParticles() {
    const particles = document.querySelectorAll('.globe-particle');
    particles.forEach(particle => {
        if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
        }
    });
}

// Particle system for cosmic background
function createParticles() {
    const particleContainer = document.querySelector('.cosmic-bg');
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (Math.random() * 10 + 10) + 's';

        particleContainer.appendChild(particle);
    }
}

// Typing effect for hero subtitle
function initTypingEffect() {
    const subtitle = document.querySelector('.hero-subtitle');
    const text = subtitle.textContent;
    subtitle.textContent = '';

    let i = 0;
    const timer = setInterval(() => {
        if (i < text.length) {
            subtitle.textContent += text.charAt(i);
            i++;
        } else {
            clearInterval(timer);
        }
    }, 50);
}

// Performance optimization
function optimizePerformance() {
    // Lazy load images if any
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));

    // Throttle scroll events
    let scrollTimeout;
    const throttledScroll = () => {
        if (!scrollTimeout) {
            scrollTimeout = setTimeout(() => {
                // Handle scroll effects
                scrollTimeout = null;
            }, 16); // ~60fps
        }
    };

    window.addEventListener('scroll', throttledScroll);
}

// Accessibility improvements
function initAccessibility() {
    // Add focus management
    const focusableElements = document.querySelectorAll('a, button, input, textarea, select');

    focusableElements.forEach(element => {
        element.addEventListener('focus', () => {
            element.style.outline = '2px solid #00d4ff';
            element.style.outlineOffset = '2px';
        });

        element.addEventListener('blur', () => {
            element.style.outline = '';
            element.style.outlineOffset = '';
        });
    });

    // Keyboard navigation for mobile menu
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const mobileMenu = document.querySelector('.nav-links.mobile-active');
            const mobileToggle = document.querySelector('.mobile-menu-toggle');

            if (mobileMenu) {
                mobileMenu.classList.remove('mobile-active');
                mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
            }
        }
    });
}

// Initialize all features
function initAll() {
    createParticles();
    initTypingEffect();
    optimizePerformance();
    initAccessibility();

    // Add loading class removal
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);
}

// Call initialization
initAll();

// Add some CSS for additional effects
const additionalStyles = `
<style>
.cosmic-bg .particle {
    position: absolute;
    width: 2px;
    height: 2px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 50%;
    animation: float-particle 20s linear infinite;
    pointer-events: none;
}

@keyframes float-particle {
    0% {
        transform: translateY(0px) rotate(0deg);
        opacity: 0;
    }
    10% {
        opacity: 1;
    }
    90% {
        opacity: 1;
    }
    100% {
        transform: translateY(-100vh) rotate(360deg);
        opacity: 0;
    }
}

.nav-links.mobile-active {
    display: flex;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: rgba(10, 10, 15, 0.95);
    backdrop-filter: blur(20px);
    flex-direction: column;
    padding: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    animation: slideDown 0.3s ease;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@media (min-width: 769px) {
    .nav-links.mobile-active {
        position: static;
        display: flex;
        flex-direction: row;
        background: none;
        backdrop-filter: none;
        padding: 0;
        border: none;
        animation: none;
    }
}

body.loaded .hero-title {
    animation: fadeInUp 1s ease;
}

body.loaded .hero-subtitle {
    animation: fadeInUp 1s ease 0.2s both;
}

body.loaded .hero-actions {
    animation: fadeInUp 1s ease 0.4s both;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
`;

// Add additional styles to head
document.head.insertAdjacentHTML('beforeend', additionalStyles);