# Metafields Documentation

This document is a structured reference for all metafields used in the Safe Gear theme. For each metafield it records the current key, where it appears visually, what it stores, and a suggested clearer internal name.

---

## Product Metafields (`product.metafields.custom.*`)

### Dimensions — External

| # | Current Key | Theme Location | Function | Suggested Name |
|---|---|---|---|---|
| 1 | `new_height` | Collection pages (filter sidebar, product card spec row "H × W × D"), Size Chart table (external dimensions column), L1 collection filter aggregation | Stores the safe's external height in mm (e.g. `"800 mm"`). Stripped of unit and cast to number for range-filter logic and display. | `external_height_mm` |
| 2 | `new_width` | Same as `new_height` | Stores the safe's external width in mm. | `external_width_mm` |
| 3 | `new_depth` | Same as `new_height` | Stores the safe's external depth in mm. | `external_depth_mm` |

### Dimensions — Interior

| # | Current Key | Theme Location | Function | Suggested Name |
|---|---|---|---|---|
| 4 | `new_height_interior` | Size Chart section (`sections/size-chart.liquid`), "Internal Dimensions" column | Stores the safe's usable interior height in mm. Displayed alongside interior width and depth. | `interior_height_mm` |
| 5 | `new_width_interior` | Same as `new_height_interior` | Stores the safe's usable interior width in mm. | `interior_width_mm` |
| 6 | `new_depth_interior` | Same as `new_height_interior` | Stores the safe's usable interior depth in mm. | `interior_depth_mm` |

### Weight

| # | Current Key | Theme Location | Function | Suggested Name |
|---|---|---|---|---|
| 7 | `weight` | Collection pages — product card spec row "Weight", also data attribute `data-weight` for JS range filter. Fallback: variant Shopify weight field is used when this is blank. | Stores the safe's weight in kg (e.g. `"45 kg"`). Takes priority over the variant weight field for display. | `weight_kg` |

### Burglary Security

| # | Current Key | Theme Location | Function | Suggested Name |
|---|---|---|---|---|
| 8 | `burglary_classification` | **Product page** — Security Badges block (`snippets/product-security-badges.liquid`): selects the correct icon image and description text for the burglary grade badge. **Collection pages** — `collection-list-new.liquid` and `L1-collection.liquid`: `data-burglary-grade` attribute on each card, drives filter checkboxes and badge rendering. `snippets/custom-product-card.liquid`: data attribute for JS filtering. | The primary burglary resistance classification string (e.g. `"Grade III"`, `"Grade IV"`, `"S1"`). Pattern-matched against known grade strings to pick the right badge icon configured in theme settings. | `burglary_grade_label` |
| 9 | `burglary_grade` | `sections/collection-list-all.liquid` — used on individual products to build filter values and render security badges on collection listing cards. | Older/alternate burglary grade field used in the "all" collection layout. Stores same kind of value as `burglary_classification` (e.g. `"Grade II"`). | `burglary_grade_alt` |
| 10 | `burglary_grade_mt` | `sections/collection-list-new.liquid` — fallback when `burglary_classification` is blank on a product card. | Secondary/fallback burglary grade. Likely populated for products created via a metaobject or import pipeline. | `burglary_grade_fallback` |
| 11 | `burglary_test_center` | `sections/collection-list-new.liquid` — small text line displayed beneath the burglary badge on collection cards (e.g. "SP Technical Research Institute"). | Name of the independent testing laboratory that certified the burglary resistance. | `burglary_test_lab` |
| 12 | `burglary_test_method` | `sections/collection-list-new.liquid` — small text line displayed beneath the burglary badge (first two words shown, e.g. `"EN 1143-1"`). | Test standard / method used for the burglary certification (e.g. `"EN 1143-1 Grade IV"`). | `burglary_test_standard` |

### Fire Resistance

