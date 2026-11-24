# Plano: API para o app mobile (Expo)

Este app Next.js passa a ser também o backend do app mobile (repositório separado).
O web continua funcionando como hoje: server actions + sessão do next-auth por cookie.

## Decisões

| # | Tema | Decisão |
|---|---|---|
| 1 | Onde fica a lógica compartilhada | `lib/finance/*`: funções que recebem `userId` |
| 2 | Token do Google / tokens do mobile | `jose`: verifica o ID token do Google (JWKS) e assina os tokens do mobile |
| 3 | Sessão do mobile | Access token curto (~1h, JWT) + refresh token aleatório salvo no banco **com hash**, um por aparelho, com rotação |
| 4 | Validação das rotas | Zod |
| 5 | Login no mobile | Só Google, por enquanto |

Restrição: **nenhuma migration até o `.env` apontar para o banco de desenvolvimento** (hoje aponta para produção).

## Situação atual

- Autenticação só pelo next-auth v4 ([lib/auth.ts](../lib/auth.ts)): JWT em cookie, sem adapter. Google + senha.
- Usuários na tabela `User` (`googleId`, `passwordHash`). `linkGoogleAccount()` vincula pelo `googleId` ou pelo e-mail verificado.
- As server actions leem o usuário pelo cookie (`getSessionUser` / `requireUser`), então não dá para chamá-las de uma rota com Bearer.
- `/api/integrations/*` é do n8n (`x-api-key`).
- O `middleware.ts` ignora `/api`.

## Arquitetura

```
Web:     página / componente → server action → requireUser()          → lib/finance/* (userId)
Mobile:  app Expo → /api/v1/*  → requireMobileUser(request) + Zod      → lib/finance/* (userId)
n8n:     /api/integrations/*   → validateApiKey()                      → lib/finance/* / lib/push.ts
```

Regras:

- As actions mantêm assinatura, retorno e `revalidatePath`. Só passam a delegar para `lib/finance`.
- `lib/finance/*` **não** tem `'use server'`. Tudo que um arquivo `'use server'` exporta vira um endpoint público.
- O `userId` vem sempre da sessão ou do token, nunca do body ou da query (exceto nas rotas do n8n, protegidas por `x-api-key`).
- Mutações por `id` sempre filtram `{ id, userId }`.
- As rotas `/api/v1` aceitam **só** `Authorization: Bearer`, não o cookie (evita CSRF).
- Os tokens do mobile usam um segredo próprio (`MOBILE_JWT_SECRET`), diferente do `NEXTAUTH_SECRET`.
- `Decimal` sai como `number` e as datas como ISO. O mobile envia `YYYY-MM` / `YYYY-MM-DD`, e o servidor monta as datas como hoje.

## Login com Google no mobile

1. O app usa `@react-native-google-signin/google-signin` (*dev build*) com o `webClientId` = `GOOGLE_CLIENT_ID` e recebe um ID token.
2. `POST /api/v1/auth/google { idToken }`.
3. O backend verifica com `jose` a assinatura (JWKS do Google), o `iss`, o `aud` (contra uma lista de client IDs aceitos) e o `email_verified`. Depois chama o mesmo `linkGoogleAccount()` do web.
4. Responde `{ accessToken, refreshToken, user }`. O app guarda os tokens no `expo-secure-store`.
5. `POST /api/v1/auth/refresh` gira o refresh token. `POST /api/v1/auth/logout` revoga o do aparelho.

Variáveis novas: `MOBILE_JWT_SECRET` e `GOOGLE_MOBILE_CLIENT_IDS` (client IDs de Android e iOS criados no Google Cloud). `GOOGLE_CLIENT_ID` e `NEXTAUTH_SECRET` não mudam.

## Rotas

