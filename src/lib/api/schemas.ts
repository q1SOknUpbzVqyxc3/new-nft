import { z } from "zod";

const numericValueSchema = z.coerce.number().finite();
const nullableStringSchema = z.string().nullable().optional();
const identifierSchema = z.union([z.string(), z.number()]);

export const userSchema = z.object({
  id: identifierSchema,
  email: z.string(),
  username: nullableStringSchema,
  avatar: z.string().default(""),
  balance: numericValueSchema.default(0),
  currency: z.string().default("USD"),
  active: z.boolean().default(true),
  verificated: z.boolean().default(false),
  can_withdraw: z.boolean().default(true),
  turnover: numericValueSchema.default(0),
  created: z.string().default(""),
  minimal_deposit: numericValueSchema.default(0),
  minimal_withdraw: numericValueSchema.optional(),
  level: numericValueSchema.optional(),
  lang: z.string().optional(),
  has_2fa: z.boolean().optional(),
  unread_popup_notifications_count: numericValueSchema.optional(),
  unread_notifications_count: numericValueSchema.optional(),
  aml_verified: z.boolean().optional(),
  is_banned: z.boolean().optional()
}).passthrough();

export const collectionSummarySchema = z.object({
  id: identifierSchema,
  name: z.string(),
  image: z.string(),
  blockchain: z.string().default(""),
  author: z.string().default(""),
  follow: numericValueSchema.default(0)
}).passthrough();

export const marketplaceNftSchema = z.object({
  id: identifierSchema,
  image: z.string(),
  number: identifierSchema,
  blockchain: z.string().default(""),
  price: numericValueSchema.default(0),
  currency: z.string().default("USD")
}).passthrough();

export const collectionSchema = z.object({
  name: z.string(),
  author: z.string().default(""),
  in_own: numericValueSchema.default(0),
  min_price: numericValueSchema.default(0),
  max_price: numericValueSchema.default(0),
  nfts: z.array(marketplaceNftSchema).default([])
}).passthrough();

const pricePointSchema = z.object({
  time: z.union([z.string(), z.number()]),
  value: numericValueSchema
}).passthrough();

export const nftDetailsSchema = z.object({
  id: identifierSchema.optional(),
  collection_id: identifierSchema,
  collection_name: z.string(),
  number: identifierSchema,
  image: z.string(),
  blockchain: z.string().default(""),
  price: numericValueSchema.default(0),
  currency: z.string().default("USD"),
  is_sale: z.boolean().default(false),
  sale_price: numericValueSchema.default(0),
  is_own: z.boolean().default(false),
  own_id: identifierSchema.optional(),
  prices: z.array(pricePointSchema).default([])
}).passthrough();

export const searchResultSchema = z.object({
  id: identifierSchema,
  image: z.string(),
  blockchain: z.string().default(""),
  collection_name: z.string(),
  number: identifierSchema,
  price: numericValueSchema.default(0),
  currency: z.string().default("USD")
}).passthrough();

export const ownedNftSchema = z.object({
  id: identifierSchema,
  status: z.union([z.boolean(), z.number()]).transform(Boolean),
  sale_price: numericValueSchema.default(0),
  buy_price: numericValueSchema.optional(),
  buy_date: nullableStringSchema,
  sale_date: nullableStringSchema,
  pic: z.object({
    id: identifierSchema,
    collection_id: identifierSchema.optional(),
    image: z.string(),
    number: identifierSchema,
    price: numericValueSchema.default(0),
    collection: z.object({
      name: z.string(),
      blockchain: z.string().default("")
    }).passthrough()
  }).passthrough()
}).passthrough();

export const notificationSchema = z.object({
  key: identifierSchema.optional(),
  icon: z.coerce.number().int().default(0),
  title: z.string(),
  description: z.string(),
  created: z.string(),
  is_read: z.boolean().optional(),
  balance_before: numericValueSchema.nullable().optional(),
  balance_after: numericValueSchema.nullable().optional()
}).passthrough();

export const paymentMethodSchema = z.object({
  api_id: z.coerce.number().int(),
  label: z.string(),
  icon: z.string().default(""),
  min_dep: numericValueSchema.optional(),
  symbol: z.string().optional(),
  network: z.string().optional()
}).passthrough();

const paymentDetailValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export const paymentSessionSchema = z.object({
  id: identifierSchema,
  min_dep: numericValueSchema.optional(),
  details: z.record(z.string(), paymentDetailValueSchema).optional(),
  action_url: z.string().url().optional(),
  pay_url: z.string().url().optional(),
  url: z.string().url().optional(),
  network: z.string().optional(),
  wallet: z.string().optional(),
  symbol: z.string().optional()
}).passthrough();

export const financeHistorySchema = z.object({
  id: identifierSchema.optional(),
  type: z.coerce.number().int(),
  amount: numericValueSchema,
  currency: z.union([z.string(), z.number()]),
  method: z.coerce.number().int(),
  status: z.coerce.number().int(),
  comment: z.coerce.number().int().default(0),
  created: z.string(),
  details: nullableStringSchema,
  bank: nullableStringSchema
}).passthrough();

export const nftHistorySchema = z.object({
  id: identifierSchema.optional(),
  status: z.coerce.number().int(),
  collection_name: z.string(),
  pic_id: identifierSchema,
  sale_price: numericValueSchema.default(0),
  sale_date: nullableStringSchema,
  buy_date: nullableStringSchema
}).passthrough();

export const favouriteSchema = z.union([
  identifierSchema,
  z.object({
    id: identifierSchema.optional(),
    nft_id: identifierSchema.optional(),
    pic: z.object({ id: identifierSchema.optional() }).passthrough().optional()
  }).passthrough()
]);

/** Device session. Field names are tolerant: the backend endpoint is not published yet. */
export const deviceSessionSchema = z.object({
  id: identifierSchema.optional(),
  session_id: identifierSchema.optional(),
  device: z.string().nullish(),
  user_agent: z.string().nullish(),
  ip: z.string().nullish(),
  created: z.string().nullish(),
  last_active: z.string().nullish(),
  current: z.boolean().optional()
}).passthrough();

export const deviceSessionsSchema = z.union([
  z.array(deviceSessionSchema),
  z.object({ sessions: z.array(deviceSessionSchema) }).passthrough().transform((value) => value.sessions)
]);

export const twoFactorSetupSchema = z.object({
  secret: z.string().default(""),
  url: z.string().default("")
}).passthrough();

export const activityEventSchema = z.object({
  id: identifierSchema.optional(),
  text: z.string(),
  ts: z.coerce.number().optional(),
  color: z.string().nullish()
}).passthrough();

export const activityFeedSchema = z.union([
  z.array(activityEventSchema),
  z.object({ events: z.array(activityEventSchema) }).passthrough().transform((value) => value.events)
]);

export const popupNotificationSchema = z.object({
  id: identifierSchema.optional(),
  title: z.string().default(""),
  description: z.string().default(""),
  text: z.string().optional(),
  type: z.string().optional(),
  code: z.string().optional()
}).passthrough();

export const popupNotificationsSchema = z.union([
  z.array(popupNotificationSchema),
  z.object({ items: z.array(popupNotificationSchema) }).passthrough().transform((value) => value.items)
]);

/* ---- Marketplace extensions (not in the published OpenAPI yet): every field is optional so partial backends keep working. ---- */
const optionalNumberSchema = numericValueSchema.optional();
const seriesPointSchema = z.object({ time: z.union([z.string(), z.number()]), value: numericValueSchema }).passthrough();

export const collectionStatsSchema = z.object({
  floor_price: optionalNumberSchema,
  total_volume: optionalNumberSchema,
  owners: optionalNumberSchema,
  listed: optionalNumberSchema,
  listed_percent: optionalNumberSchema,
  supply: optionalNumberSchema,
  description: z.string().nullish(),
  currency: z.string().optional(),
  floor_history: z.array(seriesPointSchema).optional()
}).passthrough();

const traitSchema = z.object({
  trait_type: z.string().optional(),
  name: z.string().optional(),
  value: z.union([z.string(), z.number()]),
  rarity_percent: optionalNumberSchema
}).passthrough();

export const nftExtraSchema = z.object({
  traits: z.array(traitSchema).optional(),
  rarity_rank: optionalNumberSchema,
  rarity_score: optionalNumberSchema,
  supply: optionalNumberSchema,
  contract_address: z.string().nullish(),
  token_standard: z.string().nullish()
}).passthrough();

