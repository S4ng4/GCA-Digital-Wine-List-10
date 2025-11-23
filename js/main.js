// Gran Caffè L'Aquila - Digital Wine List JavaScript

// Get base path for GitHub Pages (automatically detects repo name)
function getBasePath() {
    // Get the pathname (e.g., "/GCA-Digital-Wine-List-10/" or "/")
    const pathname = window.location.pathname;
    
    // If we're at root (/), return empty string
    if (pathname === '/' || pathname === '/index.html') {
        return '';
    }
    
    // Extract repo name from pathname (e.g., "/GCA-Digital-Wine-List-10/" -> "/GCA-Digital-Wine-List-10")
    const match = pathname.match(/^\/([^\/]+)/);
    if (match && match[1] !== 'index.html') {
        return '/' + match[1];
    }
    
    return '';
}

// Helper function to get correct path for GitHub Pages
function getPath(relativePath) {
    const basePath = getBasePath();
    // Remove leading ./ if present
    const cleanPath = relativePath.replace(/^\.\//, '');
    // Ensure path starts with /
    const normalizedPath = cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath;
    return basePath + normalizedPath;
}

// Log base path for debugging
const BASE_PATH = getBasePath();
console.log('📍 Base Path:', BASE_PATH || '(root)');
console.log('📍 Wines JSON Path:', getPath('./data/wines.json'));

class WineListApp {
    constructor() {
        this.wines = [];
        this.filteredWines = [];
        this.currentView = 'grid';
        this.currentFilters = {
            type: null,
            region: null,
            search: ''
        };
        
        this.init();
    }

    async init() {
        try {
            await this.loadWineData();
            this.setupEventListeners();
            this.handleURLParameters();
            this.renderCurrentPage();
        } catch (error) {
            console.error('Error initializing wine list app:', error);
            this.showError('Failed to load wine data. Please refresh the page.');
        }
    }

    async loadWineData() {
        let winesPath;
        try {
            // Use getPath to ensure correct path for GitHub Pages
            winesPath = getPath('./data/wines.json');
            console.log('🍷 Loading wines from:', winesPath);
            
            // Add cache busting to avoid stale data
            const response = await fetch(winesPath + '?v=' + Date.now());
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // Filter out corrupted wines with invalid regions
            const validRegions = [
                'SICILIA', 'PIEMONTE', 'TOSCANA', 'VENETO', 'LOMBARDIA', 'EMILIA-ROMAGNA',
                'LAZIO', 'CAMPANIA', 'PUGLIA', 'CALABRIA', 'BASILICATA', 'MOLISE',
                'ABRUZZO', 'UMBRIA', 'LE MARCHE', 'FRIULI-VENEZIA GIULIA', 'FRIULI', 'TRENTINO ALTO-ADIGE',
                'VALLE D\'AOSTA', 'LIGURIA', 'SARDEGNA', 'TOSCANA (BOLGHERI)', 'LUGANA DOC (VENETO)',
                'TARANTO IGT (PUGLIA)', 'MATERA DOC (BASILICATA)'
            ];
            
            this.wines = (data.wines || []).filter(wine => {
                // Filter out wines with corrupted data
                const hasValidRegion = wine.region && validRegions.includes(wine.region);
                const hasValidName = wine.wine_name && wine.wine_name !== 'WINE NAME' && wine.wine_name !== 'WINE PRICE' && wine.wine_name !== 'VINTAGE';
                const hasValidProducer = wine.wine_producer && wine.wine_producer !== 'UNKNOWN PRODUCER';
                const hasValidPrice = (wine.wine_price && wine.wine_price !== '0') || 
                                     (wine.wine_price_bottle && wine.wine_price_bottle !== '0') ||
                                     (wine.wine_price_glass && wine.wine_price_glass !== '0');
                
                // Filter out sangria and cocktail wines
                const isNotSangriaOrCocktail = wine.wine_type && 
                    !wine.wine_type.toUpperCase().includes('SANGRIA') && 
                    !wine.wine_type.toUpperCase().includes('COCKTAIL');
                
                return hasValidRegion && hasValidName && hasValidProducer && hasValidPrice && isNotSangriaOrCocktail;
            });
            
        this.filteredWines = [...this.wines];
        console.log(`Loaded ${this.wines.length} valid wines (filtered out corrupted data)`);
        
        if (this.wines.length === 0) {
            this.showError('No wines found in database. Please check the data file.');
            return;
        }
        
        // Load wine images mapping
        await this.loadWineImages();
        
        // Debug: Log wine family distribution
        this.logWineFamilyDistribution();
        
        // General checkup
        this.performGeneralCheckup();
        
        // Test all regions
        this.testAllRegions();
        } catch (error) {
            console.error('❌ Error loading wine data:', error);
            console.error('📍 Attempted path:', winesPath);
            console.error('📍 Base path:', BASE_PATH);
            console.error('📍 Current URL:', window.location.href);
            
            // Show detailed error message
            const errorMsg = `Failed to load wine data: ${error.message}. ` +
                           `Path: ${winesPath}. ` +
                           `Please check the console for details.`;
            this.showError(errorMsg);
            
            // Fallback to empty array if data loading fails
            this.wines = [];
            this.filteredWines = [];
        }
    }

    async loadWineImages() {
        // Wine images mapping integrated directly in the code
        this.wineImages = {
            "LAMBRUSCO": "https://www.agraria.org/vini/lambrusco.jpg",
            "MONTEPULCIANO D'ABRUZZO": "https://www.agraria.org/vini/montepulciano-d-abruzzo.jpg",
            "CHIANTI CLASSICO": "https://www.agraria.org/vini/chianti-classico.jpg",
            "BAROLO": "https://www.agraria.org/vini/barolo.jpg",
            "BRUNELLO DI MONTALCINO": "https://www.agraria.org/vini/brunello-di-montalcino.jpg"
        };
        console.log(`Loaded ${Object.keys(this.wineImages).length} wine images`);
    }

    setupEventListeners() {
        // Search functionality
        const searchInputs = document.querySelectorAll('.luxury-search-input');
        searchInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                this.currentFilters.search = e.target.value.toLowerCase();
                if (this.getCurrentPage() === 'regions') {
                    this.filterRegions();
                } else if (this.getCurrentPage() === 'index') {
                    this.applyIndexSearch();
                } else {
                    this.applyFilters();
                }
            });
        });

        // Filter buttons
        const filterButtons = document.querySelectorAll('.luxury-filter-btn, .filter-button');
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.showFilterOptions(button);
            });
        });

        // Varietal select on wines page
        const varietalSelect = document.getElementById('varietalSelect');
        if (varietalSelect) {
            varietalSelect.addEventListener('change', (e) => {
                const value = e.target.value || '';
                this.currentFilters.varietal = value;
                if (this.getCurrentPage() === 'wines') {
                    this.applyFilters();
                }
            });
        }

        // View toggle
        const gridViewBtn = document.getElementById('gridViewBtn');
        const tableViewBtn = document.getElementById('tableViewBtn');
        
        if (gridViewBtn && tableViewBtn) {
            gridViewBtn.addEventListener('click', () => this.toggleView('grid'));
            tableViewBtn.addEventListener('click', () => this.toggleView('table'));
        }

        // Explore wine buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('explore-wine') || e.target.classList.contains('table-explore-btn')) {
                e.preventDefault();
                this.exploreWine(e.target);
            }
        });

        // Explore region buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('explore-region') || e.target.classList.contains('table-explore-region-btn')) {
                e.preventDefault();
                this.exploreRegion(e.target);
            }
        });

        // Set skipIntro when clicking logo or navigating to index
        document.addEventListener('click', (e) => {
            const anchor = e.target.closest('a');
            const logo = e.target.closest('.luxury-logo, .logo-image');
            if (anchor && anchor.getAttribute('href') && anchor.getAttribute('href').includes('index.html')) {
                try { sessionStorage.setItem('skipIntro', 'true'); } catch (_) {}
            }
            if (logo) {
                try { sessionStorage.setItem('skipIntro', 'true'); } catch (_) {}
            }
        });

        // Wine card hover effects
        this.setupHoverEffects();
    }

    handleURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const type = urlParams.get('type');
        const region = urlParams.get('region');
        const wineId = urlParams.get('id');
        const search = urlParams.get('search');

        if (type) {
            this.currentFilters.type = type;
        }
        if (region) {
            // Decode URL-encoded region names
            this.currentFilters.region = decodeURIComponent(region);
            console.log(`Region from URL: ${region} -> decoded: ${this.currentFilters.region}`);
        }
        if (search) {
            this.currentFilters.search = decodeURIComponent(search).toLowerCase();
        }
        if (wineId) {
            this.loadWineDetails(wineId);
        }
    }

    renderCurrentPage() {
        const currentPage = this.getCurrentPage();
        
        switch (currentPage) {
            case 'index':
                this.renderHomePage();
                // Check if we're returning from wine-details (back navigation)
                // This works for both back button clicks and browser back button
                const skipLoading = sessionStorage.getItem('skipHomeLoading') === 'true' || 
                                   performance.navigation?.type === 2 || // Back/forward navigation
                                   (performance.getEntriesByType('navigation')[0]?.type === 'back_forward');
                if (skipLoading) {
                    // Remove the flag and skip loading
                    sessionStorage.removeItem('skipHomeLoading');
                    // Hide overlay immediately if it exists
                    const overlay = document.getElementById('loadingOverlay');
                    if (overlay) {
                        overlay.classList.add('is-hidden');
                        setTimeout(() => {
                            overlay.remove();
                            document.body.dataset.overlayDone = 'true';
                        }, 100);
                    }
                    // Setup hero animation without loading
                    this.setupHomeHeroAnimation();
                } else {
                    this.setupHomeLoadingOverlay().then(() => {
                        this.setupHomeHeroAnimation();
                    });
                }
                break;
            case 'regions':
                this.renderRegionsPage();
                break;
            case 'wines':
                this.renderWinesPage();
                break;
            case 'wine-details':
                // Set flag to skip loading when returning to index
                sessionStorage.setItem('skipHomeLoading', 'true');
                this.renderWineDetailsPage();
                break;
        }
    }

    setupHomeLoadingOverlay() {
        return new Promise((resolve) => {
            const root = document.body;
            if (!root.classList.contains('home-page')) {
                resolve();
                return;
            }
            const overlay = document.getElementById('loadingOverlay');
            const messageEl = document.getElementById('loadingMessage');
            const ring = document.getElementById('ringProgress');
            const skipBtn = document.getElementById('skipLoadingBtn');
            if (!overlay) {
                resolve();
                return;
            }

            // Remove skip functionality entirely if present
            if (skipBtn) { try { skipBtn.remove(); } catch (_) {} }

            // Ensure gradient for ring
            const ensureGrad = () => {
                if (!ring) return;
                const svg = ring.closest('svg');
                if (!svg) return;
                let defs = svg.querySelector('defs');
                if (!defs) { defs = document.createElementNS('http://www.w3.org/2000/svg','defs'); svg.prepend(defs); }
                if (!svg.querySelector('#goldGrad')) {
                    const lg = document.createElementNS('http://www.w3.org/2000/svg','linearGradient');
                    lg.setAttribute('id','goldGrad'); lg.setAttribute('x1','0%'); lg.setAttribute('x2','100%');
                    const s1 = document.createElementNS('http://www.w3.org/2000/svg','stop'); s1.setAttribute('offset','0%'); s1.setAttribute('stop-color','#D4AF37');
                    const s2 = document.createElementNS('http://www.w3.org/2000/svg','stop'); s2.setAttribute('offset','100%'); s2.setAttribute('stop-color','#B8860B');
                    lg.appendChild(s1); lg.appendChild(s2); defs.appendChild(lg);
                    ring.setAttribute('stroke','url(#goldGrad)');
                }
            };
            ensureGrad();

            const durationSec = 4; // total ring animation time
            if (messageEl) messageEl.textContent = 'Loading…';

            const circumference = 2 * Math.PI * 54; // r=54
            const updateRing = (t) => {
                if (!ring) return;
                const ratio = 1 - (t / durationSec);
                const offset = circumference * ratio;
                ring.style.strokeDasharray = `${circumference}`;
                ring.style.strokeDashoffset = `${offset}`;
            };

            const start = performance.now();
            let raf;
            const animate = (now) => {
                const elapsed = (now - start) / 1000; // sec
                const t = Math.min(durationSec, elapsed);
                updateRing(t);
                if (t < durationSec) { raf = requestAnimationFrame(animate); }
            };
            raf = requestAnimationFrame(animate);

            // After ring completes, show Benvenuti then fade
            setTimeout(() => {
                if (messageEl) {
                    messageEl.textContent = 'Benvenuti';
                    messageEl.classList.add('is-welcome');
                }
                setTimeout(() => {
                    overlay.classList.add('is-hidden');
                    setTimeout(() => {
                        overlay.remove();
                        document.body.dataset.overlayDone = 'true';
                        resolve();
                    }, 500);
                }, 1000);
            }, durationSec * 1000);
        });
    }

    setupHomeHeroAnimation() {
        const root = document.body;
        if (!root.classList.contains('home-page')) return;
        // Respect reduced motion: reveal instantly without animations
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            root.classList.add('search-reveal', 'cards-revealed');
            return;
        }

        // If overlay just closed, reveal immediately with collapse; if intro skipped, reveal without collapsing hero
        try {
            if (root.dataset.overlayDone === 'true') {
                root.classList.add('search-reveal', 'cards-revealed');
                const input = document.querySelector('.luxury-search-input');
                if (input) {
                    try { input.focus({ preventScroll: true }); } catch (_) { input.focus(); }
                }
                return;
            }
        } catch (_) {}

        let cancelled = false;
        const cancel = () => {
            if (cancelled) return;
            cancelled = true;
            root.classList.add('search-reveal', 'cards-revealed');
        };
        ['scroll','keydown','mousemove','touchstart'].forEach(e => window.addEventListener(e, cancel, { once: true }));

        setTimeout(() => {
            if (cancelled) return;
            root.classList.add('search-reveal', 'cards-revealed');
            const input = document.querySelector('.luxury-search-input');
            if (input) {
                try { input.focus({ preventScroll: true }); } catch (_) { input.focus(); }
            }
        }, 4000);
    }

    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('regions')) return 'regions';
        if (path.includes('wines')) return 'wines';
        if (path.includes('wine-details')) return 'wine-details';
        return 'index';
    }

    renderHomePage() {
        // Update wine type cards with actual wine counts
        const wineTypes = ['ROSSO', 'BIANCO', 'ROSATO', 'ARANCIONE', 'BOLLICINE', 'NON ALCOLICO'];
        const wineCards = document.querySelectorAll('.luxury-wine-card');
        
        wineCards.forEach((card, index) => {
            if (wineTypes[index]) {
                const count = this.wines.filter(wine => this.wineMatchesFamily(wine, wineTypes[index])).length;
                const countElement = card.querySelector('.wine-count');
                if (countElement) {
                    countElement.textContent = `${count} wines`;
                }
            }
        });
        
        // Update breadcrumb for home page
        this.updateBreadcrumb('Home', 'Wine Collection');
    }

    renderRegionsPage() {
        const regionsContainer = document.querySelector('.regions-container');
        if (!regionsContainer) {
            console.error('Regions container not found');
            return;
        }

        // Update breadcrumb for regions page
        if (this.currentFilters.type) {
            const typeName = this.getWineTypeName(this.currentFilters.type);
            this.updateBreadcrumb('Home', `${typeName} Regions`);
        } else {
            this.updateBreadcrumb('Home', 'Wine Regions');
        }

        // Get all unique regions from wines (filtered by type if specified)
        let winesToUse = this.wines;
        if (this.currentFilters.type) {
            winesToUse = this.wines.filter(wine => this.wineMatchesFamily(wine, this.currentFilters.type));
        }
        
        // Get unique regions using normalized names to avoid duplicates
        const regionSet = new Set();
        winesToUse
            .filter(wine => wine.region && wine.region.trim() !== '')
            .forEach(wine => {
                const normalizedRegion = this.normalizeRegionName(wine.region);
                regionSet.add(normalizedRegion);
            });
        
        this.allRegions = [...regionSet].sort();

        console.log(`Found ${this.allRegions.length} regions for type: ${this.currentFilters.type || 'all'}`);

        // Update page title based on filter
        this.updatePageTitle();

        // Update breadcrumb
        this.updateBreadcrumb();

        // Render region cards
        this.filterRegions();
    }

    updatePageTitle() {
        const subtitles = document.querySelectorAll('.luxury-subtitle');
        if (subtitles.length >= 2) {
            // Keep the "present" subtitle as is
            // Update the second subtitle with the appropriate title
            if (this.currentFilters.type) {
                subtitles[1].textContent = `${this.getWineTypeName(this.currentFilters.type)} - REGIONS`;
            } else {
                subtitles[1].textContent = 'WINE REGIONS';
            }
        } else if (subtitles.length === 1) {
            // Fallback if only one subtitle exists
            const title = subtitles[0];
            if (this.currentFilters.type) {
                title.textContent = `${this.getWineTypeName(this.currentFilters.type)} - REGIONS`;
            } else {
                title.textContent = 'WINE REGIONS';
            }
        }
    }

    updateBreadcrumb(currentPage = 'Wine Collection', currentItem = null) {
        // Update desktop breadcrumb
        const breadcrumb = document.querySelector('.breadcrumb');
        const breadcrumbCurrent = document.getElementById('breadcrumbCurrent');
        
        // Update mobile breadcrumb
        const mobileBreadcrumb = document.querySelector('.mobile-breadcrumb');
        const mobileBreadcrumbCurrent = document.getElementById('mobileBreadcrumbCurrent');
        
        if (breadcrumbCurrent) {
            if (currentItem) {
                breadcrumbCurrent.textContent = currentItem;
            } else {
                breadcrumbCurrent.textContent = currentPage;
            }
        }
        
        if (mobileBreadcrumbCurrent) {
            if (currentItem) {
                mobileBreadcrumbCurrent.textContent = currentItem;
            } else {
                mobileBreadcrumbCurrent.textContent = currentPage;
            }
        }
        
        if (breadcrumb) {
            if (this.currentFilters.type) {
                const typeName = this.getWineTypeName(this.currentFilters.type);
                breadcrumb.innerHTML = `
                    <a href="index.html">Home</a>
                    <span class="breadcrumb-separator">/</span>
                    <span class="breadcrumb-current">${typeName} Regions</span>
                `;
                
                if (mobileBreadcrumbCurrent) {
                    mobileBreadcrumbCurrent.textContent = `${typeName} Regions`;
                }
            } else {
                breadcrumb.innerHTML = `
                    <a href="index.html">Home</a>
                    <span class="breadcrumb-separator">/</span>
                    <span class="breadcrumb-current">Wine Regions</span>
                `;
                
                if (mobileBreadcrumbCurrent) {
                    mobileBreadcrumbCurrent.textContent = 'Wine Regions';
                }
            }
        }
    }

    filterRegions() {
        const regionsGrid = document.querySelector('.regions-grid');
        if (!regionsGrid || !this.allRegions) return;

        const filteredRegions = this.allRegions.filter(region => 
            !this.currentFilters.search || region.toLowerCase().includes(this.currentFilters.search)
        );

        regionsGrid.innerHTML = filteredRegions.map(region => {
            // Count wines in this region, considering wine type filter if active
            // Use normalized region comparison for accurate counting
            let count = this.wines.filter(wine => {
                const normalizedWineRegion = this.normalizeRegionName(wine.region);
                const normalizedFilterRegion = this.normalizeRegionName(region);
                return normalizedWineRegion === normalizedFilterRegion;
            }).length;
            
            if (this.currentFilters.type) {
                count = this.wines.filter(wine => {
                    const normalizedWineRegion = this.normalizeRegionName(wine.region);
                    const normalizedFilterRegion = this.normalizeRegionName(region);
                    return normalizedWineRegion === normalizedFilterRegion && this.wineMatchesFamily(wine, this.currentFilters.type);
                }).length;
            }
            
            const icon = this.getRegionIcon(region);
            const normalizedRegion = this.normalizeRegionName(region);
            
            // Add type parameter to URL if filtering by wine type
            // Navigate to index.html with region and type filters
            let url = `index.html?region=${encodeURIComponent(normalizedRegion)}`;
            if (this.currentFilters.type) {
                url += `&type=${encodeURIComponent(this.currentFilters.type)}`;
            }
            
            return `
                <a href="${url}" class="region-card">
                    <div class="region-icon">
                        <i class="${icon}"></i>
                    </div>
                    <h3 class="region-title">${normalizedRegion}</h3>
                    <p class="wine-count">${count} wines</p>
                </a>
            `;
        }).join('');

        // Also render the table view
        this.renderRegionsTable(filteredRegions);
        
        // Update regions count
        this.updateRegionsCount(filteredRegions.length);
    }

    renderRegionsTable(regions) {
        const regionsTable = document.getElementById('regionsTable');
        if (!regionsTable) return;

        const tbody = regionsTable.querySelector('tbody');
        if (!tbody) return;

        tbody.innerHTML = regions.map(region => {
            // Count wines in this region, considering wine type filter if active
            // Use normalized region comparison for accurate counting
            let count = this.wines.filter(wine => {
                const normalizedWineRegion = this.normalizeRegionName(wine.region);
                const normalizedFilterRegion = this.normalizeRegionName(region);
                return normalizedWineRegion === normalizedFilterRegion;
            }).length;
            
            if (this.currentFilters.type) {
                count = this.wines.filter(wine => {
                    const normalizedWineRegion = this.normalizeRegionName(wine.region);
                    const normalizedFilterRegion = this.normalizeRegionName(region);
                    return normalizedWineRegion === normalizedFilterRegion && this.wineMatchesFamily(wine, this.currentFilters.type);
                }).length;
            }
            
            const normalizedRegion = this.normalizeRegionName(region);
            const description = this.getRegionDescription(region);
            
            // Add type parameter to URL if filtering by wine type
            // Navigate to index.html with region and type filters
            let url = `index.html?region=${encodeURIComponent(normalizedRegion)}`;
            if (this.currentFilters.type) {
                url += `&type=${encodeURIComponent(this.currentFilters.type)}`;
            }
            
            return `
                <tr>
                    <td class="table-region-name">${normalizedRegion}</td>
                    <td class="table-region-count">${count} wines</td>
                    <td class="table-region-description">${description}</td>
                    <td><a href="${url}" class="table-explore-region-btn">Explore</a></td>
                </tr>
            `;
        }).join('');
    }

    updateRegionsCount(count) {
        const regionsCount = document.querySelector('.regions-count');
        if (regionsCount) {
            regionsCount.textContent = `${count} regions`;
        }
    }

    getRegionDescription(region) {
        // Add some basic descriptions for major regions
        const descriptions = {
            'TOSCANA': 'Famous for Chianti and Brunello wines',
            'PIEMONTE': 'Home of Barolo and Barbaresco',
            'VENETO': 'Known for Amarone and Prosecco',
            'SICILIA': 'Mediterranean climate, diverse terroir',
            'LOMBARDIA': 'Northern region with Alpine influences',
            'EMILIA-ROMAGNA': 'Rich culinary tradition, Lambrusco',
            'LAZIO': 'Central Italy, Frascati and Est! Est!! Est!!!',
            'CAMPANIA': 'Ancient winemaking traditions',
            'PUGLIA': 'Southern Italy, Primitivo and Negroamaro',
            'SARDEGNA': 'Island wines with unique character'
        };
        
        return descriptions[region] || 'Explore the wines of this region';
    }

    renderWinesPage() {
        if (!this.currentFilters.region) {
            console.error('No region specified for wines page');
            return;
        }

        console.log(`Rendering wines page for region: ${this.currentFilters.region}, type: ${this.currentFilters.type || 'all'}`);

        // Filter wines by region (and type if specified) and search if present
        this.filteredWines = this.wines.filter(wine => {
            // Use normalized region comparison to handle variations
            const normalizedWineRegion = this.normalizeRegionName(wine.region);
            const normalizedFilterRegion = this.normalizeRegionName(this.currentFilters.region);
            
            const matchesRegion = normalizedWineRegion === normalizedFilterRegion;
            const matchesType = !this.currentFilters.type || this.wineMatchesFamily(wine, this.currentFilters.type);
            const matchesSearch = !this.currentFilters.search || (
                (wine.wine_name && wine.wine_name.toLowerCase().includes(this.currentFilters.search)) ||
                (wine.region && wine.region.toLowerCase().includes(this.currentFilters.search)) ||
                (wine.varietals && wine.varietals.toLowerCase().includes(this.currentFilters.search)) ||
                (wine.wine_producer && wine.wine_producer.toLowerCase().includes(this.currentFilters.search))
            );
            
            return matchesRegion && matchesType && matchesSearch;
        });

        console.log(`Found ${this.filteredWines.length} wines for ${this.currentFilters.region}`);

        // Add wine type badge if filtering by type
        if (this.currentFilters.type) {
            const header = document.querySelector('.luxury-header');
            if (header) {
                this.addWineTypeBadge(this.currentFilters.type, header);
            }
        }

        // Update page title
        this.updateWinesPageTitle();

        // Update HTML page title
        this.updateHTMLPageTitle();

        // Update section title
        this.updateWinesSectionTitle();

        // Update wine count
        const countElement = document.querySelector('.wines-count');
        if (countElement) {
            countElement.textContent = `${this.filteredWines.length} wines`;
        }

        // Update breadcrumb
        this.updateWinesBreadcrumb();

        // Populate varietal dropdown based on current region (and type if present)
        this.populateVarietalSelect();

        // Render wines
        this.renderWines();
    }

    populateVarietalSelect() {
        const select = document.getElementById('varietalSelect');
        if (!select) return;
        // Build varietal set scoped to region and type
        const regionNorm = this.currentFilters.region ? this.normalizeRegionName(this.currentFilters.region) : null;
        const varietalSet = new Set();
        this.wines.forEach(w => {
            if (!w.varietals || !w.varietals.trim()) return;
            if (regionNorm && this.normalizeRegionName(w.region) !== regionNorm) return;
            if (this.currentFilters.type && !this.wineMatchesFamily(w, this.currentFilters.type)) return;
            varietalSet.add(w.varietals);
        });
        const varietals = Array.from(varietalSet).sort();
        select.innerHTML = '<option value="">All Grapes</option>' +
            varietals.map(v => `<option value="${v}">${v}</option>`).join('');
        // Preserve current selection if present
        if (this.currentFilters.varietal) {
            select.value = this.currentFilters.varietal;
        }
    }

    updateWinesPageTitle() {
        const subtitles = document.querySelectorAll('.luxury-subtitle');
        if (subtitles.length >= 2) {
            // Keep the "present" subtitle as is
            // Update the second subtitle with the appropriate title
            if (this.currentFilters.type) {
                subtitles[1].textContent = `${this.currentFilters.region} ${this.getWineTypeName(this.currentFilters.type)}`;
            } else {
                subtitles[1].textContent = `${this.currentFilters.region} WINES`;
            }
        } else if (subtitles.length === 1) {
            // Fallback if only one subtitle exists
            const title = subtitles[0];
            if (this.currentFilters.type) {
                title.textContent = `${this.currentFilters.region} ${this.getWineTypeName(this.currentFilters.type)}`;
            } else {
                title.textContent = `${this.currentFilters.region} WINES`;
            }
        }
    }

    updateHTMLPageTitle() {
        // Update the HTML page title
        let pageTitle = `${this.currentFilters.region} Wines`;
        if (this.currentFilters.type) {
            const typeName = this.getWineTypeName(this.currentFilters.type);
            pageTitle = `${this.currentFilters.region} ${typeName}`;
        }
        document.title = `${pageTitle} - Gran Caffè L'Aquila`;
    }

    updateWinesSectionTitle() {
        // Update the wines section title
        const winesTitle = document.querySelector('.wines-title');
        if (winesTitle) {
            let sectionTitle = `${this.currentFilters.region} SELECTION`;
            if (this.currentFilters.type) {
                const typeName = this.getWineTypeName(this.currentFilters.type);
                sectionTitle = `${this.currentFilters.region} ${typeName.toUpperCase()}`;
            }
            winesTitle.textContent = sectionTitle;
        }
    }

    updateWinesBreadcrumb() {
        const breadcrumb = document.querySelector('.breadcrumb');
        if (breadcrumb) {
            // Navigate to index.html with type filter
            let regionUrl = 'index.html';
            if (this.currentFilters.type) {
                regionUrl += `?type=${encodeURIComponent(this.currentFilters.type)}`;
            }
            
            breadcrumb.innerHTML = `
                <a href="index.html">Home</a>
                <span class="breadcrumb-separator">/</span>
                <a href="${regionUrl}">Wine Regions</a>
                <span class="breadcrumb-separator">/</span>
                <span class="breadcrumb-current">${this.currentFilters.region}</span>
            `;
        }
        
        // Update mobile breadcrumb
        if (mobileBreadcrumbCurrent) {
            mobileBreadcrumbCurrent.textContent = this.currentFilters.region;
        }
    }

    renderWines() {
        const winesGrid = document.getElementById('winesGrid');
        const wineTable = document.getElementById('wineTable');
        
        console.log(`Rendering ${this.filteredWines.length} wines`);
        
        if (winesGrid) {
            winesGrid.innerHTML = this.filteredWines.map(wine => this.createWineCard(wine)).join('');
            console.log(`Updated wines grid with ${this.filteredWines.length} cards`);
        }
        
        if (wineTable) {
            const tbody = wineTable.querySelector('tbody');
            if (tbody) {
                tbody.innerHTML = this.filteredWines.map(wine => this.createWineTableRow(wine)).join('');
                console.log(`Updated wines table with ${this.filteredWines.length} rows`);
            }
        }
    }

    createWineCard(wine) {
        const wineFamily = this.getWineFamily(wine.wine_type);
        
        const wineTypeNames = {
            'ROSSO': 'Red',
            'BIANCO': 'White',
            'ROSATO': 'Rosé',
            'ARANCIONE': 'Orange',
            'BOLLICINE': 'Sparkling',
            'NON ALCOLICO': 'Non-Alcoholic'
        };

        const wineFamilyClasses = {
            'ROSSO': 'wine-family-rosso',
            'BIANCO': 'wine-family-bianco',
            'ROSATO': 'wine-family-rosato',
            'ARANCIONE': 'wine-family-arancione',
            'BOLLICINE': 'wine-family-bollicine',
            'NON ALCOLICO': 'wine-family-nonalco'
        };

        const wineImageUrl = this.findWineImage(wine);
        const backgroundImageStyle = wineImageUrl ? `background-image: url('${wineImageUrl}'); background-size: cover; background-position: center; background-repeat: no-repeat;` : '';
        
        return `
            <div class="wine-card" style="${backgroundImageStyle}">
                <div class="wine-header">
                    <h3 class="wine-name">${wine.wine_name}</h3>
                    <div class="wine-price">$${wine.wine_price || wine.wine_price_bottle || wine.wine_price_glass || 'N/A'}</div>
                </div>
                <div class="wine-details">
                    <p class="wine-producer">${wine.wine_producer || 'Producer not specified'}</p>
                    <p class="wine-region">${wine.region}</p>
                    <p class="wine-grape">${wine.varietals || 'N/A'}</p>
                    <p class="wine-description">${wine.wine_description || 'A fine wine selection.'}</p>
                </div>
                <div class="wine-actions">
                    <span class="wine-year">${this.extractYear(wine.wine_vintage)}</span>
                    <span class="wine-family-indicator ${wineFamilyClasses[wineFamily] || 'wine-family-rosso'}">${wineTypeNames[wineFamily] || 'Wine'}</span>
                    <a href="wine-details.html?id=${wine.wine_number}${this.currentFilters.type ? '&type=' + encodeURIComponent(this.currentFilters.type) : ''}" class="explore-wine">Explore Wine</a>
                </div>
            </div>
        `;
    }

    createWineTableRow(wine) {
        return `
            <tr>
                <td class="table-wine-name">${wine.wine_name}</td>
                <td class="table-wine-producer">${wine.wine_producer || 'Producer not specified'}</td>
                <td class="table-wine-region">${wine.region}</td>
                <td>${wine.varietals || 'N/A'}</td>
                <td>${this.extractYear(wine.wine_vintage)}</td>
                <td class="table-wine-price">$${wine.wine_price || wine.wine_price_bottle || wine.wine_price_glass || 'N/A'}</td>
                <td><a href="wine-details.html?id=${wine.wine_number}${this.currentFilters.type ? '&type=' + encodeURIComponent(this.currentFilters.type) : ''}" class="table-explore-btn">Explore</a></td>
            </tr>
        `;
    }

    renderWineDetailsPage() {
        const urlParams = new URLSearchParams(window.location.search);
        const wineId = urlParams.get('id');
        
        if (wineId) {
            this.loadWineDetails(wineId);
        }
    }

    loadWineDetails(wineId) {
        // Try to find wine by wine_number (string or number comparison)
        const wine = this.wines.find(w => 
            w.wine_number === wineId || 
            w.wine_number === String(wineId) || 
            String(w.wine_number) === String(wineId)
        );
        
        if (!wine) {
            console.error(`Wine not found with ID: ${wineId}`);
            this.showError('Wine not found');
            return;
        }

        // Update wine details
        this.updateWineDetails(wine);
    }

    updateWineDetails(wine) {
        if (!wine) {
            console.error('Cannot update wine details: wine is null or undefined');
            this.showError('Wine data is invalid');
            return;
        }

        // Removed wine family indicator from wine details page per request

        // Add wine type badge to header
        const header = document.querySelector('.luxury-header');
        if (header) {
            this.addWineTypeBadge(wine.wine_type, header);
        }

        // Update wine name
        const wineName = document.getElementById('wineName');
        if (wineName) {
            wineName.textContent = wine.wine_name || 'Unknown Wine';
        }

        // Mobile footer removed - price is shown in wine-meta section

        // Update page title
        if (wine.wine_name) {
            document.title = `${wine.wine_name} - Gran Caffè L'Aquila`;
        }

        // Update meta information
        this.updateMetaInfo(wine);

        // Update wine description
        this.updateWineDescription(wine);

        // Update wine image
        this.updateWineImage(wine);

        // Update tasting notes
        this.updateTastingNotes(wine);

        // Update wine information
        this.updateWineInformation(wine);

        // Update food pairings
        this.updateFoodPairings(wine);

        // Update producer information
        this.updateProducerInfo(wine);

        // Update breadcrumb
        this.updateBreadcrumb(wine);

        // Update back button
        this.updateBackButton(wine);
    }

    updateMetaInfo(wine) {
        // Show key information: Price, Producer, Region, and essential details
        const vintage = this.extractYear(wine.wine_vintage) || 'N/A';
        const displayPrice = wine.wine_price || wine.wine_price_bottle || wine.wine_price_glass || 'N/A';
        
        const metaItems = [
            { label: 'Price', value: displayPrice !== 'N/A' ? `$${displayPrice}` : 'N/A', show: true },
            { label: 'Producer', value: wine.wine_producer || 'N/A', show: true },
            { label: 'Region', value: wine.region || 'N/A', show: true },
            { label: 'Vintage', value: vintage, show: true },
            { label: 'Grape Variety', value: wine.varietals || 'N/A', show: !!wine.varietals },
            { label: 'Alcohol', value: wine.alcohol || 'N/A', show: !!wine.alcohol }
        ].filter(item => item.show);

        const metaContainer = document.getElementById('wineMeta');
        if (metaContainer) {
            if (metaItems.length > 0) {
                metaContainer.innerHTML = metaItems.map(item => `
                    <div class="meta-item">
                        <span class="meta-label">${item.label}</span>
                        <span class="meta-value">${item.value}</span>
                    </div>
                `).join('');
            } else {
                metaContainer.innerHTML = '<div class="meta-item"><span class="meta-label">Information</span><span class="meta-value">Details coming soon</span></div>';
            }
        }
    }

    updateWineDescription(wine) {
        const descriptionContainer = document.getElementById('wineDescription');
        if (descriptionContainer) {
            const description = wine.wine_description || wine.wine_description_short || 'A fine wine selection from our curated collection.';
            if (description && description.trim()) {
                descriptionContainer.innerHTML = `<p>${description}</p>`;
                descriptionContainer.style.display = 'block';
            } else {
                descriptionContainer.style.display = 'none';
            }
        }
    }

    updateWineImage(wine) {
        const wineBottleIcon = document.getElementById('wineBottleIcon');
        const wineBottleImage = document.getElementById('wineBottleImage');
        
        if (!wineBottleIcon || !wineBottleImage) return;
        
        // Try to find a matching image for this wine
        const wineImageUrl = this.findWineImage(wine);
        
        if (wineImageUrl) {
            // Show image and hide icon
            wineBottleImage.src = wineImageUrl;
            wineBottleImage.style.display = 'block';
            wineBottleIcon.style.display = 'none';
            
            // Add error handling for image loading
            wineBottleImage.onerror = () => {
                console.log('Failed to load wine image, falling back to icon');
                wineBottleImage.style.display = 'none';
                wineBottleIcon.style.display = 'block';
            };
        } else {
            // No image found, show icon
            wineBottleImage.style.display = 'none';
            wineBottleIcon.style.display = 'block';
        }
    }

    findWineImage(wine) {
        if (!this.wineImages) return null;
        
        console.log(`Looking for image for wine: ${wine.wine_name} by ${wine.wine_producer}`);
        
        // Try exact match first
        if (this.wineImages[wine.wine_name]) {
            console.log(`Found exact match for wine name: ${wine.wine_name}`);
            return this.wineImages[wine.wine_name];
        }
        
        // Try matching by producer (clean up producer name)
        if (wine.wine_producer) {
            const producerName = wine.wine_producer.replace(/[*]/g, '').trim();
            if (this.wineImages[producerName]) {
                console.log(`Found match for producer: ${producerName}`);
                return this.wineImages[producerName];
            }
        }
        
        // Try partial matches for wine name (more flexible)
        for (const [wineName, imageUrl] of Object.entries(this.wineImages)) {
            const wineNameLower = wine.wine_name.toLowerCase();
            const mappingNameLower = wineName.toLowerCase();
            
            // Check if wine name is contained in mapping name or vice versa
            if (mappingNameLower.includes(wineNameLower) || wineNameLower.includes(mappingNameLower)) {
                console.log(`Found partial match for wine name: ${wine.wine_name} -> ${wineName}`);
                return imageUrl;
            }
        }
        
        // Try partial matches for producer (more flexible)
        if (wine.wine_producer) {
            const producerName = wine.wine_producer.replace(/[*]/g, '').trim();
            const producerNameLower = producerName.toLowerCase();
            
            for (const [wineName, imageUrl] of Object.entries(this.wineImages)) {
                const mappingNameLower = wineName.toLowerCase();
                
                // Check if producer name is contained in mapping name or vice versa
                if (mappingNameLower.includes(producerNameLower) || producerNameLower.includes(mappingNameLower)) {
                    console.log(`Found partial match for producer: ${producerName} -> ${wineName}`);
                    return imageUrl;
                }
            }
        }
        
        // Try matching by key words in wine name
        const wineNameWords = wine.wine_name.toLowerCase().split(' ');
        for (const [wineName, imageUrl] of Object.entries(this.wineImages)) {
            const mappingNameLower = wineName.toLowerCase();
            
            // Check if any word from wine name appears in mapping name
            for (const word of wineNameWords) {
                if (word.length > 2 && mappingNameLower.includes(word)) {
                    console.log(`Found keyword match: ${word} in ${wineName}`);
                    return imageUrl;
                }
            }
        }
        
        console.log(`No image found for wine: ${wine.wine_name}`);
        return null;
    }

    updateTastingNotes(wine) {
        const tastingNotes = document.getElementById('tastingNotes');
        const tastingGrid = document.getElementById('tastingGrid');
        
        if (tastingNotes && tastingGrid) {
            // Check if we have detailed tasting notes in the wine data
            if (wine.tasting_notes && Array.isArray(wine.tasting_notes) && wine.tasting_notes.length > 0) {
                // Use existing tasting notes if available
                tastingGrid.innerHTML = wine.tasting_notes.map(note => `
                    <div class="tasting-category">
                        <span class="tasting-label">${note.label || 'Note'}</span>
                        <span class="tasting-value">${note.value || 'N/A'}</span>
                    </div>
                `).join('');
                tastingNotes.style.display = 'block';
            } else {
                // Generate elegant fallback message
                const elegantMessage = `
                    <div class="tasting-category elegant-message">
                        <span class="tasting-label">Organoleptic Profile</span>
                        <span class="tasting-value">Our expert sommelier team is currently crafting a detailed organoleptic profile for this exceptional wine. We are carefully analyzing its complex aromas, flavors, and characteristics to provide you with the most comprehensive tasting notes. Please check back soon for our detailed sensory analysis.</span>
                    </div>
                `;
                tastingGrid.innerHTML = elegantMessage;
                tastingNotes.style.display = 'block';
            }
        } else if (tastingNotes) {
            tastingNotes.style.display = 'none';
        }
    }

    updateWineInformation(wine) {
        const infoGrid = document.getElementById('infoGrid');
        if (infoGrid) {
            const vintage = this.extractYear(wine.wine_vintage) || (wine.wine_vintage || 'N/A');
            
            // Remove duplicates: Price, Producer, and Region are shown in wine-meta section
            const infoItems = [
                { label: 'Grape Variety', value: wine.varietals || 'N/A', icon: 'fas fa-seedling', show: !!wine.varietals },
                { label: 'Vintage', value: vintage, icon: 'fas fa-calendar', show: true },
                { label: 'Alcohol', value: wine.alcohol || 'N/A', icon: 'fas fa-percent', show: !!wine.alcohol },
                { label: 'Wine Type', value: this.getWineTypeName(wine.wine_type) || 'N/A', icon: 'fas fa-wine-glass', show: true },
                { label: 'Aging', value: wine.aging || 'N/A', icon: 'fas fa-hourglass-half', show: !!wine.aging },
                { label: 'Soil', value: wine.soil || 'N/A', icon: 'fas fa-mountain', show: !!wine.soil },
                { label: 'Elevation', value: wine.elevation || 'N/A', icon: 'fas fa-mountain', show: !!wine.elevation },
                { label: 'Organic', value: wine.organic ? 'Certified Organic' : (wine.organic === false ? 'Conventional' : 'N/A'), icon: 'fas fa-leaf', show: wine.organic !== undefined }
            ].filter(item => item.show);

            if (infoItems.length > 0) {
                infoGrid.innerHTML = infoItems.map(item => `
                    <div class="info-item">
                        <div class="info-head"><i class="${item.icon} info-icon elegant"></i><span class="info-label">${item.label}</span></div>
                        <div class="info-value">${item.value}</div>
                    </div>
                `).join('');
            } else {
                infoGrid.innerHTML = '<div class="info-item"><div class="info-head"><i class="fas fa-info-circle info-icon elegant"></i><span class="info-label">Information</span></div><div class="info-value">Details coming soon</div></div>';
            }
        }
    }

    updateFoodPairings(wine) {
        const pairingList = document.getElementById('pairingList');
        if (pairingList) {
            // Generate food pairings based on wine type
            const pairings = this.getFoodPairings(wine);
            pairingList.innerHTML = pairings.map(pairing => `
                <div class="pairing-item">
                    <i class="${pairing.icon} pairing-icon"></i>
                    <h3 class="pairing-name">${pairing.name}</h3>
                </div>
            `).join('');
        }
    }

    getFoodPairings(wine) {
        const pairings = {
            'ROSSO': [
                { name: 'Roasted Meats', icon: 'fas fa-drumstick-bite' },
                { name: 'Aged Cheeses', icon: 'fas fa-cheese' },
                { name: 'Pasta with Red Sauce', icon: 'fas fa-utensils' },
                { name: 'Dark Chocolate', icon: 'fas fa-cookie-bite' }
            ],
            'BIANCO': [
                { name: 'Seafood', icon: 'fas fa-fish' },
                { name: 'Light Pasta', icon: 'fas fa-utensils' },
                { name: 'Fresh Salads', icon: 'fas fa-leaf' },
                { name: 'Soft Cheeses', icon: 'fas fa-cheese' }
            ],
            'ROSATO': [
                { name: 'Grilled Fish', icon: 'fas fa-fish' },
                { name: 'Light Appetizers', icon: 'fas fa-cookie-bite' },
                { name: 'Summer Salads', icon: 'fas fa-leaf' },
                { name: 'Fresh Fruits', icon: 'fas fa-apple-alt' }
            ],
            'ARANCIONE': [
                { name: 'Aged Cheeses', icon: 'fas fa-cheese' },
                { name: 'Spiced Dishes', icon: 'fas fa-pepper-hot' },
                { name: 'Roasted Vegetables', icon: 'fas fa-carrot' },
                { name: 'Cured Meats', icon: 'fas fa-bacon' }
            ],
            'BOLLICINE': [
                { name: 'Appetizers', icon: 'fas fa-cookie-bite' },
                { name: 'Celebration Foods', icon: 'fas fa-birthday-cake' },
                { name: 'Light Desserts', icon: 'fas fa-ice-cream' },
                { name: 'Fresh Oysters', icon: 'fas fa-fish' }
            ],
            'NON ALCOLICO': [
                { name: 'Fruit Platters', icon: 'fas fa-apple-alt' },
                { name: 'Light Appetizers', icon: 'fas fa-cookie-bite' },
                { name: 'Salads', icon: 'fas fa-leaf' },
                { name: 'Desserts', icon: 'fas fa-ice-cream' }
            ]
        };
        return pairings[wine.wine_type] || pairings['ROSSO'];
    }

    updateProducerInfo(wine) {
        const producerInfo = document.getElementById('producerInfo');
        const producerName = document.getElementById('producerName');
        const producerDescription = document.getElementById('producerDescription');
        
        if (producerInfo) {
            if (wine.wine_producer && wine.wine_producer.trim()) {
                producerInfo.style.display = 'block';
                
                if (producerName) {
                    producerName.textContent = wine.wine_producer;
                }
                
                if (producerDescription) {
                    const description = this.getProducerDescription(wine);
                    producerDescription.textContent = description;
                }
            } else {
                producerInfo.style.display = 'none';
            }
        }
    }

    getProducerDescription(wine) {
        // Generate a description based on the wine data
        const region = wine.region || 'this region';
        const wineType = this.getWineTypeName(wine.wine_type);
        const organic = wine.organic ? ' This wine is produced using organic methods.' : '';
        
        return `This ${wineType.toLowerCase()} is crafted in ${region}, showcasing the unique terroir and winemaking traditions of the area.${organic} The producer focuses on quality and authenticity, bringing you an exceptional wine experience.`;
    }

    updateBackButton(wine) {
        const backButton = document.getElementById('backButton');
        const backButtonText = document.getElementById('backButtonText');
        
        if (backButton) {
            // Always return to index.html (wines.html and regions.html are no longer needed)
            const urlParams = new URLSearchParams(window.location.search);
            const type = urlParams.get('type');
            
            // Return to index.html with region and type filters
            let backUrl = `index.html`;
            const params = new URLSearchParams();
            
            if (wine.region) {
                params.set('region', wine.region);
            }
            if (type) {
                params.set('type', type);
            }
            
            if (params.toString()) {
                backUrl += `?${params.toString()}`;
            }
            
            backButton.href = backUrl;
            
            // Update button text if element exists
            if (backButtonText) {
                if (wine.region) {
                    if (type) {
                        const wineFamily = this.getWineFamily(wine.wine_type);
                        const typeName = this.getWineTypeName(wineFamily);
                        backButtonText.textContent = `Back to ${wine.region} ${typeName}`;
                    } else {
                        backButtonText.textContent = `Back to ${wine.region} Wines`;
                    }
                } else {
                    backButtonText.textContent = `Back to Home`;
                }
            }
        }
    }

    updateBreadcrumb(wine) {
        // Update desktop breadcrumb
        const breadcrumb = document.getElementById('breadcrumb');
        const breadcrumbCurrent = document.getElementById('breadcrumbCurrent');
        
        // Update mobile breadcrumb
        const mobileBreadcrumb = document.querySelector('.mobile-breadcrumb');
        const mobileBreadcrumbCurrent = document.getElementById('mobileBreadcrumbCurrent');
        
        if (breadcrumb) {
            // Check if there's a wine type filter in the URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const type = urlParams.get('type');
            
            // Build URL to index.html with region and type filters
            let regionUrl = `index.html`;
            const regionParams = new URLSearchParams();
            if (wine.region) {
                regionParams.set('region', wine.region);
            }
            if (type) {
                regionParams.set('type', type);
            }
            if (regionParams.toString()) {
                regionUrl += `?${regionParams.toString()}`;
            }
            
            // Build URL for home with type filter
            let homeUrl = `index.html`;
            if (type) {
                homeUrl += `?type=${encodeURIComponent(type)}`;
            }
            
            breadcrumb.innerHTML = `
                <a href="${homeUrl}">Home</a>
                <span class="breadcrumb-separator">/</span>
                <a href="${regionUrl}">${wine.region || 'Wine Regions'}</a>
                <span class="breadcrumb-separator">/</span>
                <span class="breadcrumb-current">${wine.wine_name}</span>
            `;
        }
        
        // Update mobile breadcrumb
        if (mobileBreadcrumbCurrent) {
            mobileBreadcrumbCurrent.textContent = wine.wine_name;
        }
    }

    applyFilters() {
        this.filteredWines = this.wines.filter(wine => {
            const matchesType = !this.currentFilters.type || this.wineMatchesFamily(wine, this.currentFilters.type);
            const matchesRegion = !this.currentFilters.region || wine.region === this.currentFilters.region;
            const matchesVarietal = !this.currentFilters.varietal || (
                wine.varietals && wine.varietals.toLowerCase().includes(this.currentFilters.varietal.toLowerCase())
            );
            const matchesSearch = !this.currentFilters.search || 
                wine.wine_name.toLowerCase().includes(this.currentFilters.search) ||
                wine.region.toLowerCase().includes(this.currentFilters.search) ||
                (wine.varietals && wine.varietals.toLowerCase().includes(this.currentFilters.search));
            
            return matchesType && matchesRegion && matchesVarietal && matchesSearch;
        });

        this.renderWines();
    }

    toggleView(view) {
        this.currentView = view;
        const winesGrid = document.getElementById('winesGrid');
        const wineTable = document.getElementById('wineTable');
        const regionsGrid = document.getElementById('regionsGrid');
        const regionsTable = document.getElementById('regionsTable');
        const gridBtn = document.getElementById('gridViewBtn');
        const tableBtn = document.getElementById('tableViewBtn');

        if (view === 'grid') {
            if (winesGrid) winesGrid.style.display = 'grid';
            if (wineTable) wineTable.style.display = 'none';
            if (regionsGrid) regionsGrid.style.display = 'grid';
            if (regionsTable) regionsTable.style.display = 'none';
            if (gridBtn) gridBtn.classList.add('active');
            if (tableBtn) tableBtn.classList.remove('active');
        } else {
            if (winesGrid) winesGrid.style.display = 'none';
            if (wineTable) wineTable.style.display = 'block';
            if (regionsGrid) regionsGrid.style.display = 'none';
            if (regionsTable) regionsTable.style.display = 'block';
            if (gridBtn) gridBtn.classList.remove('active');
            if (tableBtn) tableBtn.classList.add('active');
        }
    }

    exploreWine(button) {
        const wineCard = button.closest('.wine-card');
        const tableRow = button.closest('tr');
        
        let wineName = '';
        if (wineCard) {
            wineName = wineCard.querySelector('.wine-name').textContent;
        } else if (tableRow) {
            wineName = tableRow.querySelector('.table-wine-name').textContent;
        }

        // Find the wine in our data
        const wine = this.wines.find(w => w.wine_name === wineName);
        if (wine) {
            let url = `wine-details.html?id=${wine.wine_number}`;
            if (this.currentFilters.type) {
                url += `&type=${encodeURIComponent(this.currentFilters.type)}`;
            }
            window.location.href = url;
        } else {
            this.showError('Wine details not available');
        }
    }

    exploreRegion(button) {
        const regionCard = button.closest('.region-card');
        const tableRow = button.closest('tr');
        
        let regionName = '';
        if (regionCard) {
            regionName = regionCard.querySelector('.region-title').textContent;
        } else if (tableRow) {
            regionName = tableRow.querySelector('.table-region-name').textContent;
        }

        // Navigate to wines page with region filter
        const urlParams = new URLSearchParams(window.location.search);
        const wineType = urlParams.get('type');
        
        // Build URL with proper parameters
        // Navigate to index.html with region and type filters
        let url = `index.html?region=${encodeURIComponent(regionName)}`;
        if (wineType) {
            url += `&type=${encodeURIComponent(wineType)}`;
        }
        
        window.location.href = url;
    }

    showFilterOptions(button) {
        const filterType = button.textContent.includes('Region') ? 'Region' : 'Varietal';
        
        if (filterType === 'Region') {
            this.showRegionFilter();
        } else if (filterType === 'Varietal') {
            this.showVarietalFilter();
        }
    }

    showRegionFilter() {
        // Get all unique regions
        const regions = [...new Set(
            this.wines
                .filter(wine => wine.region && wine.region.trim() !== '')
                .map(wine => wine.region)
        )].sort();

        // Create filter dropdown
        const filterContainer = document.createElement('div');
        filterContainer.className = 'filter-dropdown';
        filterContainer.innerHTML = `
            <div class="filter-dropdown-content">
                <h3>Filter by Region</h3>
                <div class="filter-options">
                    <button class="filter-option" data-region="">All Regions</button>
                    ${regions.map(region => `
                        <button class="filter-option" data-region="${region}">${region}</button>
                    `).join('')}
                </div>
                <div class="filter-actions">
                    <button class="clear-filters">Clear Filters</button>
                    <button class="close-filter">Close</button>
                </div>
            </div>
        `;

        // Add to page
        document.body.appendChild(filterContainer);

        // Add event listeners
        filterContainer.querySelectorAll('.filter-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const region = e.target.getAttribute('data-region');
                this.applyRegionFilter(region);
                document.body.removeChild(filterContainer);
            });
        });

        filterContainer.querySelector('.close-filter').addEventListener('click', () => {
            document.body.removeChild(filterContainer);
        });

        filterContainer.querySelector('.clear-filters').addEventListener('click', () => {
            this.clearAllFilters();
            document.body.removeChild(filterContainer);
        });

        // Close on click outside
        filterContainer.addEventListener('click', (e) => {
            if (e.target === filterContainer) {
                document.body.removeChild(filterContainer);
            }
        });
    }

    showVarietalFilter() {
        // Build varietals list, scoped to region if present
        let winesScope = this.wines.filter(w => w.varietals && w.varietals.trim() !== '');
        if (this.currentFilters.region) {
            const normalized = this.normalizeRegionName(this.currentFilters.region);
            winesScope = winesScope.filter(w => this.normalizeRegionName(w.region) === normalized);
        }
        const varietals = [...new Set(winesScope.map(w => w.varietals))].sort();

        // Create filter dropdown
        const filterContainer = document.createElement('div');
        filterContainer.className = 'filter-dropdown';
        filterContainer.innerHTML = `
            <div class="filter-dropdown-content">
                <h3>Filter by Varietal</h3>
                <div class="filter-options">
                    <button class="filter-option" data-varietal="">All Varietals</button>
                    ${varietals.map(varietal => `
                        <button class="filter-option" data-varietal="${varietal}">${varietal}</button>
                    `).join('')}
                </div>
                <div class="filter-actions">
                    <button class="clear-filters">Clear Filters</button>
                    <button class="close-filter">Close</button>
                </div>
            </div>
        `;

        // Add to page
        document.body.appendChild(filterContainer);

        // Add event listeners
        filterContainer.querySelectorAll('.filter-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const varietal = e.target.getAttribute('data-varietal');
                this.applyVarietalFilter(varietal);
                document.body.removeChild(filterContainer);
            });
        });

        filterContainer.querySelector('.close-filter').addEventListener('click', () => {
            document.body.removeChild(filterContainer);
        });

        filterContainer.querySelector('.clear-filters').addEventListener('click', () => {
            this.clearAllFilters();
            document.body.removeChild(filterContainer);
        });

        // Close on click outside
        filterContainer.addEventListener('click', (e) => {
            if (e.target === filterContainer) {
                document.body.removeChild(filterContainer);
            }
        });
    }

    applyRegionFilter(region) {
        // Filter wine cards by region
        const wineCards = document.querySelectorAll('.luxury-wine-card');
        
        wineCards.forEach(card => {
            const link = card.getAttribute('href');
            const type = new URLSearchParams(link.split('?')[1]).get('type');
            // Ensure search param is propagated when present
            if (this.currentFilters.search) {
                const url = new URL(card.href, window.location.origin);
                url.searchParams.set('type', type);
                url.searchParams.set('search', encodeURIComponent(this.currentFilters.search));
                card.setAttribute('href', url.pathname + url.search);
            } else {
                const url = new URL(card.href, window.location.origin);
                url.searchParams.delete('search');
                card.setAttribute('href', url.pathname + url.search);
            }
            
            if (!region) {
                // Show all cards
                card.style.display = 'block';
                this.updateWineCounts();
            } else {
                // Count wines for this type and region
                const count = this.wines.filter(wine => 
                    this.wineMatchesFamily(wine, type) && wine.region === region
                ).length;
                
                if (count > 0) {
                    card.style.display = 'block';
                    // Update the count for this card
                    const countElement = card.querySelector('.wine-count');
                    if (countElement) {
                        countElement.textContent = `${count} wines`;
                    }
                } else {
                    card.style.display = 'none';
                }
            }
        });

        // Update search functionality to work with filtered results
        this.currentFilters.region = region;
    }

    applyVarietalFilter(varietal) {
        // Set varietal filter and re-apply list filtering (scoped by region if present)
        this.currentFilters.varietal = varietal || '';
        if (this.getCurrentPage() === 'index') {
            // On home, varietal filter affects counts/visibility of cards only
            const wineCards = document.querySelectorAll('.luxury-wine-card');
            wineCards.forEach(card => {
                const link = card.getAttribute('href');
                const type = new URLSearchParams(link.split('?')[1]).get('type');
                const count = this.wines.filter(wine => {
                    const matchesType = this.wineMatchesFamily(wine, type);
                    const matchesRegion = !this.currentFilters.region || wine.region === this.currentFilters.region;
                    const matchesVar = !this.currentFilters.varietal || (wine.varietals && wine.varietals.toLowerCase().includes(this.currentFilters.varietal.toLowerCase()));
                    return matchesType && matchesRegion && matchesVar;
                }).length;
                if (count > 0) {
                    card.style.display = 'block';
                    const countElement = card.querySelector('.wine-count');
                    if (countElement) countElement.textContent = `${count} wines`;
                } else {
                    card.style.display = 'none';
                }
            });
        } else {
            this.applyFilters();
        }
    }

    updateWineCounts() {
        // Reset wine counts to original values
        const wineTypes = ['ROSSO', 'BIANCO', 'ROSATO', 'BOLLICINE', 'NON ALCOLICO'];
        const wineCards = document.querySelectorAll('.luxury-wine-card');
        
        wineCards.forEach((card, index) => {
            if (wineTypes[index]) {
                const count = this.wines.filter(wine => this.wineMatchesFamily(wine, wineTypes[index])).length;
                const countElement = card.querySelector('.wine-count');
                if (countElement) {
                    countElement.textContent = `${count} wines`;
                }
            }
        });
    }

    applyIndexSearch() {
        // If we're on the index page with map, filter wines in the current region view
        const winesListContainer = document.getElementById('winesListContainer');
        const winesGridContainer = document.getElementById('winesGridContainer');
        
        // If wines list is visible, reload wines with search filter
        if (winesListContainer && winesListContainer.style.display !== 'none' && winesGridContainer) {
            const winesListTitle = document.getElementById('winesListTitle');
            if (winesListTitle) {
                // Extract region name from title (format: "Region Name Wines")
                const regionName = winesListTitle.textContent.replace(' Wines', '').trim();
                
                // Get current wine type from active sidebar card
                const activeCard = document.querySelector('.wine-card-sidebar.active');
                const wineType = activeCard ? activeCard.dataset.type : null;
                
                // Reload wines with search filter
                if (window.loadWinesIntoGrid) {
                    const searchTerm = this.currentFilters.search || '';
                    window.loadWinesIntoGrid(regionName, wineType, winesGridContainer, searchTerm);
                }
            }
        }
        
        // Also filter regions panel if visible
        const regionsPanel = document.getElementById('regionsPanel');
        if (regionsPanel && regionsPanel.classList.contains('active')) {
            const regionsList = document.getElementById('regionsList');
            if (regionsList) {
                const regionItems = regionsList.querySelectorAll('.region-item');
                const searchTerm = this.currentFilters.search ? this.currentFilters.search.toLowerCase() : '';
                
                regionItems.forEach(item => {
                    const regionName = item.querySelector('.region-item-name')?.textContent || '';
                    const regionCount = item.querySelector('.region-item-count')?.textContent || '';
                    
                    // Show/hide based on search term matching region name
                    if (!searchTerm || regionName.toLowerCase().includes(searchTerm)) {
                        item.style.display = 'flex';
                    } else {
                        item.style.display = 'none';
                    }
                });
            }
        }
    }

    clearAllFilters() {
        // Reset all filters
        this.currentFilters = {
            type: null,
            region: null,
            search: ''
        };
        
        // Clear search input
        const searchInput = document.querySelector('.luxury-search-input');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // Show all wine cards and reset counts
        const wineCards = document.querySelectorAll('.luxury-wine-card');
        wineCards.forEach(card => {
            card.style.display = 'block';
        });
        
        this.updateWineCounts();
    }

    setupHoverEffects() {
        // Add hover effects to wine cards
        document.addEventListener('mouseover', (e) => {
            const wineCard = e.target.closest('.wine-card, .region-card, .luxury-wine-card');
            if (wineCard) {
                wineCard.style.transform = 'translateY(-5px)';
            }
        });

        document.addEventListener('mouseout', (e) => {
            const wineCard = e.target.closest('.wine-card, .region-card, .luxury-wine-card');
            if (wineCard) {
                wineCard.style.transform = 'translateY(0)';
            }
        });
    }

    showError(message) {
        console.error(message);
        
        // Create elegant error notification
        const errorDiv = document.createElement('div');
        errorDiv.id = 'errorNotification';
        errorDiv.style.cssText = `
            position: fixed;
            top: 2rem;
            right: 2rem;
            background: linear-gradient(135deg, rgba(139, 0, 0, 0.95) 0%, rgba(139, 0, 0, 0.85) 100%);
            color: var(--ivory);
            padding: 1.5rem 2rem;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
            z-index: 10000;
            max-width: 400px;
            border: 2px solid rgba(212, 175, 55, 0.3);
            font-family: 'Cinzel', serif;
            animation: slideInRight 0.3s ease;
        `;
        
        errorDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem;">
                <i class="fas fa-exclamation-circle" style="font-size: 1.5rem; color: var(--gold);"></i>
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 0.5rem 0; color: var(--gold); font-size: 1rem;">Error</h4>
                    <p style="margin: 0; font-size: 0.9rem; line-height: 1.4;">${message}</p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: transparent;
                    border: none;
                    color: var(--ivory);
                    font-size: 1.2rem;
                    cursor: pointer;
                    padding: 0.25rem;
                    line-height: 1;
                ">&times;</button>
            </div>
        `;
        
        // Remove existing error notification if any
        const existing = document.getElementById('errorNotification');
        if (existing) {
            existing.remove();
        }
        
        document.body.appendChild(errorDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => errorDiv.remove(), 300);
            }
        }, 5000);
    }

    // Utility functions
    getWineTypeName(type) {
        const typeNames = {
            'ROSSO': 'Red Wines',
            'BIANCO': 'White Wines',
            'ROSATO': 'Rosé Wines',
            'ARANCIONE': 'Orange Wines',
            'BOLLICINE': 'Sparkling Wines',
            'NON ALCOLICO': 'Non-Alcoholic Wines'
        };
        return typeNames[type] || 'Wines';
    }

    // Helper function to determine wine family from wine_type
    getWineFamily(wineType) {
        if (!wineType) return 'ROSSO'; // Default fallback
        
        const type = wineType.toUpperCase();
        
        // Sparkling wine variations (check first to avoid conflicts)
        if (type.includes('BOLLICINE')) {
            return 'BOLLICINE';
        }
        if (type.includes('NON ALCOLICO') || type.includes('NON-ALCOHOLIC') || type.includes("0.0")) {
            return 'NON ALCOLICO';
        }
        
        // Rosé wine variations
        if (type.includes('ROSATO')) {
            return 'ROSATO';
        }
        
        // White wine variations
        if (type.includes('ARANCIONE')) {
            return 'ARANCIONE';
        }
        if (type.includes('BIANCO')) {
            return 'BIANCO';
        }
        
        // Red wine variations
        if (type.includes('ROSSO') || type.includes('AMARONE') || type.includes('BAROLO') || 
            type.includes('SUPERTUSCAN') || type.includes('SUPERIORE') || type.includes('RIPASSO')) {
            return 'ROSSO';
        }
        
        // Default fallback
        return 'ROSSO';
    }

    // Helper function to check if wine matches a specific family
    wineMatchesFamily(wine, targetFamily) {
        const wineFamily = this.getWineFamily(wine.wine_type);
        return wineFamily === targetFamily;
    }

    // Debug function to log wine family distribution
    logWineFamilyDistribution() {
        const familyCounts = {
            'ROSSO': 0,
            'BIANCO': 0,
            'ROSATO': 0,
            'BOLLICINE': 0,
            'OTHER': 0
        };

        const typeMapping = {};

        this.wines.forEach(wine => {
            const family = this.getWineFamily(wine.wine_type);
            if (familyCounts.hasOwnProperty(family)) {
                familyCounts[family]++;
            } else {
                familyCounts['OTHER']++;
            }
            
            // Track type mappings for debugging
            if (!typeMapping[wine.wine_type]) {
                typeMapping[wine.wine_type] = family;
            }
        });

        console.log('Wine Family Distribution:', familyCounts);
        console.log('Wine Type Mappings:', typeMapping);
        
        // Log some examples of wine type mapping
        const examples = {};
        this.wines.slice(0, 20).forEach(wine => {
            const family = this.getWineFamily(wine.wine_type);
            if (!examples[family]) {
                examples[family] = [];
            }
            if (examples[family].length < 3) {
                examples[family].push(`${wine.wine_name} (${wine.wine_type} -> ${family})`);
            }
        });
        
        console.log('Wine Type Mapping Examples:', examples);
        
        // Log region distribution
        this.logRegionDistribution();
    }

    logRegionDistribution() {
        const regionCounts = {};
        this.wines.forEach(wine => {
            const region = wine.region;
            if (regionCounts[region]) {
                regionCounts[region]++;
            } else {
                regionCounts[region] = 1;
            }
        });

        console.log('Region Distribution:', regionCounts);
        
        // Check for potential data issues
        const suspiciousRegions = Object.keys(regionCounts).filter(region => 
            region.includes('WINE') || region.includes('UNKNOWN') || region.length < 3
        );
        
        if (suspiciousRegions.length > 0) {
            console.warn('Suspicious regions found:', suspiciousRegions);
        }
        
        // Log all unique regions for verification
        const allRegions = Object.keys(regionCounts).sort();
        console.log('All regions in database:', allRegions);
    }

    normalizeRegionName(regionName) {
        if (!regionName) return '';
        
        // First, normalize to uppercase for consistent comparison
        const upperName = regionName.toUpperCase();
        
        // Normalize region names to handle variations between GeoJSON and JSON
        // GeoJSON uses: "Abruzzo", "Sicilia", "Trentino-Alto Adige/Südtirol", "Valle d'Aosta/Vallée d'Aoste"
        // JSON uses: "ABRUZZO", "SICILIA", "TRENTINO ALTO-ADIGE", "VALLE D'AOSTA"
        const regionMap = {
            // Friuli-Venezia Giulia variations
            'FRIULI-VENEZIA GIULIA': 'FRIULI-VENEZIA GIULIA',
            'FRIULI VENEZIA GIULIA': 'FRIULI-VENEZIA GIULIA',
            'FRIULI VENEZIA': 'FRIULI-VENEZIA GIULIA',
            'FRIULI': 'FRIULI-VENEZIA GIULIA',
            // Marche variations
            'LE MARCHE': 'LE MARCHE',
            'MARCHE': 'LE MARCHE',
            // Trentino-Alto Adige variations (GeoJSON has "/Südtirol")
            'TRENTINO ALTO-ADIGE': 'TRENTINO ALTO-ADIGE',
            'TRENTINO-ALTO ADIGE': 'TRENTINO ALTO-ADIGE',
            'TRENTINO-ALTO ADIGE/SÜDTIROL': 'TRENTINO ALTO-ADIGE',
            'TRENTINO-ALTO ADIGE/SUDTIROL': 'TRENTINO ALTO-ADIGE',
            'TRENTINO': 'TRENTINO ALTO-ADIGE',
            'ALTO ADIGE': 'TRENTINO ALTO-ADIGE',
            // Valle d'Aosta variations (GeoJSON has "/Vallée d'Aoste")
            'VALLE D\'AOSTA': 'VALLE D\'AOSTA',
            'VALLE D\'AOSTA/VALLÉE D\'AOSTE': 'VALLE D\'AOSTA',
            'VALLE D\'AOSTA/VALLEE D\'AOSTE': 'VALLE D\'AOSTA',
            'AOSTA': 'VALLE D\'AOSTA',
            // Toscana variations
            'TOSCANA': 'TOSCANA',
            'TOSCANA (BOLGHERI)': 'TOSCANA',
            // Other regions (normalize case variations)
            'SICILIA': 'SICILIA',
            'PIEMONTE': 'PIEMONTE',
            'VENETO': 'VENETO',
            'LUGANA DOC (VENETO)': 'VENETO',
            'LOMBARDIA': 'LOMBARDIA',
            'EMILIA-ROMAGNA': 'EMILIA-ROMAGNA',
            'LAZIO': 'LAZIO',
            'CAMPANIA': 'CAMPANIA',
            'PUGLIA': 'PUGLIA',
            'TARANTO IGT (PUGLIA)': 'PUGLIA',
            'CALABRIA': 'CALABRIA',
            'BASILICATA': 'BASILICATA',
            'MATERA DOC (BASILICATA)': 'BASILICATA',
            'MOLISE': 'MOLISE',
            'ABRUZZO': 'ABRUZZO',
            'UMBRIA': 'UMBRIA',
            'SARDEGNA': 'SARDEGNA',
            'LIGURIA': 'LIGURIA'
        };
        
        // Check if we have a direct mapping
        if (regionMap[upperName]) {
            return regionMap[upperName];
        }
        
        // If no mapping found, return uppercase version for consistency
        return upperName;
    }

    performGeneralCheckup() {
        console.log('🔍 PERFORMING GENERAL CHECKUP...');
        
        // Check 1: Data integrity
        const totalWines = this.wines.length;
        const winesWithValidRegions = this.wines.filter(wine => wine.region && wine.region.trim() !== '').length;
        const winesWithValidNames = this.wines.filter(wine => wine.wine_name && wine.wine_name.trim() !== '').length;
        const winesWithValidProducers = this.wines.filter(wine => wine.wine_producer && wine.wine_producer.trim() !== '').length;
        const winesWithValidPrices = this.wines.filter(wine => wine.wine_price && wine.wine_price !== '0').length;
        
        console.log(`📊 Data Integrity Check:`);
        console.log(`  - Total wines: ${totalWines}`);
        console.log(`  - Wines with valid regions: ${winesWithValidRegions} (${Math.round(winesWithValidRegions/totalWines*100)}%)`);
        console.log(`  - Wines with valid names: ${winesWithValidNames} (${Math.round(winesWithValidNames/totalWines*100)}%)`);
        console.log(`  - Wines with valid producers: ${winesWithValidProducers} (${Math.round(winesWithValidProducers/totalWines*100)}%)`);
        console.log(`  - Wines with valid prices: ${winesWithValidPrices} (${Math.round(winesWithValidPrices/totalWines*100)}%)`);
        
        // Check 2: Region consistency
        const uniqueRegions = [...new Set(this.wines.map(wine => wine.region))].sort();
        console.log(`🗺️  Region Consistency Check:`);
        console.log(`  - Unique regions found: ${uniqueRegions.length}`);
        console.log(`  - Regions: ${uniqueRegions.join(', ')}`);
        
        // Check 3: Wine type distribution
        const wineTypeCounts = {};
        this.wines.forEach(wine => {
            const family = this.getWineFamily(wine.wine_type);
            wineTypeCounts[family] = (wineTypeCounts[family] || 0) + 1;
        });
        console.log(`🍷 Wine Type Distribution:`);
        Object.entries(wineTypeCounts).forEach(([type, count]) => {
            console.log(`  - ${type}: ${count} wines`);
        });
        
        // Check 4: Price range
        const prices = this.wines.map(wine => parseInt(wine.wine_price)).filter(price => !isNaN(price));
        if (prices.length > 0) {
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
            console.log(`💰 Price Range Check:`);
            console.log(`  - Min price: $${minPrice}`);
            console.log(`  - Max price: $${maxPrice}`);
            console.log(`  - Average price: $${avgPrice}`);
        }
        
        // Check 5: Potential issues
        const issues = [];
        
        // Check for wines with missing critical data
        const winesWithMissingData = this.wines.filter(wine => 
            !wine.wine_name || !wine.region || !wine.wine_producer || !wine.wine_price
        );
        if (winesWithMissingData.length > 0) {
            issues.push(`${winesWithMissingData.length} wines with missing critical data`);
        }
        
        // Check for duplicate wine numbers
        const wineNumbers = this.wines.map(wine => wine.wine_number);
        const duplicateNumbers = wineNumbers.filter((number, index) => wineNumbers.indexOf(number) !== index);
        if (duplicateNumbers.length > 0) {
            issues.push(`${duplicateNumbers.length} duplicate wine numbers found`);
        }
        
        // Check for suspicious regions
        const suspiciousRegions = uniqueRegions.filter(region => 
            region.includes('WINE') || region.includes('UNKNOWN') || region.length < 3
        );
        if (suspiciousRegions.length > 0) {
            issues.push(`Suspicious regions found: ${suspiciousRegions.join(', ')}`);
        }
        
        if (issues.length > 0) {
            console.warn(`⚠️  Issues found:`);
            issues.forEach(issue => console.warn(`  - ${issue}`));
        } else {
            console.log(`✅ No issues found - all checks passed!`);
        }
        
        console.log('🔍 GENERAL CHECKUP COMPLETED');
    }

    testAllRegions() {
        console.log('🧪 TESTING ALL REGIONS...');
        
        const uniqueRegions = [...new Set(this.wines.map(wine => wine.region))].sort();
        
        uniqueRegions.forEach(region => {
            const winesInRegion = this.wines.filter(wine => wine.region === region);
            const redWines = winesInRegion.filter(wine => this.getWineFamily(wine.wine_type) === 'ROSSO');
            const whiteWines = winesInRegion.filter(wine => this.getWineFamily(wine.wine_type) === 'BIANCO');
            const roseWines = winesInRegion.filter(wine => this.getWineFamily(wine.wine_type) === 'ROSATO');
            const sparklingWines = winesInRegion.filter(wine => this.getWineFamily(wine.wine_type) === 'BOLLICINE');
            
            console.log(`📍 ${region}:`);
            console.log(`  - Total wines: ${winesInRegion.length}`);
            console.log(`  - Red wines: ${redWines.length}`);
            console.log(`  - White wines: ${whiteWines.length}`);
            console.log(`  - Rosé wines: ${roseWines.length}`);
            console.log(`  - Sparkling wines: ${sparklingWines.length}`);
            
            // Test URL encoding/decoding
            const encodedRegion = encodeURIComponent(region);
            const decodedRegion = decodeURIComponent(encodedRegion);
            console.log(`  - URL encoding test: "${region}" -> "${encodedRegion}" -> "${decodedRegion}" ${region === decodedRegion ? '✅' : '❌'}`);
        });
        
        console.log('🧪 REGION TESTING COMPLETED');
    }

    addWineFamilyIndicator(wineType, element) {
        if (!element || !wineType) return;

        // Remove existing indicators
        const existingIndicator = element.querySelector('.wine-family-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        // Create wine family indicator
        const indicator = document.createElement('div');
        indicator.className = 'wine-family-indicator';
        
        const wineFamily = this.getWineFamily(wineType);
        
        const typeNames = {
            'ROSSO': 'Red',
            'BIANCO': 'White',
            'ROSATO': 'Rosé',
            'BOLLICINE': 'Sparkling'
        };

        const familyClass = {
            'ROSSO': 'wine-family-rosso',
            'BIANCO': 'wine-family-bianco',
            'ROSATO': 'wine-family-rosato',
            'ARANCIONE': 'wine-family-arancione',
            'BOLLICINE': 'wine-family-bollicine',
            'NON ALCOLICO': 'wine-family-nonalco'
        };

        indicator.textContent = typeNames[wineFamily] || 'Wine';
        indicator.classList.add(familyClass[wineFamily] || 'wine-family-rosso');
        
        // Make sure element has relative positioning
        if (getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
        }
        
        element.appendChild(indicator);
    }

    addWineTypeBadge(wineType, container) {
        if (!container || !wineType) return;

        // Remove existing badge
        const existingBadge = container.querySelector('.wine-type-badge');
        if (existingBadge) {
            existingBadge.remove();
        }

        // Create wine type badge
        const badge = document.createElement('span');
        badge.className = 'wine-type-badge';
        
        const wineFamily = this.getWineFamily(wineType);
        
        const typeNames = {
            'ROSSO': 'Red Wines',
            'BIANCO': 'White Wines',
            'ROSATO': 'Rosé Wines',
            'BOLLICINE': 'Sparkling Wines'
        };

        badge.textContent = typeNames[wineFamily] || 'Wines';
        
        // Add to subtitle
        const subtitle = container.querySelector('.luxury-subtitle');
        if (subtitle) {
            subtitle.appendChild(badge);
        }
    }

    getRegionIcon(region) {
        const iconMap = {
            // Tuscany regions
            'TOSCANA': 'fas fa-sun',
            'TOSCANA (BOLGHERI)': 'fas fa-sun',
            
            // Northern regions
            'PIEMONTE': 'fas fa-mountain',
            'TRENTINO ALTO-ADIGE': 'fas fa-mountain',
            'FRIULI-VENEZIA GIULIA': 'fas fa-mountain',
            'VALLE D\'AOSTA': 'fas fa-mountain',
            
            // Veneto regions
            'VENETO': 'fas fa-water',
            'LUGANA DOC (VENETO)': 'fas fa-water',
            
            // Central regions
            'EMILIA-ROMAGNA': 'fas fa-city',
            'LAZIO': 'fas fa-city',
            'LOMBARDIA': 'fas fa-water',
            'LE MARCHE': 'fas fa-mountain',
            'UMBRIA': 'fas fa-mountain',
            'MOLISE': 'fas fa-mountain',
            'ABRUZZO': 'fas fa-tree',
            
            // Southern regions
            'CAMPANIA': 'fas fa-volcano',
            'SICILIA': 'fas fa-volcano',
            'PUGLIA': 'fas fa-umbrella-beach',
            'TARANTO IGT (PUGLIA)': 'fas fa-umbrella-beach',
            'CALABRIA': 'fas fa-tree',
            'BASILICATA': 'fas fa-mountain',
            'MATERA DOC (BASILICATA)': 'fas fa-mountain',
            
            // Islands
            'SARDEGNA': 'fas fa-mountain',
            
            // Coastal regions
            'LIGURIA': 'fas fa-water'
        };
        
        return iconMap[region] || 'fas fa-map-marker-alt';
    }

    extractYear(vintage) {
        if (!vintage) return 'N/A';
        const yearMatch = vintage.match(/\b(19|20)\d{2}\b/);
        return yearMatch ? yearMatch[0] : 'N/A';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add page load animation
    const luxuryContainer = document.querySelector('.luxury-container');
    if (luxuryContainer) {
        luxuryContainer.style.opacity = '0';
        luxuryContainer.style.transition = 'opacity 1s ease';
        
        setTimeout(() => {
            luxuryContainer.style.opacity = '1';
        }, 100);
    }

    // Initialize the wine list app
    const wineAppInstance = new WineListApp();
    window.wineApp = wineAppInstance;
    
    // Wait for wineApp to be ready (data loaded) and dispatch event
    const checkWineAppReady = setInterval(() => {
        if (window.wineApp && window.wineApp.wines && window.wineApp.wines.length > 0) {
            clearInterval(checkWineAppReady);
            window.dispatchEvent(new CustomEvent('wineAppReady', { 
                detail: { wineApp: window.wineApp } 
            }));
        }
    }, 100);
    
    // Timeout after 10 seconds
    setTimeout(() => {
        clearInterval(checkWineAppReady);
        if (window.wineApp) {
            window.dispatchEvent(new CustomEvent('wineAppReady', { 
                detail: { wineApp: window.wineApp } 
            }));
        }
    }, 10000);
});

// Handle browser back/forward navigation (pageshow event)
window.addEventListener('pageshow', (event) => {
    // If page was loaded from cache (back/forward navigation)
    if (event.persisted) {
        const path = window.location.pathname;
        // If we're on index page and coming from wine-details, skip loading
        if (path.includes('index') || path.endsWith('/') || path === '') {
            const skipLoading = sessionStorage.getItem('skipHomeLoading') === 'true';
            if (skipLoading) {
                sessionStorage.removeItem('skipHomeLoading');
                const overlay = document.getElementById('loadingOverlay');
                if (overlay) {
                    overlay.classList.add('is-hidden');
                    setTimeout(() => {
                        overlay.remove();
                        if (document.body) {
                            document.body.dataset.overlayDone = 'true';
                        }
                    }, 100);
                }
                // Make sure hero animation is set up
                if (window.wineApp && typeof window.wineApp.setupHomeHeroAnimation === 'function') {
                    window.wineApp.setupHomeHeroAnimation();
                }
            }
        }
    }
});

// Add some utility functions for GitHub Pages compatibility
function updateWineIcons() {
    const wineCards = document.querySelectorAll('.luxury-wine-card');
        const iconMap = {
        'ROSSO': './image/glassRed.png',
        'BIANCO': './image/glassWhite.png',
        'ROSATO': './image/glRose.png',
            'ARANCIONE': './image/glRose.png',
            'BOLLICINE': './image/glSparkling.png',
            'NON ALCOLICO': './image/glSparkling.png'
    };

    wineCards.forEach(card => {
        const link = card.getAttribute('href');
        if (link) {
            const type = new URLSearchParams(link.split('?')[1]).get('type');
            if (type && iconMap[type]) {
                const icon = card.querySelector('.wine-icon');
                if (icon) {
                    icon.innerHTML = `<img src="${iconMap[type]}" alt="${type} wine icon">`;
                }
            }
        }
    });
}

// Update icons after page load
document.addEventListener('DOMContentLoaded', updateWineIcons);

// Share Wine Functionality
class ShareWineManager {
    constructor() {
        this.shareModal = document.getElementById('shareModal');
        this.shareBtn = document.getElementById('shareWineBtn');
        this.shareBtnTop = document.getElementById('shareWineBtnTop');
        this.closeBtn = document.getElementById('closeShareModal');
        this.shareUrl = document.getElementById('shareUrl');
        this.copyBtn = document.getElementById('copyUrlBtn');
        
        this.init();
    }
    
    init() {
        if (this.shareBtn) {
            this.shareBtn.addEventListener('click', () => this.openShareModal());
        }
        if (this.shareBtnTop) {
            this.shareBtnTop.addEventListener('click', () => this.openShareModal());
        }
        
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.closeShareModal());
        }
        
        if (this.shareModal) {
            this.shareModal.addEventListener('click', (e) => {
                if (e.target === this.shareModal) {
                    this.closeShareModal();
                }
            });
        }
        
        if (this.copyBtn) {
            this.copyBtn.addEventListener('click', () => this.copyUrl());
        }
        
        // Social sharing options
        this.setupSocialSharing();
        
        // Set current URL
        this.setCurrentUrl();
    }
    
    openShareModal() {
        if (this.shareModal) {
            this.shareModal.classList.add('active');
            // Only disable scroll if not on home page (which already handles it)
            if (!document.body.classList.contains('home-page')) {
                document.body.style.overflow = 'hidden';
            }
        }
    }
    
    closeShareModal() {
        if (this.shareModal) {
            this.shareModal.classList.remove('active');
            // Restore scroll
            document.body.style.overflow = '';
        }
    }
    
    setCurrentUrl() {
        if (this.shareUrl) {
            this.shareUrl.value = window.location.href;
        }
    }
    
    async copyUrl() {
        if (this.shareUrl) {
            try {
                await navigator.clipboard.writeText(this.shareUrl.value);
                this.showCopySuccess();
            } catch (err) {
                // Fallback for older browsers
                this.shareUrl.select();
                document.execCommand('copy');
                this.showCopySuccess();
            }
        }
    }
    
    showCopySuccess() {
        const originalText = this.copyBtn.innerHTML;
        this.copyBtn.innerHTML = '<i class="fas fa-check"></i>';
        this.copyBtn.style.background = 'linear-gradient(135deg, #34A853 0%, #2E7D32 100%)';
        
        setTimeout(() => {
            this.copyBtn.innerHTML = originalText;
            this.copyBtn.style.background = '';
        }, 2000);
    }
    
    setupSocialSharing() {
        const shareOptions = [
            { id: 'shareFacebook', platform: 'facebook' },
            { id: 'shareInstagram', platform: 'instagram' },
            { id: 'shareTwitter', platform: 'twitter' },
            { id: 'shareWhatsApp', platform: 'whatsapp' },
            { id: 'shareEmail', platform: 'email' },
            { id: 'shareSMS', platform: 'sms' }
        ];
        
        shareOptions.forEach(option => {
            const element = document.getElementById(option.id);
            if (element) {
                element.addEventListener('click', () => this.shareToPlatform(option.platform));
            }
        });
    }
    
    shareToPlatform(platform) {
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(document.title);
        const text = encodeURIComponent('Check out this amazing wine from Gran Caffè L\'Aquila!');
        
        let shareUrl = '';
        
        switch (platform) {
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
                break;
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=${text}%20${url}`;
                break;
            case 'email':
                shareUrl = `mailto:?subject=${title}&body=${text}%20${url}`;
                break;
            case 'sms':
                shareUrl = `sms:?body=${text}%20${url}`;
                break;
            case 'instagram':
                // Instagram doesn't support direct URL sharing, show instructions
                this.showInstagramInstructions();
                return;
        }
        
        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400');
        }
    }
    
    showInstagramInstructions() {
        const instructions = `
            To share on Instagram:
            1. Copy the link below
            2. Open Instagram
            3. Create a new story or post
            4. Paste the link in your caption
        `;
        
        alert(instructions);
    }
}

