/* eslint-disable react-hooks/set-state-in-effect -- API request lifecycle. */
import { useEffect, useState, lazy, Suspense } from "react";
import { Link, useParams } from "react-router-dom";
import axs from "../axios";
import type { TcgCard, PriceRecord } from "../types";
import { FavoriteButton } from "../components/FavoriteButton";
import { useLanguage } from "../context/LanguageContext";
import { useCopy } from "../i18n/useCopy";
import { useAuth } from "../context/AuthContext";
const CardChart = lazy(() =>
  import("../components/CardChart").then((m) => ({ default: m.CardChart })),
);
export function CardInfo() {
  const { card_id } = useParams(),
    { t } = useLanguage(),
    copy = useCopy(),
    { user } = useAuth();
  const [card, setCard] = useState<TcgCard | null>(null),
    [prices, setPrices] = useState<PriceRecord[]>([]);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(false),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    axs
      .get(`/cards/${card_id}`, { signal: controller.signal })
      .then(({ data }) => {
        setCard(data.card_info);
        setPrices(data.prices ?? []);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [card_id, retry]);
  const values = prices.flatMap((p) =>
    p.price_usd == null ? [] : [Number(p.price_usd)],
  );
  return (
    <main className="app-page">
      <Link className="back-link" to="/cards">
        {t("cardInfo.back")}
      </Link>
      {loading ? (
        <div className="empty-state" role="status">
          {t("common.loading")}
        </div>
      ) : error || !card ? (
        <div className="empty-state" role="alert">
          <p>{t("common.error")}</p>
          <button className="action" onClick={() => setRetry((v) => v + 1)}>
            {t("common.retry")}
          </button>
        </div>
      ) : (
        <>
          <div className="page-heading">
            <div>
              <p className="eyebrow">{card.set_name}</p>
              <h1>{card.name}</h1>
              <p>{card.type_line}</p>
            </div>
            <FavoriteButton cardId={card.card_id} />
          </div>
          <div className="card-detail-grid">
            <div className="panel card-portrait">
              <img
                src={card.image_uris?.normal || "/card-placeholder.svg"}
                alt={card.name ?? ""}
                onError={(e) => {
                  e.currentTarget.src = "/card-placeholder.svg";
                }}
              />
              <span className="muted">
                {copy("Printing reference", "Referência da edição")}
              </span>
              {user?.isAdmin && (
                <Link
                  className="action primary"
                  to={`/inventory?cardId=${encodeURIComponent(card.card_id)}&name=${encodeURIComponent(card.name ?? "")}`}
                >
                  {copy("Add to inventory", "Adicionar ao estoque")}
                </Link>
              )}
            </div>
            <section className="panel history-panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">SCRYFALL · USD · NONFOIL</p>
                  <h2>{t("cardInfo.priceHistory")}</h2>
                </div>
                <strong className="detail-price">
                  {prices[0]?.price_usd == null
                    ? "—"
                    : `$${Number(prices[0].price_usd).toFixed(2)}`}
                </strong>
              </div>
              <Suspense fallback={<p>{t("common.loading")}</p>}>
                <CardChart
                  price_info={{
                    prices: prices.map((p) =>
                      p.price_usd == null ? null : Number(p.price_usd),
                    ),
                    dates: prices.map((p) => p.date),
                  }}
                />
              </Suspense>
              <div className="history-stats">
                <div>
                  <small>{copy("Observed low", "Mínima observada")}</small>
                  <strong>
                    {values.length ? `$${Math.min(...values).toFixed(2)}` : "—"}
                  </strong>
                </div>
                <div>
                  <small>{copy("Observed high", "Máxima observada")}</small>
                  <strong>
                    {values.length ? `$${Math.max(...values).toFixed(2)}` : "—"}
                  </strong>
                </div>
                <div>
                  <small>{copy("Snapshots", "Registros")}</small>
                  <strong>{values.length}</strong>
                </div>
              </div>
              <p className="muted">
                {copy(
                  "Available recorded history. Gaps mean no observation; they are not zero-price days.",
                  "Histórico registrado disponível. Lacunas indicam ausência de registro, não preço zero.",
                )}
              </p>
            </section>
          </div>
        </>
      )}
    </main>
  );
}
