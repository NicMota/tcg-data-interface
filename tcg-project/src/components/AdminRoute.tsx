import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export function AdminRoute({ children }: { children: ReactNode }) {
    const { isAuthenticated, isLoading, user } = useAuth();
    const { t } = useLanguage();
    const location = useLocation();

    if (isLoading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ background: "#080710" }}
            >
                <p
                    style={{
                        color: "#6b6578",
                        fontFamily: "'Cinzel', serif",
                        letterSpacing: "0.2em",
                        fontSize: "13px",
                    }}
                >
                    {t("common.loading")}
                </p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!user?.isAdmin) {
        return <Navigate to="/cards" replace />;
    }

    return <>{children}</>;
}
