import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { useAuth } from "../context/AuthContext";
import { useCopy } from "../i18n/useCopy";
import { Brand } from "./AppShell";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Icon } from "./Icon";
export function AuthPage({ registering = false }: { registering?: boolean }) {
  const copy = useCopy(),
    { login, register } = useAuth(),
    navigate = useNavigate(),
    location = useLocation();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError("");
    if (registering && form.get("password") !== form.get("confirm")) {
      setError(copy("Passwords must match.", "As senhas devem ser iguais."));
      return;
    }
    setBusy(true);
    try {
      if (registering)
        await register(
          String(form.get("name")),
          String(form.get("email")),
          String(form.get("password")),
          form.get("remember") === "on",
        );
      else
        await login(
          String(form.get("email")),
          String(form.get("password")),
          form.get("remember") === "on",
        );
      const from = (location.state as { from?: { pathname?: string } })?.from
        ?.pathname;
      navigate(
        from?.startsWith("/") && !from.startsWith("//") ? from : "/insights",
        { replace: true },
      );
    } catch (err) {
      setError(
        isAxiosError(err)
          ? (err.response?.data?.message ??
              copy(
                "Unable to sign in. Try again.",
                "Não foi possível entrar. Tente novamente.",
              ))
          : copy("Something went wrong.", "Ocorreu um erro."),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <div className="auth-top">
        <Brand />
        <LanguageSwitcher />
      </div>
      <div className="auth-layout">
        <div className="auth-editorial">
          <p className="eyebrow">
            {copy(
              "A NEW PERSPECTIVE ON YOUR CARDS",
              "UMA NOVA PERSPECTIVA SOBRE SUAS CARTAS",
            )}
          </p>
          <h1>
            {copy(
              "Know the market.\nMake your move.",
              "Conheça o mercado.\nFaça sua jogada.",
            )}
          </h1>
          <p>
            {copy(
              "A considered approach to buying cards and running your store.",
              "Mais contexto para comprar cartas e cuidar da sua loja.",
            )}
          </p>
          <div className="auth-symbol" aria-hidden="true">
            <Icon name="cards" size={130} />
          </div>
          <small>HISTORY. CONTEXT. OPPORTUNITY.</small>
        </div>
        <section className="auth-form-panel">
          <span className="eyebrow">
            {registering
              ? copy("START YOUR WORKSPACE", "CRIE SEU ESPAÇO")
              : copy("WELCOME BACK", "BOM TER VOCÊ DE VOLTA")}
          </span>
          <h2>
            {registering
              ? copy("A clearer view awaits.", "Um novo olhar espera por você.")
              : copy(
                  "Back to your next move.",
                  "De volta à sua próxima jogada.",
                )}
          </h2>
          <p>
            {registering
              ? copy(
                  "Create an account to explore the market.",
                  "Crie uma conta para explorar o mercado.",
                )
              : copy(
                  "Sign in to your store workspace.",
                  "Entre no espaço da sua loja.",
                )}
          </p>
          <form onSubmit={submit}>
            <fieldset disabled={busy} className="form-stack">
              {registering && (
                <label>
                  {copy("Name", "Nome")}
                  <input
                    name="name"
                    autoComplete="name"
                    required
                    maxLength={100}
                  />
                </label>
              )}
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                />
              </label>
              <label>
                {copy("Password", "Senha")}
                <input
                  name="password"
                  type="password"
                  autoComplete={
                    registering ? "new-password" : "current-password"
                  }
                  required
                  minLength={registering ? 8 : 1}
                  maxLength={72}
                />
              </label>
              {registering && (
                <label>
                  {copy("Confirm password", "Confirmar senha")}
                  <input
                    name="confirm"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    maxLength={72}
                  />
                </label>
              )}
              <label className="checkbox-label">
                <input name="remember" type="checkbox" />
                {copy(
                  "Remember me on this device",
                  "Lembrar neste dispositivo",
                )}
              </label>
            </fieldset>
            {error && (
              <p className="notice error" role="alert">
                {error}
              </p>
            )}
            <button className="action primary auth-submit" disabled={busy}>
              {busy
                ? copy("Please wait…", "Aguarde…")
                : registering
                  ? copy("Create account", "Criar conta")
                  : copy("Sign in", "Entrar")}
              <Icon name="arrow" size={17} />
            </button>
          </form>
          <p className="auth-alternate">
            {registering
              ? copy("Already have an account?", "Já tem uma conta?")
              : copy("New here?", "Primeira vez aqui?")}{" "}
            <Link to={registering ? "/login" : "/register"}>
              {registering
                ? copy("Sign in", "Entrar")
                : copy("Create an account", "Criar conta")}
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
