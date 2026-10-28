import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { isAxiosError } from "axios";
import axs from "../../axios";
import { useCopy } from "../../i18n/useCopy";
import { Icon } from "../../components/Icon";
import { Modal } from "../../components/Modal";

interface StockItem {
  id: string;
  sku: string;
  name: string;
  cardId: string | null;
  setCode: string;
  condition: string;
  language: string;
  finish: string;
  quantity: number;
  reserved: number;
  costBrl: string;
  priceBrl: string;
  reorderPoint: number;
  location: string;
  version: number;
}
interface Movement {
  id: string;
  type: string;
  quantityDelta: number;
  reservedDelta: number;
  quantityAfter: number;
  reservedAfter: number;
  reason: string;
  createdAt: string;
  item: { sku: string; name: string };
  actor: { name: string };
}
interface StockData {
  data: StockItem[];
  totalPages: number;
  total: number;
  summary: {
    skus: number;
    units: number;
    reserved: number;
    cost: number;
    retail: number;
    lowStock: number;
  };
}
const brl = (n: string | number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(n),
  );
const errorText = (err: unknown) =>
  isAxiosError(err)
    ? (err.response?.data?.message ?? "Falha na conexão. Tente novamente.")
    : "Não foi possível concluir a operação.";
function download(data: Blob, filename: string) {
  const url = URL.createObjectURL(data),
    a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Inventory() {
  const copy = useCopy(),
    [params, setParams] = useSearchParams();
  const [result, setResult] = useState<StockData | null>(null),
    [movements, setMovements] = useState<Movement[]>([]);
  const [search, setSearch] = useState(""),
    [low, setLow] = useState(false),
    [view, setView] = useState("stock"),
    [page, setPage] = useState(1),
    [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0),
    [message, setMessage] = useState("");
  const [editor, setEditor] = useState<StockItem | "new" | null>(
      params.get("cardId") ? "new" : null,
    ),
    [move, setMove] = useState<StockItem | null>(null),
    [importing, setImporting] = useState(false),
    [exporting, setExporting] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const timer = setTimeout(() => {
      const request =
        view === "stock"
          ? axs
              .get<StockData>("/inventory", {
                params: { search, low, page, limit: 20 },
                signal: controller.signal,
              })
              .then(({ data }) => {
                setResult(data);
                setPages(data.totalPages);
                if (page > Math.max(1, data.totalPages))
                  setPage(Math.max(1, data.totalPages));
              })
          : axs
              .get("/inventory/movements", {
                params: { page, limit: 20 },
                signal: controller.signal,
              })
              .then(({ data }) => {
                setMovements(data.data);
                setPages(data.totalPages);
              });
      request
        .catch((err) => {
          if (!controller.signal.aborted) setError(errorText(err));
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, low, view, page, revision]);
  function saved(text: string) {
    setEditor(null);
    setMove(null);
    setImporting(false);
    setParams({});
    setMessage(text);
    setRevision((v) => v + 1);
  }
  async function exportStock() {
    setExporting(true);
    setError("");
    try {
      const { data } = await axs.get("/inventory/export", {
        responseType: "blob",
      });
      download(data, "arcana-estoque.csv");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setExporting(false);
    }
  }
  return (
    <main className="app-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            {copy("YOUR STORE, IN SYNC", "SUA LOJA EM DIA")}
          </p>
          <h1>{copy("A place for every card.", "Cada carta no seu lugar.")}</h1>
          <p>
            {copy(
              "Stock, reservations and a clear record of every movement.",
              "Estoque, reservas e um registro claro de cada movimento.",
            )}
          </p>
        </div>
        <div className="button-row">
          <button className="action" onClick={exportStock} disabled={exporting}>
            {copy("Export CSV", "Exportar CSV")}
          </button>
          <button className="action" onClick={() => setImporting(true)}>
            {copy("Import CSV", "Importar CSV")}
          </button>
          <button className="action primary" onClick={() => setEditor("new")}>
            <Icon name="plus" size={16} />
            {copy("Add stock", "Cadastrar estoque")}
          </button>
        </div>
      </div>
      {message && (
        <p className="notice success" role="status">
          {message}
        </p>
      )}
      <section className="metric-grid">
        <div className="metric">
          <span className="metric-label">
            {copy("Physical units", "Unidades físicas")}
            <Icon name="inventory" size={18} />
          </span>
          <strong>{result?.summary.units ?? "—"}</strong>
          <small>
            {result?.summary.reserved ?? 0} {copy("reserved", "reservadas")} ·{" "}
            {result?.summary.skus ?? 0} SKUs
          </small>
        </div>
        <div className="metric">
          <span className="metric-label">
            {copy("Stock at cost", "Estoque a custo")}
          </span>
          <strong className="money-metric">
            {result ? brl(result.summary.cost) : "—"}
          </strong>
          <small>
            {copy(
              "Current unit cost × physical units",
              "Custo unitário atual × unidades físicas",
            )}
          </small>
        </div>
        <div className="metric">
          <span className="metric-label">
            {copy("Retail value", "Valor de venda")}
          </span>
          <strong className="money-metric">
            {result ? brl(result.summary.retail) : "—"}
          </strong>
          <small>
            {copy(
              "Listed price × physical units",
              "Preço cadastrado × unidades físicas",
            )}
          </small>
        </div>
        <div className="metric">
          <span className="metric-label">
            {copy("Needs a restock", "Precisam de reposição")}
          </span>
          <strong>{result?.summary.lowStock ?? "—"}</strong>
          <small>
            {copy(
              "Available stock at or below minimum",
              "Disponível igual ou abaixo do mínimo",
            )}
          </small>
        </div>
      </section>
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>{copy("Store inventory", "Estoque da loja")}</h2>
            <p>
              {copy(
                "One shared store inventory. All values in BRL.",
                "Estoque compartilhado da loja. Todos os valores em BRL.",
              )}
            </p>
          </div>
          <span className="neutral-tag">
            {copy("Admin access", "Acesso administrativo")}
          </span>
        </div>
        <div className="tabs">
          {[
            ["stock", copy("Stock list", "Lista de estoque")],
            ["history", copy("Movement history", "Histórico de movimentos")],
          ].map(([key, label]) => (
            <button
              key={key}
              aria-pressed={view === key}
              onClick={() => {
                setView(key);
                setPage(1);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        {view === "stock" && (
          <div className="table-toolbar">
            <label className="search-field">
              <Icon name="search" size={18} />
              <input
                aria-label={copy("Search stock", "Buscar estoque")}
                placeholder={copy(
                  "Search by card or SKU…",
                  "Buscar carta ou SKU…",
                )}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={low}
                onChange={(e) => {
                  setLow(e.target.checked);
                  setPage(1);
                }}
              />
              {copy("Low stock only", "Somente estoque baixo")}
            </label>
          </div>
        )}
        {error && (
          <div className="notice error" role="alert">
            {error}
            <button
              className="action"
              onClick={() => setRevision((v) => v + 1)}
            >
              {copy("Try again", "Tentar novamente")}
            </button>
          </div>
        )}
        {loading ? (
          <div role="status" className="empty-state">
            {copy("Loading stock…", "Carregando estoque…")}
          </div>
        ) : view === "stock" ? (
          result?.data.length ? (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{copy("CARD / SKU", "CARTA / SKU")}</th>
                    <th>{copy("VARIANT", "VARIANTE")}</th>
                    <th>{copy("AVAILABLE", "DISPONÍVEL")}</th>
                    <th>{copy("COST / PRICE", "CUSTO / PREÇO")}</th>
                    <th>{copy("LOCATION", "LOCAL")}</th>
                    <th>{copy("ACTIONS", "AÇÕES")}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.name}</strong>
                        <small>
                          {item.sku} · {item.setCode || "—"}
                        </small>
                      </td>
                      <td>
                        <span className="neutral-tag">
                          {item.condition} · {item.language} · {item.finish}
                        </span>
                        <small>
                          {item.cardId
                            ? copy("Linked to catalog", "Vinculada ao catálogo")
                            : copy(
                                "No catalog link",
                                "Sem vínculo ao catálogo",
                              )}
                        </small>
                      </td>
                      <td>
                        <strong
                          className={
                            item.quantity - item.reserved <= item.reorderPoint
                              ? "negative"
                              : "number"
                          }
                        >
                          {item.quantity - item.reserved}
                        </strong>
                        <small>
                          {item.quantity} {copy("physical", "físicas")} ·{" "}
                          {item.reserved} {copy("reserved", "reservadas")}
                        </small>
                        <small>
                          {copy("Min.", "Mín.")} {item.reorderPoint}
                        </small>
                      </td>
                      <td>
                        <strong className="number">{brl(item.priceBrl)}</strong>
                        <small>
                          {copy("Cost", "Custo")} {brl(item.costBrl)}
                        </small>
                      </td>
                      <td>{item.location || "—"}</td>
                      <td>
                        <div className="button-row">
                          <button
                            className="action compact"
                            onClick={() => setMove(item)}
                          >
                            {copy("Move stock", "Movimentar")}
                          </button>
                          <button
                            className="text-button"
                            onClick={() => setEditor(item)}
                          >
                            {copy("Edit", "Editar")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            !error && (
              <div className="empty-state">
                <Icon name="inventory" size={32} />
                <h3>
                  {copy(
                    "Room for your collection.",
                    "Espaço para suas cartas.",
                  )}
                </h3>
                <p>
                  {copy(
                    "Add your first SKU or import a stock file. Each variant gets its own SKU.",
                    "Cadastre o primeiro SKU ou importe um arquivo. Cada variante tem seu próprio SKU.",
                  )}
                </p>
                <button className="action" onClick={() => setEditor("new")}>
                  {copy("Add stock", "Cadastrar estoque")}
                </button>
              </div>
            )
          )
        ) : movements.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{copy("WHEN / WHO", "QUANDO / QUEM")}</th>
                  <th>{copy("ITEM", "ITEM")}</th>
                  <th>{copy("MOVEMENT", "MOVIMENTO")}</th>
                  <th>{copy("AFTER", "SALDO FINAL")}</th>
                  <th>{copy("REASON", "MOTIVO")}</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id}>
                    <td>
                      {new Date(m.createdAt).toLocaleString()}
                      <small>{m.actor.name}</small>
                    </td>
                    <td>
                      <strong>{m.item.name}</strong>
                      <small>{m.item.sku}</small>
                    </td>
                    <td>
                      {m.type}
                      <small>
                        {m.quantityDelta >= 0 ? "+" : ""}
                        {m.quantityDelta} {copy("units", "unidades")} ·{" "}
                        {m.reservedDelta >= 0 ? "+" : ""}
                        {m.reservedDelta} {copy("reserved", "reservadas")}
                      </small>
                    </td>
                    <td>
                      {m.quantityAfter}
                      <small>
                        {m.reservedAfter} {copy("reserved", "reservadas")}
                      </small>
                    </td>
                    <td className="reason-cell">{m.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !error && (
            <div className="empty-state">
              {copy("No stock movements yet.", "Nenhum movimento registrado.")}
            </div>
          )
        )}
        {pages > 1 && (
          <div className="pager">
            <button
              className="action"
              disabled={page === 1 || loading}
              onClick={() => setPage((v) => v - 1)}
            >
              {copy("Previous", "Anterior")}
            </button>
            <span>
              {page} / {pages}
            </span>
            <button
              className="action"
              disabled={page >= pages || loading}
              onClick={() => setPage((v) => v + 1)}
            >
              {copy("Next", "Próxima")}
            </button>
          </div>
        )}
      </section>
      <div className="integration-note">
        <Icon name="admin" size={22} />
        <div>
          <strong>LigaMagic / CSV</strong>
          <p>
            {copy(
              "Map columns from your stock report, preview every change, then import a quantity snapshot. This does not send changes to LigaMagic. Direct API synchronization is not configured.",
              "Mapeie as colunas do relatório de estoque, revise as alterações e importe o saldo. As alterações não são enviadas à LigaMagic. Sincronização direta via API não está configurada.",
            )}
          </p>
        </div>
      </div>
      {editor && (
        <StockEditor
          item={editor === "new" ? null : editor}
          initialCardId={params.get("cardId") ?? ""}
          initialName={params.get("name") ?? ""}
          onClose={() => {
            setEditor(null);
            setParams({});
          }}
          onSaved={() => saved(copy("Stock saved.", "Estoque salvo."))}
        />
      )}
      {move && (
        <MoveStock
          item={move}
          onClose={() => setMove(null)}
          onSaved={() =>
            saved(copy("Stock movement recorded.", "Movimento registrado."))
          }
        />
      )}
      {importing && (
        <ImportStock onClose={() => setImporting(false)} onSaved={saved} />
      )}
    </main>
  );
}

function StockEditor({
  item,
  initialCardId,
  initialName,
  onClose,
  onSaved,
}: {
  item: StockItem | null;
  initialCardId: string;
  initialName: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const copy = useCopy(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget),
      data: Record<string, unknown> = Object.fromEntries(form);
    for (const key of ["quantity", "costBrl", "priceBrl", "reorderPoint"])
      if (form.has(key)) data[key] = Number(form.get(key));
    if (!item) data.cardId = String(data.cardId || "").trim() || null;
    setBusy(true);
    setError("");
    try {
      if (item)
        await axs.patch(`/inventory/${item.id}`, {
          ...data,
          version: item.version,
        });
      else await axs.post("/inventory", data);
      onSaved();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={
        item
          ? copy("Edit stock details", "Editar estoque")
          : copy("Add a stock item", "Cadastrar item de estoque")
      }
      onClose={onClose}
      busy={busy}
    >
      <form onSubmit={submit}>
        <fieldset disabled={busy} className="form-grid">
          {!item && (
            <>
              <label>
                SKU
                <input
                  name="sku"
                  required
                  maxLength={100}
                  placeholder="MH3-001-NM-EN"
                />
              </label>
              <label>
                {copy("Card name", "Nome da carta")}
                <input
                  name="name"
                  required
                  maxLength={250}
                  defaultValue={initialName}
                />
              </label>
              <label>
                {copy("Set code", "Código da coleção")}
                <input name="setCode" maxLength={30} />
              </label>
              <label>
                {copy("Condition", "Condição")}
                <select name="condition">
                  {["NM", "LP", "MP", "HP", "DMG"].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              <label>
                {copy("Language", "Idioma")}
                <select name="language">
                  {[
                    "EN",
                    "PT",
                    "ES",
                    "FR",
                    "DE",
                    "IT",
                    "JA",
                    "KO",
                    "RU",
                    "ZH",
                  ].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              <label>
                {copy("Finish", "Acabamento")}
                <select name="finish">
                  {["nonfoil", "foil", "etched"].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              <label>
                {copy("Opening quantity", "Quantidade inicial")}
                <input
                  name="quantity"
                  type="number"
                  min="0"
                  max="1000000"
                  required
                  defaultValue="0"
                />
              </label>
              <label>
                Scryfall ID ({copy("optional", "opcional")})
                <input
                  name="cardId"
                  maxLength={100}
                  defaultValue={initialCardId}
                />
              </label>
            </>
          )}
          <label>
            {copy("Unit cost (BRL)", "Custo unitário (BRL)")}
            <input
              type="number"
              name="costBrl"
              min="0"
              max="9999999"
              step="0.01"
              defaultValue={item?.costBrl ?? "0"}
              required
            />
          </label>
          <label>
            {copy("Sale price (BRL)", "Preço de venda (BRL)")}
            <input
              type="number"
              name="priceBrl"
              min="0"
              max="9999999"
              step="0.01"
              defaultValue={item?.priceBrl ?? "0"}
              required
            />
          </label>
          <label>
            {copy("Reorder point", "Estoque mínimo")}
            <input
              type="number"
              name="reorderPoint"
              min="0"
              max="1000000"
              defaultValue={item?.reorderPoint ?? 2}
              required
            />
          </label>
          <label>
            {copy("Storage location", "Localização")}
            <input
              name="location"
              maxLength={100}
              defaultValue={item?.location ?? ""}
              placeholder="A-01"
            />
          </label>
        </fieldset>
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
        <p className="form-hint">
          {copy(
            "Use a unique SKU for each printing, condition, language and finish. Stock quantities change through movements.",
            "Use um SKU único por edição, condição, idioma e acabamento. Quantidades são alteradas por movimentos.",
          )}
        </p>
        <div className="modal-actions">
          <button
            type="button"
            className="action"
            disabled={busy}
            onClick={onClose}
          >
            {copy("Cancel", "Cancelar")}
          </button>
          <button className="action primary" disabled={busy}>
            {busy
              ? copy("Saving…", "Salvando…")
              : copy("Save stock", "Salvar estoque")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function MoveStock({
  item,
  onClose,
  onSaved,
}: {
  item: StockItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const copy = useCopy(),
    [type, setType] = useState("RECEIVE"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await axs.post(`/inventory/${item.id}/movements`, {
        type,
        quantity: Number(form.get("quantity")),
        reason: form.get("reason"),
        version: item.version,
      });
      onSaved();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={copy("Record a movement", "Registrar movimento")}
      onClose={onClose}
      busy={busy}
    >
      <p>
        <strong>{item.name}</strong> · {item.sku}
      </p>
      <p className="form-hint">
        {item.quantity - item.reserved} {copy("available", "disponíveis")} /{" "}
        {item.reserved} {copy("reserved", "reservadas")}
      </p>
      <form onSubmit={submit}>
        <fieldset disabled={busy} className="form-stack">
          <label>
            {copy("Movement type", "Tipo de movimento")}
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {[
                ["RECEIVE", copy("Receive stock", "Entrada")],
                ["SALE", copy("Record sale", "Venda")],
                ["ADJUST", copy("Adjustment (+ / −)", "Ajuste (+ / −)")],
                ["RESERVE", copy("Reserve units", "Reservar")],
                ["RELEASE", copy("Release reservation", "Liberar reserva")],
              ].map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label>
            {copy("Quantity", "Quantidade")}
            <input
              name="quantity"
              type="number"
              min={type === "ADJUST" ? -1000000 : 1}
              max="1000000"
              defaultValue="1"
              required
            />
          </label>
          <label>
            {copy("Reason / order reference", "Motivo / referência do pedido")}
            <input
              name="reason"
              minLength={3}
              maxLength={300}
              required
              placeholder={copy(
                "e.g. Store sale #1042",
                "Ex.: Venda na loja #1042",
              )}
            />
          </label>
        </fieldset>
        <p className="form-hint">
          {copy(
            "Sales use available units. Release reserved units before recording their sale. Adjustments accept positive or negative quantities.",
            "Vendas usam unidades disponíveis. Libere as reservas antes de registrar a venda. Ajustes aceitam valores positivos ou negativos.",
          )}
        </p>
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button
            type="button"
            className="action"
            disabled={busy}
            onClick={onClose}
          >
            {copy("Cancel", "Cancelar")}
          </button>
          <button className="action primary" disabled={busy}>
            {copy("Record movement", "Registrar movimento")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

interface ImportPreview {
  fingerprint: string;
  creates: number;
  updates: number;
  errors: { line: number; message: string }[];
  rows: {
    sku: string;
    name: string;
    before: number;
    quantity: number;
    action: string;
    costBrl: number;
    priceBrl: number;
  }[];
}
const fields = [
  "sku",
  "name",
  "quantity",
  "setCode",
  "condition",
  "language",
  "finish",
  "costBrl",
  "priceBrl",
  "reorderPoint",
  "location",
  "cardId",
];
const aliases: Record<string, string[]> = {
  sku: ["sku", "codigo", "código", "id produto"],
  name: ["name", "nome", "carta", "produto", "nome da carta"],
  quantity: ["quantity", "quantidade", "qtd", "estoque"],
  setCode: ["setcode", "set_code", "edicao", "edição", "coleção", "colecao"],
  condition: ["condition", "qualidade", "condição", "condicao"],
  language: ["language", "idioma"],
  finish: ["finish", "acabamento"],
  costBrl: ["costbrl", "custo", "preço de custo"],
  priceBrl: ["pricebrl", "preco", "preço", "valor", "preço de venda"],
  location: ["location", "local", "localização"],
  reorderPoint: ["reorderpoint", "mínimo", "minimo"],
  cardId: ["cardid", "scryfall_id", "scryfall id"],
};
function ImportStock({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const copy = useCopy(),
    [csv, setCsv] = useState(""),
    [filename, setFilename] = useState(""),
    [headers, setHeaders] = useState<string[]>([]),
    [mapping, setMapping] = useState<Record<string, string>>({}),
    [preview, setPreview] = useState<ImportPreview | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const fieldLabels: Record<string, string> = {
    sku: "SKU",
    name: copy("Card name", "Nome da carta"),
    quantity: copy("Quantity", "Quantidade"),
    setCode: copy("Set code", "Código da coleção"),
    condition: copy("Condition", "Condição"),
    language: copy("Language", "Idioma"),
    finish: copy("Finish", "Acabamento"),
    costBrl: copy("Cost (BRL)", "Custo (BRL)"),
    priceBrl: copy("Price (BRL)", "Preço (BRL)"),
    reorderPoint: copy("Minimum stock", "Estoque mínimo"),
    location: copy("Location", "Local"),
    cardId: "Scryfall ID",
  };
  async function loadFile(file: File | undefined) {
    if (!file) return;
    setPreview(null);
    setHeaders([]);
    setCsv("");
    setError("");
    if (file.size > 1000000) {
      setError(copy("Maximum file size: 1 MB.", "Tamanho máximo: 1 MB."));
      return;
    }
    setBusy(true);
    try {
      const text = await file.text();
      const { data } = await axs.post("/inventory/import/columns", {
        csv: text,
      });
      setCsv(text);
      setFilename(file.name);
      setHeaders(data.headers);
      const next: Record<string, string> = {};
      for (const key of fields) {
        const found = (data.headers as string[]).find((h) =>
          (aliases[key] ?? [key.toLowerCase()]).includes(
            h.trim().toLowerCase(),
          ),
        );
        if (found) next[key] = found;
      }
      setMapping(next);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  async function getPreview() {
    setBusy(true);
    setError("");
    setPreview(null);
    try {
      const { data } = await axs.post("/inventory/import/preview", {
        csv,
        filename,
        mapping,
      });
      setPreview(data);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  async function commit() {
    if (!preview) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await axs.post("/inventory/import/commit", {
        csv,
        filename,
        mapping,
        fingerprint: preview.fingerprint,
      });
      onSaved(
        data.alreadyImported
          ? copy(
              "This snapshot was already imported. Stock was not changed.",
              "Este arquivo já foi importado. Nenhum saldo foi alterado.",
            )
          : `${data.imported} ${copy("stock items imported.", "itens importados.")}`,
      );
    } catch (err) {
      setError(errorText(err));
      setPreview(null);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={copy("Import a stock snapshot", "Importar saldo de estoque")}
      onClose={onClose}
      wide
      busy={busy}
    >
      <p className="form-hint">
        {copy(
          "Use a LigaMagic stock CSV with columns mapped below, or download the Arcana template. Import replaces quantities for matching SKUs; items absent from the file stay unchanged. No data is sent to LigaMagic.",
          "Use um CSV de estoque da LigaMagic e mapeie as colunas, ou baixe o modelo Arcana. A importação substitui o saldo dos SKUs correspondentes; itens ausentes do arquivo permanecem iguais. Nenhum dado é enviado à LigaMagic.",
        )}
      </p>
      <div className="import-upload">
        <label>
          {copy(
            "Choose CSV · up to 500 rows / 1 MB",
            "Escolher CSV · até 500 linhas / 1 MB",
          )}
          <input
            type="file"
            accept=".csv,text/csv"
            disabled={busy}
            onChange={(e) => loadFile(e.target.files?.[0])}
          />
        </label>
        <button
          type="button"
          className="text-button"
          onClick={() =>
            download(
              new Blob(
                [
                  "sku;name;quantity;setCode;condition;language;finish;costBrl;priceBrl;reorderPoint;location;cardId\nEXAMPLE-001;Example card;0;SET;NM;PT;nonfoil;0;0;2;A-01;\n",
                ],
                { type: "text/csv" },
              ),
              "arcana-modelo.csv",
            )
          }
        >
          {copy("Download template", "Baixar modelo")}
        </button>
      </div>
      {headers.length > 0 && (
        <>
          <div className="form-grid mapping-grid">
            {fields.map((field) => (
              <label key={field}>
                {fieldLabels[field]}
                {["sku", "name", "quantity"].includes(field) ? " *" : ""}
                <select
                  value={mapping[field] ?? ""}
                  disabled={busy}
                  onChange={(e) => {
                    setMapping({ ...mapping, [field]: e.target.value });
                    setPreview(null);
                  }}
                >
                  <option value="">
                    {copy(
                      "Use default / no mapping",
                      "Padrão / sem mapeamento",
                    )}
                  </option>
                  {headers.map((h) => (
                    <option key={h}>{h}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <p className="form-hint">
            {copy(
              "New SKU defaults: NM, EN, nonfoil, cost/price 0, minimum 2. Unmapped columns keep existing values for existing SKUs. Conditions: NM/LP/MP/HP/DMG. Finishes: nonfoil/foil/etched. Use language codes such as PT/EN. Prices accept 12.50 or 12,50. A SKU must keep the same variant.",
              "Padrões para novos SKUs: NM, EN, nonfoil, custo/preço 0, mínimo 2. Colunas sem mapeamento preservam valores de SKUs existentes. Condições: NM/LP/MP/HP/DMG. Acabamentos: nonfoil/foil/etched. Use códigos de idioma como PT/EN. Preços aceitam 12.50 ou 12,50. O SKU deve manter a mesma variante.",
            )}
          </p>
          <button
            className="action"
            disabled={
              busy || !mapping.sku || !mapping.name || !mapping.quantity
            }
            onClick={getPreview}
          >
            {copy("Preview changes", "Prévia das alterações")}
          </button>
        </>
      )}
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {preview && (
        <div className="import-preview">
          <p>
            <strong>{preview.creates}</strong> {copy("new SKUs", "novos SKUs")}{" "}
            · <strong>{preview.updates}</strong>{" "}
            {copy("updated SKUs", "SKUs atualizados")}
          </p>
          {preview.errors.length > 0 && (
            <div className="notice error" role="alert">
              <strong>
                {copy(
                  "Resolve all errors before importing.",
                  "Corrija todos os erros antes de importar.",
                )}
              </strong>
              <ul>
                {preview.errors.map((e, i) => (
                  <li key={i}>
                    {copy("Row", "Linha")} {e.line}: {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="table-scroll preview-table">
            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>{copy("Card", "Carta")}</th>
                  <th>{copy("Before", "Antes")}</th>
                  <th>{copy("After", "Depois")}</th>
                  <th>{copy("Cost / price (BRL)", "Custo / preço (BRL)")}</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={row.sku}>
                    <td>{row.sku}</td>
                    <td>{row.name}</td>
                    <td>{row.before}</td>
                    <td>{row.quantity}</td>
                    <td>
                      {brl(row.costBrl)} / {brl(row.priceBrl)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="form-hint">
            {copy(
              "Applying the same snapshot again makes no changes. A preview expires if another administrator changes its stock items.",
              "Reaplicar o mesmo arquivo não altera os saldos. A prévia expira se outro administrador modificar os itens envolvidos.",
            )}
          </p>
        </div>
      )}
      <div className="modal-actions">
        <button
          type="button"
          className="action"
          onClick={onClose}
          disabled={busy}
        >
          {copy("Cancel", "Cancelar")}
        </button>
        <button
          className="action primary"
          disabled={
            busy ||
            !preview ||
            preview.errors.length > 0 ||
            preview.rows.length === 0
          }
          onClick={commit}
        >
          {busy
            ? copy("Working…", "Processando…")
            : copy("Apply stock snapshot", "Aplicar saldo de estoque")}
        </button>
      </div>
    </Modal>
  );
}
