# Dynamic Delivery Pricing - Complete Setup Guide

This guide walks you through setting up dynamic delivery and installation pricing based on product weight and customer country.

## Overview

The system automatically displays delivery and installation prices based on:
- **Product variant weight** (in kilograms)
- **Customer's selected country** (Spain, France, etc.)
- Prices update **automatically when variant changes**

---

## Step 1: Create Metaobject Definition

1. Go to **Shopify Admin → Settings → Custom data → Metaobjects**
2. Click **Add definition**
3. Configure the definition:

   **Basic Settings:**
   - **Name:** `Delivery Pricing`
   - **Type:** `delivery_pricing`
   - **One entry per:** Select "Storefront and admin"

   **Fields:** Add these two fields:

   ### Field 1: Country Code
   - **Type:** Single line text
   - **Name:** `Country Code`
   - **Key:** `country_code`
   - **Required:** ✓ Yes
   - **Description:** ISO country code (ES, FR, DE, etc.)

   ### Field 2: Pricing Data
   - **Type:** Multi-line text
   - **Name:** `Pricing Data`
   - **Key:** `pricing_data`
   - **Required:** ✓ Yes
   - **Description:** JSON structure with weight ranges and pricing

4. Click **Save**

---

## Step 2: Create Pricing Entries

### Spain Entry (ES)

1. Go to **Shopify Admin → Content → Metaobjects → Delivery Pricing**
2. Click **Add entry**
3. Fill in:
   - **Country Code:** `ES`
   - **Pricing Data:** Copy and paste the JSON below

```json
{
  "weight_ranges": [
    {"min": 0, "max": 20, "label": "0-20 kg"},
    {"min": 21, "max": 100, "label": "21-100 kg"},
    {"min": 101, "max": 200, "label": "101-200 kg"},
    {"min": 201, "max": 300, "label": "201-300 kg"},
    {"min": 301, "max": 500, "label": "301-500 kg"},
    {"min": 501, "max": 999999, "label": ">500 kg"}
  ],
  "delivery_options": [
    {
      "id": "curbside",
      "label": "Curbside Delivery",
      "description": "Delivery to the edge of your property, where the item will be left for you to bring inside.",
      "prices": [2000, 6000, 8000, 12000, 15000, 20000]
    },
    {
      "id": "warehouse",
      "label": "Collection from SafeGear warehouse",
      "description": "",
      "prices": [0, 0, 0, 0, 0, 0]
    }
  ],
  "installation_options": [
    {
      "id": "final_location",
      "label": "Delivery to final location",
      "prices": [22000, 31000, 38000, 47000, 65000, 90000]
    },
    {
      "id": "anchoring",
      "label": "Anchoring to floor or wall (per bolt)",
      "prices": [6000, 6000, 6000, 6000, 10000, 12000]
    }
  ]
}
```

4. Click **Save**

### France Entry (FR)

1. Click **Add entry** again
2. Fill in:
   - **Country Code:** `FR`
   - **Pricing Data:** Copy and paste the JSON below

```json
{
  "weight_ranges": [
    {"min": 0, "max": 20, "label": "0-20 kg"},
    {"min": 21, "max": 100, "label": "21-100 kg"},
    {"min": 101, "max": 200, "label": "101-200 kg"},
    {"min": 201, "max": 300, "label": "201-300 kg"},
    {"min": 301, "max": 500, "label": "301-500 kg"},
    {"min": 501, "max": 999999, "label": ">500 kg"}
  ],
  "delivery_options": [
    {
      "id": "curbside",
      "label": "Curbside Delivery",
      "description": "Delivery to the edge of your property, where the item will be left for you to bring inside.",
      "prices": [3000, 7000, 9000, 13000, 16000, 21000]
    },
    {
      "id": "warehouse",
      "label": "Collection from SafeGear warehouse",
      "description": "",
      "prices": [1000, 1000, 1000, 1000, 1000, 1000]
    }
  ],
  "installation_options": [
    {
      "id": "final_location",
      "label": "Delivery to final location",
      "prices": [23000, 32000, 39000, 48000, 66000, 91000]
    },
    {
      "id": "anchoring",
      "label": "Anchoring to floor or wall (per bolt)",
      "prices": [7000, 7000, 7000, 7000, 11000, 13000]
    }
  ]
}
```

3. Click **Save**

**Note:** Prices are in cents (e.g., €20.00 = 2000 cents). This avoids decimal precision issues.

---

## Step 3: Add Section to Product Template

1. Go to **Shopify Admin → Online Store → Themes**
2. Click **Customize** on your active theme
3. Navigate to **Products → Default product**
4. Click **Add section**
5. Find and select **Delivery Info (Dynamic)**
6. Position it where you want it to appear (e.g., after product information)

---

## Step 4: Configure Section Settings

In the theme editor, configure the section:

### Dynamic Pricing Settings
1. **Enable dynamic pricing:** ✓ Check this
2. **Spain Pricing Data:** Select the "ES" metaobject entry you created
3. **France Pricing Data:** Select the "FR" metaobject entry you created
4. **Show debug info:** ✓ Check this for testing (uncheck in production)

### Other Settings
- **Installation title:** "Installation" (or customize)
- **Delivery title:** "Delivery time" (or customize)
- **Delivery time badge:** "1-2 weeks" (or customize)
- **Installation disclaimer:** Keep default or customize
- **Transport button:** Configure as needed

5. Click **Save**

