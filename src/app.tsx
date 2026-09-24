import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { ProtectedRoute, PublicOnlyRoute } from "@/auth/route-guards";
import { ClientLayout } from "@/components/client-layout";
import { CookieConsent } from "@/components/cookie-consent";
import { LoadingState } from "@/components/ui/page-state";
import { getBrandName } from "@/lib/brand";
import { useSiteTheme } from "@/lib/use-site-theme";

const ActivationPage = lazy(() => import("@/pages/activation-page").then((module) => ({ default: module.ActivationPage })));
const AuthPage = lazy(() => import("@/pages/auth-page").then((module) => ({ default: module.AuthPage })));
const AuctionsPage = lazy(() => import("@/pages/auctions-page").then((module) => ({ default: module.AuctionsPage })));
const CollectionPage = lazy(() => import("@/pages/collection-page").then((module) => ({ default: module.CollectionPage })));
const FinancePage = lazy(() => import("@/pages/finance-page").then((module) => ({ default: module.FinancePage })));
const DashboardPage = lazy(() => import("@/pages/dashboard-page").then((module) => ({ default: module.DashboardPage })));
const HomePage = lazy(() => import("@/pages/home-page").then((module) => ({ default: module.HomePage })));
const LandingPage = lazy(() => import("@/pages/landing-page").then((module) => ({ default: module.LandingPage })));
const NftPage = lazy(() => import("@/pages/nft-page").then((module) => ({ default: module.NftPage })));
const NotFoundPage = lazy(() => import("@/pages/not-found-page").then((module) => ({ default: module.NotFoundPage })));
const OwnsPage = lazy(() => import("@/pages/owns-page").then((module) => ({ default: module.OwnsPage })));
const ProfilePage = lazy(() => import("@/pages/profile-page").then((module) => ({ default: module.ProfilePage })));
const RankingsPage = lazy(() => import("@/pages/rankings-page").then((module) => ({ default: module.RankingsPage })));
const ReferralPage = lazy(() => import("@/pages/referral-page").then((module) => ({ default: module.ReferralPage })));

export function App() {
  useSiteTheme();
  useEffect(() => { document.title = getBrandName(); }, []);
  return (
    <>
    <Suspense fallback={<main className="container page"><LoadingState label="Загружаем страницу" /></main>}><Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/c/:code" element={<ReferralPage />} />
      <Route path="/auth/login" element={<PublicOnlyRoute><AuthPage mode="login" /></PublicOnlyRoute>} />
      <Route path="/auth/signup" element={<PublicOnlyRoute><AuthPage mode="signup" /></PublicOnlyRoute>} />
      <Route path="/auth/reset-password" element={<PublicOnlyRoute><AuthPage mode="reset" /></PublicOnlyRoute>} />
      <Route path="/auth/activate" element={<ActivationPage />} />
      <Route path="/login" element={<Navigate to="/auth/login" replace />} />
      <Route path="/register" element={<Navigate to="/auth/signup" replace />} />
      <Route path="/item/:nftId" element={<ItemRedirect />} />
      <Route path="/profile" element={<Navigate to="/client/profile" replace />} />
      <Route path="/client" element={<ProtectedRoute><ClientLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="main" element={<HomePage />} />
        <Route path="collection/:collectionId" element={<CollectionPage />} />
        <Route path="collectible/:nftId" element={<NftPage />} />
        <Route path="auctions" element={<AuctionsPage />} />
        <Route path="rankings" element={<RankingsPage />} />
        <Route path="owns" element={<OwnsPage />} />
        <Route path="finance" element={<FinancePage />} />
        <Route path="topup" element={<Navigate to="/client/finance?tab=topup" replace />} />
        <Route path="withdraw" element={<Navigate to="/client/finance?tab=withdraw" replace />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="profile/security" element={<ProfilePage section="security" />} />
        <Route path="profile/devices" element={<ProfilePage section="devices" />} />
        <Route path="profile/achievements" element={<ProfilePage section="achievements" />} />
        <Route path="profile/settings" element={<ProfilePage section="settings" />} />
        <Route path="profile/history" element={<Navigate to="/client/finance?tab=history" replace />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes></Suspense>
    <CookieConsent />
    </>
  );
}

function ItemRedirect() {
  const { nftId = "" } = useParams();
  return <Navigate to={`/client/collectible/${nftId}`} replace />;
}
