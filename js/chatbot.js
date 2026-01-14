/**
 * Vesti Assistant - AI-Powered Chatbot for VestIA
 * 
 * Asistente virtual que usa Google Gemini API para proporcionar recomendaciones
 * personalizadas de moda y analizar imágenes de prendas.
 */

class VestiAssistant {
    constructor() {
        this.chatHistory = [];
        this.isOpen = false;

        // Elementos del DOM
        this.chatWidget = document.getElementById('chatbotWidget');
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.sendBtn = document.getElementById('sendMessageBtn');
        this.toggleBtn = document.getElementById('chatToggleBtn');
        this.openChatBtn = document.getElementById('openChatBtn');
        this.closeBtn = document.getElementById('closeChatBtn');

        // Upload de imágenes
        this.imageInput = document.getElementById('imageInput');
        this.uploadArea = document.getElementById('uploadArea');
        this.imagePreview = document.getElementById('imagePreview');
        this.previewImg = document.getElementById('previewImg');
        this.analyzeBtn = document.getElementById('analyzeImageBtn');
        this.removeImageBtn = document.getElementById('removeImageBtn');
        this.imageAnalysisResults = document.getElementById('imageAnalysisResults');

        this.currentImage = null;
        this.currentAnalysis = null; // Guardar análisis para aplicar filtros

        this.initialize();
    }

    /**
     * Inicializa el asistente
     */
    initialize() {
        this.loadChatHistory();
        this.attachEventListeners();
        this.displayWelcomeMessage();
    }

    /**
     * Agrega event listeners
     */
    attachEventListeners() {
        // Toggle chatbot
        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', () => this.toggleChat());
        }

