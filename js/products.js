/**
 * Product Manager - VestIA E-Commerce
 * 
 * Gestiona la obtención, visualización y manipulación de productos desde DummyJSON API.
 * Incluye funcionalidades de paginación, búsqueda y fallback si la API falla.
 */

class ProductManager {
    constructor() {
        this.products = []; // Array de productos cargados
        this.currentPage = 1; // Página actual
        this.totalProducts = 0; // Total de productos disponibles
        this.productsPerPage = CONFIG.PRODUCTS_PER_PAGE; // Productos por página (9)
        this.productsGrid = document.getElementById('productsGrid'); // Container del grid
        this.loadingSpinner = document.getElementById('loadingSpinner'); // Spinner de carga
        this.resultsCount = document.getElementById('resultsCount'); // Contador de resultados
        this.pagination = document.getElementById('pagination'); // Elemento de paginación

        // Cache de productos en sessionStorage para mejorar performance
        this.cacheKey = 'vestia_products_cache';
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutos

        // WHITELIST DE CATEGORIAS DE MODA
        // Solo mostrar productos relacionados con boutique/moda, NO comida ni otros
        this.allowedCategories = [
            'womens-dresses',
            'womens-shoes',
            'womens-watches',
            'womens-bags',
            'womens-jewellery',
            'mens-shirts',
            'mens-shoes',
            'mens-watches',
            'tops',
            'sunglasses',
            'skin-care',
            'fragrances',
            'beauty'
        ];
    }

    /**
     * Obtiene productos de la API de DummyJSON con paginación
     * @param {number} page - Número de página a cargar
     * @param {number} limit - Cantidad de productos por página
     * @returns {Promise<Array>} - Array de productos
     */
    async fetchProducts(page = 1, limit = this.productsPerPage) {
        try {
            this.showLoading();

            //  ESTRATEGIA: Cargar TODOS los productos de moda de una vez
            // y hacer paginacion en el frontend, porque si pedimos solo 9,
            // despues del filtro de categorias nos quedarian muy pocos

            // Si no tenemos cache de todos los productos de moda, cargarlos
            if (!this.allFashionProducts || this.allFashionProducts.length === 0) {
                console.log('Cargando todos los productos de moda...');

                // Pedir TODOS los productos disponibles (limit=0 devuelve todo)
                const url = `${CONFIG.DUMMYJSON_BASE_URL}${CONFIG.DUMMYJSON_PRODUCTS_ENDPOINT}?limit=0`;

                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                // FILTRAR SOLO CATEGORIAS DE MODA
                const fashionProducts = data.products.filter(product =>
                    this.allowedCategories.includes(product.category)
                );

                console.log(`Productos totales: ${data.products.length}, Moda: ${fashionProducts.length}`);

                // Transformar y cachear
                this.allFashionProducts = this.transformProducts(fashionProducts);
                this.totalProducts = this.allFashionProducts.length;
            }

            // Paginación en el frontend
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;

            // Usar productos filtrados si existen, sino usar todos
            const sourceProducts = this.filteredProducts || this.allFashionProducts;
            this.products = sourceProducts.slice(startIndex, endIndex);
            this.totalProducts = sourceProducts.length;
            this.currentPage = page;

            console.log(`Pagina ${page}: mostrando ${this.products.length} de ${this.totalProducts} productos`);

            // Renderizar productos
            this.renderProducts(this.products);
            this.updateResultsCount();
            this.renderPagination();

            this.hideLoading();

            return this.products;

        } catch (error) {
            console.error('Error al cargar productos:', error);
            this.handleAPIError();
            return [];
        }
    }

