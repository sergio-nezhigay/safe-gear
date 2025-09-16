/**
 * Product Information Section with Lazy Loading
 * Handles intersection-based loading for better performance
 */

class ProductInfoSection extends HTMLElement {
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
      this.dispatchEvent(new CustomEvent('product-info:loaded', {
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
    announcement.textContent = 'Product information has been loaded';

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
  }

  disconnectedCallback() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.removeEventListener('click', this.handleClick.bind(this));
  }

  handleClick(event) {
    // Handle any click events within the section
    const target = event.target;

    // Example: Handle table row expansion or other interactive features
    if (target.matches('[data-toggle-row]')) {
      this.toggleTableRow(target);
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
}

// Register the custom element
if ('customElements' in window) {
  customElements.define('product-info-section', ProductInfoSection);
}

// Fallback for browsers without custom elements support
if (!('customElements' in window)) {
  document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('product-info-section');
    sections.forEach(section => {
      // Fallback: immediately load content
      section.setAttribute('data-loaded', '');
    });
  });
}

// Export for potential use in other modules
export default ProductInfoSection;