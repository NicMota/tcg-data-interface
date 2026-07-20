import axios from "axios";
import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { Link } from "react-router-dom";

export function Card({ c }) {

    const { t } = useLanguage();
    const [price, setPrice] = useState(0);
    const [diff, setDiff] = useState(0);

    useEffect(() => {

        async function fetchPrice() {

            try {

                const { data } = await axios.get(
                    `http://localhost:8000/price/${c.card_id}`
                );

                const today_price = data?.[0]?.price_usd ?? 0;
                const last_day_price = data?.[1]?.price_usd ?? 0;


                console.log(data);
                setPrice(Number(today_price));
                setDiff(Number(today_price - last_day_price));
                
            } catch (error) {

                console.log(error);
            }
        }

        fetchPrice();

    }, []);

    const isPositive = diff >= 0;

    return (    
        
        <div
            className="card-root group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer"
            style={{
                background: "linear-gradient(160deg, #0f0e17 0%, #1a1628 100%)",
                border: "1px solid rgba(212,175,55,0.18)",
                boxShadow: "0 4px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212,175,55,0.08)",
                transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s ease, border-color 0.35s ease",
                fontFamily: "'DM Sans', sans-serif",
            }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-6px) scale(1.02)";
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(212,175,55,0.55)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 20px 60px rgba(0,0,0,0.7), 0 0 30px rgba(212,175,55,0.08), inset 0 1px 0 rgba(212,175,55,0.15)";
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0) scale(1)";
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(212,175,55,0.18)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212,175,55,0.08)";
            }}
        >

            {/* Subtle corner rune ornaments */}
            <svg
                className="absolute top-0 left-0 pointer-events-none opacity-20"
                width="36" height="36" viewBox="0 0 36 36"
            >
                <path d="M2 18 L2 2 L18 2" stroke="#d4af37" strokeWidth="1" fill="none" />
            </svg>
            <svg
                className="absolute top-0 right-0 pointer-events-none opacity-20"
                width="36" height="36" viewBox="0 0 36 36"
            >
                <path d="M34 18 L34 2 L18 2" stroke="#d4af37" strokeWidth="1" fill="none" />
            </svg>

            {/* Image */}
            <div className="relative overflow-hidden" style={{ background: "#080710" }}>

                <img
                    src={c.image_uris?.normal}
                    alt={c.name}
                    className="w-full object-cover"
                    style={{ display: "block", transition: "transform 0.5s ease" }}
                    onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.04)")}
                    onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
                />

                {/* Foil shimmer badge */}
                {c.foil && (
                    <span
                        className="absolute top-3 right-3 text-xs font-semibold px-2 py-1 rounded-full"
                        style={{
                            background: "linear-gradient(135deg, #d4af37, #f0d060, #b8960c)",
                            color: "#1a1000",
                            letterSpacing: "0.08em",
                            fontSize: "10px",
                            boxShadow: "0 0 12px rgba(212,175,55,0.5)",
                        }}
                    >
                        {t("cardInfo.foil")}
                    </span>
                )}

                {/* Bottom fade */}
                <div
                    className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
                    style={{
                        background: "linear-gradient(to top, #0f0e17, transparent)",
                    }}
                />

            </div>

            {/* Body */}
            <div className="flex flex-col gap-2 p-4 flex-1">

                <div>
                    <h2
                        className="font-bold leading-tight"
                        style={{
                            fontSize: "15px",
                            color: "#ede8d8",
                            fontFamily: "'Cinzel', serif",
                            letterSpacing: "0.02em",
                        }}
                    >
                        {c.name}
                    </h2>
                    <p style={{ fontSize: "12px", color: "#6b6578", marginTop: "2px" }}>
                        {c.type_line}
                    </p>
                </div>

                <span
                    style={{
                        fontSize: "10px",
                        letterSpacing: "0.1em",
                        color: "#9b8c6e",
                        background: "rgba(212,175,55,0.07)",
                        border: "1px solid rgba(212,175,55,0.15)",
                        borderRadius: "6px",
                        padding: "3px 8px",
                        width: "fit-content",
                        textTransform: "uppercase",
                    }}
                >
                    {c.set_name}
                </span>

                {/* Divider */}
                <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.2), transparent)", margin: "4px 0" }} />

                {/* Price row */}
                <div className="flex items-center justify-between">
                    <span
                        style={{
                            fontFamily: "'Cinzel', serif",
                            fontSize: "20px",
                            fontWeight: "700",
                            color: "#d4af37",
                            letterSpacing: "0.03em",
                        }}
                    >
                        ${price.toFixed(2)}
                    </span>

                    <span
                        style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            padding: "3px 9px",
                            borderRadius: "6px",
                            color: isPositive ? "#6ee7b7" : "#fca5a5",
                            background: isPositive ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)",
                            border: `1px solid ${isPositive ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}`,
                        }}
                    >
                        {isPositive ? "▲" : "▼"} {Math.abs(diff).toFixed(2)}
                    </span>
                </div>

                {/* View button */}
                <Link
                    to={`/card/${c.card_id}`}
                    className="mt-2 block text-center rounded-xl py-2 text-sm font-semibold"
                    style={{
                        background: "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.06))",
                        border: "1px solid rgba(212,175,55,0.3)",
                        color: "#d4af37",
                        letterSpacing: "0.08em",
                        fontSize: "12px",
                        textTransform: "uppercase",
                        fontFamily: "'DM Sans', sans-serif",
                        transition: "background 0.2s, border-color 0.2s",
                        textDecoration: "none",
                    }}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLAnchorElement).style.background = "linear-gradient(135deg, rgba(212,175,55,0.28), rgba(212,175,55,0.12))";
                        (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(212,175,55,0.6)";
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLAnchorElement).style.background = "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.06))";
                        (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(212,175,55,0.3)";
                    }}
                >
                    {t("home.viewCard")}
                </Link>

            </div>

        </div>
    );
}