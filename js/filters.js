/**
 * Filter Manager - VestIA E-Commerce
 * 
 * Gestiona el sistema de filtros del catálogo (categoría, precio, color, ocasión).
 * Permite filtrar productos y actualizar la URL para que el chatbot pueda activar filtros.
 */

class FilterManager {
    constructor(productManager) {
        this.productManager = productManager; // Referencia al ProductManager
        this.activeFilters = {
            categories: [],
            priceRange: null,
            colors: [],
            occasions: [],
            sizes: []
        };

        // Elementos del DOM
        this.categoryFilters = document.getElementById('categoryFilters');
        this.priceFilters = document.getElementById('priceFilters');
        this.colorFilters = document.getElementById('colorFilters');
        this.occasionFilters = document.getElementById('occasionFilters');
        this.activeFiltersDisplay = document.getElementById('activeFilters');
        this.clearFiltersBtn = document.getElementById('clearFiltersBtn');
    }

    /**
     * Inicializa el sistema de filtros
     */
    initialize() {
        this.renderCategoryFilters();
        this.renderPriceFilters();
        this.renderColorFilters();
        this.renderOccasionFilters();
        this.renderPreferencesControl(); // Botón de preferencias
        this.attachEventListeners();
        this.loadFiltersFromURL(); // Cargar filtros desde URL (para chatbot)
    }

    /**
     * Renderiza el botón para aplicar preferencias guardadas
     */
    renderPreferencesControl() {
        const container = document.getElementById('preferencesFilterControl');
        if (!container) {
            console.error('Error: No se encontro el contenedor #preferencesFilterControl');
            return;
        }

        // Verificar si hay preferencias guardadas (leer directamente de localStorage para evitar dependencias)
        let prefs = null;
        try {
            const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_PROFILE);
            if (saved) prefs = JSON.parse(saved);
        } catch (e) {
            console.error('Error leyendo preferencias para botón:', e);
        }

        console.log('🔍 Renderizando botón de preferencias. Datos encontrados:', prefs);

        const hasPrefs = prefs && (
            (prefs.colors && prefs.colors.length > 0) ||
            prefs.priceRange ||
            (prefs.styles && prefs.styles.length > 0)
        );

