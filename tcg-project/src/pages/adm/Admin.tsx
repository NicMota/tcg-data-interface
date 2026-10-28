/* eslint-disable react-hooks/set-state-in-effect -- Request lifecycle state is synchronized with the API. */
import { isAxiosError } from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axs from "../../axios";
import { useLanguage } from "../../context/LanguageContext";
import { useCopy } from "../../i18n/useCopy";
import { Icon } from "../../components/Icon";

interface AdminJobStatus {
  running: boolean;
  job: "cards" | "prices" | null;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
  lastResult: { insertedTotal?: number; updatedTotal?: number } | null;
}

interface AdminStats {
  totalCards: number;
  totalPriceRecords: number;
  totalUsers: number;
  cardsWithoutImage: number;
  lastPriceUpdate: string | null;
  job: AdminJobStatus;
}

function formatNumber(n: number | undefined) {
  if (n === undefined) return "—";
  return n.toLocaleString();
}

export function Admin() {
  const copy = useCopy();
  const { t } = useLanguage();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await axs.get<AdminStats>("/admin/stats");
      setStats(data);
      setError(null);
      return data;
    } catch (err) {
      console.error(err);
      setError(t("admin.fetchStatsError"));
      return null;
    }
  }, [t]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    // While a job is running, poll for progress; stop once it's idle again.
    if (stats?.job.running) {
      if (!pollRef.current) {
        pollRef.current = setInterval(fetchStats, 3000);
      }
    } else if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [stats?.job.running, fetchStats]);

  async function triggerJob(
    endpoint: "/admin/sync-cards" | "/admin/update-prices",
  ) {
    setActionMessage(null);
    try {
      const { data } = await axs.post(endpoint);
      setActionMessage(data.message);
      fetchStats();
    } catch (err) {
      setActionMessage(
        (isAxiosError(err) ? err.response?.data?.message : undefined) ??
          t("admin.fetchStatsError"),
      );
    }
  }

  const jobRunning = stats?.job.running ?? false;
  const jobLabel =
    stats?.job.job === "cards"
      ? t("admin.statusJobCards")
      : stats?.job.job === "prices"
        ? t("admin.statusJobPrices")
        : "";

  return (
    <main className="app-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            {copy("BEHIND THE COUNTER", "NOS BASTIDORES DA LOJA")}
          </p>
          <h1>
            {copy("Keep your data in good shape.", "Seus dados sempre em dia.")}
          </h1>
          <p>
            {copy(
              "Import the catalog, collect daily prices and monitor background jobs.",
              "Importe o catálogo, registre os preços diários e acompanhe as tarefas.",
            )}
          </p>
        </div>
        <Link className="action primary" to="/inventory">
          {copy("Open inventory", "Abrir estoque")}
        </Link>
      </div>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {actionMessage && (
        <p className="notice" role="status">
          {actionMessage}
        </p>
      )}
      <div className="metric-grid">
        {[
          [t("admin.totalCards"), stats?.totalCards],
          [t("admin.totalPriceRecords"), stats?.totalPriceRecords],
          [t("admin.totalUsers"), stats?.totalUsers],
          [t("admin.cardsWithoutImage"), stats?.cardsWithoutImage],
        ].map(([label, n]) => (
          <div className="metric" key={String(label)}>
            <span className="metric-label">{label}</span>
            <strong>{formatNumber(n as number | undefined)}</strong>
          </div>
        ))}
      </div>
      <section className="panel admin-status">
        <div>
          <span className="eyebrow">
            {copy("SYNC STATUS", "STATUS DA SINCRONIZAÇÃO")}
          </span>
          <h2>
            {jobRunning
              ? `${t("admin.running")} ${jobLabel}`
              : copy(
                  "Ready for the next snapshot.",
                  "Pronto para o próximo registro.",
                )}
          </h2>
          <p className="muted">
            {copy("Latest price snapshot: ", "Último registro de preço: ")}
            {stats?.lastPriceUpdate
              ? new Date(stats.lastPriceUpdate).toLocaleString()
              : "—"}
          </p>
        </div>
        <span className={`data-status ${jobRunning ? "" : "stale"}`}>
          <span className="tiny-dot" />
          {jobRunning
            ? copy("Running", "Executando")
            : copy("Idle", "Aguardando")}
        </span>
      </section>
      {stats?.job.error && (
        <p className="notice error" role="alert">
          {stats.job.error}
        </p>
      )}
      <div className="admin-jobs">
        {[
          [
            "/admin/sync-cards",
            t("admin.syncCardsTitle"),
            t("admin.syncCardsDesc"),
          ],
          [
            "/admin/update-prices",
            t("admin.updatePricesTitle"),
            t("admin.updatePricesDesc"),
          ],
        ].map(([endpoint, title, description]) => (
          <section className="panel job-card" key={endpoint}>
            <Icon
              name={endpoint.includes("cards") ? "cards" : "charts"}
              size={26}
            />
            <h2>{title}</h2>
            <p>{description}</p>
            <button
              className="action"
              disabled={jobRunning || !stats}
              onClick={() =>
                triggerJob(
                  endpoint as "/admin/sync-cards" | "/admin/update-prices",
                )
              }
            >
              {t("admin.runNow")}
              <Icon name="arrow" size={16} />
            </button>
          </section>
        ))}
      </div>
      <div className="integration-note">
        <Icon name="insights" />
        <div>
          <strong>
            {copy("Let the history build.", "Deixe o histórico crescer.")}
          </strong>
          <p>
            {copy(
              "A catalog import does not create historical data retroactively. The insight radar needs at least seven observations over seven days. Enable the daily scheduler in the server configuration to keep collecting prices.",
              "A importação do catálogo não cria dados históricos retroativos. O radar exige ao menos sete registros ao longo de sete dias. Ative o agendador diário na configuração do servidor para continuar coletando preços.",
            )}
          </p>
        </div>
      </div>
    </main>
  );
}
export default Admin;