// Initialize Share Wine Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ShareWineManager();
});

/* ==================== WINE TYPE FILTERS INITIALIZATION ==================== */
// Initialize wine type filter buttons (works independently of map)
function initWineTypeFilters() {
    // Wait for DOM to be ready
    const initFilters = () => {
        const wineCards = document.querySelectorAll('.wine-card-sidebar');
        if (wineCards.length === 0) {
            // Retry if elements not ready yet (max 10 attempts = 1 second)
            if (typeof initFilters.retryCount === 'undefined') {
                initFilters.retryCount = 0;
            }
            initFilters.retryCount++;
            if (initFilters.retryCount < 10) {
                setTimeout(initFilters, 100);
            } else {
                console.warn('⚠️ Wine type filter cards not found after 10 retries');
            }
            return;
        }
        
        console.log('🔍 Initializing wine type filters, found', wineCards.length, 'cards');
        
        wineCards.forEach((card, index) => {
            // Check if card already has event listener (avoid duplicates)
            if (card.dataset.filterInitialized === 'true') {
                console.log('⏭️ Card', index, 'already initialized, skipping');
                return;
            }
            
            // Mark as initialized
            card.dataset.filterInitialized = 'true';
            
            card.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const wineType = this.dataset.type;
                console.log('🍷 Wine category card clicked:', wineType, 'Card index:', index);
                
                if (wineType) {
                    // Update active state with visual feedback
                    document.querySelectorAll('.wine-card-sidebar').forEach(c => {
                        c.classList.remove('active');
                        c.style.opacity = '0.7';
                    });
                    this.classList.add('active');
                    this.style.opacity = '1';
                    
                    console.log('✅ Active state updated for wine type:', wineType);
                    
                    // Update map colors if map exists
                    const mapContainer = document.getElementById('map');
                    if (mapContainer && typeof updateMapColors === 'function') {
                        console.log('🎨 Updating map colors for wine type:', wineType);
                        updateMapColors(wineType);
                        
                        // Reset selected region
                        if (typeof selectedRegion !== 'undefined') {
                            selectedRegion = null;
                        }
                        // Note: updateMapColors already handles all layer styling, no need to do it manually here
                                } else {
                        console.warn('⚠️ Map container or updateMapColors function not available');
                    }
                    
                    // Hide region info and wines list, show map
                    const regionInfo = document.getElementById('regionInfo');
                    if (regionInfo) {
                        regionInfo.style.display = 'none';
                    }
                    
                    const mapWrapper = document.getElementById('mapWrapper');
                    const winesListContainer = document.getElementById('winesListContainer');
                    if (mapWrapper) {
                        mapWrapper.style.display = 'flex';
                    }
                    if (winesListContainer) {
                        winesListContainer.style.display = 'none';
                    }
                    
                    // Show regions panel and load regions for this wine type
                    if (typeof showRegionsPanel === 'function') {
                        console.log('📋 Calling showRegionsPanel for type:', wineType);
                        showRegionsPanel(wineType);
                    } else {
                        console.warn('⚠️ showRegionsPanel function not available');
                    }
                    
                    // Update active filters badge
                    if (typeof updateActiveFiltersBadge === 'function') {
                        setTimeout(updateActiveFiltersBadge, 100);
                    }
                    
                    // Force a visual update to ensure changes are visible
                    this.offsetHeight; // Trigger reflow
                } else {
                    console.warn('⚠️ No wineType found in card dataset');
                }
            });
        });
        
        console.log('✅ Wine type filters initialized successfully:', wineCards.length, 'filters');
    };
    
    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFilters);
    } else {
        initFilters();
    }
}

