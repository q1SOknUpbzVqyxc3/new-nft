import { z, type ZodType } from "zod";
import { apiRequest, createFormBody } from "./client";
import {
  activityFeedSchema,
  auctionSchema,
  auctionsSchema,
  collectionStatsSchema,
  nftExtraSchema,
  portfolioHistorySchema,
  portfolioSchema,
  rankingSchema,
  collectionSchema,
  deviceSessionsSchema,
  popupNotificationsSchema,
  twoFactorSetupSchema,
  collectionsSchema,
  financeHistoryListSchema,
  favouritesSchema,
  nftDetailsSchema,
  nftHistoryListSchema,
  notificationsSchema,
  ownedNftsSchema,
  paymentMethodsSchema,
  paymentSessionSchema,
  searchResultsSchema,
  userSchema
} from "./schemas";

const mutationResponseSchema = z.unknown();

function get<T>(path: string, schema: ZodType<T>, signal?: AbortSignal) {
  return apiRequest(path, schema, { method: "GET", signal });
}

function postForm<T = unknown>(
  path: string,
  values: Record<string, string | number | boolean | null | undefined>,
  schema: ZodType<T> = mutationResponseSchema as ZodType<T>,
  signal?: AbortSignal
) {
  return apiRequest(path, schema, {
    method: "POST",
    signal,
    body: createFormBody(values),
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });
}