| # | Current Key | Theme Location | Function | Suggested Name |
|---|---|---|---|---|
| 12 | `fire_duration` | **Product page** — Security Badges block (`snippets/product-security-badges.liquid`): selects the fire resistance icon and description. **Collection pages** — `collection-list-new.liquid` and `L1-collection.liquid`: `data-fire-resistance` attribute, drives filter and badge. `snippets/custom-product-card.liquid`: data attribute. | The primary fire resistance value (e.g. `"60minutter"`, `"30"`, `"Fire Insulated"`). Pattern-matched to select the correct badge icon. | `fire_resistance_label` |
| 13 | `fire_resistance` | `sections/collection-list-all.liquid` — product-level fire resistance used to build filter values and render fire badges on collection listing cards. | Older/alternate fire resistance field used in the "all" collection layout. | `fire_resistance_alt` |
| 14 | `fire_resistant_mt` | `sections/collection-list-new.liquid` — fallback when `fire_duration` is blank on a product card. | Secondary/fallback fire resistance value. | `fire_resistance_fallback` |
| 15 | `fire_test_center` | `sections/collection-list-new.liquid` — small text line displayed beneath the fire badge on collection cards. | Name of the fire testing laboratory (e.g. `"SP Technical Research Institute"`). | `fire_test_lab` |
| 16 | `fire_test_method` | `sections/collection-list-new.liquid` — small text line below the fire badge (first two words shown, e.g. `"NT Fire"`). | Fire test standard/method (e.g. `"NT Fire 017 60 minutes"`). | `fire_test_standard` |

### Variant Picker — Lock & Frame

| # | Current Key | Theme Location | Function | Suggested Name |
|---|---|---|---|---|
| 17 | `lock_type_test` | **Product page** — Variant picker (`snippets/variant-main-picker.liquid`): when the variant option is a "lock" type, each lock option value is matched against this list to find its image, which is rendered as an 83×83 px image button instead of plain text. | A list of objects, each with a `name` (lock label) and `image` (lock image). Provides visual image buttons for lock type selection. Supports Danish↔English name mapping. | `lock_type_images` |
| 18 | `frame_type` | **Product page** — Variant picker (`snippets/variant-main-picker.liquid`): when the option is a "frame" type, matched against this list by handle to display a `picture` image as the variant button. | A list of objects, each with `system.handle` and `picture` (image). Provides visual image buttons for frame type selection. | `frame_type_images` |

### Physical Properties

| # | Current Key | Theme Location | Function | Suggested Name |
|---|---|---|---|---|
| 19 | `bolting` | `sections/collection-list-new.liquid` — displayed in the spec row labelled "Bolting" on collection product cards. | Bolting point description(s) for the safe (e.g. `"Floor bolting"`, `["Floor", "Wall"]`). Can be a single string or a list. | `bolting_points` |

### Add-ons