/* ==================== GLOBAL VARIABLES FOR MAP FUNCTIONALITY ==================== */
// Global variables for map functionality (must be declared before functions that use them)
let geoJsonLayer = null;
let selectedRegion = null;
let currentColors = { border: '#D4AF37', fill: '#D4AF37' };
let mapInstance = null;
let currentWineType = null;
let currentSelectedRegion = null;

// Mobile map variables
let mobileMapInstance = null;
let mobileGeoJsonLayer = null;
let mobileSelectedRegion = null;
let mobileCurrentWineType = null;

/* ==================== GLOBAL HELPER FUNCTIONS ==================== */
// Helper function to wait for wineApp to be ready
function waitForWineApp(callback, maxWait = 10000) {
    if (window.wineApp && window.wineApp.wines && window.wineApp.wines.length > 0) {
        callback();
            return;
        }
    
    let resolved = false;
    const timeout = setTimeout(() => {
        if (!resolved) {
            resolved = true;
            console.error('WineApp not available after timeout');
            if (window.wineApp && window.wineApp.wines) {
                callback();
            } else {
                callback(); // Call anyway to show error message
            }
        }
    }, maxWait);
    
    const handler = () => {
        if (!resolved && window.wineApp && window.wineApp.wines && window.wineApp.wines.length > 0) {
            resolved = true;
            clearTimeout(timeout);
            window.removeEventListener('wineAppReady', handler);
            callback();
        }
    };
    
    window.addEventListener('wineAppReady', handler);
}

