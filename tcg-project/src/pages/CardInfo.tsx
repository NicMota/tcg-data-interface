import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CardChart } from "../components/CardChart";
import axs from "../axios";
import { useLanguage } from "../context/LanguageContext";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

export function CardInfo() {

    const { card_id } = useParams();
    const { t } = useLanguage();

    const [card, setCard] = useState<any>({});
    const [priceData, setPriceData] = useState({ prices: [], dates: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        async function fetchData() {

            try {

                const { data } = await axs.get(`/cards/${card_id}`);

                setCard(data.card_info);

                const formatted = { prices: [], dates: [] };

                data.prices?.forEach((e: any) => {
                    formatted.prices.push(e.price_usd);
                    formatted.dates.push(new Date(e.date).toLocaleDateString());
                });

                setPriceData(formatted);

            } catch (err) {
                console.log(err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();

    }, []);

    const currentPrice = priceData.prices.at(-1) ?? 0;
    const prevPrice = priceData.prices.at(-2) ?? 0;
    const priceDiff = Number(currentPrice) - Number(prevPrice);
    const isPositive = priceDiff >= 0;

    return (
        <div
            className="min-h-screen"
            style={{
                background: "#080710",
                color: "#ede8d8",
                fontFamily: "'DM Sans', sans-serif",
            }}
        >
            {/* Ambient background blobs */}
            <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
                <div style={{
                    position: "absolute",
                    top: "-20%",
                    left: "-10%",
                    width: "500px",
                    height: "500px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 70%)",
                }} />
                <div style={{
                    position: "absolute",
                    bottom: "0",
                    right: "-10%",
                    width: "400px",
                    height: "400px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(120,80,200,0.05) 0%, transparent 70%)",
                }} />
            </div>

            {/* Header */}
            <header
                className="relative"
                style={{
                    zIndex: 10,
                    borderBottom: "1px solid rgba(212,175,55,0.12)",
                    background: "rgba(8,7,16,0.85)",
                    backdropFilter: "blur(16px)",
                }}
            >
                <div
                    className="max-w-7xl mx-auto px-8 flex items-center justify-between"
                    style={{ height: "72px" }}
                >
                    <Link to={'/'}>
                        
                        <h1
                            style={{
                                fontFamily: "'Cinzel', serif",
                                fontSize: "20px",
                                fontWeight: "700",
                                letterSpacing: "0.25em",
                                background: "linear-gradient(135deg, #d4af37, #f0d060, #9b7e2c)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                            }}
                        >
                            MAGIC TCG TRACKER
                        </h1>
                    </Link>

                    {/* Decorative line */}
                    <div style={{
                        height: "1px",
                        flex: 1,
                        margin: "0 32px",
                        background: "linear-gradient(90deg, rgba(212,175,55,0.3), transparent)",
                    }} />

                    <div className="flex items-center gap-3 flex-shrink-0">
                        <LanguageSwitcher />

                        <Link
                            to="/cards"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                color: "#9b8c6e",
                                fontSize: "13px",
                                letterSpacing: "0.08em",
                                textDecoration: "none",
                                border: "1px solid rgba(212,175,55,0.18)",
                                borderRadius: "10px",
                                padding: "7px 16px",
                                transition: "color 0.2s, border-color 0.2s",
                                whiteSpace: "nowrap",
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLAnchorElement).style.color = "#d4af37";
                                (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(212,175,55,0.45)";
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLAnchorElement).style.color = "#9b8c6e";
                                (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(212,175,55,0.18)";
                            }}
                        >
                            {t("cardInfo.back")}
                        </Link>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="relative max-w-7xl mx-auto px-6 py-12" style={{ zIndex: 1 }}>

                {loading ? (
                    <div className="flex items-center justify-center" style={{ height: "60vh" }}>
                        <p style={{ color: "#6b6578", fontFamily: "'Cinzel', serif", letterSpacing: "0.2em" }}>
                            {t("cardInfo.consulting")}
                        </p>
                    </div>
                ) : (

                    <div
                        className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start"
                    >

                        {/* Left — Card display */}
                        <div
                            className="rounded-2xl overflow-hidden relative"
                            style={{
                                background: "linear-gradient(160deg, #0f0e17 0%, #1a1628 100%)",
                                border: "1px solid rgba(212,175,55,0.18)",
                                boxShadow: "0 8px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(212,175,55,0.08)",
                                padding: "28px",
                            }}
                        >
                            {/* Corner ornaments */}
                            {[["top-0 left-0", "M2 18 L2 2 L18 2"], ["top-0 right-0", "M34 18 L34 2 L18 2"], ["bottom-0 left-0", "M2 18 L2 34 L18 34"], ["bottom-0 right-0", "M34 18 L34 34 L18 34"]].map(([pos, d], i) => (
                                <svg key={i} className={`absolute ${pos} pointer-events-none`} width="36" height="36" viewBox="0 0 36 36" style={{ opacity: 0.3 }}>
                                    <path d={d as string} stroke="#d4af37" strokeWidth="1.5" fill="none" />
                                </svg>
                            ))}

                            <img
                                src={card.image_uris?.normal}
                                alt={card.name}
                                className="w-full rounded-xl mx-auto"
                                style={{
                                    maxWidth: "380px",
                                    display: "block",
                                    boxShadow: "0 12px 48px rgba(0,0,0,0.8), 0 0 40px rgba(212,175,55,0.06)",
                                }}
                                onError={e => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
                            />

                            <div className="mt-7">

                                <h2
                                    style={{
                                        fontFamily: "'Cinzel', serif",
                                        fontSize: "30px",
                                        fontWeight: "700",
                                        color: "#ede8d8",
                                        letterSpacing: "0.04em",
                                        lineHeight: 1.2,
                                    }}
                                >
                                    {card.name}
                                </h2>

                                <p style={{ color: "#6b6578", marginTop: "6px", fontSize: "14px" }}>
                                    {card.type_line}
                                </p>

                                {/* Separator */}
                                <div style={{
                                    height: "1px",
                                    background: "linear-gradient(90deg, rgba(212,175,55,0.25), transparent)",
                                    margin: "20px 0",
                                }} />

                                <div className="flex flex-wrap gap-3">
                                    <span style={{
                                        fontSize: "11px",
                                        letterSpacing: "0.1em",
                                        textTransform: "uppercase",
                                        color: "#9b8c6e",
                                        background: "rgba(212,175,55,0.07)",
                                        border: "1px solid rgba(212,175,55,0.18)",
                                        borderRadius: "8px",
                                        padding: "5px 12px",
                                    }}>
                                        {card.set_name}
                                    </span>

                                    <span style={{
                                        fontSize: "11px",
                                        letterSpacing: "0.1em",
                                        textTransform: "uppercase",
                                        color: card.foil ? "#d4af37" : "#6b6578",
                                        background: card.foil ? "rgba(212,175,55,0.1)" : "rgba(107,101,120,0.1)",
                                        border: `1px solid ${card.foil ? "rgba(212,175,55,0.35)" : "rgba(107,101,120,0.2)"}`,
                                        borderRadius: "8px",
                                        padding: "5px 12px",
                                    }}>
                                        {card.foil ? t("cardInfo.foil") : t("cardInfo.nonFoil")}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right — Price history */}
                        <div
                            className="rounded-2xl relative"
                            style={{
                                background: "linear-gradient(160deg, #0f0e17 0%, #1a1628 100%)",
                                border: "1px solid rgba(212,175,55,0.18)",
                                boxShadow: "0 8px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(212,175,55,0.08)",
                                padding: "28px",
                            }}
                        >
                            <div className="flex items-start justify-between mb-6">

                                <h3
                                    style={{
                                        fontFamily: "'Cinzel', serif",
                                        fontSize: "18px",
                                        fontWeight: "600",
                                        color: "#ede8d8",
                                        letterSpacing: "0.08em",
                                    }}
                                >
                                    {t("cardInfo.priceHistory")}
                                </h3>

                                {/* Live price summary */}
                                {priceData.prices.length > 0 && (
                                    <div className="text-right">
                                        <p
                                            style={{
                                                fontFamily: "'Cinzel', serif",
                                                fontSize: "28px",
                                                fontWeight: "700",
                                                color: "#d4af37",
                                                lineHeight: 1,
                                            }}
                                        >
                                            ${Number(currentPrice).toFixed(2)}
                                        </p>
                                        <p
                                            style={{
                                                fontSize: "12px",
                                                marginTop: "4px",
                                                fontWeight: "600",
                                                color: isPositive ? "#6ee7b7" : "#fca5a5",
                                            }}
                                        >
                                            {isPositive ? "▲" : "▼"} ${Math.abs(priceDiff).toFixed(2)} {t("cardInfo.today")}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Divider */}
                            <div style={{
                                height: "1px",
                                background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.15), transparent)",
                                marginBottom: "20px",
                            }} />

                            <CardChart price_info={priceData} />

                        </div>

                    </div>
                )}

            </div>
        </div>
    );
}