# NFT product gaps (backend-blocked)

Audit date: 2026-09-19. Source of truth: live responses of `back.monvravex.com` and its OpenAPI (no `/api/sessions`, `/api/2fa/*`, offers, auctions, analytics, creator or achievement endpoints exist).
The frontend renders **only** data the backend actually returns. Field names below are proposals; align with backend conventions.

## Implemented from real data
- `/api/user`: `verificated`, `active`, `can_withdraw`, `aml_verified` (bool), `is_banned`, `minimal_withdraw`, `unread_notifications_count`.
- `/api/user/notifications/fetch`: `icon,title,description,created,is_read,balance_before?,balance_after?` (note: **no `key` field**; before/after may be `null`).
- Support CTA: env `VITE_SUPPORT_URL` (https only). The sibling product uses `https://t.me/HelpManagerX`; not confirmed as the NFT support channel, so nothing is hardcoded.

## Open questions on existing fields
- `can_bet`: semantics unknown (marketplace trading permission?). Not shown until confirmed.
- `get_collections.follow`, `get_collection_nft.count`: `count` equals `nfts.length` on tested data; whether `nfts` can be paginated is unconfirmed, so it is labelled "Объектов", not "Supply".
- `min_price` is labelled "Минимальная цена", not "Floor".
- AML: backend gives only a boolean. `review/restricted/unknown` states need an enum from backend.

## Blockers
| Feature | Required data / mutations | Authorization & state rules | Suggested shape | Open questions |
|---|---|---|---|---|
| Sessions list / revoke | `GET sessions`, `POST session revoke`, `revoke-others` | own sessions only; current session flagged | `{id,device,ip_masked,created,last_seen,is_current}` | retention, geo |
| 2FA (TOTP) | setup (secret/URI), enable(code), disable(code) | re-auth for disable; rate limit | `{enabled,method}` on `/api/user` | recovery codes |
| Collection analytics | `description, creator{id,name,verified}, floor_price, total_volume, owners_count, listed_count, supply, royalty, floor_history[{time,value,currency}]` with period param `1D/7D/30D/1Y/ALL` | public read | extend `get_collection_nft` | supply vs loaded |
| NFT extended metadata | `owner{public identity}`, `creator{…,verified}`, `attributes[{trait_type,value,frequency?}]`, `rarity_rank`, `rarity_score`, `contract{address,network}` | no email/private data | extend `get_nft` | rarity method |
| Ownership history / activity | `GET nft activity` events `{type,actor,counterparty?,value?,currency?,time,tx_ref?}`; types mint/transfer/listing/unlisting/sale/offer/bid/… | public read; do NOT reuse `/api/my_nfts/history` (per-account) | paginated list | event enum |
| Offers / collection offers / counter offers | `make, cancel, accept, counter`, list; `{id,nft_id|collection_id,maker,amount,currency,created_at,expires_at,status}` | ownership check, funds hold, idempotency key, expiry, accept/cancel race protection, audit trail | server decides winner | status enum, hold rules |
| Auctions / bids | `start,end,min_bid,min_increment,highest_bid,winner,status`; `bid` mutation | server-only settlement; countdown is presentation only | idempotent bid | funds policy |
| Portfolio analytics | `portfolio_value,owned_count,unrealized_pnl,realized_pnl,total_spent,total_received,best/worst_performer,history[{time,value}],currency,valued_at` | backend defines cost-basis method | aggregate endpoint | FIFO/avg |
| Rankings | `GET stats?category=trending|volume|gainers|new&period=1h|6h|24h|7d|30d&limit&cursor` with metrics per category | public read | list + metrics | baseline for % change |
| Global search types | `/api/search` results with `type: nft|collection|author` + type-specific public meta | one request, grouped | discriminated union | author entity |
| Paid author verification | offer (price/terms), purchase mutation, states `pending/review/verified/declined`; `/api/user` remains authoritative | idempotent payment | `verification{status,price,currency}` | review SLA |
| Creator publishing | capability flag (e.g. `can_create`) + create collection / mint NFT with media upload | backend validates media (no active SVG/HTML), size/type | multipart | royalty limits |
| Achievements / levels | `level,xp,next_level,achievements[{id,progress,target,unlocked_at}]` | server rules only | `/api/user/progress` | thresholds |
| AML states | enum + timestamp beyond boolean | server only | `aml{status,updated_at}` | enum values |
