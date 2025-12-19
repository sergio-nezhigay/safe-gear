document.addEventListener('DOMContentLoaded', () => {
  class ProductFilters {
    constructor() {
      this.filters = {
        burglary_grade: [],
        fire_resistance: [],
        product_type: [],
        price_range: { min: null, max: null },
        depth_range: { min: null, max: null },
        width_range: { min: null, max: null },
        height_range: { min: null, max: null },
        weight_range: { min: null, max: null }
      };
      this.allProducts = [];
      this.filteredProducts = [];
      this.currentPage = 1;
      this.itemsPerPage = parseInt(document.querySelector('[data-products-per-page]')?.getAttribute('data-products-per-page')) || 12;
      this.paginationEnabled = document.querySelector('[data-show-pagination]')?.getAttribute('data-show-pagination') === 'true';
      this.debounceTimer = null;
      this.isFiltering = false;
      this.init();
    }

    init() {
      this.cacheDOM();
      this.loadProducts();
      this.bindEvents();
      this.initializeSliders();
      this.initializeAccordions();
      this.initializeMobileFilters();
      this.renderProducts();
      this.updatePagination();
      this.updateResultsCount();
      this.updateFilterDependencies();
      this.restoreFiltersFromURL();
    }

    cacheDOM() {
      this.productsGrid = document.getElementById('products-grid');
      this.filtersContainer = document.querySelector('.filters-container');
      this.resultsInfo = document.getElementById('product-results-info');
      this.resultsCount = document.getElementById('product-results-count');
      this.pagination = document.getElementById('product-pagination-container');

      this.checkboxes = document.querySelectorAll('input[type="checkbox"][data-filter-type]');
      this.priceSliders = document.querySelectorAll('#product-price-min,#product-price-max');
      this.dimensionSliders = document.querySelectorAll('.dimension-slider');
      this.priceInputs = document.querySelectorAll('#product-price-min-input,#product-price-max-input');
      this.dimensionInputs = document.querySelectorAll('.dimension-input');
      this.clearFiltersBtn = document.getElementById('clear-product-filters');

      this.mobileFilterBtn = document.getElementById('mobile-product-filter-btn');
      this.mobileFilterOverlay = document.getElementById('mobile-product-filter-overlay');
      this.mobileFilterClose = document.getElementById('mobile-product-filter-close');
      this.mobileApplyBtn = document.getElementById('mobile-product-apply-filters');
      this.mobileClearBtn = document.getElementById('mobile-product-clear-filters');
      this.mobileFilterContent = document.querySelector('.mobile-filter-content');

      this.activeFilterCount = document.getElementById('active-product-filter-count');
      this.accordionTitles = document.querySelectorAll('.filter-group-title[data-accordion]');
    }

    bindEvents() {
      this.checkboxes?.forEach(checkbox => {
        checkbox.addEventListener('change', () => this.handleCheckboxChange(checkbox));
      });

      this.priceSliders?.forEach(slider => {
        slider.addEventListener('input', this.debounce(() => this.handlePriceSlider(), 250));
      });

      this.dimensionSliders?.forEach(slider => {
        slider.addEventListener('input', this.debounce(() => this.handleDimensionSlider(slider), 250));
      });

      this.priceInputs?.forEach(input => {
        input.addEventListener('change', () => this.handlePriceInput(input));
        input.addEventListener('keyup', this.debounce(() => this.handlePriceInput(input), 300));
      });

      this.dimensionInputs?.forEach(input => {
        input.addEventListener('change', () => this.handleDimensionInput(input));
        input.addEventListener('keyup', this.debounce(() => this.handleDimensionInput(input), 300));
      });

      this.clearFiltersBtn?.addEventListener('click', () => this.clearAllFilters());

      this.mobileFilterBtn?.addEventListener('click', () => this.showMobileFilters());
      this.mobileFilterClose?.addEventListener('click', () => this.hideMobileFilters());
      this.mobileFilterOverlay?.addEventListener('click', (e) => {
        if (e.target === this.mobileFilterOverlay) this.hideMobileFilters();
      });
      this.mobileApplyBtn?.addEventListener('click', () => this.hideMobileFilters());
      this.mobileClearBtn?.addEventListener('click', () => this.clearAllFilters());

      this.accordionTitles?.forEach(title => {
        title.addEventListener('click', () => this.toggleAccordion(title));
      });
    }

    debounce(func, wait) {
      return (...args) => {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => func.apply(this, args), wait);
      };
    }

    loadProducts() {
      const productCards = document.querySelectorAll('.product-card');
      this.allProducts = Array.from(productCards).map(card => {
        return {
          element: card,
          data: {
            burglary_grade: card.getAttribute('data-burglary-grade') || '',
            fire_resistance: card.getAttribute('data-fire-resistance') || '',
            product_type: card.getAttribute('data-product-type') || '',
            price: (parseFloat(card.getAttribute('data-price')) || 0) / 100,
            depth: parseFloat(card.getAttribute('data-depth')) || 0,
            width: parseFloat(card.getAttribute('data-width')) || 0,
            height: parseFloat(card.getAttribute('data-height')) || 0,
            weight: parseFloat(card.getAttribute('data-weight')) || 0
          }
        };
      });
      this.filteredProducts = [...this.allProducts];
    }

    initializeSliders() {
      this.updatePriceSliderTrack();
      ['depth', 'width', 'height', 'weight'].forEach(dimension => {
        this.updateDimensionSliderTrack(dimension);
      });
    }

    initializeAccordions() {
      document.querySelectorAll('[data-accordion-content]').forEach(content => {
        content.style.display = 'block';
      });
      document.querySelectorAll('.accordion-icon').forEach(icon => {
        icon.textContent = '−';
      });
    }

    initializeMobileFilters() {
      if (window.innerWidth <= 768) {
        this.setupMobileFilters();
      }
      window.addEventListener('resize', this.debounce(() => {
        if (window.innerWidth <= 768) {
          this.setupMobileFilters();
        }
      }, 250));
      this.initStickyFilterButton();
    }

    setupMobileFilters() {
      const filtersContainer = document.querySelector('.filters-container');
      if (filtersContainer && this.mobileFilterContent && window.innerWidth <= 768) {
        this.mobileFilterContent.innerHTML = filtersContainer.innerHTML;
        this.rebindMobileEvents();
      }
    }

    rebindMobileEvents() {
      this.cacheDOM();
      this.bindEvents();
      this.initializeSliders();
    }

    handleCheckboxChange(checkbox) {
      const filterType = checkbox.dataset.filterType;
      const value = checkbox.value;
      if (checkbox.checked) {
        if (!this.filters[filterType].includes(value)) {
          this.filters[filterType].push(value);
        }
      } else {
        this.filters[filterType] = this.filters[filterType].filter(v => v !== value);
      }
      this.applyFilters();
      this.updateFilterCount();
    }

    handlePriceSlider() {
      const minSlider = document.getElementById('product-price-min');
      const maxSlider = document.getElementById('product-price-max');
      const minInput = document.getElementById('product-price-min-input');
      const maxInput = document.getElementById('product-price-max-input');
      if (!minSlider || !maxSlider) return;

      let minVal = parseInt(minSlider.value);
      let maxVal = parseInt(maxSlider.value);
      if (minVal >= maxVal) {
        minVal = maxVal - 1;
        minSlider.value = minVal;
      }
      this.filters.price_range.min = minVal;
      this.filters.price_range.max = maxVal;
      if (minInput) minInput.value = minVal;
      if (maxInput) maxInput.value = maxVal;

      this.updatePriceSliderTrack();
      this.applyFilters();
      this.updateFilterCount();
    }

    handleDimensionSlider(slider) {
      const dimension = slider.id.split('-')[1];
      const type = slider.id.split('-')[2];
      const minSlider = document.getElementById(`product-${dimension}-min`);
      const maxSlider = document.getElementById(`product-${dimension}-max`);
      const minInput = document.getElementById(`product-${dimension}-min-input`);
      const maxInput = document.getElementById(`product-${dimension}-max-input`);
      if (!minSlider || !maxSlider) return;

      let minVal = parseInt(minSlider.value);
      let maxVal = parseInt(maxSlider.value);
      if (minVal >= maxVal) {
        if (type === 'min') {
          minVal = maxVal - 1;
          minSlider.value = minVal;
        } else {
          maxVal = minVal + 1;
          maxSlider.value = maxVal;
        }
      }
      this.filters[`${dimension}_range`].min = minVal;
      this.filters[`${dimension}_range`].max = maxVal;
      if (minInput) minInput.value = minVal;
      if (maxInput) maxInput.value = maxVal;

      this.updateDimensionSliderTrack(dimension);
      this.applyFilters();
      this.updateFilterCount();
    }

    handlePriceInput(input) {
      const isMin = input.id === 'product-price-min-input';
      const value = parseInt(input.value) || 0;
      if (isMin) {
        this.filters.price_range.min = value;
        const slider = document.getElementById('product-price-min');
        if (slider) slider.value = value;
      } else {
        this.filters.price_range.max = value;
        const slider = document.getElementById('product-price-max');
        if (slider) slider.value = value;
      }
      this.updatePriceSliderTrack();
      this.applyFilters();
      this.updateFilterCount();
    }

    handleDimensionInput(input) {
      const id = input.id;
      const dimension = id.split('-')[1];
      const isMin = id.includes('-min-input');
      const value = parseInt(input.value) || 0;
      if (isMin) {
        this.filters[`${dimension}_range`].min = value;
        const slider = document.getElementById(`product-${dimension}-min`);
        if (slider) slider.value = value;
      } else {
        this.filters[`${dimension}_range`].max = value;
        const slider = document.getElementById(`product-${dimension}-max`);
        if (slider) slider.value = value;
      }
      this.updateDimensionSliderTrack(dimension);
      this.applyFilters();
      this.updateFilterCount();
    }

    updatePriceSliderTrack() {
      const minSlider = document.getElementById('product-price-min');
      const maxSlider = document.getElementById('product-price-max');
      const track = document.querySelector('.price-range-track');
      if (!minSlider || !maxSlider || !track) return;

      const min = parseInt(minSlider.min);
      const max = parseInt(maxSlider.max);
      const minVal = parseInt(minSlider.value);
      const maxVal = parseInt(maxSlider.value);
      const minPercent = ((minVal - min) / (max - min)) * 100;
      const maxPercent = ((maxVal - min) / (max - min)) * 100;
      track.style.left = minPercent + '%';
      track.style.width = (maxPercent - minPercent) + '%';
      this.updatePriceLabels(minVal, maxVal);
    }

    updatePriceLabels(minVal, maxVal) {
      const minLabel = document.querySelector('.price-min-label');
      const maxLabel = document.querySelector('.price-max-label');
      if (!minLabel || !maxLabel) return;
      if (window.innerWidth <= 768) {
        minLabel.textContent = this.formatPrice(minVal * 100);
        maxLabel.textContent = this.formatPrice(maxVal * 100);
      } else {
        minLabel.textContent = this.formatPriceCompact(minVal * 100);
        maxLabel.textContent = this.formatPriceCompact(maxVal * 100);
      }
    }

    formatPrice(price) {
      return Shopify?.formatMoney ? Shopify.formatMoney(price) : (price / 100).toFixed(2);
    }

    formatPriceCompact(price) {
      const rounded = Math.round(price / 100);
      if (window.theme && window.theme.moneyFormat) {
        return window.theme.moneyFormat.replace('{{amount}}', rounded);
      }
      return rounded.toString();
    }

    updateDimensionSliderTrack(dimension) {
      const minSlider = document.getElementById(`product-${dimension}-min`);
      const maxSlider = document.getElementById(`product-${dimension}-max`);
      const track = document.querySelector(`.${dimension}-range-progress`) || document.querySelector(`.${dimension}-range-track`);
      if (!minSlider || !maxSlider || !track) return;

      const min = parseInt(minSlider.min);
      const max = parseInt(maxSlider.max);
      const minVal = parseInt(minSlider.value);
      const maxVal = parseInt(maxSlider.value);
      const minPercent = ((minVal - min) / (max - min)) * 100;
      const maxPercent = ((maxVal - min) / (max - min)) * 100;
      track.style.left = minPercent + '%';
      track.style.width = (maxPercent - minPercent) + '%';
    }

    applyFilters() {
      if (this.isFiltering) return;
      this.isFiltering = true;
      requestAnimationFrame(() => {
        this.filteredProducts = this.allProducts.filter(p => this.matchesFilters(p.data));
        this.currentPage = 1;
        this.updateFilterDependencies();
        this.updateResultsCount();
        this.renderProducts();
        this.updatePagination();
        this.saveFiltersToURL();
        this.dispatchFiltersAppliedEvent();
        this.isFiltering = false;
      });
    }

    updateFilterDependencies() {
      this.updateAvailableSecurityFilters('burglary_grade', 'fire_resistance');
      this.updateAvailableSecurityFilters('fire_resistance', 'burglary_grade');
    }

    updateAvailableSecurityFilters(currentFilterType, dependentFilterType) {
      const availableValues = new Set();
      this.allProducts.forEach(p => {
        const currentFilters = this.filters[currentFilterType];
        if (currentFilters.length === 0 || currentFilters.includes(p.data[currentFilterType])) {
          const dependentValue = p.data[dependentFilterType];
          if (dependentValue && dependentValue.trim() !== '') {
            availableValues.add(dependentValue);
          }
        }
      });
      const checkboxes = document.querySelectorAll(`input[data-filter-type="${dependentFilterType}"]`);
      checkboxes.forEach(checkbox => {
        const parentLabel = checkbox.closest('.filter-checkbox');
        if (parentLabel) {
          if (availableValues.has(checkbox.value)) {
            parentLabel.style.display = 'flex';
            checkbox.disabled = false;
          } else {
            parentLabel.style.display = 'none';
            checkbox.disabled = true;
          }
        }
      });
    }

    matchesFilters(data) {
      if (this.filters.burglary_grade.length > 0 && !this.filters.burglary_grade.includes(data.burglary_grade)) return false;
      if (this.filters.fire_resistance.length > 0 && !this.filters.fire_resistance.includes(data.fire_resistance)) return false;
      if (this.filters.product_type.length > 0 && !this.filters.product_type.includes(data.product_type)) return false;

      if (this.filters.price_range.min !== null && data.price < this.filters.price_range.min) return false;
      if (this.filters.price_range.max !== null && data.price > this.filters.price_range.max) return false;

      const dimensions = ['depth', 'width', 'height', 'weight'];
      for (const dim of dimensions) {
        const filter = this.filters[`${dim}_range`];
        if (filter.min !== null && data[dim] > 0 && data[dim] < filter.min) return false;
        if (filter.max !== null && data[dim] > 0 && data[dim] > filter.max) return false;
      }
      return true;
    }

    renderProducts() {
      if (!this.productsGrid) return;
      let pageProducts;
      if (this.paginationEnabled) {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        pageProducts = this.filteredProducts.slice(startIndex, endIndex);
      } else {
        // Show all filtered products when pagination is disabled
        pageProducts = this.filteredProducts;
      }
      const pageElements = new Set(pageProducts.map(p => p.element));

      this.allProducts.forEach(p => {
        const shouldShow = pageElements.has(p.element);
        const cur = p.element.style.display;
        if (shouldShow && cur === 'none') {
          p.element.style.display = 'flex';
        } else if (!shouldShow && cur !== 'none') {
          p.element.style.display = 'none';
        }
      });

      this.toggleNoResults(this.filteredProducts.length === 0);
    }

    toggleNoResults(show) {
      let noResultsElement = document.getElementById('product-no-results');
      if (!noResultsElement) return;
      noResultsElement.style.display = show ? 'block' : 'none';
    }

    updateResultsCount() {
      if (!this.resultsInfo || !this.resultsCount) return;
      const count = this.filteredProducts.length;
      this.resultsInfo.style.display = 'block';
      this.resultsCount.textContent = `Showing ${count} product${count !== 1 ? 's' : ''}`;
    }

    updatePagination() {
      if (!this.pagination || !this.paginationEnabled) return;
      const totalItems = this.filteredProducts.length;
      const totalPages = Math.ceil(totalItems / this.itemsPerPage);
      if (totalPages <= 1) {
        this.pagination.style.display = 'none';
        return;
      }
      if (this.currentPage > totalPages) this.currentPage = 1;
      this.pagination.style.display = 'flex';
      this.pagination.innerHTML = this.generatePaginationHTML(totalPages);
      this.pagination.querySelectorAll('.pagination-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const page = parseInt(btn.dataset.page);
          if (page && page !== this.currentPage) {
            this.currentPage = page;
            this.renderProducts();
            this.updatePagination();
            this.scrollToTop();
          }
        });
      });
    }

    scrollToTop() {
      const section = document.querySelector('.product-grid-section');
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    generatePaginationHTML(totalPages) {
      let html = '';
      if (this.currentPage > 1) {
        html += `<button class="pagination-btn" data-page="${this.currentPage - 1}">‹ Previous</button>`;
      }
      const maxVisiblePages = 5;
      const halfVisible = Math.floor(maxVisiblePages / 2);
      let startPage = Math.max(1, this.currentPage - halfVisible);
      let endPage = Math.min(totalPages, this.currentPage + halfVisible);
      if (endPage - startPage + 1 < maxVisiblePages) {
        if (startPage === 1) {
          endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        } else {
          startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
      }
      if (startPage > 1) {
        html += `<button class="pagination-btn" data-page="1">1</button>`;
        if (startPage > 2) html += `<span class="pagination-ellipsis">...</span>`;
      }
      for (let i = startPage; i <= endPage; i++) {
        const isActive = i === this.currentPage;
        html += `<button class="pagination-btn ${isActive ? 'pagination-current' : ''}" data-page="${i}">${i}</button>`;
      }
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<span class="pagination-ellipsis">...</span>`;
        html += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
      }
      if (this.currentPage < totalPages) {
        html += `<button class="pagination-btn" data-page="${this.currentPage + 1}">Next ›</button>`;
      }
      return html;
    }

    updateFilterCount() {
      let count = 0;
      ['burglary_grade', 'fire_resistance', 'product_type'].forEach(type => {
        count += this.filters[type].length;
      });
      ['price_range', 'depth_range', 'width_range', 'height_range', 'weight_range'].forEach(type => {
        const f = this.filters[type];
        if (f.min !== null || f.max !== null) count++;
      });
      if (this.activeFilterCount) {
        if (count > 0) {
          this.activeFilterCount.textContent = count;
          this.activeFilterCount.style.display = 'flex';
        } else {
          this.activeFilterCount.style.display = 'none';
        }
      }
    }

    clearAllFilters() {
      this.filters = {
        burglary_grade: [],
        fire_resistance: [],
        product_type: [],
        price_range: { min: null, max: null },
        depth_range: { min: null, max: null },
        width_range: { min: null, max: null },
        height_range: { min: null, max: null },
        weight_range: { min: null, max: null }
      };
      this.checkboxes?.forEach(checkbox => {
        checkbox.checked = false;
        const parentLabel = checkbox.closest('.filter-checkbox');
        if (parentLabel) {
          parentLabel.style.display = 'flex';
          checkbox.disabled = false;
        }
      });
      this.resetSliders();
      this.currentPage = 1;
      this.filteredProducts = [...this.allProducts];
      this.updateResultsCount();
      this.renderProducts();
      this.updatePagination();
      this.updateFilterDependencies();
      this.saveFiltersToURL();
      this.dispatchFiltersAppliedEvent();
      this.updateFilterCount();
    }

    resetSliders() {
      const priceMin = document.getElementById('product-price-min');
      const priceMax = document.getElementById('product-price-max');
      const priceMinInput = document.getElementById('product-price-min-input');
      const priceMaxInput = document.getElementById('product-price-max-input');
      if (priceMin && priceMax) {
        priceMin.value = priceMin.min;
        priceMax.value = priceMax.max;
        if (priceMinInput) priceMinInput.value = priceMin.min;
        if (priceMaxInput) priceMaxInput.value = priceMax.max;
        this.updatePriceSliderTrack();
      }
      ['depth', 'width', 'height', 'weight'].forEach(dimension => {
        const minSlider = document.getElementById(`product-${dimension}-min`);
        const maxSlider = document.getElementById(`product-${dimension}-max`);
        const minInput = document.getElementById(`product-${dimension}-min-input`);
        const maxInput = document.getElementById(`product-${dimension}-max-input`);
        if (minSlider && maxSlider) {
          minSlider.value = minSlider.min;
          maxSlider.value = maxSlider.max;
          if (minInput) minInput.value = minSlider.min;
          if (maxInput) maxInput.value = maxSlider.max;
          this.updateDimensionSliderTrack(dimension);
        }
      });
    }

    showMobileFilters() {
      if (this.mobileFilterOverlay) {
        this.mobileFilterOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    }

    hideMobileFilters() {
      if (this.mobileFilterOverlay) {
        this.mobileFilterOverlay.classList.remove('active');
        document.body.style.overflow = '';
        this.applyFilters();
      }
    }

    toggleAccordion(titleElement) {
      const accordionType = titleElement.dataset.accordion;
      const content = document.querySelector(`[data-accordion-content="${accordionType}"]`);
      const icon = titleElement.querySelector('.accordion-icon');
      if (!content || !icon) return;
      const isOpen = content.style.display !== 'none';
      if (isOpen) {
        content.style.display = 'none';
        icon.textContent = '+';
        icon.style.transform = 'rotate(0deg)';
      } else {
        content.style.display = 'block';
        icon.textContent = '−';
        icon.style.transform = 'rotate(0deg)';
      }
    }

    dispatchFiltersAppliedEvent() {
      const event = new CustomEvent('productFiltersApplied', {
        detail: { ...this.filters },
        bubbles: true
      });
      document.dispatchEvent(event);
    }

    saveFiltersToURL() {
      const url = new URL(window.location);
      url.searchParams.delete('pfilters');
      const activeFilters = {};
      let has = false;

      ['burglary_grade', 'fire_resistance', 'product_type'].forEach(t => {
        if (this.filters[t].length > 0) {
          activeFilters[t] = this.filters[t];
          has = true;
        }
      });
      ['price_range', 'depth_range', 'width_range', 'height_range', 'weight_range'].forEach(t => {
        const f = this.filters[t];
        if (f.min !== null || f.max !== null) {
          activeFilters[t] = f;
          has = true;
        }
      });
      if (has) url.searchParams.set('pfilters', btoa(JSON.stringify(activeFilters)));
      window.history.replaceState({}, '', url);
    }

    restoreFiltersFromURL() {
      const urlParams = new URLSearchParams(window.location.search);
      const filtersParam = urlParams.get('pfilters');
      if (!filtersParam) return;
      try {
        const saved = JSON.parse(atob(filtersParam));
        Object.keys(saved).forEach(k => {
          if (this.filters[k] !== undefined) this.filters[k] = saved[k];
        });
        this.updateUIFromFilters();
        setTimeout(() => this.applyFilters(), 100);
      } catch(e){}
    }

    updateUIFromFilters() {
      this.checkboxes?.forEach(checkbox => {
        const type = checkbox.dataset.filterType;
        const value = checkbox.value;
        checkbox.checked = this.filters[type]?.includes(value) || false;
      });
      const pr = this.filters.price_range;
      if (pr) {
        const minS = document.getElementById('product-price-min');
        const maxS = document.getElementById('product-price-max');
        const minI = document.getElementById('product-price-min-input');
        const maxI = document.getElementById('product-price-max-input');
        if (minS && maxS) {
          if (pr.min !== null) {
            minS.value = pr.min;
            if (minI) minI.value = pr.min;
          }
          if (pr.max !== null) {
            maxS.value = pr.max;
            if (maxI) maxI.value = pr.max;
          }
          this.updatePriceSliderTrack();
        }
      }
      ['depth','width','height','weight'].forEach(dim=>{
        const fr = this.filters[`${dim}_range`];
        const minS = document.getElementById(`product-${dim}-min`);
        const maxS = document.getElementById(`product-${dim}-max`);
        const minI = document.getElementById(`product-${dim}-min-input`);
        const maxI = document.getElementById(`product-${dim}-max-input`);
        if (minS && maxS && fr) {
          if (fr.min !== null) {
            minS.value = fr.min;
            if (minI) minI.value = fr.min;
          }
          if (fr.max !== null) {
            maxS.value = fr.max;
            if (maxI) maxI.value = fr.max;
          }
          this.updateDimensionSliderTrack(dim);
        }
      });
      this.updateFilterCount();
    }

    initStickyFilterButton() {
      if (window.innerWidth <= 768) {
        const btn = document.getElementById('mobile-product-filter-btn');
        const section = document.querySelector('.product-grid-section');
        if (!btn || !section) return;
        const handleScroll = () => {
          const rect = section.getBoundingClientRect();
          const pagination = document.getElementById('product-pagination-container');
          const buttonHeight = 48;
          const bottomOffset = 20;
          const isInSection = rect.top <= window.innerHeight && rect.bottom > buttonHeight + bottomOffset;
          if (isInSection) {
            let hide = false;
            if (pagination) {
              const pr = pagination.getBoundingClientRect();
              const buttonBottom = window.innerHeight - bottomOffset;
              const paginationTop = pr.top;
              if (paginationTop < buttonBottom && pr.bottom > buttonBottom - buttonHeight) hide = true;
            }
            if (hide) {
              btn.style.display = 'none';
            } else {
              if (rect.bottom <= window.innerHeight) {
                btn.style.display = 'none';
              } else {
                btn.style.position = 'fixed';
                btn.style.bottom = bottomOffset + 'px';
                btn.style.top = 'auto';
                btn.style.display = 'flex';
              }
            }
          } else {
            btn.style.display = 'none';
          }
        };
        window.addEventListener('scroll', this.debounce(handleScroll, 10));
        window.addEventListener('resize', this.debounce(() => {
          if (window.innerWidth <= 768) handleScroll();
        }, 250));
        handleScroll();
      }
    }
  }

  window.productFilters = new ProductFilters();
});
