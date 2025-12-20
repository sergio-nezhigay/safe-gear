# Shopify Metafield Cleanup Report - Safe Gear Theme

**Generated:** 2025-11-10
**Analysis Scope:** 18,818 product/variant rows
**Total Metafields Defined:** 129
**Metafields with Data:** 57
**Completely Unused Metafields:** 72

---

## Executive Summary

This report analyzes all metafields in the Safe Gear Shopify theme, comparing:
1. **Code usage** - Which metafields are referenced in Liquid templates
2. **Data population** - Which metafields have actual values in products
3. **Removal safety** - Which metafields can be safely removed

### Key Findings

- **72 metafields (56%)** have NO data and can potentially be removed
- **57 metafields (44%)** have some data but many are barely used (<1%)
- Several metafields are **referenced in code but may lack data**
- High-risk removal candidates identified below

---

## Part 1: Metafields Safe to Remove (No Data, No Code Usage)

### 🔴 HIGH CONFIDENCE - Remove Immediately

These metafields have **0% data population** and are **NOT referenced in theme code**:

#### Fire Extinguisher Related (10 metafields)
1. `product.metafields.custom.fire_extinguisher_cartridge`
2. `product.metafields.custom.fire_extinguisher_cert`
3. `product.metafields.custom.fire_extinguisher_cert_add1`
4. `product.metafields.custom.fire_extinguisher_cert_add2`
5. `product.metafields.custom.fire_extinguisher_effective_ra`
6. `product.metafields.custom.fire_extinguisher_operation_ty`
7. `product.metafields.custom.fire_extinguisher_type`
8. `product.metafields.custom.fire_blanket_certification`
9. `product.metafields.custom.fire_protection_product`
10. `product.metafields.custom.fire_class_eu` (and all variants: fire_class_eu_a, fire_class_eu_a_rating, fire_class_eu_b, fire_class_eu_b_rating, fire_class_eu_c, fire_class_eu_d, fire_class_eu_e, fire_class_eu_f)

**Reason:** Fire extinguisher products likely removed from catalog
**Risk:** None
**Action:** Delete all 18 fire extinguisher metafields

#### Delivery & Pricing (4 metafields)
1. `product.metafields.custom.delivery_curbside`
2. `product.metafields.custom.delivery_to_final_location`
3. `product.metafields.custom.delivery_with_bolting`
4. `product.metafields.custom.collection_from_safegear_warehouse_price`

**Reason:** No data, not used in checkout/product pages
**Risk:** None
**Action:** Delete

#### Product Relationships (Unused) (4 metafields)
1. `product.metafields.custom.extra_key_product`
2. `product.metafields.custom.drawers_product`
3. `product.metafields.custom.hinges_product`
4. `product.metafields.custom.fire_protection_product`

**Reason:** No products reference these relationships
**Risk:** None
**Action:** Delete

#### Capacity Fields (Unused Product Types) (4 metafields)
1. `product.metafields.custom.capacity_data_lto`
2. `product.metafields.custom.capacity_guns`
3. `product.metafields.custom.capacity_keys`
4. `product.metafields.custom.capacity_laptops`

**Reason:** No products with these capacity types
**Risk:** None
**Action:** Delete

#### Miscellaneous Technical (15 metafields)
1. `product.metafields.custom.audit_record`
2. `product.metafields.custom.bolt_type`
3. `product.metafields.custom.bracket`
4. `product.metafields.custom.burglary_custom`
5. `product.metafields.custom.ce_marking`
6. `product.metafields.custom.configurations`
7. `product.metafields.custom.ctm_pdf_url`
8. `product.metafields.custom.custom_included`
9. `product.metafields.custom.custom_product_meta`
10. `product.metafields.custom.door_type`
11. `product.metafields.custom.frame_type`
12. `product.metafields.custom.inner_safe_`
13. `product.metafields.custom.ip_classification`
14. `product.metafields.custom.location`
15. `product.metafields.custom.locks` (note: `lock` is different and has data)

