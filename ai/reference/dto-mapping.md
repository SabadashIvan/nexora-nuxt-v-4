# DTO Isolation & Mapping

This document defines the DTO isolation pattern for the Nexora Nuxt 4 frontend.

## ✅ Goals

- Keep API DTOs isolated from UI-facing models.
- Ensure conversion happens in stores via mapper utilities.
- Provide UI-optimized models (e.g., formatted price fields).

## 📂 Folder Structure

- **DTO types**: `app/types/api/dto/`
- **Mapper utilities**: `app/utils/mappers/`
- **UI models**: `app/types/`

## 🔁 Mapping Rules

- **DTOs are only imported in stores and mappers.**
- **Components/pages never import DTOs.**
- **Stores fetch DTOs via `useApi()` and immediately convert them using mappers.**

## ✅ Example: Product

- DTO: `ProductDTO` (`app/types/api/dto/product.dto.ts`)
- UI model: `Product` (`app/types/product.ts`)
- Mapper: `mapProductDTOToModel(dto: ProductDTO): Product`

The product mapper adds UI-friendly fields such as:

- `price.formatted.effective`
- `price.formatted.list`
- `price.formatted.sale`

## ✅ ESLint Enforcement

ESLint forbids importing DTOs inside `app/components/**` and `app/pages/**`.
Only stores, composables, and mappers may import DTOs.
