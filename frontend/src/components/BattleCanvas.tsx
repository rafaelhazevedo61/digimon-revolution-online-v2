import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { BattleScene } from "../game/BattleScene";
import type { GameRuntime } from "../services/runtime";

export function BattleCanvas({ runtime }: { runtime: GameRuntime }) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: container.current!,
      width: 780,
      height: 620,
      backgroundColor: "#143b41",
      pixelArt: true,
      scene: new BattleScene(runtime),
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    });
    return () => game.destroy(true);
  }, [runtime]);
  return <div ref={container} className="battle-canvas" />;
}
