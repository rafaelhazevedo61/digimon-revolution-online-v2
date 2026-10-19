# Arquitetura da primeira entrega

O jogo possui dois processos locais: Vite/React/Phaser e Spring Boot. O banco H2 roda dentro da JVM.

## Fronteiras

- `domain/GameEngine.ts` contém combate, estado transitório, progressão e ações. Recebe tempo por `tick`, sem criar timers ou acessar navegador.
- `domain/catalog.ts` define 30 adversários com valores explícitos, suas recompensas e os requisitos das evoluções.
- `domain/progress.ts` contém atributos, experiência, custos, validação de checkpoints e cálculo offline.
- `BattleScene` representa o estado em sprites; não decide vitórias ou concede recursos.
- React mostra o estado do modelo e encaminha ações. A interface nunca escolhe a área.
- `runtime.ts` gerencia o ciclo de vida, cache local e fila serial de salvamentos HTTP.
- O backend separa controller, serviço transacional e repositório JPA. O checkpoint é serializado em um campo LOB; trata-se de uma transição da POC, não do modelo relacional definitivo do jogo.

## Salvamento e retorno

Ao iniciar, lê-se a cópia local e tenta-se carregar o H2. A cópia válida de timestamp mais recente é utilizada. Se o H2 estiver vazio após reiniciar, prevalece o navegador. A API indisponível permite continuar localmente.

Mudanças na progressão geram checkpoint imediato; há também uma atualização periódica a cada cinco segundos. Escritas HTTP são serializadas e usam uma revisão otimista. Um conflito ou uma falha desativa a sincronização dessa sessão e preserva a cópia local; recarregar tenta conectar novamente.

O checkpoint guarda a próxima área quando uma vitória já foi creditada. Uma evolução paga é registrada já com a forma de destino, mesmo se a animação for interrompida. Isso evita receber a vitória novamente ou perder Bits ao recarregar durante a transformação.

Ao ocultar a página, o combate é suspenso e o horário é salvo. Ao retornar, os recursos offline são calculados, o parceiro recupera a vida e o combate reinicia na área registrada. Os recursos são incorporados ao novo checkpoint imediatamente; o resumo apenas informa o recebimento. Nenhum ganho offline concede vitórias, áreas ou chefes.

## Limites explícitos

O cliente ainda calcula as regras e os timestamps. Ele pode ser modificado por quem joga. O backend desta entrega NÃO é um servidor autoritativo e NÃO deve ser publicado como jogo multiplayer. Não há login, combate servidor, sincronização entre usuários, PostgreSQL, PWA ou deploy configurado.

O save local pertence à origem do navegador. Mudar o domínio ou porta não transporta esse save. Duas abas podem gerar conflito na API; o usuário recebe um aviso e continua com a cópia local. H2 não é persistência durável.

A próxima etapa deve modelar jogador, parceiro, economia, vitórias e ações no Java, introduzir identificação de sessão e cálculo offline por horário do servidor. Só depois o cliente deve enviar intenções como atacar, comprar ou evoluir, em vez do estado completo.
