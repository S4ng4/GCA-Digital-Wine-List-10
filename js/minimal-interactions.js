/* ========================================
   Minimal Interactions - Apple Style
   NO fancy animations, just clean UX
   ======================================== */

(function() {
    'use strict';

    // ==================== DARK MODE (Simple Toggle) ====================
    const initDarkMode = () => {
        const toggle = document.querySelector('.dark-mode-toggle');
        if (!toggle) return;

        // Check saved preference
        const currentTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', currentTheme);

        // Toggle on click
        toggle.addEventListener('click', () => {
            const theme = document.documentElement.getAttribute('data-theme');
            const newTheme = theme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    };

    // ==================== SMOOTH SCROLL ====================
    const initSmoothScroll = () => {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    };

    // ==================== SIMPLE LOADING ====================
    const handleLoading = () => {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (!loadingOverlay) return;

        // Hide loading after page load
        window.addEventListener('load', () => {
            setTimeout(() => {
                loadingOverlay.style.opacity = '0';
                setTimeout(() => {
                    loadingOverlay.style.display = 'none';
                }, 300);
            }, 500);
        });
    };

    // ==================== INITIALIZE ====================
    const init = () => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        console.log('✨ Minimal interactions initialized');

        // Initialize features
        initDarkMode();
        initSmoothScroll();
        handleLoading();
    };

    // Auto-initialize
    init();
})();

