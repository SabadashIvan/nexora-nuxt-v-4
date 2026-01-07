# Types Documentation

## Enums

В проекте используются **TypeScript енамы** для критичных доменных значений вместо union types.

### Преимущества енамов:

1. **Лучшее автодополнение** - IDE показывает все доступные значения
2. **Защита от опечаток** - TypeScript проверяет корректность значений
3. **Явность в коде** - понятно, какие значения допустимы
4. **Совместимость с бэкендом** - если бэкенд использует енамы, легче синхронизировать

### Доступные енамы:

- `OrderStatus` - статусы заказов
- `PaymentStatus` - статусы платежей
- `CheckoutStatus` - статусы чекаута
- `SupportRequestType` - типы обращений в поддержку
- `PaymentProviderType` - типы платежных систем
- `CartWarningCode` - коды предупреждений корзины
- `CartPromotionType` - типы промо-акций
- `IdentityAddressType` - типы адресов
- `NotificationChannel` - каналы уведомлений
- `LoadingState` / `AsyncStatus` - состояния загрузки
- `EmailVerificationStatus` - статусы верификации email
- `PasswordResetStatus` - статусы сброса пароля
- `AudienceSubscriptionStatus` - статусы подписки
- `CatalogSort` - варианты сортировки каталога
- `BlogSort` - варианты сортировки блога
- `FilterType` - типы фильтров
- `LinkTarget` - значения target для ссылок

### Использование:

```typescript
import { OrderStatus, PaymentStatus } from '~/types'

// Использование в типах
interface Order {
  status: OrderStatus | string // string для обратной совместимости
  payment_status: PaymentStatus
}

// Использование в коде
if (order.status === OrderStatus.PENDING) {
  // ...
}
```

### Обратная совместимость:

Все интерфейсы используют `Enum | string` для обратной совместимости с существующим кодом, который может использовать строковые литералы напрямую.

## Runtime Validation (Контракты)

**Текущий статус:** Не реализовано

Для runtime валидации API ответов можно добавить:
- **Zod** - схема валидации
- **Yup** - альтернатива Zod
- **io-ts** - функциональный подход

Это опционально и может быть добавлено позже, если возникнет необходимость в строгой валидации данных на runtime.

