/**
 * Delivery Pricing Renderer
 * Parses JSON pricing data and renders dynamic prices based on weight and country
 */

class DeliveryPricingRenderer {
  constructor(debug = false) {
    this.debug = debug;
    this.sections = document.querySelectorAll('.installation-delivery-section[data-enable-dynamic="true"]');

    if (this.sections.length === 0) {
      return;
    }

    this.init();
  }

  init() {
    this.sections.forEach(section => {
      this.renderSection(section);
    });
  }

  /**
   * Render prices for a section
   * @param {HTMLElement} sectionEl - Section element
   */
  renderSection(sectionEl) {
    try {
      // Get data from section attributes
      const weightKg = parseFloat(sectionEl.dataset.weightKg) || 0;
      const countryCode = sectionEl.dataset.countryCode || 'ES';
      const pricingJson = sectionEl.dataset.pricingJson;

      if (!pricingJson) {
        this.showError(sectionEl, 'No pricing data configured');
        return;
      }

      // Parse JSON
      let pricingData;
      try {
        pricingData = JSON.parse(pricingJson);
      } catch (e) {
        console.error('[DeliveryPricingRenderer] Failed to parse pricing JSON:', e);
        this.showError(sectionEl, 'Invalid pricing data format');
        return;
      }

      // Calculate prices
      const calculated = this.calculatePrices(weightKg, pricingData);

      if (!calculated) {
        this.showError(sectionEl, 'Could not calculate prices');
        return;
      }

      // Render installation options
      const installationContainer = sectionEl.querySelector('[data-pricing-type="installation"]');
      if (installationContainer) {
        this.renderInstallationOptions(installationContainer, calculated.installation_options);
      }

      // Render delivery options
      const deliveryContainer = sectionEl.querySelector('[data-pricing-type="delivery"]');
      if (deliveryContainer) {
        this.renderDeliveryOptions(deliveryContainer, calculated.delivery_options);
      }

    } catch (error) {
      console.error('[DeliveryPricingRenderer] Error rendering section:', error);
      this.showError(sectionEl, error.message);
    }
  }

  /**
   * Calculate prices based on weight
   * @param {number} weightKg - Product weight in kg
   * @param {object} pricingData - Pricing data object
   * @returns {object|null} Calculated prices
   */
  calculatePrices(weightKg, pricingData) {
    if (!pricingData.weight_ranges || pricingData.weight_ranges.length === 0) {
      console.error('[DeliveryPricingRenderer] No weight ranges in pricing data!');
      return null;
    }

    // Find matching weight range
    let weightRangeIndex = -1;
    let weightRangeLabel = '';

    for (let i = 0; i < pricingData.weight_ranges.length; i++) {
      const range = pricingData.weight_ranges[i];
      const min = range.min || 0;
      const max = range.max || 999999;

      if (weightKg >= min && weightKg <= max) {
        weightRangeIndex = i;
        weightRangeLabel = range.label;
        break;
      }
    }

    // If no range found, use last range (heaviest)
    if (weightRangeIndex === -1) {
      weightRangeIndex = pricingData.weight_ranges.length - 1;
      weightRangeLabel = pricingData.weight_ranges[weightRangeIndex].label;
    }

    // Build result
    const result = {
      weight_kg: weightKg,
      weight_range_index: weightRangeIndex,
      weight_range_label: weightRangeLabel,
      delivery_options: [],
      installation_options: []
    };

    // Get delivery prices
    if (pricingData.delivery_options) {
      pricingData.delivery_options.forEach(option => {
        result.delivery_options.push({
          id: option.id,
          label: option.label,
          description: option.description || '',
          price_cents: option.prices[weightRangeIndex] || 0
        });
      });
    }

    // Get installation prices
    if (pricingData.installation_options) {
      pricingData.installation_options.forEach(option => {
        result.installation_options.push({
          id: option.id,
          label: option.label,
          price_cents: option.prices[weightRangeIndex] || 0
        });
      });
    }

    return result;
  }

  /**
   * Render installation options
   * @param {HTMLElement} container - Container element
   * @param {Array} options - Installation options
   */
  renderInstallationOptions(container, options) {
    if (!options || options.length === 0) {
      container.innerHTML = '<div class="pricing-error">No installation options available</div>';
      return;
    }

    let html = '';
    options.forEach(option => {
      html += `
        <div class="pricing-row" data-option-id="${option.id}">
          <span class="pricing-label">${option.label}</span>
          <span class="pricing-value" data-price-cents="${option.price_cents}">
            <span class="approx-text">Approx.</span>
            <span class="price-amount">${this.formatMoney(option.price_cents)}</span>
          </span>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  /**
   * Render delivery options
   * @param {HTMLElement} container - Container element
   * @param {Array} options - Delivery options
   */
  renderDeliveryOptions(container, options) {
    if (!options || options.length === 0) {
      container.innerHTML = '<div class="pricing-error">No delivery options available</div>';
      return;
    }

    let html = '';
    options.forEach(option => {
      html += `
        <div class="delivery-option" data-option-id="${option.id}">
          <div class="delivery-option-header">
            <span class="delivery-label">${option.label}</span>
            <span class="delivery-price" data-price-cents="${option.price_cents}">
              <span class="approx-text">Approx.</span>
              <span class="price-amount">${this.formatMoney(option.price_cents)}</span>
            </span>
          </div>
          ${option.description ? `<p class="delivery-description">${option.description}</p>` : ''}
        </div>
      `;
    });

    container.innerHTML = html;
  }

  /**
   * Format price in cents to money format
   * @param {number} cents - Price in cents
   * @returns {string} Formatted price
   */
  formatMoney(cents) {
    // Get currency from page meta or default to EUR
    const currencyCode = document.querySelector('meta[property="og:price:currency"]')?.content || 'EUR';
    const amount = cents / 100;

    // Use Intl.NumberFormat for proper currency formatting
    try {
      return new Intl.NumberFormat('en-EU', {
        style: 'currency',
        currency: currencyCode
      }).format(amount);
    } catch (e) {
      // Fallback formatting
      return `€${amount.toFixed(2)}`;
    }
  }

  /**
   * Show error message
   * @param {HTMLElement} sectionEl - Section element
   * @param {string} message - Error message
   */
  showError(sectionEl, message) {
    const installationContainer = sectionEl.querySelector('[data-pricing-type="installation"]');
    const deliveryContainer = sectionEl.querySelector('[data-pricing-type="delivery"]');

    const errorHtml = `<div class="pricing-error" style="color: #d32f2f; padding: 10px; background: #ffebee; border-radius: 4px;">Error: ${message}</div>`;

    if (installationContainer) {
      installationContainer.innerHTML = errorHtml;
    }
    if (deliveryContainer) {
      deliveryContainer.innerHTML = errorHtml;
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new DeliveryPricingRenderer();
  });
} else {
  new DeliveryPricingRenderer();
}

// Export for use by variant updater
window.DeliveryPricingRenderer = DeliveryPricingRenderer;
