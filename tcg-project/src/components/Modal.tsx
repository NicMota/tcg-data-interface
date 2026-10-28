import { useEffect, useRef, type ReactNode } from "react";
import { useCopy } from "../i18n/useCopy";
export function Modal({
  title,
  onClose,
  children,
  wide = false,
  busy = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    copy = useCopy();
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "wide" : ""}`}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="modal-heading">
        <h2>{title}</h2>
        <button
          type="button"
          className="icon-button"
          disabled={busy}
          onClick={onClose}
          aria-label={copy("Close", "Fechar")}
        >
          ✕
        </button>
      </div>
      {children}
    </dialog>
  );
}
