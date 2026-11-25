import { useCallback, useEffect, useState } from "react";
import { POINTS, type PointsService, type Reward } from "../data/pointsService";
import CreateRewardModal from "./CreateRewardModal";
import Modal from "./Modal";

type Tab = "1" | "2" | "3" | "pending";
type Props = { service: PointsService; balance: number | null; onBalance: (balance: number) => void; onClose: () => void };

const tabs: { id: Tab; label: string }[] = [
  { id: "1", label: "Nivel 1" }, { id: "2", label: "Nivel 2" }, { id: "3", label: "Nivel 3" }, { id: "pending", label: "Pendientes" }
];

export default function RewardsModal({ service, balance, onBalance, onClose }: Props) {
  const [rewards, setRewards] = useState<Reward[] | null>(null);
  const [tab, setTab] = useState<Tab>("1");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const reload = useCallback(async () => setRewards(await service.listRewards()), [service]);
  useEffect(() => {
    reload().catch((reason: unknown) => setError(`No se pudieron cargar las recompensas: ${String(reason)}`));
  }, [reload]);

  async function run(id: string, action: () => Promise<number>) {
    if (busyId) return;
    setBusyId(id); setError("");
    try { onBalance(await action()); await reload(); }
    catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
      await reload().catch(() => undefined);
    } finally { setBusyId(null); }
  }

  const visible = (rewards ?? []).filter((reward) => tab === "pending" ? reward.status === "PENDING" : reward.status === "AVAILABLE" && String(reward.tier) === tab);

  return <>
    <Modal title="Recompensas" subtitle={`🪙 ${balance ?? 0} pts en el bote común`} onClose={onClose}>
      <div className="pr-form">
        <div className="pr-tabs" role="tablist">{tabs.map((item) =>
          <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? "pr-active" : ""} onClick={() => setTab(item.id)}>{item.label}</button>)}</div>
        {error && <p className="pr-error" role="alert">{error}</p>}
        {!rewards && !error && <p className="pr-helper">Cargando...</p>}
        {rewards && visible.length === 0 && <p className="pr-helper">{tab === "pending" ? "No hay planes pendientes de disfrutar." : "No hay recompensas en este nivel."}</p>}
        <ul className="pr-reward-list">{visible.map((reward) => <li key={reward.id} className="pr-reward">
          <span className="pr-reward-icon" aria-hidden="true">{reward.icon}</span>
          <div><strong>{reward.title}</strong>{reward.description && <p className="pr-helper">{reward.description}</p>}</div>
          {reward.status === "AVAILABLE"
            ? <button type="button" className="pr-button" disabled={busyId !== null || balance === null || balance < reward.pointsCost} onClick={() => void run(reward.id, () => service.redeem(reward.id))}>Canjear Plan (-{reward.pointsCost} pts)</button>
            : <button type="button" className="pr-button" disabled={busyId !== null} onClick={() => void run(reward.id, () => service.complete(reward.id))}>Marcar como completado (+{POINTS.COMPLETED_REWARD} pts) ✔️</button>}
        </li>)}</ul>
        <button type="button" className="pr-button" onClick={() => setCreating(true)}>＋ Nueva recompensa</button>
      </div>
    </Modal>
    {creating && <CreateRewardModal onClose={() => setCreating(false)} onCreate={async (reward) => { await service.createReward(reward); await reload(); }} />}
  </>;
}
