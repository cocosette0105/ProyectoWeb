/**
 * Main Application Initializer - VestIA E-Commerce
 * 
 * Punto de entrada de la aplicación. Inicializa todos los módulos,
 * coordina componentes y configura event listeners globales.
 */

// Variables globales para los módulos
let productManager;
let filterManager;
let shoppingCart;
let userPreferences;
let vestiAssistant;

/**
 * Inicialización principal de la aplicación
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Inicializando VestIA E-Commerce Platform...');

    try {
        // 1. Inicializar módulos en orden de dependencias
        await initializeModules();

        // 2. Configurar event listeners globales
        setupGlobalListeners();

        // 3. Configurar búsqueda y ordenamiento
        setupSearch();
        setupSorting();

        // 4. Cargar productos iniciales
        await loadInitialProducts();

        // 5. Configurar animaciones y efectos
        setupAnimations();

        console.log('Aplicacion inicializada correctamente');

    } catch (error) {
        console.error('Error al inicializar la aplicacion:', error);

        // Mostrar error al usuario
        Swal.fire({
            icon: 'error',
            title: 'Error de Inicialización',
            text: 'Hubo un problema al cargar la aplicación. Por favor, recarga la página.',
            confirmButtonColor: '#d4af37'
        });
    }
});

/**
 * Inicializa todos los módulos de la aplicación
 */
async function initializeModules() {
    console.log('Inicializando módulos...');

    // Verificar que CONFIG esté cargado
    if (typeof CONFIG === 'undefined') {
        throw new Error('CONFIG no está cargado. Verifica que config.js esté incluido.');
    }

    // 1. ProductManager (necesita estar primero)
    if (typeof ProductManager !== 'undefined') {
        productManager = new ProductManager();
        window.productManager = productManager;
        console.log('ProductManager inicializado');
    } else {
        console.error('ProductManager no encontrado');
    }

    // 2. FilterManager (depende de ProductManager)
    if (typeof FilterManager !== 'undefined' && productManager) {
        filterManager = new FilterManager(productManager);
        window.filterManager = filterManager;
        filterManager.initialize();
        console.log('FilterManager inicializado');
    } else {
        console.error('FilterManager no encontrado o ProductManager no disponible');
    }

    // 3. ShoppingCart
    if (typeof ShoppingCart !== 'undefined') {
        shoppingCart = new ShoppingCart();
        window.shoppingCart = shoppingCart;
        console.log('ShoppingCart inicializado');
    } else {
        console.error('ShoppingCart no encontrado');
    }

    // 4. UserPreferences
    if (typeof UserPreferences !== 'undefined') {
        userPreferences = new UserPreferences();
        window.userPreferences = userPreferences;
        console.log('UserPreferences inicializado');
    } else {
        console.error('UserPreferences no encontrado');
    }

    // 5. VestiAssistant (chatbot con IA)
    if (typeof VestiAssistant !== 'undefined') {
        vestiAssistant = new VestiAssistant();
        window.vestiAssistant = vestiAssistant;
        console.log('VestiAssistant (chatbot) inicializado');
    } else {
        console.error('VestiAssistant no encontrado');
    }
}

/**
 * Configura event listeners globales
 */
function setupGlobalListeners() {
    console.log('Configurando event listeners globales...');

    // Smooth scroll para enlaces internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href !== '#!') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // Detectar scroll para efectos
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        // Agregar clase al navbar cuando se hace scroll
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            if (currentScroll > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }

        lastScroll = currentScroll;
    });

    // Lazy loading de imágenes (por si acaso el navegador no lo soporta nativamente)
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

        // Observar imágenes con data-src
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    // Cerrar chatbot al hacer clic fuera (opcional)
    document.addEventListener('click', (e) => {
        const chatWidget = document.getElementById('chatbotWidget');
        const toggleBtn = document.getElementById('chatToggleBtn');

        if (chatWidget && toggleBtn && vestiAssistant && vestiAssistant.isOpen) {
            // Si el clic no fue en el chat ni en el botón de toggle
            if (!chatWidget.contains(e.target) && !toggleBtn.contains(e.target)) {
                // No cerrar automáticamente para mejor UX móvil
                // vestiAssistant.closeChat();
            }
        }
    });

    console.log('Event listeners globales configurados');
}