```
POST   /api/v1/auth/google | /auth/refresh | /auth/logout
GET    /api/v1/me                       PATCH /api/v1/me
GET    /api/v1/dashboard                (gera as recorrências antes, como a página)
GET    /api/v1/transactions?month=&type=&status=&q=&category=&minAmount=&maxAmount=&sort=&page=&pageSize=
POST   /api/v1/transactions             → { transaction, budgetAlert }
PATCH  /api/v1/transactions/:id         (campos e/ou isPaid)
DELETE /api/v1/transactions/:id
GET    /api/v1/categories?month=        POST   PATCH /:id (budget)   DELETE /:id
GET    /api/v1/recurring                POST   PATCH /:id (active)   DELETE /:id
GET    /api/v1/goals                    POST   PATCH /:id   POST /:id/contributions   DELETE /:id
POST   /api/v1/devices                  DELETE /api/v1/devices/:id
POST   /api/integrations/notifications/dispatch   (n8n, x-api-key)
```

Erros: 400 (validação), 401 (token), 404 (não existe ou é de outro usuário), 500.

## Push

Só Android por enquanto (push no iOS exige o Apple Developer Program). No app, Etapa 6 do `PLANO_MOBILE.md`.

### Avisos

Todos às 9h (America/Sao_Paulo), agrupados: um aviso por tipo, nunca um por transação. No pior dia, 3 notificações.

| Aviso | Regra | Frequência | `dedupeKey` |
|---|---|---|---|
| Vence hoje | Despesas pendentes com `date` = hoje (desde a 4j, a data de uma pendente lançada é o vencimento). Ficam fora as lançadas hoje (`createdAt` = hoje), para não avisar do que a pessoa acabou de registrar; ocorrências de recorrência contam mesmo se geradas hoje (senão a regra com dia 1 nunca avisaria) | Diário | `due:<txId>` |
| Atrasadas | Pendentes com competência anterior ao mês atual (mesma regra do selo da 4i), em um resumo ("3 contas atrasadas, R$ X") | Semanal, segunda-feira | `overdue:<ano>-W<semana ISO>` |
| Orçamento | Categoria com limite acima de 80% ou de 100% no mês. Se os dois chegarem juntos, só o de 100% sai (as duas chaves são gravadas) | Checado todo dia; no máximo uma vez por limiar no mês | `budget:<catId>:<YYYY-MM>:<80\|100>` |

- Receitas ("a receber hoje") ficam fora da primeira versão.
- O `budgetAlert` continua aparecendo na hora ao lançar pelo web e pelo app; o push cobre o que entra por fora (n8n, importação da IA, recorrências). Push imediato: Etapa 6 (opcional).
- Preferências no `User.settings` (`notifications.due`, `notifications.overdue`, `notifications.budget`), todas ligadas por padrão. O `dispatch` já respeita; a tela fica para quando existir o `PATCH /me` (6d do app).

### Banco (migration aditiva `add_push_notifications`)

- `PushDevice`: `id`, `expoPushToken` (unique), `platform`, `createdAt`, `lastSeenAt`, `disabledAt`, `userId` e `mobileSessionId` (o token pertence à instalação, como a sessão). Só recebe push o aparelho com `disabledAt` nulo **e** sessão ativa (sem `revokedAt` e sem expirar).
- `NotificationLog`: `kind`, `dedupeKey`, `sentAt`, `tickets` (Json, `[{ deviceId, ticketId }]`), `receiptsCheckedAt`, `userId`; único por `(userId, dedupeKey)`.

### Aparelhos

- `POST /api/v1/devices { expoPushToken, platform: 'android' }`: upsert pelo token (o mesmo celular trocando de conta passa o token para o usuário e a sessão atuais e limpa o `disabledAt`). O app chama a cada abertura com sessão e permissão (atualiza `lastSeenAt` e cobre a troca do token). Responde `200 { device: { id } }`. O `requireMobileUser` passa a devolver também o `sessionId` (`sid` do JWT).
- `DELETE /api/v1/devices/:id`: filtra `{ id, userId }`; 204 ou 404. O app chama antes do `/auth/logout`.
- Logout: `revokeMobileSession` também preenche `disabledAt` nos aparelhos da sessão (vale mesmo se o app estiver offline e não chamar o `DELETE`).

