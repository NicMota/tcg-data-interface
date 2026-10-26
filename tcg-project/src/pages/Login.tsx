import { isAxiosError } from 'axios';
import { useState, type FormEvent } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const { t } = useLanguage();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError(t("login.errorEmpty"));
            return;
        }

        setIsSubmitting(true);
        try {
            await login(email, password, remember);

            const redirectTo = (location.state as { from?: Location })?.from?.pathname ?? "/cards";
            navigate(redirectTo, { replace: true });
        } catch (err) {
            console.log(err);
            setError((isAxiosError(err) ? err.response?.data?.message : undefined) ?? t("login.errorGeneric"));
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center px-6"
            style={{
                background: "#080710",
                color: "#ede8d8",
                fontFamily: "'DM Sans', sans-serif",
            }}
        >
            {/* Ambient glow blobs, same as Home */}
            <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
                <div style={{
                    position: "absolute",
                    top: "-15%",
                    right: "10%",
                    width: "600px",
                    height: "600px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(212,175,55,0.035) 0%, transparent 65%)",
                }} />
                <div style={{
                    position: "absolute",
                    bottom: "10%",
                    left: "-5%",
                    width: "450px",
                    height: "450px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(100,60,180,0.04) 0%, transparent 70%)",
                }} />
            </div>

            <div className="fixed top-6 right-6" style={{ zIndex: 2 }}>
                <LanguageSwitcher />
            </div>

            <div className="relative w-full max-w-sm" style={{ zIndex: 1 }}>

                {/* Logo, same mark used in the Home header */}
                <div className="flex flex-col items-center gap-3 mb-8">
                    <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
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
                        MAGIC TCG TRACKER
                    </h1>
                </div>

                {/* Card panel, same recipe as the card grid + search bar containers */}
                <div
                    className="relative rounded-2xl p-7"
                    style={{
                        background: "linear-gradient(160deg, #0f0e17 0%, #1a1628 100%)",
                        border: "1px solid rgba(212,175,55,0.18)",
                        boxShadow: "0 4px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212,175,55,0.08)",
                    }}
                >
                    {/* Corner rune ornaments, same as Card.tsx */}
                    <svg className="absolute top-0 left-0 pointer-events-none opacity-20" width="36" height="36" viewBox="0 0 36 36">
                        <path d="M2 18 L2 2 L18 2" stroke="#d4af37" strokeWidth="1" fill="none" />
                    </svg>
                    <svg className="absolute top-0 right-0 pointer-events-none opacity-20" width="36" height="36" viewBox="0 0 36 36">
                        <path d="M34 18 L34 2 L18 2" stroke="#d4af37" strokeWidth="1" fill="none" />
                    </svg>

                    <p style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: "13px",
                        letterSpacing: "0.15em",
                        color: "#9b8c6e",
                        textTransform: "uppercase",
                        textAlign: "center",
                        marginBottom: "22px",
                    }}>
                        {t("login.title")}
                    </p>

                    <form onSubmit={handleSubmit} noValidate>

                        <label style={{ fontSize: "11px", letterSpacing: "0.08em", color: "#9b8c6e", textTransform: "uppercase" }}>
                            {t("login.emailLabel")}
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder={t("login.emailPlaceholder")}
                            autoComplete="email"
                            style={{
                                width: "100%",
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(212,175,55,0.15)",
                                borderRadius: "12px",
                                padding: "11px 14px",
                                color: "#ede8d8",
                                fontSize: "14px",
                                outline: "none",
                                marginTop: "6px",
                                marginBottom: "16px",
                                fontFamily: "'DM Sans', sans-serif",
                                transition: "border-color 0.2s",
                            }}
                            onFocus={e => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.55)")}
                            onBlur={e => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.15)")}
                        />

                        <div className="flex items-center justify-between">
                            <label style={{ fontSize: "11px", letterSpacing: "0.08em", color: "#9b8c6e", textTransform: "uppercase" }}>
                                {t("login.passwordLabel")}
                            </label>
                            <Link
                                to="/forgot-password"
                                style={{ fontSize: "11px", color: "#9b8c6e", textDecoration: "none" }}
                                onMouseEnter={e => (e.currentTarget.style.color = "#d4af37")}
                                onMouseLeave={e => (e.currentTarget.style.color = "#9b8c6e")}
                            >
                                {t("login.forgot")}
                            </Link>
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            style={{
                                width: "100%",
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(212,175,55,0.15)",
                                borderRadius: "12px",
                                padding: "11px 14px",
                                color: "#ede8d8",
                                fontSize: "14px",
                                outline: "none",
                                marginTop: "6px",
                                marginBottom: "18px",
                                fontFamily: "'DM Sans', sans-serif",
                                transition: "border-color 0.2s",
                            }}
                            onFocus={e => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.55)")}
                            onBlur={e => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.15)")}
                        />

                        <label className="flex items-center gap-2" style={{ fontSize: "12px", color: "#9b8c6e", marginBottom: "18px", cursor: "pointer" }}>
                            <input
                                type="checkbox"
                                checked={remember}
                                onChange={e => setRemember(e.target.checked)}
                                style={{ accentColor: "#d4af37" }}
                            />
                            {t("login.remember")}
                        </label>

                        {error && (
                            <p style={{
                                fontSize: "12px",
                                color: "#fca5a5",
                                background: "rgba(248,113,113,0.1)",
                                border: "1px solid rgba(248,113,113,0.2)",
                                borderRadius: "8px",
                                padding: "8px 12px",
                                marginBottom: "16px",
                            }}>
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full"
                            style={{
                                padding: "11px 18px",
                                borderRadius: "12px",
                                fontSize: "12px",
                                fontWeight: "700",
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                fontFamily: "'Cinzel', serif",
                                cursor: isSubmitting ? "not-allowed" : "pointer",
                                background: isSubmitting
                                    ? "rgba(212,175,55,0.3)"
                                    : "linear-gradient(135deg, #d4af37, #b8960c)",
                                border: "1px solid #d4af37",
                                color: "#080710",
                                boxShadow: isSubmitting ? "none" : "0 0 16px rgba(212,175,55,0.25)",
                                transition: "all 0.2s",
                            }}
                        >
                            {isSubmitting ? t("login.submitting") : t("login.submit")}
                        </button>
                    </form>

                    <div style={{
                        height: "1px",
                        background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.2), transparent)",
                        margin: "22px 0",
                    }} />

                    <p style={{ fontSize: "12px", color: "#6b6578", textAlign: "center" }}>
                        {t("login.signUpPrompt")}{" "}
                        <Link
                            to="/register"
                            style={{ color: "#d4af37", fontWeight: 600, textDecoration: "none" }}
                        >
                            {t("login.signUpLink")}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;
