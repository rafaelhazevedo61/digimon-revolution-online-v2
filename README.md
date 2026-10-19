# Digimon Revolution Online v2

Projeto independente de estudo: jogo idle 2D com pequenas ações ativas, pensado para celular.

## Executar localmente

Requisitos: **Java 21** e **Node.js 22.12+** (ou Node 24). O Maven Wrapper baixa o Maven no primeiro uso. Não precisa instalar banco nem Docker.

Terminal 1 — backend:

```bash
cd backend
./mvnw spring-boot:run
```

No Windows, use `mvnw.cmd spring-boot:run`.

Terminal 2 — frontend:

```bash
cd frontend
npm ci
npm run dev
```

Abra **http://localhost:5173**. O Vite encaminha `/api` para o Spring Boot em **http://localhost:8080**. O frontend também funciona sem backend, salvando somente no navegador; a primeira tentativa de conexão pode levar até 5 segundos.

## O que está funcionando

- React + TypeScript para interface vertical; Phaser 3 para cenário, sprites e animações.
- Combate automático, habilidade com recarga, cura e defesa contra golpes carregados.
- XP, níveis, Bits e melhorias que afetam todas as formas.
- Agumon → Greymon → MetalGreymon → WarGreymon, com requisitos de nível, Bits e chefes.
- 30 áreas fixas: `1-1` até `3-10`. Vitória avança automaticamente; derrota recua uma área. Não há seleção de área.
- Salvamento automático no navegador e, quando conectado, no backend H2.
- Ganhos offline por até 8 horas, com base na última área vencida: 10% da recompensa dessa área por minuto. Não avança áreas nem evolui offline.

## Estrutura

```text
frontend/src/domain/      Regras independentes de React e Phaser
frontend/src/game/        Renderização Phaser
frontend/src/components/ Componentes visuais
frontend/src/services/   API, salvamento e ciclo de vida da sessão
frontend/public/sprites/ Atlases utilizados pela POC
backend/                 Spring Boot, Spring Data JPA, validação e H2
docs/                    Arquitetura, API e regras de jogo
```

## H2 em memória

O perfil `dev` é o padrão. O jogador `local-player` é criado automaticamente, inicialmente sem progresso. O H2 perde todos os dados quando o backend reinicia. O navegador mantém uma cópia local e a envia novamente ao servidor ao recarregar a página.

- Saúde: http://localhost:8080/actuator/health
- Console H2: http://localhost:8080/h2-console
- JDBC: `jdbc:h2:mem:digimon`
- Usuário: `sa`; senha vazia.

Esta API é **somente de desenvolvimento**, com um jogador compartilhado, sem autenticação e limitada a `127.0.0.1`. Ainda recebe checkpoints calculados pelo frontend. A validação estrutural e o controle de revisão não substituem regras de jogo no servidor.

## Verificar

```bash
cd frontend
npm test
npm run build
```

```bash
cd backend
./mvnw verify
```

Os testes verificam combate, evolução, requisitos, gastos, progresso offline, recuo entre áreas e persistência/validação HTTP com H2. GitHub Actions executa os testes e builds em cada PR.

## Próximas entregas

1. Transferir a autoridade de combate, recompensas, evolução e offline para o backend.
2. Substituir o jogador de desenvolvimento por contas e sessões.
3. Refinar sprites e feedback de combate; ampliar os adversários.
4. Migrar para PostgreSQL e introduzir migrações versionadas ao preparar persistência durável.

Os saves da prévia dentro da conversa não são importados automaticamente. Esta versão começa uma nova sessão de desenvolvimento. Veja [arquitetura](docs/architecture.md), [contrato da API](docs/api.md), [regras](docs/game-rules.md) e [créditos dos sprites](frontend/public/sprites/CREDITS.md).
