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
| 5 | Login no mobile | Google e e-mail e senha (`POST /auth/login`, mesma checagem do web, com limite de tentativas) |
| 6 | Excluir categoria | Arquivar (soft delete). As transações antigas continuam mostrando a categoria (nome e cor), e os relatórios dos meses passados não mudam. A arquivada some das listas de escolha e não pode ser usada em transações novas nem em recorrências novas |
| 7 | Criar categoria com o nome de uma arquivada | Reativa a mesma linha. O usuário escolhe a cor de novo, e a cor nova vale também para as transações antigas. A reativada começa sem limite de orçamento |
| 8 | Nomes iguais de categoria | A comparação ignora maiúsculas e minúsculas e os espaços nas pontas |
| 9 | Editar recorrência | O que já foi lançado fica como está; só as próximas ocorrências usam os dados novos. Mudar o dia ou o início não pode duplicar nem pular a ocorrência do mês atual |
| 10 | Onde valem as decisões 6 a 9 | No web e na API mobile, com a lógica compartilhada em `lib/finance` |
| 11 | Nome de uma arquivada usado sem criar a categoria (lançamento, chat, importação, n8n, recorrência) | Reativa mantendo a cor antiga, sem limite |
| 12 | Recorrência ativa cuja categoria é arquivada | Continua gerando com ela. O aviso de arquivamento diz quantas recorrências usam a categoria |
| 13 | Editar transação ou recorrência que já está numa categoria arquivada | Pode manter a categoria atual, mas não trocar para outra arquivada. O seletor mostra a atual como "arquivada" |
| 14 | Filtro de categoria em Transações (web e `categories` do `GET /transactions`) | Inclui as arquivadas, para achar o histórico |
| 15 | Limite digitado ao reativar pelo `CategoryDialog` | Vale o valor digitado (vazio = sem limite). O limite antigo nunca volta |
| 16 | Grafia ao reativar | Passa a valer o nome como foi digitado agora, inclusive nas transações antigas |
| 17 | Mês atual na edição de recorrência | Conta como já lançado: antes de gravar, as ocorrências até o mês atual são geradas com os dados antigos, e a edição vale do próximo mês em diante. A transação do mês se ajusta à mão |
| 18 | Mudar o início de uma recorrência que já lançou | Só para um mês depois do último lançado; um mês anterior dá 400. Os meses que ficaram para trás não são lançados |

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

## Login por e-mail e senha no mobile

1. `POST /api/v1/auth/login { email, password, deviceName?, platform? }`.
2. Usa a mesma `verifyPasswordLogin()` do login web ([lib/auth.ts](../lib/auth.ts)). O bcrypt roda sempre (contra um hash falso de custo 10 quando o e-mail não existe ou a conta não tem senha), para o tempo de resposta não revelar o caso.
3. Respostas: 200 igual ao do Google (`{ accessToken, refreshToken, expiresIn, user }`); 401 `Invalid credentials` para e-mail inexistente, senha errada e conta sem senha; 429 `Too many attempts` com `Retry-After`; 400 de validação.
4. Limite de tentativas ([lib/login-rate-limit.ts](../lib/login-rate-limit.ts)), o mesmo contador do web: 10 falhas por e-mail e 30 por IP em janelas de 15 min. A falha conta mesmo para e-mail inexistente, e um login certo zera o contador do e-mail. Fica em memória (`globalThis`), então um restart zera os contadores.
5. IP: `CF-Connecting-IP` (a Cloudflare está na frente) e, sem ele, `X-Real-IP`. Sem nenhum dos dois, não há limite por IP.
6. Nem a senha nem o e-mail vão para os logs.

## Rotas

