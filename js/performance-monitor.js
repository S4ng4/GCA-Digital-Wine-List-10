/**
 * Performance Monitoring and Optimization
 * Ensures 60fps and optimal user experience
 */

(function() {
    'use strict';

    // ==================== FPS MONITOR ====================
    let fps = 0;
    let lastFrameTime = performance.now();
    let frameCount = 0;

    function measureFPS() {
        const now = performance.now();
        const delta = now - lastFrameTime;
        
        if (delta >= 1000) {
            fps = Math.round((frameCount * 1000) / delta);
            frameCount = 0;
            lastFrameTime = now;
            
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/0a74f08c-2d10-4e11-a56f-9b5383ff1d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'performance-monitor.js:21',message:'FPS measured',data:{fps:fps,isLowFps:fps<50},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B1,B2'})}).catch(()=>{});
            // #endregion
            
            // FIX: Only log FPS warnings occasionally to reduce console spam
            if (fps < 50 && Math.random() < 0.2) { // 20% chance to log
                console.warn(`⚠️ Low FPS detected: ${fps}fps`);
            }
        }
        
        frameCount++;
        requestAnimationFrame(measureFPS);
    }

    // Start FPS monitoring in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        measureFPS();
        
        // Display FPS counter
        const fpsCounter = document.createElement('div');
        fpsCounter.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            color: #0f0;
            padding: 8px 12px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            z-index: 99999;
        `;
        document.body.appendChild(fpsCounter);
        
        setInterval(() => {
            fpsCounter.textContent = `FPS: ${fps}`;
            fpsCounter.style.color = fps >= 55 ? '#0f0' : fps >= 30 ? '#ff0' : '#f00';
        }, 100);
    }

    // ==================== LAZY LOADING ====================
    function initLazyLoading() {
        if ('IntersectionObserver' in window) {
            const lazyImageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                        }
                        
                        if (img.dataset.srcset) {
                            img.srcset = img.dataset.srcset;
                            img.removeAttribute('data-srcset');
                        }
                        
                        img.classList.remove('lazy');
                        observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });

            document.querySelectorAll('img[data-src], img.lazy').forEach(img => {
                lazyImageObserver.observe(img);
            });
        }
    }

    // ==================== RESOURCE HINTS ====================
    function addResourceHints() {
        const hints = [
            { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
            { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true },
            { rel: 'dns-prefetch', href: 'https://unpkg.com' }
        ];

        hints.forEach(hint => {
            const link = document.createElement('link');
            link.rel = hint.rel;
            link.href = hint.href;
            if (hint.crossorigin) link.crossOrigin = 'anonymous';
            
            if (!document.querySelector(`link[rel="${hint.rel}"][href="${hint.href}"]`)) {
                document.head.appendChild(link);
            }
        });
    }

    // ==================== DEBOUNCE UTILITY ====================
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

    // ==================== THROTTLE UTILITY ====================
    function throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // ==================== OPTIMIZE SCROLL HANDLERS ====================
    function optimizeScrollHandlers() {
        // Replace all scroll handlers with throttled versions
        const scrollElements = document.querySelectorAll('[data-scroll-optimize]');
        
        scrollElements.forEach(el => {
            const handler = el.dataset.scrollOptimize;
            if (window[handler] && typeof window[handler] === 'function') {
                window.addEventListener('scroll', throttle(window[handler], 16), { passive: true });
            }
        });
    }

    // ==================== WILL-CHANGE OPTIMIZATION ====================
    function optimizeWillChange() {
        const hoverElements = document.querySelectorAll('.wine-card, .wine-card-sidebar, .interactive-card');
        
        hoverElements.forEach(el => {
            el.addEventListener('mouseenter', function() {
                this.style.willChange = 'transform, box-shadow';
            }, { passive: true });
            
            el.addEventListener('mouseleave', function() {
                setTimeout(() => {
                    this.style.willChange = 'auto';
                }, 300);
            }, { passive: true });
        });
    }

    // ==================== REDUCE REPAINTS ====================
    function reduceRepaints() {
        // Batch DOM reads and writes
        const elementsToAnimate = [];
        
        document.querySelectorAll('.stagger-item').forEach((el, index) => {
            elementsToAnimate.push({ el, index });
        });
        
        // Read phase
        const positions = elementsToAnimate.map(item => ({
            ...item,
            rect: item.el.getBoundingClientRect()
        }));
        
        // Write phase
        requestAnimationFrame(() => {
            positions.forEach(item => {
                item.el.style.animationDelay = `${item.index * 0.1}s`;
            });
        });
    }

    // ==================== CRITICAL CSS ====================
    function inlineCriticalCSS() {
        // Move critical above-the-fold CSS inline if needed
        const criticalStyles = `
            body { margin: 0; padding: 0; }
            .loading-overlay { 
                position: fixed; 
                inset: 0; 
                background: #0a0a0a; 
                z-index: 9999; 
            }
        `;
        
        const style = document.createElement('style');
        style.textContent = criticalStyles;
        
        if (!document.querySelector('style[data-critical]')) {
            style.setAttribute('data-critical', 'true');
            document.head.insertBefore(style, document.head.firstChild);
        }
    }

    // ==================== MEMORY LEAK PREVENTION ====================
    function preventMemoryLeaks() {
        // Clean up observers when page unloads
        window.addEventListener('beforeunload', () => {
            // Disconnect any observers
            if (window.mutationObserver) window.mutationObserver.disconnect();
            if (window.intersectionObserver) window.intersectionObserver.disconnect();
            
            // Remove event listeners
            document.removeEventListener('scroll', null);
            document.removeEventListener('resize', null);
        });
    }

    // ==================== IMAGE OPTIMIZATION ====================
    function optimizeImages() {
        const images = document.querySelectorAll('img:not([data-optimized])');
        
        images.forEach(img => {
            // Add loading="lazy" for native lazy loading (except above-the-fold images)
            if (!img.hasAttribute('loading') && !img.closest('.loading-overlay')) {
                img.setAttribute('loading', 'lazy');
            }
            
            // Add decoding="async" for non-blocking decode
            if (!img.hasAttribute('decoding')) {
                img.setAttribute('decoding', 'async');
            }
            
            // FIX: Add fetchpriority for critical images
            if (img.closest('.loading-overlay') || img.closest('nav')) {
                img.setAttribute('fetchpriority', 'high');
            }
            
            // Mark as optimized
            img.setAttribute('data-optimized', 'true');
        });
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/0a74f08c-2d10-4e11-a56f-9b5383ff1d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'performance-monitor.js:244',message:'Images optimized',data:{imageCount:images.length},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D1'})}).catch(()=>{});
        // #endregion
    }

    // ==================== FONT LOADING OPTIMIZATION ====================
    function optimizeFontLoading() {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/0a74f08c-2d10-4e11-a56f-9b5383ff1d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'performance-monitor.js:247',message:'optimizeFontLoading called',data:{fontsApiAvailable:'fonts' in document},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A2,C1'})}).catch(()=>{});
        // #endregion
        
        // FIX: Don't try to manually load fonts - they're already loaded via Google Fonts in HTML
        // The manual loading was causing 404 errors and slowing down the page
        // Just wait for fonts to be ready
        if ('fonts' in document && document.fonts.ready) {
            document.fonts.ready.then(() => {
                console.log('✅ All fonts loaded and ready');
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/0a74f08c-2d10-4e11-a56f-9b5383ff1d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'performance-monitor.js:255',message:'Fonts ready',data:{fontCount:document.fonts.size},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C1'})}).catch(()=>{});
                // #endregion
            });
        }
    }

    // ==================== BUNDLE SIZE ANALYZER ====================
    function analyzePageWeight() {
        if (window.performance && window.performance.getEntriesByType) {
            const resources = window.performance.getEntriesByType('resource');
            
            let totalSize = 0;
            const breakdown = {
                scripts: 0,
                styles: 0,
                images: 0,
                fonts: 0,
                other: 0
            };

            resources.forEach(resource => {
                const size = resource.transferSize || resource.encodedBodySize || 0;
                totalSize += size;

                if (resource.name.match(/\.js$/)) breakdown.scripts += size;
                else if (resource.name.match(/\.css$/)) breakdown.styles += size;
                else if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) breakdown.images += size;
                else if (resource.name.match(/\.(woff|woff2|ttf|eot)$/)) breakdown.fonts += size;
                else breakdown.other += size;
            });

            console.log('📦 Page Weight Analysis:');
            console.log(`Total: ${(totalSize / 1024).toFixed(2)} KB`);
            console.log(`Scripts: ${(breakdown.scripts / 1024).toFixed(2)} KB`);
            console.log(`Styles: ${(breakdown.styles / 1024).toFixed(2)} KB`);
            console.log(`Images: ${(breakdown.images / 1024).toFixed(2)} KB`);
            console.log(`Fonts: ${(breakdown.fonts / 1024).toFixed(2)} KB`);
            console.log(`Other: ${(breakdown.other / 1024).toFixed(2)} KB`);

            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/0a74f08c-2d10-4e11-a56f-9b5383ff1d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'performance-monitor.js:302',message:'Page weight analysis',data:{totalKB:(totalSize/1024).toFixed(2),imagesKB:(breakdown.images/1024).toFixed(2),exceeds3MB:totalSize>3000000},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A3,D1'})}).catch(()=>{});
            // #endregion

            if (totalSize > 3000000) { // 3MB
                console.warn('⚠️ Page weight exceeds 3MB. Consider optimization.');
            }
        }
    }

    // ==================== CORE WEB VITALS ====================
    function measureCoreWebVitals() {
        if ('PerformanceObserver' in window) {
            // Largest Contentful Paint (LCP)
            new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                console.log('🎨 LCP:', lastEntry.renderTime || lastEntry.loadTime);
            }).observe({ entryTypes: ['largest-contentful-paint'] });

            // First Input Delay (FID)
            new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    console.log('⚡ FID:', entry.processingStart - entry.startTime);
                });
            }).observe({ entryTypes: ['first-input'] });

            // Cumulative Layout Shift (CLS) - FIX: Throttle logging to reduce performance impact
            let clsScore = 0;
            let lastLogTime = 0;
            new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    if (!entry.hadRecentInput) {
                        clsScore += entry.value;
                    }
                });
                // Only log every 500ms instead of every shift
                const now = performance.now();
                if (now - lastLogTime > 500) {
                    console.log('📐 CLS:', clsScore.toFixed(4));
                    lastLogTime = now;
                }
            }).observe({ entryTypes: ['layout-shift'] });
        }
    }

    // ==================== INITIALIZE ALL OPTIMIZATIONS ====================
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        console.log('⚡ Initializing Performance Optimizations...');

        try {
            addResourceHints();
            initLazyLoading();
            optimizeScrollHandlers();
            optimizeWillChange();
            reduceRepaints();
            inlineCriticalCSS();
            preventMemoryLeaks();
            optimizeImages();
            optimizeFontLoading();

            // Analytics (development only)
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                setTimeout(() => {
                    analyzePageWeight();
                    measureCoreWebVitals();
                }, 2000);
            }

            console.log('✅ Performance optimizations applied successfully!');
        } catch (error) {
            console.error('❌ Error in performance optimizations:', error);
        }
    }

    // Make utilities globally available
    window.performanceUtils = {
        debounce,
        throttle
    };

    // Start initialization
    init();

})();

