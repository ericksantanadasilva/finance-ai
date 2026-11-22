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

- `PushDevice`: `id`, `userId`, `expoPushToken` (unique), `platform`, `createdAt`, `lastSeenAt`, `disabledAt`.
- `NotificationLog`: `userId`, `kind`, `dedupeKey` (unique, ex.: `budget:<catId>:2026-11:80`), `sentAt`. Evita repetir o mesmo aviso.
- Preferências de aviso no `User.settings` (Json, já existe).
- `lib/push.ts`: `fetch` para `https://exp.host/--/api/v2/push/send`, em lotes de 100, sem SDK. Ao receber `DeviceNotRegistered`, desativa o token.
- `dispatch` (o n8n chama uma vez por dia):
  1. roda `generateForUser` para cada usuário com regra ativa (hoje as recorrências só são geradas quando o usuário abre uma página);
  2. recorrências com `isPaid = false` e `date` entre hoje e hoje + N dias;
  3. categorias acima de 80% / 100% do orçamento no mês;
  4. consulta o log, envia e responde `{ sent, skipped }`.

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
- [ ] **4** Rotas de escrita com validação (Zod já instalado na 2c). Contrato levantado pelo app em `finance-mobile/docs/ESCRITA_BACKEND.md`: 201 com o recurso no formato da leitura, 200 ao alterar, 204 ao excluir, 404 para id inexistente ou de outro usuário
  - [x] **4a** Mês de competência padrão no fuso do app (`currentMonthISO(APP_TIME_ZONE)`) em `createTransaction`
  - [x] **4b** Percentual do orçamento arredondado em 2 casas (`getCategoriesWithBudget` e `getBudgetStatus`), antes de comparar com 80%
  - [x] **4c** Schemas Zod compartilhados: valor (> 0, até 2 casas, até 99999999.99), data `YYYY-MM-DD` válida, mês `YYYY-MM`
  - [x] **4d** `POST /transactions` → `201 { transaction, budgetAlert }`
  - [x] **4e** `PATCH /transactions/:id` (edição completa ou `{ isPaid }`) e `DELETE /transactions/:id`
  - [x] **4f** `PATCH /categories/:id` (`budget`; `null` remove o limite)
  - [ ] **4g** `POST /recurring`, `PATCH /recurring/:id` (`active`) e `DELETE /recurring/:id`
  - [ ] **4h** `POST /goals` e `POST /goals/:id/contributions` (aporte > 0)
  - Depois (o app ainda não usa):
    - [ ] `POST /categories` (nome repetido → 409; cor validada em hex) e `DELETE /categories/:id`
    - [ ] `PATCH /goals/:id`, `DELETE /goals/:id` e `PATCH /me`
    - [ ] Mesma cor padrão para a categoria nova em `createTransaction`, `updateTransaction` e `createRecurringRule`
- [ ] **5a** Migration `PushDevice` + `NotificationLog`; rotas `/devices`
- [ ] **5b** `lib/push.ts` + rota `dispatch`
- [ ] **5c** Workflow diário no n8n
- [ ] **6** (opcional) Push imediato de orçamento; chat e importação no mobile