    /**
     * Busca productos por término de búsqueda
     * @param {string} query - Término de búsqueda
     * @returns {Promise<Array>} - Productos encontrados
     */
    async searchProducts(query) {
        if (!query || query.trim() === '') {
            // Si no hay búsqueda, cargar todos los productos
            return this.fetchProducts(1);
        }

        try {
            this.showLoading();

            const url = `${CONFIG.DUMMYJSON_BASE_URL}${CONFIG.DUMMYJSON_SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}`;

            console.log(`Searching products: ${url}`);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // FILTRAR SOLO CATEGORIAS DE MODA
            const fashionProducts = data.products.filter(product =>
                this.allowedCategories.includes(product.category)
            );

            this.products = this.transformProducts(fashionProducts);
            this.totalProducts = fashionProducts.length;

            this.renderProducts(this.products);
            this.updateResultsCount(query);
            this.renderPagination(); // Ocultar paginación en búsqueda

            this.hideLoading();
            return this.products;

        } catch (error) {
            console.error('Error en búsqueda:', error);
            this.handleAPIError();
            return [];
        }
    }

    /**
     * Ordena los productos según el criterio seleccionado
     * @param {string} criteria - Criterio de ordenamiento (relevant, price-asc, price-desc, rating)
     */
    sortProducts(criteria) {
        console.log(`Ordenando por: ${criteria}`);

        // Determinar qué lista de productos ordenar (filtrados o todos)
        let productsToSort = this.filteredProducts ? [...this.filteredProducts] : [...this.allFashionProducts];

        switch (criteria) {
            case 'price-asc':
                productsToSort.sort((a, b) => parseFloat(a.finalPrice) - parseFloat(b.finalPrice));
                break;
            case 'price-desc':
                productsToSort.sort((a, b) => parseFloat(b.finalPrice) - parseFloat(a.finalPrice));
                break;
            case 'rating':
                productsToSort.sort((a, b) => b.rating - a.rating);
                break;
            case 'relevant':
            default:
                // Aleatorio determinista (o por ID) para simular relevancia
                productsToSort.sort((a, b) => a.id - b.id);
                break;
        }

        // Actualizar la lista actual y resetear paginación
        this.filteredProducts = productsToSort; // Mantener la referencia ordenada
        this.products = productsToSort.slice(0, this.productsPerPage);
        this.totalProducts = productsToSort.length;
        this.currentPage = 1;

        // Renderizar
        this.renderProducts(this.products);
        this.renderPagination();

        // Actualizar texto del botón dropdown
        const sortLabel = {
            'relevant': 'Más Relevantes',
            'price-asc': 'Precio: Menor a Mayor',
            'price-desc': 'Precio: Mayor a Menor',
            'rating': 'Mejor Calificación'
        }[criteria];

        const dropdownBtn = document.getElementById('sortDropdown');
        if (dropdownBtn && sortLabel) {
            dropdownBtn.innerHTML = `<i class="fas fa-sort me-1"></i> ${sortLabel}`;
        }
    }

    /**
     * Obtiene productos por categoría
     * @param {string} category - ID de la categoría
     * @returns {Promise<Array>} - Productos de la categoría
     */
    async getProductsByCategory(category) {
        try {
            this.showLoading();

            const url = `${CONFIG.DUMMYJSON_BASE_URL}/products/category/${category}`;

            console.log(`Fetching category: ${url}`);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // FILTRAR SOLO CATEGORIAS DE MODA
            const fashionProducts = data.products.filter(product =>
                this.allowedCategories.includes(product.category)
            );

            this.products = this.transformProducts(fashionProducts);
            this.totalProducts = fashionProducts.length;

            this.renderProducts(this.products);
            this.updateResultsCount();
            this.renderPagination();

            this.hideLoading();
            return this.products;

        } catch (error) {
            console.error('Error al cargar categoría:', error);
            this.handleAPIError();
            return [];
        }
    }

