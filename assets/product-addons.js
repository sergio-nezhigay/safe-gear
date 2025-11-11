class ProductAddons {
    constructor() {
      this.cart = {
        mainProduct: null,
        addons: new Map(),
        total: 0
      };
      
      this.isMainProductInCart = false;
      this._fetchingVariant = false;
      this._processingVariantUpdate = false;
      
      this.selectors = {
        section: '.product-addons-section',
        addonCard: '.addon-card',
        addonAddBtn: '.addon-add-btn',
        addonCheckbox: '.addon-checkbox',
        addonCheckboxWrapper: '.addon-checkbox-wrapper',
        quantityControls: '.addon-quantity-controls',
        quantityInput: '.addon-quantity-input',
        quantityMinus: '.quantity-minus',
        quantityPlus: '.quantity-plus',
        stickyCart: '#sticky-cart',
        cartTotal: '#cart-total',
        cartAddonsList: '#cart-addons-list',
        mainAddToCartBtn: '#main-add-to-cart',
        clearAddonsBtn: '#clear-addons',
        cartLoading: '#cart-loading'
      };
      
      this.productData = null;
      this.addonProductsData = new Map();
      this._variantPoll = null;
      this._lastVariantId = null;
      this._requestQueue = [];
      this._isProcessing = false;
      this._debounceTimers = new Map();
      
      this.throttledUpdateCart = this.throttle(this.updateCartDisplay.bind(this), 100);
      
      this.init();
    }
  
    init() {
      this.initializeMainProduct();
      this.bindEvents();
      this.preloadProductData();
      this.observeVariantChanges();
      this.updateCartDisplay();
      this.updateCheckboxStates();
      this.setupStickyCart();
    }
  
    initializeMainProduct() {
      const section = document.querySelector(this.selectors.section);
      if (!section) return;
  
      const productId = section.dataset.productId;
      const mainProductData = this.getMainProductData();
      
      if (mainProductData) {
        this.cart.mainProduct = mainProductData;
        this.cart.total = mainProductData.price;
      }
    }
  
    getMainProductData() {
      const section = document.querySelector(this.selectors.section);
      const priceElement = section?.querySelector('.cart-product-price[data-price]');
      const datasetVariantId = section?.dataset.selectedVariantId;
      const datasetPrice = section?.dataset.selectedVariantPrice;
  
      if (datasetVariantId) {
        return {
          variantId: datasetVariantId,
          productId: section?.dataset.productId,
          price: parseInt(datasetPrice || priceElement?.dataset.price) || 0,
          title: document.querySelector('.product-title, .collection-header__title')?.textContent?.trim() || section?.querySelector('.cart-product-title')?.textContent?.trim(),
          inCart: this.isProductInCart(datasetVariantId)
        };
      }
  
      const productForm = document.querySelector('form[action*="/cart/add"]');
      const variantIdInput = productForm?.querySelector('[name="id"]');
  
      if (variantIdInput && priceElement) {
        return {
          variantId: variantIdInput.value,
          productId: section?.dataset.productId,
          price: parseInt(priceElement.dataset.price) || 0,
          title: document.querySelector('.product-title, .collection-header__title')?.textContent?.trim(),
          inCart: this.isProductInCart(variantIdInput.value)
        };
      }
      
      const cartProduct = document.querySelector('.cart-main-product');
      if (cartProduct) {
        const priceEl = cartProduct.querySelector('[data-price]');
        const titleElement = cartProduct.querySelector('.cart-product-title');
        const mainBtn = document.querySelector(this.selectors.mainAddToCartBtn);
        
        return {
          variantId: mainBtn?.dataset.variantId,
          productId: mainBtn?.dataset.productId,
          price: parseInt(priceEl?.dataset.price) || 0,
          title: titleElement?.textContent?.trim(),
          inCart: false
        };
      }
      
      return null;
    }
  
    bindEvents() {
      document.addEventListener('click', (e) => {
        if (e.target.matches(this.selectors.addonAddBtn) || e.target.closest(this.selectors.addonAddBtn)) {
          e.preventDefault();
          this.handleAddonToggle(e.target.closest(this.selectors.addonAddBtn));
        }
        
        if (e.target.matches(this.selectors.quantityMinus)) {
          e.preventDefault();
          this.handleQuantityChange(e.target, 'minus');
        }
        
        if (e.target.matches(this.selectors.quantityPlus)) {
          e.preventDefault();
          this.handleQuantityChange(e.target, 'plus');
        }
      });
  
      document.addEventListener('change', (e) => {
        if (e.target.matches(this.selectors.addonCheckbox)) {
          e.preventDefault();
          this.handleAddonCheckboxChange(e.target);
        }
        
        if (e.target.matches(this.selectors.quantityInput)) {
          this.handleQuantityInputChange(e.target);
        }
      });
  
      const mainBtn = document.querySelector(this.selectors.mainAddToCartBtn);
      if (mainBtn) {
        mainBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.handleMainProductAction();
        });
      }
  
      const clearBtn = document.querySelector(this.selectors.clearAddonsBtn);
      if (clearBtn) {
        clearBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.clearAllAddons();
        });
      }
  
      document.addEventListener('cart:updated', (e) => {
        this.handleCartUpdate(e.detail);
      });
  
      document.addEventListener('addons:reinit', (e) => {
        this.reinitializeAfterProductSwitch();
      });
    }
  
