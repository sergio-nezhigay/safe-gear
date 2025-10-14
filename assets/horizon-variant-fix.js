// Horizon Variant Picker Fix
// Script to fix variant selection issues in Horizon theme

(function() {
  'use strict';

  function onReady(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  function initVariantFix() {
    const variantPickers = document.querySelectorAll('variant-picker');
    variantPickers.forEach(picker => {
      initVariantPicker(picker);
    });
  }

  function initVariantPicker(picker) {
    const variantInputs = picker.querySelectorAll('input[type="radio"], select');
    
    variantInputs.forEach(input => {
      input.removeEventListener('change', handleVariantChange);
      input.addEventListener('change', function(event) {
        handleVariantChange(event, picker);
      });
    });
  }

  function handleVariantChange(event, picker) {
    const input = event.target;
    updateSwatchText(input);
    
    setTimeout(() => {
      updateVariantDisplay(input, picker);
    }, 50);
  }

  function updateSwatchText(input) {
    if (input.type === 'radio') {
      const fieldset = input.closest('fieldset');
      const swatchValue = fieldset?.querySelector('.variant-option__swatch-value');
      
      if (swatchValue) {
        swatchValue.textContent = input.value;
      }
    }
  }

  function updateVariantDisplay(input, picker) {
    const variantId = input.dataset.variantId;
    
    if (!variantId) {
      return;
    }

    checkVariantAvailability(variantId, picker)
      .then(variantData => {
        updatePriceWithData(variantData, picker);
        updateAddToCartButtonWithData(variantData, picker);
        updateVariantIdInput(variantId, picker);
      })
      .catch(error => {
        updatePrice(variantId, picker);
        updateAddToCartButton(variantId, picker);
        updateVariantIdInput(variantId, picker);
      });
  }

  function checkVariantAvailability(variantId, picker) {
    return new Promise((resolve, reject) => {
      const productUrl = picker.dataset.productUrl;
      
      if (!productUrl) {
        reject('No product URL');
        return;
      }

      const url = new URL(productUrl, window.location.origin);
      url.searchParams.set('variant', variantId);
      url.pathname = url.pathname + '.js';

      fetch(url.toString())
        .then(response => response.json())
        .then(productData => {
          const variant = productData.variants?.find(v => v.id.toString() === variantId.toString());
          
          if (variant) {
            if (typeof variant.inventory_policy === 'undefined') {
              fetchCompleteVariantData(productUrl, variantId)
                .then(completeVariant => {
                  resolve(completeVariant);
                })
                .catch(() => {
                  variant.available = true;
                  resolve(variant);
                });
            } else {
              resolve(variant);
            }
          } else {
            reject('Variant not found in product data');
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  function fetchCompleteVariantData(productUrl, variantId) {
    return new Promise((resolve, reject) => {
      const url = new URL(productUrl, window.location.origin);
      url.pathname = url.pathname.replace('.js', '') + '.js';
      
      fetch(url.toString())
        .then(response => response.json())
        .then(productData => {
          const variant = productData.variants?.find(v => v.id.toString() === variantId.toString());
          
          if (variant) {
            if (variant.price > 0) {
              variant.available = true;
            }
            resolve(variant);
          } else {
            reject('Variant not found');
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  function updatePrice(variantId, picker) {
    const section = picker.closest('.shopify-section') || document;
    const priceElements = section.querySelectorAll('product-price');
    
    priceElements.forEach(priceElement => {
      const variantInput = picker.querySelector(`input[data-variant-id="${variantId}"]`);
      
      if (!variantInput) return;

      const priceContainer = priceElement.querySelector('[ref="priceContainer"]');
      if (priceContainer) {
        priceContainer.setAttribute('data-variant-id', variantId);
      }

      priceElement.dispatchEvent(new CustomEvent('variant:change', {
        detail: { variantId: variantId }
      }));
    });
  }

  function updatePriceWithData(variantData, picker) {
    const section = picker.closest('.shopify-section') || document;
    const priceElements = section.querySelectorAll('product-price');
    
    priceElements.forEach(priceElement => {
      const priceContainer = priceElement.querySelector('[ref="priceContainer"]');
      if (priceContainer) {
        priceContainer.setAttribute('data-variant-id', variantData.id);
        priceContainer.setAttribute('data-variant-price', variantData.price);
        priceContainer.setAttribute('data-variant-available', variantData.available);
        
        if (variantData.compare_at_price) {
          priceContainer.setAttribute('data-variant-compare-price', variantData.compare_at_price);
        }

        const regularPrice = priceContainer.querySelector('.price-item--regular:not(s)');
        const salePrice = priceContainer.querySelector('.price-item--sale');
        
        if (regularPrice && variantData.price) {
          const formattedPrice = formatPrice(variantData.price);
          regularPrice.textContent = `${formattedPrice} exc. VAT`;
        }
        
        if (salePrice && variantData.price) {
          const formattedPrice = formatPrice(variantData.price);
          salePrice.textContent = `${formattedPrice} inc. VAT`;
        }
      }
    });
  }

  function updateAddToCartButton(variantId, picker) {
    const section = picker.closest('.shopify-section') || document;
    const addToCartButtons = section.querySelectorAll('[ref="addToCartButton"], .add-to-cart-button');
    
    const variantInput = picker.querySelector(`input[data-variant-id="${variantId}"]`);
    let isAvailable = true;
    
    if (variantInput) {
      const availableAttr = variantInput.dataset.optionAvailable;
      
      if (availableAttr === 'false' || availableAttr === false) {
        isAvailable = true; // Override - let users try to add to cart
      }
    }
    
    addToCartButtons.forEach(button => {
      if (isAvailable) {
        button.disabled = false;
        button.removeAttribute('disabled');
        
        const buttonText = button.querySelector('.add-to-cart-text__content, .button-text');
        if (buttonText && buttonText.textContent.includes('Sold') || buttonText.textContent.includes('Udsolgt')) {
          buttonText.textContent = 'Add to cart';
        }
      } else {
        button.disabled = true;
        button.setAttribute('disabled', 'true');
        
        const buttonText = button.querySelector('.add-to-cart-text__content, .button-text');
        if (buttonText) {
          buttonText.textContent = 'Sold out';
        }
      }
    });
  }

  function updateAddToCartButtonWithData(variantData, picker) {
    const section = picker.closest('.shopify-section') || document;
    const addToCartButtons = section.querySelectorAll('[ref="addToCartButton"], .add-to-cart-button');
    
    let isAvailable = true;
    let reason = 'Available';
    
    if (variantData.available === false) {
      isAvailable = false;
      reason = 'Marked as unavailable';
    }
    else if (variantData.inventory_management === 'shopify') {
      if (variantData.inventory_policy === 'deny') {
        if (typeof variantData.inventory_quantity === 'number' && variantData.inventory_quantity <= 0) {
          isAvailable = false;
          reason = 'Out of stock (inventory)';
        }
      }
    }
    
    if (!variantData.price || variantData.price <= 0) {
      isAvailable = false;
      reason = 'No price set';
    }
    
    // OVERRIDE: If the variant data seems incomplete, assume available
    if (variantData.available === false && 
        typeof variantData.inventory_policy === 'undefined' && 
        typeof variantData.inventory_quantity === 'undefined') {
      isAvailable = true;
      reason = 'Forced available (incomplete data)';
    }
    
    addToCartButtons.forEach(button => {
      if (isAvailable) {
        button.disabled = false;
        button.removeAttribute('disabled');
        
        const buttonText = button.querySelector('.add-to-cart-text__content, .button-text');
        if (buttonText) {
          buttonText.textContent = 'Add to cart';
        }
      } else {
        button.disabled = true;
        button.setAttribute('disabled', 'true');
        
        const buttonText = button.querySelector('.add-to-cart-text__content, .button-text');
        if (buttonText) {
          buttonText.textContent = 'Sold out';
        }
      }
    });
  }

  function formatPrice(priceInCents) {
    // Use Shopify's built-in formatting first (maintains store currency settings)
    if (typeof Shopify !== 'undefined' && Shopify.formatMoney) {
      return Shopify.formatMoney(priceInCents);
    }
    
    // Fallback: copy exact format from existing price elements
    const existingPrice = document.querySelector('.price-item--regular, .price-item--sale');
    if (existingPrice) {
      const existingText = existingPrice.textContent.trim();
      const priceValue = priceInCents / 100;
      
      // Extract currency and format pattern from existing text
      const currencyMatch = existingText.match(/[A-Z]{3}|kr\.?|€|\$|£/);
      const hasCommaDecimal = existingText.includes(',') && !existingText.includes('.');
      
      if (currencyMatch) {
        const currency = currencyMatch[0];
        const formattedNumber = hasCommaDecimal 
          ? priceValue.toFixed(2).replace('.', ',')
          : priceValue.toFixed(2);
        
        // Match the position of currency (before or after number)
        if (existingText.indexOf(currency) < existingText.search(/\d/)) {
          return currency + ' ' + formattedNumber;
        } else {
          return formattedNumber + ' ' + currency;
        }
      }
    }
    
    // Ultimate fallback
    return (priceInCents / 100).toFixed(2);
  }

  function updateVariantIdInput(variantId, picker) {
    const section = picker.closest('.shopify-section') || document;
    const variantIdInput = section.querySelector('input[name="id"]');
    
    if (variantIdInput) {
      variantIdInput.value = variantId;
    }
  }

  function enhanceProductForms() {
    const productForms = document.querySelectorAll('product-form-component, form[data-type="add-to-cart-form"]');
    
    productForms.forEach(form => {
      form.addEventListener('variant:change', function(event) {
        // Handle variant changes
      });
    });
  }

  // Initialize when DOM is ready
  onReady(function() {
    initVariantFix();
    enhanceProductForms();
    
    // Reinitialize if new content is added (for AJAX)
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) {
              const newPickers = node.querySelectorAll ? node.querySelectorAll('variant-picker') : [];
              if (newPickers.length > 0) {
                newPickers.forEach(initVariantPicker);
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });

  // Expose functions for debugging if needed
  window.HorizonVariantFix = {
    init: initVariantFix,
    initPicker: initVariantPicker,
    updatePrice: updatePrice,
    updateAddToCartButton: updateAddToCartButton
  };
})();