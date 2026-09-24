# Что нужно от бэкенда

Фронтенд уже вызывает все ручки ниже. Если ручки нет (404/405/501), интерфейс показывает «скоро появится». Все поля ответов необязательные.

## Общее

- Авторизация: cookie `auth_token`. Запросы `x-www-form-urlencoded`. Ответы JSON, `snake_case`.
- Ошибка: HTTP-статус + `{"detail": "<код>"}`. Пустой результат: `200 []`. 404 — только «объекта нет».
- Суммы — в валюте счёта. Время — ISO 8601 UTC.
- Мутации: атомарные, проверка владельца и баланса на сервере, CSRF, rate limit на пользователя.

## 1. Изменить существующие ручки

Проверено на живом бэкенде (авторизованная сессия с депозитом и покупкой, 2026-09-21). Уже есть и работает: `lang`, `minimal_withdraw`, `aml_verified`, `is_banned`, `unread_notifications_count`; `is_sale`, `own_id`, `sale_price` (у своего NFT) в `get_nft`/`get_collection_nft`; цены NFT приходят в валюте счёта (при смене на USD `currency` стал `"USD"`); `my_nfts` содержит `buy_price`/`buy_date`; `finance/history`: `type` 0 — пополнение, `status` 0 — в обработке, 4 — успешно, `currency` — индекс (0 RUB, 4 USD), `expired`; уведомление `nft_bought` с `balance_before/after`.

| Ручка | Что изменить | Зачем |
|---|---|---|
| `GET /api/user` | **добавить** `level` (int), `has_2fa` (bool), `unread_popup_notifications_count` (int) | уровень, 2FA, окна ограничений |
| `GET /api/user` | **типы:** `minimal_deposit`, `minimal_withdraw`, `unread_notifications_count` сейчас строки (`"5000"`, `"1"`) — отдавать числами; `turnover` у нового пользователя `null` — отдавать `0` | фронтенд терпит, но это ошибка контракта |
| `GET /api/get_collection_nft` | **баг:** `in_own` всегда равен `count` (10 из 10 при одном NFT у пользователя; 7 из 7 при нуле). Нужно число NFT **текущего пользователя** в коллекции | плитка «У вас» |
| `GET /api/get_nft`, `get_collection_nft` | **баг (актуален, только если выставление остаётся, см. вопрос 1):** когда владелец выставил свой NFT на продажу, для него приходит `is_own: false` (а `is_sale: true`, `own_id` и `sale_price` есть). `is_own` должен оставаться `true` для владельца, иначе он видит «Купить» на своём лоте. Фронтенд временно определяет владельца по `my_nfts` | владелец и кнопка «Снять с продажи» |
| `GET /api/get_collection_nft`, `get_nft`, `my_nfts`, `my_nfts/history` | описать `status`: у своего NFT `0` — в портфеле, `1` — выставлен на продажу (проверено), у чужих невыставленных в каталоге `2`; значение для проданного неизвестно. `min_price`/`max_price` считать только по выставленным (сейчас по всем: выставленный за 120 в `min_price` не попал) | статусы, floor |
| `GET /api/my_nfts/history` | одна строка = одна запись владения (тот же `id`, что в `my_nfts`; при выставлении на продажу строка **меняется**, а не добавляется новое событие). Сейчас: `{id, status, collection_name, pic_id, buy_date, sale_price, sale_date}`. **Добавить** `buy_price` и `type`; описать `status` (см. «Открытые вопросы») | история NFT, P&L |
| `GET /api/finance/history` | строка: `{id, type, amount, currency, method, status, comment, created, expired, owner_id}`. Вопрос: после смены валюты счёта старые строки остаются в прежней валюте (пополнение 5000 при счёте в USD показывается как `5000.00`, `currency: 0`), хотя баланс пересчитан (59.34 USD). Нужно одно из двух: отдавать все строки в **текущей** валюте счёта (пересчитано бэкендом) **или** подтвердить, что строка всегда в валюте на момент операции. Фронтенд показывает каждую строку в её валюте; итоги за период считает только по строкам в текущей валюте. Для выводов желательно `details`, `bank` | история и итоги |
| `GET /api/payment/methods`, `withdraw/methods` | `compiled_regex` приходит как строка `re.compile('^…$')` (Python-репр) — отдавать голую регулярку `^…$` или `null` | проверка реквизитов на фронтенде |
| `POST /api/login` | при включённой 2FA вернуть `{"pre_auth_token": "…"}` вместо cookie | вход с кодом |
| `POST /api/search` | (желательно) вернуть `{"nfts":[…],"collections":[…]}`; сейчас только массив NFT | коллекции фронтенд пока ищет сам по `get_collections` |
| курсы валют | **не нужны:** фронтенд ничего не конвертирует и своих курсов не держит; каталог, баланс и операции приходят в валюте счёта. Единственное место, где фронтенду понадобилась бы конвертация — пороги в валюте счёта (уровни, порог крупного пополнения). Их должен отдавать бэкенд: `level` (уже в списке) и `large_deposit_threshold` в `/api/user` (в валюте счёта; если поля нет, окно «крупное пополнение» работает только для RUB) | пороги без курсов на фронтенде |

