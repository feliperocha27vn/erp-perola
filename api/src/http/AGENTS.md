# AGENTS.md — http/controllers

Regras e convenções específicas para os arquivos da pasta `http/controllers`.

---

## Propósito

A pasta `http/controllers/` contém os **endpoints HTTP** da aplicação. Controllers orquestram use cases, tratam requisições/respostas HTTP e erros.

---

## Estrutura

```
http/controllers/
└── {recurso}/
    ├── routes.ts           ← Agrupa todos os controllers de um recurso
    ├── acao1.ts            ← Controller individual
    ├── acao2.ts
    └── acao3.ts
```

**Regra:** Um arquivo = Um controller = Um endpoint HTTP

---

## Convenção de Nomenclatura

- **Pastas:** kebab-case, singular
  ```
  ✅ http/controllers/products/
  ✅ http/controllers/customers/
  ❌ http/controllers/Products/
  ❌ http/controllers/product-management/
  ```

- **Arquivos:** kebab-case, descritivo do que faz
  ```
  ✅ fetch-all-products.ts
  ✅ update-product-image.ts
  ✅ delete-product.ts
  ❌ get.ts
  ❌ index.ts
  ❌ ProductController.ts
  ```

- **Constantes exportadas:** camelCase
  ```
  ✅ export const fetchAllProducts: FastifyPluginAsyncZod = ...
  ✅ export const updateProductImage: FastifyPluginAsyncZod = ...
  ❌ export const FetchAllProducts
  ❌ export const fetchAllProductsController
  ```

---

## Padrão de Controller

Todo controller segue este padrão:

```ts
// http/controllers/products/fetch-all-products.ts

// 1. Importar factory
import { makeFetchAllProductsUseCase } from '../../../factories/products/make-fetch-all-products-use-case.js'

// 2. Importar tipo Fastify
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'

// 3. Importar Zod para schemas
import z from 'zod'

// 4. Definir o controller como FastifyPluginAsyncZod
export const fetchAllProducts: FastifyPluginAsyncZod = async (app) => {
  // 5. Definir a rota
  app.get(
    '/products', // URL
    {
      // 6. Schema Zod com documentação
      schema: {
        description: 'Lista todos os produtos',
        tags: ['products'],
        querystring: z.object({
          withoutImage: z
            .enum(['true', 'false'])
            .optional()
            .describe('Filtrar apenas produtos sem imagem'),
        }),
        response: {
          200: z.array(
            z.object({
              id: z.string().uuid(),
              sku: z.string(),
              ean: z.string(),
              marca: z.string(),
              url_image: z.string().nullable(),
              created_at: z.date(),
              updated_at: z.date(),
            }),
          ),
        },
      },
    },
    // 7. Handler: recebe request, chama use case, retorna response
    async (req, reply) => {
      // a) Instanciar use case com factory
      const fetchAllProductsUseCase = makeFetchAllProductsUseCase()

      // b) Executar use case
      const products = await fetchAllProductsUseCase.execute(
        req.query.withoutImage === 'true',
      )

      // c) Retornar resposta HTTP
      return reply.send(products)
    },
  )
}
```

---

## Regras Obrigatórias

### 1. Controllers são FastifyPluginAsyncZod

```ts
// ✅ CORRETO - tipo correto do Fastify
export const fetchAllProducts: FastifyPluginAsyncZod = async (app) => {
  app.get('/products', { /* ... */ }, async (req, reply) => {
    // ...
  })
}

// ❌ ERRADO - tipo genérico
export async function fetchAllProducts(app: FastifyInstance) {
  // ...
}
```

**Motivo:** `FastifyPluginAsyncZod` fornece tipagem completa com Zod.

### 2. Schema Zod Sempre Presente

```ts
// ✅ CORRETO - schema completo
app.get('/products/:id', {
  schema: {
    description: 'Busca um produto por ID',
    tags: ['products'],
    params: z.object({
      id: z.string().uuid().describe('ID do produto'),
    }),
    response: {
      200: ProductSchema,
      404: z.object({ error: z.string() }),
    },
  },
  handler: async (req, reply) => {
    // ...
  },
})

// ❌ ERRADO - sem schema
app.get('/products/:id', async (req, reply) => {
  // Sem documentação automática, sem validação
})
```

**Motivo:**
- Documenta automaticamente na API (Scalar)
- Valida entrada e saída
- Tipagem TypeScript completa

### 3. Tratamento de Erros Customizados