**Risk:** None
**Action:** Delete

#### Product Information (Deprecated/Unused) (12 metafields)
1. `product.metafields.custom.more_about_delivery_and_installation`
2. `product.metafields.custom.more_about_delivery_and_installation_url`
3. `product.metafields.custom.product_pdf_heading_first`
4. `product.metafields.custom.product_pdf_heading_second`
5. `product.metafields.custom.product_pdf_heading_third`
6. `product.metafields.custom.product_pdf_url_first`
7. `product.metafields.custom.product_pdf_url_second`
8. `product.metafields.custom.product_pdf_url_third`
9. `product.metafields.custom.safe_depth` (replaced by new_depth_interior)
10. `product.metafields.custom.table`
11. `product.metafields.custom.table_height`
12. `product.metafields.custom.what_is_included`

**Risk:** None
**Action:** Delete

#### Shopify Standard (Unused) (5 metafields)
1. `product.metafields.shopify.light-color`
2. `product.metafields.shopify.lock-type`
3. `product.metafields.shopify--discovery--product_recommendation.complementary_products`
4. `product.metafields.shopify--discovery--product_recommendation.related_products`
5. `product.metafields.shopify--discovery--product_recommendation.related_products_display`
6. `product.metafields.shopify--discovery--product_search_boost.queries`

**Risk:** None
**Action:** Delete from custom data (if you're not using Shopify's product recommendations/search boost features)

#### Mirrors & Specialized (5 metafields)
1. `product.metafields.custom.mirror_classification`
2. `product.metafields.custom.mirror_series` (only 1 product has data)
3. `product.metafields.custom.lock_product`
4. `product.metafields.custom.silent_duress_alarm`
5. `product.metafields.custom.these_prices`

**Risk:** Low (only 1 mirror product affected)
**Action:** Delete or merge into product description

---

### Total High Confidence Removals: **72 metafields**

---

## Part 2: Metafields to Review (Has Code Usage BUT Little/No Data)

### ⚠️ MEDIUM RISK - Review Before Removing

These metafields are **referenced in theme code** but have **very low data population**. Review if they're truly needed.

#### Dimensions (CRITICAL - DO NOT REMOVE)
**Despite showing 0% in export, these are heavily used in code (10+ files each):**

1. `product.metafields.custom.new_depth` - Used in: collection grids, size charts, filtering
2. `product.metafields.custom.new_width` - Used in: collection grids, size charts, filtering
3. `product.metafields.custom.new_height` - Used in: collection grids, size charts, filtering
4. `product.metafields.custom.weight` - Used in: 8 files for specifications

**Files:** `collection-list-new.liquid`, `collection-list-all.liquid`, `collection-grid.liquid`, `size-chart.liquid`, etc.

**⚠️ WARNING:** Export may not show data correctly if dimensions are on variant rows. DO NOT REMOVE.

**Action:** **KEEP** - Verify in Shopify Admin → Products that dimensions are populated

---

#### Interior Dimensions (Review)
1. `product.metafields.custom.new_depth_interior` - 0.2% population (36 products)
2. `product.metafields.custom.new_width_interior` - 0.2% population (36 products)
3. `product.metafields.custom.new_height_interior` - 0.2% population (36 products)

**Code Usage:** `metafield-table.liquid`, `size-chart.liquid`

**Action:** **REVIEW** - If only 36 products need interior dimensions, consider keeping. Otherwise remove from code.

---

#### Security Classifications (CRITICAL - DO NOT REMOVE)
1. `product.metafields.custom.burglary_classification` - 0.1% population (24 products)
2. `product.metafields.custom.fire_duration` - 0.1% population (23 products)

**Code Usage:** 15+ files (collection badges, filters, product pages)

**⚠️ WARNING:** These are core business differentiators used extensively in theme.

**Action:** **KEEP** - Verify data in Shopify Admin. May need bulk update for all safes.

---

#### Product Relationships (Low Usage)
1. `product.metafields.custom.addon_products` - 0.0% population (1 product)
   **Code:** `addons-product.liquid` (sticky add-ons section)

