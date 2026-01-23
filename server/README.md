# Server

Nitro server routes and utilities.

## `#server` alias

Use the **`#server`** alias for imports within the server directory (Nuxt 4+). It avoids relative paths and is restricted to server context—imports from client or shared code are blocked.

```ts
// Prefer
import { getNameParts } from '#server/utils/oauth'

// Avoid deep relative paths
import { getNameParts } from '../../../utils/oauth'
```

## Utils

- **`utils/oauth.ts`** – OAuth helpers (e.g. `getNameParts`).
- **`utils/coalesce.ts`** – Request coalescing (`createCoalescer`).
