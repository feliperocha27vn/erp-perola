# AGENTS.md — src (Overview Arquitetura)

Documento principal de arquitetura e convenções para a pasta `src`. Leia este documento primeiro, depois consulte o AGENTS.md específico de cada pasta.

---

## Visão Geral da Arquitetura

O projeto segue os **princípios SOLID** com uma arquitetura em **camadas bem definidas**. Cada camada tem responsabilidades claras e isoladas.

```
┌─────────────────────────────────────────────────────────┐
│                    HTTP Request                         │
└────────────────┬────────────────────────────────────────┘
                 │
         ┌───────▼────────────┐
         │   Controllers      │ (Camada HTTP)
         │ http/controllers   │ ├─ Recebe requisição
         └───────┬────────────┘ ├─ Valida formato (Zod)
                 │              └─ Trata resposta HTTP
                 │
         ┌───────▼────────────┐
         │    Factories       │ (Injeção Dependência)
         │    factories/      │ ├─ Instancia repositories
         └───────┬────────────┘ ├─ Instancia use cases
                 │              └─ Injeta dependências
                 │
         ┌───────▼────────────┐
         │    Use Cases       │ (Lógica Negócio)
         │  use-cases/        │ ├─ Lógica de negócio pura
         └───────┬────────────┘ ├─ Validação de domínio
                 │              └─ Lança erros customizados
                 │
         ┌───────▼────────────┐
         │  Repositories      │ (Acesso Dados)
         │  repositories/     │ ├─ Interface (contrato)
         │  └─ drizzle/       │ ├─ Implementação (Drizzle)
         └───────┬────────────┘ └─ Retorna dados ou null
                 │
         ┌───────▼────────────┐
         │    Database        │
         └────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│                   HTTP Response                         │
└─────────────────────────────────────────────────────────┘
```

---

## Estrutura de Pastas

```
src/
├── http/
│   └── controllers/                      [Camada HTTP]
│       ├── {recurso}/
│       │   ├── routes.ts                 └─ Agrupa controllers
│       │   ├── acao1.ts                  └─ Um controller por arquivo
│       │   └── acao2.ts
│       └── AGENTS.md                     └─ Documentação
│
├── use-cases/                            [Camada Lógica]
│   ├── {recurso}/
│   │   ├── acao1.ts                      └─ Um use case por arquivo
│   │   └── acao2.ts
│   └── AGENTS.md                         └─ Documentação
│
├── factories/                            [Injeção Dependência]
│   ├── {recurso}/
│   │   ├── make-acao1-use-case.ts       └─ Factory por use case
│   │   └── make-acao2-use-case.ts
│   └── AGENTS.md                         └─ Documentação
│
├── repositories/                         [Camada Dados]
│   ├── {recurso}-repository.ts          └─ Interface/Contrato
│   ├── drizzle/
│   │   └── drizzle-{recurso}-repo.ts   └─ Implementação Drizzle
│   └── AGENTS.md                         └─ Documentação
│
├── errors/                               [Erros Customizados]
│   ├── {tipo}-error.ts                   └─ Um erro por arquivo
│   └── AGENTS.md                         └─ Documentação
│
├── db/
│   ├── connection.ts                     └─ Conexão Drizzle
│   └── schema.ts                         └─ Schemas das tabelas
│
├── app.ts                                └─ Config Fastify
├── server.ts                             └─ Entrada da app
├── env.ts                                └─ Validação env vars
├── types.ts                              └─ Declarações de módulo
└── AGENTS.md                             └─ Este arquivo
```

---

## Fluxo de Requisição Completo

Exemplo: `PATCH /products/:id/image`

```
1. HTTP Request
   └─ Method: PATCH
   └─ Path: /products/123/image
   └─ Body: { url_image: "https://..." }

2. Controller (http/controllers/products/update-product-image.ts)
   └─ Recebe requisição
   └─ Valida com Zod (schema)
   └─ Chama factory: makeUpdateProductImageUseCase()

3. Factory (factories/products/make-update-product-image-use-case.ts)
   └─ Instancia DrizzleProductRepository
   └─ Instancia UpdateProductImageUseCase
   └─ Retorna instância

4. Use Case (use-cases/products/update-product-image.ts)
   └─ Chama: productRepository.updateProductImage(id, url_image)
   └─ Se falhar (product não existe):
      └─ Lança: ProductNotFoundError

5. Repository (repositories/drizzle/drizzle-product-repository.ts)
   └─ Executa: db.update(products).where(eq(products.id, id))
   └─ Retorna: Product | null

6. Use Case (continua)
   └─ Recebe null do repository
   └─ Lança ProductNotFoundError

7. Controller (catch)
   └─ Captura: ProductNotFoundError
   └─ Retorna: reply.status(404).send({ error: "..." })

8. HTTP Response
   └─ Status: 404 Not Found
   └─ Body: { error: "Produto não encontrado" }
```

