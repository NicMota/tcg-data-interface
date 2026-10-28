import { Link, Navigate } from "react-router-dom";
import { useCopy } from "../i18n/useCopy";
import { useAuth } from "../context/AuthContext";
import { Brand } from "../components/AppShell";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { Icon } from "../components/Icon";
export default function Landing() {
  const copy = useCopy(),
    { isAuthenticated, isLoading } = useAuth();
  if (!isLoading && isAuthenticated) return <Navigate to="/insights" replace />;
  return (
    <div className="landing-page">
      <header className="landing-header">
        <Brand />
        <nav>
          <a href="#perspective">{copy("The perspective", "A perspectiva")}</a>
          <LanguageSwitcher />
          <Link to="/login">{copy("Sign in", "Entrar")}</Link>
          <Link className="action primary" to="/register">
            {copy("Get started", "Começar")}
            <Icon name="arrow" size={16} />
          </Link>
        </nav>
      </header>
      <main>
        <section className="landing-hero">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="tiny-dot" />
              {copy(
                "BUILT FOR THE OTHER SIDE OF THE COUNTER",
                "PARA QUEM ESTÁ DO OUTRO LADO DO BALCÃO",
              )}
            </p>
            <h1>
              {copy("Good cards.", "Boas cartas.")}
              <br />
              <em>{copy("Better decisions.", "Melhores decisões.")}</em>
            </h1>
            <p>
              {copy(
                "Turn price history into perspective. Discover the moves that matter and give every card in your store a place.",
                "Transforme histórico de preços em perspectiva. Descubra os movimentos que importam e encontre um lugar para cada carta da sua loja.",
              )}
            </p>
            <div className="button-row">
              <Link className="action primary large" to="/register">
                {copy("Find your next move", "Encontre sua próxima jogada")}
                <Icon name="arrow" size={19} />
              </Link>
              <Link className="text-button" to="/login">
                {copy("Open your workspace", "Abrir seu espaço")} ↗
              </Link>
            </div>
            <div className="hero-proof">
              <span>
                01 / {copy("Price intelligence", "Inteligência de preços")}
              </span>
              <span>02 / {copy("Store inventory", "Estoque da loja")}</span>
            </div>
          </div>
          <div
            className="landing-visual"
            aria-label={copy(
              "Price intelligence and organized stock",
              "Inteligência de preços e estoque organizado",
            )}
          >
            <span className="visual-top">THE ART OF A BETTER MOVE.</span>
            <div className="visual-circles" />
            <div className="editorial-card card-one">
              <span>01 / OBSERVE</span>
              <Icon name="charts" size={76} />
              <strong>{copy("See the pattern.", "Veja o padrão.")}</strong>
              <small>
                {copy(
                  "A price is a moment. History is context.",
                  "Preço é um momento. Histórico é contexto.",
                )}
              </small>
            </div>
            <div className="editorial-card card-two">
              <span>02 / ORGANIZE</span>
              <Icon name="inventory" size={60} />
              <strong>{copy("Every card counts.", "Cada carta conta.")}</strong>
              <small>CONDITION / LANGUAGE / FINISH</small>
            </div>
            <span className="visual-bottom">
              MAGIC: THE GATHERING <span>↗</span>
            </span>
          </div>
        </section>
        <section className="landing-features" id="perspective">
          {[
            [
              "insights",
              copy("Look beyond today’s price.", "Olhe além do preço de hoje."),
              copy(
                "Find prices near observed lows and explore a buying shortlist with clear, transparent criteria.",
                "Encontre preços perto da mínima e explore uma lista de compras com critérios transparentes.",
              ),
            ],
            [
              "charts",
              copy(
                "Catch the meaningful moves.",
                "Acompanhe os movimentos relevantes.",
              ),
              copy(
                "Spot sudden daily spikes and drops. Open the recorded history to understand what changed.",
                "Identifique altas e quedas repentinas. Abra o histórico para entender o que mudou.",
              ),
            ],
            [
              "inventory",
              copy("Keep the counter moving.", "Mantenha a loja em movimento."),
              copy(
                "Track stock, reserve units and import CSV snapshots with a preview and an audit trail.",
                "Controle estoque, reserve unidades e importe saldos CSV com prévia e histórico de movimentos.",
              ),
            ],
          ].map(([icon, title, body], i) => (
            <article key={icon}>
              <div>
                <Icon name={icon} size={24} />
                <span>0{i + 1}</span>
              </div>
              <h2>{title}</h2>
              <p>{body}</p>
            </article>
          ))}
        </section>
      </main>
      <footer className="landing-footer">
        <Brand />
        <p>
          {copy(
            "Market data by Scryfall · Independent store tooling.",
            "Dados de mercado por Scryfall · Ferramentas independentes para lojas.",
          )}
        </p>
      </footer>
    </div>
  );
}
