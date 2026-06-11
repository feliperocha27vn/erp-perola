# AGENTS.md — use-cases

Regras e convenções específicas para os arquivos da pasta `use-cases`.

---

## Propósito

A pasta `use-cases/` contém toda a **lógica de negócio pura** da aplicação. Use cases são classes que implementam um fluxo específico de negócio, independente da camada HTTP ou de banco de dados.

---

## Estrutura

```
use-cases/
└── {recurso}/
    ├── acao1.ts           ← Uma ação por arquivo
    ├── acao2.ts
    └── acao3.ts
```

**Regra:** Um arquivo = Uma classe = Um use case

---

## Convenção de Nomenclatura

- **Pastas:** kebab-case, singular quando possível
  ```
  ✅ use-cases/products/
  ✅ use-cases/customers/
  ❌ use-cases/Products/
  ❌ use-cases/product-services/
  ```

- **Arquivos:** kebab-case, descritivo
  ```
  ✅ fetch-all-products.ts
  ✅ update-product-image.ts
  ✅ delete-product.ts
  ❌ GetProducts.ts
  ❌ products.ts
  ❌ p.ts
  ```

- **Classes:** PascalCase com sufixo `UseCase`
  ```
  ✅ export class FetchAllProductsUseCase
  ✅ export class UpdateProductImageUseCase
  ❌ export class fetchAllProducts
  ❌ export class FetchAllProducts
  ```

---

## Estrutura de uma Use Case

Toda use case deve seguir este padrão:

```ts
// use-cases/products/fetch-all-products.ts

// 1. Importar tipos e interfaces necessárias
import type { Product, ProductRepository } from '../../repositories/product-repository.js'

// 2. Definir interface de Request (se necessário)
interface FetchAllProductsUseCaseRequest {
  withoutImage?: boolean
}

// 3. Definir interface de Response
interface FetchAllProductsUseCaseResponse {
  products: Product[]
}

// 4. Criar classe com injeção de dependência
export class FetchAllProductsUseCase {
  constructor(private productRepository: ProductRepository) {}

  // 5. Implementar método execute
  async execute(
    request?: FetchAllProductsUseCaseRequest,
  ): Promise<FetchAllProductsUseCaseResponse> {
    // Lógica de negócio aqui
    const products = await this.productRepository.findAll()

    if (request?.withoutImage) {
      return {
        products: products.filter((p) => !p.url_image),
      }
    }

    return { products }
  }
}
```

---

## Regras Obrigatórias

### 1. Injeção de Dependência via Constructor

```ts
// ✅ CORRETO
export class FetchAllProductsUseCase {
  constructor(private productRepository: ProductRepository) {}

  async execute(): Promise<Product[]> {
    return this.productRepository.findAll()
  }
}

// ❌ ERRADO - acesso direto ao banco
export class FetchAllProductsUseCase {
  async execute(): Promise<Product[]> {
    return await db.select().from(products) // NÃO FAZER ISSO
  }
}
```

**Motivo:** Facilita testes e reutilização. Use cases devem depender de abstrações (interfaces), não de implementações.

### 2. Interfaces de Request e Response

```ts
// ✅ CORRETO
interface CreateProductUseCaseRequest {
  sku: string
  marca: string
  ean: string
}

interface CreateProductUseCaseResponse {
  product: Product
}

export class CreateProductUseCase {
  async execute(request: CreateProductUseCaseRequest): Promise<CreateProductUseCaseResponse> {
    const product = await this.productRepository.create(request)
    return { product }
  }
}

// ❌ ERRADO - sem interfaces claras
export class CreateProductUseCase {
  async execute(sku: string, marca: string, ean: string): Promise<Product> {
    // difícil de ler e mantém
  }
}
```

**Motivo:** Interfaces tornam clara a entrada e saída, melhoram documentação e facilitam refatoração.

#### Convenção obrigatória `{Nome}UseCaseRequest`/`{Nome}UseCaseResponse`

- **Nomenclatura:** use sempre `<NomeDoCaso>UseCaseRequest` e `<NomeDoCaso>UseCaseResponse`.
- **Encapsuladas:** defina essas interfaces **no mesmo arquivo da use case** e **não exporte**. Elas existem apenas para tipar o método `execute` daquele caso.
- **Quando omitir:** se o caso não recebe nada, use `execute(): Promise<Resposta>` sem Request. Se não retorna payload, use `Promise<void>`.
- **Paginados:** coloque estruturas (`items`, `total`, `pageIndex`) dentro do `Response`, nunca retorne arrays “nus”.

Exemplo completo:

```ts
// use-cases/products/fetch-all-products.ts
import type { ProductRepository } from '../../repositories/product-repository.js'

interface FetchAllProductsUseCaseRequest {
  pageIndex: number
}

interface FetchAllProductsUseCaseResponse {
  items: Product[]
  total: number
  pageIndex: number
}

export class FetchAllProductsUseCase {
  constructor(private productRepository: ProductRepository) {}

  async execute(
    request: FetchAllProductsUseCaseRequest,
  ): Promise<FetchAllProductsUseCaseResponse> {
    const result = await this.productRepository.fetchProducts(request)
    return result
  }
}
```

> **Por que encapsular?** Evita exportar tipos que não pertencem ao domínio público. Controllers e factories só interagem via `execute`, mantendo o contrato fechado dentro do arquivo da use case.

### 3. Erros Customizados