```
POST   /api/v1/auth/google | /auth/login | /auth/refresh | /auth/logout
GET    /api/v1/me                       PATCH /api/v1/me
GET    /api/v1/dashboard                (gera as recorrências antes, como a página)
GET    /api/v1/transactions?month=&type=&status=&q=&category=&minAmount=&maxAmount=&sort=&page=&pageSize=
POST   /api/v1/transactions             → { transaction, budgetAlert }
PATCH  /api/v1/transactions/:id         (campos e/ou isPaid)
DELETE /api/v1/transactions/:id
GET    /api/v1/categories?month=        POST   PATCH /:id (budget, color)   DELETE /:id (arquiva)
GET    /api/v1/recurring                POST   PATCH /:id (active, ou edição com active opcional)   DELETE /:id
GET    /api/v1/goals                    POST   PATCH /:id   POST /:id/contributions   DELETE /:id
POST   /api/v1/devices                  DELETE /api/v1/devices/:id
POST   /api/integrations/notifications/dispatch   (n8n, x-api-key)
```

Erros: 400 (validação), 401 (token), 404 (não existe ou é de outro usuário), 429 (login: muitas tentativas), 500.

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

## Publicação

Leva a `api-mobile` para a produção (banco `finance` e container `finance-app` na VPS).

Situação em 24/11/2026:
- O `finance-app` sobe com `docker-entrypoint.sh` e `npm start`, sem `migrate deploy`: as migrations são aplicadas à mão.
- Na `_prisma_migrations` de produção estão as 4 migrations antigas, todas aplicadas e nenhuma desfeita. Nenhuma das 3 novas.

Estratégia: aplicar as 3 migrations à mão **antes** do deploy. Todas são aditivas, então o código atual continua funcionando com elas:

| Migration | O que faz |
|---|---|
| `add_mobile_session` | Cria a tabela `MobileSession` |
| `add_goal_created_at` | Cria a coluna `Goal.createdAt`, com default, e preenche a data das metas existentes a partir do id |
| `add_push_notifications` | Cria as tabelas `PushDevice` e `NotificationLog` |

As variáveis de ambiente estão no [.env.example](../.env.example). As novas são `MOBILE_JWT_SECRET`, `GOOGLE_MOBILE_CLIENT_IDS` e `EXPO_ACCESS_TOKEN`.

Nenhum comando abaixo mostra valor de segredo. Para conferir uma variável, verifique só se ela existe e o tamanho.

Placeholders usados abaixo:
- `<postgres>`: nome do container do Postgres;
- `<usuario>`: usuário do banco;
- `<dominio>`: domínio público do site.

### 1. Backup do banco de produção

- **Ação** (na VPS), primeiro o dump e depois a cópia:
  ```sh
  docker exec <postgres> pg_dump -U <usuario> -Fc finance > finance-pre-mobile-AAAAMMDD.dump
  ```
  Depois copie o arquivo para fora da VPS com `scp`. O `pg_dump` de dentro do container tem a mesma versão do servidor.
- **Testar que é restaurável:** restaure numa base descartável e compare a contagem das tabelas com a produção.
  ```sh
  docker exec <postgres> createdb -U <usuario> finance_restore_test
  docker exec -i <postgres> pg_restore -U <usuario> -d finance_restore_test --no-owner < finance-pre-mobile-AAAAMMDD.dump
  ```
  Rode esta consulta nas duas bases. Os números devem bater:
  ```sql
  SELECT (SELECT count(*) FROM "User") AS users,
         (SELECT count(*) FROM "Transaction") AS transactions,
         (SELECT count(*) FROM "Goal") AS goals,
         (SELECT count(*) FROM _prisma_migrations) AS migrations;
  ```
  Depois apague só a base de teste: `docker exec <postgres> dropdb -U <usuario> finance_restore_test`.
- **Deu certo se:** a restauração terminou sem erro, as contagens bateram e o dump está guardado fora da VPS.
- **Voltar atrás:** não altera nada. Se a restauração falhar, não siga adiante.

### 2. Medição de pendentes (só leitura)

A 4i mede isto porque o saldo passou a contar só o que está pago. Pendentes de meses anteriores passam a aparecer como "atrasada" e saem do saldo atual.

- **Ação** no banco `finance`:
  ```sql
  SELECT type, count(*), sum(amount)
  FROM "Transaction"
  WHERE "isPaid" = false
    AND "referenceDate" < date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo')
  GROUP BY type;
  ```
- **Deu certo se:** a consulta não voltar nenhuma linha, como na medição de 22/11/2026. Se voltar alguma, pare: decidir o que fazer com essas pendentes antes do deploy, com um script de dados autorizado e depois do backup.
- **Voltar atrás:** não altera nada.

