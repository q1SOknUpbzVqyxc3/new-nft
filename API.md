# Frontend API Map

Источник истины: OpenAPI `https://back.monvravex.com/openapi.json`, проверенный 17 сентября 2026 года. Все запросы отправляются с cookie credentials. Mutations используют `application/x-www-form-urlencoded`, avatar — `multipart/form-data`.

Swagger описывает request parameters, но response schemas опубликованы как `{}`. Поля ниже подтверждены production frontend; новый клиент валидирует их во время выполнения и показывает controlled error при несовместимом ответе.

## Authentication

### `POST /api/login`

- Purpose: создать cookie-сессию.
- Parameters: form `email`, `password`, `remember`.
- Response: успешный status; сессия проверяется через `/api/user`.
- Used by: `/auth/login`.
- Errors: invalid credentials, 422, 429, service error.

### `POST /api/signup`

- Purpose: регистрация по приглашению.
- Parameters: `email`, `password`, `invite_code`, `language`, `newsletter`.
- Used by: `/auth/signup`, referral `/c/:code`.
- Errors: existing email, invalid invite, validation/rate limit.

### `POST /api/reset_password`

- Purpose: обновить пароль по email согласно существующему backend flow.
- Parameters: `email`, `password`.
- Used by: `/auth/reset-password`.

### `POST /api/logout`, `GET /api/resend_email`, `GET /api/check_key?key=`

- Purpose: завершение сессии, повтор activation email, проверка activation key.
- Used by: logout используется в header; последние два сохраняются в API layer/контракте для activation flow.

## User

### `GET /api/user`

- Purpose: session/auth authority и профиль.
- Response: `id`, `email`, `username`, `avatar`, `balance`, `currency`, `active`, `verificated`, `can_withdraw`, `turnover`, `created`, `minimal_deposit`.
- Used by: protected layout, header, profile, finance screens.
- Errors: 401/403 вызывают переход на login; invalid response — controlled error.

### User mutations

- `POST /api/user/set_language`: form `key`.
- `POST /api/user/set_username`: form `key`.
- `POST /api/user/set_currency`: form `key`.
- `POST /api/user/change_email`: form `email`.
- `POST /api/user/change_password`: form `password`, `old_password`.
- `POST /api/user/avatar/set`: multipart `file`.
- `GET /api/user/{user_id}.pic`: avatar resource.
- Used by: profile/settings/security. После изменения user resource обновляется.

### `GET /api/user/notifications/fetch?mark_read=`

- Purpose: уведомления аккаунта и optional mark-as-read.
- Response items: `key`, `icon`, `title`, `description`, `created`, optional balance delta.
- Errors: auth/rate limit/invalid response.

## Marketplace

### `GET /api/get_collections`

- Purpose: discovery list.
- Response: array `{id,name,image,blockchain,author,follow}`; production использует `follow` как USD floor.
- Used by: `/client/main`.
- Pagination/filter/sort: API не предоставляет.

### `GET /api/get_collection_nft?collection_id=`

- Purpose: collection details and full item list.
- Response: `{name,author,in_own,min_price,max_price,nfts[]}`; NFT contains `id,image,number,blockchain,price,currency`.
- Used by: `/client/collection/:id`.
- Errors: missing collection, auth, invalid response.
- Limitation: нет activity, analytics, traits, rarity, pagination, filter или sort parameters.

### `GET /api/get_nft?image_id=`

- Purpose: item details and available action state.
- Response: collection identity, token number, media, blockchain, price/currency, `is_sale`, `sale_price`, `is_own`, `own_id`, `prices[]`.
- Used by: `/client/collectible/:id`.

### `POST /api/search`

- Purpose: global NFT/collection search.
- Parameters: form `query`.
- Response: array `{id,image,blockchain,collection_name,number,price,currency}`.
- Used by: marketplace search with 350 ms debounce and request cancellation.

### Ownership and transactions

- `POST /api/buy_nft`: `image_id`; used by item Buy.
- `GET /api/my_nfts`: owned records with sale status and nested `pic`; used by `/client/owns`.
- `POST /api/sell_nft`: `own_id`, `price`; used by item Sell.
- `POST /api/unsell_nft`: `own_id`; used by item Remove listing.
- Errors: insufficient balance, already owned/listed/sold, unavailable operation, missing NFT.
- Retry: never automatic because operations mutate ownership/balance.

### Favourites

- `GET /api/get_favourites`, `POST /api/add_favourite` (`nft_id`), `POST /api/del_favourite` (`nft_id`).
- Current production navigation did not expose a stable favourites screen; API is not converted into a decorative control without a confirmed flow.

## Finance

### Top up

- `GET /api/payment/methods`: returns methods `{api_id,label,icon,min_dep?,symbol?,network?}`.
- `POST /api/payment/create`: `amount`, `method`; returns payment id and optional details/action URL/wallet/network.
- `POST /api/payment/check`: `id`; returns completion boolean.
- Used by: `/client/topup`.

