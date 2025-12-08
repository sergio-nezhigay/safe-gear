# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) and other AI coding assistants when working with code in this repository.

## Project Overview

This is the "Safe Gear" Shopify theme, originally based on Horizon (v2.1.6), now heavily customized. It is a modern, modular e-commerce theme using advanced Liquid, ES6+ JavaScript, and CSS custom properties. The codebase is organized for maintainability, performance, and accessibility.

## Development Commands

```bash
# Start local development server with live preview and hot reload
npm run dev

# Push theme to Shopify store (see .env for store config)
npm run push

# Pull latest theme from Shopify store
npm run pull
```

Store: f1what-2r.myshopify.com
Theme ID: 185002983750

## Architecture

### File Structure

- **`layout/theme.liquid`** — Main HTML structure, loads global assets and sections
- **`sections/`** — Modular, reusable theme sections (header, footer, product, collection, etc.)
- **`snippets/`** — Small, composable Liquid components and utilities
- **`blocks/`** — Block-level components for section composition
- **`templates/`** — Page templates (JSON, reference sections/blocks)
- **`assets/`** — JavaScript, CSS, SVG, and other static assets
- **`config/`** — Theme settings schema and presets

### JavaScript

- Modular ES6+ code, organized by feature/component
- Uses custom elements (Web Components) for UI (e.g., `<media-gallery>`, `<deferred-media>`)
- Event-driven architecture for interactivity (see `assets/events.js`)
- Key modules:
  - `critical.js` — Synchronously loaded, essential for page rendering
  - `media.js` — Handles product media, deferred loading, 3D models
  - `cart-drawer.js`, `product-form.js`, `variant-picker.js` — Cart and product logic
  - `component.js` — Base class for custom elements
- TypeScript types in `assets/global.d.ts` (for editor support)

### CSS

- Design system based on CSS custom properties (variables)
- `base.css` — Core styles, typography, layout, utility classes
- Component styles are modular, often colocated with JS or Liquid
- Responsive, mobile-first, with accessibility and focus states
- Uses modern CSS features (container queries, aspect-ratio, etc.)

### Liquid Template System

- Section-based, block-driven architecture
- Snippets for reusable UI and logic
- Settings schema in `config/settings_schema.json` for theme customization
- Extensive use of Shopify's dynamic sources, metafields, and localization

## Key Features

### E-commerce

- Cart drawer with live updates and AJAX add-to-cart
- Product forms with variant selection, dynamic pricing, and availability
- Quick add modal for fast shopping
- Predictive search and product recommendations
- Add-ons and upsell support (see `addons-product.liquid`)

### UI/UX

- Media gallery with zoom, video, and 3D model support
- Header with sticky/fixed options, drawer navigation, and localization
- Slideshow and marquee components
- Disclosure/accordion, skip-to-content, and accessibility helpers

### Performance & Modern Web

- View transitions for smooth navigation
- Section rendering and hydration for dynamic content
- Performance monitoring and lazy loading
- Uses Shopify's latest theme features (section groups, blocks, dynamic sources)

## Theme Development Notes

- Uses Shopify CLI for local development and deployment
- Supports theme editor live preview and design mode
- Follows best practices for accessibility (ARIA, keyboard nav, skip links)
- Modular, maintainable codebase — prefer small, composable snippets and blocks
- All metafields and custom data are documented in `METAFIELD_CLEANUP_REPORT.md`

---
