import { useState, type FormEvent } from "react";
import type { NewReward, RewardTier } from "../data/pointsService";
import Modal from "./Modal";

type Props = { onClose: () => void; onCreate: (reward: NewReward) => Promise<void> };

export default function CreateRewardModal({ onClose, onCreate }: Props) {
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("🎁");
  const [points, setPoints] = useState("100");
  const [tier, setTier] = useState<RewardTier>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    const pointsCost = Number(points);
    if (!title.trim()) return setError("Escribe un título.");
    if (!Number.isInteger(pointsCost) || pointsCost <= 0) return setError("Los puntos deben ser un número entero mayor que 0.");
    setBusy(true); setError("");
    try { await onCreate({ title: title.trim(), icon: icon.trim() || "🎁", pointsCost, tier }); onClose(); }
    catch (reason) { setError(`No se pudo crear: ${reason instanceof Error ? reason.message : String(reason)}`); setBusy(false); }
  }

  return <Modal title="Nueva recompensa" subtitle="Un plan para disfrutar juntos" onClose={onClose} busy={busy}>
    <form className="pr-form" onSubmit={(event) => void submit(event)}>
      {error && <p className="pr-error" role="alert">{error}</p>}
      <label className="pr-field">TÍTULO<input value={title} maxLength={150} onChange={(event) => setTitle(event.target.value)} required /></label>
      <label className="pr-field">ICONO<input value={icon} maxLength={10} onChange={(event) => setIcon(event.target.value)} /></label>
      <label className="pr-field">PUNTOS<input type="number" min={1} step={1} value={points} onChange={(event) => setPoints(event.target.value)} required /></label>
      <label className="pr-field">NIVEL<select value={tier} onChange={(event) => setTier(Number(event.target.value) as RewardTier)}>
        <option value={1}>Nivel 1 · Cotidiano</option><option value={2}>Nivel 2 · Intermedio</option><option value={3}>Nivel 3 · Gran meta</option>
      </select></label>
      <button className="pr-button" disabled={busy}>{busy ? "Guardando..." : "Crear recompensa"}</button>
    </form>
  </Modal>;
}
