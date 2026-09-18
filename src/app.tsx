import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { ProtectedRoute, PublicOnlyRoute } from "@/auth/route-guards";
import { ClientLayout } from "@/components/client-layout";
import { LoadingState } from "@/components/ui/page-state";

const ActivationPage = lazy(() => import("@/pages/activation-page").then((module) => ({ default: module.ActivationPage })));
const AuthPage = lazy(() => import("@/pages/auth-page").then((module) => ({ default: module.AuthPage })));
const CollectionPage = lazy(() => import("@/pages/collection-page").then((module) => ({ default: module.CollectionPage })));
const HistoryPage = lazy(() => import("@/pages/history-page").then((module) => ({ default: module.HistoryPage })));
const HomePage = lazy(() => import("@/pages/home-page").then((module) => ({ default: module.HomePage })));
const LandingPage = lazy(() => import("@/pages/landing-page").then((module) => ({ default: module.LandingPage })));
const NftPage = lazy(() => import("@/pages/nft-page").then((module) => ({ default: module.NftPage })));
const NotFoundPage = lazy(() => import("@/pages/not-found-page").then((module) => ({ default: module.NotFoundPage })));
const OwnsPage = lazy(() => import("@/pages/owns-page").then((module) => ({ default: module.OwnsPage })));
const PaymentsPage = lazy(() => import("@/pages/payments-page").then((module) => ({ default: module.PaymentsPage })));
const ProfilePage = lazy(() => import("@/pages/profile-page").then((module) => ({ default: module.ProfilePage })));
const ReferralPage = lazy(() => import("@/pages/referral-page").then((module) => ({ default: module.ReferralPage })));

export function App() {
  return (
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
        <Route index element={<Navigate to="main" replace />} />
        <Route path="main" element={<HomePage />} />
        <Route path="collection/:collectionId" element={<CollectionPage />} />
        <Route path="collectible/:nftId" element={<NftPage />} />
        <Route path="owns" element={<OwnsPage />} />
        <Route path="topup" element={<PaymentsPage mode="topup" />} />
        <Route path="withdraw" element={<PaymentsPage mode="withdraw" />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="profile/security" element={<ProfilePage section="security" />} />
        <Route path="profile/settings" element={<ProfilePage section="settings" />} />
        <Route path="profile/history" element={<HistoryPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes></Suspense>
  );
}

function ItemRedirect() {
  const { nftId = "" } = useParams();
  return <Navigate to={`/client/collectible/${nftId}`} replace />;
}
