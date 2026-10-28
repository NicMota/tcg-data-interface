import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCopy } from "../i18n/useCopy";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Icon } from "./Icon";

export function Brand() {
  return (
    <Link to="/" className="brand" aria-label="Magic TCG Tracker">
      <span className="brand-symbol">
        <i />
        <i />
        <i />
      </span>
      <span>
        arcana<span className="brand-dot">.</span>
        <small>TCG STORE INTELLIGENCE</small>
      </span>
    </Link>
  );
}
export function AppShell() {
  const { user, logout } = useAuth();
  const copy = useCopy(),
    { pathname } = useLocation();
  const links = [
    ["insights", copy("Overview", "Visão geral")],
    ["cards", copy("Card explorer", "Explorar cartas")],
    ["charts", copy("Market", "Mercado")],
    ["favorites", copy("Favorites", "Favoritos")],
    ...(user?.isAdmin ? [["inventory", copy("Inventory", "Estoque")]] : []),
  ];
  const title =
    links.find(([path]) => pathname.startsWith("/" + path))?.[1] ??
    (pathname === "/admin"
      ? copy("Administration", "Administração")
      : copy("Your workspace", "Seu espaço"));
  return (
    <div className="workspace">
      <aside className="sidebar">
        <Brand />
        <div className="store-switch">
          <span className="store-avatar">A</span>
          <div>
            <strong>{copy("Store workspace", "Espaço da loja")}</strong>
            <small>Magic: The Gathering</small>
          </div>
          <span className="tiny-dot" />
        </div>
        <div className="mobile-account">
          <Link
            className="icon-button"
            to="/profile"
            aria-label={copy("Profile", "Perfil")}
          >
            <Icon name="profile" size={18} />
          </Link>
          {user?.isAdmin && (
            <Link
              className="icon-button"
              to="/admin"
              aria-label={copy("Administration", "Administração")}
            >
              <Icon name="admin" size={18} />
            </Link>
          )}
          <button
            className="icon-button"
            onClick={logout}
            aria-label={copy("Sign out", "Sair")}
          >
            <Icon name="logout" size={18} />
          </button>
        </div>
        <p className="nav-label">{copy("WORKSPACE", "ESPAÇO DE TRABALHO")}</p>
        <nav aria-label={copy("Main navigation", "Navegação principal")}>
          {links.map(([path, label]) => (
            <NavLink key={path} to={"/" + path}>
              <Icon name={path} />
              {label}
              {path === "insights" && <span className="nav-new">BETA</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="tiny-dot" />
            <strong>
              {copy("A little more perspective.", "Uma nova perspectiva.")}
            </strong>
            <p>
              {copy(
                "Price history for better buying decisions.",
                "Histórico de preços para comprar melhor.",
              )}
            </p>
          </div>
          <nav>
            {user?.isAdmin && (
              <NavLink to="/admin">
                <Icon name="admin" />
                {copy("Administration", "Administração")}
              </NavLink>
            )}
            <NavLink to="/profile">
              <Icon name="profile" />
              {copy("Profile", "Perfil")}
            </NavLink>
          </nav>
          <div className="user-row">
            <span className="user-avatar">
              {user?.name?.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <strong>{user?.name}</strong>
              <small>
                {user?.isAdmin
                  ? copy("Store administrator", "Administrador da loja")
                  : copy("Member", "Membro")}
              </small>
            </div>
            <button
              className="icon-button"
              onClick={logout}
              aria-label={copy("Sign out", "Sair")}
            >
              <Icon name="logout" size={18} />
            </button>
          </div>
        </div>
      </aside>
      <div className="workspace-body">
        <header className="topbar">
          <span>
            <span className="muted">Workspace</span>
            <span className="breadcrumb-sep">/</span>
            {title}
          </span>
          <div className="topbar-tools">
            <span className="source-label">
              <span className="tiny-dot" />
              Scryfall · USD
            </span>
            <LanguageSwitcher />
          </div>
        </header>
        <Outlet />
        <footer className="workspace-footer">
          <span>ARCANA / TCG INTELLIGENCE</span>
          <span>
            {copy(
              "Market data: Scryfall. Store inventory: BRL.",
              "Mercado: Scryfall. Estoque da loja: BRL.",
            )}
          </span>
        </footer>
      </div>
    </div>
  );
}
