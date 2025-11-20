# Dynamic Delivery Pricing - Quick Start Guide

## ✅ Implementation Complete!

All files have been uploaded to your Shopify theme. Follow these simple steps to activate dynamic pricing.

---

## Step 1: Add Section to Product Template (2 minutes)

1. Go to [Theme Editor](https://f1what-2r.myshopify.com/admin/themes/185002983750/editor)
2. Navigate to **Products → Default product**
3. Click **Add section**
4. Find and select **Delivery Info (Dynamic)**
5. Position it where you want (e.g., after product information)
6. Click **Save**

---

## Step 2: Configure Pricing Data (5 minutes)

In the section settings, you'll find two textarea fields. Copy and paste the JSON below:

### Spain Pricing JSON
Paste this into **"Spain Pricing Data (JSON)"**:

```json
{"weight_ranges":[{"min":0,"max":20,"label":"0-20 kg"},{"min":21,"max":100,"label":"21-100 kg"},{"min":101,"max":200,"label":"101-200 kg"},{"min":201,"max":300,"label":"201-300 kg"},{"min":301,"max":500,"label":"301-500 kg"},{"min":501,"max":999999,"label":">500 kg"}],"delivery_options":[{"id":"curbside","label":"Curbside Delivery","description":"Delivery to the edge of your property, where the item will be left for you to bring inside.","prices":[2000,6000,8000,12000,15000,20000]},{"id":"warehouse","label":"Collection from SafeGear warehouse","description":"","prices":[0,0,0,0,0,0]}],"installation_options":[{"id":"final_location","label":"Delivery to final location","prices":[22000,31000,38000,47000,65000,90000]},{"id":"anchoring","label":"Anchoring to floor or wall (per bolt)","prices":[6000,6000,6000,6000,10000,12000]}]}
```

### France Pricing JSON
Paste this into **"France Pricing Data (JSON)"**:

```json
{"weight_ranges":[{"min":0,"max":20,"label":"0-20 kg"},{"min":21,"max":100,"label":"21-100 kg"},{"min":101,"max":200,"label":"101-200 kg"},{"min":201,"max":300,"label":"201-300 kg"},{"min":301,"max":500,"label":"301-500 kg"},{"min":501,"max":999999,"label":">500 kg"}],"delivery_options":[{"id":"curbside","label":"Curbside Delivery","description":"Delivery to the edge of your property, where the item will be left for you to bring inside.","prices":[3000,7000,9000,13000,16000,21000]},{"id":"warehouse","label":"Collection from SafeGear warehouse","description":"","prices":[1000,1000,1000,1000,1000,1000]}],"installation_options":[{"id":"final_location","label":"Delivery to final location","prices":[23000,32000,39000,48000,66000,91000]},{"id":"anchoring","label":"Anchoring to floor or wall (per bolt)","prices":[7000,7000,7000,7000,11000,13000]}]}
```

**Note:** Prices are in cents (€20 = 2000 cents)

---

## Step 3: Enable Dynamic Pricing

In the same section settings:

1. Check **✓ Enable dynamic pricing**
2. Check **✓ Show debug info** (for testing, uncheck later)
3. Configure other settings:
   - **Installation title**: "Installation"
   - **Delivery title**: "Delivery time"
   - **Delivery time badge**: "1-2 weeks"
4. Click **Save**

---

## Step 4: Test the Implementation

### Test Scenario 1: Light Product (Spain)
1. Edit a product and set weight to **15kg** (15000g in Shopify)
2. View the product page with country set to **Spain**
3. **Expected prices:**
   - Curbside Delivery: €20.00
   - Collection from warehouse: €0.00
   - Delivery to final location: €220.00
   - Anchoring to floor/wall: €60.00

### Test Scenario 2: Heavy Product (Spain)
1. Edit a product and set weight to **600kg** (600000g)
2. View the product page with country set to **Spain**
3. **Expected prices:**
   - Curbside Delivery: €200.00
   - Collection from warehouse: €0.00
   - Delivery to final location: €900.00
   - Anchoring to floor/wall: €120.00

### Test Scenario 3: Variant Switching
1. Create a product with 2 variants (different weights):
   - Variant 1: 10kg
   - Variant 2: 150kg
2. Switch between variants on the product page
3. **Expected:** Prices update automatically without page reload

---

## Pricing Structure

### Weight Ranges:
- **0-20 kg**: €20 / €220 / €60
- **21-100 kg**: €60 / €310 / €60
- **101-200 kg**: €80 / €380 / €60
- **201-300 kg**: €120 / €470 / €60
- **301-500 kg**: €150 / €650 / €100
- **>500 kg**: €200 / €900 / €120

### France Pricing:
Add €10 to all Spain prices

---

## Troubleshooting

### Prices not showing?
1. Enable "Show debug info" in section settings
2. Check the debug panel shows:
   - Weight in kg ✓
   - Country code (ES or FR) ✓
   - "Dynamic Pricing: true" ✓
   - "Pricing Data: ✓ Loaded" ✓

### Wrong country?
- Use the country selector in your header to switch countries
- The system uses `localization.country.iso_code`

### Prices not updating on variant change?
1. Open browser console (F12)
2. Look for `[DeliveryInfoUpdater]` messages
3. If none, check that `delivery-info-updater.js` is loading

---

## Production Checklist

Before going live:
- [ ] Disable debug info
- [ ] Test all weight ranges
- [ ] Test country switching
- [ ] Test variant switching
- [ ] Check mobile display
- [ ] Verify currency formatting

---

## Files Created

✅ `sections/delivery-info-dynamic.liquid` - Dynamic pricing section
✅ `snippets/delivery-pricing-calculator.liquid` - Pricing calculation logic
✅ `assets/delivery-info-updater.js` - Variant change handler
✅ `DELIVERY_PRICING_SETUP_GUIDE.md` - Complete documentation
✅ `QUICK_START_GUIDE.md` - This quick start guide

---

## Need Help?

See `DELIVERY_PRICING_SETUP_GUIDE.md` for detailed documentation.
