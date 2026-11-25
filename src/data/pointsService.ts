import type { SupabaseClient } from "@supabase/supabase-js";

export type RewardTier = 1 | 2 | 3;
export type RewardStatus = "AVAILABLE" | "PENDING" | "COMPLETED";
export type TransactionType = "EARN" | "REDEEM" | "BONUS";

export type Reward = {
  id: string; title: string; description: string | null; pointsCost: number; tier: RewardTier;
  icon: string; status: RewardStatus; redeemedAt: string | null; completedAt: string | null;
};
export type PointTransaction = { id: string; amount: number; reason: string; type: TransactionType; createdAt: string };
export type NewReward = { title: string; description?: string; pointsCost: number; tier: RewardTier; icon: string };

export const POINTS = { MEMORY: 10, COLLAGE: 15 } as const;

export interface PointsService {
  getBalance(): Promise<number>;
  listTransactions(limit?: number): Promise<PointTransaction[]>;
  listRewards(): Promise<Reward[]>;
  /** Suma puntos al bote común y devuelve el nuevo saldo. */
  earn(amount: number, reason: string): Promise<number>;
  /** Descuenta el coste del bote común de forma atómica y devuelve el nuevo saldo. */
  redeem(rewardId: string): Promise<number>;
  /** Cierra una recompensa pendiente (+20 pts) y devuelve el nuevo saldo. */
  complete(rewardId: string): Promise<number>;
  createReward(reward: NewReward): Promise<Reward>;
}

type RewardRow = {
  id: string; title: string; description: string | null; points_cost: number; tier: RewardTier; icon: string | null;
  status: RewardStatus; redeemed_at: string | null; completed_at: string | null;
};
type TransactionRow = { id: string; amount: number; reason: string; type: TransactionType; created_at: string };

const rewardColumns = "id,title,description,points_cost,tier,icon,status,redeemed_at,completed_at";
const toReward = (row: RewardRow): Reward => ({
  id: row.id, title: row.title, description: row.description, pointsCost: row.points_cost, tier: row.tier,
  icon: row.icon ?? "🎁", status: row.status, redeemedAt: row.redeemed_at, completedAt: row.completed_at
});

function check<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

export function createPointsService(client: SupabaseClient): PointsService {
  return {
    async getBalance() {
      const row = check(await client.from("shared_points").select("total_points").limit(1).maybeSingle<{ total_points: number }>());
      return row?.total_points ?? 0;
    },
    async listTransactions(limit = 50) {
      const rows = check(await client.from("point_transactions").select("id,amount,reason,type,created_at")
        .order("created_at", { ascending: false }).limit(limit).returns<TransactionRow[]>());
      return rows.map((row) => ({ id: row.id, amount: row.amount, reason: row.reason, type: row.type, createdAt: row.created_at }));
    },
    async listRewards() {
      const rows = check(await client.from("rewards").select(rewardColumns).order("points_cost", { ascending: true }).returns<RewardRow[]>());
      return rows.map(toReward);
    },
    async earn(amount, reason) {
      return check(await client.rpc("add_points", { p_amount: amount, p_reason: reason, p_type: "EARN" })) as number;
    },
    async redeem(rewardId) {
      return check(await client.rpc("redeem_reward", { p_reward_id: rewardId })) as number;
    },
    async complete(rewardId) {
      return check(await client.rpc("complete_reward", { p_reward_id: rewardId })) as number;
    },
    async createReward(reward) {
      const row = check(await client.from("rewards").insert({
        title: reward.title, description: reward.description || null, points_cost: reward.pointsCost, tier: reward.tier, icon: reward.icon
      }).select(rewardColumns).single<RewardRow>());
      return toReward(row);
    }
  };
}
