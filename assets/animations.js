/* =============================================
   SCORPION MC — Premium Interactive Animations
   Mouse glow, staggered reveals, page transitions
   ============================================= */

(function() {
    'use strict';

    // ---- Page Loader ----
    const loader = document.createElement('div');
    loader.className = 'page-loader';
    loader.innerHTML = '<div class="loader-logo">SCORPION MC</div>';
    document.body.prepend(loader);

    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.classList.add('loaded');
            // Remove after transition
            setTimeout(() => loader.remove(), 700);
        }, 400);
    });

    // ---- Cursor Glow Follow ----
    if (window.innerWidth > 768) {
        const glow = document.createElement('div');
        glow.className = 'cursor-glow';
        document.body.appendChild(glow);

        let mouseX = 0, mouseY = 0;
        let currentX = 0, currentY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            glow.classList.add('active');
        });

        document.addEventListener('mouseleave', () => {
            glow.classList.remove('active');
        });

        // Smooth lerp follow
        function animateGlow() {
            currentX += (mouseX - currentX) * 0.08;
            currentY += (mouseY - currentY) * 0.08;
            glow.style.left = currentX + 'px';
            glow.style.top = currentY + 'px';
            requestAnimationFrame(animateGlow);
        }
        animateGlow();
    }

    // ---- Staggered Reveal Observer ----
    const revealElements = document.querySelectorAll('.reveal');
    let lastGroup = null;
    let delayIndex = 0;

    // Group reveals by parent to add staggered delays
    revealElements.forEach((el) => {
        const parent = el.parentElement;
        if (parent !== lastGroup) {
            lastGroup = parent;
            delayIndex = 0;
        }
        if (delayIndex > 0 && delayIndex <= 5) {
            el.classList.add('delay-' + delayIndex);
        }
        delayIndex++;
    });

    // ---- Enhanced Intersection Observer ----
    const observerOptions = {
        threshold: 0.08,
        rootMargin: '0px 0px -50px 0px'
    };

    const animObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Don't unobserve — keep the class once added
            }
        });
    }, observerOptions);

    // Re-observe all reveal elements (won't conflict with existing observers)
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
        animObserver.observe(el);
    });

    // ---- Tilt Effect on Cards ----
    if (window.innerWidth > 768) {
        const tiltCards = document.querySelectorAll('.member-card, .contact-card');
        
        tiltCards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = (y - centerY) / centerY * -3;
                const rotateY = (x - centerX) / centerX * 3;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
            });
        });
    }

    // ---- Parallax Scroll Effect for Sections ----
    if (window.innerWidth > 768) {
        const parallaxSections = document.querySelectorAll('.section-padding, .story-header, .gallery-header, .team-header, .contact-header');
        
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const scrolled = window.pageYOffset;
                    
                    parallaxSections.forEach(section => {
                        const rect = section.getBoundingClientRect();
                        const speed = 0.03;
                        
                        if (rect.top < window.innerHeight && rect.bottom > 0) {
                            const offset = (rect.top - window.innerHeight / 2) * speed;
                            section.style.transform = `translateY(${offset}px)`;
                        }
                    });
                    
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    // ---- Gallery Counter Badge ----
    const galleryContainer = document.querySelector('.gallery-container');
    if (galleryContainer) {
        const items = galleryContainer.querySelectorAll('.gallery-item');
        items.forEach((item, index) => {
            item.setAttribute('data-index', String(index + 1).padStart(2, '0'));
        });
        
        // Add counter style
        const counterStyle = document.createElement('style');
        counterStyle.textContent = `
            .gallery-item::before {
                content: attr(data-index) !important;
                position: absolute !important;
                top: 15px !important;
                left: 15px !important;
                font-family: 'Hessian', serif !important;
                font-size: 0.8rem !important;
                color: white !important;
                letter-spacing: 2px !important;
                opacity: 0 !important;
                transition: all 0.4s ease !important;
                z-index: 3 !important;
                background: none !important;
                inset: auto !important;
            }
            .gallery-item:hover::before {
                opacity: 0.6 !important;
            }
        `;
        document.head.appendChild(counterStyle);
    }

    // ---- Smooth anchor scroll ----
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ---- Typewriter Effect for Present Title ----
    const presentTitle = document.querySelector('.present-title');
    if (presentTitle) {
        const originalText = presentTitle.textContent;
        presentTitle.textContent = '';
        
        const typeObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    let i = 0;
                    const typeInterval = setInterval(() => {
                        presentTitle.textContent = originalText.substring(0, i + 1);
                        i++;
                        if (i >= originalText.length) {
                            clearInterval(typeInterval);
                        }
                    }, 80);
                    typeObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        typeObserver.observe(presentTitle);
    }

})();
