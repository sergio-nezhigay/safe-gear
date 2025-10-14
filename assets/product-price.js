// ThemeEvents will be available globally from Horizon theme

/**
 * A custom element that displays a product price.
 * This component listens for variant update events and updates the price display accordingly.
 * It handles price updates from two different sources:
 * 1. Variant picker (in quick add modal or product page)
 * 2. Swatches variant picker (in product cards)
 */
class ProductPrice extends HTMLElement {
  connectedCallback() {
    const closestSection = this.closest('.shopify-section, dialog');
    if (!closestSection) return;
    closestSection.addEventListener('theme:variant:update', this.updatePrice);
  }

  disconnectedCallback() {
    const closestSection = this.closest('.shopify-section, dialog');
    if (!closestSection) return;
    closestSection.removeEventListener('theme:variant:update', this.updatePrice);
  }

  /**
   * Updates the price.
   * @param {VariantUpdateEvent} event - The variant update event.
   */
  updatePrice = (event) => {
    // Check if this update is for our product
    if (event.detail.data.newProduct) {
      this.dataset.productId = event.detail.data.newProduct.id;
    } else if (event.target instanceof HTMLElement && event.target.dataset.productId !== this.dataset.productId) {
      return;
    }

    // Get the variant resource from the event
    const variant = event.detail.resource;
    
    // If we have variant data, update price immediately
    if (variant && variant.price !== undefined) {
      this.updatePriceFromVariant(variant);
    }

    // Also update from HTML if available (fallback)
    const newPrice = event.detail.data.html.querySelector('product-price [ref="priceContainer"]');
    const currentPrice = this.querySelector('[ref="priceContainer"]');

    if (newPrice && currentPrice && currentPrice.innerHTML !== newPrice.innerHTML) {
      currentPrice.replaceWith(newPrice);
    }
  };

  /**
   * Updates price display from variant data
   * @param {Object} variant - The variant object
   */
  updatePriceFromVariant(variant) {
    const priceContainer = this.querySelector('[ref="priceContainer"]');
    if (!priceContainer) return;

    // Update variant ID attributes for B2B apps
    priceContainer.setAttribute('bss-b2b-variant-id', variant.id);
    
    // Update regular price
    const regularPriceElement = priceContainer.querySelector('.price-item--regular');
    if (regularPriceElement && variant.price !== undefined) {
      const formattedPrice = this.formatPrice(variant.price);
      
      // Check if this is a range price or single price
      if (regularPriceElement.textContent.includes(' - ')) {
        // Keep range format for products with quantity breaks
        return;
      } else {
        regularPriceElement.textContent = `${formattedPrice} exc. VAT`;
      }
    }

    // Update sale price
    const salePriceElement = priceContainer.querySelector('.price-item--sale');
    if (salePriceElement && variant.price !== undefined) {
      const formattedPrice = this.formatPrice(variant.price);
      salePriceElement.textContent = `${formattedPrice} inc. VAT`;
    }

    // Update compare at price if available
    if (variant.compare_at_price && variant.compare_at_price > variant.price) {
      const compareElements = priceContainer.querySelectorAll('.price-item--regular s, .price__sale s');
      compareElements.forEach(element => {
        element.textContent = this.formatPrice(variant.compare_at_price);
      });
      
      // Add sale class
      const priceElement = this.querySelector('.price');
      if (priceElement) {
        priceElement.classList.add('price--on-sale');
      }
    } else {
      // Remove sale class
      const priceElement = this.querySelector('.price');
      if (priceElement) {
        priceElement.classList.remove('price--on-sale');
      }
    }

    // Update unit price if available
    if (variant.unit_price_measurement) {
      const unitPriceElement = priceContainer.querySelector('.unit-price .price-item--last span');
      if (unitPriceElement && variant.unit_price) {
        unitPriceElement.textContent = this.formatPrice(variant.unit_price);
      }
    }
  }

  /**
   * Formats price according to shop settings
   * @param {number} price - Price in cents
   * @returns {string} Formatted price
   */
  formatPrice(price) {
    if (typeof Shopify !== 'undefined' && Shopify.formatMoney) {
      return Shopify.formatMoney(price, Theme.moneyFormat || '{{amount}}');
    }
    
    // Fallback formatting
    return (price / 100).toFixed(2).replace('.', ',') + ' kr.';
  }
}

if (!customElements.get('product-price')) {
  customElements.define('product-price', ProductPrice);
}
