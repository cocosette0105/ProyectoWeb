/**
 * User Preferences Manager - VestIA E-Commerce
 * 
 * Gestiona las preferencias del usuario (colores, tallas, estilos, precios).
 * Permite guardar preferencias en localStorage y aplicarlas automáticamente.
 */

class UserPreferences {
    constructor() {
        this.preferences = {
            colors: [],
            sizes: [],
            styles: [],
            priceRange: null
        };

        // Elementos del DOM
        this.preferencesModal = document.getElementById('preferencesModal');
        this.preferencesForm = document.getElementById('preferencesForm');
        this.saveBtn = document.getElementById('savePreferencesBtn');
        this.preferredColors = document.getElementById('preferredColors');
        this.preferredSizes = document.getElementById('preferredSizes');
        this.preferredStyles = document.getElementById('preferredStyles');
        this.preferredPriceRange = document.getElementById('preferredPriceRange');

        this.loadProfile();
        this.initialize();
    }

    /**
     * Inicializa el sistema de preferencias
     */
    initialize() {
        this.renderColorSelector();
        this.renderSizeSelector();
        this.renderStyleSelector();
        this.renderPriceRangeSelector();
        this.attachEventListeners();

        // Mostrar onboarding en la primera visita
        this.checkFirstVisit();
    }

