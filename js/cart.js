/**
  Shopping Cart - VestIA E-Commerce
  
  Gestiona el carrito de compras con persistencia en localStorage.
 Permite agregar, eliminar, modificar cantidades y calcular totales.
 */

class ShoppingCart {
    constructor() {
        this.items = []; // Items en el carrito
        this.cartOffcanvas = document.getElementById('cartOffcanvas');
        this.cartItems = document.getElementById('cartItems');
        this.cartBadge = document.getElementById('cartBadge');
        this.cartSubtotal = document.getElementById('cartSubtotal');
        this.cartTotal = document.getElementById('cartTotal');
        this.checkoutBtn = document.getElementById('checkoutBtn');
        this.clearCartBtn = document.getElementById('clearCartBtn');

        this.loadFromLocalStorage();
        this.attachEventListeners();
    }

    /**
      Agrega un item al carrito
      @param {Object} product - Producto a agregar
      @param {number} quantity - Cantidad a agregar
     */
    addItem(product, quantity = 1) {
        // Verificar si el producto ya está en el carrito
        const existingItem = this.items.find(item => item.id === product.id);

        if (existingItem) {
            // Si ya existe, incrementar cantidad
            existingItem.quantity += quantity;

            // Validar cantidad máxima
            if (existingItem.quantity > CONFIG.MAX_CART_QUANTITY) {
                existingItem.quantity = CONFIG.MAX_CART_QUANTITY;

                Swal.fire({
                    icon: 'warning',
                    title: 'Cantidad máxima',
                    text: `Solo puedes agregar máximo ${CONFIG.MAX_CART_QUANTITY} unidades de este producto`,
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                });
            }
        } else {
            // Si no existe, agregarlo
            this.items.push({
                ...product,
                quantity: quantity
            });
        }

        // Guardar en localStorage
        this.saveToLocalStorage();

        // Actualizar UI
        this.render();
        this.updateBadge();

        // Notificación de éxito
        Swal.fire({
            icon: 'success',
            title: 'Producto agregado',
            text: `${product.title} fue agregado al carrito`,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
        });
    }

    /**
      Remueve un item del carrito
      @param {number} productId - ID del producto a remover
     */
    removeItem(productId) {
        const item = this.items.find(item => item.id === productId);

        if (!item) return;

        Swal.fire({
            title: '¿Eliminar producto?',
            text: `¿Deseas eliminar "${item.title}" del carrito?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#d4af37',
            cancelButtonColor: '#dc3545',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                this.items = this.items.filter(item => item.id !== productId);
                this.saveToLocalStorage();
                this.render();
                this.updateBadge();

                Swal.fire({
                    icon: 'success',
                    title: 'Producto eliminado',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000
                });
            }
        });
    }

    /**
      Actualiza la cantidad de un item
      @param {number} productId - ID del producto
      @param {number} newQuantity - Nueva cantidad
     */
    updateQuantity(productId, newQuantity) {
        const item = this.items.find(item => item.id === productId);

        if (!item) return;

        // Validar cantidad
        if (newQuantity < 1) {
            this.removeItem(productId);
            return;
        }

        if (newQuantity > CONFIG.MAX_CART_QUANTITY) {
            newQuantity = CONFIG.MAX_CART_QUANTITY;

            Swal.fire({
                icon: 'warning',
                title: 'Cantidad máxima',
                text: `Máximo ${CONFIG.MAX_CART_QUANTITY} unidades permitidas`,
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000
            });
        }

        item.quantity = newQuantity;
        this.saveToLocalStorage();
        this.render();
        this.updateBadge();
    }

    /**
      Calcula el subtotal del carrito
      @returns {number} - Subtotal
     */
    getSubtotal() {
        return this.items.reduce((sum, item) => {
            return sum + (parseFloat(item.finalPrice) * item.quantity);
        }, 0);
    }

    /**
     * Calcula el total del carrito (con impuestos si hay)
     * @returns {number} - Total
     */
    getTotal() {
        const subtotal = this.getSubtotal();
        const tax = subtotal * CONFIG.TAX_RATE;
        return subtotal + tax;
    }

    /**
      Obtiene el número total de items en el carrito
      @returns {number} - Total de items
     */
    getItemCount() {
        return this.items.reduce((count, item) => count + item.quantity, 0);
    }

    /**
      Vacía el carrito
     */
    clear() {
        Swal.fire({
            title: '¿Vaciar carrito?',
            text: 'Se eliminarán todos los productos del carrito',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d4af37',
            cancelButtonColor: '#dc3545',
            confirmButtonText: 'Sí, vaciar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                this.items = [];
                this.saveToLocalStorage();
                this.render();
                this.updateBadge();

                Swal.fire({
                    icon: 'success',
                    title: 'Carrito vaciado',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000
                });
            }
        });
    }

    /**
      Renderiza el carrito en el offcanvas
     */
    render() {
        if (!this.cartItems) return;

        if (this.items.length === 0) {
            // Carrito vacío
            this.cartItems.innerHTML = `
                <div class="cart-empty">
                    <i class="fas fa-shopping-cart"></i>
                    <p class="mt-3">Tu carrito está vacío</p>
                    <button class="btn btn-primary" data-bs-dismiss="offcanvas">
                        Ir a comprar
                    </button>
                </div>
            `;

            // Actualizar totales
            if (this.cartSubtotal) this.cartSubtotal.textContent = '$0.00';
            if (this.cartTotal) this.cartTotal.textContent = '$0.00';

            return;
        }

        // Renderizar items
        let html = '';
        this.items.forEach(item => {
            html += this.createCartItemHTML(item);
        });

        this.cartItems.innerHTML = html;

        // Actualizar totales
        const subtotal = this.getSubtotal();
        const total = this.getTotal();

        if (this.cartSubtotal) {
            this.cartSubtotal.textContent = `${CONFIG.CURRENCY_SYMBOL}${subtotal.toFixed(2)}`;
        }

        if (this.cartTotal) {
            this.cartTotal.textContent = `${CONFIG.CURRENCY_SYMBOL}${total.toFixed(2)}`;
        }

        // Agregar event listeners a los controles de cantidad
        this.attachQuantityListeners();
    }

    /**
     * Crea el HTML para un item del carrito
      @param {Object} item - Item del carrito
      @returns {string} - HTML del item
     */
    createCartItemHTML(item) {
        const itemTotal = (parseFloat(item.finalPrice) * item.quantity).toFixed(2);

        return `
            <div class="cart-item" data-product-id="${item.id}">
                <img src="${item.thumbnail}" alt="${item.title}" class="cart-item-image">
                <div class="cart-item-info">
                    <p class="cart-item-title">${item.title}</p>
                    <p class="cart-item-price">${CONFIG.CURRENCY_SYMBOL}${item.finalPrice} × ${item.quantity}</p>
                    <div class="quantity-controls">
                        <button class="quantity-btn decrease-qty" data-product-id="${item.id}">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="px-3">${item.quantity}</span>
                        <button class="quantity-btn increase-qty" data-product-id="${item.id}">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <p class="text-muted small mt-2">Total: ${CONFIG.CURRENCY_SYMBOL}${itemTotal}</p>
                </div>
                <button class="btn btn-sm btn-outline-danger remove-item-btn" data-product-id="${item.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }

    /**
     * Actualiza el badge del carrito
     */
    updateBadge() {
        if (!this.cartBadge) return;

        const count = this.getItemCount();
        this.cartBadge.textContent = count;

        // Animación cuando se agrega un item
        if (count > 0) {
            this.cartBadge.classList.add('pulse');
            setTimeout(() => this.cartBadge.classList.remove('pulse'), 600);
        }
    }

    /**
      Agrega event listeners a los controles de cantidad
     */
    attachQuantityListeners() {
        // Botones de incrementar cantidad
        document.querySelectorAll('.increase-qty').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = parseInt(e.currentTarget.dataset.productId);
                const item = this.items.find(item => item.id === productId);
                if (item) {
                    this.updateQuantity(productId, item.quantity + 1);
                }
            });
        });

