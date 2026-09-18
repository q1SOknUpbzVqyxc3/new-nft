import { Link } from "react-router-dom";

export function Brand({ to = "/client/main" }: { to?: string }) {
  return (
    <Link to={to} className="brand" aria-label="Monvravex — главная">
      <span className="brand__mark" aria-hidden="true">
        M
      </span>
      <span className="brand__name">MONVRAVEX</span>
    </Link>
  );
}