---

## Padrões Obrigatórios

### 1. Controllers São Plugins Fastify

```ts
export const fetchAllProducts: FastifyPluginAsyncZod = async (app) => {
  app.get('/products', {
    schema: { /* ... */ },
    handler: async (req, reply) => {
      // ...
    }
  })
}
```

### 2. Use Cases Recebem Repositories

```ts
export class FetchAllProductsUseCase {
  constructor(private productRepository: ProductRepository) {}

  async execute(): Promise<Product[]> {
    return this.productRepository.findAll()
  }
}
```

### 3. Factories Instanciam Use Cases

```ts
export function makeFetchAllProductsUseCase() {
  const repository = new DrizzleProductRepository()
  return new FetchAllProductsUseCase(repository)
}
```

### 4. Repositories Implementam Interfaces

```ts
export class DrizzleProductRepository implements ProductRepository {
  async findAll(): Promise<Product[]> {
    return await db.select().from(products)
  }
}
```

### 5. Controllers Tratam Erros Customizados

```ts
try {
  const product = await useCase.execute(request)
  return reply.send(product)
} catch (error) {
  if (error instanceof ProductNotFoundError) {
    return reply.status(404).send({ error: error.message })
  }
  throw error
}
```

---

## Convenções de Nomenclatura

### Pastas (kebab-case, singular)

```
✅ use-cases/products/
✅ repositories/customers/
✅ factories/budgets/
❌ use-cases/Products/
❌ repositories/customer_repository/
```

### Arquivos (kebab-case)

```
✅ fetch-all-products.ts
✅ drizzle-product-repository.ts
✅ product-not-found-error.ts
❌ FetchAllProducts.ts
❌ fetch_all_products.ts
```

### Classes (PascalCase + sufixo)

```
✅ FetchAllProductsUseCase
✅ DrizzleProductRepository
✅ ProductNotFoundError
❌ fetchAllProducts
❌ ProductRepositoryDrizzle
```

### Funções Factory (makePascalCase)

```
✅ makeFetchAllProductsUseCase()
✅ makeCreateProductUseCase()
❌ fetchAllProductsFactory()
❌ createProductFactory()
```

### Exports Controller (camelCase)

```
✅ export const fetchAllProducts: FastifyPluginAsyncZod
✅ export const updateProductImage: FastifyPluginAsyncZod
❌ export const FetchAllProducts
❌ export const fetchAllProductsController
```

---

## Responsabilidades por Camada

### Controllers (HTTP Layer)
- ✅ Receber requisição HTTP
- ✅ Validar formato (Zod)
- ✅ Chamar factory para instanciar use case
- ✅ Chamar use case.execute()
- ✅ Tratar erros customizados
- ✅ Retornar resposta HTTP com status correto
- ❌ Lógica de negócio
- ❌ Acesso direto a banco de dados

### Use Cases (Business Logic Layer)
- ✅ Lógica de negócio pura
- ✅ Validação de domínio
- ✅ Orquestrar repositories
- ✅ Lançar erros customizados
- ❌ Conhecer Fastify
- ❌ Retornar respostas HTTP
- ❌ Acessar banco direto

### Repositories (Data Access Layer)
- ✅ Abstrair acesso a banco de dados
- ✅ Implementar interface de contrato
- ✅ Executar queries Drizzle
- ✅ Retornar dados ou null
- ❌ Lógica de negócio
- ❌ Validação de domínio
- ❌ Lançar erros customizados

### Factories (Dependency Injection)
- ✅ Instanciar repositories
- ✅ Instanciar use cases
- ✅ Injetar dependências
- ❌ Lógica de negócio
- ❌ Efeitos colaterais

### Errors (Domain Errors)
- ✅ Representar situações de negócio específicas
- ✅ Estender Error
- ✅ Mensagem clara
- ❌ Lógica de negócio
- ❌ Efeitos colaterais

---

## Criando Novas Features

Para adicionar uma nova ação em um recurso existente:

### 1. Adicione o método no repositório

```ts
// repositories/product-repository.ts
export interface ProductRepository {
  // ... métodos existentes
  deleteProduct(id: string): Promise<void> // Novo
}

// repositories/drizzle/drizzle-product-repository.ts
async deleteProduct(id: string): Promise<void> {
  await db.delete(products).where(eq(products.id, id))
}
```

### 2. Crie o use case

```ts
// use-cases/products/delete-product.ts
export class DeleteProductUseCase {
  constructor(private productRepository: ProductRepository) {}

  async execute(request: DeleteProductUseCaseRequest): Promise<void> {
    const product = await this.productRepository.findById(request.id)
    if (!product) throw new ProductNotFoundError()
    await this.productRepository.deleteProduct(request.id)
  }
}
```

### 3. Crie a factory

