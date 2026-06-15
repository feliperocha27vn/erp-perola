# AGENTS.md — repositories

Regras e convenções específicas para os arquivos da pasta `repositories`.

---

## Propósito

A pasta `repositories/` implementa o **Repository Pattern**, abstração da camada de dados. É responsável por todas as operações de persistência.

Há dois tipos de arquivo aqui:
1. **Interfaces** (contratos) - definem o que o repositório deve fazer
2. **Implementações** (Drizzle) - implementam o contrato com banco de dados

---

## Estrutura

```
repositories/
├── {recurso}-repository.ts              ← Interface/contrato
├── {recurso2}-repository.ts
└── drizzle/
    ├── drizzle-{recurso}-repository.ts   ← Implementação com Drizzle
    └── drizzle-{recurso2}-repository.ts
```

**Regra:** Uma interface por recurso, uma implementação por ORM

---

## Convenção de Nomenclatura

### Interfaces

- **Arquivos:** kebab-case, singular
  ```
  ✅ product-repository.ts
  ✅ customer-repository.ts
  ❌ ProductRepository.ts
  ❌ products-repository.ts
  ```

- **Classes/Interfaces:** PascalCase com sufixo `Repository`
  ```
  ✅ export interface ProductRepository
  ✅ export interface CustomerRepository
  ❌ export interface IProduct
  ❌ export interface ProductRepo
  ```

### Implementações

- **Arquivos:** `drizzle-{recurso}-repository.ts`
  ```
  ✅ drizzle-product-repository.ts
  ✅ drizzle-customer-repository.ts
  ❌ ProductRepository.ts
  ❌ product-db-repository.ts
  ```

- **Classes:** `Drizzle{Recurso}Repository`
  ```
  ✅ export class DrizzleProductRepository implements ProductRepository
  ✅ export class DrizzleCustomerRepository implements CustomerRepository
  ❌ export class ProductRepositoryDrizzle
  ❌ export class ProductDbRepository
  ```

---

## Interfaces - Definindo o Contrato

Toda interface deve definir claramente os métodos de acesso a dados:

```ts
// repositories/product-repository.ts

export interface Product {
  id: string
  sku: string
  ean: string
  marca: string
  url_image: string | null
  created_at: Date
  updated_at: Date
}

export interface ProductRepository {
  // Leitura
  findAll(): Promise<Product[]>
  findById(id: string): Promise<Product | null>
  findBySku(sku: string): Promise<Product | null>
  
  // Escrita
  create(data: CreateProductInput): Promise<Product>
  update(id: string, data: UpdateProductInput): Promise<Product | null>
  delete(id: string): Promise<void>
}
```

**Regras para interfaces:**

1. **Uma responsabilidade:** Um repositório = um recurso
2. **Métodos descritivos:** `findAll()`, `findById()`, não `get()`, `select()`
3. **Sem detalhes de ORM:** A interface não deve saber de Drizzle, SQL, etc.
4. **Retorno consistente:** `null` para não encontrado, não lança erro
5. **Tipos claros:** Sempre com tipos de entrada e saída

---

## Implementações - Usando Drizzle

```ts
// repositories/drizzle/drizzle-product-repository.ts

import { eq } from 'drizzle-orm'
import { db } from '../../db/connection.js'
import { products } from '../../db/schema.js'
import type { Product, ProductRepository } from '../product-repository.js'

export class DrizzleProductRepository implements ProductRepository {
  async findAll(): Promise<Product[]> {
    return await db.select().from(products)
  }

  async findById(id: string): Promise<Product | null> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))

    return product ?? null
  }

  async findBySku(sku: string): Promise<Product | null> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.sku, sku))

    return product ?? null
  }

  async create(data: CreateProductInput): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values({
        id: crypto.randomUUID(),
        ...data,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning()

    return product
  }

  async update(
    id: string,
    data: UpdateProductInput,
  ): Promise<Product | null> {
    const [product] = await db
      .update(products)
      .set({ ...data, updated_at: new Date() })
      .where(eq(products.id, id))
      .returning()

    return product ?? null
  }

  async delete(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id))
  }
}
```

**Regras para implementações:**

1. **Implementa a interface:** `class X implements ProductRepository`
2. **Sem lógica de negócio:** Apenas acesso a dados
3. **Erros silenciosos:** Retorna `null` em vez de lançar erro
4. **Detalhes de ORM:** Aqui fica Drizzle, SQL, etc.
5. **Um método = uma operação:** Não combine múltiplas operações