### 3. Merge por PR

- **Ação:**
  ```sh
  gh pr create --base main --head api-mobile
  ```
  Depois revise e faça o merge (sem squash, para manter os commits das etapas).
- **Deu certo se:** a `main` tem as 3 migrations em `prisma/migrations`. Confirme também que o merge não publicou nada sozinho: o deploy é manual.
- **Voltar atrás:** antes do deploy, `git revert -m 1 <merge>` na `main`. O banco ainda não mudou.

### 4. Migrations à mão (antes do deploy)

- **Ação:** a partir da `main` atualizada, com o túnel aberto (PowerShell):
  ```powershell
  $env:DATABASE_URL = '<url do banco finance>'
  npx prisma migrate status
  ```
  Ele deve listar exatamente as 3 migrations novas como pendentes. Então aplique e limpe a variável:
  ```powershell
  npx prisma migrate deploy
  Remove-Item Env:DATABASE_URL
  ```
  O `DATABASE_URL` vale só nesse terminal, e o `.env` continua no `finance_dev`. Antes de rodar, confira que o host e o nome do banco são do `finance`. Terminadas as migrations, **feche esse terminal**, para nenhum comando seguinte cair na produção por engano.
- **Deu certo se:**
  - o `migrate status` responde "Database schema is up to date";
  - a `_prisma_migrations` tem as 7 migrations com `finished_at` preenchido e `rolled_back_at` vazio;
  - o site atual, ainda com o código antigo, continua abrindo Visão Geral, Transações e Metas.
- **Voltar atrás:**
  - **Se uma migration falhar no meio:** ela fica com `finished_at` vazio. Corrija a causa e rode `npx prisma migrate resolve --rolled-back <nome>` antes de tentar de novo.
  - **Para desfazer tudo:** em geral não é preciso, porque o código antigo ignora as tabelas novas. Se for, faça só antes de o app criar sessões, e com confirmação, porque é destrutivo:
    ```sql
    BEGIN;
    DROP TABLE "NotificationLog";
    DROP TABLE "PushDevice";
    DROP TABLE "MobileSession";
    ALTER TABLE "Goal" DROP COLUMN "createdAt";
    DELETE FROM _prisma_migrations WHERE migration_name IN (
      '20261120214605_add_mobile_session',
      '20261122120000_add_goal_created_at',
      '20261123194040_add_push_notifications');
    COMMIT;
    ```

### 5. Variáveis novas na VPS

- **Ação:** no ambiente do `finance-app`, acrescente as três variáveis:
  - `MOBILE_JWT_SECRET`: **gerado novo para a produção, diferente do de dev**. Gere direto na VPS, gravando no arquivo de ambiente sem mostrar o valor na tela:
    ```sh
    printf 'MOBILE_JWT_SECRET=%s\n' "$(openssl rand -hex 32)" >> <arquivo de ambiente do finance-app>
    ```
    O `-hex 32` gera 64 caracteres, sem os símbolos do base64 que confundem o arquivo `.env`;
  - `GOOGLE_MOBILE_CLIENT_IDS`, os IDs Android/iOS separados por vírgula;
  - `EXPO_ACCESS_TOKEN`, o token do robô Viewer.

  Não mexa no `GOOGLE_CLIENT_ID` nem no `NEXTAUTH_SECRET`. Elas só passam a valer quando o container for recriado, no passo 7.
- **Deu certo se,** depois do passo 7, este comando mostrar `ok` nas três e um tamanho de 32 ou mais no `MOBILE_JWT_SECRET`:
  ```sh
  docker exec finance-app sh -c 'for v in MOBILE_JWT_SECRET GOOGLE_MOBILE_CLIENT_IDS EXPO_ACCESS_TOKEN; do printenv $v >/dev/null && echo "$v ok" || echo "$v FALTA"; done; printenv MOBILE_JWT_SECRET | tr -d "\n" | wc -c'
  ```
- **Voltar atrás:** remova as linhas. O código antigo não as lê.

### 6. HTTPS da API

A API é o mesmo app Next, no mesmo domínio do web (`https://<dominio>/api/v1/*`). Não precisa de host nem porta nova no proxy.

