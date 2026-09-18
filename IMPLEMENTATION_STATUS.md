# Implementation Status

`DONE` ставится только после проверки применимого пользовательского сценария. Полностью реализованный, но не проверенный на authenticated backend flow остаётся `IN PROGRESS` или `BLOCKED`.

## Authentication

- Registration: BLOCKED — код завершён, но нет тестового email/invite для безопасной регистрации
- Login: BLOCKED — код завершён, но нет тестовых credentials
- Logout: BLOCKED — код завершён, требуется authenticated browser verification
- Central auth state: DONE
- Session restore: IN PROGRESS — unauthenticated и unit flows проверены, authenticated reload требует credentials
- Protected/public-only routes: DONE
- Return after login: DONE
- Email activation gate: BLOCKED — UI/API завершены, email delivery требует тестовый аккаунт
- Activation key route: BLOCKED — UI/API завершены, нет действительного тестового key
- Password reset: BLOCKED — UI/API завершены, live mutation не выполнена
- Password change: DONE
- OAuth: BLOCKED — backend endpoint absent
- Wallet auth: BLOCKED — backend endpoint absent

## Landing and routing

- Landing hero: DONE
- CTA navigation: DONE
- Referral route: DONE
- Deep links: DONE locally; deployment fallback required
- Application 404: DONE
- Shared desktop/mobile route configuration: DONE

## Marketplace

- Collections API: IN PROGRESS — validated client готов, authenticated live payload требует credentials
- Collection details/items API: IN PROGRESS — validated client готов, authenticated live payload требует credentials
- Item details API: IN PROGRESS — validated client готов, authenticated live payload требует credentials
- Search debounce/cancellation/URL state: DONE
- Buy/sell/unsell integration: BLOCKED — типизировано и собрано, реальные mutations требуют тестовый баланс/assets
- Filters/sorting/pagination: BLOCKED — API capability absent
- Activity/analytics/offers: BLOCKED — API capability absent
- Favourites: BLOCKED — UI/API готовы, exact response semantics требуют authenticated fixture

## Account

- Current user: IN PROGRESS — unauthenticated contract проверен, authenticated payload восстановлен из production bundle
- Owned assets: IN PROGRESS — UI/API готовы, live verification требует account data
- Username/email update: BLOCKED — mutation verification requires test account
- Avatar upload: BLOCKED — mutation/CDN verification requires test account
- Settings: BLOCKED — mutation verification requires test account
- Notifications: BLOCKED — live payload/mark-read verification requires test account
- Finance/NFT history: IN PROGRESS — UI/API готовы, live data unavailable

## Finance

- Payment methods/create: BLOCKED — live methods/payment creation require test account
- Payment status check: BLOCKED — live payment session unavailable
- Withdraw methods/create: BLOCKED — real mutation requires test account and balance

## Quality

- Strict TypeScript: DONE
- ESLint: DONE
- Unit tests: DONE (9 tests)
- Production build: DONE
- Desktop landing browser check: DONE
- Mobile login/registration browser check: DONE
- Responsive overflow check: DONE at 320, 375, 430, 768, 1024, 1280, 1440 and 1920 (Safari minimum inner width reported 336 for requested 320)
- Full authenticated E2E: BLOCKED — test credentials/account not available
