# VestIA - Boutique de Moda Inteligente


## Descripción del Proyecto

**VestIA** es una plataforma web de comercio electrónico innovadora que integra inteligencia artificial para transformar la experiencia de compra en línea. La boutique ofrece un asistente virtual personalizado llamado **Vesti**, que ayuda a los clientes a encontrar productos perfectos mediante conversaciones naturales y análisis inteligente de imágenes.

### Problema que Resuelve

Los clientes de boutiques de moda frecuentemente enfrentan dificultades para:
- Encontrar productos que se ajusten a su estilo personal
- Combinar prendas y crear outfits completos
- Decidir qué comprar sin la ayuda de un estilista
- Buscar productos similares a prendas que ya tienen

VestIA soluciona estos problemas ofreciendo:
- **Asistente de IA conversacional** que entiende preferencias y recomienda productos
- **Análisis de imágenes** para encontrar productos similares o complementarios
- **Sistema de preferencias** que aprende de las interacciones del usuario
- **Experiencia de compra personalizada** 24/7

---

## Características Principales

### 1. Catálogo de Productos Dinámico
- Integración con DummyJSON API para catálogo real
- Paginación eficiente (9 productos por página)
- Vista de grid responsive adaptable a cualquier dispositivo
- Sistema de fallback para modo sin conexión
- Imágenes optimizadas con lazy loading

### 2. Sistema de Filtros Avanzado
- Filtro por categoría (vestidos, blusas, zapatos, accesorios, etc.)
- Filtro por rango de precio (económico, medio, premium, lujo)
- Filtro por colores con swatches visuales
- Filtro por ocasión (casual, formal, deportivo, fiesta, trabajo)
- Filtros persistentes en URL para compartir búsquedas
- Badge de filtros activos con opción de remover individualmente

### 3. Barra de Búsqueda Inteligente
- Búsqueda en tiempo real usando DummyJSON Search API
- Resultados instantáneos con contador de productos encontrados
- Integración con sistema de filtros

### 4. Asistente Virtual "Vesti" con IA
- Chatbot conversacional powered by **Google Gemini API**
- Mantiene contexto de conversación
- Proporciona recomendaciones personalizadas basadas en preferencias del usuario
- Genera botones de acción para activar filtros automáticamente
- Quick replies para preguntas frecuentes
- Historial de chat persistente en localStorage

### 5. Reconocimiento de Imágenes
- Upload de fotos de prendas (drag & drop o click)
- Análisis con **Gemini Vision AI** para identificar:
  - Tipo de prenda
  - Colores predominantes
  - Estilo (casual, formal, deportivo)
  - Ocasión sugerida
- Recomendaciones de productos similares o complementarios
- Validación de formato (JPG, PNG, WebP) y tamaño (máx. 2MB)

### 6. Carrito de Compras
- Agregar productos con notificaciones elegantes (SweetAlert2)
- Modificar cantidades con controles touch-friendly
- Eliminar productos con confirmación
- Cálculo automático de subtotal y total
- Persistencia en localStorage (el carrito no se pierde al cerrar la página)
- Badge animado con contador de productos
- Proceso de checkout simulado
- Offcanvas lateral para acceso rápido

### 7. Sistema de Preferencias de Usuario
- Configuración de colores favoritos
- Selección de tallas preferidas
- Estilos favoritos (casual, formal, deportivo, etc.)
- Rango de precio preferido
- Aplicación automática de filtros recomendados
- Persistencia en localStorage
- Onboarding para usuarios nuevos

### 8. Diseño Responsive
- **Mobile-first approach**
- Breakpoints optimizados para:
  - Móviles (< 576px)
  - Tablets (576px - 991px)
  - Desktop (≥ 992px)
- Botones touch-friendly mínimo 44x44px (Apple HIG compliance)
- Tipografía legible en móvil (mínimo 16px)
- Navegación hamburguesa en móvil
- Optimizado para defensa en dispositivo móvil real