// Helper function to map normalized region names to map region names
function getMapRegionName(normalizedRegionName) {
    // Map normalized region names to map region names (from regionData)
    const regionMap = {
        'FRIULI-VENEZIA GIULIA': 'Friuli-Venezia Giulia',
        'LE MARCHE': 'Marche',
        'TRENTINO ALTO-ADIGE': 'Trentino-Alto Adige',
        'VALLE D\'AOSTA': 'Valle d\'Aosta',
        'TOSCANA': 'Toscana',
        'SICILIA': 'Sicilia',
        'PIEMONTE': 'Piemonte',
        'VENETO': 'Veneto',
        'LOMBARDIA': 'Lombardia',
        'EMILIA-ROMAGNA': 'Emilia-Romagna',
        'LAZIO': 'Lazio',
        'CAMPANIA': 'Campania',
        'PUGLIA': 'Puglia',
        'CALABRIA': 'Calabria',
        'BASILICATA': 'Basilicata',
        'MOLISE': 'Molise',
        'ABRUZZO': 'Abruzzo',
        'UMBRIA': 'Umbria',
        'SARDEGNA': 'Sardegna',
        'LIGURIA': 'Liguria'
    };
    return regionMap[normalizedRegionName] || normalizedRegionName;
}

// Helper function to check if a region has wines of the current type
function regionHasWines(regionName, wineType) {
    if (!window.wineApp || !window.wineApp.wines || !window.wineApp.wines.length) {
        return false;
    }
    
    const filteredWines = window.wineApp.wines.filter(wine => {
        if (!wine.region) return false;
        const normalizedWineRegion = window.wineApp.normalizeRegionName(wine.region);
        const normalizedFilterRegion = window.wineApp.normalizeRegionName(regionName);
        const matchesRegion = normalizedWineRegion === normalizedFilterRegion;
        
        if (!wineType) {
            // If no wine type selected, just check region
            return matchesRegion;
        }
        
        const matchesType = window.wineApp.wineMatchesFamily(wine, wineType);
        return matchesRegion && matchesType;
    });
    
    return filteredWines.length > 0;
}