        if (hasPrefs) {
            console.log('✅ Preferencias detectadas. Mostrando botón.');
            container.innerHTML = `
                <button class="btn btn-gold w-100 mb-3 py-2" onclick="window.userPreferences.applyRecommendedFilters()">
                    <i class="fas fa-magic me-2"></i>APLICAR PREFERENCIAS
                </button>
            `;
        } else {
            console.log('No hay preferencias suficientes para mostrar el boton.');
            container.innerHTML = '';
        }
    }

    /**
     * Renderiza filtros de categoría
     */
    renderCategoryFilters() {
        if (!this.categoryFilters) return;

        let html = '';
        CONFIG.MAIN_CATEGORIES.forEach(category => {
            html += `
                <div class="form-check mb-2">
                    <input class="form-check-input category-filter" type="checkbox" 
                           value="${category.id}" id="cat-${category.id}">
                    <label class="form-check-label" for="cat-${category.id}">
                        <i class="${category.icon} me-2"></i>${category.name}
                    </label>
                </div>
            `;
        });

        this.categoryFilters.innerHTML = html;
    }

    /**
     * Renderiza filtros de precio
     */
    renderPriceFilters() {
        if (!this.priceFilters) return;

        let html = '';
        CONFIG.PRICE_RANGES.forEach(range => {
            html += `
                <div class="form-check mb-2">
                    <input class="form-check-input price-filter" type="radio" 
                           name="priceRange" value="${range.id}" id="price-${range.id}">
                    <label class="form-check-label" for="price-${range.id}">
                        ${range.name} (${CONFIG.CURRENCY_SYMBOL}${range.min} - ${CONFIG.CURRENCY_SYMBOL}${range.max})
                    </label>
                </div>
            `;
        });

        this.priceFilters.innerHTML = html;
    }

    /**
     * Renderiza filtros de color (swatches)
     */
    renderColorFilters() {
        if (!this.colorFilters) return;

        let html = '';
        CONFIG.COLORS.forEach(color => {
            html += `
                <div class="color-swatch color-filter" 
                     style="background-color: ${color.hex}" 
                     data-color="${color.name}"
                     title="${color.name}">
                </div>
            `;
        });

        this.colorFilters.innerHTML = html;
    }

    /**
     * Renderiza filtros de ocasión
     */
    renderOccasionFilters() {
        if (!this.occasionFilters) return;

        let html = '';
        CONFIG.OCCASIONS.forEach(occasion => {
            html += `
                <div class="form-check mb-2">
                    <input class="form-check-input occasion-filter" type="checkbox" 
                           value="${occasion.id}" id="occ-${occasion.id}">
                    <label class="form-check-label" for="occ-${occasion.id}">
                        <i class="${occasion.icon} me-2"></i>${occasion.name}
                    </label>
                </div>
            `;
        });

        this.occasionFilters.innerHTML = html;
    }

    /**
     * Agrega event listeners a los filtros
     */
    attachEventListeners() {
        // Filtros de categoría
        document.querySelectorAll('.category-filter').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.onCategoryFilterChange());
        });

        // Filtros de precio
        document.querySelectorAll('.price-filter').forEach(radio => {
            radio.addEventListener('change', () => this.onPriceFilterChange());
        });

        // Filtros de color
        document.querySelectorAll('.color-filter').forEach(swatch => {
            swatch.addEventListener('click', (e) => this.onColorFilterClick(e.currentTarget));
        });

        // Filtros de ocasión
        document.querySelectorAll('.occasion-filter').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.onOccasionFilterChange());
        });

        // Botón limpiar filtros
        if (this.clearFiltersBtn) {
            this.clearFiltersBtn.addEventListener('click', () => this.clearAllFilters());
        }
    }

    /**
     * Maneja cambios en filtros de categoría
     */
    onCategoryFilterChange() {
        this.activeFilters.categories = Array.from(
            document.querySelectorAll('.category-filter:checked')
        ).map(cb => cb.value);

        this.applyFilters();
    }

    /**
     * Maneja cambios en filtros de precio
     */
    onPriceFilterChange() {
        const selected = document.querySelector('.price-filter:checked');
        this.activeFilters.priceRange = selected ? selected.value : null;

        this.applyFilters();
    }

    /**
     * Maneja clicks en filtros de color
     */
    onColorFilterClick(swatch) {
        const colorName = swatch.dataset.color;

        // Toggle active class
        swatch.classList.toggle('active');

        // Actualizar filtros activos
        if (swatch.classList.contains('active')) {
            if (!this.activeFilters.colors.includes(colorName)) {
                this.activeFilters.colors.push(colorName);
            }
        } else {
            this.activeFilters.colors = this.activeFilters.colors.filter(c => c !== colorName);
        }

        this.applyFilters();
    }

    /**
     * Maneja cambios en filtros de ocasión
     */
    onOccasionFilterChange() {
        this.activeFilters.occasions = Array.from(
            document.querySelectorAll('.occasion-filter:checked')
        ).map(cb => cb.value);

        this.applyFilters();
    }

    /**
     * Aplica todos los filtros activos
     */
    async applyFilters() {
        // Obtener base de productos (todos los de moda cargados)
        let baseProducts = this.productManager.allFashionProducts || [];

        // Si no hay productos cargados, cargar primero
        if (baseProducts.length === 0) {
            await this.productManager.fetchProducts();
            baseProducts = this.productManager.allFashionProducts || [];
        }

        let filteredProducts = [...baseProducts];

        // Filtrar por categoría
        if (this.activeFilters.categories.length > 0) {
            filteredProducts = filteredProducts.filter(product =>
                this.activeFilters.categories.includes(product.category)
            );
        }

        // Filtrar por rango de precio
        if (this.activeFilters.priceRange) {
            const range = CONFIG.PRICE_RANGES.find(r => r.id === this.activeFilters.priceRange);
            if (range) {
                filteredProducts = filteredProducts.filter(product =>
                    parseFloat(product.finalPrice) >= range.min &&
                    parseFloat(product.finalPrice) <= range.max
                );
            }
        }

        // Filtrar por color
        if (this.activeFilters.colors.length > 0) {
            filteredProducts = filteredProducts.filter(product =>
                product.availableColors.some(color =>
                    this.activeFilters.colors.includes(color.name)
                )
            );
        }

        // Filtrar por ocasión
        if (this.activeFilters.occasions.length > 0) {
            filteredProducts = filteredProducts.filter(product =>
                this.activeFilters.occasions.includes(product.occasion)
            );
        }

        console.log(`🔍 Filtros aplicados: ${baseProducts.length} → ${filteredProducts.length} productos`);

        // Actualizar paginación con productos filtrados
        this.productManager.products = filteredProducts.slice(0, this.productManager.productsPerPage);
        this.productManager.totalProducts = filteredProducts.length;
        this.productManager.currentPage = 1;

        // Cachear productos filtrados para paginación
        this.productManager.filteredProducts = filteredProducts;

        // Renderizar productos filtrados
        this.productManager.renderProducts(this.productManager.products);
        this.productManager.updateResultsCount();
        this.productManager.renderPagination();

        // Actualizar display de filtros activos
        this.updateActiveFiltersDisplay();

        // Actualizar URL con filtros (para compartir)
        this.updateURLWithFilters();
    }

    /**
     * Actualiza el display de filtros activos
     */
    updateActiveFiltersDisplay() {
        if (!this.activeFiltersDisplay) return;

        let html = '';
        let hasFilters = false;

        // Categorías
        this.activeFilters.categories.forEach(catId => {
            const category = CONFIG.MAIN_CATEGORIES.find(c => c.id === catId);
            if (category) {
                hasFilters = true;
                html += `
                    <span class="filter-badge">
                        ${category.name}
                        <button type="button" onclick="window.filterManager.removeFilter('category', '${catId}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </span>
                `;
            }
        });

        // Precio
        if (this.activeFilters.priceRange) {
            const range = CONFIG.PRICE_RANGES.find(r => r.id === this.activeFilters.priceRange);
            if (range) {
                hasFilters = true;
                html += `
                    <span class="filter-badge">
                        ${range.name}
                        <button type="button" onclick="window.filterManager.removeFilter('price', null)">
                            <i class="fas fa-times"></i>
                        </button>
                    </span>
                `;
            }
        }

        // Colores
        this.activeFilters.colors.forEach(colorName => {
            hasFilters = true;
            const color = CONFIG.COLORS.find(c => c.name === colorName);
            html += `
                <span class="filter-badge">
                    <span class="d-inline-block rounded-circle me-1" 
                          style="width: 12px; height: 12px; background-color: ${color.hex}"></span>
                    ${colorName}
                    <button type="button" onclick="window.filterManager.removeFilter('color', '${colorName}')">
                        <i class="fas fa-times"></i>
                    </button>
                </span>
            `;
        });

        // Ocasiones
        this.activeFilters.occasions.forEach(occId => {
            const occasion = CONFIG.OCCASIONS.find(o => o.id === occId);
            if (occasion) {
                hasFilters = true;
                html += `
                    <span class="filter-badge">
                        ${occasion.name}
                        <button type="button" onclick="window.filterManager.removeFilter('occasion', '${occId}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </span>
                `;
            }
        });

        this.activeFiltersDisplay.innerHTML = hasFilters
            ? `<small class="text-muted d-block mb-2">Filtros activos:</small>${html}`
            : '';
    }

    /**
     * Remueve un filtro específico
     */
    removeFilter(type, value) {
        switch (type) {
            case 'category':
                this.activeFilters.categories = this.activeFilters.categories.filter(c => c !== value);
                document.querySelector(`#cat-${value}`).checked = false;
                break;
            case 'price':
                this.activeFilters.priceRange = null;
                document.querySelectorAll('.price-filter').forEach(r => r.checked = false);
                break;
            case 'color':
                this.activeFilters.colors = this.activeFilters.colors.filter(c => c !== value);
                document.querySelector(`.color-filter[data-color="${value}"]`)?.classList.remove('active');
                break;
            case 'occasion':
                this.activeFilters.occasions = this.activeFilters.occasions.filter(o => o !== value);
                document.querySelector(`#occ-${value}`).checked = false;
                break;
        }

        this.applyFilters();
    }

    /**
     * Limpia todos los filtros
     */
    clearAllFilters() {
        // Limpiar checkboxes de categoría
        document.querySelectorAll('.category-filter').forEach(cb => cb.checked = false);

        // Limpiar radios de precio
        document.querySelectorAll('.price-filter').forEach(r => r.checked = false);

        // Limpiar color swatches
        document.querySelectorAll('.color-filter').forEach(s => s.classList.remove('active'));

        // Limpiar checkboxes de ocasión
        document.querySelectorAll('.occasion-filter').forEach(cb => cb.checked = false);

        // Resetear filtros activos
        this.activeFilters = {
            categories: [],
            priceRange: null,
            colors: [],
            occasions: [],
            sizes: []
        };

        // Recargar productos completos
        this.productManager.fetchProducts(1);

        // Actualizar display
        this.updateActiveFiltersDisplay();
    }

    /**
     * Actualiza la URL con los filtros activos (para compartir o activar desde chatbot)
     */
    updateURLWithFilters() {
        const params = new URLSearchParams();

        if (this.activeFilters.categories.length > 0) {
            params.set('category', this.activeFilters.categories.join(','));
        }

        if (this.activeFilters.priceRange) {
            params.set('price', this.activeFilters.priceRange);
        }

        if (this.activeFilters.colors.length > 0) {
            params.set('color', this.activeFilters.colors.join(','));
        }

        if (this.activeFilters.occasions.length > 0) {
            params.set('occasion', this.activeFilters.occasions.join(','));
        }

        // Actualizar URL sin recargar la página
        const newURL = params.toString()
            ? `${window.location.pathname}?${params.toString()}`
            : window.location.pathname;

        window.history.replaceState({}, '', newURL);
    }

    /**
     * Carga filtros desde URL parameters (para recomendaciones del chatbot)
     */
    loadFiltersFromURL() {
        const params = new URLSearchParams(window.location.search);

        // Cargar categorías
        const categories = params.get('category');
        if (categories) {
            categories.split(',').forEach(catId => {
                const checkbox = document.querySelector(`#cat-${catId}`);
                if (checkbox) {
                    checkbox.checked = true;
                    this.activeFilters.categories.push(catId);
                }
            });
        }

        // Cargar precio
        const price = params.get('price');
        if (price) {
            const radio = document.querySelector(`#price-${price}`);
            if (radio) {
                radio.checked = true;
                this.activeFilters.priceRange = price;
            }
        }

        // Cargar colores
        const colors = params.get('color');
        if (colors) {
            colors.split(',').forEach(colorName => {
                const swatch = document.querySelector(`.color-filter[data-color="${colorName}"]`);
                if (swatch) {
                    swatch.classList.add('active');
                    this.activeFilters.colors.push(colorName);
                }
            });
        }

        // Cargar ocasiones
        const occasions = params.get('occasion');
        if (occasions) {
            occasions.split(',').forEach(occId => {
                const checkbox = document.querySelector(`#occ-${occId}`);
                if (checkbox) {
                    checkbox.checked = true;
                    this.activeFilters.occasions.push(occId);
                }
            });
        }

        // Si hay filtros en la URL, aplicarlos
        if (categories || price || colors || occasions) {
            setTimeout(() => this.applyFilters(), 1000);
        }
    }

    /**
     * Activa filtros programáticamente (usado por el chatbot y preferencias)
     * @param {Object} filters - Objeto con filtros a activar
     */
    activateFilters(filters) {
        console.log('Activando filtros:', filters);

        this.clearAllFilters(); // Limpiar filtros existentes

        // Activar categorías
        if (filters.categories) {
            filters.categories.forEach(catId => {
                const checkbox = document.querySelector(`#cat-${catId}`);
                if (checkbox) {
                    checkbox.checked = true;
                    this.activeFilters.categories.push(catId);
                    console.log(`Categoria activada: ${catId}`);
                } else {
                    console.warn(`Categoria no encontrada: ${catId}`);
                }
            });
        }

        // Activar precio
        if (filters.priceRange) {
            const radio = document.querySelector(`#price-${filters.priceRange}`);
            if (radio) {
                radio.checked = true;
                this.activeFilters.priceRange = filters.priceRange;
                console.log(`Rango de precio activado: ${filters.priceRange}`);
            } else {
                console.warn(`Rango de precio no encontrado: ${filters.priceRange}`);
            }
        }

        // Activar colores
        if (filters.colors) {
            filters.colors.forEach(colorName => {
                const swatch = document.querySelector(`.color-filter[data-color="${colorName}"]`);
                if (swatch) {
                    swatch.classList.add('active');
                    this.activeFilters.colors.push(colorName);
                    console.log(`Color activado: ${colorName}`);
                } else {
                    console.warn(`Color no encontrado: ${colorName}`);
                }
            });
        }

        // Activar ocasiones
        if (filters.occasions) {
            filters.occasions.forEach(occId => {
                const checkbox = document.querySelector(`#occ-${occId}`);
                if (checkbox) {
                    checkbox.checked = true;
                    this.activeFilters.occasions.push(occId);
                    console.log(`Ocasion activada: ${occId}`);
                } else {
                    console.warn(`Ocasion no encontrada: ${occId}`);
                }
            });
        }

        console.log('Filtros activos finales:', this.activeFilters);

        // Aplicar filtros
        this.applyFilters();

        // Scroll al catálogo
        document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
    }
}

// Hacer FilterManager disponible globalmente
window.FilterManager = FilterManager;