- **Ação:** confira que o proxy encaminha `/api/*` para o `finance-app` com certificado válido. O app deve usar `https://<dominio>` como base da API em produção; isso é configurado no repositório do app.
- **Deu certo se:**
  - **Antes do deploy:** `curl -sI https://<dominio>/api/auth/providers` responde 200, sem erro de certificado.
  - **Depois do deploy:** `curl -s -o /dev/null -w '%{http_code}' https://<dominio>/api/v1/me` responde 401. Isso mostra que a rota existe e que o header `Authorization` chega ao app.
- **Voltar atrás:** sem mudança no proxy, não há o que desfazer. Se precisar mexer no proxy, anote a configuração antes.

### 7. Deploy

- **Ação:**
  1. Guarde a imagem atual para poder voltar:
     ```sh
     docker inspect --format '{{.Image}}' finance-app
     docker tag <id> finance-app:pre-mobile
     ```
  2. Faça o build a partir da `main` e recrie o `finance-app` pelo procedimento de sempre. O `npm run build` já roda o `prisma generate`.
- **Deu certo se:**
  - `docker logs --tail 50 finance-app` não mostra erro na subida;
  - o comando do passo 5 dá `ok` nas três variáveis;
  - o passo 6 (depois do deploy) responde 401;
  - este comando responde 200 com `notifications: []`, porque ainda não há aparelhos em produção:
    ```sh
    curl -s -X POST -H "x-api-key: $N8N_INTERNAL_SECRET" "https://<dominio>/api/integrations/notifications/dispatch?dryRun=1"
    ```
- **Voltar atrás:** recrie o container a partir de `finance-app:pre-mobile`, com o mesmo ambiente e a mesma rede. As migrations podem ficar, porque o código antigo funciona com elas.

### 8. Conferência do web

- **Ação:** no site de produção, confira:
  - login pelo Google e por senha;
  - **Visão Geral:** saldo pelo pago, card de pendentes e saldo previsto;
  - **Transações:** campo "Situação" no diálogo, "voltar para pendente" no menu, selo "atrasada" e o card de saldo;
  - **Metas e chat:** continuam abrindo e respondendo;
  - em 360px, sem rolagem lateral.
- **Deu certo se:** tudo funciona e os números da Visão Geral batem com os de antes do deploy, já que não há pendentes atrasadas (passo 2).
- **Voltar atrás:** a imagem `finance-app:pre-mobile` (passo 7).

### 9. n8n

Nesta parte, a API se testa só pelo terminal: o 401 do passo 6 e o `dryRun` do passo 7. O teste do app contra a produção fica para a Parte 3, com a build de produção, a partir de 25/11. Até lá não há aparelhos registrados em produção.

- **Ação:** crie o workflow da 5f conforme a seção "n8n", com disparos às 9h e às 9h30.
  - Rode primeiro à mão com `?dryRun=1`, depois sem.
  - Só então ative o workflow. Se o n8n estiver na mesma rede Docker, use o endereço interno do `finance-app`.
- **Deu certo se:**
  - as duas execuções manuais respondem 200 com `users: 0` e `sent: 0`, já que ainda não há aparelhos;
  - no dia seguinte, as execuções das 9h e das 9h30 aparecem verdes no histórico.

  A entrega do aviso no aparelho e a chave única pulando o repetido são conferidas na Parte 3.
- **Voltar atrás:** desative o workflow. Nada mais é enviado e o log não atrapalha.

### Notas da publicação

- **Variáveis do `finance-app`:** vêm do compose em `/home/ubuntu/apps/finance`. Quatro ficam no `environment:`, que tem prioridade, e o resto no `.env`, lido pelo `env_file`. No `.env`, os valores vão sem aspas, porque quem lê o arquivo é o Docker Compose.
- **Deploy:** `git pull` na pasta, `docker compose build` e depois `docker compose up -d`. A imagem anterior fica guardada como `finance-app:pre-mobile`.
- **Teste do `dryRun`:** pode ser feito de dentro do container com `node -e "fetch(...)"`, usando `process.env.N8N_INTERNAL_SECRET`, sem expor a chave.
- **n8n:** está em outra rede Docker (`big-bear-n8n_default`), então o workflow chama o domínio público. O fuso `America/Sao_Paulo` foi definido nas Settings do workflow, porque o n8n não tem `GENERIC_TIMEZONE`.

