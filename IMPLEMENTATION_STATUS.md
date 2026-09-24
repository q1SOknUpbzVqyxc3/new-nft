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

## Shared platform features (ported from the sibling arbitrage frontend, 2026-09-20)

Все пункты ниже реализованы и покрыты unit/component-тестами, но не проверены на живом бэкенде. Эндпоинты, которых нет в OpenAPI, помечены `BACKEND MISSING`: UI показывает «скоро появится» (404/405/501) и начнёт работать без правок фронтенда, если контракт совпадёт.

- Brand и `<title>`/OG из домена (`lib/brand.ts`, `server.mjs`), `VITE_BRAND_NAME`: DONE
- Тема сайта из cookie `selected_theme` → `data-site-theme`: DONE
- Уровни по `turnover` (`lib/levels.ts`, пороги — временные локальные): IN PROGRESS — нужен серверный `level`/таблица порогов
- Единый раздел «Финансы» `/client/finance` (пополнение, вывод, история, динамика, pending): IN PROGRESS — статусы 0/2/4 и типы 0/1 взяты из соседнего проекта
- QR депозита: DONE
- Устройства и сессии (`POST /api/sessions`, `/revoke`, `/revoke-others`): BACKEND MISSING
- 2FA (`/api/2fa/setup|enable|disable`, `/api/login/2fa`, `pre_auth_token`): BACKEND MISSING
- Лента активности (`/api/activity-feed`): BACKEND MISSING
- Popup-уведомления и причины отказа в выводе (`/api/user/popup_notifications/fetch`): BACKEND MISSING
- Онбординг (выбор ника), cookie-баннер: DONE
- Повтор GET при 429 с `Retry-After`: DONE (мутации не повторяются)
- i18n на несколько языков: NOT STARTED

## Modals and notification texts (2026-09-20)

- Общий `Modal` (dialog semantics, Escape/backdrop, focus trap, scroll lock) и `NoticeModal`/`ConfirmModal`: DONE
- Popup-очередь бэкенда, ограничения вывода `withdraw_decline_by_verif|tax` (полные тексты, закрытие только кнопкой): BACKEND MISSING (`/api/user/popup_notifications/fetch`)
- Авто-показ ограничения по новому непрочитанному уведомлению (`unread_notifications_count`): BACKEND MISSING (поле в `/api/user`)
- `u_cant_withdraw` → «Вывод приостановлен», `u_cant_buy` → «Покупки ограничены»: DONE (коды из старого фронтенда)
- AML-уведомление после вывода при `aml_verified === false`: DONE
- Крупное пополнение картой/СБП: порог 2000 для RUB или `VITE_LARGE_DEPOSIT_THRESHOLD`; для других валют выключено: DONE
- Подтверждение отключения 2FA — модалка вместо `window.confirm`: DONE
- Расшифровка кодов уведомлений (`topup_accept`, `withdraw_*`, `aml_*`, `verification_*`, `account_limited` и т.д., плюс `notif_*` алиасы), бейдж непрочитанных на колокольчике: DONE

## Структура кабинета по образцу арбитражного сайта (2026-09-20)

Верхняя навигация вместо боковой панели: Обзор · Маркет · Мои NFT · Финансы · Настройки. В шапке: баланс, тема, уведомления, аккаунт с бейджами (верификация / вывод / AML), выход. Подвал со ссылками (юридические — по `VITE_*_URL`, поддержка — по `VITE_SUPPORT_URL`).

- Обзор `/client/dashboard`: баланс и быстрые действия, вывод в обработке, NFT в портфеле, уровень, последние NFT и операции, коллекции, лента активности: DONE (только по данным существующих ручек)
- «Мои NFT»: вкладки «Портфель» и «История» (бывшая страница истории): DONE; расшифровка статусов истории NFT: BLOCKED — неизвестны коды статусов
- Настройки: профиль, безопасность (пароль, 2FA), устройства, предпочтения: DONE

## Финансы по образцу арбитражного сайта (2026-09-20)

Одна страница `/client/finance`: карточки (доступный баланс с кнопками «Пополнить»/«Вывести», вывод в обработке с кнопкой поддержки, NFT в портфеле, оборот), карточка «Динамика операций» (выведено/пополнено за 30/90 дней или всё время, график), таблица «История операций» (дата, тип, способ, замаскированные реквизиты, сумма со знаком, статус). Пополнение и вывод открываются в модальных окнах (`?open=topup|withdraw`, старые `?tab=` тоже работают).