// Helper function to get wine type colors (used by both mobile and desktop)
function getWineTypeColors(wineType) {
        const wineColors = {
            'ROSSO': { border: '#8B0000', fill: '#8B0000' },
            'BIANCO': { border: '#F0E68C', fill: '#F0E68C' },
            'ROSATO': { border: '#FFB6C1', fill: '#FFB6C1' },
            'ARANCIONE': { border: '#FF8C00', fill: '#FF8C00' },
            'BOLLICINE': { border: '#E0D5B7', fill: '#E0D5B7' },
            'NON ALCOLICO': { border: '#90EE90', fill: '#90EE90' }
        };
            if (wineType && wineColors[wineType]) {
                return wineColors[wineType];
            }
            // Default to gold if no type or type not found
            return { border: '#D4AF37', fill: '#D4AF37' };
        }

// Update map colors with animation and highlight regions with wines
function updateMapColors(wineType) {
    console.log('🎨 updateMapColors called with wineType:', wineType);
    console.log('🗺️ geoJsonLayer exists:', !!geoJsonLayer);
    
    // Use getWineTypeColors for consistency
    const colors = getWineTypeColors(wineType);
    currentColors = colors;
    currentWineType = wineType;
    
    console.log('🎨 Colors set to:', colors);
    
    const mapElement = document.getElementById('map');
    if (mapElement) {
        mapElement.classList.remove('map-animated');
        void mapElement.offsetWidth;
        mapElement.classList.add('map-animated');
    }
    
    if (geoJsonLayer) {
        console.log('✅ Updating geoJsonLayer with', geoJsonLayer.getLayers().length, 'layers');
        geoJsonLayer.eachLayer(function(layer) {
            const regionName = layer._regionName;
            const hasWines = regionName ? regionHasWines(regionName, wineType) : false;
            const isSelected = layer === selectedRegion;
            
            if (hasWines || !wineType) {
                // Region has wines - use normal colors
                layer.setStyle({
                    color: colors.border,
                    fillColor: colors.fill,
                    weight: isSelected ? 4 : 1.5,
                    fillOpacity: isSelected ? 0.5 : 0.08,
                    opacity: isSelected ? 1 : 0.8,
                    dashArray: isSelected ? '10, 5' : null,
                    lineCap: 'round',
                    lineJoin: 'round'
                });
                // Re-enable interactions
                layer.options.interactive = true;
            } else {
                // Region has no wines - show disabled state
                layer.setStyle({
                    color: '#666',
                    fillColor: '#333',
                    weight: 1.5,
                    fillOpacity: 0.05,
                    opacity: 0.5,
                    lineCap: 'round',
                    lineJoin: 'round',
                    dashArray: '5, 5'
                });
                // Disable interactions for regions without wines
                layer.options.interactive = false;
            }
        });
    } else {
        console.warn('⚠️ geoJsonLayer is null, map may not be initialized yet');
        // Try to wait for map initialization
        const mapElement = document.getElementById('map');
        if (mapElement && !mapElement._leaflet_id) {
            console.log('⏳ Map not initialized yet, will retry after map loads');
        }
    }
}

// Dashboard functionality - show regions panel
function showRegionsPanel(wineType) {
    currentWineType = wineType;
    const panel = document.getElementById('regionsPanel');
    const title = document.getElementById('regionsPanelTitle');
    const subtitle = document.getElementById('regionsPanelSubtitle');
    const list = document.getElementById('regionsList');
    
    if (!panel) return;
    
    // Get wine type name
    const wineTypeNames = {
        'ROSSO': 'Red Wines',
        'BIANCO': 'White Wines',
        'ROSATO': 'Rosé Wines',
        'ARANCIONE': 'Orange Wines',
        'BOLLICINE': 'Sparkling',
        'NON ALCOLICO': 'Non-Alcoholic'
    };
    
    title.textContent = wineTypeNames[wineType] || 'Regions';
    subtitle.textContent = 'Select a region';
    
    // Load regions using wineApp if available
    if (window.wineApp && window.wineApp.wines && window.wineApp.wines.length > 0) {
        loadRegionsForWineType(wineType, list);
    } else {
        waitForWineApp(() => {
            if (window.wineApp && window.wineApp.wines && window.wineApp.wines.length > 0) {
                loadRegionsForWineType(wineType, list);
            }
        });
    }
    
    panel.classList.add('active');
    
    // Close wines panel when opening regions
    const winesPanel = document.getElementById('winesPanel');
    if (winesPanel) {
        winesPanel.classList.remove('active');
    }
}

// Load regions for a specific wine type
function loadRegionsForWineType(wineType, listContainer) {
    if (!window.wineApp || !window.wineApp.wines) return;
    
    // Filter wines by type
    const filteredWines = window.wineApp.wines.filter(wine => {
        return window.wineApp.wineMatchesFamily(wine, wineType);
    });
    
    // Get unique regions
    const regionSet = new Set();
    filteredWines.forEach(wine => {
        if (wine.region && wine.region.trim() !== '') {
            const normalizedRegion = window.wineApp.normalizeRegionName(wine.region);
            regionSet.add(normalizedRegion);
        }
    });
    
    const regions = Array.from(regionSet).sort();
    
    // Clear and populate list
    listContainer.innerHTML = '';
    
    if (regions.length === 0) {
        listContainer.innerHTML = '<div style="color: rgba(245, 245, 240, 0.5); text-align: center; padding: 2rem;">No regions found</div>';
        return;
    }
    
    regions.forEach(region => {
        // Count wines in this region and type
        const count = filteredWines.filter(wine => {
            const normalizedWineRegion = window.wineApp.normalizeRegionName(wine.region);
            return normalizedWineRegion === region;
        }).length;
        
        const regionItem = document.createElement('div');
        regionItem.className = 'region-item';
        regionItem.innerHTML = `
            <div class="region-item-name">${region}</div>
            <div class="region-item-count">${count} wines</div>
        `;
        
        // Store region name for hover effect
        regionItem.dataset.regionName = region;
        
        // Add hover effect to highlight region on map
        regionItem.addEventListener('mouseenter', function() {
            if (geoJsonLayer) {
                // Convert normalized region name to map region name
                const mapRegionName = getMapRegionName(region);
                
                geoJsonLayer.eachLayer(function(layer) {
                    const mapRegion = layer.feature && layer.feature.properties.reg_name;
                    // Match both normalized and map region names
                    if (mapRegion === mapRegionName || mapRegion === region) {
                        // Use currentWineType from global scope
                        const hasWines = currentWineType ? regionHasWines(region, currentWineType) : true;
                        if (hasWines || !currentWineType) {
                            layer.setStyle({
                                weight: 3,
                                fillOpacity: 0.35,
                                fillColor: currentColors.fill,
                                color: currentColors.border,
                                opacity: 1,
                                dashArray: null
                            });
                            layer.bringToFront();
                            
                            // Show tooltip for sidebar hover
                            const tooltip = document.getElementById('regionTooltip');
                            if (tooltip && mapInstance) {
                                tooltip.textContent = mapRegionName;
                                tooltip.style.display = 'block';
                                // Position tooltip near the region center
                                const bounds = layer.getBounds();
                                const center = bounds.getCenter();
                                const containerPoint = mapInstance.latLngToContainerPoint(center);
                                const mapWrapper = document.getElementById('mapWrapper');
                                if (mapWrapper) {
                                    const rect = mapWrapper.getBoundingClientRect();
                                    tooltip.style.left = (containerPoint.x) + 'px';
                                    tooltip.style.top = (containerPoint.y - tooltip.offsetHeight - 15) + 'px';
                                }
                            }
                        }
                    }
                });
            }
        });
        
        regionItem.addEventListener('mouseleave', function() {
            // Hide tooltip
            const tooltip = document.getElementById('regionTooltip');
            if (tooltip) tooltip.style.display = 'none';
            
            if (geoJsonLayer) {
                // Convert normalized region name to map region name
                const mapRegionName = getMapRegionName(region);
                
                geoJsonLayer.eachLayer(function(layer) {
                    const mapRegion = layer.feature && layer.feature.properties.reg_name;
                    // Match both normalized and map region names
                    if ((mapRegion === mapRegionName || mapRegion === region) && layer !== selectedRegion) {
                        // Use currentWineType from global scope
                        const hasWines = currentWineType ? regionHasWines(region, currentWineType) : true;
                        if (hasWines || !currentWineType) {
                            layer.setStyle({
                                weight: 1.5,
                                fillOpacity: 0.08,
                                fillColor: currentColors.fill,
                                color: currentColors.border,
                                opacity: 0.8,
                                dashArray: null
                            });
                        } else {
                            layer.setStyle({
                                weight: 1.5,
                                fillOpacity: 0.03,
                                color: '#666666',
                                fillColor: '#666666',
                                opacity: 0.5,
                                dashArray: '5, 5'
                            });
                        }
                    }
                });
            }
        });
        
        regionItem.addEventListener('click', function(e) {
            // Prevent event from bubbling up to parent elements that might interfere
            if (e) {
                e.stopPropagation();
                e.preventDefault();
            }
            
            // Get the actual region-item element (in case click was on a child)
            const clickedItem = e && e.currentTarget ? e.currentTarget : this;
            
            // Get region name from the clicked item or from closure
            const regionName = clickedItem.dataset.regionName || region;
            
            // Remove active class from all items
            document.querySelectorAll('.region-item').forEach(item => {
                item.classList.remove('active');
            });
            clickedItem.classList.add('active');
            
            // Show wines list instead of map - show ALL wine types (pass null)
            console.log('🔵 Region item clicked:', regionName, 'showing ALL wine types');
            if (typeof showWinesListForRegion === 'function') {
                showWinesListForRegion(regionName, null); // null = all wine types
            } else {
                console.error('❌ showWinesListForRegion is not a function');
            }
            
            // Also highlight the region on the map if it exists
            if (geoJsonLayer) {
                const mapRegionName = getMapRegionName(region);
                geoJsonLayer.eachLayer(function(layer) {
                    const mapRegion = layer.feature && layer.feature.properties.reg_name;
                    if (mapRegion === mapRegionName || mapRegion === region) {
                        selectedRegion = layer;
                        const regName = layer._regionName;
                        
                        // Reset all regions first
                        geoJsonLayer.eachLayer(function(l) {
                            const rName = l._regionName;
                            const hasWines = rName ? regionHasWines(rName, wineType) : false;
                            
                            if (hasWines || !wineType) {
                                l.setStyle({
                                    weight: 1.5,
                                    fillOpacity: 0.08,
                                    color: currentColors.border,
                                    fillColor: currentColors.fill,
                                    opacity: 0.8,
                                    dashArray: null
                                });
                            } else {
                                l.setStyle({
                                    weight: 1.5,
                                    fillOpacity: 0.03,
                                    color: '#666666',
                                    fillColor: '#666666',
                                    opacity: 0.5,
                                    dashArray: '5, 5'
                                });
                            }
                        });
                        
                        // Highlight selected region
                        layer.setStyle({
                            weight: 2.5,
                            color: currentColors.border,
                            fillColor: currentColors.fill,
                            fillOpacity: 0.25,
                            opacity: 1,
                            dashArray: null
                        });
                    }
                });
            }
        });
        
        listContainer.appendChild(regionItem);
    });
}