### Parte 3: app contra a produção (a partir de 25/11)

- **Ação:** com a build de produção do app, faça login pelo Google e permita as notificações.
- **Deu certo se:**
  - a `MobileSession` e o `PushDevice` ganham uma linha cada. Confira com `SELECT count(*) FROM "PushDevice" WHERE "disabledAt" IS NULL`;
  - o próximo disparo do n8n entrega o aviso, e o das 9h30 pula o que já foi enviado.
- **Voltar atrás:** o logout no app desativa o aparelho.

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
    - [x] Deploy: aplicar a migration `add_mobile_session` no banco `finance` junto com o deploy e definir `MOBILE_JWT_SECRET` e `GOOGLE_MOBILE_CLIENT_IDS` no ambiente da VPS
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
    - [x] `POST /categories` (nome repetido → 409; cor validada em hex) e `DELETE /categories/:id` (feitos na 9d)
    - [x] `PATCH /goals/:id` (parcial: `deadline: null` remove o prazo, `currentAmount` >= 0, `createdAt` não muda) e `DELETE /goals/:id` (a confirmação fica no app)
    - [ ] `PATCH /me`
    - [x] Mesma cor padrão para a categoria nova em `createTransaction`, `updateTransaction` e `createRecurringRule` (feito na 9c, com o `resolveCategoryForUse`)
- [x] **4i** Saldo pelo pago (contrato em `finance-mobile/docs/ESCRITA_BACKEND.md`, "Depois da escrita: saldo pelo pago"; no app, item 5g do `PLANO_MOBILE.md`). A parte do app (5g) foi publicada junto com o build de produção de 25/11/2026
  - Regra: receitas, despesas, gráfico mensal e limites das categorias continuam por competência, contando tudo. O saldo atual (inclusive "meses anteriores" da Visão Geral e o `carryOver` de Transações) conta só o pago. Pendentes = não pagas com competência até o mês atual; as de meses anteriores levam o selo "atrasada", e meses futuros ficam fora. Previsto = saldo atual + a receber − a pagar
  - [x] `getDashboardTotals` agrupa também por `isPaid` e devolve o campo em cada total (só acréscimo: nenhum número muda)
  - [x] Produção: repetir a medição de pendentes (só leitura) antes de publicar; se houver pendentes com competência anterior à virada, script de dados com autorização e backup (medição de 22/11/2026: 0 pendentes)
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
- [x] **5** Notificações push (desenho na seção "Push"; no app, Etapa 6 do `PLANO_MOBILE.md`)
  - [x] **5a** Migration `add_push_notifications` (`PushDevice` + `NotificationLog`): primeiro no `finance_dev`, com autorização
  - [x] **5b** `POST /devices` e `DELETE /devices/:id`; `requireMobileUser` devolve o `sessionId`; logout desativa os aparelhos da sessão
  - [x] **5c** `lib/push.ts`: envio em lotes, tickets e recibos, `DeviceNotRegistered` desativa o aparelho; `EXPO_ACCESS_TOKEN`
  - [x] **5d** `validateApiKey` com `crypto.timingSafeEqual` (commit `fix` separado, antes do `dispatch`)
  - [x] **5e** Rota `dispatch` (vence hoje, atrasadas, orçamento) com `dryRun`
    - Testado de ponta a ponta pelo app: o dispatch real chegou a dois aparelhos e a chave única pulou o aviso repetido. O Enhanced Security está ligado e o token é do robô com papel Viewer
  - [x] **5f** Workflow diário no n8n, com disparos às 9h e às 9h30 (ver "n8n" na seção "Push"). Criado em 24/11/2026
    - Depende da publicação: o n8n da VPS chama a API de produção, então a migration, o `EXPO_ACCESS_TOKEN` e a API precisam estar no ar antes
  - Deploy: migration `add_push_notifications` em produção depois da `add_mobile_session` (o `PushDevice` depende da `MobileSession`), `EXPO_ACCESS_TOKEN` na VPS; API no ar antes da build do app com push