```ts
// ✅ CORRETO - trata erros específicos
import { ProductNotFoundError } from '../../../errors/product-not-found-error.js'

export const updateProductImage: FastifyPluginAsyncZod = async (app) => {
  app.patch('/products/:id/image', {
    schema: { /* ... */ },
    handler: async (req, reply) => {
      try {
        const useCase = makeUpdateProductImageUseCase()

        const product = await useCase.execute({
          id: req.params.id,
          url_image: req.body.url_image,
        })

        return reply.send(product)
      } catch (error) {
        // a) Tratamento de erro específico
        if (error instanceof ProductNotFoundError) {
          return reply.status(404).send({
            error: 'Produto não encontrado',
          })
        }

        // b) Re-lançar erro desconhecido
        throw error
      }
    },
  })
}

// ❌ ERRADO - sem tratamento
export const updateProductImage: FastifyPluginAsyncZod = async (app) => {
  app.patch('/products/:id/image', {
    schema: { /* ... */ },
    handler: async (req, reply) => {
      const useCase = makeUpdateProductImageUseCase()
      const product = await useCase.execute({
        id: req.params.id,
        url_image: req.body.url_image,
      })
      // Se ProductNotFoundError lançar, Fastify retorna 500
      return reply.send(product)
    },
  })
}
```

**Motivo:** Controllers convertem erros de domínio em respostas HTTP apropriadas.

### 4. Uma Rota = Um Controller

```ts
// ✅ CORRETO - um arquivo, um controller
// http/controllers/products/fetch-all-products.ts
export const fetchAllProducts: FastifyPluginAsyncZod = async (app) => {
  app.get('/products', { /* ... */ })
}

// http/controllers/products/update-product-image.ts
export const updateProductImage: FastifyPluginAsyncZod = async (app) => {
  app.patch('/products/:id/image', { /* ... */ })
}

// ❌ ERRADO - múltiplas rotas em um controller
export const productsController: FastifyPluginAsyncZod = async (app) => {
  app.get('/products', { /* ... */ })
  app.get('/products/:id', { /* ... */ })
  app.patch('/products/:id', { /* ... */ })
  app.delete('/products/:id', { /* ... */ })
}
```

**Motivo:** Cada arquivo tem responsabilidade clara. Fácil encontrar e manter.

### 5. Sem Lógica de Negócio

```ts
// ✅ CORRETO - apenas orquestra
export const fetchAllProducts: FastifyPluginAsyncZod = async (app) => {
  app.get('/products', {
    schema: { /* ... */ },
    handler: async (req, reply) => {
      const useCase = makeFetchAllProductsUseCase()
      const products = await useCase.execute(
        req.query.withoutImage === 'true',
      )
      return reply.send(products)
    },
  })
}

// ❌ ERRADO - lógica de negócio no controller
export const fetchAllProducts: FastifyPluginAsyncZod = async (app) => {
  app.get('/products', {
    handler: async (req, reply) => {
      const allProducts = await app.db.select().from(products)

      let filtered = allProducts
      if (req.query.withoutImage === 'true') {
        filtered = allProducts.filter((p) => !p.url_image)
      }

      return reply.send(filtered)
    },
  })
}
```

**Motivo:** Lógica vai para use cases. Controllers apenas orquestram.

### 6. Status HTTP Corretos

```ts
// ✅ CORRETO - status HTTP apropriados
app.post('/products', {
  handler: async (req, reply) => {
    const useCase = makeCreateProductUseCase()
    const product = await useCase.execute(req.body)
    return reply.status(201).send(product) // 201 Created
  },
})

app.get('/products/:id', {
  handler: async (req, reply) => {
    try {
      const useCase = makeFetchProductByIdUseCase()
      const product = await useCase.execute(req.params.id)
      return reply.status(200).send(product) // 200 OK (default)
    } catch (error) {
      if (error instanceof ProductNotFoundError) {
        return reply.status(404).send({ error: '...' }) // 404 Not Found
      }
    }
  },
})

// ❌ ERRADO - sempre 200
app.post('/products', {
  handler: async (req, reply) => {
    const useCase = makeCreateProductUseCase()
    const product = await useCase.execute(req.body)
    return reply.send(product) // Deveria ser 201
  },
})
```

**Motivo:** Status HTTP corretos facilitam integração e debugging.

---

## Padrão de Validação

Validação de formato é responsabilidade do controller (Zod):

```ts
// ✅ CORRETO - validação de formato em schema
export const createProduct: FastifyPluginAsyncZod = async (app) => {
  app.post('/products', {
    schema: {
      body: z.object({
        sku: z.string().min(1).describe('SKU obrigatório'),
        marca: z.string().min(1).describe('Marca obrigatória'),
        ean: z.string().min(1).describe('EAN obrigatório'),
      }),
    },
    handler: async (req, reply) => {
      // req.body já validado pelo Zod
      const useCase = makeCreateProductUseCase()
      const product = await useCase.execute(req.body)
      return reply.status(201).send(product)
    },
  })
}

// ❌ ERRADO - validação de formato em use case
export const createProduct: FastifyPluginAsyncZod = async (app) => {
  app.post('/products', {
    schema: {
      body: z.object({}), // Sem validação
    },
    handler: async (req, reply) => {
      const useCase = makeCreateProductUseCase()
      // Use case valida formato (deveria ser Zod)
      const product = await useCase.execute(req.body)
      return reply.status(201).send(product)
    },
  })
}
```

