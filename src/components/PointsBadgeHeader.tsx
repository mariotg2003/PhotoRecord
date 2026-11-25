import { useEffect, useState } from "react";
import type { PointTransaction, PointsService } from "../data/pointsService";
import Modal from "./Modal";

type Props = { service: PointsService; balance: number | null; onOpenRewards: () => void };

export default function PointsBadgeHeader({ service, balance, onOpenRewards }: Props) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className="pr-points-badge" aria-label="Ver historial de puntos" onClick={() => setOpen(true)}>
      🪙 {balance === null ? "…" : balance} pts
    </button>
    {open && <HistoryModal service={service} balance={balance} onClose={() => setOpen(false)} onOpenRewards={() => { setOpen(false); onOpenRewards(); }} />}
  </>;
}

function HistoryModal({ service, balance, onClose, onOpenRewards }: { service: PointsService; balance: number | null; onClose: () => void; onOpenRewards: () => void }) {
  const [items, setItems] = useState<PointTransaction[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    service.listTransactions().then((value) => { if (active) setItems(value); })
      .catch((reason: unknown) => { if (active) setError(`No se pudo cargar el historial: ${String(reason)}`); });
    return () => { active = false; };
  }, [service, balance]);

  return <Modal title={`🪙 ${balance ?? 0} pts`} subtitle="Historial del bote compartido" onClose={onClose}>
    <div className="pr-form">
      {error && <p className="pr-error" role="alert">{error}</p>}
      {!items && !error && <p className="pr-helper">Cargando...</p>}
      {items?.length === 0 && <p className="pr-helper">Todavía no hay movimientos.</p>}
      <ul className="pr-points-list">{items?.map((item) => <li key={item.id}>
        <span>{item.reason}<small>{new Date(item.createdAt).toLocaleDateString("es-ES")}</small></span>
        <b className={item.amount < 0 ? "pr-points-negative" : "pr-points-positive"}>{item.amount > 0 ? "+" : ""}{item.amount}</b>
      </li>)}</ul>
      <button type="button" className="pr-button" onClick={onOpenRewards}>🎁 Ver recompensas</button>
    </div>
  </Modal>;
}
