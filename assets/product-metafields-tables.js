/**
 * Product Metafields Tables Section with Lazy Loading
 * Handles intersection-based loading for better performance
 */

class ProductMetafieldsSection extends HTMLElement {
  constructor() {
    super();
    this.sectionId = this.dataset.sectionId;
    this.lazyLoadEnabled = this.dataset.lazyLoad === 'true';
    this.loaded = false;

    this.init();
  }

  init() {
    if (this.lazyLoadEnabled) {
      this.setupIntersectionObserver();
    } else {
      this.loadContent();
    }
  }

  setupIntersectionObserver() {
    const options = {
      root: null,
      rootMargin: '100px 0px', // Load 100px before element comes into view
      threshold: 0.1
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.loaded) {
          this.loadContent();
          this.observer.unobserve(entry.target);
        }
      });
    }, options);

    this.observer.observe(this);
  }

  loadContent() {
    if (this.loaded) return;

    // Simulate loading delay for demonstration
    setTimeout(() => {
      this.setAttribute('data-loaded', '');
      this.loaded = true;

      // Focus management for accessibility
      this.announceContentLoaded();

      // Dispatch custom event for other components
      this.dispatchEvent(new CustomEvent('metafields:loaded', {
        detail: { sectionId: this.sectionId },
        bubbles: true
      }));
    }, 300);
  }

  announceContentLoaded() {
    // Announce to screen readers that content has loaded
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = 'Product metafields information has been loaded';

    this.appendChild(announcement);

    // Remove announcement after screen readers have had time to announce it
    setTimeout(() => {
      if (announcement.parentNode) {
        announcement.parentNode.removeChild(announcement);
      }
    }, 1000);
  }

  connectedCallback() {
    // Add event listeners for any interactive elements
    this.addEventListener('click', this.handleClick.bind(this));

    // Listen for variant changes to update variant metafields
    document.addEventListener('variant:update', this.handleVariantUpdate.bind(this));
  }

  disconnectedCallback() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.removeEventListener('click', this.handleClick.bind(this));
    document.removeEventListener('variant:update', this.handleVariantUpdate.bind(this));
  }

  handleClick(event) {
    // Handle any click events within the section
    const target = event.target;

    // Example: Handle expandable rows or other interactive features
    if (target.matches('[data-toggle-row]')) {
      this.toggleTableRow(target);
    }

    // Handle copy to clipboard for code/JSON values
    if (target.matches('code') || target.closest('code')) {
      this.copyToClipboard(target.textContent || target.closest('code').textContent);
    }
  }

  toggleTableRow(trigger) {
    const row = trigger.closest('tr');
    const expandedContent = row.querySelector('.expanded-content');

    if (expandedContent) {
      const isExpanded = expandedContent.style.display !== 'none';
      expandedContent.style.display = isExpanded ? 'none' : 'table-cell';
      trigger.setAttribute('aria-expanded', !isExpanded);
    }
  }

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showCopyNotification();
    } catch (err) {
      console.warn('Failed to copy to clipboard:', err);
    }
  }

  showCopyNotification() {
    // Create temporary notification
    const notification = document.createElement('div');
    notification.textContent = 'Copied to clipboard';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      z-index: 9999;
      font-size: 14px;
      animation: fadeInOut 2s ease-in-out;
    `;

    // Add CSS animation if not already defined
    if (!document.querySelector('#copy-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'copy-notification-styles';
      style.textContent = `
        @keyframes fadeInOut {
          0%, 100% { opacity: 0; transform: translateY(-10px); }
          20%, 80% { opacity: 1; transform: translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Remove notification after animation
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 2000);
  }

  /**
   * Handle variant change events and update variant-specific metafields
   * @param {CustomEvent} event - The variant:update event
   */
  handleVariantUpdate(event) {
    if (!event.detail || !event.detail.data || !event.detail.data.html) {
      return;
    }

    // Parse the HTML response to extract variant metafield values
    const parser = new DOMParser();
    const doc = parser.parseFromString(event.detail.data.html, 'text/html');

    // Find the metafields section in the parsed HTML
    const updatedSection = doc.querySelector(`product-metafields-section[data-section-id="${this.sectionId}"]`);

    if (!updatedSection) {
      return;
    }

    // Get all variant metafield rows in the current DOM
    const variantRows = this.querySelectorAll('tr[data-variant-metafield="true"]');

    variantRows.forEach(row => {
      const metafieldKey = row.dataset.metafieldKey;

      if (!metafieldKey) {
        return;
      }

      // Find the corresponding row in the updated HTML
      const updatedRow = updatedSection.querySelector(`tr[data-metafield-key="${metafieldKey}"]`);

      if (updatedRow && updatedRow.style.display !== 'none') {
        // Variant has this metafield - update and show
        const updatedValue = updatedRow.querySelector('[data-metafield-value]');
        const currentValue = row.querySelector('[data-metafield-value]');

        if (updatedValue && currentValue) {
          currentValue.innerHTML = updatedValue.innerHTML;
        }

        // Show the row with transition
        this.showRow(row);
      } else {
        // Variant doesn't have this metafield - hide it
        this.hideRow(row);
      }
    });
  }

  /**
   * Show a row with smooth transition
   * @param {HTMLElement} row - The row element to show
   */
  showRow(row) {
    row.style.display = '';

    // Remove hidden class to trigger transition
    requestAnimationFrame(() => {
      row.classList.remove('hidden');
    });
  }

  /**
   * Hide a row with smooth transition
   * @param {HTMLElement} row - The row element to hide
   */
  hideRow(row) {
    // Add hidden class to start transition
    row.classList.add('hidden');

    // After transition completes, set display none
    setTimeout(() => {
      if (row.classList.contains('hidden')) {
        row.style.display = 'none';
      }
    }, 300); // Match the CSS transition duration
  }
}

// Register the custom element
if ('customElements' in window) {
  customElements.define('product-metafields-section', ProductMetafieldsSection);
}

// Fallback for browsers without custom elements support
if (!('customElements' in window)) {
  document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('product-metafields-section');
    sections.forEach(section => {
      // Fallback: immediately load content
      section.setAttribute('data-loaded', '');
    });
  });
}

// Export for potential use in other modules
export default ProductMetafieldsSection;