import { useEffect, useRef, type ReactNode } from "react";

type Props = { title: string; subtitle?: string; onClose: () => void; busy?: boolean; children: ReactNode };

export default function Modal({ title, subtitle, onClose, busy = false, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => { if (dialog?.open) dialog.close(); };
  }, []);

  return <dialog ref={ref} className="pr-modal" onCancel={(event) => {
    event.preventDefault();
    if (!busy) onClose();
  }} onKeyDown={(event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      if (!busy) onClose();
    }
  }} onClick={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }} aria-labelledby="pr-modal-title">
    <div className="pr-sheet">
      <div className="pr-sheet-handle" />
      <header className="pr-sheet-header">
        <div><h2 id="pr-modal-title">{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
        <button type="button" className="pr-icon-button" aria-label="Cerrar" onClick={onClose} disabled={busy}>✕</button>
      </header>
      <div className="pr-sheet-content">{children}</div>
    </div>
  </dialog>;
}
