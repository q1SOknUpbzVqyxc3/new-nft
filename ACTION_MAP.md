# Monvravex Action Map

Все запросы используют `credentials: include`. Response payload валидируется на runtime-границе. Mutations не повторяются автоматически.

## Authentication

### Page: Register

- Action: submit email, password, repeat password, invite, agreement and optional newsletter.
- Frontend: validate email, password policy, equality, numeric invite and mandatory agreement; disable duplicate submit.
- API: `POST /api/signup`, form `email`, `password`, `invite_code`, `language` (production также отправляет optional `newsletter`).
- Loading: pending button and disabled form.
- Success: restore session with `GET /api/user`; go to requested app route or main.
- Errors: field validation, duplicate email, invalid invite, 422, 429, network/server.
- Auth: public; backend creates cookie session.
- Next: activation gate when `user.active === false`, otherwise `/client/main`.

### Page: Login

- Action: submit email/password/remember.
- API: `POST /api/login`, then `GET /api/user`.
- Loading: disabled submit.
- Success: authenticated state and return to original protected route.
- Errors: invalid credentials, 429, timeout/network/server.
- Auth: public.

### Activation gate

- Action: resend activation email.
- API: `GET /api/resend_email`.
- Loading/success/error: disabled button; confirmation; rate-limit/server feedback.
- Auth: cookie session required.
- Action: logout uses `POST /api/logout`, clears auth state and opens landing.

### Password recovery

- Action: submit email/new password/repeat password.
- API: `POST /api/reset_password`, form `email`, `password`.
- Success: login route.
- Errors: validation, backend code, 429, server/network.

## Discovery and marketplace

### Page: Main

- Load: `GET /api/get_collections`.
- State: skeleton/loading, retryable read error, honest empty, collection grid.
- Search event: debounced query persisted as `?q=`.
- API: `POST /api/search`, form `query`.
- Race handling: AbortController; stale response cannot replace current response.
- Result: item deep link.

### Page: Collection

- Load: `GET /api/get_collection_nft?collection_id=`.
- Success: real name, author, chain, item count, owned count, min/max and items.
- Local event: token ID search persisted in URL. It does not pretend to be a backend filter.
- Errors: invalid/not-found identifier, auth, invalid response, network.
- API limitations: no pagination/filter/sort/activity/analytics parameters.

### Page: Item

- Load: `GET /api/get_nft?image_id=`.
- Buy: `POST /api/buy_nft`, `image_id`.
- Sell: `POST /api/sell_nft`, `own_id`, positive `price`.
- Remove listing: `POST /api/unsell_nft`, `own_id`.
- Mutation state: disabled action, progress, mapped error, success, item and session refresh.
- Auth: required.

### Page: My NFT

- Load: `GET /api/my_nfts`.
- Local event: search by collection/token.
- Result: item deep link.

## Account

### Profile identity

- Load: shared current user from `GET /api/user`.
- Username: `POST /api/user/set_username`, form `key`.
- Email: `POST /api/user/change_email`, form `email`.
- Avatar: `POST /api/user/avatar/set`, multipart `file`.
- Success: refetch current user.
- Errors: file/type/size validation, conflict, auth, server.

### Security and preferences

- Password: `POST /api/user/change_password`, `password`, `old_password`.
- Language: `POST /api/user/set_language`, `key`.
- Currency: `POST /api/user/set_currency`, `key`.
- State: validated forms, pending, success/error feedback, user refresh.

### Notifications

- Preview: `GET /api/user/notifications/fetch?mark_read=false`.
- Open panel: `GET /api/user/notifications/fetch?mark_read=true`.
- States: loading, retry, empty, list with safe localized/fallback content.

### History

- Finance: `GET /api/finance/history`.
- NFT: `GET /api/my_nfts/history`.
- URL state: selected tab.
- States: loading, retryable error, empty, responsive rows.

## Finance

### Top up

- Load methods: `GET /api/payment/methods`.
- Create: `POST /api/payment/create`, `amount`, `method`.
- Result: backend-provided details or external payment URL.
- Status: manual `POST /api/payment/check`, `id`; success refreshes current user.
- Errors: invalid/minimum amount, unavailable method, auth/server/network.

### Withdraw

- Load methods: `GET /api/withdraw/methods`.
- Create: `POST /api/withdraw/create`, `amount`, `method`, optional `details`, `bank`.
- Success: confirmed request state and session refresh.
- Errors: frozen withdrawal, balance, validation, server/network.

## Navigation

- Desktop/mobile menu derives from one route configuration.
- Browser back/forward and deep links are handled by React Router.
- Unknown path renders application 404 with Home, Login or Marketplace recovery action.