    /**
     * Transforma productos de DummyJSON al formato de VestIA
     * Agrega atributos como tallas, colores, ocasión, etc.
     * @param {Array} products - Productos de DummyJSON
     * @returns {Array} - Productos transformados
     */
    transformProducts(products) {
        return products.map(product => {
            // Generar tallas aleatorias disponibles
            const availableSizes = this.generateRandomSizes();

            // Generar colores basados en el texto del producto
            const availableColors = this.detectColorsFromProduct(product);

            // Determinar ocasión basada en la categoría
            const occasion = this.determineOccasion(product.category);

            // Mapear categoría de DummyJSON a categoría de VestIA
            const vestiaCategory = CONFIG.CATEGORIES[product.category] || 'General';

            return {
                id: product.id,
                title: product.title,
                description: product.description,
                price: product.price,
                discountPercentage: product.discountPercentage || 0,
                rating: product.rating || 4.0,
                stock: product.stock || 10,
                brand: product.brand || 'VestIA',
                category: product.category,
                vestiaCategory: vestiaCategory,
                thumbnail: product.thumbnail,
                images: product.images || [product.thumbnail],

                // Atributos adicionales de VestIA
                availableSizes: availableSizes,
                availableColors: availableColors,
                occasion: occasion,

                // Calcular precio con descuento
                finalPrice: product.discountPercentage > 0
                    ? (product.price * (1 - product.discountPercentage / 100)).toFixed(2)
                    : product.price
            };
        });
    }

    /**
     * Renderiza los productos en el grid
     * @param {Array} products - Productos a renderizar
     */
    renderProducts(products) {
        if (!this.productsGrid) return;

        // Limpiar grid actual
        this.productsGrid.innerHTML = '';

        if (products.length === 0) {
            this.productsGrid.innerHTML = `
                <div class="col-12">
                    <div class="text-center py-5">
                        <i class="fas fa-search display-1 text-muted mb-3"></i>
                        <h4>No se encontraron productos</h4>
                        <p class="text-muted">Intenta con otros filtros o términos de búsqueda</p>
                    </div>
                </div>
            `;
            return;
        }

        // Crear card para cada producto
        products.forEach(product => {
            const productCard = this.createProductCard(product);
            this.productsGrid.innerHTML += productCard;
        });

        // Agregar event listeners a los botones después de renderizar
        this.attachProductEventListeners();
    }

