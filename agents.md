# Diretrizes do Repositório

Estas instruções se aplicam a todo o repositório. Preserve e siga instruções mais específicas caso exista um `AGENTS.md` em um subdiretório.

## Contexto técnico

O Vero Finc é organizado em duas aplicações TypeScript:

- `backend/`: API NestJS com MongoDB/Mongoose, autenticação JWT/Firebase e testes unitários com Vitest.
- `frontend/`: aplicação React 18 com Vite, Tailwind CSS, Axios, Chart.js e Firebase.
- `docker-compose.yml`: infraestrutura local e execução do MongoDB e do backend.

No backend, o código é organizado por domínio em `backend/src/modules/<dominio>`, os schemas ficam em `backend/src/entities` e o acesso a dados em `backend/src/repositories`. No frontend, mantenha componentes reutilizáveis em `frontend/src/components`, páginas em `frontend/src/pages`, integrações HTTP em `frontend/src/services`, tipos compartilhados em `frontend/src/types` e regras puras em `frontend/src/utils`.

Antes de alterar código, identifique os padrões já usados pelo domínio e seus contratos, validações, entidades, repositórios, serviços e integrações. Prefira consistência com o código existente a introduzir uma nova abstração sem necessidade.

## Prioridades de engenharia

Considere, nesta ordem:

1. Correção funcional e preservação dos contratos existentes.
2. Segurança, validação de entrada e proteção de dados sensíveis.
3. Clareza, simplicidade e manutenibilidade.
4. Testabilidade e isolamento de dependências.
5. Acessibilidade e experiência consistente no frontend.
6. Performance e escalabilidade, sem otimização prematura.

Implemente a solução mais simples que resolva integralmente o requisito. Evite overengineering, abstrações prematuras e mudanças fora do escopo.

## Backend: arquitetura e responsabilidades

- Controllers devem tratar o contrato HTTP, validar e converter parâmetros simples e delegar aos services. Não coloque regras de negócio em controllers.
- Services devem concentrar regras de negócio e orquestração do fluxo.
- Repositories devem encapsular o acesso ao Mongoose e retornar contratos previsíveis.
- Entidades/schemas devem representar a persistência; entradas públicas devem usar tipos ou DTOs claros e validação explícita.
- Preserve o isolamento dos dados por usuário em todas as consultas e mutações protegidas.
- Preserve guards, decorators públicos, autenticação JWT/Firebase e limites de requisição ao alterar endpoints.
- Evite consultas repetidas e busque somente os dados necessários.
- Valores monetários persistidos em centavos devem continuar sendo convertidos apenas nas fronteiras apropriadas. Não misture reais e centavos numa mesma regra.
- Não altere contratos da API de forma incompatível sem uma estratégia explícita de transição e a atualização coordenada do frontend.
- Evite `any`. Quando uma integração não oferecer tipos adequados, crie interfaces locais ou use tipos estreitos e documentados.

## Frontend: componentes e experiência

- Mantenha páginas focadas em composição e fluxo; extraia UI reutilizável para componentes e chamadas remotas para services.
- Reutilize os tokens e classes do design system existentes em `frontend/src/index.css` e `frontend/tailwind.config.js`.
- Preserve a linguagem visual atual: títulos em Playfair Display, texto de interface em IBM Plex Sans, números tabulares em IBM Plex Mono, paleta navy/gold/bone, cards sem sombra e layout responsivo de largura total.
- Trate explicitamente os estados de carregamento, vazio, sucesso e erro. Mensagens ao usuário devem ser claras e não expor detalhes internos.
- Preserve navegação por teclado, foco visível, labels de formulário, semântica HTML e contraste adequado.
- Centralize tipos de domínio em `frontend/src/types` quando compartilhados entre páginas, componentes ou services.
- Não duplique regras financeiras entre telas. Prefira funções puras em `frontend/src/utils` quando a lógica for reutilizável e independente da UI.
- Ao alterar um contrato da API, atualize no mesmo escopo os services, tipos, consumidores e tratamento de erros correspondentes.