### Withdraw

- `GET /api/withdraw/methods`: available methods.
- `POST /api/withdraw/create`: `amount`, `method`, optional `details`, `bank`.
- Used by: `/client/withdraw`.
- Errors: forbidden withdrawal, insufficient balance, invalid amount/method/details/bank.

### History

- `GET /api/finance/history`: type, amount, currency, method, status, comment, created, details, bank.
- `GET /api/my_nfts/history`: status, collection name, token id, sale price/date.
- Used by: `/client/profile/history` responsive views.

## Cross-cutting behavior

- Timeout: 15 seconds.
- Race conditions: caller signal is combined with per-request AbortController.
- Validation: Zod schemas use known required fields and preserve unknown fields for compatible backend extension.
- Error UX: HTTP/code mapped to safe user messages; raw server details remain outside UI.
- Retries: manual for reads; none for financial/ownership mutations.

## Endpoint inventory

Классификация относится к пользовательскому frontend. Admin endpoints в опубликованной схеме отсутствуют.

| Endpoint | Classification | Frontend usage |
|---|---|---|
| `POST /api/login` | USED | Login and session restore |
| `POST /api/logout` | USED | Header and activation gate |
| `POST /api/signup` | USED | Registration/referral flow |
| `GET /api/resend_email` | USED | Email activation gate |
| `POST /api/reset_password` | USED | Password recovery |
| `GET /api/check_key` | USED | `/auth/activate?key=` |
| `GET /api/user` | USED | Auth authority/current user |
| `POST /api/user/set_language` | USED | Settings |
| `POST /api/user/set_username` | USED | Profile |
| `POST /api/user/set_currency` | USED | Settings |
| `POST /api/user/change_email` | USED | Profile |
| `POST /api/user/change_password` | USED | Security |
| `POST /api/user/avatar/set` | USED | Profile avatar |
| `GET /api/user/{user_id}.pic` | USED | Backend media path referenced by user avatar |
| `GET /api/user/notifications/fetch` | USED | Notification panel/mark read |
| `GET /api/get_favourites` | USED | Item favourite state |
| `POST /api/add_favourite` | USED | Add favourite |
| `POST /api/del_favourite` | USED | Remove favourite |
| `GET /api/get_collections` | USED | Marketplace main |
| `GET /api/get_collection_nft` | USED | Collection details/items |
| `GET /api/get_nft` | USED | Item details |
| `POST /api/buy_nft` | USED | Buy action |
| `GET /api/my_nfts` | USED | Portfolio |
| `POST /api/search` | USED | Debounced marketplace search |
| `POST /api/sell_nft` | USED | Create listing |
| `POST /api/unsell_nft` | USED | Remove listing |
| `POST /api/payment/create` | USED | Top up |
| `GET /api/payment/methods` | USED | Top-up methods |
| `POST /api/payment/check` | USED | Controlled payment polling/manual retry |
| `POST /api/withdraw/create` | USED | Withdraw request |
| `GET /api/withdraw/methods` | USED | Withdraw methods |
| `GET /api/finance/history` | USED | Finance history |
| `GET /api/my_nfts/history` | USED | NFT history |

### NOT USED

Нет опубликованных user-facing endpoints, намеренно исключённых из клиента. Favourites интегрированы, но их exact production response shape требует authenticated verification.

### ADMIN

В опубликованном OpenAPI отсутствуют.

### BACKEND ONLY

В опубликованном OpenAPI отсутствуют явно обозначенные internal/backend-only endpoints.

### UNCLEAR

- `GET /api/check_key`: endpoint и query contract подтверждены; response body не описан. Frontend считает любой успешный 2xx активацией и затем повторно проверяет `/api/user`.
- Favourites response: response schema `{}`. Клиент принимает identifier либо объект с `nft_id`, `pic.id` или `id`; окончательная семантика требует authenticated contract verification.
- Все response bodies формально `{}` в OpenAPI. Используемые runtime schemas восстановлены из production bundle и должны быть перенесены в backend OpenAPI при отдельном разрешении на backend-работы.


## Verified against live backend (2026-09-19)
- `/api/user` additionally returns `aml_verified`, `is_banned`, `can_bet`, `minimal_withdraw`, `unread_notifications_count`, `lang`, `favourite`.
- `/api/user/notifications/fetch` items: `icon,title,description,created,is_read,balance_before?,balance_after?` (no `key`; before/after nullable).
- `/api/get_collection_nft` returns `count` in addition to `nfts,name,author,min_price,max_price,in_own`.
- `/api/get_nft` returns `created,status` in addition to documented fields.
- Missing endpoints (sessions, 2FA, offers, auctions, analytics, creator, achievements): see `docs/NFT_PRODUCT_GAPS.md`.
