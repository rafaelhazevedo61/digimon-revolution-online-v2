# API local de desenvolvimento

Disponível apenas no perfil `dev`; endereço padrão `127.0.0.1:8080`. O Vite faz o proxy, portanto o frontend usa URLs relativas e não exige CORS aberto.

## GET /api/dev/player

```json
{"playerId":"local-player","revision":0,"progress":null}
```

O progresso nulo indica H2 recém-iniciado. Nunca substitui automaticamente uma cópia local existente por um jogador vazio.

## PUT /api/dev/player/save

```json
{
  "revision":0,
  "progress":{
    "version":2,"level":1,"xp":40,"bits":80,"stage":0,
    "areaId":2,"lastWonArea":1,"attackUpgrade":0,"healthUpgrade":0,
    "totalXP":40,"victories":1,"bosses":[],"complete":false,
    "savedAt":1792450000000
  }
}
```

Retorna o mesmo formato do GET, com revisão incrementada e o progresso salvo.

| Status | Significado |
| --- | --- |
| 200 | Checkpoint salvo |
| 400 | JSON ou campos inválidos, XP incompatível com nível ou área final inconsistente |
| 409 | A revisão foi modificada por outra escrita; recarregar antes de sincronizar |

Sem autenticação: o endpoint representa somente o jogador de desenvolvimento. Não valida a legitimidade das recompensas e evoluções; essa migração será feita na próxima etapa.