### Envio

- Quem envia para a Expo é a API (`lib/push.ts`): `fetch` para `https://exp.host/--/api/v2/push/send`, em lotes de 100, sem SDK, com `Authorization: Bearer EXPO_ACCESS_TOKEN`. O Enhanced Security está ligado na conta ES Labs do expo.dev, então a Expo recusa envio sem o token. O token é de um robô com o papel Viewer, que basta para enviar push, e fica só no `.env` e na VPS.
- `DeviceNotRegistered` no ticket desativa o aparelho na hora. No Android o erro costuma vir no recibo, horas depois: cada `dispatch` confere primeiro os recibos dos envios anteriores (pelos `tickets` do log) e desativa os aparelhos com `DeviceNotRegistered`.
- Sem envio duplicado: o log é gravado **antes** de enviar (a chave única faz um retry pular o aviso); se o envio falhar inteiro, o log é apagado e o aviso volta na próxima execução.
- A notificação leva `data.url` para o app abrir a tela certa (pendentes → Transações filtrada; orçamento → Categorias).

### `dispatch` (o n8n chama às 9h e às 9h30)

`POST /api/integrations/notifications/dispatch`, com `x-api-key` = `N8N_INTERNAL_SECRET` (o mesmo das outras rotas do n8n). `?dryRun=1` devolve o que seria enviado, sem enviar nem gravar log.

1. confere os recibos dos envios anteriores;
2. roda `generateForUser` para os usuários com aparelho ativo e regra ativa (hoje as recorrências só são geradas quando o usuário abre uma página);
3. calcula os três avisos, respeitando as preferências;
4. grava o log, envia e responde `{ dryRun, users, notifications, sent, failed, skipped, disabled, receiptsChecked }`.

### n8n

Schedule Trigger diário às 09:00 e às 09:30 (fuso do workflow `America/Sao_Paulo`). O disparo das 9h30 confere os recibos do envio das 9h, que ficam prontos depois de 15 min, e reenvia o que falhou inteiro. A chave única do log impede repetir um aviso já enviado. Os dois disparos vão para o mesmo HTTP Request `POST` no `dispatch` com credencial **Header Auth** (`x-api-key`), timeout de 60 s e "Retry on Fail" 2× (seguro por causa do log). Se o n8n estiver na mesma rede Docker da API, usar o endereço interno do container. Opcional: Error Workflow avisando falha.

## Riscos e cuidados

- Extrair a lógica um domínio por vez, sem mudar o comportamento. Testar as telas web a cada etapa.
- Migrations só aditivas (tabelas novas), aplicadas primeiro no banco de dev e em produção junto com o deploy.
- Não alterar `GOOGLE_CLIENT_ID`, `NEXTAUTH_SECRET` nem o `middleware.ts`.
- O chat e a importação por IA gastam a cota do Gemini: só com autenticação e limite de uso.
- Não há testes automatizados. Cada etapa é verificada com `npm run lint` + `npm run build` + teste manual.

## Etapas

Cada etapa termina com lint, build, a lista de arquivos e uma sugestão de commit.

- [x] **1a** Extrair transações e categorias para `lib/finance` (sem mudar comportamento)
- [x] **1b** Extrair recorrências
- [x] **1c** Extrair metas e perfil; `chat.ts` passa a usar os services
- [x] **2a** Migration `MobileSession` (refresh tokens), **só depois do banco de dev**
- [x] **2b** Instalar `jose`; criar os helpers de token e o `requireMobileUser`; exportar `linkGoogleAccount`
- [x] **2c** Rotas `auth/google`, `auth/refresh`, `auth/logout`, `GET /me` (Zod antecipado para cá)
  - Pendências da Etapa 2:
    - [x] Login real pelo Google: testado de ponta a ponta pelo app mobile (login, refresh com rotação sob 3 chamadas simultâneas, logout revogando a sessão e `/me`)
    - [ ] Detecção de reuso do refresh token (guardar o hash anterior e revogar a sessão se um token já trocado voltar)
    - [ ] Deploy: aplicar a migration `add_mobile_session` no banco `finance` junto com o deploy e definir `MOBILE_JWT_SECRET` e `GOOGLE_MOBILE_CLIENT_IDS` no ambiente da VPS
