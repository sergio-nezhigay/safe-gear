# Multilanguage Readiness Audit

## Scope

I reviewed the theme structure, shared shell, page templates, and the custom storefront sections/snippets that generate visible copy.

## Overall Assessment

The theme has a good localization foundation, but the storefront is not fully multilingual-ready yet.

- Good: the base shell already sets `lang="{{ request.locale.iso_code }}"`, and many core controls use `t` keys.
- Good: the localization picker is present and the search/accessibility strings are already wired through locale files in several shared snippets.
- Risk: many page templates and custom sections still ship fixed English or Danish copy in template JSON defaults and section settings.
- Risk: a few shared UI components still contain hardcoded visible text, so language switching will not fully change the storefront copy.
- Risk: some template content looks like manually entered page content rather than reusable locale-driven copy, which means it must be translated per locale or refactored into locale-backed defaults.

In short: the theme is structurally prepared for multilingual support, but the content layer is only partially localized.

## What Is Already In Good Shape

- `layout/theme.liquid` already uses the active locale on the root `<html>` tag.
- Shared localization UI exists in `snippets/localization-form.liquid`, `snippets/dropdown-localization.liquid`, and `snippets/drawer-localization.liquid`.
- Many schema labels in core blocks and sections already use `t:` keys.
- Search, predictive search, and several blog/comment utilities already rely on translation keys.

## Main Findings By Page Surface

### Global Shell

- `snippets/localization-form.liquid` still contains a literal `Country/Region` label, so the country/language picker is not fully localized.
- `sections/breadcrumbs.liquid` uses hardcoded fallback labels such as `Home`, `Collections`, `Search`, `Account`, `Addresses`, `Order`, and `Back`.
- `sections/new-header.liquid` and `sections/header-group.json` contain hardcoded header/help labels like `Welcome to our store`, `Contact Information`, `Live Chat`, `Security Safes`, `Fire Safety`, and `Order process`.
- `sections/footer-new.liquid` and `sections/footer-group.json` contain hardcoded footer/contact text such as `Contact`, `Phone`, `Email`, `Privacy Policy`, `Join our email list`, and `Get exclusive deals...`.

### Home Page

- `templates/index.json` is heavily content-driven and contains fixed copy in multiple blocks.
- The hero, blog grid, why-choose-us, and FAQ/import blocks are stored with single-language content, so the homepage will not automatically switch copy by locale.
- Several values appear as merchant content, not theme strings, so they need a locale strategy rather than only a translation-key pass.

### Product Page

- `templates/product.json` contains many hardcoded UI labels: breadcrumb fallbacks, `SKU:`, volume pricing text, delivery/install labels, add-on labels, size chart labels, and the related-products heading.
- `sections/delivery-info-dynamic.liquid` has hardcoded UI strings like `Delivery time`, `Installation`, `Loading prices...`, `Transport Form`, and `Transport & Installation Estimate`.
- `sections/addons-product.liquid` has hardcoded labels such as `Your Selection`, `Add to Cart`, `Checkout`, `Remove Add-ons`, and `Add-ons`.
- `sections/product-navigation-marquee.liquid` exposes many English schema defaults for nav labels and icons, which will leak into any prebuilt product navigation preset.
- `sections/metafield-table.liquid`, `sections/size-chart.liquid`, and related product info sections have English fallback labels and placeholder text that should be moved to locale keys.

### Collection and Collection-List Pages

- `templates/collection.json`, `templates/collection.l1-collection.json`, `templates/collection.l2-collection.json`, and `templates/collection.collection-listing.json` all use hardcoded breadcrumb labels and collection header text.
- The collection header presets include `Read more`, `Show Less`, `Our Safe Collections`, and similar fixed strings.
- `sections/collection-grid.liquid`, `sections/collection-list-new.liquid`, `sections/collection-list-all.liquid`, and `sections/new-collection-grid.liquid` use English fallback CTA text in the UI and schema defaults.
- Several collection-filter labels are mixed-language already, which is a sign that the page is not using a single translation source of truth.

### Cart, Search, Blog, Article, 404, Password