```ts
// factories/products/make-delete-product-use-case.ts
export function makeDeleteProductUseCase() {
  const repository = new DrizzleProductRepository()
  return new DeleteProductUseCase(repository)
}
```

### 4. Crie o controller

```ts
// http/controllers/products/delete-product.ts
export const deleteProduct: FastifyPluginAsyncZod = async (app) => {
  app.delete('/products/:id', {
    schema: { /* ... */ },
    handler: async (req, reply) => {
      try {
        const useCase = makeDeleteProductUseCase()
        await useCase.execute({ id: req.params.id })
        return reply.status(204).send()
      } catch (error) {
        if (error instanceof ProductNotFoundError) {
          return reply.status(404).send({ error: error.message })
        }
        throw error
      }
    }
  })
}
```

### 5. Registre no routes.ts

```ts
// http/controllers/products/routes.ts
import { deleteProduct } from './delete-product.js'

export async function productsRoutes(app: FastifyInstance) {
  // ... controllers existentes
  app.register(deleteProduct) // Novo
}
```

---

## Testando

Use factories para instanciar use cases nos testes:

```ts
import { InMemoryProductRepository } from '@/repositories/in-memory-product-repository'
import { DeleteProductUseCase } from '@/use-cases/products/delete-product'

describe('DeleteProductUseCase', () => {
  it('should delete a product', async () => {
    const repository = new InMemoryProductRepository()
    const useCase = new DeleteProductUseCase(repository)

    await useCase.execute({ id: '123' })

    const product = await repository.findById('123')
    expect(product).toBeNull()
  })

  it('should throw ProductNotFoundError if product does not exist', async () => {
    const repository = new InMemoryProductRepository()
    repository.products = [] // Vazio

    const useCase = new DeleteProductUseCase(repository)

    await expect(
      useCase.execute({ id: 'non-existent-id' })
    ).rejects.toThrow(ProductNotFoundError)
  })
})
```

---

## Leitura Recomendada

Leia nesta ordem:

1. **Este arquivo** (overview geral)
2. **use-cases/AGENTS.md** (lógica de negócio)
3. **repositories/AGENTS.md** (acesso a dados)
4. **factories/AGENTS.md** (injeção de dependência)
5. **http/AGENTS.md** (controllers HTTP)
6. **errors/AGENTS.md** (erros customizados)

---

## Princípios SOLID

Esta arquitetura implementa:

- **S** (Single Responsibility): Cada classe tem uma responsabilidade
- **O** (Open/Closed): Aberto para extensão, fechado para modificação
- **L** (Liskov Substitution): Repositories são intercambiáveis
- **I** (Interface Segregation): Interfaces específicas por recurso
- **D** (Dependency Inversion): Controllers dependem de abstrações

---

## Checklist para Code Review

Ao revisar código, verifique:

- [ ] Controllers apenas orquestram, sem lógica
- [ ] Use cases recebem repositories via constructor
- [ ] Repositories não acessam direto ao Fastify
- [ ] Erros customizados são específicos (não genéricos)
- [ ] Factory cria e injeta dependências
- [ ] Schema Zod em todos os controllers
- [ ] Status HTTP corretos (201, 204, 404, etc)
- [ ] Um arquivo = uma classe = uma responsabilidade
- [ ] Sem dependências circulares
- [ ] Testável em isolamento

---

## Problemas Comuns

### ❌ Acesso Direto ao Banco em Controller

```ts
// ERRADO
export const fetchAllProducts: FastifyPluginAsyncZod = async (app) => {
  app.get('/products', {
    handler: async (req, reply) => {
      const products = await app.db.select().from(products)
      return reply.send(products)
    }
  })
}
```

**Solução:** Use use case + repository.

### ❌ Use Case Dependendo de Fastify

```ts
// ERRADO
export class FetchAllProductsUseCase {
  async execute(app: FastifyInstance): Promise<Product[]> {
    return await app.db.select().from(products)
  }
}
```

**Solução:** Use case recebe repository, não Fastify.

### ❌ Lógica em Factory

```ts
// ERRADO
export function makeFetchAllProductsUseCase() {
  const repository = new DrizzleProductRepository()
  const useCase = new FetchAllProductsUseCase(repository)
  
  // Lógica aqui? NÃO!
  const filtered = useCase.execute().then(p => p.filter(...))
  
  return useCase
}
```

**Solução:** Lógica vai para use case.

### ❌ Erro Genérico

```ts
// ERRADO
throw new Error('Produto não encontrado')
```

**Solução:** Crie error customizado.

```ts
// CORRETO
throw new ProductNotFoundError()
```

---

## Links Úteis

- **SOLID Principles:** https://en.wikipedia.org/wiki/SOLID
- **Clean Architecture:** https://blog.cleancoder.com/
- **Repository Pattern:** https://martinfowler.com/eaaCatalog/repository.html
- **Dependency Injection:** https://en.wikipedia.org/wiki/Dependency_injection