### 9. UI/UX Premium
- Paleta de colores elegante (Negro, Dorado, Rosa dorado, Crema)
- Tipografía personalizada (Playfair Display + Inter)
- Animaciones suaves y micro-interactions
- Glassmorphism en componentes clave
- Gradientes sutiles para elementos premium
- Custom scrollbar
- Loading states y feedback visual constante

---

## Tecnologías Utilizadas

### Obligatorias del Proyecto

| Tecnología | Versión | Uso |
|------------|---------|-----|
| **HTML5** | - | Estructura semántica |
| **CSS3** | - | Estilos y diseño responsive |
| **JavaScript** | ES6+ | Lógica e interactividad |
| **Bootstrap** | 5.3.2 | Framework CSS responsive |
| **Google Gemini API** | gemini-2.0-flash-exp | Chatbot conversacional y análisis de imágenes |
| **DummyJSON API** | - | Catálogo de productos |
| **Fetch API** | - | Peticiones HTTP |
| **localStorage** | - | Persistencia de datos |

### Librerías Adicionales

| Librería | Uso |
|----------|-----|
| **SweetAlert2** | Alertas y modales elegantes |
| **Font Awesome** | Iconos vectoriales |
| **Google Fonts** | Tipografías (Playfair Display, Inter) |

---

## Estructura del Proyecto

```
ProyectoWeb/
├── index.html                    # Página principal (HTML semántico)
├── css/
│   └── styles.css               # Estilos personalizados
├── js/
│   ├── config.js                # Configuración (API keys, constantes)
│   ├── products.js              # Gestión de productos y DummyJSON API
│   ├── filters.js               # Sistema de filtros avanzado
│   ├── cart.js                  # Carrito de compras
│   ├── profile.js               # Preferencias del usuario
│   ├── chatbot.js               # Chatbot con Gemini IA
│   └── main.js                  # Inicialización principal
├── assets/
│   └── images/                  # Imágenes locales (si las hay)
└── README.md                    # Este archivo
```

### Descripción de Archivos JavaScript

#### **config.js**
Contiene todas las constantes y configuraciones globales:
- API keys (Gemini, DummyJSON)
- Configuración de paginación (9 productos por página)
- Limites del carrito (máx. 10 unidades por producto)
- Categorías, colores, tallas, ocasiones
- Productos de fallback para modo offline
- Keys de localStorage

#### **products.js**
Clase `ProductManager` que maneja:
- Fetch de productos desde DummyJSON API con paginación
- Búsqueda de productos por término
- Filtrado por categoría
- Transformación de productos (agregar tallas, colores, ocasión)
- Renderizado del grid de productos
- Modal de detalles de producto
- Sistema de fallback si la API falla

#### **filters.js**
Clase `FilterManager` que controla:
- Filtros por categoría, precio, color, ocasión
- Persistencia de filtros en URL parameters
- Activación de filtros desde URL (para recomendaciones del chatbot)
- Display de filtros activos con badges
- Funcionalidad programática para que el chatbot active filtros

#### **cart.js**
Clase `ShoppingCart` que implementa:
- Agregar/eliminar/modificar productos
- Cálculo de subtotales y totales
- Validación de stock y cantidades
- Persistencia en localStorage
- Notificaciones con SweetAlert2
- Proceso de checkout simulado

#### **profile.js**
Clase `UserPreferences` que gestiona:
- Guardado de preferencias (colores, tallas, estilos, precio)
- Carga de preferencias desde localStorage
- Generación de filtros recomendados
- Aplicación automática de preferencias
- Onboarding para usuarios nuevos

#### **chatbot.js**
Clase `VestiAssistant` que proporciona:
- Chatbot conversacional con Gemini API
- Análisis de imágenes con Gemini Vision
- Mantención de contexto de conversación
- Procesamiento de recomendaciones (extrae filtros de respuestas IA)
- Generación de botones de acción para activar filtros
- Historial de chat en localStorage
- Quick replies y typing indicators