- [ ] **6** (opcional) Push imediato de orçamento; chat e importação no mobile
- [x] **7** Publicação (checklist na seção "Publicação")
  - [x] `.env.example` com todas as variáveis, sem valores
  - [x] Passos 1 a 9 da seção "Publicação" (24/11/2026)
    - [x] Conferir as execuções automáticas do n8n (25/11/2026): o workflow foi publicado com um horário provisório de teste, e as duas execuções automáticas saíram verdes (a primeira com `sent: 1`, a segunda com `skipped: 1`). Depois os horários de 9h e 9h30 foram restaurados
  - [x] Parte 3: app contra a produção (25/11/2026): build de produção (perfil production, APK, distribuição interna) em dois aparelhos Android, login pelo Google, `MobileSession` e `PushDevice` com 2 registros, push entregue nos dois e o segundo disparo pulando o repetido (`skipped: 1`)
- [ ] **8** Login por e-mail e senha no mobile (`POST /auth/login`; desenho em "Login por e-mail e senha no mobile")
  - [x] **8a** Contador de tentativas e leitura do IP em `lib/login-rate-limit.ts`
  - [x] **8b** `verifyPasswordLogin(email, password, ip)` com o hash falso
  - [x] **8c** `authorize` do web usando a função; contador antigo removido do `lib/auth.ts`
  - [x] **8d** Rota `app/api/v1/auth/login/route.ts`: testados no dev 400, 401 de e-mail inexistente e 429 por e-mail e por IP
  - [ ] Teste manual no dev: login certo (200 + `/me` com o `accessToken`), senha errada numa conta real e conta só com Google (401 com tempo parecido); no web, login certo, senha errada e bloqueio após 10 falhas
  - [ ] Deploy (sem migration nem variável nova) e tela de login por senha no app
  - Depois (limite de tentativas):
    - [ ] Nginx aceitar só IPs da Cloudflare, para o `CF-Connecting-IP` não poder ser falsificado
    - [ ] Limite por IP agrupando IPv6 por /64: cada cliente costuma ter um /64 inteiro e pode trocar de endereço dentro dele para escapar do limite
