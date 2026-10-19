import { useEffect, useState, useSyncExternalStore } from "react";
import { BattleCanvas } from "./components/BattleCanvas";
import { areaLabel, evolutionRules, forms } from "./domain/catalog";
import { upgradeCost, xpNeeded } from "./domain/progress";
import { createRuntime, type GameRuntime } from "./services/runtime";

const fmt = (n: number) => n.toLocaleString("pt-BR");
const duration = (ms: number) =>
  `${Math.floor(ms / 3600000)}h ${Math.floor(ms / 60000) % 60}min`;
function Meter({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label: string;
}) {
  return (
    <div
      className="meter"
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.max(0, value)}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div style={{ width: `${Math.max(0, (value / max) * 100)}%` }} />
    </div>
  );
}
export function App() {
  const [runtime, setRuntime] = useState<GameRuntime>();
  useEffect(() => {
    let closed = false,
      loaded: GameRuntime | undefined;
    void createRuntime().then((r) => {
      loaded = r;
      if (closed) r.destroy();
      else setRuntime(r);
    });
    return () => {
      closed = true;
      loaded?.destroy();
    };
  }, []);
  return runtime ? (
    <Game runtime={runtime} />
  ) : (
    <main className="loading">Preparando seu parceiro…</main>
  );
}
function Game({ runtime }: { runtime: GameRuntime }) {
  const e = runtime.engine;
  useSyncExternalStore(e.subscribe, e.getRevision);
  const p = e.progress,
    a = e.area,
    r = evolutionRules[p.stage],
    st = e.stats;
  const remaining = (at: number) => Math.max(0, Math.ceil(at - e.clock));
  const act = (action: () => void) => () => action();
  return (
    <main className="phone">
      <header>
        <div>
          <small>DIGIMON REVOLUTION</small>
          <h1>Lute. Cresça. Evolua.</h1>
        </div>
        <span className="avatar">DR</span>
      </header>
      <div className="resources">
        <span>◈ {fmt(p.bits)} Bits</span>
        <span>
          Nv. {p.level} · {p.victories} vitórias
        </span>
      </div>
      {e.offline && (
        <section className="offline" aria-live="polite">
          <strong>Seu parceiro continuou treinando</strong>
          <p>
            {duration(e.offline.elapsed)} fora · produção por{" "}
            {duration(e.offline.credited)}
          </p>
          <b>
            +{fmt(e.offline.bits)} Bits · +{fmt(e.offline.xp)} XP
          </b>
          <p>Recompensas adicionadas em {areaLabel(p.lastWonArea)}.</p>
          <button
            onClick={() => {
              e.offline = null;
              e.notify();
            }}
          >
            Continuar aventura
          </button>
        </section>
      )}
      <section className="scene">
        <BattleCanvas runtime={runtime} />
        <div className="zone">
          <strong>{areaLabel(a.id)}</strong>
          <span>
            {a.chapter === 1
              ? "Floresta dos Inícios"
              : a.chapter === 2
                ? "Fronteira Digital"
                : "Núcleo Digital"}
          </span>
        </div>
        <span className="auto">
          {e.paused
            ? "Ⅱ PAUSADO"
            : e.mode === "fight"
              ? "● AUTO ATIVO"
              : e.mode === "victory"
                ? "✓ VITÓRIA"
                : e.mode === "complete"
                  ? "✦ CONCLUÍDO"
                  : "× DERROTA"}
        </span>
        <div className="enemy">
          <strong>
            {a.enemy} · Nv. {a.level}
          </strong>
          <span>
            ATQ {a.attack} · DEF {a.defense}
          </span>
          <span>
            {Math.ceil(e.enemyHP)} / {a.hp} PV
          </span>
          <Meter value={e.enemyHP} max={a.hp} label="Vida do adversário" />
        </div>
        <div className="wave">
          <span>{a.boss ? "CHEFE" : "EXPLORAÇÃO"}</span>
          <span>Vitória avança · Derrota recua</span>
        </div>
      </section>
      <div className="journey">
        Recompensa: {a.bits} Bits e {a.xp} XP
      </div>
      <section className="content">
        <div className="partner">
          <div>
            <h2>{e.form.name}</h2>
            <small>{e.form.rank} · Vacina · Parceiro</small>
          </div>
          <span className="level">Nv. {p.level}</span>
        </div>
        <div className="meter-label">
          <span>Vida do parceiro</span>
          <span>
            {Math.ceil(e.playerHP)} / {st.hp} PV
          </span>
        </div>
        <Meter value={e.playerHP} max={st.hp} label="Vida do parceiro" />
        <div className="meter-label">
          <span>Próximo nível</span>
          <span>
            {p.xp} / {xpNeeded(p.level)} XP
          </span>
        </div>
        <Meter value={p.xp} max={xpNeeded(p.level)} label="Experiência" />
        <div className="actions">
          <button
            className="main-action"
            disabled={!e.ready || remaining(e.skillReady) > 0}
            onClick={act(() => e.skill())}
          >
            <b>♨</b>
            {e.form.skill}
            {remaining(e.skillReady) > 0 && ` · ${remaining(e.skillReady)}s`}
          </button>
          <button
            disabled={
              !e.ready || remaining(e.healReady) > 0 || e.playerHP >= st.hp
            }
            onClick={act(() => e.heal())}
          >
            <b>♡</b>Curar 38%
            {remaining(e.healReady) > 0 && ` · ${remaining(e.healReady)}s`}
          </button>
          <button
            disabled={!e.ready || remaining(e.guardReady) > 0}
            onClick={act(() => e.guard())}
          >
            <b>⛨</b>Defender
            {remaining(e.guardReady) > 0 && ` · ${remaining(e.guardReady)}s`}
          </button>
        </div>
        <div className="combat-state">
          {e.charging
            ? "⚡ Ataque carregado chegando!"
            : e.guardUntil > e.clock
              ? "Defesa ativa · dano recebido −70%"
              : e.mode === "victory"
                ? "Preparando a próxima área…"
                : "Ataques automáticos · Habilidade recarrega em 6s"}
        </div>
        <div className="controls">
          <button
            disabled={!!e.evolutionRemaining}
            onClick={() => e.togglePause()}
          >
            {e.paused ? "▶ Continuar" : "Ⅱ Pausar"}
          </button>
          {e.mode === "defeat" && (
            <button className="primary" onClick={() => e.retry()}>
              Retomar em {areaLabel(a.id)}
            </button>
          )}
        </div>
        <p className="message" aria-live="polite">
          {e.message}
        </p>
        <section className="evolution">
          <strong>
            {r
              ? `Próxima evolução: ${forms[p.stage + 1].name}`
              : "Linha evolutiva concluída"}
          </strong>
          {r ? (
            <>
              <p>
                {p.level >= r.level ? "✓" : "○"} Nível {p.level} / {r.level}
              </p>
              <p>
                {p.bits >= r.bits ? "✓" : "○"} {fmt(p.bits)} / {fmt(r.bits)}{" "}
                Bits · consumidos ao evoluir
              </p>
              <p>
                {!r.boss || p.bosses.includes(r.boss) ? "✓" : "○"}{" "}
                {r.boss
                  ? `Vencer o chefe de ${areaLabel(r.boss)}`
                  : "Sem requisito de chefe"}
              </p>
            </>
          ) : (
            <p>Agumon → Greymon → MetalGreymon → WarGreymon</p>
          )}
          <button
            className="primary"
            disabled={!e.canEvolve()}
            onClick={() => e.evolve()}
          >
            {e.evolutionRemaining
              ? "✦ Digievoluindo…"
              : r
                ? `${e.canEvolve() ? "✦" : "🔒"} Digievoluir para ${forms[p.stage + 1].name}`
                : "✦ WarGreymon · Forma Mega"}
          </button>
        </section>
        <section className="upgrades">
          <div className="section-label">
            <strong>Melhorias</strong>
            <span>
              ATQ {st.attack} · Vida {st.hp}
            </span>
          </div>
          <div className="upgrade-buttons">
            <button
              disabled={
                !!e.evolutionRemaining ||
                p.attackUpgrade >= 100 ||
                p.bits < upgradeCost("attack", p)
              }
              onClick={() => e.buy("attack")}
            >
              ATQ +5 · {fmt(upgradeCost("attack", p))} Bits
            </button>
            <button
              disabled={
                !!e.evolutionRemaining ||
                p.healthUpgrade >= 100 ||
                p.bits < upgradeCost("health", p)
              }
              onClick={() => e.buy("health")}
            >
              Vida +45 · {fmt(upgradeCost("health", p))} Bits
            </button>
          </div>
          <small>
            Ataque {p.attackUpgrade} · Vitalidade {p.healthUpgrade} · Todas as
            formas
          </small>
        </section>
        <footer>
          <p>{runtime.getStatus()}</p>
          <p>
            {p.lastWonArea
              ? `Offline em ${areaLabel(p.lastWonArea)} · limite de 8h`
              : "Vença a primeira área para ativar os ganhos offline."}
          </p>
          <small>
            Projeto de estudo · Sprites: The Spriters Resource
            <br />
            Mighty Jetters / redblueyellow / A.J. Nitro / RadsPyro
          </small>
        </footer>
      </section>
    </main>
  );
}
