/**
 * Delivery Info Section Updater
 * Updates delivery and installation pricing when product variant changes
 */

class DeliveryInfoUpdater {
  constructor() {
    this.sections = document.querySelectorAll('.installation-delivery-section[data-section-id]');
    this.debug = window.deliveryInfoDebug || false; // Get debug mode from global

    if (this.sections.length === 0) {
      this.log('No delivery info sections found');
      return;
    }

    this.log('Initializing for', this.sections.length, 'section(s)');
    this.init();
  }

  log(...args) {
    if (this.debug) {
      console.log('[DeliveryInfoUpdater]', ...args);
    }
  }

  warn(...args) {
    if (this.debug) {
      console.warn('[DeliveryInfoUpdater]', ...args);
    }
  }

  error(...args) {
    console.error('[DeliveryInfoUpdater]', ...args);
  }

  init() {
    // Listen for variant update events (theme's standard event)
    document.addEventListener('variant:update', this.handleVariantChange.bind(this));
    this.log('Listening for variant:update events');

    // Also listen for variant selected events
    document.addEventListener('variant:selected', this.handleVariantChange.bind(this));
    this.log('Listening for variant:selected events');
  }

  /**
   * Handle variant change event
   * @param {CustomEvent} event - Variant change event (variant:update)
   */
  async handleVariantChange(event) {
    this.log('=== Variant Change Event Received ===');
    this.log('Event type:', event.type);
    this.log('Event detail:', event.detail);

    // event.detail.resource contains the variant object for variant:update
    // event.detail might contain the variant directly for other events
    const variant = event.detail?.resource || event.detail?.variant || event.detail;

    if (!variant || !variant.id) {
      this.warn('No variant data in event. Event detail:', event.detail);
      return;
    }

    this.log('Variant ID:', variant.id);
    this.log('Variant weight:', variant.weight, 'g (', (variant.weight / 1000), 'kg)');

    // Update all delivery info sections
    for (const section of this.sections) {
      await this.updateSection(section, variant);
    }
  }

  /**
   * Update section with new variant data
   * @param {HTMLElement} sectionEl - Section element
   * @param {Object} variant - Variant object
   */
  async updateSection(sectionEl, variant) {
    const sectionId = sectionEl.dataset.sectionId;
    const productId = sectionEl.dataset.productId;
    const currentVariantId = sectionEl.dataset.variantId;

    this.log('--- Updating Section ---');
    this.log('Section ID:', sectionId);
    this.log('Current Variant ID:', currentVariantId);
    this.log('New Variant ID:', variant.id);

    // Skip if variant hasn't changed
    if (currentVariantId === String(variant.id)) {
      this.log('Variant unchanged, skipping update');
      return;
    }

    try {
      // Calculate weight in kg
      const weightGrams = variant.weight || 0;
      const weightKg = weightGrams / 1000;

      this.log('New weight:', weightKg, 'kg');

      // Update data attributes on the section
      sectionEl.dataset.variantId = variant.id;
      sectionEl.dataset.weightKg = weightKg;
      this.log('Updated data attributes on section element');

      // Re-render prices using the pricing renderer
      if (window.DeliveryPricingRenderer) {
        this.log('Re-rendering prices with updated weight...');
        const renderer = new window.DeliveryPricingRenderer();
        renderer.renderSection(sectionEl);
        this.log('✓ Prices updated successfully');
      } else {
        this.error('DeliveryPricingRenderer not found! Cannot update prices.');
      }

    } catch (error) {
      this.error('Error updating section:', error);
    }
  }

}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new DeliveryInfoUpdater();
  });
} else {
  new DeliveryInfoUpdater();
}