- `templates/cart.json` contains hardcoded `Cart`, `You may also like`, and `View all`.
- `templates/404.json` contains hardcoded `Page not found`, `The link may be incorrect...`, and `Continue shopping`.
- `templates/password.json` contains hardcoded `Opening soon`, newsletter copy, and `Sign up`.
- `sections/search-header.liquid`, `sections/search-results.liquid`, and `snippets/predictive-search.liquid` are mostly localized already, but should still be checked against the locale files for full key coverage.
- `templates/blog.json` and `templates/article.json` are mostly locale-safe in structure, but the preset content still depends on stored article/blog titles and the translated comment labels.

### Help Center, Contact, B2B, and Custom Marketing Pages

- `templates/page.help-center.json`, `templates/page.center-help.json`, `templates/page.contact.json`, `templates/page.contact-us.json`, and `templates/page.b2b-form.json` contain fixed page content in one language.
- `sections/knowledge-base.liquid` ships hardcoded FAQ and call-to-action defaults such as `Knowledge base`, `Did you find what you are looking for?`, and `Ask a question`.
- `sections/import-info.liquid` contains hardcoded article titles and FAQ entries.
- `sections/banner-help-center.liquid` uses fixed search placeholder text like `Search products...`.
- `sections/section.liquid` includes a hardcoded shipping paragraph and a `Submit` button default.

## Files That Need Attention First

- `snippets/localization-form.liquid`
- `sections/breadcrumbs.liquid`
- `sections/header-group.json`
- `sections/footer-group.json`
- `sections/new-header.liquid`
- `sections/footer-new.liquid`
- `sections/delivery-info-dynamic.liquid`
- `sections/addons-product.liquid`
- `sections/product-navigation-marquee.liquid`
- `sections/collection-grid.liquid`
- `sections/collection-list-new.liquid`
- `sections/collection-list-all.liquid`
- `sections/new-collection-grid.liquid`
- `sections/knowledge-base.liquid`
- `sections/import-info.liquid`
- `sections/banner-help-center.liquid`
- `sections/section.liquid`
- `templates/index.json`
- `templates/product.json`
- `templates/collection.json`
- `templates/cart.json`
- `templates/404.json`
- `templates/password.json`
- `templates/page.help-center.json`
- `templates/page.center-help.json`
- `templates/page.contact.json`
- `templates/page.contact-us.json`
- `templates/page.b2b-form.json`

## Risks

- Many of the JSON template files are auto-generated by Shopify and can be overwritten by the theme editor, so direct edits need a controlled process.
- A lot of the visible copy is stored as section settings rather than theme strings, so translation work will require either locale-aware defaults or re-saving content per locale.
- Some exported content appears to have encoding artifacts in the current JSON snapshots, so re-saving those presets should be done carefully to avoid character corruption.

## Plan To Correct The Theme

| Item | What to change | Estimate |
| --- | --- | --- |
| 1 | Normalize the shared shell: replace hardcoded breadcrumbs, header/help text, footer/contact text, and localization labels with locale keys. | 4-6h |
| 2 | Clean up the product page surface: move product-page CTA text, delivery/install text, add-on labels, size chart labels, and product navigation defaults to translation keys or locale-backed section defaults. | 10-14h |
| 3 | Clean up the collection surfaces: localize collection header copy, filter labels, show-more text, and collection-list/button defaults across the collection templates and sections. | 6-8h |
| 4 | Clean up utility pages: localize cart, search, blog/article, 404, and password page preset copy and verify the shared snippets still resolve the right keys. | 6-8h |
| 5 | Clean up custom marketing/help pages: move homepage, help-center, contact, B2B, knowledge-base, import-info, banner, and generic section defaults into a locale strategy. | 8-12h |
| 6 | Fill missing locale keys, remove English fallbacks where possible, and run a locale QA pass across the main storefront routes. | 4-6h |

### Estimated Total

Approximately 38-54 hours, depending on how much of the stored page content must be translated manually versus converted into reusable locale-driven defaults.

## Recommended Order

1. Fix the shared shell first so every page benefits immediately.
2. Fix product and collection routes next because they are the highest-value commerce pages.
3. Fix utility pages and custom marketing/help pages after that.
4. Finish with locale key coverage and a full QA pass in every enabled language.

