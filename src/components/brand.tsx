import { Link } from "react-router-dom";
import { getBrandName } from "@/lib/brand";
import { DEFAULT_CLIENT_ROUTE } from "@/lib/navigation";

export function Brand({ to = DEFAULT_CLIENT_ROUTE }: { to?: string }) {
  const name = getBrandName();
  return (
    <Link to={to} className="brand" aria-label={`${name} — главная`}>
      <span className="brand__mark" aria-hidden="true">
        {name.charAt(0)}
      </span>
      <span className="brand__name">{name.toUpperCase()}</span>
    </Link>
  );
}