## Segurança e resiliência

- Nunca confie em dados recebidos do cliente; valide e normalize entradas no backend.
- Não exponha stack traces, tokens, senhas, chaves, dados de infraestrutura ou PII em respostas, logs ou mensagens da interface.
- Não inclua segredos, credenciais nem valores reais de produção no código, testes ou documentação.
- Variáveis sensíveis devem vir do ambiente. Não adote os valores padrão do Docker como credenciais de produção.
- Integrações externas devem considerar indisponibilidade, timeout e falhas parciais.
- Use validações antecipadas e early returns para reduzir estados inválidos e aninhamento excessivo.

## Testes e regressão

Testes fazem parte da implementação:

- Toda nova regra de backend deve incluir testes que comprovem seu contrato público, casos de sucesso, limites e falhas relevantes.
- Todo bug corrigido deve incluir ao menos um teste regressivo que falhe sem a correção e passe com ela.
- Preserve cobertura mínima de 80% no código alterado; busque cobertura maior para regras financeiras, autenticação e isolamento por usuário.
- Teste comportamento observável, não detalhes internos de implementação.
- Use dados estáticos e previsíveis. Não use `Math.random`, UUIDs aleatórios ou o relógio real sem controle explícito.
- Quando datas ou horários influenciarem o resultado, use fake timers e restaure o estado após o teste.
- Em testes unitários, mocke banco, rede, Firebase, filesystem, relógio, geradores de identificadores e demais dependências externas.
- Nenhum teste unitário pode depender de internet, serviços locais, banco compartilhado, ordem de execução ou estado deixado por outro teste.
- Restaure mocks, timers, spies e variáveis de ambiente após cada cenário.
- Não enfraqueça asserções, remova cenários nem adicione `skip` para fazer a suíte passar.
- O frontend ainda não possui uma suíte automatizada configurada. Para lógica nova relevante, prefira funções puras e considere adicionar testes somente com infraestrutura compatível com o projeto; não introduza um framework inteiro sem que o escopo justifique.

Durante o desenvolvimento, execute primeiro o arquivo de teste ou módulo afetado. Antes da entrega, execute as verificações regressivas aplicáveis.

## Comandos de desenvolvimento e verificação

Execute os comandos a partir da aplicação correspondente.

Backend (`backend/`):

```bash
npm run start:dev
npm test -- --runInBand
npm run test:coverage -- --runInBand
npm run build
```

Frontend (`frontend/`):

```bash
npm run dev
npm run lint
npm run build
```

Infraestrutura, a partir da raiz:

```bash
docker compose up -d
docker compose logs -f
docker compose down
```

`docker compose down -v` remove também os dados locais persistidos e só deve ser executado quando essa perda for explicitamente desejada.

## Qualidade e escopo da mudança

- Preserve alterações preexistentes do usuário e não reformate arquivos sem relação com a tarefa.
- Evite mudanças amplas quando uma correção localizada for suficiente.
- Atualize consumidores, validações, tipos, documentação e testes sempre que um contrato mudar.
- Comentários devem explicar decisões, restrições ou motivos; não repita o que o código já expressa.
- Registre logs com contexto útil, sem informações sensíveis.
- Não edite artefatos gerados, dependências instaladas ou arquivos de build (`dist`, `coverage`, `node_modules`).
- Para tarefas médias ou grandes, avalie situação atual, requisito, impacto, riscos e estratégia incremental antes de implementar.

## Critérios de conclusão

Uma alteração somente está concluída quando:

- o comportamento solicitado foi implementado;
- os contratos afetados permanecem consistentes entre backend e frontend;
- testes novos ou regressivos foram adicionados quando aplicáveis;
- testes, lint e builds relevantes foram executados e aprovados;
- a cobertura do código de backend alterado atende ao mínimo de 80%;
- não há chamadas externas acidentais, dados sensíveis, artefatos temporários ou mudanças fora do escopo.

Ao entregar, informe resumidamente os arquivos alterados, as verificações executadas e seus resultados. Se alguma verificação não puder ser executada, explique o motivo.