/** Platform-run auction lot. Only the platform creates lots; users bid or buy out. */
export const auctionSchema = z.object({
  id: identifierSchema.optional(),
  image_id: identifierSchema.optional(),
  collection_id: identifierSchema.optional(),
  collection_name: z.string().optional(),
  number: identifierSchema.optional(),
  image: z.string().optional(),
  blockchain: z.string().optional(),
  status: z.enum(["active", "upcoming", "ended"]).optional(),
  starts: z.string().nullish(),
  ends: z.string(),
  start_price: optionalNumberSchema,
  current_bid: optionalNumberSchema,
  min_bid: optionalNumberSchema,
  buy_now_price: optionalNumberSchema,
  bids: optionalNumberSchema,
  currency: z.string().optional(),
  is_leading: z.boolean().optional(),
  my_bid: numericValueSchema.nullish()
}).passthrough();

const bestWorstSchema = z.object({ name: z.string(), image: z.string().optional(), pnl: numericValueSchema, id: identifierSchema.optional() }).passthrough();

export const portfolioSchema = z.object({
  value: optionalNumberSchema,
  count: optionalNumberSchema,
  unrealized_pnl: optionalNumberSchema,
  realized_pnl: optionalNumberSchema,
  total_spent: optionalNumberSchema,
  total_received: optionalNumberSchema,
  best: bestWorstSchema.nullish(),
  worst: bestWorstSchema.nullish()
}).passthrough();

export const rankingRowSchema = z.object({
  collection_id: identifierSchema,
  name: z.string(),
  image: z.string().default(""),
  blockchain: z.string().default(""),
  floor_price: optionalNumberSchema,
  volume: optionalNumberSchema,
  change_percent: optionalNumberSchema,
  owners: optionalNumberSchema,
  items: optionalNumberSchema,
  currency: z.string().optional()
}).passthrough();

const listOrWrapped = <T extends z.ZodType>(item: T, key: string) => z.union([z.array(item), z.object({ [key]: z.array(item) }).passthrough().transform((value) => value[key] as z.infer<T>[])]);
export const auctionsSchema = listOrWrapped(auctionSchema, "auctions");
export const portfolioHistorySchema = listOrWrapped(seriesPointSchema, "points");
export const rankingSchema = listOrWrapped(rankingRowSchema, "rows");

export const collectionsSchema = z.array(collectionSummarySchema);
export const searchResultsSchema = z.array(searchResultSchema);
export const ownedNftsSchema = z.array(ownedNftSchema);
export const notificationsSchema = z.array(notificationSchema);
export const paymentMethodsSchema = z.array(paymentMethodSchema);
export const financeHistoryListSchema = z.array(financeHistorySchema);
export const nftHistoryListSchema = z.array(nftHistorySchema);
export const favouritesSchema = z.array(favouriteSchema);

export type User = z.infer<typeof userSchema>;
export type CollectionSummary = z.infer<typeof collectionSummarySchema>;
export type MarketplaceNft = z.infer<typeof marketplaceNftSchema>;
export type CollectionDetails = z.infer<typeof collectionSchema>;
export type NftDetails = z.infer<typeof nftDetailsSchema>;
export type SearchResult = z.infer<typeof searchResultSchema>;
export type OwnedNft = z.infer<typeof ownedNftSchema>;
export type Notification = z.infer<typeof notificationSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type PaymentSession = z.infer<typeof paymentSessionSchema>;
export type FinanceHistory = z.infer<typeof financeHistorySchema>;
export type NftHistory = z.infer<typeof nftHistorySchema>;
export type CollectionStats = z.infer<typeof collectionStatsSchema>;
export type NftExtra = z.infer<typeof nftExtraSchema>;
export type Auction = z.infer<typeof auctionSchema>;
export type Portfolio = z.infer<typeof portfolioSchema>;
export type RankingRow = z.infer<typeof rankingRowSchema>;
export type SeriesPoint = z.infer<typeof seriesPointSchema>;
export type DeviceSession = z.infer<typeof deviceSessionSchema>;
export type TwoFactorSetup = z.infer<typeof twoFactorSetupSchema>;
export type ActivityEvent = z.infer<typeof activityEventSchema>;
export type PopupNotification = z.infer<typeof popupNotificationSchema>;
export type Favourite = z.infer<typeof favouriteSchema>;