### Transformações e Defaults no Zod

Quando usar `.transform()` com `.default()`, a ordem importa:

```ts
// ✅ CORRETO - default ANTES do transform
querystring: z.object({
  pageIndex: z
    .string()
    .default("0")           // 1. Define default como string
    .transform(Number)       // 2. Transforma string em number
    .pipe(z.number().int().min(0))  // 3. Valida como número
    .describe("Índice da página (zero-based)"),
})

// ❌ ERRADO - default DEPOIS do transform
querystring: z.object({
  pageIndex: z
    .string()
    .transform(Number)       // 1. Transforma em number
    .pipe(z.number().int().min(0))
    .default("0")            // ❌ ERRO: espera number, recebe string
    .describe("Índice da página"),
})

// ✅ ALTERNATIVA - usar coalesce
querystring: z.object({
  pageIndex: z
    .string()
    .optional()
    .transform(val => Number(val ?? "0"))
    .pipe(z.number().int().min(0))
    .describe("Índice da página (zero-based)"),
})
```

**Regra:** O tipo do `.default()` deve corresponder ao tipo da chain **antes** da transformação. Se você transforma `string → number`, o default deve ser `string`.

---

## Exemplo Completo

```ts
// http/controllers/products/delete-product.ts
import { ProductNotFoundError } from '../../../errors/product-not-found-error.js'
import { makeDeleteProductUseCase } from '../../../factories/products/make-delete-product-use-case.js'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'

export const deleteProduct: FastifyPluginAsyncZod = async (app) => {
  app.delete(
    '/products/:id',
    {
      schema: {
        description: 'Deleta um produto',
        tags: ['products'],
        params: z.object({
          id: z.string().uuid().describe('ID do produto'),
        }),
        response: {
          204: z.null(),
          404: z.object({ error: z.string() }),
        },
      },
    },
    async (req, reply) => {
      try {
        const deleteProductUseCase = makeDeleteProductUseCase()

        await deleteProductUseCase.execute({
          id: req.params.id,
        })

        return reply.status(204).send()
      } catch (error) {
        if (error instanceof ProductNotFoundError) {
          return reply.status(404).send({
            error: 'Produto não encontrado',
          })
        }

        throw error
      }
    },
  )
}
```

---

## Registrando Controllers em routes.ts

Arquivo `routes.ts` agrupa todos os controllers:

```ts
// http/controllers/products/routes.ts
import type { FastifyInstance } from 'fastify'
import { fetchAllProducts } from './fetch-all-products.js'
import { updateProductImage } from './update-product-image.js'
import { deleteProduct } from './delete-product.js'

export async function productsRoutes(app: FastifyInstance) {
  app.register(fetchAllProducts)
  app.register(updateProductImage)
  app.register(deleteProduct)
}
```

Depois, registrar em `app.ts`:

```ts
// app.ts
import { productsRoutes } from './http/controllers/products/routes.js'

await app.register(productsRoutes)
```

---

## Middleware (Autenticação, etc)

Para middleware (ex: autenticação), use o objeto de opções:

```ts
// ✅ CORRETO - middleware no schema
import { verifyJwt } from '../../../middlewares/verify-jwt.js'

export const updateProduct: FastifyPluginAsyncZod = async (app) => {
  app.patch(
    '/products/:id',
    {
      onRequest: [verifyJwt], // Middleware aqui!
      schema: { /* ... */ },
    },
    async (req, reply) => {
      // request.user existe (injetado por verifyJwt)
      const useCase = makeUpdateProductUseCase()
      // ...
    },
  )
}
```

---

## Checklist

Antes de fazer commit de um novo controller:

- [ ] Arquivo em `http/controllers/{recurso}/{acao}.ts`
- [ ] Constante exportada como `{acao}: FastifyPluginAsyncZod`
- [ ] Schema Zod completo (description, tags, validação, response)
- [ ] Status HTTP corretos (201 para POST, 204 para DELETE, etc)
- [ ] Tratamento de erros customizados
- [ ] Sem lógica de negócio (tudo em use case)
- [ ] Validação de formato em Zod (não em use case)
- [ ] Use case instanciado com factory
- [ ] Uma rota por arquivo
- [ ] Registrado em `routes.ts` do recurso
