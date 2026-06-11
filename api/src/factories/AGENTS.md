# AGENTS.md — factories

Regras e convenções específicas para os arquivos da pasta `factories`.

---

## Propósito

A pasta `factories/` implementa o **Factory Pattern**, responsável pela **injeção de dependência**. Factories criam instâncias de use cases com todas as dependências injetadas, centralizando a composição de objetos.

---

## Estrutura

```
factories/
└── {recurso}/
    ├── make-acao1-use-case.ts
    ├── make-acao2-use-case.ts
    └── make-acao3-use-case.ts
```

**Regra:** Uma factory por use case

---

## Convenção de Nomenclatura

- **Pastas:** kebab-case, singular
  ```
  ✅ factories/products/
  ✅ factories/customers/
  ❌ factories/Products/
  ❌ factories/product-use-cases/
  ```

- **Arquivos:** `make-{acao}-use-case.ts`
  ```
  ✅ make-fetch-all-products-use-case.ts
  ✅ make-update-product-image-use-case.ts
  ✅ make-delete-product-use-case.ts
  ❌ make-products.ts
  ❌ products-factory.ts
  ❌ create-use-case.ts
  ```

- **Funções:** `make{Acao}UseCase()`
  ```
  ✅ export function makeFetchAllProductsUseCase()
  ✅ export function makeUpdateProductImageUseCase()
  ❌ export function makeProduct()
  ❌ export function createUseCase()
  ```

---

## Padrão de Factory

Toda factory segue este padrão exato:

```ts
// factories/products/make-fetch-all-products-use-case.ts

// 1. Importar repositories necessários
import { DrizzleProductRepository } from '../../repositories/drizzle/drizzle-product-repository.js'

// 2. Importar use case
import { FetchAllProductsUseCase } from '../../use-cases/products/fetch-all-products.js'

// 3. Função que instancia e injeta dependências
export function makeFetchAllProductsUseCase() {
  // a) Criar instâncias dos repositories
  const productRepository = new DrizzleProductRepository()

  // b) Criar instância do use case injetando repositories
  const fetchAllProductsUseCase = new FetchAllProductsUseCase(
    productRepository,
  )

  // c) Retornar use case
  return fetchAllProductsUseCase
}
```

**Exemplo completo com múltiplas dependências:**

```ts
// factories/proposals/make-create-proposal-use-case.ts
import { DrizzleProposalRepository } from '../../repositories/drizzle/drizzle-proposal-repository.js'
import { DrizzleCustomerRepository } from '../../repositories/drizzle/drizzle-customer-repository.js'
import { DrizzleUserRepository } from '../../repositories/drizzle/drizzle-user-repository.js'
import { CreateProposalUseCase } from '../../use-cases/proposals/create-proposal.js'

export function makeCreateProposalUseCase() {
  const proposalRepository = new DrizzleProposalRepository()
  const customerRepository = new DrizzleCustomerRepository()
  const userRepository = new DrizzleUserRepository()

  const createProposalUseCase = new CreateProposalUseCase(
    proposalRepository,
    customerRepository,
    userRepository,
  )

  return createProposalUseCase
}
```

---

## Regras Obrigatórias

### 1. Uma Factory = Um Use Case

```ts
// ✅ CORRETO - uma factory por use case
export function makeFetchAllProductsUseCase() {
  const repository = new DrizzleProductRepository()
  return new FetchAllProductsUseCase(repository)
}

export function makeUpdateProductImageUseCase() {
  const repository = new DrizzleProductRepository()
  return new UpdateProductImageUseCase(repository)
}

// ❌ ERRADO - múltiplos use cases em uma factory
export function makeProductUseCases() {
  const repository = new DrizzleProductRepository()
  return {
    fetch: new FetchAllProductsUseCase(repository),
    update: new UpdateProductImageUseCase(repository),
    delete: new DeleteProductUseCase(repository),
  }
}
```

**Motivo:** Cada factory é responsável por uma coisa. Controllers não devem saber sobre outras factories.

### 2. Repositories Sempre Dentro da Factory

```ts
// ✅ CORRETO - repository instanciado na factory
export function makeFetchAllProductsUseCase() {
  const productRepository = new DrizzleProductRepository()
  return new FetchAllProductsUseCase(productRepository)
}

// ❌ ERRADO - repository vindo de fora
const productRepository = new DrizzleProductRepository()

export function makeFetchAllProductsUseCase() {
  return new FetchAllProductsUseCase(productRepository)
}

// ❌ ERRADO - repository global/singleton
let productRepository: ProductRepository

export function initializeFactories() {
  productRepository = new DrizzleProductRepository()
}

export function makeFetchAllProductsUseCase() {
  return new FetchAllProductsUseCase(productRepository)
}
```

**Motivo:** Cada chamada da factory deve ser independente. Evita bugs de estado compartilhado.

### 3. Sem Lógica de Negócio

