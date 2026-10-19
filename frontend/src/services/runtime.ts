import { GameEngine } from "../domain/GameEngine";
import { isProgress } from "../domain/progress";
import type { Progress } from "../domain/types";
import { loadPlayer, savePlayer } from "./playerApi";

const KEY = "digimon-v2-foundation-v1";
export async function createRuntime() {
  let local: Progress | undefined,
    storage = true,
    api = false,
    revision = 0,
    status = "Salvamento local";
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (!isProgress(parsed)) throw new Error("Invalid checkpoint");
      local = parsed;
    }
  } catch {
    storage = false;
    status =
      "Não foi possível ler o salvamento local. Os dados existentes foram preservados.";
  }
  let chosen = local;
  try {
    const remote = await loadPlayer();
    revision = remote.revision;
    api = true;
    if (
      remote.progress &&
      isProgress(remote.progress) &&
      (!chosen || remote.progress.savedAt > chosen.savedAt)
    )
      chosen = remote.progress;
  } catch {
    status = "API indisponível · progresso salvo somente neste navegador";
  }
  const engine = new GameEngine(chosen);
  let dirty: Progress | null = null,
    inflight = false,
    lastSaved = 0,
    hiddenAt: number | null = null,
    stopped = false;
  async function sync() {
    if (inflight || !api || !dirty || stopped) return;
    inflight = true;
    const progress = dirty;
    dirty = null;
    try {
      const result = await savePlayer(revision, progress);
      revision = result.revision;
      status = "✓ Salvo no navegador e no H2 de desenvolvimento";
    } catch (error) {
      api = false;
      status = `${error instanceof Error ? error.message : "Falha na API"} Progresso mantido localmente.`;
    } finally {
      inflight = false;
      engine.notify();
      if (dirty) void sync();
    }
  }
  function persist() {
    const progress = engine.snapshot(hiddenAt ?? Date.now());
    lastSaved = Date.now();
    if (storage) {
      try {
        localStorage.setItem(KEY, JSON.stringify(progress));
        if (!api) status = "✓ Salvo neste navegador · API desconectada";
      } catch {
        storage = false;
        status = "Armazenamento local bloqueado · mantenha esta página aberta";
      }
    }
    if (api) {
      dirty = progress;
      void sync();
    }
  }
  function background() {
    if (hiddenAt !== null) return;
    hiddenAt = Date.now();
    engine.progress.savedAt = hiddenAt;
    persist();
  }
  function foreground() {
    if (hiddenAt === null) return;
    hiddenAt = null;
    engine.resumeFromBackground(Date.now());
    persist();
  }
  const visibility = () => (document.hidden ? background() : foreground());
  document.addEventListener("visibilitychange", visibility);
  window.addEventListener("pagehide", background);
  window.addEventListener("pageshow", foreground);
  const interval = window.setInterval(() => {
    if (hiddenAt === null && Date.now() - lastSaved >= 5000) persist();
  }, 1000);
  let checkpoint = JSON.stringify(engine.snapshot(0));
  const unsubscribe = engine.subscribe(() => {
    const next = JSON.stringify(engine.snapshot(0));
    if (next !== checkpoint) {
      checkpoint = next;
      persist();
    }
  });
  persist();
  return {
    engine,
    getStatus: () => status,
    tick: (dt: number) => {
      if (hiddenAt === null) engine.tick(dt);
    },
    destroy: () => {
      persist();
      stopped = true;
      unsubscribe();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", background);
      window.removeEventListener("pageshow", foreground);
    },
  };
}
export type GameRuntime = Awaited<ReturnType<typeof createRuntime>>;
