/* eslint-disable react-hooks/set-state-in-effect -- Request lifecycle state is synchronized with the API. */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axs from "../axios";
import type { MarketMover } from "../types";
import { useLanguage } from "../context/LanguageContext";
export function Charts() {
  const { t } = useLanguage();
  const [movers, setMovers] = useState<MarketMover[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    axs
      .get<MarketMover[]>("/market/movers", { signal: controller.signal })
      .then(({ data }) => setMovers(data))
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [retry]);
  return (
    <main className="app-page">
      <h1>{t("nav.charts")}</h1>
      <p>{t("market.description")}</p>
      {loading ? (
        <p role="status">{t("common.loading")}</p>
      ) : error ? (
        <div role="alert">
          {t("common.error")}{" "}
          <button className="action" onClick={() => setRetry((v) => v + 1)}>
            {t("common.retry")}
          </button>
        </div>
      ) : !movers.length ? (
        <p>{t("market.empty")}</p>
      ) : (
        <div className="market-table">
          <table>
            <thead>
              <tr>
                <th>{t("nav.cards")}</th>
                <th>{t("market.previous")}</th>
                <th>{t("market.current")}</th>
                <th>{t("market.change")}</th>
              </tr>
            </thead>
            <tbody>
              {movers.map((m) => (
                <tr key={m.card_id}>
                  <td>
                    <Link to={`/card/${m.card_id}`}>{m.card?.name}</Link>
                    <small>{m.card?.set_name}</small>
                  </td>
                  <td>${m.previous_price.toFixed(2)}</td>
                  <td>${m.current_price.toFixed(2)}</td>
                  <td style={{ color: m.change >= 0 ? "#6ee7b7" : "#fca5a5" }}>
                    {m.change >= 0 ? "+" : ""}
                    {m.percent_change.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