- Реквизиты в истории маскируются (`lib/mask-details.ts`): DONE
- «Всего» и «В сделках» из арбитража не перенесены: у NFT нет надёжной оценки портфеля в валюте счёта без курсов — заменены на «NFT в портфеле» и «Оборот»

## Идеи для NFT-маркетплейса (2026-09-20)

Интерфейс готов целиком; всё, чего нет в OpenAPI, помечено BACKEND MISSING и работает через новый контракт из `API.md`. До появления ручек показывается «скоро появится», а часть данных считается из существующих (floor и supply коллекции, стоимость и число NFT портфеля, история цены NFT, достижения).

- Страница коллекции: floor, total volume, owners, listed %, supply, creator, royalty, описание, график floor, Collection Offer, лента активности: DONE (floor/supply/creator из существующих данных), остальное BACKEND MISSING
- Страница NFT: владелец, creator, атрибуты, rarity rank/score, token ID, blockchain, contract, история цены, история владельцев, активность: DONE; владелец/атрибуты/редкость/контракт/история владельцев BACKEND MISSING
- Торговля: Highest offer с таймером, Make/Cancel/Accept/Counter Offer, Bid и Timed Auction, Buy Now (уже была): DONE UI; BACKEND MISSING
- Портфель: 8 метрик и график 1D/7D/30D/1Y/ALL: стоимость и число NFT считаются локально; P&L, потрачено/получено, лучший/худший и график BACKEND MISSING
- Рейтинги `/client/rankings`: 1H/6H/24H/7D/30D × В тренде/Топ по объёму/Растущие/Новые: DONE UI; без ручки показывается список коллекций
- Глобальный поиск по NFT, коллекциям и авторам: DONE (фильтр по автору на маркете)
- Верификация автора и публикация NFT/коллекций (Настройки → Автор): DONE UI; BACKEND MISSING
- Достижения и уровни (Настройки → Достижения): DONE

## Новости и лента действий на «Обзоре» (2026-09-20)

- Блок «Новости NFT»: собственный агрегатор RSS профильных NFT-изданий (`/news/nft`, фильтр по теме, кэш 15 мин), карточки с картинкой, источником и датой. Первая версия на виджете TradingView заменена: он показывал новости крипторынка, а не NFT. Отключается `VITE_NEWS_WIDGET=off`: DONE
- Лента действий как в арбитраже (карточка с подсказкой, поочерёдное появление, опрос 30 с, пауза на скрытой вкладке, дедупликация, загрузка/пусто/«скоро появится»): DONE; данные — BACKEND MISSING (`/api/activity-feed`), предпросмотр — `VITE_ACTIVITY_DEMO=1`

## Изменение ТЗ: без авторов и торговли между пользователями (2026-09-21)

Вырезано с фронтенда: Настройки → «Автор» (верификация, публикация коллекций и NFT), плитки Creator/Royalty, владелец NFT и история владельцев, офферы (Make/Cancel/Accept/Counter, Collection Offer, Highest offer), создание аукциона владельцем, группа «Авторы» в поиске и фильтр по автору на маркете. Осталось: имя автора как обычная подпись коллекции из существующих данных.

Переработано — аукцион, который проводит платформа:
- Страница «Аукционы» `/client/auctions` (вкладки: идут сейчас, скоро, завершённые; карточки с ценой, таймером, выкупом и статусом «ваша ставка лидирует / перебита»), блок «Аукционы» на «Обзоре»: DONE UI; BACKEND MISSING (`GET /api/auctions`)
- На странице NFT: текущая или стартовая ставка, мин. ставка, число ставок, ваш статус, форма ставки с проверкой минимума, «Выкупить сразу» с подтверждением, окончание и старт: DONE UI; BACKEND MISSING (`/api/nft/auction`, `/bid`, `/buy_now`)
- Уведомления `outbid`, `auction_won`, `auction_lost` расшифровываются; окно «Покупки ограничены» открывается и при ставке (`u_cant_buy`)

Не тронуто до решения бэкенда (см. `back.md`, «Открытые вопросы»): продажа и снятие с продажи своего NFT (`sell_nft`/`unsell_nft`), «Достижения» (считаются локально), новости (собственный сервис `/news/nft`).
