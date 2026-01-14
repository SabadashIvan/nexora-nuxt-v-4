# DTO Validators

This directory contains Zod schemas for validating DTOs (Data Transfer Objects) at runtime boundaries.

## Purpose

- Validate API responses before mapping to UI models
- Catch API contract changes early
- Provide type-safe runtime validation

## Usage

```typescript
import { productDTOSchema } from '~/utils/validators/dto/product'

const dto = await api.get('/products/123')
const validated = productDTOSchema.parse(dto) // Throws if invalid
const product = mapProductDTOToModel(validated)
```

## Guidelines

- One schema per DTO type
- Match API response structure exactly
- Use `.optional()` for nullable fields
- Add `.transform()` if needed for type conversion
