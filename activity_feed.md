# Лента действий (`GET /api/activity-feed`): события и шаблоны

| Параметр | Что значит |
|---|---|
| `count` | сколько событий вернуть (фронтенд шлёт 12), новые первыми |
| `lang` | язык текста: `ru`, `en`, `ua`, `bl`, `de`, `fr`, `cn`; нет шаблона — отдать `en` |
| `currency` | валюта пользователя; все `{amount}` в тексте — в ней (`RUB`, `USD`, `EUR`, `UAH`, `KZT`, `BYN`) |
| `theme` | `dark` / `light`, можно выбрать `color` под тему |
| `collection_id` | только события этой коллекции |
| `image_id` | только события этого NFT |

```json
[
  {"id": "nft_bought:27947", "text": "Пользователь купил «DSC #67» — 52,52 $", "ts": 1758462660, "color": "#24c78e",
   "type": "nft_bought", "collection_id": 65, "image_id": 67}
]
```

## Переменные

| Переменная | Тип | Формат и пример |
|---|---|---|
| `{amount}` | сумма | в `currency`, см. правило 3: `120 $` |
| `{collection}` | строка | название коллекции: `DSC \| DOGESOUNDCLUB MATESl` |
| `{number}` | целое | номер NFT в коллекции: `67` |
| `{blockchain}` | строка | сеть: `Ethereum`, `Polygon`, `Solana` |
| `{percent}` | число | без знака, до 1 знака после запятой: `12,5` |
| `{period}` | строка | период по языку: ru `1 час` / `24 часа` / `7 дней`; en `1 hour` / `24 hours` / `7 days` |
| `{level}` | целое | новый уровень пользователя: `4` |
| `{count}` | целое | число NFT / покупок: `5` |
| `{rank}` | целое | место в рейтинге: `3` |
| `{time_left}` | строка | остаток времени: ru `15 минут` / `2 часа`; en `15 minutes` / `2 hours` |

## Каталог событий

Цвета: покупки `#24c78e`, аукционы `#ffb829`, деньги `#4da3ff`, профиль `#6c5ce7`, рынок `#ff5c6c`. Область: **К** — попадает в ленту коллекции (`collection_id`), **N** — ленту NFT (`image_id`), **Г** — только в общую.

### Покупки и аукционы

| Код | Когда | Переменные | RU | EN | Цвет | Область |
|---|---|---|---|---|---|---|
| `nft_bought` | успешный `POST /api/buy_nft` | collection, number, amount | Пользователь купил «{collection} #{number}» — {amount} | A user bought “{collection} #{number}” — {amount} | зелёный | К N Г |
| `nft_bought_big` | покупка от порога «крупная» (порог задаёт платформа, в валюте счёта) | collection, number, amount | Крупная покупка: «{collection} #{number}» — {amount} | Big purchase: “{collection} #{number}” — {amount} | зелёный | К N Г |
| `auction_started` | платформа открыла аукцион | collection, number, amount (стартовая цена) | Начался аукцион на «{collection} #{number}» — старт {amount} | Auction started for “{collection} #{number}” — from {amount} | аукцион | К N Г |
| `auction_bid` | принята ставка | collection, number, amount | Пользователь сделал ставку на «{collection} #{number}» — {amount} | A user placed a bid on “{collection} #{number}” — {amount} | аукцион | К N Г |
| `auction_ending_soon` | до конца аукциона осталось 1 час и 15 минут (по одному событию) | collection, number, time_left, amount (текущая ставка) | Аукцион на «{collection} #{number}» завершится через {time_left} — ставка {amount} | Auction for “{collection} #{number}” ends in {time_left} — bid {amount} | аукцион | К N Г |
| `auction_won` | аукцион завершён с победителем | collection, number, amount | Пользователь выиграл аукцион — «{collection} #{number}» за {amount} | A user won the auction — “{collection} #{number}” for {amount} | аукцион | К N Г |
| `auction_buy_now` | лот выкуплен по `buy_now_price` | collection, number, amount | Пользователь выкупил лот «{collection} #{number}» — {amount} | A user bought out “{collection} #{number}” — {amount} | аукцион | К N Г |
| `rare_nft_bought` | куплен NFT из верхних 5 % по редкости коллекции | collection, number, rank | Куплен редкий NFT «{collection} #{number}» — место #{rank} по редкости | A rare NFT was bought: “{collection} #{number}” — rarity rank #{rank} | зелёный | К N Г |
| `price_record` | цена покупки — рекорд коллекции | collection, number, amount | Рекорд коллекции «{collection}»: «#{number}» куплен за {amount} | New record for “{collection}”: #{number} bought for {amount} | зелёный | К N Г |
| `collection_sold_out` | у коллекции не осталось доступных NFT | collection | Коллекция «{collection}» полностью выкуплена | “{collection}” is sold out | зелёный | К Г |

### Деньги

| Код | Когда | Переменные | RU | EN | Цвет | Область |
|---|---|---|---|---|---|---|
| `deposit` | пополнение подтверждено (`type 0`, `status 4`) | amount | Пользователь пополнил баланс — {amount} | A user topped up the balance — {amount} | деньги | Г |
| `withdraw_requested` | создана заявка на вывод | amount | Пользователь создал заявку на вывод — {amount} | A user requested a withdrawal — {amount} | деньги | Г |
| `withdraw_completed` | вывод подтверждён (`type 1`, `status 4`) | amount | Пользователь вывел средства — {amount} | A user withdrew funds — {amount} | деньги | Г |

### Профиль

| Код | Когда | Переменные | RU | EN | Цвет | Область |
|---|---|---|---|---|---|---|
| `level_up` | пользователь получил новый уровень | level | Пользователь достиг уровня {level} | A user reached level {level} | профиль | Г |
| `turnover_milestone` | оборот за месяц пересёк порог (например 1 000, 10 000, 100 000 в валюте счёта) | amount | У пользователя оборот за месяц превысил {amount} | A user’s monthly turnover exceeded {amount} | профиль | Г |
| `verification_passed` | аккаунт верифицирован | — | Пользователь прошёл верификацию аккаунта | A user completed account verification | профиль | Г |
| `referral_joined` | по реферальной ссылке зарегистрировался новый пользователь | — | По ссылке пользователя зарегистрировался новый реферал | A new user signed up via a referral link | профиль | Г |

