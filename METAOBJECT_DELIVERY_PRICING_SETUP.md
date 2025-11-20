# Delivery Pricing Metaobject Setup

## Step 1: Create Metaobject Definition

Go to: **Shopify Admin → Settings → Custom data → Metaobjects → Add definition**

**Definition settings:**
- **Name:** Delivery Pricing
- **Type:** `delivery_pricing`

**Fields:**

1. **Country Code** (Single line text)
   - Field name: `country_code`
   - Description: ISO country code (ES, FR, etc.)
   - Required: Yes

2. **Pricing Data** (JSON)
   - Field name: `pricing_data`
   - Type: Multi-line text
   - Description: JSON structure with pricing for all weight ranges
   - Required: Yes

## Step 2: Create Entries

### Spain Entry

**Country Code:** `ES`

**Pricing Data:**
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

### France Entry

**Country Code:** `FR`

**Pricing Data:**
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

**Note:** Prices are stored in cents (e.g., €20 = 2000 cents) to avoid decimal issues.

## Step 3: Get Metaobject IDs

After creating the entries, you'll need their GIDs for the section settings.

Go to: **Shopify Admin → Content → Metaobjects → Delivery Pricing**

Click on each entry and copy the GID from the URL or use GraphQL to query them.