- [x] **3** Rotas de leitura (dashboard, transactions, categories, recurring, goals): em uso pelo app mobile
- [x] **4** Rotas de escrita com validação (Zod já instalado na 2c). Contrato levantado pelo app em `finance-mobile/docs/ESCRITA_BACKEND.md`: 201 com o recurso no formato da leitura, 200 ao alterar, 204 ao excluir, 404 para id inexistente ou de outro usuário
  - [x] **4a** Mês de competência padrão no fuso do app (`currentMonthISO(APP_TIME_ZONE)`) em `createTransaction`
  - [x] **4b** Percentual do orçamento arredondado em 2 casas (`getCategoriesWithBudget` e `getBudgetStatus`), antes de comparar com 80%
  - [x] **4c** Schemas Zod compartilhados: valor (> 0, até 2 casas, até 99999999.99), data `YYYY-MM-DD` válida, mês `YYYY-MM`
  - [x] **4d** `POST /transactions` → `201 { transaction, budgetAlert }`
  - [x] **4e** `PATCH /transactions/:id` (edição completa ou `{ isPaid }`) e `DELETE /transactions/:id`
  - [x] **4f** `PATCH /categories/:id` (`budget`; `null` remove o limite)
  - [x] **4g** `POST /recurring`, `PATCH /recurring/:id` (`active`) e `DELETE /recurring/:id`
  - [x] **4h** `POST /goals` e `POST /goals/:id/contributions` (aporte > 0)
  - Depois (o app ainda não usa):
    - [ ] `POST /categories` (nome repetido → 409; cor validada em hex) e `DELETE /categories/:id`
    - [ ] `PATCH /goals/:id`, `DELETE /goals/:id` e `PATCH /me`
    - [ ] Mesma cor padrão para a categoria nova em `createTransaction`, `updateTransaction` e `createRecurringRule`
- [ ] **4i** Saldo pelo pago (contrato em `finance-mobile/docs/ESCRITA_BACKEND.md`, "Depois da escrita: saldo pelo pago"; no app, item 5g do `PLANO_MOBILE.md`)
  - Regra: receitas, despesas, gráfico mensal e limites das categorias continuam por competência, contando tudo. O saldo atual (inclusive "meses anteriores" da Visão Geral e o `carryOver` de Transações) conta só o pago. Pendentes = não pagas com competência até o mês atual; as de meses anteriores levam o selo "atrasada", e meses futuros ficam fora. Previsto = saldo atual + a receber − a pagar
  - [x] `getDashboardTotals` agrupa também por `isPaid` e devolve o campo em cada total (só acréscimo: nenhum número muda)
  - [ ] Produção: repetir a medição de pendentes (só leitura) antes de publicar; se houver pendentes com competência anterior à virada, script de dados com autorização e backup (medição de 22/11/2026: 0 pendentes)
  - Decisão: "saldo" é sempre só o pago, em qualquer tela (Visão Geral, Transações, web e app). Receitas e despesas de Transações continuam por competência, contando tudo
  - [x] `getTransactionsPage`: `carryOver` só com `isPaid: true` e `totals.balance` novo (`carryOver` + recebido − pago do conjunto filtrado); o card "saldo" de Transações do web usa o `balance`
  - [x] Visão Geral do web com saldo pelo pago, card de pendentes (a pagar e a receber, com "atrasada") e saldo previsto
  - Publicar os dois itens acima junto com o app
  - [x] Depois: selo "atrasada" na lista de Transações do web (`TransactionStatus`), junto do "a pagar · marcar", que continua tocável; mês atual pelo `currentMonthISO(APP_TIME_ZONE)`
