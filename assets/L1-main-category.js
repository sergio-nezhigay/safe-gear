class L1MainCategoryFilters {
    constructor() {
      this.currencySymbol = '$';
      this.filters = {
        burglary_grade: [],
        fire_resistance: [],
        product_type: [],
        price_range: { min: null, max: null },
        depth_range: { min: null, max: null },
        width_range: { min: null, max: null },
        height_range: { min: null, max: null },
        weight_range: { min: null, max: null },
        variant_weight_range: { min: null, max: null }
      };
      
      this.allProducts = [];
      this.filteredProducts = [];
      this.currentPage = 1;
      this.itemsPerPage = 12;
      this.debounceTimer = null;
      this.isFiltering = false;
      this.filterCache = new Map();
      
      this.init();
    }
    
    init() {
      this.cacheDOM();
      this.initCurrency();
  
      // Detect server-side pagination and read per-page from dataset
      this.hasServerPagination =
        (this.productsGrid?.dataset?.serverPagination === 'true') ||
        (this.pagination?.dataset?.serverPagination === 'true');
  
      const perPageAttr = parseInt(this.productsGrid?.dataset?.productsPerPage || '0', 10);
      if (!isNaN(perPageAttr) && perPageAttr > 0) {
        this.itemsPerPage = perPageAttr;
      }
  
      this.loadProducts();
      this.bindEvents();
      this.initializeSliders();
      this.initializeAccordions();
      this.initializeMobileFilters();
      this.renderProducts();
      this.updateResultsCount();
      this.updatePagination();
      this.updateFilterCount();
      this.restoreFiltersFromURL();
      this.enhanceServerPaginationLinks();
    }
    
    cacheDOM() {
      this.subcategoriesGrid = document.getElementById('subcategories-grid');
      this.productsGrid = document.getElementById('products-grid');
      this.filtersContainer = document.querySelector('.filters-container');
      this.pagination = document.getElementById('pagination-container');
      this.resultsInfo = document.getElementById('results-info');
      this.resultsCount = document.getElementById('results-count');
      
      this.checkboxes = document.querySelectorAll('input[type="checkbox"][data-filter-type]');
      this.priceSliders = document.querySelectorAll('#price-min,#price-max');
      this.dimensionSliders = document.querySelectorAll('.dimension-slider');
      this.priceInputs = document.querySelectorAll('#price-min-input,#price-max-input');
      this.dimensionInputs = document.querySelectorAll('.dimension-input');
      this.clearFiltersBtn = document.getElementById('clear-filters');
      
      this.mobileFilterBtn = document.getElementById('mobile-filter-btn');
      this.mobileFilterOverlay = document.getElementById('mobile-filter-overlay');
      this.mobileFilterClose = document.getElementById('mobile-filter-close');
      this.mobileApplyBtn = document.getElementById('mobile-apply-filters');
      this.mobileClearBtn = document.getElementById('mobile-clear-filters');
      this.activeFilterCount = document.getElementById('active-filter-count');
      
      this.accordionTitles = document.querySelectorAll('.filter-group-title[data-accordion]');
    }
    
    initCurrency() {
      // Extract currency symbol from Shopify's formatted price
      if (window.L1FilterConfig?.sampleFormattedPrice) {
        const formattedPrice = window.L1FilterConfig.sampleFormattedPrice;
        // Extract currency symbol by removing the "1.00" part and spaces
        this.currencySymbol = formattedPrice.replace(/[\d\s.,]/g, '').trim();
        this.currencyPosition = formattedPrice.indexOf('1') === 0 ? 'after' : 'before';
      }
      
      // Fallback: try to extract from existing price labels
      if (!this.currencySymbol || this.currencySymbol === '') {
        const priceLabel = document.querySelector('.price-min-label, .price-max-label');
        if (priceLabel) {
          const priceText = priceLabel.textContent;
          this.currencySymbol = priceText.replace(/[\d\s.,]/g, '').trim();
          this.currencyPosition = /^\d/.test(priceText.trim()) ? 'after' : 'before';
        }
      }
      
      // Final fallback
      if (!this.currencySymbol || this.currencySymbol === '') {
        this.currencySymbol = '$';
        this.currencyPosition = 'before';
      }
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
      
      this.allProducts = Array.from(productCards).map((card, index) => {
        const burglaryGrade = card.getAttribute('data-burglary-grade') || '';
        const fireResistance = card.getAttribute('data-fire-resistance') || '';
        const productType = card.getAttribute('data-product-type') || '';
        
        return {
          element: card,
          data: {
            burglary_grade: burglaryGrade,
            fire_resistance: fireResistance,
            product_type: productType,
            price: parseFloat(card.getAttribute('data-price')) || 0,
            depth: parseFloat(card.getAttribute('data-depth')) || 0,
            width: parseFloat(card.getAttribute('data-width')) || 0,
            height: parseFloat(card.getAttribute('data-height')) || 0,
            weight: parseFloat(card.getAttribute('data-weight')) || 0,
            variant_weight: parseFloat(card.getAttribute('data-variant-weight')) || 0,
            collection_handle: card.getAttribute('data-collection-handle') || ''
          }
        };
      });
      
      
      this.filteredProducts = [...this.allProducts];
    }
    
    initializeSliders() {
      this.updatePriceSliderTrack();
      ['depth', 'width', 'height', 'weight', 'variant_weight'].forEach(dimension => {
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
      const mobileFilterContent = document.querySelector('.mobile-filter-content');
      
      if (filtersContainer && mobileFilterContent && window.innerWidth <= 768) {
        mobileFilterContent.innerHTML = filtersContainer.innerHTML;
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
      const minSlider = document.getElementById('price-min');
      const maxSlider = document.getElementById('price-max');
      const minInput = document.getElementById('price-min-input');
      const maxInput = document.getElementById('price-max-input');
      
      if (!minSlider || !maxSlider) return;
      
      let minVal = parseInt(minSlider.value);
      let maxVal = parseInt(maxSlider.value);
      
      if (minVal >= maxVal) {
        minVal = maxVal - 1;
        minSlider.value = minVal;
      }
      
      this.filters.price_range.min = minVal;
      this.filters.price_range.max = maxVal;
      
      if (minInput) minInput.value = this.formatInputPrice(minVal);
      if (maxInput) maxInput.value = this.formatInputPrice(maxVal);
      
      this.updatePriceSliderTrack();
      this.applyFilters();
      this.updateFilterCount();
    }
    
    handleDimensionSlider(slider) {
      const dimension = slider.id.split('-')[0];
      const type = slider.id.split('-')[1];
      
      const minSlider = document.getElementById(`${dimension}-min`);
      const maxSlider = document.getElementById(`${dimension}-max`);
      const minInput = document.getElementById(`${dimension}-min-input`);
      const maxInput = document.getElementById(`${dimension}-max-input`);

      if (!minSlider || !maxSlider) return;

      let minVal = parseFloat(minSlider.value);
      let maxVal = parseFloat(maxSlider.value);

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
      const isMin = input.classList.contains('price-min-input');
      // Remove currency symbol and any non-digit characters except dots and commas
      let value = input.value.replace(new RegExp(`[^\\d.,]`, 'g'), '');
      value = parseInt(value) || 0;
      
      if (isMin) {
        this.filters.price_range.min = value;
        const slider = document.getElementById('price-min');
        if (slider) slider.value = value;
      } else {
        this.filters.price_range.max = value;
        const slider = document.getElementById('price-max');
        if (slider) slider.value = value;
      }
      
      input.value = this.formatInputPrice(value);
      
      this.updatePriceSliderTrack();
      this.applyFilters();
      this.updateFilterCount();
    }
    
    handleDimensionInput(input) {
      const classes = input.className;
      const dimension = classes.match(/(depth|width|height|weight|variant_weight)/)[0];
      const isMin = classes.includes('min');
      const value = parseInt(input.value) || 0;
      
      if (isMin) {
        this.filters[`${dimension}_range`].min = value;
        const slider = document.getElementById(`${dimension}-min`);
        if (slider) slider.value = value;
      } else {
        this.filters[`${dimension}_range`].max = value;
        const slider = document.getElementById(`${dimension}-max`);
        if (slider) slider.value = value;
      }
      
      this.updateDimensionSliderTrack(dimension);
      this.applyFilters();
      this.updateFilterCount();
    }
    
    updatePriceSliderTrack() {
      const minSlider = document.getElementById('price-min');
      const maxSlider = document.getElementById('price-max');
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
      const rounded = Math.round(price / 100);
      return this.currencyPosition === 'after' ? 
        `${rounded} ${this.currencySymbol}` : 
        `${this.currencySymbol}${rounded}`;
    }
    
    formatPriceCompact(price) {
      const rounded = Math.round(price / 100);
      return this.currencyPosition === 'after' ? 
        `${rounded} ${this.currencySymbol}` : 
        `${this.currencySymbol}${rounded}`;
    }
    
    formatInputPrice(value) {
      return this.currencyPosition === 'after' ? 
        `${value} ${this.currencySymbol}` : 
        `${this.currencySymbol}${value}`;
    }
    
    updateDimensionSliderTrack(dimension) {
      const minSlider = document.getElementById(`${dimension}-min`);
      const maxSlider = document.getElementById(`${dimension}-max`);
      const track = document.querySelector(`.${dimension}-range-track`);

      if (!minSlider || !maxSlider || !track) return;

      const min = parseFloat(minSlider.min);
      const max = parseFloat(maxSlider.max);
      const minVal = parseFloat(minSlider.value);
      const maxVal = parseFloat(maxSlider.value);
      
      const minPercent = ((minVal - min) / (max - min)) * 100;
      const maxPercent = ((maxVal - min) / (max - min)) * 100;
      
      track.style.left = minPercent + '%';
      track.style.width = (maxPercent - minPercent) + '%';
      
      // Update labels
      this.updateDimensionLabels(dimension, minVal, maxVal);
    }
  
    updateDimensionLabels(dimension, minVal, maxVal) {
      const minLabel = document.querySelector(`.${dimension}-min-label`);
      const maxLabel = document.querySelector(`.${dimension}-max-label`);
      
      if (minLabel) minLabel.textContent = minVal;
      if (maxLabel) maxLabel.textContent = maxVal;
    }
    
    applyFilters() {
      if (this.isFiltering) return;
      this.isFiltering = true;
      
      const cacheKey = this.createCacheKey();
      
      requestAnimationFrame(() => {
        if (this.filterCache.has(cacheKey)) {
          this.filteredProducts = this.filterCache.get(cacheKey);
        } else {
          this.filteredProducts = this.allProducts.filter(product => {
            return this.matchesFilters(product.data);
          });
          
          if (this.filterCache.size > 50) {
            this.filterCache.clear();
          }
          this.filterCache.set(cacheKey, [...this.filteredProducts]);
        }
        
        if (!this.hasActiveFilters() && this.filteredProducts.length === 0 && this.allProducts.length > 0) {
          this.filteredProducts = [...this.allProducts];
        }
        this.currentPage = 1;
        this.updateFilterDependencies();
        this.renderProducts();
        this.updateResultsCount();
        this.updatePagination();
        this.saveFiltersToURL();
        this.enhanceServerPaginationLinks();
        this.dispatchFiltersAppliedEvent();
        
        this.isFiltering = false;
      });
    }
    
    createCacheKey() {
      return JSON.stringify(this.filters);
    }
    
    updateFilterDependencies() {
      this.updateAvailableSecurityFilters('burglary_grade', 'fire_resistance');
      this.updateAvailableSecurityFilters('fire_resistance', 'burglary_grade');
    }
    
    updateAvailableSecurityFilters(currentFilterType, dependentFilterType) {
      const availableValues = new Set();
      
      this.allProducts.forEach(product => {
        const currentFilters = this.filters[currentFilterType];
        if (currentFilters.length === 0 || currentFilters.includes(product.data[currentFilterType])) {
          const dependentValue = product.data[dependentFilterType];
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
  
      const dimensions = ['depth', 'width', 'height', 'weight', 'variant_weight'];
      for (const dim of dimensions) {
        const filter = this.filters[`${dim}_range`];
        if (filter.min !== null && filter.max !== null) {
          if (data[dim] > 0 && (data[dim] < filter.min || data[dim] > filter.max)) {
            return false;
          }
        }
      }
      return true;
    }
    
    renderProducts() {
      if (!this.productsGrid) return;
      
      const pageProducts = this.hasServerPagination
        ? this.filteredProducts
        : this.filteredProducts.slice((this.currentPage - 1) * this.itemsPerPage, this.currentPage * this.itemsPerPage);
  
      const pageElements = new Set(pageProducts.map(p => p.element));
      
      this.allProducts.forEach(product => {
        const shouldShow = pageElements.has(product.element);
        const currentDisplay = product.element.style.display;
        
        if (shouldShow && currentDisplay === 'none') {
          product.element.style.display = 'flex';
        } else if (!shouldShow && currentDisplay !== 'none') {
          product.element.style.display = 'none';
        }
      });
      
      this.toggleNoResults(this.filteredProducts.length === 0);
    }
    
    toggleNoResults(show) {
      let noResultsElement = document.getElementById('no-results');
      if (!noResultsElement) return;
      noResultsElement.style.display = show ? 'block' : 'none';
    }
    
    updateFilterCount() {
      let count = 0;
      
      ['burglary_grade', 'fire_resistance', 'product_type'].forEach(filterType => {
        count += this.filters[filterType].length;
      });
      
      ['price_range', 'depth_range', 'width_range', 'height_range', 'weight_range', 'variant_weight_range'].forEach(filterType => {
        const filter = this.filters[filterType];
        if (filter.min !== null || filter.max !== null) {
          count++;
        }
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
      this.filterCache.clear();
      
      this.filters = {
        burglary_grade: [],
        fire_resistance: [],
        product_type: [],
        price_range: { min: null, max: null },
        depth_range: { min: null, max: null },
        width_range: { min: null, max: null },
        height_range: { min: null, max: null },
        weight_range: { min: null, max: null },
        variant_weight_range: { min: null, max: null }
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
      this.updateFilterDependencies();
      this.renderProducts();
      this.updateResultsCount();
      this.updatePagination();
      this.saveFiltersToURL();
      this.dispatchFiltersAppliedEvent();
      this.updateFilterCount();
    }
  
    updateResultsCount() {
      const count = this.filteredProducts.length;
      if (this.resultsCount) {
        this.resultsCount.textContent = `${count} ${count === 1 ? 'product' : 'products'} found`;
      }
      if (this.resultsInfo) {
        this.resultsInfo.style.display = count > 0 ? 'block' : 'none';
      }
    }
  
    updatePagination() {
      if (!this.pagination) return;
  
      if (this.hasServerPagination) {
        // Use server-rendered links; just ensure they carry filters
        this.pagination.style.display = '';
        this.enhanceServerPaginationLinks();
        return;
      }
      
      const totalItems = this.filteredProducts.length;
      const totalPages = Math.ceil(totalItems / this.itemsPerPage);
      
      if (totalPages <= 1) {
        this.pagination.style.display = 'none';
        return;
      }
      
      if (this.currentPage > totalPages) {
        this.currentPage = 1;
      }
      
      this.pagination.style.display = 'flex';
      this.pagination.innerHTML = this.generatePaginationHTML(totalPages);
      
      // Bind pagination events
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
  
    generatePaginationHTML(totalPages) {
      let html = '';
      
      // Previous button
      if (this.currentPage > 1) {
        html += `<button class="pagination-btn" data-page="${this.currentPage - 1}">‹ Previous</button>`;
      }
      
      // Page numbers
      const maxVisiblePages = 5;
      const halfVisible = Math.floor(maxVisiblePages / 2);
      let startPage = Math.max(1, this.currentPage - halfVisible);
      let endPage = Math.min(totalPages, this.currentPage + halfVisible);
      
      // Adjust range if we don't have enough pages
      if (endPage - startPage + 1 < maxVisiblePages) {
        if (startPage === 1) {
          endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        } else {
          startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
      }
      
      // First page + ellipsis
      if (startPage > 1) {
        html += `<button class="pagination-btn" data-page="1">1</button>`;
        if (startPage > 2) {
          html += `<span class="pagination-ellipsis">...</span>`;
        }
      }
      
      // Page number buttons
      for (let i = startPage; i <= endPage; i++) {
        const isActive = i === this.currentPage;
        html += `<button class="pagination-btn ${isActive ? 'pagination-current' : ''}" data-page="${i}">${i}</button>`;
      }
      
      // Last page + ellipsis
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          html += `<span class="pagination-ellipsis">...</span>`;
        }
        html += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
      }
      
      // Next button
      if (this.currentPage < totalPages) {
        html += `<button class="pagination-btn" data-page="${this.currentPage + 1}">Next ›</button>`;
      }
      
      return html;
    }
  
    enhanceServerPaginationLinks() {
      if (!this.hasServerPagination) return;
      const links = document.querySelectorAll('.server-page-link');
      if (!links || links.length === 0) return;
  
      const encoded = this.buildActiveFiltersParam();
  
      links.forEach(link => {
        try {
          const url = new URL(link.href, window.location.origin);
          if (encoded) {
            url.searchParams.set('l1filters', encoded);
          } else {
            url.searchParams.delete('l1filters');
          }
          link.href = url.toString();
        } catch (e) {
          // ignore invalid URLs
        }
      });
    }
  
    buildActiveFiltersParam() {
      const activeFilters = {};
      let hasActive = false;
  
      ['burglary_grade', 'fire_resistance', 'product_type'].forEach(filterType => {
        if (this.filters[filterType] && this.filters[filterType].length > 0) {
          activeFilters[filterType] = this.filters[filterType];
          hasActive = true;
        }
      });
  
      ['price_range', 'depth_range', 'width_range', 'height_range', 'weight_range', 'variant_weight_range'].forEach(filterType => {
        const f = this.filters[filterType];
        if (f && (f.min !== null || f.max !== null)) {
          activeFilters[filterType] = f;
          hasActive = true;
        }
      });
  
      if (!hasActive) {
        return null;
      }
  
      try {
        return btoa(JSON.stringify(activeFilters));
      } catch (e) {
        return null;
      }
    }
  
    hasActiveFilters() {
      let active = false;
      ['burglary_grade', 'fire_resistance', 'product_type'].forEach(filterType => {
        if (this.filters[filterType] && this.filters[filterType].length > 0) active = true;
      });
      ['price_range', 'depth_range', 'width_range', 'height_range', 'weight_range', 'variant_weight_range'].forEach(filterType => {
        const f = this.filters[filterType];
        if (f && (f.min !== null || f.max !== null)) active = true;
      });
      return active;
    }
  
    scrollToTop() {
      const section = document.querySelector('.L1-main-category-section');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    
    resetSliders() {
      const priceMin = document.getElementById('price-min');
      const priceMax = document.getElementById('price-max');
      const priceMinInput = document.getElementById('price-min-input');
      const priceMaxInput = document.getElementById('price-max-input');
      
      if (priceMin && priceMax) {
        priceMin.value = priceMin.min;
        priceMax.value = priceMax.max;
        if (priceMinInput) priceMinInput.value = this.formatInputPrice(priceMin.min);
        if (priceMaxInput) priceMaxInput.value = this.formatInputPrice(priceMax.max);
        this.updatePriceSliderTrack();
      }
      
      ['depth', 'width', 'height', 'weight', 'variant_weight'].forEach(dimension => {
        const minSlider = document.getElementById(`${dimension}-min`);
        const maxSlider = document.getElementById(`${dimension}-max`);
        const minInput = document.getElementById(`${dimension}-min-input`);
        const maxInput = document.getElementById(`${dimension}-max-input`);
        
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
      } else {
        content.style.display = 'block';
        icon.textContent = '−';
      }
    }
    
    dispatchFiltersAppliedEvent() {
      const event = new CustomEvent('L1FiltersApplied', {
        detail: { ...this.filters },
        bubbles: true
      });
      document.dispatchEvent(event);
    }
    
    saveFiltersToURL() {
      const url = new URL(window.location);
      url.searchParams.delete('l1filters');
      
      const activeFilters = {};
      let hasActiveFilters = false;
      
      ['burglary_grade', 'fire_resistance', 'product_type'].forEach(filterType => {
        if (this.filters[filterType].length > 0) {
          activeFilters[filterType] = this.filters[filterType];
          hasActiveFilters = true;
        }
      });
      
      ['price_range', 'depth_range', 'width_range', 'height_range', 'weight_range', 'variant_weight_range'].forEach(filterType => {
        const filter = this.filters[filterType];
        if (filter.min !== null || filter.max !== null) {
          activeFilters[filterType] = filter;
          hasActiveFilters = true;
        }
      });
      
      if (hasActiveFilters) {
        url.searchParams.set('l1filters', btoa(JSON.stringify(activeFilters)));
      }
      
      window.history.replaceState({}, '', url);
    }
    
    restoreFiltersFromURL() {
      const urlParams = new URLSearchParams(window.location.search);
      const filtersParam = urlParams.get('l1filters');
      
      if (!filtersParam) return;
      
      try {
        const savedFilters = JSON.parse(atob(filtersParam));
        
        Object.keys(savedFilters).forEach(filterType => {
          if (this.filters[filterType] !== undefined) {
            this.filters[filterType] = savedFilters[filterType];
          }
        });
        
        this.updateUIFromFilters();
        
        setTimeout(() => {
          this.applyFilters();
        }, 100);
      } catch (error) {
        console.warn('Could not restore L1 filters from URL:', error);
      }
    }
    
    updateUIFromFilters() {
      this.checkboxes?.forEach(checkbox => {
        const filterType = checkbox.dataset.filterType;
        const value = checkbox.value;
        checkbox.checked = this.filters[filterType]?.includes(value) || false;
      });
      
      ['price_range', 'depth_range', 'width_range', 'height_range', 'weight_range', 'variant_weight_range'].forEach(filterType => {
        const dimension = filterType.replace('_range', '');
        const filter = this.filters[filterType];
        
        if (filter.min !== null || filter.max !== null) {
          const minSlider = document.getElementById(`${dimension}-min`);
          const maxSlider = document.getElementById(`${dimension}-max`);
          const minInput = document.getElementById(`${dimension}-min-input`);
          const maxInput = document.getElementById(`${dimension}-max-input`);
          
          if (minSlider && maxSlider) {
            if (filter.min !== null) {
              minSlider.value = filter.min;
              if (minInput) {
                minInput.value = dimension === 'price' ? this.formatInputPrice(filter.min) : filter.min;
              }
            }
            if (filter.max !== null) {
              maxSlider.value = filter.max;
              if (maxInput) {
                maxInput.value = dimension === 'price' ? this.formatInputPrice(filter.max) : filter.max;
              }
            }
            
            if (dimension === 'price') {
              this.updatePriceSliderTrack();
            } else {
              this.updateDimensionSliderTrack(dimension);
            }
          }
        }
      });
      
      this.updateFilterCount();
    }
    
    initStickyFilterButton() {
      if (window.innerWidth <= 768) {
        const mobileFilterBtn = document.getElementById('mobile-filter-btn');
        const section = document.querySelector('.L1-main-category-section');
        if (!mobileFilterBtn || !section) return;
        
        const handleScroll = () => {
          const sectionRect = section.getBoundingClientRect();
          const buttonHeight = 48;
          const bottomOffset = 20;
          
          const isInSection = sectionRect.top <= window.innerHeight && sectionRect.bottom > buttonHeight + bottomOffset;
          
          if (isInSection) {
            if (sectionRect.bottom <= window.innerHeight) {
              mobileFilterBtn.style.display = 'none';
            } else {
              mobileFilterBtn.style.position = 'fixed';
              mobileFilterBtn.style.bottom = bottomOffset + 'px';
              mobileFilterBtn.style.top = 'auto';
              mobileFilterBtn.style.display = 'flex';
            }
          } else {
            mobileFilterBtn.style.display = 'none';
          }
        };
        
        window.addEventListener('scroll', this.debounce(handleScroll, 10));
        window.addEventListener('resize', this.debounce(() => {
          if (window.innerWidth <= 768) {
            handleScroll();
          }
        }, 250));
        
        handleScroll();
      }
    }
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    window.L1MainCategoryFilters = new L1MainCategoryFilters();
  });
  