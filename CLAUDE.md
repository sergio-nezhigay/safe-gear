# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Shopify theme called "Safe Gear" based on the Horizon theme (v2.1.6). It's a complete e-commerce theme with modern JavaScript components and Liquid templating.

## Development Commands

```bash
# Start development server with live preview
npm run dev

# Push theme to Shopify store
npm run push

# Pull latest theme from Shopify store
npm run pull
```

Store configuration: f1what-2r.myshopify.com (theme ID: 183334175046)

## Architecture

### File Structure
- **`layout/theme.liquid`** - Main theme layout with head/body structure
- **`sections/`** - Reusable theme sections (header, footer, product sections, etc.)
- **`snippets/`** - Reusable Liquid components and utilities
- **`templates/`** - Page templates (JSON files that reference sections)
- **`assets/`** - JavaScript, CSS, and SVG assets
- **`config/`** - Theme configuration and settings schema

### JavaScript Architecture
- Modular ES6+ JavaScript with TypeScript definitions in `assets/global.d.ts`
- Component-based architecture with custom elements and event-driven patterns
- Key modules:
  - `critical.js` - Critical path JavaScript loaded synchronously
  - `component.js` - Base component class for custom elements
  - Individual component files (e.g., `cart-drawer.js`, `product-form.js`)

### CSS Architecture
- `base.css` - Core styles and design system
- Component-specific styles embedded in JavaScript modules
- CSS custom properties for theming and responsive design

### Liquid Template System
- Section-based architecture using Shopify's section groups
- Template inheritance through `layout/theme.liquid`
- Snippet system for reusable components
- Settings schema in `config/settings_schema.json` for theme customization

## Key Components

### E-commerce Features
- Cart drawer with live updates (`cart-drawer.js`, `component-cart-items.js`)
- Product forms with variant selection (`product-form.js`, `variant-picker.js`)
- Quick add functionality (`quick-add.js`)
- Predictive search (`predictive-search.js`)
- Product recommendations (`product-recommendations.js`)

### UI Components
- Media gallery with zoom (`media-gallery.js`, `drag-zoom-wrapper.js`)
- Header with drawer navigation (`header.js`, `header-drawer.js`)
- Slideshow component (`slideshow.js`)
- Disclosure/accordion components (`disclosure-custom.js`)

### Performance Features
- View transitions support (`view-transitions.js`)
- Section rendering and hydration (`section-renderer.js`, `section-hydration.js`)
- Performance monitoring (`performance.js`)

## Theme Development Notes

- Uses Shopify CLI for theme development workflow
- Supports theme editor live preview mode
- Implements modern web standards (custom elements, ES modules)
- Mobile-first responsive design approach
- Accessibility features with skip-to-content links