        // Botones de decrementar cantidad
        document.querySelectorAll('.decrease-qty').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = parseInt(e.currentTarget.dataset.productId);
                const item = this.items.find(item => item.id === productId);
                if (item) {
                    this.updateQuantity(productId, item.quantity - 1);
                }
            });
        });

        // Botones de eliminar item
        document.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = parseInt(e.currentTarget.dataset.productId);
                this.removeItem(productId);
            });
        });
    }

    /**
      Agrega event listeners generales
     */
    attachEventListeners() {
        // Botón de vaciar carrito
        if (this.clearCartBtn) {
            this.clearCartBtn.addEventListener('click', () => this.clear());
        }

        // Botón de checkout
        if (this.checkoutBtn) {
            this.checkoutBtn.addEventListener('click', () => this.checkout());
        }
    }

    /**
     Proceso de checkout (simulado)
     */
    checkout() {
        if (this.items.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Carrito vacío',
                text: 'Agrega productos antes de proceder al pago'
            });
            return;
        }

        const total = this.getTotal();

        Swal.fire({
            title: 'Confirmar Compra',
            html: `
                <p>Total a pagar: <strong>${CONFIG.CURRENCY_SYMBOL}${total.toFixed(2)}</strong></p>
                <p class="text-muted small">Esto es una simulación. No se procesará ningún pago real.</p>
            `,
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#d4af37',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Confirmar Compra',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                // Simular procesamiento
                Swal.fire({
                    title: 'Procesando...',
                    html: 'Por favor espera',
                    timer: 2000,
                    timerProgressBar: true,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                }).then(() => {
                    // Éxito
                    Swal.fire({
                        icon: 'success',
                        title: '¡Compra Exitosa!',
                        html: `
                            <p>Tu pedido ha sido procesado con éxito.</p>
                            <p class="text-muted small">Número de orden: #${Math.floor(Math.random() * 100000)}</p>
                        `,
                        confirmButtonColor: '#d4af37'
                    });

                    // Vaciar carrito
                    this.items = [];
                    this.saveToLocalStorage();
                    this.render();
                    this.updateBadge();

                    // Cerrar offcanvas
                    const bsOffcanvas = bootstrap.Offcanvas.getInstance(this.cartOffcanvas);
                    if (bsOffcanvas) bsOffcanvas.hide();
                });
            }
        });
    }

    /**
      Guarda el carrito en localStorage
     */
    saveToLocalStorage() {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEYS.CART, JSON.stringify(this.items));
        } catch (error) {
            console.error('Error al guardar carrito:', error);
        }
    }

    /**
     * Carga el carrito desde localStorage
     */
    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.CART);
            if (saved) {
                this.items = JSON.parse(saved);
                this.render();
                this.updateBadge();
            }
        } catch (error) {
            console.error('Error al cargar carrito:', error);
            this.items = [];
        }
    }
}

// Hacer ShoppingCart disponible globalmente
window.ShoppingCart = ShoppingCart;
