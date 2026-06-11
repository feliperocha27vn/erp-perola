# AGENTS.md — errors

Regras e convenções específicas para os arquivos da pasta `errors`.

---

## Propósito

A pasta `errors/` contém **erros customizados do domínio**. São classes que representam situações específicas de negócio que podem acontecer durante a execução de use cases.

---

## Estrutura

```
errors/
├── resource-not-found-error.ts      ← Erro genérico (base)
├── product-not-found-error.ts       ← Erro específico
├── customer-not-found-error.ts
├── invalid-email-error.ts
└── exceeded-plan-limit-error.ts
```

**Regra:** Um arquivo = Uma classe de erro = Um tipo de erro de domínio

---

## Convenção de Nomenclatura

- **Arquivos:** kebab-case, descritivo
  ```
  ✅ product-not-found-error.ts
  ✅ invalid-email-error.ts
  ✅ exceeded-plan-limit-error.ts
  ❌ ProductNotFoundError.ts
  ❌ product-error.ts
  ❌ error.ts
  ```

- **Classes:** PascalCase com sufixo `Error`
  ```
  ✅ export class ProductNotFoundError extends Error
  ✅ export class InvalidEmailError extends Error
  ✅ export class ExceededPlanLimitError extends Error
  ❌ export class ProductNotFound
  ❌ export class ProductException
  ```

---

## Padrão de Erro Customizado

Todo erro customizado segue este padrão:

```ts
// errors/product-not-found-error.ts

export class ProductNotFoundError extends Error {
  constructor() {
    super('Produto não encontrado')
    this.name = 'ProductNotFoundError'
  }
}
```

**Padrão com mensagem customizável:**

```ts
// errors/invalid-email-error.ts

export class InvalidEmailError extends Error {
  constructor(email: string) {
    super(`Email inválido: ${email}`)
    this.name = 'InvalidEmailError'
  }
}
```

---

## Regras Obrigatórias

### 1. Estender Error

```ts
// ✅ CORRETO
export class ProductNotFoundError extends Error {
  constructor() {
    super('Produto não encontrado')
    this.name = 'ProductNotFoundError'
  }
}

// ❌ ERRADO
export class ProductNotFoundError {
  message = 'Produto não encontrado'
}
```

**Motivo:** Ao estender `Error`, permite usar `instanceof`, `catch`, e stack traces.

### 2. Definir Nome da Classe

```ts
// ✅ CORRETO - name define tipo
export class ProductNotFoundError extends Error {
  constructor() {
    super('Produto não encontrado')
    this.name = 'ProductNotFoundError'
  }
}

// ❌ ERRADO - sem name
export class ProductNotFoundError extends Error {
  constructor() {
    super('Produto não encontrado')
    // name fica como 'Error' em vez de 'ProductNotFoundError'
  }
}
```

**Motivo:** Controllers usam `instanceof` para detectar o tipo de erro.

### 3. Mensagem Clara

```ts
// ✅ CORRETO - mensagem clara
export class InvalidEmailError extends Error {
  constructor(email: string) {
    super(`Email inválido: ${email}`)
    this.name = 'InvalidEmailError'
  }
}

// ❌ ERRADO - mensagem vaga
export class InvalidEmailError extends Error {
  constructor() {
    super('Error')
    this.name = 'InvalidEmailError'
  }
}
```

**Motivo:** Mensagens claras facilitam debug e logs.

### 4. Sem Lógica no Constructor

```ts
// ✅ CORRETO - apenas define erro
export class ProductNotFoundError extends Error {
  constructor() {
    super('Produto não encontrado')
    this.name = 'ProductNotFoundError'
  }
}

// ❌ ERRADO - lógica no constructor
export class ProductNotFoundError extends Error {
  constructor() {
    super('Produto não encontrado')
    this.name = 'ProductNotFoundError'
    sendAlert() // Não fazer isso!
    logError() // Não fazer isso!
  }
}
```

**Motivo:** Erros são apenas dados. Lógica vai para use cases.

### 5. Use Casos Específicos

```ts
// ✅ CORRETO - erros específicos
export class ProductNotFoundError extends Error { /* ... */ }
export class InvalidSkuError extends Error { /* ... */ }
export class SkuAlreadyExistsError extends Error { /* ... */ }

// ❌ ERRADO - erro genérico para tudo
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}
```

**Motivo:** Controllers precisam diferenciar erros para status HTTP diferentes.

---

## Erros Genéricos vs Específicos

### ResourceNotFoundError (Genérico)

Use para erros de "not found" genéricos:

```ts
// errors/resource-not-found-error.ts
export class ResourceNotFoundError extends Error {
  constructor() {
    super('Recurso não encontrado')
    this.name = 'ResourceNotFoundError'
  }
}
```

### Erros Específicos

Use para casos de uso específicos:

```ts
// errors/product-not-found-error.ts
export class ProductNotFoundError extends Error {
  constructor() {
    super('Produto não encontrado')
    this.name = 'ProductNotFoundError'
  }
}

// errors/customer-not-found-error.ts
export class CustomerNotFoundError extends Error {
  constructor() {
    super('Cliente não encontrado')
    this.name = 'CustomerNotFoundError'
  }
}

// errors/exceeded-plan-limit-error.ts
export class ExceededPlanLimitError extends Error {
  constructor() {
    super('Limite do plano excedido')
    this.name = 'ExceededPlanLimitError'
  }
}
```

---

## Mapeamento de Erros para Status HTTP

No controller, mapeie erros para status HTTP:

```ts
import { ProductNotFoundError } from '../../../errors/product-not-found-error.js'
import { InvalidSkuError } from '../../../errors/invalid-sku-error.js'
import { ExceededPlanLimitError } from '../../../errors/exceeded-plan-limit-error.js'

export const createProduct: FastifyPluginAsyncZod = async (app) => {
  app.post('/products', {
    handler: async (req, reply) => {
      try {
        const useCase = makeCreateProductUseCase()
        const product = await useCase.execute(req.body)
        return reply.status(201).send(product)
      } catch (error) {
        // 404 Not Found
        if (error instanceof ProductNotFoundError) {
          return reply.status(404).send({ error: error.message })
        }

        // 400 Bad Request
        if (error instanceof InvalidSkuError) {
          return reply.status(400).send({ error: error.message })
        }

        // 403 Forbidden
        if (error instanceof ExceededPlanLimitError) {
          return reply.status(403).send({ error: error.message })
        }

        // 500 Internal Server Error (para erros desconhecidos)
        throw error
      }
    },
  })
}
```

---

## Exemplos Completos

### Erro Simples

```ts
// errors/product-not-found-error.ts
export class ProductNotFoundError extends Error {
  constructor() {
    super('Produto não encontrado')
    this.name = 'ProductNotFoundError'
  }
}
```

### Erro com Contexto

```ts
// errors/invalid-sku-error.ts
export class InvalidSkuError extends Error {
  constructor(sku: string) {
    super(`SKU inválido: ${sku}. SKU deve ter entre 3 e 20 caracteres.`)
    this.name = 'InvalidSkuError'
  }
}
```

### Erro com ID

```ts
// errors/product-with-id-not-found-error.ts
export class ProductWithIdNotFoundError extends Error {
  readonly productId: string

  constructor(productId: string) {
    super(`Produto com ID ${productId} não encontrado`)
    this.name = 'ProductWithIdNotFoundError'
    this.productId = productId
  }
}
```

Uso:

```ts
export class DeleteProductUseCase {
  async execute(request: DeleteProductUseCaseRequest): Promise<void> {
    const product = await this.productRepository.findById(request.id)

    if (!product) {
      throw new ProductWithIdNotFoundError(request.id)
    }

    await this.productRepository.delete(request.id)
  }
}
```

---

## Hierarquia de Erros

Para erros complexos, crie uma hierarquia:

```ts
// errors/base-domain-error.ts
export abstract class BaseDomainError extends Error {
  abstract statusCode: number

  constructor(message: string, name: string) {
    super(message)
    this.name = name
  }
}

// errors/product-not-found-error.ts
import { BaseDomainError } from './base-domain-error.js'

export class ProductNotFoundError extends BaseDomainError {
  statusCode = 404

  constructor() {
    super('Produto não encontrado', 'ProductNotFoundError')
  }
}

// errors/invalid-sku-error.ts
import { BaseDomainError } from './base-domain-error.js'

export class InvalidSkuError extends BaseDomainError {
  statusCode = 400

  constructor(sku: string) {
    super(
      `SKU inválido: ${sku}`,
      'InvalidSkuError',
    )
  }
}
```

No controller:

```ts
import { BaseDomainError } from '../../../errors/base-domain-error.js'

export const createProduct: FastifyPluginAsyncZod = async (app) => {
  app.post('/products', {
    handler: async (req, reply) => {
      try {
        const useCase = makeCreateProductUseCase()
        const product = await useCase.execute(req.body)
        return reply.status(201).send(product)
      } catch (error) {
        if (error instanceof BaseDomainError) {
          return reply.status(error.statusCode).send({ error: error.message })
        }

        throw error
      }
    },
  })
}
```

---

## Checklist

Antes de fazer commit de um novo erro:

- [ ] Arquivo em `errors/{descricao}-error.ts`
- [ ] Classe chamada `{Descricao}Error extends Error`
- [ ] `this.name` definido corretamente
- [ ] Mensagem clara e descritiva
- [ ] Sem lógica no constructor
- [ ] Sem efeitos colaterais
- [ ] Um erro = uma situação específica
- [ ] Mapeado para status HTTP no controller
- [ ] Testável em isolamento
- [ ] Documentado em comentários se necessário
