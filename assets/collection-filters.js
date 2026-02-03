class CollectionFilters {
  constructor() {
    this.currencySymbol = '$';
    this.filters = {
      burglary_grade: [],
      fire_resistance: [],
      category: [],
      price_range: { min: null, max: null },
      depth_range: { min: null, max: null },
      width_range: { min: null, max: null },
      height_range: { min: null, max: null },
      weight_range: { min: null, max: null },
      variant_weight_range: { min: null, max: null },
    };

    this.allCollections = [];
    this.filteredCollections = [];
    this.currentPage = 1;
    this.itemsPerPage =
      parseInt(
        document
          .querySelector('[data-collections-per-page]')
          ?.getAttribute('data-collections-per-page')
      ) || 12;
    this.showPagination =
      document
        .querySelector('[data-show-pagination]')
        ?.getAttribute('data-show-pagination') === 'true';
    this.productsCurrentPage = 1;
    this.productsItemsPerPage =
      parseInt(
        document
          .getElementById('products-grid')
          ?.getAttribute('data-products-per-page')
      ) || 16;
    this.productsServerPagination =
      document
        .getElementById('products-grid')
        ?.getAttribute('data-server-pagination') === 'true';
    this.isFiltering = false;
    this.debounceTimer = null;
    this.filterCache = new Map();

    this.init();
  }

  init() {
    this.cacheDOM();
    this.initCurrency();
    this.loadCollections();
    this.bindEvents();
    this.initializeSliders();
    this.initializeAccordions();
    this.initializeMobileFilters();
    this.renderCollections();
    this.updatePagination();
    this.updateResultsCount();
    this.renderProducts();
    this.updateProductsPagination();
    this.updateFilterDependencies();
    this.restoreFiltersFromURL();
  }

  cacheDOM() {
    this.collectionsGrid = document.querySelector('.collections-grid');
    this.filtersContainer = document.querySelector('.filters-container');
    this.resultsInfo = document.querySelector('.results-info');
    this.pagination = document.querySelector('.pagination');
    this.productsGrid = document.getElementById('products-grid');
    this.productsPagination = document.getElementById(
      'products-pagination-container'
    );

    this.checkboxes = document.querySelectorAll(
      'input[type="checkbox"][data-filter-type]'
    );
    this.priceSliders = document.querySelectorAll('.price-slider');
    this.dimensionSliders = document.querySelectorAll('.dimension-slider');
    this.priceInputs = document.querySelectorAll('.price-input');
    this.dimensionInputs = document.querySelectorAll('.dimension-input');
    this.clearFiltersBtn = document.querySelector('.clear-filters-btn');

    this.mobileFilterBtn = document.getElementById('mobile-filter-btn');
    this.mobileFilterOverlay = document.getElementById('mobile-filter-overlay');
    this.mobileFilterClose = document.getElementById('mobile-filter-close');
    this.mobileApplyBtn = document.getElementById('mobile-apply-filters');
    this.mobileClearBtn = document.getElementById('mobile-clear-filters');
    this.activeFilterCount = document.getElementById('active-filter-count');

    this.showMoreCategoriesBtn = document.querySelector(
      '.show-more-categories'
    );
    this.categoryCheckboxes = document.querySelectorAll('.category-checkbox');
  }

  initCurrency() {
    // Extract currency symbol from actual product prices displayed on the page
    const productPrices = [
      // Try collection card prices first
      ...document.querySelectorAll('.collection-price .price-value'),
      // Then try product card prices
      ...document.querySelectorAll('.product-price'),
      // Also try price labels from filters
      ...document.querySelectorAll('.price-min-label, .price-max-label'),
    ];

    let foundCurrency = false;

    for (const priceElement of productPrices) {
      if (priceElement && priceElement.textContent.trim()) {
        const priceText = priceElement.textContent.trim();

        // Skip if the price is just numbers or contains no currency info
        if (/^[\d.,\s]+$/.test(priceText)) continue;

        // Extract currency symbol by removing all digits, spaces, dots, commas
        const extractedSymbol = priceText.replace(/[\d\s.,]/g, '').trim();

        if (extractedSymbol && extractedSymbol.length > 0) {
          this.currencySymbol = extractedSymbol;

          // Determine position: if price starts with digits, currency is after
          this.currencyPosition = /^\d/.test(priceText) ? 'after' : 'before';

          foundCurrency = true;
          break;
        }
      }
    }

    // Fallback to Shopify configuration if no currency found in prices
    if (!foundCurrency && window.L2FilterConfig?.currency) {
      const currency = window.L2FilterConfig.currency;

      const currencyMap = {
        USD: '$',
        EUR: '€',
        GBP: '£',
        JPY: '¥',
        CAD: 'C$',
        AUD: 'A$',
        CHF: 'CHF',
        SEK: 'kr',
        DKK: 'kr',
        NOK: 'kr',
        PLN: 'zł',
        CZK: 'Kč',
        HUF: 'Ft',
        RUB: '₽',
        CNY: '¥',
        INR: '₹',
        BRL: 'R$',
        MXN: '$',
        ZAR: 'R',
        THB: '฿',
        SGD: 'S$',
        HKD: 'HK$',
        KRW: '₩',
      };

      this.currencySymbol = currencyMap[currency] || currency;
      this.currencyPosition = 'before'; // Default position
    }

    // Final fallback
    if (!this.currencySymbol || this.currencySymbol === '') {
      this.currencySymbol = '$';
      this.currencyPosition = 'before';
    }
  }

  bindEvents() {
    this.checkboxes?.forEach((checkbox) => {
      checkbox.addEventListener('change', () =>
        this.handleCheckboxChange(checkbox)
      );
    });

    this.priceSliders?.forEach((slider) => {
      slider.addEventListener(
        'input',
        this.debounce(() => this.handlePriceSlider(), 250)
      );
    });

    this.dimensionSliders?.forEach((slider) => {
      slider.addEventListener(
        'input',
        this.debounce(() => this.handleDimensionSlider(slider), 250)
      );
    });

    this.priceInputs?.forEach((input) => {
      input.addEventListener('change', () => this.handlePriceInput(input));
      input.addEventListener(
        'keyup',
        this.debounce(() => this.handlePriceInput(input), 300)
      );
    });

    this.dimensionInputs?.forEach((input) => {
      input.addEventListener('change', () => this.handleDimensionInput(input));
      input.addEventListener(
        'keyup',
        this.debounce(() => this.handleDimensionInput(input), 300)
      );
    });

    this.clearFiltersBtn?.addEventListener('click', () =>
      this.clearAllFilters()
    );

    this.mobileFilterBtn?.addEventListener('click', () =>
      this.showMobileFilters()
    );
    this.mobileFilterClose?.addEventListener('click', () =>
      this.hideMobileFilters()
    );
    this.mobileFilterOverlay?.addEventListener('click', (e) => {
      if (e.target === this.mobileFilterOverlay) this.hideMobileFilters();
    });
    this.mobileApplyBtn?.addEventListener('click', () =>
      this.hideMobileFilters()
    );
    this.mobileClearBtn?.addEventListener('click', () =>
      this.clearAllFilters()
    );
    this.showMoreCategoriesBtn?.addEventListener('click', () =>
      this.toggleCategoriesVisibility()
    );
    document
      .querySelectorAll('.filter-group-title[data-accordion]')
      .forEach((title) => {
        title.addEventListener('click', () => this.toggleAccordion(title));
      });
  }

  debounce(func, wait) {
    return (...args) => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => func.apply(this, args), wait);
    };
  }

  loadCollections() {
    const collectionCards = document.querySelectorAll('.collection-card');
    this.allCollections = Array.from(collectionCards).map((card) => {
      return {
        element: card,
        data: {
          burglary_grade: card.getAttribute('data-burglary-grade') || '',
          fire_resistance: card.getAttribute('data-fire-resistance') || '',
          category: card.getAttribute('data-category') || '',
          price: parseFloat(card.getAttribute('data-price')) || 0,
          depth_min: parseFloat(card.getAttribute('data-depth-min')) || 0,
          depth_max: parseFloat(card.getAttribute('data-depth-max')) || 0,
          width_min: parseFloat(card.getAttribute('data-width-min')) || 0,
          width_max: parseFloat(card.getAttribute('data-width-max')) || 0,
          height_min: parseFloat(card.getAttribute('data-height-min')) || 0,
          height_max: parseFloat(card.getAttribute('data-height-max')) || 0,
        },
      };
    });

    this.filteredCollections = [...this.allCollections];

    const productCards = document.querySelectorAll('.product-card');
    this.allProducts = Array.from(productCards).map((card) => {
      return {
        element: card,
        data: {
          burglary_grade: card.getAttribute('data-burglary-grade') || '',
          fire_resistance: card.getAttribute('data-fire-resistance') || '',
          category: card.getAttribute('data-category') || '',
          price: parseFloat(card.getAttribute('data-price')) || 0,
          depth: parseFloat(card.getAttribute('data-depth')) || 0,
          width: parseFloat(card.getAttribute('data-width')) || 0,
          height: parseFloat(card.getAttribute('data-height')) || 0,
          weight: parseFloat(card.getAttribute('data-weight')) || 0,
          variant_weight: parseFloat(card.getAttribute('data-variant-weight')) || 0,
          collection_handle: card.getAttribute('data-collection-handle') || '',
        },
      };
    });

    this.filteredProducts = [...this.allProducts];
  }

  initializeSliders() {
    this.updatePriceSliderTrack();

    ['depth', 'width', 'height', 'weight', 'variant_weight'].forEach((dimension) => {
      this.updateDimensionSliderTrack(dimension);
    });
  }

  initializeAccordions() {
    const filterGroups = document.querySelectorAll('.filter-group');

    filterGroups.forEach((group, index) => {
      const content = group.querySelector('[data-accordion-content]');
      const icon = group.querySelector('.accordion-icon');

      if (!content || !icon) return;

      if (index === 0) {
        // Open first group
        content.style.display = 'block';
        icon.textContent = '−';
        icon.style.transform = 'rotate(0deg)';
      } else {
        // Close other groups
        content.style.display = 'none';
        icon.textContent = '+';
        icon.style.transform = 'rotate(0deg)';
      }
    });
  }

  initializeMobileFilters() {
    if (window.innerWidth <= 768) {
      this.setupMobileFilters();
    }

    window.addEventListener(
      'resize',
      this.debounce(() => {
        if (window.innerWidth <= 768) {
          this.setupMobileFilters();
          this.initMobileFilterVisibility();
        }
      }, 250)
    );

    this.initMobileFilterVisibility();
  }

  setupMobileFilters() {
    const filtersContainer = document.querySelector('.filters-container');
    const mobileFilterContent = document.querySelector(
      '.mobile-filter-content'
    );

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
      this.filters[filterType] = this.filters[filterType].filter(
        (v) => v !== value
      );
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
    const max = parseInt(minSlider.max);
    const minVal = parseInt(minSlider.value);
    const maxVal = parseInt(maxSlider.value);

    const minPercent = ((minVal - min) / (max - min)) * 100;
    const maxPercent = ((maxVal - min) / (max - min)) * 100;

    track.style.left = minPercent + '%';
    track.style.width = maxPercent - minPercent + '%';

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
    return `${rounded}`;
  }

  formatPriceCompact(price) {
    const rounded = Math.round(price / 100);
    return `${rounded}`;
  }

  formatInputPrice(value) {
    return this.currencyPosition === 'after'
      ? `${value} ${this.currencySymbol}`
      : `${this.currencySymbol}${value}`;
  }

  updateDimensionSliderTrack(dimension) {
    const minSlider = document.getElementById(`${dimension}-min`);
    const maxSlider = document.getElementById(`${dimension}-max`);
    const track = document.querySelector(`.${dimension}-range-track`);

    if (!minSlider || !maxSlider || !track) return;

    const min = parseFloat(minSlider.min);
    const max = parseFloat(minSlider.max);
    const minVal = parseFloat(minSlider.value);
    const maxVal = parseFloat(maxSlider.value);

    const minPercent = ((minVal - min) / (max - min)) * 100;
    const maxPercent = ((maxVal - min) / (max - min)) * 100;

    track.style.left = minPercent + '%';
    track.style.width = maxPercent - minPercent + '%';

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
      // Reset debug counters for each filter application
      window._heightFilterDebugCount = 0;
      window._heightFilterAcceptCount = 0;

      const heightFilterActive = this.filters.height_range.min !== null || this.filters.height_range.max !== null;

      if (this.filterCache.has(cacheKey)) {
        this.filteredCollections = this.filterCache.get(cacheKey);
      } else {
        this.filteredCollections = this.allCollections.filter((collection) => {
          return this.matchesFilters(collection.data);
        });

        if (this.filterCache.size > 50) {
          this.filterCache.clear();
        }
        this.filterCache.set(cacheKey, [...this.filteredCollections]);
      }

      this.filteredProducts = this.allProducts.filter((product) => {
        return this.matchesProductFilters(product.data);
      });

      this.currentPage = 1;
      this.productsCurrentPage = 1;
      this.updateFilterDependencies();
      this.updateResultsCount();
      this.renderCollections();
      this.updatePagination();
      this.renderProducts();
      this.updateProductsPagination();
      this.saveFiltersToURL();
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

    this.allCollections.forEach((collection) => {
      const currentFilters = this.filters[currentFilterType];
      if (
        currentFilters.length === 0 ||
        currentFilters.includes(collection.data[currentFilterType])
      ) {
        const dependentValue = collection.data[dependentFilterType];
        if (dependentValue && dependentValue.trim() !== '') {
          availableValues.add(dependentValue);
        }
      }
    });

    const checkboxes = document.querySelectorAll(
      `input[data-filter-type="${dependentFilterType}"]`
    );
    checkboxes.forEach((checkbox) => {
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
    if (this.filters.burglary_grade.length > 0) {
      if (!this.filters.burglary_grade.includes(data.burglary_grade)) {
        return false;
      }
    }

    if (this.filters.fire_resistance.length > 0) {
      if (!this.filters.fire_resistance.includes(data.fire_resistance)) {
        return false;
      }
    }

    if (this.filters.category.length > 0) {
      if (!this.filters.category.includes(data.category)) {
        return false;
      }
    }

    if (
      this.filters.price_range.min !== null &&
      data.price < this.filters.price_range.min
    ) {
      return false;
    }
    if (
      this.filters.price_range.max !== null &&
      data.price > this.filters.price_range.max
    ) {
      return false;
    }

    const dimensions = ['depth', 'width', 'height'];
    for (const dim of dimensions) {
      const filter = this.filters[`${dim}_range`];
      const dataMin = data[`${dim}_min`];
      const dataMax = data[`${dim}_max`];

      if (!dataMin && !dataMax) continue;

      if (filter.min !== null && dataMax < filter.min) {
        return false;
      }
      if (filter.max !== null && dataMin > filter.max) {
        return false;
      }
    }

    return true;
  }

  matchesProductFilters(data) {
    const debugHeight = this.filters.height_range.min !== null || this.filters.height_range.max !== null;
    let heightDebugInfo = null;

    if (this.filters.burglary_grade.length > 0) {
      if (!this.filters.burglary_grade.includes(data.burglary_grade)) {
        return false;
      }
    }

    if (this.filters.fire_resistance.length > 0) {
      if (!this.filters.fire_resistance.includes(data.fire_resistance)) {
        return false;
      }
    }

    if (this.filters.category.length > 0) {
      if (!this.filters.category.includes(data.category)) {
        return false;
      }
    }

    if (
      this.filters.price_range.min !== null &&
      data.price < this.filters.price_range.min
    ) {
      return false;
    }
    if (
      this.filters.price_range.max !== null &&
      data.price > this.filters.price_range.max
    ) {
      return false;
    }

    const dimensions = ['depth', 'width', 'height', 'weight', 'variant_weight'];
    for (const dim of dimensions) {
      const filter = this.filters[`${dim}_range`];
      const dataValue = data[dim];

      if (!dataValue) continue;

      if (dim === 'height' && debugHeight) {
        heightDebugInfo = {
          productHeight: dataValue,
          filterMin: filter.min,
          filterMax: filter.max,
          passesMin: filter.min === null || dataValue >= filter.min,
          passesMax: filter.max === null || dataValue <= filter.max
        };
      }

      if (filter.min !== null && dataValue < filter.min) {
        return false;
      }
      if (filter.max !== null && dataValue > filter.max) {
        return false;
      }
    }

    return true;
  }

  renderProducts() {
    if (!this.productsGrid) return;

    if (this.productsServerPagination) {
      this.allProducts.forEach((product) => {
        const shouldShow = this.filteredProducts.includes(product);
        product.element.style.display = shouldShow ? 'flex' : 'none';
      });
      return;
    }

    const startIndex =
      (this.productsCurrentPage - 1) * this.productsItemsPerPage;
    const endIndex = startIndex + this.productsItemsPerPage;
    const pageProducts = new Set(
      this.filteredProducts.slice(startIndex, endIndex).map((p) => p.element)
    );

    this.allProducts.forEach((product) => {
      const shouldShow =
        this.filteredProducts.includes(product) &&
        pageProducts.has(product.element);
      product.element.style.display = shouldShow ? 'flex' : 'none';
    });
  }

  renderCollections() {
    if (!this.collectionsGrid) return;

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const pageCollections = this.filteredCollections.slice(
      startIndex,
      endIndex
    );
    const pageCollectionElements = new Set(
      pageCollections.map((c) => c.element)
    );

    this.allCollections.forEach((collection) => {
      const shouldShow = pageCollectionElements.has(collection.element);
      const currentDisplay = collection.element.style.display;

      if (shouldShow && currentDisplay === 'none') {
        collection.element.style.display = 'flex';
      } else if (!shouldShow && currentDisplay !== 'none') {
        collection.element.style.display = 'none';
      }
    });

    this.toggleNoResults(this.filteredCollections.length === 0);
  }

  toggleNoResults(show) {
    let noResultsElement = document.querySelector('.no-results');

    if (show && !noResultsElement) {
      noResultsElement = document.createElement('div');
      noResultsElement.className = 'no-results';
      noResultsElement.innerHTML =
        '<p>No collections match your current filters.</p>';
      this.collectionsGrid?.appendChild(noResultsElement);
    } else if (!show && noResultsElement) {
      noResultsElement.remove();
    }
  }

  updateResultsCount() {
    if (!this.resultsInfo) return;

    const count = this.filteredCollections.length;
    const countElement = this.resultsInfo.querySelector('.results-count');

    if (countElement) {
      countElement.textContent = `Showing ${count} collection${
        count !== 1 ? 's' : ''
      }`;
    }
  }

  updatePagination() {
    if (!this.pagination) return;

    const totalItems = this.filteredCollections.length;
    const totalPages = Math.ceil(totalItems / this.itemsPerPage);

    if (!this.showPagination || totalPages <= 1) {
      this.pagination.style.display = 'none';
      return;
    }

    if (this.currentPage > totalPages) {
      this.currentPage = 1;
    }

    this.pagination.style.display = 'flex';
    this.pagination.innerHTML = this.generatePaginationHTML(totalPages);

    this.pagination.querySelectorAll('.pagination-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const page = parseInt(btn.dataset.page);
        if (page && page !== this.currentPage) {
          this.currentPage = page;
          this.renderCollections();
          this.updatePagination();
          this.scrollToTop();
        }
      });
    });
  }

  updateProductsPagination() {
    if (!this.productsPagination) return;

    const totalItems = this.filteredProducts.length;
    const totalPages = Math.ceil(totalItems / this.productsItemsPerPage);

    if (totalPages <= 1) {
      this.productsPagination.style.display = 'none';
      return;
    }

    if (this.productsCurrentPage > totalPages) {
      this.productsCurrentPage = 1;
    }

    this.productsPagination.style.display = 'flex';
    this.productsPagination.innerHTML =
      this.generateProductsPaginationHTML(totalPages);

    this.productsPagination
      .querySelectorAll('.pagination-btn')
      .forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const page = parseInt(btn.dataset.page);
          if (page && page !== this.productsCurrentPage) {
            this.productsCurrentPage = page;
            this.renderProducts();
            this.updateProductsPagination();
            this.scrollToTop();
          }
        });
      });
  }

  generateProductsPaginationHTML(totalPages) {
    let html = '';

    if (this.productsCurrentPage > 1) {
      html += `<button class="pagination-btn" data-page="${
        this.productsCurrentPage - 1
      }">‹ Previous</button>`;
    }

    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let startPage = Math.max(1, this.productsCurrentPage - halfVisible);
    let endPage = Math.min(totalPages, this.productsCurrentPage + halfVisible);

    if (endPage - startPage + 1 < maxVisiblePages) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      } else {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
    }

    if (startPage > 1) {
      html += `<button class="pagination-btn" data-page="1">1</button>`;
      if (startPage > 2) {
        html += `<span class="pagination-ellipsis">...</span>`;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      const isActive = i === this.productsCurrentPage;
      html += `<button class="pagination-btn ${
        isActive ? 'pagination-current' : ''
      }" data-page="${i}">${i}</button>`;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        html += `<span class="pagination-ellipsis">...</span>`;
      }
      html += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
    }

    if (this.productsCurrentPage < totalPages) {
      html += `<button class="pagination-btn" data-page="${
        this.productsCurrentPage + 1
      }">Next ›</button>`;
    }

    return html;
  }

  scrollToTop() {
    const section = document.querySelector('.collection-list-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  generatePaginationHTML(totalPages) {
    let html = '';

    if (this.currentPage > 1) {
      html += `<button class="pagination-btn" data-page="${
        this.currentPage - 1
      }">‹ Previous</button>`;
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
      if (startPage > 2) {
        html += `<span class="pagination-ellipsis">...</span>`;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      const isActive = i === this.currentPage;
      html += `<button class="pagination-btn ${
        isActive ? 'pagination-current' : ''
      }" data-page="${i}">${i}</button>`;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        html += `<span class="pagination-ellipsis">...</span>`;
      }
      html += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
    }

    if (this.currentPage < totalPages) {
      html += `<button class="pagination-btn" data-page="${
        this.currentPage + 1
      }">Next ›</button>`;
    }

    return html;
  }

  updateFilterCount() {
    let count = 0;

    ['burglary_grade', 'fire_resistance', 'category'].forEach((filterType) => {
      count += this.filters[filterType].length;
    });

    [
      'price_range',
      'depth_range',
      'width_range',
      'height_range',
      'weight_range',
    ].forEach((filterType) => {
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
      category: [],
      price_range: { min: null, max: null },
      depth_range: { min: null, max: null },
      width_range: { min: null, max: null },
      height_range: { min: null, max: null },
      weight_range: { min: null, max: null },
      variant_weight_range: { min: null, max: null },
    };

    this.checkboxes?.forEach((checkbox) => {
      checkbox.checked = false;
      const parentLabel = checkbox.closest('.filter-checkbox');
      if (parentLabel) {
        parentLabel.style.display = 'flex';
        checkbox.disabled = false;
      }
    });

    this.resetSliders();
    this.currentPage = 1;
    this.productsCurrentPage = 1;

    this.filteredCollections = [...this.allCollections];
    this.filteredProducts = [...this.allProducts];
    this.updateResultsCount();
    this.renderCollections();
    this.updatePagination();
    this.renderProducts();
    this.updateProductsPagination();
    this.updateFilterDependencies();
    this.saveFiltersToURL();
    this.dispatchFiltersAppliedEvent();
    this.updateFilterCount();
  }

  resetSliders() {
    const priceMin = document.getElementById('price-min');
    const priceMax = document.getElementById('price-max');
    const priceMinInput = document.getElementById('price-min-input');
    const priceMaxInput = document.getElementById('price-max-input');

    if (priceMin && priceMax) {
      priceMin.value = priceMin.min;
      priceMax.value = priceMax.max;
      if (priceMinInput)
        priceMinInput.value = this.formatInputPrice(priceMin.min);
      if (priceMaxInput)
        priceMaxInput.value = this.formatInputPrice(priceMax.max);
      this.updatePriceSliderTrack();
    }

    ['depth', 'width', 'height', 'weight', 'variant_weight'].forEach((dimension) => {
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

  toggleCategoriesVisibility() {
    if (!this.showMoreCategoriesBtn) return;

    const isExpanded =
      this.showMoreCategoriesBtn.classList.contains('expanded');

    const allCategories = document.querySelectorAll('.category-checkbox');
    const hiddenCategories = Array.from(allCategories).slice(8);

    if (isExpanded) {
      hiddenCategories.forEach((category) => {
        category.classList.add('category-hidden');
        category.style.display = 'none';
      });
      this.showMoreCategoriesBtn.textContent = 'Show More Categories';
      this.showMoreCategoriesBtn.classList.remove('expanded');
    } else {
      hiddenCategories.forEach((category) => {
        category.classList.remove('category-hidden');
        category.style.display = 'flex';
      });
      const showLessText =
        document
          .querySelector('[data-show-less-text]')
          ?.getAttribute('data-show-less-text') || 'Show Less Categories';
      this.showMoreCategoriesBtn.textContent = showLessText;
      this.showMoreCategoriesBtn.classList.add('expanded');
    }
  }

  toggleAccordion(titleElement) {
    const accordionType = titleElement.dataset.accordion;
    const content = document.querySelector(
      `[data-accordion-content="${accordionType}"]`
    );
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
    const event = new CustomEvent('filtersApplied', {
      detail: { ...this.filters },
      bubbles: true,
    });
    document.dispatchEvent(event);

    const collectionsEvent = new CustomEvent('collectionsFiltered', {
      detail: {
        filters: this.filters,
        visibleCollections: this.filteredCollections.length,
      },
      bubbles: true,
    });
    document.dispatchEvent(collectionsEvent);
  }

  saveFiltersToURL() {
    const url = new URL(window.location);
    url.searchParams.delete('filters');

    const activeFilters = {};
    let hasActiveFilters = false;

    ['burglary_grade', 'fire_resistance', 'category'].forEach((filterType) => {
      if (this.filters[filterType].length > 0) {
        activeFilters[filterType] = this.filters[filterType];
        hasActiveFilters = true;
      }
    });

    [
      'price_range',
      'depth_range',
      'width_range',
      'height_range',
      'weight_range',
    ].forEach((filterType) => {
      const filter = this.filters[filterType];
      if (filter.min !== null || filter.max !== null) {
        activeFilters[filterType] = filter;
        hasActiveFilters = true;
      }
    });

    if (hasActiveFilters) {
      url.searchParams.set('filters', btoa(JSON.stringify(activeFilters)));
    }

    window.history.replaceState({}, '', url);
  }

  restoreFiltersFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const filtersParam = urlParams.get('filters');

    if (!filtersParam) return;

    try {
      const savedFilters = JSON.parse(atob(filtersParam));

      Object.keys(savedFilters).forEach((filterType) => {
        if (this.filters[filterType]) {
          this.filters[filterType] = savedFilters[filterType];
        }
      });

      this.updateUIFromFilters();

      setTimeout(() => {
        this.applyFilters();
      }, 100);
    } catch (error) {
      console.warn('Could not restore filters from URL:', error);
    }
  }

  updateUIFromFilters() {
    this.checkboxes?.forEach((checkbox) => {
      const filterType = checkbox.dataset.filterType;
      const value = checkbox.value;
      checkbox.checked = this.filters[filterType]?.includes(value) || false;
    });

    [
      'price_range',
      'depth_range',
      'width_range',
      'height_range',
      'weight_range',
    ].forEach((filterType) => {
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
              minInput.value =
                dimension === 'price'
                  ? this.formatInputPrice(filter.min)
                  : filter.min;
            }
          }
          if (filter.max !== null) {
            maxSlider.value = filter.max;
            if (maxInput) {
              maxInput.value =
                dimension === 'price'
                  ? this.formatInputPrice(filter.max)
                  : filter.max;
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

  initMobileFilterVisibility() {
    if (window.innerWidth > 768) return;

    const mobileFilterBtn = document.getElementById('mobile-filter-btn');
    const collectionSection = document.querySelector(
      '.collection-list-section'
    );
    if (!mobileFilterBtn || !collectionSection) return;

    const handleScroll = () => {
      const sectionRect = collectionSection.getBoundingClientRect();
      const isInSection =
        sectionRect.top < window.innerHeight && sectionRect.bottom > 0;

      if (isInSection) {
        mobileFilterBtn.style.display = 'flex';
      } else {
        mobileFilterBtn.style.display = 'none';
      }
    };

    window.addEventListener('scroll', this.debounce(handleScroll, 10));
    window.addEventListener('resize', this.debounce(handleScroll, 10));

    handleScroll();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.collectionFilters = new CollectionFilters();

  // Make entire collection card clickable
  document.addEventListener('click', (e) => {
    const collectionCard = e.target.closest('.collection-card');

    // Don't handle if clicked on links or buttons
    if (e.target.closest('a') || e.target.closest('button')) {
      return;
    }

    if (collectionCard) {
      const linkUrl = collectionCard.getAttribute('data-link-url');
      if (linkUrl) {
        window.location.href = linkUrl;
      }
    }
  });
});
