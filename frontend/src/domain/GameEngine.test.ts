import { describe, expect, it } from "vitest";
import { GameEngine } from "./GameEngine";
import { areas, areaLabel } from "./catalog";
import { isProgress, offlineReward, upgradeCost } from "./progress";
import { initialProgress } from "./types";

function step(e: GameEngine, seconds: number) {
  for (let t = 0; t < seconds; t += 0.1) e.tick(0.1);
}
describe("combat and progression", () => {
  it("automatically attacks both ways and pauses the simulation", () => {
    const e = new GameEngine(initialProgress(0), 0);
    step(e, 2.5);
    expect(e.enemyHP).toBeLessThan(e.area.hp);
    expect(e.playerHP).toBeLessThan(e.stats.hp);
    const hp = e.playerHP,
      clock = e.clock;
    e.togglePause();
    step(e, 20);
    expect(e.playerHP).toBe(hp);
    expect(e.clock).toBe(clock);
  });
  it("guards cooldowns against repeated clicks", () => {
    const e = new GameEngine(initialProgress(0), 0);
    e.skill();
    const hp = e.enemyHP;
    e.skill();
    expect(e.enemyHP).toBe(hp);
    e.playerHP = 100;
    e.heal();
    const healed = e.playerHP;
    e.heal();
    expect(e.playerHP).toBe(healed);
    e.guard();
    expect(e.guardUntil).toBe(e.clock + 4);
  });
  it("rewards a victory once, advances automatically and snapshots the next area", () => {
    const e = new GameEngine(initialProgress(0), 0);
    e.enemyHP = 1;
    e.skill();
    expect(e.progress.bits).toBe(80);
    expect(e.progress.victories).toBe(1);
    expect(e.snapshot(10).areaId).toBe(2);
    e.skill();
    expect(e.progress.bits).toBe(80);
    step(e, 2.4);
    expect(e.progress.areaId).toBe(2);
  });
  it("retreats across a chapter boundary while preserving progression", () => {
    const p = { ...initialProgress(0), areaId: 11, bits: 500, level: 4 };
    const e = new GameEngine(p, 0);
    e.playerHP = 1;
    step(e, 2.4);
    expect(e.mode).toBe("defeat");
    expect(e.progress.areaId).toBe(10);
    expect(e.enemyHP).toBe(480);
    expect(e.progress.bits).toBe(500);
    e.retry();
    expect(e.playerHP).toBe(e.stats.hp);
    expect(areaLabel(e.area.id)).toBe("1-10");
  });
  it("deducts upgrade costs and cannot overspend", () => {
    const e = new GameEngine({ ...initialProgress(0), bits: 100 }, 0);
    e.buy("attack");
    expect(e.stats.attack).toBe(27);
    expect(e.progress.bits).toBe(0);
    expect(upgradeCost("attack", e.progress)).toBe(160);
    e.buy("health");
    expect(e.progress.healthUpgrade).toBe(0);
  });
  it("enforces level, funds and actual boss victories for evolution", () => {
    const e = new GameEngine({ ...initialProgress(0), level: 5, bits: 300 }, 0);
    e.evolve();
    e.evolve();
    expect(e.progress.bits).toBe(0);
    expect(e.snapshot(100).stage).toBe(1);
    step(e, 3.3);
    expect(e.progress.stage).toBe(1);
    e.progress.level = 10;
    e.progress.bits = 800;
    expect(e.canEvolve()).toBe(false);
    e.progress.bosses.push(5);
    expect(e.canEvolve()).toBe(true);
    e.evolve();
    step(e, 3.3);
    expect(e.progress.stage).toBe(2);
  });
  it("finishes at 3-10 without advancing outside the catalog", () => {
    const e = new GameEngine({ ...initialProgress(0), areaId: 30 }, 0);
    e.enemyHP = 1;
    e.skill();
    step(e, 2.4);
    expect(e.mode).toBe("complete");
    expect(e.progress.areaId).toBe(30);
    expect(e.progress.complete).toBe(true);
  });
});
describe("checkpoints and offline", () => {
  it("caps production at eight hours and never advances areas or evolves offline", () => {
    const p = { ...initialProgress(0), lastWonArea: 1, areaId: 2 };
    const reward = offlineReward(p, 9 * 3600000);
    expect(reward.bits).toBe(3840);
    expect(reward.xp).toBe(1920);
    const e = new GameEngine(p, 9 * 3600000);
    expect(e.progress.level).toBeGreaterThan(1);
    expect(e.progress.areaId).toBe(2);
    expect(e.progress.stage).toBe(0);
    expect(e.progress.victories).toBe(0);
  });
  it("does not duplicate an offline credit on the next restore", () => {
    const e = new GameEngine(
      { ...initialProgress(0), lastWonArea: 1 },
      3600000,
    );
    const p = e.snapshot(3600000);
    const reloaded = new GameEngine(p, 3600000);
    expect(reloaded.progress.bits).toBe(e.progress.bits);
    expect(reloaded.progress.totalXP).toBe(e.progress.totalXP);
  });
  it("produces nothing before a first victory or from a future timestamp", () => {
    expect(offlineReward(initialProgress(0), 3600000).bits).toBe(0);
    expect(
      offlineReward({ ...initialProgress(5000), lastWonArea: 1 }, 100).bits,
    ).toBe(0);
  });
  it("validates saved boundaries and catalog continuity", () => {
    expect(isProgress(initialProgress())).toBe(true);
    expect(isProgress({ ...initialProgress(), areaId: 31 })).toBe(false);
    expect(isProgress({ ...initialProgress(), xp: 60 })).toBe(false);
    expect(isProgress({ ...initialProgress(), bosses: [3] })).toBe(false);
    expect(areas).toHaveLength(30);
    for (let i = 1; i < 30; i++)
      expect(areas[i].hp).toBeGreaterThan(areas[i - 1].hp);
  });
});