- [ ] **9** Categorias arquivadas e edição de recorrência (decisões 6 a 18), no web e na API, com a lógica em `lib/finance`
  - [x] Antes da 9a: consulta de duplicatas (26/11/2026: 0 linhas no `finance_dev` e no `finance`) (só leitura) no `finance_dev` e no `finance`. Se voltar alguma linha, a 9a espera: unificar exige um script de dados com autorização e backup
    ```sql
    SELECT "userId", lower(btrim(name)) AS k, array_agg(name), count(*)
    FROM "Category" GROUP BY 1, 2 HAVING count(*) > 1;
    ```
  - [x] **9a** Migration aditiva `add_category_archive`: `Category.archivedAt DateTime?` e `Category.nameKey String?` (nome em minúsculas, sem os espaços das pontas), backfill `lower(btrim(name))` e `@@unique([userId, nameKey])`. O unique antigo `(name, userId)` fica até a 9h. Aplicada no `finance_dev` em 26/11/2026 (20 categorias, todas com `nameKey`); falta a produção, antes do deploy da 9b/9c
    - O `btrim` corta só o espaço comum; basta porque nenhum nome atual (dev e produção) tem outro tipo de espaço nas pontas
  - [x] **9b** `lib/finance/categories` (sem consumidores novos ainda: o `deleteCategory` continua apagando até a 9d, e os `upsert` por nome continuam até a 9c; a action `createCategory` lança erro no `conflict`, como antes):
    - Até a 9h, a busca por nome (`findCategoryByName`) também acha pelo nome exato as categorias com `nameKey` nulo, criadas pelo código antigo. Remover esse `OR` na 9h
    - `DEFAULT_CATEGORY_COLORS` mudou de `transactions.ts` para `categories.ts`; `isUniqueViolation` mudou de `notifications.ts` para `lib/prisma.ts`
    - `normalizeCategoryName(name)` → `{ name, nameKey }` com `trim()` completo do JavaScript + `toLowerCase()`
    - `getCategories` e `getCategoriesWithBudget` só com as ativas (tela Categorias, `GET /categories`, avisos de orçamento); `getDashboardTotals` continua com todas
    - `createCategory` devolve criada, reativada ou conflito (ativa com o mesmo nome). Reativar: mesma linha, `archivedAt = null`, nome como digitado, cor nova e o limite digitado (decisões 7, 15 e 16). Corrida no unique (P2002) vira conflito
    - `archiveCategory(userId, id)`: filtra `{ id, userId }`; devolve também quantas recorrências ativas usam a categoria, para o aviso (decisão 12)
    - `resolveCategoryForUse(userId, name, type, currentCategoryId?)`: busca pelo `nameKey`; cria se não existir (com a cor padrão única de `DEFAULT_CATEGORY_COLORS`, resolvendo a pendência da 4); se estiver arquivada, mantém quando for a categoria atual da transação ou da regra (decisão 13) e, fora disso, reativa com a cor antiga e sem limite (decisão 11)
    - `getBudgetStatus` busca pelo `nameKey`
  - [x] **9c** Consumidores (feito em 26/11/2026; antes, em commit próprio, a lista fixa de categorias padrão saiu dos diálogos para o `getCategoryOptions`):
    - Criam ou usam a categoria pelo nome, com `resolveCategoryForUse`: `createTransaction` e `updateTransaction` (esta passa a categoria atual da transação), `createRecurringRule`, `saveTransactions` da importação (as categorias são resolvidas antes do `createMany`, fora da transação do banco) e a rota `integrations/finances/transaction` do n8n (agora com 400 para `categoryName` vazio; a cor da categoria nova de receita deixa de ser `#10b981` e fica a padrão, sem verde, confirmado em 26/11/2026). O chat e o `POST /api/v1/transactions` passam pelo `createTransaction`
    - Só as ativas: `getCategories` (chat, `AIImportClient`, prompt da importação, `identity/lookup` do n8n) e `getCategoryOptions` (`TransactionDialog` e `RecurringDialog`, com as padrão que o usuário ainda não tem, nem arquivadas)
    - Com as arquivadas, de propósito: a busca de categorias do `getTransactionsPage` (filtro do web e `categories` do `GET /transactions`), o `getDashboardTotals` e o filtro por nome da rota `integrations/finances/summary`
    - Pendente: o cartão do chat marca como "nova" uma sugestão da IA que é uma arquivada; ao confirmar, ela é reativada
    - `createTransaction`, `updateTransaction`, `createRecurringRule`, importação da IA, rota do n8n e chat (via `createTransaction`) passam a usar o `resolveCategoryForUse`
    - Listas de escolha só com as ativas: `TransactionDialog`, `RecurringDialog`, `AIImportClient`, prompts do chat e da importação, `identity/lookup`. A lista fixa de categorias padrão vai para o servidor, sem as que já existem arquivadas
    - Ao editar uma transação ou recorrência numa arquivada, o seletor mostra a atual marcada "arquivada" (decisão 13)
    - `getTransactionsPage`: o `categories` do filtro inclui as arquivadas (decisão 14)
  - [x] **9d** Categorias no web e na API, com a edição de cor (feito em 27/11/2026; antes, em commit próprio, o seletor de cor virou o `CategoryColorField` e o `CategoryBudgetDialog` virou `CategoryEditDialog`):
    - Web: excluir vira arquivar (ícone de arquivo, `ConfirmDialog` em `warning` com o número de recorrências ativas que usam a categoria); o `CategoryDialog` mostra "já existe" (continua aberto) ou "reativada"; o lápis abre o `CategoryEditDialog`, com limite e cor (a cor só é enviada se mudou)
    - `getCategoriesWithBudget` devolve também `activeRecurringRules` (campo novo no `GET /categories`, só acréscimo), usado no aviso de arquivamento
    - `updateCategory(userId, id, { budget?, color? })` no lugar do `setCategoryBudget`; `deleteCategory` (que apagava a linha) removida. A cor é validada (`CATEGORY_COLOR_RE`, hex de 6 dígitos) no `createCategory` e no `updateCategory` e gravada em minúsculas
    - `POST /categories { name, color, budget? }`: 201 com a categoria no formato do `GET` e `reactivated`; 409 `Category already exists` com uma ativa de mesmo nome; 400 com cor fora do hex
    - `PATCH /categories/:id { budget?, color? }`: pelo menos um dos dois; campo ausente fica como está e `budget: null` remove o limite; 404 para categoria arquivada
    - `DELETE /categories/:id`: arquiva; 204 ou 404 (inclusive se já estiver arquivada)
    - Renomear fica fora por enquanto
  - [x] **9e** `updateRecurringRule(userId, id, input)` em `lib/finance/recurring` (feito em 27/11/2026; antes, em commit próprio, a validação virou `validateRecurringRuleInput`). Devolve `{ success: true }`, `{ success: false, notFound: true }` (para o 404 da 9f) ou `{ success: false, error }` (400). Depois de gravar, roda o `generateForUser` de novo, como a criação: uma regra que ainda não lançou nada e passa a começar no passado gera o devido. O início só é conferido quando muda. Testado no `finance_dev` com um script temporário (usuário de teste criado e apagado pelo id; relógio simulado para os meses seguintes): atrasados e mês atual com os dados antigos, próximo mês com os novos, dia 25 → 5 sem duplicar nem pular, início anterior ou igual ao último lançado recusado, início adiado pulando os meses do meio, regra sem lançamentos movida para o passado, categoria arquivada mantida, validação, regra pausada e id inexistente
    - Mesma validação da criação (extraída para uma função comum)
    - Antes de gravar, roda `generateForUser` com os dados antigos (decisão 17)
    - Com `lastGeneratedMonth` preenchido, o `startMonth` novo precisa ser depois dele (senão 400, decisão 18); sem ele, vale como na criação
    - `generateForUser` passa a começar em `max(lastGeneratedMonth + 1, startMonth)`. Mudar o dia não duplica: a geração é por mês, com o `lastGeneratedMonth` e o unique `(recurringRuleId, referenceDate)`
  - [x] **9f** `PATCH /recurring/:id`: só `{ active }` continua sendo pausar/retomar; qualquer outro body é edição completa (mesmo padrão da 4j(b)). 200 com a regra no formato do `GET`, 400, 404 (feito em 27/11/2026; antes, em commit próprio, o schema do `POST` virou `recurringBodySchema` em `recurring/schema.ts`)
    - Edição completa: os campos do `POST` (`category` ausente ou vazio = sem categoria; o app manda sempre a atual) e `active` opcional. Com `active`, a regra é editada e depois pausada ou retomada na mesma requisição; ao retomar, o mês atual já sai com os dados novos. As duas escritas não são atômicas: se o pausar/retomar falhar, a edição fica gravada e a resposta é 500
    - 400 do Zod (com `issues`) ou do service (ex.: "O início precisa ser depois do último mês lançado"); 404 para regra inexistente ou de outro usuário
    - Compatível com o app de produção, que manda só `{ active }`: mesmo caminho, mesmo schema e mesma resposta. Diferença: antes, `{ active }` com chaves a mais também pausava (o schema ignorava o resto); agora esse body é uma edição completa e dá 400 se faltarem campos
  - [ ] **9g** Web: botão de editar no card do `RecurringClient` e modo de edição no `RecurringDialog` (como o `TransactionDialog`), avisando "vale a partir de <mês>"
  - [ ] **9h** Migration `category_name_key_required`, depois do deploy da 9b e da 9c: novo backfill dos `nameKey` nulos (criados pelo código antigo entre a 9a e o deploy), `NOT NULL` e remoção do unique `(name, userId)`. Antes, repetir a consulta de duplicatas: um nome com espaço nas pontas gravado pelo código antigo pode ter virado uma segunda categoria. Depois, tirar o `OR` do `findCategoryByName`
  - Deploy: 9a em produção antes do deploy (aditiva, o código antigo continua funcionando); 9h só depois do código novo no ar
  - Fora do escopo: o `RecurringDialog` calcula o mês atual pelo fuso do navegador, não pelo `APP_TIME_ZONE` (já existia)