---

## Step 5: Deploy Files to Shopify

Upload the new files to your theme:

### Using Shopify CLI:

```bash
cd C:\projects\safe-gear

# Push all changes to your theme
npm run push
```

**Files that will be uploaded:**
- `sections/delivery-info-dynamic.liquid` (new section)
- `snippets/delivery-pricing-calculator.liquid` (pricing logic)
- `assets/delivery-info-updater.js` (variant change handler)

---

## Step 6: Test the Implementation

### Test Scenario 1: Light Product (0-20kg) in Spain

1. Create or edit a product with weight **15kg** (15000g in Shopify)
2. Set country to **Spain** (ES) using the country selector
3. View the product page
4. **Expected prices:**
   - Curbside Delivery: €20.00
   - Collection from warehouse: €0.00
   - Delivery to final location: €220.00
   - Anchoring to floor/wall: €60.00

### Test Scenario 2: Medium Product (101-200kg) in France

1. Create or edit a product with weight **150kg** (150000g)
2. Set country to **France** (FR)
3. View the product page
4. **Expected prices:**
   - Curbside Delivery: €90.00
   - Collection from warehouse: €10.00
   - Delivery to final location: €390.00
   - Anchoring to floor/wall: €70.00

### Test Scenario 3: Heavy Product (>500kg) in Spain

1. Create or edit a product with weight **600kg** (600000g)
2. Set country to **Spain** (ES)
3. View the product page
4. **Expected prices:**
   - Curbside Delivery: €200.00
   - Collection from warehouse: €0.00
   - Delivery to final location: €900.00
   - Anchoring to floor/wall: €120.00

### Test Scenario 4: Variant Switching

1. Create a product with multiple variants (different weights)
   - Variant 1: 10kg
   - Variant 2: 150kg
2. View the product page
3. Switch between variants
4. **Expected behavior:** Prices should update automatically without page reload
5. **Check console:** You should see log messages from `DeliveryInfoUpdater`

---

## Troubleshooting

### Prices not showing?

1. **Check debug info is enabled** in section settings
2. **Verify the debug panel shows:**
   - Product name ✓
   - Variant name ✓
   - Weight in kg ✓
   - Country code (ES or FR) ✓
   - "Dynamic Pricing: true" ✓
   - "Pricing Data: ✓ Loaded" ✓
   - Weight Range label ✓

### Wrong country detected?

- The system uses `localization.country.iso_code`
- Make sure the country selector in your header is working
- Test by switching countries in the header

### Prices not updating on variant change?

1. **Open browser console** (F12)
2. **Switch variants**
3. **Look for:** `[DeliveryInfoUpdater] Variant changed:` messages
4. **If no messages:** Check that `variant:update` events are firing
5. **Check:** `assets/delivery-info-updater.js` is loaded

### JSON parsing errors?

- Validate your JSON at https://jsonlint.com/
- Ensure no trailing commas
- Ensure all prices are numbers (not strings)
- Prices must be in cents (integers, no decimals)

### Wrong weight range?

- Check product variant weight is set correctly
- Weight must be in grams in Shopify
- System converts to kg: `weight_kg = weight_grams / 1000`

---

## Adding More Countries

To add Germany, Italy, or other countries:

1. Go to **Metaobjects → Delivery Pricing**
2. Click **Add entry**
3. Set **Country Code** to ISO code (e.g., `DE`, `IT`)
4. Add pricing JSON with your prices
5. Go to **Section settings**
6. You'll need to edit the section code to add a new metaobject setting for the new country
7. Update the `case` statement in `delivery-info-dynamic.liquid`:

```liquid
case country_code
  when 'ES'
    assign pricing_metaobject = section.settings.pricing_spain
  when 'FR'
    assign pricing_metaobject = section.settings.pricing_france
  when 'DE'
    assign pricing_metaobject = section.settings.pricing_germany
  else
    assign pricing_metaobject = section.settings.pricing_spain
endcase
```

---

## Price Structure Reference

### Weight Ranges
- **0-20 kg:** Small items (locks, small safes)
- **21-100 kg:** Medium items
- **101-200 kg:** Large items
- **201-300 kg:** Very large items
- **301-500 kg:** Extra large items
- **>500 kg:** Industrial/commercial items

### Pricing in JSON
All prices are in **cents** (€1.00 = 100 cents):
- €20 = 2000
- €220 = 22000
- €900 = 90000

The `| money` filter automatically formats cents to currency.

---

## Production Checklist

Before going live:

- [ ] Disable debug info in section settings
- [ ] Test all weight ranges for each country
- [ ] Verify currency symbols are correct
- [ ] Test variant switching on multiple products
- [ ] Check mobile display
- [ ] Verify transport form still works
- [ ] Test with country selector changes
- [ ] Remove console.log statements if desired (optional)

---

## Files Created

- `METAOBJECT_DELIVERY_PRICING_SETUP.md` - Metaobject setup instructions
- `DELIVERY_PRICING_SETUP_GUIDE.md` - This complete guide
- `sections/delivery-info-dynamic.liquid` - Dynamic pricing section
- `snippets/delivery-pricing-calculator.liquid` - Pricing calculation logic
- `assets/delivery-info-updater.js` - Variant change handler

---

## Support

If you encounter issues:
1. Check debug panel output
2. Check browser console for errors
3. Verify metaobject entries are correct
4. Ensure product weights are set
5. Test country selector functionality
