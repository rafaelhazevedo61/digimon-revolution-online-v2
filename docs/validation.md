# Validação da entrega inicial

- Frontend: 11 testes de domínio com Vitest; build de produção com TypeScript e Vite.
- Backend: 3 testes HTTP com MockMvc, Spring Boot, JPA e H2; `verify` e empacotamento concluídos com Java 21.
- Maven Wrapper: inicialização conferida com Maven 3.9.11 e Java 21.
- Navegador Chromium: Canvas Phaser carregado sem erros de JavaScript; layout sem rolagem horizontal em 320 px e 390 px.
- Integração real local: vitória gerando recursos, checkpoint local e HTTP, recuperação offline, ausência de crédito duplicado ao recarregar e restauração a partir do navegador após reiniciar o backend H2.

Os testes automatizados ficam no repositório e rodam no CI. A checagem visual e a integração completa foram executadas no ambiente de desenvolvimento; ainda não há suíte Playwright no CI.

Ainda requer testes em aparelhos Android/iOS reais, refinamento dos sprites e balanceamento por sessões mais longas. O frontend ainda calcula o combate; não foi validada autoridade de servidor porque ela não faz parte desta entrega.
