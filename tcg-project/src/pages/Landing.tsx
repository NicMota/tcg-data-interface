import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { useEffect, useState } from "react";

const sampleTicker = [
    { name: "Ragavan, Nimble Pilferer", set: "MH2", price: 42.18, diff: 3.41 },
    { name: "The One Ring", set: "LTR", price: 61.9, diff: -4.75 },
    { name: "Solitude", set: "MH2", price: 24.6, diff: 1.15 },
    { name: "Orcish Bowmasters", set: "MH3", price: 18.3, diff: -0.62 },
    { name: "Wrenn and Six", set: "MH1", price: 33.05, diff: 2.02 },
];

interface Step { title: string; body: string }
interface Testimonial { quote: string; name: string; role: string }

async function getMarketMovers() {
    const response = await fetch(
        'http://localhost:8000/movers'
    );

    if (!response.ok) {
        throw new Error('Failed to fetch market movers');
    }

    return response.json();
}
function Landing() {
    const { isAuthenticated, logout } = useAuth();
    const { t, tRaw } = useLanguage();
        
    const [movers, setMovers] = useState([]);
    const steps = tRaw<Step[]>("landing.howItWorks");
    const testimonials = tRaw<Testimonial[]>("landing.testimonials");
    

    useEffect(() => {
    
        async function loadMovers() {
            try {
                const data = await getMarketMovers();

                setMovers(data);
            } catch (error) {
                console.error(error);
            }
        }

        loadMovers();
    }, []);
    
    return (
        <div
            style={{
                background: "#080710",
                color: "#ede8d8",
                fontFamily: "'DM Sans', sans-serif",
                minHeight: "100vh",
            }}
        >
            {/* Ambient glow blobs, same recipe as Home / Login / Register */}
            <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
                <div style={{
                    position: "absolute", top: "-15%", right: "10%",
                    width: "600px", height: "600px", borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(212,175,55,0.035) 0%, transparent 65%)",
                }} />
                <div style={{
                    position: "absolute", bottom: "10%", left: "-5%",
                    width: "450px", height: "450px", borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(100,60,180,0.04) 0%, transparent 70%)",
                }} />
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
                <div className="max-w-7xl mx-auto px-6 flex items-center gap-4" style={{ height: "72px" }}>
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                            <polygon points="14,2 26,9 26,19 14,26 2,19 2,9" stroke="#d4af37" strokeWidth="1.5" fill="none" opacity="0.8" />
                            <polygon points="14,7 21,11 21,17 14,21 7,17 7,11" stroke="#d4af37" strokeWidth="0.8" fill="rgba(212,175,55,0.06)" />
                            <circle cx="14" cy="14" r="2.5" fill="#d4af37" opacity="0.9" />
                        </svg>
                        <h1 style={{
                            fontFamily: "'Cinzel', serif", fontSize: "18px", fontWeight: 700,
                            letterSpacing: "0.2em",
                            background: "linear-gradient(135deg, #d4af37 0%, #f0d060 50%, #9b7e2c 100%)",
                            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                            whiteSpace: "nowrap",
                        }}>
                            MAGIC TCG TRACKER
                        </h1>
                    </div>

                    <div style={{ flex: 1 }} />

                    <LanguageSwitcher />

                    {isAuthenticated ? (
                        <>
                            <Link
                                to="/cards"
                                style={{
                                    fontSize: "12px", fontWeight: 700, letterSpacing: "0.06em",
                                    textTransform: "uppercase", fontFamily: "'Cinzel', serif",
                                    padding: "9px 16px", borderRadius: "10px",
                                    background: "linear-gradient(135deg, #d4af37, #b8960c)",
                                    color: "#080710", textDecoration: "none", whiteSpace: "nowrap",
                                }}
                            >
                                {t("nav.enterArchives")}
                            </Link>
                            <button
                                onClick={logout}
                                style={{
                                    fontSize: "13px", color: "#9b8c6e", background: "transparent",
                                    border: "none", cursor: "pointer",
                                }}
                            >
                                {t("nav.logout")}
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" style={{ fontSize: "13px", color: "#9b8c6e", textDecoration: "none", whiteSpace: "nowrap" }}>
                                {t("nav.signIn")}
                            </Link>
                            <Link
                                to="/register"
                                style={{
                                    fontSize: "12px", fontWeight: 700, letterSpacing: "0.06em",
                                    textTransform: "uppercase", fontFamily: "'Cinzel', serif",
                                    padding: "9px 16px", borderRadius: "10px",
                                    background: "linear-gradient(135deg, #d4af37, #b8960c)",
                                    color: "#080710", textDecoration: "none", whiteSpace: "nowrap",
                                }}
                            >
                                {t("nav.startFree")}
                            </Link>
                        </>
                    )}
                </div>
            </header>

            <main className="relative max-w-5xl mx-auto px-6" style={{ zIndex: 1 }}>

                {/* HERO — opens on the problem, not the feature */}
                <section className="text-center" style={{ paddingTop: "88px", paddingBottom: "56px" }}>
                    <p style={{
                        fontSize: "12px", letterSpacing: "0.2em", color: "#9b8c6e",
                        textTransform: "uppercase", marginBottom: "18px",
                    }}>
                        {t("landing.tag")}
                    </p>
                    <h2 style={{
                        fontFamily: "'Cinzel', serif", fontWeight: 700,
                        fontSize: "clamp(28px, 5vw, 46px)", lineHeight: 1.2,
                        maxWidth: "760px", margin: "0 auto 20px",
                    }}>
                        {t("landing.heroTitleBefore")}{" "}
                        <span style={{ color: "#d4af37" }}>{t("landing.heroTitleHighlight")}</span>
                    </h2>
                    <p style={{
                        fontSize: "16px", color: "#9b8c6e", maxWidth: "560px",
                        margin: "0 auto 32px", lineHeight: 1.6,
                    }}>
                        {t("landing.heroSubtitle")}
                    </p>

                    <Link
                        to="/register"
                        className="inline-block"
                        style={{
                            padding: "14px 28px", borderRadius: "12px",
                            fontSize: "13px", fontWeight: 700, letterSpacing: "0.08em",
                            textTransform: "uppercase", fontFamily: "'Cinzel', serif",
                            background: "linear-gradient(135deg, #d4af37, #b8960c)",
                            color: "#080710", textDecoration: "none",
                            boxShadow: "0 0 24px rgba(212,175,55,0.3)",
                        }}
                    >
                        {t("landing.ctaPrimary")}
                    </Link>
                    <p style={{ fontSize: "12px", color: "#6b6578", marginTop: "10px" }}>
                        {t("landing.ctaSub")}
                    </p>
                </section>

                {/* PROOF STRIP — demonstrates the product instead of just claiming it */}
                <section
                    className="rounded-2xl overflow-hidden"
                    style={{
                        border: "1px solid rgba(212,175,55,0.15)",
                        background: "linear-gradient(160deg, #0f0e17 0%, #1a1628 100%)",
                        marginBottom: "72px",
                    }}
                >
                    <div className="flex items-center justify-between px-5 pt-4">
                        <span style={{ fontSize: "11px", letterSpacing: "0.1em", color: "#6b6578", textTransform: "uppercase" }}>
                            {t("landing.liveMovers")}
                        </span>
                        <span style={{ fontSize: "11px", color: "#6b6578" }}>{t("landing.updatedDaily")}</span>
                    </div>
                    <div className="flex flex-col divide-y" style={{ borderColor: "rgba(212,175,55,0.08)" }}>
                        {movers.map((c) => {
                            const positive = c?.change >= 0;
                            return (
                                <div
                                    key={c.name}
                                    className="flex items-center justify-between px-5 py-3"
                                    style={{ borderTop: "1px solid rgba(212,175,55,0.08)" }}
                                >
                                    <div>
                                        <p style={{ fontFamily: "'Cinzel', serif", fontSize: "13px", color: "#ede8d8" }}>
                                            {c.card.name}
                                        </p>
                                        <p style={{ fontSize: "11px", color: "#6b6578" }}>{c.set}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span style={{ fontFamily: "'Cinzel', serif", fontSize: "14px", color: "#d4af37" }}>
                                            ${c.current_price?.toFixed(2)}
                                        </span>
                                        <span style={{
                                            fontSize: "12px", fontWeight: 600, padding: "3px 9px", borderRadius: "6px",
                                            color: positive ? "#6ee7b7" : "#fca5a5",
                                            background: positive ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)",
                                            border: `1px solid ${positive ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}`,
                                        }}>
                                            {positive ? "▲" : "▼"} {Math.abs(c.change).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* HOW IT WORKS — designed for skimming, not reading */}
                <section className="grid gap-6 sm:grid-cols-3" style={{ marginBottom: "80px" }}>
                    {steps.map((s, i) => (
                        <div key={s.title}>
                            <span style={{
                                fontFamily: "'Cinzel', serif", fontSize: "12px", color: "#d4af37",
                                letterSpacing: "0.1em",
                            }}>
                                0{i + 1}
                            </span>
                            <h3 style={{
                                fontFamily: "'Cinzel', serif", fontSize: "16px", margin: "8px 0 6px",
                                color: "#ede8d8",
                            }}>
                                {s.title}
                            </h3>
                            <p style={{ fontSize: "13px", color: "#9b8c6e", lineHeight: 1.6 }}>
                                {s.body}
                            </p>
                        </div>
                    ))}
                </section>

                {/* SOCIAL PROOF — imperfect rating + specific, attributable quotes */}
                {/*}
                <section className="text-center" style={{ marginBottom: "88px" }}>
                    <div className="flex items-center justify-center gap-2" style={{ marginBottom: "8px" }}>
                        <span style={{ color: "#d4af37", fontSize: "18px" }}>★★★★☆</span>
                        <span style={{ fontSize: "13px", color: "#9b8c6e" }}>{t("landing.ratingLabel")}</span>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2" style={{ marginTop: "32px" }}>
                        {testimonials.map((tm) => (
                            <div
                                key={tm.name}
                                className="rounded-2xl p-5 text-left"
                                style={{
                                    background: "linear-gradient(160deg, #0f0e17 0%, #1a1628 100%)",
                                    border: "1px solid rgba(212,175,55,0.15)",
                                }}
                            >
                                <p style={{ fontSize: "14px", color: "#ede8d8", lineHeight: 1.6, marginBottom: "14px" }}>
                                    "{tm.quote}"
                                </p>
                                <p style={{ fontSize: "12px", color: "#9b8c6e" }}>
                                    <span style={{ color: "#d4af37" }}>{tm.name}</span> — {tm.role}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
                */}

                {/* FINAL CTA — same action, repeated, short path to it */}
                <section
                    className="text-center rounded-2xl"
                    style={{
                        border: "1px solid rgba(212,175,55,0.18)",
                        background: "linear-gradient(160deg, #0f0e17 0%, #1a1628 100%)",
                        padding: "56px 24px",
                        marginBottom: "48px",
                    }}
                >
                    <h3 style={{
                        fontFamily: "'Cinzel', serif", fontSize: "24px", marginBottom: "12px",
                    }}>
                        {t("landing.finalCtaTitle")}
                    </h3>
                    <p style={{ fontSize: "14px", color: "#9b8c6e", marginBottom: "24px" }}>
                        {t("landing.finalCtaSub")}
                    </p>
                    <Link
                        to="/register"
                        className="inline-block"
                        style={{
                            padding: "13px 26px", borderRadius: "12px",
                            fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em",
                            textTransform: "uppercase", fontFamily: "'Cinzel', serif",
                            background: "linear-gradient(135deg, #d4af37, #b8960c)",
                            color: "#080710", textDecoration: "none",
                            boxShadow: "0 0 20px rgba(212,175,55,0.25)",
                        }}
                    >
                        {t("landing.ctaPrimary")}
                    </Link>
                </section>
            </main>

            <footer style={{ borderTop: "1px solid rgba(212,175,55,0.1)", padding: "24px 0" }}>
                <p style={{ fontSize: "12px", color: "#52525b", textAlign: "center" }}>
                    {t("landing.footer")}
                </p>
            </footer>
        </div>
    );
}

export default Landing;