    /**
     * Renderiza selector de colores
     */
    renderColorSelector() {
        if (!this.preferredColors) return;

        let html = '<div class="d-flex flex-wrap gap-2">';
        CONFIG.COLORS.forEach(color => {
            const isSelected = this.preferences.colors.includes(color.name);
            html += `
                <div class="color-swatch ${isSelected ? 'active' : ''}" 
                     style="background-color: ${color.hex}" 
                     data-color="${color.name}"
                     title="${color.name}">
                </div>
            `;
        });
        html += '</div>';

        this.preferredColors.innerHTML = html;

        // Event listeners
        this.preferredColors.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.addEventListener('click', (e) => {
                e.currentTarget.classList.toggle('active');
            });
        });
    }

    /**
     * Renderiza selector de tallas
     */
    renderSizeSelector() {
        if (!this.preferredSizes) return;

        let html = '<div class="d-flex flex-wrap gap-2 mt-2">';
        CONFIG.SIZES.forEach(size => {
            const isSelected = this.preferences.sizes.includes(size);
            html += `
                <input type="checkbox" class="btn-check" id="size-${size}" 
                       value="${size}" ${isSelected ? 'checked' : ''}>
                <label class="btn btn-outline-secondary" for="size-${size}">${size}</label>
            `;
        });
        html += '</div>';

        this.preferredSizes.innerHTML = html;
    }

    /**
     * Renderiza selector de estilos
     */
    renderStyleSelector() {
        if (!this.preferredStyles) return;

        let html = '<div class="d-flex flex-wrap gap-2 mt-2">';
        CONFIG.OCCASIONS.forEach(occasion => {
            const isSelected = this.preferences.styles.includes(occasion.id);
            html += `
                <input type="checkbox" class="btn-check" id="style-${occasion.id}" 
                       value="${occasion.id}" ${isSelected ? 'checked' : ''}>
                <label class="btn btn-outline-primary" for="style-${occasion.id}">
                    <i class="${occasion.icon} me-1"></i>${occasion.name}
                </label>
            `;
        });
        html += '</div>';

        this.preferredStyles.innerHTML = html;
    }

    /**
     * Renderiza selector de rango de precio
     */
    renderPriceRangeSelector() {
        if (!this.preferredPriceRange) return;

        let html = '<option value="">Sin preferencia</option>';
        CONFIG.PRICE_RANGES.forEach(range => {
            const isSelected = this.preferences.priceRange === range.id;
            html += `
                <option value="${range.id}" ${isSelected ? 'selected' : ''}>
                    ${range.name} (${CONFIG.CURRENCY_SYMBOL}${range.min} - ${CONFIG.CURRENCY_SYMBOL}${range.max})
                </option>
            `;
        });

        this.preferredPriceRange.innerHTML = html;
    }

    /**
     * Agrega event listeners
     */
    attachEventListeners() {
        if (this.saveBtn) {
            this.saveBtn.addEventListener('click', () => this.savePreferences());
        }
    }

    /**
     * Guarda las preferencias
     */
    async savePreferences() {
        // Obtener colores seleccionados
        this.preferences.colors = Array.from(
            this.preferredColors.querySelectorAll('.color-swatch.active')
        ).map(swatch => swatch.dataset.color);

        // Obtener tallas seleccionadas
        this.preferences.sizes = Array.from(
            this.preferredSizes.querySelectorAll('input:checked')
        ).map(input => input.value);

        // Obtener estilos seleccionados
        this.preferences.styles = Array.from(
            this.preferredStyles.querySelectorAll('input:checked')
        ).map(input => input.value);

        // Obtener rango de precio
        this.preferences.priceRange = this.preferredPriceRange.value || null;

        // Guardar en localStorage
        this.saveProfile(this.preferences);

        console.log('💾 Preferencias guardadas:', this.preferences);

        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(this.preferencesModal);
        if (modal) {
            modal.hide();
            // Esperar a que el modal se cierre completamente
            await new Promise(resolve => setTimeout(resolve, 400));
        }

        // Mensaje de éxito
        Swal.fire({
            icon: 'success',
            title: 'Preferencias guardadas',
            text: 'Aplicando filtros basados en tus preferencias...',
            confirmButtonColor: '#d4af37',
            timer: 2000,
            timerProgressBar: true
        });

        // Aplicar filtros recomendados automáticamente
        setTimeout(() => {
            this.applyRecommendedFilters();

            // Actualizar el botón en la barra lateral
            if (window.filterManager) {
                window.filterManager.renderPreferencesControl();
            }
        }, 500);
    }

    /**
     * Guarda perfil en localStorage
     * @param {Object} profileData - Datos del perfil
     */
    saveProfile(profileData) {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEYS.USER_PROFILE, JSON.stringify(profileData));
            console.log('Perfil guardado:', profileData);
        } catch (error) {
            console.error('Error al guardar perfil:', error);
        }
    }

    /**
     * Carga perfil desde localStorage
     */
    loadProfile() {
        try {
            const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_PROFILE);
            if (saved) {
                this.preferences = JSON.parse(saved);
                console.log('Perfil cargado:', this.preferences);
                return this.preferences;
            }
        } catch (error) {
            console.error('Error al cargar perfil:', error);
        }

        return null;
    }

    /**
     * Obtiene filtros recomendados basados en preferencias
     * @returns {Object} - Objeto con filtros recomendados
     */
    getRecommendedFilters() {
        const filters = {};

        if (this.preferences.colors && this.preferences.colors.length > 0) {
            filters.colors = this.preferences.colors;
        }

        if (this.preferences.priceRange) {
            filters.priceRange = this.preferences.priceRange;
        }

        if (this.preferences.styles && this.preferences.styles.length > 0) {
            filters.occasions = this.preferences.styles;
        }

        return filters;
    }

    /**
     * Aplica filtros recomendados automáticamente
     */
    async applyRecommendedFilters() {
        if (!window.filterManager) {
            console.warn('FilterManager no disponible todavía');
            return;
        }

        if (!window.productManager) {
            console.warn('ProductManager no disponible todavía');
            return;
        }

        const recommendedFilters = this.getRecommendedFilters();

        if (Object.keys(recommendedFilters).length > 0) {
            // Asegurar que los productos estén cargados
            if (window.productManager.products.length === 0) {
                console.log('📦 Cargando productos antes de aplicar filtros...');
                await window.productManager.fetchProducts();
            }

            // Aplicar filtros
            setTimeout(() => {
                window.filterManager.activateFilters(recommendedFilters);

                // Contar qué filtros se aplicaron
                const appliedFilters = [];
                if (recommendedFilters.colors && recommendedFilters.colors.length > 0) {
                    appliedFilters.push(`${recommendedFilters.colors.length} colores`);
                }
                if (recommendedFilters.priceRange) {
                    const range = CONFIG.PRICE_RANGES.find(r => r.id === recommendedFilters.priceRange);
                    if (range) appliedFilters.push(`rango ${range.name}`);
                }
                if (recommendedFilters.occasions && recommendedFilters.occasions.length > 0) {
                    appliedFilters.push(`${recommendedFilters.occasions.length} estilos`);
                }

                Swal.fire({
                    icon: 'success',
                    title: 'Preferencias Aplicadas',
                    html: `
                        <p>Filtros aplicados:</p>
                        <p class="mt-2"><strong>${appliedFilters.join(', ')}</strong></p>
                        <p class="text-muted small mt-2">El catálogo ahora muestra productos que coinciden con tus gustos.</p>
                    `,
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 4000,
                    timerProgressBar: true
                });
            }, 300);
        } else {
            // No hay preferencias guardadas
            Swal.fire({
                icon: 'info',
                title: 'Sin preferencias',
                text: 'No has guardado preferencias todavía. Selecciona tus colores, tallas y estilos favoritos.',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        }
    }

    /**
     * Verifica si es la primera visita del usuario
     */
    checkFirstVisit() {
        const hasVisited = localStorage.getItem('vestia_has_visited');

        if (!hasVisited) {
            // Mostrar mensaje de bienvenida
            setTimeout(() => {
                Swal.fire({
                    title: '¡Bienvenido a VestIA!',
                    html: `
                        <p>Tu boutique de moda inteligente</p>
                        <p class="text-muted small">
                            Configura tus preferencias para recibir recomendaciones personalizadas
                        </p>
                    `,
                    icon: 'info',
                    confirmButtonColor: '#d4af37',
                    confirmButtonText: 'Configurar Preferencias',
                    showCancelButton: true,
                    cancelButtonText: 'Después'
                }).then((result) => {
                    if (result.isConfirmed) {
                        // Abrir modal de preferencias
                        const modal = new bootstrap.Modal(this.preferencesModal);
                        modal.show();
                    }
                });
            }, 2000);

            // Marcar como visitado
            localStorage.setItem('vestia_has_visited', 'true');
        }
    }

    /**
     * Actualiza preferencias basadas en interacciones del usuario
     * @param {Object} interaction - Datos de la interacción
     */
    updateFromInteractions(interaction) {
        // Aprendizaje simple basado en productos agregados al carrito
        if (interaction.type === 'cart_add' && interaction.product) {
            const product = interaction.product;

            // Agregar colores predominantes si no están
            if (product.availableColors) {
                product.availableColors.forEach(color => {
                    if (!this.preferences.colors.includes(color.name)) {
                        // Podríamos agregar colores automáticamente, pero por ahora solo registramos
                        console.log('Color detectado en compra:', color.name);
                    }
                });
            }

            // Registrar estilo/ocasión preferido
            if (product.occasion && !this.preferences.styles.includes(product.occasion)) {
                console.log('Estilo detectado en compra:', product.occasion);
            }
        }
    }

    /**
     * Obtiene una preferencia específica
     * @param {string} key - Clave de la preferencia
     * @returns {*} - Valor de la preferencia
     */
    getPreference(key) {
        return this.preferences[key] || null;
    }

    /**
     * Guarda una preferencia individual
     * @param {string} key - Clave de la preferencia
     * @param {*} value - Valor a guardar
     */
    savePreference(key, value) {
        this.preferences[key] = value;
        this.saveProfile(this.preferences);
    }
}

// Hacer UserPreferences disponible globalmente
window.UserPreferences = UserPreferences;
