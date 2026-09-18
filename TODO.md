# Monvravex Frontend Plan

Актуализировано 17 сентября 2026 года после production/API аудита и реализации React-каркаса.

## Critical

| Задача | Причина |
|---|---|
| Проверить успешные auth и authenticated pages с тестовым production/staging аккаунтом | Unauthenticated redirect и CORS проверены, но нет разрешённых тестовых credentials/invite. |
| Проверить buy/sell/unsell на безопасных тестовых данных | Финансовые mutations нельзя считать проверенными без реального результата; повторять их автоматически нельзя. |
| Настроить SPA fallback на production hosting | Прямое открытие `/client/...` должно возвращать `index.html`. |
| Подтвердить CSRF-защиту mutation endpoints на backend | Cookie-auth mutations требуют server-side Origin/SameSite/CSRF policy; frontend не может заменить её. |
| Включить branch protection для `main` | Запрет из `AGENT.md` должен быть дополнительно закреплён Git hosting policy. |

## High

| Задача | Причина |
|---|---|
| Проверить avatar upload на тестовом аккаунте | UI, file validation и endpoint подключены; нужна фактическая проверка ответа/CDN path. |
| Проверить notification panel и mark-read на реальных данных | UI подключён; title/description приходят translation keys без опубликованного словаря. |
| Подтвердить payment check lifecycle | Реализован production-compatible 5-second check до 10 минут; response schema всё ещё `{}` в OpenAPI. |
| Расширить integration tests API transport/schemas | Auth restore и validation покрыты; нужны timeout, malformed payload и mutation error cases. |
| Добавить E2E для auth, discovery, collection и portfolio | Это основные пользовательские пути. |
| Провести WCAG keyboard/screen-reader audit | Автоматический lint не подтверждает WCAG 2.1 AA. |

## Medium

| Задача | Причина |
|---|---|
| Добавить route-level code splitting | Уменьшит initial bundle после стабилизации маршрутов. |
| Добавить media proxy/CDN policy | External NFT images требуют production allowlist, caching и content controls. |
| Добавить visual regression на 320/375/430/768/1024/1280/1440/1920 | Защитит адаптивную сетку и shell. |
| Расширить component tests форм и mutation feedback | Снизит риск регрессии финансовых сценариев. |
| Формализовать backend response schemas в OpenAPI | Сейчас типы ответов приходится восстанавливать из production client. |

## Low

| Задача | Причина |
|---|---|
| Оценить favourites product flow | Endpoints есть, но стабильный пользовательский сценарий в production не подтверждён. |
| Добавить performance budgets в CI | Требует согласованного deployment/staging профиля. |
| Добавить локализацию всего нового UI | Backend хранит язык, но новый UI сейчас русскоязычный. |
