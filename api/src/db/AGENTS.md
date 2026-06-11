# AGENTS.md — src/db

Regras e convenções para a pasta `src/db`.

---

## Estrutura

```
src/db/
├── connection.ts    ← conexão com PostgreSQL via Drizzle
├── schema.ts        ← definição das tabelas (Drizzle ORM)
├── seed.ts          ← script para popular banco de dados
└── *.csv            ← arquivos de dados para seed
```

---

## Schema (schema.ts)

### Regras de nomenclatura

**IMPORTANTE: Sempre use `snake_case` para nomes de tabelas e colunas.**

```ts
// CORRETO
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  url_image: text("url_image"),
  created_at: timestamp("created_at").notNull().defaultNow(),
})

// ERRADO — nunca use camelCase em colunas
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  urlImage: text("urlImage"),        // ❌
  createdAt: timestamp("createdAt"), // ❌
})
```

### Timestamps padrão

Toda tabela deve ter `created_at` e `updated_at`:

```ts
created_at: timestamp("created_at").notNull().defaultNow(),
updated_at: timestamp("updated_at").notNull().defaultNow(),
```

### IDs

Use UUID como padrão para chaves primárias:

```ts
id: uuid("id").primaryKey().defaultRandom(),
```

---

## Seed (seed.ts)

### Propósito

O arquivo `seed.ts` serve para popular o banco de dados com dados iniciais em desenvolvimento.

### Quando usar

- Dados de teste para desenvolvimento
- Dados de referência (marcas, categorias, etc.)
- Popular tabelas após migrations

### Como executar

```bash
pnpm run seed
```

### Estrutura do seed

```ts
import { db } from './connection.js'
import { products } from './schema.js'
import fs from 'node:fs'
import path from 'node:path'

async function seed() {
  // Limpar dados existentes (apenas em dev!)
  await db.delete(products)
  
  // Inserir dados
  await db.insert(products).values([
    { sku: 'ABC123', ean: '7891529992531', marca: 'ORIENT' },
    // ...
  ])
  
  console.log('✅ Seed concluído')
}

seed()
  .catch((err) => {
    console.error('❌ Erro no seed:', err)
    process.exit(1)
  })
  .finally(() => {
    process.exit(0)
  })
```

### Lendo dados de CSV

Use `node:fs` para ler arquivos CSV na mesma pasta:

```ts
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const csvPath = path.join(__dirname, 'products.csv')
const csvContent = fs.readFileSync(csvPath, 'utf-8')
```

---

## Migrations

### Workflow

1. **Edite** `schema.ts` com as mudanças desejadas
2. **Gere migration:** `pnpm run db:generate`
3. **Revise** a migration gerada em `drizzle/`
4. **Aplique:** `pnpm run db:migrate`
5. **Commit** schema + migration juntos

### Regras importantes

- **Nunca edite migrations manualmente** após serem aplicadas
- **Sempre revise** a migration antes de aplicar em produção
- **Use `db:push`** apenas em desenvolvimento para testes rápidos (não gera migration)

---

## Scripts utilitários

### fill-images.ts

Script para buscar imagens de produtos na API do Mercado Livre usando EAN.

**Limitações:**
- API pública do ML tem rate limiting
- Pode retornar erro 403 (Forbidden)
- Não recomendado para uso em produção sem autenticação

```bash
pnpm run fill-images
```

---

A conexão com o banco é configurada uma única vez e exportada como `db`:

```ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL || 'postgresql://...'
const client = postgres(connectionString)
export const db = drizzle(client)
```

**Nunca crie múltiplas instâncias de conexão.** Sempre importe `db` de `connection.ts`.

---

## Variáveis de ambiente

A URL de conexão deve vir de `.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/analise_de_valores
```

Em produção, use a URL fornecida pelo provedor de hospedagem.