- [x] **4j** Lançar já pendente (no app, item 5h do `PLANO_MOBILE.md`). Sem migration: a coluna `isPaid` e o default `true` já existem
  - [x] **(a)** Schema e lib: `isPaid: z.boolean().optional()` no `transactionBodySchema`, sem `.default(true)` (o schema é o mesmo do POST e do PATCH; com o default, uma edição sem o campo marcaria como paga uma pendente). `createTransaction` grava `data.isPaid ?? true`; `updateTransaction` repassa `data.isPaid` e, sem o campo, mantém o valor atual
  - [x] **(b)** `PATCH /transactions/:id`: só é "marcar/desmarcar" quando a única chave do body for `isPaid`; qualquer outro body vai para a edição completa (antes, uma edição com `isPaid` dava 400 no `paidSchema` estrito). A resposta e o `budgetAlert` não mudam
  - [x] **(c)** Campo "Situação" no `TransactionDialog` do web: dois botões com `aria-pressed`, como RECEITA/DESPESA (PAGO / A PAGAR na despesa, RECEBIDO / A RECEBER na receita; o lado pendente usa os tokens `warning` do `TransactionStatus`). Último campo, antes de CANCELAR/SALVAR; `true` ao lançar, o valor atual ao editar; o payload sempre leva o campo
  - [x] **(d)** "Voltar para pendente" no menu "…" do `TransactionRowActions`, só nas pagas, com `setTransactionPaid(id, false)`, toast e "Desfazer". `setTransactionPaid` passa a revalidar também `/Dashboard` (o saldo depende do `isPaid` desde a 4i)
  - Continuam nascendo pagos, sem mudança: chat (server action sem `isPaid`), rota de integração (contrato externo, default do banco), importação da IA (`createMany`) e recorrências (regra própria)
  - Publicar a API antes do app: no backend antigo o POST descarta o `isPaid` (entra como pago) e a edição com `isPaid` dá 400
  - Fora do escopo: a server action `createTransaction(data: any)` repassa o objeto sem validar (já existia)
- [ ] **5** Notificações push (desenho na seção "Push"; no app, Etapa 6 do `PLANO_MOBILE.md`)
  - [x] **5a** Migration `add_push_notifications` (`PushDevice` + `NotificationLog`): primeiro no `finance_dev`, com autorização
  - [x] **5b** `POST /devices` e `DELETE /devices/:id`; `requireMobileUser` devolve o `sessionId`; logout desativa os aparelhos da sessão
  - [x] **5c** `lib/push.ts`: envio em lotes, tickets e recibos, `DeviceNotRegistered` desativa o aparelho; `EXPO_ACCESS_TOKEN`
  - [x] **5d** `validateApiKey` com `crypto.timingSafeEqual` (commit `fix` separado, antes do `dispatch`)
  - [x] **5e** Rota `dispatch` (vence hoje, atrasadas, orçamento) com `dryRun`
    - Testado de ponta a ponta pelo app: o dispatch real chegou a dois aparelhos e a chave única pulou o aviso repetido. O Enhanced Security está ligado e o token é do robô com papel Viewer
  - [ ] **5f** Workflow diário no n8n, com disparos às 9h e às 9h30 (ver "n8n" na seção "Push")
    - Depende da publicação: o n8n da VPS chama a API de produção, então a migration, o `EXPO_ACCESS_TOKEN` e a API precisam estar no ar antes
  - Deploy: migration `add_push_notifications` em produção depois da `add_mobile_session` (o `PushDevice` depende da `MobileSession`), `EXPO_ACCESS_TOKEN` na VPS; API no ar antes da build do app com push
- [ ] **6** (opcional) Push imediato de orçamento; chat e importação no mobile