## 2. Перенести из арбитражного бэкенда (уже написано там)

| Ручка | Параметры | Ответ | Описание |
|---|---|---|---|
| `POST /api/login/2fa` | `pre_auth_token, code, remember` | как `/api/login` | вход по коду 2FA |
| `POST /api/2fa/setup` | — | `{secret, url}` | секрет и `otpauth://` для QR |
| `POST /api/2fa/enable` | `code` | — | включить 2FA |
| `POST /api/2fa/disable` | — | — | отключить 2FA |
| `POST /api/sessions` | — | `[{session_id, device \| user_agent, ip, created, last_active, current}]` | список устройств |
| `POST /api/sessions/revoke` | `session_id` | — | завершить сессию |
| `POST /api/sessions/revoke-others` | — | — | завершить все остальные |
| `GET /api/user/popup_notifications/fetch` | — | `[{id, title, description}]` | окна ограничений; `title` — код, напр. `withdraw_decline_by_verif` |
| `GET /api/activity-feed` | `count`, `lang`, `theme`, `currency`, **новые:** `collection_id`, `image_id` | `[{id, text, ts, color}]` | лента действий |

`activity-feed`: `id` уникальный и стабильный, `text` готовая строка на языке `lang`, `ts` unix-секунды или мс, `color` — `#RRGGBB` (необязательно). Не более `count` (12), новые сверху. Полный каталог событий, шаблоны текстов (RU/EN), переменные и правила — в `activity_feed.md`.

## 3. Новые ручки

### Коллекция

| Ручка | Параметры | Ответ |
|---|---|---|
| `GET /api/collection/stats` | `collection_id` | `floor_price, total_volume, owners, listed, listed_percent, supply, description, currency, floor_history[{time,value}]` |

- `floor_price` — мин. цена среди выставленных; `total_volume` — сумма завершённых продаж; `listed_percent = listed / supply × 100`; `floor_history` — по дням, до 365 точек, по возрастанию.

### NFT

| Ручка | Параметры | Ответ |
|---|---|---|
| `GET /api/nft/details` | `image_id` | `traits[{trait_type,value,rarity_percent}], rarity_rank, rarity_score, supply, contract_address, token_standard` |

- `rarity_rank`: 1 — самый редкий. Расчёт редкости кэшировать.

### Аукцион (проводит платформа)
Пользователи между собой не торгуют: офферы, контр-предложения и выставление NFT пользователями не нужны. Аукцион — единственный «торговый» механизм: **лоты создаёт воркер из панели** по nft_id, пользователи делают ставки и, если задана цена выкупа, могут выкупить лот сразу. Продавца-пользователя нет: деньги победителя остаются платформе.


| Ручка | Параметры | Ответ | Описание |
|---|---|---|---|
| `GET /api/auctions` | `status` = `active\|upcoming\|ended` (по умолчанию `active`), `collection_id?`, `limit?` | `[{id, image_id, collection_id, collection_name, number, image, blockchain, status, starts, ends, start_price, current_bid, min_bid, buy_now_price, bids, currency, is_leading, my_bid}]` | список лотов; активные — по `ends` (скоро заканчиваются — первыми) |
| `GET /api/nft/auction` | `image_id` | тот же объект | аукцион конкретного NFT; 404, если аукциона нет |
| `POST /api/nft/auction/bid` | `image_id, amount` | — | ставка |
| `POST /api/nft/auction/buy_now` | `image_id` | — | выкуп по `buy_now_price` (только если она задана); сразу завершает аукцион |

