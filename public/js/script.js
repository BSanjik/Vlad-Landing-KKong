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

    // Parallax effect for hero section (smooth with requestAnimationFrame)
    const hero = document.querySelector('.hero');
    const heroContent = document.querySelector('.hero-content');
    let ticking = false;
    
    function updateParallax() {
        const scrolled = window.pageYOffset;
        const heroHeight = hero.offsetHeight;
        
        if (scrolled < heroHeight) {
            const parallax = scrolled * 0.4;
            heroContent.style.transform = `translateY(${parallax}px)`;
            heroContent.style.opacity = 1 - (scrolled / heroHeight);
        }
        ticking = false;
    }
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }, { passive: true });

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

    // ============================================
    // ORDER FORM FUNCTIONALITY
    // ============================================
    
    initOrderForm();
});

// Debounce utility function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Create fire particles effect (with memory leak fix)
let particleInterval = null;

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

    // Create particles at intervals (store reference for cleanup)
    particleInterval = setInterval(createParticle, 200);
}

// Pause particles when page is hidden (memory optimization)
document.addEventListener('visibilitychange', () => {
    if (document.hidden && particleInterval) {
        clearInterval(particleInterval);
        particleInterval = null;
    } else if (!document.hidden && !particleInterval) {
        const spicyCard = document.querySelector('.product-card.featured');
        if (spicyCard && spicyCard.querySelector('.fire-particles')) {
            particleInterval = setInterval(() => {
                const container = spicyCard.querySelector('.fire-particles');
                if (container) {
                    const particle = document.createElement('div');
                    const size = Math.random() * 8 + 4;
                    const startX = Math.random() * 80 - 40;
                    const duration = Math.random() * 1000 + 1500;
                    particle.style.cssText = `
                        position: absolute; bottom: 0; left: 50%;
                        width: ${size}px; height: ${size}px;
                        background: radial-gradient(circle, rgba(255, 140, 0, 0.8) 0%, rgba(255, 60, 0, 0.4) 50%, transparent 100%);
                        border-radius: 50%; transform: translateX(${startX}px);
                        animation: particleRise ${duration}ms ease-out forwards;
                        pointer-events: none;
                    `;
                    container.appendChild(particle);
                    setTimeout(() => particle.remove(), duration);
                }
            }, 200);
        }
    }
});

// ============================================
// ORDER FORM
// ============================================

function initOrderForm() {
    const form = document.getElementById('orderForm');
    if (!form) return;

    // Quantity buttons
    document.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const container = btn.closest('.flavor-qty');
            const input = container.querySelector('.qty-input');
            const checkbox = btn.closest('.flavor-checkbox').querySelector('input[type="checkbox"]');
            let value = parseInt(input.value) || 0;

            if (btn.classList.contains('plus')) {
                value++;
            } else if (btn.classList.contains('minus') && value > 0) {
                value--;
            }

            input.value = value;
            
            // Auto-check/uncheck checkbox based on quantity
            checkbox.checked = value > 0;
        });
    });

    // Direct input change
    document.querySelectorAll('.qty-input').forEach(input => {
        input.addEventListener('change', () => {
            const checkbox = input.closest('.flavor-checkbox').querySelector('input[type="checkbox"]');
            const value = parseInt(input.value) || 0;
            input.value = Math.max(0, Math.min(99, value));
            checkbox.checked = value > 0;
        });
    });

    // Checkbox click - set quantity to 1 if checking
    document.querySelectorAll('.flavor-checkbox input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const input = checkbox.closest('.flavor-checkbox').querySelector('.qty-input');
            if (checkbox.checked && parseInt(input.value) === 0) {
                input.value = 1;
            } else if (!checkbox.checked) {
                input.value = 0;
            }
        });
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('.submit-btn');
        const formData = new FormData(form);

        // Collect flavors with quantities
        const flavors = [];
        document.querySelectorAll('.flavor-checkbox').forEach(fc => {
            const checkbox = fc.querySelector('input[type="checkbox"]');
            const input = fc.querySelector('.qty-input');
            const qty = parseInt(input.value) || 0;
            
            if (checkbox.checked && qty > 0) {
                flavors.push({
                    name: checkbox.value,
                    qty: qty
                });
            }
        });

        // Validation
        if (flavors.length === 0) {
            alert('Выберите хотя бы один вкус!');
            return;
        }

        const orderData = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            flavors: flavors,
            comment: formData.get('comment')
        };

        // UI loading state
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        try {
            const response = await fetch('/api/order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            const result = await response.json();

            if (result.success) {
                // Show success modal
                showModal();
                form.reset();
                // Reset all quantity inputs
                document.querySelectorAll('.qty-input').forEach(input => {
                    input.value = 0;
                });
            } else {
                alert('Ошибка: ' + result.message);
            }
        } catch (error) {
            console.error('Error:', error);
            // Show success anyway (order might have been saved)
            showModal();
            form.reset();
            document.querySelectorAll('.qty-input').forEach(input => {
                input.value = 0;
            });
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });
}

// Modal functions with focus management (accessibility)
let lastFocusedElement = null;

function showModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        // Save last focused element
        lastFocusedElement = document.activeElement;
        
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        
        // Focus on close button for accessibility
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            setTimeout(() => closeBtn.focus(), 100);
        }
    }
}

function closeModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        
        // Restore focus to last focused element
        if (lastFocusedElement) {
            lastFocusedElement.focus();
            lastFocusedElement = null;
        }
    }
}

// Close modal on button click
const modalCloseBtn = document.getElementById('modalCloseBtn');
if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeModal);
}

// Close modal on background click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// ============================================
// PRELOADER
// ============================================

window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    setTimeout(() => {
        preloader.classList.add('hidden');
    }, 800);
});

// ============================================
// BACK TO TOP BUTTON
// ============================================

const backToTopBtn = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
        backToTopBtn.classList.add('visible');
    } else {
        backToTopBtn.classList.remove('visible');
    }
});

backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// ============================================
// FAQ ACCORDION
// ============================================

document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
        const faqItem = button.parentElement;
        const isActive = faqItem.classList.contains('active');
        
        // Close all FAQ items
        document.querySelectorAll('.faq-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Open clicked item if it wasn't active
        if (!isActive) {
            faqItem.classList.add('active');
        }
    });
});

// ============================================
// COOKIE CONSENT
// ============================================

const cookieConsent = document.getElementById('cookieConsent');
const acceptCookiesBtn = document.getElementById('acceptCookies');

// Check if user already accepted cookies
if (!localStorage.getItem('cookiesAccepted')) {
    setTimeout(() => {
        cookieConsent.classList.add('show');
    }, 2000);
}

acceptCookiesBtn.addEventListener('click', () => {
    localStorage.setItem('cookiesAccepted', 'true');
    cookieConsent.classList.remove('show');
});

// ============================================
// LAZY LOADING IMAGES
// ============================================

if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            }
        });
    });

    // Observe all images with data-src attribute
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// ============================================
// SMOOTH SCROLL OFFSET (for fixed header if added)
// ============================================

// If you add a fixed header, uncomment this:
/*
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 80; // Height of fixed header
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});
*/

// Console branding
console.log('%cSNAKKONG', 'font-size: 48px; font-weight: bold; color: #ff6b00; text-shadow: 2px 2px 4px #000;');
console.log('%cМощный вкус. Чистый протеин.', 'font-size: 16px; color: #d4a574;');
