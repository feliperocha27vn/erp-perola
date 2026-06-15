# AGENTS.md — api

Regras e convenções para a pasta `api`.

---

## Estrutura

```
api/
├── src/
│   ├── app.ts       ← configuração do Fastify (plugins, swagger, scalar)
│   └── server.ts    ← ponto de entrada, inicia o servidor
├── docker-compose.yaml
├── package.json
└── tsconfig.json
```

---

## Regra principal: configurações do Fastify ficam em `app.ts`

**Todo registro de plugin, middleware e configuração global do Fastify deve estar em `src/app.ts`.**

`app.ts` exporta a função `buildApp()`, que cria e configura a instância do Fastify. `server.ts` apenas importa e executa essa função.

```ts
// CORRETO — configuração em app.ts
export async function buildApp() {
  const app = fastify()
  await app.register(algumPlugin, { /* opções */ })
  return app
}

// ERRADO — nunca registre plugins ou configure o Fastify diretamente em server.ts
```

---

## Validação e tipagem com `fastify-type-provider-zod`

Use sempre o `ZodTypeProvider` para garantir tipagem completa nas rotas. Os compiladores devem ser configurados em `app.ts`, e as rotas devem usar `.withTypeProvider<ZodTypeProvider>()`.

```ts
import { z } from 'zod'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'

app.withTypeProvider<ZodTypeProvider>().route({
  method: 'GET',
  url: '/exemplo',
  schema: {
    querystring: z.object({ id: z.string().uuid() }),
    response: { 200: z.object({ nome: z.string() }) },
  },
  handler: async (req, reply) => {
    // req.query.id é string tipada
    reply.send({ nome: 'valor' })
  },
})
```

---

## Documentação automática

- Swagger (OpenAPI spec) é gerado automaticamente pelo `@fastify/swagger` com base nos schemas Zod das rotas.
- A interface de documentação é servida em `/docs` pelo `@scalar/fastify-api-reference`.
- **Não é necessário escrever documentação manualmente** — basta definir os schemas Zod nas rotas.

---

## Scripts (sempre use `pnpm`)

```bash
pnpm run dev        # servidor com hot reload via tsx watch
pnpm run build      # compila TypeScript para dist/
pnpm run start      # executa o build compilado
pnpm run test       # testes unitários (use-cases)
pnpm run test:e2e   # testes E2E (controllers + HTTP real)
```

**IMPORTANTE: Este projeto usa `pnpm`, nunca `npm` ou `yarn`.** Se vir `node_modules/` junto com `package-lock.json`, apague ambos e rode `pnpm install`.

---

## Testes

### Unitários (`pnpm run test`)

- Roda testes em `src/**/*.test.ts` e `src/**/*.spec.ts`, **exceto** `*.e2e.spec.ts`.
- Foco em use cases com repositórios **in-memory**.
- Configuração: `vitest.config.ts`.

### E2E (`pnpm run test:e2e`)

- Roda testes em `src/**/*.e2e.spec.ts`.
- Usa servidor Fastify real (`buildApp()`) + banco PostgreSQL.
- Configuração: `vitest.e2e.config.ts`.

#### Setup do banco de testes

```bash
# 1. Subir PostgreSQL
docker compose up -d postgres

# 2. Criar banco de testes (nome padrão: analise_de_valores_test)
docker compose exec postgres psql -U postgres -c "CREATE DATABASE analise_de_valores_test;"

# 3. Rodar E2E
pnpm run test:e2e
```

Variáveis de ambiente para testes (podem ser definidas em `.env`):
- `DATABASE_URL`: apontar para o banco de testes
- `BETTER_AUTH_SECRET`: mínimo 32 caracteres
- `BETTER_AUTH_URL`: URL base da API (ex: `http://localhost:3333`)

#### Helpers E2E

Localizados em `src/tests/e2e/utils/`:
- `makeTestApp()`: cria instância do Fastify para testes
- `createAndAuthenticateUser(app)`: cria usuário e retorna cookie de sessão
- `cleanDatabase()`: limpa todas as tabelas entre testes

#### Padrão de teste E2E

```ts
import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import { makeTestApp } from "./utils/build-app.js"
import { cleanDatabase } from "./utils/clean-database.js"
import { createAndAuthenticateUser } from "./utils/create-and-authenticate-user.js"

describe("Products (e2e)", () => {
  beforeEach(async () => {
    await cleanDatabase()
  })

  it("should create a product when authenticated", async () => {
    const app = await makeTestApp()
    const { cookie } = await createAndAuthenticateUser(app)

    const response = await request(app.server)
      .post("/products")
      .set("Cookie", cookie)
      .send({ sku: "SKU-001", ean: "EAN-001", brand_id: null })

    expect(response.status).toBe(201)
  })
})
```

---

## Servidor

- **Porta padrão: 3333** (configurável via `PORT` env var)
- **Documentação:** http://localhost:3333/docs (interface Scalar)
- **OpenAPI spec:** http://localhost:3333/documentation/json

---

## Drizzle ORM — Banco de dados

### Estrutura

```
src/db/
└── connection.ts    ← conexão com PostgreSQL
```

### Scripts disponíveis

```bash
pnpm run db:generate   # gera migration baseada no schema
pnpm run db:migrate    # aplica migrations no banco
pnpm run db:push       # sincroniza schema direto (dev only)
pnpm run db:studio     # abre Drizzle Studio (GUI)
```

### Como usar nas rotas

**Não acesse o banco diretamente nos controllers.** Use factories para instanciar use cases, e use cases para orquestrar repositories:

```ts
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { makeFetchAllProductsUseCase } from '../factories/products/make-fetch-all-products-use-case.js'

export const fetchAllProducts: FastifyPluginAsyncZod = async (app) => {
  app.get('/exemplo', {
    schema: {
      response: { 200: z.array(z.object({ id: z.string(), name: z.string() })) },
    },
    handler: async (req, reply) => {
      const useCase = makeFetchAllProductsUseCase()
      const dados = await useCase.execute()
      reply.send(dados)
    },
  })
}
```

### Workflow de mudanças no schema

1. **Crie/Edite** `src/db/schema.ts` com suas tabelas
2. **Gere migration:** `pnpm run db:generate`
3. **Aplique no banco:** `pnpm run db:migrate`
4. **Commit** tanto o schema quanto a migration

### Regras importantes

- **Nunca edite** migrations geradas manualmente
- **Sempre gere migration** antes de mudar o schema em produção
- **Use `db:push`** apenas em desenvolvimento para testes rápidos
- **Schemas sempre em kebab-case** para nomes de tabelas e colunas

### PostgreSQL (Docker)

```bash
docker compose up -d   # sobe o PostgreSQL (postgres:16-alpine) na porta 5432
```

Credenciais padrão (desenvolvimento):
- Host: `localhost:5432`
- Database: `analise_de_valores`
- User: `postgres`
- Password: `postgres`
