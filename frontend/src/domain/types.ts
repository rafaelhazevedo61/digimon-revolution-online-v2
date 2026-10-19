export interface Progress {
  version: 2;
  level: number;
  xp: number;
  bits: number;
  stage: number;
  areaId: number;
  lastWonArea: number;
  attackUpgrade: number;
  healthUpgrade: number;
  totalXP: number;
  victories: number;
  bosses: number[];
  complete: boolean;
  savedAt: number;
}
export type BattleMode = "fight" | "victory" | "defeat" | "complete";
export interface OfflineReward {
  elapsed: number;
  credited: number;
  bits: number;
  xp: number;
}
export interface BattleEvent {
  id: number;
  type: "attack" | "hurt" | "heal" | "evolve";
  amount?: number;
}
export const initialProgress = (now = Date.now()): Progress => ({
  version: 2,
  level: 1,
  xp: 0,
  bits: 0,
  stage: 0,
  areaId: 1,
  lastWonArea: 0,
  attackUpgrade: 0,
  healthUpgrade: 0,
  totalXP: 0,
  victories: 0,
  bosses: [],
  complete: false,
  savedAt: now,
});
