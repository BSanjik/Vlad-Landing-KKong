// SNAKKONG Landing Page JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe sections for animation
    document.querySelectorAll('.benefit-card, .product-card, .about-content, .about-image').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Add animation class styles
    const style = document.createElement('style');
    style.textContent = `
        .animate-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);

    // Parallax effect for hero section
    const hero = document.querySelector('.hero');
    const heroContent = document.querySelector('.hero-content');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const heroHeight = hero.offsetHeight;
        
        if (scrolled < heroHeight) {
            const parallax = scrolled * 0.4;
            heroContent.style.transform = `translateY(${parallax}px)`;
            heroContent.style.opacity = 1 - (scrolled / heroHeight);
        }
    });

    // Add fire particle effect to spicy product
    const spicyCard = document.querySelector('.product-card.featured');
    if (spicyCard) {
        createFireParticles(spicyCard);
    }

    // Product card hover effects
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.zIndex = '10';
        });
        card.addEventListener('mouseleave', () => {
            card.style.zIndex = '';
        });
    });
});

// Create fire particles effect
function createFireParticles(container) {
    const particleContainer = document.createElement('div');
    particleContainer.className = 'fire-particles';
    particleContainer.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 100px;
        height: 150px;
        pointer-events: none;
        overflow: visible;
    `;
    container.appendChild(particleContainer);

    function createParticle() {
        const particle = document.createElement('div');
        const size = Math.random() * 8 + 4;
        const startX = Math.random() * 80 - 40;
        const duration = Math.random() * 1000 + 1500;
        
        particle.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 50%;
            width: ${size}px;
            height: ${size}px;
            background: radial-gradient(circle, rgba(255, 140, 0, 0.8) 0%, rgba(255, 60, 0, 0.4) 50%, transparent 100%);
            border-radius: 50%;
            transform: translateX(${startX}px);
            animation: particleRise ${duration}ms ease-out forwards;
            pointer-events: none;
        `;
        
        particleContainer.appendChild(particle);
        
        setTimeout(() => {
            particle.remove();
        }, duration);
    }

    // Add particle animation keyframes
    if (!document.querySelector('#particle-styles')) {
        const style = document.createElement('style');
        style.id = 'particle-styles';
        style.textContent = `
            @keyframes particleRise {
                0% {
                    opacity: 1;
                    transform: translateY(0) translateX(var(--start-x, 0)) scale(1);
                }
                100% {
                    opacity: 0;
                    transform: translateY(-120px) translateX(calc(var(--start-x, 0) + ${Math.random() * 40 - 20}px)) scale(0.3);
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Create particles at intervals
    setInterval(createParticle, 200);
}

// Console branding
console.log('%cSNAKKONG', 'font-size: 48px; font-weight: bold; color: #ff6b00; text-shadow: 2px 2px 4px #000;');
console.log('%cМощный вкус. Чистый протеин.', 'font-size: 16px; color: #d4a574;');
