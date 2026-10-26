/* eslint-disable react-hooks/set-state-in-effect -- Request lifecycle state is synchronized with the API. */
import { isAxiosError } from 'axios';
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axs from "../../axios";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";

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

const cardStyle: React.CSSProperties = {
    background: "linear-gradient(160deg, #0f0e17 0%, #1a1628 100%)",
    border: "1px solid rgba(212,175,55,0.15)",
    boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
    borderRadius: "16px",
};

function formatNumber(n: number | undefined) {
    if (n === undefined) return "—";
    return n.toLocaleString();
}

export function Admin() {
    const { user, logout } = useAuth();
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

    async function triggerJob(endpoint: "/admin/sync-cards" | "/admin/update-prices") {
        setActionMessage(null);
        try {
            const { data } = await axs.post(endpoint);
            setActionMessage(data.message);
            fetchStats();
        } catch (err) {
            setActionMessage((isAxiosError(err) ? err.response?.data?.message : undefined) ?? t("admin.fetchStatsError"));
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
        <div
            className="min-h-screen"
            style={{ background: "#080710", color: "#ede8d8", fontFamily: "'DM Sans', sans-serif" }}
        >
            {/* Ambient glow */}
            <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
                <div
                    style={{
                        position: "absolute",
                        top: "-15%",
                        right: "10%",
                        width: "600px",
                        height: "600px",
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(212,175,55,0.035) 0%, transparent 65%)",
                    }}
                />
            </div>

            {/* HEADER */}
            <header
                className="sticky top-0"
                style={{
                    zIndex: 50,
                    borderBottom: "1px solid rgba(212,175,55,0.12)",
                    background: "rgba(8,7,16,0.9)",
                    backdropFilter: "blur(20px)",
                }}
            >
                <div className="max-w-5xl mx-auto px-6 flex items-center gap-4" style={{ height: "72px" }}>
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                            <polygon points="14,2 26,9 26,19 14,26 2,19 2,9" stroke="#d4af37" strokeWidth="1.5" fill="none" opacity="0.8" />
                            <polygon points="14,7 21,11 21,17 14,21 7,17 7,11" stroke="#d4af37" strokeWidth="0.8" fill="rgba(212,175,55,0.06)" />
                            <circle cx="14" cy="14" r="2.5" fill="#d4af37" opacity="0.9" />
                        </svg>
                        <h1
                            style={{
                                fontFamily: "'Cinzel', serif",
                                fontSize: "18px",
                                fontWeight: "700",
                                letterSpacing: "0.2em",
                                background: "linear-gradient(135deg, #d4af37 0%, #f0d060 50%, #9b7e2c 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {t("admin.title")}
                        </h1>
                    </div>

                    <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, rgba(212,175,55,0.2), transparent)" }} />

                    {user?.name && (
                        <span className="flex-shrink-0" style={{ fontSize: "12px", color: "#9b8c6e", whiteSpace: "nowrap" }}>
                            {t("nav.hello", { name: user.name })}
                        </span>
                    )}

                    <LanguageSwitcher />

                    <button
                        onClick={logout}
                        className="flex-shrink-0"
                        style={{
                            fontSize: "12px",
                            color: "#9b8c6e",
                            background: "transparent",
                            border: "1px solid rgba(212,175,55,0.18)",
                            borderRadius: "10px",
                            padding: "6px 12px",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {t("nav.logout")}
                    </button>
                </div>
            </header>

            <div className="relative max-w-5xl mx-auto px-6 py-8" style={{ zIndex: 1 }}>
                <Link
                    to="/cards"
                    style={{
                        fontSize: "12px",
                        color: "#9b8c6e",
                        textDecoration: "none",
                        letterSpacing: "0.05em",
                    }}
                >
                    {t("admin.backToCards")}
                </Link>

                <p style={{ fontSize: "13px", color: "#6b6578", marginTop: "10px", marginBottom: "28px" }}>
                    {t("admin.subtitle")}
                </p>

                {error && (
                    <div
                        style={{
                            ...cardStyle,
                            border: "1px solid rgba(248,113,113,0.3)",
                            padding: "14px 18px",
                            marginBottom: "20px",
                            color: "#fca5a5",
                            fontSize: "13px",
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* STATS GRID */}
                <h2
                    style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: "13px",
                        letterSpacing: "0.15em",
                        color: "#9b8c6e",
                        textTransform: "uppercase",
                        marginBottom: "12px",
                    }}
                >
                    {t("admin.statsTitle")}
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                    {[
                        { label: t("admin.totalCards"), value: formatNumber(stats?.totalCards) },
                        { label: t("admin.totalPriceRecords"), value: formatNumber(stats?.totalPriceRecords) },
                        { label: t("admin.totalUsers"), value: formatNumber(stats?.totalUsers) },
                        {
                            label: t("admin.cardsWithoutImage"),
                            value: formatNumber(stats?.cardsWithoutImage),
                            warn: (stats?.cardsWithoutImage ?? 0) > 0,
                        },
                        {
                            label: t("admin.lastPriceUpdate"),
                            value: stats?.lastPriceUpdate
                                ? new Date(stats.lastPriceUpdate).toLocaleDateString()
                                : t("admin.never"),
                        },
                    ].map((stat, i) => (
                        <div key={i} style={{ ...cardStyle, padding: "16px" }}>
                            <div style={{ fontSize: "11px", color: "#6b6578", letterSpacing: "0.05em", marginBottom: "6px" }}>
                                {stat.label}
                            </div>
                            <div
                                style={{
                                    fontFamily: "'Cinzel', serif",
                                    fontSize: "22px",
                                    fontWeight: 700,
                                    color: stat.warn ? "#fca5a5" : "#d4af37",
                                }}
                            >
                                {stat.value}
                            </div>
                        </div>
                    ))}
                </div>

                {/* JOB STATUS */}
                <div
                    style={{
                        ...cardStyle,
                        padding: "14px 18px",
                        marginBottom: "24px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        fontSize: "13px",
                        color: "#9b8c6e",
                    }}
                >
                    <span
                        style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: jobRunning ? "#f0d060" : "#4b5563",
                            boxShadow: jobRunning ? "0 0 8px rgba(240,208,96,0.8)" : "none",
                            flexShrink: 0,
                        }}
                    />
                    {jobRunning
                        ? t("admin.statusRunning", { job: jobLabel })
                        : t("admin.statusIdle")}

                    {stats?.job.error && (
                        <span style={{ color: "#fca5a5", marginLeft: "auto" }}>
                            {t("admin.lastError", { error: stats.job.error })}
                        </span>
                    )}
                </div>

                {actionMessage && (
                    <div style={{ fontSize: "13px", color: "#9b8c6e", marginBottom: "16px" }}>
                        {actionMessage}
                    </div>
                )}

                {/* ACTIONS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div style={{ ...cardStyle, padding: "20px" }}>
                        <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: "15px", color: "#ede8d8", marginBottom: "8px" }}>
                            {t("admin.syncCardsTitle")}
                        </h3>
                        <p style={{ fontSize: "12.5px", color: "#6b6578", lineHeight: 1.5, marginBottom: "16px" }}>
                            {t("admin.syncCardsDesc")}
                        </p>
                        {stats?.job.lastResult && (
                            <p style={{ fontSize: "11.5px", color: "#9b8c6e", marginBottom: "12px" }}>
                                {t("admin.lastSyncResult", {
                                    inserted: stats.job.lastResult.insertedTotal ?? 0,
                                    fixed: stats.job.lastResult.updatedTotal ?? 0,
                                })}
                            </p>
                        )}
                        <button
                            onClick={() => triggerJob("/admin/sync-cards")}
                            disabled={jobRunning}
                            style={{
                                background: jobRunning
                                    ? "rgba(212,175,55,0.05)"
                                    : "linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.08))",
                                border: "1px solid rgba(212,175,55,0.3)",
                                color: jobRunning ? "#6b6578" : "#d4af37",
                                borderRadius: "10px",
                                padding: "9px 16px",
                                fontSize: "12px",
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                cursor: jobRunning ? "not-allowed" : "pointer",
                            }}
                        >
                            {jobRunning && stats?.job.job === "cards" ? t("admin.running") : t("admin.runNow")}
                        </button>
                    </div>

                    <div style={{ ...cardStyle, padding: "20px" }}>
                        <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: "15px", color: "#ede8d8", marginBottom: "8px" }}>
                            {t("admin.updatePricesTitle")}
                        </h3>
                        <p style={{ fontSize: "12.5px", color: "#6b6578", lineHeight: 1.5, marginBottom: "16px" }}>
                            {t("admin.updatePricesDesc")}
                        </p>
                        <button
                            onClick={() => triggerJob("/admin/update-prices")}
                            disabled={jobRunning}
                            style={{
                                background: jobRunning
                                    ? "rgba(212,175,55,0.05)"
                                    : "linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.08))",
                                border: "1px solid rgba(212,175,55,0.3)",
                                color: jobRunning ? "#6b6578" : "#d4af37",
                                borderRadius: "10px",
                                padding: "9px 16px",
                                fontSize: "12px",
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                cursor: jobRunning ? "not-allowed" : "pointer",
                            }}
                        >
                            {jobRunning && stats?.job.job === "prices" ? t("admin.running") : t("admin.runNow")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Admin;
