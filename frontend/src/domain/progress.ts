import { areas, forms } from "./catalog";
import type { OfflineReward, Progress } from "./types";

export const xpNeeded = (level: number) => 60 + (level - 1) * 25;
export const upgradeCost = (kind: "attack" | "health", p: Progress) =>
  Math.ceil(
    ((kind === "attack" ? 100 : 90) *
      Math.pow(1.55, kind === "attack" ? p.attackUpgrade : p.healthUpgrade)) /
      10,
  ) * 10;
export const attributes = (p: Progress) => ({
  hp: forms[p.stage].hp + (p.level - 1) * 18 + p.healthUpgrade * 45,
  attack: forms[p.stage].attack + (p.level - 1) * 3 + p.attackUpgrade * 5,
});
export function earnXP(p: Progress, amount: number): number {
  p.xp += amount;
  p.totalXP += amount;
  let gained = 0;
  while (p.xp >= xpNeeded(p.level)) {
    p.xp -= xpNeeded(p.level);
    p.level++;
    gained++;
  }
  return gained;
}
export function offlineReward(p: Progress, now: number): OfflineReward {
  const elapsed = Math.max(0, now - p.savedAt),
    credited = Math.min(elapsed, 8 * 3600_000);
  const area = areas[p.lastWonArea - 1];
  return {
    elapsed,
    credited,
    bits: area ? Math.floor((credited / 60000) * area.bits * 0.1) : 0,
    xp: area ? Math.floor((credited / 60000) * area.xp * 0.1) : 0,
  };
}
const integer = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= min && v <= max;
export function isProgress(value: unknown): value is Progress {
  if (!value || typeof value !== "object") return false;
  const p = value as Progress;
  return (
    p.version === 2 &&
    integer(p.level, 1, 10000) &&
    integer(p.xp, 0, xpNeeded(p.level) - 1) &&
    integer(p.bits, 0, 1_000_000_000) &&
    integer(p.stage, 0, 3) &&
    integer(p.areaId, 1, 30) &&
    integer(p.lastWonArea, 0, 30) &&
    integer(p.attackUpgrade, 0, 100) &&
    integer(p.healthUpgrade, 0, 100) &&
    integer(p.totalXP, 0, 1_000_000_000) &&
    integer(p.victories, 0, 10_000_000) &&
    Array.isArray(p.bosses) &&
    p.bosses.length <= 6 &&
    p.bosses.every((n) => integer(n, 5, 30) && n % 5 === 0) &&
    typeof p.complete === "boolean" &&
    (!p.complete || p.areaId === 30) &&
    typeof p.savedAt === "number" &&
    Number.isFinite(p.savedAt) &&
    p.savedAt >= 0
  );
}
