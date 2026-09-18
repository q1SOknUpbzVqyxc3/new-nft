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
  pic: z.object({
    id: identifierSchema,
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
  sale_date: nullableStringSchema
}).passthrough();

export const favouriteSchema = z.union([
  identifierSchema,
  z.object({
    id: identifierSchema.optional(),
    nft_id: identifierSchema.optional(),
    pic: z.object({ id: identifierSchema.optional() }).passthrough().optional()
  }).passthrough()
]);

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
export type Favourite = z.infer<typeof favouriteSchema>;