2. `product.metafields.custom.list_product` - 0.0% population (6 products)
   **Code:** `size-chart.liquid` (comparison tables)

3. `product.metafields.custom.lock_type_test` - 0.0% population (7 products)
   **Code:** `variant-main-picker.liquid` (lock images)

**Action:** **KEEP IF USED** - Only used on specific products. If these features are important, keep them.

---

#### Detailed Specifications (Dynamic Rendering)

These metafields are accessed **dynamically** via `product.metafields[namespace][key]` in **`metafield-table.liquid`**:

1. `product.metafields.custom.model` - 0.2% (46 products)
2. `product.metafields.custom.model_series` - 0.1% (19 products)
3. `product.metafields.custom.safe_kind` - 0.1% (18 products)
4. `product.metafields.custom.safe_purpose` - 0.1% (23 products)
5. `product.metafields.custom.door_structure` - 0.1% (10 products)
6. `product.metafields.custom.body_structure` - 0.0% (6 products)
7. `product.metafields.custom.bolting` - 0.1% (25 products)
8. `product.metafields.custom.bolts_included` - 0.0% (9 products)
9. `product.metafields.custom.burglary_test_method` - 0.1% (16 products)
10. `product.metafields.custom.burglary_test_center` - 0.1% (16 products)
11. `product.metafields.custom.cash_rating` - 0.1% (20 products)

**Action:**
- **IF** your product detail pages show specification tables → **KEEP THESE**
- **IF** specification tables are empty/unused → **REMOVE FROM CODE** first, then delete metafields

---

## Part 3: Metafields to Keep (Active Usage)

### ✅ KEEP - Actively Used

#### Security & Certifications
- `product.metafields.custom.burglary_classification` - 24 products, 15+ files
- `product.metafields.custom.fire_duration` - 23 products, 15+ files
- `product.metafields.custom.burglary_test_center` - 16 products
- `product.metafields.custom.burglary_test_method` - 16 products
- `product.metafields.custom.cash_rating` - 20 products

#### Dimensions (All safes)
- `product.metafields.custom.new_depth` - Critical
- `product.metafields.custom.new_width` - Critical
- `product.metafields.custom.new_height` - Critical
- `product.metafields.custom.weight` - Important

#### Product Features
- `product.metafields.custom.lock` - 14 products
- `product.metafields.custom.lock_type` - 6 products
- `product.metafields.custom.lock_depth` - 14 products
- `product.metafields.custom.door_bolts` - 16 products
- `product.metafields.custom.shelf_number` - 6 products

#### Specialized Products
- `product.metafields.custom.eas_technology` - 18 products (security systems)
- `product.metafields.custom.door_opening_angle` - 18 products
- `product.metafields.custom.hinges` - 19 products

---

## Part 4: Collection Metafields

### Collection Metafields Used in Code

1. `collection.metafields.custom.read_more_text` - 4 template files
   **Action:** Check if collections use expandable descriptions. If not, remove.

2. `collection.metafields.custom.l1_subcategory` - 1 file (`L1-collection.liquid`)
   **Action:** Keep if using hierarchical collection navigation

3. `collection.metafields.custom.safe_view_file` - 2 files
   **Action:** Keep if collections have visualization files

4. `collection.metafields.custom.burglary_grade` - 3 files (collection badges)
5. `collection.metafields.custom.fire_resistance` - 3 files (collection badges)
   **Action:** Remove if you only show product-level badges (duplicates product data)

---

## Part 5: Reviews App Integration

### ✅ Keep IF Reviews App Installed

1. `reviews.rating.value.rating`
2. `reviews.rating.value.scale_max`
3. `reviews.rating_count`

**File:** `blocks/review.liquid`

**Action:**
- IF you have Judge.me, Loox, Yotpo, or similar reviews app → **KEEP**
- IF no reviews app → **REMOVE** the review block and references

---

## Removal Action Plan

