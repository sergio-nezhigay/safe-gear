# Product Metafields Table Section - User Guide

## Overview

The **Product Metafields Tables** section (`sections/metafield-table.liquid`) is a powerful, flexible component that displays product and variant metafields organized in grouped tables. It supports lazy loading, variant-specific metafields, and automatic table grouping.

---

## How It Works

### Architecture

1. **Block-Based System**: Each metafield row is added as a block in the Shopify theme editor
2. **Automatic Grouping**: Blocks with the same "Group Name" are automatically grouped into separate tables
3. **Variant Support**: Metafields can be linked to specific variants and update dynamically when customers select different options
4. **Lazy Loading**: Content loads only when scrolling near the section for better performance
5. **Dynamic Updates**: JavaScript handles variant changes and shows/hides relevant metafields

### Data Flow

```
Product/Variant → Metafield (namespace.key) → Block Settings → Table Row → Grouped Table
```

---

## Adding Metafields to the Table

### Step-by-Step Instructions

#### 1. **Add a Metafield Row Block**
   - In the Shopify theme editor, navigate to the product template
   - Find the "Product Metafields Tables" section
   - Click "Add block" → Select "Metafield Row"

#### 2. **Configure the Block Settings**

**Required Fields:**

- **Label**: The display name shown to customers (e.g., "Height", "Weight", "Material")
- **Metafield Namespace**: Usually `custom` for custom metafields (or `global` for global metafields)
- **Metafield Key**: The unique identifier for the metafield in Shopify (e.g., `new_height`, `product_weight`)

**Optional Fields:**

- **Group Name**: The table this metafield belongs to (see Grouping section below)
- **Unit**: Optional unit to display (e.g., "cm", "kg") - only if metafield doesn't include units
- **Text for True/False**: Custom text for boolean metafields (default: "Yes"/"No")

**Advanced:**

- **Variant metafield checkbox**: Enable if this metafield belongs to product variants (not the product itself)

#### 3. **Example Configuration**

```
Label: "Height"
Group Name: "Outer Dimensions"
Metafield Namespace: "custom"
Metafield Key: "new_height"
Variant metafield: ☐ (unchecked - product level)
```

---

## Grouping Metafields

### How Grouping Works

All metafield rows with the **same Group Name** will be displayed together in a single table, with the group name as the table header.

### Example: Creating Dimension Tables

**Group 1: "Outer Dimensions"**
- Height → `custom.new_height`
- Width → `custom.new_width`
- Depth → `custom.new_depth`

**Group 2: "Inner Dimensions"**
- Height (inner) → `custom.new_height_interior`
- Width (inner) → `custom.new_width_interior`
- Depth (inner) → `custom.new_depth_interior`

**Result**: Two separate tables, one labeled "Outer Dimensions" and one labeled "Inner Dimensions"

### Current Groups in Safe Gear Theme

The theme currently uses these groups:
1. **Ydre dimensioner** (Outer dimensions)
2. **Indre dimensioner** (Inner dimensions)
3. **Produktspecifikationer** (Product specifications)
4. **Konstruktion** (Construction)
5. **Installation** (Installation)
6. **Sikkerhed & Certifikater** (Safety & Certificates)

You can create new groups by simply using a new group name!

---

## Variant Metafields

### When to Use

Enable the "Variant metafield" checkbox when:
- The metafield is attached to **variants** (not the product)
- Different variants have different values for this field
- You want the value to update when customers select different options

### How It Works

1. **Initial Load**: Shows the metafield for the first available variant
2. **Variant Selection**: When a customer selects a different variant, JavaScript updates the row
3. **Empty Values**: If a variant doesn't have the metafield, the row is automatically hidden
4. **Smooth Transitions**: Rows fade in/out smoothly when showing/hiding

### Example Use Case

If you have safes in different sizes (variants) with different weights:
- Product: "Premium Safe"
- Variant 1: Small (50 kg)
- Variant 2: Large (100 kg)

