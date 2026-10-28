import { Link } from "react-router-dom";
import type { TcgCard } from "../types";
import { FavoriteButton } from "./FavoriteButton";
import { useLanguage } from "../context/LanguageContext";
export function Card({ c }: { c: TcgCard }) {
  const { t } = useLanguage();
  const current = c.card_prices?.[0]?.price_usd ?? c.prices?.usd;
  const prev = c.card_prices?.[1]?.price_usd;
  const change =
    current != null && prev != null && Number(prev) > 0
      ? (Number(current) / Number(prev) - 1) * 100
      : null;
  return (
    <article className="catalog-card">
      <Link to={`/card/${c.card_id}`} className="catalog-image">
        <img
          loading="lazy"
          src={c.image_uris?.normal || "/card-placeholder.svg"}
          alt={c.name ?? ""}
          onError={(e) => {
            e.currentTarget.src = "/card-placeholder.svg";
          }}
        />
      </Link>
      <div className="catalog-card-content">
        <p className="card-set">{c.set_name}</p>
        <h2>{c.name}</h2>
        <p className="card-type">{c.type_line}</p>
        <div className="card-price-row">
          <strong>
            {current == null ? "—" : `$${Number(current).toFixed(2)}`}
          </strong>
          {change != null && (
            <span className={change >= 0 ? "positive" : "negative"}>
              {change >= 0 ? "+" : ""}
              {change.toFixed(1)}%
            </span>
          )}
        </div>
        <Link to={`/card/${c.card_id}`} className="card-detail-link">
          {t("home.viewCard")}
        </Link>
        <FavoriteButton cardId={c.card_id} />
      </div>
    </article>
  );
}
