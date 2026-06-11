# Arquitetura SOLID do Projeto

Este projeto segue os princípios SOLID com uma arquitetura em camadas bem definida, inspirada no projeto [click-proposta](https://github.com/feliperocha27vn/click-proposta).

## Estrutura de Pastas

```
src/
├── http/
│   └── controllers/          # Camada HTTP - endpoints Fastify
│       └── {recurso}/
│           ├── routes.ts     # Agrupa todos os controllers de um recurso
│           ├── action1.ts    # Controller individual
│           └── action2.ts
│
├── use-cases/                # Lógica de negócio
│   └── {recurso}/
│       ├── action1.ts        # Use case individual
│       └── action2.ts
│
├── repositories/             # Acesso a dados
│   ├── {recurso}-repository.ts      # Interface/Contrato
│   └── drizzle/
│       └── drizzle-{recurso}-repository.ts  # Implementação
│
├── factories/                # Injeção de dependência
│   └── {recurso}/
│       ├── make-action1-use-case.ts
│       └── make-action2-use-case.ts
│
├── errors/                   # Erros customizados
│   ├── custom-error1.ts
│   └── custom-error2.ts
│
├── db/
│   ├── connection.ts         # Conexão com banco
│   └── schema.ts             # Schemas Drizzle
│
├── app.ts                    # Configuração Fastify
├── server.ts                 # Entrada da aplicação
└── env.ts                    # Validação de variáveis
```

## Padrões Utilizados

### 1. **Dependency Injection (DI)**

As factories criam instâncias com as dependências injetadas:

```ts
// factories/products/make-fetch-all-products-use-case.ts
export function makeFetchAllProductsUseCase() {
  const productRepository = new DrizzleProductRepository()
  const useCase = new FetchAllProductsUseCase(productRepository)
  return useCase
}
```

### 2. **Repository Pattern**

Abstração da camada de dados:

```ts
// repositories/product-repository.ts (interface)
export interface ProductRepository {
  findAll(): Promise<Product[]>
  updateProductImage(id: string, url_image: string): Promise<Product | null>
}

// repositories/drizzle/drizzle-product-repository.ts (implementação)
export class DrizzleProductRepository implements ProductRepository {
  async findAll(): Promise<Product[]> {
    // implementação
  }
}
```

### 3. **Use Cases**

Contém toda a lógica de negócio:

```ts
export class FetchAllProductsUseCase {
  constructor(private productRepository: ProductRepository) {}

  async execute(withoutImage?: boolean): Promise<Product[]> {
    if (withoutImage) {
      return this.productRepository.findAllWithoutImage()
    }
    return this.productRepository.findAll()
  }
}
```

### 4. **Controllers**

Endpoints HTTP que orquestram use cases:

```ts
export const fetchAllProducts: FastifyPluginAsyncZod = async (app) => {
  app.get('/products', {
    schema: { /* schema Zod */ },
    handler: async (req, reply) => {
      const useCase = makeFetchAllProductsUseCase()
      const products = await useCase.execute(req.query.withoutImage === 'true')
      return reply.send(products)
    }
  })
}
```

### 5. **Custom Errors**

Erros específicos do domínio:

```ts
export class ProductNotFoundError extends Error {
  constructor() {
    super('Produto não encontrado')
    this.name = 'ProductNotFoundError'
  }
}
```

## Fluxo de Requisição

```
GET /products
    ↓
[fetchAllProducts Controller]
    ↓
[makeFetchAllProductsUseCase Factory]
    ↓
[FetchAllProductsUseCase]
    ↓
[DrizzleProductRepository]
    ↓
[Database]
    ↓
Response 200 [Product[]]
```

## Adicionando Novas Funcionalidades

Para adicionar uma nova ação no recurso `products`:

1. **Crie o Use Case** em `src/use-cases/products/nova-acao.ts`
2. **Implemente o Repository** se necessário em `src/repositories/drizzle/...`
3. **Crie a Factory** em `src/factories/products/make-nova-acao-use-case.ts`
4. **Crie o Controller** em `src/http/controllers/products/nova-acao.ts`
5. **Registre na rota** em `src/http/controllers/products/routes.ts`

## Benefícios desta Arquitetura

✅ **Separação de Responsabilidades** - cada camada tem um propósito  
✅ **Testabilidade** - use cases podem ser testados isoladamente  
✅ **Reutilização** - repositories podem ser reutilizados em diferentes controllers  
✅ **Manutenibilidade** - código organizado e fácil de navegar  
✅ **Escalabilidade** - adicionar novas features sem quebrar o existente  
✅ **Injeção de Dependência** - factories facilitam testes com mocks  

## Exemplos de Teste

```ts
// test
import { InMemoryProductRepository } from '@/repositories/in-memory-product-repository'
import { FetchAllProductsUseCase } from '@/use-cases/products/fetch-all-products'

describe('FetchAllProductsUseCase', () => {
  it('should fetch all products', async () => {
    const repository = new InMemoryProductRepository()
    const useCase = new FetchAllProductsUseCase(repository)
    
    const products = await useCase.execute()
    
    expect(products).toHaveLength(3)
  })
})
```