```ts
// ✅ CORRETO
import { ProductNotFoundError } from '../../errors/product-not-found-error.js'

export class UpdateProductImageUseCase {
  async execute(request: UpdateProductImageUseCaseRequest): Promise<Product> {
    const product = await this.productRepository.updateProductImage(
      request.id,
      request.url_image,
    )

    if (!product) {
      throw new ProductNotFoundError() // Use custom error
    }

    return product
  }
}

// ❌ ERRADO - erro genérico
export class UpdateProductImageUseCase {
  async execute(request: UpdateProductImageUseCaseRequest): Promise<Product> {
    const product = await this.productRepository.updateProductImage(
      request.id,
      request.url_image,
    )

    if (!product) {
      throw new Error('Produto não encontrado') // Muito genérico
    }

    return product
  }
}
```

**Motivo:** Controllers podem tratar erros específicos de forma diferente (status HTTP diferente).

### 4. Use Case = Uma Responsabilidade

```ts
// ✅ CORRETO - uma responsabilidade clara
export class FetchAllProductsUseCase {
  async execute(): Promise<Product[]> {
    return this.productRepository.findAll()
  }
}

export class UpdateProductImageUseCase {
  async execute(request: UpdateProductImageUseCaseRequest): Promise<Product> {
    // lógica de atualização
  }
}

// ❌ ERRADO - múltiplas responsabilidades
export class ProductServiceUseCase {
  async fetchAll(): Promise<Product[]> { /* ... */ }
  async updateImage(): Promise<Product> { /* ... */ }
  async deleteProduct(): Promise<void> { /* ... */ }
  async createProduct(): Promise<Product> { /* ... */ }
}
```

**Motivo:** Single Responsibility Principle. Cada use case faz uma coisa bem.

### 5. Sem Acesso Direto ao Framework

```ts
// ✅ CORRETO - use case não conhece Fastify
export class FetchAllProductsUseCase {
  constructor(private productRepository: ProductRepository) {}

  async execute(): Promise<Product[]> {
    return this.productRepository.findAll()
  }
}

// ❌ ERRADO - use case acoplado ao Fastify
export class FetchAllProductsUseCase {
  async execute(app: FastifyInstance): Promise<Product[]> {
    return await app.db.select().from(products)
  }
}
```

**Motivo:** Use case deve ser framework-agnostic. Pode ser reutilizado em CLI, bots, etc.

---

## Validação de Dados

Use cases podem validar dados de negócio, mas validação de formato deve ser feita no controller:

```ts
// ✅ CORRETO - validação de negócio
export class CreateProductUseCase {
  async execute(request: CreateProductUseCaseRequest): Promise<CreateProductUseCaseResponse> {
    const existingProduct = await this.productRepository.findBySku(request.sku)

    if (existingProduct) {
      throw new ProductAlreadyExistsError() // Validação de domínio
    }

    const product = await this.productRepository.create(request)
    return { product }
  }
}

// ❌ ERRADO - validação de formato em use case
export class CreateProductUseCase {
  async execute(request: CreateProductUseCaseRequest): Promise<CreateProductUseCaseResponse> {
    if (!request.sku || request.sku.length === 0) {
      throw new Error('SKU is required') // Isso é responsabilidade do controller
    }
    // ...
  }
}
```

---

## Exemplo Completo

```ts
// use-cases/products/delete-product.ts
import { ProductNotFoundError } from '../../errors/product-not-found-error.js'
import type { ProductRepository } from '../../repositories/product-repository.js'

interface DeleteProductUseCaseRequest {
  id: string
}

interface DeleteProductUseCaseReply {
  success: boolean
}

export class DeleteProductUseCase {
  constructor(private productRepository: ProductRepository) {}

  async execute(request: DeleteProductUseCaseRequest): Promise<DeleteProductUseCaseReply> {
    const product = await this.productRepository.getProductById(request.id)

    if (!product) {
      throw new ProductNotFoundError()
    }

    await this.productRepository.delete(request.id)
    return { success: true }
  }
}
  }
}
```

---

## Testes

Use cases devem ser 100% testáveis:

```ts
import { InMemoryProductRepository } from '@/repositories/in-memory-product-repository'
import { FetchAllProductsUseCase } from '@/use-cases/products/fetch-all-products'

describe('FetchAllProductsUseCase', () => {
  it('should fetch all products', async () => {
    const repository = new InMemoryProductRepository()
    const useCase = new FetchAllProductsUseCase(repository)

    const { products } = await useCase.execute()

    expect(products).toHaveLength(3)
  })

  it('should fetch only products without image', async () => {
    const repository = new InMemoryProductRepository()
    const useCase = new FetchAllProductsUseCase(repository)

    const { products } = await useCase.execute({ withoutImage: true })

    expect(products).toEqual([{ url_image: null }])
  })
})
```

---

## Checklist

Antes de fazer commit de uma nova use case:

- [ ] Arquivo está em `use-cases/{recurso}/{acao}.ts`
- [ ] Classe chamada `{Acao}UseCase` com sufixo correto
- [ ] Constructor recebe apenas interfaces (repositories, services)
- [ ] Método `execute()` com interface clara de Request e Response
- [ ] Erros customizados importados de `src/errors/`
- [ ] Sem acesso direto ao banco de dados
- [ ] Sem dependência de Fastify ou outro framework
- [ ] Testável em isolamento (sem mocks complexos)
- [ ] Validação de negócio (não de formato)
- [ ] Uma responsabilidade clara