Configure the weight metafield with:
```
Label: "Weight"
Group Name: "Product Specifications"
Metafield Namespace: "custom"
Metafield Key: "variant_weight"
Variant metafield: ☑ (checked)
```

When customers select "Large", the weight automatically updates to "100 kg".

---

## Supported Metafield Types

### Text
Simple text strings display as-is.

### Numbers
Numeric values are displayed with optional units.

### Dimensions/Measurements
Shopify dimension metafields (with value and unit) are automatically formatted:
```liquid
{{ metafield_value.value.value }} {{ metafield_value.value.unit }}
// Example output: "150 cm"
```

### Weights
Weight metafields work the same as dimensions.

### Booleans (Yes/No)
Boolean metafields display custom text:
- Configure "Text for True" (default: "Yes")
- Configure "Text for False" (default: "No")

### URLs
URLs are automatically detected and formatted as clickable links with styling.

---

## Special Features

### Lazy Loading

By default, the section uses lazy loading:
- Content loads when the user scrolls within 100px of the section
- Skeleton loading state shows while loading
- Improves page performance, especially on long product pages

To disable: Uncheck "Enable lazy loading" in section settings

### Empty Value Handling

- If a metafield has no value, the row is not displayed
- If **all** metafields in a group are empty, the entire table is hidden
- This keeps the page clean for products with incomplete data

### Accessibility Features

- Screen reader announcements when content loads
- Proper ARIA labels and semantic HTML
- Keyboard navigation support
- Skip links and focus management

---

## JavaScript Behavior

The section uses a custom element `<product-metafields-section>` with these capabilities:

### Event Listeners

Listens for `variant:update` events from the product form:
```javascript
document.addEventListener('variant:update', (event) => {
  // Updates variant metafield rows
});
```

### Methods

- `handleVariantUpdate()`: Updates variant-specific metafields
- `extractMetafieldValue()`: Parses metafield objects and extracts display values
- `showRow()` / `hideRow()`: Smooth transitions for showing/hiding rows

---

## Tips & Best Practices

### Naming

- Use descriptive Group Names - they're visible to customers
- Keep labels short and clear
- Use consistent naming across products

### Organization

- Group related metafields together
- Order blocks logically (dimensions together, specs together, etc.)
- Use empty groups to separate sections visually

### Performance

- Enable lazy loading for sections below the fold
- Only add metafields that have values for most products
- Use variant metafields sparingly (only when values differ by variant)

### Data Entry

- Ensure metafield data is complete and accurate in Shopify admin
- Use consistent units across all products
- Test with products that have missing metafields to ensure graceful handling

---

## Troubleshooting

### Metafield Not Showing

1. Check the metafield has a value in Shopify admin
2. Verify namespace and key are correct (case-sensitive)
3. Ensure the product/variant has the metafield assigned
4. Check browser console for JavaScript errors

### Table Not Appearing

1. At least one metafield in the group must have a value
2. Verify group names match exactly (case-sensitive)
3. Check if lazy loading is enabled and scroll to the section

### Variant Metafield Not Updating

1. Ensure "Variant metafield" checkbox is enabled
2. Verify metafield is attached to variants (not product)
3. Check browser console for `variant:update` events
4. Ensure variant has the metafield defined

---

## Technical Reference

### Files

- **Section**: `sections/metafield-table.liquid`
- **JavaScript**: `assets/product-metafields-tables.js`
- **Custom Element**: `<product-metafields-section>`

### Data Attributes

- `data-section-id`: Unique section identifier
- `data-lazy-load`: Enable/disable lazy loading
- `data-variant-metafield`: Marks variant-specific rows
- `data-metafield-key`: Namespace.key for variant lookups
- `data-variant-row`: Identifies rows that update on variant change

### CSS Classes

- `.metafields-table`: Main table element
- `.table-container`: Table wrapper with styling
- `.table-header`: Group name header row
- `.metafields__skeleton`: Loading skeleton state
- `[data-variant-row]`: Variant-specific row transitions