```ts
// ✅ CORRETO - apenas cria e injeta
export function makeCreateProductUseCase() {
  const repository = new DrizzleProductRepository()
  return new CreateProductUseCase(repository)
}

// ❌ ERRADO - lógica na factory
export function makeCreateProductUseCase() {
  const repository = new DrizzleProductRepository()
  const validateSku = (sku: string) => sku.length > 0 // Não aqui!
  return new CreateProductUseCase(repository, validateSku)
}
```

**Motivo:** Factories só criam e injetam. Lógica vai para use cases.

### 4. Sem Efeitos Colaterais

```ts
// ✅ CORRETO - apenas cria objetos
export function makeFetchAllProductsUseCase() {
  const repository = new DrizzleProductRepository()
  return new FetchAllProductsUseCase(repository)
}

// ❌ ERRADO - efeitos colaterais
export function makeFetchAllProductsUseCase() {
  const repository = new DrizzleProductRepository()
  console.log('Creating FetchAllProductsUseCase') // Não aqui!
  sendMetrics('use-case-created') // Não aqui!
  return new FetchAllProductsUseCase(repository)
}
```

**Motivo:** Factories devem ser puras. Sem logs, métricas, ou side effects.

### 5. Nomes Descritivos

```ts
// ✅ CORRETO - claro qual use case está sendo criado
export function makeFetchAllProductsUseCase() { /* ... */ }
export function makeUpdateProductImageUseCase() { /* ... */ }
export function makeDeleteProductUseCase() { /* ... */ }

// ❌ ERRADO - nomes genéricos
export function makeProductUseCase() { /* ... */ }
export function makeUseCase() { /* ... */ }
export function create() { /* ... */ }
```

**Motivo:** Nomes descritivos deixam claro qual use case está sendo criado. Facilita busca no código.

---

## Padrão com Serviços Externos

Se um use case depender de serviços externos (APIs, etc), injete-os também:

```ts
// factories/proposals/make-generate-pdf-use-case.ts
import { DrizzleProposalRepository } from '../../repositories/drizzle/drizzle-proposal-repository.js'
import { PdfGeneratorService } from '../../services/pdf-generator-service.js'
import { GeneratePdfUseCase } from '../../use-cases/proposals/generate-pdf.js'

export function makeGeneratePdfUseCase() {
  const proposalRepository = new DrizzleProposalRepository()
  const pdfGeneratorService = new PdfGeneratorService()

  const generatePdfUseCase = new GeneratePdfUseCase(
    proposalRepository,
    pdfGeneratorService,
  )

  return generatePdfUseCase
}
```

---

## Exemplo Completo

```ts
// factories/customers/make-create-customer-use-case.ts
import { DrizzleCustomerRepository } from '../../repositories/drizzle/drizzle-customer-repository.js'
import { CreateCustomerUseCase } from '../../use-cases/customers/create-customer.js'

export function makeCreateCustomerUseCase() {
  const customerRepository = new DrizzleCustomerRepository()

  const createCustomerUseCase = new CreateCustomerUseCase(
    customerRepository,
  )

  return createCustomerUseCase
}
```

Uso no controller:

```ts
// http/controllers/customers/create.ts
import { makeCreateCustomerUseCase } from '../../../factories/customers/make-create-customer-use-case.js'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'

export const create: FastifyPluginAsyncZod = async (app) => {
  app.post('/customers', {
    schema: {
      body: z.object({
        name: z.string(),
        email: z.string().email(),
        phone: z.string(),
      }),
    },
    handler: async (req, reply) => {
      const useCase = makeCreateCustomerUseCase() // Factory aqui!

      const { customer } = await useCase.execute(req.body)

      return reply.status(201).send(customer)
    },
  })
}
```

---

## Testando com Factories

Use factories para mocks em testes:

```ts
// test/factories/in-memory-product-repository-factory.ts
import { InMemoryProductRepository } from '../repositories/in-memory-product-repository'
import { FetchAllProductsUseCase } from '@/use-cases/products/fetch-all-products'

export function makeFetchAllProductsUseCaseForTest() {
  const productRepository = new InMemoryProductRepository()
  return new FetchAllProductsUseCase(productRepository)
}

// test
import { makeFetchAllProductsUseCaseForTest } from '@/test/factories/...'

describe('FetchAllProductsUseCase', () => {
  it('should fetch all products', async () => {
    const useCase = makeFetchAllProductsUseCaseForTest()

    const { products } = await useCase.execute()

    expect(products).toHaveLength(3)
  })
})
```

---

## Checklist

Antes de fazer commit de uma nova factory:

- [ ] Arquivo em `factories/{recurso}/make-{acao}-use-case.ts`
- [ ] Função chamada `make{Acao}UseCase()`
- [ ] Repository instanciado dentro da factory
- [ ] Use case retornado corretamente
- [ ] Sem lógica de negócio
- [ ] Sem efeitos colaterais
- [ ] Sem estado compartilhado
- [ ] Nomes descritivos
- [ ] Uma factory por use case
- [ ] Todas as dependências injetadas