    /**
     * Crea el HTML de una tarjeta de producto
     * @param {Object} product - Datos del producto
     * @returns {string} - HTML de la tarjeta
     */
    createProductCard(product) {
        // Calcular estrellas para el rating
        const stars = this.generateStars(product.rating);

        // Badge si tiene descuento
        const discountBadge = product.discountPercentage > 0
            ? `<span class="product-badge">-${product.discountPercentage}%</span>`
            : '';

        return `
            <div class="col">
                <div class="product-card" data-product-id="${product.id}">
                    <div class="product-image-container">
                        <img src="${product.thumbnail}" 
                             alt="${product.title}" 
                             class="product-image"
                             loading="lazy"
                             onerror="this.src='https://via.placeholder.com/300x400/faf9f6/2c2c2c?text=VestIA'">
                        ${discountBadge}
                    </div>
                    <div class="product-info">
                        <p class="product-category">${product.vestiaCategory}</p>
                        <h5 class="product-title">${product.title}</h5>
                        <p class="product-description">${product.description}</p>
                        <div class="product-rating">
                            <span class="stars">${stars}</span>
                            <span class="text-muted small">(${product.rating})</span>
                        </div>
                        <div class="d-flex align-items-center gap-2 mb-3">
                            ${product.discountPercentage > 0
                ? `<span class="product-price text-decoration-line-through text-muted small">$${product.price}</span>
                                   <span class="product-price">$${product.finalPrice}</span>`
                : `<span class="product-price">$${product.price}</span>`
            }
                        </div>
                        <div class="product-actions">
                            <button class="btn btn-primary flex-fill add-to-cart-btn" 
                                    data-product-id="${product.id}">
                                <i class="fas fa-cart-plus me-2"></i>Agregar
                            </button>
                            <button class="btn btn-outline-secondary btn-icon view-product-btn" 
                                    data-product-id="${product.id}"
                                    title="Ver detalles">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Agrega event listeners a los botones de productos
     */
    attachProductEventListeners() {
        // Botones "Agregar al carrito"
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = parseInt(e.currentTarget.dataset.productId);
                this.addToCart(productId);
            });
        });

        // Botones "Ver detalles"
        document.querySelectorAll('.view-product-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = parseInt(e.currentTarget.dataset.productId);
                this.showProductDetails(productId);
            });
        });
    }

    /**
     * Agrega un producto al carrito
     * @param {number} productId - ID del producto
     */
    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product && window.shoppingCart) {
            window.shoppingCart.addItem(product, 1);
        }
    }

    /**
     * Muestra los detalles de un producto en un modal
     * @param {number} productId - ID del producto
     */
    showProductDetails(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const modal = new bootstrap.Modal(document.getElementById('productModal'));
        const modalTitle = document.getElementById('productModalTitle');
        const modalBody = document.getElementById('productModalBody');

        modalTitle.textContent = product.title;

        const stars = this.generateStars(product.rating);

        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <img src="${product.images[0]}" alt="${product.title}" class="img-fluid rounded mb-3">
                </div>
                <div class="col-md-6">
                    <p class="text-muted small text-uppercase">${product.vestiaCategory}</p>
                    <h4 class="mb-3">${product.title}</h4>
                    <div class="mb-3">
                        <span class="stars">${stars}</span>
                        <span class="text-muted ms-2">(${product.rating})</span>
                    </div>
                    <p class="mb-3">${product.description}</p>
                    <div class="mb-3">
                        <strong>Marca:</strong> ${product.brand}
                    </div>
                    <div class="mb-3">
                        <strong>Precio:</strong> 
                        <span class="h3 text-primary">$${product.finalPrice}</span>
                        ${product.discountPercentage > 0
                ? `<span class="badge bg-success ms-2">-${product.discountPercentage}%</span>`
                : ''}
                    </div>
                    <div class="mb-3">
                        <strong>Disponibilidad:</strong> 
                        ${product.stock > 0
                ? `<span class="text-success">${product.stock} en stock</span>`
                : '<span class="text-danger">Agotado</span>'}
                    </div>
                    <div class="mb-3">
                        <strong>Tallas disponibles:</strong><br>
                        ${product.availableSizes.map(size =>
                    `<span class="badge bg-secondary me-1">${size}</span>`
                ).join('')}
                    </div>
                    <div class="mb-4">
                        <strong>Colores disponibles:</strong><br>
                        <div class="d-flex gap-2 mt-2">
                            ${product.availableColors.map(color =>
                    `<div class="color-swatch" style="background-color: ${color.hex}" 
                                      title="${color.name}"></div>`
                ).join('')}
                        </div>
                    </div>
                    <button class="btn btn-primary btn-lg w-100" 
                            onclick="window.shoppingCart.addItem(${JSON.stringify(product).replace(/"/g, '&quot;')}, 1)">
                        <i class="fas fa-cart-plus me-2"></i>Agregar al Carrito
                    </button>
                </div>
            </div>
        `;

        modal.show();
    }

