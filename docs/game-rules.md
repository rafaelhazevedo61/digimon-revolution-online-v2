# Regras atuais

## Combate

Ataque do parceiro a cada 1,45 s; ataque adversário a cada 2,25 s. Cada terceiro ataque adversário carrega e causa 2,5 vezes o dano. A defesa do inimigo reduz o dano recebido, com mínimo de 1.

- Habilidade: ataque ×3, recarga de 6 s.
- Cura: 38% da vida máxima, recarga de 10 s.
- Defesa: 70% de redução de dano por 4 s, recarga de 12 s.
- Vitória: concede Bits e XP definidos no catálogo, recupera 12% da vida e avança automaticamente após 2,2 s.
- Derrota: recua uma área, com mínimo em `1-1`. Não reduz os atributos fixos do mesmo adversário. O botão Retomar recupera o parceiro na área anterior.

## Progressão

XP necessário: `60 + (nível − 1) × 25`. Cada nível acrescenta 3 ATQ e 18 PV. Esses bônus e as melhorias valem para todas as formas.

Melhoria de ataque: +5 ATQ, custo inicial 100 Bits. Vitalidade: +45 PV, custo inicial 90 Bits. O custo aumenta por fator 1,55, arredondado para a próxima dezena; limite técnico de 100 compras por melhoria nesta POC.

| Evolução | Nível | Bits consumidos | Chefe vencido |
| --- | --- | --- | --- |
| Greymon | 5 | 300 | — |
| MetalGreymon | 10 | 800 | 1-5 |
| WarGreymon | 15 | 1500 | 1-10 |

Durante a animação de evolução, o combate é suspenso. A proporção de vida é mantida. Não existe regressão manual de forma.

## Áreas e offline

Áreas em sequência: `1-1`…`1-10`, `2-1`…`2-10`, `3-1`…`3-10`. O catálogo fixa espécie, nível, vida, ataque, defesa, XP e Bits. Chefes nas posições 5 e 10. Não existe escolha ou retorno manual de área.

Após vencer `3-10`, a demonstração fica concluída. A estrutura permite ampliar o catálogo, mas apenas essas 30 áreas estão implementadas.

Offline: 10% da recompensa da última área vencida por minuto, máximo de 8 h, com recursos inteiros arredondados para baixo. Antes da primeira vitória não há produção. O tempo negativo rende zero. Offline pode subir nível; não avança área, vence chefe, compra melhoria ou evolui.
