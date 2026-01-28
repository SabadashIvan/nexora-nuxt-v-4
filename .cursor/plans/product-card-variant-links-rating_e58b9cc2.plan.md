---
name: product-card-variant-links-rating
overview: Update product listing cards to surface variant option quick-links (all axes) and a rating preview, using the fields already present in `ProductListItem` from the catalog variants API.
todos:
  - id: inspect-current-card
    content: Review `app/components/product/ProductCard.vue` and its prop type usage to identify safe extension points (rating/options rendering without nested links).
    status: completed
  - id: implement-rating-row
    content: Wire `app/components/ui/Rating.vue` into `ProductCard.vue` to show `value` and `(count)` even when count is 0.
    status: completed
  - id: implement-variant-option-links
    content: Render `variant_options.axes` + `variant_options.options` as compact clickable chips (disabled if out of stock), linking via `localePath('/product/{slug}')`.
    status: completed
  - id: prefetch-option-slugs
    content: Generalize the existing hover prefetch to accept a target slug and reuse it for option-hover prefetch.
    status: completed
  - id: manual-verify-pages
    content: Verify behavior on categories listing pages and recommendations grid (layout, navigation, disabled options, rating display).
    status: completed
isProject: false
---

## Goal

- Enhance the catalog `ProductCard` to render:
  - **Rating preview** using `product.rating.value` and `product.rating.count`.
  - **Quick links for similar variants** using `product.variant_options.axes` + `product.variant_options.options[axis.code]` where each option provides a `slug` to navigate to.

## What we have today

- `ProductListItem` already includes the needed fields:
  - `variant_options: VariantOptions` and optional `rating` (see `[app/types/catalog.ts](app/types/catalog.ts)` lines ~94-110).
- `ProductCard` currently renders only image/title/price and prefetches `/catalog/variants/{slug}` on hover (see `[app/components/product/ProductCard.vue](app/components/product/ProductCard.vue)` lines ~14-77).
- A reusable rating UI exists: `[app/components/ui/Rating.vue](app/components/ui/Rating.vue)`.

## Approach

- Refactor `[app/components/product/ProductCard.vue](app/components/product/ProductCard.vue)` template structure to avoid **nested links**:
  - Keep the main click target as a `NuxtLink` around image/title/price.
  - Render option chips/swatches **outside** that link, each navigating to `localePath(`/product/${option.slug}`)`.
- Add a rating row:
  - Use `<UiRating :rating="product.rating?.value" :reviews-count="product.rating?.count" :show-count="true" />`.
  - Per your choice, when `count = 0`, still show `0.0 (0)`.
- Render variant options for **all axes**:
  - For each axis in `product.variant_options.axes`, render a small labeled row.
  - For each option in `product.variant_options.options[axis.code]`, render a compact chip.
  - If `option.is_in_stock === false`, visually disable and prevent navigation.
- Extend prefetch to support option-hover:
  - Generalize `prefetchProduct(slug?: string)` so hovering an option chip can prefetch that variant detail too.

## Files to change

- `[app/components/product/ProductCard.vue](app/components/product/ProductCard.vue)`
  - Add computed helpers:
    - `hasVariantOptions`, `axes`, `optionsForAxis(code)`.
  - Update template to include rating + options, and refactor link structure.

## Verify (manual)

- On `[/categories](app/pages/categories/index.vue)` and `[/categories/[category]](app/pages/categories/[category].vue)`:
  - Cards show rating row (including `0.0 (0)` when empty).
  - Cards show all axes (e.g. Color + Size) with clickable options.
  - Clicking an option navigates to the correct variant slug.
  - Disabled styling + no navigation for out-of-stock options.
- In recommendations (uses `ProductCard`): `[app/components/product/ProductRecommendations.vue](app/components/product/ProductRecommendations.vue)`.

## Notes / constraints

- No new endpoints: we’ll only use data already present on `ProductListItem` and keep the existing `/catalog/variants/{slug}` prefetch behavior.

