import type { Progress } from "../domain/types";
export interface PlayerResponse {
  playerId: string;
  revision: number;
  progress: Progress | null;
}
async function request(init?: RequestInit): Promise<PlayerResponse> {
  const response = await fetch(`/api/dev/player${init ? "/save" : ""}`, {
    ...init,
    signal: AbortSignal.timeout(5000),
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok)
    throw new Error(
      response.status === 409
        ? "Conflito de salvamento: recarregue a página."
        : `API indisponível (${response.status}).`,
    );
  return response.json();
}
export const loadPlayer = () => request();
export const savePlayer = (revision: number, progress: Progress) =>
  request({ method: "PUT", body: JSON.stringify({ revision, progress }) });
