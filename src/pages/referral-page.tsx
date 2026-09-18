import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LoadingState } from "@/components/ui/page-state";

export function ReferralPage() {
  const { code = "" } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (/^\d+$/.test(code)) {
      window.localStorage.setItem("invite_code", code);
    }
    void navigate("/auth/signup", { replace: true });
  }, [code, navigate]);

  return <main className="container page"><LoadingState label="Подготавливаем приглашение" /></main>;
}
