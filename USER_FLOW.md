# Monvravex User Journey

Актуально на 17 сентября 2026 года. Карта основана на production frontend и OpenAPI backend, а не на предполагаемых marketplace-функциях.

## Visitor

```text
Landing `/`
├─ Войти → `/auth/login`
├─ Регистрация → `/auth/signup`
└─ Referral `/c/:code` → сохранить invite code → `/auth/signup`
```

Авторизованный пользователь, открывающий auth route, возвращается в приложение. Неавторизованный пользователь, открывающий protected deep link, после входа возвращается на исходный route.

## Registration and activation

```text
Signup form
→ email + password + repeat password + invite + agreement
→ POST `/api/signup`
→ backend создаёт cookie session
→ GET `/api/user`
├─ `active: true` → `/client/main`
└─ `active: false` → activation gate
   ├─ resend email → GET `/api/resend_email`
   └─ logout → POST `/api/logout` → Landing
```

Отдельного onboarding-профиля backend не требует. Единственный подтверждённый initial gate — email activation. OAuth, wallet auth, access/refresh tokens API не предоставляет.

## Existing user and session lifecycle

```text
Login → POST `/api/login` → GET `/api/user` → requested page or `/client/main`
Reload/deep link → GET `/api/user` → restore authenticated session
Expired/invalid session → 401/403 → login with return location
Logout → POST `/api/logout` → unauthenticated Landing/Login
```

## Authenticated product journey

```text
Main `/client/main`
├─ GET collections
├─ Search → POST search → NFT details
└─ Collection card → `/client/collection/:id`
   └─ GET collection and items
      └─ Item → `/client/collectible/:id`
         ├─ Buy → POST buy
         ├─ Sell → POST sell
         └─ Remove listing → POST unsell
```

API не предоставляет collection activity, analytics, traits, rarity, offers, server filters, sorting или pagination. Эти ветки не создаются как fake flow.

## Portfolio and account

```text
My NFT `/client/owns` → GET owned assets → item details
Profile `/client/profile`
├─ username/email update
├─ avatar upload
├─ password change
├─ language/currency settings
└─ finance/NFT history
Notifications → GET notifications and mark read
```

## Finance

```text
Top up → GET methods → POST create payment
→ external action/details
→ explicit status check via POST payment/check

Withdraw → GET methods → enter amount/details/bank
→ POST withdraw/create → confirmed request state
```

Финансовые операции не получают automatic retry или optimistic success.

## Unsupported or unclear flows

- Wallet connect/auth: backend endpoints отсутствуют.
- OAuth: endpoints отсутствуют.
- Refresh token: endpoints отсутствуют; session восстанавливается cookie + `/api/user`.
- Public profile: endpoint отсутствует.
- Offers, transfers, bids: endpoints отсутствуют.
- Favourites: CRUD endpoints существуют, но production navigation не подтверждает отдельный экран; интеграция зависит от фактической response shape.
- Activation key: `GET /api/check_key?key=` существует, но response schema и production client route не документированы; безопасный activation route может только вызвать endpoint и затем перепроверить session.
