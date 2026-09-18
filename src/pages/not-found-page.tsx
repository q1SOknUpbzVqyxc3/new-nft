import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/auth/auth-context";

export function NotFoundPage() {
  const auth = useAuth();
  const authenticated = auth.status === "authenticated";
  return <main className="centered-page"><span className="eyebrow">404</span><h1>Страница не найдена</h1><p>Проверьте адрес или выберите доступный раздел.</p><div className="landing__actions"><Link className="button button--primary" to={authenticated ? "/client/main" : "/"}><ArrowLeft size={16} /> {authenticated ? "В маркет" : "На главную"}</Link>{authenticated ? <Link className="button button--secondary" to="/client/owns">Мои NFT</Link> : <Link className="button button--secondary" to="/auth/login">Войти</Link>}</div></main>;
}