#### **main.js**
Punto de entrada que:
- Inicializa todos los módulos en orden correcto
- Configura event listeners globales
- Setup de búsqueda
- Carga productos iniciales
- Configura animaciones y efectos visuales
- Proporciona utilidades globales (debounce, throttle, formatCurrency)

---

## Instalación y Uso

### Requisitos Previos
- Navegador web moderno (Chrome, Firefox, Edge, Safari)
- Conexión a internet (para cargar Bootstrap, APIs externas)
- **API Key de Google Gemini** (gratis en https://ai.google.dev/)

### Pasos de Instalación

1. **Clonar o descargar el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/vestia-ecommerce.git
   cd vestia-ecommerce
   ```

2. **Configurar API Key de Gemini**
   - Visita https://ai.google.dev/ y crea una cuenta
   - Obtén tu API key gratuita
   - Abre `js/config.js` y reemplaza:
   ```javascript
   GEMINI_API_KEY: 'TU_API_KEY_AQUI'
   ```

3. **Abrir en navegador**
   - **Opción A**: Abrir directamente `index.html` en tu navegador
   - **Opción B** (recomendado): Usar un servidor local
     ```bash
     # Con Python 3
     python -m http.server 8000
     
     # Con Node.js (http-server)
     npx http-server
     ```
   - Navegar a `http://localhost:8000`

4. **Listo**
   - Explora el catálogo
   - Chatea con Vesti
   - Sube imágenes para análisis
   - Configura tus preferencias

---

## Consideraciones de Seguridad

### **Nota Importante sobre API Keys**

Este proyecto incluye la API key de Google Gemini directamente en el código frontend (`js/config.js`) **únicamente con fines académicos y de evaluación educativa**.

**ADVERTENCIA**: En un entorno de producción real, esta práctica **NO es segura**. Las API keys nunca deben exponerse en código del lado del cliente.

### **Solución Recomendada para Producción:**

- Implementar un backend (Node.js, Python Flask/Django, etc.) que gestione las llamadas a la API
- Usar variables de entorno para almacenar credenciales
- Implementar autenticación y rate limiting
- Utilizar servicios como Vercel Functions, Netlify Functions, o AWS Lambda para serverless

Esta exposición temporal ha sido **permitida explícitamente** en los requerimientos del proyecto educativo.

---

## Testing en Dispositivos

### Desktop
- Google Chrome (recomendado)
- Mozilla Firefox
- Microsoft Edge
- Safari

### Móvil (Crítico para Defensa)
El proyecto está optimizado para defenderse desde un dispositivo móvil real:

**Características móviles:**
- Botones touch-friendly (mínimo 44x44px)
- Chat usable con dedos
- Navegación fluida sin zooms accidentales
- Tipografía legible (16px mínimo)
- Upload de imágenes desde galería/cámara
- Performance optimizado para 4G/5G

**No usar simulador**: Probar en dispositivos físicos (Android/iOS)

---

## Paleta de Colores

| Color | Hex | Uso |
|-------|-----|-----|
| Negro Elegante | `#1a1a1a` | Color primario, textos |
| Dorado | `#d4af37` | Acentos, botones, destacados |
| Rosa Dorado | `#c9a0a0` | Acentos secundarios |
| Crema | `#faf9f6` | Fondo principal |
| Negro Profundo | `#0d0d0d` | Fondos oscuros, gradientes |

---



## Enlaces Útiles

- [Bootstrap 5 Documentación](https://getbootstrap.com/docs/5.3/)
- [Google Gemini API](https://ai.google.dev/docs)
- [DummyJSON API](https://dummyjson.com/docs)
- [SweetAlert2](https://sweetalert2.github.io/)
- [Font Awesome](https://fontawesome.com/)

---



**Desarrollado para VestIA - Tu Boutique Inteligente**

© 2026 VestIA. Proyecto Académico - Programación Orientada a la Web.