---

## Padrão de Métodos

Use estes padrões de nomenclatura:

| Operação | Padrão | Exemplo |
|----------|--------|---------|
| Buscar tudo | `findAll()` | `findAll(): Promise<T[]>` |
| Buscar um por ID | `findById(id)` | `findById(id: string): Promise<T \| null>` |
| Buscar por campo | `findBy{Campo}(value)` | `findBySku(sku: string): Promise<T \| null>` |
| Buscar múltiplos | `findMany(filter)` | `findMany(userId: string): Promise<T[]>` |
| Criar | `create(data)` | `create(data: CreateInput): Promise<T>` |
| Atualizar | `update(id, data)` | `update(id: string, data: UpdateInput): Promise<T \| null>` |
| Deletar | `delete(id)` | `delete(id: string): Promise<void>` |
| Contar | `count()` | `count(filter?): Promise<number>` |
| Existe | `exists(id)` | `exists(id: string): Promise<boolean>` |

---

## Paginação e Convenção `fetch` vs `get`

Quando um método do repositório consultar **listas paginadas**, siga estas regras obrigatórias:

1. **Nomenclatura:** use o prefixo `fetch` para métodos que retornam múltiplos registros com paginação (`fetchProducts`, `fetchProductsWithoutImage`). Use `get` apenas quando o retorno for **um único registro** (`getProductById`).
2. **pageIndex obrigatório:** todo método paginado recebe um `pageIndex` (zero-based) para calcular `offset = pageIndex * 20`.
3. **Tamanho fixo:** limite sempre `20` itens por página. Não exponha `pageSize` em repositórios.
4. **Payload padronizado:** retorne um objeto do tipo `{Nome}Reply` com estrutura `{ items: T[], total: number, pageIndex: number }`.
5. **Total consistente:** calcule `total` com `count(*)` da mesma consulta (use `Promise.all` para otimizar).

Exemplo:

```ts
interface FetchProductsRequest {
  pageIndex: number
  withoutImage?: boolean
}

interface FetchProductsReply {
  items: Product[]
  total: number
  pageIndex: number
}

export interface ProductRepository {
  // Métodos paginados - use "fetch" para listas
  fetchProducts(request: FetchProductsRequest): Promise<FetchProductsReply>
  
  // Métodos de item único - use "get"
  getProductById(id: string): Promise<Product | null>
}

export class DrizzleProductRepository implements ProductRepository {
  async fetchProducts({ pageIndex, withoutImage }: FetchProductsRequest): Promise<FetchProductsReply> {
    const limit = 20
    const offset = pageIndex * limit

    const baseQuery = withoutImage
      ? db.select().from(products).where(isNull(products.url_image))
      : db.select().from(products)

    const countQuery = withoutImage
      ? db.select({ count: sql<number>`count(*)` }).from(products).where(isNull(products.url_image))
      : db.select({ count: sql<number>`count(*)` }).from(products)

    const [items, [{ count }]] = await Promise.all([
      baseQuery.limit(limit).offset(offset),
      countQuery,
    ])

    return { items, total: Number(count), pageIndex }
  }

  async getProductById(id: string): Promise<Product | null> {
    const [product] = await db.select().from(products).where(eq(products.id, id))
    return product ?? null
  }
}
```

> **Resumo rápido:** `fetch` para listas paginadas + `get` para item único + `pageIndex` zero-based + 20 itens + payload `{ items, total, pageIndex }`.

---

## Tipos de Entrada

Defina tipos para dados de entrada:

```ts
// repositories/product-repository.ts

export interface CreateProductInput {
  sku: string
  ean: string
  marca: string
  url_image?: string | null
}

export interface UpdateProductInput {
  sku?: string
  ean?: string
  marca?: string
  url_image?: string | null
}

export interface ProductRepository {
  create(data: CreateProductInput): Promise<Product>
  update(id: string, data: UpdateProductInput): Promise<Product | null>
}
```

---

## Tratamento de Erros

Repositories retornam `null` ou vazio, não lançam erro:

```ts
// ✅ CORRETO
async findById(id: string): Promise<Product | null> {
  const product = await db.select().from(products).where(eq(products.id, id))
  return product ?? null
}

// ❌ ERRADO
async findById(id: string): Promise<Product> {
  const product = await db.select().from(products).where(eq(products.id, id))
  if (!product) {
    throw new Error('Product not found') // Deixa para o use case
  }
  return product
}
```

**Motivo:** Use case decide se `null` é um erro. Repository apenas acessa dados.

---

## Exemplo Completo

```ts
// repositories/customer-repository.ts
export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  created_at: Date
  updated_at: Date
}

export interface CreateCustomerInput {
  name: string
  email: string
  phone: string
}

export interface UpdateCustomerInput {
  name?: string
  email?: string
  phone?: string
}

export interface CustomerRepository {
  findAll(): Promise<Customer[]>
  findById(id: string): Promise<Customer | null>
  findByEmail(email: string): Promise<Customer | null>
  create(data: CreateCustomerInput): Promise<Customer>
  update(id: string, data: UpdateCustomerInput): Promise<Customer | null>
  delete(id: string): Promise<void>
  count(): Promise<number>
}
```

```ts
// repositories/drizzle/drizzle-customer-repository.ts
import { eq } from 'drizzle-orm'
import { db } from '../../db/connection.js'
import { customers } from '../../db/schema.js'
import type {
  Customer,
  CreateCustomerInput,
  CustomerRepository,
  UpdateCustomerInput,
} from '../customer-repository.js'

export class DrizzleCustomerRepository implements CustomerRepository {
  async findAll(): Promise<Customer[]> {
    return await db.select().from(customers)
  }

  async findById(id: string): Promise<Customer | null> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id))

    return customer ?? null
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.email, email))

    return customer ?? null
  }

  async create(data: CreateCustomerInput): Promise<Customer> {
    const [customer] = await db
      .insert(customers)
      .values({
        id: crypto.randomUUID(),
        ...data,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning()

    return customer
  }

  async update(
    id: string,
    data: UpdateCustomerInput,
  ): Promise<Customer | null> {
    const [customer] = await db
      .update(customers)
      .set({ ...data, updated_at: new Date() })
      .where(eq(customers.id, id))
      .returning()

    return customer ?? null
  }

  async delete(id: string): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id))
  }

  async count(): Promise<number> {
    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(customers)

    return count
  }
}
```

---

## Testes com In-Memory Repository

Para testes, implemente um repositório em memória em `src/repositories/in-memory/`:

```ts
// repositories/in-memory/in-memory-product-repository.ts
import type { Product, ProductRepository } from '../product-repository.js'

export class InMemoryProductRepository implements ProductRepository {
  public products: Product[] = []

  async fetchProducts(request: FetchProductsRequest): Promise<FetchProductsReply> {
    // ...
  }

  async getProductById(id: string): Promise<Product | null> {
    return this.products.find((p) => p.id === id) ?? null
  }

  // ... implementar todos os métodos da interface
}
```

Fakes existentes:
- `in-memory-brand-repository.ts`
- `in-memory-store-repository.ts`
- `in-memory-stock-repository.ts`
- `in-memory-product-repository.ts`
- `in-memory-sale-repository.ts`

Exemplo de teste unitário:

```ts
import { InMemoryProductRepository } from '@/repositories/in-memory/in-memory-product-repository'
import { FetchAllProductsUseCase } from '@/use-cases/products/fetch-all-products'

describe('FetchAllProductsUseCase', () => {
  it('should fetch all products', async () => {
    const repository = new InMemoryProductRepository()
    const useCase = new FetchAllProductsUseCase(repository)

    const { products } = await useCase.execute()

    expect(products).toHaveLength(0)
  })
})
```

---

## Checklist

Antes de fazer commit de um novo repositório:

- [ ] Interface em `repositories/{recurso}-repository.ts`
- [ ] Implementação em `repositories/drizzle/drizzle-{recurso}-repository.ts`
- [ ] Interface `implements` corretamente a interface
- [ ] Métodos seguem padrão `findX()`, `create()`, `update()`, `delete()`
- [ ] Sem lógica de negócio, apenas acesso a dados
- [ ] Retorna `null` em vez de lançar erro
- [ ] Tipos de entrada (CreateInput, UpdateInput) definidos
- [ ] Todos os métodos tipados corretamente
- [ ] Sem dependência de Fastify ou controllers
- [ ] Implementação in-memory para testes
