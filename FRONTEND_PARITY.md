# Frontend Functionality Parity

Проверено по production routes и загруженным frontend bundle 17 сентября 2026 года.

| Feature | Old frontend | New frontend | API | Status |
|---|---|---|---|---|
| Referral `/c/:code` | Сохраняет invite и возвращает на landing | Сохраняет invite и открывает signup | — | Implemented |
| Login/logout | Cookie login, header logout | Central auth state, return URL, protected/public guards, logout | login/logout/user | Implemented |
| Signup | Invite, language, newsletter, auto session | Полная validation, agreement, invite prefill, auto session | signup/user | Implemented |
| Email activation | Blocking gate, resend/logout | Blocking gate, resend, refresh status, logout | resend_email/check_key | Implemented |
| Password reset | Email/new password | Сохранён | reset_password | Implemented |
| Collection discovery | Cards and balance header | Responsive premium collection grid | get_collections | Implemented |
| Global search | Request on every keypress | Debounce, cancellation, URL query, empty/error | search | Improved |
| Collection page | Header and NFT grid | Real metrics, stable media grid, token search | get_collection_nft | Implemented |
| Filters/sort/pagination | Не поддерживались API | Не показаны как fake controls | none | Not applicable |
| Activity/analytics tabs | Реальных данных нет | Не созданы | none | Not applicable |
| NFT details | Media, price, price history, actions | Сохранено; fake contract strings удалены | get_nft | Implemented |
| Buy NFT | Server mutation | Confirmation feedback and refresh | buy_nft | Implemented |
| Sell/unsell NFT | Server mutation | Validated price, feedback and refresh | sell_nft/unsell_nft | Implemented |
| My NFTs | Grid and local search | Responsive grid and local search | my_nfts | Implemented |
| Top up | Dynamic backend methods | Dynamic methods and returned payment details | payment/* | Implemented |
| Payment status polling | До 10 минут | 5-second sequential check, 10-minute limit, manual retry | payment/check | Implemented; live verification blocked |
| Withdraw | Dynamic methods and details | Dynamic methods, details/bank, result feedback | withdraw/* | Implemented |
| Profile identity | Username/email/avatar | Username/email/avatar with validation and refetch | user mutations | Implemented |
| Password change | Form | Form with explicit errors | change_password | Implemented |
| Language/currency | Selectors | Selectors with backend persistence | set_language/set_currency | Implemented |
| Finance history | Desktop list/table | Responsive table/mobile representation | finance/history | Implemented |
| NFT history | List | Responsive table/mobile representation | my_nfts/history | Implemented |
| Notifications | Header dropdown, mark read | Accessible panel with loading/error/empty and mark read | notifications/fetch | Implemented; live verification blocked |
| Favourites | Endpoints exist, no stable visible flow observed | Item toggle backed by get/add/delete endpoints | favourites endpoints | Implemented; response semantics blocked |
| Wallet connection | Absent | Not invented | none | Not applicable |
| Loading/error/empty | Often blank or spinner | Skeleton/state panels/retry/inline errors | all reads | Improved |
| Theme | Existing theme mechanism detected | Token-based dark/light switch | local preference | Implemented |

## Remaining parity verification

`Partial` items require authenticated staging/production test data to confirm response semantics without risking a real financial operation. They are listed in `TODO.md` and are not reported as fully tested.
