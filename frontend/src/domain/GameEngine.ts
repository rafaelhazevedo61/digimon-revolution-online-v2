import { areaLabel, areas, evolutionRules, forms } from "./catalog";
import { attributes, earnXP, offlineReward, upgradeCost } from "./progress";
import {
  initialProgress,
  type BattleEvent,
  type BattleMode,
  type OfflineReward,
  type Progress,
} from "./types";

/** Pure game model. No React, Phaser, storage, timers or network dependencies. */
export class GameEngine {
  progress: Progress;
  mode: BattleMode = "fight";
  playerHP = 0;
  enemyHP = 0;
  paused = false;
  clock = 0;
  guardUntil = 0;
  skillReady = 0;
  healReady = 0;
  guardReady = 0;
  playerTimer = 0;
  enemyTimer = 0;
  enemyHits = 0;
  nextAt = 0;
  evolutionRemaining = 0;
  targetStage = 0;
  lastEnemyAttack = -99;
  message = "Seu parceiro começou a explorar.";
  offline: OfflineReward | null = null;
  event: BattleEvent = { id: 0, type: "attack", amount: 0 };
  private listeners = new Set<() => void>();
  private revision = 0;
  constructor(saved: Progress = initialProgress(), now = Date.now()) {
    this.progress = structuredClone(saved);
    this.creditOffline(now);
    this.mode = saved.complete ? "complete" : "fight";
    this.restoreBattle();
  }
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  getRevision = () => this.revision;
  notify() {
    this.revision++;
    this.listeners.forEach((fn) => fn());
  }
  get area() {
    return areas[this.progress.areaId - 1];
  }
  get stats() {
    return attributes(this.progress);
  }
  get form() {
    return forms[this.progress.stage];
  }
  get ready() {
    return !this.paused && this.mode === "fight" && !this.evolutionRemaining;
  }
  get charging() {
    return (
      this.ready && (this.enemyHits + 1) % 3 === 0 && this.enemyTimer >= 1.35
    );
  }
  private emit(type: BattleEvent["type"], amount?: number) {
    this.event = { id: this.event.id + 1, type, amount };
  }
  snapshot(now = Date.now()): Progress {
    const p = structuredClone(this.progress);
    p.savedAt = now;
    if (this.evolutionRemaining) p.stage = this.targetStage;
    if (this.mode === "victory") {
      if (p.areaId === areas.length) p.complete = true;
      else p.areaId++;
    }
    return p;
  }
  private restoreBattle() {
    this.playerHP = this.stats.hp;
    this.enemyHP = this.area.hp;
    this.playerTimer = this.enemyTimer = this.enemyHits = 0;
    this.skillReady =
      this.healReady =
      this.guardReady =
      this.guardUntil =
        this.clock;
    this.lastEnemyAttack = -99;
  }
  creditOffline(now: number) {
    const reward = offlineReward(this.progress, now);
    if (reward.bits || reward.xp) {
      this.progress.bits += reward.bits;
      earnXP(this.progress, reward.xp);
      this.offline = reward;
    }
    this.progress.savedAt = now;
  }
  resumeFromBackground(now: number) {
    if (this.evolutionRemaining) {
      this.progress.stage = this.targetStage;
      this.evolutionRemaining = 0;
    }
    if (this.mode === "victory") this.advance();
    this.creditOffline(now);
    if (this.mode !== "complete") this.mode = "fight";
    this.restoreBattle();
    this.notify();
  }
  tick(seconds: number) {
    if (this.paused) return;
    if (this.evolutionRemaining) {
      this.evolutionRemaining = Math.max(0, this.evolutionRemaining - seconds);
      if (!this.evolutionRemaining) {
        const ratio = this.playerHP / this.stats.hp;
        this.progress.stage = this.targetStage;
        this.playerHP = Math.max(1, Math.round(ratio * this.stats.hp));
        this.message = `${this.form.name} está pronto!`;
      }
      this.notify();
      return;
    }
    if (this.mode === "defeat" || this.mode === "complete") return;
    this.clock += seconds;
    if (this.mode === "victory") {
      if (this.clock >= this.nextAt) this.advance();
      this.notify();
      return;
    }
    this.playerTimer += seconds;
    this.enemyTimer += seconds;
    if (this.playerTimer >= 1.45) {
      this.playerTimer -= 1.45;
      this.attack(this.stats.attack);
    }
    if (this.mode === "fight" && this.enemyTimer >= 2.25) {
      this.enemyTimer -= 2.25;
      this.enemyHits++;
      this.receiveAttack(this.enemyHits % 3 === 0);
    }
    this.notify();
  }
  private attack(raw: number) {
    const damage = Math.min(this.enemyHP, Math.max(1, raw - this.area.defense));
    this.enemyHP -= damage;
    this.emit("attack", damage);
    if (this.enemyHP === 0) {
      const oldHP = this.stats.hp,
        a = this.area;
      this.progress.bits += a.bits;
      const gained = earnXP(this.progress, a.xp);
      this.progress.lastWonArea = a.id;
      this.progress.victories++;
      if (a.boss && !this.progress.bosses.includes(a.id))
        this.progress.bosses.push(a.id);
      this.playerHP = Math.min(
        this.stats.hp,
        this.playerHP +
          this.stats.hp -
          oldHP +
          Math.round(this.stats.hp * 0.12),
      );
      this.mode = "victory";
      this.nextAt = this.clock + 2.2;
      this.message = `Vitória! +${a.bits} Bits · +${a.xp} XP${gained ? ` · Nível ${this.progress.level}!` : ""}`;
    }
  }
  private receiveAttack(charged: boolean) {
    const damage = Math.round(
      this.area.attack *
        (charged ? 2.5 : 1) *
        (this.guardUntil > this.clock ? 0.3 : 1),
    );
    this.playerHP = Math.max(0, this.playerHP - damage);
    this.lastEnemyAttack = this.clock;
    this.emit("hurt", damage);
    if (this.playerHP === 0) {
      this.progress.areaId = Math.max(1, this.progress.areaId - 1);
      this.enemyHP = this.area.hp;
      this.mode = "defeat";
      this.enemyTimer = 0;
      this.message = `Seu parceiro caiu. Retome em ${areaLabel(this.area.id)}. Nível, Bits e melhorias mantidos.`;
    }
  }
  private advance() {
    if (this.progress.areaId === areas.length) {
      this.progress.complete = true;
      this.mode = "complete";
      this.message = "Você concluiu a etapa 3-10!";
      return;
    }
    this.progress.areaId++;
    this.enemyHP = this.area.hp;
    this.mode = "fight";
    this.playerTimer = this.enemyTimer = this.enemyHits = 0;
    this.message = `${areaLabel(this.area.id)} · ${this.area.enemy} apareceu!`;
  }
  skill() {
    if (!this.ready || this.clock < this.skillReady) return;
    this.skillReady = this.clock + 6;
    this.attack(this.stats.attack * 3);
    this.notify();
  }
  heal() {
    if (
      !this.ready ||
      this.clock < this.healReady ||
      this.playerHP === this.stats.hp
    )
      return;
    const before = this.playerHP;
    this.playerHP = Math.min(
      this.stats.hp,
      this.playerHP + Math.round(this.stats.hp * 0.38),
    );
    this.healReady = this.clock + 10;
    this.emit("heal", this.playerHP - before);
    this.message = "Vida recuperada!";
    this.notify();
  }
  guard() {
    if (!this.ready || this.clock < this.guardReady) return;
    this.guardUntil = this.clock + 4;
    this.guardReady = this.clock + 12;
    this.message = "Defesa por 4s · recebe 70% menos dano.";
    this.notify();
  }
  buy(kind: "attack" | "health") {
    const p = this.progress,
      cost = upgradeCost(kind, p);
    if (
      this.evolutionRemaining ||
      p.bits < cost ||
      (kind === "attack" ? p.attackUpgrade : p.healthUpgrade) >= 100
    )
      return;
    p.bits -= cost;
    if (kind === "attack") p.attackUpgrade++;
    else {
      p.healthUpgrade++;
      if (this.mode !== "defeat") this.playerHP += 45;
    }
    this.message =
      kind === "attack"
        ? "Ataque +5 em todas as formas."
        : "Vida máxima +45 em todas as formas.";
    this.notify();
  }
  canEvolve() {
    const r = evolutionRules[this.progress.stage],
      p = this.progress;
    return (
      this.ready &&
      !!r &&
      p.level >= r.level &&
      p.bits >= r.bits &&
      (!r.boss || p.bosses.includes(r.boss))
    );
  }
  evolve() {
    if (!this.canEvolve()) return;
    this.progress.bits -= evolutionRules[this.progress.stage].bits;
    this.targetStage = this.progress.stage + 1;
    this.evolutionRemaining = 3.2;
    this.emit("evolve");
    this.message = "Digievoluindo…";
    this.notify();
  }
  retry() {
    if (this.mode !== "defeat") return;
    this.mode = "fight";
    this.restoreBattle();
    this.message = `Parceiro recuperado em ${areaLabel(this.area.id)}.`;
    this.notify();
  }
  togglePause() {
    if (this.evolutionRemaining) return;
    this.paused = !this.paused;
    this.notify();
  }
}
