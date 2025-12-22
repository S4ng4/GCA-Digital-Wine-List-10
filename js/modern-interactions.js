/**
 * Gran Caffè L'Aquila - Modern Interactions
 * Awwwards-Level Interactive Features
 */

(function() {
    'use strict';

    // ==================== CUSTOM CURSOR (Desktop Only) ====================
    const initCustomCursor = () => {
        // Only init custom cursor on desktop (hover-capable devices)
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
            return; // Skip on mobile/touch devices
        }
        
        // Create cursor element
        const cursor = document.createElement('div');
        cursor.className = 'custom-cursor';
        document.body.appendChild(cursor);

        let mouseX = 0;
        let mouseY = 0;
        let cursorX = 0;
        let cursorY = 0;
        const delay = 0.1;

        // Update mouse position
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        // Smooth cursor animation
        const animateCursor = () => {
            const distX = mouseX - cursorX;
            const distY = mouseY - cursorY;
            
            cursorX += distX * delay;
            cursorY += distY * delay;
            
            cursor.style.left = cursorX + 'px';
            cursor.style.top = cursorY + 'px';
            
            requestAnimationFrame(animateCursor);
        };
        
        animateCursor();

        // Expand cursor on interactive elements
        const interactiveElements = document.querySelectorAll('a, button, .wine-card, .wine-card-sidebar, .region-item, .wine-item, input, .btn-filter');
        
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.classList.add('cursor-hover');
            });
            
            el.addEventListener('mouseleave', () => {
                cursor.classList.remove('cursor-hover');
            });
        });

        // Cursor click effect
        document.addEventListener('mousedown', () => {
            cursor.classList.add('cursor-click');
        });
        
        document.addEventListener('mouseup', () => {
            cursor.classList.remove('cursor-click');
        });
    };

    // ==================== MAGNETIC BUTTONS (Desktop Only) ====================
    const initMagneticButtons = () => {
        // Only enable magnetic effect on desktop
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
            return; // Skip on mobile/touch devices
        }
        
        const magneticElements = document.querySelectorAll('.magnetic-btn, .btn-filter, .wine-card-sidebar');
        
        // FIX: Throttle magnetic effect to improve FPS
        magneticElements.forEach(el => {
            let ticking = false;
            
            el.addEventListener('mousemove', (e) => {
                if (ticking) return;
                
                ticking = true;
                requestAnimationFrame(() => {
                    const rect = el.getBoundingClientRect();
                    const x = e.clientX - rect.left - rect.width / 2;
                    const y = e.clientY - rect.top - rect.height / 2;
                    
                    // Reduced magnetic strength for better performance
                    const strength = 0.15;
                    
                    el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
                    ticking = false;
                });
            });
            
            el.addEventListener('mouseleave', () => {
                el.style.transform = 'translate(0, 0)';
            });
        });
    };

    // ==================== 3D TILT EFFECT (Desktop Only) ====================
    const init3DTilt = () => {
        // Only enable 3D tilt on desktop (hover-capable devices)
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
            return; // Skip on mobile/touch devices
        }
        
        const tiltCards = document.querySelectorAll('.wine-card, .glass-card');
        
        // FIX: Throttle tilt effect to improve FPS (60fps target)
        let ticking = false;
        
        tiltCards.forEach(card => {
            card.classList.add('tilt-card');
            
            card.addEventListener('mousemove', (e) => {
                if (ticking) return;
                
                ticking = true;
                requestAnimationFrame(() => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    
                    // Reduced rotation intensity for better performance
                    const rotateX = (y - centerY) / 20;
                    const rotateY = (centerX - x) / 20;
                    
                    card.style.transform = `
                        perspective(1000px) 
                        rotateX(${rotateX}deg) 
                        rotateY(${rotateY}deg) 
                        scale3d(1.02, 1.02, 1.02)
                    `;
                    
                    ticking = false;
                });
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
            });
        });
    };

    // ==================== PARALLAX SCROLLING (Desktop Only) ====================
    const initParallax = () => {
        // Only enable parallax on desktop (better performance)
        if (!window.matchMedia('(min-width: 1024px)').matches) {
            return; // Skip on mobile/tablet
        }
        
        const parallaxElements = document.querySelectorAll('[data-parallax]');
        
        if (parallaxElements.length === 0) return;
        
        let ticking = false;
        
        const updateParallax = () => {
            const scrolled = window.pageYOffset;
            
            parallaxElements.forEach(el => {
                const speed = parseFloat(el.dataset.parallax) || 0.5;
                const yPos = -(scrolled * speed);
                el.style.transform = `translateY(${yPos}px)`;
            });
            
            ticking = false;
        };
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        }, { passive: true });
    };

    // ==================== DARK MODE TOGGLE ====================
    const initDarkMode = () => {
        // Create toggle button if it doesn't exist
        let toggle = document.querySelector('.theme-toggle');
        
        if (!toggle) {
            toggle = document.createElement('button');
            toggle.className = 'theme-toggle';
            toggle.setAttribute('aria-label', 'Toggle dark mode');
            toggle.innerHTML = '<i class="fas fa-moon theme-icon"></i>';
            document.body.appendChild(toggle);
        }

        // Check for saved theme preference or default to 'dark'
        const currentTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', currentTheme);
        updateThemeIcon(currentTheme);

        // Toggle theme
        toggle.addEventListener('click', () => {
            const theme = document.documentElement.getAttribute('data-theme');
            const newTheme = theme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
        });

        function updateThemeIcon(theme) {
            const icon = toggle.querySelector('.theme-icon');
            if (icon) {
                icon.className = theme === 'dark' ? 'fas fa-sun theme-icon' : 'fas fa-moon theme-icon';
            }
        }
    };

    // ==================== SCROLL TRIGGERED ANIMATIONS ====================
    const initScrollAnimations = () => {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    
                    // Add stagger effect to children
                    const children = entry.target.querySelectorAll('.stagger-item');
                    children.forEach((child, index) => {
                        child.style.animationDelay = `${index * 0.1}s`;
                    });
                }
            });
        }, observerOptions);

        // Observe elements that should animate on scroll
        const animatedElements = document.querySelectorAll('.wine-card, .region-item, .wine-item, .wine-card-sidebar');
        animatedElements.forEach(el => {
            el.classList.add('stagger-item');
            observer.observe(el);
        });
    };

    // ==================== SMOOTH HOVER ANIMATIONS ====================
    const initHoverAnimations = () => {
        // Add interactive-card class to cards
        const cards = document.querySelectorAll('.wine-card, .wine-card-sidebar, .region-item');
        cards.forEach(card => {
            card.classList.add('interactive-card');
        });

        // Add glass-card effect to info panels
        const infoPanels = document.querySelectorAll('.region-info, .wine-item.active');
        infoPanels.forEach(panel => {
            if (!panel.classList.contains('glass-card')) {
                panel.classList.add('glass-card');
            }
        });
    };

    // ==================== ENHANCED LOADING EXPERIENCE ====================
    const enhanceLoading = () => {
        const loadingOverlay = document.getElementById('loadingOverlay');
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/0a74f08c-2d10-4e11-a56f-9b5383ff1d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'modern-interactions.js:232',message:'enhanceLoading called',data:{overlayExists:!!loadingOverlay},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A1,A2'})}).catch(()=>{});
        // #endregion
        
        if (!loadingOverlay) return;

        // Simulate loading progress
        let progress = 0;
        const loadingMessage = document.getElementById('loadingMessage');
        
        // FIX: Slower loading animation to account for heavy images (6.2MB)
        const loadingInterval = setInterval(() => {
            progress += Math.random() * 8; // Reduced from 15 to 8
            
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/0a74f08c-2d10-4e11-a56f-9b5383ff1d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'modern-interactions.js:245',message:'Loading progress update',data:{progress:Math.floor(progress)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A1'})}).catch(()=>{});
            // #endregion
            
            // Don't go past 90% until images are actually loaded
            if (progress >= 90 && !document.fonts.ready) {
                progress = 90;
            }
            
            if (progress >= 100) {
                progress = 100;
                clearInterval(loadingInterval);
                
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/0a74f08c-2d10-4e11-a56f-9b5383ff1d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'modern-interactions.js:258',message:'Loading complete',data:{progress:100},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A1'})}).catch(()=>{});
                // #endregion
                
                if (loadingMessage) {
                    loadingMessage.textContent = 'Welcome';
                    loadingMessage.classList.add('is-welcome');
                }
                
                setTimeout(() => {
                    loadingOverlay.classList.add('is-hidden');
                    setTimeout(() => {
                        loadingOverlay.style.display = 'none';
                    }, 500);
                }, 800);
            }
            
            if (loadingMessage && progress < 100) {
                loadingMessage.textContent = `Loading ${Math.floor(progress)}%`;
            }
        }, 300); // Increased from 200ms to 300ms
    };

    // ==================== KEYBOARD NAVIGATION ====================
    const initKeyboardNav = () => {
        // ESC to close modals/overlays
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Close any open modals or overlays
                const activeOverlays = document.querySelectorAll('.wines-list-container[style*="display: block"]');
                activeOverlays.forEach(overlay => {
                    overlay.style.display = 'none';
                });
            }
        });

        // Tab navigation enhancement
        const focusableElements = document.querySelectorAll(
            'a, button, input, [tabindex]:not([tabindex="-1"])'
        );
        
        focusableElements.forEach(el => {
            el.addEventListener('focus', () => {
                el.style.outline = '2px solid var(--gold)';
                el.style.outlineOffset = '4px';
            });
            
            el.addEventListener('blur', () => {
                el.style.outline = '';
                el.style.outlineOffset = '';
            });
        });
    };

    // ==================== PERFORMANCE OPTIMIZATION ====================
    const optimizePerformance = () => {
        // Add will-change to animated elements on hover
        const animatedElements = document.querySelectorAll('.wine-card, .wine-card-sidebar, .region-item');
        
        animatedElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                el.style.willChange = 'transform, box-shadow';
            });
            
            el.addEventListener('mouseleave', () => {
                setTimeout(() => {
                    el.style.willChange = 'auto';
                }, 300);
            });
        });

        // Lazy load images
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            imageObserver.unobserve(img);
                        }
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    };

    // ==================== GLOW EFFECTS ====================
    const initGlowEffects = () => {
        // Add glow to special elements
        const glowElements = document.querySelectorAll('.wine-card-sidebar.active, .btn-filter:hover');
        
        glowElements.forEach(el => {
            if (!el.classList.contains('glow-gold')) {
                el.classList.add('glow-gold');
            }
        });

        // Dynamic glow on hover
        const cards = document.querySelectorAll('.wine-card-sidebar');
        cards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.classList.add('glow-gold');
            });
            
            card.addEventListener('mouseleave', function() {
                if (!this.classList.contains('active')) {
                    this.classList.remove('glow-gold');
                }
            });
        });
    };

    // ==================== TOUCH GESTURES (Mobile Only) ====================
    const initTouchGestures = () => {
        // Only enable touch gestures on touch devices
        if (!('ontouchstart' in window)) {
            return; // Skip on non-touch devices
        }
        
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;
        
        const minSwipeDistance = 50;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            handleSwipe();
        }, { passive: true });
        
        function handleSwipe() {
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            // Horizontal swipe detection
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (Math.abs(deltaX) > minSwipeDistance) {
                    if (deltaX > 0) {
                        // Swipe right
                        console.log('Swipe right detected');
                        document.dispatchEvent(new CustomEvent('swiperight'));
                    } else {
                        // Swipe left
                        console.log('Swipe left detected');
                        document.dispatchEvent(new CustomEvent('swipeleft'));
                    }
                }
            }
            // Vertical swipe detection
            else {
                if (Math.abs(deltaY) > minSwipeDistance) {
                    if (deltaY > 0) {
                        // Swipe down
                        document.dispatchEvent(new CustomEvent('swipedown'));
                    } else {
                        // Swipe up
                        document.dispatchEvent(new CustomEvent('swipeup'));
                    }
                }
            }
        }
        
        // Add visual feedback for touch
        const addTouchFeedback = () => {
            const touchableElements = document.querySelectorAll('button, a, .wine-card, .wine-card-sidebar, .btn-filter');
            
            touchableElements.forEach(el => {
                el.addEventListener('touchstart', function() {
                    this.style.opacity = '0.7';
                    this.style.transform = 'scale(0.98)';
                }, { passive: true });
                
                el.addEventListener('touchend', function() {
                    this.style.opacity = '1';
                    this.style.transform = 'scale(1)';
                }, { passive: true });
            });
        };
        
        addTouchFeedback();
    };

    // ==================== INITIALIZE ALL FEATURES ====================
    const init = () => {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        console.log('🎨 Initializing Awwwards-Level Interactions...');
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/0a74f08c-2d10-4e11-a56f-9b5383ff1d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'modern-interactions.js:370',message:'modern-interactions init started',data:{readyState:document.readyState},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B1'})}).catch(()=>{});
        // #endregion

        // Initialize all features
        try {
            initCustomCursor();
            initMagneticButtons();
            init3DTilt();
            initParallax();
            initDarkMode();
            initScrollAnimations();
            initHoverAnimations();
            enhanceLoading();
            initKeyboardNav();
            optimizePerformance();
            initGlowEffects();
            initTouchGestures(); // Mobile touch gestures

            console.log('✨ All modern interactions initialized successfully!');
            
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/0a74f08c-2d10-4e11-a56f-9b5383ff1d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'modern-interactions.js:389',message:'All interactions initialized successfully',data:{success:true},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B1'})}).catch(()=>{});
            // #endregion
        } catch (error) {
            console.error('Error initializing modern interactions:', error);
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/0a74f08c-2d10-4e11-a56f-9b5383ff1d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'modern-interactions.js:395',message:'ERROR in modern interactions init',data:{error:error.message||error.toString()},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B1'})}).catch(()=>{});
            // #endregion
        }

        // Re-initialize on dynamic content load
        const observer = new MutationObserver(() => {
            initMagneticButtons();
            init3DTilt();
            initScrollAnimations();
            initGlowEffects();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    };

    // Start initialization
    init();

})();

