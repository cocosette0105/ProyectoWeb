/**
 * Archivo de Configuracion - VestIA E-Commerce Platform
 * 
 * Este archivo contiene todas las constantes y configuraciones globales de la aplicacion,
 * incluyendo las API keys necesarias y parametros de configuracion.
 * 
 * NOTA DE SEGURIDAD:
 * La API key de Gemini esta expuesta en este archivo unicamente con fines academicos.
 * En un entorno de produccion, las API keys NUNCA deben estar en el codigo del frontend.
 * Se deberia usar un backend intermedio o variables de entorno.
 */

const CONFIG = {
    // Configuracion de Google Gemini API
    GEMINI_API_KEY: 'AIzaSyCIe4Wjch5nCl7CpogjvlRty0pxZAuTfcg', // Nueva API Key exclusiva para defensa
    GEMINI_MODEL: 'gemini-2.5-flash', // Modelo confirmado disponible y requerido en PDF
    GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models',

    // Configuracion de DummyJSON API
    DUMMYJSON_BASE_URL: 'https://dummyjson.com',
    DUMMYJSON_PRODUCTS_ENDPOINT: '/products',
    DUMMYJSON_SEARCH_ENDPOINT: '/products/search',

    // Configuración de paginación
    PRODUCTS_PER_PAGE: 9,
    MAX_PRODUCTS_LIMIT: 100,

    // Configuración del carrito
    MAX_CART_QUANTITY: 10,
    CURRENCY: 'USD',
    CURRENCY_SYMBOL: '$',
    TAX_RATE: 0.0, // 0% impuestos (configurable)

    // Configuración del chatbot
    CHAT_HISTORY_LIMIT: 50,
    CHATBOT_NAME: 'Vesti',
    CHATBOT_GREETING: '¡Hola! Soy Vesti, tu asistente personal de estilo. ¿En qué puedo ayudarte hoy?',

    // Configuración de imágenes
    MAX_IMAGE_SIZE: 2 * 1024 * 1024, // 2MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],

    // LocalStorage keys
    STORAGE_KEYS: {
        CART: 'vestia_cart',
        PREFERENCES: 'vestia_preferences',
        CHAT_HISTORY: 'vestia_chat_history',
        USER_PROFILE: 'vestia_user_profile'
    },

    // Categorías de productos (mapeo de DummyJSON a VestIA)
    CATEGORIES: {
        'beauty': 'Accesorios',
        'fragrances': 'Fragancias',
        'furniture': 'Decoración',
        'groceries': 'Productos',
        'home-decoration': 'Decoración',
        'kitchen-accessories': 'Accesorios',
        'laptops': 'Tecnología',
        'mens-shirts': 'Camisas Hombre',
        'mens-shoes': 'Zapatos Hombre',
        'mens-watches': 'Relojes',
        'mobile-accessories': 'Accesorios',
        'motorcycle': 'Accesorios',
        'skin-care': 'Cuidado Personal',
        'smartphones': 'Tecnología',
        'sports-accessories': 'Deportivo',
        'sunglasses': 'Accesorios',
        'tablets': 'Tecnología',
        'tops': 'Blusas',
        'vehicle': 'Accesorios',
        'womens-bags': 'Bolsos',
        'womens-dresses': 'Vestidos',
        'womens-jewellery': 'Joyería',
        'womens-shoes': 'Zapatos Mujer',
        'womens-watches': 'Relojes'
    },

    // Categorías principales para filtros
    MAIN_CATEGORIES: [
        { id: 'womens-dresses', name: 'Vestidos', icon: 'fas fa-tshirt' },
        { id: 'tops', name: 'Blusas', icon: 'fas fa-vest' },
        { id: 'mens-shirts', name: 'Camisas Hombre', icon: 'fas fa-shirt' },
        { id: 'womens-bags', name: 'Bolsos', icon: 'fas fa-bag-shopping' },
        { id: 'womens-shoes', name: 'Zapatos Mujer', icon: 'fas fa-shoe-prints' },
        { id: 'mens-shoes', name: 'Zapatos Hombre', icon: 'fas fa-person-running' },
        { id: 'womens-jewellery', name: 'Joyería', icon: 'fas fa-gem' },
        { id: 'womens-watches', name: 'Relojes Mujer', icon: 'fas fa-clock' },
        { id: 'mens-watches', name: 'Relojes Hombre', icon: 'fas fa-watch' },
        { id: 'sunglasses', name: 'Gafas de Sol', icon: 'fas fa-glasses' },
        { id: 'fragrances', name: 'Perfumes', icon: 'fas fa-spray-can' },
        { id: 'skin-care', name: 'Cuidado Personal', icon: 'fas fa-hand-sparkles' }
    ],

    // Colores disponibles (para filtros y análisis de imágenes)
    COLORS: [
        { name: 'Negro', hex: '#000000', keywords: ['negro', 'black'] },
        { name: 'Blanco', hex: '#FFFFFF', keywords: ['blanco', 'white'] },
        { name: 'Rojo', hex: '#DC143C', keywords: ['rojo', 'red'] },
        { name: 'Azul', hex: '#1E90FF', keywords: ['azul', 'blue'] },
        { name: 'Verde', hex: '#228B22', keywords: ['verde', 'green'] },
        { name: 'Amarillo', hex: '#FFD700', keywords: ['amarillo', 'yellow'] },
        { name: 'Rosa', hex: '#FF69B4', keywords: ['rosa', 'pink'] },
        { name: 'Morado', hex: '#9370DB', keywords: ['morado', 'purple', 'violeta'] },
        { name: 'Naranja', hex: '#FF8C00', keywords: ['naranja', 'orange'] },
        { name: 'Café', hex: '#8B4513', keywords: ['café', 'brown', 'marrón'] },
        { name: 'Gris', hex: '#808080', keywords: ['gris', 'gray', 'grey'] },
        { name: 'Beige', hex: '#F5F5DC', keywords: ['beige', 'crema', 'cream'] }
    ],

    // Tallas disponibles
    SIZES: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],

    // Ocasiones (para recomendaciones)
    OCCASIONS: [
        { id: 'casual', name: 'Casual', icon: 'fas fa-walking' },
        { id: 'formal', name: 'Formal', icon: 'fas fa-user-tie' },
        { id: 'deportivo', name: 'Deportivo', icon: 'fas fa-running' },
        { id: 'fiesta', name: 'Fiesta', icon: 'fas fa-champagne-glasses' },
        { id: 'trabajo', name: 'Trabajo', icon: 'fas fa-briefcase' }
    ],

    // Rangos de precio ajustados para productos de DummyJSON
    PRICE_RANGES: [
        { id: 'budget', name: 'Económico', min: 0, max: 50 },
        { id: 'medium', name: 'Medio', min: 50, max: 100 },
        { id: 'premium', name: 'Premium', min: 100, max: 200 },
        { id: 'luxury', name: 'Lujo', min: 200, max: 10000 }
    ],

    // Configuración de animaciones (milisegundos)
    ANIMATION: {
        FADE_DURATION: 300,
        SLIDE_DURATION: 400,
        TYPING_DELAY: 50,
        LOADING_MIN_TIME: 500
    },

    // Productos de fallback (si DummyJSON falla)
    FALLBACK_PRODUCTS: [
        {
            id: 999001,
            title: 'Vestido Elegante Negro',
            description: 'Hermoso vestido negro ideal para ocasiones formales',
            price: 89.99,
            category: 'womens-dresses',
            thumbnail: 'https://via.placeholder.com/300x400/1a1a1a/ffffff?text=Vestido+Negro',
            images: ['https://via.placeholder.com/600x800/1a1a1a/ffffff?text=Vestido+Negro'],
            rating: 4.5,
            stock: 15
        },
        {
            id: 999002,
            title: 'Blusa Casual Blanca',
            description: 'Blusa versátil perfecta para el día a día',
            price: 45.99,
            category: 'tops',
            thumbnail: 'https://via.placeholder.com/300x400/ffffff/000000?text=Blusa+Blanca',
            images: ['https://via.placeholder.com/600x800/ffffff/000000?text=Blusa+Blanca'],
            rating: 4.2,
            stock: 20
        },
        {
            id: 999003,
            title: 'Bolso Elegante',
            description: 'Bolso de mano con detalles dorados',
            price: 129.99,
            category: 'womens-bags',
            thumbnail: 'https://via.placeholder.com/300x400/d4af37/000000?text=Bolso',
            images: ['https://via.placeholder.com/600x800/d4af37/000000?text=Bolso'],
            rating: 4.7,
            stock: 8
        }
    ]
};

// Hacer CONFIG disponible globalmente
window.CONFIG = CONFIG;

// Exportar para módulos ES6 (si se usa)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