    /**
     * Genera HTML de estrellas para el rating
     * @param {number} rating - Calificación del producto
     * @returns {string} - HTML de estrellas
     */
    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let stars = '';
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }

        return stars;
    }

    /**
     * Genera tallas aleatorias para un producto
     * @returns {Array} - Array de tallas
     */
    generateRandomSizes() {
        const allSizes = CONFIG.SIZES;
        const count = Math.floor(Math.random() * 3) + 2; // 2-4 tallas
        const shuffled = allSizes.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    /**
     * Detecta colores basándose en el título y descripción del producto
     * @param {Object} product - Producto a analizar
     * @returns {Array} - Array de colores detectados
     */
    detectColorsFromProduct(product) {
        // 1. LISTA MAESTRA DE COLORES RECONOCIDOS VISUALMENTE
        const manualColors = {
            // --- HOMBRE ---
            83: ['Azul', 'Negro'],      // Blue & Black Check Shirt
            84: ['Negro'],              // Gigabyte Tshirt
            85: ['Rojo', 'Negro'],      // Man Plaid Shirt (La de la foto)
            86: ['Azul'],               // Short Sleeve Shirt
            87: ['Azul', 'Rojo'],       // Men Check Shirt
            88: ['Rojo', 'Negro'],      // Nike Jordan
            89: ['Negro', 'Blanco'],    // Nike Cleats
            90: ['Multicolor', 'Blanco'], // Puma Future
            91: ['Blanco', 'Rojo'],     // Off White & Red
            92: ['Blanco', 'Rojo'],     // Off White Red

            // --- MUJER (Ropa) ---
            162: ['Azul'],              // Blue Frock
            163: ['Amarillo', 'Blanco'],// Girl Summer Dress
            164: ['Gris'],              // Gray Dress
            165: ['Rosa'],              // Short Frock
            166: ['Rojo'],              // Tartan Dress
            177: ['Negro'],             // Black Gown
            178: ['Negro', 'Rojo'],     // Corset Leather
            179: ['Negro'],             // Corset Black Skirt
            180: ['Negro', 'Blanco'],   // Dress Pea (Puntos)
            181: ['Rojo', 'Negro'],     // Marni Suit

            // --- MUJER (Bolsos y Zapatos) ---
            172: ['Azul'],              // Blue Handbag
            173: ['Marrón'],            // Heshe Leather Bag
            174: ['Negro'],             // Prada Bag
            175: ['Blanco'],            // White Backpack
            176: ['Negro'],             // Handbag Black
            185: ['Negro', 'Marrón'],   // Slipper
            186: ['Negro'],             // CK Heel
            187: ['Dorado'],            // Golden Shoes
            188: ['Beige'],             // Pampi Shoes
            189: ['Rojo'],              // Red Shoes

            // --- BELLEZA Y PERFUMES ---
            1: ['Negro'],              // Mascara
            4: ['Rojo'],               // Lipstick
            5: ['Rojo'],               // Nail Polish
            6: ['Blanco'],             // CK One
            7: ['Negro'],              // Chanel Noir
            8: ['Dorado'],             // Dior J'adore
            9: ['Amarillo'],           // Dolce Shine
            10: ['Rosa'],               // Gucci Bloom

            // --- RELOJES ---
            93: ['Marrón'],             // Brown Leather Watch
            95: ['Negro'],              // Rolex Black Dial
            106: ['Dorado'],             // Apple Watch Gold
            190: ['Plateado'],           // IWC Steel
            193: ['Dorado']              // Gold Watch
        };

        // Prioridad 1: Manual
        if (manualColors[product.id]) {
            return manualColors[product.id].map(colorName => {
                const configColor = CONFIG.COLORS.find(c => c.name === colorName);
                return configColor || { name: colorName, hex: '#888888' };
            });
        }

        // Prioridad 2: Detección por Texto
        const textToCheck = (product.title + ' ' + product.description).toLowerCase();
        const detected = [];

        CONFIG.COLORS.forEach(color => {
            if (color.keywords.some(keyword => textToCheck.includes(keyword))) {
                detected.push(color);
            }
        });

        if (detected.length > 0) return detected;

        // Prioridad 3: Aleatorio
        return this.generateRandomColors();
    }

    /**
     * Genera colores aleatorios para un producto
     * @returns {Array} - Array de objetos de color
     */
    generateRandomColors() {
        const allColors = CONFIG.COLORS;
        const count = Math.floor(Math.random() * 3) + 1; // 1-3 colores
        const shuffled = allColors.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    /**
     * Determina la ocasión basada en la categoría del producto
     * @param {string} category - Categoría del producto
     * @returns {string} - Ocasión determinada
     */
    determineOccasion(category) {
        const formalCategories = ['mens-shirts', 'womens-dresses', 'mens-watches', 'womens-watches'];
        const casualCategories = ['tops', 'mens-shoes', 'womens-shoes', 'womens-bags'];
        const sportCategories = ['sports-accessories'];

        if (formalCategories.includes(category)) return 'formal';
        if (sportCategories.includes(category)) return 'deportivo';
        return 'casual';
    }

    /**
     * Renderiza la paginación
     */
    renderPagination() {
        if (!this.pagination) return;

        const totalPages = Math.ceil(this.totalProducts / this.productsPerPage);

        console.log(`Paginacion: pagina ${this.currentPage} de ${totalPages} (${this.totalProducts} productos)`);

        // No mostrar paginación si solo hay una página o menos
        if (totalPages <= 1) {
            this.pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        // Botón anterior
        paginationHTML += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.currentPage - 1}">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;

        // Mostrar hasta 5 páginas
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, startPage + 4);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }

        // Botón siguiente
        paginationHTML += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.currentPage + 1}">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;

        this.pagination.innerHTML = paginationHTML;

        // Event listeners para paginación
        this.pagination.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(e.currentTarget.dataset.page);
                if (page > 0 && page <= totalPages) {
                    this.fetchProducts(page);
                    // Scroll al catálogo
                    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    /**
     * Actualiza el contador de resultados
     * @param {string} query - Término de búsqueda (opcional)
     */
    updateResultsCount(query = null) {
        if (!this.resultsCount) return;

        if (query) {
            this.resultsCount.textContent = `${this.products.length} resultados para "${query}"`;
        } else {
            // Mostrar información más clara sobre filtros activos
            const hasFilters = window.filterManager && (
                window.filterManager.activeFilters.categories.length > 0 ||
                window.filterManager.activeFilters.priceRange ||
                window.filterManager.activeFilters.colors.length > 0 ||
                window.filterManager.activeFilters.occasions.length > 0
            );

            if (hasFilters && this.allFashionProducts) {
                // Hay filtros activos
                this.resultsCount.innerHTML = `
                    Mostrando ${this.products.length} de ${this.totalProducts} productos 
                    <span class="text-muted small">(${this.allFashionProducts.length} totales, filtros activos)</span>
                `;
            } else if (this.allFashionProducts) {
                // Sin filtros, mostrando del total
                this.resultsCount.textContent = `Mostrando ${this.products.length} de ${this.allFashionProducts.length} productos`;
            } else {
                // Fallback
                this.resultsCount.textContent = `Mostrando ${this.products.length} de ${this.totalProducts} productos`;
            }
        }
    }

    /**
     * Muestra el spinner de carga
     */
    showLoading() {
        if (this.loadingSpinner) {
            this.loadingSpinner.style.display = 'block';
        }
        if (this.productsGrid) {
            this.productsGrid.style.opacity = '0.5';
        }
    }

    /**
     * Oculta el spinner de carga
     */
    hideLoading() {
        if (this.loadingSpinner) {
            this.loadingSpinner.style.display = 'none';
        }
        if (this.productsGrid) {
            this.productsGrid.style.opacity = '1';
        }
    }

    /**
     * Maneja errores de la API mostrando productos de fallback
     */
    handleAPIError() {
        console.warn('Usando productos de fallback debido a error en la API');

        Swal.fire({
            icon: 'warning',
            title: 'Modo Sin Conexión',
            text: 'No se pudo conectar con el catálogo. Mostrando productos de ejemplo.',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });

        // Usar productos de fallback de CONFIG
        this.products = this.transformProducts(CONFIG.FALLBACK_PRODUCTS);
        this.totalProducts = this.products.length;
        this.renderProducts(this.products);
        this.updateResultsCount();
        this.hideLoading();
    }

    /**
     * Obtiene un producto por su ID
     * @param {number} id - ID del producto
     * @returns {Object|null} - Producto encontrado o null
     */
    getProductById(id) {
        return this.products.find(p => p.id === id) || null;
    }
}

// Hacer ProductManager disponible globalmente
window.ProductManager = ProductManager;
