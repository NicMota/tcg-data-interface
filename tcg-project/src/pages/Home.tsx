import { useEffect, useState, type ChangeEvent } from "react";
import axs from "../axios";
import { Card } from "../components/Card";
import { useLanguage } from "../context/LanguageContext";
import type { TcgCard } from "../types";
import { Icon } from "../components/Icon";
import { useCopy } from "../i18n/useCopy";

function Home() {
  const copy = useCopy();
  const { t } = useLanguage();

  const [cards, setCards] = useState<TcgCard[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [foil, setFoil] = useState<boolean | undefined>(undefined);

  const [manaCost, setManaCost] = useState("");
  const [setCode, setSetCode] = useState("");
  const [rarity, setRarity] = useState("");
  const [releasedFrom, setReleasedFrom] = useState("");
  const [releasedTo, setReleasedTo] = useState("");
  const [colors, setColors] = useState<string[]>([]);

  const [sets, setSets] = useState<{ set_code: string; set_name: string }[]>(
    [],
  );

  useEffect(() => {
    const fetchSets = async () => {
      try {
        const { data } = await axs.get("/sets");
        setSets(data ?? []);
      } catch (err) {
        console.log(err);
      }
    };
    fetchSets();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(false);
      try {
        const { data } = await axs.get("/cards", {
          signal: controller.signal,
          params: {
            page: currentPage + 1,
            limit: itemsPerPage,
            name: search || undefined,
            foil,
            mana_cost: manaCost || undefined,
            set_code: setCode || undefined,
            rarity: rarity || undefined,
            released_from: releasedFrom || undefined,
            released_to: releasedTo || undefined,
            colors: colors.length ? colors.join(",") : undefined,
          },
        });
        if (!controller.signal.aborted) {
          setCards(data.data);
          setTotalPages(data.totalPages);
        }
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    currentPage,
    itemsPerPage,
    search,
    foil,
    manaCost,
    setCode,
    rarity,
    releasedFrom,
    releasedTo,
    colors,
    retry,
  ]);

  function filterCards(e: ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    setCurrentPage(0);
  }

  function toggleColor(symbol: string) {
    setCurrentPage(0);
    setColors((prev) =>
      prev.includes(symbol)
        ? prev.filter((c) => c !== symbol)
        : [...prev, symbol],
    );
  }

  function clearFilters() {
    setCurrentPage(0);
    setFoil(undefined);
    setManaCost("");
    setSetCode("");
    setRarity("");
    setReleasedFrom("");
    setReleasedTo("");
    setColors([]);
  }

  const hasActiveFilters =
    foil !== undefined ||
    !!manaCost ||
    !!setCode ||
    !!rarity ||
    !!releasedFrom ||
    !!releasedTo ||
    colors.length > 0;

  // Pagination window
  const visiblePages = 5;
  const half = Math.floor(visiblePages / 2);
  let start = Math.max(0, currentPage - half);
  const end = Math.min(totalPages - 1, start + visiblePages - 1);
  if (end - start < visiblePages - 1)
    start = Math.max(0, end - visiblePages + 1);

  function nextPage() {
    if (currentPage < totalPages - 1) setCurrentPage((p) => p + 1);
  }
  function previousPage() {
    if (currentPage > 0) setCurrentPage((p) => p - 1);
  }
  function goToPage(i: number) {
    if (i >= 0 && i < totalPages) setCurrentPage(i);
  }

  return (
    <main className="app-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">MAGIC: THE GATHERING</p>
          <h1>{copy("Find your next card.", "Encontre sua próxima carta.")}</h1>
          <p>
            {copy(
              "Every printing, with the price history behind it.",
              "Cada edição, com seu histórico de preços.",
            )}
          </p>
        </div>
        <select
          aria-label={copy("Cards per page", "Cartas por página")}
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(0);
          }}
        >
          {[20, 30, 40].map((n) => (
            <option key={n} value={n}>
              {t("nav.perPage", { n })}
            </option>
          ))}
        </select>
      </div>
      <section className="panel catalog-toolbar">
        <div className="table-toolbar">
          <label className="search-field">
            <Icon name="search" />
            <input
              aria-label={copy("Search cards", "Buscar cartas")}
              value={search}
              onChange={filterCards}
              placeholder={t("home.searchPlaceholder")}
            />
          </label>
          <button
            className={`action ${foil ? "selected" : ""}`}
            aria-pressed={!!foil}
            onClick={() => {
              setFoil(foil ? undefined : true);
              setCurrentPage(0);
            }}
          >
            {t("home.foilFilter")}
          </button>
          <button
            className="action"
            aria-expanded={showFilters}
            onClick={() => setShowFilters((v) => !v)}
          >
            {t("home.filters")} {hasActiveFilters && "•"}
          </button>
        </div>
        {showFilters && (
          <div className="filter-grid">
            <label>
              {copy("Set", "Coleção")}
              <select
                value={setCode}
                onChange={(e) => {
                  setSetCode(e.target.value);
                  setCurrentPage(0);
                }}
              >
                <option value="">
                  {copy("All sets", "Todas as coleções")}
                </option>
                {sets.map((s) => (
                  <option key={s.set_code} value={s.set_code}>
                    {s.set_name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {copy("Rarity", "Raridade")}
              <select
                value={rarity}
                onChange={(e) => {
                  setRarity(e.target.value);
                  setCurrentPage(0);
                }}
              >
                <option value="">{copy("All rarities", "Todas")}</option>
                {[
                  "common",
                  "uncommon",
                  "rare",
                  "mythic",
                  "special",
                  "bonus",
                ].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {copy("Mana cost", "Custo de mana")}
              <input
                value={manaCost}
                onChange={(e) => {
                  setManaCost(e.target.value);
                  setCurrentPage(0);
                }}
                placeholder="{2}{U}"
              />
            </label>
            <label>
              {copy("Released from", "Lançamento a partir de")}
              <input
                type="date"
                value={releasedFrom}
                onChange={(e) => {
                  setReleasedFrom(e.target.value);
                  setCurrentPage(0);
                }}
              />
            </label>
            <label>
              {copy("Released until", "Lançamento até")}
              <input
                type="date"
                value={releasedTo}
                onChange={(e) => {
                  setReleasedTo(e.target.value);
                  setCurrentPage(0);
                }}
              />
            </label>
            <fieldset>
              <legend>{copy("Colors", "Cores")}</legend>
              <div className="color-filters">
                {["W", "U", "B", "R", "G"].map((c) => (
                  <button
                    key={c}
                    aria-pressed={colors.includes(c)}
                    className={`action ${colors.includes(c) ? "selected" : ""}`}
                    onClick={() => toggleColor(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </fieldset>
            <button className="text-button" onClick={clearFilters}>
              {copy("Clear filters", "Limpar filtros")}
            </button>
          </div>
        )}
      </section>
      <div className="results-heading">
        <span>{copy("THE CARD LIBRARY", "BIBLIOTECA DE CARTAS")}</span>
        <span>
          {copy(
            "Scryfall · prices in USD · nonfoil",
            "Scryfall · preços em USD · nonfoil",
          )}
        </span>
      </div>
      {loading ? (
        <div className="empty-state" role="status">
          {t("common.loading")}
        </div>
      ) : error ? (
        <div className="empty-state" role="alert">
          <p>{t("common.error")}</p>
          <button className="action" onClick={() => setRetry((v) => v + 1)}>
            {t("common.retry")}
          </button>
        </div>
      ) : cards.length ? (
        <div className="card-grid">
          {cards.map((c) => (
            <Card key={c.card_id} c={c} />
          ))}
        </div>
      ) : (
        <div className="empty-state panel">
          <Icon name="cards" size={32} />
          <h2>{copy("No cards found.", "Nenhuma carta encontrada.")}</h2>
          <p>
            {copy(
              "Try another search or ask an administrator to import the catalog.",
              "Tente outra busca ou peça a um administrador para importar o catálogo.",
            )}
          </p>
        </div>
      )}
      {totalPages > 1 && (
        <div className="pager">
          <button
            className="action"
            disabled={currentPage === 0 || loading}
            onClick={previousPage}
          >
            {t("home.previous")}
          </button>
          {Array.from(
            { length: Math.max(0, end - start + 1) },
            (_, i) => start + i,
          ).map((i) => (
            <button
              className={`action ${i === currentPage ? "selected" : ""}`}
              aria-current={i === currentPage ? "page" : undefined}
              key={i}
              onClick={() => goToPage(i)}
            >
              {i + 1}
            </button>
          ))}
          <button
            className="action"
            disabled={currentPage >= totalPages - 1 || loading}
            onClick={nextPage}
          >
            {t("home.next")}
          </button>
        </div>
      )}
    </main>
  );
}
export default Home;