/**
 * Configura la funcionalidad de búsqueda
 */
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    if (!searchInput || !searchBtn || !productManager) return;

    // Event listener para el botón de búsqueda
    searchBtn.addEventListener('click', () => {
        performSearch();
    });

    // Event listener para Enter en el input
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Función para realizar la búsqueda
    function performSearch() {
        const query = searchInput.value.trim();

        if (query) {
            console.log(`Buscando: ${query}`);
            productManager.searchProducts(query);

            // Scroll al catálogo
            document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
        } else {
            // Si no hay query, recargar productos
            productManager.fetchProducts(1);
        }
    }

    console.log('Busqueda configurada');
}

/**
 * Configura el ordenamiento de productos
 */
function setupSorting() {
    const sortItems = document.querySelectorAll('.dropdown-item[data-sort]');

    sortItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const criteria = e.target.dataset.sort;
            if (productManager) {
                productManager.sortProducts(criteria);
            }
        });
    });

    console.log('Ordenamiento configurado');
}

/**
 * Carga productos iniciales
 */
async function loadInitialProducts() {
    console.log('Cargando productos iniciales...');

    if (productManager) {
        try {
            await productManager.fetchProducts(1, CONFIG.PRODUCTS_PER_PAGE);
            console.log('Productos cargados');
        } catch (error) {
            console.error('Error al cargar productos iniciales:', error);
        }
    }
}

/**
 * Configura animaciones y efectos visuales
 */
function setupAnimations() {
    // Animación de entrada para elementos con clase .animate-on-scroll
    const animatedElements = document.querySelectorAll('.animate-on-scroll');

    if (animatedElements.length > 0 && 'IntersectionObserver' in window) {
        const animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                }
            });
        }, {
            threshold: 0.1
        });

        animatedElements.forEach(el => animationObserver.observe(el));
    }

    // Animación del badge del carrito
    const cartBadge = document.getElementById('cartBadge');
    if (cartBadge) {
        // Observar cambios en el contenido del badge
        const badgeObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    cartBadge.classList.add('pulse');
                    setTimeout(() => cartBadge.classList.remove('pulse'), 600);
                }
            });
        });

        badgeObserver.observe(cartBadge, {
            childList: true,
            characterData: true,
            subtree: true
        });
    }

    console.log('Animaciones configuradas');
}

/**
 * Utilidad: Formatea precio como moneda
 * @param {number} price - Precio a formatear
 * @returns {string} - Precio formateado
 */
function formatCurrency(price) {
    return `${CONFIG.CURRENCY_SYMBOL}${parseFloat(price).toFixed(2)}`;
}

/**
 * Utilidad: Debounce para optimizar eventos que se disparan frecuentemente
 * @param {Function} func - Función a ejecutar
 * @param {number} wait - Tiempo de espera en ms
 * @returns {Function} - Función con debounce
 */
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

/**
 * Utilidad: Throttle para limitar ejecuciones
 * @param {Function} func - Función a ejecutar
 * @param {number} limit - Límite de tiempo en ms
 * @returns {Function} - Función con throttle
 */
function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Hacer utilidades disponibles globalmente
window.formatCurrency = formatCurrency;
window.debounce = debounce;
window.throttle = throttle;

// Mensaje de bienvenida en consola
console.log(`
              VestIA E-Commerce Platform             
        Tu Boutique de Moda Inteligente con IA             
  Desarrollado con:                                        
  • HTML5 & CSS3                                           
  • JavaScript ES6+                                        
  • Bootstrap 5.3.2                                        
  • Google Gemini API                                      
  • DummyJSON API                                          
                                                            
  Proyecto Académico - Programación Orientada a la Web    
© 2026 VestIA                                            
`);

// Log de información útil para desarrollo
if (CONFIG.GEMINI_API_KEY === 'YOUR_API_KEY_HERE') {
    console.warn('ADVERTENCIA: API Key de Gemini no configurada. El chatbot no funcionara correctamente.');
    console.info('Configura tu API key en js/config.js');
}

console.log('Modulos cargados:', {
    ProductManager: typeof ProductManager !== 'undefined',
    FilterManager: typeof FilterManager !== 'undefined',
    ShoppingCart: typeof ShoppingCart !== 'undefined',
    UserPreferences: typeof UserPreferences !== 'undefined',
    VestiAssistant: typeof VestiAssistant !== 'undefined'
});