Поля лота: `is_leading` — вы сейчас лидируете; `my_bid` — ваша текущая ставка (или `null`); `min_bid` = `current_bid` + шаг (шаг задаёт платформа), а до первой ставки `start_price`; `bids` — число ставок; `starts` — начало (для `upcoming`).

Правила ставки:
- лот в статусе `active`, иначе `auction_not_started` / `auction_ended`;
- `amount ≥ min_bid` (`bid_too_low`); хватает баланса (`not_have_money`), при повышении своей ставки считать только разницу;
- вызывающий не заблокирован на покупки (`u_cant_buy`);
- сумма ставки **резервируется** на балансе; у перебитого лидера резерв снимается сразу, ему уходит `outbid`;
- анти-снайпинг: ставка в последние 5 минут продлевает аукцион на 5 минут.

Завершение (фоновая задача по `ends` или `buy_now`):
- победитель — максимальная ставка (при равных — поставившая раньше): списать резерв, создать запись в `my_nfts` (`buy_price` = итоговая ставка), уведомление `auction_won`;
- остальным вернуть резервы, уведомление `auction_lost`;
- если ставок нет (или не достигнута скрытая минимальная цена, если платформа её задаёт) — лот `ended` без победителя, NFT остаётся у платформы.

### Портфель

| Ручка | Параметры | Ответ |
|---|---|---|
| `GET /api/portfolio` | — | `value, count, unrealized_pnl, realized_pnl, total_spent, total_received, best{name,pnl,id}, worst{name,pnl,id}` |
| `GET /api/portfolio/history` | `period` = `1D\|7D\|30D\|1Y\|ALL` | `[{time, value}]` по возрастанию |

- `my_nfts` уже отдаёт `buy_price`, поэтому фронтенд сам считает нереализованный P&L и лучший/худший NFT по текущему портфелю. От бэкенда нужны реализованный P&L, `total_spent`/`total_received` по проданным и история стоимости.
- `value` — по цене листинга, иначе по floor. Себестоимость — цена покупки (метод зафиксировать). `unrealized_pnl` = оценка − себестоимость по текущим NFT; `realized_pnl` = цена продажи − себестоимость по проданным; `best/worst` — по нереализованной прибыли. История требует ежечасных/ежедневных снимков стоимости.

### Рейтинги

| Ручка | Параметры | Ответ |
|---|---|---|
| `GET /api/rankings` | `period` = `1H\|6H\|24H\|7D\|30D`, `category` = `trending\|volume\|gainers\|new` | до 100 строк `[{collection_id, name, image, blockchain, floor_price, volume, change_percent, owners, items, currency}]`, уже отсортированных |

- `trending` — по активности, `volume` — по объёму продаж, `gainers` — по росту floor (`change_percent` в %), `new` — новые коллекции.

## 4. Коды ошибок

Уже понятны фронтенду: `not_have_money, small_balance, already_owned, already_saled, is_sold, image_not_find, own_not_find, u_cant_buy, u_cant_withdraw, invalid_amount, invalid_method, invalid_details, invalid_bank, small_payment_amount, unavailable_method, invalid_code, already_verified, unverified, unauthorized, blocked_by_protection`.

`u_cant_buy` открывает окно «Покупки ограничены», `u_cant_withdraw` — «Вывод приостановлен».

Новые: `auction_not_found, auction_not_started, auction_ended, bid_too_low, buy_now_unavailable`.

## 5. Уведомления (`GET /api/user/notifications/fetch`)

`title`/`description` — код события. Уже расшифровываются: `topup_accept, withdraw_created, withdraw_accept, withdraw_decline, withdraw_decline_by_verif, withdraw_decline_by_tax, verification_accept, verification_decline, aml_request, aml_accept, balance_change, account_limited, time_limited, procedure_completed, email_confirmed, nft_bought, nft_sold`.

Новые (сообщить точные значения): `outbid, auction_won, auction_lost`. Для денежных — `balance_before`, `balance_after`.