async handleAddonCheckboxChange(checkbox) {
  if (!checkbox) return;

  const wrapper = checkbox.closest(this.selectors.addonCheckboxWrapper);
  const card = checkbox.closest(this.selectors.addonCard);
  
  if (!wrapper || !card) return;

  const productId = card.dataset.productId;
  const productHandle = card.dataset.productHandle;
  let variantId = wrapper.dataset.variantId;
  const productTitle = wrapper.dataset.productTitle;
  let productPrice = parseInt(wrapper.dataset.productPrice) || 0;

  const bestVariant = await this.findBestVariant(productId, productHandle);
  if (bestVariant) {
    variantId = bestVariant.id;
    productPrice = bestVariant.price;
    wrapper.dataset.variantId = variantId;
    wrapper.dataset.productPrice = productPrice;
    card.dataset.variantId = variantId;
    card.dataset.price = productPrice;
    const priceElement = card.querySelector('.addon-current-price');
    if (priceElement) {
      priceElement.textContent = this.formatMoney(productPrice);
    }
    const addPriceElement = card.querySelector('.addon-add-price');
    if (addPriceElement) {
      addPriceElement.textContent = '+ ' + this.formatMoney(productPrice);
    }
  }

  const isCurrentlyInCart = this.cart.addons.has(variantId);
  
  if (checkbox.checked && !isCurrentlyInCart) {
    wrapper.classList.add('checked');
    card.classList.add('added');
    

    // const quantityControls = card.querySelector(this.selectors.quantityControls);
    // if (quantityControls) {
    //   quantityControls.style.display = 'flex';
    // }
    
    if (this.isMainProductInCart) {
      await this.addAddonDirectlyToCart(variantId, productTitle, productPrice, card, wrapper);
    } else {
      this.addAddonToLocalCart(variantId, productTitle, productPrice, card, wrapper);
    }
  } else if (checkbox.checked && isCurrentlyInCart) {
  
    // const quantityControls = card.querySelector(this.selectors.quantityControls);
    // if (quantityControls) {
    //   quantityControls.style.display = 'flex';
    // }
    
    if (this.isMainProductInCart) {
      await this.addAddonDirectlyToCart(variantId, productTitle, productPrice, card, wrapper);
    } else {
      this.addAddonToLocalCart(variantId, productTitle, productPrice, card, wrapper);
    }
  } else if (!checkbox.checked && isCurrentlyInCart) {

    // const quantityControls = card.querySelector(this.selectors.quantityControls);
    // if (quantityControls) {
    //   quantityControls.style.display = 'none';
    // }
    
    if (this.isMainProductInCart) {
      await this.removeAddonDirectlyFromCart(variantId, card, wrapper);
    } else {
      this.removeAddonFromLocalCart(variantId, card, wrapper);
    }
  }
}

    handleQuantityChange(button, action) {
      const variantId = button.dataset.variantId;
      const card = button.closest(this.selectors.addonCard);
      const quantityInput = card.querySelector(this.selectors.quantityInput);

      if (!quantityInput) return;

      // Skip quantity changes for yes/no addons
      const addonType = card.dataset.addonType || 'quantity';
      if (addonType === 'yes_no') return;

      let currentQuantity = parseInt(quantityInput.value) || 1;
      const min = parseInt(quantityInput.getAttribute('min')) || 1;
      const max = parseInt(quantityInput.getAttribute('max')) || 10;

      if (action === 'plus' && currentQuantity < max) {
        currentQuantity++;
      } else if (action === 'minus' && currentQuantity > min) {
        currentQuantity--;
      }

      quantityInput.value = currentQuantity;
      this.updateAddonQuantity(variantId, currentQuantity, card);

      // Update button states
      const minusBtn = card.querySelector(this.selectors.quantityMinus);
      const plusBtn = card.querySelector(this.selectors.quantityPlus);

      if (minusBtn) minusBtn.disabled = currentQuantity <= min;
      if (plusBtn) plusBtn.disabled = currentQuantity >= max;
    }

    handleQuantityInputChange(input) {
      const variantId = input.dataset.variantId;
      const card = input.closest(this.selectors.addonCard);

      // Skip quantity changes for yes/no addons
      const addonType = card.dataset.addonType || 'quantity';
      if (addonType === 'yes_no') return;

      const min = parseInt(input.getAttribute('min')) || 1;
      const max = parseInt(input.getAttribute('max')) || 10;

      let quantity = parseInt(input.value) || min;

      // Ensure quantity is within bounds
      if (quantity < min) quantity = min;
      if (quantity > max) quantity = max;

      input.value = quantity;
      this.updateAddonQuantity(variantId, quantity, card);

      // Update button states
      const minusBtn = card.querySelector(this.selectors.quantityMinus);
      const plusBtn = card.querySelector(this.selectors.quantityPlus);

      if (minusBtn) minusBtn.disabled = quantity <= min;
      if (plusBtn) plusBtn.disabled = quantity >= max;
    }

    updateAddonQuantity(variantId, quantity, card) {
      if (!this.cart.addons.has(variantId)) return;
      
      const addon = this.cart.addons.get(variantId);
      addon.quantity = quantity;
      
      this.throttledUpdateCart();
      this.updateCheckboxStates();
      this.updateAddonsConfiguration();
    }
  
    async handleAddonToggle(button) {
      if (!button || button.disabled) return;
  
      const card = button.closest(this.selectors.addonCard);
      const productId = card.dataset.productId;
      const productHandle = card.dataset.productHandle;
      let variantId = button.dataset.variantId;
      const productTitle = button.dataset.productTitle;
      let productPrice = parseInt(button.dataset.productPrice) || 0;
  
      const bestVariant = await this.findBestVariant(productId, productHandle);
      if (bestVariant) {
        variantId = bestVariant.id;
        productPrice = bestVariant.price;
        button.dataset.variantId = variantId;
        button.dataset.productPrice = productPrice;
        card.dataset.variantId = variantId;
        card.dataset.price = productPrice;
        const priceElement = card.querySelector('.addon-current-price');
        if (priceElement) {
          priceElement.textContent = this.formatMoney(productPrice);
        }
        const addPriceElement = card.querySelector('.addon-add-price');
        if (addPriceElement) {
          addPriceElement.textContent = '+ ' + this.formatMoney(productPrice);
        }
      }
  
      const isAdded = card.classList.contains('added');
  
      if (isAdded) {
        await this.removeAddonFromCart(variantId, card, button);
      } else {
        await this.addAddonToCart(variantId, productTitle, productPrice, card, button);
      }
    }
  
    addAddonToLocalCart(variantId, title, price, card, element) {
      if (!variantId || !title || !card || !element) {
        return;
      }

      const imageEl = card.querySelector('.addon-image img');
      const image = imageEl ? imageEl.src : null;

      // Get quantity from input, default to 1
      // For yes/no addons, always use quantity 1
      const addonType = card.dataset.addonType || 'quantity';
      const quantityInput = card.querySelector(this.selectors.quantityInput);
      const quantity = addonType === 'yes_no' ? 1 : (quantityInput ? parseInt(quantityInput.value) || 1 : 1);

      if (this.cart.addons.has(variantId)) {
        const existing = this.cart.addons.get(variantId);
        existing.quantity = quantity;
      } else {
        this.cart.addons.set(variantId, {
          variantId,
          title,
          price,
          quantity: quantity,
          image
        });
      }
  
      card.classList.add('added');
      element.classList.add('checked');
      const checkbox = element.querySelector(this.selectors.addonCheckbox);
      if (checkbox) {
        checkbox.checked = true;
      }
  
      this.throttledUpdateCart();
      this.updateCheckboxStates();
      this.updateAddonsConfiguration();
      this.showNotification(`${title} додано до вибраних`, 'success');
    }
  
    async fetchWithRetry(url, options, maxRetries = 3) {
      let lastError;
      
      for (let i = 0; i < maxRetries; i++) {
        try {
          const response = await fetch(url, options);
          return response;
        } catch (error) {
          lastError = error;
          if (i < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
          }
        }
      }
      
      throw lastError;
    }
  
    removeAddonFromLocalCart(variantId, card, element) {
      if (!variantId || !card || !element) {
        return;
      }
  
      const addon = this.cart.addons.get(variantId);
      this.cart.addons.delete(variantId);
  
      card.classList.remove('added');
      element.classList.remove('checked');
      const checkbox = element.querySelector(this.selectors.addonCheckbox);
      if (checkbox) checkbox.checked = false;
  
      this.throttledUpdateCart();
      this.updateCheckboxStates();
      this.updateAddonsConfiguration();
      
      if (addon) {
        this.showNotification(`${addon.title} видалено з вибраних`, 'info');
      }
    }
  
    async addAddonDirectlyToCart(variantId, title, price, card, element) {
      if (!variantId || !title || !card || !element) return;
  
      try {
        this.showLoading(true);
        
        // Отримуємо поточну конфігурацію з кошика
        const cartResponse = await fetch('/cart.js');
        const cart = await cartResponse.json();
        
        // Знаходимо головний продукт в кошику
        const mainProductItem = cart.items.find(item => 
          item.variant_id.toString() === this.cart.mainProduct.variantId.toString()
        );
        
        if (!mainProductItem) {
          this.showNotification('Main product not found in cart', 'error');
          return;
        }

        // Get quantity from input, default to 1
        // For yes/no addons, always use quantity 1
        const addonType = card.dataset.addonType || 'quantity';
        const quantityInput = card.querySelector(this.selectors.quantityInput);
        const quantity = addonType === 'yes_no' ? 1 : (quantityInput ? parseInt(quantityInput.value) || 1 : 1);

        // Додаємо addon без parent_id (додамо після)
        const addResponse = await fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: variantId,
            quantity: quantity
          })
        });
  
        if (!addResponse.ok) {
          const errorData = await addResponse.json().catch(() => ({}));
          throw new Error(errorData.description || 'Failed to add addon to cart');
        }
  
        // Оновлюємо line property головного продукту
        await this.updateMainProductLineProperty();
  
        const imageEl = card.querySelector('.addon-image img');
        const image = imageEl ? imageEl.src : null;
  
        if (this.cart.addons.has(variantId)) {
          const existing = this.cart.addons.get(variantId);
          existing.quantity = quantity;
        } else {
          this.cart.addons.set(variantId, {
            variantId,
            title,
            price,
            quantity: quantity,
            image
          });
        }
  
        this.throttledUpdateCart();
        this.updateCheckboxStates();
        this.updateAddonsConfiguration();
        this.showNotification(`${title} додано до кошика`, 'success');
  
        await this.refreshThemeCartUI();
  
      } catch (error) {
        this.showNotification(error.message || 'Failed to add addon', 'error');
        
        card.classList.remove('added');
        element.classList.remove('checked');
        const checkbox = element.querySelector(this.selectors.addonCheckbox);
        if (checkbox) checkbox.checked = false;
      } finally {
        this.showLoading(false);
      }
    }
  
    async removeAddonDirectlyFromCart(variantId, card, element) {
      if (!variantId || !card || !element) return;
  
      try {
        this.showLoading(true);
  
        const response = await fetch('/cart/change.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: variantId,
            quantity: 0
          })
        });
  
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.description || 'Failed to remove addon from cart');
        }
  
        // Оновлюємо line property головного продукту
        await this.updateMainProductLineProperty();
  
        const addon = this.cart.addons.get(variantId);
        this.cart.addons.delete(variantId);
  
        card.classList.remove('added');
        element.classList.remove('checked');
        const checkbox = element.querySelector(this.selectors.addonCheckbox);
        if (checkbox) checkbox.checked = false;
  
        this.throttledUpdateCart();
        this.updateCheckboxStates();
        this.updateAddonsConfiguration();
        
        if (addon) {
          this.showNotification(`${addon.title} видалено з кошика`, 'info');
        }
  
        await this.refreshThemeCartUI();
  
      } catch (error) {
        this.showNotification(error.message || 'Failed to remove addon', 'error');
        
        card.classList.add('added');
        element.classList.add('checked');
        const checkbox = element.querySelector(this.selectors.addonCheckbox);
        if (checkbox) checkbox.checked = true;
      } finally {
        this.showLoading(false);
      }
    }
  
    async updateMainProductLineProperty() {
      try {
        this.updateAddonsConfiguration();
        const configInput = document.querySelector('#selected_addons_config');
        const configValue = configInput ? configInput.value : '';
  
        const response = await fetch('/cart/change.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: this.cart.mainProduct.variantId,
            quantity: 1,
            properties: {
              'Additional Items': configValue
            }
          })
        });
  
        if (!response.ok) {
          throw new Error('Failed to update main product properties');
        }
      } catch (error) {
        // Silent error handling
      }
    }
  
    async handleMainProductAction() {
      const mainBtn = document.querySelector(this.selectors.mainAddToCartBtn);
      if (!mainBtn || !this.cart.mainProduct) return;
  
      if (mainBtn.classList.contains('in-cart')) {
        window.location.href = '/checkout';
      } else {
        await this.addMainProductToCart();
      }
    }
  
    async addMainProductToCart() {
      const mainBtn = document.querySelector(this.selectors.mainAddToCartBtn);
      if (!mainBtn || !this.cart.mainProduct) return;
  
      try {
        this.showLoading(true);
  
        // Оновлюємо конфігурацію addons перед додаванням
        this.updateAddonsConfiguration();
        
        const configInput = document.querySelector('#selected_addons_config');
        const configValue = configInput ? configInput.value : '';
        const parentVariantId = this.cart.mainProduct.variantId;
  
        // Формуємо масив items: головний товар + всі вибрані аддони
        const items = [];
  
        // Головний товар з line item property "Additional Items"
        items.push({
          id: parentVariantId,
          quantity: 1,
          properties: {
            'Additional Items': configValue
          }
        });
  
        // Додаємо всі вибрані аддони як дочірні елементи
        for (const addon of this.cart.addons.values()) {
          items.push({
            id: addon.variantId,
            quantity: addon.quantity,
            parent_id: parentVariantId   // зв'язок "батько–дитина"
          });
        }
  
        // Єдиний запит до /cart/add.js
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ items })
        });
  
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.description || 'Failed to add products to cart');
        }
  
        this.cart.mainProduct.inCart = true;
        this.isMainProductInCart = true;
  
        mainBtn.classList.add('in-cart');
        mainBtn.querySelector('.btn-text-add').style.display = 'none';
        mainBtn.querySelector('.btn-text-checkout').style.display = 'inline';
  
        this.showNotification(`${this.cart.mainProduct.title} та аддони додано до кошика`, 'success');
  
        await this.refreshThemeCartUI();
        await this.openCartDrawer();
  
        if (this.cart.addons.size > 0) {
          const clearBtn = document.querySelector(this.selectors.clearAddonsBtn);
          if (clearBtn) clearBtn.style.display = 'block';
        }
  
      } catch (error) {
        this.showNotification(error.message || 'Failed to add products', 'error');
      } finally {
        this.showLoading(false);
      }
    }
  
    clearAllAddons() {
      if (this.cart.addons.size === 0) return;
  
      document.querySelectorAll(this.selectors.addonCard).forEach(card => {
        card.classList.remove('added');
        
        const wrapper = card.querySelector(this.selectors.addonCheckboxWrapper);
        if (wrapper) {
          wrapper.classList.remove('checked');
          const checkbox = wrapper.querySelector(this.selectors.addonCheckbox);
          if (checkbox) checkbox.checked = false;
        }
      });
  
      this.cart.addons.clear();
      this.throttledUpdateCart();
      this.updateCheckboxStates();
      this.updateAddonsConfiguration();
  
      const clearBtn = document.querySelector(this.selectors.clearAddonsBtn);
      if (clearBtn) clearBtn.style.display = 'none';
  
      this.showNotification('Всі аддони видалені з вибраних', 'info');
    }
  
    updateCartDisplay() {
      this.updateCartTotal();
      this.updateAddonsList();
      this.updateClearButtonVisibility();
    }
  
    throttle(func, limit) {
      let inThrottle;
      return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
          func.apply(context, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      }
    }
  
    debounce(func, wait, immediate) {
      return function() {
        const context = this;
        const args = arguments;
        const later = function() {
          if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !this._debounceTimers.get(func);
        clearTimeout(this._debounceTimers.get(func));
        this._debounceTimers.set(func, setTimeout(later, wait));
        if (callNow) func.apply(context, args);
      };
    }
  
    async processRequestQueue() {
      if (this._isProcessing || this._requestQueue.length === 0) return;
      
      this._isProcessing = true;
      
      while (this._requestQueue.length > 0) {
        const request = this._requestQueue.shift();
        try {
          await request();
        } catch (error) {
          console.error('Request queue error:', error);
        }
      }
      
      this._isProcessing = false;
    }
  
    queueRequest(requestFunction) {
      this._requestQueue.push(requestFunction);
      this.processRequestQueue();
    }
  
    updateCartTotal() {
      const totalElement = document.querySelector(this.selectors.cartTotal);
      if (!totalElement) return;
  
      let total = this.cart.mainProduct?.price || 0;
      
      this.cart.addons.forEach(addon => {
        total += addon.price * addon.quantity;
      });
  
      this.cart.total = total;
      totalElement.textContent = this.formatMoney(total);
    }
  
    updateAddonsList() {
      const addonsListElement = document.querySelector(this.selectors.cartAddonsList);
      if (!addonsListElement) return;
  
      if (this.cart.addons.size === 0) {
        addonsListElement.innerHTML = '';
        return;
      }
  
      const addonsHTML = Array.from(this.cart.addons.values()).map(addon => `
        <div class="cart-addon-item" data-variant-id="${addon.variantId}">
          <div class="cart-addon-image">
            ${addon.image ? '<img src="' + this.escapeHtml(addon.image) + '" alt="' + this.escapeHtml(addon.title) + '">' : '<div class="cart-product-placeholder"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg></div>'}
          </div>
          <div class="cart-addon-info">
            <div class="cart-addon-title">${this.escapeHtml(addon.title)} ${addon.quantity > 1 ? `(x${addon.quantity})` : ''}</div>
            <div class="cart-addon-price">${this.formatMoney(addon.price)}</div>
          </div>
          <button type="button" class="cart-addon-remove" data-variant-id="${addon.variantId}">
            Remove
          </button>
        </div>
      `).join('');
  
      addonsListElement.innerHTML = addonsHTML;
  
      addonsListElement.querySelectorAll('.cart-addon-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const variantId = e.target.dataset.variantId;
          const card = document.querySelector(`[data-variant-id="${variantId}"]`);
          
          const wrapper = card?.querySelector(this.selectors.addonCheckboxWrapper);
          
          if (wrapper) {
            this.removeAddonFromLocalCart(variantId, card, wrapper);
          }
        });
      });
    }
  
    updateClearButtonVisibility() {
      const clearBtn = document.querySelector(this.selectors.clearAddonsBtn);
      if (clearBtn) {
        clearBtn.style.display = this.cart.addons.size > 0 ? 'block' : 'none';
      }
    }
  
  updateCheckboxStates() {
  document.querySelectorAll(this.selectors.addonCard).forEach(card => {
    const variantId = card.dataset.variantId;
    const wrapper = card.querySelector(this.selectors.addonCheckboxWrapper);
    
    if (wrapper && variantId) {
      const isInCart = this.cart.addons.has(variantId);
      const quantityControls = card.querySelector(this.selectors.quantityControls);
      const quantityInput = card.querySelector(this.selectors.quantityInput);
      
      if (isInCart) {
        card.classList.add('added');
        wrapper.classList.add('checked');
        const checkbox = wrapper.querySelector(this.selectors.addonCheckbox);
        if (checkbox && !checkbox.checked) {
          checkbox.checked = true;
        }
        
        
        // if (quantityControls) {
        //   quantityControls.style.display = 'flex';
        // }
        
        if (quantityInput) {
          const addon = this.cart.addons.get(variantId);
          quantityInput.value = addon ? addon.quantity : 1;
          
          // Update button states
          const minusBtn = card.querySelector(this.selectors.quantityMinus);
          const plusBtn = card.querySelector(this.selectors.quantityPlus);
          const min = parseInt(quantityInput.getAttribute('min')) || 1;
          const max = parseInt(quantityInput.getAttribute('max')) || 10;
          const currentQuantity = parseInt(quantityInput.value) || 1;
          
          if (minusBtn) minusBtn.disabled = currentQuantity <= min;
          if (plusBtn) plusBtn.disabled = currentQuantity >= max;
        }
      } else {
        card.classList.remove('added');
        wrapper.classList.remove('checked');
        const checkbox = wrapper.querySelector(this.selectors.addonCheckbox);
        if (checkbox && checkbox.checked) {
          checkbox.checked = false;
        }
        
   
        // if (quantityControls) {
        //   quantityControls.style.display = 'none';
        // }
      }
    }
  });
}
  
    showLoading(show) {
      const loadingElement = document.querySelector(this.selectors.cartLoading);
      if (loadingElement) {
        loadingElement.style.display = show ? 'flex' : 'none';
      }
    }
  
    updateAddonsConfiguration() {
      const configInput = document.querySelector('#selected_addons_config');
      if (!configInput) return;
  
      if (this.cart.addons.size === 0) {
        configInput.value = '';
        return;
      }
  
      // Створюємо зрозумілий текст для людей
      const addonNames = Array.from(this.cart.addons.values()).map(addon => {
        const price = this.formatMoney(addon.price);
        return addon.quantity > 1 
          ? `${addon.title} (x${addon.quantity}) - ${price}` 
          : `${addon.title} - ${price}`;
      });
  
      const totalAddonsPrice = Array.from(this.cart.addons.values())
        .reduce((sum, addon) => sum + (addon.price * addon.quantity), 0);
  
      const readableConfig = `Selected add-ons: ${addonNames.join(', ')}. Total add-ons cost: ${this.formatMoney(totalAddonsPrice)}`;
  
      configInput.value = readableConfig;
    }
  
    reinitializeAfterProductSwitch() {
      // Очищуємо поточний стан
      this.cart.addons.clear();
      this.cart.mainProduct = null;
      this.cart.total = 0;
      
      // Очищуємо кеші
      this.addonProductsData.clear();
      this.productData = null;
      
      // Переініціалізуємо основний продукт
      this.initializeMainProduct();
      
      // Переініціалізуємо дані продуктів
      this.preloadProductData();
      
      // Оновлюємо дисплей
      this.updateCartDisplay();
      this.updateCheckboxStates();
      this.updateAddonsConfiguration();
      
      // Налаштовуємо sticky cart знову
      this.setupStickyCart();
      
    }
  
    showNotification(message, type = 'info') {
      // Silent notifications
    }
  
    isProductInCart(variantId) {
      return false;
    }
  
    formatMoney(cents) {
      const section = document.querySelector(this.selectors.section);
      const format = section?.dataset.moneyFormat;
      if (window.Shopify && typeof window.Shopify.formatMoney === 'function') {
        try {
          return window.Shopify.formatMoney(cents, format);
        } catch (e) {}
      }
      const currency = section?.dataset.shopCurrency || window.Shopify?.currency?.active || 'USD';
      const amount = (cents || 0) / 100;
      try {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
      } catch (e) {
        return `${amount.toFixed(2)} ${currency}`;
      }
    }
  
    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  
    handleCartUpdate(detail) {
      // Handle cart updates
    }
  
    async refreshThemeCartUI() {
      try {
        const res = await this.fetchWithRetry('/cart.js', { 
          headers: { 'Accept': 'application/json' } 
        }, 2);
        
        if (!res.ok) throw new Error('cart.js fetch failed');
        const cart = await res.json();
  
        this.updateCartBadge(cart?.item_count || 0);
        this.updateCartSubtotal(cart);
        
        await this.triggerHorizonCartUpdate(cart);
  
        const sectionIds = this.collectCartSectionIds();
        if (sectionIds.length) {
          await this.refreshSectionsByIds(sectionIds);
        }
  
        await this.refreshCartDrawerContent();
  
        const events = [
          'cart:refresh',
          'cart:change',
          'cart:changed',
          'cart:update',
          'theme:cart:change',
          'ajaxProduct:added',
          'cart:updated',
          'horizon:cart:updated',
          'cart-drawer:refresh'
        ];
        events.forEach(name => {
          document.dispatchEvent(new CustomEvent(name, { detail: { source: 'addons', cart } }));
        });
  
        if (window.Horizon && typeof window.Horizon.refreshCart === 'function') {
          window.Horizon.refreshCart(cart);
        } else if (window.theme && window.theme.cart && typeof window.theme.cart.update === 'function') {
          window.theme.cart.update(cart);
        }
      } catch (e) {
        ['cart:refresh', 'cart:change', 'cart:updated'].forEach(name => {
          document.dispatchEvent(new CustomEvent(name, { detail: { source: 'addons' } }));
        });
      }
    }
  
    async triggerHorizonCartUpdate(cart) {
      try {
        const { CartUpdateEvent } = await import('@theme/events');
        
        if (CartUpdateEvent) {
          const event = new CartUpdateEvent(cart, 'manual-trigger', {
            itemCount: cart.item_count,
            source: 'addons-refresh'
          });
          
          document.dispatchEvent(event);
          return true;
        }
      } catch (error) {
        
        try {
          const cartDrawer = document.querySelector('cart-drawer-component');
          if (cartDrawer) {
            if (typeof cartDrawer.refreshCart === 'function') {
              cartDrawer.refreshCart(cart);
            } else if (cartDrawer.hasAttribute('auto-open')) {
              cartDrawer.open?.();
            }
          }
        } catch (e2) {
          console.warn('[addons] Fallback cart refresh failed:', e2);
        }
      }
      
      return false;
    }
    
    observeVariantInputMutation(input) {
      if (!input) return;
      try {
        const mo = new MutationObserver(() => {
          const val = input.value;
          if (val && val !== this._lastVariantId) {
            this.handleVariantUpdate(String(val));
          }
        });
        mo.observe(input, { attributes: true, attributeFilter: ['value'] });
      } catch (e) {
      }
    }
  
    getCurrentVariantId() {
      const el = document.querySelector('input[name="id"]');
      return el?.value || null;
    }
  
    collectCartSectionIds() {
      const ids = new Set();
      const candidates = Array.from(document.querySelectorAll('[id^="shopify-section-"]'));
      candidates.forEach(el => {
        const id = el.id?.replace('shopify-section-', '');
        const type = el.dataset?.sectionType || '';
        const text = `${el.id} ${el.className} ${type}`.toLowerCase();
        if (!id) return;
        if (
          text.includes('cart') ||
          text.includes('drawer') ||
          el.matches('#CartDrawer, .cart-drawer, [data-cart-drawer], [data-cart-drawer-container]') ||
          el.querySelector('cart-drawer-component')
        ) {
          ids.add(id);
        } else if (text.includes('header')) {
          ids.add(id);
        }
      });
      return Array.from(ids);
    }
  
    async refreshSectionsByIds(sectionIds) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('sections', sectionIds.join(','));
        const res = await fetch(url.toString(), { headers: { 'Accept': 'application/json' } });
        if (!res.ok) return;
        const htmlById = await res.json();
        Object.keys(htmlById || {}).forEach(id => {
          const html = htmlById[id];
          const container = document.getElementById(`shopify-section-${id}`);
          if (container && typeof html === 'string') {
            container.outerHTML = html;
          }
        });
      } catch (e) {
      }
    }
  
    async refreshCartDrawerContent() {
      try {
        const cartResponse = await fetch('/cart.js');
        if (!cartResponse.ok) return;
        const cartData = await cartResponse.json();
  
        const cartDrawer = document.querySelector('cart-drawer-component');
        if (cartDrawer) {
          const cartItemsComponent = cartDrawer.querySelector('cart-items-component');
          if (cartItemsComponent) {
            const sectionId = cartItemsComponent.dataset.sectionId;
            if (sectionId) {
              const url = new URL(window.location.href);
              url.searchParams.set('sections', sectionId);
              const res = await fetch(url.toString(), { headers: { 'Accept': 'application/json' } });
              if (res.ok) {
                const sections = await res.json();
                const sectionHtml = sections[sectionId];
                if (sectionHtml) {
                  const tempDiv = document.createElement('div');
                  tempDiv.innerHTML = sectionHtml;
                  const newCartItems = tempDiv.querySelector('cart-items-component');
                  if (newCartItems) {
                    cartItemsComponent.outerHTML = newCartItems.outerHTML;
                  }
                }
              }
            }
          }
        }
  
        if (!cartDrawer) {
          try {
            const cartPageResponse = await fetch('/cart?view=drawer');
            if (cartPageResponse.ok) {
              const cartPageHtml = await cartPageResponse.text();
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = cartPageHtml;
              const drawerFromPage = tempDiv.querySelector('cart-drawer-component');
              if (drawerFromPage) {
                const existingDrawer = document.querySelector('cart-drawer-component');
                if (existingDrawer) {
                  existingDrawer.outerHTML = drawerFromPage.outerHTML;
                }
              }
            }
          } catch (e2) {
            console.warn('Alternative cart refresh failed:', e2);
          }
        }
  
        this.updateCartBadge(cartData.item_count || 0);
        this.updateCartSubtotal(cartData);
        
      } catch (e) {
        console.warn('Failed to refresh cart drawer content:', e);
      }
    }
  
    async openCartDrawer() {
      try {
        const cartRes = await fetch('/cart.js');
        if (cartRes.ok) {
          const cart = await cartRes.json();
          await this.triggerHorizonCartUpdate(cart);
        }
        
        ['cart:open','open:cart','cart-drawer:open','theme:cart:open','drawer:open','horizon:cart:open'].forEach(name => {
          document.dispatchEvent(new CustomEvent(name, { detail: { source: 'addons' } }));
        });
        
        const cartDrawer = document.querySelector('cart-drawer-component');
        if (cartDrawer) {
          if (cartDrawer.hasAttribute('auto-open')) {
            try {
              const { CartUpdateEvent } = await import('@theme/events');
              const cartData = await fetch('/cart.js').then(r => r.json());
              
              const event = new CartUpdateEvent(cartData, 'manual-trigger', {
                itemCount: cartData.item_count,
                source: 'addons-open'
              });
              
              document.dispatchEvent(event);
              return;
            } catch (e) {
              // Fallback handling
            }
          }
          
          if (typeof cartDrawer.open === 'function') {
            cartDrawer.open();
            return;
          }
        }
        
        if (window.Horizon?.cart?.open) {
          window.Horizon.cart.open();
          return;
        }
        if (window.Horizon?.openCartDrawer) {
          window.Horizon.openCartDrawer();
          return;
        }
        
        if (window.theme?.cart?.open) {
          window.theme.cart.open();
          return;
        }
        
        const toggleSelectors = [
          '[data-cart-toggle]',
          '[data-cart-drawer-toggle]', 
          '.js-cart-toggle',
          '.header__icon--cart [aria-controls]',
          '[aria-controls="CartDrawer"]',
          '.header__cart-icon',
          '.site-header__cart',
          '.cart-link'
        ];
        
        for (const selector of toggleSelectors) {
          const toggle = document.querySelector(selector);
          if (toggle) {
            toggle.dispatchEvent(new Event('click', { bubbles: true }));
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to open cart drawer:', e);
      }
    }
    
    updateCartSubtotal(cart) {
      const total = cart?.total_price || 0;
      const formatted = this.formatMoney(total);
      const selectors = [
        '[data-cart-subtotal]',
        '.cart-drawer__subtotal',
        '.js-cart-subtotal',
        '.header-cart__subtotal',
        '.minicart__subtotal',
        '.cart-subtotal'
      ];
      selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => el.textContent = formatted);
      });
    }
  
    updateCartBadge(count) {
      const selectors = [
        '[data-cart-count]',
        '.cart-count-bubble',
        '.header__icon--cart .cart-count',
        '.site-header__cart-count',
        '.h-cart-count',
        '.header-cart__count',
        '.cart-count',
        '.cart-count__value',
        '.header__cart-icon-bubble',
        '.header-cart__count-bubble',
        '.cart-link__bubble',
        '.cart-count-number',
        '.h-cart__count'
      ];
      const els = selectors.flatMap(sel => Array.from(document.querySelectorAll(sel)));
      els.forEach(el => {
        if ('value' in el) {
          el.value = count;
        }
        el.textContent = String(count);
        if (count > 0) {
          el.classList.add('is-not-empty');
          el.removeAttribute('hidden');
          el.style.display = '';
        } else {
          el.classList.remove('is-not-empty');
          if (el.classList.contains('cart-count-bubble')) {
            el.setAttribute('hidden', 'hidden');
          }
        }
      });
    }
  
    preloadProductData() {
      const section = document.querySelector(this.selectors.section);
      const handle = section?.dataset.productHandle;
      if (!handle) return;
      
      this.fetchWithRetry(`/products/${handle}.js`, {}, 2)
        .then(res => res.ok ? res.json() : null)
        .then(json => {
          if (json) {
            this.productData = json;
          }
        })
        .catch(() => {});
  
      const addonCards = document.querySelectorAll(this.selectors.addonCard);
      addonCards.forEach(card => {
        const productHandle = card.dataset.productHandle;
        const productId = card.dataset.productId;
        if (productHandle && productId && !this.addonProductsData.has(productId)) {
          this.fetchWithRetry(`/products/${productHandle}.js`, {}, 2)
            .then(res => res.ok ? res.json() : null)
            .then(json => {
              if (json) {
                this.addonProductsData.set(productId, json);
              }
            })
            .catch(() => {});
        }
      });
    }
  
    observeVariantChanges() {
      const productForm = document.querySelector('form[action*="/cart/add"]');
      const section = document.querySelector(this.selectors.section);
      const variantIdInput = productForm?.querySelector('[name="id"]');
      const initialVariantId = section?.dataset.selectedVariantId || variantIdInput?.value;
  
      if (initialVariantId) {
        this._lastVariantId = String(initialVariantId);
      }
  
      const hiddenVariantInputs = Array.from(document.querySelectorAll('input[name="id"]'));
      hiddenVariantInputs.forEach((inp) => this.observeVariantInputMutation(inp));
  
      document.querySelectorAll('select[name^="options"], input[name^="options"]').forEach((el) => {
        el.addEventListener('change', () => {
          const currentId = (variantIdInput?.value) || this.getCurrentVariantId();
          if (currentId && currentId !== this._lastVariantId) {
            this.handleVariantUpdate(currentId);
          }
        });
      });
  
      [
        'variant:change', 
        'variant:changed', 
        'product:variant-change', 
        'horizon:variant:changed', 
        'theme:variant:change',
        'product:variant:change',
        'variant:select',
        'variant:selected'
      ].forEach(evt => {
        document.addEventListener(evt, (e) => {
          const v = e.detail?.variant;
          if (v?.id) {
            this.handleVariantUpdate(String(v.id), typeof v.price === 'number' ? v.price : undefined);
          }
        });
      });
  
      const priceElements = document.querySelectorAll('.price, [data-price], .product-price, .current-price');
      priceElements.forEach(el => {
        if (window.MutationObserver) {
          const observer = new MutationObserver(() => {
            const currentId = (variantIdInput?.value) || this.getCurrentVariantId();
            if (currentId && currentId !== this._lastVariantId) {
              this.handleVariantUpdate(currentId);
            }
          });
          observer.observe(el, { childList: true, subtree: true, characterData: true });
        }
      });
  
      if (productForm) {
        productForm.addEventListener('change', () => {
          const currentId = variantIdInput?.value;
          if (currentId && currentId !== this._lastVariantId) {
            this.handleVariantUpdate(currentId);
          }
        });
      }
  
      if (variantIdInput) {
        this._variantPoll = setInterval(() => {
          const currentId = variantIdInput.value;
          if (currentId && currentId !== this._lastVariantId) {
            this.handleVariantUpdate(currentId);
          }
        }, 400);
      }
    }
  
    async findBestVariant(productId, productHandle) {
      try {
        if (!this.addonProductsData) {
          this.addonProductsData = new Map();
        }
        
        let productData = this.addonProductsData.get(productId);
        if (!productData && productHandle) {
          const response = await fetch(`/products/${productHandle}.js`);
          if (response.ok) {
            productData = await response.json();
            this.addonProductsData.set(productId, productData);
          }
        }
  
        if (!productData || !productData.variants || productData.variants.length <= 1) {
          return null;
        }
  
        const allVariants = productData.variants;
        if (allVariants.length === 0) {
          return null;
        }
  
        if (allVariants.length === 1) {
          return allVariants[0];
        }
  
        const bestVariant = allVariants.reduce((best, current) => {
          return current.price > best.price ? current : best;
        });
  
        return bestVariant;
      } catch (error) {
        return null;
      }
    }
  
    handleVariantUpdate(newVariantId, explicitPrice) {
      if (!this.cart.mainProduct) return;
      
      const variantIdString = String(newVariantId);
      
      // Сильна блокировка подвійних викликів
      if (this._lastVariantId === variantIdString) {
        return;
      }
      
      // Блокировка на час обробки
      if (this._processingVariantUpdate) {
        return;
      }
      
      // Debounce для запобігання швидких повторних викликів
      const debounceKey = `variant_update_${variantIdString}`;
      if (this._debounceTimers.has(debounceKey)) {
        clearTimeout(this._debounceTimers.get(debounceKey));
      }
      
      this._debounceTimers.set(debounceKey, setTimeout(() => {
        this._performVariantUpdate(variantIdString, explicitPrice);
        this._debounceTimers.delete(debounceKey);
      }, 200));
    }
  
    _performVariantUpdate(newVariantId, explicitPrice) {
      if (!this.cart.mainProduct) return;
      
      // Встановлюємо блокировку
      this._processingVariantUpdate = true;
      
      const variantIdString = String(newVariantId);
      
      // Додаткова перевірка чи варіант дійсно змінився
      if (this._lastVariantId === variantIdString && explicitPrice === undefined) {
        this._processingVariantUpdate = false;
        return;
      }
      
      this._lastVariantId = variantIdString;
  
      let price = typeof explicitPrice === 'number' ? explicitPrice : undefined;
  
      if (price === undefined) {
        if (this.productData?.variants) {
          const v = this.productData.variants.find(va => String(va.id) === String(newVariantId));
          if (v) price = v.price;
        }
        
        if (price === undefined) {
          // Запобігаємо зайвим API викликам
          if (!this._fetchingVariant) {
            this._fetchingVariant = true;
            fetch(`/variants/${newVariantId}.js`)
              .then(res => res.ok ? res.json() : null)
              .then(variant => {
                if (variant && typeof variant.price === 'number') {
                  this._performVariantUpdate(newVariantId, variant.price);
                }
              })
              .catch(() => {})
              .finally(() => {
                this._fetchingVariant = false;
              });
          }
          this._processingVariantUpdate = false;
          return;
        }
        
        if (price === undefined) {
          const priceEl = document.querySelector('.price[data-price], [data-variant-price], .product-price');
          if (priceEl) {
            const priceText = priceEl.dataset.price || priceEl.textContent;
            const priceMatch = priceText.match(/[\d,]+/);
            if (priceMatch) {
              price = parseInt(priceMatch[0].replace(/,/g, ''));
            }
          }
        }
      }
  
      // Оновлюємо основний продукт
      this.cart.mainProduct.variantId = String(newVariantId);
      if (typeof price === 'number') {
        this.cart.mainProduct.price = price;
      }
  
      // Оновлюємо кнопку
      const mainBtn = document.querySelector(this.selectors.mainAddToCartBtn);
      if (mainBtn) {
        mainBtn.dataset.variantId = String(newVariantId);
        mainBtn.classList.remove('in-cart');
        mainBtn.querySelector('.btn-text-add').style.display = 'inline';
        mainBtn.querySelector('.btn-text-checkout').style.display = 'none';
        this.cart.mainProduct.inCart = false;
        this.isMainProductInCart = false;
      }
  
      // Стабільне оновлення цін у міні-кошику
      if (typeof price === 'number') {
        // Оновлюємо ціну основного продукту в міні-кошику
        const priceElement = document.querySelector(`${this.selectors.section} .cart-product-price`);
        if (priceElement) {
          priceElement.dataset.price = String(price);
          priceElement.textContent = this.formatMoney(price);
        }
  
        // Оновлюємо всі елементи з ціною в секції addons
        const sectionPriceElements = document.querySelectorAll(`${this.selectors.section} [data-price]`);
        sectionPriceElements.forEach(el => {
          if (el.classList.contains('cart-product-price')) {
            el.dataset.price = String(price);
            el.textContent = this.formatMoney(price);
          }
        });
  
        // Оновлюємо dataset секції
        const section = document.querySelector(this.selectors.section);
        if (section) {
          section.dataset.selectedVariantId = String(newVariantId);
          section.dataset.selectedVariantPrice = String(price);
        }
      }
  
      // Оновлюємо відображення
      this.updateCartDisplay();
      
      // Знімаємо блокировку
      this._processingVariantUpdate = false;
    }
  
    setupStickyCart() {
      const stickyCart = document.querySelector(this.selectors.stickyCart);
      const sidebar = document.querySelector('.sticky-cart-sidebar');
      
      if (!stickyCart || !sidebar) return;
  
      const updateStickyPosition = () => {
        const header = document.querySelector('header, .header, .site-header, #shopify-section-header');
        let headerHeight = 0;
        
        if (header) {
          const headerRect = header.getBoundingClientRect();
          headerHeight = header.offsetHeight;
          
          const headerStyle = window.getComputedStyle(header);
          if (headerStyle.position === 'fixed' || headerStyle.position === 'sticky') {
            headerHeight = headerRect.height;
          } else {
            headerHeight = Math.max(0, headerRect.bottom);
          }
        }
        
        const topOffset = Math.max(20, headerHeight + 20);
        sidebar.style.top = `${topOffset}px`;
        sidebar.style.maxHeight = `calc(100vh - ${topOffset + 20}px)`;
      };
  
      updateStickyPosition();
      
      let ticking = false;
      const handleScroll = () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            updateStickyPosition();
            ticking = false;
          });
          ticking = true;
        }
      };
      
      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', updateStickyPosition);
      
      if (window.MutationObserver) {
        const observer = new MutationObserver(updateStickyPosition);
        observer.observe(document.body, { childList: true, subtree: true });
      }
    }
  
    destroy() {
      if (this._variantPoll) {
        clearInterval(this._variantPoll);
        this._variantPoll = null;
      }
  
      this._debounceTimers.forEach(timer => clearTimeout(timer));
      this._debounceTimers.clear();
  
      this._requestQueue = [];
  
      document.removeEventListener('click', this.handleClick);
      document.removeEventListener('cart:updated', this.handleCartUpdate);
  
      this.addonProductsData.clear();
      this.cart.addons.clear();
    }
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.product-addons-section')) {
      new ProductAddons();
    }
  });
  
  window.ProductAddons = ProductAddons;