        if (this.openChatBtn) {
            this.openChatBtn.addEventListener('click', () => this.openChat());
        }

        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.closeChat());
        }

        // Enviar mensaje
        if (this.sendBtn) {
            this.sendBtn.addEventListener('click', () => this.sendMessage());
        }

        if (this.chatInput) {
            this.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }

        // Upload de imágenes
        if (this.uploadArea) {
            this.uploadArea.addEventListener('click', () => {
                this.imageInput.click();
            });

            // Drag & drop
            this.uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                this.uploadArea.classList.add('dragging');
            });

            this.uploadArea.addEventListener('dragleave', () => {
                this.uploadArea.classList.remove('dragging');
            });

            this.uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                this.uploadArea.classList.remove('dragging');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleImageUpload(files[0]);
                }
            });
        }

        if (this.imageInput) {
            this.imageInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleImageUpload(e.target.files[0]);
                }
            });
        }

        if (this.removeImageBtn) {
            this.removeImageBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.clearImage();
            });
        }

        if (this.analyzeBtn) {
            this.analyzeBtn.addEventListener('click', () => this.analyzeImage());
        }
    }

    /**
     * Toggle del chat
     */
    toggleChat() {
        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }

    /**
     * Abre el chat
     */
    openChat() {
        if (this.chatWidget) {
            this.chatWidget.classList.add('active');
            this.isOpen = true;
            this.chatInput?.focus();
        }
    }

    /**
     * Cierra el chat
     */
    closeChat() {
        if (this.chatWidget) {
            this.chatWidget.classList.remove('active');
            this.isOpen = false;
        }
    }

    /**
     * Muestra mensaje de bienvenida
     */
    displayWelcomeMessage() {
        if (this.chatHistory.length === 0) {
            this.addMessage(CONFIG.CHATBOT_GREETING, 'bot');

            // Sugerencias rápidas
            const quickReplies = [
                '¿Qué puedes hacer?',
                'Ayúdame a encontrar un vestido',
                'Busco algo casual'
            ];

            this.addQuickReplies(quickReplies);
        } else {
            // Renderizar historial existente
            this.chatHistory.forEach(msg => {
                this.renderMessage(msg.text, msg.sender, false);
            });
        }
    }

    /**
     * Envía un mensaje al chatbot
     */
    async sendMessage() {
        const message = this.chatInput.value.trim();

        if (!message) return;

        // Limpiar input
        this.chatInput.value = '';

        // Mostrar mensaje del usuario
        this.addMessage(message, 'user');

        // Mostrar indicador de escritura
        this.showTypingIndicator();

        try {
            // Llamar a Gemini API
            const response = await this.callGeminiAPI(message);

            // Ocultar indicador
            this.hideTypingIndicator();

            // Mostrar respuesta
            this.addMessage(response, 'bot');

            // Verificar si hay recomendaciones de productos
            this.processRecommendations(response);

        } catch (error) {
            console.error('Error en chatbot:', error);
            this.hideTypingIndicator();

            // Manejo especifico para rate limit
            if (error.message === 'RATE_LIMIT') {
                this.addMessage(
                    'He recibido muchas peticiones y necesito un pequeno descanso. Por favor, espera 1 minuto e intentalo de nuevo. Gracias por tu paciencia!',
                    'bot'
                );

                Swal.fire({
                    icon: 'info',
                    title: 'Límite de Peticiones',
                    html: `
                        <p>La API de Gemini tiene un límite de peticiones por minuto.</p>
                        <p class="mt-2"><strong>Solución:</strong> Espera 1-2 minutos y vuelve a intentar.</p>
                        <p class="text-muted small mt-2">Esto es normal con API keys gratuitas en proyectos académicos.</p>
                    `,
                    confirmButtonColor: '#d4af37',
                    confirmButtonText: 'Entendido'
                });
            } else {
                // Otros errores
                this.addMessage(
                    'Lo siento, tuve un problema al procesar tu mensaje. ¿Podrías intentar de nuevo?',
                    'bot'
                );
            }
        }
    }

    /**
     * Llama a Gemini API
     * @param {string} userMessage - Mensaje del usuario
     * @returns {Promise<string>} - Respuesta de la IA
     */
    async callGeminiAPI(userMessage) {
        // Verificar API key
        if (!CONFIG.GEMINI_API_KEY || CONFIG.GEMINI_API_KEY === 'YOUR_API_KEY_HERE') {
            return 'Lo siento, pero la API key de Gemini no está configurada. Por favor, configura tu API key en js/config.js para poder usar el asistente inteligente.';
        }

        // Construir contexto con preferencias del usuario
        const userPrefs = window.userPreferences?.preferences || {};
        let context = `Eres Vesti, un asistente de estilo personal para VestIA, una boutique de moda elegante. `;
        context += `Tu tono es amigable, profesional y conocedor de moda. `;
        context += `Ayudas a los clientes a encontrar prendas y crear outfits perfectos.\n\n`;

        if (userPrefs.colors && userPrefs.colors.length > 0) {
            context += `El usuario prefiere los colores: ${userPrefs.colors.join(', ')}.\n`;
        }

        if (userPrefs.styles && userPrefs.styles.length > 0) {
            context += `El usuario prefiere estilos: ${userPrefs.styles.join(', ')}.\n`;
        }

        context += `\nUsuario: ${userMessage}\n\n`;
        context += `Responde de manera concisa (máximo 3 párrafos). `;
        context += `Si recomiendas productos, menciona colores, estilos u ocasiones específicas que el usuario pueda buscar.`;

        try {
            const url = `${CONFIG.GEMINI_API_URL}/${CONFIG.GEMINI_MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`;

            const requestBody = {
                contents: [{
                    parts: [{ text: context }]
                }],
                generationConfig: {
                    temperature: 0.9,
                    topK: 1,
                    topP: 1,
                    maxOutputTokens: 1000 // Aumentado para gemini-2.5-flash
                }
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();

            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                return data.candidates[0].content.parts[0].text;
            } else {
                throw new Error('Respuesta inválida de la API');
            }

        } catch (error) {
            console.error('Error llamando a Gemini API:', error);

            // Manejo específico para rate limit (429)
            if (error.message && error.message.includes('429')) {
                throw new Error('RATE_LIMIT');
            }

            throw error;
        }
    }

    /**
     * Procesa recomendaciones en la respuesta de la IA
     * @param {string} response - Respuesta de la IA
     */
    processRecommendations(response) {
        // Detectar palabras clave para filtros
        const keywords = {
            categories: CONFIG.MAIN_CATEGORIES.map(c => ({ id: c.id, names: [c.name.toLowerCase()] })),
            colors: CONFIG.COLORS.map(c => ({ name: c.name, keywords: c.keywords })),
            occasions: CONFIG.OCCASIONS.map(o => ({ id: o.id, name: o.name.toLowerCase() }))
        };

        const lowerResponse = response.toLowerCase();
        const filters = {};

        // Detectar categorías
        keywords.categories.forEach(cat => {
            if (cat.names.some(name => lowerResponse.includes(name))) {
                if (!filters.categories) filters.categories = [];
                filters.categories.push(cat.id);
            }
        });

        // Detectar colores
        keywords.colors.forEach(color => {
            if (color.keywords.some(keyword => lowerResponse.includes(keyword))) {
                if (!filters.colors) filters.colors = [];
                filters.colors.push(color.name);
            }
        });

        // Detectar ocasiones
        keywords.occasions.forEach(occ => {
            if (lowerResponse.includes(occ.name)) {
                if (!filters.occasions) filters.occasions = [];
                filters.occasions.push(occ.id);
            }
        });

        // Si se detectaron filtros, mostrar botón de acción
        if (Object.keys(filters).length > 0) {
            this.addFilterButton(filters);
        }
    }

    /**
     * Agrega un botón para activar filtros
     * @param {Object} filters - Filtros a activar
     */
    addFilterButton(filters) {
        const filtersText = [];

        if (filters.categories) {
            filters.categories.forEach(catId => {
                const cat = CONFIG.MAIN_CATEGORIES.find(c => c.id === catId);
                if (cat) filtersText.push(cat.name);
            });
        }

        if (filters.colors) {
            filtersText.push(...filters.colors);
        }

        if (filters.occasions) {
            filters.occasions.forEach(occId => {
                const occ = CONFIG.OCCASIONS.find(o => o.id === occId);
                if (occ) filtersText.push(occ.name);
            });
        }

        const buttonText = `Ver productos: ${filtersText.join(', ')}`;

        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message bot mb-3';
        messageElement.innerHTML = `
            <div class="message-bubble bot">
                <button class="btn btn-primary btn-sm w-100" onclick='window.vestiAssistant.applyFilters(${JSON.stringify(filters)})'>
                    <i class="fas fa-filter me-2"></i>${buttonText}
                </button>
            </div>
        `;

        this.chatMessages.appendChild(messageElement);
        this.scrollToBottom();
    }

    /**
     * Aplica filtros y cierra el chat
     * @param {Object} filters - Filtros a aplicar
     */
    applyFilters(filters) {
        if (window.filterManager) {
            window.filterManager.activateFilters(filters);
            this.closeChat();
        }
    }

    /**
     * Maneja la carga de una imagen
     * @param {File} file - Archivo de imagen
     */
    handleImageUpload(file) {
        // Validar tipo de archivo
        if (!CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)) {
            Swal.fire({
                icon: 'error',
                title: 'Formato no válido',
                text: 'Por favor sube una imagen en formato JPG, PNG o WebP'
            });
            return;
        }

        // Validar tamaño
        if (file.size > CONFIG.MAX_IMAGE_SIZE) {
            Swal.fire({
                icon: 'error',
                title: 'Archivo muy grande',
                text: `La imagen no debe superar ${CONFIG.MAX_IMAGE_SIZE / (1024 * 1024)}MB`
            });
            return;
        }

        // Leer y mostrar preview
        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentImage = e.target.result;
            this.previewImg.src = this.currentImage;
            this.uploadArea.querySelector('.upload-placeholder').style.display = 'none';
            this.imagePreview.classList.remove('d-none');
            this.analyzeBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    }

    /**
     * Limpia la imagen cargada
     */
    clearImage() {
        this.currentImage = null;
        this.previewImg.src = '';
        this.uploadArea.querySelector('.upload-placeholder').style.display = 'block';
        this.imagePreview.classList.add('d-none');
        this.analyzeBtn.disabled = true;
        this.imageInput.value = '';
        this.imageAnalysisResults.classList.add('d-none');
    }

    /**
     * Analiza la imagen con Gemini Vision
     */
    async analyzeImage() {
        if (!this.currentImage) return;

        if (!CONFIG.GEMINI_API_KEY || CONFIG.GEMINI_API_KEY === 'YOUR_API_KEY_HERE') {
            Swal.fire({
                icon: 'error',
                title: 'API Key no configurada',
                text: 'Por favor configura tu API key de Gemini en js/config.js'
            });
            return;
        }

        // Mostrar loading
        Swal.fire({
            title: 'Analizando imagen...',
            html: 'Vesti está identificando la prenda y colores',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            // Convertir base64 a formato que acepta Gemini (quitar data:image/...;base64,)
            const imageData = this.currentImage.split(',')[1];

            const prompt = `Analiza esta imagen de moda. Identifica con PRECISIÓN:
            
            1. **Tipo de artículo**: ¿Es un vestido, blusa, camisa, pantalón, zapatos, bolso, reloj, gafas de sol, joyería, perfume, producto de cuidado personal u otro accesorio?
            2. **Colores predominantes**: Menciona los colores exactos que ves (negro, blanco, azul, plateado, dorado, etc.)
            3. **Estilo**: ¿Es casual, formal, elegante, deportivo, para fiesta?
            4. **Material aparente**: ¿Qué material parece tener? (metal, cuero, tela, vidrio, plástico, etc.)
            5. **Ocasión sugerida**: ¿Para qué tipo de evento sería ideal?
            
            IMPORTANTE: Si es un RELOJ, menciona específicamente "reloj" y sus características.
            Si son GAFAS, menciona "gafas de sol" o "sunglasses".
            Si es JOYERÍA, menciona "joyería" o el tipo específico.
            Si es un PERFUME o FRAGANCIA, menciona "perfume" o "fragancia" y describe el frasco.
            Si es una CAMISA o CAMISETA, menciona "camisa" o "camiseta".
            Si es un producto de CUIDADO PERSONAL (crema, loción, jabón), menciona "cuidado personal" o el tipo.
            
            Responde de forma concisa y amigable, como un estilista personal.`;

            const url = `${CONFIG.GEMINI_API_URL}/${CONFIG.GEMINI_MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`;

            const requestBody = {
                contents: [{
                    parts: [
                        { text: prompt },
                        {
                            inline_data: {
                                mime_type: "image/jpeg",
                                data: imageData
                            }
                        }
                    ]
                }],
                generationConfig: {
                    temperature: 0.4,
                    maxOutputTokens: 1500 // Aumentado para asegurar respuestas completas
                }
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();

            Swal.close();

            if (data.candidates && data.candidates[0]) {
                const analysis = data.candidates[0].content.parts[0].text;
                this.showImageAnalysisResults(analysis);
            } else {
                throw new Error('No se pudo analizar la imagen');
            }

        } catch (error) {
            console.error('Error analizando imagen:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error en el análisis',
                text: 'No se pudo analizar la imagen. Intenta de nuevo.'
            });
        }
    }

    /**
     * Muestra resultados del análisis de imagen
     * @param {string} analysis - Texto del análisis
     */
    /**
     * Formatea el mensaje para mostrar negritas y saltos de línea
     * @param {string} text - Texto original
     * @returns {string} - Texto formateado con HTML
     */
    formatMessage(text) {
        // Reemplazar **texto** con <strong>texto</strong>
        let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Reemplazar saltos de línea con <br>
        formatted = formatted.replace(/\n/g, '<br>');

        return formatted;
    }

    /**
     * Muestra resultados del análisis de imagen
     * @param {string} analysis - Texto del análisis
     */
    showImageAnalysisResults(analysis) {
        this.currentAnalysis = analysis; // Guardar para búsqueda de similares

        this.imageAnalysisResults.innerHTML = `
            <div class="alert alert-success">
                <h5><i class="fas fa-magic me-2"></i>Análisis de Vesti</h5>
                <p class="mb-0">${this.formatMessage(analysis)}</p>
            </div>
            <div class="d-grid gap-2">
                <button class="btn btn-primary" onclick="window.vestiAssistant.searchSimilarProducts(false)">
                    <i class="fas fa-search me-2"></i>Buscar Productos Similares
                    <small class="d-block mt-1 opacity-75">Búsqueda amplia por categoría</small>
                </button>
                <button class="btn btn-outline-primary" onclick="window.vestiAssistant.searchSimilarProducts(true)">
                    <i class="fas fa-filter me-2"></i>Búsqueda Exacta por Color
                    <small class="d-block mt-1 opacity-75">Incluye colores, estilos y ocasiones detectados</small>
                </button>
            </div>
        `;
        this.imageAnalysisResults.classList.remove('d-none');
    }

    /**
     * Busca productos similares después del análisis
     * @param {boolean} useExactFilters - Si true, usa búsqueda exacta con colores; si false, solo categoría
     */
    searchSimilarProducts(useExactFilters = false) {
        if (!this.currentAnalysis) {
            document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
            return;
        }

        const analysisLower = this.currentAnalysis.toLowerCase();
        const filters = {};

        console.log('Analisis de imagen:', this.currentAnalysis);
        console.log('Modo de busqueda:', useExactFilters ? 'EXACTA (con colores)' : 'SIMILAR (solo categoria)');

        // Detectar categorías primero
        const detectedCategories = [];
        let isAccessory = false; // Flag para accesorios

        CONFIG.MAIN_CATEGORIES.forEach(cat => {
            const catName = cat.name.toLowerCase();
            if (analysisLower.includes(catName) || analysisLower.includes(cat.id)) {
                detectedCategories.push(cat.id);
            }
        });

        // Detección específica de RELOJES (palabra clave muy importante)
        if (analysisLower.includes('reloj') || analysisLower.includes('watch')) {
            console.log('Detectado: RELOJ en analisis');
            isAccessory = true;
            if (!detectedCategories.includes('womens-watches')) {
                detectedCategories.push('womens-watches');
            }
            if (!detectedCategories.includes('mens-watches')) {
                detectedCategories.push('mens-watches');
            }
        }

        // Detección de GAFAS
        if (analysisLower.includes('gafas') || analysisLower.includes('sunglasses') || analysisLower.includes('lentes')) {
            console.log('Detectado: GAFAS en analisis');
            isAccessory = true;
            if (!detectedCategories.includes('sunglasses')) {
                detectedCategories.push('sunglasses');
            }
        }

        // Detección de JOYERÍA
        if (analysisLower.includes('joyería') || analysisLower.includes('jewellery') ||
            analysisLower.includes('collar') || analysisLower.includes('pulsera') ||
            analysisLower.includes('anillo') || analysisLower.includes('aretes')) {
            console.log('Detectado: JOYERIA en analisis');
            isAccessory = true;
            if (!detectedCategories.includes('womens-jewellery')) {
                detectedCategories.push('womens-jewellery');
            }
        }

        // Detección de PERFUMES/FRAGANCIAS
        if (analysisLower.includes('perfume') || analysisLower.includes('fragancia') ||
            analysisLower.includes('fragrance') || analysisLower.includes('eau de') ||
            analysisLower.includes('frasco') || analysisLower.includes('aroma')) {
            console.log('Detectado: PERFUME en analisis');
            isAccessory = true;
            if (!detectedCategories.includes('fragrances')) {
                detectedCategories.push('fragrances');
            }
        }

        // Detección de CAMISAS/CAMISETAS (mens-shirts)
        if (analysisLower.includes('camisa') || analysisLower.includes('shirt') ||
            analysisLower.includes('camiseta') || analysisLower.includes('t-shirt') ||
            analysisLower.includes('playera')) {
            console.log('Detectado: CAMISA en analisis');
            if (!detectedCategories.includes('mens-shirts')) {
                detectedCategories.push('mens-shirts');
            }
        }

        // Detección de CUIDADO PERSONAL/SKINCARE
        if (analysisLower.includes('crema') || analysisLower.includes('loción') ||
            analysisLower.includes('jabón') || analysisLower.includes('skin care') ||
            analysisLower.includes('cuidado') || analysisLower.includes('body wash')) {
            console.log('🧴 Detectado: CUIDADO PERSONAL en análisis');
            isAccessory = true;
            if (!detectedCategories.includes('skin-care')) {
                detectedCategories.push('skin-care');
            }
        }

        if (detectedCategories.length > 0) {
            filters.categories = detectedCategories;
            console.log('📂 Categorías detectadas:', detectedCategories);
        }

        // Lógica de filtros según el modo de búsqueda
        if (useExactFilters) {
            // MODO EXACTO: Siempre aplicar filtros de color y ocasión (tanto para ropa como accesorios)
            console.log('Busqueda EXACTA activada - aplicando todos los filtros detectados');

            // Detectar colores del análisis
            const detectedColors = [];
            CONFIG.COLORS.forEach(color => {
                if (color.keywords.some(keyword => analysisLower.includes(keyword))) {
                    detectedColors.push(color.name);
                }
            });
            if (detectedColors.length > 0) {
                filters.colors = detectedColors;
                console.log('Colores detectados:', detectedColors);
            }

            // Detectar ocasiones/estilos
            const detectedOccasions = [];
            CONFIG.OCCASIONS.forEach(occ => {
                if (analysisLower.includes(occ.name.toLowerCase())) {
                    detectedOccasions.push(occ.id);
                }
            });

            // Palabras clave para ocasiones
            if (analysisLower.includes('elegante') || analysisLower.includes('sofisticado')) {
                if (!detectedOccasions.includes('formal')) detectedOccasions.push('formal');
            }
            if (analysisLower.includes('casual')) {
                if (!detectedOccasions.includes('casual')) detectedOccasions.push('casual');
            }
            if (analysisLower.includes('fiesta') || analysisLower.includes('evento')) {
                if (!detectedOccasions.includes('fiesta')) detectedOccasions.push('fiesta');
            }

            if (detectedOccasions.length > 0) {
                filters.occasions = detectedOccasions;
                console.log('✨ Ocasiones detectadas:', detectedOccasions);
            }
        } else {
            // MODO SIMILAR: Solo aplicar filtros de color/ocasión para ROPA (no accesorios)
            if (!isAccessory) {
                console.log('Ropa detectada - aplicando filtros de color y ocasion');

                // Detectar colores del análisis
                const detectedColors = [];
                CONFIG.COLORS.forEach(color => {
                    if (color.keywords.some(keyword => analysisLower.includes(keyword))) {
                        detectedColors.push(color.name);
                    }
                });
                if (detectedColors.length > 0) {
                    filters.colors = detectedColors;
                    console.log('🎨 Colores detectados:', detectedColors);
                }

                // Detectar ocasiones/estilos
                const detectedOccasions = [];
                CONFIG.OCCASIONS.forEach(occ => {
                    if (analysisLower.includes(occ.name.toLowerCase())) {
                        detectedOccasions.push(occ.id);
                    }
                });

                // Palabras clave para ocasiones
                if (analysisLower.includes('elegante') || analysisLower.includes('sofisticado')) {
                    if (!detectedOccasions.includes('formal')) detectedOccasions.push('formal');
                }
                if (analysisLower.includes('casual')) {
                    if (!detectedOccasions.includes('casual')) detectedOccasions.push('casual');
                }
                if (analysisLower.includes('fiesta') || analysisLower.includes('evento')) {
                    if (!detectedOccasions.includes('fiesta')) detectedOccasions.push('fiesta');
                }

                if (detectedOccasions.length > 0) {
                    filters.occasions = detectedOccasions;
                    console.log('✨ Ocasiones detectadas:', detectedOccasions);
                }
            } else {
                console.log('Accesorio detectado en modo SIMILAR - omitiendo filtros de color y ocasion');
            }
        }

        console.log('Filtros extraidos del analisis:', filters);

        // Si se detectaron filtros, aplicarlos
        if (Object.keys(filters).length > 0 && window.filterManager) {
            window.filterManager.activateFilters(filters);

            Swal.fire({
                icon: 'success',
                title: 'Filtros Aplicados',
                html: `
                    <p>He aplicado filtros basados en el análisis:</p>
                    ${filters.colors ? `<p><strong>Colores:</strong> ${filters.colors.join(', ')}</p>` : ''}
                    ${filters.categories ? `<p><strong>Categorías:</strong> ${filters.categories.length} categorías</p>` : ''}
                    ${filters.occasions ? `<p><strong>Estilos:</strong> ${filters.occasions.map(o => CONFIG.OCCASIONS.find(oc => oc.id === o)?.name).join(', ')}</p>` : ''}
                `,
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 4000,
                timerProgressBar: true
            });
        } else {
            // Sin filtros detectados, simplemente llevar al catálogo
            document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });

            Swal.fire({
                icon: 'info',
                title: 'Catálogo completo',
                text: 'Te mostramos nuestro catálogo completo para que encuentres lo que buscas',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        }
    }

    /**
     * Agrega un mensaje al chat
     * @param {string} text - Texto del mensaje
     * @param {string} sender - 'user' o 'bot'
     */
    addMessage(text, sender) {
        // Guardar en historial
        this.chatHistory.push({ text, sender, timestamp: Date.now() });
        this.saveChatHistory();

        // Renderizar mensaje
        this.renderMessage(text, sender);
    }

    /**
     * Renderiza un mensaje en el chat
     * @param {string} text - Texto del mensaje
     * @param {string} sender - 'user' o 'bot'
     * @param {boolean} scroll - Si hacer scroll al final
     */
    renderMessage(text, sender, scroll = true) {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${sender} mb-3`;

        // Formatear texto si es del bot
        const displayText = sender === 'bot' ? this.formatMessage(text) : text;

        messageElement.innerHTML = `
            <div class="message-bubble ${sender}">
                ${displayText}
            </div>
        `;

        this.chatMessages.appendChild(messageElement);

        if (scroll) {
            this.scrollToBottom();
        }
    }

    /**
     * Muestra indicador de escritura
     */
    showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator mb-3';
        indicator.id = 'typingIndicator';
        indicator.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        this.chatMessages.appendChild(indicator);
        this.scrollToBottom();
    }

    /**
     * Oculta indicador de escritura
     */
    hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }

    /**
     * Agrega respuestas rápidas
     * @param {Array} replies - Array de textos de respuestas rápidas
     */
    addQuickReplies(replies) {
        const repliesElement = document.createElement('div');
        repliesElement.className = 'quick-replies mb-3';

        replies.forEach(reply => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-sm btn-outline-primary me-2 mb-2';
            btn.textContent = reply;
            btn.onclick = () => {
                this.chatInput.value = reply;
                this.sendMessage();
                repliesElement.remove();
            };
            repliesElement.appendChild(btn);
        });

        this.chatMessages.appendChild(repliesElement);
        this.scrollToBottom();
    }

    /**
     * Scroll al final del chat
     */
    scrollToBottom() {
        if (this.chatMessages) {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }
    }

    /**
     * Guarda historial en localStorage
     */
    saveChatHistory() {
        try {
            // Limitar historial
            if (this.chatHistory.length > CONFIG.CHAT_HISTORY_LIMIT) {
                this.chatHistory = this.chatHistory.slice(-CONFIG.CHAT_HISTORY_LIMIT);
            }

            localStorage.setItem(CONFIG.STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(this.chatHistory));
        } catch (error) {
            console.error('Error guardando historial:', error);
        }
    }

    /**
     * Carga historial desde localStorage
     */
    loadChatHistory() {
        try {
            const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.CHAT_HISTORY);
            if (saved) {
                this.chatHistory = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error cargando historial:', error);
            this.chatHistory = [];
        }
    }
}

// Hacer VestiAssistant disponible globalmente
window.VestiAssistant = VestiAssistant;
