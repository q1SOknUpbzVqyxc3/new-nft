# Архитектура Monvravex Frontend

## Статус и аудит

Документ обновлён 17 сентября 2026 года после анализа production frontend, его клиентских bundle и OpenAPI-схемы backend. Репозиторий изначально не содержал исходного frontend: текущая реализация создана как новый React SPA с сохранением обнаруженных пользовательских сценариев.

Production использует Next.js App Router, SWR, Axios, Tailwind/Radix-подобные компоненты и cookie-сессию. В новом frontend выбран React SPA, потому что пользователь явно зафиксировал React без Next.js.

Ключевые проблемы старого frontend:

- запрос поиска на каждый ввод без debounce и защиты от race condition;
- blank-state вместо явных loading/error экранов;
- дублирование transport/error logic внутри страниц;
- snapshot пользователя и polling через `localStorage`;
- `console.log` и проглатывание ошибок;
- фиктивные contract-like строки на NFT page;
- слабая адаптация таблиц и длинных значений;
- OpenAPI не описывает response bodies, хотя frontend зависит от конкретных полей.

## Стек

- React 19;
- Vite 8;
- React Router 7;
- TypeScript 5.9 strict;
- Zod 4 для runtime validation;
- Lucide React для иконок;
- Vitest и Testing Library;
- ESLint с type-aware TypeScript и React Hooks rules.

Версии зафиксированы lockfile. Alpha, beta и RC не используются. TypeScript 7 и ESLint 10 сознательно не применены: используемые официальные lint-интеграции ещё не поддерживают их peer contracts без обходов.

## Структура

```text
src/
  app.tsx                 маршруты приложения
  main.tsx                browser entrypoint
  app/globals.css         tokens и глобальная UI-система
  components/             layout, cards, reusable primitives
  pages/                  route-level screens
  lib/api/client.ts       transport, timeout, abort, credentials
  lib/api/services.ts     endpoint-oriented API methods
  lib/api/schemas.ts      runtime response contracts
  lib/hooks/              server-resource и debounce hooks
  lib/formatters.ts       numbers, money, dates, addresses
  test/                   test setup
```

## Routing

React Router сохраняет production URL contract:

- `/`, `/c/:code`;
- `/auth/login`, `/auth/signup`, `/auth/reset-password`;
- `/client/main`;
- `/client/collection/:collectionId`;
- `/client/collectible/:nftId`;
- `/client/owns`;
- `/client/topup`, `/client/withdraw`;
- `/client/profile`, `/client/profile/security`, `/client/profile/settings`, `/client/profile/history`.

Production hosting должен отдавать `index.html` для неизвестных client routes.

## State management

- Server state загружается через `useApiResource`; каждый effect создаёт `AbortController`, поэтому устаревший ответ не перезаписывает актуальный.
- Auth state централизован в `AuthProvider` и имеет состояния `unknown`, `unauthenticated`, `authenticated`; session user не дублируется в route components.
- URL хранит shareable состояние поиска collection/marketplace.
- Form и transient UI state остаются локальными.
- Глобальный store не добавлен: устойчивой необходимости нет.

## API layer

`apiRequest` централизует base URL, cookie credentials, timeout, abort, safe parsing и error normalization. `services.ts` содержит реальные методы Swagger. Все response payload проходят Zod validation. Mutations не получают автоматические retries во избежание повторных финансовых операций.

Base URL задаётся `VITE_API_BASE_URL`. Fallback предназначен для production sibling host `https://back.<hostname>`.

## Authentication

Backend использует HttpOnly cookie `auth_token`. `AuthProvider` единожды восстанавливает session через `/api/user`; protected/public guards исключают route flicker. API client публикует internal auth-invalid event при 401 или backend `Not authenticated`, после чего route возвращается на login с безопасным return path. Чувствительные токены не хранятся в `localStorage`. Неактивный аккаунт получает blocking activation gate.

Wallet/Web3 connector отсутствует и не добавляется: текущий продукт использует account balance и серверные marketplace operations. UI не имитирует on-chain подписи или wallet connection.

## UI architecture

Design tokens находятся в `globals.css`: palette, spacing, radii, shadows, motion, container и responsive rules. Компоненты `Button`, `TextField`, `SafeMedia`, state panels, NFT/collection cards формируют минимальный reusable слой. Media URL допускает только HTTP(S) и same-origin path; broken media получает fallback.

Коллекция показывает только Items. Activity, Analytics, traits, rarity, owners, supply, volume, filters и server sorting не отображаются, поскольку API их не предоставляет.

## Error handling

Transport errors имеют `ApiError(status, code, details)`. UI получает безопасные русские сообщения через `getUserFacingError`; raw stack и backend JSON пользователю не показываются. Применяются page-level error, inline mutation error, retry и empty states.

## Testing strategy

- unit: formatters, validation и pure domain utilities;
- component: critical form/state behavior;
- integration: API mapping with controlled fetch responses;
- E2E: auth, discovery, collection, item purchase/sale, finance flows на staging.

В текущем репозитории unit suite и production build являются обязательными gates. Live mutation E2E нельзя выполнять против production без тестового аккаунта и явного разрешения.

## Security strategy

- cookies отправляются через `credentials: include`;
- no secrets in client bundle or `.env.example`;
- runtime validation treats API as untrusted;
- arbitrary HTML/SVG markup не внедряется;
- external links use `noreferrer`;
- mutation retries отсутствуют;
- API timeout и request cancellation обязательны;
- backend остаётся authority для balance, ownership и transaction outcome.

## Deployment assumptions

- static assets публикуются через Vercel/CDN; `vercel.json` задаёт SPA fallback, security headers и immutable cache для fingerprinted assets;
- frontend origin разрешён backend CORS с credentials;
- production задаёт `VITE_API_BASE_URL=https://back.monvravex.com` на build stage;
- CSP, HSTS, compression и cache policy настраиваются инфраструктурой;
- backend и его contracts не меняются в рамках frontend redesign.