/* ==================== INDEX PAGE INTERACTIVE MAP ==================== */
function initInteractiveMap() {
        const mapContainer = document.getElementById('map');
        if (!mapContainer) {
            return;
        }
        // getWineTypeColors is now a global function (defined above)
        
        // Region data with detailed information
        const regionData = {
            "Abruzzo": { 
                population: "1.3M", 
                area: "10,763 km²", 
                capital: "L'Aquila",
                fact: "Known as the 'Green Region of Europe' with three national parks and one regional park.",
                wineFacts: "Famous for Montepulciano d'Abruzzo and Trebbiano d'Abruzzo wines."
            },
            "Basilicata": { 
                population: "563K", 
                area: "9,992 km²", 
                capital: "Potenza",
                fact: "The region with the lowest population density in Italy, rich in ancient history.",
                wineFacts: "Known for Aglianico del Vulture, one of Italy's oldest wine varieties."
            },
            "Calabria": { 
                population: "1.9M", 
                area: "15,080 km²", 
                capital: "Catanzaro",
                fact: "The 'toe' of Italy's boot, with stunning coastlines and ancient Greek heritage.",
                wineFacts: "Produces Cirò, one of Italy's oldest DOC wines dating back to ancient Greece."
            },
            "Campania": { 
                population: "5.8M", 
                area: "13,590 km²", 
                capital: "Napoli",
                fact: "Home to Mount Vesuvius, Pompeii, and the birthplace of pizza.",
                wineFacts: "Famous for Taurasi, Greco di Tufo, and Fiano di Avellino."
            },
            "Emilia-Romagna": { 
                population: "4.5M", 
                area: "22,446 km²", 
                capital: "Bologna",
                fact: "Italy's culinary heartland, known for Parmigiano-Reggiano, Prosciutto di Parma, and balsamic vinegar.",
                wineFacts: "Produces Lambrusco, Sangiovese di Romagna, and Albana di Romagna."
            },
            "Friuli-Venezia Giulia": { 
                population: "1.2M", 
                area: "7,862 km²", 
                capital: "Trieste",
                fact: "A cultural crossroads between Italian, Slavic, and Germanic influences.",
                wineFacts: "Renowned for white wines like Pinot Grigio, Sauvignon Blanc, and Ribolla Gialla."
            },
            "Lazio": { 
                population: "5.9M", 
                area: "17,232 km²", 
                capital: "Roma",
                fact: "The Eternal City region, home to Rome and the Vatican City.",
                wineFacts: "Known for Frascati, Est! Est!! Est!!!, and Cesanese del Piglio."
            },
            "Liguria": { 
                population: "1.6M", 
                area: "5,422 km²", 
                capital: "Genova",
                fact: "The Italian Riviera, famous for its dramatic coastline and colorful fishing villages.",
                wineFacts: "Produces Vermentino, Pigato, and Rossese di Dolceacqua."
            },
            "Lombardia": { 
                population: "10.1M", 
                area: "23,861 km²", 
                capital: "Milano",
                fact: "Italy's wealthiest and most industrialized region, home to fashion and finance.",
                wineFacts: "Known for Franciacorta sparkling wines, Valtellina Nebbiolo, and Oltrepò Pavese."
            },
            "Marche": { 
                population: "1.5M", 
                area: "9,694 km²", 
                capital: "Ancona",
                fact: "The region of a hundred cities, with rolling hills and medieval hilltop towns.",
                wineFacts: "Famous for Verdicchio dei Castelli di Jesi and Rosso Conero."
            },
            "Molise": { 
                population: "306K", 
                area: "4,438 km²", 
                capital: "Campobasso",
                fact: "Italy's second-smallest region, known for its unspoiled landscapes and traditions.",
                wineFacts: "Produces Biferno, Tintilia del Molise, and Pentro di Isernia."
            },
            "Piemonte": { 
                population: "4.4M", 
                area: "25,387 km²", 
                capital: "Torino",
                fact: "Home to the Italian Alps, the Slow Food movement, and legendary wine regions.",
                wineFacts: "World-famous for Barolo, Barbaresco, Barbera d'Asti, and Moscato d'Asti."
            },
            "Puglia": { 
                population: "4M", 
                area: "19,358 km²", 
                capital: "Bari",
                fact: "The 'heel' of Italy's boot, with over 800 km of coastline and unique trulli architecture.",
                wineFacts: "Known for Primitivo di Manduria, Negroamaro, and Salice Salentino."
            },
            "Sardegna": { 
                population: "1.6M", 
                area: "24,090 km²", 
                capital: "Cagliari",
                fact: "Italy's second-largest island, with pristine beaches and unique Nuragic civilization.",
                wineFacts: "Produces Cannonau, Vermentino di Sardegna, and Carignano del Sulcis."
            },
            "Sicilia": { 
                population: "5M", 
                area: "25,711 km²", 
                capital: "Palermo",
                fact: "Italy's largest island, home to Mount Etna and rich Greek, Arab, and Norman heritage.",
                wineFacts: "Famous for Marsala, Etna DOC wines, Nero d'Avola, and Grillo."
            },
            "Toscana": { 
                population: "3.7M", 
                area: "22,993 km²", 
                capital: "Firenze",
                fact: "The cradle of the Renaissance, with rolling hills, cypress trees, and medieval towns.",
                wineFacts: "World-renowned for Chianti, Brunello di Montalcino, Vino Nobile di Montepulciano, and Super Tuscans."
            },
            "Trentino-Alto Adige": { 
                population: "1.1M", 
                area: "13,607 km²", 
                capital: "Trento",
                fact: "A bilingual region in the Italian Alps, combining Italian and Austrian cultures.",
                wineFacts: "Produces Pinot Grigio, Gewürztraminer, Lagrein, and Teroldego Rotaliano."
            },
            "Umbria": { 
                population: "882K", 
                area: "8,456 km²", 
                capital: "Perugia",
                fact: "Italy's green heart, known as the 'green heart of Italy' with medieval hill towns.",
                wineFacts: "Famous for Orvieto, Sagrantino di Montefalco, and Torgiano Rosso Riserva."
            },
            "Valle d'Aosta": { 
                population: "126K", 
                area: "3,263 km²", 
                capital: "Aosta",
                fact: "Italy's smallest region, entirely in the Alps with stunning mountain peaks.",
                wineFacts: "Produces Petit Rouge, Fumin, and Nebbiolo-based wines at high altitudes."
            },
            "Veneto": { 
                population: "4.9M", 
                area: "18,399 km²", 
                capital: "Venezia",
                fact: "Home to Venice, Verona, and the Dolomites, rich in art and culture.",
                wineFacts: "Famous for Amarone della Valpolicella, Prosecco, Soave, and Valpolicella."
            }
        };
        // Use global variables declared above (geoJsonLayer, selectedRegion, currentColors, mapInstance, currentWineType, etc.)
        // Check URL parameters for region and type
        const urlParams = new URLSearchParams(window.location.search);
        const urlRegion = urlParams.get('region');
        const urlType = urlParams.get('type');
        
        // Set current wine type if provided in URL
        if (urlType) {
            currentWineType = urlType;
            // Update map colors for the wine type
            updateMapColors(urlType);
            // Activate corresponding wine card
            document.querySelectorAll('.wine-card-sidebar').forEach(card => {
                if (card.dataset.type === urlType) {
                    card.classList.add('active');
                } else {
                    card.classList.remove('active');
                }
            });
        }
        
        // Check if map is already initialized
        if (mapContainer._leaflet_id) {
            console.log('Map already initialized, skipping...');
            return;
        }
        // Initialize map with uniform touch/mouse interactions
        mapInstance = L.map('map', {
            zoomControl: true,
            minZoom: 6,
            maxZoom: 8,
            maxBounds: [[35.5, 5.0], [48.0, 20.0]],
            maxBoundsViscosity: 0.5, // Reduced for smoother panning
            tap: true, // Enable tap on touch devices
            touchZoom: true, // Enable pinch zoom on touch devices
            doubleClickZoom: true, // Enable double-click zoom
            scrollWheelZoom: true, // Enable scroll wheel zoom on desktop
            boxZoom: true, // Enable box zoom
            dragging: true, // Enable dragging/panning
            keyboard: true, // Enable keyboard navigation
            inertia: true, // Enable inertia for smoother panning
            inertiaDeceleration: 3000, // Deceleration rate for inertia
            inertiaMaxSpeed: 1500, // Max speed for inertia
            worldCopyJump: false // Prevent map from jumping when panning
        }).setView([41.9, 12.6], 6);
        
        // Add tile layer with HTTPS tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(mapInstance);
        
        function updateMobileMapHeight() {
            const mobileContainer = document.getElementById('mobileMapWinesContainer');
            const mobileWrapper = document.getElementById('mobileMapWrapper');
            if (!mobileContainer || !mobileWrapper) {
                return;
            }
            const viewport = window.visualViewport;
            const viewportHeight = viewport ? viewport.height : window.innerHeight;
            const topNav = document.querySelector('.top-nav');
            const wineSelector = document.querySelector('.mobile-wine-type-selector');
            const searchBar = document.getElementById('mobileSearchBarContainer');
            let reservedHeight = 0;
            if (topNav && window.getComputedStyle(topNav).display !== 'none') {
                reservedHeight += topNav.offsetHeight;
            }
            if (wineSelector && window.getComputedStyle(wineSelector).display !== 'none') {
                reservedHeight += wineSelector.offsetHeight;
            }
            if (searchBar && searchBar.classList.contains('visible')) {
                reservedHeight += searchBar.offsetHeight;
            }
            const mapHeight = Math.max(320, viewportHeight - reservedHeight - 40);
            mobileWrapper.style.height = `${mapHeight}px`;
            mobileWrapper.style.minHeight = `${mapHeight}px`;
            mobileWrapper.style.maxHeight = `${mapHeight}px`;
            mobileContainer.style.setProperty('--mobile-map-height', `${mapHeight}px`);
        }
        
        // Update mobile wines cards container height for iPhone Safari
        function updateMobileWinesCardsHeight() {
            const winesContainer = document.getElementById('mobileWinesCardsContainer');
            const winesHeader = document.querySelector('.mobile-wines-cards-header');
            if (!winesContainer || window.getComputedStyle(winesContainer).display === 'none') {
                return;
            }
            const viewport = window.visualViewport;
            const viewportHeight = viewport ? viewport.height : window.innerHeight;
            const topNav = document.querySelector('.top-nav');
            const wineSelector = document.querySelector('.mobile-wine-type-selector');
            const searchBar = document.getElementById('mobileSearchBarContainer');
            let reservedHeight = 0;
            if (topNav && window.getComputedStyle(topNav).display !== 'none') {
                reservedHeight += topNav.offsetHeight;
            }
            if (wineSelector && window.getComputedStyle(wineSelector).display !== 'none') {
                reservedHeight += wineSelector.offsetHeight;
            }
            if (searchBar && searchBar.classList.contains('visible')) {
                reservedHeight += searchBar.offsetHeight;
            }
            if (winesHeader) {
                reservedHeight += winesHeader.offsetHeight;
            }
            // Use actual viewport height minus reserved space
            // Add safe area insets for iPhone
            const safeAreaTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)') || '0', 10) || 0;
            const safeAreaBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom)') || '0', 10) || 0;
            
            // Calculate available height more accurately
            // Use 100vh or 100dvh for better iOS Safari support
            const fullHeight = window.innerHeight || document.documentElement.clientHeight;
            const availableHeight = fullHeight - reservedHeight;
            
            // Set min-height instead of fixed height to allow flex to work
            // This prevents compression while still ensuring minimum space
            winesContainer.style.minHeight = `${availableHeight}px`;
            winesContainer.style.height = 'auto';
            winesContainer.style.maxHeight = 'none';
            
            // Ensure grid container can scroll properly and doesn't collapse
            const winesGrid = document.getElementById('mobileWinesCardsGrid');
            if (winesGrid) {
                winesGrid.style.height = 'auto';
                winesGrid.style.maxHeight = 'none';
                winesGrid.style.minHeight = '0';
                // Force recalculation of grid layout
                winesGrid.style.display = 'none';
                winesGrid.offsetHeight; // Trigger reflow
                winesGrid.style.display = 'grid';
            }
        }
        
        let viewportResizeTimer = null;
        function scheduleViewportRefresh(extraDelay = 0) {
            if (viewportResizeTimer) {
                clearTimeout(viewportResizeTimer);
            }
            viewportResizeTimer = setTimeout(() => {
                updateMobileMapHeight();
                updateMobileWinesCardsHeight();
                if (mapInstance) {
                    mapInstance.invalidateSize();
                }
                if (window.innerWidth <= 1024) {
                    if (mobileMapInstance) {
                        mobileMapInstance.invalidateSize();
                    } else {
                        initializeMobileMap();
                    }
                }
            }, 200 + extraDelay);
        }
        window.addEventListener('resize', () => scheduleViewportRefresh());
        window.addEventListener('orientationchange', () => scheduleViewportRefresh(200));
        
        // Listen for visualViewport changes (iPhone Safari address bar show/hide)
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => {
                scheduleViewportRefresh();
            });
            window.visualViewport.addEventListener('scroll', () => {
                scheduleViewportRefresh();
            });
        }
        
        // Load GeoJSON with error handling and fallback
        fetch('https://raw.githubusercontent.com/openpolis/geojson-italy/master/geojson/limits_IT_regions.geojson')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(geojson => {
                console.log('🗺️ GeoJSON loaded successfully');
                geoJsonLayer = L.geoJSON(geojson, {
                    style: function(feature) {
                        return {
                            color: currentColors.border,
                            weight: 1.5,
                            fillOpacity: 0.08,
                            fillColor: currentColors.fill,
                            lineCap: 'round',
                            lineJoin: 'round'
                        };
                    },
                    onEachFeature: onEachFeature
                }).addTo(mapInstance);
                console.log('✅ geoJsonLayer created and added to map');
                mapInstance.fitBounds(geoJsonLayer.getBounds(), { padding: [20, 20] });
                
                // Close region info on map click
                mapInstance.on('click', function(e) {
                    if (e.originalEvent.target.tagName === 'DIV') {
                        const regionInfo = document.getElementById('regionInfo');
                        if (regionInfo) {
                            regionInfo.style.display = 'none';
                        }
                    }
                });
                
                // If URL has region parameter, select and show that region
                if (urlRegion && geoJsonLayer) {
                    waitForWineApp(() => {
                        // Find the region on the map
                        geoJsonLayer.eachLayer(function(layer) {
                            const mapRegionName = layer._regionName;
                            if (mapRegionName) {
                                // Normalize region names for comparison
                                const normalizedMapRegion = window.wineApp ? window.wineApp.normalizeRegionName(mapRegionName) : mapRegionName;
                                const normalizedUrlRegion = window.wineApp ? window.wineApp.normalizeRegionName(urlRegion) : urlRegion;
                                
                                if (normalizedMapRegion === normalizedUrlRegion || mapRegionName === urlRegion) {
                                    // Select this region
                                    selectRegion(layer, mapRegionName);
                                }
                            }
                        });
                    });
                }
            })
            .catch(error => {
                console.error('❌ Error loading GeoJSON:', error);
                console.error('📍 GeoJSON URL:', 'https://raw.githubusercontent.com/openpolis/geojson-italy/master/geojson/limits_IT_regions.geojson');
                console.error('📍 Current URL:', window.location.href);
                
                // Show error message to user
                mapContainer.innerHTML = `
                            <div style="
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                height: 100%;
                                flex-direction: column;
                                gap: 1rem;
                                color: rgba(245, 245, 240, 0.7);
                                text-align: center;
                                padding: 2rem;
                            ">
                                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--gold);"></i>
                                <h3 style="font-family: 'Cinzel', serif; color: var(--gold); margin: 0;">Map Unavailable</h3>
                                <p style="margin: 0;">Unable to load map data. Please check your internet connection and try refreshing the page.</p>
                                <button onclick="location.reload()" style="
                                    background: var(--gold);
                                    color: var(--dark);
                                    border: none;
                                    padding: 0.75rem 1.5rem;
                                    border-radius: 8px;
                                    font-family: 'Cinzel', serif;
                                    font-weight: 600;
                                    cursor: pointer;
                                    margin-top: 1rem;
                                    transition: transform 0.2s ease;
                                " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">Retry</button>
                            </div>
                        `;
            });
        // Mobile Menu Management
        let currentMobileView = 'regions';
        let currentMobileWineType = null;
        let currentMobileRegion = null;
        // Mobile Menu Functions
        function openMobileMenu() {
            const menu = document.getElementById('mobileSideMenu');
            const overlay = document.getElementById('mobileOverlay');
            if (menu && overlay) {
                menu.classList.add('open');
                overlay.classList.add('visible');
                document.body.style.overflow = 'hidden';
            }
        }
        function closeMobileMenu() {
            const menu = document.getElementById('mobileSideMenu');
            const overlay = document.getElementById('mobileOverlay');
            if (menu && overlay) {
                menu.classList.remove('open');
                overlay.classList.remove('visible');
                document.body.style.overflow = '';
            }
        }
        function showMobileView(viewName) {
            const views = {
                'regions': document.getElementById('mobileRegionsView'),
                'wines': document.getElementById('mobileWinesView')
            };
            Object.values(views).forEach(view => {
                if (view) {
                    view.classList.remove('mobile-view-active');
                }
            });
            if (views[viewName]) {
                views[viewName].classList.add('mobile-view-active');
                currentMobileView = viewName;
            }
        }
        function loadMobileMenuCategories() {
            const menuCategories = document.getElementById('mobileMenuCategories');
            if (!menuCategories) return;
            menuCategories.innerHTML = '';
            
            // Placeholder invece dei filtri
            const placeholders = [
                { name: 'Riccardo Wine Cellar', action: null },
                { name: 'Ala Carte Menu', action: null }
            ];
            
            placeholders.forEach(placeholder => {
                const categoryItem = document.createElement('div');
                categoryItem.className = 'mobile-menu-category';
                categoryItem.innerHTML = `
                    <span class="mobile-menu-category-name">${placeholder.name}</span>
                    <div>
                        <i class="fas fa-chevron-right" style="color: var(--gold);"></i>
                    </div>
                `;
                if (placeholder.action) {
                    categoryItem.addEventListener('click', placeholder.action);
                } else {
                    categoryItem.style.cursor = 'default';
                    categoryItem.style.opacity = '0.7';
                }
                menuCategories.appendChild(categoryItem);
            });
        }
        function loadMobileRegions(wineType) {
            const regionsList = document.getElementById('mobileRegionsList');
            const regionsTitle = document.getElementById('mobileRegionsTitle');
            const backBtn = document.getElementById('mobileBackToCategories');
            if (!regionsList || !window.wineApp) return;
            waitForWineApp(() => {
                if (!window.wineApp || !window.wineApp.wines) return;
                const wineTypeNames = {
                    'ROSSO': 'Red Wines',
                    'BIANCO': 'White Wines',
                    'ROSATO': 'Rosé Wines',
                    'ARANCIONE': 'Orange Wines',
                    'BOLLICINE': 'Sparkling',
                    'NON ALCOLICO': 'Non-Alcoholic'
                };
                if (regionsTitle) {
                    regionsTitle.textContent = wineTypeNames[wineType] || 'Wines';
                }
                if (backBtn) {
                    backBtn.style.display = 'flex';
                }
                // Filter wines by type
                const filteredWines = window.wineApp.wines.filter(wine => 
                    window.wineApp.wineMatchesFamily(wine, wineType)
                );
                // Get unique regions
                const regionSet = new Set();
                filteredWines.forEach(wine => {
                    const normalizedRegion = window.wineApp.normalizeRegionName(wine.region);
                    regionSet.add(normalizedRegion);
                });
                const regions = Array.from(regionSet).sort();
                regionsList.innerHTML = '';
                regions.forEach(region => {
                    const count = filteredWines.filter(wine => {
                        const normalizedWineRegion = window.wineApp.normalizeRegionName(wine.region);
                        return normalizedWineRegion === region;
                    }).length;
                    const regionCard = document.createElement('div');
                    regionCard.className = 'mobile-region-card';
                    regionCard.dataset.region = region;
                    regionCard.innerHTML = `
                        <span class="mobile-region-name">${region}</span>
                        <div>
                            <span class="mobile-region-count">${count} ${count === 1 ? 'wine' : 'wines'}</span>
                            <i class="fas fa-chevron-right" style="color: var(--gold);"></i>
                        </div>
                    `;
                    regionCard.addEventListener('click', () => {
                        currentMobileRegion = region;
                        loadMobileWines(region, wineType);
                        showMobileView('wines');
                    });
                    regionsList.appendChild(regionCard);
                });
            });
        }
        function loadMobileWines(region, wineType) {
            const winesList = document.getElementById('mobileWinesList');
            const winesTitle = document.getElementById('mobileWinesTitle');
            const background = document.getElementById('mobileRegionBackground');
            if (!winesList || !window.wineApp) return;
            waitForWineApp(() => {
                if (!window.wineApp || !window.wineApp.wines) return;
                if (winesTitle) {
                    winesTitle.textContent = `${region} Wines`;
                }
                // Set background image
                const regionImages = {
                    'TOSCANA': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200',
                    'PIEMONTE': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
                    'VENETO': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
                    'SICILIA': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200',
                    'LOMBARDIA': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
                    'EMILIA-ROMAGNA': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
                    'LAZIO': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200',
                    'CAMPANIA': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200',
                    'PUGLIA': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200',
                    'SARDEGNA': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200',
                    'FRIULI-VENEZIA GIULIA': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
                    'TRENTINO ALTO-ADIGE': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
                    'VALLE D\'AOSTA': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
                    'LE MARCHE': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200',
                    'UMBRIA': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200',
                    'ABRUZZO': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200',
                    'MOLISE': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200',
                    'BASILICATA': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200',
                    'CALABRIA': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200',
                    'LIGURIA': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200'
                };
                const normalizedRegion = window.wineApp.normalizeRegionName(region);
                const bgImage = regionImages[normalizedRegion] || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200';
                if (background) {
                    const testImg = new Image();
                    testImg.onload = function() {
                        background.style.backgroundImage = `url('${bgImage}')`;
                        setTimeout(() => {
                            background.classList.add('visible');
                        }, 100);
                    };
                    testImg.onerror = function() {
                        background.classList.remove('visible');
                    };
                    testImg.src = bgImage;
                }
                // Filter wines
                const filteredWines = window.wineApp.wines.filter(wine => {
                    const normalizedWineRegion = window.wineApp.normalizeRegionName(wine.region);
                    const normalizedFilterRegion = window.wineApp.normalizeRegionName(region);
                    const matchesRegion = normalizedWineRegion === normalizedFilterRegion;
                    const matchesType = !wineType || window.wineApp.wineMatchesFamily(wine, wineType);
                    return matchesRegion && matchesType;
                });
                winesList.innerHTML = '';
                if (filteredWines.length === 0) {
                    winesList.innerHTML = '<div style="color: rgba(245, 245, 240, 0.5); text-align: center; padding: 2rem;">No wines found for this region and type</div>';
                    return;
                }
                filteredWines.forEach(wine => {
                    const wineCard = document.createElement('div');
                    wineCard.className = 'mobile-wine-card';
                    wineCard.dataset.wineId = wine.wine_number;
                    
                    const price = wine.wine_price || wine.wine_price_bottle || wine.wine_price_glass || 'N/A';
                    const vintage = wine.wine_vintage ? wine.wine_vintage.match(/\b(19|20)\d{2}\b/)?.[0] || 'N/A' : 'N/A';
                    const producer = wine.wine_producer || 'Unknown Producer';
                    wineCard.innerHTML = `
                        <div class="mobile-wine-info">
                            <div class="mobile-wine-name">${wine.wine_name || 'Unknown Wine'} <span class="mobile-wine-producer-inline">- ${producer}</span></div>
                            <div class="mobile-wine-vintage">${vintage !== 'N/A' ? vintage : ''}</div>
                        </div>
                        <span class="mobile-wine-price">$${price}</span>
                        <i class="fas fa-chevron-right" style="color: var(--gold);"></i>
                    `;
                    wineCard.addEventListener('click', () => {
                        const params = new URLSearchParams();
                        params.set('id', wine.wine_number);
                        if (wineType) {
                            params.set('type', wineType);
                        }
                        params.set('from', 'index');
                        window.location.href = `wine-details.html?${params.toString()}`;
                    });
                    winesList.appendChild(wineCard);
                });
            });
        }
        // Load Mobile Wine Type Chips
        function loadMobileWineTypeChips() {
            const wineTypesScroll = document.getElementById('mobileWineTypesScroll');
            if (!wineTypesScroll || !window.wineApp) return;
            waitForWineApp(() => {
                if (!window.wineApp || !window.wineApp.wines) return;
                wineTypesScroll.innerHTML = '';
                const wineTypes = [
                    { type: 'ROSSO', name: 'Red', icon: './image/glassRed.png' },
                    { type: 'BIANCO', name: 'White', icon: './image/glassWhite.png' },
                    { type: 'ROSATO', name: 'Rosé', icon: './image/glRose.png' },
                    { type: 'ARANCIONE', name: 'Orange', icon: './image/glArancione.png' },
                    { type: 'BOLLICINE', name: 'Sparkling', icon: './image/glSparkling.png' },
                    { type: 'NON ALCOLICO', name: 'Non-Alc', icon: './image/gl00.png' }
                ];
                wineTypes.forEach(({ type, name, icon }) => {
                    const count = window.wineApp.wines.filter(wine => 
                        window.wineApp.wineMatchesFamily(wine, type)
                    ).length;
                    if (count > 0) {
                        const chip = document.createElement('div');
                        chip.className = 'mobile-wine-type-chip';
                        chip.dataset.type = type;
                        chip.innerHTML = `
                            <div class="mobile-wine-type-icon">
                                <img src="${icon}" alt="${name}">
                            </div>
                            <div class="mobile-wine-type-name">${name}</div>
                            <div class="mobile-wine-type-count">${count}</div>
                        `;
                        chip.addEventListener('click', () => {
                            document.querySelectorAll('.mobile-wine-type-chip').forEach(c => {
                                c.classList.remove('active');
                            });
                            chip.classList.add('active');
                            mobileCurrentWineType = type;
                            updateMobileMapColors(type);
                        });
                        wineTypesScroll.appendChild(chip);
                    }
                });
            });
        }
        // Initialize Mobile Map
        function initializeMobileMap() {
            const mobileMapContainer = document.getElementById('mobileMap');
            if (!mobileMapContainer) {
                console.log('Mobile map container not found');
                return;
            }
            updateMobileMapHeight();
            // Wait a bit for container to be ready
            setTimeout(() => {
                if (mobileMapContainer._leaflet_id) {
                    console.log('Mobile map already initialized, skipping...');
                    return;
                }
                try {
                    mobileMapInstance = L.map('mobileMap', {
                        zoomControl: true,
                        minZoom: 5,
                        maxZoom: 8,
                        maxBounds: [[35.5, 5.0], [48.0, 20.0]],
                        maxBoundsViscosity: 0.5, // Reduced for smoother panning (matching desktop)
                        tap: true, // Enable tap on touch devices
                        touchZoom: true, // Enable pinch zoom on touch devices
                        doubleClickZoom: true, // Enable double-click zoom
                        scrollWheelZoom: false, // Disable scroll zoom on mobile
                        boxZoom: false, // Disable box zoom on mobile
                        dragging: true, // Enable dragging/panning
                        keyboard: false, // Disable keyboard on mobile
                        inertia: true, // Enable inertia for smoother panning
                        inertiaDeceleration: 3000, // Deceleration rate for inertia (matching desktop)
                        inertiaMaxSpeed: 1500, // Max speed for inertia (matching desktop)
                        worldCopyJump: false // Prevent map from jumping when panning
                    }).setView([41.9, 12.6], 6); // Zoom level 6 to show more of Italy
                    // Add tile layer with dark theme
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '© OpenStreetMap contributors',
                        maxZoom: 19
                    }).addTo(mobileMapInstance);
                    // Invalidate size after a short delay to ensure proper rendering
                    setTimeout(() => {
                        mobileMapInstance.invalidateSize();
                    }, 100);
                    fetch('https://raw.githubusercontent.com/openpolis/geojson-italy/master/geojson/limits_IT_regions.geojson')
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`HTTP error! status: ${response.status}`);
                            }
                            return response.json();
                        })
                        .then(geojson => {
                            console.log('🗺️ Mobile GeoJSON loaded successfully');
                            mobileGeoJsonLayer = L.geoJSON(geojson, {
                                style: function(feature) {
                                    return {
                                        color: currentColors.border,
                                        weight: 1.5,
                                        fillOpacity: 0.08,
                                        fillColor: currentColors.fill,
                                        lineCap: 'round',
                                        lineJoin: 'round'
                                    };
                                },
                                onEachFeature: onEachMobileFeature
                            }).addTo(mobileMapInstance);
                            console.log('✅ Mobile geoJsonLayer created and added to map');
                            // Fit bounds with more padding to show all regions better
                            mobileMapInstance.fitBounds(mobileGeoJsonLayer.getBounds(), { padding: [50, 50] });
                            
                            // Invalidate size again after GeoJSON is added
                            setTimeout(() => {
                                mobileMapInstance.invalidateSize();
                            }, 200);
                            scheduleViewportRefresh();
                        })
                        .catch(error => {
                            console.error('❌ Error loading mobile GeoJSON:', error);
                            console.error('📍 GeoJSON URL:', 'https://raw.githubusercontent.com/openpolis/geojson-italy/master/geojson/limits_IT_regions.geojson');
                            console.error('📍 Current URL:', window.location.href);
                        });
                } catch (error) {
                    console.error('❌ Error initializing mobile map:', error);
                }
            }, 300);
        }
        // Handle each feature on mobile map
        function onEachMobileFeature(feature, layer) {
            const regionName = feature.properties.reg_name || feature.properties.NAME || feature.properties.name || 'Unknown';
            layer._regionName = regionName;
            // Check if region has wines for current type (or all types if none selected)
            const hasWines = regionHasWines(regionName, mobileCurrentWineType);
            const shouldEnable = hasWines || !mobileCurrentWineType;
            // Set initial style based on wine availability
            if (!shouldEnable) {
                layer.setStyle({
                    color: '#666',
                    fillColor: '#333',
                    weight: 1.5,
                    fillOpacity: 0.05,
                    opacity: 0.5
                });
            }
            layer.on({
                click: function(e) {
                    // Prevent default map behavior
                    if (e.originalEvent) {
                        e.originalEvent.preventDefault();
                        e.originalEvent.stopPropagation();
                    }
                    
                    // Only allow selection if region has wines
                    if (shouldEnable) {
                        selectMobileRegion(layer, regionName);
                    }
                },
                mouseover: function(e) {
                    if (this !== mobileSelectedRegion && shouldEnable) {
                        this.setStyle({
                            weight: 3,
                            fillOpacity: 0.35,
                            fillColor: mobileCurrentWineType ? currentColors.fill : '#D4AF37',
                            color: mobileCurrentWineType ? currentColors.border : '#D4AF37',
                            opacity: 1
                        });
                        this.bringToFront();
                    }
                },
                mouseout: function(e) {
                    if (this !== mobileSelectedRegion && shouldEnable) {
                        this.setStyle({
                            weight: 1.5,
                            fillOpacity: 0.08,
                            fillColor: mobileCurrentWineType ? currentColors.fill : '#D4AF37',
                            color: mobileCurrentWineType ? currentColors.border : '#D4AF37',
                            opacity: 0.8
                        });
                    }
                }
            });
        }
        // Select Mobile Region
        function selectMobileRegion(layer, regionName) {
            if (!window.wineApp) {
                waitForWineApp(() => selectMobileRegion(layer, regionName));
                return;
            }
            if (mobileGeoJsonLayer && mobileSelectedRegion) {
                const hasWines = regionHasWines(mobileSelectedRegion._regionName, mobileCurrentWineType);
                if (hasWines || !mobileCurrentWineType) {
                    mobileSelectedRegion.setStyle({
                        weight: 1.5,
                        fillOpacity: 0.08,
                        fillColor: mobileCurrentWineType ? currentColors.fill : '#D4AF37',
                        color: mobileCurrentWineType ? currentColors.border : '#D4AF37',
                        opacity: 0.8
                    });
                }
            }
            mobileSelectedRegion = layer;
            layer.setStyle({
                weight: 4,
                fillOpacity: 0.5,
                fillColor: mobileCurrentWineType ? currentColors.fill : '#D4AF37',
                color: mobileCurrentWineType ? currentColors.border : '#D4AF37',
                opacity: 1,
                dashArray: '10, 5'
            });
            layer.bringToFront();
            // Get search term from mobile search input if present
            const mobileSearchInput = document.getElementById('mobileSearchInput');
            const searchTerm = mobileSearchInput ? mobileSearchInput.value.trim() : '';
            showMobileWinesForRegion(regionName, mobileCurrentWineType, searchTerm);
        }
        // Update Mobile Map Colors
        function updateMobileMapColors(wineType) {
            const colors = getWineTypeColors(wineType);
            currentColors = colors;
            if (mobileGeoJsonLayer) {
                mobileGeoJsonLayer.eachLayer(function(layer) {
                    const regionName = layer._regionName;
                    const hasWines = regionHasWines(regionName, wineType);
                    const isSelected = layer === mobileSelectedRegion;
                    
                    if (hasWines || !wineType) {
                        layer.setStyle({
                            color: colors.border,
                            fillColor: colors.fill,
                            weight: isSelected ? 4 : 1.5,
                            fillOpacity: isSelected ? 0.5 : 0.08,
                            opacity: isSelected ? 1 : 0.8,
                            dashArray: isSelected ? '10, 5' : null
                        });
                        // Re-enable interactions
                        layer.options.interactive = true;
                    } else {
                        layer.setStyle({
                            color: '#666',
                            fillColor: '#333',
                            weight: 1.5,
                            fillOpacity: 0.05,
                            opacity: 0.5
                        });
                        // Disable interactions for regions without wines
                        layer.options.interactive = false;
                    }
                });
            }
        }
        // Show Mobile Wines for Region
        function showMobileWinesForRegion(regionName, wineType, searchTerm = '') {
            const mapView = document.getElementById('mobileMapView');
            const winesContainer = document.getElementById('mobileWinesCardsContainer');
            const winesGrid = document.getElementById('mobileWinesCardsGrid');
            const winesTitle = document.getElementById('mobileWinesCardsTitle');
            const backBtn = document.getElementById('mobileBackToMapBtn');
            if (!mapView || !winesContainer || !winesGrid || !window.wineApp) return;
            waitForWineApp(() => {
                if (!window.wineApp || !window.wineApp.wines) return;
                mapView.style.display = 'none';
                winesContainer.style.display = 'flex';
                // Update height for iPhone Safari
                setTimeout(() => {
                    updateMobileWinesCardsHeight();
                }, 100);
                if (winesTitle) {
                    const typeName = wineType ? getWineTypeName(wineType) : 'All';
                    winesTitle.textContent = `${regionName} - ${typeName}`;
                }
                const filteredWines = window.wineApp.wines.filter(wine => {
                    const normalizedWineRegion = window.wineApp.normalizeRegionName(wine.region);
                    const normalizedFilterRegion = window.wineApp.normalizeRegionName(regionName);
                    const matchesRegion = normalizedWineRegion === normalizedFilterRegion;
                    const matchesType = !wineType || window.wineApp.wineMatchesFamily(wine, wineType);
                    
                    // Apply search filter if search term is provided
                    const matchesSearch = !searchTerm || 
                        wine.wine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        wine.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (wine.varietals && wine.varietals.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        (wine.wine_producer && wine.wine_producer.toLowerCase().includes(searchTerm.toLowerCase()));
                    
                    return matchesRegion && matchesType && matchesSearch;
                });
                winesGrid.innerHTML = '';
                if (filteredWines.length === 0) {
                    const noResultsMsg = searchTerm 
                        ? `No wines found matching "${searchTerm}" for this region and type`
                        : 'No wines found for this region and type';
                    winesGrid.innerHTML = `<div style="color: rgba(245, 245, 240, 0.5); text-align: center; padding: 2rem;">${noResultsMsg}</div>`;
                    return;
                }
                filteredWines.forEach(wine => {
                    const wineCard = document.createElement('div');
                    wineCard.className = 'mobile-wine-card-grid';
                    wineCard.dataset.wineId = wine.wine_number;
                    
                    const price = wine.wine_price || wine.wine_price_bottle || wine.wine_price_glass || 'N/A';
                    const vintage = wine.wine_vintage ? wine.wine_vintage.match(/\b(19|20)\d{2}\b/)?.[0] || 'N/A' : 'N/A';
                    const producer = wine.wine_producer || 'Unknown Producer';
                    wineCard.innerHTML = `
                        <div class="mobile-wine-card-grid-header">
                            <div class="mobile-wine-card-grid-name">${wine.wine_name || 'Unknown Wine'} <span class="mobile-wine-card-grid-producer-inline">- ${producer}</span></div>
                            <div class="mobile-wine-card-grid-price">$${price}</div>
                        </div>
                        ${vintage !== 'N/A' ? `<div class="mobile-wine-card-grid-vintage">${vintage}</div>` : ''}
                    `;
                    wineCard.addEventListener('click', () => {
                        const params = new URLSearchParams();
                        params.set('id', wine.wine_number);
                        if (wineType) {
                            params.set('type', wineType);
                        }
                        params.set('from', 'index');
                        window.location.href = `wine-details.html?${params.toString()}`;
                    });
                    winesGrid.appendChild(wineCard);
                });
                // Force reflow per prevenire sovrapposizione delle card
                winesGrid.offsetHeight; // Trigger reflow
                // Force grid layout recalculation
                setTimeout(() => {
                    winesGrid.style.display = 'none';
                    winesGrid.offsetHeight; // Trigger reflow
                    winesGrid.style.display = 'grid';
                }, 10);
                if (backBtn) {
                    backBtn.onclick = () => {
                        mapView.style.display = 'flex';
                        winesContainer.style.display = 'none';
                        // Reset height when going back to map
                        winesContainer.style.height = '';
                        winesContainer.style.maxHeight = '';
                        winesContainer.style.minHeight = '';
                        // Update map height
                        setTimeout(() => {
                            updateMobileMapHeight();
                        }, 100);
                    };
                }
            });
        }
        // Get Wine Type Name
        function getWineTypeName(type) {
            const names = {
                'ROSSO': 'Red Wines',
                'BIANCO': 'White Wines',
                'ROSATO': 'Rosé Wines',
                'ARANCIONE': 'Orange Wines',
                'BOLLICINE': 'Sparkling',
                'NON ALCOLICO': 'Non-Alcoholic'
            };
            return names[type] || 'All Wines';
        }
        // Mobile Search Bar Toggle
        function toggleMobileSearchBar() {
            const searchBarContainer = document.getElementById('mobileSearchBarContainer');
            const contentWrapper = document.querySelector('.content-wrapper');
            const regionBackground = document.getElementById('mobileRegionBackground');
            
            if (searchBarContainer) {
                const isVisible = searchBarContainer.classList.contains('visible');
                
                if (isVisible) {
                    searchBarContainer.classList.remove('visible');
                    if (contentWrapper) {
                        contentWrapper.classList.remove('mobile-search-active');
                    }
                    if (regionBackground) {
                        regionBackground.classList.remove('search-bar-active');
                    }
                } else {
                    searchBarContainer.classList.add('visible');
                    if (contentWrapper) {
                        contentWrapper.classList.add('mobile-search-active');
                    }
                    if (regionBackground) {
                        regionBackground.classList.add('search-bar-active');
                    }
                    // Focus on search input when opened
                    const searchInput = document.getElementById('mobileSearchInput');
                    if (searchInput) {
                        setTimeout(() => searchInput.focus(), 100);
                    }
                }
            }
        }
        // Sidebar interactions (DOM is ready at this point)
        // Mobile menu event listeners
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileMenuClose = document.getElementById('mobileMenuClose');
        const mobileOverlay = document.getElementById('mobileOverlay');
        const mobileBackToCategories = document.getElementById('mobileBackToCategories');
        const mobileBackToRegions = document.getElementById('mobileBackToRegions');
        const mobileSearchBtn = document.getElementById('mobileSearchBtn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', openMobileMenu);
        }
        if (mobileMenuClose) {
            mobileMenuClose.addEventListener('click', closeMobileMenu);
        }
        if (mobileOverlay) {
            mobileOverlay.addEventListener('click', closeMobileMenu);
        }
        if (mobileSearchBtn) {
            mobileSearchBtn.addEventListener('click', toggleMobileSearchBar);
        }
        
        // Mobile search is now handled by setupSearchInput function above
        if (mobileBackToCategories) {
            mobileBackToCategories.addEventListener('click', () => {
                openMobileMenu();
                showMobileView('regions');
            });
        }
        if (mobileBackToRegions) {
            mobileBackToRegions.addEventListener('click', () => {
                if (currentMobileWineType) {
                    loadMobileRegions(currentMobileWineType);
                    showMobileView('regions');
                }
            });
        }
        // Load mobile menu categories when wineApp is ready
        waitForWineApp(() => {
            loadMobileMenuCategories();
            loadMobileWineTypeChips();
            initializeMobileMap();
        });
        
        // Note: initWineTypeFilters() is called globally at the end of the file
        // No need to call it here to avoid duplicate initialization
        // Back to map button
        const backToMapBtn = document.getElementById('backToMapBtn');
        if (backToMapBtn) {
            backToMapBtn.addEventListener('click', function(e) {
                e.preventDefault();
                backToMap();
            });
        }
        // getMapRegionName and regionHasWines are now global functions (defined above)
        // Helper function to get region data by name (handles variations)
        function getRegionData(regionName) {
            if (!regionName) return null;
            
            // Try direct match first
            if (regionData[regionName]) {
                return regionData[regionName];
            }
            
            // Try normalized version (remove special suffixes like "/Südtirol")
            const normalized = regionName.split('/')[0].trim();
            if (regionData[normalized]) {
                return regionData[normalized];
            }
            
            // Try case-insensitive match
            const lowerName = regionName.toLowerCase();
            for (const key in regionData) {
                if (key.toLowerCase() === lowerName || key.toLowerCase() === normalized.toLowerCase()) {
                    return regionData[key];
                }
            }
            
            return null;
        }
        
        function onEachFeature(feature, layer) {
            // Use robust fallback like mobile version
            const regionName = feature.properties.reg_name || feature.properties.NAME || feature.properties.name || 'Unknown';
            layer._regionName = regionName;
            
            // Check if region has wines for current type (or all types if none selected)
            const hasWines = regionHasWines(regionName, currentWineType);
            const shouldEnable = hasWines || !currentWineType;
            
            // Set initial style based on wine availability (like mobile)
            if (!shouldEnable) {
                layer.setStyle({
                    color: '#666',
                    fillColor: '#333',
                    weight: 1.5,
                    fillOpacity: 0.05,
                    opacity: 0.5
                });
            }
            
            // Only add event handlers if we have region data
            if (getRegionData(regionName)) {
                // Add cursor pointer to indicate clickability
                layer.on({
                    mousemove: function(e) {
                        // Update tooltip position as mouse moves
                        if (this !== selectedRegion && shouldEnable) {
                            showRegionTooltip(e, regionName);
                        }
                    },
                    mouseover: function(e) {
                        // Show region name tooltip
                        if (shouldEnable) {
                            showRegionTooltip(e, regionName);
                        }
                        
                        if (this !== selectedRegion && shouldEnable) {
                            // Enhanced hover effect - brighter and more visible
                            this.setStyle({
                                weight: 3,
                                fillOpacity: 0.35,
                                fillColor: currentWineType ? currentColors.fill : '#D4AF37',
                                color: currentWineType ? currentColors.border : '#D4AF37',
                                opacity: 1,
                                dashArray: null
                            });
                            // Add a subtle glow effect
                            this.bringToFront();
                        }
                    },
                    mouseout: function(e) {
                        // Hide region name tooltip
                        hideRegionTooltip();
                        
                        if (this !== selectedRegion && shouldEnable) {
                            // Return to default style
                            this.setStyle({
                                weight: 1.5,
                                fillOpacity: 0.08,
                                fillColor: currentWineType ? currentColors.fill : '#D4AF37',
                                color: currentWineType ? currentColors.border : '#D4AF37',
                                opacity: 0.8
                            });
                        }
                    },
                    click: function(e) {
                        // Prevent default map behavior (like mobile)
                        if (e.originalEvent) {
                            e.originalEvent.preventDefault();
                            e.originalEvent.stopPropagation();
                        }
                        
                        // Only allow selection if region has wines
                        if (shouldEnable) {
                            selectRegion(this, regionName);
                        }
                    }
                });
            }
        }
        function selectRegion(layer, regionName) {
            // Wait for wineApp to be ready (like mobile)
            if (!window.wineApp) {
                waitForWineApp(() => selectRegion(layer, regionName));
                return;
            }
            
            if (!geoJsonLayer) {
                console.warn('⚠️ geoJsonLayer is not available');
                return;
            }
            
            // Reset previously selected region (like mobile)
            if (selectedRegion && selectedRegion !== layer) {
                const hasWines = selectedRegion._regionName ? regionHasWines(selectedRegion._regionName, currentWineType) : false;
                if (hasWines || !currentWineType) {
                    selectedRegion.setStyle({
                        weight: 1.5,
                        fillOpacity: 0.08,
                        fillColor: currentWineType ? currentColors.fill : '#D4AF37',
                        color: currentWineType ? currentColors.border : '#D4AF37',
                        opacity: 0.8
                    });
                }
            }
            
            // Set new selected region
            selectedRegion = layer;
            layer.setStyle({
                weight: 4,
                fillOpacity: 0.5,
                fillColor: currentWineType ? currentColors.fill : '#D4AF37',
                color: currentWineType ? currentColors.border : '#D4AF37',
                opacity: 1,
                dashArray: '10, 5'
            });
            layer.bringToFront();
            
            // Always show wines list when region is clicked - show ALL wine types
            console.log('✅ Region selected, showing wines list (all types)...');
            showWinesListForRegion(regionName, null); // null = all wine types
            
            // Also highlight the region in the regions panel if it's open
            const regionsList = document.getElementById('regionsList');
            if (regionsList) {
                const regionItems = regionsList.querySelectorAll('.region-item');
                regionItems.forEach(item => {
                    const itemName = item.querySelector('.region-item-name').textContent;
                    if (itemName === regionName) {
                        document.querySelectorAll('.region-item').forEach(i => i.classList.remove('active'));
                        item.classList.add('active');
                    }
                });
            }
            
            // Show region info as well
            showRegionInfo(regionName);
        }
        
        // waitForWineApp is now a global function (defined above)
        
        function showWinesListForRegion(regionName, wineType) {
            console.log('🍷 showWinesListForRegion called with:', regionName, wineType);
            
            const mapWrapper = document.getElementById('mapWrapper');
            const winesListContainer = document.getElementById('winesListContainer');
            const winesGridContainer = document.getElementById('winesGridContainer');
            const winesListTitle = document.getElementById('winesListTitle');
            const winesListSubtitle = document.getElementById('winesListSubtitle');
            
            console.log('📦 Elements found:', {
                mapWrapper: !!mapWrapper,
                winesListContainer: !!winesListContainer,
                winesGridContainer: !!winesGridContainer
            });
            
            if (!winesListContainer || !winesGridContainer) {
                console.error('❌ Missing required elements');
                return;
            }
            
            // Hide map and show wines list - they should occupy the same space
            if (mapWrapper) {
                console.log('🗺️ Hiding map wrapper');
                mapWrapper.style.setProperty('display', 'none', 'important');
            }
            console.log('📋 Showing wines list container');
            // Use !important to override CSS rule and make it take the map's place
            winesListContainer.style.setProperty('display', 'flex', 'important');
            winesListContainer.style.setProperty('position', 'relative', 'important');
            winesListContainer.style.setProperty('width', '100%', 'important');
            winesListContainer.style.setProperty('height', '100%', 'important');
            winesListContainer.style.setProperty('flex', '1', 'important');
            
            // Ensure wines grid container is visible
            if (winesGridContainer) {
                winesGridContainer.style.setProperty('display', 'flex', 'important');
                winesGridContainer.style.visibility = 'visible';
                winesGridContainer.style.opacity = '1';
                console.log('✅ Wines grid container displayed');
                console.log('📐 Container dimensions:', {
                    width: winesGridContainer.offsetWidth,
                    height: winesGridContainer.offsetHeight,
                    display: window.getComputedStyle(winesGridContainer).display,
                    visibility: window.getComputedStyle(winesGridContainer).visibility
                });
            }
            
            // Also ensure header is visible
            const winesListHeader = document.querySelector('.wines-list-header');
            if (winesListHeader) {
                winesListHeader.style.setProperty('display', 'flex', 'important');
            }
            
            // Set background image for the region
            const regionImages = {
                'TOSCANA': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200',
                'PIEMONTE': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
                'VENETO': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
                'SICILIA': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200',
                'LOMBARDIA': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
                'EMILIA-ROMAGNA': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
                'LAZIO': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200',
                'CAMPANIA': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200',
                'PUGLIA': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200',
                'SARDEGNA': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200',
                'FRIULI-VENEZIA GIULIA': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
                'TRENTINO ALTO-ADIGE': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
                'VALLE D\'AOSTA': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
                'LE MARCHE': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200',
                'UMBRIA': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200',
                'ABRUZZO': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200',
                'MOLISE': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200',
                'BASILICATA': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200',
                'CALABRIA': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200',
                'LIGURIA': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200'
            };
            
            // Use normalized region name to get image
            const normalizedRegion = window.wineApp ? window.wineApp.normalizeRegionName(regionName) : regionName;
            const bgImage = regionImages[normalizedRegion] || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200';
            
            // Create image element to test if image loads
            const testImg = new Image();
            testImg.onload = function() {
                winesListContainer.style.backgroundImage = `linear-gradient(180deg, rgba(26, 26, 26, 0.95) 0%, rgba(10, 10, 10, 0.98) 100%), url(${bgImage})`;
                winesListContainer.style.backgroundSize = 'cover';
                winesListContainer.style.backgroundPosition = 'center';
                winesListContainer.style.backgroundRepeat = 'no-repeat';
                winesListContainer.style.backgroundAttachment = 'fixed';
            };
            testImg.onerror = function() {
                // Fallback to gradient only if image fails
                winesListContainer.style.backgroundImage = 'linear-gradient(180deg, rgba(26, 26, 26, 0.98) 0%, rgba(10, 10, 10, 1) 100%)';
                winesListContainer.style.backgroundSize = 'cover';
                winesListContainer.style.backgroundPosition = 'center';
                winesListContainer.style.backgroundRepeat = 'no-repeat';
                winesListContainer.style.backgroundAttachment = 'fixed';
            };
            testImg.src = bgImage;
            
            // Update title and subtitle
            if (winesListTitle) {
                winesListTitle.textContent = `${regionName} Wines`;
            }
            if (winesListSubtitle) {
                winesListSubtitle.textContent = 'All Wine Types - Use filters below to filter by type';
            }
            
            // Show wine type filters and reset to "All"
            const winesListFilters = document.getElementById('winesListFilters');
            if (winesListFilters) {
                winesListFilters.style.display = 'flex';
                // Reset filter buttons to "All"
                const filterButtons = winesListFilters.querySelectorAll('.wine-type-filter-btn');
                filterButtons.forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.wineType === 'all') {
                        btn.classList.add('active');
                    }
                });
                currentWineTypeFilter = 'all';
            }
            
            // Get search term from search input
            const searchInput = document.getElementById('desktopSearchInput');
            const searchTerm = searchInput ? searchInput.value.trim() : '';
            
            // Load wines for this region and type
            if (!window.wineApp || !window.wineApp.wines || window.wineApp.wines.length === 0) {
                winesGridContainer.innerHTML = '<div style="color: rgba(245, 245, 240, 0.5); text-align: center; padding: 2rem;">Loading wines...</div>';
                waitForWineApp(() => {
                    if (window.wineApp && window.wineApp.wines && window.wineApp.wines.length > 0) {
                        loadWinesIntoGrid(regionName, wineType, winesGridContainer, searchTerm);
                    } else {
                        winesGridContainer.innerHTML = '<div style="color: rgba(245, 245, 240, 0.5); text-align: center; padding: 2rem;">Unable to load wines. Please refresh the page.</div>';
                    }
                });
                return;
            }
            
            loadWinesIntoGrid(regionName, wineType, winesGridContainer, searchTerm);
        }
        
        // Store current region and filter state
        let currentRegionForFilter = null;
        let currentWineTypeFilter = 'all';
        
        function loadWinesIntoGrid(regionName, wineType, container, searchTerm = '') {
            console.log('🍷 loadWinesIntoGrid called with:', regionName, wineType, searchTerm);
            
            // Store current region for filter updates
            currentRegionForFilter = regionName;
            currentWineTypeFilter = wineType || 'all';
            
            if (!window.wineApp || !window.wineApp.wines) {
                console.warn('⚠️ wineApp or wines not available');
                return;
            }
            
            console.log('📊 Total wines available:', window.wineApp.wines.length);
            
            // Filter wines by region, type, and search term
            const filteredWines = window.wineApp.wines.filter(wine => {
                const normalizedWineRegion = window.wineApp.normalizeRegionName(wine.region);
                const normalizedFilterRegion = window.wineApp.normalizeRegionName(regionName);
                const matchesRegion = normalizedWineRegion === normalizedFilterRegion;
                
                // Apply wine type filter (if not 'all')
                let matchesType = true;
                if (currentWineTypeFilter && currentWineTypeFilter !== 'all') {
                    matchesType = window.wineApp.wineMatchesFamily(wine, currentWineTypeFilter);
                }
                
                // Apply search filter if search term is provided
                const matchesSearch = !searchTerm || 
                    wine.wine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    wine.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (wine.varietals && wine.varietals.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (wine.wine_producer && wine.wine_producer.toLowerCase().includes(searchTerm.toLowerCase()));
                
                return matchesRegion && matchesType && matchesSearch;
            });
            
            console.log('✅ Filtered wines:', filteredWines.length);
            
            // Clear container
            container.innerHTML = '';
            
            if (filteredWines.length === 0) {
                console.warn('⚠️ No wines found for region:', regionName, 'type:', wineType);
                const noResultsMsg = searchTerm 
                    ? `No wines found matching "${searchTerm}" for this region and type`
                    : 'No wines found for this region and type';
                container.innerHTML = `<div style="color: rgba(245, 245, 240, 0.5); text-align: center; padding: 2rem;">${noResultsMsg}</div>`;
                return;
            }
            
            // Create table
            const table = document.createElement('table');
            table.className = 'wines-table';
            
            // Create table header
            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    <th>Tipo</th>
                    <th>Nome</th>
                    <th>Produttore</th>
                    <th>Denominazione</th>
                    <th>Prezzo</th>
                </tr>
            `;
            table.appendChild(thead);
            
            // Create table body
            const tbody = document.createElement('tbody');
            
            filteredWines.forEach(wine => {
                const row = document.createElement('tr');
                row.className = 'wine-table-row';
                row.dataset.wineId = wine.wine_number;
                row.dataset.wineType = wine.wine_type || '';
                
                const price = wine.wine_price || wine.wine_price_bottle || wine.wine_price_glass || 'N/A';
                const denomination = wine.wine_vintage || 'N/A';
                
                // Get wine type display name
                const wineTypeNames = {
                    'ROSSO': 'Red',
                    'BIANCO': 'White',
                    'ROSATO': 'Rosé',
                    'ARANCIONE': 'Orange',
                    'BOLLICINE': 'Sparkling',
                    'NON ALCOLICO': 'Non-Alc'
                };
                const wineTypeDisplay = wineTypeNames[wine.wine_type] || wine.wine_type || 'N/A';
                
                row.innerHTML = `
                    <td class="wine-table-type">${wineTypeDisplay}</td>
                    <td class="wine-table-name">${wine.wine_name || 'Unknown Wine'}</td>
                    <td class="wine-table-producer">${wine.wine_producer || 'Unknown Producer'}</td>
                    <td class="wine-table-denomination">${denomination}</td>
                    <td class="wine-table-price">$${price}</td>
                `;
                
                row.addEventListener('click', function() {
                    // Navigate to wine details page with from parameter
                    const params = new URLSearchParams();
                    params.set('id', wine.wine_number);
                    if (wineType) {
                        params.set('type', wineType);
                    }
                    params.set('from', 'index');
                    window.location.href = `wine-details.html?${params.toString()}`;
                });
                
                tbody.appendChild(row);
            });
            
            table.appendChild(tbody);
            container.appendChild(table);
            
            // Force container to be visible and scrollable
            container.style.setProperty('display', 'flex', 'important');
            container.style.setProperty('visibility', 'visible', 'important');
            container.style.setProperty('opacity', '1', 'important');
            
            // Ensure table is visible
            table.style.setProperty('display', 'table', 'important');
            table.style.setProperty('visibility', 'visible', 'important');
            table.style.setProperty('opacity', '1', 'important');
            
            console.log('✅ Table created with', filteredWines.length, 'rows');
            console.log('📋 Container element:', container);
            console.log('📊 Table element:', table);
            console.log('🔍 Container children:', container.children.length);
            console.log('🔍 Table visible:', window.getComputedStyle(table).display !== 'none');
            
            // Setup wine type filter buttons
            setupWineTypeFilters(container);
        }
        
        // Setup wine type filter buttons
        function setupWineTypeFilters(container) {
            const filterButtons = document.querySelectorAll('.wine-type-filter-btn');
            filterButtons.forEach(button => {
                button.addEventListener('click', function() {
                    // Update active state
                    filterButtons.forEach(btn => btn.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Get selected wine type
                    const selectedType = this.dataset.wineType;
                    currentWineTypeFilter = selectedType;
                    
                    console.log('🍷 Filter changed to:', selectedType);
                    
                    // Reload wines with new filter
                    if (currentRegionForFilter) {
                        const searchInput = document.getElementById('desktopSearchInput');
                        const searchTerm = searchInput ? searchInput.value.trim() : '';
                        loadWinesIntoGrid(currentRegionForFilter, selectedType === 'all' ? null : selectedType, container, searchTerm);
                    }
                });
            });
        }
        
        // Expose loadWinesIntoGrid as global function for search functionality
        window.loadWinesIntoGrid = loadWinesIntoGrid;
        
        function backToMap() {
            const mapWrapper = document.getElementById('mapWrapper');
            const winesListContainer = document.getElementById('winesListContainer');
            
            // Hide wines list container completely
            if (winesListContainer) {
                winesListContainer.style.setProperty('display', 'none', 'important');
            }
            
            // Show map wrapper in the same space
            if (mapWrapper) {
                mapWrapper.style.setProperty('display', 'flex', 'important');
                mapWrapper.style.setProperty('flex', '1', 'important');
                mapWrapper.style.setProperty('width', '100%', 'important');
                mapWrapper.style.setProperty('height', '100%', 'important');
            }
            
            // Hide region info
            const regionInfo = document.getElementById('regionInfo');
            if (regionInfo) {
                regionInfo.style.display = 'none';
            }
            
            // Reset selected region on map
            if (geoJsonLayer && selectedRegion) {
                geoJsonLayer.eachLayer(function(l) {
                    const regName = l._regionName;
                    const hasWines = regName ? regionHasWines(regName, currentWineType) : false;
                    
                    if (hasWines || !currentWineType) {
                        l.setStyle({
                            weight: 1.5,
                            fillOpacity: 0.08,
                            color: currentColors.border,
                            fillColor: currentColors.fill,
                            opacity: 0.8,
                            dashArray: null
                        });
                    } else {
                        l.setStyle({
                            weight: 1.5,
                            fillOpacity: 0.03,
                            color: '#666666',
                            fillColor: '#666666',
                            opacity: 0.5,
                            dashArray: '5, 5'
                        });
                    }
                });
                selectedRegion = null;
            }
        }
        function showRegionInfo(regionName) {
            const data = getRegionData(regionName);
            if (data) {
                document.getElementById('regionName').textContent = regionName;
                document.getElementById('regionCapital').textContent = data.capital;
                document.getElementById('regionPopulation').textContent = data.population;
                document.getElementById('regionArea').textContent = data.area;
                
                const factElement = document.getElementById('regionFact');
                const wineFactsElement = document.getElementById('regionWineFacts');
                
                if (factElement && data.fact) {
                    factElement.textContent = data.fact;
                }
                
                if (wineFactsElement && data.wineFacts) {
                    wineFactsElement.textContent = data.wineFacts;
                }
                
                document.getElementById('regionInfo').style.display = 'block';
            }
        }
        // Show region name tooltip on hover
        function showRegionTooltip(e, regionName) {
            const tooltip = document.getElementById('regionTooltip');
            if (!tooltip) return;
            
            tooltip.textContent = regionName;
            tooltip.style.display = 'block';
            
            // Position tooltip near cursor using map coordinates
            if (e && e.originalEvent) {
                const mapWrapper = document.getElementById('mapWrapper');
                if (mapWrapper) {
                    const rect = mapWrapper.getBoundingClientRect();
                    const offset = 15;
                    const x = e.originalEvent.clientX - rect.left;
                    const y = e.originalEvent.clientY - rect.top;
                    
                    // Center tooltip horizontally on cursor, position above cursor
                    tooltip.style.left = x + 'px';
                    tooltip.style.top = (y - tooltip.offsetHeight - offset) + 'px';
                }
            }
        }
        
        function hideRegionTooltip() {
            const tooltip = document.getElementById('regionTooltip');
            if (tooltip) {
                tooltip.style.display = 'none';
            }
        }
        // updateMapColors, showRegionsPanel, and loadRegionsForWineType are now global functions (defined above)
        function showWinesPanel(region, wineType) {
            currentSelectedRegion = region;
            const panel = document.getElementById('winesPanel');
            const title = document.getElementById('winesPanelTitle');
            const subtitle = document.getElementById('winesPanelSubtitle');
            const list = document.getElementById('winesList');
            
            if (!panel || !window.wineApp || !window.wineApp.wines) return;
            
            title.textContent = region;
            subtitle.textContent = wineType || 'Wines';
            
            // Filter wines by region and type
            const filteredWines = window.wineApp.wines.filter(wine => {
                const normalizedWineRegion = window.wineApp.normalizeRegionName(wine.region);
                const normalizedFilterRegion = window.wineApp.normalizeRegionName(region);
                const matchesRegion = normalizedWineRegion === normalizedFilterRegion;
                const matchesType = !wineType || window.wineApp.wineMatchesFamily(wine, wineType);
                return matchesRegion && matchesType;
            });
            
            // Clear and populate list
            list.innerHTML = '';
            
            if (filteredWines.length === 0) {
                list.innerHTML = '<div style="color: rgba(245, 245, 240, 0.5); text-align: center; padding: 2rem;">No wines found</div>';
                panel.classList.add('active');
                return;
            }
            
            filteredWines.forEach(wine => {
                const wineItem = document.createElement('div');
                wineItem.className = 'wine-item';
                
                const price = wine.wine_price || wine.wine_price_bottle || wine.wine_price_glass || 'N/A';
                const vintage = wine.wine_vintage ? wine.wine_vintage.match(/\b(19|20)\d{2}\b/)?.[0] || 'N/A' : 'N/A';
                
                wineItem.innerHTML = `
                    <div class="wine-item-name">${wine.wine_name || 'Unknown Wine'}</div>
                    <div class="wine-item-producer">${wine.wine_producer || 'Unknown Producer'}</div>
                    <div class="wine-item-details">
                        <span class="wine-item-vintage">${vintage}</span>
                        <span class="wine-item-price">$${price}</span>
                    </div>
                `;
                
                wineItem.addEventListener('click', function() {
                    // Navigate to wine details page with from parameter
                    const params = new URLSearchParams();
                    params.set('id', wine.wine_number);
                    if (wineType) {
                        params.set('type', wineType);
                    }
                    params.set('from', 'index');
                    window.location.href = `wine-details.html?${params.toString()}`;
                });
                
                list.appendChild(wineItem);
            });
            
            panel.classList.add('active');
            
            // Highlight region on map
            if (geoJsonLayer && getRegionData(region)) {
                geoJsonLayer.eachLayer(function(layer) {
                    if (layer.feature && layer.feature.properties.reg_name === region) {
                        selectRegion(layer, region);
                    }
                });
            }
        }
        // Update wine counts when wineApp is ready
        function updateWineCounts() {
            if (!window.wineApp || !window.wineApp.wines) return;
            
            document.querySelectorAll('.wine-card-sidebar').forEach(card => {
                const wineType = card.dataset.type;
                if (wineType) {
                    const count = window.wineApp.wines.filter(wine => {
                        return window.wineApp.wineMatchesFamily(wine, wineType);
                    }).length;
                    
                    const countElement = card.querySelector('.wine-card-count');
                    if (countElement) {
                        countElement.textContent = `${count} wines`;
                    }
                }
            });
        }
        // Wait for wineApp to be ready
        const checkWineApp = setInterval(() => {
            if (window.wineApp && window.wineApp.wines) {
                updateWineCounts();
                clearInterval(checkWineApp);
            }
        }, 500);
        
        // Function to update active filters badge
        function updateActiveFiltersBadge() {
            const badge = document.getElementById('activeFiltersBadge');
            if (!badge) return;
            
            const activeCard = document.querySelector('.wine-card-sidebar.active');
            const searchInput = document.getElementById('desktopSearchInput');
            const searchTerm = searchInput ? searchInput.value.trim() : '';
            
            const filters = [];
            if (activeCard) {
                const wineTypeNames = {
                    'ROSSO': 'Red',
                    'BIANCO': 'White',
                    'ROSATO': 'Rosé',
                    'ARANCIONE': 'Orange',
                    'BOLLICINE': 'Sparkling',
                    'NON ALCOLICO': 'Non-Alc'
                };
                const typeName = wineTypeNames[activeCard.dataset.type] || activeCard.dataset.type;
                filters.push(typeName);
            }
            if (searchTerm) {
                filters.push(`"${searchTerm}"`);
            }
            
            if (filters.length > 0) {
                badge.textContent = filters.join(' • ');
                badge.style.display = 'inline-flex';
            } else {
                badge.style.display = 'none';
            }
        }
        
        /* ==================== GLOBAL SEARCH SYSTEM ==================== */
        // Global search function - independent from filters
        function performGlobalSearch(searchTerm) {
            if (!window.wineApp || !window.wineApp.wines || !searchTerm) {
                return [];
            }
            
            const term = searchTerm.toLowerCase().trim();
            if (term.length < 2) {
                return [];
            }
            
            return window.wineApp.wines.filter(wine => {
                const matchesName = wine.wine_name && wine.wine_name.toLowerCase().includes(term);
                const matchesProducer = wine.wine_producer && wine.wine_producer.toLowerCase().includes(term);
                const matchesVarietal = wine.varietals && wine.varietals.toLowerCase().includes(term);
                const matchesRegion = wine.region && wine.region.toLowerCase().includes(term);
                const matchesDescription = wine.wine_description && wine.wine_description.toLowerCase().includes(term);
                
                return matchesName || matchesProducer || matchesVarietal || matchesRegion || matchesDescription;
            });
        }
        
        // Generate autocomplete suggestions
        function generateAutocompleteSuggestions(searchTerm) {
            if (!window.wineApp || !window.wineApp.wines || !searchTerm || searchTerm.length < 2) {
                return [];
            }
            
            const term = searchTerm.toLowerCase().trim();
            const suggestions = [];
            const seen = new Set();
            
            // Collect unique suggestions
            window.wineApp.wines.forEach(wine => {
                // Wine names
                if (wine.wine_name && wine.wine_name.toLowerCase().includes(term)) {
                    const key = `wine:${wine.wine_name}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        const matchingWines = window.wineApp.wines.filter(w => w.wine_name === wine.wine_name);
                        const count = matchingWines.length;
                        // Get the first wine's ID for direct navigation
                        const firstWine = matchingWines[0];
                        const wineNumber = firstWine ? (firstWine.wine_number || firstWine.id || null) : null;
                        
                        if (wineNumber) {
                        suggestions.push({
                            type: 'wine',
                            text: wine.wine_name,
                            icon: '🍷',
                            count: count,
                                subtitle: wine.wine_producer || '',
                                wineNumber: wineNumber,
                                wineId: wineNumber
                        });
                        } else {
                            console.warn('⚠️ Wine number not found for wine:', wine.wine_name, firstWine);
                        }
                    }
                }
                
                // Producers
                if (wine.wine_producer && wine.wine_producer.toLowerCase().includes(term)) {
                    const key = `producer:${wine.wine_producer}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        const count = window.wineApp.wines.filter(w => w.wine_producer === wine.wine_producer).length;
                        suggestions.push({
                            type: 'producer',
                            text: wine.wine_producer,
                            icon: '🏛️',
                            count: count,
                            subtitle: 'Producer'
                        });
                    }
                }
                
                // Varietals
                if (wine.varietals && wine.varietals.toLowerCase().includes(term)) {
                    const key = `varietal:${wine.varietals}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        const count = window.wineApp.wines.filter(w => w.varietals === wine.varietals).length;
                        suggestions.push({
                            type: 'varietal',
                            text: wine.varietals,
                            icon: '🍇',
                            count: count,
                            subtitle: 'Grape variety'
                        });
                    }
                }
                
                // Regions
                if (wine.region && wine.region.toLowerCase().includes(term)) {
                    const key = `region:${wine.region}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        const count = window.wineApp.wines.filter(w => w.region === wine.region).length;
                        suggestions.push({
                            type: 'region',
                            text: wine.region,
                            icon: '🗺️',
                            count: count,
                            subtitle: 'Region'
                        });
                    }
                }
            });
            
            // Sort by relevance (exact matches first, then by count)
            return suggestions.sort((a, b) => {
                const aExact = a.text.toLowerCase().startsWith(term);
                const bExact = b.text.toLowerCase().startsWith(term);
                if (aExact && !bExact) return -1;
                if (!aExact && bExact) return 1;
                return b.count - a.count;
            }).slice(0, 8); // Limit to 8 suggestions
        }
        
        // Display autocomplete suggestions
        function showAutocompleteSuggestions(searchTerm, dropdownId, suggestionsId) {
            const dropdown = document.getElementById(dropdownId);
            const suggestionsContainer = document.getElementById(suggestionsId);
            
            if (!dropdown || !suggestionsContainer) return;
            
            if (!searchTerm || searchTerm.length < 2) {
                dropdown.style.display = 'none';
                return;
            }
            
            const suggestions = generateAutocompleteSuggestions(searchTerm);
            
            if (suggestions.length === 0) {
                suggestionsContainer.innerHTML = `
                    <div class="autocomplete-suggestions-empty">
                        No suggestions found for "${searchTerm}"
                    </div>
                `;
                dropdown.style.display = 'block';
                return;
            }
            
            suggestionsContainer.innerHTML = suggestions.map((suggestion, index) => `
                <div class="autocomplete-suggestion" 
                     data-suggestion-type="${suggestion.type}" 
                     data-suggestion-text="${suggestion.text}" 
                     data-index="${index}"
                     ${suggestion.wineNumber ? `data-wine-number="${suggestion.wineNumber}"` : ''}
                     ${suggestion.wineId ? `data-wine-id="${suggestion.wineId}"` : ''}>
                    <div class="autocomplete-suggestion-icon">${suggestion.icon}</div>
                    <div class="autocomplete-suggestion-content">
                        <div class="autocomplete-suggestion-main">${highlightMatch(suggestion.text, searchTerm)}</div>
                        <div class="autocomplete-suggestion-sub">${suggestion.subtitle}</div>
                    </div>
                    <div class="autocomplete-suggestion-count">${suggestion.count}</div>
                </div>
            `).join('');
            
            dropdown.style.display = 'block';
            
            // Add click handlers
            suggestionsContainer.querySelectorAll('.autocomplete-suggestion').forEach(suggestionEl => {
                suggestionEl.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const suggestionType = this.dataset.suggestionType;
                    const wineNumber = this.dataset.wineNumber || this.dataset.wineId;
                    const text = this.dataset.suggestionText;
                    
                    console.log('🔍 Suggestion clicked:', { suggestionType, wineNumber, text });
                    
                    // If it's a wine suggestion and we have a wine number, navigate directly to the wine page
                    if (suggestionType === 'wine' && wineNumber) {
                        console.log('🍷 Navigating to wine:', wineNumber);
                        // Navigate to wine details page
                        const wineDetailsUrl = `wine-details.html?id=${wineNumber}&from=search`;
                        window.location.href = wineDetailsUrl;
                        return;
                    }
                    
                    // For other types (producer, varietal, region), perform search
                    const searchInput = document.getElementById('desktopSearchInput') || document.getElementById('mobileSearchInput');
                    if (searchInput) {
                        searchInput.value = text;
                        searchInput.dispatchEvent(new Event('input'));
                        dropdown.style.display = 'none';
                    }
                });
            });
        }
        
        // Highlight matching text in suggestions
        function highlightMatch(text, searchTerm) {
            const regex = new RegExp(`(${searchTerm})`, 'gi');
            return text.replace(regex, '<mark style="background: rgba(212, 175, 55, 0.3); color: var(--gold);">$1</mark>');
        }
        
        // Display search results
        function displaySearchResults(searchTerm, results) {
            const winesListContainer = document.getElementById('winesListContainer');
            const winesGridContainer = document.getElementById('winesGridContainer');
            const mapWrapper = document.getElementById('mapWrapper');
            
            if (!winesGridContainer) return;
            
            // Hide map, show results
            if (mapWrapper) {
                mapWrapper.style.display = 'none';
            }
            if (winesListContainer) {
                winesListContainer.style.display = 'flex';
            }
            
            // Update title
            const winesListTitle = document.getElementById('winesListTitle');
            const winesListSubtitle = document.getElementById('winesListSubtitle');
            if (winesListTitle) {
                winesListTitle.textContent = `Search Results`;
            }
            if (winesListSubtitle) {
                winesListSubtitle.textContent = `${results.length} wine${results.length !== 1 ? 's' : ''} found for "${searchTerm}"`;
            }
            
            // Display results
            if (results.length === 0) {
                winesGridContainer.innerHTML = `
                    <div style="color: rgba(245, 245, 240, 0.5); text-align: center; padding: 3rem;">
                        <i class="fas fa-search" style="font-size: 3rem; color: var(--gold); opacity: 0.3; margin-bottom: 1rem; display: block;"></i>
                        <p style="font-size: 1.1rem; margin: 0;">No wines found matching "${searchTerm}"</p>
                        <p style="font-size: 0.9rem; margin-top: 0.5rem; opacity: 0.7;">Try searching by wine name, producer, varietal, or region</p>
                    </div>
                `;
                return;
            }
            
            // Create table with results
            const table = document.createElement('table');
            table.className = 'wines-table';
            
            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    <th>Wine</th>
                    <th>Producer</th>
                    <th>Region</th>
                    <th>Varietal</th>
                    <th>Price</th>
                </tr>
            `;
            table.appendChild(thead);
            
            const tbody = document.createElement('tbody');
            results.forEach(wine => {
                const row = document.createElement('tr');
                row.className = 'wine-table-row';
                row.dataset.wineId = wine.wine_number;
                
                const price = wine.wine_price || wine.wine_price_bottle || wine.wine_price_glass || 'N/A';
                
                row.innerHTML = `
                    <td class="wine-table-name">${wine.wine_name || 'Unknown Wine'}</td>
                    <td class="wine-table-producer">${wine.wine_producer || 'Unknown Producer'}</td>
                    <td class="wine-table-region">${wine.region || 'N/A'}</td>
                    <td class="wine-table-varietal">${wine.varietals || 'N/A'}</td>
                    <td class="wine-table-price">$${price}</td>
                `;
                
                row.addEventListener('click', function() {
                    const params = new URLSearchParams();
                    params.set('id', wine.wine_number);
                    params.set('from', 'search');
                    window.location.href = `wine-details.html?${params.toString()}`;
                });
                
                tbody.appendChild(row);
            });
            
            table.appendChild(tbody);
            winesGridContainer.innerHTML = '';
            winesGridContainer.appendChild(table);
        }
        
        // Helper function to setup search input with autocomplete
        function setupSearchInput(inputId, dropdownId, suggestionsId, isMobile = false) {
            const searchInput = document.getElementById(inputId);
            if (!searchInput) return;
            
            let searchTimeout = null;
            let selectedSuggestionIndex = -1;
            
            searchInput.addEventListener('input', function(e) {
                const searchTerm = e.target.value.trim();
                
                // Clear previous timeout
                if (searchTimeout) {
                    clearTimeout(searchTimeout);
                }
                
                // Add/remove active class for visual feedback
                if (searchTerm) {
                    this.classList.add('search-active');
                } else {
                    this.classList.remove('search-active');
                    const dropdown = document.getElementById(dropdownId);
                    if (dropdown) dropdown.style.display = 'none';
                    
                    // Show map again if search is cleared (desktop only)
                    if (!isMobile) {
                        const mapWrapper = document.getElementById('mapWrapper');
                        const winesListContainer = document.getElementById('winesListContainer');
                        if (mapWrapper && winesListContainer) {
                            mapWrapper.style.display = 'flex';
                            winesListContainer.style.display = 'none';
                        }
                    }
                }
                
                // Update active filters badge (desktop only)
                if (!isMobile && typeof updateActiveFiltersBadge === 'function') {
                    updateActiveFiltersBadge();
                }
                
                // Show autocomplete suggestions
                if (searchTerm.length >= 2) {
                    waitForWineApp(() => {
                        showAutocompleteSuggestions(searchTerm, dropdownId, suggestionsId);
                    });
                } else {
                    const dropdown = document.getElementById(dropdownId);
                    if (dropdown) dropdown.style.display = 'none';
                }
                
                // Perform search after user stops typing (debounce)
                searchTimeout = setTimeout(() => {
                    if (searchTerm.length >= 2) {
                        waitForWineApp(() => {
                            const results = performGlobalSearch(searchTerm);
                            if (isMobile) {
                                displayMobileSearchResults(searchTerm, results);
                            } else {
                                displaySearchResults(searchTerm, results);
                            }
                        });
                    }
                }, 300);
            });
            
            // Keyboard navigation for autocomplete
            searchInput.addEventListener('keydown', function(e) {
                const dropdown = document.getElementById(dropdownId);
                const suggestions = dropdown ? dropdown.querySelectorAll('.autocomplete-suggestion') : [];
                
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, suggestions.length - 1);
                    updateSuggestionSelection(suggestions, selectedSuggestionIndex);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
                    updateSuggestionSelection(suggestions, selectedSuggestionIndex);
                } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
                    e.preventDefault();
                    const selectedSuggestion = suggestions[selectedSuggestionIndex];
                    const suggestionType = selectedSuggestion.dataset.suggestionType;
                    const wineNumber = selectedSuggestion.dataset.wineNumber || selectedSuggestion.dataset.wineId;
                    
                    // If it's a wine suggestion, navigate directly
                    if (suggestionType === 'wine' && wineNumber) {
                        const wineDetailsUrl = `wine-details.html?id=${wineNumber}&from=search`;
                        window.location.href = wineDetailsUrl;
                        return;
                    }
                    
                    // Otherwise, click the suggestion (which will trigger search)
                    selectedSuggestion.click();
                } else if (e.key === 'Escape') {
                    this.value = '';
                    this.classList.remove('search-active');
                    if (dropdown) dropdown.style.display = 'none';
                    this.dispatchEvent(new Event('input'));
                }
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', function(e) {
                if (!searchInput.contains(e.target) && 
                    !document.getElementById(dropdownId)?.contains(e.target)) {
                    const dropdown = document.getElementById(dropdownId);
                    if (dropdown) dropdown.style.display = 'none';
                }
            });
        }
        
        // Display mobile search results
        function displayMobileSearchResults(searchTerm, results) {
            const mobileWinesContainer = document.getElementById('mobileWinesContainer');
            const mobileWinesCards = document.getElementById('mobileWinesCards');
            
            if (!mobileWinesCards) return;
            
            if (results.length === 0) {
                mobileWinesCards.innerHTML = `
                    <div style="color: rgba(245, 245, 240, 0.5); text-align: center; padding: 3rem 1.5rem;">
                        <i class="fas fa-search" style="font-size: 2.5rem; color: var(--gold); opacity: 0.3; margin-bottom: 1rem; display: block;"></i>
                        <p style="font-size: 1rem; margin: 0;">No wines found matching "${searchTerm}"</p>
                        <p style="font-size: 0.85rem; margin-top: 0.5rem; opacity: 0.7;">Try searching by wine name, producer, varietal, or region</p>
                    </div>
                `;
                if (mobileWinesContainer) {
                    mobileWinesContainer.style.display = 'block';
                }
                return;
            }
            
            // Display results as cards
            mobileWinesCards.innerHTML = results.map(wine => {
                const price = wine.wine_price || wine.wine_price_bottle || wine.wine_price_glass || 'N/A';
                const producer = wine.wine_producer || 'Unknown';
                return `
                    <div class="mobile-wine-card" data-wine-id="${wine.wine_number}" onclick="window.location.href='wine-details.html?id=${wine.wine_number}&from=search'">
                        <div class="mobile-wine-card-header">
                            <h3 class="mobile-wine-card-name">${wine.wine_name || 'Unknown Wine'} <span class="mobile-wine-card-producer-inline">- ${producer}</span></h3>
                            <span class="mobile-wine-card-price">$${price}</span>
                        </div>
                        <div class="mobile-wine-card-info">
                            <p class="mobile-wine-card-region"><strong>Region:</strong> ${wine.region || 'N/A'}</p>
                            <p class="mobile-wine-card-varietal"><strong>Varietal:</strong> ${wine.varietals || 'N/A'}</p>
                        </div>
                    </div>
                `;
            }).join('');
            
            if (mobileWinesContainer) {
                mobileWinesContainer.style.display = 'block';
            }
        }
        
        // Update suggestion selection
        function updateSuggestionSelection(suggestions, index) {
            suggestions.forEach((s, i) => {
                if (i === index) {
                    s.classList.add('selected');
                    s.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                } else {
                    s.classList.remove('selected');
                }
            });
        }
        
        // Setup desktop search
        setupSearchInput('desktopSearchInput', 'searchAutocompleteDropdown', 'autocompleteSuggestions', false);
        
        // Setup mobile search
        setupSearchInput('mobileSearchInput', 'mobileSearchAutocompleteDropdown', 'mobileAutocompleteSuggestions', true);
        
        // Initial badge update
        setTimeout(() => {
            if (typeof updateActiveFiltersBadge === 'function') {
                updateActiveFiltersBadge();
            }
        }, 500);
        
        scheduleViewportRefresh();
        
        // Initial update for wines cards height if container is visible
        setTimeout(() => {
            updateMobileWinesCardsHeight();
        }, 500);
        
        // Expose showWinesListForRegion as global function so it can be called from loadRegionsForWineType
        window.showWinesListForRegion = showWinesListForRegion;
}

// Initialize wine type filters on page load (independent of map)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWineTypeFilters);
} else {
    initWineTypeFilters();
}

// Initialize interactive map if on index page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInteractiveMap);
} else {
    initInteractiveMap();
}

