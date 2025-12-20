# Metafield Cleanup - Step-by-Step Instructions

## 📋 Quick Summary

- **Total metafields to review:** 129
- **Safe to delete immediately:** 64 metafields (no data, no code)
- **Requires review:** 28 metafields (code references, minimal data)
- **Keep (actively used):** 37 metafields

**Estimated cleanup time:** 30-60 minutes
**Potential storage savings:** ~50% reduction in metafield definitions

---

## ✅ Step 1: Backup Current State (REQUIRED)

Before making ANY changes:

1. **Product Export** (already done)
   - ✅ `products_export_1.csv` contains all current metafield data
   - Keep this file safe as backup

2. **Screenshot Metafield Definitions**
   - Go to Shopify Admin → Settings → Custom Data → Products
   - Take screenshots of ALL metafield definitions
   - Save to a backup folder

3. **Theme Backup**
   - Your theme is in git, so you can always roll back code changes
   - Current commit: `b047976`

---

## 🔴 Step 2: Delete High-Confidence Metafields (64 total)

### 2A: Fire Extinguisher Metafields (18 total)

**Why Remove:** No products have this data, fire extinguishers not in catalog

**How to Remove:**
1. Shopify Admin → Settings → Custom Data → Products
2. Find and delete each metafield:

```
✓ fire_extinguisher_cartridge
✓ fire_extinguisher_cert
✓ fire_extinguisher_cert_add1
✓ fire_extinguisher_cert_add2
✓ fire_extinguisher_effective_ra
✓ fire_extinguisher_operation_ty
✓ fire_extinguisher_type
✓ fire_blanket_certification
✓ fire_protection_product
✓ fire_class_eu
✓ fire_class_eu_a
✓ fire_class_eu_a_rating
✓ fire_class_eu_b
✓ fire_class_eu_b_rating
✓ fire_class_eu_c
✓ fire_class_eu_d
✓ fire_class_eu_e
✓ fire_class_eu_f
```

---

### 2B: Delivery & Pricing Metafields (4 total)

**Why Remove:** No data, not used in checkout or product pages

```
✓ delivery_curbside
✓ delivery_to_final_location
✓ delivery_with_bolting
✓ collection_from_safegear_warehouse_price
```

---

### 2C: Capacity Metafields (Unused Product Types) (4 total)

**Why Remove:** No products with these capacity types

```
✓ capacity_data_lto
✓ capacity_guns
✓ capacity_keys
✓ capacity_laptops
```

---

### 2D: PDF & Documentation Metafields (12 total)

**Why Remove:** Old system, no longer used

```
✓ more_about_delivery_and_installation
✓ more_about_delivery_and_installation_url
✓ product_pdf_heading_first
✓ product_pdf_heading_second
✓ product_pdf_heading_third
✓ product_pdf_url_first
✓ product_pdf_url_second
✓ product_pdf_url_third
✓ safe_depth (replaced by new_depth_interior)
✓ table
✓ table_height
✓ what_is_included
```

---

### 2E: Technical & Miscellaneous (15 total)

**Why Remove:** No data, legacy fields

```
✓ audit_record
✓ bolt_type
✓ bracket
✓ burglary_custom
✓ ce_marking
✓ configurations
✓ ctm_pdf_url
✓ custom_included
✓ custom_product_meta
✓ door_type
✓ frame_type
✓ inner_safe_
✓ ip_classification
✓ location
✓ locks (note: 'lock' is different and should be kept)
```

---

### 2F: Product Relationships (Unused) (4 total)

**Why Remove:** No products reference these

```
✓ extra_key_product
✓ drawers_product
✓ hinges_product
✓ lock_product
```

---

### 2G: Specialized Products (3 total)

**Why Remove:** Only 1 product or no data

```
✓ mirror_classification
✓ silent_duress_alarm
✓ these_prices
```

---

### 2H: Shopify Standard (Unused) (6 total)

**Why Remove:** Not using these Shopify features

```
✓ shopify.light-color
✓ shopify.lock-type
✓ shopify--discovery--product_recommendation.complementary_products
✓ shopify--discovery--product_recommendation.related_products
✓ shopify--discovery--product_recommendation.related_products_display
✓ shopify--discovery--product_search_boost.queries
```

---

## ⚠️ Step 3: Verify Critical Metafields (BEFORE DELETING ANYTHING ELSE)

### 3A: Check Dimension Metafields

**CRITICAL:** These are used in 10+ template files but may show as "no data" in export