| # | Current Key | Theme Location | Function | Suggested Name |
|---|---|---|---|---|
| 20 | `addon_products` | **Product page** — `sections/addons-product.liquid`: loops through this list to render the "Complete Your Setup" add-on grid. | A list of related product references (up to the section's configured limit). Each referenced product is shown as a card with checkbox/quantity selector in the add-on section. | `addon_product_list` |
| 21 | `addon_type` | **Product page** — `sections/addons-product.liquid`: sets CSS class `addon-card--{type}` and controls whether a quantity selector is shown. | Controls the UI type for an add-on product card. Value `"quantity"` shows a quantity stepper; other values show a simple checkbox. Set on the *add-on product itself*, not the main product. | `addon_ui_type` |

### Downloads & Files

| # | Current Key | Theme Location | Function | Suggested Name |
|---|---|---|---|---|
| 22 | `user_manuals` | **Product page** — `snippets/product-downloads.liquid`: renders a "Downloads" section with a list of file links. | A list of file objects (PDF, etc.). Each file's `alt` text is used as the link label; the file URL is used as the download href. | `downloadable_files` |
| 23 | `safe_view_file` | `sections/collection-list-all.liquid`: shown as a 290×178 px image on collection listing cards when present. | An image file showing a cross-section or interior view of the safe. Displayed on collection cards as a secondary visual. | `safe_interior_image` |

### Related Products Table

| # | Current Key | Theme Location | Function | Suggested Name |
|---|---|---|---|---|
| 24 | `list_product` | **Product page** — `sections/size-chart.liquid`: the section only renders if this metafield is not blank. Loops through the list to build a comparison table with model name, external/interior dimensions, weight, and price. | A list of product references — typically the other size variants of the same safe model. Enables a clickable size-comparison table on the product page. | `related_size_variants` |

---

## Collection Metafields (`collection.metafields.custom.*`)

| # | Current Key | Theme Location | Function | Suggested Name |
|---|---|---|---|---|
| 25 | `burglary_grade` | `sections/collection-list-all.liquid` (badge + filter value on collection cards), `sections/collection-list-new.liquid` (primary value, falls back to `burglary_grade_mt`), `sections/new-collection-grid.liquid` (security badge). | The collection's primary burglary resistance classification (e.g. `"Grade III"`). Used to render a security badge on collection cards and to drive filter checkboxes. | `collection_burglary_grade` |
| 26 | `fire_resistance` | Same three sections as `burglary_grade` above. | The collection's primary fire resistance value (e.g. `"60minutter"`). Used to render a fire badge and drive fire filter checkboxes. | `collection_fire_resistance` |
| 27 | `burglary_grade_mt` | `sections/collection-list-new.liquid` — used as a fallback when `burglary_grade` is blank. | Alternate/fallback burglary grade for the collection (possibly populated via a different import method). | `collection_burglary_grade_fallback` |
| 28 | `fire_resistant_mt` | `sections/collection-list-new.liquid` — used as a fallback when `fire_resistance` is blank. | Alternate/fallback fire resistance for the collection. | `collection_fire_resistance_fallback` |
| 29 | `l1_subcategory` | `sections/L1-collection.liquid` — iterated to build sub-collection tabs/links on category landing pages. Product data from each sub-collection is aggregated for the filter sidebar. | A list of collection references that are the direct sub-categories of this L1 (top-level) category. Drives tab navigation and filter aggregation. | `subcategory_collections` |
| 30 | `read_more_text` | Collection page templates (`templates/collection.json`, `collection.l1-collection.json`, `collection.l2-collection.json`, `collection.collection-listing.json`) — passed as the `hidden_text` setting of a section, enabling an expandable "read more" description block. | Long-form descriptive text for the collection, hidden by default and revealed with a "read more" toggle. | `collection_description_expandable` |
| 31 | `safe_view_file` | `sections/collection-list-all.liquid` — displayed as a 290×178 px image inside the collection card's extra info panel. | An image (cross-section, interior diagram, or product view) associated with the collection, shown as a secondary visual on listing cards. | `collection_safe_image` |

---

## Other Metafields

| # | Current Key | Theme Location | Function | Suggested Name |
|---|---|---|---|---|
| 32 | `product.metafields.reviews.rating` | **Product page** — `blocks/review.liquid`: reads `.value.rating` for the numeric star value and `.value.scale_max` for the maximum (typically 5). Renders a star-rating visual and numeric score. | Structured rating metafield populated automatically by a reviews app (Judge.me, Loox, Yotpo, etc.). Stores rating value and scale as a Shopify `rating` type. | *(App-managed — do not rename)* |
| 33 | `product.metafields.reviews.rating_count` | **Product page** — `blocks/review.liquid`: displays total number of reviews next to the star rating. | Integer count of product reviews, populated by the reviews app. | *(App-managed — do not rename)* |
| 34 | `shop.metafields.wishlistHero` | `snippets/wishlisthero-header-icon.liquid` — reads sub-keys like `WishListHero_iconType`, `WishListHero_ShowHeaderIcon`, `WishListHero_icon_url` to render the wishlist heart icon in the site header. | Namespace object populated by the **WishList Hero** Shopify app. Controls icon type, visibility, and URL of the header wishlist button. | *(App-managed — do not rename)* |

---

## Quick Reference: Naming Convention for Custom Fields

The suggested names above follow a consistent pattern:

| Pattern | Example |
|---|---|
| `external_{dimension}_mm` | `external_height_mm` |
| `interior_{dimension}_mm` | `interior_height_mm` |
| `weight_kg` | `weight_kg` |
| `burglary_grade_label` | primary classification |
| `burglary_grade_alt` / `_fallback` | secondary / fallback |
| `fire_resistance_label` | primary classification |
| `{topic}_test_lab` / `_standard` | certification metadata |
| `lock_type_images` / `frame_type_images` | variant picker image lists |
| `addon_*` | add-on product fields |
| `downloadable_files` | file list |
| `related_size_variants` | size comparison table |
| `collection_*` | collection-level equivalents |

> **Note on renaming:** Shopify metafield keys are referenced by their namespace and key throughout the Liquid templates. Renaming a key requires updating every `.liquid` file that references the old name **and** migrating existing metafield data in the Shopify admin. Suggested names are provided for clarity — adopt them only as part of a planned migration.

---

## Documentation Corrections

The following corrections apply to the tables above, identified during code review of all `.liquid` files.

### Misclassified Product Metafields
Items **#10** (`burglary_grade_mt`) and **#14** (`fire_resistant_mt`) were incorrectly listed under Product Metafields. Code review confirms these keys are only referenced on the `collection` object in Liquid — they are collection metafields. They are correctly documented as Collection Metafields **#27** and **#28** respectively.

### Duplicate Row Number
The Fire Resistance table contains a duplicate row number **#12** (both `burglary_test_method` and `fire_duration` are numbered #12). The correct sequence through those two sections is:

| Correct # | Key |
|---|---|
| 8 | `burglary_classification` |
| 9 | `burglary_grade` |
| 10 | ~~`burglary_grade_mt`~~ *(collection-only — see #27)* |
| 11 | `burglary_test_center` |
| 12 | `burglary_test_method` |
| 13 | `fire_duration` |
| 14 | ~~`fire_resistant_mt`~~ *(collection-only — see #28)* |
| 15 | `fire_resistance` |
| 16 | `fire_test_center` |
| 17 | `fire_test_method` |

### Additional Theme Locations
The following files reference metafields but were omitted from the Theme Location column in the tables above:

| Metafield Key(s) | Additional Location |
|---|---|
| `burglary_classification`, `fire_duration`, `new_height`, `new_width`, `new_depth`, `weight` | `sections/collection-grid.liquid` — same product card spec row and `data-*` attributes as other collection pages |
| `collection.custom.burglary_grade`, `collection.custom.fire_resistance` | `snippets/collection-badges.liquid` — renders security badge SVGs on collection headers |
| `new_height`, `new_width`, `new_depth` | `snippets/related-products.liquid` (inline JS block) — reads dimension values for recommendation logic |

---

## Traceability Matrix

Maps each deliverable requirement from the client brief to the section of this document that satisfies it.

| Requirement | Status | Satisfied By |
|---|---|---|
| Document the **Theme Location** for every metafield | ✅ Done | "Theme Location" column in all tables (Product, Collection, Other sections) |
| Document the **Function / what it stores** for every metafield | ✅ Done | "Function" column in all tables |
| Provide a **Suggested Internal Name** for every custom metafield | ✅ Done | "Suggested Name" column in all tables |
| Cover all **product-level** custom metafields | ✅ Done | Product Metafields section — 22 unique keys (#1–#24, excluding the two misclassified entries) |
| Cover all **collection-level** custom metafields | ✅ Done | Collection Metafields section — 7 keys (#25–#31) |
| Cover **app-managed** metafields | ✅ Done | Other Metafields section — reviews rating, rating count, WishList Hero (#32–#34) |
| **Identify and list unused metafields** for clean-up | ✅ Done | Clean-Up Candidates section below |

---

## Clean-Up Candidates

The following metafield definitions were found in the Shopify admin but are **not referenced in any Liquid template file**. They are candidates for deletion. Definitions with zero products/collections assigned carry no risk; those with data on products should be verified before removal.

> **How to delete:** Shopify admin → Settings → Custom data → [resource] → [definition name] → Delete definition. Deleting a definition does **not** automatically delete the data stored on individual products — a separate bulk data removal step is needed if you want to fully clean up.

### Structured Product Metafield Definitions (admin-registered, not in theme)

These definitions appear in **Settings → Custom data → Product metafield definitions** but have no corresponding Liquid reference:

| Definition Name | Type | Usage | Recommendation |
|---|---|---|---|
| Search product boosts | Single line text | 0 products | **Delete** — Unused Horizon built-in, 0 data |
| Related products | Product | 0 products | **Delete** — Unused Horizon built-in (`complementary_products`-style), 0 data |
| Related products settings | Single line text | 0 products | **Delete** — Unused Horizon built-in companion field, 0 data |
| Complementary products | Product | 0 products | **Delete** — Unused Horizon built-in, 0 data |
| Call For Price | True or false | 1,197 products | **Review** — Not in theme Liquid, but has data on 1,197 products. Likely consumed by a third-party app or manual workflow. Confirm with client before deleting. |

### Unstructured Product Metafields (data exists on products, no definition, not in theme)

These appear in **Settings → Custom data → Product metafield definitions → View unstructured metafields**:

| Namespace & Key | Usage | Recommendation |
|---|---|---|
| `app--3890849--eligibility.eligibility_details` | 1,135 products | **Keep** — App-managed (eligibility app). Do not delete. |
| `custom.collection_from_safegear_warehouse_price` | 1 product | **Delete** — Single product, no theme reference, likely a test or import artifact |
| `custom.ctm_pdf_url` | 1 product | **Delete** — Single product, no theme reference |
| `custom.custom_product_meta` | 1 product | **Delete** — Vague name, single product, no theme reference |
| `custom.delivery_curbside` | 1 product | **Delete** — Single product, no theme reference |
| `custom.delivery_to_final_location` | 1 product | **Delete** — Single product, no theme reference |
| `custom.delivery_with_bolting` | 1 product | **Delete** — Single product, no theme reference |
| `custom.insurance_approved` | 3 products | **Review** — Not in theme, but set on 3 products. Confirm whether used by an external process or app before deleting. |
| `custom.location` | 1 product | **Delete** — Single product, no theme reference |
| `custom.more_about_delivery_and_installation` | 1 product | **Delete** — Single product, no theme reference |
| `custom.more_about_delivery_and_installation_url` | 1 product | **Delete** — Single product, no theme reference |
| `custom.product_pdf_heading_first` | 22 products | **Review** — Not in theme Liquid, but set on 22 products. May be used by a PDF-generation app or external process. Confirm before deleting. |
| `custom.product_pdf_heading_second` | 1 product | **Delete** — Single product, no theme reference |
| `custom.product_pdf_url_first` | 22 products | **Review** — Same as `product_pdf_heading_first`. Confirm app usage before deleting. |
| `custom.product_pdf_url_second` | 1 product | **Delete** — Single product, no theme reference |
| `custom.short_description` | 1,082 products | **Review** — Not in theme Liquid, but set on 1,082 products. Likely consumed by a third-party app (search, reviews, etc.). Do not delete without confirming with client. |

### Structured Collection Metafield Definitions

All 6 collection definitions are **in use in the theme**. However:

| Definition Name (Admin) | Key | Usage | Note |
|---|---|---|---|
| burglary_grade | `burglary_grade` | 0 collections | **Review** — Key is referenced in Liquid but currently has no data on any collection. Data may be stored only as unstructured values. Definition can remain as a data-entry scaffold. |

### Unstructured Collection Metafields

| Namespace & Key | Usage | Recommendation |
|---|---|---|
| `custom.collection_level` | 1 collection | **Delete** — Not referenced in theme, single collection. Likely a legacy test field. |

### Metaobject Definitions

Found in **Settings → Custom data → Metaobjects**:

| Definition | Added By | Entries | Status |
|---|---|---|---|
| Lock Type | Safegear ApS | 16 | **Keep** — Used by `lock_type_test` metafield (#17) for variant picker image buttons |
| Frame Type | Safegear ApS | 2 | **Keep** — Used by `frame_type` metafield (#18) for variant picker image buttons |
| Color | Shopify | 4 | **Keep** — Shopify built-in, do not modify |
| Table | Shopify Developer | 5 | **Review** — Not referenced in theme Liquid. May be a Shopify-internal scaffold or leftover from a previous app. Check entries before deleting. |
| Table Height | Shopify Developer | 7 | **Review** — Same as above. |
| configuration | Shopify Developer | 3 | **Review** — Likely a Shopify CLI / theme app scaffold. Check if any app depends on it before deleting. |
| CollectionData | Muskan Sethiya | 2 | **Review** — Not referenced in theme Liquid. Appears to be a custom definition created by a team member. Confirm intended use before deleting. |

### Important Note: Core Theme Fields Have No Admin Definitions

The primary product metafields used throughout the theme — `new_height`, `new_width`, `new_depth`, `new_height_interior`, `new_width_interior`, `new_depth_interior`, `weight`, `burglary_classification`, `fire_duration`, `burglary_test_center`, `burglary_test_method`, `fire_test_center`, `fire_test_method`, `bolting`, `safe_view_file`, `list_product`, `lock_type_test`, `frame_type` — **do not have registered definitions** in the Shopify admin.

This means:
- They are not editable via a structured form in the product admin page
- There is no type validation on the values stored
- They are invisible in the admin UI unless you navigate to a product and scroll to its raw metafields

**Recommendation:** Register definitions for the most-edited fields (e.g. `new_height`, `new_width`, `new_depth`, `weight`, `burglary_classification`, `fire_duration`) so that the merchandising team can edit them safely from the product page in the admin.