export const api = {
  login(email: string, password: string, remember: boolean, signal?: AbortSignal) {
    return postForm("/api/login", { email, password, remember: Number(remember) }, mutationResponseSchema, signal);
  },
  loginWithTwoFactor(preAuthToken: string, code: string, remember: boolean, signal?: AbortSignal) {
    return postForm("/api/login/2fa", { pre_auth_token: preAuthToken, code, remember: Number(remember) }, mutationResponseSchema, signal);
  },
  logout(signal?: AbortSignal) {
    return postForm("/api/logout", {}, mutationResponseSchema, signal);
  },
  signup(email: string, password: string, inviteCode: string, language: string, newsletter: boolean, signal?: AbortSignal) {
    return postForm(
      "/api/signup",
      { email, password, invite_code: inviteCode, language, newsletter },
      mutationResponseSchema,
      signal
    );
  },
  resetPassword(email: string, password: string, signal?: AbortSignal) {
    return postForm("/api/reset_password", { email, password }, mutationResponseSchema, signal);
  },
  resendEmail(signal?: AbortSignal) {
    return get("/api/resend_email", mutationResponseSchema, signal);
  },
  checkActivationKey(key: string, signal?: AbortSignal) {
    return get(`/api/check_key?key=${encodeURIComponent(key)}`, mutationResponseSchema, signal);
  },
  getUser(signal?: AbortSignal) {
    return get("/api/user", userSchema, signal);
  },
  getCollections(signal?: AbortSignal) {
    return get("/api/get_collections", collectionsSchema, signal);
  },
  getCollection(collectionId: string, signal?: AbortSignal) {
    return get(`/api/get_collection_nft?collection_id=${encodeURIComponent(collectionId)}`, collectionSchema, signal);
  },
  getNft(imageId: string, signal?: AbortSignal) {
    return get(`/api/get_nft?image_id=${encodeURIComponent(imageId)}`, nftDetailsSchema, signal);
  },
  search(query: string, signal?: AbortSignal) {
    return postForm("/api/search", { query }, searchResultsSchema, signal);
  },
  buyNft(imageId: string, signal?: AbortSignal) {
    return postForm("/api/buy_nft", { image_id: imageId }, mutationResponseSchema, signal);
  },
  sellNft(ownId: string, price: number, signal?: AbortSignal) {
    return postForm("/api/sell_nft", { own_id: ownId, price }, mutationResponseSchema, signal);
  },
  unsellNft(ownId: string, signal?: AbortSignal) {
    return postForm("/api/unsell_nft", { own_id: ownId }, mutationResponseSchema, signal);
  },
  getOwnedNfts(signal?: AbortSignal) {
    return get("/api/my_nfts", ownedNftsSchema, signal);
  },
  getFavourites(signal?: AbortSignal) {
    return get("/api/get_favourites", favouritesSchema, signal);
  },
  addFavourite(nftId: string, signal?: AbortSignal) {
    return postForm("/api/add_favourite", { nft_id: nftId }, mutationResponseSchema, signal);
  },
  deleteFavourite(nftId: string, signal?: AbortSignal) {
    return postForm("/api/del_favourite", { nft_id: nftId }, mutationResponseSchema, signal);
  },
  getNotifications(markRead = true, signal?: AbortSignal) {
    return get(`/api/user/notifications/fetch?mark_read=${markRead}`, notificationsSchema, signal);
  },
  getPaymentMethods(signal?: AbortSignal) {
    return get("/api/payment/methods", paymentMethodsSchema, signal);
  },
  createPayment(amount: number, method: number, signal?: AbortSignal) {
    return postForm("/api/payment/create", { amount, method }, paymentSessionSchema, signal);
  },
  checkPayment(id: string, signal?: AbortSignal) {
    return postForm("/api/payment/check", { id }, z.boolean(), signal);
  },
  getWithdrawMethods(signal?: AbortSignal) {
    return get("/api/withdraw/methods", paymentMethodsSchema, signal);
  },
  createWithdraw(amount: number, method: number, details: string, bank?: string, signal?: AbortSignal) {
    return postForm("/api/withdraw/create", { amount, method, details, bank }, mutationResponseSchema, signal);
  },
  getFinanceHistory(signal?: AbortSignal) {
    return get("/api/finance/history", financeHistoryListSchema, signal);
  },
  getNftHistory(signal?: AbortSignal) {
    return get("/api/my_nfts/history", nftHistoryListSchema, signal);
  },
  setLanguage(language: string, signal?: AbortSignal) {
    return postForm("/api/user/set_language", { key: language }, mutationResponseSchema, signal);
  },
  setCurrency(currency: string, signal?: AbortSignal) {
    return postForm("/api/user/set_currency", { key: currency }, z.coerce.number(), signal);
  },
  setUsername(username: string, signal?: AbortSignal) {
    return postForm("/api/user/set_username", { key: username }, mutationResponseSchema, signal);
  },
  changeEmail(email: string, signal?: AbortSignal) {
    return postForm("/api/user/change_email", { email }, mutationResponseSchema, signal);
  },
  changePassword(password: string, oldPassword: string, signal?: AbortSignal) {
    return postForm("/api/user/change_password", { password, old_password: oldPassword }, mutationResponseSchema, signal);
  },
  getSessions(signal?: AbortSignal) {
    return postForm("/api/sessions", {}, deviceSessionsSchema, signal);
  },
  revokeSession(sessionId: string, signal?: AbortSignal) {
    return postForm("/api/sessions/revoke", { session_id: sessionId }, mutationResponseSchema, signal);
  },
  revokeOtherSessions(signal?: AbortSignal) {
    return postForm("/api/sessions/revoke-others", {}, mutationResponseSchema, signal);
  },
  setupTwoFactor(signal?: AbortSignal) {
    return postForm("/api/2fa/setup", {}, twoFactorSetupSchema, signal);
  },
  enableTwoFactor(code: string, signal?: AbortSignal) {
    return postForm("/api/2fa/enable", { code }, mutationResponseSchema, signal);
  },
  disableTwoFactor(signal?: AbortSignal) {
    return postForm("/api/2fa/disable", {}, mutationResponseSchema, signal);
  },
  getActivityFeed(count: number, signal?: AbortSignal, scope?: { collectionId?: string; nftId?: string; lang?: string; theme?: string; currency?: string }) {
    const query = new URLSearchParams({ count: String(count) });
    if (scope?.lang) query.set("lang", scope.lang);
    if (scope?.theme) query.set("theme", scope.theme);
    if (scope?.currency) query.set("currency", scope.currency);
    if (scope?.collectionId) query.set("collection_id", scope.collectionId);
    if (scope?.nftId) query.set("image_id", scope.nftId);
    return get(`/api/activity-feed?${query.toString()}`, activityFeedSchema, signal);
  },
  // ---- Marketplace extensions: proposed contract, documented in API.md ----
  getCollectionStats(collectionId: string, signal?: AbortSignal) {
    return get(`/api/collection/stats?collection_id=${encodeURIComponent(collectionId)}`, collectionStatsSchema, signal);
  },
  getNftExtra(imageId: string, signal?: AbortSignal) {
    return get(`/api/nft/details?image_id=${encodeURIComponent(imageId)}`, nftExtraSchema, signal);
  },
  getAuction(imageId: string, signal?: AbortSignal) {
    return get(`/api/nft/auction?image_id=${encodeURIComponent(imageId)}`, auctionSchema, signal);
  },
  getAuctions(status: "active" | "upcoming" | "ended", options: { collectionId?: string; limit?: number } = {}, signal?: AbortSignal) {
    const query = new URLSearchParams({ status });
    if (options.collectionId) query.set("collection_id", options.collectionId);
    if (options.limit) query.set("limit", String(options.limit));
    return get(`/api/auctions?${query.toString()}`, auctionsSchema, signal);
  },
  placeBid(imageId: string, amount: number, signal?: AbortSignal) {
    return postForm("/api/nft/auction/bid", { image_id: imageId, amount }, mutationResponseSchema, signal);
  },
  buyNowAuction(imageId: string, signal?: AbortSignal) {
    return postForm("/api/nft/auction/buy_now", { image_id: imageId }, mutationResponseSchema, signal);
  },
  getPortfolio(signal?: AbortSignal) {
    return get("/api/portfolio", portfolioSchema, signal);
  },
  getPortfolioHistory(period: string, signal?: AbortSignal) {
    return get(`/api/portfolio/history?period=${encodeURIComponent(period)}`, portfolioHistorySchema, signal);
  },
  getRankings(period: string, category: string, signal?: AbortSignal) {
    return get(`/api/rankings?period=${encodeURIComponent(period)}&category=${encodeURIComponent(category)}`, rankingSchema, signal);
  },
  getPopupNotifications(signal?: AbortSignal) {
    return get("/api/user/popup_notifications/fetch", popupNotificationsSchema, signal);
  },
  setAvatar(file: File, signal?: AbortSignal) {
    const body = new FormData();
    body.set("file", file);
    return apiRequest("/api/user/avatar/set", mutationResponseSchema, { method: "POST", body, signal });
  }
};