**How to Verify:**
1. Shopify Admin → Products
2. Open a safe product (e.g., any fire-resistant safe)
3. Scroll down to "Metafields" section
4. Check if these have values:
   - `custom.new_depth`
   - `custom.new_width`
   - `custom.new_height`
   - `custom.weight`

**Result:**
- ✅ **IF they have data** → KEEP THESE (they're critical for filtering/display)
- ❌ **IF they're empty** → Need to bulk populate all products with dimensions OR remove from code first

---

### 3B: Check Security Classification Metafields

**CRITICAL:** Core business differentiators

**How to Verify:**
1. Open a safe product with security certification
2. Check metafields:
   - `custom.burglary_classification` (e.g., "S2", "Grade 1")
   - `custom.fire_duration` (e.g., "30 minutter", "120 minutter")

**Result:**
- ✅ **IF present on certified safes** → KEEP AND POPULATE on all certified products
- ❌ **IF empty on all safes** → Security badges won't display (need bulk update)

---

## 🟡 Step 4: Review & Decide on Low-Usage Metafields

### 4A: Product Feature Metafields (11 fields)

**These appear in code but have minimal data (<1%). Decide if needed:**

| Metafield | Products with Data | Used In | Keep? |
|-----------|-------------------|---------|-------|
| `addon_products` | 1 | Sticky add-ons section | ? |
| `list_product` | 6 | Size comparison tables | ? |
| `lock_type_test` | 7 | Variant lock images | ? |
| `new_depth_interior` | 36 | Spec tables | ? |
| `new_width_interior` | 36 | Spec tables | ? |
| `new_height_interior` | 36 | Spec tables | ? |
| `model` | 46 | Spec tables | ? |
| `model_series` | 19 | Spec tables | ? |
| `safe_kind` | 18 | Spec tables | ? |
| `safe_purpose` | 23 | Spec tables | ? |
| `door_structure` | 10 | Spec tables | ? |

**How to Decide:**

1. **For add-ons/comparison features:**
   - Visit a product page with `addon_products` populated
   - Check if add-ons section shows
   - **IF useful → KEEP**
   - **IF not showing/needed → REMOVE** code first, then delete metafield

2. **For specification table fields:**
   - Visit a safe product page
   - Look for specification/details table
   - **IF table shows useful info → KEEP THESE**
   - **IF table is empty/useless → REMOVE** `metafield-table.liquid` section first

---

### 4B: Collection Metafields (5 fields)

| Metafield | Used In | Action |
|-----------|---------|--------|
| `read_more_text` | 4 collection templates | Check if collections have expandable descriptions |
| `l1_subcategory` | L1-collection.liquid | Keep if using hierarchical navigation |
| `safe_view_file` | 2 collection files | Keep if collections have visualization files |
| `burglary_grade` (collection) | Collection badges | Remove if only showing product badges |
| `fire_resistance` (collection) | Collection badges | Remove if only showing product badges |

**How to Check:**
1. Visit a collection page (e.g., /collections/safes)
2. Look for:
   - "Read more" expandable text
   - Collection-level security badges
   - Safe visualization/diagram files

**Decision:**
- **IF these features show → KEEP**
- **IF not visible/needed → REMOVE** from template JSON files first

---

### 4C: Reviews App Metafields (3 fields)

| Metafield | Purpose |
|-----------|---------|
| `reviews.rating.value.rating` | Star rating value |
| `reviews.rating.value.scale_max` | Max rating (5 stars) |
| `reviews.rating_count` | Number of reviews |

**Used in:** `blocks/review.liquid`

**Decision:**
- **IF you have Judge.me, Loox, Yotpo, or similar reviews app installed → KEEP**
- **IF no reviews app → REMOVE** `blocks/review.liquid` block from product template

---

## 📝 Step 5: Code Cleanup (If Removing Low-Usage Metafields)

**ONLY do this if you decided to remove metafields that are referenced in code.**

### Files to Edit:

1. **sections/metafield-table.liquid**
   - Remove lines referencing deleted spec metafields
   - Or delete entire section if not using spec tables

2. **sections/addons-product.liquid**
   - Remove if `addon_products` deleted
   - Or delete section from product template

3. **sections/size-chart.liquid**
   - Remove `list_product` references if deleted
   - Or simplify size chart logic

4. **snippets/variant-main-picker.liquid**
   - Remove `lock_type_test` image logic if deleted

5. **snippets/collection-badges.liquid**
   - Remove collection-level badge metafields if deleted

6. **templates/collection.*.json**
   - Remove `read_more_text` references if deleted

**Testing After Code Changes:**
1. Shopify CLI: `npm run dev`
2. Test all affected pages:
   - Product pages with specs
   - Collection pages with badges
   - Variant selectors with lock images
3. Ensure no Liquid errors in theme editor

---

## 🧪 Step 6: Testing Checklist

After deleting metafields, test these pages:

- [ ] Product page (safe with certifications)
- [ ] Collection page (safes collection)
- [ ] Search results
- [ ] Size chart section
- [ ] Add-ons section (if kept)
- [ ] Variant selector with lock types (if kept)
- [ ] Specification table (if kept)
- [ ] Collection badges (if kept)

**Look for:**
- No Liquid errors
- No missing images
- Filters still work
- Security badges display correctly
- Size dimensions show correctly

---

## 🔄 Rollback Procedure (If Something Breaks)

### To Restore a Deleted Metafield:

1. **Re-create Metafield Definition:**
   - Shopify Admin → Settings → Custom Data → Products → Add definition
   - Use exact same namespace and key (e.g., `custom.fire_duration`)
   - Set correct type (e.g., single line text, number, etc.)

2. **Re-import Data from CSV:**
   - Shopify Admin → Products → Import
   - Upload `products_export_1.csv`
   - Map columns correctly
   - Shopify will restore metafield values

3. **Restore Code Changes (If Any):**
   ```bash
   git status  # See what changed
   git checkout HEAD -- sections/metafield-table.liquid  # Restore specific file
   # OR
   git reset --hard HEAD  # Restore all code changes
   ```

---

## 📊 Progress Tracker

Use this to track your cleanup:

```
Phase 1: Backup
[ ] Product CSV exported
[ ] Metafield definitions screenshot
[ ] Git commit current state

Phase 2: Delete High-Confidence (64 metafields)
[ ] Fire extinguisher metafields (18)
[ ] Delivery & pricing (4)
[ ] Capacity fields (4)
[ ] PDF & documentation (12)
[ ] Technical & misc (15)
[ ] Product relationships (4)
[ ] Specialized products (3)
[ ] Shopify standard (6)

Phase 3: Verify Critical
[ ] Dimension metafields have data (new_depth, new_width, new_height, weight)
[ ] Security metafields have data (burglary_classification, fire_duration)

Phase 4: Review & Decide
[ ] Test add-ons section (addon_products)
[ ] Test size chart (list_product)
[ ] Test lock images (lock_type_test)
[ ] Check spec table usage (model, safe_kind, etc.)
[ ] Check collection features (read_more_text, badges)
[ ] Verify reviews app status

Phase 5: Code Cleanup (if needed)
[ ] Edit/remove metafield-table.liquid
[ ] Edit/remove addons-product.liquid
[ ] Edit size-chart.liquid
[ ] Edit variant-main-picker.liquid
[ ] Edit collection templates
[ ] Test all changes

Phase 6: Final Testing
[ ] Product pages work
[ ] Collection pages work
[ ] Filters work
[ ] No Liquid errors
[ ] Security badges display
```

---

## 🎯 Recommended Order

**Day 1 (30 minutes):**
1. ✅ Backup (Step 1)
2. ✅ Delete 64 high-confidence metafields (Step 2)
3. ✅ Verify critical metafields (Step 3)

**Day 2 (1-2 hours):**
4. ✅ Review low-usage metafields (Step 4)
5. ✅ Code cleanup if needed (Step 5)
6. ✅ Testing (Step 6)

---

## 📞 Support Resources

- **Metafield Documentation:** [Shopify Metafields Guide](https://help.shopify.com/en/manual/custom-data/metafields)
- **CSV Import Guide:** [Shopify CSV Import](https://help.shopify.com/en/manual/products/import-export)
- **Liquid Reference:** [Shopify Liquid Docs](https://shopify.dev/docs/api/liquid)

---

## ✨ Expected Results

After cleanup:

- **Storage:** ~56% reduction in metafield definitions
- **Admin:** Cleaner custom data section
- **Performance:** Slightly faster product exports
- **Maintenance:** Less clutter when managing metafields

**No impact on:**
- Store performance (minimal)
- SEO
- Customer experience (if tested properly)

---

**Generated:** 2025-11-10
**Ready to execute:** Yes
**Risk level:** Low (with proper backup and testing)