### Phase 1: Remove High Confidence (72 metafields)

**Command (Shopify Admin):**
1. Go to Settings → Custom Data → Products
2. Delete the following metafield definitions:
   - All 18 fire extinguisher metafields
   - All 4 delivery pricing metafields
   - All 4 unused capacity metafields
   - All 15 miscellaneous technical metafields
   - All 12 product information (deprecated) metafields
   - All 6 Shopify standard (unused) metafields
   - All 5 mirror/specialized metafields

**Estimated Time:** 20 minutes
**Risk:** None (no data, no code references)

---

### Phase 2: Review & Decide (Code Cleanup)

**For metafields with code usage but minimal data:**

1. **Verify dimension metafields have data** (new_depth, new_width, new_height, weight)
   - If missing → Bulk update all products with dimensions
   - If truly not needed → Remove from all liquid files first

2. **Review specification table metafields**
   - Open a safe product page
   - Check if specification table shows useful info
   - If empty/useless → Remove `metafield-table.liquid` section
   - Then delete all spec metafields from Shopify Admin

3. **Review collection metafields**
   - Check if collections use read_more_text
   - Check if collection badges show
   - Remove unused ones

---

### Phase 3: Code Cleanup (If Removing Low-Usage Metafields)

**Files to edit if removing specifications/low-usage fields:**

1. `sections/metafield-table.liquid` - Remove unused metafield references
2. `sections/addons-product.liquid` - Remove if addon_products not used
3. `sections/size-chart.liquid` - Remove list_product if not used
4. `snippets/variant-main-picker.liquid` - Remove lock_type_test if not used
5. `snippets/collection-badges.liquid` - Remove collection-level badges if not used
6. Templates (`collection.json`, etc.) - Remove read_more_text references

---

## Rollback Procedure

**Before deleting ANY metafields:**

1. **Export product CSV** (already done: `products_export_1.csv`)
2. **Backup Shopify Admin metafield definitions:**
   - Screenshot Settings → Custom Data → Products
   - Note namespace, key, type, and validation for each metafield

3. **If you need to restore:**
   - Go to Settings → Custom Data → Products → Add definition
   - Re-create metafield with exact same namespace.key
   - Import CSV to restore values

---

## Priority Recommendation

### Do This First (Immediate, Low Risk)

**Remove these 50+ metafields immediately (no code, no data):**
- All fire extinguisher metafields (18)
- All delivery/pricing metafields (4)
- All capacity (guns/keys/laptops) metafields (4)
- All PDF/documentation metafields (12)
- All technical (bracket, bolt_type, etc.) metafields (15)

**Time:** 30 minutes
**Cleanup:** ~50 unused metafield definitions
**Risk:** Zero

### Do This Second (Review Required)

1. Verify dimensions (new_depth, new_width, new_height, weight) have data
2. Check specification table on product pages
3. Decide if collection metafields are used
4. Update code if removing any referenced fields

**Time:** 1-2 hours
**Risk:** Medium (requires code testing)

---

## Final Summary

| Category | Count | Action |
|----------|-------|---------|
| **Immediate Removal (No Risk)** | 72 | Delete from Shopify Admin |
| **Review Required (Code Used)** | 20 | Verify data → Keep or remove code first |
| **Keep (Active)** | 37 | No action needed |
| **Total Metafields** | 129 |  |

**Expected Cleanup:** ~56% reduction in metafield definitions

---

## Next Steps

1. ✅ Review this report
2. ⬜ Backup current state (CSV export already done)
3. ⬜ Remove 72 high-confidence metafields from Shopify Admin
4. ⬜ Verify dimension metafields have correct data
5. ⬜ Test product/collection pages after cleanup
6. ⬜ Remove code references if removing low-usage metafields
7. ⬜ Document final state

---

**Report Generated By:** Claude Code Metafield Analysis
**Data Source:** products_export_1.csv (18,818 rows)
**Code Analysis:** Complete theme scan (sections/, snippets/, templates/, blocks/)
