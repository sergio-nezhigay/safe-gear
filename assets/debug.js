// Debug script to test variant picker functionality
// This script can be added to product pages to debug variant issues

(function() {
  'use strict';

  console.log('🔧 Variant Picker Debug Script Loaded');

  // Monitor variant update events
  document.addEventListener('theme:variant:update', function(event) {
    console.log('🔄 Variant Update Event:', {
      resource: event.detail.resource,
      data: event.detail.data,
      productId: event.detail.data?.productId
    });
  });

  // Monitor variant selected events
  document.addEventListener('theme:variant:selected', function(event) {
    console.log('✅ Variant Selected Event:', event.detail);
  });

  // Monitor price updates
  const productPrices = document.querySelectorAll('product-price');
  productPrices.forEach(priceElement => {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          console.log('💰 Price Updated:', {
            element: priceElement,
            newContent: priceElement.textContent.trim()
          });
        }
      });
    });
    
    observer.observe(priceElement, {
      childList: true,
      subtree: true,
      characterData: true
    });
  });

  // Monitor add to cart button state changes
  const addToCartButtons = document.querySelectorAll('[ref="addToCartButton"]');
  addToCartButtons.forEach(button => {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'disabled') {
          console.log('🛒 Add to Cart Button State Changed:', {
            button: button,
            disabled: button.disabled,
            text: button.textContent.trim()
          });
        }
      });
    });
    
    observer.observe(button, {
      attributes: true,
      attributeFilter: ['disabled']
    });
  });

  // Test variant picker functionality
  function testVariantPicker() {
    console.log('🧪 Testing Variant Picker...');
    
    const variantPicker = document.querySelector('variant-picker');
    if (!variantPicker) {
      console.warn('⚠️ No variant picker found on page');
      return;
    }

    const variantInputs = variantPicker.querySelectorAll('input[type="radio"]');
    console.log(`📋 Found ${variantInputs.length} variant options`);

    variantInputs.forEach((input, index) => {
      console.log(`Option ${index + 1}:`, {
        name: input.name,
        value: input.value,
        checked: input.checked,
        available: input.dataset.optionAvailable,
        variantId: input.dataset.variantId
      });
    });

    // Test clicking on different variants
    const uncheckedInputs = Array.from(variantInputs).filter(input => !input.checked);
    if (uncheckedInputs.length > 0) {
      console.log('🔄 Testing variant change...');
      setTimeout(() => {
        uncheckedInputs[0].click();
        console.log('✨ Clicked on variant:', uncheckedInputs[0].value);
      }, 1000);
    }
  }

  // Run tests when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', testVariantPicker);
  } else {
    testVariantPicker();
  }

  // Expose debug functions globally
  window.debugVariantPicker = {
    test: testVariantPicker,
    logPriceElements: () => {
      const prices = document.querySelectorAll('product-price');
      console.log('💰 Price Elements:', prices);
      prices.forEach((price, index) => {
        console.log(`Price ${index + 1}:`, {
          element: price,
          productId: price.dataset.productId,
          priceContainer: price.querySelector('[ref="priceContainer"]')
        });
      });
    },
    logAddToCartButtons: () => {
      const buttons = document.querySelectorAll('[ref="addToCartButton"]');
      console.log('🛒 Add to Cart Buttons:', buttons);
      buttons.forEach((button, index) => {
        console.log(`Button ${index + 1}:`, {
          element: button,
          disabled: button.disabled,
          text: button.textContent.trim()
        });
      });
    }
  };

  console.log('🎯 Debug functions available: window.debugVariantPicker');
})();