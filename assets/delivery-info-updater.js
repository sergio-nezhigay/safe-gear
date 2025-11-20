/**
 * Delivery Info Section Updater
 * Updates delivery and installation pricing when product variant changes
 */

class DeliveryInfoUpdater {
  constructor() {
    this.sections = document.querySelectorAll('.installation-delivery-section[data-section-id]');

    if (this.sections.length === 0) {
      return;
    }

    this.init();
  }

  error(...args) {
    console.error('[DeliveryInfoUpdater]', ...args);
  }

  init() {
    // Listen for variant update events (theme's standard event)
    document.addEventListener('variant:update', this.handleVariantChange.bind(this));

    // Also listen for variant selected events
    document.addEventListener('variant:selected', this.handleVariantChange.bind(this));
  }

  /**
   * Handle variant change event
   * @param {CustomEvent} event - Variant change event (variant:update)
   */
  async handleVariantChange(event) {
    // event.detail.resource contains the variant object for variant:update
    // event.detail might contain the variant directly for other events
    const variant = event.detail?.resource || event.detail?.variant || event.detail;

    if (!variant || !variant.id) {
      return;
    }

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
    const currentVariantId = sectionEl.dataset.variantId;

    // Skip if variant hasn't changed
    if (currentVariantId === String(variant.id)) {
      return;
    }

    try {
      // Calculate weight in kg
      const weightGrams = variant.weight || 0;
      const weightKg = weightGrams / 1000;

      // Update data attributes on the section
      sectionEl.dataset.variantId = variant.id;
      sectionEl.dataset.weightKg = weightKg;

      // Re-render prices using the pricing renderer
      if (window.DeliveryPricingRenderer) {
        const renderer = new window.DeliveryPricingRenderer();
        renderer.renderSection(sectionEl);
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
