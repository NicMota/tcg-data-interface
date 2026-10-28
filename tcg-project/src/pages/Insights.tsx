/* eslint-disable react-hooks/set-state-in-effect -- Reset the API request status when the lookback window changes. */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axs from "../axios";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useCopy } from "../i18n/useCopy";
import { Icon } from "../components/Icon";
import { Sparkline } from "../components/Sparkline";
import { FavoriteButton } from "../components/FavoriteButton";

interface Insight {
  card_id: string;
  name: string;
  set_name: string;
  image_uris: { small?: string; normal?: string } | null;
  current: number;
  previous: number | null;
  low: number;
  average: number;
  observations: number;
  firstDate: string;
  asOf: string;
  change: number | null;
  discount: number;
  signals: string[];
  series: { date: string; price: number }[];
}
interface InsightsData {
  data: Insight[];
  days: number;
  coverage: { tracked: number; lastUpdate: string | null };
  limit: number;
}
const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n,
  );

export function Insights() {
  const copy = useCopy(),
    { language } = useLanguage(),
    { user } = useAuth();
  const [checkedAt] = useState(() => Date.now());
  const [data, setData] = useState<InsightsData | null>(null),
    [error, setError] = useState(false),
    [loading, setLoading] = useState(true);
  const [days, setDays] = useState(90),
    [tab, setTab] = useState("all"),
    [search, setSearch] = useState(""),
    [sort, setSort] = useState("discount"),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    axs
      .get<InsightsData>("/market/insights", {
        params: { days },
        signal: controller.signal,
      })
      .then((r) => setData(r.data))
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [days, retry]);
  const items = useMemo(
    () =>
      (data?.data ?? [])
        .filter(
          (i) =>
            (tab === "all" || i.signals.includes(tab)) &&
            `${i.name} ${i.set_name}`
              .toLowerCase()
              .includes(search.toLowerCase()),
        )
        .sort((a, b) =>
          sort === "change"
            ? (b.change ?? -Infinity) - (a.change ?? -Infinity)
            : sort === "price"
              ? a.current - b.current
              : b.discount - a.discount,
        ),
    [data, tab, search, sort],
  );
  const labels: Record<string, string> = {
    all: copy("All signals", "Todos os sinais"),
    low: copy("Near a low", "Perto da mínima"),
    research: copy("Buying shortlist", "Lista de compras"),
    spike: copy("Price spikes", "Altas repentinas"),
    drop: copy("Sharp drops", "Quedas bruscas"),
  };
  const count = (signal: string) =>
    data?.data.filter((i) => i.signals.includes(signal)).length ?? 0;
  const lastUpdate = data?.coverage.lastUpdate;
  const stale =
    !lastUpdate || checkedAt - Date.parse(lastUpdate) > 3 * 86400000;
  return (
    <main className="app-page insights-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            {copy("THE BIG PICTURE", "UM OLHAR SOBRE O MERCADO")}
          </p>
          <h1>
            {copy(
              "Your next move starts here.",
              "Sua próxima jogada começa aqui.",
            )}
          </h1>
          <p>
            {copy(
              "A clearer view of the market. A smarter way to run your store.",
              "Uma visão mais clara do mercado. Mais contexto para sua loja.",
            )}
          </p>
        </div>
        <label className="period-picker">
          {copy("Lookback", "Período")}
          <select
            aria-label={copy("Analysis window", "Período de análise")}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            {[30, 90, 180].map((d) => (
              <option key={d} value={d}>
                {d} {copy("days", "dias")}
              </option>
            ))}
          </select>
        </label>
      </div>
      <section className="radar-banner">
        <div>
          <span className="banner-kicker">
            <span className="tiny-dot" />
            {copy("YOUR DAILY MARKET BRIEF", "SEU PANORAMA DIÁRIO")}
          </span>
          <h2>
            {copy("Good cards. Better timing.", "Boas cartas. Melhor timing.")}
          </h2>
          <p>
            {copy(
              "Find prices near their lows, investigate buying opportunities, and catch the moves worth a closer look.",
              "Encontre preços perto da mínima, investigue oportunidades de compra e acompanhe movimentos que merecem atenção.",
            )}
          </p>
          <a href="#radar" className="banner-link">
            {copy("Explore the price radar", "Explorar o radar de preços")}
            <Icon name="arrow" size={17} />
          </a>
        </div>
        <div className="banner-art" aria-hidden="true">
          <div className="art-orbit" />
          <div className="art-card back" />
          <div className="art-card middle" />
          <div className="art-card front">
            <span>ARCANA</span>
            <Icon name="insights" size={48} />
            <span>SEE THE SIGNAL.</span>
          </div>
          <span className="art-spark">✳</span>
        </div>
      </section>
      <section
        className="metric-grid"
        aria-label={copy("Market summary", "Resumo do mercado")}
      >
        {[
          [
            copy("Cards tracked", "Cartas acompanhadas"),
            data?.coverage.tracked ?? 0,
            copy("with prices in this window", "com preços neste período"),
            "cards",
          ],
          [
            copy("Near a historical low", "Perto da mínima histórica"),
            count("low"),
            copy(
              "within 5% of the observed low",
              "até 5% acima da mínima observada",
            ),
            "insights",
          ],
          [
            copy("Buying shortlist", "Lista de compras"),
            count("research"),
            copy(
              "discounted, with a stable latest day",
              "com desconto e último dia estável",
            ),
            "favorites",
          ],
          [
            copy("Sudden price spikes", "Altas repentinas"),
            count("spike"),
            copy("at least +20% in one day", "pelo menos +20% em um dia"),
            "charts",
          ],
        ].map(([label, value, detail, icon]) => (
          <div className="metric" key={String(label)}>
            <div className="metric-label">
              {label}
              <Icon name={String(icon)} size={17} />
            </div>
            <strong>
              {loading ? "—" : Number(value).toLocaleString(language)}
            </strong>
            <small>{detail}</small>
          </div>
        ))}
      </section>
      <section className="panel radar-panel" id="radar">
        <div className="section-heading">
          <div>
            <h2>
              {copy("Price radar", "Radar de preços")}
              <span className="count-badge">
                {loading ? "—" : (data?.data.length ?? 0)}
              </span>
            </h2>
            <p>
              {copy(
                "Signals backed by observed prices, with the context to judge them.",
                "Sinais baseados em preços observados, com contexto para avaliar.",
              )}
            </p>
          </div>
          <span className={`data-status ${stale ? "stale" : ""}`}>
            <span className="tiny-dot" />
            {lastUpdate
              ? `${copy("Snapshot", "Registro")} ${new Date(lastUpdate).toLocaleDateString(language === "pt" ? "pt-BR" : "en-GB", { timeZone: "UTC" })}`
              : copy("Awaiting price data", "Aguardando dados de preço")}
          </span>
        </div>
        <div
          className="tabs"
          role="tablist"
          aria-label={copy("Signal type", "Tipo de sinal")}
        >
          {Object.entries(labels).map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
            >
              {label}
              {key !== "all" && <span>{count(key)}</span>}
            </button>
          ))}
        </div>
        <div className="table-toolbar">
          <label className="search-field">
            <Icon name="search" size={18} />
            <input
              aria-label={copy("Search signals", "Buscar sinais")}
              placeholder={copy(
                "Search a card or set…",
                "Buscar carta ou coleção…",
              )}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select
            aria-label={copy("Sort signals", "Ordenar sinais")}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="discount">
              {copy("Largest discount", "Maior desconto")}
            </option>
            <option value="change">
              {copy("Largest daily rise", "Maior alta diária")}
            </option>
            <option value="price">{copy("Lowest price", "Menor preço")}</option>
          </select>
        </div>
        {loading ? (
          <div className="empty-state" role="status">
            <span className="loading-line" />
            {copy("Reading the market…", "Analisando o mercado…")}
          </div>
        ) : error ? (
          <div className="empty-state" role="alert">
            <h3>
              {copy(
                "The radar couldn’t load.",
                "Não foi possível carregar o radar.",
              )}
            </h3>
            <button className="action" onClick={() => setRetry((v) => v + 1)}>
              {copy("Try again", "Tentar novamente")}
            </button>
          </div>
        ) : !items.length ? (
          <div className="empty-state">
            <span className="empty-icon">
              <Icon name="insights" size={30} />
            </span>
            <h3>
              {search || tab !== "all"
                ? copy(
                    "No signals match this view.",
                    "Nenhum sinal nesta seleção.",
                  )
                : copy(
                    "A little history goes a long way.",
                    "Um pouco de histórico faz a diferença.",
                  )}
            </h3>
            <p>
              {copy(
                "Signals need at least 7 observations spanning 7 days, a price of $1 or more, and a snapshot from the last 3 days.",
                "Os sinais exigem 7 observações ao longo de 7 dias, preço de US$ 1 ou mais e um registro dos últimos 3 dias.",
              )}
            </p>
            <Link className="action" to={user?.isAdmin ? "/admin" : "/cards"}>
              {user?.isAdmin
                ? copy("Manage price data", "Gerenciar dados de preço")
                : copy("Explore the catalog", "Explorar catálogo")}
              <Icon name="arrow" size={16} />
            </Link>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{copy("CARD / PRINTING", "CARTA / EDIÇÃO")}</th>
                  <th>{copy("PRICE", "PREÇO")}</th>
                  <th>{copy("1 DAY", "1 DIA")}</th>
                  <th>{copy("RECENT HISTORY", "HISTÓRICO RECENTE")}</th>
                  <th>{copy("SIGNAL & EVIDENCE", "SINAL E EVIDÊNCIA")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.card_id}>
                    <td>
                      <Link className="card-cell" to={`/card/${item.card_id}`}>
                        <img
                          src={
                            item.image_uris?.small ??
                            item.image_uris?.normal ??
                            "/card-placeholder.svg"
                          }
                          alt=""
                          onError={(e) => {
                            e.currentTarget.src = "/card-placeholder.svg";
                          }}
                        />
                        <span>
                          <strong>{item.name}</strong>
                          <small>{item.set_name}</small>
                        </span>
                      </Link>
                    </td>
                    <td>
                      <strong className="number">{money(item.current)}</strong>
                      <small>
                        {copy("Low", "Mín.")} {money(item.low)}
                      </small>
                    </td>
                    <td>
                      <span
                        className={
                          item.change != null && item.change >= 0
                            ? "positive number"
                            : "negative number"
                        }
                      >
                        {item.change == null
                          ? "—"
                          : `${item.change >= 0 ? "+" : ""}${item.change.toFixed(1)}%`}
                      </span>
                    </td>
                    <td>
                      <Sparkline
                        values={item.series.map((s) => s.price)}
                        positive={(item.change ?? 0) >= 0}
                      />
                    </td>
                    <td>
                      <div className="signal-tags">
                        {item.signals.map((s) => (
                          <span key={s} className={`signal-tag ${s}`}>
                            {labels[s]}
                          </span>
                        ))}
                      </div>
                      <small>
                        {item.discount.toFixed(1)}%{" "}
                        {copy("below average", "abaixo da média")} ·{" "}
                        {item.observations} {copy("observations", "registros")}
                      </small>
                    </td>
                    <td>
                      <FavoriteButton cardId={item.card_id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="table-footnote">
          <span>Scryfall · USD · nonfoil</span>
          <span>
            {copy(
              "Observed lows within the selected window.",
              "Mínimas observadas dentro do período selecionado.",
            )}
          </span>
        </div>
      </section>
      <details className="methodology">
        <summary>
          {copy("How to read these signals", "Como interpretar os sinais")}
        </summary>
        <div>
          <p>
            {copy(
              "Near a low: within 5% of the window’s lowest observed price and at least 5% below its average. Buying shortlist: at least 15% below the average, with the latest daily move between −5% and +10%. Spikes / drops: a move of at least 20% between consecutive daily snapshots.",
              "Perto da mínima: até 5% acima do menor preço observado e pelo menos 5% abaixo da média. Lista de compras: pelo menos 15% abaixo da média e última variação diária entre −5% e +10%. Altas / quedas: variação de pelo menos 20% entre registros de dias consecutivos.",
            )}
          </p>
          <p>
            {copy(
              "This is a research shortlist, not a return forecast. Prices do not measure sales volume, liquidity, fees, reprint risk, or local Brazilian market demand. Check those before buying. USD prices are not converted into BRL.",
              "Esta é uma lista para pesquisa, sem previsão de retorno. Os preços não medem volume de vendas, liquidez, taxas, risco de reimpressão ou demanda no Brasil. Avalie esses fatores antes de comprar. Valores USD não são convertidos para BRL.",
            )}
          </p>
          <p>
            {copy(
              "The radar displays up to 500 candidate printings, ordered by discount to their average. Counts refer to the displayed candidates; tracked cards includes all cards priced in the window.",
              "O radar exibe até 500 edições candidatas, ordenadas pelo desconto sobre a média. As contagens se referem aos candidatos exibidos; cartas acompanhadas inclui todas com preço no período.",
            )}
          </p>
        </div>
      </details>
    </main>
  );
}
