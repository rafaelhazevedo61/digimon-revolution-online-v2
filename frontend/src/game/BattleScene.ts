import Phaser from "phaser";
import { betamon, forms } from "../domain/catalog";
import type { GameRuntime } from "../services/runtime";

/** Rendering adapter: all battle rules live in GameEngine. */
export class BattleScene extends Phaser.Scene {
  private partner!: Phaser.GameObjects.Sprite;
  private enemy!: Phaser.GameObjects.Sprite;
  private ring!: Phaser.GameObjects.Graphics;
  private banner!: Phaser.GameObjects.Text;
  private lastEvent = -1;
  private partnerName = "";
  private enemyName = "";
  private reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    .matches;
  constructor(private runtime: GameRuntime) {
    super("Battle");
  }
  preload() {
    for (const f of [...forms, betamon])
      this.load.spritesheet(f.name, `/sprites/${f.name}.png`, {
        frameWidth: f.width,
        frameHeight: f.height,
      });
  }
  create() {
    const g = this.add.graphics();
    g.fillGradientStyle(0x123e47, 0x123e47, 0x537d5b, 0x537d5b, 1);
    g.fillRect(0, 0, 780, 620);
    for (let i = 0; i < 9; i++) {
      const x = i * 105 - 30;
      g.fillStyle(i % 2 ? 0x1b4a44 : 0x153b3d);
      g.fillRect(x, 60, 28, 400);
      g.fillEllipse(x + 12, 90, 176, 210);
    }
    g.fillStyle(0x3c7056);
    g.fillEllipse(390, 525, 1080, 292);
    g.fillStyle(0x76916a);
    g.fillEllipse(395, 520, 528, 130);
    g.fillStyle(0x82976b);
    g.fillEllipse(400, 536, 420, 74);
    g.fillStyle(0x193b42, 0.4);
    g.fillEllipse(230, 518, 124, 26);
    g.fillEllipse(570, 518, 124, 26);
    for (const f of [...forms, betamon])
      this.anims.create({
        key: `${f.name}-idle`,
        frames: this.anims.generateFrameNumbers(f.name, {
          frames: [0, 1, 2, 1],
        }),
        frameRate: 5,
        repeat: -1,
      });
    this.partner = this.add
      .sprite(230, 518, "Agumon")
      .setOrigin(0.5, 1)
      .setFlipX(true);
    this.enemy = this.add.sprite(570, 518, "Betamon").setOrigin(0.5, 1);
    this.ring = this.add.graphics();
    this.banner = this.add
      .text(390, 100, "", {
        fontFamily: "system-ui",
        fontSize: "28px",
        color: "#effffa",
        align: "center",
      })
      .setOrigin(0.5, 0);
    this.game.canvas.setAttribute(
      "aria-label",
      "Combate 2D entre seu parceiro e o Digimon adversário",
    );
  }
  private pose(sprite: Phaser.GameObjects.Sprite, name: string, size: number) {
    const info =
      name === "Betamon" ? betamon : forms.find((f) => f.name === name)!;
    sprite
      .setTexture(name, 0)
      .setDisplaySize(size, (size * info.height) / info.width);
    if (!this.reduced) sprite.play(`${name}-idle`);
  }
  update(_time: number, delta: number) {
    const e = this.runtime.engine;
    this.runtime.tick(Math.min(0.1, delta / 1000));
    const evolution = e.evolutionRemaining > 0;
    const shown =
      evolution && e.evolutionRemaining < 1.2 ? forms[e.targetStage] : e.form;
    if (shown.name !== this.partnerName) {
      this.pose(this.partner, shown.name, shown.size);
      this.partnerName = shown.name;
    }
    const enemyInfo =
      e.area.enemy === "Betamon"
        ? betamon
        : forms.find((f) => f.name === e.area.enemy)!;
    if (e.area.enemy !== this.enemyName) {
      this.pose(this.enemy, enemyInfo.name, enemyInfo.size);
      this.enemyName = e.area.enemy;
    }
    const halted = e.paused || e.mode !== "fight" || evolution;
    for (const sprite of [this.partner, this.enemy]) {
      if (halted || this.reduced) sprite.anims.pause();
      else sprite.anims.resume();
    }
    this.enemy.setVisible(!evolution);
    this.partner.setX(evolution ? 390 : 230).setY(evolution ? 455 : 518);
    this.ring.clear();
    if (evolution) {
      const p = 1 - e.evolutionRemaining / 3.2;
      this.ring.fillStyle(0x09172c, 0.92);
      this.ring.fillRect(0, 0, 780, 620);
      this.ring.lineStyle(3, 0x96f5e1, 0.9);
      for (let i = 0; i < 3; i++)
        this.ring.strokeEllipse(390, 365, 250 + i * 36, 65 + i * 32);
      this.ring.setDepth(2);
      this.partner.setDepth(3);
      this.banner.setDepth(4);
      if (!this.reduced) {
        const z = 1 + Math.sin(p * Math.PI) * 0.12;
        this.partner.setDisplaySize(
          shown.size * z,
          ((shown.size * shown.height) / shown.width) * z,
        );
        if (p > 0.3 && p < 0.76) this.partner.setTintFill(0xeaffff);
        else this.partner.clearTint();
      }
      this.banner.setText(`DIGIEVOLUÇÃO\n${shown.name}`);
    } else {
      this.partner.setDepth(1);
      this.ring.setDepth(0);
      this.banner.setDepth(4);
      this.partner.clearTint();
      this.partner.setDisplaySize(
        shown.size,
        (shown.size * shown.height) / shown.width,
      );
      if (e.guardUntil > e.clock) {
        this.ring.lineStyle(4, 0x8fddf7);
        this.ring.strokeEllipse(230, 412, 220, 236);
      }
      this.banner.setText(
        e.paused
          ? "COMBATE PAUSADO"
          : e.mode === "defeat"
            ? "SEU PARCEIRO CAIU"
            : e.mode === "complete"
              ? "JORNADA CONCLUÍDA"
              : e.charging
                ? "⚡ CARREGANDO"
                : "",
      );
    }
    if (e.event.id !== this.lastEvent) {
      this.lastEvent = e.event.id;
      if (e.event.amount) this.feedback(e.event.type, e.event.amount);
    }
  }
  private feedback(type: string, amount: number) {
    const x = type === "attack" ? 565 : 230,
      color =
        type === "heal" ? "#a1f1d5" : type === "hurt" ? "#ffb2a3" : "#ffe7b2";
    const t = this.add
      .text(x, 300, `${type === "heal" ? "+" : "−"}${amount}`, {
        fontFamily: "system-ui",
        fontSize: "28px",
        color,
      })
      .setOrigin(0.5)
      .setDepth(5);
    this.tweens.add({
      targets: t,
      y: this.reduced ? 300 : 260,
      alpha: 0,
      duration: 750,
      onComplete: () => t.destroy(),
    });
    if (type === "attack" && !this.reduced) {
      const ball = this.add.circle(285, 420, 16, 0xf7a542).setDepth(2);
      this.tweens.add({
        targets: ball,
        x: 560,
        duration: 250,
        onComplete: () => ball.destroy(),
      });
    }
  }
}
