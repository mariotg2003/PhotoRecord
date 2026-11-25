import { useEffect, useState } from "react";
import { POINTS, type PointTransaction, type PointsService } from "../data/pointsService";
import Modal from "./Modal";

type Props = { service: PointsService; balance: number | null; onOpenRewards: () => void };

export default function PointsBadgeHeader({ service, balance, onOpenRewards }: Props) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className="pr-points-badge" aria-label="Ver puntos e historial" onClick={() => setOpen(true)}>
      🪙 {balance === null ? "…" : balance} pts
    </button>
    {open && <HistoryModal service={service} balance={balance} onClose={() => setOpen(false)} onOpenRewards={() => { setOpen(false); onOpenRewards(); }} />}
  </>;
}

export function PointsGuide() {
  return <section aria-labelledby="pr-points-guide-title">
    <h3 id="pr-points-guide-title">Cómo ganar puntos</h3>
    <p className="pr-helper">Los dos sumáis al mismo bote. Ahora mismo estas son las acciones que dan puntos:</p>
    <ul className="pr-points-list pr-points-guide">
      <li><span>Guardar un recuerdo<small>Foto, fecha, ubicación y nota.</small></span><b className="pr-points-positive">+{POINTS.MEMORY} pts</b></li>
      <li><span>Guardar un collage<small>Selecciona entre 2 y 4 recuerdos con foto. El collage no suma también los puntos de un recuerdo.</small></span><b className="pr-points-positive">+{POINTS.COLLAGE} pts</b></li>
      <li><span>Completar un plan canjeado<small>En Recompensas → Pendientes, marca el plan como completado.</small></span><b className="pr-points-positive">+{POINTS.COMPLETED_REWARD} pts</b></li>
    </ul>
    <p className="pr-helper">Ejemplo: guardar 2 recuerdos y después un collage con sus fotos suma {2 * POINTS.MEMORY + POINTS.COLLAGE} puntos. Canjear un plan resta su coste del bote compartido.</p>
    <p className="pr-helper">Organizar álbumes o crear recompensas no da puntos actualmente.</p>
  </section>;
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

  return <Modal title={`🪙 ${balance === null ? "…" : balance} pts`} subtitle="Bote compartido" onClose={onClose}>
    <div className="pr-form">
      <PointsGuide />
      <h3>Historial de puntos</h3>
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
